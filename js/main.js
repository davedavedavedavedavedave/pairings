(function ($, helper) {
  const url = new URL(location.href);
  const tournament_id = +url.searchParams.get('tournament_id');
  const theme = url.searchParams.get('theme');
  const show_opponent = !!url.searchParams.get('show_opponent');
  const auto_scroll = !!url.searchParams.get('auto_scroll');
  const scroll_speed = +url.searchParams.get('scroll_speed');
  const base_font_size = +url.searchParams.get('base_font_size');
  const pairingEl = document.getElementById('pairings');
  const file = localStorage.getItem('file');

  document.documentElement.style.fontSize = base_font_size + 'px';

  // function that handles auto scrolling
  const autoScroll = function (el, speed, lastTime, direction) {
    let now = Date.now();
    let scrollBy = (direction > 0 ? speed : (el.scrollWidth - el.clientWidth)) / 1000 * (now - lastTime);
    el.scrollTo(el.scrollLeft + scrollBy * direction, 0);
    if (el.scrollLeft >= (el.scrollWidth - el.clientWidth) || el.scrollLeft <= 0) {
      // if at start or end of list, wait a second before changing direction and continue to scroll
      direction *= -1;
      window.setTimeout(() => {
        autoScroll(el, speed, now + 950, direction);
      }, 1000)
    } else {
      window.requestAnimationFrame(() => {
        autoScroll(el, speed, now, direction);
      });
    }
  }
  
  // prefill inputs
  for (let p of url.searchParams) {
    $(':not([type="checkbox"])[name="' + p[0] + '"]').forEach(el => el.value = p[1]);
    $('[type="checkbox"][name="' + p[0] + '"]').forEach(el => el.checked = p[1]);
  }
  
  // handle file input
  document.getElementById('file').addEventListener('change', e => {
    let file = e.target.files[0];
    if (file) {
      let reader = new FileReader();
      reader.addEventListener('load', () => {
        //document.getElementsByName('file')[0].value = reader.result;
        localStorage.setItem('file', reader.result)
      });
      reader.readAsText(file);
    }
  });
  
  // theme and either tournament_id or file are mandatory
  // if those are present, load current pairings
  if ((!isNaN(tournament_id) || file) && theme) {
    pairingEl.className = 'loading';
    let promises = [
      // load theme css
      helper.loadCSS('themes/' + theme + '/theme.css'),
      // load theme js
      helper.loadJS('themes/' + theme + '/theme.js')
    ];
    if (!tournament_id) {
      // parse passed file
      let fileContent = file.trim().split(/\r?\n\r?\n/);
      // first, create array with all players
      const player = fileContent[0].split('\n').filter((val, idx) => {
          if (idx === 0) { return false; }
          return val.indexOf('	') > -1;
        })
        .sort((a, b) => {
          if (a.toUpperCase() > b.toUpperCase()) {
            return 1;
          } else if (a.toUpperCase() < b.toUpperCase()) {
            return -1;
          } else {
            return 0;
          }
        })
        .map(val => {
          return {
            round_number: fileContent.length - 1,
            p1_name: /^[^	]+(	[^	]+)?/.exec(val)[0].replace(/	/, ' '),
            p1_house: /^(?:[^	]*	){3}([^	]+)/.exec(val)[1],
            p2_id: 1
          }
        });
      
      // then, loop over all tables and adjust player array
      let tables = fileContent[fileContent.length - 1]
                    .replace(/--- ACTIVE ROUND\r?\n/, '')
                    .split(/\r?\n-/)
                    .filter(val => val.trim().length > 0)
                    .map(val => val.replace(/	/, ' ').trim().split(/\r?\n/));
      for (let table_number = 0; table_number < tables.length; table_number++) {
        for (let i = 0; i < tables[table_number].length; i++) {
          player.find(val => val.p1_name === tables[table_number][i].trim().replace(/	/, ' ')).table_number = table_number + 1;
        }
      }
      
      console.log(player);
      promises.push(Promise.resolve(player));
    } else {
      // request pairings from joustingpavilion
      promises.push(helper.request({
          method: 'GET',
          url: 'http://thejoustingpavilion.com/api/v2/json/games?tournament_id=' + tournament_id + '&current_only=1'
        }).then(values => {
          // parse array of pairings twice. First time p1 and p2 get switched, so we have one array element for each player individually
          return Promise.resolve(JSON.parse(values)
            .map(item => {
              let tmp;
              
              tmp = item.p1_id;     item.p1_id     = item.p2_id;     item.p2_id     = tmp;
              tmp = item.p1_name;   item.p1_name   = item.p2_name;   item.p2_name   = tmp;
              tmp = item.p1_house;  item.p1_house  = item.p2_house;  item.p2_house  = tmp;
              tmp = item.p1_agenda; item.p1_agenda = item.p2_agenda; item.p2_agenda = tmp;
              tmp = item.p1_points; item.p1_points = item.p2_points; item.p2_points = tmp;
              
              return item;
            })
            .filter(item => item.p1_id > -1)
            .concat(JSON.parse(values))
            .sort((a, b) => {
              if (a.p1_name.toUpperCase() > b.p1_name.toUpperCase()) {
                return 1;
              } else if (a.p1_name.toUpperCase() < b.p1_name.toUpperCase()) {
                return -1;
              } else {
                return 0;
              }
            })
          );
        })
      );
    }
    Promise.all(promises)
      // after everything loaded, hook up js theme and parse pairings
      .then(values => {
        let pairings = values[2];
        // create HTML from pairings
        let html = '<h1>Pairings Round <span class="round_number">' + pairings[0].round_number + '</span></h1>';
        html += '<ol class="pairings' + (show_opponent ? ' show_opponent' : ' hide_opponent') + '">';
        html += pairings.map(item => {
            let html = '<li>';
            html += '<span class="table">' + (item.p2_id < 0 ? 'BYE' : item.table_number) + '</span>';
            html += '<span class="p1_house icon-' + item.p1_house.toLowerCase().replace(/[ ']/g, '').replace(/(the)?nightswatch$/, 'thenightswatch') + '"></span>';
            html += '<span class="p1_name">' + item.p1_name + '</span>';
            html += '<span class="p2_house icon-' + (item.p2_house || '').toLowerCase().replace(/[ ']/g, '').replace(/(the)?nightswatch$/, 'thenightswatch') + '"></span>';
            html += '<span class="p2_name">' + item.p2_name + '</span>';
            html += '</li>';
            return html;
          }).join('');
        html += '</ol>';
        pairingEl.innerHTML += html;
        pairingEl.className = '';

        // if requested, start auto scrolling
        if (auto_scroll) {
          autoScroll(pairingEl, scroll_speed, Date.now(), 1)
        }
      })
      .catch(error => console.error(error));
  }
}(selector => { return document.querySelectorAll(selector) }, helper));

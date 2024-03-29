(function ($, helper) {
  const url = new URL(location.href);

  // set up timer
  const timer_duration = url.searchParams.get('timer_duration');
  const timer_end_text = url.searchParams.get('timer_end_text');
  const timerContainer = document.getElementById('timer');
  const timerEl = document.createElement('div');
  timerEl.className = 'timerEl';
  timerEl.innerHTML = '<span class="minutes">' + Math.floor(timer_duration) + '</span>:<span class="seconds">' + ('00' + Math.floor(60 * (timer_duration % 1))).substr(-2) + '</span>'
  timerContainer.appendChild(timerEl);

  const timerClickFn = (e) => {
    timerEl.removeEventListener('click', timerClickFn);
    let start = Date.now();
    let timerFn = () => {
      let timeLeft = timer_duration * 60 - (Date.now() - start) / 1000;

      if (timeLeft > 0) {
        timerEl.innerHTML = '<span class="minutes">' + Math.floor(timeLeft / 60) + '</span>:<span class="seconds">' + ('00' + Math.floor(timeLeft % 60)).substr(-2) + '</span>';
        window.requestAnimationFrame(() => {
          timerFn();
        });
      } else {
        timerEl.innerHTML = timer_end_text;
        timerEl.className += ' hasEnded';
      }
    }
    timerFn();
  };
  timerEl.addEventListener('click', timerClickFn);

  // set up pairings stuff
  const tournament_id = +url.searchParams.get('tournament_id');
  const theme = url.searchParams.get('theme');
  const file = localStorage.getItem('file'); //url.searchParams.get('file');
  const show_opponent = !!url.searchParams.get('show_opponent');
  const auto_scroll = !!url.searchParams.get('auto_scroll');
  const scroll_speed = +url.searchParams.get('scroll_speed');
  const base_font_size = +url.searchParams.get('base_font_size');
  const pairingEl = document.getElementById('pairings');

  document.documentElement.style.fontSize = base_font_size + 'px';
  localStorage.setItem('file', '');

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
        // parse file and set hidden input's value
        //document.getElementsByName('file')[0].value = JSON.stringify(helper.parseTourneyMagistrateFile(reader.result));
        localStorage.setItem('file', JSON.stringify(helper.parseTourneyMagistrateFile(reader.result)));
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
    if (!tournament_id && file) {
      // pairings were passed as file
      promises.push(Promise.resolve(JSON.parse(file)));
    } else {
      // request pairings from joustingpavilion
      let getPairings = (currentPage) => {
        return fetch(
          'https://thrones.tourneygrounds.com/api/v3/games?current_only=1&page=' + currentPage + '&tournament_id=' + tournament_id
        ).then(res => res.json())
        .then(values => {
          if (values.length >= 50) {
            return getPairings(currentPage + 1).then(nextValues => Promise.resolve(nextValues.concat(values)));
          } else {
            return Promise.resolve(values);
          }
        });
      }
      promises.push(getPairings(1)
        .then(values => {
          console.log(values);
          // parse array of pairings twice. First time p1 and p2 get switched, so we have one array element for each player individually
          return Promise.resolve(JSON.parse(JSON.stringify(values))
            .map(item => {
              let tmp;
              
              tmp = item.p1_id;     item.p1_id     = item.p2_id;     item.p2_id     = tmp;
              tmp = item.p1_name;   item.p1_name   = item.p2_name;   item.p2_name   = tmp;
              tmp = item.p1_faction;  item.p1_faction  = item.p2_faction;  item.p2_faction  = tmp;
              tmp = item.p1_agenda; item.p1_agenda = item.p2_agenda; item.p2_agenda = tmp;
              tmp = item.p1_points; item.p1_points = item.p2_points; item.p2_points = tmp;
              
              return item;
            })
            .filter(item => item.p1_id > -1)
            .concat(values)
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
            html += '<span class="p1_faction icon-' + (item.p1_faction || 'thefreefolk').toLowerCase().replace(/[ ']/g, '').replace(/(the)?nightswatch$/, 'thenightswatch') + '"></span>';
            html += '<span class="p1_name">' + item.p1_name + '</span>';
            html += '<span class="p2_faction icon-' + (item.p2_faction || '').toLowerCase().replace(/[ ']/g, '').replace(/(the)?nightswatch$/, 'thenightswatch') + '"></span>';
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

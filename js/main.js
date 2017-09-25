(function ($, helper) {
  const url = new URL(location.href);
  const tournament_id = +url.searchParams.get('tournament_id');
  const theme = url.searchParams.get('theme');
  const show_opponent = !!url.searchParams.get('show_opponent');
  const auto_scroll = !!url.searchParams.get('auto_scroll');
  const scroll_speed = +url.searchParams.get('scroll_speed');
  const base_font_size = +url.searchParams.get('base_font_size');
  const pairingEl = document.getElementById('pairings');

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
  
  // tournament_id and theme are mandatory
  // if those are present, load current pairings
  if (!isNaN(tournament_id) && theme) {
    pairingEl.className = 'loading';
    Promise.all([
        // load theme css
        helper.loadCSS('themes/' + theme + '/theme.css'),
        // load theme js
        helper.loadJS('themes/' + theme + '/theme.js'),
        // request pairings
        helper.request({
          method: 'GET',
          url: 'http://thejoustingpavilion.com/api/v2/json/games?tournament_id=' + tournament_id + '&current_only=1'
        })
      ])
      // after everything loaded, hook up js theme and parse pairings
      .then(values => {
        // parse array of pairings twice. First time p1 and p2 get switched, so we have one array element for each player individually
        let pairings = JSON.parse(values[2])
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
          .concat(JSON.parse(values[2]))
          .sort((a, b) => {
            if (a.p1_name > b.p1_name) {
              return 1;
            } else if (a.p1_name < b.p1_name) {
              return -1;
            } else {
              return 0;
            }
          });
        
        // create HTML from pairings
        let html = '<h1>Pairings Round <span class="round_number">' + pairings[0].round_number + '</span></h1>';
        html += '<ol class="pairings' + (show_opponent ? ' show_opponent' : ' hide_opponent') + '">';
        html += pairings.map(item => {
            let html = '<li>';
            html += '<span class="table">' + (item.p2_id < 0 ? 'BYE' : item.table_number) + '</span>';
            html += '<span class="p1_house icon-' + item.p1_house.toLowerCase().replace(/[ ']/g, '').replace(/nightswatch$/, 'thenightswatch') + '"></span>';
            html += '<span class="p1_name">' + item.p1_name + '</span>';
            html += '<span class="p2_house icon-' + (item.p2_house || '').toLowerCase().replace(/[ ']/g, '').replace(/nightswatch$/, 'thenightswatch') + '"></span>';
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

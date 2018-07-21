const helper = (function () {
  const o = {};

  // load CSS
  o.loadCSS = (path) => {
    return new Promise((resolve, reject) => {
      let link = document.createElement('link');
      link.href = path;
      link.rel = "stylesheet";
      document.head.appendChild(link);
      resolve();
    });
  };

  // load JS
  o.loadJS = (path) => {
    return new Promise((resolve, reject) => {
      let script = document.createElement('script');
      script.src = path;
      script.addEventListener('load', (e) => {
        resolve(e);
      });
      document.body.appendChild(script);
    });
  };
  
  o.parseTourneyMagistrateFile = (fileContent) => {
    // parse passed file
    fileContent = fileContent.trim().split(/\r?\n\r?\n/);
    
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
          p1_faction: /^(?:[^	]*	){3}([^	]+)/.exec(val)[1],
          p2_id: 1
        }
      });
    
    // then, loop over all tables and add table_number to player in player array
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
    
    return player;
  };
  
  return o;
}());
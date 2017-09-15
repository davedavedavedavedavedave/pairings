const helper = (function () {
  const o = {};
  
  // Promisify XHR requests
  o.request = (cfg)  => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open(cfg.method, cfg.url);
      xhr.onload = function () {
        if (this.status >= 200 && this.status < 300) {
          resolve(xhr.response);
        } else {
          reject({
            status: this.status,
            statusText: xhr.statusText
          });
        }
      };
      xhr.onerror = function () {
        reject({
          status: this.status,
          statusText: xhr.statusText
        });
      };
      xhr.send();
    });
  };

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
  
  return o;
}());
let data = {}; // Settings with site data

function inject(tabId, scriptUrl, siteCode) {
  const origin = (new URL(scriptUrl)).origin;
  const code = `
  "use strict";
  // extension injected code
  (async (root, siteCode) => {
      // Do nothing is no-slick is in the search query
      if (location.search.indexOf('no-slick') >= 0) {
          return;
      }
      let _cache;
      const n = () => (performance || Date).now();
      const ctx = window.$slickBoot = {
          rt: root,
          _es: n(),
          ev: '2.0.0',
          l: async (request, asBlob) => {
              // This function loads a fetch request from cache storage
              try {
                  let fetchTime = 0;
                  if (!_cache && ('caches' in self)) {
                      _cache = await caches.open('slickstream-code');
                  }
                  if (_cache) {
                      let response = await _cache.match(request);
                      if (!response) {
                          fetchTime = n();
                          await _cache.add(request);
                          response = await _cache.match(request);
                          if (response && (!response.ok)) {
                              response = undefined;
                              _cache.delete(request);
                          }
                      }
                      if (response) {
                          return { t: fetchTime, d: (asBlob ? (await response.blob()) : (await response.json())) };
                      }
                  }
              }
              catch (err) {
                  console.log(err);
              }
              return {};
          }
      };
      // Load the initial JSON data
      const req = (url) => new Request(url, { cache: 'no-store' });
      const request = req(
        root 
        + '/d/page-boot-data?' 
        + (innerWidth <= 600 ? 'mobile&' : '') 
        + 'site='
        + siteCode
        + '&url='
        + encodeURIComponent(location.href.split('#')[0])
        + '&extension=true' );
      let { t: timestamp, d: bootData } = await ctx.l(request);
      if (bootData) {
          if (bootData.bestBy < Date.now()) {
              bootData = undefined;
          }
          else if (timestamp) {
              ctx._bd = timestamp;
          }
      }
      if (!bootData) {
          ctx._bd = n();
          bootData = await (await fetch(request)).json();
      }
      // Load the boot-loader
      if (bootData) {
          ctx.d = bootData;
          let scriptUrl = bootData.bootUrl;
          const { t: timestamp, d: bootBlob } = await ctx.l(req(scriptUrl), true);
          if (bootBlob) {
              ctx.bo = scriptUrl = URL.createObjectURL(bootBlob);
              if (timestamp) {
                  ctx._bf = timestamp;
              }
          }
          else {
              ctx._bf = n();
          }
          const script = document.createElement('script');
          script.src = scriptUrl;
          document.head.appendChild(script);

          const extensionMeta = document.querySelector('meta[name="slick-extension-active"]');
          if (!extensionMeta) {
            const meta = document.createElement('meta');
            meta.setAttribute('name', 'slick-extension-active');
            document.head.appendChild(meta);
          }
      }
      else {
          console.log('[Slick] Boot failed');
      }
  })(
    '${origin}',
    '${siteCode}'
  );
  `;

  const codeToRun = `
  const s2 = document.createElement('script');
  s2.id = 'slickExtensionContentScript';
  s2.textContent = \`${code}\`;
  document.head.appendChild(s2);
  `;

  chrome.tabs.executeScript(tabId, { code: codeToRun });
}


function attach() {
  chrome.webRequest.onBeforeRequest.addListener((details) => {
    const initiator = (new URL(details.initiator)).host;
    let cancel = details.url.indexOf("extension=true") === -1;
    console.log('request', details.url, cancel, data[initiator]);
    cancel = !!(cancel && data[initiator]);
    return { cancel };
  },
    {
      urls: [
        "*://slickstream.com/e2/*",
        "*://*.slickstream.com/e2/*",
        "*://slickstream.us/e2/*",
        "*://*.slickstream.us/e2/*",
        "*://slickstream.com/e3/*",
        "*://*.slickstream.com/e3/*",
        "*://slickstream.us/e3/*",
        "*://*.slickstream.us/e3/*",
        "*://*.slickstream.com/d/page-boot-data*",
        "*://*.slickstream.com/d/page-boot-data/*"
      ]
    },
    ["blocking"]
  );

  chrome.storage.onChanged.addListener((changes) => {
    if (changes.hostData && changes.hostData.newValue) {
      data = changes.hostData.newValue;
    }
  });

  chrome.webNavigation.onDOMContentLoaded.addListener(async (tabData) => {
    if (!tabData.frameId) {
      const host = new URL(tabData.url).host;
      const d = data[host];
      if (d) {
        Promise.resolve().then(() => {
          inject(tabData.tabId, d.server, d.siteCode);
        });
      }
    }
  });

  chrome.webNavigation.onBeforeNavigate.addListener((tabData) => {
    if (!tabData.frameId) {
      const url = new URL(tabData.url);
      const host = url.host;
      const d = data[host];
      if (d) {
        chrome.browsingData.remove(
          {
            origins: [url.origin]
          },
          {
            "cacheStorage": true,
            "indexedDB": true
          },
          (cbdata) => {
            console.log('cache cleared', cbdata);
          }
        )
      }
    }
  });
}

function refreshData() {
  chrome.storage.sync.get(['hostData', 'server'], (result) => {
    const hostData = result.hostData;
    data = hostData || {};
    attach();
  });
}
refreshData();
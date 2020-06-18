let data = {}; // Settings with site data

function inject(tabId, scriptUrl, siteCode) {
  const origin = (new URL(scriptUrl)).origin;
  const code = `
  "use strict";
  ((embedRoot, scriptUrl, siteCode) => {
    const W = window;
    W.slickSnippetVersion = '1.18.0';
    W.slickSnippetTime = (performance || Date).now();
    W.slickEmbedRoot = embedRoot;
    W.slickSiteCode = siteCode;
    let cache;
    const scriptLoader = async (url) => {
        if ((!cache) && ('caches' in self)) {
            try {
                cache = await caches.open('slickstream1');
            }
            catch (err) {
                console.log(err);
            }
        }
        let response;
        if (cache) {
            try {
                const request = new Request(url, { cache: 'no-store' });
                response = await cache.match(request);
                if (!response) {
                    await cache.add(request);
                    response = await cache.match(request);
                    if (response && (!response.ok)) {
                        response = undefined;
                        void cache.delete(request);
                    }
                }
            }
            catch (err) {
                console.warn('Slick: ', err);
            }
        }
        const script = document.createElement('script');
        if (response) {
            script.type = 'application/javascript';
            script.appendChild(document.createTextNode(await response.text()));
        }
        else {
            script.src = url;
        }
        (document.head || document.body).appendChild(script);
        return script;
    };
    
    scriptLoader((new URL(scriptUrl + '?extension=true&site=' + siteCode, embedRoot)).href);

    const extensionMeta = document.querySelector('meta[name="slick-extension-active"]');
    if (!extensionMeta) {
      const meta = document.createElement('meta');
      meta.setAttribute('name', 'slick-extension-active');
      document.head.appendChild(meta);
    }
  })(
    '${origin}',
    '${origin}/e3/embed.js',
    '${siteCode}'
  );
  `;

  const codeToRun = `
  const s = document.createElement('script');
  s.id = 'slickExtensionRootScript';
  s.src = (new URL('${origin}/e3/embed.js?site=${siteCode}', '${origin}')).href;
  document.head.appendChild(s);

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
        "*://*.slickstream.us/e3/*"
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
    serverUrl = result.server || 'https://slickstream.com/e2/embed-nav.js';
    data = hostData || {};
    attach();
  });
}
refreshData();
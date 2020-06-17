let data = {}; // Settings with site data

function injectScript(tabId, url, uid) {
  const code = `
  ((scriptUrl, uid) => {
    const es = uid && document.getElementById(uid);
    if (!es) {
      const s = document.createElement('script');
      if (uid) {
        s.id = uid;
      }
      s.src = scriptUrl;
      if (uid) {
        const s2 = document.createElement('script');
        s2.textContent = 'window._slickEmbedScriptLoaded = false;';
        document.head.appendChild(s2);
      }
      document.head.appendChild(s);
    }
    const extensionMeta = document.querySelector('meta[name="slick-extension-active"]');
    if (!extensionMeta) {
      const meta = document.createElement('meta');
      meta.setAttribute('name', 'slick-extension-active');
      document.head.appendChild(meta);
    }
  })('${url}', '${uid}');
  `;
  chrome.tabs.executeScript(tabId, { code });
}

function attach() {
  chrome.webRequest.onBeforeRequest.addListener((details) => {
    const initiator = (new URL(details.initiator)).host;
    let cancel = details.url.indexOf("extension=true") === -1;
    cancel = !!(cancel && data[initiator]);
    if (cancel) {
      const d = data[initiator];
      const tabId = details.tabId;
      let scriptUrl = `${d.server}?site=${d.siteCode}&extension=true`;
      let scriptId = 'slickExtensionRootScript';
      if (details.url.indexOf('guild-nav-embed.js') >= 0 || details.url.indexOf('slick-embed.js') >= 0 || details.url.indexOf('embed.js') >= 0) {
        const a = new URL(details.url);
        const b = new URL(d.server);
        a.host = b.host;
        const q = a.search || '';
        if (q) {
          if (q.indexOf('site=') >= 0) {
            a.search = q.substring(0, q.indexOf('site=')) + `site=${d.siteCode}&extension=true`;
          } else {
            a.search = q + '&extension=true';
          }
        } else {
          a.search = '?extension=true';
        }
        scriptUrl = a.toString();
        scriptId = '';
      }
      if (details.url.indexOf('guild-nav-embed.js') < 0) {
        Promise.resolve().then(() => {
          injectScript(tabId, scriptUrl, scriptId);
        });
      }
    }
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
        console.log('domC loaded');
        const scriptUrl = `${d.server}?site=${d.siteCode}&extension=true`;
        Promise.resolve().then(() => {
          injectScript(tabData.tabId, scriptUrl, 'slickExtensionRootScript');
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
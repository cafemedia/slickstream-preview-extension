let data = {};

function refreshData() {
  chrome.storage.sync.get(['hostData', 'server'], (result) => {
    const hostData = result.hostData;
    serverUrl = result.server || 'https://slickstream.com/e2/embed-nav.js';
    data = hostData || {};
  });
}
refreshData();

function injectScript(tabId, url) {
  const code = `
  ((scriptUrl) => {
    const es = document.getElementById('slickExtensionInjectedScript');
    if (!es) {
      const s = document.createElement('script');
      s.id = 'slickExtensionInjectedScript'
      s.src = scriptUrl;
      document.head.appendChild(s);
    }
  })('${url}');
  `;
  chrome.tabs.executeScript(tabId, { code });
}

chrome.webRequest.onBeforeRequest.addListener((details) => {
  const initiator = (new URL(details.initiator)).host;
  let cancel = (details.url.indexOf('guild-nav-embed.js') === -1) && (details.url.indexOf('slick-embed.js') === -1) && (details.url.indexOf("extension=true") === -1)
  cancel = !!(cancel && data[initiator]);
  if (cancel) {
    const d = data[initiator];
    const tabId = details.tabId;
    const scriptUrl = `${d.server}?site=${d.siteCode}&extension=true`;
    Promise.resolve().then(() => {
      injectScript(tabId, scriptUrl);
    });
  }
  console.log(cancel, initiator, details, data);
  return { cancel };
},
  { urls: ["*://poweredbyslick.com/e2/*", "*://guild.systems/e2/*", "*://slickstream.com/e2/*", "*://slickstream.us/e2/*"] },
  ["blocking"]
);

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (changes.hostData && changes.hostData.newValue) {
    data = changes.hostData.newValue;
  }
});

chrome.webNavigation.onDOMContentLoaded.addListener(async (tabData) => {
  if (!tabData.frameId) {
    const host = new URL(tabData.url).host;
    const d = data[host];
    if (d) {
      const scriptUrl = `${d.server}?site=${d.siteCode}&extension=true`;
      Promise.resolve().then(() => {
        injectScript(tabData.tabId, scriptUrl);
      });
    }
  }
});
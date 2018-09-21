const btn = document.getElementById('btnSave');
const btnClear = document.getElementById('btnClear');
const siteCode = document.getElementById('siteCode');
const server = document.getElementById('server');
const selector = document.getElementById('selector');
const stripSelector = document.getElementById('stripSelector');
const css = document.getElementById('css');
const host = document.getElementById('host');
const sitesPanel = document.getElementById('sitesPanel');

let serverUrl = '';
let data = {};
let currentHost = '';

function onCardSave() {
  let hostUrl = host.value.trim();
  if (hostUrl) {
    try {
      hostUrl = new URL(hostUrl).host;
    } catch (err) {
    }
  }
  const options = {
    host: hostUrl,
    siteCode: siteCode.value.trim(),
    selector: selector.value.trim(),
    stripSelector: stripSelector.value.trim(),
    css: css.value.trim()
  };
  currentHost = hostUrl;
  if (currentHost) {
    data[currentHost] = options;
  }
  doSave();
}

function doSave() {
  const toSave = {
    siteData: data,
    server: server.value.trim() || 'https://poweredbyslick.com/e1/embed-nav.js'
  }
  chrome.storage.sync.set(toSave);
  refreshSites();
}

async function load() {
  chrome.storage.sync.get(['siteData', 'server'], (result) => {
    data = result.siteData || {};
    serverUrl = result.server || 'https://poweredbyslick.com/e1/embed-nav.js';
    server.value = serverUrl;
    refreshSites();
  });
}

function clearCard() {
  siteCode.value = '';
  selector.value = '';
  stripSelector.value = '';
  css.value = '';
  host.value = '';
}

function refreshSites() {
  while (sitesPanel.hasChildNodes() && sitesPanel.lastChild) {
    sitesPanel.removeChild(sitesPanel.lastChild);
  }
  for (const hostName in data) {
    if (hostName) {
      const div = document.createElement('div');
      div.classList.add('hostCard');
      div.textContent = data[hostName].host;
      const x = document.createElement('button');
      x.textContent = 'delete';
      div.appendChild(x);
      x.addEventListener('click', (e) => {
        e.stopPropagation();
        delete data[hostName];
        clearCard();
        doSave();
      });
      div.addEventListener('click', () => {
        const d = data[hostName];
        siteCode.value = d.siteCode;
        selector.value = d.selector;
        stripSelector.value = d.stripSelector;
        css.value = d.css;
        host.value = d.host;
      });
      sitesPanel.appendChild(div);
    }
  }
}

btn.addEventListener('click', () => onCardSave());
btnClear.addEventListener('click', () => clearCard());

load();
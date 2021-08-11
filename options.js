const btn = document.getElementById('btnSave');
const btnClear = document.getElementById('btnClear');
const siteCode = document.getElementById('siteCode');
const server = document.getElementById('server');
const host = document.getElementById('host');
const sitesPanel = document.getElementById('sitesPanel');

let lastServer = 'https://app.slickstream.com';
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
    server: server.value.trim() || lastServer
  };
  currentHost = hostUrl;
  if (currentHost) {
    data[currentHost] = options;
  }
  lastServer = options.server;
  doSave();
}

function doSave() {
  const toSave = { hostData: data }
  chrome.storage.sync.set(toSave);
  refreshSites();
}

async function load() {
  chrome.storage.sync.get(['hostData'], (result) => {
    data = result.hostData || {};
    refreshSites();
  });
}

function clearCard() {
  siteCode.value = '';
  host.value = '';
  server.value = lastServer;
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
        host.value = d.host;
        server.value = d.server || lastServer
      });
      sitesPanel.appendChild(div);
    }
  }
}

btn.addEventListener('click', () => onCardSave());
btnClear.addEventListener('click', () => clearCard());

clearCard();
load();
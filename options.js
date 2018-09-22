const btn = document.getElementById('btnSave');
const btnClear = document.getElementById('btnClear');
const siteCode = document.getElementById('siteCode');
const server = document.getElementById('server');
const selector = document.getElementById('selector');
const stripSelector = document.getElementById('stripSelector');
const css = document.getElementById('css');
const host = document.getElementById('host');
const sitesPanel = document.getElementById('sitesPanel');

const stripBefore = document.getElementById('stripBefore');
const stripAfter = document.getElementById('stripAfter');
const stripFirstChild = document.getElementById('stripFirstChild');
const stripLastChild = document.getElementById('stripLastChild');

const explorerBefore = document.getElementById('explorerBefore');
const explorerAfter = document.getElementById('explorerAfter');
const explorerFirstChild = document.getElementById('explorerFirstChild');
const explorerLastChild = document.getElementById('explorerLastChild');

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

  let stripPosition = stripAfter.value;
  if (stripBefore.checked) {
    stripPosition = stripBefore.value;
  } else if (stripFirstChild.checked) {
    stripPosition = stripFirstChild.value;
  } else if (stripLastChild.checked) {
    stripPosition = stripLastChild.value;
  }

  let explorerPosition = explorerAfter.value;
  if (explorerBefore.checked) {
    explorerPosition = explorerBefore.value;
  } else if (explorerFirstChild.checked) {
    explorerPosition = explorerFirstChild.value;
  } else if (explorerLastChild.checked) {
    explorerPosition = explorerLastChild.value;
  }

  const options = {
    host: hostUrl,
    siteCode: siteCode.value.trim(),
    selector: selector.value.trim(),
    stripSelector: stripSelector.value.trim(),
    css: css.value.trim(),
    stripPosition,
    explorerPosition
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
  explorerAfter.checked = true;
  explorerBefore.checked = false;
  explorerFirstChild.checked = false;
  explorerLastChild.checked = false;
  stripAfter.checked = true;
  stripBefore.checked = false;
  stripFirstChild.checked = false;
  stripLastChild.checked = false;
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

        stripAfter.checked = false;
        stripBefore.checked = false;
        stripFirstChild.checked = false;
        stripLastChild.checked = false;
        if (stripBefore.value === d.stripPosition) {
          stripBefore.checked = true;
        } else if (stripFirstChild.value === d.stripPosition) {
          stripFirstChild.checked = true;
        } else if (stripLastChild.value === d.stripPosition) {
          stripLastChild.checked = true;
        } else {
          stripAfter.checked = true;
        }

        explorerAfter.checked = false;
        explorerBefore.checked = false;
        explorerFirstChild.checked = false;
        explorerLastChild.checked = false;
        if (explorerBefore.value === d.explorerPosition) {
          explorerBefore.checked = true;
        } else if (explorerFirstChild.value === d.explorerPosition) {
          explorerFirstChild.checked = true;
        } else if (explorerLastChild.value === d.explorerPosition) {
          explorerLastChild.checked = true;
        } else {
          explorerAfter.checked = true;
        }
      });
      sitesPanel.appendChild(div);
    }
  }
}

btn.addEventListener('click', () => onCardSave());
btnClear.addEventListener('click', () => clearCard());

load();
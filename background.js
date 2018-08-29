let serverUrl = '';

async function getSiteData() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['siteData', 'server'], (result) => {
      const siteData = result.siteData;
      serverUrl = result.server || 'https://guild.network/e1/embed-nav.js';
      resolve(siteData || {});
    });
  });
}

function inject(options) {
  const css = "`" + (options.css || '').replace('\n', '') + "`";
  const code = `
    ((siteCode, css, selector, stripSelector, scriptUrl) => {
      if (!window.guild) {
        window.guild = { site: siteCode };
        localStorage.setItem('guild-nav-extension-config', JSON.stringify(window.guild));
        if (css) {
          const styleNode = document.createElement('style');
          styleNode.innerHTML = css;
          document.body.appendChild(styleNode);
        }
        if (selector) {
          const nodes = document.querySelectorAll(selector);
          if (nodes && nodes.length) {
            for (let i = 0; i < nodes.length; i++) {
              const n = nodes[i];
              const div = document.createElement('div');
              div.classList.add('guild-explorer');
              n.insertAdjacentElement('afterend', div);
            }
          }
        }
        if (stripSelector) {
          const nodes = document.querySelectorAll(stripSelector);
          if (nodes && nodes.length) {
            for (let i = 0; i < nodes.length; i++) {
              const n = nodes[i];
              const div = document.createElement('div');
              div.classList.add('guild-film-strip');
              n.insertAdjacentElement('afterend', div);
            }
          }
        }
        const s = document.createElement('script');
        s.src = scriptUrl;
        document.head.appendChild(s);
      }
    })('${options.siteCode}', ${css}, '${options.selector}', '${options.stripSelector}', '${serverUrl}');
  `;
  console.log(code);
  chrome.tabs.executeScript({ code });
}

chrome.webNavigation.onDOMContentLoaded.addListener(async (data) => {
  if (!data.frameId) {
    const host = new URL(data.url).host;
    const siteData = await getSiteData();
    if (siteData[host] && siteData[host].siteCode) {
      inject(siteData[host])
    }
  }
});
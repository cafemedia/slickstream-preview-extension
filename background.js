chrome.browserAction.onClicked.addListener(function (tab) {
  chrome.storage.sync.get(['options'], (result) => {
    if (result.options) {
      const options = result.options;
      const server = options.server || 'https://guild.network/e1/embed-nav.js';

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
      })('${options.siteCode}', ${css}, '${options.selector}', '${options.stripSelector}', '${options.server}');
      `;
      console.log(code);
      chrome.tabs.executeScript({ code });
    }
  });
});
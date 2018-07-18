chrome.browserAction.onClicked.addListener(function (tab) {
  chrome.storage.sync.get(['options'], (result) => {
    if (result.options) {
      const options = result.options;
      const server = options.server || 'https://guild.network/e1/embed.js';
      const code = `
      if (!window.guild) {
        window.guild = {
          site: '${options.siteCode}',
          tabZIndex: 900
        };
        localStorage.setItem('guild-extension-config', JSON.stringify(window.guild));
        const s = document.createElement('script');
        s.src = '${server}';
        document.head.appendChild(s);
      }
      `;
      chrome.tabs.executeScript({ code });
    }
  });
});
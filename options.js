(() => {
  const btn = document.getElementById('btnSave');
  const siteCode = document.getElementById('siteCode');
  const server = document.getElementById('server');
  btn.addEventListener('click', () => {
    const options = {
      siteCode: siteCode.value.trim(),
      server: server.value.trim() || 'https://guild.network/e1/embed.js'
    };
    chrome.storage.sync.set({ options });
  });
  chrome.storage.sync.get(['options'], (result) => {
    if (result.options) {
      const options = result.options;
      siteCode.value = options.siteCode;
      server.value = options.server || 'https://guild.network/e1/embed.js'
    } else {
      server.value = 'https://guild.network/e1/embed.js'
    }
  });
})();
(() => {
  const btn = document.getElementById('btnSave');
  const siteCode = document.getElementById('siteCode');
  const server = document.getElementById('server');
  const selector = document.getElementById('selector');
  const stripSelector = document.getElementById('stripSelector');
  const css = document.getElementById('css');

  btn.addEventListener('click', () => {
    const options = {
      siteCode: siteCode.value.trim(),
      server: server.value.trim() || 'https://guild.network/e1/embed-nav.js',
      selector: selector.value.trim(),
      stripSelector: stripSelector.value.trim(),
      css: css.value.trim()
    };
    chrome.storage.sync.set({ options });
  });
  chrome.storage.sync.get(['options'], (result) => {
    if (result.options) {
      const options = result.options;
      siteCode.value = options.siteCode || '';
      server.value = options.server || 'https://guild.network/e1/embed-nav.js'
      selector.value = options.selector || '';
      stripSelector.value = options.stripSelector || '';
      css.value = options.css || '';
    } else {
      server.value = 'https://guild.network/e1/embed-nav.js'
    }
  });
})();
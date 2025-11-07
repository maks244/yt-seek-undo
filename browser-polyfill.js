(function() {
  'use strict';

  if (typeof browser !== 'undefined' && browser.runtime) {
    return;
  }

  if (typeof chrome === 'undefined') {
    return;
  }

  function promisify(chromeMethod) {
    return function(...args) {
      return new Promise((resolve, reject) => {
        chromeMethod(...args, (...results) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(results.length <= 1 ? results[0] : results);
          }
        });
      });
    };
  }

  const browserPolyfill = {
    runtime: {
      sendMessage: promisify(chrome.runtime.sendMessage.bind(chrome.runtime)),
      onMessage: chrome.runtime.onMessage,
      lastError: chrome.runtime.lastError,
      id: chrome.runtime.id,
      getManifest: () => chrome.runtime.getManifest()
    },
    
    storage: {
      local: {
        get: promisify(chrome.storage.local.get.bind(chrome.storage.local)),
        set: promisify(chrome.storage.local.set.bind(chrome.storage.local)),
        remove: promisify(chrome.storage.local.remove.bind(chrome.storage.local)),
        clear: promisify(chrome.storage.local.clear.bind(chrome.storage.local))
      },
      sync: {
        get: promisify(chrome.storage.sync.get.bind(chrome.storage.sync)),
        set: promisify(chrome.storage.sync.set.bind(chrome.storage.sync)),
        remove: promisify(chrome.storage.sync.remove.bind(chrome.storage.sync)),
        clear: promisify(chrome.storage.sync.clear.bind(chrome.storage.sync))
      }
    },
    
    tabs: {
      query: promisify(chrome.tabs.query.bind(chrome.tabs)),
      sendMessage: promisify(chrome.tabs.sendMessage.bind(chrome.tabs)),
      get: promisify(chrome.tabs.get.bind(chrome.tabs)),
      onRemoved: chrome.tabs.onRemoved
    },
    
    commands: {
      onCommand: chrome.commands.onCommand,
      getAll: promisify(chrome.commands.getAll.bind(chrome.commands))
    }
  };

  // Use globalThis for compatibility with both window and service worker contexts
  globalThis.browser = browserPolyfill;
})();

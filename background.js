// Inline polyfill for Chrome compatibility in service worker
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

  globalThis.browser = browserPolyfill;
})();

function registerCommandListener() {
  console.log('YouTube Seek Undo Background: Registering command listener...');
  console.log('YouTube Seek Undo Background: browser.commands available:', typeof browser.commands);
  console.log('YouTube Seek Undo Background: browser.commands.onCommand available:', typeof browser.commands?.onCommand);
  
  browser.commands.onCommand.addListener((command) => {
    console.log('YouTube Seek Undo Background: Command fired:', command);
    if (command === 'undo-seek') {
      console.log('YouTube Seek Undo: Undo command received');
      handleUndoCommand();
    } else {
      console.log('YouTube Seek Undo: Unknown command:', command);
    }
  });
  
  console.log('YouTube Seek Undo Background: Command listener registered');
}

function registerMessageListener() {
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'getTabId') {
      sendResponse({ tabId: sender.tab?.id || null });
      return true;
    }
  });
  
  console.log('YouTube Seek Undo Background: Message listener registered');
}

async function handleUndoCommand() {
  console.log('YouTube Seek Undo: handleUndoCommand called');
  try {
    const [activeTab] = await browser.tabs.query({ active: true, currentWindow: true });
    console.log('YouTube Seek Undo: Active tab:', activeTab);
    
    if (!activeTab) {
      console.log('YouTube Seek Undo: No active tab found');
      return;
    }
    
    console.log('YouTube Seek Undo: Checking if YouTube watch page:', activeTab.url);
    if (!isYouTubeWatchPage(activeTab.url)) {
      console.log('YouTube Seek Undo: Active tab is not a YouTube watch page');
      return;
    }
    
    console.log('YouTube Seek Undo: Sending undo command to tab:', activeTab.id);
    await sendUndoCommand(activeTab.id);
    
  } catch (error) {
    console.error('YouTube Seek Undo: Error handling undo command:', error);
  }
}

function isYouTubeWatchPage(url) {
  if (!url) return false;
  
  try {
    const urlObj = new URL(url);
    return urlObj.hostname === 'www.youtube.com' && urlObj.pathname.includes('/watch');
  } catch (error) {
    console.error('YouTube Seek Undo: Invalid URL:', error);
    return false;
  }
}

async function sendUndoCommand(tabId) {
  console.log('YouTube Seek Undo: sendUndoCommand called for tab:', tabId);
  try {
    const response = await browser.tabs.sendMessage(tabId, { action: 'undo' });
    console.log('YouTube Seek Undo: Response from content script:', response);
    
    if (response?.success) {
      console.log('YouTube Seek Undo: Undo command sent successfully');
    } else {
      console.warn('YouTube Seek Undo: Undo command failed or no response');
    }
    
  } catch (error) {
    console.error('YouTube Seek Undo: Failed to send undo message:', error);
  }
}

function registerTabRemovalListener() {
  browser.tabs.onRemoved.addListener((tabId) => {
    console.log(`YouTube Seek Undo: Tab ${tabId} closed, cleaning up seek history`);
    cleanupTabHistory(tabId);
  });
  
  console.log('YouTube Seek Undo Background: Tab removal listener registered');
}

async function cleanupTabHistory(tabId) {
  try {
    const key = `seekHistory_${tabId}`;
    await browser.storage.local.remove(key);
    console.log(`YouTube Seek Undo: Seek history cleared for tab ${tabId}`);
  } catch (error) {
    console.error(`YouTube Seek Undo: Failed to clear seek history for tab ${tabId}:`, error);
  }
}

async function init() {
  console.log('YouTube Seek Undo Background: Initializing...');
  console.log('YouTube Seek Undo Background: Browser type:', typeof chrome !== 'undefined' ? 'Chrome' : 'Firefox');
  console.log('YouTube Seek Undo Background: browser object:', typeof browser);
  
  registerCommandListener();
  registerMessageListener();
  registerTabRemovalListener();
  
  // Log available commands for debugging
  try {
    const commands = await browser.commands.getAll();
    console.log('YouTube Seek Undo Background: Available commands:', commands);
  } catch (error) {
    console.error('YouTube Seek Undo Background: Failed to get commands:', error);
  }
  
  console.log('YouTube Seek Undo Background: Initialization complete');
}

// Run init immediately
init();

// Keep service worker alive in Chrome
if (typeof chrome !== 'undefined' && chrome.runtime) {
  console.log('YouTube Seek Undo Background: Chrome detected, setting up keepalive');
}

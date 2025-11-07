// Import polyfill for Chrome compatibility
importScripts('browser-polyfill.js');

function registerCommandListener() {
  browser.commands.onCommand.addListener((command) => {
    if (command === 'undo-seek') {
      console.log('YouTube Seek Undo: Undo command received');
      handleUndoCommand();
    }
  });
  
  console.log('YouTube Seek Undo Background: Command listener registered');
}

async function handleUndoCommand() {
  try {
    const [activeTab] = await browser.tabs.query({ active: true, currentWindow: true });
    
    if (!activeTab) {
      console.log('YouTube Seek Undo: No active tab found');
      return;
    }
    
    if (!isYouTubeWatchPage(activeTab.url)) {
      console.log('YouTube Seek Undo: Active tab is not a YouTube watch page');
      return;
    }
    
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
  try {
    const response = await browser.tabs.sendMessage(tabId, { action: 'undo' });
    
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

function init() {
  console.log('YouTube Seek Undo Background: Initializing...');
  registerCommandListener();
  registerTabRemovalListener();
  console.log('YouTube Seek Undo Background: Initialization complete');
}

init();

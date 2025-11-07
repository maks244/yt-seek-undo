async function getSeekHistory(tabId) {
    try {
        const key = `seekHistory_${tabId}`;
        const result = await browser.storage.local.get(key);
        return result[key] || [];
    } catch (error) {
        console.error(`Failed to retrieve seek history for tab ${tabId}:`, error);
        return [];
    }
}

async function saveSeekHistory(tabId, history) {
    try {
        const trimmedHistory = history.slice(-3); // Keep only last 3 events
        const key = `seekHistory_${tabId}`;
        await browser.storage.local.set({ [key]: trimmedHistory });
    } catch (error) {
        console.error(`Failed to save seek history for tab ${tabId}:`, error);
        throw error;
    }
}

async function getUndoHotkey() {
    try {
        const result = await browser.storage.sync.get('undoHotkey');
        return result.undoHotkey || 'Ctrl+Z';
    } catch (error) {
        console.error('Failed to retrieve undo hotkey:', error);
        return 'Ctrl+Z';
    }
}

async function saveUndoHotkey(hotkey) {
    try {
        await browser.storage.sync.set({ undoHotkey: hotkey });
    } catch (error) {
        console.error('Failed to save undo hotkey:', error);
        throw error;
    }
}

async function clearSeekHistory(tabId) {
    try {
        const key = `seekHistory_${tabId}`;
        await browser.storage.local.remove(key);
    } catch (error) {
        console.error(`Failed to clear seek history for tab ${tabId}:`, error);
    }
}

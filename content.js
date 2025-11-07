let videoElement = null;
let seekBarElement = null;
let isSeekBarInteraction = false;
let isProgrammaticSeek = false;
let originPosition = null;
let seekHistory = [];
let detectionAttempts = 0;
const MAX_DETECTION_ATTEMPTS = 5;
const BASE_RETRY_DELAY = 500;

function init() {
    console.log('YouTube Seek Undo: Initializing...');
    detectYouTubePlayer();
    setupMessageListener();
}

function detectYouTubePlayer() {
    const video = document.querySelector('video');

    if (video) {
        console.log('YouTube Seek Undo: Video player detected');
        videoElement = video;
        detectionAttempts = 0;
        setupVideoListeners();
        detectSeekBar();
    } else {
        detectionAttempts++;

        if (detectionAttempts < MAX_DETECTION_ATTEMPTS) {
            // Exponential backoff: 0.5s, 1s, 2s etc
            const delay = BASE_RETRY_DELAY * Math.pow(2, detectionAttempts - 1);
            console.log(`YouTube Seek Undo: Video player not found, retrying in ${delay}ms (attempt ${detectionAttempts}/${MAX_DETECTION_ATTEMPTS})`);
            setTimeout(detectYouTubePlayer, delay);
        } else {
            console.warn('YouTube Seek Undo: Failed to detect video player after maximum attempts');
        }
    }
}

function detectSeekBar() {
    const seekBar = document.querySelector('.ytp-progress-bar');

    if (seekBar) {
        console.log('YouTube Seek Undo: Seek bar detected');
        seekBarElement = seekBar;
        setupSeekBarListener();
    } else {
        console.warn('YouTube Seek Undo: Seek bar not found, seek tracking disabled');
    }
}

function setupNavigationObserver() {
    const observer = new MutationObserver(() => {
        if (!window.location.pathname.includes('/watch')) {
            cleanup();
        } else if (!videoElement || !document.contains(videoElement)) {
            cleanup();
            detectionAttempts = 0;
            detectYouTubePlayer();
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

function setupVideoListeners() {
    if (!videoElement) return;

    videoElement.addEventListener('seeking', handleSeeking);
    videoElement.addEventListener('seeked', handleSeeked);

    console.log('YouTube Seek Undo: Video event listeners attached');
}

function setupSeekBarListener() {
    if (!seekBarElement) return;

    seekBarElement.addEventListener('mousedown', handleSeekBarMouseDown);

    console.log('YouTube Seek Undo: Seek bar listener attached');
}

function handleSeekBarMouseDown() {
    if (isProgrammaticSeek) return;

    // we want to distinguish seek bar clicks from arrow key navigation
    isSeekBarInteraction = true;

    if (videoElement) {
        originPosition = videoElement.currentTime;
        console.log('YouTube Seek Undo: Seek bar clicked, origin position:', originPosition);
    }
}

function handleSeeking() {
    if (!isSeekBarInteraction || isProgrammaticSeek) return;
    console.log('YouTube Seek Undo: Seeking started');
}

async function handleSeeked() {
    if (!isSeekBarInteraction || isProgrammaticSeek) return;

    const targetPosition = videoElement.currentTime;
    console.log('YouTube Seek Undo: Seek completed, target position:', targetPosition);

    if (originPosition !== null) {
        await storeSeekEvent(originPosition, targetPosition);
    }

    isSeekBarInteraction = false;
    originPosition = null;
}

async function storeSeekEvent(origin, target) {
    const seekEvent = {
        origin: origin,
        target: target,
        timestamp: Date.now()
    };

    seekHistory.push(seekEvent);

    if (seekHistory.length > 3) {
        seekHistory.shift();
    }

    console.log('YouTube Seek Undo: Seek event stored', seekEvent);
    console.log('YouTube Seek Undo: Current history:', seekHistory);

    try {
        const tabId = await getCurrentTabId();
        if (tabId) {
            await saveSeekHistory(tabId, seekHistory);
        }
    } catch (error) {
        console.error('YouTube Seek Undo: Failed to persist seek history', error);
    }
}

async function getCurrentTabId() {
    try {
        const response = await browser.runtime.sendMessage({ action: 'getTabId' });
        return response?.tabId || null;
    } catch (error) {
        console.error('YouTube Seek Undo: Failed to get tab ID', error);
        return null;
    }
}

function setupMessageListener() {
    browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
        console.log('YouTube Seek Undo Content: Message received:', message);
        if (message.action === 'undo') {
            console.log('YouTube Seek Undo Content: Processing undo action');
            undoLastSeek();
            sendResponse({ success: true });
        }
        return true; // Keep open for response
    });

    console.log('YouTube Seek Undo: Message listener setup');
}

async function undoLastSeek() {
    console.log('YouTube Seek Undo: undoLastSeek called, history length:', seekHistory.length);
    console.log('YouTube Seek Undo: Current seek history:', seekHistory);
    
    if (seekHistory.length === 0) {
        console.log('YouTube Seek Undo: No seek history to undo');
        return;
    }

    const lastSeek = seekHistory[seekHistory.length - 1];
    const undoPosition = lastSeek.origin;

    console.log('YouTube Seek Undo: Undoing to position:', undoPosition, 'from:', lastSeek.target);

    if (!videoElement) {
        console.error('YouTube Seek Undo: Video element not available');
        return;
    }

    // dont record undo as new seek event
    isProgrammaticSeek = true;
    videoElement.currentTime = undoPosition;
    console.log('YouTube Seek Undo: Video currentTime set to:', undoPosition);

    setTimeout(() => {
        isProgrammaticSeek = false;
        console.log('YouTube Seek Undo: Undo completed');
    }, 100);
}

function cleanup() {
    console.log('YouTube Seek Undo: Cleaning up...');

    if (videoElement) {
        videoElement.removeEventListener('seeking', handleSeeking);
        videoElement.removeEventListener('seeked', handleSeeked);
        videoElement = null;
    }

    if (seekBarElement) {
        seekBarElement.removeEventListener('mousedown', handleSeekBarMouseDown);
        seekBarElement = null;
    }

    isSeekBarInteraction = false;
    isProgrammaticSeek = false;
    originPosition = null;
    seekHistory = [];
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

setupNavigationObserver();
window.addEventListener('beforeunload', cleanup);

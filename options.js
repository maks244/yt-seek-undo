let currentHotkeyDisplay;
let hotkeyInput;
let saveButton;
let resetButton;
let errorMessage;
let successMessage;
let capturedHotkey = '';
const DEFAULT_HOTKEY = 'Ctrl+Z';

document.addEventListener('DOMContentLoaded', async () => {
  currentHotkeyDisplay = document.getElementById('currentHotkey');
  hotkeyInput = document.getElementById('hotkeyInput');
  saveButton = document.getElementById('saveButton');
  resetButton = document.getElementById('resetButton');
  errorMessage = document.getElementById('errorMessage');
  successMessage = document.getElementById('successMessage');

  await loadCurrentHotkey();

  hotkeyInput.addEventListener('keydown', captureHotkeyInput);
  hotkeyInput.addEventListener('focus', () => {
    hotkeyInput.value = '';
    capturedHotkey = '';
    hideMessages();
  });
  
  saveButton.addEventListener('click', saveNewHotkey);
  resetButton.addEventListener('click', resetToDefault);
});

async function loadCurrentHotkey() {
  try {
    const hotkey = await getUndoHotkey();
    currentHotkeyDisplay.textContent = hotkey;
  } catch (error) {
    console.error('Failed to load current hotkey:', error);
    currentHotkeyDisplay.textContent = 'Error loading hotkey';
    showError('Failed to load current hotkey configuration');
  }
}

function captureHotkeyInput(event) {
  event.preventDefault();
  
  const modifiers = [];
  if (event.ctrlKey) modifiers.push('Ctrl');
  if (event.altKey) modifiers.push('Alt');
  if (event.shiftKey) modifiers.push('Shift');
  if (event.metaKey) modifiers.push('Command');
  
  let key = event.key;
  
  if (['Control', 'Alt', 'Shift', 'Meta'].includes(key)) {
    return;
  }
  
  if (key.length === 1) {
    key = key.toUpperCase();
  }
  
  if (modifiers.length > 0) {
    capturedHotkey = modifiers.join('+') + '+' + key;
  } else {
    capturedHotkey = key;
  }
  
  hotkeyInput.value = capturedHotkey;
  
  const validation = validateHotkey(capturedHotkey);
  if (!validation.valid) {
    showError(validation.error);
    saveButton.disabled = true;
  } else {
    hideMessages();
    saveButton.disabled = false;
  }
}

function validateHotkey(hotkey) {
  if (!hotkey || hotkey.trim() === '') {
    return { valid: false, error: 'Please enter a hotkey combination' };
  }
  
  const hasModifier = hotkey.includes('Ctrl') || 
                      hotkey.includes('Alt') || 
                      hotkey.includes('Command') ||
                      hotkey.includes('Shift');
  
  if (!hasModifier) {
    return { 
      valid: false, 
      error: 'Hotkey should include at least one modifier key (Ctrl, Alt, Shift, or Command) to avoid conflicts' 
    };
  }
  
  const reserved = [
    'Ctrl+T', 'Ctrl+W', 'Ctrl+N', 'Ctrl+Shift+N', 
    'Ctrl+Tab', 'Ctrl+Shift+Tab', 'Ctrl+Q',
    'Command+T', 'Command+W', 'Command+N', 'Command+Q'
  ];
  
  if (reserved.includes(hotkey)) {
    return { 
      valid: false, 
      error: 'This hotkey is reserved by the browser and cannot be used' 
    };
  }
  
  return { valid: true };
}

async function saveNewHotkey() {
  if (!capturedHotkey) {
    showError('Please capture a hotkey first by clicking the input field and pressing keys');
    return;
  }
  
  const validation = validateHotkey(capturedHotkey);
  if (!validation.valid) {
    showError(validation.error);
    return;
  }
  
  try {
    await saveUndoHotkey(capturedHotkey);
    currentHotkeyDisplay.textContent = capturedHotkey;
    showSuccess(`Hotkey successfully saved as: ${capturedHotkey}`);
    
    hotkeyInput.value = '';
    capturedHotkey = '';
    
    setTimeout(() => {
      showSuccess(`Hotkey saved! Note: You may need to reload the extension for changes to take effect.`);
    }, 2000);
    
  } catch (error) {
    console.error('Failed to save hotkey:', error);
    showError('Failed to save hotkey. Please try again.');
  }
}

async function resetToDefault() {
  try {
    await saveUndoHotkey(DEFAULT_HOTKEY);
    currentHotkeyDisplay.textContent = DEFAULT_HOTKEY;
    
    hotkeyInput.value = '';
    capturedHotkey = '';
    
    showSuccess(`Hotkey reset to default: ${DEFAULT_HOTKEY}`);
    
  } catch (error) {
    console.error('Failed to reset hotkey:', error);
    showError('Failed to reset hotkey. Please try again.');
  }
}

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.style.display = 'block';
  successMessage.style.display = 'none';
}

function showSuccess(message) {
  successMessage.textContent = message;
  successMessage.style.display = 'block';
  errorMessage.style.display = 'none';
}

function hideMessages() {
  errorMessage.style.display = 'none';
  successMessage.style.display = 'none';
}

async function getUndoHotkey() {
  try {
    const result = await browser.storage.sync.get('undoHotkey');
    return result.undoHotkey || DEFAULT_HOTKEY;
  } catch (error) {
    console.error('Failed to retrieve undo hotkey:', error);
    return DEFAULT_HOTKEY;
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

//#region Configuration
const config = {
    textColor: '#FAFAFA',
    backgroundColor: '#ffffffff',
    backgroundOpacity: 0,
    fontSize: 17,
    theme: 'snow',
}

const options = {
    theme: 'bubble',
    modules: {
        toolbar: [
            ['bold', 'italic', 'code'],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }, { 'list': 'check' }],
            [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
        ],
        keyboard: {
            bindings: {
                heading: {
                    key: ' ',
                    shiftKey: false,
                    handler: function(range) {
                        const [line, offset] = this.quill.getLine(range.index);
                        const lineStart = range.index - offset;
                        const text = this.quill.getText(lineStart, offset);
                        
                        const match = text.match(/^(#{1,6})$/);
                        if (match) {
                            const level = match[1].length;
                            this.quill.deleteText(lineStart, level);
                            this.quill.formatLine(lineStart, 1, 'header', level);
                            return false;
                        }
                        return true;
                    }
                },
                codeBlock: {
                    key: '`',
                    handler: function(range) {
                        const [line, offset] = this.quill.getLine(range.index);
                        const lineStart = range.index - offset;
                        const text = this.quill.getText(lineStart, offset);
                        
                        if (text === '``') {
                            this.quill.deleteText(lineStart, 2);
                            this.quill.formatLine(lineStart, 1, 'code-block', true);
                            return false;
                        }
                        return true;
                    }
                },
                blockquote: {
                    key: ' ',
                    shiftKey: false,
                    handler: function(range) {
                        const [line, offset] = this.quill.getLine(range.index);
                        const lineStart = range.index - offset;
                        const text = this.quill.getText(lineStart, offset);
                        
                        if (text === '>') {
                            this.quill.deleteText(lineStart, 1);
                            this.quill.formatLine(lineStart, 1, 'blockquote', true);
                            return false;
                        }
                        return true;
                    }
                }
            }
        }
    },
    readOnly: false,
}

const Editor = new Quill('#editor', options);
//#endregion

//#region Utility Functions
/**
 * Applies the given configuration to the application's UI elements.
 *
 * @param {Object} cfg - The configuration object.
 * @param {string} cfg.textColor - The text color to apply.
 * @param {string} cfg.backgroundColor - The background color to apply to the editor.
 * @param {number} cfg.backgroundOpacity - The opacity for the editor's background color (0 to 1).
 * @param {number} cfg.fontSize - The font size (in pixels) to apply to the Quill editor.
 */
const applyConfig = (cfg) => {
    const body = document.body;
    const editor = document.getElementById('editor');
    const quillEditor = document.querySelector('.ql-editor');

    body.style.color = cfg.textColor;
    
    if (editor) {
        editor.style.backgroundColor = rgba(cfg.backgroundColor, cfg.backgroundOpacity);
        editor.style.setProperty('--text-color', cfg.textColor);
    }
    
    if (quillEditor) {
        quillEditor.style.fontSize = `${cfg.fontSize}px`;
        quillEditor.style.color = cfg.textColor;
    }
}

/**
 * Converts a hex color code to an rgba color string with the specified opacity.
 *
 * @param {string} color - The hex color code in the format "#RRGGBB".
 * @param {number} opacity - The opacity value (between 0 and 1).
 * @returns {string} The rgba color string.
 */
const rgba = (color, opacity) => {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}
//#endregion

//#region Initialization
applyConfig(config);
//#endregion

//#region Toggle Read-Only Mode
const toggleReadOnlyBtn = document.getElementById('toggleReadOnly');
const eyeIcon = document.getElementById('eyeIcon');
let isReadOnlyMode = false;
let isOverToggle = false;

const eyeOpenPath = `<path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z"/>
<path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z"/>`;

const eyeClosedPath = `<path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7.028 7.028 0 0 0-2.79.588l.77.771A5.944 5.944 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.134 13.134 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755-.165.165-.337.328-.517.486l.708.709z"/>
<path d="M11.297 9.176a3.5 3.5 0 0 0-4.474-4.474l.823.823a2.5 2.5 0 0 1 2.829 2.829l.822.822zm-2.943 1.299.822.822a3.5 3.5 0 0 1-4.474-4.474l.823.823a2.5 2.5 0 0 0 2.829 2.829z"/>
<path d="M3.35 5.47c-.18.16-.353.322-.518.487A13.134 13.134 0 0 0 1.172 8l.195.288c.335.48.83 1.12 1.465 1.755C4.121 11.332 5.881 12.5 8 12.5c.716 0 1.39-.133 2.02-.36l.77.772A7.029 7.029 0 0 1 8 13.5C3 13.5 0 8 0 8s.939-1.721 2.641-3.238l.708.709zm10.296 8.884-12-12 .708-.708 12 12-.708.708z"/>`;

const applyClickThrough = (readOnly) => {
    isReadOnlyMode = readOnly;
    const shouldIgnore = readOnly && !isOverToggle;
    document.body.classList.toggle('read-only', readOnly);
    document.body.classList.toggle('readonly', readOnly);
    if (window.electronAPI && window.electronAPI.setIgnoreMouseEvents) {
        window.electronAPI.setIgnoreMouseEvents(shouldIgnore);
    }
};

if (toggleReadOnlyBtn && eyeIcon) {
    toggleReadOnlyBtn.addEventListener('click', () => {
        const wasEnabled = Editor.isEnabled();
        Editor.enable(!wasEnabled);
        const nowReadOnly = wasEnabled;
        eyeIcon.innerHTML = nowReadOnly ? eyeClosedPath : eyeOpenPath;
        applyClickThrough(nowReadOnly);
    });
    toggleReadOnlyBtn.addEventListener('mouseenter', () => {
        isOverToggle = true;
        applyClickThrough(isReadOnlyMode);
    });
    toggleReadOnlyBtn.addEventListener('mouseleave', () => {
        isOverToggle = false;
        applyClickThrough(isReadOnlyMode);
    });
}
//#endregion

//#region Settings Modal
const settingsBtn = document.getElementById('settings');
const settingsModal = document.getElementById('settingsModal');
const closeBtn = document.querySelector('.close');
const saveFileBtn = document.getElementById('saveFile');
const openFileBtn = document.getElementById('openFile');
const applySettingsBtn = document.getElementById('applySettings');
const textColorInput = document.getElementById('textColor');
const bgColorInput = document.getElementById('bgColor');
const textSizeInput = document.getElementById('textSize');
const textSizeValue = document.getElementById('textSizeValue');
const bgOpacityInput = document.getElementById('bgOpacity');
const bgOpacityValue = document.getElementById('bgOpacityValue');
const editorThemeInput = document.getElementById('editorTheme');

if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
        if (settingsModal) settingsModal.style.display = 'flex';
    });
}

if (closeBtn) {
    closeBtn.addEventListener('click', () => {
        if (settingsModal) settingsModal.style.display = 'none';
    });
}

window.addEventListener('click', (event) => {
    if (event.target === settingsModal) {
        settingsModal.style.display = 'none';
    }
});

if (textSizeInput && textSizeValue) {
    textSizeInput.addEventListener('input', () => {
        textSizeValue.textContent = `${textSizeInput.value}px`;
    });
}

if (bgOpacityInput && bgOpacityValue) {
    bgOpacityInput.addEventListener('input', () => {
        bgOpacityValue.textContent = `${bgOpacityInput.value}%`;
    });
}

if (applySettingsBtn) {
    applySettingsBtn.addEventListener('click', async () => {
        if (textColorInput) config.textColor = textColorInput.value;
        if (bgColorInput) config.backgroundColor = bgColorInput.value;
        if (textSizeInput) config.fontSize = parseInt(textSizeInput.value);
        if (bgOpacityInput) config.backgroundOpacity = parseInt(bgOpacityInput.value) / 100;
        
        const themeChanged = editorThemeInput && editorThemeInput.value !== config.theme;
        if (editorThemeInput) config.theme = editorThemeInput.value;
        
        await window.electronAPI.saveSettings(config);
        
        if (themeChanged) {
            location.reload();
            return;
        }
        
        applyConfig(config);
        if (settingsModal) settingsModal.style.display = 'none';
    });
}

window.addEventListener('DOMContentLoaded', async () => {
    const savedSettings = await window.electronAPI.getSettings();
    
    if (savedSettings) {
        Object.assign(config, savedSettings);
        if (savedSettings.theme && savedSettings.theme !== options.theme) {
            options.theme = savedSettings.theme;
            const newEditor = new Quill('#editor', options);
            Object.assign(Editor, newEditor);
        }
        if (textColorInput) textColorInput.value = config.textColor;
        if (bgColorInput) bgColorInput.value = config.backgroundColor;
        if (textSizeInput) textSizeInput.value = config.fontSize;
        if (textSizeValue) textSizeValue.textContent = `${config.fontSize}px`;
        if (bgOpacityInput) bgOpacityInput.value = Math.round(config.backgroundOpacity * 100);
        if (bgOpacityValue) bgOpacityValue.textContent = `${Math.round(config.backgroundOpacity * 100)}%`;
        if (editorThemeInput) editorThemeInput.value = config.theme;
        applyConfig(config);
    }
});
//#endregion

//#region File Operations
if (saveFileBtn) {
    saveFileBtn.addEventListener('click', async () => {
        const content = JSON.stringify(Editor.getContents());
        await window.electronAPI.saveFile(content);
    });
}

if (openFileBtn) {
    openFileBtn.addEventListener('click', async () => {
        const result = await window.electronAPI.openFile();
        if (result.success) {
            try {
                const delta = JSON.parse(result.content);
                Editor.setContents(delta);
                if (settingsModal) settingsModal.style.display = 'none';
            } catch (e) {}
        }
    });
}

document.addEventListener('keydown', async (event) => {
    if (event.ctrlKey && event.key === 's') {
        event.preventDefault();
        const content = JSON.stringify(Editor.getContents());
        await window.electronAPI.saveFile(content);
    }
    
    if (event.ctrlKey && (event.key === 'o' || event.key === 'l')) {
        event.preventDefault();
        const result = await window.electronAPI.openFile();
        if (result.success) {
            try {
                const delta = JSON.parse(result.content);
                Editor.setContents(delta);
            } catch (e) {}
        }
    }
});
//#endregion

//#region Topbar Hover State
let isOverTopbar = false;
const topbar = document.getElementById('topbar');

document.addEventListener('mousemove', (e) => {
    if (isReadOnlyMode) {
        document.body.classList.remove('hovering');
        if (topbar) topbar.classList.remove('hovering');
        return;
    }
    const wasOverTopbar = isOverTopbar;
    isOverTopbar = e.clientY >= 0 && e.clientY <= 18;
    
    if (isOverTopbar && !wasOverTopbar) {
        document.body.classList.add('hovering');
        if (topbar) topbar.classList.add('hovering');
    } else if (!isOverTopbar && wasOverTopbar) {
        document.body.classList.remove('hovering');
        if (topbar) topbar.classList.remove('hovering');
    }
});
//#endregion

//#region Custom Resize Handles
const resizeRight = document.querySelector('.resize-right');
const resizeBottom = document.querySelector('.resize-bottom');
const resizeCorner = document.querySelector('.resize-corner');

/**
 * Initiates a window resize operation in the specified direction using Electron's API.
 * Adds event listeners to stop the resize operation when the mouse is released or the window loses focus.
 *
 * @param {string} direction - The direction in which to resize the window (e.g., 'left', 'right', 'top', 'bottom').
 */
const startResize = (direction) => {
    window.electronAPI.startResize(direction);
    
    /**
     * Handles the logic to stop a resize operation.
     * Calls the Electron API to stop resizing and removes related event listeners.
     *
     * @function
     * @returns {void}
     */
    const stopResize = () => {
        window.electronAPI.stopResize();
        document.removeEventListener('mouseup', stopResize);
        window.removeEventListener('blur', stopResize);
    };
    
    document.addEventListener('mouseup', stopResize, { once: true });
    window.addEventListener('blur', stopResize, { once: true });
};

if (resizeRight) {
    resizeRight.addEventListener('mousedown', (e) => {
        e.preventDefault();
        startResize('right');
    });
}

if (resizeBottom) {
    resizeBottom.addEventListener('mousedown', (e) => {
        e.preventDefault();
        startResize('bottom');
    });
}

if (resizeCorner) {
    resizeCorner.addEventListener('mousedown', (e) => {
        e.preventDefault();
        startResize('bottom-right');
    });
}
//#endregion
// theme.js - Theme and UI management

// Apply theme based on settings
function initializeTheme() {
    const theme = window.state.settings.theme;
    
    if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.body.classList.add('dark-mode');
        window.state.ui.darkMode = true;
        if (window.elements.toggleThemeBtn) {
            window.elements.toggleThemeBtn.innerHTML = '<i class="fas fa-sun"></i>';
        }
    } else {
        document.body.classList.remove('dark-mode');
        window.state.ui.darkMode = false;
        if (window.elements.toggleThemeBtn) {
            window.elements.toggleThemeBtn.innerHTML = '<i class="fas fa-moon"></i>';
        }
    }
    
    if (window.elements.themeSelect) {
        window.elements.themeSelect.value = theme;
    }
}

// Toggle theme
function toggleTheme() {
    window.state.ui.darkMode = !window.state.ui.darkMode;
    
    if (window.state.ui.darkMode) {
        document.body.classList.add('dark-mode');
        if (window.elements.toggleThemeBtn) {
            window.elements.toggleThemeBtn.innerHTML = '<i class="fas fa-sun"></i>';
        }
        window.state.settings.theme = 'dark';
    } else {
        document.body.classList.remove('dark-mode');
        if (window.elements.toggleThemeBtn) {
            window.elements.toggleThemeBtn.innerHTML = '<i class="fas fa-moon"></i>';
        }
        window.state.settings.theme = 'light';
    }
    
    localStorage.setItem('theme', window.state.settings.theme);
    if (window.elements.themeSelect) {
        window.elements.themeSelect.value = window.state.settings.theme;
    }
}

// Toggle chat options menu
function toggleChatOptionsMenu() {
    if (window.elements.chatOptionsMenu) {
        window.elements.chatOptionsMenu.classList.toggle('hidden');
    }
}

// Initialize view mode from settings
function initializeViewMode() {
    const savedMode = window.state.settings.interactionMode || 'simple';
    setViewMode(savedMode);
    
    if (window.elements.interactionModeSelect) {
        window.elements.interactionModeSelect.value = savedMode;
    }
}

// Set the view mode
function setViewMode(mode) {
    // Set in state
    window.state.settings.interactionMode = mode;
    
    // Remove all mode classes
    document.body.classList.remove('simple-mode', 'novel-mode', 'cinematic-mode');
    
    // Add the selected mode class
    document.body.classList.add(`${mode}-mode`);
    
    // Update view option buttons
    if (window.elements.viewOptions) {
        const options = window.elements.viewOptions.querySelectorAll('.view-option');
        options.forEach(option => {
            if (option.getAttribute('data-view') === mode) {
                option.classList.add('active');
            } else {
                option.classList.remove('active');
            }
        });
    }
    
    // If switching to cinematic mode, expand all scene descriptions
    if (mode === 'cinematic') {
        document.querySelectorAll('.scene-content').forEach(scene => {
            scene.classList.add('active');
        });
        
        document.querySelectorAll('.scene-toggle').forEach(toggle => {
            toggle.classList.add('active');
            const toggleText = toggle.querySelector('span');
            if (toggleText) toggleText.textContent = 'Hide Scene Description';
        });
    }
}

// Apply settings changes to the UI
function applySettings() {
    // Apply theme
    if (window.state.settings.theme === 'dark' || (window.state.settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.body.classList.add('dark-mode');
        window.state.ui.darkMode = true;
    } else {
        document.body.classList.remove('dark-mode');
        window.state.ui.darkMode = false;
    }
    
    // Apply font size
    document.body.classList.remove('font-small', 'font-medium', 'font-large');
    document.body.classList.add(`font-${window.state.settings.fontSize}`);
    
    // Apply message display style
    document.body.classList.remove('messages-bubbles', 'messages-blocks');
    document.body.classList.add(`messages-${window.state.settings.messageDisplay}`);
    
    // Apply interaction mode
    setViewMode(window.state.settings.interactionMode);
}

// Initialize theme and UI functionality
function initTheme() {
    console.log('Initializing theme management...');
    
    // Bind theme toggle button
    if (window.elements.toggleThemeBtn) {
        window.elements.toggleThemeBtn.addEventListener('click', toggleTheme);
    }
    
    // Bind theme select dropdown
    if (window.elements.themeSelect) {
        window.elements.themeSelect.addEventListener('change', (e) => {
            window.state.settings.theme = e.target.value;
            localStorage.setItem('theme', e.target.value);
            initializeTheme();
        });
    }
    
    // Bind view mode toggle buttons
    if (window.elements.viewOptions) {
        const options = window.elements.viewOptions.querySelectorAll('.view-option');
        options.forEach(option => {
            option.addEventListener('click', (e) => {
                const mode = e.target.getAttribute('data-view');
                setViewMode(mode);
                
                // Update settings select if it exists
                if (window.elements.interactionModeSelect) {
                    window.elements.interactionModeSelect.value = mode;
                }
                
                // Save to local storage
                localStorage.setItem('interactionMode', mode);
            });
        });
    }
    
    // Bind chat options menu toggle
    if (window.elements.chatOptionsBtn && window.elements.chatOptionsMenu) {
        window.elements.chatOptionsBtn.addEventListener('click', toggleChatOptionsMenu);
        
        // Close dropdown menus when clicking outside
        document.addEventListener('click', (e) => {
            if (window.elements.chatOptionsBtn && window.elements.chatOptionsMenu &&
                !window.elements.chatOptionsBtn.contains(e.target) && 
                !window.elements.chatOptionsMenu.contains(e.target)) {
                window.elements.chatOptionsMenu.classList.add('hidden');
            }
        });
    }
    
    // Initialize theme based on settings
    initializeTheme();
    
    // Initialize view mode
    initializeViewMode();
}

// Expose functions
window.theme = {
    init: initTheme,
    toggleTheme: toggleTheme,
    setViewMode: setViewMode,
    applySettings: applySettings,
    initializeTheme: initializeTheme,
    initializeViewMode: initializeViewMode
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initTheme);
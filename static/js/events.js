// events.js - Event binding and user interactions

// Bind all event listeners
function bindEventListeners() {
    const elements = window.appElements;
    
    // Character creation and management
    if (elements.createCharacterBtn) {
        elements.createCharacterBtn.addEventListener('click', window.openCreateCharacterModal);
    }
    
    if (elements.welcomeCreateBtn) {
        elements.welcomeCreateBtn.addEventListener('click', window.openCreateCharacterModal);
    }
    
    // Mobile menu toggle
    if (elements.menuToggle) {
        elements.menuToggle.addEventListener('click', () => {
            if (elements.sidebar) {
                elements.sidebar.classList.toggle('active');
                window.appState.ui.sidebarActive = elements.sidebar.classList.contains('active');
            }
        });
    }
    
    // Chat
    if (elements.sendBtn && elements.messageInput) {
        elements.sendBtn.addEventListener('click', window.sendMessage);
        
        elements.messageInput.addEventListener('keydown', e => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                window.sendMessage();
            }
        });
        
        // Auto-resize textarea
        elements.messageInput.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
        });
    }
    
    // Other event bindings
}

// Export for use in other modules
window.bindEventListeners = bindEventListeners;
// Handle errors during initialization
window.addEventListener('error', function(event) {
    console.error('Application error:', event.error);
    
    // Try to show a notification if utils are loaded
    if (window.utils && window.utils.showNotification) {
        window.utils.showNotification('An error occurred while loading the application. Check the console for details.', 'error');
    } else {
        // Fallback error notification
        const errorDiv = document.createElement('div');
        errorDiv.style.position = 'fixed';
        errorDiv.style.top = '20px';
        errorDiv.style.right = '20px';
        errorDiv.style.backgroundColor = '#ef4444';
        errorDiv.style.color = 'white';
        errorDiv.style.padding = '15px';
        errorDiv.style.borderRadius = '5px';
        errorDiv.style.zIndex = '9999';
        errorDiv.textContent = 'An error occurred while loading the application.';
        document.body.appendChild(errorDiv);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 5000);
    }
});

// Global coordination functions

// Reload all modules - useful for development or after major changes
window.reloadApplication = function() {
    location.reload();
};

// Clear application data - useful for troubleshooting
window.clearApplicationData = function() {
    if (confirm('Are you sure you want to clear all application data? This cannot be undone.')) {
        // Clear localStorage
        localStorage.clear();
        
        // Reload the page to reset the application state
        location.reload();
    }
};

console.log('Application core loaded');

document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing application...');
    
    // Initialize core functionality first
    if (window.core && window.core.init) {
        window.core.init();
    }
    
    // Initialize utility functions
    if (window.utils) {
        console.log('Utilities loaded');
    }
    
    // Initialize theme management
    if (window.theme && window.theme.init) {
        window.theme.init();
    }
    
    // Initialize settings management
    if (window.settings && window.settings.init) {
        window.settings.init();
    }
    
    // Initialize prompt templates
    if (window.promptTemplates && window.promptTemplates.init) {
        window.promptTemplates.init();
    }
    
    // Initialize character management
    if (window.character && window.character.init) {
        window.character.init();
    }
    
    // Initialize chat functionality
    if (window.chat && window.chat.init) {
        window.chat.init();
    }
    
    // Initialize player action system
    if (window.playerActionSystem && window.playerActionSystem.init) {
        window.playerActionSystem.init();
    }
    
    // Initialize interaction handling
    if (window.interactions && window.interactions.init) {
        window.interactions.init();
    }
    
    // Initialize homepage
    if (window.homepage && window.homepage.init) {
        window.homepage.init();
    }
    
    // Initialize chat instances - do this AFTER ensuring the homepage is visible
    if (window.chatInstances && window.chatInstances.init) {
        window.chatInstances.init();
    }
    
    // IMPORTANT: Force the correct view at the end of ALL initialization
    // This way it overrides any changes made by other initializations
    console.log('Setting initial view to homepage');
    
    // Reset current chat state on initial load to prevent any auto-selection
    if (window.state) {
        window.state.currentChat = null;
    }
    
    // Decide which view to show initially - ALWAYS show homepage
    const homepage = document.getElementById('homepage');
    const chatInterface = document.getElementById('chat-interface');
    const welcomeScreen = document.getElementById('welcome-screen');
    const chatControls = document.getElementById('chat-controls');
    
    if (homepage) {
        homepage.classList.remove('hidden');
        homepage.style.display = ''; // Clear any direct style that might override classes
    }
    if (chatInterface) chatInterface.classList.add('hidden');
    if (welcomeScreen) welcomeScreen.classList.add('hidden');
    if (chatControls) chatControls.classList.add('hidden');
    
    // Use the homepage's scroll function if available, otherwise implement robust scrolling here
    if (window.homepage && window.homepage.scrollHomepage) {
        window.homepage.scrollHomepage();
    } else {
        // Find all possible scrollable elements
        const appContainer = document.querySelector('.app-container');
        const mainContent = document.querySelector('.main-content');
        
        // Try various scrolling methods for different browsers/implementations
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
        
        if (homepage) homepage.scrollTop = 0;
        if (appContainer) appContainer.scrollTop = 0;
        if (mainContent) mainContent.scrollTop = 0;
        
        // Retry scrolling after a delay to ensure content is loaded
        setTimeout(() => {
            window.scrollTo(0, 0);
            document.documentElement.scrollTop = 0;
            document.body.scrollTop = 0;
            
            if (homepage) homepage.scrollTop = 0;
            if (appContainer) appContainer.scrollTop = 0;
            if (mainContent) mainContent.scrollTop = 0;
            
            console.log('Second attempt to scroll homepage on initialization');
        }, 200);
    }
    
    console.log('Application initialization complete');
});
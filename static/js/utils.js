// utils.js - Utility functions used throughout the application

// Format time
function formatTime(date) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Format time ago
function formatTimeAgo(timestamp) {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
        return `${days}d ago`;
    } else if (hours > 0) {
        return `${hours}h ago`;
    } else if (minutes > 0) {
        return `${minutes}m ago`;
    } else {
        return 'Just now';
    }
}

// Capitalize first letter
function capitalizeFirstLetter(string = '') {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element if it doesn't exist
    let notificationContainer = document.getElementById('notification-container');
    
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.id = 'notification-container';
        notificationContainer.style.position = 'fixed';
        notificationContainer.style.top = '20px';
        notificationContainer.style.right = '20px';
        notificationContainer.style.zIndex = '9999';
        document.body.appendChild(notificationContainer);
    }
    
    // Create notification
    const notification = document.createElement('div');
    notification.style.padding = '10px 20px';
    notification.style.marginBottom = '10px';
    notification.style.borderRadius = '5px';
    notification.style.boxShadow = '0 3px 6px rgba(0,0,0,0.16)';
    notification.style.transition = 'all 0.3s ease';
    notification.style.position = 'relative';
    notification.style.display = 'flex';
    notification.style.alignItems = 'center';
    notification.style.minWidth = '250px';
    notification.style.maxWidth = '350px';
    
    // Set color based on type
    if (type === 'success') {
        notification.style.backgroundColor = '#10b981';
        notification.style.color = 'white';
        notification.innerHTML = '<i class="fas fa-check-circle" style="margin-right: 10px;"></i>';
    } else if (type === 'error') {
        notification.style.backgroundColor = '#ef4444';
        notification.style.color = 'white';
        notification.innerHTML = '<i class="fas fa-exclamation-circle" style="margin-right: 10px;"></i>';
    } else if (type === 'warning') {
        notification.style.backgroundColor = '#f59e0b';
        notification.style.color = 'white';
        notification.innerHTML = '<i class="fas fa-exclamation-triangle" style="margin-right: 10px;"></i>';
    } else {
        notification.style.backgroundColor = '#3b82f6';
        notification.style.color = 'white';
        notification.innerHTML = '<i class="fas fa-info-circle" style="margin-right: 10px;"></i>';
    }
    
    // Add message
    notification.innerHTML += message;
    
    // Add close button
    const closeBtn = document.createElement('span');
    closeBtn.innerHTML = '&times;';
    closeBtn.style.position = 'absolute';
    closeBtn.style.right = '10px';
    closeBtn.style.top = '50%';
    closeBtn.style.transform = 'translateY(-50%)';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.fontSize = '18px';
    closeBtn.style.fontWeight = 'bold';
    
    closeBtn.addEventListener('click', () => {
        notification.remove();
    });
    
    notification.appendChild(closeBtn);
    
    // Add to container
    notificationContainer.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 5000);
}

// Show loading overlay
function showLoading() {
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
        loadingOverlay.classList.remove('hidden');
    }
}

// Hide loading overlay
function hideLoading() {
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
        loadingOverlay.classList.add('hidden');
    }
}

// Close any modal
function closeModal(modal) {
    if (modal) {
        modal.classList.add('hidden');
        
        // Clear edit mode data attributes
        if (modal.id === 'character-modal') {
            modal.dataset.editMode = 'false';
            modal.dataset.characterId = '';
        }
    }
}

// Scroll chat to bottom
function scrollToBottom() {
    const chatMessages = document.getElementById('chat-messages');
    if (chatMessages) {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

// Export utility functions
window.utils = {
    formatTime,
    formatTimeAgo,
    capitalizeFirstLetter,
    showNotification,
    showLoading,
    hideLoading,
    closeModal,
    scrollToBottom
};

// Add this to core.js or utils.js
function switchView(viewName) {
    // Hide all views first
    const views = ['homepage', 'welcome-screen', 'chat-interface'];
    views.forEach(view => {
        const element = document.getElementById(view);
        if (element) element.classList.add('hidden');
    });
    
    // Hide additional UI elements that shouldn't always be visible
    const uiElements = ['chat-controls', 'player-stats-panel'];
    uiElements.forEach(element => {
        const el = document.getElementById(element);
        if (el) el.classList.add('hidden');
    });
    
    // Show the requested view
    const viewElement = document.getElementById(viewName);
    if (viewElement) viewElement.classList.remove('hidden');
    
    // Show additional elements based on the current view
    if (viewName === 'chat-interface') {
        const chatControls = document.getElementById('chat-controls');
        if (chatControls) chatControls.classList.remove('hidden');
    }
    
    // Update state
    window.state.currentView = viewName;
    
    // Trigger a custom event for modules to respond to view changes
    document.dispatchEvent(new CustomEvent('viewChanged', {
        detail: { view: viewName }
    }));
}
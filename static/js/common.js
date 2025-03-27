/**
 * common.js - Common utility functions shared across multiple pages
 */

// Theme handling
function initTheme() {
    const themeToggle = document.getElementById('theme-toggle');
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
    
    // Check for saved theme preference or use system preference
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDarkScheme.matches)) {
        document.body.classList.add('dark-mode');
        updateThemeIcon(true);
    } else {
        document.body.classList.remove('dark-mode');
        updateThemeIcon(false);
    }
    
    // Theme toggle button event listener
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            const isDarkMode = document.body.classList.contains('dark-mode');
            
            // Save preference to localStorage
            localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
            
            // Update icon
            updateThemeIcon(isDarkMode);
        });
    }
}

function updateThemeIcon(isDarkMode) {
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        const icon = themeToggle.querySelector('i');
        if (icon) {
            if (isDarkMode) {
                icon.className = 'fas fa-sun';
            } else {
                icon.className = 'fas fa-moon';
            }
        }
    }
}

// Notification system
function showNotification(message, type = 'info', duration = 5000) {
    // Create notification element if it doesn't exist
    let notification = document.getElementById('notification');
    
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'notification';
        document.body.appendChild(notification);
    }
    
    // Clear any existing timeout
    if (window.notificationTimeout) {
        clearTimeout(window.notificationTimeout);
    }
    
    // Set notification content and type
    notification.textContent = message;
    notification.className = `notification ${type}`;
    
    // Show notification
    notification.classList.add('show');
    
    // Auto-hide after duration
    window.notificationTimeout = setTimeout(() => {
        notification.classList.remove('show');
    }, duration);
}

// Settings button handler
function initSettings() {
    const settingsBtn = document.getElementById('settings-btn');
    
    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
            // This would open settings modal in a full implementation
            showNotification('Settings feature coming soon!', 'info');
        });
    }
}

// Back button handler (for subpages)
function initBackButton() {
    const backToHome = document.getElementById('back-to-home');
    
    if (backToHome) {
        backToHome.addEventListener('click', () => {
            // Check for unsaved changes if the function exists
            if (typeof checkUnsavedChanges === 'function') {
                if (!checkUnsavedChanges()) {
                    return;
                }
            }
            window.location.href = '/static/index.html';
        });
    }
}

// Loader overlay functionality
function showLoader(message = 'Loading...') {
    const loader = document.getElementById('loader-overlay');
    const messageElement = document.getElementById('loader-message');
    
    if (loader && messageElement) {
        messageElement.textContent = message;
        loader.classList.remove('hidden');
    }
}

function hideLoader() {
    const loader = document.getElementById('loader-overlay');
    if (loader) {
        loader.classList.add('hidden');
    }
}

// API utilities
async function fetchWithErrorHandling(url, options = {}) {
    try {
        const response = await fetch(url, options);
        
        let responseText;
        try {
            responseText = await response.text();
        } catch (error) {
            console.error('Error reading response text:', error);
            throw new Error('Failed to read response');
        }
        
        if (!response.ok) {
            console.error('API error response:', responseText);
            if (responseText.includes('ValueError:') || responseText.includes('<!doctype html>')) {
                // Likely a server-side error
                throw new Error(`Server error. Please try again later.`);
            } else {
                throw new Error(`Request failed: ${responseText}`);
            }
        }
        
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (error) {
            console.error('Error parsing JSON response:', error, 'Raw response:', responseText);
            throw new Error('Received invalid JSON response');
        }
        
        return data;
    } catch (error) {
        console.error('Fetch error:', error);
        throw error;
    }
}

// AI API utilities
async function generateText(prompt, systemPrompt = null, temperature = 0.7) {
    const requestData = {
        prompt: prompt,
        temperature: temperature
    };
    
    if (systemPrompt) {
        requestData.system_prompt = systemPrompt;
    }
    
    const data = await fetchWithErrorHandling('/api/generate-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
    });
    
    return data.text;
}

async function generateJSON(prompt, systemPrompt = null, temperature = 0.7) {
    const requestData = {
        prompt: prompt,
        temperature: temperature
    };
    
    if (systemPrompt) {
        requestData.system_prompt = systemPrompt;
    }
    
    return await fetchWithErrorHandling('/api/generate-json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
    });
}

// Form utilities
function collectFormData(formSelector = 'form') {
    const form = document.querySelector(formSelector);
    if (!form) return {};
    
    const formData = {};
    const elements = form.elements;
    
    for (let i = 0; i < elements.length; i++) {
        const element = elements[i];
        
        // Skip buttons and elements without names
        if (!element.name || element.type === 'button' || element.type === 'submit') {
            continue;
        }
        
        // Handle different input types
        if (element.type === 'checkbox') {
            formData[element.name] = element.checked;
        } else if (element.type === 'radio') {
            if (element.checked) {
                formData[element.name] = element.value;
            }
        } else if (element.tagName === 'SELECT' && element.multiple) {
            const selectedOptions = Array.from(element.selectedOptions).map(option => option.value);
            formData[element.name] = selectedOptions;
        } else {
            formData[element.name] = element.value;
        }
    }
    
    return formData;
}

function populateForm(formData, formSelector = 'form') {
    const form = document.querySelector(formSelector);
    if (!form) return;
    
    // Iterate through form elements
    const elements = form.elements;
    
    for (let i = 0; i < elements.length; i++) {
        const element = elements[i];
        
        // Skip elements without names
        if (!element.name || !(element.name in formData)) {
            continue;
        }
        
        const value = formData[element.name];
        
        // Handle different input types
        if (element.type === 'checkbox') {
            element.checked = Boolean(value);
        } else if (element.type === 'radio') {
            element.checked = (element.value === value);
        } else if (element.tagName === 'SELECT' && element.multiple && Array.isArray(value)) {
            for (let j = 0; j < element.options.length; j++) {
                element.options[j].selected = value.includes(element.options[j].value);
            }
        } else {
            element.value = value;
        }
    }
}

// Initialize common elements
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initSettings();
    initBackButton();
});

// Make utility functions available globally
window.utils = {
    showNotification,
    showLoader,
    hideLoader,
    fetchWithErrorHandling,
    generateText,
    generateJSON,
    collectFormData,
    populateForm
}; 
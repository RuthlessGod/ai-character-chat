// settings.js - Handles application settings and configuration

// Initialize settings UI
async function initializeSettings() {
    if (window.elements.apiKeyInput) {
        window.elements.apiKeyInput.value = window.state.settings.apiKey || '';
    }
    
    if (window.elements.localModelUrl) {
        window.elements.localModelUrl.value = window.state.settings.localModelUrl || 'http://localhost:11434/api/generate';
    }
    
    if (window.elements.localModelToggle) {
        window.elements.localModelToggle.checked = window.state.settings.useLocalModel || false;
        window.elements.localModelUrl.disabled = !window.elements.localModelToggle.checked;
    }
    
    // Try to fetch models from API
    try {
        const response = await fetch(`${window.API.BASE_URL}${window.API.MODELS}`);
        if (response.ok) {
            const data = await response.json();
            
            if (data.success && data.models && data.models.length > 0 && window.elements.modelSelect) {
                window.elements.modelSelect.innerHTML = '';
                
                // Group models by provider
                const providers = {};
                data.models.forEach(model => {
                    const provider = model.id === 'local' ? 'Local' : model.id.split('/')[0];
                    if (!providers[provider]) {
                        providers[provider] = [];
                    }
                    providers[provider].push(model);
                });
                
                // Sort providers
                const sortedProviders = Object.keys(providers).sort((a, b) => {
                    if (a === 'Local') return 1;
                    if (b === 'Local') return -1;
                    return a.localeCompare(b);
                });
                
                // Add options
                sortedProviders.forEach(provider => {
                    // Skip creating an optgroup for the local model
                    if (provider === 'Local' && providers[provider].length === 1) {
                        const model = providers[provider][0];
                        const option = document.createElement('option');
                        option.value = model.id;
                        option.textContent = model.name;
                        window.elements.modelSelect.appendChild(option);
                        return;
                    }
                    
                    const group = document.createElement('optgroup');
                    group.label = provider.charAt(0).toUpperCase() + provider.slice(1);
                    
                    providers[provider].forEach(model => {
                        const option = document.createElement('option');
                        option.value = model.id;
                        
                        // Format the display name
                        let displayName = model.name;
                        if (model.context_length) {
                            displayName += ` (${Math.round(model.context_length / 1000)}K)`;
                        }
                        
                        option.textContent = displayName;
                        
                        // Add pricing as title if available
                        if (model.pricing && model.pricing.prompt) {
                            const promptPrice = model.pricing.prompt;
                            const completionPrice = model.pricing.completion;
                            option.title = `Prompt: $${promptPrice}/M tokens, Completion: $${completionPrice}/M tokens`;
                        }
                        
                        group.appendChild(option);
                    });
                    
                    window.elements.modelSelect.appendChild(group);
                });
                
                // Set saved model if exists
                if (window.state.settings.model) {
                    const modelExists = Array.from(window.elements.modelSelect.options).some(
                        option => option.value === window.state.settings.model
                    );
                    
                    if (modelExists) {
                        window.elements.modelSelect.value = window.state.settings.model;
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error fetching models:', error);
    }
    
    // Set other settings if elements exist
    if (window.elements.themeSelect) window.elements.themeSelect.value = window.state.settings.theme;
    if (window.elements.fontSizeSelect) window.elements.fontSizeSelect.value = window.state.settings.fontSize;
    if (window.elements.messageDisplaySelect) window.elements.messageDisplaySelect.value = window.state.settings.messageDisplay;
    if (window.elements.temperatureSlider) window.elements.temperatureSlider.value = window.state.settings.temperature;
    if (window.elements.responseLengthSelect) window.elements.responseLengthSelect.value = window.state.settings.responseLength;
    if (window.elements.systemPromptTemplate) window.elements.systemPromptTemplate.value = window.state.settings.systemPromptTemplate || '';
    if (window.elements.conversationMemorySelect) window.elements.conversationMemorySelect.value = window.state.settings.conversationMemory;
    if (window.elements.interactionModeSelect) window.elements.interactionModeSelect.value = window.state.settings.interactionMode || 'simple';
}

// Open settings modal
function openSettingsModal() {
    if (!window.elements.settingsModal) return;
    
    // Load prompt templates
    window.promptTemplates.loadPromptTemplates();
    
    // Reset to first tab
    const firstTab = document.querySelector('.tabs .tab[data-tab="general"]');
    if (firstTab) {
        firstTab.click();
    }
    
    window.elements.settingsModal.classList.remove('hidden');
}

// Fix for Settings Modal Tab Functionality

// Function to initialize prompts category selection
function initializePromptsCategorySelection() {
    console.log('Initializing prompts category selection');
    
    // Template category selector
    const templateCategorySelector = document.getElementById('template-category');
    const templateCategories = document.querySelectorAll('.template-category');
    
    if (templateCategorySelector) {
        // Remove existing event listeners by cloning
        const newSelector = templateCategorySelector.cloneNode(true);
        if (templateCategorySelector.parentNode) {
            templateCategorySelector.parentNode.replaceChild(newSelector, templateCategorySelector);
        }
        
        // Add new event listener
        newSelector.addEventListener('change', function() {
            const selectedCategory = this.value;
            console.log(`Selected category: ${selectedCategory}`);
            
            // Hide all categories
            templateCategories.forEach(category => {
                category.classList.add('hidden');
            });
            
            // Show selected category
            const activeCategory = document.getElementById(`category-${selectedCategory}`);
            if (activeCategory) {
                activeCategory.classList.remove('hidden');
                
                // Find and click the first tab in this category to ensure proper initialization
                const firstTab = activeCategory.querySelector('.tabs-inner .tab');
                if (firstTab) {
                    firstTab.click();
                }
            }
        });
        
        // Fix inner tabs for template categories
        templateCategories.forEach(category => {
            const innerTabs = category.querySelectorAll('.tabs-inner .tab');
            const innerContents = category.querySelectorAll('.tab-inner-content');
            
            innerTabs.forEach(tab => {
                // Remove existing event listeners
                const newTab = tab.cloneNode(true);
                if (tab.parentNode) {
                    tab.parentNode.replaceChild(newTab, tab);
                }
                
                // Add new event listener
                newTab.addEventListener('click', function() {
                    const tabName = this.getAttribute('data-tab-inner');
                    console.log(`Clicking inner tab: ${tabName}`);
                    
                    // Update active tabs in this category
                    const parentTabs = this.closest('.tabs-inner').querySelectorAll('.tab');
                    parentTabs.forEach(t => t.classList.remove('active'));
                    this.classList.add('active');
                    
                    // Get container category to scope content selection
                    const parentCategory = this.closest('.template-category');
                    
                    // Update active content in this category
                    const categoryContents = parentCategory.querySelectorAll('.tab-inner-content');
                    categoryContents.forEach(content => {
                        content.classList.add('hidden');
                        content.classList.remove('active');
                    });
                    
                    const activeContent = document.getElementById(`tab-inner-${tabName}`);
                    if (activeContent) {
                        activeContent.classList.remove('hidden');
                        activeContent.classList.add('active');
                    }
                });
            });
        });
        
        // Trigger the selector to show the first category
        newSelector.dispatchEvent(new Event('change'));
    }
}

// Function to bind prompt button events
function bindPromptButtonEvents() {
    const savePromptsBtn = document.getElementById('save-prompts-btn');
    const resetPromptsBtn = document.getElementById('reset-prompts-btn');
    const previewPromptBtn = document.getElementById('preview-prompt-btn');
    
    if (savePromptsBtn) {
        // Remove existing listeners
        const newSavePromptsBtn = savePromptsBtn.cloneNode(true);
        if (savePromptsBtn.parentNode) {
            savePromptsBtn.parentNode.replaceChild(newSavePromptsBtn, savePromptsBtn);
        }
        
        // Add new click handler
        newSavePromptsBtn.addEventListener('click', function() {
            if (window.promptTemplates && window.promptTemplates.savePromptTemplates) {
                window.promptTemplates.savePromptTemplates();
            } else {
                console.warn("savePromptTemplates function not found");
            }
        });
    }
    
    if (resetPromptsBtn) {
        // Remove existing listeners
        const newResetPromptsBtn = resetPromptsBtn.cloneNode(true);
        if (resetPromptsBtn.parentNode) {
            resetPromptsBtn.parentNode.replaceChild(newResetPromptsBtn, resetPromptsBtn);
        }
        
        // Add new click handler
        newResetPromptsBtn.addEventListener('click', function() {
            if (window.promptTemplates && window.promptTemplates.resetPromptTemplates) {
                window.promptTemplates.resetPromptTemplates();
            } else {
                console.warn("resetPromptTemplates function not found");
            }
        });
    }
    
    if (previewPromptBtn) {
        // Remove existing listeners
        const newPreviewPromptBtn = previewPromptBtn.cloneNode(true);
        if (previewPromptBtn.parentNode) {
            previewPromptBtn.parentNode.replaceChild(newPreviewPromptBtn, previewPromptBtn);
        }
        
        // Add new click handler
        newPreviewPromptBtn.addEventListener('click', function() {
            if (window.promptTemplates && window.promptTemplates.previewPrompt) {
                window.promptTemplates.previewPrompt();
            } else {
                console.warn("previewPrompt function not found");
            }
        });
    }
}

// Function to initialize prompts category selection
// Function to initialize prompts category selection
function initializePromptsCategorySelection() {
    console.log('Initializing prompts category selection');
    
    // Template category selector
    const templateCategorySelector = document.getElementById('template-category');
    const templateCategories = document.querySelectorAll('.template-category');
    
    if (templateCategorySelector) {
        // Remove existing event listeners by cloning
        const newSelector = templateCategorySelector.cloneNode(true);
        if (templateCategorySelector.parentNode) {
            templateCategorySelector.parentNode.replaceChild(newSelector, templateCategorySelector);
        }
        
        // Add new event listener
        newSelector.addEventListener('change', function() {
            const selectedCategory = this.value;
            console.log(`Selected category: ${selectedCategory}`);
            
            // Hide all categories
            templateCategories.forEach(category => {
                category.classList.add('hidden');
            });
            
            // Show selected category
            const activeCategory = document.getElementById(`category-${selectedCategory}`);
            if (activeCategory) {
                activeCategory.classList.remove('hidden');
                
                // Find and click the first tab in this category to ensure proper initialization
                const firstTab = activeCategory.querySelector('.tabs-inner .tab');
                if (firstTab) {
                    firstTab.click();
                }
            }
        });
        
        // Fix inner tabs for template categories
        templateCategories.forEach(category => {
            const innerTabs = category.querySelectorAll('.tabs-inner .tab');
            const innerContents = category.querySelectorAll('.tab-inner-content');
            
            innerTabs.forEach(tab => {
                // Remove existing event listeners
                const newTab = tab.cloneNode(true);
                if (tab.parentNode) {
                    tab.parentNode.replaceChild(newTab, tab);
                }
                
                // Add new event listener
                newTab.addEventListener('click', function() {
                    const tabName = this.getAttribute('data-tab-inner');
                    console.log(`Clicking inner tab: ${tabName}`);
                    
                    // Update active tabs in this category
                    const parentTabs = this.closest('.tabs-inner').querySelectorAll('.tab');
                    parentTabs.forEach(t => t.classList.remove('active'));
                    this.classList.add('active');
                    
                    // Get container category to scope content selection
                    const parentCategory = this.closest('.template-category');
                    
                    // Update active content in this category
                    const categoryContents = parentCategory.querySelectorAll('.tab-inner-content');
                    categoryContents.forEach(content => {
                        content.classList.add('hidden');
                        content.classList.remove('active');
                    });
                    
                    const activeContent = document.getElementById(`tab-inner-${tabName}`);
                    if (activeContent) {
                        activeContent.classList.remove('hidden');
                        activeContent.classList.add('active');
                    }
                });
            });
        });
        
        // Trigger the selector to show the first category
        newSelector.dispatchEvent(new Event('change'));
    }
}

// Fix for Settings Modal Tab Functionality
function fixSettingsModalTabs() {
    console.log('Fixing settings modal tabs');
    
    // Get the settings modal
    const settingsModal = document.getElementById('settings-modal');
    if (!settingsModal) {
        console.warn('Settings modal not found');
        return;
    }
    
    // Fix tab switching
    const tabs = settingsModal.querySelectorAll('.tabs .tab');
    const tabContents = settingsModal.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => {
        // Remove existing event listeners by cloning and replacing
        const newTab = tab.cloneNode(true);
        if (tab.parentNode) {
            tab.parentNode.replaceChild(newTab, tab);
        }
        
        // Add new event listener
        newTab.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            console.log(`Settings: Clicking tab ${tabName}`);
            
            // Update active tabs
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // Show corresponding content
            tabContents.forEach(content => {
                content.classList.add('hidden');
                content.classList.remove('active');
            });
            
            const activeContent = document.getElementById(`tab-${tabName}`);
            if (activeContent) {
                activeContent.classList.remove('hidden');
                activeContent.classList.add('active');
                
                // If this is the prompts tab, initialize category selection
                if (tabName === 'prompts') {
                    // Wait a brief moment to ensure DOM is ready
                    setTimeout(initializePromptsCategorySelection, 50);
                }
            }
        });
    });
    
    // Fix save/cancel buttons
    const saveBtn = document.getElementById('settings-save-btn');
    const cancelBtn = document.getElementById('settings-cancel-btn');
    const closeBtn = document.getElementById('settings-modal-close');
    
    if (saveBtn) {
        // Remove existing listeners
        const newSaveBtn = saveBtn.cloneNode(true);
        if (saveBtn.parentNode) {
            saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);
        }
        
        // Add new click handler
        newSaveBtn.addEventListener('click', function() {
            saveSettings();
            closeSettingsModal();
        });
    }
    
    if (cancelBtn) {
        // Remove existing listeners
        const newCancelBtn = cancelBtn.cloneNode(true);
        if (cancelBtn.parentNode) {
            cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
        }
        
        // Add new click handler
        newCancelBtn.addEventListener('click', closeSettingsModal);
    }
    
    if (closeBtn) {
        // Remove existing listeners
        const newCloseBtn = closeBtn.cloneNode(true);
        if (closeBtn.parentNode) {
            closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
        }
        
        // Add new click handler
        newCloseBtn.addEventListener('click', closeSettingsModal);
    }
    
    // Fix prompts-specific buttons
    bindPromptButtonEvents();
    
    console.log('Settings modal tabs fixed');
}

// Function to close settings modal
function closeSettingsModal() {
    const settingsModal = document.getElementById('settings-modal');
    if (settingsModal) {
        settingsModal.classList.add('hidden');
    }
}

// Load settings into modal
function loadSettingsIntoModal() {
    // Set API key
    if (window.elements.apiKeyInput) {
        window.elements.apiKeyInput.value = window.state.settings.apiKey || '';
    }
    
    // Set local model settings
    if (window.elements.localModelUrl) {
        window.elements.localModelUrl.value = window.state.settings.localModelUrl || 'http://localhost:11434/api/generate';
    }
    
    if (window.elements.localModelToggle) {
        window.elements.localModelToggle.checked = window.state.settings.useLocalModel || false;
        
        // Enable/disable the URL input based on toggle
        if (window.elements.localModelUrl) {
            window.elements.localModelUrl.disabled = !window.elements.localModelToggle.checked;
        }
    }
    
    // Set other settings
    if (window.elements.themeSelect) window.elements.themeSelect.value = window.state.settings.theme || 'light';
    
    const fontSizeSelect = document.querySelector('select[name="font-size"]');
    if (fontSizeSelect) fontSizeSelect.value = window.state.settings.fontSize || 'medium';
    
    const messageDisplaySelect = document.querySelector('select[name="message-display"]');
    if (messageDisplaySelect) messageDisplaySelect.value = window.state.settings.messageDisplay || 'bubbles';
    
    const temperatureSlider = document.querySelector('input[type="range"][name="temperature"]');
    if (temperatureSlider) temperatureSlider.value = window.state.settings.temperature || 0.7;
    
    const responseLengthSelect = document.querySelector('select[name="response-length"]');
    if (responseLengthSelect) responseLengthSelect.value = window.state.settings.responseLength || 'medium';
    
    const systemPromptTemplate = document.querySelector('textarea[name="system-prompt"]');
    if (systemPromptTemplate) systemPromptTemplate.value = window.state.settings.systemPromptTemplate || '';
    
    const conversationMemorySelect = document.querySelector('select[name="conversation-memory"]');
    if (conversationMemorySelect) conversationMemorySelect.value = window.state.settings.conversationMemory || '10';
    
    const interactionModeSelect = document.querySelector('select[name="interaction-mode"]');
    if (interactionModeSelect) interactionModeSelect.value = window.state.settings.interactionMode || 'simple';
    
    // Set model select if it exists
    if (window.elements.modelSelect) {
        try {
            window.elements.modelSelect.value = window.state.settings.model || 'openai/gpt-3.5-turbo';
        } catch (e) {
            console.warn('Could not set model selection:', e);
        }
    }
}

// Function to open settings modal with proper prompt template handling
function openEnhancedSettingsModal() {
    const settingsModal = document.getElementById('settings-modal');
    if (!settingsModal) {
        console.warn("Settings modal not found");
        return;
    }
    
    // Make sure modal is visible
    settingsModal.classList.remove('hidden');
    
    // Load current settings
    loadSettingsIntoModal();
    
    // Load prompt templates into UI
    if (window.promptTemplates) {
        if (window.promptTemplates.loadPromptTemplates) {
            window.promptTemplates.loadPromptTemplates()
                .then(() => {
                    console.log("loadPromptTemplates completed, loading into UI");
                    if (window.promptTemplates.loadPromptTemplatesIntoUI) {
                        window.promptTemplates.loadPromptTemplatesIntoUI();
                    } else {
                        console.warn("loadPromptTemplatesIntoUI function not found");
                    }
                })
                .catch(error => {
                    console.error('Error loading prompt templates:', error);
                });
        } else {
            console.warn("loadPromptTemplates function not found");
        }
    } else {
        console.warn("promptTemplates module not found");
    }
    
    // Fix the tabs
    fixSettingsModalTabs();
    
    // Start on the first tab
    const firstTab = settingsModal.querySelector('.tabs .tab[data-tab="general"]');
    if (firstTab) {
        firstTab.click();
    }
}




// Save settings
async function saveSettings() {
    console.log('Saving settings...');
    
    // Get value from settings elements
    const apiKey = document.getElementById('api-key-input') ? document.getElementById('api-key-input').value.trim() : '';
    const model = document.getElementById('model-select') ? document.getElementById('model-select').value : 'deepseek/deepseek-llm-7b-chat';
    const localModelUrl = document.getElementById('local-model-url') ? document.getElementById('local-model-url').value.trim() : '';
    const useLocalModel = document.getElementById('local-model-toggle') ? document.getElementById('local-model-toggle').checked : false;
    
    // Theme and other settings
    const theme = document.getElementById('theme-select') ? document.getElementById('theme-select').value : 'light';
    const fontSizeSelect = document.querySelector('select[name="font-size"]');
    const messageDisplaySelect = document.querySelector('select[name="message-display"]');
    const temperatureSlider = document.querySelector('input[type="range"][name="temperature"]');
    const responseLengthSelect = document.querySelector('select[name="response-length"]');
    const conversationMemorySelect = document.querySelector('select[name="conversation-memory"]');
    const interactionModeSelect = document.querySelector('select[name="interaction-mode"]');
    
    // Gather all settings
    const newSettings = {
        apiKey,
        model,
        localModelUrl,
        useLocalModel,
        theme
    };
    
    // Add optional settings if elements exist
    if (fontSizeSelect) newSettings.fontSize = fontSizeSelect.value;
    if (messageDisplaySelect) newSettings.messageDisplay = messageDisplaySelect.value;
    if (temperatureSlider) newSettings.temperature = temperatureSlider.value;
    if (responseLengthSelect) newSettings.responseLength = responseLengthSelect.value;
    if (conversationMemorySelect) newSettings.conversationMemory = conversationMemorySelect.value;
    if (interactionModeSelect) newSettings.interactionMode = interactionModeSelect.value;
    
    // Test the connection if apiKey is provided and model isn't local
    if (apiKey && model !== 'local') {
        try {
            if (window.utils && window.utils.showLoading) {
                window.utils.showLoading();
            }
            
            const testData = {
                apiKey: apiKey,
                model: model
            };
            
            const response = await fetch(`${window.API.BASE_URL}${window.API.TEST_CONNECTION}`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(testData)
            });
            
            const result = await response.json();
            
            if (!result.success) {
                if (window.utils && window.utils.hideLoading) {
                    window.utils.hideLoading();
                }
                if (confirm(`Connection test failed: ${result.message}\n\nDo you want to save these settings anyway?`)) {
                    // Continue with save if user confirms
                } else {
                    return; // Don't save if user cancels
                }
            }
        } catch (error) {
            if (window.utils && window.utils.hideLoading) {
                window.utils.hideLoading();
            }
            if (confirm(`Could not test connection: ${error.message}\n\nDo you want to save these settings anyway?`)) {
                // Continue with save if user confirms
            } else {
                return; // Don't save if user cancels
            }
        } finally {
            if (window.utils && window.utils.hideLoading) {
                window.utils.hideLoading();
            }
        }
    }
    
    // Save settings to state
    Object.assign(window.state.settings, newSettings);
    
    // Save to localStorage
    for (const [key, value] of Object.entries(newSettings)) {
        localStorage.setItem(key, value);
    }
    
    // Update view mode if it changed
    if (newSettings.interactionMode && window.theme && window.theme.setViewMode) {
        window.theme.setViewMode(newSettings.interactionMode);
    } else if (newSettings.interactionMode) {
        // Fallback if theme module is not available
        document.body.className = document.body.className.replace(/simple-mode|novel-mode|cinematic-mode/g, '');
        document.body.classList.add(newSettings.interactionMode + '-mode');
    }
    
    // Apply settings changes
    if (window.theme && window.theme.applySettings) {
        window.theme.applySettings();
    } else {
        // Apply theme if theme module is not available
        document.body.classList.toggle('dark-mode', newSettings.theme === 'dark');
    }
    
    // Close the modal
    const settingsModal = document.getElementById('settings-modal');
    if (settingsModal) {
        settingsModal.classList.add('hidden');
    }
    
    // Show notification
    if (window.utils && window.utils.showNotification) {
        window.utils.showNotification('Settings saved successfully!', 'success');
    } else {
        alert('Settings saved successfully!');
    }
    
    console.log('Settings saved:', newSettings);
}


// Test API connection
async function testConnection() {
    const apiKey = window.elements.apiKeyInput ? window.elements.apiKeyInput.value.trim() : '';
    const model = window.elements.modelSelect ? window.elements.modelSelect.value : 'openai/gpt-3.5-turbo';
    const localModelUrl = window.elements.localModelUrl ? window.elements.localModelUrl.value.trim() : '';
    
    if (!apiKey && model !== 'local') {
        window.utils.showNotification('Please enter an API key to test the connection.', 'warning');
        return;
    }
    
    try {
        window.utils.showLoading();
        
        const testData = {
            apiKey: apiKey,
            model: model
        };
        
        if (model === 'local') {
            testData.localModelUrl = localModelUrl;
        }
        
        const response = await fetch(`${window.API.BASE_URL}${window.API.TEST_CONNECTION}`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(testData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            window.utils.showNotification('Connection successful!', 'success');
        } else {
            window.utils.showNotification(`Connection failed: ${result.message}`, 'error');
        }
    } catch (error) {
        console.error('Error testing connection:', error);
        window.utils.showNotification(`Error testing connection: ${error.message}`, 'error');
    } finally {
        window.utils.hideLoading();
    }
}

// Function to clear all character data with confirmation
function clearAllCharacterData() {
    // This would need to be implemented based on your app's data structure
    // For example, clearing localStorage items related to characters
    console.log('Clearing all character data');
    
    try {
        // Clear character-related data from localStorage
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('character-') || key === 'characters' || key === 'currentCharacter') {
                localStorage.removeItem(key);
            }
        }
        
        // Make API call to clear character data on the server
        fetch(`${window.API.BASE_URL}/api/characters/clear-all`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'}
        })
        .then(response => {
            if (response.ok) {
                window.utils.showNotification('All character data has been cleared successfully.', 'success');
                
                // Reset character state
                window.state.characters = [];
                window.state.currentCharacter = null;
                
                // Update UI - hide chat, show welcome
                if (window.elements.welcomeScreen && window.elements.chatInterface) {
                    window.elements.welcomeScreen.classList.remove('hidden');
                    window.elements.chatInterface.classList.add('hidden');
                }
                
                // Update character list
                window.character.renderCharacterList();
            } else {
                window.utils.showNotification('Error clearing character data on the server.', 'error');
            }
        })
        .catch(error => {
            console.error('Error clearing character data:', error);
            window.utils.showNotification('Error clearing character data.', 'error');
        });
        
    } catch (error) {
        console.error('Error clearing character data:', error);
        window.utils.showNotification('Error clearing character data.', 'error');
    }
}

// Separate function for binding settings events
function bindSettingsEvents() {
    console.log('Binding settings events');
    
    // Get save and cancel buttons
    const saveBtn = document.getElementById('settings-save-btn');
    const cancelBtn = document.getElementById('settings-cancel-btn');
    const closeBtn = document.getElementById('settings-modal-close');
    
    // Bind save button
    if (saveBtn) {
        saveBtn.addEventListener('click', function() {
            console.log('Save settings button clicked');
            saveSettings();
        });
    } else {
        console.warn('Settings save button not found');
    }
    
    // Bind cancel button
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            console.log('Cancel settings button clicked');
            closeSettingsModal();
        });
    }
    
    // Bind close button
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            console.log('Close settings button clicked');
            closeSettingsModal();
        });
    }
    
    // Bind settings button
    if (window.elements.settingsBtn) {
        window.elements.settingsBtn.addEventListener('click', openEnhancedSettingsModal);
    }
    
    // Bind test connection button
    if (window.elements.testConnectionBtn) {
        window.elements.testConnectionBtn.addEventListener('click', testConnection);
    }
    
    // Find and bind data clear button in settings
    const clearDataBtn = document.getElementById('clear-character-data-btn');
    if (clearDataBtn) {
        clearDataBtn.addEventListener('click', function() {
            if (confirm('Are you sure you want to clear all character data? This cannot be undone.')) {
                clearAllCharacterData();
            }
        });
    }
    
    console.log('Settings events bound');
}

// Main initialization function
function initSettings() {
    console.log('Initializing settings module...');
    
    // Initialize settings
    initializeSettings();
    
    // Bind event listeners
    bindSettingsEvents();
}

// Initialize settings
function initSettings() {
    console.log('Initializing settings module...');
    
    // Initialize settings
    initializeSettings();
    
    // Bind event listeners
    if (window.elements.settingsBtn) {
        window.elements.settingsBtn.addEventListener('click', openEnhancedSettingsModal);
    }
    
    if (window.elements.settingsModalClose) {
        window.elements.settingsModalClose.addEventListener('click', () => window.utils.closeModal(window.elements.settingsModal));
    }
    
    if (window.elements.settingsSaveBtn) {
        window.elements.settingsSaveBtn.addEventListener('click', saveSettings);
    }
    
    if (window.elements.settingsCancelBtn) {
        window.elements.settingsCancelBtn.addEventListener('click', () => window.utils.closeModal(window.elements.settingsModal));
    }
    
    if (window.elements.testConnectionBtn) {
        window.elements.testConnectionBtn.addEventListener('click', testConnection);
    }
    
    // Find and bind data clear button in settings
    const clearDataBtn = document.getElementById('clear-character-data-btn');
    if (clearDataBtn) {
        clearDataBtn.addEventListener('click', function() {
            if (confirm('Are you sure you want to clear all character data? This cannot be undone.')) {
                clearAllCharacterData();
            }
        });
    }
}

// Expose settings functions
window.settings = {
    init: initSettings,
    openSettingsModal: openEnhancedSettingsModal,
    saveSettings: saveSettings,
    testConnection: testConnection,
    clearAllCharacterData: clearAllCharacterData
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initSettings);
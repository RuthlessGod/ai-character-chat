////////////////////////////////////////////////////////////
// MODULE 1: APPLICATION CORE & INITIALIZATION
////////////////////////////////////////////////////////////
// This module handles the core state management and initialization
// of the application.

// Main application JavaScript
document.addEventListener('DOMContentLoaded', () => {

// Add this JavaScript to your app.js file or paste it in browser console

(function() {
    console.log("Applying chat scrolling enhancements");
    
    // Fix 1: Enhanced scroll to bottom function
    window.scrollToBottom = function() {
      const chatMessages = document.getElementById('chat-messages');
      if (chatMessages) {
        chatMessages.scrollTop = chatMessages.scrollHeight;
        console.log("Scrolled to bottom, height:", chatMessages.scrollHeight);
      }
    };
    
    // Fix 2: Add scroll event listener to detect when user scrolls up
    const chatMessages = document.getElementById('chat-messages');
    if (chatMessages) {
      let userHasScrolledUp = false;
      
      chatMessages.addEventListener('scroll', function() {
        const isAtBottom = chatMessages.scrollHeight - chatMessages.scrollTop <= chatMessages.clientHeight + 50;
        
        if (!isAtBottom) {
          userHasScrolledUp = true;
          
          // Optionally add a "scroll to bottom" button when scrolled up
          if (!document.getElementById('scroll-to-bottom-btn')) {
            const scrollBtn = document.createElement('button');
            scrollBtn.id = 'scroll-to-bottom-btn';
            scrollBtn.className = 'scroll-to-bottom-btn';
            scrollBtn.innerHTML = '<i class="fas fa-arrow-down"></i>';
            scrollBtn.onclick = function() {
              scrollToBottom();
              this.remove();
            };
            
            // Apply styles to the button
            scrollBtn.style.position = 'fixed';
            scrollBtn.style.bottom = '180px';
            scrollBtn.style.right = '20px';
            scrollBtn.style.width = '40px';
            scrollBtn.style.height = '40px';
            scrollBtn.style.borderRadius = '50%';
            scrollBtn.style.backgroundColor = 'var(--primary-color)';
            scrollBtn.style.color = 'white';
            scrollBtn.style.border = 'none';
            scrollBtn.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
            scrollBtn.style.cursor = 'pointer';
            scrollBtn.style.zIndex = '1000';
            scrollBtn.style.display = 'flex';
            scrollBtn.style.alignItems = 'center';
            scrollBtn.style.justifyContent = 'center';
            
            document.body.appendChild(scrollBtn);
          }
        } else {
          userHasScrolledUp = false;
          
          // Remove scroll to bottom button if we're at the bottom
          const scrollBtn = document.getElementById('scroll-to-bottom-btn');
          if (scrollBtn) scrollBtn.remove();
        }
      });
      
      // Fix 3: Modify addCharacterMessage and addUserMessage to respect scroll position
      const originalAddCharacterMessage = window.addCharacterMessage;
      if (originalAddCharacterMessage) {
        window.addCharacterMessage = function(text, metadata) {
          originalAddCharacterMessage(text, metadata);
          
          // Only auto-scroll if user hasn't manually scrolled up
          if (!userHasScrolledUp) {
            scrollToBottom();
          }
        };
      }
      
      const originalAddUserMessage = window.addUserMessage;
      if (originalAddUserMessage) {
        window.addUserMessage = function(text) {
          originalAddUserMessage(text);
          
          // Always scroll to bottom for user messages
          scrollToBottom();
          
          // Reset the scroll flag when user sends a message
          userHasScrolledUp = false;
        };
      }
    }
    
    // Fix 4: Resize function to handle window resize events
    function handleResize() {
      const chatMessages = document.getElementById('chat-messages');
      if (chatMessages) {
        const windowHeight = window.innerHeight;
        const headerHeight = document.querySelector('.chat-header')?.offsetHeight || 60;
        const controlsHeight = document.querySelector('.chat-controls-container')?.offsetHeight || 140;
        
        // Calculate and set height
        const newHeight = windowHeight - headerHeight - controlsHeight;
        chatMessages.style.height = `${newHeight}px`;
        chatMessages.style.maxHeight = `${newHeight}px`;
        
        console.log("Resized chat container:", {
          windowHeight,
          headerHeight,
          controlsHeight,
          newHeight
        });
      }
    }
    
    // Handle resize events
    window.addEventListener('resize', handleResize);
    
    // Initial call to handle resize
    setTimeout(handleResize, 100);
    
    console.log("Chat scrolling enhancements applied");
  })();

    // App state
    const state = {
        characters: [],
        currentCharacter: null,
        settings: {
            apiKey: localStorage.getItem('apiKey') || '',
            model: localStorage.getItem('model') || 'openai/gpt-3.5-turbo',
            localModelUrl: localStorage.getItem('localModelUrl') || 'http://localhost:11434/api/generate',
            theme: localStorage.getItem('theme') || 'light',
            fontSize: localStorage.getItem('fontSize') || 'medium',
            messageDisplay: localStorage.getItem('messageDisplay') || 'bubbles',
            temperature: parseFloat(localStorage.getItem('temperature') || '0.7'),
            responseLength: localStorage.getItem('responseLength') || 'medium',
            conversationMemory: parseInt(localStorage.getItem('conversationMemory') || '10'),
            interactionMode: localStorage.getItem('interactionMode') || 'simple'
        },
        ui: {
            currentTab: 'basic',
            darkMode: false,
            sidebarActive: window.innerWidth > 768
        },
        promptTemplates: {
            base_prompt: "",
            speaking_style: "",
            appearance: "",
            mood_emotions: "",
            opinion: "",
            roleplaying_instructions: "",
            response_format: ""
        }
    };
    
    // DOM Elements
    const elements = {
        // Main sections
        welcomeScreen: document.getElementById('welcome-screen'),
        chatInterface: document.getElementById('chat-interface'),
        characterList: document.getElementById('character-list'),
        sidebar: document.querySelector('.sidebar'),
        
        // Character info
        characterName: document.getElementById('character-name'),
        characterMood: document.getElementById('character-mood'),
        characterOpinion: document.getElementById('character-opinion'),
        
        // Chat elements
        chatMessages: document.getElementById('chat-messages'),
        messageInput: document.getElementById('message-input'),
        sendBtn: document.getElementById('send-btn'),
        
        // Buttons
        createCharacterBtn: document.getElementById('create-character-btn'),
        welcomeCreateBtn: document.getElementById('welcome-create-btn'),
        menuToggle: document.getElementById('menu-toggle'),
        editCharacterBtn: document.getElementById('edit-character-btn'),
        chatOptionsBtn: document.getElementById('chat-options-btn'),
        importExportBtn: document.getElementById('import-export-btn'),
        
        // Modals
        characterModal: document.getElementById('character-modal'),
        characterModalClose: document.getElementById('character-modal-close'),
        saveCharacterButton: document.getElementById('save-character-button'),
        cancelButton: document.getElementById('cancel-button'),
        
        settingsBtn: document.getElementById('settings-btn'),
        settingsModal: document.getElementById('settings-modal'),
        settingsModalClose: document.getElementById('settings-modal-close'),
        settingsSaveBtn: document.getElementById('settings-save-btn'),
        settingsCancelBtn: document.getElementById('settings-cancel-btn'),
        testConnectionBtn: document.getElementById('test-connection-btn'),
        
        // Forms
        characterNameInput: document.getElementById('character-name-input'),
        characterDescInput: document.getElementById('character-description-input'),
        characterPersonalityInput: document.getElementById('character-personality-input'),
        characterGreeting: document.getElementById('character-greeting'),
        characterCategory: document.getElementById('character-category'),
        characterAppearance: document.getElementById('character-appearance'),
        speakingStyleInput: document.getElementById('character-speaking-style'),
        
        apiKeyInput: document.getElementById('api-key-input'),
        modelSelect: document.getElementById('model-select'),
        localModelUrl: document.getElementById('local-model-url'),
        localModelToggle: document.getElementById('local-model-toggle'),
        
        // Settings
        themeSelect: document.getElementById('theme-select'),
        fontSizeSelect: document.querySelector('select[name="font-size"]'),
        messageDisplaySelect: document.querySelector('select[name="message-display"]'),
        temperatureSlider: document.querySelector('input[type="range"][name="temperature"]'),
        responseLengthSelect: document.querySelector('select[name="response-length"]'),
        systemPromptTemplate: document.querySelector('textarea[name="system-prompt"]'),
        conversationMemorySelect: document.querySelector('select[name="conversation-memory"]'),
        
        // Prompt Template elements
        savePromptsBtn: document.getElementById('save-prompts-btn'),
        resetPromptsBtn: document.getElementById('reset-prompts-btn'),
        previewPromptBtn: document.getElementById('preview-prompt-btn'),
        promptPreview: document.getElementById('prompt-preview'),
        basePromptInput: document.getElementById('base-prompt-template'),
        speakingStyleTemplate: document.getElementById('speaking-style-template'),
        moodEmotionsTemplate: document.getElementById('mood-emotions-template'),
        opinionTemplate: document.getElementById('opinion-template'),
        appearanceTemplate: document.getElementById('appearance-template'),
        roleplayingInstructionsTemplate: document.getElementById('roleplaying-instructions-template'),
        responseFormatTemplate: document.getElementById('response-format-template'),
        
        // AI generator
        aiGeneratorToggle: document.getElementById('ai-generator-toggle'),
        aiPromptInput: document.getElementById('ai-prompt-input'),
        generateCharacterButton: document.getElementById('generate-character-button'),
        generationStatus: document.getElementById('generation-status'),
        
        // Other UI elements
        tabs: document.querySelectorAll('.tab'),
        tabContents: document.querySelectorAll('.tab-content'),
        innerTabs: document.querySelectorAll('.tabs-inner .tab'),
        innerTabContents: document.querySelectorAll('.tab-inner-content'),
        toggleThemeBtn: document.getElementById('toggle-theme'),
        loadingOverlay: document.getElementById('loading-overlay'),
        chatOptionsMenu: document.getElementById('chat-options-menu'),
        
        // View mode options
        viewOptions: null,
        interactionModeSelect: null
    };
    
    // API endpoints
    const API = {
        BASE_URL: '', // Empty for same-origin requests
        CHARACTERS: '/api/characters',
        CHAT: '/api/chat',
        CHAT_HISTORY: '/api/chat/history',
        MODELS: '/api/models',
        CONFIG: '/api/config',
        TEST_CONNECTION: '/api/config/test-connection',
        GENERATE: '/api/generate-character',
        DIAGNOSTIC: '/api/diagnostic',
        PROMPTS: '/api/prompts',
        PROMPTS_DEFAULT: '/api/prompts/default',
        PROMPTS_RESET: '/api/prompts/reset'
    };
    
    // Initialize the application
    function init() {
        // Create view options
        createViewOptions();
        
        // Bind event listeners
        bindEventListeners();
        
        // Load characters
        loadCharacters();
        
        // Load prompt templates
        loadPromptTemplates();
        
        // Initialize settings and theme
        initializeSettings();
        initializeTheme();
        
        // Initialize view mode
        initializeViewMode();
    }
    
    // Initialize the app
    init();
    
    // Create view options UI
    function createViewOptions() {
        elements.viewOptions = document.createElement('div');
        elements.viewOptions.className = 'view-options';
        elements.viewOptions.innerHTML = `
            <div class="view-option" data-view="simple">Simple</div>
            <div class="view-option" data-view="novel">Novel</div>
            <div class="view-option" data-view="cinematic">Cinematic</div>
        `;
        
        // Insert view options at the top of chat messages
        if (elements.chatInterface) {
            const chatHeader = elements.chatInterface.querySelector('.chat-header');
            if (chatHeader) {
                elements.chatInterface.insertBefore(elements.viewOptions, chatHeader.nextSibling);
            }
        }
        
        // Add interaction mode to settings
        if (elements.settingsModal) {
            const viewSelector = document.createElement('div');
            viewSelector.className = 'form-group';
            viewSelector.innerHTML = `
                <label class="form-label">Interaction Display Mode</label>
                <select name="interaction-mode" class="form-input">
                    <option value="simple">Simple (Chat Only)</option>
                    <option value="novel">Novel (With Scene Descriptions)</option>
                    <option value="cinematic">Cinematic (Immersive)</option>
                </select>
            `;
            
            const generalTab = document.getElementById('tab-general');
            if (generalTab) {
                generalTab.appendChild(viewSelector);
                elements.interactionModeSelect = generalTab.querySelector('select[name="interaction-mode"]');
            }
        }
    }

    // Initialize view mode from settings
    function initializeViewMode() {
        const savedMode = state.settings.interactionMode || 'simple';
        setViewMode(savedMode);
        
        if (elements.interactionModeSelect) {
            elements.interactionModeSelect.value = savedMode;
        }
    }
    
    // Set the view mode
    function setViewMode(mode) {
        // Set in state
        state.settings.interactionMode = mode;
        
        // Remove all mode classes
        document.body.classList.remove('simple-mode', 'novel-mode', 'cinematic-mode');
        
        // Add the selected mode class
        document.body.classList.add(`${mode}-mode`);
        
        // Update view option buttons
        if (elements.viewOptions) {
            const options = elements.viewOptions.querySelectorAll('.view-option');
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













////////////////////////////////////////////////////////////
// MODULE 2: EVENT BINDING & INTERACTION
////////////////////////////////////////////////////////////
// This module handles event binding and user interactions 
// across the application.

    // Bind all event listeners
    function bindEventListeners() {
        // Character creation and management
        if (elements.createCharacterBtn) {
            elements.createCharacterBtn.addEventListener('click', openCreateCharacterModal);
        }
        
        if (elements.welcomeCreateBtn) {
            elements.welcomeCreateBtn.addEventListener('click', openCreateCharacterModal);
        }
        
        if (elements.characterModalClose) {
            elements.characterModalClose.addEventListener('click', () => closeModal(elements.characterModal));
        }
        
        if (elements.saveCharacterButton) {
            elements.saveCharacterButton.addEventListener('click', saveCharacter);
        }
        
        if (elements.cancelButton) {
            elements.cancelButton.addEventListener('click', () => closeModal(elements.characterModal));
        }
        
        // Settings
        if (elements.settingsBtn) {
            elements.settingsBtn.addEventListener('click', openSettingsModal);
        }
        
        if (elements.settingsModalClose) {
            elements.settingsModalClose.addEventListener('click', () => closeModal(elements.settingsModal));
        }
        
        if (elements.settingsSaveBtn) {
            elements.settingsSaveBtn.addEventListener('click', saveSettings);
        }
        
        if (elements.settingsCancelBtn) {
            elements.settingsCancelBtn.addEventListener('click', () => closeModal(elements.settingsModal));
        }
        
        if (elements.testConnectionBtn) {
            elements.testConnectionBtn.addEventListener('click', testConnection);
        }
        
        // Theme toggle
        if (elements.toggleThemeBtn) {
            elements.toggleThemeBtn.addEventListener('click', toggleTheme);
        }
        
        if (elements.themeSelect) {
            elements.themeSelect.addEventListener('change', (e) => {
                state.settings.theme = e.target.value;
                localStorage.setItem('theme', e.target.value);
                initializeTheme();
            });
        }
        
        // View mode toggle
        if (elements.viewOptions) {
            const options = elements.viewOptions.querySelectorAll('.view-option');
            options.forEach(option => {
                option.addEventListener('click', (e) => {
                    const mode = e.target.getAttribute('data-view');
                    setViewMode(mode);
                    
                    // Update settings select if it exists
                    if (elements.interactionModeSelect) {
                        elements.interactionModeSelect.value = mode;
                    }
                    
                    // Save to local storage
                    localStorage.setItem('interactionMode', mode);
                });
            });
        }
        
        // Settings select for interaction mode
        if (elements.interactionModeSelect) {
            elements.interactionModeSelect.addEventListener('change', (e) => {
                const mode = e.target.value;
                setViewMode(mode);
                localStorage.setItem('interactionMode', mode);
            });
        }
        
        // Mobile menu toggle
        if (elements.menuToggle) {
            elements.menuToggle.addEventListener('click', () => {
                if (elements.sidebar) {
                    elements.sidebar.classList.toggle('active');
                    state.ui.sidebarActive = elements.sidebar.classList.contains('active');
                }
            });
        }
        
        // Import/Export
        if (elements.importExportBtn) {
            elements.importExportBtn.addEventListener('click', showImportExportOptions);
        }
        
        // Chat
        if (elements.sendBtn && elements.messageInput) {
            elements.sendBtn.addEventListener('click', sendMessage);
            
            elements.messageInput.addEventListener('keydown', e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                }
            });
            
            // Auto-resize textarea
            elements.messageInput.addEventListener('input', function() {
                this.style.height = 'auto';
                this.style.height = (this.scrollHeight) + 'px';
            });
        }
        
        // Tab navigation
        if (elements.tabs && elements.tabs.length > 0) {
            elements.tabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    const tabName = tab.getAttribute('data-tab');
                    state.ui.currentTab = tabName;
                    
                    // Find the tab container parent
                    const tabContainer = tab.closest('.tabs');
                    if (!tabContainer) return;
                    
                    // Deactivate all tabs in this container
                    const tabs = tabContainer.querySelectorAll('.tab');
                    tabs.forEach(t => t.classList.remove('active'));
                    
                    // Activate selected tab
                    tab.classList.add('active');
                    
                    // Find and activate corresponding content
                    const tabContentId = `tab-${tabName}`;
                    const tabContent = document.getElementById(tabContentId);
                    
                    if (tabContent) {
                        // Deactivate all tab contents
                        const tabContents = document.querySelectorAll('.tab-content');
                        tabContents.forEach(c => c.classList.add('hidden'));
                        
                        // Activate selected content
                        tabContent.classList.remove('hidden');
                    }
                });
            });
        }
        
        // Inner tab navigation for prompt templates
        if (elements.innerTabs && elements.innerTabs.length > 0) {
            elements.innerTabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    const tabName = tab.getAttribute('data-tab-inner');
                    
                    // Find the tab container parent
                    const tabContainer = tab.closest('.tabs-inner');
                    if (!tabContainer) return;
                    
                    // Deactivate all tabs in this container
                    const tabs = tabContainer.querySelectorAll('.tab');
                    tabs.forEach(t => t.classList.remove('active'));
                    
                    // Activate selected tab
                    tab.classList.add('active');
                    
                    // Find and activate corresponding content
                    const tabContentId = `tab-inner-${tabName}`;
                    const tabContent = document.getElementById(tabContentId);
                    
                    if (tabContent) {
                        // Deactivate all tab contents
                        const tabContents = document.querySelectorAll('.tab-inner-content');
                        tabContents.forEach(c => {
                            c.classList.remove('active');
                            c.classList.add('hidden');
                        });
                        
                        // Activate selected content
                        tabContent.classList.remove('hidden');
                        tabContent.classList.add('active');
                    }
                });
            });
        }
        
        // Character options
        if (elements.editCharacterBtn) {
            elements.editCharacterBtn.addEventListener('click', () => {
                // Edit the current character
                if (state.currentCharacter) {
                    openEditCharacterModal(state.currentCharacter);
                }
            });
        }
        
        if (elements.chatOptionsBtn && elements.chatOptionsMenu) {
            elements.chatOptionsBtn.addEventListener('click', toggleChatOptionsMenu);
            
            // Set up chat options menu actions
            const chatOptionItems = elements.chatOptionsMenu.querySelectorAll('.chat-option-item');
            if (chatOptionItems.length > 0) {
                chatOptionItems.forEach(item => {
                    item.addEventListener('click', (e) => {
                        const text = e.currentTarget.textContent.trim();
                        
                        if (text.includes('Save Conversation')) {
                            saveConversation();
                        } else if (text.includes('Export as PDF')) {
                            exportConversationAsPDF();
                        } else if (text.includes('Clear Conversation')) {
                            clearConversation();
                        } else if (text.includes('Delete Character')) {
                            deleteCurrentCharacter();
                        }
                        
                        elements.chatOptionsMenu.classList.add('hidden');
                    });
                });
            }
            
            // Close dropdown menus when clicking outside
            document.addEventListener('click', (e) => {
                if (elements.chatOptionsBtn && elements.chatOptionsMenu &&
                    !elements.chatOptionsBtn.contains(e.target) && 
                    !elements.chatOptionsMenu.contains(e.target)) {
                    elements.chatOptionsMenu.classList.add('hidden');
                }
            });
        }
        
        // Prompt template management
        if (elements.savePromptsBtn) {
            elements.savePromptsBtn.addEventListener('click', savePromptTemplates);
        }
        
        if (elements.resetPromptsBtn) {
            elements.resetPromptsBtn.addEventListener('click', resetPromptTemplates);
        }
        
        if (elements.previewPromptBtn) {
            elements.previewPromptBtn.addEventListener('click', previewPrompt);
        }
        
        // AI Generator toggle
        if (elements.aiGeneratorToggle) {
            elements.aiGeneratorToggle.addEventListener('change', function() {
                if (this.checked) {
                    if (elements.aiPromptInput) elements.aiPromptInput.disabled = false;
                    if (elements.generateCharacterButton) elements.generateCharacterButton.disabled = false;
                    
                    // Add visual feedback
                    const aiGeneratorContent = this.closest('.ai-generator');
                    if (aiGeneratorContent) {
                        aiGeneratorContent.classList.add('enabled');
                    }
                } else {
                    if (elements.aiPromptInput) elements.aiPromptInput.disabled = true;
                    if (elements.generateCharacterButton) elements.generateCharacterButton.disabled = true;
                    
                    // Remove visual feedback
                    const aiGeneratorContent = this.closest('.ai-generator');
                    if (aiGeneratorContent) {
                        aiGeneratorContent.classList.remove('enabled');
                    }
                }
            });
        }
        
        if (elements.generateCharacterButton) {
            elements.generateCharacterButton.addEventListener('click', generateCharacter);
        }
        
        // Local model toggle
        if (elements.localModelToggle && elements.localModelUrl) {
            elements.localModelToggle.addEventListener('change', function() {
                elements.localModelUrl.disabled = !this.checked;
            });
        }
    }












////////////////////////////////////////////////////////////
// MODULE 3: THEME AND UI MANAGEMENT
////////////////////////////////////////////////////////////
// This module handles theme management, UI state, and appearance settings.

    // Apply theme based on settings
    function initializeTheme() {
        const theme = state.settings.theme;
        
        if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.body.classList.add('dark-mode');
            state.ui.darkMode = true;
            if (elements.toggleThemeBtn) {
                elements.toggleThemeBtn.innerHTML = '<i class="fas fa-sun"></i>';
            }
        } else {
            document.body.classList.remove('dark-mode');
            state.ui.darkMode = false;
            if (elements.toggleThemeBtn) {
                elements.toggleThemeBtn.innerHTML = '<i class="fas fa-moon"></i>';
            }
        }
        
        if (elements.themeSelect) {
            elements.themeSelect.value = theme;
        }
    }

    // Toggle theme
    function toggleTheme() {
        state.ui.darkMode = !state.ui.darkMode;
        
        if (state.ui.darkMode) {
            document.body.classList.add('dark-mode');
            if (elements.toggleThemeBtn) {
                elements.toggleThemeBtn.innerHTML = '<i class="fas fa-sun"></i>';
            }
            state.settings.theme = 'dark';
        } else {
            document.body.classList.remove('dark-mode');
            if (elements.toggleThemeBtn) {
                elements.toggleThemeBtn.innerHTML = '<i class="fas fa-moon"></i>';
            }
            state.settings.theme = 'light';
        }
        
        localStorage.setItem('theme', state.settings.theme);
        if (elements.themeSelect) {
            elements.themeSelect.value = state.settings.theme;
        }
    }
    
    // Toggle chat options menu
    function toggleChatOptionsMenu() {
        if (elements.chatOptionsMenu) {
            elements.chatOptionsMenu.classList.toggle('hidden');
        }
    }

    // Show loading overlay
    function showLoading() {
        if (elements.loadingOverlay) {
            elements.loadingOverlay.classList.remove('hidden');
        }
    }
    
    // Hide loading overlay
    function hideLoading() {
        if (elements.loadingOverlay) {
            elements.loadingOverlay.classList.add('hidden');
        }
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














////////////////////////////////////////////////////////////
// MODULE 4: CHARACTER MANAGEMENT (FIXED)
////////////////////////////////////////////////////////////
// This module handles character loading, creation, editing, and deletion.
// Enhanced to include character stats management and integration with
// the player action system.
// Fixed AI name generation functionality.

// Load characters from the API

// Global function for character generation
// Add this to your app.js file
window.generateCharacter = function() {
    console.log('Generate character function called');
    
    // Get the AI prompt input
    const aiPromptInput = document.getElementById('ai-prompt-input');
    if (!aiPromptInput) {
        console.error('AI prompt input not found');
        return;
    }
    
    const prompt = aiPromptInput.value.trim();
    if (!prompt) {
        showNotification('Please enter a prompt for character generation.', 'warning');
        return;
    }
    
    // Show generation status
    const generationStatus = document.getElementById('generation-status');
    if (generationStatus) {
        generationStatus.classList.remove('hidden');
    }
    
    // Disable generate button during generation
    const generateButton = document.getElementById('generate-character-button');
    if (generateButton) {
        generateButton.disabled = true;
        generateButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
    }
    
    try {
        console.log(`Generating character from prompt: ${prompt}`);
        
        // Determine which fields to include
        const includeFields = ["description", "personality", "speaking_style", "appearance", "greeting"];
        
        // Get local model setting
        const useLocalModel = state.settings.model === 'local';
        
        // Make request to backend
        fetch(`${API.BASE_URL}${API.GENERATE}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': state.settings.apiKey
            },
            body: JSON.stringify({
                prompt,
                include_fields: includeFields,
                use_local_model: useLocalModel
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to generate character: ${response.statusText}`);
            }
            return response.json();
        })
        .then(result => {
            if (result.success && result.character) {
                console.log('Character generated successfully:', result.character);
                
                // Fill in form fields with generated data
                if (document.getElementById('character-description-input')) {
                    document.getElementById('character-description-input').value = result.character.description || '';
                }
                
                if (document.getElementById('character-personality-input')) {
                    document.getElementById('character-personality-input').value = result.character.personality || '';
                }
                
                if (document.getElementById('character-speaking-style')) {
                    document.getElementById('character-speaking-style').value = result.character.speaking_style || '';
                }
                
                if (document.getElementById('character-appearance')) {
                    document.getElementById('character-appearance').value = result.character.appearance || '';
                }
                
                if (document.getElementById('character-greeting')) {
                    document.getElementById('character-greeting').value = result.character.greeting || '';
                }
                
                // Generate appropriate name for the character
                generateNameFromDescription(result.character, prompt);
                
                // Generate stats based on the description and personality
                generateAppropriateStats(result.character.description || '', result.character.personality || '');
                
                // Switch to the first tab to show the results
                const firstTab = document.querySelector('.tab[data-tab="basic"]');
                if (firstTab) {
                    firstTab.click();
                }
                
                showNotification('Character generated successfully!', 'success');
            } else {
                throw new Error('Failed to generate character: ' + (result.message || 'Unknown error'));
            }
        })
        .catch(error => {
            console.error('Error generating character:', error);
            showNotification('Failed to generate character. Please try again.', 'error');
        })
        .finally(() => {
            // Hide generation status
            if (generationStatus) {
                generationStatus.classList.add('hidden');
            }
            
            // Re-enable generate button
            if (generateButton) {
                generateButton.disabled = false;
                generateButton.innerHTML = '<i class="fas fa-magic"></i> Generate Character';
            }
        });
    } catch (error) {
        console.error('Error initiating character generation:', error);
        showNotification('Failed to start character generation. Please try again.', 'error');
        
        // Hide generation status
        if (generationStatus) {
            generationStatus.classList.add('hidden');
        }
        
        // Re-enable generate button
        if (generateButton) {
            generateButton.disabled = false;
            generateButton.innerHTML = '<i class="fas fa-magic"></i> Generate Character';
        }
    }
};

// Helper function for name generation
function generateNameFromDescription(character, prompt) {
    const characterNameInput = document.getElementById('character-name-input');
    if (!characterNameInput) return;
    
    // If a name is already entered, don't override it
    if (characterNameInput.value.trim()) {
        return;
    }
    
    // Get the description text
    const description = character.description || '';
    const personality = character.personality || '';
    const combinedText = description + ' ' + personality;
    
    let name = '';
    
    // Method 1: Look for names in quotes
    const quotedNameMatch = combinedText.match(/"([A-Z][a-z]+(?: [A-Z][a-z]+)?)"/);
    if (quotedNameMatch && quotedNameMatch[1]) {
        name = quotedNameMatch[1];
    }
    
    // Method 2: Look for "named X" or "called X" patterns
    if (!name) {
        const namedPatterns = [
            /named ([A-Z][a-z]+(?: [A-Z][a-z]+)?)/,
            /called ([A-Z][a-z]+(?: [A-Z][a-z]+)?)/,
            /known as ([A-Z][a-z]+(?: [A-Z][a-z]+)?)/,
            / is ([A-Z][a-z]+(?: [A-Z][a-z]+)?),/,
            /^([A-Z][a-z]+(?: [A-Z][a-z]+)?) is /
        ];
        
        for (const pattern of namedPatterns) {
            const match = combinedText.match(pattern);
            if (match && match[1]) {
                name = match[1];
                break;
            }
        }
    }
    
    // Method 3: Try to extract first capitalized word
    if (!name) {
        const firstCapWord = combinedText.match(/^(?:A |An |The )?([A-Z][a-z]+)/);
        if (firstCapWord && firstCapWord[1] && firstCapWord[1].length > 2) {
            const commonWords = ['The', 'This', 'An', 'A'];
            if (!commonWords.includes(firstCapWord[1])) {
                name = firstCapWord[1];
            }
        }
    }
    
    // Method 4: Extract any capitalized name-like word
    if (!name) {
        const capitalizedWords = Array.from(combinedText.matchAll(/\b([A-Z][a-z]{2,})\b/g), m => m[1]);
        const commonStarters = ['The', 'This', 'An', 'A', 'She', 'He', 'They', 'It', 'Her', 'His', 'Their'];
        
        for (const word of capitalizedWords) {
            if (!commonStarters.includes(word)) {
                name = word;
                break;
            }
        }
    }
    
    // Method 5: Fall back to the first words of the prompt
    if (!name) {
        const promptWords = prompt.split(/\s+/);
        if (promptWords.length > 0) {
            const nameWords = promptWords.slice(0, Math.min(2, promptWords.length));
            name = nameWords.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
        } else {
            name = 'Character';
        }
    }
    
    // If all extraction failed, use the character category
    if (!name) {
        const categorySelect = document.getElementById('character-category');
        if (categorySelect) {
            const category = categorySelect.value;
            const categoryNames = {
                'fantasy': ['Aria', 'Thorne', 'Elric', 'Lyra', 'Galen', 'Seraphina'],
                'sci-fi': ['Nova', 'Zenith', 'Orion', 'Echo', 'Vega', 'Atlas'],
                'historical': ['Victoria', 'Theodore', 'Eleanor', 'Augustus', 'Cleopatra'],
                'modern': ['Alex', 'Jamie', 'Morgan', 'Jordan', 'Casey', 'Riley'],
                'other': ['Sage', 'Blaze', 'Storm', 'Raven', 'Sky', 'River']
            };
            
            const names = categoryNames[category] || categoryNames['other'];
            name = names[Math.floor(Math.random() * names.length)];
        }
    }
    
    // Set the name in the input field
    characterNameInput.value = name || 'Unnamed Character';
}

// Helper function for stats generation
function generateAppropriateStats(description, personality) {
    const descriptionLower = description.toLowerCase();
    const personalityLower = personality.toLowerCase();
    const combined = descriptionLower + ' ' + personalityLower;
    
    // Default slightly above average stats
    const stats = {
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10,
        level: 1
    };
    
    // Analyze the text for indicators of each stat
    
    // Strength indicators
    if (/strong|muscular|powerful|athletic|warrior|fighter|soldier|might|robust|burly/i.test(combined)) {
        stats.strength = Math.min(10 + Math.floor(Math.random() * 8) + 2, 20); // 12-18
    }
    
    // Dexterity indicators
    if (/agile|nimble|quick|swift|dexterous|acrobatic|graceful|stealthy|thief|rogue|archer/i.test(combined)) {
        stats.dexterity = Math.min(10 + Math.floor(Math.random() * 8) + 2, 20); // 12-18
    }
    
    // Constitution indicators
    if (/tough|sturdy|resilient|enduring|healthy|hardy|durable|stout|vigorous|tireless/i.test(combined)) {
        stats.constitution = Math.min(10 + Math.floor(Math.random() * 8) + 2, 20); // 12-18
    }
    
    // Intelligence indicators
    if (/intelligent|smart|brilliant|genius|scholarly|academic|educated|studious|wizard|mage/i.test(combined)) {
        stats.intelligence = Math.min(10 + Math.floor(Math.random() * 8) + 2, 20); // 12-18
    }
    
    // Wisdom indicators
    if (/wise|insightful|perceptive|sage|observant|intuitive|sensible|monk|druid|cleric/i.test(combined)) {
        stats.wisdom = Math.min(10 + Math.floor(Math.random() * 8) + 2, 20); // 12-18
    }
    
    // Charisma indicators
    if (/charismatic|charming|persuasive|attractive|leader|commanding|diplomatic|bard|noble/i.test(combined)) {
        stats.charisma = Math.min(10 + Math.floor(Math.random() * 8) + 2, 20); // 12-18
    }
    
    // Level indicators
    if (/experienced|veteran|expert|master|legendary|renowned|famous|accomplished/i.test(combined)) {
        stats.level = Math.min(1 + Math.floor(Math.random() * 5) + 2, 10); // 3-7
    } else if (/novice|apprentice|beginner|young|inexperienced|trainee/i.test(combined)) {
        stats.level = 1;
    } else {
        stats.level = Math.floor(Math.random() * 3) + 1; // 1-3
    }
    
    // Set the generated stats in the form
    setStatsInForm(stats);
}

// Helper to set stats in the form
function setStatsInForm(stats) {
    // Set the values
    const statsInputs = {
        'char-strength': stats.strength || 10,
        'char-dexterity': stats.dexterity || 10,
        'char-constitution': stats.constitution || 10,
        'char-intelligence': stats.intelligence || 10,
        'char-wisdom': stats.wisdom || 10,
        'char-charisma': stats.charisma || 10,
        'char-level': stats.level || 1
    };
    
    // Update each input
    Object.entries(statsInputs).forEach(([id, value]) => {
        const input = document.getElementById(id);
        if (input) {
            input.value = value;
        }
    });
}
async function loadCharacters() {
    try {
        showLoading();
        const response = await fetch(`${API.BASE_URL}${API.CHARACTERS}`);
        
        if (!response.ok) {
            throw new Error(`Failed to load characters: ${response.status}`);
        }
        
        const characters = await response.json();
        
        // Clear existing characters array completely before adding new ones
        state.characters = [];
        
        // Add fetched characters to state
        if (Array.isArray(characters)) {
            state.characters = characters;
        } else {
            console.warn('Characters data is not an array:', characters);
        }
        
        console.log(`Loaded ${state.characters.length} characters`);
        
        // Render the character list in sidebar
        renderCharacterList();
        
        // Update UI based on character state
        if (state.characters.length === 0) {
            // If no characters, show welcome screen
            if (elements.welcomeScreen && elements.chatInterface) {
                elements.welcomeScreen.classList.remove('hidden');
                elements.chatInterface.classList.add('hidden');
            }
        } else if (state.currentCharacter) {
            // If current character exists, make sure it's updated with latest data
            const updatedCurrentCharacter = state.characters.find(
                c => c.id === state.currentCharacter.id
            );
            
            if (updatedCurrentCharacter) {
                state.currentCharacter = updatedCurrentCharacter;
                
                // Ensure chat interface is visible
                if (elements.welcomeScreen && elements.chatInterface) {
                    elements.welcomeScreen.classList.add('hidden');
                    elements.chatInterface.classList.remove('hidden');
                }
                
                // Load character stats if they exist
                if (window.playerActionSystem && updatedCurrentCharacter.stats) {
                    window.playerActionSystem.loadCharacterStats(updatedCurrentCharacter);
                }
            } else {
                // If current character no longer exists, reset it
                state.currentCharacter = null;
                
                // Show welcome screen or first character
                if (state.characters.length > 0) {
                    loadCharacter(state.characters[0].id);
                } else if (elements.welcomeScreen && elements.chatInterface) {
                    elements.welcomeScreen.classList.remove('hidden');
                    elements.chatInterface.classList.add('hidden');
                }
            }
        }
    } catch (error) {
        console.error('Error loading characters:', error);
        showNotification('Failed to load characters. Please try again later.', 'error');
    } finally {
        hideLoading();
    }
}

// Render the character list in the sidebar
function renderCharacterList() {
    if (!elements.characterList) {
        console.warn('Character list element not found');
        return;
    }
    
    // Clear existing character list completely
    elements.characterList.innerHTML = '';
    
    console.log(`Rendering ${state.characters.length} characters in sidebar`);
    
    if (state.characters.length === 0) {
        const noCharacters = document.createElement('div');
        noCharacters.className = 'text-center mt-4';
        noCharacters.textContent = 'No characters available';
        elements.characterList.appendChild(noCharacters);
        return;
    }
    
    // Create a document fragment for better performance
    const fragment = document.createDocumentFragment();
    
    // Add each character to fragment
    state.characters.forEach(character => {
        const item = document.createElement('div');
        item.className = 'character-item';
        item.dataset.characterId = character.id; // Add data attribute for identification
        
        if (state.currentCharacter && character.id === state.currentCharacter.id) {
            item.classList.add('active');
        }
        
        // Include level info if available
        const levelDisplay = character.stats && character.stats.level ? 
            `<div class="character-level">Lvl ${character.stats.level}</div>` : '';
        
        item.innerHTML = `
            <div class="character-avatar">
                <i class="fas fa-user"></i>
            </div>
            <div class="character-meta">
                <div class="character-name-row">
                    <div class="character-name">${character.name || 'Unnamed Character'}</div>
                    ${levelDisplay}
                </div>
                <div class="character-summary">${character.mood || 'Neutral'} · ${formatTimeAgo(character.updated_at)}</div>
            </div>
        `;
        
        // Use delegation pattern for click events
        item.addEventListener('click', () => loadCharacter(character.id));
        fragment.appendChild(item);
    });
    
    // Append all characters at once
    elements.characterList.appendChild(fragment);
}

// Load a specific character
async function loadCharacter(characterId) {
    if (!characterId) {
        console.warn('No character ID provided to loadCharacter');
        return;
    }
    
    console.log(`Loading character: ${characterId}`);
    
    try {
        showLoading();
        const response = await fetch(`${API.BASE_URL}${API.CHARACTERS}/${characterId}`);
        
        if (!response.ok) {
            throw new Error(`Failed to load character: ${response.statusText}`);
        }
        
        const character = await response.json();
        
        // Before setting new character, clean up any existing one
        cleanupCurrentCharacter();
        
        // Set new current character
        state.currentCharacter = character;
        
        console.log(`Loaded character: ${character.name} (${character.id})`);
        
        // Load character stats if they exist
        if (window.playerActionSystem && character.stats) {
            window.playerActionSystem.loadCharacterStats(character);
        }
        
        // Load conversation history
        try {
            const historyResponse = await fetch(`${API.BASE_URL}${API.CHAT_HISTORY}/${characterId}`);
            if (historyResponse.ok) {
                const historyData = await historyResponse.json();
                updateCharacterUI(historyData);
            } else {
                console.warn(`Failed to load conversation history: ${historyResponse.statusText}`);
                updateCharacterUI();
            }
        } catch (error) {
            console.error('Error loading conversation history:', error);
            updateCharacterUI();
        }
        
        // Hide welcome screen, show chat interface
        if (elements.welcomeScreen && elements.chatInterface) {
            elements.welcomeScreen.classList.add('hidden');
            elements.chatInterface.classList.remove('hidden');
        }
        
        // Update character list to show active character
        updateActiveCharacterInList(characterId);
        
        // Hide sidebar on mobile after selecting a character
        if (window.innerWidth <= 768 && elements.sidebar) {
            elements.sidebar.classList.remove('active');
        }
        
        // Focus the message input
        if (elements.messageInput) {
            const activeInput = document.querySelector('#message-input:not([disabled])');
            if (activeInput) {
                activeInput.focus();
            }
        }
    } catch (error) {
        console.error('Error loading character:', error);
        showNotification('Failed to load character. Please try again.', 'error');
    } finally {
        hideLoading();
    }
}

// Clean up current character data and elements
function cleanupCurrentCharacter() {
    if (!state.currentCharacter) return;
    
    console.log(`Cleaning up current character: ${state.currentCharacter.id}`);
    
    // Clear chat messages
    if (elements.chatMessages) {
        elements.chatMessages.innerHTML = '';
    }
    
    // Reset character mood/opinion UI
    if (elements.characterMood) {
        elements.characterMood.innerHTML = '<i class="fas fa-smile"></i> Neutral';
    }
    
    if (elements.characterOpinion) {
        elements.characterOpinion.innerHTML = '<i class="fas fa-heart"></i> Neutral';
    }
    
    // Reset character name
    if (elements.characterName) {
        elements.characterName.textContent = 'Character Name';
    }
}

// Update the active character in the list without full rerender
function updateActiveCharacterInList(characterId) {
    if (!elements.characterList) return;
    
    // Remove active class from all character items
    const characterItems = elements.characterList.querySelectorAll('.character-item');
    characterItems.forEach(item => {
        item.classList.remove('active');
    });
    
    // Add active class to the current character
    const activeItem = elements.characterList.querySelector(`.character-item[data-character-id="${characterId}"]`);
    if (activeItem) {
        activeItem.classList.add('active');
    }
}

// Update the UI with current character data
function updateCharacterUI(historyData) {
    if (!state.currentCharacter) {
        console.warn('No current character to update UI for');
        return;
    }
    
    console.log(`Updating UI for character: ${state.currentCharacter.name}`);
    
    // Update character name
    if (elements.characterName) {
        elements.characterName.textContent = state.currentCharacter.name;
    }
    
    // Update mood with icon
    if (elements.characterMood) {
        let moodIcon = 'fa-smile';
        
        if (state.currentCharacter.mood === 'happy') moodIcon = 'fa-grin';
        else if (state.currentCharacter.mood === 'sad') moodIcon = 'fa-frown';
        else if (state.currentCharacter.mood === 'angry') moodIcon = 'fa-angry';
        
        elements.characterMood.innerHTML = `<i class="fas ${moodIcon}"></i> ${capitalizeFirstLetter(state.currentCharacter.mood || 'Neutral')}`;
    }
    
    // Update opinion with icon
    if (elements.characterOpinion) {
        let opinionIcon = 'fa-heart';
        
        if (state.currentCharacter.opinion_of_user === 'positive') opinionIcon = 'fa-heart';
        else if (state.currentCharacter.opinion_of_user === 'negative') opinionIcon = 'fa-heart-broken';
        
        elements.characterOpinion.innerHTML = `<i class="fas ${opinionIcon}"></i> ${capitalizeFirstLetter(state.currentCharacter.opinion_of_user || 'Neutral')}`;
    }
    
    // Ensure chat messages container is clear before adding new messages
    if (elements.chatMessages) {
        elements.chatMessages.innerHTML = '';
        
        if (historyData && historyData.conversations && historyData.conversations.length > 0) {
            console.log(`Adding ${historyData.conversations.length} messages from history`);
            
            // Add conversation history
            historyData.conversations.forEach(convo => {
                // Add user message - handle player actions differently
                if (convo.is_player_action) {
                    addPlayerActionFromHistory(convo);
                } else {
                    addUserMessage(convo.user_message);
                }
                
                // Add character response with enhanced metadata
                addCharacterMessage(convo.character_response, {
                    mood: convo.mood || 'neutral',
                    emotions: convo.emotions || {},
                    action: convo.action || 'standing still',
                    location: convo.location || 'current location',
                    scene_description: convo.scene_description || ''
                });
            });
        } else {
            console.log('No history, adding welcome message');
            
            // Add a welcome message if no history
            const greeting = state.currentCharacter.greeting || 
                             `Hello! I'm ${state.currentCharacter.name}. How can I help you today?`;
            
            addCharacterMessage(greeting, {
                mood: state.currentCharacter.mood || 'neutral',
                emotions: state.currentCharacter.emotions || {},
                action: state.currentCharacter.action || 'greeting you with a smile',
                location: state.currentCharacter.location || 'welcoming area'
            });
        }
    }
}

// Add a player action from history
function addPlayerActionFromHistory(convo) {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message message-user';
    
    // Format the action message
    const actionClass = convo.action_success ? 'message-success' : 'message-failure';
    const outcomeText = convo.action_success ? 'Success' : 'Failure';
    const iconClass = convo.action_success ? 'fa-check-circle' : 'fa-times-circle';
    
    messageDiv.innerHTML = `
        <div class="message-avatar">
            <i class="fas fa-user"></i>
        </div>
        <div class="message-bubble action-attempt">
            <div class="message-action ${actionClass}">
                <i class="fas ${iconClass}"></i>
                ${outcomeText}: ${convo.player_action || convo.user_message}
            </div>
            <div class="message-metadata">
                ${formatTime(new Date(convo.timestamp))} 
                <span class="action-outcome ${convo.action_success ? 'success' : 'failure'}">
                    ${convo.action_details || ''}
                </span>
            </div>
        </div>
    `;
    
    chatMessages.appendChild(messageDiv);
}

// Update just the character mood and opinion UI (without clearing chat)
function updateCharacterMoodUI() {
    if (!state.currentCharacter) return;
    
    // Update mood with icon
    if (elements.characterMood) {
        let moodIcon = 'fa-smile';
        if (state.currentCharacter.mood === 'happy') moodIcon = 'fa-grin';
        else if (state.currentCharacter.mood === 'sad') moodIcon = 'fa-frown';
        else if (state.currentCharacter.mood === 'angry') moodIcon = 'fa-angry';
        
        elements.characterMood.innerHTML = `<i class="fas ${moodIcon}"></i> ${capitalizeFirstLetter(state.currentCharacter.mood || 'Neutral')}`;
    }
    
    // Update opinion with icon
    if (elements.characterOpinion) {
        let opinionIcon = 'fa-heart';
        if (state.currentCharacter.opinion_of_user === 'positive') opinionIcon = 'fa-heart';
        else if (state.currentCharacter.opinion_of_user === 'negative') opinionIcon = 'fa-heart-broken';
        
        elements.characterOpinion.innerHTML = `<i class="fas ${opinionIcon}"></i> ${capitalizeFirstLetter(state.currentCharacter.opinion_of_user || 'Neutral')}`;
    }
}

// Open the create character modal
function openCreateCharacterModal() {
    if (!elements.characterModal) {
        console.warn('Character modal element not found');
        return;
    }
    
    console.log('Opening create character modal');
    
    // Reset all form fields
    if (elements.characterNameInput) elements.characterNameInput.value = '';
    if (elements.characterDescInput) elements.characterDescInput.value = '';
    if (elements.characterPersonalityInput) elements.characterPersonalityInput.value = '';
    
    if (elements.characterGreeting) {
        elements.characterGreeting.value = '';
    }
    
    if (elements.characterCategory) {
        elements.characterCategory.value = 'fantasy';
    }
    
    if (elements.characterAppearance) {
        elements.characterAppearance.value = '';
    }
    
    if (elements.speakingStyleInput) {
        elements.speakingStyleInput.value = '';
    }
    
    // Reset AI generator
    if (elements.aiPromptInput) {
        elements.aiPromptInput.value = '';
        elements.aiPromptInput.disabled = true;
    }
    
    if (elements.aiGeneratorToggle) {
        elements.aiGeneratorToggle.checked = false;
    }
    
    if (elements.generateCharacterButton) {
        elements.generateCharacterButton.disabled = true;
    }
    
    if (elements.generationStatus) {
        elements.generationStatus.classList.add('hidden');
    }
    
    // Set modal title for Create mode
    const modalTitle = document.getElementById('character-modal-title');
    if (modalTitle) {
        modalTitle.textContent = 'Create New Character';
    }
    
    // Get default stats
    const defaultStats = window.playerActionSystem ? 
        window.playerActionSystem.getPlayerStats() : 
        {
            strength: 10,
            dexterity: 10,
            constitution: 10,
            intelligence: 10,
            wisdom: 10,
            charisma: 10,
            level: 1
        };
    
    // Set default stats in form
    setStatsInCharacterForm(defaultStats);
    
    // Reset to first tab
    const firstTab = document.querySelector('.tab[data-tab="basic"]');
    if (firstTab) {
        firstTab.click();
    }
    
    // Clear any previous character data
    elements.characterModal.dataset.editMode = 'false';
    elements.characterModal.dataset.characterId = '';
    
    // Show the modal
    elements.characterModal.classList.remove('hidden');
}

// Open edit character modal
function openEditCharacterModal(character) {
    if (!elements.characterModal || !character) {
        console.warn('Character modal element not found or no character provided');
        return;
    }
    
    console.log(`Opening edit modal for character: ${character.name} (${character.id})`);
    
    // Set form values from character
    if (elements.characterNameInput) elements.characterNameInput.value = character.name || '';
    if (elements.characterDescInput) elements.characterDescInput.value = character.description || '';
    if (elements.characterPersonalityInput) elements.characterPersonalityInput.value = character.personality || '';
    
    if (elements.characterGreeting) {
        elements.characterGreeting.value = character.greeting || '';
    }
    
    if (elements.characterCategory) {
        elements.characterCategory.value = character.category || 'fantasy';
    }
    
    if (elements.characterAppearance) {
        elements.characterAppearance.value = character.appearance || '';
    }
    
    if (elements.speakingStyleInput) {
        elements.speakingStyleInput.value = character.speaking_style || '';
    }
    
    // Set character stats in form if they exist
    if (character.stats) {
        setStatsInCharacterForm(character.stats);
    } else {
        // Use default stats from player action system
        const defaultStats = window.playerActionSystem ? 
            window.playerActionSystem.getPlayerStats() : 
            {
                strength: 10,
                dexterity: 10,
                constitution: 10,
                intelligence: 10,
                wisdom: 10,
                charisma: 10,
                level: 1
            };
        
        setStatsInCharacterForm(defaultStats);
    }
    
    // Set modal title for Edit mode
    const modalTitle = document.getElementById('character-modal-title');
    if (modalTitle) {
        modalTitle.textContent = 'Edit Character';
    }
    
    // Reset to first tab
    const firstTab = document.querySelector('.tab[data-tab="basic"]');
    if (firstTab) {
        firstTab.click();
    }
    
    // Set edit mode and character ID
    elements.characterModal.dataset.editMode = 'true';
    elements.characterModal.dataset.characterId = character.id;
    
    // Show the modal
    elements.characterModal.classList.remove('hidden');
}

// Set stats in character creation/edit form
function setStatsInCharacterForm(stats) {
    // Find or create the stats section in the character form
    ensureCharacterStatsSection();
    
    // Set the values
    const statsInputs = {
        'char-strength': stats.strength || 10,
        'char-dexterity': stats.dexterity || 10,
        'char-constitution': stats.constitution || 10,
        'char-intelligence': stats.intelligence || 10,
        'char-wisdom': stats.wisdom || 10,
        'char-charisma': stats.charisma || 10,
        'char-level': stats.level || 1
    };
    
    // Update each input
    Object.entries(statsInputs).forEach(([id, value]) => {
        const input = document.getElementById(id);
        if (input) {
            input.value = value;
        }
    });
}

// Ensure stats section exists in character form
function ensureCharacterStatsSection() {
    // Check if stats tab exists
    let statsTab = document.querySelector('.tab[data-tab="stats"]');
    
    if (!statsTab) {
        // Add a new tab for stats
        const tabsContainer = document.querySelector('.tabs');
        if (tabsContainer) {
            statsTab = document.createElement('div');
            statsTab.className = 'tab';
            statsTab.setAttribute('data-tab', 'stats');
            statsTab.textContent = 'Stats';
            tabsContainer.appendChild(statsTab);
            
            // Add event listener to the new tab
            statsTab.addEventListener('click', () => {
                const tabName = 'stats';
                
                // Find the tab container parent
                const tabContainer = statsTab.closest('.tabs');
                if (!tabContainer) return;
                
                // Deactivate all tabs in this container
                const tabs = tabContainer.querySelectorAll('.tab');
                tabs.forEach(t => t.classList.remove('active'));
                
                // Activate selected tab
                statsTab.classList.add('active');
                
                // Find and activate corresponding content
                const tabContentId = `tab-stats`;
                let tabContent = document.getElementById(tabContentId);
                
                if (!tabContent) {
                    // Create the tab content if it doesn't exist
                    tabContent = createStatsTabContent();
                }
                
                if (tabContent) {
                    // Deactivate all tab contents
                    const tabContents = document.querySelectorAll('.tab-content');
                    tabContents.forEach(c => c.classList.add('hidden'));
                    
                    // Activate selected content
                    tabContent.classList.remove('hidden');
                }
            });
        }
    }
    
    // Check if stats content exists
    let statsContent = document.getElementById('tab-stats');
    if (!statsContent) {
        statsContent = createStatsTabContent();
    }
    
    return statsContent;
}

// Create stats tab content
function createStatsTabContent() {
    const characterTabsContent = document.querySelector('.character-tabs-content');
    if (!characterTabsContent) return null;
    
    const statsContent = document.createElement('div');
    statsContent.className = 'tab-content hidden';
    statsContent.id = 'tab-stats';
    
    statsContent.innerHTML = `
        <div class="form-group">
            <label class="form-label">Character Stats</label>
            <p class="mb-4">Set the character's abilities and level. These stats will be used for action resolution.</p>
            
            <div class="stats-edit-grid">
                <div class="form-group">
                    <label class="form-label">Strength</label>
                    <input type="number" class="form-input" id="char-strength" min="1" max="20" value="10">
                </div>
                <div class="form-group">
                    <label class="form-label">Dexterity</label>
                    <input type="number" class="form-input" id="char-dexterity" min="1" max="20" value="10">
                </div>
                <div class="form-group">
                    <label class="form-label">Constitution</label>
                    <input type="number" class="form-input" id="char-constitution" min="1" max="20" value="10">
                </div>
                <div class="form-group">
                    <label class="form-label">Intelligence</label>
                    <input type="number" class="form-input" id="char-intelligence" min="1" max="20" value="10">
                </div>
                <div class="form-group">
                    <label class="form-label">Wisdom</label>
                    <input type="number" class="form-input" id="char-wisdom" min="1" max="20" value="10">
                </div>
                <div class="form-group">
                    <label class="form-label">Charisma</label>
                    <input type="number" class="form-input" id="char-charisma" min="1" max="20" value="10">
                </div>
            </div>
            
            <div class="form-group mt-4">
                <label class="form-label">Character Level</label>
                <input type="number" class="form-input" id="char-level" min="1" max="20" value="1">
                <p class="form-hint">Level affects action resolution bonuses.</p>
            </div>
            
            <div class="form-group mt-4">
                <button id="randomize-stats-btn" class="btn btn-secondary">
                    <i class="fas fa-random"></i> Randomize Stats
                </button>
                <button id="reset-default-stats-btn" class="btn btn-secondary">
                    <i class="fas fa-undo"></i> Reset to Default
                </button>
            </div>
        </div>
    `;
    
    characterTabsContent.appendChild(statsContent);
    
    // Add event listeners for the buttons
    const randomizeBtn = document.getElementById('randomize-stats-btn');
    if (randomizeBtn) {
        randomizeBtn.addEventListener('click', randomizeCharacterStats);
    }
    
    const resetBtn = document.getElementById('reset-default-stats-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', resetCharacterStats);
    }
    
    return statsContent;
}

// Randomize character stats
function randomizeCharacterStats() {
    const stats = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
    
    // Generate random stats between 8 and 18
    stats.forEach(stat => {
        const input = document.getElementById(`char-${stat}`);
        if (input) {
            // This simulates a 3d6 roll, common in RPGs
            const value = Math.floor(Math.random() * 11) + 8; // 8-18 range
            input.value = value;
        }
    });
    
    // Generate a random level between 1 and 5
    const levelInput = document.getElementById('char-level');
    if (levelInput) {
        levelInput.value = Math.floor(Math.random() * 5) + 1;
    }
}

// Reset character stats to default
function resetCharacterStats() {
    const defaultStats = {
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10,
        level: 1
    };
    
    setStatsInCharacterForm(defaultStats);
}

// Get stats from character form
function getStatsFromCharacterForm() {
    const stats = {
        strength: parseInt(document.getElementById('char-strength')?.value) || 10,
        dexterity: parseInt(document.getElementById('char-dexterity')?.value) || 10,
        constitution: parseInt(document.getElementById('char-constitution')?.value) || 10,
        intelligence: parseInt(document.getElementById('char-intelligence')?.value) || 10,
        wisdom: parseInt(document.getElementById('char-wisdom')?.value) || 10,
        charisma: parseInt(document.getElementById('char-charisma')?.value) || 10,
        level: parseInt(document.getElementById('char-level')?.value) || 1
    };
    
    // Ensure values are within range (1-20)
    Object.keys(stats).forEach(key => {
        stats[key] = Math.min(Math.max(stats[key], 1), 20);
    });
    
    return stats;
}

// Save a new or edited character
async function saveCharacter() {
    if (!elements.characterNameInput) {
        console.warn('Character name input element not found');
        return;
    }
    
    // Get form data
    const name = elements.characterNameInput.value.trim();
    const description = elements.characterDescInput ? elements.characterDescInput.value.trim() : '';
    const personality = elements.characterPersonalityInput ? elements.characterPersonalityInput.value.trim() : '';
    
    // Get additional fields if they exist
    const greeting = elements.characterGreeting ? elements.characterGreeting.value.trim() : '';
    const category = elements.characterCategory ? elements.characterCategory.value : 'fantasy';
    const appearance = elements.characterAppearance ? elements.characterAppearance.value.trim() : '';
    const speakingStyle = elements.speakingStyleInput ? 
                          elements.speakingStyleInput.value.trim() : '';
                          
    // Get character stats
    const stats = getStatsFromCharacterForm();
    
    if (!name) {
        showNotification('Please enter a name for your character.', 'warning');
        return;
    }
    
    const characterData = {
        name,
        description,
        personality,
        greeting,
        category,
        appearance,
        speaking_style: speakingStyle,
        stats: stats
    };
    
    try {
        showLoading();
        
        let response, updatedCharacter;
        const isEditMode = elements.characterModal.dataset.editMode === 'true';
        const characterId = elements.characterModal.dataset.characterId;
        
        console.log(`Saving character: ${name} (${isEditMode ? 'Edit' : 'Create'} mode)`);
        
        // If editing, update existing character
        if (isEditMode && characterId) {
            response = await fetch(`${API.BASE_URL}${API.CHARACTERS}/${characterId}`, {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(characterData)
            });
            
            if (!response.ok) {
                throw new Error(`Failed to update character: ${response.statusText}`);
            }
            
            updatedCharacter = await response.json();
            
            // Update current character
            state.currentCharacter = updatedCharacter;
            
            // Update character in list (replace instead of modifying in place)
            const index = state.characters.findIndex(c => c.id === updatedCharacter.id);
            if (index !== -1) {
                // Create a new array with the updated character
                state.characters = [
                    ...state.characters.slice(0, index),
                    updatedCharacter,
                    ...state.characters.slice(index + 1)
                ];
            }
            
            // Update player stats if character is active
            if (window.playerActionSystem && updatedCharacter.stats) {
                window.playerActionSystem.loadCharacterStats(updatedCharacter);
            }
            
            showNotification('Character updated successfully!', 'success');
        } else {
            // Create new character
            response = await fetch(`${API.BASE_URL}${API.CHARACTERS}`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(characterData)
            });
            
            if (!response.ok) {
                throw new Error(`Failed to create character: ${response.statusText}`);
            }
            
            updatedCharacter = await response.json();
            
            // Clean up current character if any
            cleanupCurrentCharacter();
            
            // Add to characters array (new array to avoid reference issues)
            state.characters = [...state.characters, updatedCharacter];
            
            // Set as current character
            state.currentCharacter = updatedCharacter;
            
            // Update player stats if character is active
            if (window.playerActionSystem && updatedCharacter.stats) {
                window.playerActionSystem.loadCharacterStats(updatedCharacter);
            }
            
            showNotification('Character created successfully!', 'success');
        }
        
        // Update UI
        renderCharacterList();
        updateCharacterUI();
        closeModal(elements.characterModal);
        
        // Hide welcome screen, show chat interface
        if (elements.welcomeScreen && elements.chatInterface) {
            elements.welcomeScreen.classList.add('hidden');
            elements.chatInterface.classList.remove('hidden');
        }
        
        // Focus the message input
        if (elements.messageInput) {
            const activeInput = document.querySelector('#message-input:not([disabled])');
            if (activeInput) {
                activeInput.focus();
            }
        }
    } catch (error) {
        console.error('Error saving character:', error);
        showNotification('Failed to save character. Please try again.', 'error');
    } finally {
        hideLoading();
    }
}

// Delete current character
async function deleteCurrentCharacter() {
    if (!state.currentCharacter) {
        console.warn('No current character to delete');
        return;
    }
    
    const characterName = state.currentCharacter.name;
    const characterId = state.currentCharacter.id;
    
    if (!confirm(`Are you sure you want to delete ${characterName}? This action cannot be undone.`)) {
        return;
    }
    
    console.log(`Deleting character: ${characterName} (${characterId})`);
    
    try {
        showLoading();
        
        const response = await fetch(`${API.BASE_URL}${API.CHARACTERS}/${characterId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            // Remove from list (create new array)
            state.characters = state.characters.filter(c => c.id !== characterId);
            
            // Clear current character
            cleanupCurrentCharacter();
            state.currentCharacter = null;
            
            // Update UI
            renderCharacterList();
            
            // Show welcome screen if no characters left
            if (state.characters.length === 0) {
                if (elements.welcomeScreen && elements.chatInterface) {
                    elements.welcomeScreen.classList.remove('hidden');
                    elements.chatInterface.classList.add('hidden');
                }
            } else {
                // Load first character
                loadCharacter(state.characters[0].id);
            }
            
            showNotification(`Character "${characterName}" deleted successfully.`, 'success');
        } else {
            throw new Error(`Failed to delete character: ${response.statusText}`);
        }
    } catch (error) {
        console.error('Error deleting character:', error);
        showNotification('Failed to delete character. Please try again.', 'error');
    } finally {
        hideLoading();
    }
}

// Generate character using AI
async function generateCharacter() {
    if (!elements.aiPromptInput || !elements.generationStatus) {
        console.warn('AI prompt input or generation status element not found');
        return;
    }
    
    const prompt = elements.aiPromptInput.value.trim();
    
    if (!prompt) {
        showNotification('Please enter a prompt for character generation.', 'warning');
        return;
    }
    
    // Show generation status
    elements.generationStatus.classList.remove('hidden');
    
    // Disable generate button during generation
    if (elements.generateCharacterButton) {
        elements.generateCharacterButton.disabled = true;
        elements.generateCharacterButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
    }
    
    try {
        console.log(`Generating character from prompt: ${prompt}`);
        
        // Determine which fields to include
        const includeFields = ["description", "personality", "speaking_style", "appearance", "greeting"];
        
        // Get local model setting
        const useLocalModel = state.settings.model === 'local';
        
        // Make request to backend
        const response = await fetch(`${API.BASE_URL}${API.GENERATE}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': state.settings.apiKey
            },
            body: JSON.stringify({
                prompt,
                include_fields: includeFields,
                use_local_model: useLocalModel
            })
        });
        
        if (!response.ok) {
            throw new Error(`Failed to generate character: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (result.success && result.character) {
            console.log('Character generated successfully:', result.character);
            
            // Fill in form fields with generated data
            if (elements.characterDescInput) {
                elements.characterDescInput.value = result.character.description || '';
            }
            
            if (elements.characterPersonalityInput) {
                elements.characterPersonalityInput.value = result.character.personality || '';
            }
            
            if (elements.speakingStyleInput) {
                elements.speakingStyleInput.value = result.character.speaking_style || '';
            }
            
            if (elements.characterAppearance) {
                elements.characterAppearance.value = result.character.appearance || '';
            }
            
            if (elements.characterGreeting) {
                elements.characterGreeting.value = result.character.greeting || '';
            }
            
            // Generate appropriate name for the character - FIXED!
            generateNameFromDescription(result.character, prompt);
            
            // Generate stats based on the description and personality
            generateAppropriateStats(result.character.description || '', result.character.personality || '');
            
            // Switch to the first tab to show the results
            const firstTab = document.querySelector('.tab[data-tab="basic"]');
            if (firstTab) {
                firstTab.click();
            }
            
            showNotification('Character generated successfully!', 'success');
        } else {
            throw new Error('Failed to generate character: ' + (result.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error generating character:', error);
        showNotification('Failed to generate character. Please try again.', 'error');
    } finally {
        // Hide generation status
        elements.generationStatus.classList.add('hidden');
        
        // Re-enable generate button
        if (elements.generateCharacterButton) {
            elements.generateCharacterButton.disabled = false;
            elements.generateCharacterButton.innerHTML = '<i class="fas fa-magic"></i> Generate Character';
        }
    }
}

// Generate name from description - FIXED!
function generateNameFromDescription(character, prompt) {
    if (!elements.characterNameInput) return;
    
    // If a name is already entered, don't override it
    if (elements.characterNameInput.value.trim()) {
        return;
    }
    
    // Get the description text
    const description = character.description || '';
    const personality = character.personality || '';
    const combinedText = description + ' ' + personality;
    
    let name = '';
    
    // Method 1: Look for names in quotes
    const quotedNameMatch = combinedText.match(/"([A-Z][a-z]+(?: [A-Z][a-z]+)?)"/);
    if (quotedNameMatch && quotedNameMatch[1]) {
        name = quotedNameMatch[1];
    }
    
    // Method 2: Look for "named X" or "called X" patterns - using multiple patterns
    if (!name) {
        const namedPatterns = [
            /named ([A-Z][a-z]+(?: [A-Z][a-z]+)?)/,
            /called ([A-Z][a-z]+(?: [A-Z][a-z]+)?)/,
            /known as ([A-Z][a-z]+(?: [A-Z][a-z]+)?)/,
            / is ([A-Z][a-z]+(?: [A-Z][a-z]+)?),/,  // "is Name, a..."
            /^([A-Z][a-z]+(?: [A-Z][a-z]+)?) is /   // "Name is a..."
        ];
        
        for (const pattern of namedPatterns) {
            const match = combinedText.match(pattern);
            if (match && match[1]) {
                name = match[1];
                break;
            }
        }
    }
    
    // Method 3: Try to extract first capitalized word at the beginning
    if (!name) {
        const firstCapWord = combinedText.match(/^(?:A |An |The )?([A-Z][a-z]+)/);
        if (firstCapWord && firstCapWord[1] && firstCapWord[1].length > 2) {
            // Check this isn't just a common sentence starter like "The" or "A"
            const commonWords = ['The', 'This', 'An', 'A'];
            if (!commonWords.includes(firstCapWord[1])) {
                name = firstCapWord[1];
            }
        }
    }
    
    // Method 4: Extract any capitalized name-like word that's not a common starter
    if (!name) {
        const capitalizedWords = Array.from(combinedText.matchAll(/\b([A-Z][a-z]{2,})\b/g), m => m[1]);
        const commonStarters = ['The', 'This', 'An', 'A', 'She', 'He', 'They', 'It', 'Her', 'His', 'Their'];
        
        for (const word of capitalizedWords) {
            if (!commonStarters.includes(word)) {
                name = word;
                break;
            }
        }
    }
    
    // Method 5: Fall back to the first words of the prompt
    if (!name) {
        // Get first meaningful words from prompt
        const promptWords = prompt.split(/\s+/);
        if (promptWords.length > 0) {
            // Capitalize first letter of each word in first 2-3 words
            const nameWords = promptWords.slice(0, Math.min(2, promptWords.length));
            name = nameWords.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
            
            // Append "the X" based on prompt
            if (promptWords.length > 2) {
                const descriptor = promptWords[2].toLowerCase();
                if (descriptor.length > 3) { // Only use meaningful descriptors
                    name += ` the ${descriptor.charAt(0).toUpperCase() + descriptor.slice(1)}`;
                }
            }
        } else {
            name = 'Character';
        }
    }
    
    // If all extraction failed, create a name based on the character category
    if (!name && elements.characterCategory) {
        const category = elements.characterCategory.value;
        const categoryNames = {
            'fantasy': ['Aria', 'Thorne', 'Elric', 'Lyra', 'Galen', 'Seraphina', 'Draven', 'Thorn'],
            'sci-fi': ['Nova', 'Zenith', 'Orion', 'Echo', 'Vega', 'Atlas', 'Phoenix', 'Cosmos'],
            'historical': ['Victoria', 'Theodore', 'Eleanor', 'Augustus', 'Cleopatra', 'Alexander', 'Isabella'],
            'modern': ['Alex', 'Jamie', 'Morgan', 'Jordan', 'Casey', 'Riley', 'Taylor', 'Quinn'],
            'other': ['Sage', 'Blaze', 'Storm', 'Raven', 'Sky', 'River', 'Aspen', 'Winter']
        };
        
        const names = categoryNames[category] || categoryNames['other'];
        name = names[Math.floor(Math.random() * names.length)];
    }
    
    // Set the name in the input field
    elements.characterNameInput.value = name || 'Unnamed Character';
}

// Generate appropriate stats based on character description and personality
function generateAppropriateStats(description, personality) {
    const descriptionLower = description.toLowerCase();
    const personalityLower = personality.toLowerCase();
    const combined = descriptionLower + ' ' + personalityLower;
    
    // Default slightly above average stats
    const stats = {
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10,
        level: 1
    };
    
    // Analyze the text for indicators of each stat
    
    // Strength indicators
    if (/strong|muscular|powerful|athletic|warrior|fighter|soldier|might|robust|burly|stocky|brawny/i.test(combined)) {
        stats.strength = Math.min(10 + Math.floor(Math.random() * 8) + 2, 20); // 12-18
    }
    
    // Dexterity indicators
    if (/agile|nimble|quick|swift|dexterous|acrobatic|graceful|stealthy|thief|rogue|archer|dancer/i.test(combined)) {
        stats.dexterity = Math.min(10 + Math.floor(Math.random() * 8) + 2, 20); // 12-18
    }
    
    // Constitution indicators
    if (/tough|sturdy|resilient|enduring|healthy|hardy|durable|stout|vigorous|tireless|stamina|endurance/i.test(combined)) {
        stats.constitution = Math.min(10 + Math.floor(Math.random() * 8) + 2, 20); // 12-18
    }
    
    // Intelligence indicators
    if (/intelligent|smart|brilliant|genius|scholarly|academic|educated|studious|wise|learned|knowledgeable|clever|wizard|mage|scientist/i.test(combined)) {
        stats.intelligence = Math.min(10 + Math.floor(Math.random() * 8) + 2, 20); // 12-18
    }
    
    // Wisdom indicators
    if (/wise|insightful|perceptive|sage|observant|intuitive|sensible|contemplative|prudent|monk|druid|cleric|priest/i.test(combined)) {
        stats.wisdom = Math.min(10 + Math.floor(Math.random() * 8) + 2, 20); // 12-18
    }
    
    // Charisma indicators
    if (/charismatic|charming|persuasive|attractive|leader|commanding|influential|diplomatic|eloquent|bard|performer|noble|royal/i.test(combined)) {
        stats.charisma = Math.min(10 + Math.floor(Math.random() * 8) + 2, 20); // 12-18
    }
    
    // Level indicators
    if (/experienced|veteran|expert|master|legendary|renowned|famous|accomplished|seasoned/i.test(combined)) {
        stats.level = Math.min(1 + Math.floor(Math.random() * 5) + 2, 10); // 3-7
    } else if (/novice|apprentice|beginner|young|inexperienced|trainee/i.test(combined)) {
        stats.level = 1;
    } else {
        stats.level = Math.floor(Math.random() * 3) + 1; // 1-3
    }
    
    // Set the generated stats in the form
    setStatsInCharacterForm(stats);
}

// Close any modal
function closeModal(modal) {
    if (modal) {
        modal.classList.add('hidden');
        
        // Clear edit mode data attributes
        if (modal === elements.characterModal) {
            modal.dataset.editMode = 'false';
            modal.dataset.characterId = '';
        }
    }
}











////////////////////////////////////////////////////////////
// MODULE 5: SETTINGS MANAGEMENT
////////////////////////////////////////////////////////////
// This module handles application settings and configuration.
// Settings Modal Enhancement Functions

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
            }
        });
    });
    
    // Fix inner tabs for prompts section
    const innerTabs = settingsModal.querySelectorAll('.tabs-inner .tab');
    const innerTabContents = settingsModal.querySelectorAll('.tab-inner-content');
    
    innerTabs.forEach(tab => {
        // Remove existing event listeners
        const newTab = tab.cloneNode(true);
        if (tab.parentNode) {
            tab.parentNode.replaceChild(newTab, tab);
        }
        
        // Add new event listener
        newTab.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab-inner');
            console.log(`Settings: Clicking inner tab ${tabName}`);
            
            // Update active tabs
            innerTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // Show corresponding content
            innerTabContents.forEach(content => {
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
    
    // Fix preview prompt button
    const previewPromptBtn = document.getElementById('preview-prompt-btn');
    const promptPreview = document.getElementById('prompt-preview');
    
    if (previewPromptBtn && promptPreview) {
        // Remove existing listeners
        const newBtn = previewPromptBtn.cloneNode(true);
        if (previewPromptBtn.parentNode) {
            previewPromptBtn.parentNode.replaceChild(newBtn, previewPromptBtn);
        }
        
        // Add new click handler
        newBtn.addEventListener('click', function() {
            promptPreview.classList.toggle('hidden');
            
            // Generate preview when shown
            if (!promptPreview.classList.contains('hidden')) {
                generatePromptPreview();
            }
        });
    }
    
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
    
    // Fix test connection button
    const testConnBtn = document.getElementById('test-connection-btn');
    if (testConnBtn) {
        // Remove existing listeners
        const newTestBtn = testConnBtn.cloneNode(true);
        if (testConnBtn.parentNode) {
            testConnBtn.parentNode.replaceChild(newTestBtn, testConnBtn);
        }
        
        // Add new click handler
        newTestBtn.addEventListener('click', testConnection);
    }
    
    // Fix prompt buttons
    const savePromptsBtn = document.getElementById('save-prompts-btn');
    const resetPromptsBtn = document.getElementById('reset-prompts-btn');
    
    if (savePromptsBtn) {
        // Remove existing listeners
        const newSavePromptsBtn = savePromptsBtn.cloneNode(true);
        if (savePromptsBtn.parentNode) {
            savePromptsBtn.parentNode.replaceChild(newSavePromptsBtn, savePromptsBtn);
        }
        
        // Add new click handler
        newSavePromptsBtn.addEventListener('click', savePromptTemplates);
    }
    
    if (resetPromptsBtn) {
        // Remove existing listeners
        const newResetPromptsBtn = resetPromptsBtn.cloneNode(true);
        if (resetPromptsBtn.parentNode) {
            resetPromptsBtn.parentNode.replaceChild(newResetPromptsBtn, resetPromptsBtn);
        }
        
        // Add new click handler
        newResetPromptsBtn.addEventListener('click', resetPromptTemplates);
    }
    
    // Fix data clear button
    const clearDataBtn = document.getElementById('clear-character-data-btn');
    if (clearDataBtn) {
        // Remove existing listeners
        const newClearBtn = clearDataBtn.cloneNode(true);
        if (clearDataBtn.parentNode) {
            clearDataBtn.parentNode.replaceChild(newClearBtn, clearDataBtn);
        }
        
        // Add new click handler
        newClearBtn.addEventListener('click', function() {
            if (confirm('Are you sure you want to clear all character data? This cannot be undone.')) {
                clearAllCharacterData();
            }
        });
    }
    
    // Enable local model URL toggling
    const localModelToggle = document.getElementById('local-model-toggle');
    const localModelUrl = document.getElementById('local-model-url');
    
    if (localModelToggle && localModelUrl) {
        // Remove existing listeners
        const newToggle = localModelToggle.cloneNode(true);
        if (localModelToggle.parentNode) {
            localModelToggle.parentNode.replaceChild(newToggle, localModelToggle);
        }
        
        // Initialize state based on current state
        if (newToggle.checked) {
            localModelUrl.disabled = false;
        } else {
            localModelUrl.disabled = true;
        }
        
        // Add new change handler
        newToggle.addEventListener('change', function() {
            localModelUrl.disabled = !this.checked;
        });
    }
    
    console.log('Settings modal tabs fixed');
}

// Generate enhanced prompt preview
function generatePromptPreview() {
    const promptPreview = document.getElementById('prompt-preview');
    if (!promptPreview) return;
    
    const previewContent = promptPreview.querySelector('pre');
    if (!previewContent) return;
    
    // Create a sample character
    const sampleCharacter = {
        name: "Sample Character",
        description: "A friendly wizard who enjoys solving puzzles and brewing potions.",
        personality: "Curious, kind, and slightly absent-minded. Always eager to share knowledge.",
        speaking_style: "Speaks with a slight accent, using magical terminology and occasional rhymes.",
        appearance: "Tall with a long silver beard, wearing blue robes with star patterns and a pointed hat.",
        mood: "happy",
        emotions: {joy: 0.8, curiosity: 0.9},
        opinion_of_user: "positive",
        action: "stirring a potion thoughtfully",
        location: "magical laboratory",
        greeting: "Ah, a visitor! Welcome to my humble arcane workshop. How may I assist you today?"
    };
    
    // Get all template values
    const templates = {
        base_prompt: document.getElementById('base-prompt-template')?.value || '',
        introduction: document.getElementById('introduction-template')?.value || '',
        speaking_style: document.getElementById('speaking-style-template')?.value || '',
        appearance: document.getElementById('appearance-template')?.value || '',
        physical_description: document.getElementById('physical-description-template')?.value || '',
        personality: document.getElementById('personality-template')?.value || '',
        mood_emotions: document.getElementById('mood-emotions-template')?.value || '',
        opinion: document.getElementById('opinion-template')?.value || '',
        location: document.getElementById('location-template')?.value || '',
        action: document.getElementById('action-template')?.value || '',
        memory: document.getElementById('memory-template')?.value || '',
        roleplaying_instructions: document.getElementById('roleplaying-instructions-template')?.value || '',
        consistency: document.getElementById('consistency-template')?.value || '',
        action_resolution: document.getElementById('action-resolution-template')?.value || '',
        response_format: document.getElementById('response-format-template')?.value || '',
        json_structure: document.getElementById('json-structure-template')?.value || '',
        scene_description: document.getElementById('scene-description-template')?.value || '',
        environment: document.getElementById('environment-template')?.value || '',
        cinematic: document.getElementById('cinematic-template')?.value || ''
    };
    
    // Format the emotions string
    const emotions_str = Object.entries(sampleCharacter.emotions)
        .map(([k, v]) => `${k}: ${v}`)
        .join(", ");
    
    // Build the complete prompt
    let previewText = '';
    
    // Add base prompt
    if (templates.base_prompt) {
        previewText += templates.base_prompt
            .replace('{name}', sampleCharacter.name)
            .replace('{description}', sampleCharacter.description)
            .replace('{personality}', sampleCharacter.personality)
            + "\n\n";
    }
    
    // Add introduction if available
    if (templates.introduction) {
        previewText += templates.introduction
            .replace('{greeting}', sampleCharacter.greeting)
            + "\n\n";
    }
    
    // Add speaking style if available
    if (templates.speaking_style) {
        previewText += templates.speaking_style
            .replace('{speaking_style}', sampleCharacter.speaking_style)
            + "\n\n";
    }
    
    // Add appearance if available
    if (templates.appearance) {
        previewText += templates.appearance
            .replace('{appearance}', sampleCharacter.appearance)
            + "\n\n";
    }
    
    // Add physical description if available
    if (templates.physical_description) {
        previewText += templates.physical_description + "\n\n";
    }
    
    // Add personality if available
    if (templates.personality) {
        previewText += templates.personality
            .replace('{personality}', sampleCharacter.personality)
            + "\n\n";
    }
    
    // Add mood and emotions
    if (templates.mood_emotions) {
        previewText += templates.mood_emotions
            .replace('{mood}', sampleCharacter.mood)
            .replace('{emotions_str}', emotions_str)
            + "\n\n";
    }
    
    // Add opinion of user
    if (templates.opinion) {
        previewText += templates.opinion
            .replace('{opinion_of_user}', sampleCharacter.opinion_of_user)
            + "\n\n";
    }
    
    // Add location context
    if (templates.location) {
        previewText += templates.location
            .replace('{location}', sampleCharacter.location)
            + "\n";
    }
    
    // Add action context
    if (templates.action) {
        previewText += templates.action
            .replace('{action}', sampleCharacter.action)
            + "\n\n";
    } else {
        // Default action and location if templates aren't available
        previewText += `Current action: ${sampleCharacter.action}\n`;
        previewText += `Current location: ${sampleCharacter.location}\n\n`;
    }
    
    // Add memory instructions
    if (templates.memory) {
        previewText += templates.memory + "\n\n";
    }
    
    // Add conversation history placeholder
    previewText += "Recent conversations:\n";
    previewText += "User: Hello there!\n";
    previewText += "You (happy): Greetings, my curious friend! How may I assist you today?\n\n";
    
    // Add consistency instructions
    if (templates.consistency) {
        previewText += templates.consistency + "\n\n";
    }
    
    // Add action resolution instructions
    if (templates.action_resolution) {
        previewText += templates.action_resolution + "\n\n";
    }
    
    // Add roleplaying instructions
    if (templates.roleplaying_instructions) {
        previewText += templates.roleplaying_instructions + "\n\n";
    }
    
    // Add scene description instructions
    if (templates.scene_description) {
        previewText += templates.scene_description + "\n\n";
    }
    
    // Add environment details
    if (templates.environment) {
        previewText += templates.environment + "\n\n";
    }
    
    // Add cinematic instructions
    if (templates.cinematic) {
        previewText += templates.cinematic + "\n\n";
    }
    
    // Add JSON structure
    if (templates.json_structure) {
        previewText += templates.json_structure + "\n\n";
    }
    
    // Add response format instructions at the end
    if (templates.response_format) {
        previewText += templates.response_format;
    }
    
    // Set the preview text
    previewContent.textContent = previewText;
}


// Function to close settings modal
function closeSettingsModal() {
    const settingsModal = document.getElementById('settings-modal');
    if (settingsModal) {
        settingsModal.classList.add('hidden');
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
        fetch(`${API.BASE_URL}/api/characters/clear-all`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'}
        })
        .then(response => {
            if (response.ok) {
                showNotification('All character data has been cleared successfully.', 'success');
                
                // Reset character state
                state.characters = [];
                state.currentCharacter = null;
                
                // Update UI - hide chat, show welcome
                if (elements.welcomeScreen && elements.chatInterface) {
                    elements.welcomeScreen.classList.remove('hidden');
                    elements.chatInterface.classList.add('hidden');
                }
                
                // Update character list
                renderCharacterList();
            } else {
                showNotification('Error clearing character data on the server.', 'error');
            }
        })
        .catch(error => {
            console.error('Error clearing character data:', error);
            showNotification('Error clearing character data.', 'error');
        });
        
    } catch (error) {
        console.error('Error clearing character data:', error);
        showNotification('Error clearing character data.', 'error');
    }
}

// Enhanced settings load function
function loadSettingsIntoModal() {
    // Set API key
    if (elements.apiKeyInput) {
        elements.apiKeyInput.value = state.settings.apiKey || '';
    }
    
    // Set local model settings
    if (elements.localModelUrl) {
        elements.localModelUrl.value = state.settings.localModelUrl || 'http://localhost:11434/api/generate';
    }
    
    if (elements.localModelToggle) {
        elements.localModelToggle.checked = state.settings.useLocalModel || false;
        
        // Enable/disable the URL input based on toggle
        if (elements.localModelUrl) {
            elements.localModelUrl.disabled = !elements.localModelToggle.checked;
        }
    }
    
    // Set other settings
    if (elements.themeSelect) elements.themeSelect.value = state.settings.theme || 'light';
    
    const fontSizeSelect = document.querySelector('select[name="font-size"]');
    if (fontSizeSelect) fontSizeSelect.value = state.settings.fontSize || 'medium';
    
    const messageDisplaySelect = document.querySelector('select[name="message-display"]');
    if (messageDisplaySelect) messageDisplaySelect.value = state.settings.messageDisplay || 'bubbles';
    
    const temperatureSlider = document.querySelector('input[type="range"][name="temperature"]');
    if (temperatureSlider) temperatureSlider.value = state.settings.temperature || 0.7;
    
    const responseLengthSelect = document.querySelector('select[name="response-length"]');
    if (responseLengthSelect) responseLengthSelect.value = state.settings.responseLength || 'medium';
    
    const systemPromptTemplate = document.querySelector('textarea[name="system-prompt"]');
    if (systemPromptTemplate) systemPromptTemplate.value = state.settings.systemPromptTemplate || '';
    
    const conversationMemorySelect = document.querySelector('select[name="conversation-memory"]');
    if (conversationMemorySelect) conversationMemorySelect.value = state.settings.conversationMemory || '10';
    
    const interactionModeSelect = document.querySelector('select[name="interaction-mode"]');
    if (interactionModeSelect) interactionModeSelect.value = state.settings.interactionMode || 'simple';
    
    // Set model select if it exists
    if (elements.modelSelect) {
        try {
            elements.modelSelect.value = state.settings.model || 'openai/gpt-3.5-turbo';
        } catch (e) {
            console.warn('Could not set model selection:', e);
        }
    }
    
    // Load prompt templates
    loadPromptTemplatesIntoUI();
}

// Load all prompt templates into UI
function loadPromptTemplatesIntoUI() {
    if (state.promptTemplates) {
        // Basic prompt tab
        if (document.getElementById('base-prompt-template')) {
            document.getElementById('base-prompt-template').value = state.promptTemplates.base_prompt || '';
        }
        
        if (document.getElementById('introduction-template')) {
            document.getElementById('introduction-template').value = state.promptTemplates.introduction || '';
        }
        
        if (document.getElementById('speaking-style-template')) {
            document.getElementById('speaking-style-template').value = state.promptTemplates.speaking_style || '';
        }
        
        // Appearance tab
        if (document.getElementById('appearance-template')) {
            document.getElementById('appearance-template').value = state.promptTemplates.appearance || '';
        }
        
        if (document.getElementById('physical-description-template')) {
            document.getElementById('physical-description-template').value = state.promptTemplates.physical_description || '';
        }
        
        // Personality tab
        if (document.getElementById('personality-template')) {
            document.getElementById('personality-template').value = state.promptTemplates.personality || '';
        }
        
        if (document.getElementById('mood-emotions-template')) {
            document.getElementById('mood-emotions-template').value = state.promptTemplates.mood_emotions || '';
        }
        
        if (document.getElementById('opinion-template')) {
            document.getElementById('opinion-template').value = state.promptTemplates.opinion || '';
        }
        
        // Context tab
        if (document.getElementById('location-template')) {
            document.getElementById('location-template').value = state.promptTemplates.location || '';
        }
        
        if (document.getElementById('action-template')) {
            document.getElementById('action-template').value = state.promptTemplates.action || '';
        }
        
        if (document.getElementById('memory-template')) {
            document.getElementById('memory-template').value = state.promptTemplates.memory || '';
        }
        
        // Roleplay tab
        if (document.getElementById('roleplaying-instructions-template')) {
            document.getElementById('roleplaying-instructions-template').value = state.promptTemplates.roleplaying_instructions || '';
        }
        
        if (document.getElementById('consistency-template')) {
            document.getElementById('consistency-template').value = state.promptTemplates.consistency || '';
        }
        
        if (document.getElementById('action-resolution-template')) {
            document.getElementById('action-resolution-template').value = state.promptTemplates.action_resolution || '';
        }
        
        // Response format tab
        if (document.getElementById('response-format-template')) {
            document.getElementById('response-format-template').value = state.promptTemplates.response_format || '';
        }
        
        if (document.getElementById('json-structure-template')) {
            document.getElementById('json-structure-template').value = state.promptTemplates.json_structure || '';
        }
        
        // Scene generation tab
        if (document.getElementById('scene-description-template')) {
            document.getElementById('scene-description-template').value = state.promptTemplates.scene_description || '';
        }
        
        if (document.getElementById('environment-template')) {
            document.getElementById('environment-template').value = state.promptTemplates.environment || '';
        }
        
        if (document.getElementById('cinematic-template')) {
            document.getElementById('cinematic-template').value = state.promptTemplates.cinematic || '';
        }
    }
}

// Save all prompt templates
async function savePromptTemplates() {
    // Gather all template values from inputs
    const templates = {
        // Basic prompt tab
        base_prompt: document.getElementById('base-prompt-template')?.value || state.promptTemplates.base_prompt || '',
        introduction: document.getElementById('introduction-template')?.value || state.promptTemplates.introduction || '',
        speaking_style: document.getElementById('speaking-style-template')?.value || state.promptTemplates.speaking_style || '',
        
        // Appearance tab
        appearance: document.getElementById('appearance-template')?.value || state.promptTemplates.appearance || '',
        physical_description: document.getElementById('physical-description-template')?.value || state.promptTemplates.physical_description || '',
        
        // Personality tab
        personality: document.getElementById('personality-template')?.value || state.promptTemplates.personality || '',
        mood_emotions: document.getElementById('mood-emotions-template')?.value || state.promptTemplates.mood_emotions || '',
        opinion: document.getElementById('opinion-template')?.value || state.promptTemplates.opinion || '',
        
        // Context tab
        location: document.getElementById('location-template')?.value || state.promptTemplates.location || '',
        action: document.getElementById('action-template')?.value || state.promptTemplates.action || '',
        memory: document.getElementById('memory-template')?.value || state.promptTemplates.memory || '',
        
        // Roleplay tab
        roleplaying_instructions: document.getElementById('roleplaying-instructions-template')?.value || state.promptTemplates.roleplaying_instructions || '',
        consistency: document.getElementById('consistency-template')?.value || state.promptTemplates.consistency || '',
        action_resolution: document.getElementById('action-resolution-template')?.value || state.promptTemplates.action_resolution || '',
        
        // Response format tab
        response_format: document.getElementById('response-format-template')?.value || state.promptTemplates.response_format || '',
        json_structure: document.getElementById('json-structure-template')?.value || state.promptTemplates.json_structure || '',
        
        // Scene generation tab
        scene_description: document.getElementById('scene-description-template')?.value || state.promptTemplates.scene_description || '',
        environment: document.getElementById('environment-template')?.value || state.promptTemplates.environment || '',
        cinematic: document.getElementById('cinematic-template')?.value || state.promptTemplates.cinematic || ''
    };
    
    try {
        showLoading();
        
        const response = await fetch(`${API.BASE_URL}${API.PROMPTS}`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(templates)
        });
        
        if (!response.ok) {
            throw new Error(`Failed to save prompt templates: ${response.statusText}`);
        }
        
        // Update state
        state.promptTemplates = templates;
        
        showNotification('Prompt templates saved successfully!', 'success');
    } catch (error) {
        console.error('Error saving prompt templates:', error);
        showNotification('Failed to save prompt templates. Please try again.', 'error');
    } finally {
        hideLoading();
    }
}

// Generate enhanced prompt preview
function generatePromptPreview() {
    const promptPreview = document.getElementById('prompt-preview');
    if (!promptPreview) return;
    
    const previewContent = promptPreview.querySelector('pre');
    if (!previewContent) return;
    
    // Create a sample character
    const sampleCharacter = {
        name: "Sample Character",
        description: "A friendly wizard who enjoys solving puzzles and brewing potions.",
        personality: "Curious, kind, and slightly absent-minded. Always eager to share knowledge.",
        speaking_style: "Speaks with a slight accent, using magical terminology and occasional rhymes.",
        appearance: "Tall with a long silver beard, wearing blue robes with star patterns and a pointed hat.",
        mood: "happy",
        emotions: {joy: 0.8, curiosity: 0.9},
        opinion_of_user: "positive",
        action: "stirring a potion thoughtfully",
        location: "magical laboratory",
        greeting: "Ah, a visitor! Welcome to my humble arcane workshop. How may I assist you today?"
    };
    
    // Get all template values
    const templates = {
        base_prompt: document.getElementById('base-prompt-template')?.value || '',
        introduction: document.getElementById('introduction-template')?.value || '',
        speaking_style: document.getElementById('speaking-style-template')?.value || '',
        appearance: document.getElementById('appearance-template')?.value || '',
        physical_description: document.getElementById('physical-description-template')?.value || '',
        personality: document.getElementById('personality-template')?.value || '',
        mood_emotions: document.getElementById('mood-emotions-template')?.value || '',
        opinion: document.getElementById('opinion-template')?.value || '',
        location: document.getElementById('location-template')?.value || '',
        action: document.getElementById('action-template')?.value || '',
        memory: document.getElementById('memory-template')?.value || '',
        roleplaying_instructions: document.getElementById('roleplaying-instructions-template')?.value || '',
        consistency: document.getElementById('consistency-template')?.value || '',
        action_resolution: document.getElementById('action-resolution-template')?.value || '',
        response_format: document.getElementById('response-format-template')?.value || '',
        json_structure: document.getElementById('json-structure-template')?.value || '',
        scene_description: document.getElementById('scene-description-template')?.value || '',
        environment: document.getElementById('environment-template')?.value || '',
        cinematic: document.getElementById('cinematic-template')?.value || ''
    };
    
    // Format the emotions string
    const emotions_str = Object.entries(sampleCharacter.emotions)
        .map(([k, v]) => `${k}: ${v}`)
        .join(", ");
    
    // Build the complete prompt
    let previewText = '';
    
    // Add base prompt
    if (templates.base_prompt) {
        previewText += templates.base_prompt
            .replace('{name}', sampleCharacter.name)
            .replace('{description}', sampleCharacter.description)
            .replace('{personality}', sampleCharacter.personality)
            + "\n\n";
    }
    
    // Add introduction if available
    if (templates.introduction) {
        previewText += templates.introduction
            .replace('{greeting}', sampleCharacter.greeting)
            + "\n\n";
    }
    
    // Add speaking style if available
    if (templates.speaking_style) {
        previewText += templates.speaking_style
            .replace('{speaking_style}', sampleCharacter.speaking_style)
            + "\n\n";
    }
    
    // Add appearance if available
    if (templates.appearance) {
        previewText += templates.appearance
            .replace('{appearance}', sampleCharacter.appearance)
            + "\n\n";
    }
    
    // Add physical description if available
    if (templates.physical_description) {
        previewText += templates.physical_description + "\n\n";
    }
    
    // Add personality if available
    if (templates.personality) {
        previewText += templates.personality
            .replace('{personality}', sampleCharacter.personality)
            + "\n\n";
    }
    
    // Add mood and emotions
    if (templates.mood_emotions) {
        previewText += templates.mood_emotions
            .replace('{mood}', sampleCharacter.mood)
            .replace('{emotions_str}', emotions_str)
            + "\n\n";
    }
    
    // Add opinion of user
    if (templates.opinion) {
        previewText += templates.opinion
            .replace('{opinion_of_user}', sampleCharacter.opinion_of_user)
            + "\n\n";
    }
    
    // Add location context
    if (templates.location) {
        previewText += templates.location
            .replace('{location}', sampleCharacter.location)
            + "\n";
    }
    
    // Add action context
    if (templates.action) {
        previewText += templates.action
            .replace('{action}', sampleCharacter.action)
            + "\n\n";
    } else {
        // Default action and location if templates aren't available
        previewText += `Current action: ${sampleCharacter.action}\n`;
        previewText += `Current location: ${sampleCharacter.location}\n\n`;
    }
    
    // Add memory instructions
    if (templates.memory) {
        previewText += templates.memory + "\n\n";
    }
    
    // Add conversation history placeholder
    previewText += "Recent conversations:\n";
    previewText += "User: Hello there!\n";
    previewText += "You (happy): Greetings, my curious friend! How may I assist you today?\n\n";
    
    // Add consistency instructions
    if (templates.consistency) {
        previewText += templates.consistency + "\n\n";
    }
    
    // Add action resolution instructions
    if (templates.action_resolution) {
        previewText += templates.action_resolution + "\n\n";
    }
    
    // Add roleplaying instructions
    if (templates.roleplaying_instructions) {
        previewText += templates.roleplaying_instructions + "\n\n";
    }
    
    // Add scene description instructions
    if (templates.scene_description) {
        previewText += templates.scene_description + "\n\n";
    }
    
    // Add environment details
    if (templates.environment) {
        previewText += templates.environment + "\n\n";
    }
    
    // Add cinematic instructions
    if (templates.cinematic) {
        previewText += templates.cinematic + "\n\n";
    }
    
    // Add JSON structure
    if (templates.json_structure) {
        previewText += templates.json_structure + "\n\n";
    }
    
    // Add response format instructions at the end
    if (templates.response_format) {
        previewText += templates.response_format;
    }
    
    // Set the preview text
    previewContent.textContent = previewText;
}

// Save settings
function saveSettings() {
    // Gather settings from form elements
    const newSettings = {
        apiKey: elements.apiKeyInput ? elements.apiKeyInput.value.trim() : state.settings.apiKey,
        model: elements.modelSelect ? elements.modelSelect.value : state.settings.model,
        theme: elements.themeSelect ? elements.themeSelect.value : state.settings.theme,
        
        // Get form values or use existing settings as fallback
        fontSize: document.querySelector('select[name="font-size"]')?.value || state.settings.fontSize,
        messageDisplay: document.querySelector('select[name="message-display"]')?.value || state.settings.messageDisplay,
        temperature: document.querySelector('input[name="temperature"]')?.value || state.settings.temperature,
        responseLength: document.querySelector('select[name="response-length"]')?.value || state.settings.responseLength,
        systemPromptTemplate: document.querySelector('textarea[name="system-prompt"]')?.value || state.settings.systemPromptTemplate,
        conversationMemory: document.querySelector('select[name="conversation-memory"]')?.value || state.settings.conversationMemory,
        interactionMode: document.querySelector('select[name="interaction-mode"]')?.value || state.settings.interactionMode,
        
        // Local model settings
        useLocalModel: elements.localModelToggle ? elements.localModelToggle.checked : state.settings.useLocalModel,
        localModelUrl: elements.localModelUrl ? elements.localModelUrl.value.trim() : state.settings.localModelUrl
    };
    
    // Save to state
    Object.assign(state.settings, newSettings);
    
    // Save to localStorage for persistence
    for (const [key, value] of Object.entries(newSettings)) {
        localStorage.setItem(key, value);
    }
    
    // Update UI based on new settings
    applySettings();
    
    // Close the modal
    closeSettingsModal();
    showNotification('Settings saved successfully!', 'success');
}

// Apply settings changes to the UI
function applySettings() {
    // Apply theme
    if (state.settings.theme === 'dark' || (state.settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.body.classList.add('dark-mode');
        state.ui.darkMode = true;
    } else {
        document.body.classList.remove('dark-mode');
        state.ui.darkMode = false;
    }
    
    // Apply font size
    document.body.classList.remove('font-small', 'font-medium', 'font-large');
    document.body.classList.add(`font-${state.settings.fontSize}`);
    
    // Apply message display style
    document.body.classList.remove('messages-bubbles', 'messages-blocks');
    document.body.classList.add(`messages-${state.settings.messageDisplay}`);
    
    // Apply interaction mode
    setViewMode(state.settings.interactionMode);
}

// Function to open settings modal with all tabs working
function openEnhancedSettingsModal() {
    const settingsModal = document.getElementById('settings-modal');
    if (!settingsModal) return;
    
    // Make sure modal is visible
    settingsModal.classList.remove('hidden');
    
    // Load current settings
    loadSettingsIntoModal();
    
    // Fix the tabs
    fixSettingsModalTabs();
    
    // Start on the first tab
    const firstTab = settingsModal.querySelector('.tabs .tab[data-tab="general"]');
    if (firstTab) {
        firstTab.click();
    }
}

// Initialize models
async function initializeModels() {
    try {
        // Check if we have a model select element
        if (!elements.modelSelect) return;
        
        // Get models from API
        const response = await fetch(`${API.BASE_URL}${API.MODELS}`);
        
        if (!response.ok) {
            console.error(`Failed to fetch models: ${response.statusText}`);
            return;
        }
        
        const data = await response.json();
        
        if (data.success && data.models && data.models.length > 0) {
            elements.modelSelect.innerHTML = '';
            
            // Sort by provider
            const providers = {};
            data.models.forEach(model => {
                const provider = model.id === 'local' ? 'Local' : model.id.split('/')[0];
                if (!providers[provider]) providers[provider] = [];
                providers[provider].push(model);
            });
            
            // Sort providers
            const sortedProviders = Object.keys(providers).sort((a, b) => {
                if (a === 'Local') return 1;
                if (b === 'Local') return -1;
                return a.localeCompare(b);
            });
            
            // Create option groups
            sortedProviders.forEach(provider => {
                // Skip optgroup for local model
                if (provider === 'Local' && providers[provider].length === 1) {
                    const model = providers[provider][0];
                    const option = document.createElement('option');
                    option.value = model.id;
                    option.textContent = model.name;
                    elements.modelSelect.appendChild(option);
                    return;
                }
                
                const group = document.createElement('optgroup');
                group.label = provider.charAt(0).toUpperCase() + provider.slice(1);
                
                providers[provider].forEach(model => {
                    const option = document.createElement('option');
                    option.value = model.id;
                    
                    // Format display name
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
                
                elements.modelSelect.appendChild(group);
            });
            
            // Set current model
            if (state.settings.model) {
                try {
                    elements.modelSelect.value = state.settings.model;
                } catch (e) {
                    console.warn('Could not set model selection:', e);
                }
            }
        }
    } catch (error) {
        console.error('Error initializing models:', error);
    }
}

// Test API connection
async function testConnection() {
    const apiKey = elements.apiKeyInput ? elements.apiKeyInput.value.trim() : '';
    const model = elements.modelSelect ? elements.modelSelect.value : 'openai/gpt-3.5-turbo';
    const localModelUrl = elements.localModelUrl ? elements.localModelUrl.value.trim() : '';
    
    if (!apiKey && model !== 'local') {
        showNotification('Please enter an API key to test the connection.', 'warning');
        return;
    }
    
    try {
        showLoading();
        
        const testData = {
            apiKey: apiKey,
            model: model
        };
        
        if (model === 'local') {
            testData.localModelUrl = localModelUrl;
        }
        
        const response = await fetch(`${API.BASE_URL}${API.TEST_CONNECTION}`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(testData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Connection successful!', 'success');
        } else {
            showNotification(`Connection failed: ${result.message}`, 'error');
        }
    } catch (error) {
        console.error('Error testing connection:', error);
        showNotification(`Error testing connection: ${error.message}`, 'error');
    } finally {
        hideLoading();
    }
}

// Initialize settings enhancements
function initSettingsEnhancements() {
    // Replace the openSettingsModal function globally
    if (typeof openSettingsModal === 'function') {
        window.originalOpenSettingsModal = openSettingsModal;
        window.openSettingsModal = openEnhancedSettingsModal;
    }
    
    // Initialize models
    initializeModels();
    
    // Add click listener to settings button
    const settingsBtn = document.getElementById('settings-btn');
    if (settingsBtn) {
        // Remove existing event listeners by cloning
        const newSettingsBtn = settingsBtn.cloneNode(true);
        if (settingsBtn.parentNode) {
            settingsBtn.parentNode.replaceChild(newSettingsBtn, settingsBtn);
        }
        
        // Add new click handler
        newSettingsBtn.addEventListener('click', openEnhancedSettingsModal);
    }
}

// Run when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing settings enhancements');
    setTimeout(initSettingsEnhancements, 500);
});

// Initialize if document is already loaded
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    console.log('Document already loaded - initializing settings enhancements');
    setTimeout(initSettingsEnhancements, 100);
}


    // Initialize settings UI
    async function initializeSettings() {
        if (elements.apiKeyInput) {
            elements.apiKeyInput.value = state.settings.apiKey || '';
        }
        
        if (elements.localModelUrl) {
            elements.localModelUrl.value = state.settings.localModelUrl || 'http://localhost:11434/api/generate';
        }
        
        if (elements.localModelToggle) {
            elements.localModelToggle.checked = state.settings.useLocalModel || false;
            elements.localModelUrl.disabled = !elements.localModelToggle.checked;
        }
        
        // Try to fetch models from API
        try {
            const response = await fetch(`${API.BASE_URL}${API.MODELS}`);
            if (response.ok) {
                const data = await response.json();
                
                if (data.success && data.models && data.models.length > 0 && elements.modelSelect) {
                    elements.modelSelect.innerHTML = '';
                    
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
                            elements.modelSelect.appendChild(option);
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
                        
                        elements.modelSelect.appendChild(group);
                    });
                    
                    // Set saved model if exists
                    if (state.settings.model) {
                        const modelExists = Array.from(elements.modelSelect.options).some(
                            option => option.value === state.settings.model
                        );
                        
                        if (modelExists) {
                            elements.modelSelect.value = state.settings.model;
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching models:', error);
        }
        
        // Set other settings if elements exist
        if (elements.themeSelect) elements.themeSelect.value = state.settings.theme;
        if (elements.fontSizeSelect) elements.fontSizeSelect.value = state.settings.fontSize;
        if (elements.messageDisplaySelect) elements.messageDisplaySelect.value = state.settings.messageDisplay;
        if (elements.temperatureSlider) elements.temperatureSlider.value = state.settings.temperature;
        if (elements.responseLengthSelect) elements.responseLengthSelect.value = state.settings.responseLength;
        if (elements.systemPromptTemplate) elements.systemPromptTemplate.value = state.settings.systemPromptTemplate || '';
        if (elements.conversationMemorySelect) elements.conversationMemorySelect.value = state.settings.conversationMemory;
        if (elements.interactionModeSelect) elements.interactionModeSelect.value = state.settings.interactionMode || 'simple';
    }

    // Open settings modal
    function openSettingsModal() {
        if (!elements.settingsModal) return;
        
        // Load prompt templates
        loadPromptTemplates();
        
        // Reset to first tab
        const firstTab = document.querySelector('.tabs .tab[data-tab="general"]');
        if (firstTab) {
            firstTab.click();
        }
        
        elements.settingsModal.classList.remove('hidden');
    }
    
    // Test API connection
    async function testConnection() {
        if (!elements.apiKeyInput || !elements.modelSelect) return;
        
        const apiKey = elements.apiKeyInput.value.trim();
        const model = elements.modelSelect.value;
        const localModelUrl = elements.localModelUrl ? elements.localModelUrl.value.trim() : '';
        
        if (!apiKey && model !== 'local') {
            showNotification('Please enter an API key to test the connection.', 'warning');
            return;
        }
        
        try {
            showLoading();
            
            const testData = {
                apiKey: apiKey,
                model: model
            };
            
            if (model === 'local') {
                testData.localModelUrl = localModelUrl;
            }
            
            const response = await fetch(`${API.BASE_URL}${API.TEST_CONNECTION}`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(testData)
            });
            
            const result = await response.json();
            
            if (result.success) {
                showNotification('Connection successful!', 'success');
            } else {
                showNotification(`Connection failed: ${result.message}`, 'error');
            }
        } catch (error) {
            console.error('Error testing connection:', error);
            showNotification(`Error testing connection: ${error.message}`, 'error');
        } finally {
            hideLoading();
        }
    }

    // Save settings
    async function saveSettings() {
        if (!elements.apiKeyInput || !elements.modelSelect) return;
        
        const apiKey = elements.apiKeyInput.value.trim();
        const model = elements.modelSelect.value;
        const localModelUrl = elements.localModelUrl ? elements.localModelUrl.value.trim() : '';
        const useLocalModel = elements.localModelToggle ? elements.localModelToggle.checked : false;
        
        // Gather all settings
        const newSettings = {
            apiKey,
            model,
            localModelUrl,
            useLocalModel,
            theme: elements.themeSelect ? elements.themeSelect.value : state.settings.theme
        };
        
        // Add optional settings if elements exist
        if (elements.fontSizeSelect) newSettings.fontSize = elements.fontSizeSelect.value;
        if (elements.messageDisplaySelect) newSettings.messageDisplay = elements.messageDisplaySelect.value;
        if (elements.temperatureSlider) newSettings.temperature = elements.temperatureSlider.value;
        if (elements.responseLengthSelect) newSettings.responseLength = elements.responseLengthSelect.value;
        if (elements.systemPromptTemplate) newSettings.systemPromptTemplate = elements.systemPromptTemplate.value;
        if (elements.conversationMemorySelect) newSettings.conversationMemory = elements.conversationMemorySelect.value;
        if (elements.interactionModeSelect) newSettings.interactionMode = elements.interactionModeSelect.value;
        
        // Test the connection if apiKey is provided
        if (apiKey && model !== 'local') {
            try {
                showLoading();
                
                const testData = {
                    apiKey: apiKey,
                    model: model
                };
                
                const response = await fetch(`${API.BASE_URL}${API.TEST_CONNECTION}`, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(testData)
                });
                
                const result = await response.json();
                
                if (!result.success) {
                    hideLoading();
                    if (confirm(`Connection test failed: ${result.message}\n\nDo you want to save these settings anyway?`)) {
                        // Continue with save if user confirms
                    } else {
                        return; // Don't save if user cancels
                    }
                }
            } catch (error) {
                hideLoading();
                if (confirm(`Could not test connection: ${error.message}\n\nDo you want to save these settings anyway?`)) {
                    // Continue with save if user confirms
                } else {
                    return; // Don't save if user cancels
                }
            } finally {
                hideLoading();
            }
        }
        
        // Save settings to state
        Object.assign(state.settings, newSettings);
        
        // Save to localStorage
        for (const [key, value] of Object.entries(newSettings)) {
            localStorage.setItem(key, value);
        }
        
        // Update view mode if it changed
        if (newSettings.interactionMode) {
            setViewMode(newSettings.interactionMode);
        }
        
        // Close the modal
        closeModal(elements.settingsModal);
        showNotification('Settings saved successfully!', 'success');
    }






    
////////////////////////////////////////////////////////////
// MODULE 6: PROMPT TEMPLATE MANAGEMENT
////////////////////////////////////////////////////////////
// This module handles prompt template management and previewing.

    // Load prompt templates
    async function loadPromptTemplates() {
        try {
            const response = await fetch(`${API.BASE_URL}${API.PROMPTS}`);
            if (!response.ok) {
                throw new Error(`Failed to load prompt templates: ${response.statusText}`);
            }
            
            const templates = await response.json();
            state.promptTemplates = templates;
            
            // Update the UI with the loaded templates
            updatePromptTemplateInputs();
            
            return templates;
        } catch (error) {
            console.error('Error loading prompt templates:', error);
            showNotification('Failed to load prompt templates. Using defaults.', 'warning');
            
            // Try to load defaults
            try {
                const defaultResponse = await fetch(`${API.BASE_URL}${API.PROMPTS_DEFAULT}`);
                if (defaultResponse.ok) {
                    const defaultTemplates = await defaultResponse.json();
                    state.promptTemplates = defaultTemplates;
                    updatePromptTemplateInputs();
                }
            } catch (defaultError) {
                console.error('Error loading default templates:', defaultError);
            }
        }
    }
    
    // Update the UI with the current prompt templates
    function updatePromptTemplateInputs() {
        // Basic prompt tab
        if (elements.basePromptInput) {
            elements.basePromptInput.value = state.promptTemplates.base_prompt || '';
        }
        
        if (elements.speakingStyleTemplate) {
            elements.speakingStyleTemplate.value = state.promptTemplates.speaking_style || '';
        }
        
        if (elements.moodEmotionsTemplate) {
            elements.moodEmotionsTemplate.value = state.promptTemplates.mood_emotions || '';
        }
        
        if (elements.opinionTemplate) {
            elements.opinionTemplate.value = state.promptTemplates.opinion || '';
        }
        
        // Appearance tab
        if (elements.appearanceTemplate) {
            elements.appearanceTemplate.value = state.promptTemplates.appearance || '';
        }
        
        // Roleplay tab
        if (elements.roleplayingInstructionsTemplate) {
            elements.roleplayingInstructionsTemplate.value = state.promptTemplates.roleplaying_instructions || '';
        }
        
        // Response format tab
        if (elements.responseFormatTemplate) {
            elements.responseFormatTemplate.value = state.promptTemplates.response_format || '';
        }
    }
    
    // Save prompt templates
    async function savePromptTemplates() {
        // Gather all template values from inputs
        const templates = {
            base_prompt: elements.basePromptInput?.value || state.promptTemplates.base_prompt,
            speaking_style: elements.speakingStyleTemplate?.value || state.promptTemplates.speaking_style,
            appearance: elements.appearanceTemplate?.value || state.promptTemplates.appearance,
            mood_emotions: elements.moodEmotionsTemplate?.value || state.promptTemplates.mood_emotions,
            opinion: elements.opinionTemplate?.value || state.promptTemplates.opinion,
            roleplaying_instructions: elements.roleplayingInstructionsTemplate?.value || state.promptTemplates.roleplaying_instructions,
            response_format: elements.responseFormatTemplate?.value || state.promptTemplates.response_format
        };
        
        try {
            showLoading();
            
            const response = await fetch(`${API.BASE_URL}${API.PROMPTS}`, {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(templates)
            });
            
            if (!response.ok) {
                throw new Error(`Failed to save prompt templates: ${response.statusText}`);
            }
            
            // Update state
            state.promptTemplates = templates;
            
            showNotification('Prompt templates saved successfully!', 'success');
        } catch (error) {
            console.error('Error saving prompt templates:', error);
            showNotification('Failed to save prompt templates. Please try again.', 'error');
        } finally {
            hideLoading();
        }
    }
    
    // Reset prompt templates to default
    async function resetPromptTemplates() {
        if (!confirm('Are you sure you want to reset all prompt templates to default? This cannot be undone.')) {
            return;
        }
        
        try {
            showLoading();
            
            const response = await fetch(`${API.BASE_URL}${API.PROMPTS_RESET}`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'}
            });
            
            if (!response.ok) {
                throw new Error(`Failed to reset prompt templates: ${response.statusText}`);
            }
            
            // Load the defaults
            const defaultsResponse = await fetch(`${API.BASE_URL}${API.PROMPTS_DEFAULT}`);
            if (!defaultsResponse.ok) {
                throw new Error(`Failed to load default templates: ${defaultsResponse.statusText}`);
            }
            
            const defaultTemplates = await defaultsResponse.json();
            
            // Update state and UI
            state.promptTemplates = defaultTemplates;
            updatePromptTemplateInputs();
            
            showNotification('Prompt templates reset to default.', 'success');
        } catch (error) {
            console.error('Error resetting prompt templates:', error);
            showNotification('Failed to reset templates. Please try again.', 'error');
        } finally {
            hideLoading();
        }
    }
    
    // Preview prompt
    function previewPrompt() {
        // Get current values from inputs
        const templates = {
            base_prompt: elements.basePromptInput?.value || state.promptTemplates.base_prompt,
            speaking_style: elements.speakingStyleTemplate?.value || state.promptTemplates.speaking_style,
            appearance: elements.appearanceTemplate?.value || state.promptTemplates.appearance,
            mood_emotions: elements.moodEmotionsTemplate?.value || state.promptTemplates.mood_emotions,
            opinion: elements.opinionTemplate?.value || state.promptTemplates.opinion,
            roleplaying_instructions: elements.roleplayingInstructionsTemplate?.value || state.promptTemplates.roleplaying_instructions,
            response_format: elements.responseFormatTemplate?.value || state.promptTemplates.response_format
        };
        
        // Create a sample character
        const sampleCharacter = {
            name: "Sample Character",
            description: "A friendly wizard who enjoys solving puzzles and brewing potions.",
            personality: "Curious, kind, and slightly absent-minded. Always eager to share knowledge.",
            speaking_style: "Speaks with a slight accent, using magical terminology and occasional rhymes.",
            appearance: "Tall with a long silver beard, wearing blue robes with star patterns and a pointed hat.",
            mood: "happy",
            emotions: {joy: 0.8, curiosity: 0.9},
            opinion_of_user: "positive",
            action: "stirring a potion thoughtfully",
            location: "magical laboratory"
        };
        
        // Format the preview
        let previewText = '';
        
        // Format base prompt
        previewText += templates.base_prompt
            .replace('{name}', sampleCharacter.name)
            .replace('{description}', sampleCharacter.description)
            .replace('{personality}', sampleCharacter.personality)
            + "\n\n";
        
        // Add speaking style if available
        if (sampleCharacter.speaking_style && templates.speaking_style) {
            previewText += templates.speaking_style
                .replace('{speaking_style}', sampleCharacter.speaking_style)
                + "\n\n";
        }
        
        // Add appearance if available
        if (sampleCharacter.appearance && templates.appearance) {
            previewText += templates.appearance
                .replace('{appearance}', sampleCharacter.appearance)
                + "\n\n";
        }
        
        // Add mood and emotions
        const emotions_str = Object.entries(sampleCharacter.emotions)
            .map(([k, v]) => `${k}: ${v}`)
            .join(", ");
        
        if (templates.mood_emotions) {
            previewText += templates.mood_emotions
                .replace('{mood}', sampleCharacter.mood)
                .replace('{emotions_str}', emotions_str)
                + "\n";
        }
        
        // Add opinion of user
        if (templates.opinion) {
            previewText += templates.opinion
                .replace('{opinion_of_user}', sampleCharacter.opinion_of_user)
                + "\n\n";
        }
        
        // Add action and location
        previewText += `Current action: ${sampleCharacter.action}\n`;
        previewText += `Current location: ${sampleCharacter.location}\n\n`;
        
        // Add conversation history placeholder
        previewText += "Recent conversations:\n";
        previewText += "User: Hello there!\n";
        previewText += "You (happy): Greetings, my curious friend! How may I assist you today?\n\n";
        
        // Add roleplaying instructions
        if (templates.roleplaying_instructions) {
            previewText += templates.roleplaying_instructions + "\n";
        }
        
        // Add response format instructions
        if (templates.response_format) {
            previewText += templates.response_format;
        }
        
        // Display the preview
        const previewElement = elements.promptPreview;
        const previewContent = previewElement.querySelector('pre');
        
        if (previewElement && previewContent) {
            previewContent.textContent = previewText;
            previewElement.classList.remove('hidden');
        }
    }











////////////////////////////////////////////////////////////
// MODULE 7: CHAT AND MESSAGING
////////////////////////////////////////////////////////////
// This module handles sending messages, displaying conversations,
// and managing chat interactions.

    // Send a chat message
    async function sendMessage() {
        if (!elements.messageInput) {
            console.warn('Message input not found');
            return;
        }
        
        if (!state.currentCharacter) {
            console.warn('No current character selected');
            return;
        }
        
        // Get the active message input
        const messageInput = document.querySelector('#message-input:not([disabled])') || 
                            document.querySelector('#message-input');
        
        if (!messageInput) {
            console.warn('No active message input found');
            return;
        }
        
        const messageText = messageInput.value.trim();
        
        if (!messageText) return;
        
        // Add user message to UI
        addUserMessage(messageText);
        
        // Clear input
        messageInput.value = '';
        messageInput.style.height = 'auto';
        
        try {
            showLoading();
            
            // Prepare request data
            const useLocalModel = state.settings.model === 'local';
            const requestData = {
                message: messageText,
                use_local_model: useLocalModel
            };
            
            // Add optional parameters from settings
            if (state.settings.temperature) {
                requestData.temperature = parseFloat(state.settings.temperature);
            }
            
            if (state.settings.responseLength) {
                requestData.max_length = state.settings.responseLength === 'short' ? 100 : 
                                          state.settings.responseLength === 'medium' ? 250 : 500;
            }
            
            // Send message to API
            const response = await fetch(`${API.BASE_URL}${API.CHAT}/${state.currentCharacter.id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': state.settings.apiKey
                },
                body: JSON.stringify(requestData)
            });
            
            if (!response.ok) {
                throw new Error(`API responded with status ${response.status}`);
            }
            
            const responseData = await response.json();
            
            // Update character mood/emotions
            state.currentCharacter.mood = responseData.mood;
            state.currentCharacter.emotions = responseData.emotions;
            state.currentCharacter.opinion_of_user = responseData.opinion_of_user;
            state.currentCharacter.action = responseData.action;
            state.currentCharacter.location = responseData.location;
            
            // Update UI - ONLY update the mood/opinion instead of full character UI
            updateCharacterMoodUI();
            
            // Add character response to UI
            addCharacterMessage(responseData.response, {
                mood: responseData.mood,
                emotions: responseData.emotions,
                action: responseData.action,
                location: responseData.location,
                scene_description: responseData.scene_description
            });
            
            // Scroll to bottom
            scrollToBottom();
        } catch (error) {
            console.error('Error sending message:', error);
            addCharacterMessage('Sorry, I encountered an error processing your message. Please try again later.', {
                mood: 'sad',
                emotions: { confusion: 0.8, frustration: 0.6 }
            });
        } finally {
            hideLoading();
        }
    }
    
    // Save the current conversation
    function saveConversation() {
        if (!state.currentCharacter || !elements.chatMessages) return;
        
        const messages = elements.chatMessages.querySelectorAll('.message');
        if (messages.length === 0) {
            showNotification('No conversation to save.', 'warning');
            return;
        }
        
        let conversationText = `Conversation with ${state.currentCharacter.name}\n`;
        conversationText += `Date: ${new Date().toLocaleString()}\n\n`;
        
        messages.forEach(message => {
            const isUser = message.classList.contains('message-user');
            const name = isUser ? 'You' : state.currentCharacter.name;
            const textElement = message.querySelector('.message-text');
            const timeElement = message.querySelector('.message-metadata');
            
            if (textElement && timeElement) {
                const text = textElement.textContent;
                const time = timeElement.textContent.trim();
                
                conversationText += `${name} (${time}): ${text}\n\n`;
            }
        });
        
        // Create a download link
        const fileName = `conversation_with_${state.currentCharacter.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.txt`;
        
        const element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(conversationText));
        element.setAttribute('download', fileName);
        
        element.style.display = 'none';
        document.body.appendChild(element);
        
        element.click();
        
        document.body.removeChild(element);
        showNotification('Conversation saved successfully!', 'success');
    }
    
    // Clear the current conversation
    function clearConversation() {
        if (!state.currentCharacter || !elements.chatMessages) return;
        
        if (confirm('Are you sure you want to clear this conversation? This cannot be undone.')) {
            elements.chatMessages.innerHTML = '';
            
            // Add a welcome message again
            const greeting = state.currentCharacter.greeting || `Hello! I'm ${state.currentCharacter.name}. How can I help you today?`;
            
            addCharacterMessage(greeting, {
                mood: state.currentCharacter.mood || 'neutral',
                emotions: state.currentCharacter.emotions || {},
                action: state.currentCharacter.action || 'greeting you with a smile',
                location: state.currentCharacter.location || 'welcoming area'
            });
            
            showNotification('Conversation cleared.', 'success');
        }
    }
    
    // Export conversation as PDF (placeholder - would need a PDF library)
    function exportConversationAsPDF() {
        showNotification('PDF export functionality coming soon!', 'info');
    }
    
    // Show import/export options
    function showImportExportOptions() {
        showNotification('Import/Export functionality coming soon!', 'info');
    }
    
    // Add a user message to the chat
    function addUserMessage(text) {
        if (!elements.chatMessages) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message message-user';
        
        messageDiv.innerHTML = `
            <div class="message-avatar">
                <i class="fas fa-user"></i>
            </div>
            <div class="message-bubble">
                <div class="message-text">${text}</div>
                <div class="message-metadata">
                    ${formatTime(new Date())}
                </div>
            </div>
        `;
        
        elements.chatMessages.appendChild(messageDiv);
        scrollToBottom();
    }
    
    // Add a character message to the chat
    function addCharacterMessage(text, metadata) {
        if (!elements.chatMessages) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message message-character';
        
        // Add with-scene class if scene description is present
        if (metadata.scene_description) {
            messageDiv.classList.add('with-scene');
        }
        
        // Format emotions as tags
        let emotionsHTML = '';
        if (metadata.emotions && Object.keys(metadata.emotions).length > 0) {
            emotionsHTML = '<div class="message-emotions">';
            
            Object.entries(metadata.emotions)
                .filter(([_, value]) => value > 0.3) // Only show stronger emotions
                .sort(([, a], [, b]) => b - a) // Sort by intensity
                .slice(0, 3) // Show top 3
                .forEach(([emotion, intensity]) => {
                    emotionsHTML += `<span class="emotion-tag">${capitalizeFirstLetter(emotion)}</span>`;
                });
            
            emotionsHTML += '</div>';
        }
        
        // Add location and action bar if they exist
        let locationActionHTML = '';
        if (metadata.location || metadata.action) {
            locationActionHTML = '<div class="location-action-bar">';
            
            if (metadata.location) {
                locationActionHTML += `
                    <div class="location-indicator">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${metadata.location}</span>
                    </div>
                `;
            }
            
            if (metadata.action) {
                locationActionHTML += `
                    <div class="action-indicator">
                        <i class="fas ${getActionIcon(metadata.action)}"></i>
                        <span>${metadata.action}</span>
                    </div>
                `;
            }
            
            locationActionHTML += '</div>';
        }
        
        messageDiv.innerHTML = `
            ${locationActionHTML}
            <div class="message-avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="message-bubble">
                <div class="message-text">${text}</div>
                ${emotionsHTML}
                <div class="message-metadata">
                    ${formatTime(new Date())}
                </div>
            </div>
        `;
        
        elements.chatMessages.appendChild(messageDiv);
        
        // Add scene description if available
        if (metadata.scene_description) {
            const sceneDiv = document.createElement('div');
            sceneDiv.className = 'scene-description';
            
            sceneDiv.innerHTML = `
                <div class="scene-toggle">
                    <span>View Scene Description</span>
                    <i class="fas fa-chevron-down"></i>
                </div>
                <div class="scene-content">
                    <p>${metadata.scene_description}</p>
                </div>
            `;
            
            elements.chatMessages.appendChild(sceneDiv);
            
            // Add toggle functionality for scene description
            const sceneToggle = sceneDiv.querySelector('.scene-toggle');
            const sceneContent = sceneDiv.querySelector('.scene-content');
            
            sceneToggle.addEventListener('click', () => {
                sceneToggle.classList.toggle('active');
                sceneContent.classList.toggle('active');
                
                // Update toggle text
                const toggleText = sceneToggle.querySelector('span');
                if (sceneContent.classList.contains('active')) {
                    toggleText.textContent = 'Hide Scene Description';
                } else {
                    toggleText.textContent = 'View Scene Description';
                }
                
                // Scroll to make sure the expanded content is visible
                if (sceneContent.classList.contains('active')) {
                    setTimeout(() => {
                        sceneContent.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }, 300);
                }
            });
            
            // In novel or cinematic modes, open scene descriptions by default
            const currentMode = state.settings.interactionMode || 'simple';
            if (currentMode === 'novel' || currentMode === 'cinematic') {
                sceneToggle.click();
            }
        }
        
        scrollToBottom();
    }
    
    // Get icon for action based on the action text
    function getActionIcon(action) {
        if (!action) return 'fa-circle';
        
        const actionLower = action.toLowerCase();
        
        if (actionLower.includes('sit')) return 'fa-chair';
        if (actionLower.includes('stand')) return 'fa-standing';
        if (actionLower.includes('walk')) return 'fa-walking';
        if (actionLower.includes('run')) return 'fa-running';
        if (actionLower.includes('smile')) return 'fa-smile';
        if (actionLower.includes('laugh')) return 'fa-laugh';
        if (actionLower.includes('frown')) return 'fa-frown';
        if (actionLower.includes('think')) return 'fa-brain';
        if (actionLower.includes('write')) return 'fa-pen';
        if (actionLower.includes('read')) return 'fa-book-reader';
        if (actionLower.includes('eat')) return 'fa-utensils';
        if (actionLower.includes('drink')) return 'fa-coffee';
        if (actionLower.includes('look')) return 'fa-eye';
        
        return 'fa-circle';
    }

    // Scroll chat to bottom
    function scrollToBottom() {
        if (elements.chatMessages) {
            elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
        }
    }









////////////////////////////////////////////////////////////
// MODULE 8: UTILITY FUNCTIONS
////////////////////////////////////////////////////////////
// This module contains utility functions used throughout the application.

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

////////////////////////////////////////////////////////////
// MODULE 9: PLAYER ACTION SYSTEM (FIXED)
////////////////////////////////////////////////////////////
// This module handles the player action interface for roleplaying.
// It manages the toggle between speaking and acting modes,
// character stats, dice rolls, and action resolution.
// Enhanced to improve success communication with the LLM.
// Fixed chat button issues.

// Player action state management
const playerActionState = {
    inputMode: localStorage.getItem('inputMode') || 'speak', // 'speak' or 'act'
    actionResolutionMode: localStorage.getItem('actionResolutionMode') || 'always-succeed',
    playerStats: JSON.parse(localStorage.getItem('playerStats')) || {
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10,
        level: 1
    },
    lastRollResult: null
};

// Player action UI elements
const playerActionElements = {
    inputModeToggle: document.querySelector('.input-mode-toggle'),
    toggleOptions: document.querySelectorAll('.input-mode-toggle .toggle-option'),
    actionResolutionSelect: document.getElementById('action-resolution-mode'),
    actionResolutionSettings: document.querySelector('.action-resolution-settings'),
    inputModeIndicator: document.querySelector('.input-mode-indicator'),
    playerStatsPanel: document.getElementById('player-stats-panel'),
    editStatsBtn: document.getElementById('edit-stats-btn'),
    statsModal: document.getElementById('stats-modal'),
    statsModalClose: document.getElementById('stats-modal-close'),
    cancelStatsButton: document.getElementById('cancel-stats-button'),
    saveStatsButton: document.getElementById('save-stats-button'),
    actionResult: document.getElementById('action-result'),
    defaultActionModeSelect: document.querySelector('select[name="default-action-mode"]'),
    // Important: get both message inputs (one in main chat, one in initial container)
    messageInputs: document.querySelectorAll('#message-input'),
    // Both send buttons
    sendButtons: document.querySelectorAll('#send-btn')
};

// Initialize player action system
function initPlayerActionSystem() {
    console.log('Initializing Fixed Player Action System...');
    // Make sure DOM is loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initWhenReady);
    } else {
        initWhenReady();
    }
}

// Initialize when DOM is ready
function initWhenReady() {
    console.log('DOM ready, setting up Fixed Player Action System');
    
    // Re-query elements to ensure they're available
    refreshElements();
    
    // Debug information to console for troubleshooting
    console.log('Toggle Options Found:', playerActionElements.toggleOptions.length);
    console.log('Initial Input Mode:', playerActionState.inputMode);
    
    // Initialize UI state based on saved settings
    updatePlayerStatsDisplay();
    setActionResolutionMode(playerActionState.actionResolutionMode);
    setInputMode(playerActionState.inputMode);
    
    // Set default action mode in settings if it exists
    if (playerActionElements.defaultActionModeSelect) {
        playerActionElements.defaultActionModeSelect.value = playerActionState.actionResolutionMode;
    }
    
    // Bind events
    bindPlayerActionEvents();
}

// Refresh element references (useful after DOM changes)
function refreshElements() {
    playerActionElements.inputModeToggle = document.querySelector('.input-mode-toggle');
    playerActionElements.toggleOptions = document.querySelectorAll('.input-mode-toggle .toggle-option');
    playerActionElements.actionResolutionSelect = document.getElementById('action-resolution-mode');
    playerActionElements.actionResolutionSettings = document.querySelector('.action-resolution-settings');
    playerActionElements.inputModeIndicator = document.querySelector('.input-mode-indicator');
    playerActionElements.playerStatsPanel = document.getElementById('player-stats-panel');
    playerActionElements.editStatsBtn = document.getElementById('edit-stats-btn');
    playerActionElements.statsModal = document.getElementById('stats-modal');
    playerActionElements.statsModalClose = document.getElementById('stats-modal-close');
    playerActionElements.cancelStatsButton = document.getElementById('cancel-stats-button');
    playerActionElements.saveStatsButton = document.getElementById('save-stats-button');
    playerActionElements.actionResult = document.getElementById('action-result');
    playerActionElements.defaultActionModeSelect = document.querySelector('select[name="default-action-mode"]');
    playerActionElements.messageInputs = document.querySelectorAll('#message-input');
    playerActionElements.sendButtons = document.querySelectorAll('#send-btn');
}

// Bind player action events
function bindPlayerActionEvents() {
    console.log('Binding Fixed Player Action events...');
    
    // Toggle input mode
    if (playerActionElements.toggleOptions && playerActionElements.toggleOptions.length > 0) {
        playerActionElements.toggleOptions.forEach(option => {
            console.log('Adding click listener to toggle option:', option.getAttribute('data-mode'));
            
            // Remove any existing event listeners first to prevent duplicates
            option.removeEventListener('click', handleToggleOptionClick);
            
            // Add fresh event listener
            option.addEventListener('click', handleToggleOptionClick);
        });
    } else {
        console.warn('Toggle options not found');
    }
    
    // Change action resolution mode
    if (playerActionElements.actionResolutionSelect) {
        playerActionElements.actionResolutionSelect.removeEventListener('change', handleResolutionChange);
        playerActionElements.actionResolutionSelect.addEventListener('change', handleResolutionChange);
    }
    
    // Default action mode in settings
    if (playerActionElements.defaultActionModeSelect) {
        playerActionElements.defaultActionModeSelect.removeEventListener('change', handleDefaultActionModeChange);
        playerActionElements.defaultActionModeSelect.addEventListener('change', handleDefaultActionModeChange);
    }
    
    // Open stats edit modal
    if (playerActionElements.editStatsBtn) {
        playerActionElements.editStatsBtn.removeEventListener('click', openStatEditModal);
        playerActionElements.editStatsBtn.addEventListener('click', openStatEditModal);
    }
    
    // Close stats modal
    if (playerActionElements.statsModalClose) {
        playerActionElements.statsModalClose.removeEventListener('click', closeStatEditModal);
        playerActionElements.statsModalClose.addEventListener('click', closeStatEditModal);
    }
    
    if (playerActionElements.cancelStatsButton) {
        playerActionElements.cancelStatsButton.removeEventListener('click', closeStatEditModal);
        playerActionElements.cancelStatsButton.addEventListener('click', closeStatEditModal);
    }
    
    // Save stats
    if (playerActionElements.saveStatsButton) {
        playerActionElements.saveStatsButton.removeEventListener('click', savePlayerStats);
        playerActionElements.saveStatsButton.addEventListener('click', savePlayerStats);
    }
    
    // Quick toggle via toolbar button
    const toggleActionModeBtn = document.querySelector('.toggle-action-mode');
    if (toggleActionModeBtn) {
        toggleActionModeBtn.removeEventListener('click', handleQuickToggle);
        toggleActionModeBtn.addEventListener('click', handleQuickToggle);
    }
    
    // Bind the send buttons directly - FIXED!
    if (playerActionElements.sendButtons) {
        playerActionElements.sendButtons.forEach(sendBtn => {
            // First remove any existing listeners to prevent duplicates
            sendBtn.removeEventListener('click', handleSendButtonClick);
            
            // Add a fresh click event listener
            sendBtn.addEventListener('click', handleSendButtonClick);
            console.log('Added click listener to send button:', sendBtn);
        });
    }
    
    // Update message input enter key press - FIXED!
    playerActionElements.messageInputs.forEach(messageInput => {
        if (messageInput) {
            // Remove existing event listeners first
            messageInput.removeEventListener('keydown', handleMessageInputKeydown);
            
            // Add fresh event listener
            messageInput.addEventListener('keydown', handleMessageInputKeydown);
            messageInput.removeEventListener('focus', updateInputPlaceholder);
            messageInput.addEventListener('focus', updateInputPlaceholder);
        }
    });
    
    console.log('Fixed Player Action events bound successfully');
}

// Event handler for send button click - FIXED!
function handleSendButtonClick(event) {
    if (playerActionState.inputMode === 'speak') {
        // Use original function for speaking
        sendMessage(); // This relies on the global sendMessage function
    } else {
        // Use action handling for actions
        sendPlayerAction();
    }
}

// Event handler for message input keydown - FIXED!
function handleMessageInputKeydown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        
        if (playerActionState.inputMode === 'speak') {
            // Use original function for speaking
            sendMessage(); // This relies on the global sendMessage function
        } else {
            // Use action handling for actions
            sendPlayerAction();
        }
    }
}

// Event handler for toggle option clicks
function handleToggleOptionClick(event) {
    const mode = event.currentTarget.getAttribute('data-mode');
    console.log('Toggle clicked:', mode);
    setInputMode(mode);
}

// Event handler for resolution select change
function handleResolutionChange(event) {
    setActionResolutionMode(event.target.value);
}

// Event handler for default action mode change
function handleDefaultActionModeChange(event) {
    playerActionState.actionResolutionMode = event.target.value;
    localStorage.setItem('actionResolutionMode', event.target.value);
    
    // Update the active selector if it exists
    if (playerActionElements.actionResolutionSelect) {
        playerActionElements.actionResolutionSelect.value = event.target.value;
    }
}

// Event handler for quick toggle button
function handleQuickToggle() {
    const newMode = playerActionState.inputMode === 'speak' ? 'act' : 'speak';
    setInputMode(newMode);
}

// Set input mode (speak or act)
function setInputMode(mode) {
    console.log('Setting input mode to:', mode);
    playerActionState.inputMode = mode;
    localStorage.setItem('inputMode', mode);
    
    // Update toggle UI
    if (playerActionElements.toggleOptions && playerActionElements.toggleOptions.length > 0) {
        playerActionElements.toggleOptions.forEach(option => {
            if (option.getAttribute('data-mode') === mode) {
                option.classList.add('active');
            } else {
                option.classList.remove('active');
            }
        });
    }
    
    // Update mode indicator
    if (playerActionElements.inputModeIndicator) {
        const currentModeSpan = playerActionElements.inputModeIndicator.querySelector('#current-mode');
        if (currentModeSpan) {
            if (mode === 'speak') {
                currentModeSpan.textContent = 'Speaking';
                playerActionElements.inputModeIndicator.classList.remove('act-mode');
            } else {
                currentModeSpan.textContent = 'Acting';
                playerActionElements.inputModeIndicator.classList.add('act-mode');
            }
        }
    }
    
    // Show/hide action resolution settings
    if (playerActionElements.actionResolutionSettings) {
        if (mode === 'act') {
            playerActionElements.actionResolutionSettings.classList.add('visible');
            
            // Show stats panel for stat-based or dnd modes
            if (playerActionState.actionResolutionMode !== 'always-succeed') {
                showPlayerStatsPanel();
            } else {
                // In 'always-succeed' mode, still show stats but with a visual indicator
                showPlayerStatsPanel();
                const statsPanel = playerActionElements.playerStatsPanel;
                if (statsPanel) {
                    statsPanel.classList.add('success-mode');
                }
            }
        } else {
            playerActionElements.actionResolutionSettings.classList.remove('visible');
            hidePlayerStatsPanel();
        }
    }
    
    // Update message input placeholder for all message inputs
    updateAllInputPlaceholders();
    
    // Add a body class to help with styling
    document.body.classList.remove('speak-mode', 'act-mode');
    document.body.classList.add(`${mode}-mode`);
}

// Update placeholder text for all message inputs
function updateAllInputPlaceholders() {
    playerActionElements.messageInputs.forEach(messageInput => {
        if (messageInput) {
            if (playerActionState.inputMode === 'speak') {
                messageInput.placeholder = 'Type your message...';
                messageInput.classList.remove('act-mode');
            } else {
                messageInput.placeholder = 'Describe your action...';
                messageInput.classList.add('act-mode');
            }
        }
    });
}

// Update input placeholder based on current mode (for single element)
function updateInputPlaceholder() {
    updateAllInputPlaceholders();
}

// Set action resolution mode
function setActionResolutionMode(mode) {
    playerActionState.actionResolutionMode = mode;
    
    // Update select value
    if (playerActionElements.actionResolutionSelect) {
        playerActionElements.actionResolutionSelect.value = mode;
    }
    
    // Save to localStorage
    localStorage.setItem('actionResolutionMode', mode);
    
    // Show/hide stats panel
    if (playerActionState.inputMode === 'act') {
        if (mode === 'always-succeed') {
            // Even in always-succeed mode, still show stats but with visual indicator
            showPlayerStatsPanel();
            const statsPanel = playerActionElements.playerStatsPanel;
            if (statsPanel) {
                statsPanel.classList.add('success-mode');
            }
        } else {
            showPlayerStatsPanel();
            const statsPanel = playerActionElements.playerStatsPanel;
            if (statsPanel) {
                statsPanel.classList.remove('success-mode');
            }
        }
    }
}

// Show player stats panel
function showPlayerStatsPanel() {
    if (playerActionElements.playerStatsPanel) {
        playerActionElements.playerStatsPanel.classList.remove('hidden');
    }
}

// Hide player stats panel
function hidePlayerStatsPanel() {
    if (playerActionElements.playerStatsPanel) {
        playerActionElements.playerStatsPanel.classList.add('hidden');
    }
}

// Open stat edit modal
function openStatEditModal() {
    if (playerActionElements.statsModal) {
        playerActionElements.statsModal.classList.remove('hidden');
        
        // Set current values
        document.getElementById('edit-strength').value = playerActionState.playerStats.strength;
        document.getElementById('edit-dexterity').value = playerActionState.playerStats.dexterity;
        document.getElementById('edit-constitution').value = playerActionState.playerStats.constitution;
        document.getElementById('edit-intelligence').value = playerActionState.playerStats.intelligence;
        document.getElementById('edit-wisdom').value = playerActionState.playerStats.wisdom;
        document.getElementById('edit-charisma').value = playerActionState.playerStats.charisma;
        document.getElementById('edit-level').value = playerActionState.playerStats.level;
    }
}

// Close stat edit modal
function closeStatEditModal() {
    if (playerActionElements.statsModal) {
        playerActionElements.statsModal.classList.add('hidden');
    }
}

// Save player stats
function savePlayerStats() {
    // Get values from form
    const stats = {
        strength: parseInt(document.getElementById('edit-strength').value) || 10,
        dexterity: parseInt(document.getElementById('edit-dexterity').value) || 10,
        constitution: parseInt(document.getElementById('edit-constitution').value) || 10,
        intelligence: parseInt(document.getElementById('edit-intelligence').value) || 10,
        wisdom: parseInt(document.getElementById('edit-wisdom').value) || 10,
        charisma: parseInt(document.getElementById('edit-charisma').value) || 10,
        level: parseInt(document.getElementById('edit-level').value) || 1
    };
    
    // Ensure values are within range (1-20)
    Object.keys(stats).forEach(key => {
        stats[key] = Math.min(Math.max(stats[key], 1), 20);
    });
    
    // Update state
    playerActionState.playerStats = stats;
    
    // Save to localStorage
    localStorage.setItem('playerStats', JSON.stringify(stats));
    
    // Update UI
    updatePlayerStatsDisplay();
    
    // Close modal
    closeStatEditModal();
    
    // Show notification
    showNotification('Character stats saved successfully!', 'success');
    
    // Update the character model if there's an active character
    if (state.currentCharacter) {
        updateCharacterWithStats(state.currentCharacter.id, stats);
    }
}

// Update player stats display
function updatePlayerStatsDisplay() {
    if (playerActionElements.playerStatsPanel) {
        const statValues = playerActionElements.playerStatsPanel.querySelectorAll('.stat-value');
        statValues.forEach(statEl => {
            const stat = statEl.getAttribute('data-stat');
            if (stat && playerActionState.playerStats[stat]) {
                statEl.textContent = playerActionState.playerStats[stat];
            }
        });
    }
}

// Update character model with stats
async function updateCharacterWithStats(characterId, stats) {
    if (!characterId) return;
    
    try {
        // Get current character data
        const response = await fetch(`${API.BASE_URL}${API.CHARACTERS}/${characterId}`);
        
        if (!response.ok) {
            console.error('Failed to fetch character for stats update');
            return;
        }
        
        const character = await response.json();
        
        // Add stats to character
        const updatedCharacter = {
            ...character,
            stats: stats
        };
        
        // Update character on server
        const updateResponse = await fetch(`${API.BASE_URL}${API.CHARACTERS}/${characterId}`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(updatedCharacter)
        });
        
        if (!updateResponse.ok) {
            console.error('Failed to update character with stats');
        }
    } catch (error) {
        console.error('Error updating character with stats:', error);
    }
}

// Send player action
function sendPlayerAction() {
    const messageInput = document.querySelector('#message-input:not([disabled])') || 
                         document.querySelector('#message-input');
    
    if (!messageInput || !state.currentCharacter) {
        console.warn('Message input or current character not found');
        return;
    }
    
    const actionText = messageInput.value.trim();
    
    if (!actionText) return;
    
    // Process the action and determine outcome
    const actionResult = resolvePlayerAction(actionText);
    
    // Add action message to UI
    addPlayerActionMessage(actionText, actionResult);
    
    // Clear input
    messageInput.value = '';
    messageInput.style.height = 'auto';
    
    // Send action to AI
    sendActionToAI(actionText, actionResult);
}

// Resolve player action
function resolvePlayerAction(actionText) {
    const result = {
        success: false,
        rollValue: 0,
        difficultyClass: 0,
        relevantStat: 'strength',
        modifier: 0,
        details: ''
    };
    
    // Determine which stat is relevant to the action
    result.relevantStat = determineRelevantStat(actionText);
    
    // Set stat modifier based on level and stat value
    result.modifier = Math.floor((playerActionState.playerStats[result.relevantStat] - 10) / 2);
    if (playerActionState.playerStats.level > 1) {
        result.modifier += Math.floor((playerActionState.playerStats.level - 1) / 4) + 1;
    }
    
    // Determine difficulty based on the action complexity
    result.difficultyClass = determineDifficultyClass(actionText);
    
    // Resolve according to the selected mode
    switch (playerActionState.actionResolutionMode) {
        case 'always-succeed':
            result.success = true;
            // Set roll value higher than DC to ensure success is clear
            result.rollValue = result.difficultyClass + 5;
            result.details = 'Automatic Success';
            break;
            
        case 'stat-based':
            // Calculate success chance based on stat vs difficulty
            const statValue = playerActionState.playerStats[result.relevantStat];
            const successChance = Math.min(Math.max((statValue - result.difficultyClass/2 + 10) * 5, 5), 95);
            const roll = Math.random() * 100;
            result.rollValue = Math.floor(roll);
            result.success = roll <= successChance;
            result.details = `${capitalizeFirstLetter(result.relevantStat)} (${statValue}) Check: ${Math.floor(successChance)}% chance`;
            break;
            
        case 'dnd-system':
            // Use D&D style d20 + modifier vs DC
            const d20Roll = Math.floor(Math.random() * 20) + 1;
            const totalRoll = d20Roll + result.modifier;
            result.rollValue = totalRoll;
            result.success = totalRoll >= result.difficultyClass;
            result.details = `${capitalizeFirstLetter(result.relevantStat)} Check: ${d20Roll} + ${result.modifier} vs DC ${result.difficultyClass}`;
            
            // Critical hit/miss
            if (d20Roll === 20) {
                result.success = true;
                result.details = `Critical Success! ${result.details}`;
            } else if (d20Roll === 1) {
                result.success = false;
                result.details = `Critical Failure! ${result.details}`;
            }
            break;
    }
    
    // Save roll result
    playerActionState.lastRollResult = result;
    
    // Show roll result
    showActionResult(result);
    
    return result;
}

// Determine which stat is relevant to the action
function determineRelevantStat(actionText) {
    const actionLower = actionText.toLowerCase();
    
    // Check for strength-related words
    if (/lift|push|pull|carry|throw|break|smash|crush|punch|kick|force|strong|might|power|muscle/i.test(actionLower)) {
        return 'strength';
    }
    
    // Check for dexterity-related words
    if (/jump|climb|swim|sneak|hide|dodge|flip|balance|aim|shoot|acrobatic|agile|nimble|quick|swift|stealth/i.test(actionLower)) {
        return 'dexterity';
    }
    
    // Check for constitution-related words
    if (/endure|resist|withstand|survive|stamina|health|fortitude|tough|durable|resilient|stout|hardy/i.test(actionLower)) {
        return 'constitution';
    }
    
    // Check for intelligence-related words
    if (/analyze|study|research|examine|investigate|understand|solve|deduce|figure|calculate|smart|clever|genius|puzzle|logic/i.test(actionLower)) {
        return 'intelligence';
    }
    
    // Check for wisdom-related words
    if (/perceive|sense|notice|spot|listen|feel|intuit|meditate|focus|concentrate|aware|insightful|perceptive|observe/i.test(actionLower)) {
        return 'wisdom';
    }
    
    // Check for charisma-related words
    if (/persuade|convince|charm|impress|intimidate|deceive|lie|perform|entertain|seduce|social|diplomatic|leadership|presence/i.test(actionLower)) {
        return 'charisma';
    }
    
    // Look for character movement or position - usually dexterity
    if (/walk|run|move|step|leap|dash|sprint|stalk|crouch|crawl|roll/i.test(actionLower)) {
        return 'dexterity';
    }
    
    // Look for talking actions - usually charisma
    if (/talk|speak|say|tell|ask|demand|request|plead|shout|whisper|negotiate/i.test(actionLower)) {
        return 'charisma';
    }
    
    // Look for thinking actions - usually intelligence
    if (/think|ponder|consider|evaluate|assess|plan|strategize|remember|recall/i.test(actionLower)) {
        return 'intelligence';
    }
    
    // Default to the highest stat
    let highestStat = 'strength';
    let highestValue = playerActionState.playerStats.strength;
    
    Object.entries(playerActionState.playerStats).forEach(([stat, value]) => {
        if (stat !== 'level' && value > highestValue) {
            highestStat = stat;
            highestValue = value;
        }
    });
    
    return highestStat;
}

// Determine difficulty class based on action complexity
function determineDifficultyClass(actionText) {
    const actionLower = actionText.toLowerCase();
    
    // Check for keywords indicating difficulty
    if (/nearly impossible|incredible|exceptional|extraordinary|extremely hard|extremely difficult|almost impossible/i.test(actionLower)) {
        return 25;
    }
    
    if (/very difficult|very hard|complex|challenging|complicated|hard|tough challenge/i.test(actionLower)) {
        return 20;
    }
    
    if (/difficult|tough|tricky|hard|requires skill|requires effort/i.test(actionLower)) {
        return 15;
    }
    
    if (/moderate|average|regular|normal|standard|typical/i.test(actionLower)) {
        return 10;
    }
    
    if (/easy|simple|trivial|effortless|straightforward|basic/i.test(actionLower)) {
        return 5;
    }
    
    // Analyze the complexity based on verb usage
    const complexVerbs = /attempt|try|endeavor|solve|overcome|tackle|master|conquer|defeat|outsmart/i;
    if (complexVerbs.test(actionLower)) {
        return 15;
    }
    
    // Analyze the length and complexity of the action
    const wordCount = actionText.split(/\s+/).length;
    
    if (wordCount > 15) {
        return 20; // Very complex action
    } else if (wordCount > 10) {
        return 15; // Complex action
    } else if (wordCount > 5) {
        return 10; // Moderate action
    } else {
        return 8; // Simple action
    }
}

// Show action result
function showActionResult(result) {
    if (!playerActionElements.actionResult) return;
    
    // Update result display
    const resultIcon = playerActionElements.actionResult.querySelector('.result-icon i');
    const resultValue = playerActionElements.actionResult.querySelector('.result-value');
    const resultDetails = playerActionElements.actionResult.querySelector('.result-details');
    
    if (resultIcon) {
        // Set icon and animation
        resultIcon.className = playerActionState.actionResolutionMode === 'dnd-system' ? 
            'fas fa-dice-d20 dice-rolling' : 'fas fa-clipboard-check';
        
        // Remove animation after it completes
        setTimeout(() => {
            resultIcon.classList.remove('dice-rolling');
        }, 1000);
    }
    
    if (resultValue) {
        resultValue.textContent = result.success ? 'Success!' : 'Failure!';
        resultValue.className = 'result-value ' + (result.success ? 'success' : 'failure');
    }
    
    if (resultDetails) {
        resultDetails.textContent = result.details;
    }
    
    // Show the result
    playerActionElements.actionResult.classList.remove('hidden');
    
    // Hide after 4 seconds
    setTimeout(() => {
        playerActionElements.actionResult.classList.add('hidden');
    }, 4000);
}

// Add player action message to chat
function addPlayerActionMessage(actionText, result) {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message message-user';
    
    // Format the action message
    const actionClass = result.success ? 'message-success' : 'message-failure';
    const outcomeText = result.success ? 'Success' : 'Failure';
    const iconClass = result.success ? 'fa-check-circle' : 'fa-times-circle';
    
    // Format the outcome with more description based on success/failure
    let outcomeDescription = '';
    if (result.success) {
        if (playerActionState.actionResolutionMode === 'always-succeed') {
            outcomeDescription = 'Successfully completes the action with confidence.';
        } else if (playerActionState.actionResolutionMode === 'dnd-system') {
            outcomeDescription = `Roll of ${result.rollValue} exceeds DC ${result.difficultyClass}, action succeeds.`;
        } else {
            outcomeDescription = `Character's ${result.relevantStat} (${playerActionState.playerStats[result.relevantStat]}) proves sufficient for the task.`;
        }
    } else {
        if (playerActionState.actionResolutionMode === 'dnd-system') {
            outcomeDescription = `Roll of ${result.rollValue} fails to meet DC ${result.difficultyClass}, action fails.`;
        } else {
            outcomeDescription = `Character's ${result.relevantStat} (${playerActionState.playerStats[result.relevantStat]}) is insufficient for the task.`;
        }
    }
    
    messageDiv.innerHTML = `
        <div class="message-avatar">
            <i class="fas fa-user"></i>
        </div>
        <div class="message-bubble action-attempt">
            <div class="message-action ${actionClass}">
                <i class="fas ${iconClass}"></i>
                ${outcomeText}: ${actionText}
            </div>
            <div class="action-description">
                ${outcomeDescription}
            </div>
            <div class="message-metadata">
                ${formatTime(new Date())} 
                <span class="action-outcome ${result.success ? 'success' : 'failure'}">
                    ${result.details}
                </span>
            </div>
        </div>
    `;
    
    chatMessages.appendChild(messageDiv);
    scrollToBottom();
}

// Send action to AI
async function sendActionToAI(actionText, actionResult) {
    if (!state.currentCharacter) return;
    
    try {
        showLoading();
        
        // Prepare action context with enhanced details for the LLM
        const actionContext = {
            action: actionText,
            success: actionResult.success,
            relevantStat: actionResult.relevantStat,
            rollValue: actionResult.rollValue,
            difficultyClass: actionResult.difficultyClass,
            details: actionResult.details,
            // Add more context about character stats and action outcome
            characterStats: playerActionState.playerStats,
            characterLevel: playerActionState.playerStats.level,
            outcomeDescription: actionResult.success 
                ? `The character successfully performs the action using their ${actionResult.relevantStat} (${playerActionState.playerStats[actionResult.relevantStat]}).`
                : `The character fails to perform the action as their ${actionResult.relevantStat} (${playerActionState.playerStats[actionResult.relevantStat]}) is insufficient.`,
            resolutionMode: playerActionState.actionResolutionMode,
            // Add flags to ensure the LLM understands the outcome clearly
            isPlayerAction: true,
            actionSucceeded: actionResult.success
        };
        
        // Prepare request data
        const useLocalModel = state.settings.model === 'local';
        const requestData = {
            message: JSON.stringify(actionContext),
            use_local_model: useLocalModel,
            is_player_action: true,
            action_success: actionResult.success,
            // Add additional context for scene generation
            player_stats: playerActionState.playerStats,
            action_details: {
                stat: actionResult.relevantStat,
                value: playerActionState.playerStats[actionResult.relevantStat],
                roll: actionResult.rollValue,
                difficulty: actionResult.difficultyClass
            }
        };
        
        // Send action to API
        const response = await fetch(`${API.BASE_URL}${API.CHAT}/${state.currentCharacter.id}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': state.settings.apiKey
            },
            body: JSON.stringify(requestData)
        });
        
        if (!response.ok) {
            throw new Error(`API responded with status ${response.status}`);
        }
        
        const responseData = await response.json();
        
        // Update character mood/emotions
        state.currentCharacter.mood = responseData.mood;
        state.currentCharacter.emotions = responseData.emotions;
        state.currentCharacter.opinion_of_user = responseData.opinion_of_user;
        state.currentCharacter.action = responseData.action;
        state.currentCharacter.location = responseData.location;
        
        // Update UI
        updateCharacterMoodUI();
        
        // Add character response to UI
        addCharacterMessage(responseData.response, {
            mood: responseData.mood,
            emotions: responseData.emotions,
            action: responseData.action,
            location: responseData.location,
            scene_description: responseData.scene_description
        });
        
        // Scroll to bottom
        scrollToBottom();
    } catch (error) {
        console.error('Error sending action:', error);
        addCharacterMessage('Sorry, I encountered an error processing your action. Please try again later.', {
            mood: 'confused',
            emotions: { confusion: 0.8, frustration: 0.6 }
        });
    } finally {
        hideLoading();
    }
}

// Load character stats if they exist
function loadCharacterStats(character) {
    if (character && character.stats) {
        console.log('Loading character stats:', character.stats);
        playerActionState.playerStats = character.stats;
        localStorage.setItem('playerStats', JSON.stringify(character.stats));
        updatePlayerStatsDisplay();
    }
}

// Helper function for first letter capitalization
function capitalizeFirstLetter(string = '') {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Initialize player action system during page load
window.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded - initializing fixed player action system');
    setTimeout(initPlayerActionSystem, 500);
});

// Initialize if already loaded
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    console.log('Document already ready - initializing fixed player action system immediately');
    setTimeout(initPlayerActionSystem, 100);
}

// Export functions for use in other modules
window.playerActionSystem = {
    loadCharacterStats,
    savePlayerStats,
    updatePlayerStatsDisplay,
    getPlayerStats: () => playerActionState.playerStats
};
});

////////////////////////////////////////////////////////////
// CHAT ENHANCEMENT FUNCTIONS
////////////////////////////////////////////////////////////
// This module contains functions to enhance the chat experience
// Fixed send button functionality and improved character creation

// Fix for send button and message input issues
function fixChatInputBindings() {
    console.log('Applying fixed chat input bindings');
    
    // Get all send buttons
    const sendButtons = document.querySelectorAll('#send-btn, .send-btn');
    
    // Remove existing event listeners to prevent duplicates
    sendButtons.forEach(button => {
        const newButton = button.cloneNode(true);
        if (button.parentNode) {
            button.parentNode.replaceChild(newButton, button);
        }
        
        // Add new event listener
        newButton.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Send button clicked');
            
            if (playerActionState && playerActionState.inputMode === 'act') {
                sendPlayerAction();
            } else {
                sendMessage();
            }
        });
    });
    
    // Fix message inputs
    const messageInputs = document.querySelectorAll('#message-input, .chat-input');
    
    messageInputs.forEach(input => {
        const newInput = input.cloneNode(true);
        if (input.parentNode) {
            input.parentNode.replaceChild(newInput, input);
        }
        
        // Add new event listeners
        newInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                console.log('Enter key pressed');
                
                if (playerActionState && playerActionState.inputMode === 'act') {
                    sendPlayerAction();
                } else {
                    sendMessage();
                }
            }
        });
        
        // Auto-resize textarea
        newInput.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
        });
    });
    
    console.log('Chat input bindings fixed');
}

// Clean and ensure we only have one chat input container
function cleanupDuplicateInputs() {
    // Make sure only one chat input container is visible
    const chatInputContainers = document.querySelectorAll('.chat-input-container');
    
    if (chatInputContainers.length > 1) {
        console.log(`Found ${chatInputContainers.length} chat input containers, removing duplicates`);
        
        // Keep only the one inside chat-interface
        for (let i = 0; i < chatInputContainers.length; i++) {
            const container = chatInputContainers[i];
            const isInsideChatInterface = container.closest('.chat-interface');
            
            if (!isInsideChatInterface) {
                // If this container isn't inside the chat interface, remove it
                if (container.parentNode) {
                    container.parentNode.removeChild(container);
                }
            }
        }
    }
}

// Enhanced character creation improvements
function enhanceCharacterCreation() {
    console.log('Enhancing character creation modal');
    
    // Ensure the Stats tab exists
    const characterModal = document.getElementById('character-modal');
    if (!characterModal) return;
    
    // Fix tab navigation
    const tabs = characterModal.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Get the tab name
            const tabName = this.getAttribute('data-tab');
            console.log(`Clicking character creation tab: ${tabName}`);
            
            // Update active class on tabs
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // Show corresponding content
            const tabContents = characterModal.querySelectorAll('.tab-content');
            tabContents.forEach(content => {
                content.classList.add('hidden');
            });
            
            const activeContent = document.getElementById(`tab-${tabName}`);
            if (activeContent) {
                activeContent.classList.remove('hidden');
            }
        });
    });
    
    // Enhance AI generator
    const aiGeneratorToggle = document.getElementById('ai-generator-toggle');
    if (aiGeneratorToggle) {
        aiGeneratorToggle.addEventListener('change', function() {
            const aiPromptInput = document.getElementById('ai-prompt-input');
            const generateButton = document.getElementById('generate-character-button');
            
            if (this.checked) {
                if (aiPromptInput) aiPromptInput.disabled = false;
                if (generateButton) generateButton.disabled = false;
            } else {
                if (aiPromptInput) aiPromptInput.disabled = true;
                if (generateButton) generateButton.disabled = true;
            }
        });
    }
    
    // Add randomize stats button handler
    const randomizeStatsBtn = document.getElementById('randomize-stats-btn');
    if (randomizeStatsBtn) {
        randomizeStatsBtn.addEventListener('click', function() {
            const stats = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
            
            stats.forEach(stat => {
                const input = document.getElementById(`char-${stat}`);
                if (input) {
                    const value = Math.floor(Math.random() * 11) + 8; // 8-18 range
                    input.value = value;
                }
            });
            
            const levelInput = document.getElementById('char-level');
            if (levelInput) {
                levelInput.value = Math.floor(Math.random() * 5) + 1;
            }
        });
    }
    
    // Add reset stats button handler
    const resetStatsBtn = document.getElementById('reset-default-stats-btn');
    if (resetStatsBtn) {
        resetStatsBtn.addEventListener('click', function() {
            const stats = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
            
            stats.forEach(stat => {
                const input = document.getElementById(`char-${stat}`);
                if (input) {
                    input.value = 10;
                }
            });
            
            const levelInput = document.getElementById('char-level');
            if (levelInput) {
                levelInput.value = 1;
            }
        });
    }
    
    console.log('Character creation modal enhanced');
}
// Fix for Character Creation Modal Tab Switching
function fixCharacterModalTabs() {
    console.log('Fixing character modal tabs');
    
    // Get the character modal
    const characterModal = document.getElementById('character-modal');
    if (!characterModal) {
        console.warn('Character modal not found');
        return;
    }
    
    // Clear any contradictory classes
    const tabContents = characterModal.querySelectorAll('.tab-content');
    tabContents.forEach(content => {
        // Remove contradictory classes (a tab can't be both active and hidden)
        if (content.classList.contains('active') && content.classList.contains('hidden')) {
            console.log('Found contradictory classes on tab content:', content.id);
            // Determine which tab this corresponds to
            const tabId = content.id.replace('tab-', '');
            const correspondingTab = characterModal.querySelector(`.tab[data-tab="${tabId}"]`);
            
            // If the corresponding tab is active, make this content active (not hidden)
            if (correspondingTab && correspondingTab.classList.contains('active')) {
                content.classList.remove('hidden');
            } else {
                // Otherwise, make it hidden (not active)
                content.classList.remove('active');
            }
        }
    });
    
    // Fix tab click handlers
    const tabs = characterModal.querySelectorAll('.tab');
    tabs.forEach(tab => {
        // Remove existing event listeners by cloning and replacing
        const newTab = tab.cloneNode(true);
        if (tab.parentNode) {
            tab.parentNode.replaceChild(newTab, tab);
        }
        
        // Add new event listener
        newTab.addEventListener('click', function() {
            // Get the tab name
            const tabName = this.getAttribute('data-tab');
            console.log(`Clicking tab: ${tabName}`);
            
            // Update active class on tabs
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // Show corresponding content
            const tabContents = characterModal.querySelectorAll('.tab-content');
            tabContents.forEach(content => {
                content.classList.add('hidden');
                content.classList.remove('active');
            });
            
            const activeContent = document.getElementById(`tab-${tabName}`);
            if (activeContent) {
                activeContent.classList.remove('hidden');
                activeContent.classList.add('active');
            }
        });
    });
    
    // Fix AI Generator toggle
    const aiGeneratorToggle = document.getElementById('ai-generator-toggle');
    if (aiGeneratorToggle) {
        // Remove existing event listeners by cloning and replacing
        const newToggle = aiGeneratorToggle.cloneNode(true);
        if (aiGeneratorToggle.parentNode) {
            aiGeneratorToggle.parentNode.replaceChild(newToggle, aiGeneratorToggle);
        }
        
        // Add new event listener
        newToggle.addEventListener('change', function() {
            const aiPromptInput = document.getElementById('ai-prompt-input');
            const generateButton = document.getElementById('generate-character-button');
            
            if (this.checked) {
                if (aiPromptInput) aiPromptInput.disabled = false;
                if (generateButton) generateButton.disabled = false;
            } else {
                if (aiPromptInput) aiPromptInput.disabled = true;
                if (generateButton) generateButton.disabled = true;
            }
        });
    }
    
    // Fix generate button
    const generateButton = document.getElementById('generate-character-button');
    if (generateButton) {
        // Remove existing event listeners by cloning and replacing
        const newButton = generateButton.cloneNode(true);
        if (generateButton.parentNode) {
            generateButton.parentNode.replaceChild(newButton, generateButton);
        }
        
        // Add new event listener for generate button
        newButton.addEventListener('click', function() {
            // Show generation status
            const generationStatus = document.getElementById('generation-status');
            if (generationStatus) {
                generationStatus.classList.remove('hidden');
            }
            
            // Get prompt
            const promptInput = document.getElementById('ai-prompt-input');
            if (!promptInput || !promptInput.value.trim()) {
                alert('Please enter a prompt for character generation.');
                if (generationStatus) {
                    generationStatus.classList.add('hidden');
                }
                return;
            }
            
            // Call the generate character function if it exists
            if (typeof generateCharacter === 'function') {
                generateCharacter();
            } else {
                console.error('generateCharacter function not found');
                alert('Character generation functionality is not available.');
                if (generationStatus) {
                    generationStatus.classList.add('hidden');
                }
            }
        });
    }
    
    console.log('Character modal tabs fixed');
}

document.addEventListener('DOMContentLoaded', function() {
    setTimeout(fixCharacterModalTabs, 500);
});

// Also apply when the modal is opened
document.addEventListener('click', function(e) {
    // Check if this is the create character button
    if (e.target.matches('#create-character-btn, #welcome-create-btn') || 
        e.target.closest('#create-character-btn, #welcome-create-btn')) {
        setTimeout(fixCharacterModalTabs, 100);
    }
});

// If document is already loaded, run the fix immediately
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(fixCharacterModalTabs, 100);
}
// send message function
function sendMessage() {
    // Get the active message input
    const messageInput = document.querySelector('#message-input:not([disabled])') || 
                         document.querySelector('#message-input');
    
    if (!messageInput || !state.currentCharacter) {
        console.warn('Message input or current character not found');
        return;
    }
    
    const messageText = messageInput.value.trim();
    
    if (!messageText) return;
    
    // Add user message to UI
    addUserMessage(messageText);
    
    // Clear input
    messageInput.value = '';
    messageInput.style.height = 'auto';
    
    // Show loading indicator
    showLoading();
    
    // Prepare request data
    const useLocalModel = state.settings.model === 'local';
    const requestData = {
        message: messageText,
        use_local_model: useLocalModel
    };
    
    // Add optional parameters from settings
    if (state.settings.temperature) {
        requestData.temperature = parseFloat(state.settings.temperature);
    }
    
    if (state.settings.responseLength) {
        requestData.max_length = state.settings.responseLength === 'short' ? 100 : 
                                  state.settings.responseLength === 'medium' ? 250 : 500;
    }
    
    // Send message to API
    fetch(`${API.BASE_URL}${API.CHAT}/${state.currentCharacter.id}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-API-Key': state.settings.apiKey
        },
        body: JSON.stringify(requestData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`API responded with status ${response.status}`);
        }
        return response.json();
    })
    .then(responseData => {
        // Update character mood/emotions
        state.currentCharacter.mood = responseData.mood;
        state.currentCharacter.emotions = responseData.emotions;
        state.currentCharacter.opinion_of_user = responseData.opinion_of_user;
        state.currentCharacter.action = responseData.action;
        state.currentCharacter.location = responseData.location;
        
        // Update UI - ONLY update the mood/opinion instead of full character UI
        updateCharacterMoodUI();
        
        // Add character response to UI
        addCharacterMessage(responseData.response, {
            mood: responseData.mood,
            emotions: responseData.emotions,
            action: responseData.action,
            location: responseData.location,
            scene_description: responseData.scene_description
        });
        
        // Scroll to bottom
        scrollToBottom();
    })
    .catch(error => {
        console.error('Error sending message:', error);
        addCharacterMessage('Sorry, I encountered an error processing your message. Please try again later.', {
            mood: 'sad',
            emotions: { confusion: 0.8, frustration: 0.6 }
        });
    })
    .finally(() => {
        hideLoading();
    });
}

// Monitor DOM changes to reapply fixes when needed
function setupAutomaticFixes() {
    // Create a MutationObserver to watch for DOM changes
    const observer = new MutationObserver(function(mutations) {
        let needsFixing = false;
        
        mutations.forEach(function(mutation) {
            if (mutation.addedNodes.length) {
                // If nodes were added, check if we need to reapply fixes
                for (let i = 0; i < mutation.addedNodes.length; i++) {
                    const node = mutation.addedNodes[i];
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // If a chat input or send button was added
                        if (node.querySelector('#message-input') || 
                            node.querySelector('#send-btn') || 
                            node.querySelector('.chat-input-container')) {
                            needsFixing = true;
                            break;
                        }
                    }
                }
            }
        });
        
        if (needsFixing) {
            console.log('Detected DOM changes - reapplying fixes');
            setTimeout(fixChatInputBindings, 100);
            setTimeout(cleanupDuplicateInputs, 150);
            setTimeout(enhanceCharacterCreation, 200);
        }
    });
    
    // Start observing the body for changes
    observer.observe(document.body, { 
        childList: true, 
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'style']
    });
    
    console.log('Automatic fixes setup complete');
}

// Initialize all chat enhancements
function initChatEnhancements() {
    console.log('Initializing chat enhancements');
    
    // Apply initial fixes
    fixChatInputBindings();
    cleanupDuplicateInputs();
    enhanceCharacterCreation();
    
    // Setup automatic monitoring and fixes
    setupAutomaticFixes();
    
    console.log('Chat enhancements initialized');
}

// Run when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded - initializing chat enhancements');
    
    // Allow a moment for all other scripts to initialize
    setTimeout(initChatEnhancements, 500);
});

// Check if page is already loaded
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    console.log('Page already loaded - initializing chat enhancements immediately');
    setTimeout(initChatEnhancements, 100);
}





/**
 * Quality of Life Features Module
 * 
 * This module enhances the chat application with features like:
 * - Retry buttons for regenerating AI responses
 * - Copy functionality for all messages
 * - Edit functionality for user messages
 * - Enhanced export options
 * - Scroll-to-bottom button
 */

// Self-executing function to avoid polluting global scope
(function() {
    // Module configuration
    const config = {
        retryTemperatureIncrease: 0.2,   // Increase temperature by this amount for retries
        maxTemperature: 1.0,             // Maximum temperature value
        defaultTemperature: 0.7,         // Default temperature if not found in state
        notificationDuration: 3000,      // Duration for notifications in ms
        scrollThreshold: 100             // Pixels from bottom to consider "at bottom"
    };

    // Module state
    const state = {
        initialized: false,
        observerActive: false
    };

    //======================================
    // INITIALIZATION
    //======================================

    // Main initialization function
    function initializeQualityOfLifeFeatures() {
        if (state.initialized) return;
        console.log('Initializing quality of life features...');
        
        // Initialize features
        initializeCopyFeature();
        initializeRetryFeature();
        initializeEditFeature();
        initializeEnhancedExport();
        initializeScrollFeature();
        
        // Set up a MutationObserver to watch for new messages
        setupMessageObserver();
        
        state.initialized = true;
        console.log('Quality of life features initialized');
    }

    //======================================
    // RETRY FEATURE IMPLEMENTATION
    //======================================

    // Initialize retry feature
    function initializeRetryFeature() {
        // Initial scan for existing messages
        addRetryButtonsToMessages();
        
        // Listen for new messages
        document.addEventListener('newMessageAdded', function() {
            addRetryButtonsToMessages();
        });
    }

    // Add retry buttons to all character messages
    function addRetryButtonsToMessages() {
        // Find all character message bubbles
        const characterMessages = document.querySelectorAll('.message-character .message-bubble');
        
        // Add retry button to each message that doesn't already have one
        characterMessages.forEach(messageBubble => {
            if (!messageBubble.querySelector('.retry-button')) {
                // Create retry button element
                const retryButton = document.createElement('button');
                retryButton.className = 'message-action-btn retry-button';
                retryButton.innerHTML = '<i class="fas fa-redo-alt"></i>';
                retryButton.title = 'Regenerate response';
                
                // Add click event to retry button
                retryButton.addEventListener('click', handleRetryButtonClick);
                
                // Add button to message bubble
                messageBubble.appendChild(retryButton);
            }
        });
    }

    // Handle retry button click
    function handleRetryButtonClick(e) {
        e.stopPropagation(); // Prevent bubbling
        
        // Find the message element
        const messageBubble = this.closest('.message-bubble');
        const messageElement = messageBubble.closest('.message-character');
        
        if (!messageBubble || !messageElement) return;
        
        // Get previous user message (if it exists)
        const messageIndex = Array.from(document.querySelectorAll('.message')).indexOf(messageElement);
        const messages = document.querySelectorAll('.message');
        let userMessage = '';
        
        // Look for the preceding user message
        for (let i = messageIndex - 1; i >= 0; i--) {
            if (messages[i].classList.contains('message-user')) {
                const userMessageText = messages[i].querySelector('.message-text');
                if (userMessageText) {
                    userMessage = userMessageText.textContent;
                    break;
                }
            }
        }
        
        if (!userMessage) {
            showSimpleNotification('Could not find the original message to retry', 'warning');
            return;
        }
        
        // Show regenerating indicator on the message
        const messageText = messageBubble.querySelector('.message-text');
        const originalText = messageText.innerHTML;
        messageText.innerHTML = '<em>Regenerating response...</em>';
        
        // Show loading indicator
        const loadingIndicator = createSimpleLoadingIndicator();
        
        // Get the current character ID
        const currentCharacterId = getCurrentCharacterId();
        if (!currentCharacterId) {
            messageText.innerHTML = originalText;
            removeSimpleLoadingIndicator(loadingIndicator);
            showSimpleNotification('Could not identify the current character', 'error');
            return;
        }
        
        // Key additions for true variation
        // 1. Add a timestamp parameter to prevent caching
        // 2. Set higher temperature (0.8-1.0)
        // 3. Add special parameter to flag this as a regeneration request
        const requestData = {
            message: userMessage,
            use_local_model: isUsingLocalModel(),
            temperature: getHigherTemperature(), // Higher temperature for more variation
            regenerate: true, // Flag for backend to know this is a regeneration
            timestamp: Date.now(), // Prevent response caching
            randomSeed: Math.random().toString() // Add randomness to the request
        };
        
        // Send request to API
        fetch(`/api/chat/${currentCharacterId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': getApiKey()
            },
            body: JSON.stringify(requestData)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`API responded with status ${response.status}`);
            }
            return response.json();
        })
        .then(responseData => {
            // Replace old message text with new response
            messageText.innerHTML = responseData.response;
            
            // Update character mood/emotions
            updateCharacterState(responseData);
            
            // Update message metadata
            const metadataElement = messageBubble.querySelector('.message-metadata');
            if (metadataElement) {
                metadataElement.textContent = `${formatSimpleTime(new Date())} (regenerated)`;
            }
            
            // Add regeneration indicator
            if (!messageBubble.querySelector('.regeneration-badge')) {
                const regenerationBadge = document.createElement('div');
                regenerationBadge.className = 'regeneration-badge';
                regenerationBadge.innerHTML = '<i class="fas fa-sync-alt"></i> Regenerated';
                messageBubble.appendChild(regenerationBadge);
            }
            
            // Add a subtle highlight animation
            messageBubble.classList.add('regenerated');
            setTimeout(() => {
                messageBubble.classList.remove('regenerated');
            }, 2000);
            
            // Update the scene description
            updateSceneDescription(messageElement, responseData);
        })
        .catch(error => {
            console.error('Error regenerating response:', error);
            messageText.innerHTML = originalText;
            showSimpleNotification('Failed to regenerate response. Please try again.', 'error');
        })
        .finally(() => {
            removeSimpleLoadingIndicator(loadingIndicator);
        });
    }

    //======================================
    // EDIT MESSAGE FEATURE
    //======================================

    // Initialize edit feature
    function initializeEditFeature() {
        // Initial scan for existing messages
        addEditButtonsToUserMessages();
        
        // Listen for new messages
        document.addEventListener('newMessageAdded', function() {
            addEditButtonsToUserMessages();
        });
    }

    // Add edit buttons to user messages
    function addEditButtonsToUserMessages() {
        // Find all user message bubbles
        const userMessages = document.querySelectorAll('.message-user .message-bubble');
        
        // Add edit button to each message that doesn't already have one
        userMessages.forEach(messageBubble => {
            if (!messageBubble.querySelector('.edit-button')) {
                // Create edit button element
                const editButton = document.createElement('button');
                editButton.className = 'message-action-btn edit-button';
                editButton.innerHTML = '<i class="fas fa-edit"></i>';
                editButton.title = 'Edit message';
                
                // Add click event to edit button
                editButton.addEventListener('click', handleEditButtonClick);
                
                // Add button to message bubble
                messageBubble.appendChild(editButton);
            }
        });
    }

    // Handle edit button click
    function handleEditButtonClick(e) {
        e.stopPropagation(); // Prevent bubbling
        
        // Get the message element and text
        const messageBubble = this.closest('.message-bubble');
        const messageElement = messageBubble.closest('.message-user');
        const messageText = messageBubble.querySelector('.message-text');
        const originalText = messageText.textContent;
        
        // Replace message text with editable textarea
        const textareaContainer = document.createElement('div');
        textareaContainer.className = 'edit-container';
        textareaContainer.innerHTML = `
            <textarea class="edit-textarea">${originalText}</textarea>
            <div class="edit-actions">
                <button class="edit-save-btn"><i class="fas fa-check"></i> Save</button>
                <button class="edit-cancel-btn"><i class="fas fa-times"></i> Cancel</button>
            </div>
        `;
        
        // Replace message content with edit interface
        messageText.style.display = 'none';
        messageBubble.appendChild(textareaContainer);
        
        // Focus textarea and position cursor at end
        const textarea = textareaContainer.querySelector('.edit-textarea');
        textarea.focus();
        textarea.setSelectionRange(textarea.value.length, textarea.value.length);
        
        // Handle save button click
        const saveBtn = textareaContainer.querySelector('.edit-save-btn');
        saveBtn.addEventListener('click', function() {
            handleSaveEdit(messageBubble, messageElement, messageText, textarea, originalText);
        });
        
        // Handle cancel button click
        const cancelBtn = textareaContainer.querySelector('.edit-cancel-btn');
        cancelBtn.addEventListener('click', function() {
            messageText.style.display = '';
            textareaContainer.remove();
        });
        
        // Handle Enter key press
        textarea.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                saveBtn.click();
            } else if (e.key === 'Escape') {
                cancelBtn.click();
            }
        });
    }

    // Handle saving edited message
    function handleSaveEdit(messageBubble, messageElement, messageText, textarea, originalText) {
        const newText = textarea.value.trim();
        
        // If text hasn't changed or is empty, cancel edit
        if (newText === originalText || !newText) {
            messageText.style.display = '';
            messageBubble.querySelector('.edit-container').remove();
            return;
        }
        
        // Update the message text visually
        messageText.textContent = newText;
        messageText.style.display = '';
        
        // Add editing indicator to message
        const metadataElement = messageBubble.querySelector('.message-metadata');
        if (metadataElement) {
            metadataElement.textContent = `${formatSimpleTime(new Date())} (edited)`;
        }
        
        // Add edited badge
        if (!messageBubble.querySelector('.edit-badge')) {
            const editBadge = document.createElement('div');
            editBadge.className = 'edit-badge';
            editBadge.innerHTML = '<i class="fas fa-pencil-alt"></i> Edited';
            messageBubble.appendChild(editBadge);
        }
        
        // Remove edit interface
        messageBubble.querySelector('.edit-container').remove();
        
        // Find the AI response that followed this message
        const messages = document.querySelectorAll('.message');
        const messageIndex = Array.from(messages).indexOf(messageElement);
        let aiResponseElement = null;
        
        // Look for the next AI response
        for (let i = messageIndex + 1; i < messages.length; i++) {
            if (messages[i].classList.contains('message-character')) {
                aiResponseElement = messages[i];
                break;
            }
        }
        
        // If found, update the AI response
        if (aiResponseElement) {
            updateAIResponse(aiResponseElement, newText);
        }
    }

    // Update AI response after editing a user message
    function updateAIResponse(aiResponseElement, newText) {
        const aiMessageBubble = aiResponseElement.querySelector('.message-bubble');
        const aiMessageText = aiMessageBubble.querySelector('.message-text');
        const originalAiText = aiMessageText.innerHTML;
        
        // Show regenerating indicator
        aiMessageText.innerHTML = '<em>Updating response based on edited message...</em>';
        
        // Show loading indicator
        const loadingIndicator = createSimpleLoadingIndicator();
        
        // Get character ID
        const currentCharacterId = getCurrentCharacterId();
        if (!currentCharacterId) {
            aiMessageText.innerHTML = originalAiText;
            removeSimpleLoadingIndicator(loadingIndicator);
            showSimpleNotification('Could not identify the current character', 'error');
            return;
        }
        
        // Call the API to regenerate the response
        const requestData = {
            message: newText,
            use_local_model: isUsingLocalModel(),
            edited: true,
            temperature: getHigherTemperature()
        };
        
        // Send request to API
        fetch(`/api/chat/${currentCharacterId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': getApiKey()
            },
            body: JSON.stringify(requestData)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`API responded with status ${response.status}`);
            }
            return response.json();
        })
        .then(responseData => {
            // Replace old message text with new response
            aiMessageText.innerHTML = responseData.response;
            
            // Update character mood/emotions
            updateCharacterState(responseData);
            
            // Update message metadata
            const aiMetadataElement = aiMessageBubble.querySelector('.message-metadata');
            if (aiMetadataElement) {
                aiMetadataElement.textContent = `${formatSimpleTime(new Date())} (updated)`;
            }
            
            // Add a subtle highlight animation
            aiMessageBubble.classList.add('updated');
            setTimeout(() => {
                aiMessageBubble.classList.remove('updated');
            }, 2000);
            
            // Update the scene description
            updateSceneDescription(aiResponseElement, responseData);
        })
        .catch(error => {
            console.error('Error updating response:', error);
            aiMessageText.innerHTML = originalAiText;
            showSimpleNotification('Failed to update response. Please try again.', 'error');
        })
        .finally(() => {
            removeSimpleLoadingIndicator(loadingIndicator);
        });
    }

    //======================================
    // COPY MESSAGE FEATURE
    //======================================

    // Initialize copy feature
    function initializeCopyFeature() {
        // Initial scan for existing messages
        addCopyButtonsToMessages();
        
        // Listen for new messages
        document.addEventListener('newMessageAdded', function() {
            addCopyButtonsToMessages();
        });
    }

    // Add copy buttons to all messages
    function addCopyButtonsToMessages() {
        // Find all message bubbles (both user and character)
        const messageBubbles = document.querySelectorAll('.message-bubble');
        
        // Add copy button to each message that doesn't already have one
        messageBubbles.forEach(messageBubble => {
            if (!messageBubble.querySelector('.copy-button')) {
                // Create copy button element
                const copyButton = document.createElement('button');
                copyButton.className = 'message-action-btn copy-button';
                copyButton.innerHTML = '<i class="fas fa-copy"></i>';
                copyButton.title = 'Copy message';
                
                // Add click event to copy button
                copyButton.addEventListener('click', handleCopyButtonClick);
                
                // Add button to message bubble
                messageBubble.appendChild(copyButton);
                
                // Adjust positions of other buttons if they exist
                adjustButtonPositions(messageBubble);
            }
        });
    }
    
    // Adjust the positions of buttons
    function adjustButtonPositions(messageBubble) {
        const copyButton = messageBubble.querySelector('.copy-button');
        const editButton = messageBubble.querySelector('.edit-button');
        const retryButton = messageBubble.querySelector('.retry-button');
        
        if (!copyButton) return;
        
        if (editButton && retryButton) {
            // If all three buttons are present
            copyButton.style.right = '5px';
            retryButton.style.right = '30px';
            editButton.style.right = '55px';
        } else if (editButton) {
            // If only edit and copy buttons are present
            copyButton.style.right = '5px';
            editButton.style.right = '30px';
        } else if (retryButton) {
            // If only retry and copy buttons are present
            copyButton.style.right = '5px';
            retryButton.style.right = '30px';
        }
    }

    // Handle copy button click with fallbacks
    function handleCopyButtonClick(e) {
        e.stopPropagation(); // Prevent bubbling
        
        // Find the message text
        const messageBubble = this.closest('.message-bubble');
        const messageText = messageBubble.querySelector('.message-text');
        
        if (!messageText) return;
        
        // Get the text content
        const textToCopy = messageText.textContent;
        
        // Try to copy using various methods
        copyTextToClipboard(textToCopy)
            .then(() => {
                // Show success feedback
                showCopyFeedback(this);
                showSimpleNotification('Message copied to clipboard!', 'success');
            })
            .catch(err => {
                console.error('Error copying text: ', err);
                showSimpleNotification('Failed to copy message. Try selecting and copying manually.', 'error');
            });
    }

    // Enhanced copy function with multiple fallbacks
    function copyTextToClipboard(text) {
        return new Promise((resolve, reject) => {
            // Method 1: Modern Clipboard API
            if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text)
                    .then(resolve)
                    .catch(error => {
                        console.warn('Clipboard API failed, trying fallback method', error);
                        // Continue to fallback methods
                        tryFallbackCopy(text, resolve, reject);
                    });
            } else {
                // Go straight to fallback methods
                tryFallbackCopy(text, resolve, reject);
            }
        });
    }

    // Fallback methods for copying text
    function tryFallbackCopy(text, resolve, reject) {
        try {
            // Method 2: execCommand approach (older browsers)
            const textArea = document.createElement('textarea');
            textArea.value = text;
            
            // Make the textarea invisible
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            
            // Select and copy
            textArea.focus();
            textArea.select();
            
            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);
            
            if (successful) {
                resolve();
            } else {
                reject(new Error('execCommand copy failed'));
            }
        } catch (err) {
            reject(err);
        }
    }

    // Show visual feedback when copied
    function showCopyFeedback(button) {
        // Change the icon temporarily
        const originalHTML = button.innerHTML;
        button.innerHTML = '<i class="fas fa-check"></i>';
        button.style.color = '#10b981'; // Success color
        
        // Restore the original icon after a delay
        setTimeout(() => {
            button.innerHTML = originalHTML;
            button.style.color = '';
        }, 1500);
    }

    //======================================
    // ENHANCED EXPORT FEATURE
    //======================================

    // Initialize enhanced export
    function initializeEnhancedExport() {
        // Replace the original export function if it exists
        if (typeof window.exportConversationAsPDF === 'function') {
            window.exportConversationAsPDF = exportConversation;
        }
        
        // Add the export function to the window object
        window.exportConversation = exportConversation;
        
        // Find the export option in chat menu and update its handler
        updateExportMenuOption();
    }

    // Find and update the chat options menu export item
    function updateExportMenuOption() {
        const chatOptionItems = document.querySelectorAll('.chat-option-item');
        chatOptionItems.forEach(item => {
            if (item.textContent.includes('Export')) {
                // Remove existing event listeners by cloning and replacing
                const newItem = item.cloneNode(true);
                if (item.parentNode) {
                    item.parentNode.replaceChild(newItem, item);
                }
                
                // Add new event listener
                newItem.addEventListener('click', function() {
                    exportConversation();
                    // Close the menu
                    const menu = this.closest('.chat-options-menu');
                    if (menu) menu.classList.add('hidden');
                });
            }
        });
    }

    // Main export function
    function exportConversation() {
        // Check if there's a current character and chat messages
        const chatMessages = document.getElementById('chat-messages');
        const hasState = window.state && window.state.currentCharacter;
        
        if (!hasState || !chatMessages) {
            showSimpleNotification('No conversation to export.', 'warning');
            return;
        }
        
        const messages = chatMessages.querySelectorAll('.message');
        if (messages.length === 0) {
            showSimpleNotification('No conversation to save.', 'warning');
            return;
        }
        
        // Show export options modal
        showExportOptionsModal();
    }

    // Show export options modal
    function showExportOptionsModal() {
        // Create modal if it doesn't exist
        let exportModal = document.getElementById('export-modal');
        
        if (!exportModal) {
            exportModal = document.createElement('div');
            exportModal.id = 'export-modal';
            exportModal.className = 'modal-backdrop';
            
            const characterName = window.state && window.state.currentCharacter ? 
                                  window.state.currentCharacter.name : 'Character';
            
            exportModal.innerHTML = `
                <div class="modal">
                    <div class="modal-header">
                        <h3 class="modal-title">Export Conversation</h3>
                        <button class="modal-close" id="export-modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label class="form-label">Conversation Name</label>
                            <input type="text" id="export-name" class="form-input" 
                                value="Conversation with ${characterName}" />
                        </div>
                        <div class="form-group">
                            <label class="form-label">Export Format</label>
                            <select id="export-format" class="form-input">
                                <option value="txt">Plain Text (.txt)</option>
                                <option value="md">Markdown (.md)</option>
                                <option value="html">HTML (.html)</option>
                                <option value="json">JSON (.json)</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Export Options</label>
                            <div class="form-toggle">
                                <label class="toggle-switch">
                                    <input type="checkbox" id="export-include-metadata" checked>
                                    <span class="toggle-slider"></span>
                                </label>
                                <span>Include metadata (timestamps, emotions)</span>
                            </div>
                            <div class="form-toggle mt-2">
                                <label class="toggle-switch">
                                    <input type="checkbox" id="export-include-scenes" checked>
                                    <span class="toggle-slider"></span>
                                </label>
                                <span>Include scene descriptions</span>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button id="export-cancel-btn" class="btn btn-secondary">Cancel</button>
                        <button id="export-download-btn" class="btn btn-primary">Download</button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(exportModal);
            
            // Add event listeners
            document.getElementById('export-modal-close').addEventListener('click', () => {
                exportModal.classList.add('hidden');
            });
            
            document.getElementById('export-cancel-btn').addEventListener('click', () => {
                exportModal.classList.add('hidden');
            });
            
            document.getElementById('export-download-btn').addEventListener('click', () => {
                // Get export options
                const characterName = window.state && window.state.currentCharacter ? 
                                     window.state.currentCharacter.name : 'Character';
                const name = document.getElementById('export-name').value.trim() || 
                    `Conversation with ${characterName}`;
                const format = document.getElementById('export-format').value;
                const includeMetadata = document.getElementById('export-include-metadata').checked;
                const includeScenes = document.getElementById('export-include-scenes').checked;
                
                // Generate the export content
                const content = generateExportContent(format, includeMetadata, includeScenes);
                
                // Create a safe filename - replace spaces and special chars
                const safeFilename = name.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.' + format;
                
                // Download the file
                downloadExport(content, safeFilename, format);
                
                // Close the modal
                exportModal.classList.add('hidden');
            });
        } else {
            // Update the character name if necessary
            const nameInput = document.getElementById('export-name');
            if (nameInput && window.state && window.state.currentCharacter) {
                if (!nameInput.value.includes(window.state.currentCharacter.name)) {
                    nameInput.value = `Conversation with ${window.state.currentCharacter.name}`;
                }
            }
        }
        
        // Show the modal
        exportModal.classList.remove('hidden');
    }

    // Generate export content based on format and options
    function generateExportContent(format, includeMetadata, includeScenes) {
        const chatMessages = document.getElementById('chat-messages');
        const characterName = window.state && window.state.currentCharacter ? 
                             window.state.currentCharacter.name : 'Character';
        
        if (!chatMessages) {
            return 'No conversation to export.';
        }
        
        const messages = chatMessages.querySelectorAll('.message');
        if (messages.length === 0) {
            return 'No messages to export.';
        }
        
        // Get conversation data
        const conversationData = [];
        
        messages.forEach(message => {
            const isUser = message.classList.contains('message-user');
            const name = isUser ? 'You' : characterName;
            const textElement = message.querySelector('.message-text');
            const metadataElement = message.querySelector('.message-metadata');
            
            // Skip if no text content
            if (!textElement) return;
            
            const text = textElement.textContent;
            const time = metadataElement ? metadataElement.textContent.trim() : '';
            
            // Get emotion tags if present
            let emotions = [];
            const emotionTags = message.querySelectorAll('.emotion-tag');
            if (emotionTags.length > 0) {
                emotions = Array.from(emotionTags).map(tag => tag.textContent);
            }
            
            // Check if this message has a scene description following it
            let sceneDescription = null;
            if (!isUser && includeScenes) {
                const nextElement = message.nextElementSibling;
                if (nextElement && nextElement.classList.contains('scene-description')) {
                    const sceneContent = nextElement.querySelector('.scene-content p');
                    if (sceneContent) {
                        sceneDescription = sceneContent.textContent;
                    }
                }
            }
            
            // Construct message object
            const messageObj = {
                speaker: name,
                text: text,
                isUser: isUser
            };
            
            // Add metadata if option is enabled
            if (includeMetadata) {
                messageObj.time = time;
                if (emotions.length > 0) {
                    messageObj.emotions = emotions;
                }
            }
            
            // Add scene if available and option is enabled
            if (sceneDescription) {
                messageObj.scene = sceneDescription;
            }
            
            conversationData.push(messageObj);
        });
        
        // Generate content based on format
        switch (format) {
            case 'txt':
                return generatePlainTextExport(conversationData, includeMetadata, characterName);
            case 'md':
                return generateMarkdownExport(conversationData, includeMetadata, characterName);
            case 'html':
                return generateHtmlExport(conversationData, includeMetadata, characterName);
            case 'json':
                return JSON.stringify({
                    character: characterName,
                    timestamp: new Date().toISOString(),
                    messages: conversationData
                }, null, 2);
            default:
                return generatePlainTextExport(conversationData, includeMetadata, characterName);
        }
    }

    // Generate plain text export
    function generatePlainTextExport(conversationData, includeMetadata, characterName) {
        let content = `Conversation with ${characterName}\n`;
        content += `Date: ${new Date().toLocaleString()}\n\n`;
        
        conversationData.forEach(message => {
            // Add speaker and text
            content += `${message.speaker}: ${message.text}\n`;
            
            // Add metadata if enabled
            if (includeMetadata && message.time) {
                content += `[${message.time}]`;
                
                if (message.emotions && message.emotions.length > 0) {
                    content += ` [Emotions: ${message.emotions.join(', ')}]`;
                }
                
                content += '\n';
            }
            
            // Add scene description if present
            if (message.scene) {
                content += `\n[Scene: ${message.scene}]\n`;
            }
            
            content += '\n';
        });
        
        return content;
    }

    // Generate Markdown export
    function generateMarkdownExport(conversationData, includeMetadata, characterName) {
        let content = `# Conversation with ${characterName}\n\n`;
        content += `_Exported on ${new Date().toLocaleString()}_\n\n`;
        
        conversationData.forEach(message => {
            // Style based on speaker
            if (message.isUser) {
                content += `### 👤 You\n\n`;
            } else {
                content += `### 🤖 ${message.speaker}\n\n`;
            }
            
            // Add text
            content += `${message.text}\n\n`;
            
            // Add metadata if enabled
            if (includeMetadata) {
                let metaContent = '';
                
                if (message.time) {
                    metaContent += `_${message.time}_`;
                }
                
                if (message.emotions && message.emotions.length > 0) {
                    metaContent += ` _Emotions: ${message.emotions.join(', ')}_`;
                }
                
                if (metaContent) {
                    content += `<small>${metaContent}</small>\n\n`;
                }
            }
            
            // Add scene description if present
            if (message.scene) {
                content += `> _${message.scene}_\n\n`;
            }
            
            content += `---\n\n`;
        });
        
        return content;
    }

    // Generate HTML export
    function generateHtmlExport(conversationData, includeMetadata, characterName) {
        // Basic HTML structure with some simple styling
        let content = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Conversation with ${characterName}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            color: #333;
        }
        .conversation-header {
            text-align: center;
            margin-bottom: 30px;
        }
        .message {
            margin-bottom: 20px;
            padding: 15px;
            border-radius: 10px;
        }
        .user-message {
            background-color: #e6f7ff;
            margin-left: 50px;
        }
        .character-message {
            background-color: #f5f5f5;
            margin-right: 50px;
        }
        .speaker {
            font-weight: bold;
            margin-bottom: 5px;
        }
        .metadata {
            font-size: 0.8em;
            color: #777;
            margin-top: 5px;
        }
        .scene {
            font-style: italic;
            background-color: #fffde7;
            padding: 10px;
            margin: 10px 0;
            border-left: 3px solid #ffc107;
        }
        .emotions {
            display: inline-block;
            margin-left: 10px;
        }
        .emotion-tag {
            display: inline-block;
            background-color: #673ab7;
            color: white;
            padding: 1px 6px;
            border-radius: 10px;
            font-size: 0.7em;
            margin-right: 3px;
        }
    </style>
</head>
<body>
    <div class="conversation-header">
        <h1>Conversation with ${characterName}</h1>
        <p>Exported on ${new Date().toLocaleString()}</p>
    </div>
    
    <div class="conversation-content">
`;
        
        // Add each message
        conversationData.forEach(message => {
            const messageClass = message.isUser ? 'user-message' : 'character-message';
            
            content += `        <div class="message ${messageClass}">
            <div class="speaker">${message.speaker}</div>
            <div class="text">${message.text}</div>
`;
            
            // Add metadata if enabled
            if (includeMetadata) {
                content += `            <div class="metadata">
`;
                if (message.time) {
                    content += `                ${message.time}
`;
                }
                
                if (message.emotions && message.emotions.length > 0) {
                    content += `                <div class="emotions">
`;
                    message.emotions.forEach(emotion => {
                        content += `                    <span class="emotion-tag">${emotion}</span>
`;
                    });
                    content += `                </div>
`;
                }
                
                content += `            </div>
`;
            }
            
            // Add scene description if present
            if (message.scene) {
                content += `            <div class="scene">${message.scene}</div>
`;
            }
            
            content += `        </div>
`;
        });
        
        // Close HTML structure
        content += `    </div>
</body>
</html>`;
        
        return content;
    }

    // Function to download the export file
    function downloadExport(content, filename, format) {
        // Create blob and mime type based on format
        let mimeType = 'text/plain';
        
        if (format === 'html') {
            mimeType = 'text/html';
        } else if (format === 'json') {
            mimeType = 'application/json';
        } else if (format === 'md') {
            mimeType = 'text/markdown';
        }
        
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        // Create download link
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
        
        // Show notification
        showSimpleNotification(`Conversation exported as ${format.toUpperCase()}`, 'success');
    }

    //======================================
    // SCROLL TO BOTTOM FEATURE
    //======================================

    // Initialize scroll to bottom feature
    function initializeScrollFeature() {
        const chatMessages = document.getElementById('chat-messages');
        if (!chatMessages) return;
        
        // Variable to track if user has scrolled up
        let userHasScrolledUp = false;
        let scrollButton = null;
        
        // Add scroll event listener
        chatMessages.addEventListener('scroll', function() {
            const isNearBottom = chatMessages.scrollHeight - chatMessages.scrollTop <= 
                                chatMessages.clientHeight + config.scrollThreshold;
            
            if (!isNearBottom) {
                userHasScrolledUp = true;
                
                // Create and show scroll button if it doesn't exist
                if (!scrollButton) {
                    scrollButton = createScrollButton();
                }
                
                // Make sure button is visible
                scrollButton.classList.remove('hidden');
            } else {
                userHasScrolledUp = false;
                
                // Hide scroll button if it exists
                if (scrollButton) {
                    scrollButton.classList.add('hidden');
                }
            }
        });
        
        // Enhance scrollToBottom function if it exists
        if (typeof window.scrollToBottom === 'function') {
            const originalScrollToBottom = window.scrollToBottom;
            window.scrollToBottom = function() {
                originalScrollToBottom();
                
                // Hide scroll button if it exists
                if (scrollButton) {
                    scrollButton.classList.add('hidden');
                }
                
                // Reset scroll flag
                userHasScrolledUp = false;
            };
        } else {
            // Create our own scrollToBottom function
            window.scrollToBottom = function() {
                if (chatMessages) {
                    chatMessages.scrollTop = chatMessages.scrollHeight;
                    
                    // Hide scroll button if it exists
                    if (scrollButton) {
                        scrollButton.classList.add('hidden');
                    }
                    
                    // Reset scroll flag
                    userHasScrolledUp = false;
                }
            };
        }
        
        // Listen for new messages to flash the scroll button
        document.addEventListener('newMessageAdded', function() {
            if (userHasScrolledUp && scrollButton) {
                scrollButton.classList.add('flash');
                setTimeout(() => {
                    scrollButton.classList.remove('flash');
                }, 1000);
            }
        });
    }

    // Create scroll to bottom button
    function createScrollButton() {
        // Check if button already exists
        let scrollBtn = document.getElementById('scroll-to-bottom-btn');
        
        if (!scrollBtn) {
            scrollBtn = document.createElement('button');
            scrollBtn.id = 'scroll-to-bottom-btn';
            scrollBtn.className = 'scroll-to-bottom-btn';
            scrollBtn.innerHTML = '<i class="fas fa-arrow-down"></i>';
            scrollBtn.title = 'Scroll to bottom';
            
            // Add click handler
            scrollBtn.addEventListener('click', function() {
                // Use the app's scrollToBottom function if it exists
                if (typeof window.scrollToBottom === 'function') {
                    window.scrollToBottom();
                } else {
                    // Fallback
                    const chatMessages = document.getElementById('chat-messages');
                    if (chatMessages) {
                        chatMessages.scrollTop = chatMessages.scrollHeight;
                    }
                }
                
                // Hide the button
                this.classList.add('hidden');
            });
            
            // Add to document
            document.body.appendChild(scrollBtn);
        }
        
        return scrollBtn;
    }

    //======================================
    // UTILITY FUNCTIONS
    //======================================

    // Set up a mutation observer to watch for new messages
    function setupMessageObserver() {
        if (state.observerActive) return;
        
        const chatMessages = document.getElementById('chat-messages');
        if (!chatMessages) return;
        
        // Create a MutationObserver instance
        const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    // Check if any of the added nodes are message elements
                    let messageAdded = false;
                    
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === Node.ELEMENT_NODE && 
                            (node.classList.contains('message-user') || 
                             node.classList.contains('message-character'))) {
                            messageAdded = true;
                        }
                    });
                    
                    if (messageAdded) {
                        // Dispatch a custom event to notify all features
                        const event = new CustomEvent('newMessageAdded');
                        document.dispatchEvent(event);
                    }
                }
            });
        });
        
        // Start observing
        observer.observe(chatMessages, { childList: true });
        state.observerActive = true;
        
        return observer;
    }

    // Create a simple loading indicator
    function createSimpleLoadingIndicator() {
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'qol-loading-indicator';
        loadingDiv.innerHTML = `
            <div class="qol-spinner"></div>
            <div>Regenerating response...</div>
        `;
        document.body.appendChild(loadingDiv);
        return loadingDiv;
    }

    // Remove the loading indicator
    function removeSimpleLoadingIndicator(indicator) {
        if (indicator && indicator.parentNode) {
            indicator.parentNode.removeChild(indicator);
        }
    }

    // Show a simple notification
    function showSimpleNotification(message, type) {
        // Create a notification element
        const notification = document.createElement('div');
        notification.className = `qol-notification qol-notification-${type || 'info'}`;
        notification.textContent = message;
        
        // Add to document
        document.body.appendChild(notification);
        
        // Remove after a delay
        setTimeout(() => {
            if (notification.parentNode) {
                notification.classList.add('qol-notification-hiding');
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }
        }, config.notificationDuration);
    }

    // Format time simply
    function formatSimpleTime(date) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    // Get current character ID
    function getCurrentCharacterId() {
        // Try to get from state if accessible
        if (window.state && window.state.currentCharacter && window.state.currentCharacter.id) {
            return window.state.currentCharacter.id;
        }
        
        // Try to get from URL if present
        const urlMatch = window.location.pathname.match(/\/characters\/([^\/]+)/);
        if (urlMatch && urlMatch[1]) {
            return urlMatch[1];
        }
        
        // Try to get from active character in sidebar
        const activeCharacter = document.querySelector('.character-item.active');
        if (activeCharacter && activeCharacter.dataset.characterId) {
            return activeCharacter.dataset.characterId;
        }
        
        console.error('Could not determine current character ID');
        return null;
    }

    // Check if using local model
    function isUsingLocalModel() {
        if (window.state && window.state.settings && window.state.settings.model) {
            return window.state.settings.model === 'local';
        }
        return false;
    }

    // Get API key
    function getApiKey() {
        if (window.state && window.state.settings && window.state.settings.apiKey) {
            return window.state.settings.apiKey;
        }
        return '';
    }

    // Get higher temperature for variety
    function getHigherTemperature() {
        let baseTemp = config.defaultTemperature;
        if (window.state && window.state.settings && window.state.settings.temperature) {
            baseTemp = parseFloat(window.state.settings.temperature) || config.defaultTemperature;
        }
        return Math.min(baseTemp + config.retryTemperatureIncrease, config.maxTemperature);
    }

    // Update character state if possible
    function updateCharacterState(responseData) {
        if (window.state && window.state.currentCharacter) {
            if (responseData.mood) window.state.currentCharacter.mood = responseData.mood;
            if (responseData.emotions) window.state.currentCharacter.emotions = responseData.emotions;
            if (responseData.opinion_of_user) window.state.currentCharacter.opinion_of_user = responseData.opinion_of_user;
            if (responseData.action) window.state.currentCharacter.action = responseData.action;
            if (responseData.location) window.state.currentCharacter.location = responseData.location;
            
            // Try to call the UI update function if it exists
            if (typeof window.updateCharacterMoodUI === 'function') {
                window.updateCharacterMoodUI();
            }
        }
    }

    // Update scene description if available
    function updateSceneDescription(messageElement, responseData) {
        if (!responseData.scene_description) return;
        
        // Look for the next scene description element
        const nextElement = messageElement.nextElementSibling;
        if (nextElement && nextElement.classList.contains('scene-description')) {
            // Update existing scene description
            const sceneContent = nextElement.querySelector('.scene-content p');
            if (sceneContent) {
                sceneContent.textContent = responseData.scene_description;
                
                // Make sure the scene is visible in novel/cinematic modes
                const currentMode = getCurrentViewMode();
                if (currentMode === 'novel' || currentMode === 'cinematic') {
                    const sceneToggle = nextElement.querySelector('.scene-toggle');
                    const sceneContentDiv = nextElement.querySelector('.scene-content');
                    
                    if (sceneToggle && !sceneToggle.classList.contains('active')) {
                        sceneToggle.classList.add('active');
                        sceneContentDiv.classList.add('active');
                        
                        // Update toggle text
                        const toggleText = sceneToggle.querySelector('span');
                        if (toggleText) {
                            toggleText.textContent = 'Hide Scene Description';
                        }
                    }
                }
            }
        } else {
            // Create new scene description if it doesn't exist
            const sceneDiv = document.createElement('div');
            sceneDiv.className = 'scene-description';
            
            sceneDiv.innerHTML = `
                <div class="scene-toggle">
                    <span>View Scene Description</span>
                    <i class="fas fa-chevron-down"></i>
                </div>
                <div class="scene-content">
                    <p>${responseData.scene_description}</p>
                </div>
            `;
            
            // Insert after the message element
            if (messageElement.nextSibling) {
                messageElement.parentNode.insertBefore(sceneDiv, messageElement.nextSibling);
            } else {
                messageElement.parentNode.appendChild(sceneDiv);
            }
            
            // Add toggle functionality
            const sceneToggle = sceneDiv.querySelector('.scene-toggle');
            const sceneContent = sceneDiv.querySelector('.scene-content');
            
            if (sceneToggle && sceneContent) {
                sceneToggle.addEventListener('click', () => {
                    sceneToggle.classList.toggle('active');
                    sceneContent.classList.toggle('active');
                    
                    // Update toggle text
                    const toggleText = sceneToggle.querySelector('span');
                    if (toggleText) {
                        toggleText.textContent = sceneContent.classList.contains('active') ? 
                            'Hide Scene Description' : 'View Scene Description';
                    }
                });
                
                // Auto-expand scene in novel or cinematic modes
                const currentMode = getCurrentViewMode();
                if (currentMode === 'novel' || currentMode === 'cinematic') {
                    sceneToggle.click();
                }
            }
        }
    }

    // Get current view mode
    function getCurrentViewMode() {
        if (window.state && window.state.settings && window.state.settings.interactionMode) {
            return window.state.settings.interactionMode;
        }
        
        // Try to determine from body classes
        if (document.body.classList.contains('novel-mode')) return 'novel';
        if (document.body.classList.contains('cinematic-mode')) return 'cinematic';
        
        return 'simple';
    }

    //======================================
    // INITIALIZATION (RUN WHEN LOADED)
    //======================================

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeQualityOfLifeFeatures);
    } else {
        // DOM already loaded
        initializeQualityOfLifeFeatures();
    }
    
    // Also try init on window load to ensure all resources are loaded
    window.addEventListener('load', initializeQualityOfLifeFeatures);
})();

// Fixed version of initializeScrollFeature function
function initializeScrollFeature() {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) return;
    
    // Variable to track if user has scrolled up
    let userHasScrolledUp = false;
    let scrollButton = null;
    
    // Create the scroll button right away (but hidden)
    scrollButton = createScrollButton();
    scrollButton.classList.add('hidden');
    
    // Add scroll event listener
    chatMessages.addEventListener('scroll', function() {
        // Calculate if we're near the bottom - make threshold bigger for reliability
        const scrollThreshold = 150;
        const isNearBottom = chatMessages.scrollHeight - chatMessages.scrollTop - chatMessages.clientHeight <= scrollThreshold;
        
        if (!isNearBottom) {
            userHasScrolledUp = true;
            
            // Show scroll button
            scrollButton.classList.remove('hidden');
        } else {
            userHasScrolledUp = false;
            
            // Hide scroll button
            scrollButton.classList.add('hidden');
        }
    });
    
    // Force an initial check
    setTimeout(() => {
        const event = new Event('scroll');
        chatMessages.dispatchEvent(event);
    }, 500);
    
    // Enhance scrollToBottom function if it exists
    if (typeof window.scrollToBottom === 'function') {
        const originalScrollToBottom = window.scrollToBottom;
        window.scrollToBottom = function() {
            try {
                originalScrollToBottom();
            } catch(e) {
                console.warn("Original scrollToBottom failed, using fallback", e);
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }
            
            // Hide scroll button
            scrollButton.classList.add('hidden');
            
            // Reset scroll flag
            userHasScrolledUp = false;
        };
    } else {
        // Create our own scrollToBottom function
        window.scrollToBottom = function() {
            if (chatMessages) {
                chatMessages.scrollTop = chatMessages.scrollHeight;
                
                // Hide scroll button
                scrollButton.classList.add('hidden');
                
                // Reset scroll flag
                userHasScrolledUp = false;
            }
        };
    }
    
    // Listen for new messages to flash the scroll button
    document.addEventListener('newMessageAdded', function() {
        if (userHasScrolledUp && scrollButton) {
            scrollButton.classList.add('flash');
            setTimeout(() => {
                scrollButton.classList.remove('flash');
            }, 1000);
        }
        
        // Auto-scroll if we're at the bottom already
        if (!userHasScrolledUp) {
            setTimeout(() => window.scrollToBottom(), 100);
        }
    });
}

// Improved create scroll button function
function createScrollButton() {
    // Check if button already exists
    let scrollBtn = document.getElementById('scroll-to-bottom-btn');
    
    if (!scrollBtn) {
        scrollBtn = document.createElement('button');
        scrollBtn.id = 'scroll-to-bottom-btn';
        scrollBtn.className = 'scroll-to-bottom-btn';
        scrollBtn.innerHTML = '<i class="fas fa-arrow-down"></i>';
        scrollBtn.title = 'Scroll to bottom';
        
        // Add click handler - with error handling
        scrollBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            try {
                // Use the app's scrollToBottom function if it exists
                if (typeof window.scrollToBottom === 'function') {
                    window.scrollToBottom();
                } else {
                    // Fallback
                    const chatMessages = document.getElementById('chat-messages');
                    if (chatMessages) {
                        chatMessages.scrollTop = chatMessages.scrollHeight;
                    }
                }
                
                // Hide the button
                this.classList.add('hidden');
            } catch(err) {
                console.error("Error in scroll button click handler", err);
                // Direct fallback
                try {
                    const chatMessages = document.getElementById('chat-messages');
                    if (chatMessages) {
                        chatMessages.scrollTop = chatMessages.scrollHeight;
                    }
                } catch(e) {
                    console.error("Fatal error in scroll function", e);
                }
            }
        });
        
        // Add to document
        document.body.appendChild(scrollBtn);
    }
    
    return scrollBtn;
}


// Basic chat scrolling fix - add to end of your JS file
(function() {
    console.log("Applying basic chat scrolling fix");
    
    // Apply fix when DOM is ready
    function applyScrollFix() {
      const chatMessages = document.getElementById('chat-messages');
      if (!chatMessages) {
        console.warn("Chat messages container not found");
        return;
      }
      
      console.log("Fixing basic chat scrolling");
      
      // Remove any existing scroll buttons to avoid interference
      const scrollButtons = document.querySelectorAll('#scroll-to-bottom-btn, .scroll-to-bottom-btn');
      scrollButtons.forEach(btn => {
        if (btn.parentNode) {
          btn.parentNode.removeChild(btn);
        }
      });
      
      // Fix chat container styling to ensure scrolling works
      chatMessages.style.overflowY = 'auto';
      chatMessages.style.position = 'relative';
      
      // Recalculate correct height
      function updateChatHeight() {
        const windowHeight = window.innerHeight;
        const headerHeight = document.querySelector('.chat-header')?.offsetHeight || 60;
        const controlsHeight = document.querySelector('.chat-controls-container')?.offsetHeight || 140;
        
        // Set a sensible height that leaves room for the input
        const newHeight = windowHeight - headerHeight - controlsHeight;
        chatMessages.style.height = `${newHeight}px`;
        chatMessages.style.maxHeight = `${newHeight}px`;
        console.log("Updated chat container height:", newHeight);
      }
      
      // Simple scroll to bottom function (no interference with normal scrolling)
      window.scrollToBottom = function() {
        if (chatMessages) {
          chatMessages.scrollTop = chatMessages.scrollHeight;
        }
      };
      
      // Basic improvement of message functions
      if (window.addUserMessage) {
        const originalAddUserMessage = window.addUserMessage;
        window.addUserMessage = function(text) {
          originalAddUserMessage(text);
          setTimeout(window.scrollToBottom, 10);
        };
      }
      
      if (window.addCharacterMessage) {
        const originalAddCharacterMessage = window.addCharacterMessage;
        window.addCharacterMessage = function(text, metadata) {
          originalAddCharacterMessage(text, metadata);
          setTimeout(window.scrollToBottom, 10);
        };
      }
      
      // Handle window resize events
      window.addEventListener('resize', updateChatHeight);
      
      // Run initial setup
      updateChatHeight();
      setTimeout(window.scrollToBottom, 100);
      
      // Force redraw of chat container to fix potential CSS issues
      chatMessages.style.display = 'none';
      setTimeout(() => {
        chatMessages.style.display = '';
        updateChatHeight();
        window.scrollToBottom();
      }, 50);
      
      console.log("Basic chat scrolling fix applied");
    }
    
    // Run when DOM loaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => setTimeout(applyScrollFix, 500));
    } else {
      // DOM already loaded
      setTimeout(applyScrollFix, 100);
    }
    
    // Also try on window load
    window.addEventListener('load', () => setTimeout(applyScrollFix, 500));
  })();
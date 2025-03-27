// core.js - Application core and state management

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
    PROMPTS_RESET: '/api/prompts/reset',
    // New endpoints for chat instances
    CHATS: '/api/chats',
    GENERATE_LOCATION: '/api/generate-location'
};

// App state object
window.state = {
    characters: [],
    currentCharacter: null,
    chatInstances: [],  
    currentChat: null,  
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

// UI elements container
window.elements = {
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

// Create view options UI
function createViewOptions() {
    // Only create if it doesn't already exist
    if (document.querySelector('.view-options')) {
        console.log('View options already exist, skipping creation');
        return;
    }
    
   
    window.elements.viewOptions = document.createElement('div');
    window.elements.viewOptions.className = 'view-options';
    window.elements.viewOptions.innerHTML = `
        <div class="view-option" data-view="simple">Simple</div>
        <div class="view-option" data-view="novel">Novel</div>
        <div class="view-option" data-view="cinematic">Cinematic</div>
    `;
    
    // Insert view options at the top of chat messages
    if (window.elements.chatInterface) {
        const chatHeader = window.elements.chatInterface.querySelector('.chat-header');
        if (chatHeader) {
            window.elements.chatInterface.insertBefore(window.elements.viewOptions, chatHeader.nextSibling);
        }
    }
    
    // Add interaction mode to settings
    if (window.elements.settingsModal) {
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
            window.elements.interactionModeSelect = generalTab.querySelector('select[name="interaction-mode"]');
        }
    }
}
window.API = {
    BASE_URL: "", // Empty string if same domain, or your server URL
    CHARACTERS: "/api/characters",
    CHAT: "/api/chat",
    CHAT_HISTORY: "/api/chat/history",
    // Other API endpoints...
};

// Initialize the application
function initCore() {
    console.log('Initializing application core...');
    
    // Create view options
    createViewOptions();
    
    // Add API to window for global access
    window.API = API;
}

// Expose the API and initialization functions
window.core = {
    init: initCore,
    API: API
};

// Run initialization when document is loaded
document.addEventListener('DOMContentLoaded', initCore);
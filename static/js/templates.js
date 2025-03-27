// templates.js - Prompt template management and previewing

// Load prompt templates
async function loadPromptTemplates() {
    const state = window.appState;
    const API = window.API;
    
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
        window.showNotification('Failed to load prompt templates. Using defaults.', 'warning');
        
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
    const state = window.appState;
    const elements = window.appElements;
    
    // Basic prompt tab
    if (elements.basePromptInput) {
        elements.basePromptInput.value = state.promptTemplates.base_prompt || '';
    }
    
    // Other template field updates
}

// Save prompt templates
async function savePromptTemplates() {
    const state = window.appState;
    const elements = window.appElements;
    const API = window.API;
    
    // Implementation
}

// Reset prompt templates to default
async function resetPromptTemplates() {
    const state = window.appState;
    const API = window.API;
    
    // Implementation
}

// Preview prompt
function previewPrompt() {
    const state = window.appState;
    const elements = window.appElements;
    
    // Implementation
}

// Export for use in other modules
window.loadPromptTemplates = loadPromptTemplates;
window.updatePromptTemplateInputs = updatePromptTemplateInputs;
window.savePromptTemplates = savePromptTemplates;
window.resetPromptTemplates = resetPromptTemplates;
window.previewPrompt = previewPrompt;
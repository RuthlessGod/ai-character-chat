// prompt-templates.js - Prompt template management

// Load prompt templates from API
async function loadPromptTemplates() {
    try {
        const response = await fetch(`${window.API.BASE_URL}${window.API.PROMPTS}`);
        if (!response.ok) {
            throw new Error(`Failed to load prompt templates: ${response.statusText}`);
        }
        
        const templates = await response.json();
        window.state.promptTemplates = templates;
        
        // Update the UI with the loaded templates
        updatePromptTemplateInputs();
        
        return templates;
    } catch (error) {
        console.error('Error loading prompt templates:', error);
        window.utils.showNotification('Failed to load prompt templates. Using defaults.', 'warning');
        
        // Try to load defaults
        try {
            const defaultResponse = await fetch(`${window.API.BASE_URL}${window.API.PROMPTS_DEFAULT}`);
            if (defaultResponse.ok) {
                const defaultTemplates = await defaultResponse.json();
                window.state.promptTemplates = defaultTemplates;
                updatePromptTemplateInputs();
            }
        } catch (defaultError) {
            console.error('Error loading default templates:', defaultError);
        }
    }
}

// Update the UI with the current prompt templates
function updatePromptTemplateInputs() {
    console.log('Updating prompt template inputs with data:', window.state.promptTemplates);
    
    // Helper function to safely set textarea values
    function safeSetValue(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.value = value || '';
        } else {
            console.warn(`Element with ID ${id} not found`);
        }
    }

    // Character Definition - Basic
    safeSetValue('base-prompt-template', window.state.promptTemplates.base_prompt);
    safeSetValue('introduction-template', window.state.promptTemplates.introduction);
    safeSetValue('speaking-style-template', window.state.promptTemplates.speaking_style);
    
    // Character Definition - Appearance
    safeSetValue('appearance-template', window.state.promptTemplates.appearance);
    safeSetValue('physical-description-template', window.state.promptTemplates.physical_description);
    
    // Character Definition - Personality
    safeSetValue('personality-template', window.state.promptTemplates.personality);
    safeSetValue('mood-emotions-template', window.state.promptTemplates.mood_emotions);
    safeSetValue('opinion-template', window.state.promptTemplates.opinion);
    
    // Interaction & Context - Context
    safeSetValue('location-template', window.state.promptTemplates.location);
    safeSetValue('action-template', window.state.promptTemplates.action);
    safeSetValue('memory-template', window.state.promptTemplates.memory);
    
    // Interaction & Context - Roleplay
    safeSetValue('roleplaying-instructions-template', window.state.promptTemplates.roleplaying_instructions);
    safeSetValue('consistency-template', window.state.promptTemplates.consistency);
    safeSetValue('action-resolution-template', window.state.promptTemplates.action_resolution);
    
    // Interaction & Context - Response
    safeSetValue('response-format-template', window.state.promptTemplates.response_format);
    safeSetValue('json-structure-template', window.state.promptTemplates.json_structure);
    
    // Scene & Environment
    safeSetValue('scene-description-template', window.state.promptTemplates.scene_description);
    safeSetValue('environment-template', window.state.promptTemplates.environment);
    safeSetValue('cinematic-template', window.state.promptTemplates.cinematic);
    
    // Player Actions
    safeSetValue('player-action-success-template', window.state.promptTemplates.player_action_success);
    safeSetValue('player-action-failure-template', window.state.promptTemplates.player_action_failure);
    safeSetValue('skill-check-description-template', window.state.promptTemplates.skill_check_description);
    safeSetValue('action-consequences-template', window.state.promptTemplates.action_consequences);
    
    console.log('Prompt template inputs updated');
}

// Load all prompt templates into UI
function loadPromptTemplatesIntoUI() {
    console.log('Loading prompt templates into UI');
    
    if (!window.state.promptTemplates) {
        console.warn('No prompt templates in state to load into UI');
        return;
    }
    
    // Use updatePromptTemplateInputs to set all values
    updatePromptTemplateInputs();
}

// Save prompt templates
async function savePromptTemplates() {
    console.log('Saving prompt templates');
    
    // Helper function to safely get values from form elements
    function safeGetValue(id, defaultValue = '') {
        const element = document.getElementById(id);
        return element ? element.value : defaultValue;
    }
    
    // Gather all template values from inputs
    const templates = {
        // Character Definition - Basic
        base_prompt: safeGetValue('base-prompt-template', window.state.promptTemplates.base_prompt),
        introduction: safeGetValue('introduction-template', window.state.promptTemplates.introduction),
        speaking_style: safeGetValue('speaking-style-template', window.state.promptTemplates.speaking_style),
        
        // Character Definition - Appearance
        appearance: safeGetValue('appearance-template', window.state.promptTemplates.appearance),
        physical_description: safeGetValue('physical-description-template', window.state.promptTemplates.physical_description),
        
        // Character Definition - Personality
        personality: safeGetValue('personality-template', window.state.promptTemplates.personality),
        mood_emotions: safeGetValue('mood-emotions-template', window.state.promptTemplates.mood_emotions),
        opinion: safeGetValue('opinion-template', window.state.promptTemplates.opinion),
        
        // Interaction & Context - Context
        location: safeGetValue('location-template', window.state.promptTemplates.location),
        action: safeGetValue('action-template', window.state.promptTemplates.action),
        memory: safeGetValue('memory-template', window.state.promptTemplates.memory),
        
        // Interaction & Context - Roleplay
        roleplaying_instructions: safeGetValue('roleplaying-instructions-template', window.state.promptTemplates.roleplaying_instructions),
        consistency: safeGetValue('consistency-template', window.state.promptTemplates.consistency),
        action_resolution: safeGetValue('action-resolution-template', window.state.promptTemplates.action_resolution),
        
        // Interaction & Context - Response
        response_format: safeGetValue('response-format-template', window.state.promptTemplates.response_format),
        json_structure: safeGetValue('json-structure-template', window.state.promptTemplates.json_structure),
        
        // Scene & Environment
        scene_description: safeGetValue('scene-description-template', window.state.promptTemplates.scene_description),
        environment: safeGetValue('environment-template', window.state.promptTemplates.environment),
        cinematic: safeGetValue('cinematic-template', window.state.promptTemplates.cinematic),
        
        // Player Actions
        player_action_success: safeGetValue('player-action-success-template', window.state.promptTemplates.player_action_success),
        player_action_failure: safeGetValue('player-action-failure-template', window.state.promptTemplates.player_action_failure),
        skill_check_description: safeGetValue('skill-check-description-template', window.state.promptTemplates.skill_check_description),
        action_consequences: safeGetValue('action-consequences-template', window.state.promptTemplates.action_consequences)
    };
    
    try {
        window.utils.showLoading();
        
        const response = await fetch(`${window.API.BASE_URL}${window.API.PROMPTS}`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(templates)
        });
        
        if (!response.ok) {
            throw new Error(`Failed to save prompt templates: ${response.statusText}`);
        }
        
        // Update state
        window.state.promptTemplates = templates;
        
        window.utils.showNotification('Prompt templates saved successfully!', 'success');
    } catch (error) {
        console.error('Error saving prompt templates:', error);
        window.utils.showNotification('Failed to save prompt templates. Please try again.', 'error');
    } finally {
        window.utils.hideLoading();
    }
}

// Reset prompt templates to default
async function resetPromptTemplates() {
    if (!confirm('Are you sure you want to reset all prompt templates to default? This cannot be undone.')) {
        return;
    }
    
    try {
        window.utils.showLoading();
        
        const response = await fetch(`${window.API.BASE_URL}${window.API.PROMPTS_RESET}`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'}
        });
        
        if (!response.ok) {
            throw new Error(`Failed to reset prompt templates: ${response.statusText}`);
        }
        
        // Load the defaults
        const defaultsResponse = await fetch(`${window.API.BASE_URL}${window.API.PROMPTS_DEFAULT}`);
        if (!defaultsResponse.ok) {
            throw new Error(`Failed to load default templates: ${defaultsResponse.statusText}`);
        }
        
        const defaultTemplates = await defaultsResponse.json();
        
        // Update state and UI
        window.state.promptTemplates = defaultTemplates;
        loadPromptTemplatesIntoUI();
        
        window.utils.showNotification('Prompt templates reset to default.', 'success');
    } catch (error) {
        console.error('Error resetting prompt templates:', error);
        window.utils.showNotification('Failed to reset templates. Please try again.', 'error');
    } finally {
        window.utils.hideLoading();
    }
}

// Preview prompt
function previewPrompt() {
    // Get the preview element
    const previewElement = document.getElementById('prompt-preview');
    if (!previewElement) {
        console.warn('Prompt preview element not found');
        return;
    }
    
    const previewContent = previewElement.querySelector('pre');
    if (!previewContent) {
        console.warn('Prompt preview content element not found');
        return;
    }
    
    // Helper function to safely get values from form elements
    function safeGetValue(id, defaultValue = '') {
        const element = document.getElementById(id);
        return element ? element.value : defaultValue;
    }
    
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
    
    // Format the emotions string
    const emotions_str = Object.entries(sampleCharacter.emotions)
        .map(([k, v]) => `${k}: ${v}`)
        .join(", ");
    
    // Build the complete prompt
    let previewText = '';
    
    // Add base prompt
    const basePrompt = safeGetValue('base-prompt-template');
    if (basePrompt) {
        previewText += basePrompt
            .replace('{name}', sampleCharacter.name)
            .replace('{description}', sampleCharacter.description)
            .replace('{personality}', sampleCharacter.personality)
            + "\n\n";
    }
    
    // Add introduction if available
    const introduction = safeGetValue('introduction-template');
    if (introduction) {
        previewText += introduction
            .replace('{greeting}', sampleCharacter.greeting)
            + "\n\n";
    }
    
    // Add speaking style if available
    const speakingStyle = safeGetValue('speaking-style-template');
    if (speakingStyle) {
        previewText += speakingStyle
            .replace('{speaking_style}', sampleCharacter.speaking_style)
            + "\n\n";
    }
    
    // Add appearance if available
    const appearance = safeGetValue('appearance-template');
    if (appearance) {
        previewText += appearance
            .replace('{appearance}', sampleCharacter.appearance)
            + "\n\n";
    }
    
    // Add physical description if available
    const physicalDescription = safeGetValue('physical-description-template');
    if (physicalDescription) {
        previewText += physicalDescription + "\n\n";
    }
    
    // Add personality if available
    const personality = safeGetValue('personality-template');
    if (personality) {
        previewText += personality
            .replace('{personality}', sampleCharacter.personality)
            + "\n\n";
    }
    
    // Add mood and emotions
    const moodEmotions = safeGetValue('mood-emotions-template');
    if (moodEmotions) {
        previewText += moodEmotions
            .replace('{mood}', sampleCharacter.mood)
            .replace('{emotions_str}', emotions_str)
            + "\n\n";
    }
    
    // Add opinion of user
    const opinion = safeGetValue('opinion-template');
    if (opinion) {
        previewText += opinion
            .replace('{opinion_of_user}', sampleCharacter.opinion_of_user)
            + "\n\n";
    }
    
    // Add location context
    const location = safeGetValue('location-template');
    if (location) {
        previewText += location
            .replace('{location}', sampleCharacter.location)
            + "\n";
    } else {
        previewText += `Current location: ${sampleCharacter.location}\n`;
    }
    
    // Add action context
    const action = safeGetValue('action-template');
    if (action) {
        previewText += action
            .replace('{action}', sampleCharacter.action)
            + "\n\n";
    } else {
        previewText += `Current action: ${sampleCharacter.action}\n\n`;
    }
    
    // Add memory instructions
    const memory = safeGetValue('memory-template');
    if (memory) {
        previewText += memory + "\n\n";
    }
    
    // Add conversation history placeholder
    previewText += "Recent conversations:\n";
    previewText += "User: Hello there!\n";
    previewText += "You (happy): Greetings, my curious friend! How may I assist you today?\n\n";
    
    // Add consistency instructions
    const consistency = safeGetValue('consistency-template');
    if (consistency) {
        previewText += consistency + "\n\n";
    }
    
    // Add action resolution instructions
    const actionResolution = safeGetValue('action-resolution-template');
    if (actionResolution) {
        previewText += actionResolution + "\n\n";
    }
    
    // Add roleplaying instructions
    const roleplayingInstructions = safeGetValue('roleplaying-instructions-template');
    if (roleplayingInstructions) {
        previewText += roleplayingInstructions + "\n\n";
    }
    
    // Add scene description instructions
    const sceneDescription = safeGetValue('scene-description-template');
    if (sceneDescription) {
        previewText += sceneDescription + "\n\n";
    }
    
    // Add environment details
    const environment = safeGetValue('environment-template');
    if (environment) {
        previewText += environment + "\n\n";
    }
    
    // Add cinematic instructions
    const cinematic = safeGetValue('cinematic-template');
    if (cinematic) {
        previewText += cinematic + "\n\n";
    }
    
    // Add JSON structure
    const jsonStructure = safeGetValue('json-structure-template');
    if (jsonStructure) {
        previewText += jsonStructure + "\n\n";
    }
    
    // Add response format instructions at the end
    const responseFormat = safeGetValue('response-format-template');
    if (responseFormat) {
        previewText += responseFormat;
    }
    
    // Set the preview text
    previewContent.textContent = previewText;
    
    // Show the preview
    previewElement.classList.remove('hidden');
}

// Initialize prompt template management
function initPromptTemplates() {
    console.log('Initializing prompt template management...');
    
    // Load prompt templates
    loadPromptTemplates();
    
    // Bind event listeners for prompt templates
    const savePromptsBtn = document.getElementById('save-prompts-btn');
    if (savePromptsBtn) {
        savePromptsBtn.addEventListener('click', savePromptTemplates);
    } else {
        console.warn('Save prompts button not found');
    }
    
    const resetPromptsBtn = document.getElementById('reset-prompts-btn');
    if (resetPromptsBtn) {
        resetPromptsBtn.addEventListener('click', resetPromptTemplates);
    } else {
        console.warn('Reset prompts button not found');
    }
    
    const previewPromptBtn = document.getElementById('preview-prompt-btn');
    if (previewPromptBtn) {
        previewPromptBtn.addEventListener('click', previewPrompt);
    } else {
        console.warn('Preview prompt button not found');
    }
}

// Expose prompt template functions
window.promptTemplates = {
    init: initPromptTemplates,
    loadPromptTemplates: loadPromptTemplates,
    loadPromptTemplatesIntoUI: loadPromptTemplatesIntoUI,
    savePromptTemplates: savePromptTemplates,
    resetPromptTemplates: resetPromptTemplates,
    previewPrompt: previewPrompt
};

// Add this function to your prompt-templates.js file to handle missing templates

// Function to ensure all required templates exist with default values
function ensureAllTemplatesExist() {
    // Define default values for all expected templates
    const defaultTemplates = {
        // Character Definition - Basic
        base_prompt: "You are roleplaying as {name}. {description}\n\nPersonality: {personality}",
        introduction: "Greeting: {greeting}",
        speaking_style: "Speaking style: {speaking_style}",
        
        // Character Definition - Appearance
        appearance: "Appearance: {appearance}",
        physical_description: "Your appearance is distinctive and memorable.",
        
        // Character Definition - Personality
        personality: "Character traits: {personality}",
        mood_emotions: "Current mood: {mood}\nCurrent emotions: {emotions_str}",
        opinion: "Opinion of user: {opinion_of_user}",
        
        // Interaction & Context - Context
        location: "You are currently at: {location}",
        action: "You are currently: {action}",
        memory: "Remember important events from previous conversations.",
        
        // Interaction & Context - Roleplay
        roleplaying_instructions: "Fully embody this character in your responses.",
        consistency: "Maintain consistency with your established character traits and previous statements.",
        action_resolution: "When the user attempts an action, respond in a way that reflects the outcome.",
        
        // Interaction & Context - Response
        response_format: "Format your response as JSON with appropriate fields.",
        json_structure: "Structure your responses as specified to maintain consistent formatting.",
        
        // Scene & Environment
        scene_description: "Describe the scene in vivid, sensory detail.",
        environment: "Include relevant environmental details in your descriptions.",
        cinematic: "For cinematic scenes, use rich, visual language that evokes a sense of place and atmosphere.",
        
        // Player Actions
        player_action_success: "When the player succeeds at {action} using their {stat} skill (roll: {roll_value}), describe a positive outcome.",
        player_action_failure: "When the player fails at {action} using their {stat} skill (roll: {roll_value}), describe an interesting but negative outcome.",
        skill_check_description: "Use the character's relevant abilities to determine action outcomes.",
        action_consequences: "Actions should have meaningful consequences in the narrative world."
    };
    
    // If state doesn't have promptTemplates, initialize it
    if (!window.state.promptTemplates) {
        window.state.promptTemplates = {};
    }
    
    // For each expected template, ensure it exists
    for (const [key, defaultValue] of Object.entries(defaultTemplates)) {
        if (!window.state.promptTemplates[key]) {
            console.log(`Adding missing template: ${key}`);
            window.state.promptTemplates[key] = defaultValue;
        }
    }
}

// Modify the loadPromptTemplates function to ensure all templates exist
async function loadPromptTemplates() {
    try {
        const response = await fetch(`${window.API.BASE_URL}${window.API.PROMPTS}`);
        if (!response.ok) {
            throw new Error(`Failed to load prompt templates: ${response.statusText}`);
        }
        
        const templates = await response.json();
        window.state.promptTemplates = templates;
        
        // Ensure all needed templates exist
        ensureAllTemplatesExist();
        
        // Update the UI with the loaded templates
        updatePromptTemplateInputs();
        
        return window.state.promptTemplates;
    } catch (error) {
        console.error('Error loading prompt templates:', error);
        window.utils.showNotification('Failed to load prompt templates. Using defaults.', 'warning');
        
        // Try to load defaults
        try {
            const defaultResponse = await fetch(`${window.API.BASE_URL}${window.API.PROMPTS_DEFAULT}`);
            if (defaultResponse.ok) {
                const defaultTemplates = await defaultResponse.json();
                window.state.promptTemplates = defaultTemplates;
                
                // Ensure all needed templates exist
                ensureAllTemplatesExist();
                
                updatePromptTemplateInputs();
            }
        } catch (defaultError) {
            console.error('Error loading default templates:', defaultError);
            
            // Initialize with empty object if everything fails
            window.state.promptTemplates = {};
            ensureAllTemplatesExist();
            updatePromptTemplateInputs();
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initPromptTemplates);
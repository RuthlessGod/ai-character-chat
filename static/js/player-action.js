// player-action.js - Player action system for roleplaying

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

// Player action UI elements - will be populated in initPlayerActionSystem
let playerActionElements = {};

// Initialize player action system
function initPlayerActionSystem() {
    console.log('Initializing Fixed Player Action System...');
    // Make sure DOM is loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initWhenReady);
    } else {
        initWhenReady();
    }
    
    // Add event listener for chat changes
    document.addEventListener('chatInstanceLoaded', function(e) {
        if (e.detail && e.detail.chatInstance) {
            loadStatsFromChatInstance(e.detail.chatInstance);
        }
    });
}

// Initialize when DOM is ready
function initWhenReady() {
    console.log('DOM ready, setting up Fixed Player Action System');
    
    // Query elements to ensure they're available
    refreshElements();
    
    // Debug information to console for troubleshooting
    console.log('Toggle Options Found:', playerActionElements.toggleOptions?.length);
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
    playerActionElements = {
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
    if (playerActionElements.messageInputs) {
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
    }
    
    console.log('Fixed Player Action events bound successfully');
}

// Update handleSendButtonClick for chat instances
function handleSendButtonClick(event) {
    // Check if we have a current chat
    if (!window.state.currentChat) {
        window.utils.showNotification('Please select or start a chat first', 'warning');
        return;
    }
    
    if (playerActionState.inputMode === 'speak') {
        // Use original function for speaking
        window.chat.sendMessage(); // Use the chat module's sendMessage function
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
            window.chat.sendMessage(); // Use the chat module's sendMessage function
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
    if (playerActionElements.messageInputs) {
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
    window.utils.showNotification('Character stats saved successfully!', 'success');
    
    // Update the character model if there's an active character
    if (window.state.currentCharacter) {
        updateCharacterWithStats(window.state.currentCharacter.id, stats);
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
        const response = await fetch(`${window.API.BASE_URL}${window.API.CHARACTERS}/${characterId}`);
        
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
        const updateResponse = await fetch(`${window.API.BASE_URL}${window.API.CHARACTERS}/${characterId}`, {
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
    
    if (!messageInput || !window.state.currentCharacter) {
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
            result.details = `${window.utils.capitalizeFirstLetter(result.relevantStat)} (${statValue}) Check: ${Math.floor(successChance)}% chance`;
            break;
            
        case 'dnd-system':
            // Use D&D style d20 + modifier vs DC
            const d20Roll = Math.floor(Math.random() * 20) + 1;
            const totalRoll = d20Roll + result.modifier;
            result.rollValue = totalRoll;
            result.success = totalRoll >= result.difficultyClass;
            result.details = `${window.utils.capitalizeFirstLetter(result.relevantStat)} Check: ${d20Roll} + ${result.modifier} vs DC ${result.difficultyClass}`;
            
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
                ${window.utils.formatTime(new Date())} 
                <span class="action-outcome ${result.success ? 'success' : 'failure'}">
                    ${result.details}
                </span>
            </div>
        </div>
    `;
    
    chatMessages.appendChild(messageDiv);
    window.utils.scrollToBottom();
    
    // Dispatch an event that a new message was added
    const event = new CustomEvent('newMessageAdded', { 
        detail: { type: 'user-action', text: actionText, success: result.success }
    });
    document.dispatchEvent(event);
}

// Send action to AI
async function sendActionToAI(actionText, actionResult) {
    // Check for current chat instead of current character
    if (!window.state.currentChat) {
        console.warn('No current chat selected');
        window.utils.showNotification('Please select or start a chat first', 'warning');
        return;
    }
    
    try {
        window.utils.showLoading();
        
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
        const useLocalModel = window.state.settings.model === 'local';
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
        
        // Send action to API using CHAT ID instead of CHARACTER ID
        const response = await fetch(`${window.API.BASE_URL}${window.API.CHAT}/${window.state.currentChat.id}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': window.state.settings.apiKey
            },
            body: JSON.stringify(requestData)
        });
        
        if (!response.ok) {
            throw new Error(`API responded with status ${response.status}`);
        }
        
        const responseData = await response.json();
        
        // Clean up response text if it contains JSON
        if (responseData.response && typeof responseData.response === 'string') {
            // Check if response contains a JSON structure
            if (responseData.response.includes('{') && responseData.response.includes('}')) {
                try {
                    // Try to extract JSON - look for the first valid JSON object in the text
                    const possibleJSON = responseData.response.match(/\{[\s\S]*?\}/g);
                    if (possibleJSON && possibleJSON.length > 0) {
                        // Try each match until we find valid JSON
                        for (const jsonStr of possibleJSON) {
                            try {
                                const jsonData = JSON.parse(jsonStr);
                                // Replace the response with just the text field if available
                                if (jsonData.text) {
                                    responseData.response = jsonData.text;
                                    console.log('Successfully extracted text from JSON response');
                                    break;
                                }
                            } catch (e) {
                                continue; // Try next match
                            }
                        }
                    }
                } catch (e) {
                    console.warn('Could not parse JSON in response, using as-is:', e);
                }
            }
            
            // Additional cleanup - remove any remaining JSON syntax or formatting
            responseData.response = responseData.response
                .replace(/```json[\s\S]*?```/g, '') // Remove JSON code blocks
                .replace(/```[\s\S]*?```/g, '')     // Remove any code blocks
                .replace(/\{[\s\S]*?\}/g, '')       // Remove any remaining JSON objects
                .trim();                             // Clean up whitespace
            
            // If response was completely emptied by cleanup, use a fallback
            if (!responseData.response || responseData.response.trim() === '') {
                responseData.response = "I'm not sure what to say, but I've processed your action.";
            }
        }
        
        // Update character state in current chat
        if (window.state.currentChat && window.state.currentChat.character_state) {
            window.state.currentChat.character_state.mood = responseData.mood;
            window.state.currentChat.character_state.emotions = responseData.emotions;
            window.state.currentChat.character_state.opinion_of_user = responseData.opinion_of_user;
            window.state.currentChat.character_state.action = responseData.action;
        }
        
        // Update location in current chat if it changed
        if (window.state.currentChat && responseData.location && 
            responseData.location !== "current location" && 
            responseData.location !== window.state.currentChat.location) {
            window.state.currentChat.location = responseData.location;
            
            // Update location display
            const locationDisplay = document.getElementById('location-display');
            if (locationDisplay) {
                locationDisplay.textContent = responseData.location;
            }
        }
        
        // Update character UI for display
        if (window.state.currentCharacter) {
            // Map chat state to character for UI
            window.state.currentCharacter.mood = responseData.mood;
            window.state.currentCharacter.emotions = responseData.emotions;
            window.state.currentCharacter.opinion_of_user = responseData.opinion_of_user;
            window.state.currentCharacter.action = responseData.action;
            window.state.currentCharacter.location = responseData.location;
            
            if (window.chat && window.chat.updateCharacterMoodUI) {
                window.chat.updateCharacterMoodUI();
            }
        }
        
        // Add character response to UI
        window.chat.addCharacterMessage(responseData.response, {
            mood: responseData.mood,
            emotions: responseData.emotions,
            action: responseData.action,
            location: responseData.location,
            scene_description: responseData.scene_description
        });
        
        // Scroll to bottom
        window.utils.scrollToBottom();
    } catch (error) {
        console.error('Error sending action:', error);
        window.chat.addCharacterMessage('Sorry, I encountered an error processing your action. Please try again later.', {
            mood: 'confused',
            emotions: { confusion: 0.8, frustration: 0.6 }
        });
    } finally {
        window.utils.hideLoading();
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
// Load character stats from chat instance
function loadStatsFromChatInstance(chatInstance) {
    if (!chatInstance) return;
    
    // Get character ID from chat instance
    const characterId = chatInstance.character_id;
    if (!characterId) return;
    
    // Find character in state
    const character = window.state.characters.find(c => c.id === characterId);
    if (character && character.stats) {
        loadCharacterStats(character);
    }
}

// Get the current input mode
function getInputMode() {
    return playerActionState.inputMode;
}

// Get the player stats
function getPlayerStats() {
    return playerActionState.playerStats;
}

// Expose player action system functions
window.playerActionSystem = {
    init: initPlayerActionSystem,
    loadCharacterStats: loadCharacterStats,
    getPlayerStats: getPlayerStats,
    getInputMode: getInputMode,
    setInputMode: setInputMode,
    sendPlayerAction: sendPlayerAction,
    savePlayerStats: savePlayerStats,
    updatePlayerStatsDisplay: updatePlayerStatsDisplay
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded - initializing fixed player action system');
    setTimeout(initPlayerActionSystem, 500);
});

// Initialize if already loaded
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    console.log('Document already ready - initializing fixed player action system immediately');
    setTimeout(initPlayerActionSystem, 100);
}
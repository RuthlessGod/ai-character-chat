// character.js - Character management functions

// Load characters from the API
async function loadCharacters() {
    try {
        window.utils.showLoading();
        const response = await fetch(`${window.API.BASE_URL}${window.API.CHARACTERS}`);
        
        if (!response.ok) {
            throw new Error(`Failed to load characters: ${response.status}`);
        }
        
        const characters = await response.json();
        
        // Clear existing characters array completely before adding new ones
        window.state.characters = [];
        
        // Add fetched characters to state
        if (Array.isArray(characters)) {
            window.state.characters = characters;
        } else {
            console.warn('Characters data is not an array:', characters);
        }
        
        console.log(`Loaded ${window.state.characters.length} characters`);
        
        // Render the character list in sidebar
        renderCharacterList();
        
        // Update UI based on character state
        if (window.state.characters.length === 0) {
            // If no characters, show welcome screen
            if (window.elements.welcomeScreen && window.elements.chatInterface) {
                window.elements.welcomeScreen.classList.remove('hidden');
                window.elements.chatInterface.classList.add('hidden');
            }
        } else if (window.state.currentCharacter) {
            // If current character exists, make sure it's updated with latest data
            const updatedCurrentCharacter = window.state.characters.find(
                c => c.id === window.state.currentCharacter.id
            );
            
            if (updatedCurrentCharacter) {
                window.state.currentCharacter = updatedCurrentCharacter;
                
                // Ensure chat interface is visible
                if (window.elements.welcomeScreen && window.elements.chatInterface) {
                    window.elements.welcomeScreen.classList.add('hidden');
                    window.elements.chatInterface.classList.remove('hidden');
                }
                
                // Load character stats if they exist
                if (window.playerActionSystem && updatedCurrentCharacter.stats) {
                    window.playerActionSystem.loadCharacterStats(updatedCurrentCharacter);
                }
            } else {
                // If current character no longer exists, reset it
                window.state.currentCharacter = null;
                
                // Show welcome screen or first character
                if (window.state.characters.length > 0) {
                    loadCharacter(window.state.characters[0].id);
                } else if (window.elements.welcomeScreen && window.elements.chatInterface) {
                    window.elements.welcomeScreen.classList.remove('hidden');
                    window.elements.chatInterface.classList.add('hidden');
                }
            }
        }
    } catch (error) {
        console.error('Error loading characters:', error);
        window.utils.showNotification('Failed to load characters. Please try again later.', 'error');
    } finally {
        window.utils.hideLoading();
    }
}

// Render the character list in the sidebar
function renderCharacterList() {
    if (!window.elements.characterList) {
        console.warn('Character list element not found');
        return;
    }
    
    // Clear existing character list completely
    window.elements.characterList.innerHTML = '';
    
    console.log(`Rendering ${window.state.characters.length} characters in sidebar`);
    
    if (window.state.characters.length === 0) {
        const noCharacters = document.createElement('div');
        noCharacters.className = 'text-center mt-4';
        noCharacters.textContent = 'No characters available';
        window.elements.characterList.appendChild(noCharacters);
        return;
    }
    
    // Create a document fragment for better performance
    const fragment = document.createDocumentFragment();
    
    // Add each character to fragment
    window.state.characters.forEach(character => {
        const item = document.createElement('div');
        item.className = 'character-item';
        item.dataset.characterId = character.id; // Add data attribute for identification
        
        if (window.state.currentCharacter && character.id === window.state.currentCharacter.id) {
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
                <div class="character-summary">${character.mood || 'Neutral'} · ${window.utils.formatTimeAgo(character.updated_at)}</div>
            </div>
            <div class="character-actions">
                <button class="character-edit-btn" title="Edit character">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="character-delete-btn" title="Delete character">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        `;
        
        // Add click event listener for the character item (excluding the buttons)
        item.addEventListener('click', (e) => {
            // Only load character if not clicking on the action buttons
            if (!e.target.closest('.character-actions')) {
                loadCharacter(character.id);
            }
        });
        
        // After item is added to DOM, add specific button event listeners
        fragment.appendChild(item);
    });
    
    // Append all characters at once
    window.elements.characterList.appendChild(fragment);
    
    // Now add specific button event listeners
    window.elements.characterList.querySelectorAll('.character-edit-btn').forEach(btn => {
        const characterId = btn.closest('.character-item').dataset.characterId;
        btn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent triggering the character item click
            
            // Find character in state and open edit modal
            const characterToEdit = window.state.characters.find(c => c.id === characterId);
            if (characterToEdit) {
                openEditCharacterModal(characterToEdit);
            }
        });
    });
    
    window.elements.characterList.querySelectorAll('.character-delete-btn').forEach(btn => {
        const characterId = btn.closest('.character-item').dataset.characterId;
        btn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent triggering the character item click
            
            // Find character in state
            const characterToDelete = window.state.characters.find(c => c.id === characterId);
            if (characterToDelete) {
                if (confirm(`Are you sure you want to delete ${characterToDelete.name}? This action cannot be undone.`)) {
                    deleteCharacter(characterId);
                }
            }
        });
    });
}

// Load a specific character
async function loadCharacter(characterId) {
    if (!characterId) {
        console.warn('No character ID provided to loadCharacter');
        return;
    }
    
    console.log(`Loading character: ${characterId}`);
    
    try {
        window.utils.showLoading();
        const response = await fetch(`${window.API.BASE_URL}${window.API.CHARACTERS}/${characterId}`);
        
        if (!response.ok) {
            throw new Error(`Failed to load character: ${response.statusText}`);
        }
        
        const character = await response.json();
        
        // Before setting new character, clean up any existing one
        cleanupCurrentCharacter();
        
        // Set new current character
        window.state.currentCharacter = character;
        
        console.log(`Loaded character: ${character.name} (${character.id})`);
        
        // Load character stats if they exist
        if (window.playerActionSystem && character.stats) {
            window.playerActionSystem.loadCharacterStats(character);
        }
        
        // Load conversation history
        try {
            const historyResponse = await fetch(`${window.API.BASE_URL}${window.API.CHAT_HISTORY}/${characterId}`);
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
        if (window.elements.welcomeScreen && window.elements.chatInterface) {
            window.elements.welcomeScreen.classList.add('hidden');
            window.elements.chatInterface.classList.remove('hidden');
        }
        
        // Update character list to show active character
        updateActiveCharacterInList(characterId);
        
        // Hide sidebar on mobile after selecting a character
        if (window.innerWidth <= 768 && window.elements.sidebar) {
            window.elements.sidebar.classList.remove('active');
        }
        
        // Focus the message input
        if (window.elements.messageInput) {
            const activeInput = document.querySelector('#message-input:not([disabled])');
            if (activeInput) {
                activeInput.focus();
            }
        }
    } catch (error) {
        console.error('Error loading character:', error);
        window.utils.showNotification('Failed to load character. Please try again.', 'error');
    } finally {
        window.utils.hideLoading();
    }
}

// Clean up current character data and elements
function cleanupCurrentCharacter() {
    if (!window.state.currentCharacter) return;
    
    console.log(`Cleaning up current character: ${window.state.currentCharacter.id}`);
    
    // Clear chat messages
    if (window.elements.chatMessages) {
        window.elements.chatMessages.innerHTML = '';
    }
    
    // Reset character mood/opinion UI
    if (window.elements.characterMood) {
        window.elements.characterMood.innerHTML = '<i class="fas fa-smile"></i> Neutral';
    }
    
    if (window.elements.characterOpinion) {
        window.elements.characterOpinion.innerHTML = '<i class="fas fa-heart"></i> Neutral';
    }
    
    // Reset character name
    if (window.elements.characterName) {
        window.elements.characterName.textContent = 'Character Name';
    }
}

// Update the active character in the list without full rerender
function updateActiveCharacterInList(characterId) {
    if (!window.elements.characterList) return;
    
    // Remove active class from all character items
    const characterItems = window.elements.characterList.querySelectorAll('.character-item');
    characterItems.forEach(item => {
        item.classList.remove('active');
    });
    
    // Add active class to the current character
    const activeItem = window.elements.characterList.querySelector(`.character-item[data-character-id="${characterId}"]`);
    if (activeItem) {
        activeItem.classList.add('active');
    }
}

// Update the UI with current character data
function updateCharacterUI(historyData) {
    if (!window.state.currentCharacter) {
        console.warn('No current character to update UI for');
        return;
    }
    
    console.log(`Updating UI for character: ${window.state.currentCharacter.name}`);
    
    // Update character name
    if (window.elements.characterName) {
        window.elements.characterName.textContent = window.state.currentCharacter.name;
    }
    
    // Update mood with icon
    if (window.elements.characterMood) {
        let moodIcon = 'fa-smile';
        
        if (window.state.currentCharacter.mood === 'happy') moodIcon = 'fa-grin';
        else if (window.state.currentCharacter.mood === 'sad') moodIcon = 'fa-frown';
        else if (window.state.currentCharacter.mood === 'angry') moodIcon = 'fa-angry';
        
        window.elements.characterMood.innerHTML = `<i class="fas ${moodIcon}"></i> ${window.utils.capitalizeFirstLetter(window.state.currentCharacter.mood || 'Neutral')}`;
    }
    
    // Update opinion with icon
    if (window.elements.characterOpinion) {
        let opinionIcon = 'fa-heart';
        
        if (window.state.currentCharacter.opinion_of_user === 'positive') opinionIcon = 'fa-heart';
        else if (window.state.currentCharacter.opinion_of_user === 'negative') opinionIcon = 'fa-heart-broken';
        
        window.elements.characterOpinion.innerHTML = `<i class="fas ${opinionIcon}"></i> ${window.utils.capitalizeFirstLetter(window.state.currentCharacter.opinion_of_user || 'Neutral')}`;
    }
    
    // Ensure chat messages container is clear before adding new messages
    if (window.elements.chatMessages) {
        window.elements.chatMessages.innerHTML = '';
        
        if (historyData && historyData.conversations && historyData.conversations.length > 0) {
            console.log(`Adding ${historyData.conversations.length} messages from history`);
            
            // Add conversation history
            historyData.conversations.forEach(convo => {
                // Add user message - handle player actions differently
                if (convo.is_player_action) {
                    addPlayerActionFromHistory(convo);
                } else {
                    window.chat.addUserMessage(convo.user_message);
                }
                
                // Add character response with enhanced metadata
                window.chat.addCharacterMessage(convo.character_response, {
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
            const greeting = window.state.currentCharacter.greeting || 
                             `Hello! I'm ${window.state.currentCharacter.name}. How can I help you today?`;
            
            window.chat.addCharacterMessage(greeting, {
                mood: window.state.currentCharacter.mood || 'neutral',
                emotions: window.state.currentCharacter.emotions || {},
                action: window.state.currentCharacter.action || 'greeting you with a smile',
                location: window.state.currentCharacter.location || 'welcoming area'
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
                ${window.utils.formatTime(new Date(convo.timestamp))} 
                <span class="action-outcome ${convo.action_success ? 'success' : 'failure'}">
                    ${convo.action_details || ''}
                </span>
            </div>
        </div>
    `;
    
    chatMessages.appendChild(messageDiv);
}

// Open the create character modal
function openCreateCharacterModal() {
    if (!window.elements.characterModal) {
        console.warn('Character modal element not found');
        return;
    }
    
    console.log('Opening create character modal');
    
    // Reset all form fields
    if (window.elements.characterNameInput) window.elements.characterNameInput.value = '';
    if (window.elements.characterDescInput) window.elements.characterDescInput.value = '';
    if (window.elements.characterPersonalityInput) window.elements.characterPersonalityInput.value = '';
    
    if (window.elements.characterGreeting) {
        window.elements.characterGreeting.value = '';
    }
    
    if (window.elements.characterCategory) {
        window.elements.characterCategory.value = 'fantasy';
    }
    
    if (window.elements.characterAppearance) {
        window.elements.characterAppearance.value = '';
    }
    
    if (window.elements.speakingStyleInput) {
        window.elements.speakingStyleInput.value = '';
    }
    
    // Reset AI generator
    if (window.elements.aiPromptInput) {
        window.elements.aiPromptInput.value = '';
        window.elements.aiPromptInput.disabled = true;
    }
    
    if (window.elements.aiGeneratorToggle) {
        window.elements.aiGeneratorToggle.checked = false;
    }
    
    if (window.elements.generateCharacterButton) {
        window.elements.generateCharacterButton.disabled = true;
    }
    
    if (window.elements.generationStatus) {
        window.elements.generationStatus.classList.add('hidden');
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
    window.elements.characterModal.dataset.editMode = 'false';
    window.elements.characterModal.dataset.characterId = '';
    
    // Show the modal
    window.elements.characterModal.classList.remove('hidden');
}

// Open edit character modal
function openEditCharacterModal(character) {
    if (!window.elements.characterModal || !character) {
        console.warn('Character modal element not found or no character provided');
        return;
    }
    
    console.log(`Opening edit modal for character: ${character.name} (${character.id})`);
    
    // Set form values from character
    if (window.elements.characterNameInput) window.elements.characterNameInput.value = character.name || '';
    if (window.elements.characterDescInput) window.elements.characterDescInput.value = character.description || '';
    if (window.elements.characterPersonalityInput) window.elements.characterPersonalityInput.value = character.personality || '';
    
    if (window.elements.characterGreeting) {
        window.elements.characterGreeting.value = character.greeting || '';
    }
    
    if (window.elements.characterCategory) {
        window.elements.characterCategory.value = character.category || 'fantasy';
    }
    
    if (window.elements.characterAppearance) {
        window.elements.characterAppearance.value = character.appearance || '';
    }
    
    if (window.elements.speakingStyleInput) {
        window.elements.speakingStyleInput.value = character.speaking_style || '';
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
    window.elements.characterModal.dataset.editMode = 'true';
    window.elements.characterModal.dataset.characterId = character.id;
    
    // Show the modal
    window.elements.characterModal.classList.remove('hidden');
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
    if (!window.elements.characterNameInput) {
        console.warn('Character name input element not found');
        return;
    }
    
    // Get form data
    const name = window.elements.characterNameInput.value.trim();
    const description = window.elements.characterDescInput ? window.elements.characterDescInput.value.trim() : '';
    const personality = window.elements.characterPersonalityInput ? window.elements.characterPersonalityInput.value.trim() : '';
    
    // Get additional fields if they exist
    const greeting = window.elements.characterGreeting ? window.elements.characterGreeting.value.trim() : '';
    const category = window.elements.characterCategory ? window.elements.characterCategory.value : 'fantasy';
    const appearance = window.elements.characterAppearance ? window.elements.characterAppearance.value.trim() : '';
    const speakingStyle = window.elements.speakingStyleInput ? 
                          window.elements.speakingStyleInput.value.trim() : '';
                          
    // Get character stats
    const stats = getStatsFromCharacterForm();
    
    if (!name) {
        window.utils.showNotification('Please enter a name for your character.', 'warning');
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
        window.utils.showLoading();
        
        let response, updatedCharacter;
        const isEditMode = window.elements.characterModal.dataset.editMode === 'true';
        const characterId = window.elements.characterModal.dataset.characterId;
        
        console.log(`Saving character: ${name} (${isEditMode ? 'Edit' : 'Create'} mode)`);
        
        // If editing, update existing character
        if (isEditMode && characterId) {
            response = await fetch(`${window.API.BASE_URL}${window.API.CHARACTERS}/${characterId}`, {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(characterData)
            });
            
            if (!response.ok) {
                throw new Error(`Failed to update character: ${response.statusText}`);
            }
            
            updatedCharacter = await response.json();
            
            // Update current character
            window.state.currentCharacter = updatedCharacter;
            
            // Update character in list (replace instead of modifying in place)
            const index = window.state.characters.findIndex(c => c.id === updatedCharacter.id);
            if (index !== -1) {
                // Create a new array with the updated character
                window.state.characters = [
                    ...window.state.characters.slice(0, index),
                    updatedCharacter,
                    ...window.state.characters.slice(index + 1)
                ];
            }
            
            // Update player stats if character is active
            if (window.playerActionSystem && updatedCharacter.stats) {
                window.playerActionSystem.loadCharacterStats(updatedCharacter);
            }
            
            window.utils.showNotification('Character updated successfully!', 'success');
        } else {
            // Create new character
            response = await fetch(`${window.API.BASE_URL}${window.API.CHARACTERS}`, {
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
            window.state.characters = [...window.state.characters, updatedCharacter];
            
            // Set as current character
            window.state.currentCharacter = updatedCharacter;
            
            // Update player stats if character is active
            if (window.playerActionSystem && updatedCharacter.stats) {
                window.playerActionSystem.loadCharacterStats(updatedCharacter);
            }
            
            window.utils.showNotification('Character created successfully!', 'success');
        }
        
        // Update UI
        renderCharacterList();
        updateCharacterUI();
        window.utils.closeModal(window.elements.characterModal);
        
        // Hide welcome screen, show chat interface
        if (window.elements.welcomeScreen && window.elements.chatInterface) {
            window.elements.welcomeScreen.classList.add('hidden');
            window.elements.chatInterface.classList.remove('hidden');
        }
        
        // Focus the message input
        if (window.elements.messageInput) {
            const activeInput = document.querySelector('#message-input:not([disabled])');
            if (activeInput) {
                activeInput.focus();
            }
        }
    } catch (error) {
        console.error('Error saving character:', error);
        window.utils.showNotification('Failed to save character. Please try again.', 'error');
    } finally {
        window.utils.hideLoading();
    }
}

// Delete current character
async function deleteCurrentCharacter() {
    if (!window.state.currentCharacter) {
        console.warn('No current character to delete');
        return;
    }
    
    const characterName = window.state.currentCharacter.name;
    const characterId = window.state.currentCharacter.id;
    
    if (!confirm(`Are you sure you want to delete ${characterName}? This action cannot be undone.`)) {
        return;
    }
    
    console.log(`Deleting character: ${characterName} (${characterId})`);
    
    try {
        window.utils.showLoading();
        
        const response = await fetch(`${window.API.BASE_URL}${window.API.CHARACTERS}/${characterId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            // Remove from list (create new array)
            window.state.characters = window.state.characters.filter(c => c.id !== characterId);
            
            // Clear current character
            cleanupCurrentCharacter();
            window.state.currentCharacter = null;
            
            // Update UI
            renderCharacterList();
            
            // Show welcome screen if no characters left
            if (window.state.characters.length === 0) {
                if (window.elements.welcomeScreen && window.elements.chatInterface) {
                    window.elements.welcomeScreen.classList.remove('hidden');
                    window.elements.chatInterface.classList.add('hidden');
                }
            } else {
                // Load first character
                loadCharacter(window.state.characters[0].id);
            }
            
            window.utils.showNotification(`Character "${characterName}" deleted successfully.`, 'success');
        } else {
            throw new Error(`Failed to delete character: ${response.statusText}`);
        }
    } catch (error) {
        console.error('Error deleting character:', error);
        window.utils.showNotification('Failed to delete character. Please try again.', 'error');
    } finally {
        window.utils.hideLoading();
    }
}

// Delete a character by ID
async function deleteCharacter(characterId) {
    if (!characterId) {
        console.warn('No character ID provided for deletion');
        return;
    }
    
    // Find character name for notification
    const character = window.state.characters.find(c => c.id === characterId);
    const characterName = character ? character.name : 'Character';
    
    console.log(`Deleting character: ${characterName} (${characterId})`);
    
    try {
        window.utils.showLoading();
        
        const response = await fetch(`${window.API.BASE_URL}${window.API.CHARACTERS}/${characterId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            // Remove from list (create new array)
            window.state.characters = window.state.characters.filter(c => c.id !== characterId);
            
            // If this was the current character, clear it
            if (window.state.currentCharacter && window.state.currentCharacter.id === characterId) {
                cleanupCurrentCharacter();
                window.state.currentCharacter = null;
                
                // Show welcome screen if no characters left
                if (window.state.characters.length === 0) {
                    if (window.elements.welcomeScreen && window.elements.chatInterface) {
                        window.elements.welcomeScreen.classList.remove('hidden');
                        window.elements.chatInterface.classList.add('hidden');
                    }
                } else {
                    // Load first character
                    loadCharacter(window.state.characters[0].id);
                }
            }
            
            // Update UI
            renderCharacterList();
            
            window.utils.showNotification(`Character "${characterName}" deleted successfully.`, 'success');
        } else {
            throw new Error(`Failed to delete character: ${response.statusText}`);
        }
    } catch (error) {
        console.error('Error deleting character:', error);
        window.utils.showNotification(`Failed to delete character "${characterName}". Please try again.`, 'error');
    } finally {
        window.utils.hideLoading();
    }
}

// Generate character using AI
async function generateCharacter() {
    if (!window.elements.aiPromptInput || !window.elements.generationStatus) {
        console.warn('AI prompt input or generation status element not found');
        return;
    }
    
    const prompt = window.elements.aiPromptInput.value.trim();
    
    if (!prompt) {
        window.utils.showNotification('Please enter a prompt for character generation.', 'warning');
        return;
    }
    
    // Show generation status
    window.elements.generationStatus.classList.remove('hidden');
    
    // Disable generate button during generation
    if (window.elements.generateCharacterButton) {
        window.elements.generateCharacterButton.disabled = true;
        window.elements.generateCharacterButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
    }
    
    try {
        console.log(`Generating character from prompt: ${prompt}`);
        
        // Determine which fields to include
        const includeFields = ["description", "personality", "speaking_style", "appearance", "greeting"];
        
        // Get local model setting
        const useLocalModel = window.state.settings.model === 'local';
        
        // Make request to backend
        const response = await fetch(`${window.API.BASE_URL}${window.API.GENERATE}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': window.state.settings.apiKey
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
            if (window.elements.characterDescInput) {
                window.elements.characterDescInput.value = result.character.description || '';
            }
            
            if (window.elements.characterPersonalityInput) {
                window.elements.characterPersonalityInput.value = result.character.personality || '';
            }
            
            if (window.elements.speakingStyleInput) {
                window.elements.speakingStyleInput.value = result.character.speaking_style || '';
            }
            
            if (window.elements.characterAppearance) {
                window.elements.characterAppearance.value = result.character.appearance || '';
            }
            
            if (window.elements.characterGreeting) {
                window.elements.characterGreeting.value = result.character.greeting || '';
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
            
            window.utils.showNotification('Character generated successfully!', 'success');
        } else {
            throw new Error('Failed to generate character: ' + (result.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error generating character:', error);
        window.utils.showNotification('Failed to generate character. Please try again.', 'error');
    } finally {
        // Hide generation status
        window.elements.generationStatus.classList.add('hidden');
        
        // Re-enable generate button
        if (window.elements.generateCharacterButton) {
            window.elements.generateCharacterButton.disabled = false;
            window.elements.generateCharacterButton.innerHTML = '<i class="fas fa-magic"></i> Generate Character';
        }
    }
}

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

// Field-specific AI generation
let currentAIField = {
    field: '',
    targetId: ''
};

// Show the field AI generator modal
function showFieldAIGeneratorModal(fieldName, targetId) {
    // Get modal elements
    const modal = document.getElementById('field-ai-generator-modal');
    const titleEl = document.getElementById('field-ai-modal-title');
    const promptEl = document.getElementById('field-ai-prompt');
    const statusEl = document.getElementById('field-ai-status');
    
    if (!modal || !titleEl || !promptEl) {
        console.warn('Field AI generator modal elements not found');
        return;
    }
    
    // Store current field information
    currentAIField = {
        field: fieldName,
        targetId: targetId
    };
    
    // Set title based on field
    const fieldDisplayNames = {
        'name': 'Name',
        'description': 'Description',
        'greeting': 'Greeting Message',
        'appearance': 'Physical Appearance',
        'personality': 'Personality',
        'speaking-style': 'Speaking Style'
    };
    
    titleEl.textContent = `Generate ${fieldDisplayNames[fieldName] || fieldName}`;
    
    // Set placeholder text based on field
    const placeholders = {
        'name': 'Example: "A strong female warrior name with Nordic origins"',
        'description': 'Example: "A mysterious elf ranger who grew up in an ancient forest and protects the wilderness"',
        'greeting': 'Example: "A warm greeting from a friendly tavern keeper who knows everyone\'s favorite drink"',
        'appearance': 'Example: "A tall, elegant sorceress with silver hair and flowing purple robes"',
        'personality': 'Example: "A cheerful but forgetful wizard who loves collecting magical artifacts"',
        'speaking-style': 'Example: "An eloquent noble who speaks formally and uses flowery language"'
    };
    
    // Reset inputs
    promptEl.value = '';
    promptEl.placeholder = placeholders[fieldName] || 'Describe what you want for this field';
    
    // Reset status
    statusEl.classList.add('hidden');
    
    // Show modal
    modal.classList.remove('hidden');
    
    // Focus on prompt input
    promptEl.focus();
}

// Generate content for a specific field
async function generateFieldContent() {
    const modal = document.getElementById('field-ai-generator-modal');
    const promptEl = document.getElementById('field-ai-prompt');
    const statusEl = document.getElementById('field-ai-status');
    
    if (!promptEl || !statusEl || !modal) {
        console.warn('Field AI generator elements not found');
        window.utils.showNotification('UI elements for field generation are missing.', 'error');
        return;
    }
    
    const prompt = promptEl.value.trim();
    if (!prompt) {
        window.utils.showNotification('Please enter a description for what you want to generate.', 'warning');
        return;
    }
    
    // Show loading status
    statusEl.classList.remove('hidden');
    
    try {
        console.log(`Generating field content for ${currentAIField.field} with prompt: ${prompt}`);
        
        // Determine what type of content to generate based on field
        const fieldType = currentAIField.field;
        
        // Get local model setting
        const useLocalModel = window.state && window.state.settings && window.state.settings.model === 'local';
        
        // Check if API endpoint exists
        if (!window.API || !window.API.GENERATE_FIELD) {
            throw new Error("Field generation API endpoint not available. Please check your configuration.");
        }
        
        // Make request to backend to generate specific field content
        const response = await fetch(`${window.API.BASE_URL}${window.API.GENERATE_FIELD}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': window.state.settings?.apiKey || ''
            },
            body: JSON.stringify({
                prompt: prompt,
                field_type: fieldType,
                use_local_model: useLocalModel
            })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`API error (${response.status}): ${errorText}`);
            throw new Error(`Failed to generate ${fieldType}: Server returned ${response.status}`);
        }
        
        // Parse response JSON
        let result;
        try {
            result = await response.json();
        } catch (jsonError) {
            console.error('Failed to parse response as JSON:', jsonError);
            throw new Error('Server returned invalid JSON response');
        }
        
        // Check for success and content
        if (result.success && result.content) {
            console.log(`Generated ${fieldType} content:`, result.content);
            
            // Find the target input and update its value
            const targetInput = document.getElementById(currentAIField.targetId);
            if (targetInput) {
                targetInput.value = result.content;
                
                // Trigger input event to make sure change is recognized
                const event = new Event('input', { bubbles: true });
                targetInput.dispatchEvent(event);
            } else {
                console.error(`Target input element ${currentAIField.targetId} not found`);
                throw new Error(`Could not find input field to update (${currentAIField.targetId})`);
            }
            
            // Close the modal
            modal.classList.add('hidden');
            
            window.utils.showNotification(`${fieldType} generated successfully!`, 'success');
        } else {
            throw new Error(`Failed to generate ${fieldType}: ${result.message || 'Unknown error'}`);
        }
    } catch (error) {
        console.error(`Error generating ${currentAIField.field}:`, error);
        window.utils.showNotification(`Failed to generate ${currentAIField.field}: ${error.message}`, 'error');
    } finally {
        // Hide status
        statusEl.classList.add('hidden');
    }
}

// Initialize field AI generator
function initFieldAIGenerator() {
    console.log('Initializing field AI generator...');
    
    // Check if the API endpoint is defined
    if (!window.API || !window.API.GENERATE_FIELD) {
        console.warn('Field generation API endpoint not available. Field AI generation will be disabled.');
        return;
    }
    
    // Find the modal and required elements
    const modal = document.getElementById('field-ai-generator-modal');
    const generateButtons = document.querySelectorAll('.field-ai-generate-btn');
    
    // Check if modal exists
    if (!modal) {
        console.warn('Field AI generator modal not found in the DOM. Field AI generation will be disabled.');
        return;
    }
    
    // Check if any generation buttons exist
    if (generateButtons.length === 0) {
        console.warn('No field AI generation buttons found in the DOM.');
        return;
    }
    
    console.log(`Found ${generateButtons.length} field generation buttons to initialize`);
    
    // Add event listeners to all field generate buttons
    generateButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const fieldName = e.currentTarget.dataset.field;
            const targetId = e.currentTarget.dataset.target;
            if (fieldName && targetId) {
                showFieldAIGeneratorModal(fieldName, targetId);
            } else {
                console.warn('Field AI button missing data attributes:', e.currentTarget);
                window.utils.showNotification('This generation button is missing required configuration.', 'error');
            }
        });
    });
    
    // Add event listeners to modal controls
    const closeBtn = document.getElementById('field-ai-modal-close');
    const cancelBtn = document.getElementById('field-ai-cancel');
    const generateBtn = document.getElementById('field-ai-generate');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.classList.add('hidden');
        });
    } else {
        console.warn('Field AI modal close button not found');
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            modal.classList.add('hidden');
        });
    } else {
        console.warn('Field AI modal cancel button not found');
    }
    
    if (generateBtn) {
        generateBtn.addEventListener('click', generateFieldContent);
    } else {
        console.warn('Field AI modal generate button not found');
    }
    
    // Add key listeners for prompt input
    const promptInput = document.getElementById('field-ai-prompt');
    if (promptInput) {
        promptInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                e.preventDefault();
                generateFieldContent();
            }
        });
    } else {
        console.warn('Field AI prompt input not found');
    }
    
    console.log('Field AI generator initialized successfully');
}

// Initialize character management
function initCharacterManagement() {
    console.log('Initializing character management...');
    
    // Bind character creation and management buttons
    if (window.elements.createCharacterBtn) {
        window.elements.createCharacterBtn.addEventListener('click', openCreateCharacterModal);
    }
    
    if (window.elements.welcomeCreateBtn) {
        window.elements.welcomeCreateBtn.addEventListener('click', openCreateCharacterModal);
    }
    
    if (window.elements.characterModalClose) {
        window.elements.characterModalClose.addEventListener('click', () => window.utils.closeModal(window.elements.characterModal));
    }
    
    if (window.elements.saveCharacterButton) {
        window.elements.saveCharacterButton.addEventListener('click', saveCharacter);
    }
    
    if (window.elements.cancelButton) {
        window.elements.cancelButton.addEventListener('click', () => window.utils.closeModal(window.elements.characterModal));
    }
    
    // Character options
    if (window.elements.editCharacterBtn) {
        window.elements.editCharacterBtn.addEventListener('click', () => {
            // Edit the current character
            if (window.state.currentCharacter) {
                openEditCharacterModal(window.state.currentCharacter);
            }
        });
    }
    
    // AI Generator
    if (window.elements.aiGeneratorToggle) {
        window.elements.aiGeneratorToggle.addEventListener('change', function() {
            if (this.checked) {
                if (window.elements.aiPromptInput) window.elements.aiPromptInput.disabled = false;
                if (window.elements.generateCharacterButton) window.elements.generateCharacterButton.disabled = false;
                
                // Add visual feedback
                const aiGeneratorContent = this.closest('.ai-generator');
                if (aiGeneratorContent) {
                    aiGeneratorContent.classList.add('enabled');
                }
            } else {
                if (window.elements.aiPromptInput) window.elements.aiPromptInput.disabled = true;
                if (window.elements.generateCharacterButton) window.elements.generateCharacterButton.disabled = true;
                
                // Remove visual feedback
                const aiGeneratorContent = this.closest('.ai-generator');
                if (aiGeneratorContent) {
                    aiGeneratorContent.classList.remove('enabled');
                }
            }
        });
    }
    
    if (window.elements.generateCharacterButton) {
        window.elements.generateCharacterButton.addEventListener('click', generateCharacter);
    }
    
    // Tab navigation in character modal
    const characterModalTabs = document.querySelector('.character-modal .tabs');
    if (characterModalTabs) {
        const tabs = characterModalTabs.querySelectorAll('.tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', function() {
                const tabName = this.getAttribute('data-tab');
                
                // Deactivate all tabs
                tabs.forEach(t => t.classList.remove('active'));
                
                // Activate this tab
                this.classList.add('active');
                
                // Show corresponding content
                const tabContents = document.querySelectorAll('.tab-content');
                tabContents.forEach(content => {
                    content.classList.add('hidden');
                });
                
                const targetContent = document.getElementById(`tab-${tabName}`);
                if (targetContent) {
                    targetContent.classList.remove('hidden');
                }
            });
        });
    }
    
    // Initialize field AI generator
    initFieldAIGenerator();
    
    // Make generateCharacter function available globally
    window.generateCharacter = generateCharacter;
    
    // Load characters on initialization
    loadCharacters();
}

// Expose character management functions
window.character = {
    init: initCharacterManagement,
    loadCharacters: loadCharacters,
    loadCharacter: loadCharacter,
    openCreateCharacterModal: openCreateCharacterModal,
    openEditCharacterModal: openEditCharacterModal,
    saveCharacter: saveCharacter,
    deleteCurrentCharacter: deleteCurrentCharacter,
    deleteCharacter: deleteCharacter,
    generateCharacter: generateCharacter,
    updateCharacterUI: updateCharacterUI
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initCharacterManagement);
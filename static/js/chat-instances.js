// Add this to your chat-instances.js initialization
document.addEventListener('DOMContentLoaded', function() {
    // Track if home logo was clicked
    let homeLogoClicked = false;
    
    // Listen for home logo clicks
    const homeLogo = document.getElementById('home-logo');
    if (homeLogo) {
        homeLogo.addEventListener('click', () => {
            homeLogoClicked = true;
            // Reset this flag after a short delay to allow the observer to respect it
            setTimeout(() => {
                homeLogoClicked = false;
            }, 500);
        });
    }
    
    // Check for any DOM changes that might accidentally show the homepage
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (window.state && window.state.currentChat && !homeLogoClicked) {
                // If we're in a chat, ensure homepage stays hidden
                const homepage = document.getElementById('homepage');
                if (homepage && !homepage.classList.contains('hidden')) {
                    homepage.classList.add('hidden');
                }
            }
        });
    });
    
    // Start observing the document
    observer.observe(document.body, { 
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class']
    });
});

// chat_instances.js - Handle chat instance management
async function loadChatHistory(chatId) {
    try {
        const historyResponse = await fetch(`${window.API.BASE_URL}/api/chat/history/${chatId}`);
        if (historyResponse.ok) {
            const historyData = await historyResponse.json();
            return historyData;
        } else {
            console.warn(`Failed to load conversation history: ${historyResponse.statusText}`);
            return null;
        }
    } catch (error) {
        console.error("Error loading chat history:", error);
        return null;
    }
}
// Load chat instances from API
async function loadChatInstances() {
    try {
        window.utils.showLoading();
        const response = await fetch(`${window.API.BASE_URL}/api/chats`);
        
        if (!response.ok) {
            throw new Error(`Failed to load chat instances: ${response.status}`);
        }
        
        const chatInstances = await response.json();
        
        // Update state with chat instances
        window.state.chatInstances = chatInstances;
        
        console.log(`Loaded ${window.state.chatInstances.length} chat instances`);
        
        // IMPORTANT: Only hide the homepage and show chat interface if we have chat instances
        // AND one is selected. Otherwise, keep the homepage visible.
        if (chatInstances.length > 0 && window.state.currentChat) {
            const homepage = document.getElementById('homepage');
            const welcomeScreen = document.getElementById('welcome-screen');
            const chatInterface = document.getElementById('chat-interface');
            const chatControls = document.getElementById('chat-controls');
            
            // Hide homepage and welcome screen
            if (homepage) homepage.classList.add('hidden');
            if (welcomeScreen) welcomeScreen.classList.add('hidden');
            
            // Show chat interface and controls
            if (chatInterface) chatInterface.classList.remove('hidden');
            if (chatControls) chatControls.classList.remove('hidden');
        }
        
        // Render the chat instances list
        renderChatInstancesList();
        
        return chatInstances;
    } catch (error) {
        console.error('Error loading chat instances:', error);
        window.utils.showNotification('Failed to load chat instances. Please try again later.', 'error');
        return [];
    } finally {
        window.utils.hideLoading();
    }
}

// Render chat instances list
function renderChatInstancesList() {
    const chatListContainer = document.getElementById('chat-instances-list');
    if (!chatListContainer) {
        console.warn('Chat instances list container not found');
        return;
    }
    
    // Clear existing chat list
    chatListContainer.innerHTML = '';
    
    if (!window.state.chatInstances || window.state.chatInstances.length === 0) {
        const noChatInstances = document.createElement('div');
        noChatInstances.className = 'text-center mt-4';
        noChatInstances.textContent = 'No active chats';
        chatListContainer.appendChild(noChatInstances);
        return;
    }
    
    // Create a document fragment for better performance
    const fragment = document.createDocumentFragment();
    
    // Add each chat instance to fragment
    window.state.chatInstances.forEach(chatInstance => {
        const item = document.createElement('div');
        item.className = 'chat-instance-item';
        item.dataset.chatId = chatInstance.id;
        
        if (window.state.currentChat && chatInstance.id === window.state.currentChat.id) {
            item.classList.add('active');
        }
        
        // Get character data if available
        const character = window.state.characters.find(c => c.id === chatInstance.character_id);
        const characterName = character ? character.name : 'Unknown Character';
        
        // Format timestamp for "last updated"
        const updatedTimeAgo = window.utils.formatTimeAgo(chatInstance.updated_at);
        
        item.innerHTML = `
            <div class="chat-instance-avatar">
                <i class="fas fa-comments"></i>
            </div>
            <div class="chat-instance-meta">
                <div class="chat-instance-title">${chatInstance.title || `Chat with ${characterName}`}</div>
                <div class="chat-instance-details">
                    <span class="character-name">${characterName}</span> · 
                    <span class="updated-time">${updatedTimeAgo}</span>
                </div>
            </div>
            <div class="chat-instance-actions">
                <button class="chat-instance-delete-btn" title="Delete Chat">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        // Add click event to load the chat
        item.addEventListener('click', (e) => {
            // Skip if delete button was clicked
            if (e.target.closest('.chat-instance-delete-btn')) {
                return;
            }
            loadChatInstance(chatInstance.id);
        });
        
        // Add delete functionality
        const deleteBtn = item.querySelector('.chat-instance-delete-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteChatInstance(chatInstance.id);
            });
        }
        
        fragment.appendChild(item);
    });
    
    // Append all chat instances at once
    chatListContainer.appendChild(fragment);
}

// Load a specific chat instance
async function loadChatInstance(chatId) {
    if (!chatId) {
        console.warn('No chat ID provided to loadChatInstance');
        return;
    }
    
    console.log(`Loading chat instance: ${chatId}`);
    
    try {
        window.utils.showLoading();
        const response = await fetch(`${window.API.BASE_URL}/api/chats/${chatId}`);
        
        if (!response.ok) {
            throw new Error(`Failed to load chat instance: ${response.statusText}`);
        }
        
        const chatInstance = await response.json();
        
        // Set current chat
        window.state.currentChat = chatInstance;
        console.log(`Loaded chat instance: ${chatInstance.id}`);
        
        // Now that we have a specific chat instance, hide homepage and show chat interface
        const homepage = document.getElementById('homepage');
        const welcomeScreen = document.getElementById('welcome-screen');
        const chatInterface = document.getElementById('chat-interface');
        const chatControls = document.getElementById('chat-controls');
        
        if (homepage) homepage.classList.add('hidden');
        if (welcomeScreen) welcomeScreen.classList.add('hidden');
        if (chatInterface) chatInterface.classList.remove('hidden');
        if (chatControls) chatControls.classList.remove('hidden');
        
        // Load the associated character
        const characterId = chatInstance.character_id;
        if (characterId) {
            // Get character if not already in state
            if (!window.state.characters.some(c => c.id === characterId)) {
                await window.character.loadCharacters();
            }
            
            // Find character in state
            const character = window.state.characters.find(c => c.id === characterId);
            if (character) {
                // Apply chat-specific state to character for UI display
                const character_state = chatInstance.character_state || {};
                character.mood = character_state.mood || character.mood;
                character.emotions = character_state.emotions || character.emotions;
                character.opinion_of_user = character_state.opinion_of_user || character.opinion_of_user;
                character.action = character_state.action || character.action;
                character.location = chatInstance.location || character.location;
                
                // Set the character as current
                window.state.currentCharacter = character;
                
                // Update character UI
                if (window.character && window.character.updateCharacterUI) {
                    window.character.updateCharacterUI({conversations: chatInstance.conversations});
                }
            }
        }
        
        // Load chat conversations
        displayChatConversations(chatInstance.conversations);
        
        // Update active chat in list
        updateActiveChatInList(chatId);
        
        // Update location display
        updateLocationDisplay(chatInstance.location);
        
        // Hide sidebar on mobile after selecting a chat
        if (window.innerWidth <= 768 && window.elements.sidebar) {
            window.elements.sidebar.classList.remove('active');
        }
        
        // Focus the message input
        if (window.elements.messageInput) {
            window.elements.messageInput.focus();
        }
    } catch (error) {
        console.error('Error loading chat instance:', error);
        window.utils.showNotification('Failed to load chat. Please try again.', 'error');
    } finally {
        window.utils.hideLoading();
    }
}

// Display chat conversations
function displayChatConversations(conversations) {
    if (!window.elements.chatMessages) {
        console.warn('Chat messages container not found');
        return;
    }
    
    // Clear existing messages
    window.elements.chatMessages.innerHTML = '';
    
    if (!conversations || conversations.length === 0) {
        // If no conversations, add a greeting message
        if (window.state.currentCharacter && window.state.currentCharacter.greeting) {
            window.chat.addCharacterMessage(window.state.currentCharacter.greeting, {
                mood: window.state.currentCharacter.mood || 'neutral',
                emotions: window.state.currentCharacter.emotions || {},
                action: window.state.currentCharacter.action || 'greeting you with a smile',
                location: window.state.currentCharacter.location || 'welcoming area'
            });
        }
        return;
    }
    
    // Add each conversation to the chat
    conversations.forEach(convo => {
        // Skip if no character response (should not happen)
        if (!convo.character_response) return;
        
        // Add user message if it exists
        if (convo.user_message) {
            // Handle player actions differently
            if (convo.is_player_action) {
                addPlayerActionFromHistory(convo);
            } else {
                window.chat.addUserMessage(convo.user_message);
            }
        }
        
        // Add character response
        window.chat.addCharacterMessage(convo.character_response, {
            mood: convo.mood || 'neutral',
            emotions: convo.emotions || {},
            action: convo.action || 'standing still',
            location: convo.location || 'current location',
            scene_description: convo.scene_description || ''
        });
    });
    
    // Scroll to the bottom
    window.utils.scrollToBottom();
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

// Update the active chat in the list
function updateActiveChatInList(chatId) {
    const chatItems = document.querySelectorAll('.chat-instance-item');
    chatItems.forEach(item => {
        item.classList.remove('active');
        if (item.dataset.chatId === chatId) {
            item.classList.add('active');
        }
    });
}

// Update location display in the chat interface
function updateLocationDisplay(location) {
    const locationDisplay = document.getElementById('location-display');
    if (locationDisplay) {
        locationDisplay.textContent = location || 'Unknown location';
    }
}

// Create a new chat with a character
async function createNewChat(characterId, initialLocation = null) {
    if (!characterId) {
        console.warn('No character ID provided to createNewChat');
        return;
    }
    
    try {
        window.utils.showLoading();
        
        const requestData = {
            character_id: characterId
        };
        
        // Add location if provided
        if (initialLocation) {
            requestData.location = initialLocation;
        }
        
        const response = await fetch(`${window.API.BASE_URL}/api/chats`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(requestData)
        });
        
        if (!response.ok) {
            throw new Error(`Failed to create chat: ${response.statusText}`);
        }
        
        const chatInstance = await response.json();
        
        // Add to chat instances list
        if (!window.state.chatInstances) {
            window.state.chatInstances = [];
        }
        
        window.state.chatInstances.unshift(chatInstance);
        
        // Update the list UI
        renderChatInstancesList();
        
        // Load the new chat
        await loadChatInstance(chatInstance.id);
        
        window.utils.showNotification('New chat created!', 'success');
        
        return chatInstance;
    } catch (error) {
        console.error('Error creating chat:', error);
        window.utils.showNotification('Failed to create chat. Please try again.', 'error');
    } finally {
        window.utils.hideLoading();
    }
}

// Delete a chat instance
async function deleteChatInstance(chatId) {
    if (!chatId) return;
    
    // Confirm deletion
    if (!confirm('Are you sure you want to delete this chat? This cannot be undone.')) {
        return;
    }
    
    try {
        window.utils.showLoading();
        
        const response = await fetch(`${window.API.BASE_URL}/api/chats/${chatId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error(`Failed to delete chat: ${response.statusText}`);
        }
        
        // Remove from state
        window.state.chatInstances = window.state.chatInstances.filter(c => c.id !== chatId);
        
        // Update UI
        renderChatInstancesList();
        
        // If current chat was deleted, reset UI
        if (window.state.currentChat && window.state.currentChat.id === chatId) {
            window.state.currentChat = null;
            
            // If other chats exist, load the first one
            if (window.state.chatInstances.length > 0) {
                await loadChatInstance(window.state.chatInstances[0].id);
            } else {
                // Show welcome screen
                if (window.elements.welcomeScreen && window.elements.chatInterface) {
                    window.elements.welcomeScreen.classList.remove('hidden');
                    window.elements.chatInterface.classList.add('hidden');
                }
            }
        }
        
        window.utils.showNotification('Chat deleted successfully', 'success');
    } catch (error) {
        console.error('Error deleting chat:', error);
        window.utils.showNotification('Failed to delete chat. Please try again.', 'error');
    } finally {
        window.utils.hideLoading();
    }
}

// Update chat location
async function updateChatLocation(chatId, newLocation) {
    if (!chatId || !newLocation) return;
    
    try {
        const response = await fetch(`${window.API.BASE_URL}/api/chats/${chatId}`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ location: newLocation })
        });
        
        if (!response.ok) {
            throw new Error(`Failed to update chat location: ${response.statusText}`);
        }
        
        const updatedChat = await response.json();
        
        // Update current chat in state
        if (window.state.currentChat && window.state.currentChat.id === chatId) {
            window.state.currentChat.location = newLocation;
            
            // Update location display
            updateLocationDisplay(newLocation);
        }
        
        // Update chat in instances list
        if (window.state.chatInstances) {
            const chatIndex = window.state.chatInstances.findIndex(c => c.id === chatId);
            if (chatIndex !== -1) {
                window.state.chatInstances[chatIndex].location = newLocation;
            }
        }
        
        return updatedChat;
    } catch (error) {
        console.error('Error updating chat location:', error);
        window.utils.showNotification('Failed to update location. Please try again.', 'error');
    }
}

// Generate a location using AI
async function generateLocation(characterId, prompt = "") {
    if (!characterId) return;
    
    try {
        window.utils.showLoading();
        
        const response = await fetch(`${window.API.BASE_URL}/api/generate-location`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                character_id: characterId,
                prompt: prompt
            })
        });
        
        if (!response.ok) {
            throw new Error(`Failed to generate location: ${response.statusText}`);
        }
        
        const locationData = await response.json();
        return locationData;
    } catch (error) {
        console.error('Error generating location:', error);
        window.utils.showNotification('Failed to generate location. Please try again.', 'error');
        return null;
    } finally {
        window.utils.hideLoading();
    }
}


// Show character selection modal
function showCharacterSelectionModal() {
    // Create modal if it doesn't exist
    let characterSelectionModal = document.getElementById('character-selection-modal');
    
    if (!characterSelectionModal) {
        characterSelectionModal = document.createElement('div');
        characterSelectionModal.id = 'character-selection-modal';
        characterSelectionModal.className = 'modal-backdrop';
        
        characterSelectionModal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h3 class="modal-title">Select a Character</h3>
                    <button class="modal-close" id="character-selection-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="character-selection-list" id="character-selection-list">
                        <!-- Characters will be added here -->
                    </div>
                </div>
                <div class="modal-footer">
                    <button id="character-selection-cancel" class="btn btn-secondary">Cancel</button>
                    <button id="character-selection-create" class="btn btn-primary">Create New Character</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(characterSelectionModal);
        
        // Add event listeners
        const closeBtn = characterSelectionModal.querySelector('#character-selection-close');
        const cancelBtn = characterSelectionModal.querySelector('#character-selection-cancel');
        const createBtn = characterSelectionModal.querySelector('#character-selection-create');
        
        closeBtn.addEventListener('click', () => {
            characterSelectionModal.classList.add('hidden');
        });
        
        cancelBtn.addEventListener('click', () => {
            characterSelectionModal.classList.add('hidden');
        });
        
        createBtn.addEventListener('click', () => {
            characterSelectionModal.classList.add('hidden');
            if (window.character && window.character.openCreateCharacterModal) {
                window.character.openCreateCharacterModal();
            }
        });
    }
    
    // Populate with characters
    populateCharacterSelectionList();
    
    // Show the modal
    characterSelectionModal.classList.remove('hidden');
}

// Populate character selection list
function populateCharacterSelectionList() {
    const characterList = document.getElementById('character-selection-list');
    if (!characterList) return;
    
    // Clear existing list
    characterList.innerHTML = '';
    
    // Check if characters exist
    if (!window.state.characters || window.state.characters.length === 0) {
        characterList.innerHTML = '<div class="text-center p-4">No characters available. Click "Create New Character" to get started.</div>';
        return;
    }
    
    // Create a document fragment for better performance
    const fragment = document.createDocumentFragment();
    
    // Add each character
    window.state.characters.forEach(character => {
        const item = document.createElement('div');
        item.className = 'character-selection-item';
        item.dataset.characterId = character.id;
        
        item.innerHTML = `
            <div class="character-avatar">
                <i class="fas fa-user"></i>
            </div>
            <div class="character-meta">
                <div class="character-name">${character.name || 'Unnamed Character'}</div>
                <div class="character-description">${truncateText(character.description || '', 100)}</div>
            </div>
            <div class="character-actions">
                <button class="btn btn-sm btn-primary start-chat-btn">
                    <i class="fas fa-comments"></i> Start Chat
                </button>
            </div>
        `;
        
        // Add event listeners
        const startChatBtn = item.querySelector('.start-chat-btn');
        startChatBtn.addEventListener('click', async () => {
            // Create a new chat with this character
            document.getElementById('character-selection-modal').classList.add('hidden');
            await createNewChat(character.id);
        });
        
        fragment.appendChild(item);
    });
    
    // Append all characters at once
    characterList.appendChild(fragment);
}

// Utility function to truncate text
function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + '...';
}

// Show simplified location editor modal
function showLocationEditorModal() {
    // Don't show if no current chat
    if (!window.state.currentChat) {
        window.utils.showNotification('Please select a chat first', 'warning');
        return;
    }
    
    // Create modal if it doesn't exist
    let locationEditorModal = document.getElementById('location-editor-modal');
    
    if (!locationEditorModal) {
        locationEditorModal = document.createElement('div');
        locationEditorModal.id = 'location-editor-modal';
        locationEditorModal.className = 'modal-backdrop';
        
        locationEditorModal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h3 class="modal-title">Edit Location</h3>
                    <button class="modal-close" id="location-editor-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label for="location-input" class="form-label">Current Location</label>
                        <input type="text" id="location-input" class="form-input" placeholder="Enter location (e.g., Forest, Tavern, Library)">
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Quick Locations</label>
                        <div class="quick-locations-grid">
                            <button class="location-chip" data-location="Tavern">Tavern</button>
                            <button class="location-chip" data-location="Forest">Forest</button>
                            <button class="location-chip" data-location="Castle">Castle</button>
                            <button class="location-chip" data-location="Market">Market</button>
                            <button class="location-chip" data-location="Library">Library</button>
                            <button class="location-chip" data-location="Beach">Beach</button>
                            <button class="location-chip" data-location="Mountain">Mountain</button>
                            <button class="location-chip" data-location="Village">Village</button>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Generate Location</label>
                        <div class="generate-location-container">
                            <input type="text" id="location-prompt-input" class="form-input" placeholder="Optional location type (e.g., 'forest', 'space station')">
                            <button id="generate-location-btn" class="btn btn-primary">
                                <i class="fas fa-magic"></i> Generate
                            </button>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button id="location-editor-cancel" class="btn btn-secondary">Cancel</button>
                    <button id="location-editor-save" class="btn btn-primary">Save Location</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(locationEditorModal);
        
        // Add event listeners
        const closeBtn = locationEditorModal.querySelector('#location-editor-close');
        const cancelBtn = locationEditorModal.querySelector('#location-editor-cancel');
        const saveBtn = locationEditorModal.querySelector('#location-editor-save');
        const generateBtn = locationEditorModal.querySelector('#generate-location-btn');
        
        closeBtn.addEventListener('click', () => {
            locationEditorModal.classList.add('hidden');
        });
        
        cancelBtn.addEventListener('click', () => {
            locationEditorModal.classList.add('hidden');
        });
        
        saveBtn.addEventListener('click', async () => {
            const locationInput = document.getElementById('location-input');
            if (locationInput && window.state.currentChat) {
                const newLocation = locationInput.value.trim();
                if (newLocation) {
                    await updateChatLocation(window.state.currentChat.id, newLocation);
                    locationEditorModal.classList.add('hidden');
                    window.utils.showNotification('Location updated successfully', 'success');
                }
            }
        });
        
        generateBtn.addEventListener('click', async () => {
            const promptInput = document.getElementById('location-prompt-input');
            const prompt = promptInput ? promptInput.value.trim() : "";
            
            if (window.state.currentChat && window.state.currentChat.character_id) {
                window.utils.showLoading();
                const generatedLocation = await generateLocation(window.state.currentChat.character_id, prompt);
                window.utils.hideLoading();
                
                if (generatedLocation && generatedLocation.location) {
                    // Set the generated location in the input
                    const locationInput = document.getElementById('location-input');
                    if (locationInput) {
                        locationInput.value = generatedLocation.location;
                    }
                    
                    window.utils.showNotification('Location generated successfully', 'success');
                }
            }
        });
        
        // Add event listeners for quick location chips
        const locationChips = locationEditorModal.querySelectorAll('.location-chip');
        locationChips.forEach(chip => {
            chip.addEventListener('click', () => {
                const locationInput = document.getElementById('location-input');
                if (locationInput) {
                    locationInput.value = chip.dataset.location;
                }
            });
        });
    }
    
    // Set current location
    const locationInput = locationEditorModal.querySelector('#location-input');
    if (locationInput && window.state.currentChat) {
        locationInput.value = window.state.currentChat.location || '';
    }
    
    // Show the modal
    locationEditorModal.classList.remove('hidden');
}

// Initialize chat instances
async function initChatInstances() {
    console.log('Initializing chat instances...');
    
    // Add UI elements for chat instance management
    createChatInstancesUI();
    
    // Load chat instances but DON'T automatically select one
    await loadChatInstances();
    
    // Make sure the homepage is visible initially
    const homepage = document.getElementById('homepage');
    if (homepage && homepage.classList.contains('hidden')) {
        homepage.classList.remove('hidden');
    }
    
    // Hide chat interface initially
    const chatInterface = document.getElementById('chat-interface');
    if (chatInterface && !chatInterface.classList.contains('hidden')) {
        chatInterface.classList.add('hidden');
    }
    
    // Bind event listeners
    bindChatInstanceEvents();
}

// Create UI elements for chat instances
function createChatInstancesUI() {
    // Create chat instances panel in sidebar
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;
    
    // Create chat instances section if it doesn't exist
    let chatInstancesSection = document.getElementById('chat-instances-section');
    if (!chatInstancesSection) {
        chatInstancesSection = document.createElement('div');
        chatInstancesSection.id = 'chat-instances-section';
        chatInstancesSection.className = 'sidebar-section';
        
        chatInstancesSection.innerHTML = `
            <div class="sidebar-section-header">
                <h3>Active Chats</h3>
                <button id="new-chat-btn" class="btn btn-sm btn-primary">
                    <i class="fas fa-plus"></i>
                </button>
            </div>
            <div id="chat-instances-list" class="chat-instances-list">
                <!-- Chat instances will be loaded here -->
            </div>
        `;
        
        // Insert before character list
        const characterSection = document.querySelector('.sidebar-content');
        if (characterSection) {
            sidebar.insertBefore(chatInstancesSection, characterSection);
        } else {
            sidebar.appendChild(chatInstancesSection);
        }
    }
    
    // Create location display in chat header
    const chatHeader = document.querySelector('.chat-header');
    if (chatHeader) {
        let locationDisplay = document.getElementById('location-display-container');
        if (!locationDisplay) {
            locationDisplay = document.createElement('div');
            locationDisplay.id = 'location-display-container';
            locationDisplay.className = 'location-display-container';
            
            locationDisplay.innerHTML = `
                <div class="location-icon">
                    <i class="fas fa-map-marker-alt"></i>
                </div>
                <div id="location-display" class="location-display">Unknown location</div>
                <button id="edit-location-btn" class="btn btn-icon btn-sm">
                    <i class="fas fa-edit"></i>
                </button>
            `;
            
            // Add after character details
            const characterDetails = chatHeader.querySelector('.character-details');
            if (characterDetails) {
                characterDetails.appendChild(locationDisplay);
            } else {
                chatHeader.appendChild(locationDisplay);
            }
        }
    }
}

// Bind chat instance events
function bindChatInstanceEvents() {
    // New chat button
    const newChatBtn = document.getElementById('new-chat-btn');
    if (newChatBtn) {
        newChatBtn.addEventListener('click', () => {
            showCharacterSelectionModal();
        });
    }
    
    // Edit location button
    const editLocationBtn = document.getElementById('edit-location-btn');
    if (editLocationBtn) {
        editLocationBtn.addEventListener('click', () => {
            showLocationEditorModal();
        });
    }
    
    // Add event listener to initialize welcome page "Start Chat" button
    const welcomeStartChatBtn = document.createElement('button');
    welcomeStartChatBtn.id = 'welcome-start-chat-btn';
    welcomeStartChatBtn.className = 'get-started-btn';
    welcomeStartChatBtn.innerHTML = '<i class="fas fa-comments"></i> Start New Chat';
    
    const welcomeCreateBtn = document.getElementById('welcome-create-btn');
    if (welcomeCreateBtn && welcomeCreateBtn.parentNode) {
        // Add start chat button after create character button
        welcomeCreateBtn.insertAdjacentElement('afterend', welcomeStartChatBtn);
        
        // Add event listener
        welcomeStartChatBtn.addEventListener('click', () => {
            showCharacterSelectionModal();
        });
    }
}

// Expose chat instances functions
window.chatInstances = {
    init: initChatInstances,
    loadChatInstances,
    loadChatInstance,
    createNewChat,
    deleteChatInstance,
    updateChatLocation,
    generateLocation,
    showCharacterSelectionModal,
    showLocationEditorModal,
    loadChatHistory,
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', async function() {
    // Add to window.state
    if (!window.state) window.state = {};
    window.state.chatInstances = [];
    
    // Make sure currentChat is explicitly set to null
    window.state.currentChat = null;
    
    // Make sure the homepage is visible when the app loads
    const homepage = document.getElementById('homepage');
    if (homepage) {
        homepage.classList.remove('hidden');
    }
    
    // Hide chat interface when the app loads
    const chatInterface = document.getElementById('chat-interface');
    if (chatInterface) {
        chatInterface.classList.add('hidden');
    }
    
    // Wait until core and character are initialized before initializing chat instances
    // This is important because chat instances depend on characters being loaded
    if (window.character && window.character.loadCharacters) {
        await window.character.loadCharacters();
    }
    
    initChatInstances();
});
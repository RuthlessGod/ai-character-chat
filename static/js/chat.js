// chat.js - Chat and messaging functionality


// Send a chat message
async function sendMessage() {
    if (!window.elements.messageInput) {
        console.warn('Message input not found');
        return;
    }
    
    // Check for current chat instead of character
    if (!window.state.currentChat) {
        console.warn('No current chat selected');
        window.utils.showNotification('Please select or start a chat first', 'warning');
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
        window.utils.showLoading();
        
        // Prepare request data
        const useLocalModel = window.state.settings.model === 'local';
        const requestData = {
            message: messageText,
            use_local_model: useLocalModel
        };
        
        // Add optional parameters from settings
        if (window.state.settings.temperature) {
            requestData.temperature = parseFloat(window.state.settings.temperature);
        }
        
        if (window.state.settings.responseLength) {
            requestData.max_length = window.state.settings.responseLength === 'short' ? 100 : 
                                     window.state.settings.responseLength === 'medium' ? 250 : 500;
        }
        
        // Send message to API using chat ID instead of character ID
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
        
        // Update character state in current chat
        if (window.state.currentChat && window.state.currentChat.character_state) {
            window.state.currentChat.character_state.mood = responseData.mood;
            window.state.currentChat.character_state.emotions = responseData.emotions;
            window.state.currentChat.character_state.opinion_of_user = responseData.opinion_of_user;
            window.state.currentChat.character_state.action = responseData.action;
        }
        
        // Update location in current chat
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
        
        // Update character UI for current chat state
        if (window.state.currentCharacter) {
            // Map chat state to character for UI
            window.state.currentCharacter.mood = responseData.mood;
            window.state.currentCharacter.emotions = responseData.emotions;
            window.state.currentCharacter.opinion_of_user = responseData.opinion_of_user;
            window.state.currentCharacter.action = responseData.action;
            window.state.currentCharacter.location = responseData.location;
            
            updateCharacterMoodUI();
        }
        
        // Add character response to UI
        addCharacterMessage(responseData.response, {
            mood: responseData.mood,
            emotions: responseData.emotions,
            action: responseData.action,
            location: responseData.location,
            scene_description: responseData.scene_description
        });
        
        // Scroll to bottom
        window.utils.scrollToBottom();
    } catch (error) {
        console.error('Error sending message:', error);
        addCharacterMessage('Sorry, I encountered an error processing your message. Please try again later.', {
            mood: 'sad',
            emotions: { confusion: 0.8, frustration: 0.6 }
        });
    } finally {
        window.utils.hideLoading();
    }
}

// Add a user message to the chat
function addUserMessage(text) {
    if (!window.elements.chatMessages) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message message-user';
    
    messageDiv.innerHTML = `
        <div class="message-avatar">
            <i class="fas fa-user"></i>
        </div>
        <div class="message-bubble">
            <div class="message-text">${text}</div>
            <div class="message-metadata">
                ${window.utils.formatTime(new Date())}
            </div>
        </div>
    `;
    
    window.elements.chatMessages.appendChild(messageDiv);
    window.utils.scrollToBottom();
    
    // Dispatch an event that a new message was added
    const event = new CustomEvent('newMessageAdded', { 
        detail: { type: 'user', text: text }
    });
    document.dispatchEvent(event);
}

// Add a character message to the chat
function addCharacterMessage(text, metadata) {
    if (!window.elements.chatMessages) return;
    
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
                emotionsHTML += `<span class="emotion-tag">${window.utils.capitalizeFirstLetter(emotion)}</span>`;
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
                ${window.utils.formatTime(new Date())}
            </div>
        </div>
    `;
    
    window.elements.chatMessages.appendChild(messageDiv);
    
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
        
        window.elements.chatMessages.appendChild(sceneDiv);
        
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
        const currentMode = window.state.settings.interactionMode || 'simple';
        if (currentMode === 'novel' || currentMode === 'cinematic') {
            sceneToggle.click();
        }
    }
    
    window.utils.scrollToBottom();
    
    // Dispatch an event that a new message was added
    const event = new CustomEvent('newMessageAdded', { 
        detail: { type: 'character', text: text, metadata: metadata }
    });
    document.dispatchEvent(event);
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

// Update just the character mood and opinion UI (without clearing chat)
function updateCharacterMoodUI() {
    if (!window.state.currentCharacter) return;
    
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
}

// Save the current conversation
function saveConversation() {
    if (!window.state.currentCharacter || !window.elements.chatMessages) return;
    
    const messages = window.elements.chatMessages.querySelectorAll('.message');
    if (messages.length === 0) {
        window.utils.showNotification('No conversation to save.', 'warning');
        return;
    }
    
    let conversationText = `Conversation with ${window.state.currentCharacter.name}\n`;
    conversationText += `Date: ${new Date().toLocaleString()}\n\n`;
    
    messages.forEach(message => {
        const isUser = message.classList.contains('message-user');
        const name = isUser ? 'You' : window.state.currentCharacter.name;
        const textElement = message.querySelector('.message-text');
        const timeElement = message.querySelector('.message-metadata');
        
        if (textElement && timeElement) {
            const text = textElement.textContent;
            const time = timeElement.textContent.trim();
            
            conversationText += `${name} (${time}): ${text}\n\n`;
        }
    });
    
    // Create a download link
    const fileName = `conversation_with_${window.state.currentCharacter.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.txt`;
    
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(conversationText));
    element.setAttribute('download', fileName);
    
    element.style.display = 'none';
    document.body.appendChild(element);
    
    element.click();
    
    document.body.removeChild(element);
    window.utils.showNotification('Conversation saved successfully!', 'success');
}

// Clear the current conversation
function clearConversation() {
    if (!window.state.currentCharacter || !window.elements.chatMessages) return;
    
    if (confirm('Are you sure you want to clear this conversation? This cannot be undone.')) {
        window.elements.chatMessages.innerHTML = '';
        
        // Add a welcome message again
        const greeting = window.state.currentCharacter.greeting || `Hello! I'm ${window.state.currentCharacter.name}. How can I help you today?`;
        
        addCharacterMessage(greeting, {
            mood: window.state.currentCharacter.mood || 'neutral',
            emotions: window.state.currentCharacter.emotions || {},
            action: window.state.currentCharacter.action || 'greeting you with a smile',
            location: window.state.currentCharacter.location || 'welcoming area'
        });
        
        window.utils.showNotification('Conversation cleared.', 'success');
    }
}

// Export conversation as PDF (placeholder - would need a PDF library)
function exportConversationAsPDF() {
    window.utils.showNotification('PDF export functionality coming soon!', 'info');
}

// Initialize chat functionality
function initChat() {
    console.log('Initializing chat functionality...');
    
    // Set up chat input and send button
    if (window.elements.sendBtn && window.elements.messageInput) {
        window.elements.sendBtn.addEventListener('click', sendMessage);
        
        window.elements.messageInput.addEventListener('keydown', e => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
        
        // Auto-resize textarea
        window.elements.messageInput.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
        });
    }
    
    // Set up chat options menu actions
    if (window.elements.chatOptionsMenu) {
        const chatOptionItems = window.elements.chatOptionsMenu.querySelectorAll('.chat-option-item');
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
                        window.character.deleteCurrentCharacter();
                    }
                    
                    window.elements.chatOptionsMenu.classList.add('hidden');
                });
            });
        }
    }
    
    // Add scrolling enhancement
    initChatScrolling();
}

// Initialize chat scrolling enhancements
function initChatScrolling() {
    console.log("Applying chat scrolling enhancements");
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
                        window.utils.scrollToBottom();
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
    }
    
    // Resize function to handle window resize events
    function handleResize() {
        if (chatMessages) {
            const windowHeight = window.innerHeight;
            const headerHeight = document.querySelector('.chat-header')?.offsetHeight || 60;
            const controlsHeight = document.querySelector('.chat-controls-container')?.offsetHeight || 140;
            
            // Calculate and set height
            const newHeight = windowHeight - headerHeight - controlsHeight;
            chatMessages.style.height = `${newHeight}px`;
            chatMessages.style.maxHeight = `${newHeight}px`;
        }
    }
    
    // Handle resize events
    window.addEventListener('resize', handleResize);
    
    // Initial call to handle resize
    setTimeout(handleResize, 100);
}

// Expose chat functions
window.chat = {
    init: initChat,
    sendMessage: sendMessage,
    addUserMessage: addUserMessage,
    addCharacterMessage: addCharacterMessage,
    updateCharacterMoodUI: updateCharacterMoodUI,
    saveConversation: saveConversation,
    clearConversation: clearConversation,
    exportConversationAsPDF: exportConversationAsPDF
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initChat);











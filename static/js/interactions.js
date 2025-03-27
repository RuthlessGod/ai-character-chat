// interactions.js - Event binding and user interaction management

// Bind all event listeners
function bindEventListeners() {
    // Character creation and management (if not already bound by the character module)
    if (window.elements.editCharacterBtn) {
        window.elements.editCharacterBtn.addEventListener('click', () => {
            // Edit the current character
            if (window.state.currentCharacter) {
                window.character.openEditCharacterModal(window.state.currentCharacter);
            }
        });
    }
    
    // Mobile menu toggle
    if (window.elements.menuToggle) {
        window.elements.menuToggle.addEventListener('click', () => {
            if (window.elements.sidebar) {
                window.elements.sidebar.classList.toggle('active');
                window.state.ui.sidebarActive = window.elements.sidebar.classList.contains('active');
            }
        });
    }
    
    // Import/Export
    if (window.elements.importExportBtn) {
        window.elements.importExportBtn.addEventListener('click', showImportExportOptions);
    }
    
    // Tab navigation (global tabs, not specific to character or settings modal)
    const globalTabs = document.querySelectorAll('.global-tabs .tab');
    if (globalTabs.length > 0) {
        globalTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.getAttribute('data-tab');
                window.state.ui.currentTab = tabName;
                
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
    
    // Set up window resize handler for responsive UI
    window.addEventListener('resize', handleWindowResize);
}

// Fix chat input bindings
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
            
            if (window.playerActionSystem && window.playerActionSystem.getInputMode() === 'act') {
                window.playerActionSystem.sendPlayerAction();
            } else {
                window.chat.sendMessage();
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
                
                if (window.playerActionSystem && window.playerActionSystem.getInputMode() === 'act') {
                    window.playerActionSystem.sendPlayerAction();
                } else {
                    window.chat.sendMessage();
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

// Clean up duplicate input containers
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

// Handle window resize
function handleWindowResize() {
    // Update sidebar visibility based on screen size
    if (window.innerWidth <= 768) {
        if (window.elements.sidebar && window.elements.sidebar.classList.contains('active')) {
            window.elements.sidebar.classList.remove('active');
            window.state.ui.sidebarActive = false;
        }
    } else {
        if (window.elements.sidebar && !window.elements.sidebar.classList.contains('active')) {
            window.elements.sidebar.classList.add('active');
            window.state.ui.sidebarActive = true;
        }
    }
    
    // Update chat container height
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

// Show import/export options
function showImportExportOptions() {
    window.utils.showNotification('Import/Export functionality coming soon!', 'info');
}

// Set up automatic fixes for DOM changes
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

// Fix modal tab bindings
function fixModalTabs() {
    // Fix settings modal tabs
    if (window.settings && window.settings.fixSettingsModalTabs) {
        window.settings.fixSettingsModalTabs();
    }
    
    // Fix character modal tabs
    fixCharacterModalTabs();
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
                
                // Add visual feedback
                const aiGeneratorContent = this.closest('.ai-generator');
                if (aiGeneratorContent) {
                    aiGeneratorContent.classList.add('enabled');
                }
            } else {
                if (aiPromptInput) aiPromptInput.disabled = true;
                if (generateButton) generateButton.disabled = true;
                
                // Remove visual feedback
                const aiGeneratorContent = this.closest('.ai-generator');
                if (aiGeneratorContent) {
                    aiGeneratorContent.classList.remove('enabled');
                }
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
            
            // Call the generate character function 
            if (window.character && window.character.generateCharacter) {
                window.character.generateCharacter();
            } else if (window.generateCharacter) {
                window.generateCharacter();
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

// Basic chat scrolling fix
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

// Initialize interactions
function initInteractions() {
    console.log('Initializing interactions...');
    
    // Bind core event listeners
    bindEventListeners();
    
    // Set up automatic fixes for DOM changes
    setupAutomaticFixes();
    
    // Fix chat input bindings
    fixChatInputBindings();
    
    // Clean up duplicate inputs
    cleanupDuplicateInputs();
    
    // Apply scroll fix
    applyScrollFix();
    
    // Fix modal tabs
    setTimeout(fixModalTabs, 300);
    
    // Initial window resize to set up responsive elements
    handleWindowResize();
}

// Expose interaction functions
window.interactions = {
    init: initInteractions,
    bindEventListeners: bindEventListeners,
    fixChatInputBindings: fixChatInputBindings,
    cleanupDuplicateInputs: cleanupDuplicateInputs,
    handleWindowResize: handleWindowResize,
    fixModalTabs: fixModalTabs,
    fixCharacterModalTabs: fixCharacterModalTabs,
    applyScrollFix: applyScrollFix,
    setupAutomaticFixes: setupAutomaticFixes
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initInteractions);
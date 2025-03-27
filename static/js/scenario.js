// scenario.js - Core scenario management functionality

// Load scenarios from API
async function loadScenarios() {
    try {
        window.utils.showLoading();
        const response = await fetch(`${window.API.BASE_URL}/api/scenarios`);
        
        if (!response.ok) {
            throw new Error(`Failed to load scenarios: ${response.status}`);
        }
        
        const scenarios = await response.json();
        
        // Update state with scenarios
        window.state.scenarios = scenarios;
        
        console.log(`Loaded ${scenarios.length} scenarios`);
        
        return scenarios;
    } catch (error) {
        console.error('Error loading scenarios:', error);
        window.utils.showNotification('Failed to load scenarios. Please try again later.', 'error');
        return [];
    } finally {
        window.utils.hideLoading();
    }
}

// Get a specific scenario
async function getScenario(scenarioId) {
    try {
        window.utils.showLoading();
        const response = await fetch(`${window.API.BASE_URL}/api/scenarios/${scenarioId}`);
        
        if (!response.ok) {
            throw new Error(`Failed to load scenario: ${response.status}`);
        }
        
        const scenario = await response.json();
        return scenario;
    } catch (error) {
        console.error('Error getting scenario:', error);
        window.utils.showNotification('Failed to load scenario. Please try again.', 'error');
        return null;
    } finally {
        window.utils.hideLoading();
    }
}

// Create a new scenario
async function createScenario(scenarioData) {
    try {
        window.utils.showLoading();
        const response = await fetch(`${window.API.BASE_URL}/api/scenarios`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(scenarioData)
        });
        
        if (!response.ok) {
            throw new Error(`Failed to create scenario: ${response.status}`);
        }
        
        const scenario = await response.json();
        
        // Update scenarios in state
        if (!window.state.scenarios) {
            window.state.scenarios = [];
        }
        window.state.scenarios.push(scenario);
        
        window.utils.showNotification('Scenario created successfully!', 'success');
        return scenario;
    } catch (error) {
        console.error('Error creating scenario:', error);
        window.utils.showNotification('Failed to create scenario. Please try again.', 'error');
        return null;
    } finally {
        window.utils.hideLoading();
    }
}

// Update an existing scenario
async function updateScenario(scenarioId, scenarioData) {
    try {
        window.utils.showLoading();
        const response = await fetch(`${window.API.BASE_URL}/api/scenarios/${scenarioId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(scenarioData)
        });
        
        if (!response.ok) {
            throw new Error(`Failed to update scenario: ${response.status}`);
        }
        
        const scenario = await response.json();
        
        // Update scenario in state
        if (window.state.scenarios) {
            const index = window.state.scenarios.findIndex(s => s.id === scenarioId);
            if (index !== -1) {
                window.state.scenarios[index] = scenario;
            }
        }
        
        window.utils.showNotification('Scenario updated successfully!', 'success');
        return scenario;
    } catch (error) {
        console.error('Error updating scenario:', error);
        window.utils.showNotification('Failed to update scenario. Please try again.', 'error');
        return null;
    } finally {
        window.utils.hideLoading();
    }
}

// Delete a scenario
async function deleteScenario(scenarioId) {
    try {
        window.utils.showLoading();
        const response = await fetch(`${window.API.BASE_URL}/api/scenarios/${scenarioId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error(`Failed to delete scenario: ${response.status}`);
        }
        
        // Remove from state
        if (window.state.scenarios) {
            window.state.scenarios = window.state.scenarios.filter(s => s.id !== scenarioId);
        }
        
        window.utils.showNotification('Scenario deleted successfully!', 'success');
        return true;
    } catch (error) {
        console.error('Error deleting scenario:', error);
        window.utils.showNotification('Failed to delete scenario. Please try again.', 'error');
        return false;
    } finally {
        window.utils.hideLoading();
    }
}

// Generate content for a field using AI
async function generateFieldContent(fieldType, worldSize, context = {}) {
    try {
        window.utils.showLoading();
        const response = await fetch(`${window.API.BASE_URL}/api/generate-field-content`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                field_type: fieldType,
                world_size: worldSize,
                context: context,
                use_local_model: window.state.settings?.useLocalModel || false
            })
        });
        
        if (!response.ok) {
            throw new Error(`Failed to generate content: ${response.status}`);
        }
        
        const contentData = await response.json();
        return contentData;
    } catch (error) {
        console.error('Error generating field content:', error);
        window.utils.showNotification('Failed to generate content. Please try again.', 'error');
        return null;
    } finally {
        window.utils.hideLoading();
    }
}

// Generate a complete scenario using AI
async function generateCompleteScenario(baseInfo) {
    try {
        window.utils.showLoading();
        const response = await fetch(`${window.API.BASE_URL}/api/generate-scenario`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ...baseInfo,
                use_local_model: window.state.settings?.useLocalModel || false
            })
        });
        
        if (!response.ok) {
            throw new Error(`Failed to generate scenario: ${response.status}`);
        }
        
        const scenarioData = await response.json();
        return scenarioData;
    } catch (error) {
        console.error('Error generating scenario:', error);
        window.utils.showNotification('Failed to generate scenario. Please try again.', 'error');
        return null;
    } finally {
        window.utils.hideLoading();
    }
}

// Render a list of scenarios
function renderScenarioList(scenarios, containerId = 'scenario-list') {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // Clear container
    container.innerHTML = '';
    
    // If no scenarios, show message
    if (!scenarios || scenarios.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'empty-message';
        emptyMessage.textContent = 'No scenarios found. Create your first scenario to get started!';
        container.appendChild(emptyMessage);
        return;
    }
    
    // Create a grid to display scenarios
    const grid = document.createElement('div');
    grid.className = 'scenario-grid';
    container.appendChild(grid);
    
    // Add each scenario to the grid
    scenarios.forEach(scenario => {
        const card = createScenarioCard(scenario);
        grid.appendChild(card);
    });
}

// Create a scenario card element
function createScenarioCard(scenario) {
    const card = document.createElement('div');
    card.className = 'scenario-card';
    card.dataset.scenarioId = scenario.id;
    
    // Get world size badge class
    const sizeClass = `world-size-${scenario.world_size || 'small'}`;
    
    card.innerHTML = `
        <div class="scenario-image">
            <div class="world-size-badge ${sizeClass}">${(scenario.world_size || 'small').toUpperCase()}</div>
            <div class="scenario-locations">${scenario.locations?.length || 0} Locations</div>
        </div>
        <div class="scenario-content">
            <h3 class="scenario-name">${scenario.title || 'Untitled Scenario'}</h3>
            <p class="scenario-description">${(scenario.description || '').substring(0, 120)}${(scenario.description || '').length > 120 ? '...' : ''}</p>
            <div class="scenario-meta">
                <span class="scenario-created-at">${formatDate(scenario.created_at)}</span>
            </div>
        </div>
        <div class="card-footer">
            <button class="play-scenario-btn">Play Scenario</button>
            <div class="scenario-actions">
                <button class="btn btn-icon" title="Edit Scenario" data-action="edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-icon" title="Delete Scenario" data-action="delete">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `;
    
    // Add event listeners for buttons
    const playBtn = card.querySelector('.play-scenario-btn');
    playBtn.addEventListener('click', () => playScenario(scenario.id));
    
    // Action buttons
    const editBtn = card.querySelector('[data-action="edit"]');
    editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        window.location.href = `/scenario-creation.html?id=${scenario.id}`;
    });
    
    const deleteBtn = card.querySelector('[data-action="delete"]');
    deleteBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (confirm(`Are you sure you want to delete "${scenario.title}"? This cannot be undone.`)) {
            await deleteScenario(scenario.id);
            // Re-render the list
            renderScenarioList(window.state.scenarios);
        }
    });
    
    return card;
}

// Format date for display
function formatDate(dateString) {
    if (!dateString) return 'Unknown date';
    
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (e) {
        return 'Unknown date';
    }
}

// Play a scenario with a character
async function playScenario(scenarioId) {
    // Show character selection modal to choose which character to play with
    showPlayScenarioModal(scenarioId);
}

// Create and show the play scenario modal
function showPlayScenarioModal(scenarioId) {
    // Check if characters are loaded
    if (!window.state.characters || window.state.characters.length === 0) {
        window.utils.showNotification('You need to create a character first before playing a scenario.', 'warning');
        return;
    }
    
    // Create modal if it doesn't exist
    let playScenarioModal = document.getElementById('play-scenario-modal');
    
    if (!playScenarioModal) {
        playScenarioModal = document.createElement('div');
        playScenarioModal.id = 'play-scenario-modal';
        playScenarioModal.className = 'modal-backdrop';
        
        playScenarioModal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h3 class="modal-title">Choose a Character</h3>
                    <button class="modal-close" id="play-scenario-close">&times;</button>
                </div>
                <div class="modal-body">
                    <p>Select a character to play this scenario with:</p>
                    <div class="character-selection-list" id="play-scenario-character-list">
                        <!-- Characters will be loaded here -->
                    </div>
                </div>
                <div class="modal-footer">
                    <button id="play-scenario-cancel" class="btn btn-secondary">Cancel</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(playScenarioModal);
        
        // Add event listeners
        const closeBtn = playScenarioModal.querySelector('#play-scenario-close');
        const cancelBtn = playScenarioModal.querySelector('#play-scenario-cancel');
        
        closeBtn.addEventListener('click', () => {
            playScenarioModal.classList.add('hidden');
        });
        
        cancelBtn.addEventListener('click', () => {
            playScenarioModal.classList.add('hidden');
        });
    }
    
    // Store the scenario ID in the modal
    playScenarioModal.dataset.scenarioId = scenarioId;
    
    // Populate with characters
    populatePlayScenarioCharacterList(scenarioId);
    
    // Show the modal
    playScenarioModal.classList.remove('hidden');
}

// Populate the play scenario character list
function populatePlayScenarioCharacterList(scenarioId) {
    const characterList = document.getElementById('play-scenario-character-list');
    if (!characterList) return;
    
    // Clear existing list
    characterList.innerHTML = '';
    
    // Check if characters exist
    if (!window.state.characters || window.state.characters.length === 0) {
        characterList.innerHTML = '<div class="text-center p-4">No characters available. Create a character first.</div>';
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
                <button class="btn btn-sm btn-primary start-scenario-btn">
                    <i class="fas fa-play"></i> Start
                </button>
            </div>
        `;
        
        // Add event listeners
        const startBtn = item.querySelector('.start-scenario-btn');
        startBtn.addEventListener('click', async () => {
            // Start scenario with this character
            document.getElementById('play-scenario-modal').classList.add('hidden');
            await startScenarioWithCharacter(scenarioId, character.id);
        });
        
        fragment.appendChild(item);
    });
    
    // Append all characters at once
    characterList.appendChild(fragment);
}

// Start a scenario with a character
async function startScenarioWithCharacter(scenarioId, characterId) {
    try {
        window.utils.showLoading();
        
        // Get the scenario to access starting location
        const scenario = await getScenario(scenarioId);
        if (!scenario) {
            throw new Error('Failed to load scenario');
        }
        
        // Create a new chat with the character
        const startingLocation = scenario.starting_location || 'Starting location';
        const chatInstance = await window.chatInstances.createNewChat(characterId, startingLocation);
        
        if (!chatInstance) {
            throw new Error('Failed to create chat instance');
        }
        
        // Update chat instance with scenario ID
        const response = await fetch(`${window.API.BASE_URL}/api/chats/${chatInstance.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                scenario_id: scenarioId
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to update chat with scenario');
        }
        
        // Load the chat instance
        await window.chatInstances.loadChatInstance(chatInstance.id);
        
        // Hide homepage, show chat interface
        if (window.elements.welcomeScreen && window.elements.chatInterface) {
            window.elements.welcomeScreen.classList.add('hidden');
            window.elements.chatInterface.classList.remove('hidden');
        }
        
        // Hide homepage if visible
        const homepage = document.getElementById('homepage');
        if (homepage) {
            homepage.classList.add('hidden');
        }
        
        window.utils.showNotification(`Started scenario "${scenario.title}" with ${window.state.currentCharacter.name}!`, 'success');
    } catch (error) {
        console.error('Error starting scenario:', error);
        window.utils.showNotification('Failed to start scenario. Please try again.', 'error');
    } finally {
        window.utils.hideLoading();
    }
}

// Utility function to truncate text
function truncateText(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + '...';
}

// Initialize scenario module
function initScenario() {
    console.log('Initializing scenario module...');
    
    // Add to window.state
    if (!window.state) window.state = {};
    window.state.scenarios = [];
}

// Expose scenario functions
window.scenario = {
    init: initScenario,
    loadScenarios,
    getScenario,
    createScenario,
    updateScenario,
    deleteScenario,
    generateFieldContent,
    generateCompleteScenario,
    renderScenarioList,
    playScenario
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initScenario();
});
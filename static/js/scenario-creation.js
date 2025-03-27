// scenario-creation.js - Handles the scenario creation interface

// Global variables
let currentScenarioId = null;
let currentWorldSize = 'small';
let isEditing = false;
let unsavedChanges = false;

// Initialize the scenario creation form
function initScenarioCreation() {
    console.log('Initializing scenario creation...');
    
    // Check for scenario ID in URL (for editing)
    const urlParams = new URLSearchParams(window.location.search);
    const scenarioId = urlParams.get('id');
    
    if (scenarioId) {
        // Load existing scenario for editing
        loadScenarioForEditing(scenarioId);
        isEditing = true;
    } else {
        // Setup new scenario form
        setupForm();
    }
    
    // Set up event listeners
    bindEventListeners();
    
    // Set up form change tracking
    trackFormChanges();
}

// Load an existing scenario for editing
async function loadScenarioForEditing(scenarioId) {
    try {
        window.utils.showLoading();
        
        // Get the scenario data
        const scenario = await window.scenario.getScenario(scenarioId);
        
        if (!scenario) {
            throw new Error('Failed to load scenario');
        }
        
        // Set global variables
        currentScenarioId = scenarioId;
        currentWorldSize = scenario.world_size || 'small';
        
        // Setup form with existing data
        setupForm(scenario);
        
        // Update page title
        document.querySelector('.page-header h1').textContent = 'Edit Scenario';
        
        // Update form header
        document.getElementById('form-title').textContent = 'Edit Scenario';
        
        // Update save button text
        document.getElementById('save-scenario-btn').textContent = 'Update Scenario';
        
    } catch (error) {
        console.error('Error loading scenario for editing:', error);
        window.utils.showNotification('Failed to load scenario for editing. Please try again.', 'error');
        
        // Redirect to create new scenario
        window.location.href = 'scenario-creation.html';
    } finally {
        window.utils.hideLoading();
    }
}

// Set up the form with optional existing data
function setupForm(existingData = null) {
    // Set world size
    if (existingData) {
        currentWorldSize = existingData.world_size || 'small';
    }
    
    // Set world size radio buttons
    const worldSizeRadio = document.querySelector(`input[name="world-size"][value="${currentWorldSize}"]`);
    if (worldSizeRadio) {
        worldSizeRadio.checked = true;
    }
    
    // Set up form fields based on world size
    setupFormFields(currentWorldSize);
    
    // Fill in fields if editing
    if (existingData) {
        fillFormFields(existingData);
    }
}

// Set up form fields based on world size
function setupFormFields(worldSize) {
    // Show all sections first
    document.querySelectorAll('.form-section').forEach(section => {
        section.classList.add('hidden');
    });
    
    // Show basic fields for all world sizes
    document.getElementById('basic-section').classList.remove('hidden');
    document.getElementById('locations-section').classList.remove('hidden');
    document.getElementById('npcs-section').classList.remove('hidden');
    
    // Show fields for medium and large worlds
    if (worldSize === 'medium' || worldSize === 'large') {
        document.getElementById('medium-section').classList.remove('hidden');
    }
    
    // Show fields for large worlds only
    if (worldSize === 'large') {
        document.getElementById('large-section').classList.remove('hidden');
    }
    
    // Set up dynamic fields
    setupDynamicFields(worldSize);
}

// Set up dynamic fields like locations and NPCs
function setupDynamicFields(worldSize) {
    // Clear existing dynamic fields
    const locationsContainer = document.getElementById('locations-container');
    const npcsContainer = document.getElementById('npcs-container');
    
    if (locationsContainer) locationsContainer.innerHTML = '';
    if (npcsContainer) npcsContainer.innerHTML = '';
    
    // Set up empty fields based on world size
    const locationsCount = worldSize === 'small' ? 3 : (worldSize === 'medium' ? 6 : 8);
    const npcsCount = worldSize === 'small' ? 2 : (worldSize === 'medium' ? 5 : 10);
    
    // Add empty location fields
    for (let i = 0; i < locationsCount; i++) {
        addLocationField();
    }
    
    // Add empty NPC fields
    for (let i = 0; i < npcsCount; i++) {
        addNpcField();
    }
    
    // Add settlement fields for large worlds
    if (worldSize === 'large') {
        const settlementsContainer = document.getElementById('settlements-container');
        if (settlementsContainer) {
            settlementsContainer.innerHTML = '';
            for (let i = 0; i < 3; i++) {
                addSettlementField();
            }
        }
    }
}

// Fill form fields with existing data
function fillFormFields(data) {
    // Basic fields
    document.getElementById('scenario-title').value = data.title || '';
    document.getElementById('scenario-description').value = data.description || '';
    document.getElementById('starting-location').value = data.starting_location || '';
    document.getElementById('world-rules').value = data.world_rules || '';
    
    // Medium world fields
    if (currentWorldSize === 'medium' || currentWorldSize === 'large') {
        document.getElementById('history').value = data.history || '';
        
        // Fill conflicts
        const conflictsContainer = document.getElementById('conflicts-container');
        if (conflictsContainer) {
            conflictsContainer.innerHTML = '';
            
            if (data.conflicts && data.conflicts.length > 0) {
                data.conflicts.forEach(conflict => {
                    if (typeof conflict === 'object') {
                        addConflictField({
                            parties: conflict.parties || '',
                            issue: conflict.issue || '',
                            stakes: conflict.stakes || ''
                        });
                    } else {
                        addConflictField({ issue: conflict });
                    }
                });
            } else {
                // Add at least one empty conflict field
                addConflictField();
            }
        }
    }
    
    // Large world fields
    if (currentWorldSize === 'large') {
        document.getElementById('political-structure').value = data.political_structure || '';
        document.getElementById('geography').value = data.geography || '';
        document.getElementById('economy').value = data.economy || '';
        
        // Fill settlements
        const settlementsContainer = document.getElementById('settlements-container');
        if (settlementsContainer) {
            settlementsContainer.innerHTML = '';
            
            if (data.settlements && data.settlements.length > 0) {
                data.settlements.forEach(settlement => {
                    if (typeof settlement === 'object') {
                        addSettlementField({
                            name: settlement.name || '',
                            size: settlement.size || '',
                            description: settlement.description || '',
                            government: settlement.government || ''
                        });
                    } else {
                        addSettlementField({ name: settlement });
                    }
                });
            } else {
                // Add at least one empty settlement field
                addSettlementField();
            }
        }
    }
    
    // Locations
    const locationsContainer = document.getElementById('locations-container');
    if (locationsContainer) {
        locationsContainer.innerHTML = '';
        
        if (data.locations && data.locations.length > 0) {
            data.locations.forEach(location => {
                if (typeof location === 'object') {
                    addLocationField({
                        name: location.name || '',
                        description: location.description || '',
                        points_of_interest: location.points_of_interest || []
                    });
                } else {
                    addLocationField({ name: location });
                }
            });
        } else {
            // Add empty location fields
            const locationsCount = currentWorldSize === 'small' ? 3 : (currentWorldSize === 'medium' ? 6 : 8);
            for (let i = 0; i < locationsCount; i++) {
                addLocationField();
            }
        }
    }
    
    // NPCs
    const npcsContainer = document.getElementById('npcs-container');
    if (npcsContainer) {
        npcsContainer.innerHTML = '';
        
        if (data.npcs && data.npcs.length > 0) {
            data.npcs.forEach(npc => {
                if (typeof npc === 'object') {
                    addNpcField({
                        name: npc.name || '',
                        role: npc.role || '',
                        description: npc.description || '',
                        motivation: npc.motivation || ''
                    });
                } else {
                    addNpcField({ name: npc });
                }
            });
        } else {
            // Add empty NPC fields
            const npcsCount = currentWorldSize === 'small' ? 2 : (currentWorldSize === 'medium' ? 5 : 10);
            for (let i = 0; i < npcsCount; i++) {
                addNpcField();
            }
        }
    }
}

// Add a location field to the form
function addLocationField(data = null) {
    const container = document.getElementById('locations-container');
    if (!container) return;
    
    const locationId = `location-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    const locationDiv = document.createElement('div');
    locationDiv.className = 'dynamic-field location-field';
    locationDiv.dataset.fieldId = locationId;
    
    locationDiv.innerHTML = `
        <div class="field-header">
            <h4>Location</h4>
            <div class="field-actions">
                <button type="button" class="btn btn-icon generate-field-btn" data-field-type="location" title="Generate with AI">
                    <i class="fas fa-magic"></i>
                </button>
                <button type="button" class="btn btn-icon remove-field-btn" title="Remove">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>Name</label>
                <input type="text" class="form-input location-name" placeholder="Location name" value="${data?.name || ''}">
            </div>
        </div>
        <div class="form-group">
            <label>Description</label>
            <textarea class="form-input location-description" rows="3" placeholder="Describe this location...">${data?.description || ''}</textarea>
        </div>
        <div class="form-group">
            <label>Points of Interest</label>
            <textarea class="form-input location-points" rows="2" placeholder="Notable features or interactive elements">${Array.isArray(data?.points_of_interest) ? data.points_of_interest.join(', ') : (data?.points_of_interest || '')}</textarea>
            <p class="form-hint">Separate multiple points with commas</p>
        </div>
    `;
    
    // Add event listeners
    const generateBtn = locationDiv.querySelector('.generate-field-btn');
    generateBtn.addEventListener('click', () => {
        generateFieldContent('location', locationId);
    });
    
    const removeBtn = locationDiv.querySelector('.remove-field-btn');
    removeBtn.addEventListener('click', () => {
        locationDiv.remove();
    });
    
    container.appendChild(locationDiv);
}

// Add an NPC field to the form
function addNpcField(data = null) {
    const container = document.getElementById('npcs-container');
    if (!container) return;
    
    const npcId = `npc-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    const npcDiv = document.createElement('div');
    npcDiv.className = 'dynamic-field npc-field';
    npcDiv.dataset.fieldId = npcId;
    
    npcDiv.innerHTML = `
        <div class="field-header">
            <h4>Character</h4>
            <div class="field-actions">
                <button type="button" class="btn btn-icon generate-field-btn" data-field-type="npc" title="Generate with AI">
                    <i class="fas fa-magic"></i>
                </button>
                <button type="button" class="btn btn-icon remove-field-btn" title="Remove">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>Name</label>
                <input type="text" class="form-input npc-name" placeholder="Character name" value="${data?.name || ''}">
            </div>
            <div class="form-group">
                <label>Role</label>
                <input type="text" class="form-input npc-role" placeholder="Character's role" value="${data?.role || ''}">
            </div>
        </div>
        <div class="form-group">
            <label>Description</label>
            <textarea class="form-input npc-description" rows="2" placeholder="Physical appearance and personality">${data?.description || ''}</textarea>
        </div>
        <div class="form-group">
            <label>Motivation</label>
            <textarea class="form-input npc-motivation" rows="2" placeholder="What drives this character">${data?.motivation || ''}</textarea>
        </div>
    `;
    
    // Add event listeners
    const generateBtn = npcDiv.querySelector('.generate-field-btn');
    generateBtn.addEventListener('click', () => {
        generateFieldContent('npc', npcId);
    });
    
    const removeBtn = npcDiv.querySelector('.remove-field-btn');
    removeBtn.addEventListener('click', () => {
        npcDiv.remove();
    });
    
    container.appendChild(npcDiv);
}

// Add a conflict field to the form
function addConflictField(data = null) {
    const container = document.getElementById('conflicts-container');
    if (!container) return;
    
    const conflictId = `conflict-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    const conflictDiv = document.createElement('div');
    conflictDiv.className = 'dynamic-field conflict-field';
    conflictDiv.dataset.fieldId = conflictId;
    
    conflictDiv.innerHTML = `
        <div class="field-header">
            <h4>Conflict</h4>
            <div class="field-actions">
                <button type="button" class="btn btn-icon generate-field-btn" data-field-type="conflict" title="Generate with AI">
                    <i class="fas fa-magic"></i>
                </button>
                <button type="button" class="btn btn-icon remove-field-btn" title="Remove">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </div>
        <div class="form-group">
            <label>Parties Involved</label>
            <input type="text" class="form-input conflict-parties" placeholder="Who is involved" value="${Array.isArray(data?.parties) ? data.parties.join(', ') : (data?.parties || '')}">
            <p class="form-hint">Separate multiple parties with commas</p>
        </div>
        <div class="form-group">
            <label>Issue</label>
            <textarea class="form-input conflict-issue" rows="2" placeholder="What the conflict is about">${data?.issue || ''}</textarea>
        </div>
        <div class="form-group">
            <label>Stakes</label>
            <textarea class="form-input conflict-stakes" rows="2" placeholder="What happens if resolved/unresolved">${data?.stakes || ''}</textarea>
        </div>
    `;
    
    // Add event listeners
    const generateBtn = conflictDiv.querySelector('.generate-field-btn');
    generateBtn.addEventListener('click', () => {
        generateFieldContent('conflict', conflictId);
    });
    
    const removeBtn = conflictDiv.querySelector('.remove-field-btn');
    removeBtn.addEventListener('click', () => {
        conflictDiv.remove();
    });
    
    container.appendChild(conflictDiv);
}

// Add a settlement field to the form
function addSettlementField(data = null) {
    const container = document.getElementById('settlements-container');
    if (!container) return;
    
    const settlementId = `settlement-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    const settlementDiv = document.createElement('div');
    settlementDiv.className = 'dynamic-field settlement-field';
    settlementDiv.dataset.fieldId = settlementId;
    
    settlementDiv.innerHTML = `
        <div class="field-header">
            <h4>Settlement</h4>
            <div class="field-actions">
                <button type="button" class="btn btn-icon generate-field-btn" data-field-type="settlement" title="Generate with AI">
                    <i class="fas fa-magic"></i>
                </button>
                <button type="button" class="btn btn-icon remove-field-btn" title="Remove">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>Name</label>
                <input type="text" class="form-input settlement-name" placeholder="Settlement name" value="${data?.name || ''}">
            </div>
            <div class="form-group">
                <label>Size</label>
                <select class="form-input settlement-size">
                    <option value="village" ${data?.size === 'village' ? 'selected' : ''}>Village</option>
                    <option value="town" ${data?.size === 'town' ? 'selected' : ''}>Town</option>
                    <option value="city" ${data?.size === 'city' ? 'selected' : ''}>City</option>
                    <option value="metropolis" ${data?.size === 'metropolis' ? 'selected' : ''}>Metropolis</option>
                </select>
            </div>
        </div>
        <div class="form-group">
            <label>Description</label>
            <textarea class="form-input settlement-description" rows="2" placeholder="Notable features and atmosphere">${data?.description || ''}</textarea>
        </div>
        <div class="form-group">
            <label>Government</label>
            <textarea class="form-input settlement-government" rows="2" placeholder="How it's governed">${data?.government || ''}</textarea>
        </div>
    `;
    
    // Add event listeners
    const generateBtn = settlementDiv.querySelector('.generate-field-btn');
    generateBtn.addEventListener('click', () => {
        generateFieldContent('settlement', settlementId);
    });
    
    const removeBtn = settlementDiv.querySelector('.remove-field-btn');
    removeBtn.addEventListener('click', () => {
        settlementDiv.remove();
    });
    
    container.appendChild(settlementDiv);
}

// Generate content for a field using AI
async function generateFieldContent(fieldType, fieldId) {
    try {
        // Get context from form
        const formData = getFormData();
        
        // Generate content based on field type
        const content = await window.scenario.generateFieldContent(
            fieldType,
            currentWorldSize,
            {
                title: formData.title,
                description: formData.description,
                existing_content: formData
            }
        );
        
        if (!content) {
            throw new Error('Failed to generate content');
        }
        
        // Fill the field with generated content
        fillFieldWithContent(fieldType, fieldId, content);
        
    } catch (error) {
        console.error(`Error generating ${fieldType} content:`, error);
        window.utils.showNotification(`Failed to generate ${fieldType} content. Please try again.`, 'error');
    }
}

// Fill a field with generated content
function fillFieldWithContent(fieldType, fieldId, content) {
    const fieldElement = document.querySelector(`[data-field-id="${fieldId}"]`);
    if (!fieldElement) return;
    
    switch (fieldType) {
        case 'location':
            if (content.name) {
                fieldElement.querySelector('.location-name').value = content.name;
            }
            if (content.description) {
                fieldElement.querySelector('.location-description').value = content.description;
            }
            if (content.points_of_interest) {
                // Handle both array and string formats
                const points = Array.isArray(content.points_of_interest)
                    ? content.points_of_interest.join(', ')
                    : content.points_of_interest;
                fieldElement.querySelector('.location-points').value = points;
            }
            break;
            
        case 'npc':
            if (content.name) {
                fieldElement.querySelector('.npc-name').value = content.name;
            }
            if (content.role) {
                fieldElement.querySelector('.npc-role').value = content.role;
            }
            if (content.description) {
                fieldElement.querySelector('.npc-description').value = content.description;
            }
            if (content.motivation) {
                fieldElement.querySelector('.npc-motivation').value = content.motivation;
            }
            break;
            
        case 'conflict':
            if (content.parties) {
                // Handle both array and string formats
                const parties = Array.isArray(content.parties)
                    ? content.parties.join(', ')
                    : content.parties;
                fieldElement.querySelector('.conflict-parties').value = parties;
            }
            if (content.issue) {
                fieldElement.querySelector('.conflict-issue').value = content.issue;
            }
            if (content.stakes) {
                fieldElement.querySelector('.conflict-stakes').value = content.stakes;
            }
            break;
            
        case 'settlement':
            if (content.name) {
                fieldElement.querySelector('.settlement-name').value = content.name;
            }
            if (content.size) {
                const sizeSelect = fieldElement.querySelector('.settlement-size');
                const option = Array.from(sizeSelect.options).find(opt => opt.value === content.size);
                if (option) {
                    option.selected = true;
                }
            }
            if (content.description) {
                fieldElement.querySelector('.settlement-description').value = content.description;
            }
            if (content.government) {
                fieldElement.querySelector('.settlement-government').value = content.government;
            }
            break;
            
        default:
            console.warn(`Unknown field type: ${fieldType}`);
            break;
    }
    
    // Set unsaved changes flag
    unsavedChanges = true;
    
    // Flash the field to indicate it was updated
    fieldElement.classList.add('highlight-field');
    setTimeout(() => {
        fieldElement.classList.remove('highlight-field');
    }, 1000);
}

// Generate a field section with AI
async function generateSectionContent(sectionType) {
    try {
        window.utils.showLoading();
        
        // Get context from form
        const formData = getFormData();
        
        let content;
        
        switch (sectionType) {
            case 'history':
                content = await window.scenario.generateFieldContent('history', currentWorldSize, {
                    title: formData.title,
                    description: formData.description
                });
                
                if (content && content.history) {
                    document.getElementById('history').value = content.history;
                }
                break;
                
            case 'political_structure':
                content = await window.scenario.generateFieldContent('political_structure', currentWorldSize, {
                    title: formData.title,
                    description: formData.description,
                    history: formData.history
                });
                
                if (content && content.political_structure) {
                    document.getElementById('political-structure').value = content.political_structure;
                }
                break;
                
            case 'geography':
                content = await window.scenario.generateFieldContent('geography', currentWorldSize, {
                    title: formData.title,
                    description: formData.description
                });
                
                if (content && content.geography) {
                    document.getElementById('geography').value = content.geography;
                }
                break;
                
            case 'economy':
                content = await window.scenario.generateFieldContent('economy', currentWorldSize, {
                    title: formData.title,
                    description: formData.description,
                    political_structure: formData.political_structure
                });
                
                if (content && content.economy) {
                    document.getElementById('economy').value = content.economy;
                }
                break;
                
            default:
                throw new Error(`Unknown section type: ${sectionType}`);
        }
        
        // Set unsaved changes flag
        unsavedChanges = true;
        
    } catch (error) {
        console.error(`Error generating ${sectionType} content:`, error);
        window.utils.showNotification(`Failed to generate content. Please try again.`, 'error');
    } finally {
        window.utils.hideLoading();
    }
}

// Generate a complete scenario
async function generateCompleteScenario() {
    try {
        if (unsavedChanges && !confirm('You have unsaved changes. Are you sure you want to generate a new scenario? This will overwrite your current work.')) {
            return;
        }
        
        window.utils.showLoading();
        
        // Get basic info from form for context
        const title = document.getElementById('scenario-title').value;
        const description = document.getElementById('scenario-description').value;
        
        // Generate scenario
        const scenario = await window.scenario.generateCompleteScenario({
            title,
            description,
            world_size: currentWorldSize
        });
        
        if (!scenario) {
            throw new Error('Failed to generate scenario');
        }
        
        // Fill the form with generated content
        fillFormFields(scenario);
        
        // Set unsaved changes flag
        unsavedChanges = true;
        
        window.utils.showNotification('Scenario generated successfully!', 'success');
    } catch (error) {
        console.error('Error generating complete scenario:', error);
        window.utils.showNotification('Failed to generate scenario. Please try again.', 'error');
    } finally {
        window.utils.hideLoading();
    }
}

// Get form data
function getFormData() {
    // Basic fields
    const formData = {
        title: document.getElementById('scenario-title').value,
        description: document.getElementById('scenario-description').value,
        starting_location: document.getElementById('starting-location').value,
        world_rules: document.getElementById('world-rules').value,
        world_size: currentWorldSize,
        locations: [],
        npcs: []
    };
    
    // Collect locations
    document.querySelectorAll('.location-field').forEach(field => {
        const name = field.querySelector('.location-name').value.trim();
        const description = field.querySelector('.location-description').value.trim();
        const pointsStr = field.querySelector('.location-points').value.trim();
        
        // Only add if at least name is provided
        if (name) {
            const points = pointsStr ? pointsStr.split(',').map(p => p.trim()).filter(p => p) : [];
            formData.locations.push({
                name,
                description,
                points_of_interest: points
            });
        }
    });
    
    // Collect NPCs
    document.querySelectorAll('.npc-field').forEach(field => {
        const name = field.querySelector('.npc-name').value.trim();
        const role = field.querySelector('.npc-role').value.trim();
        const description = field.querySelector('.npc-description').value.trim();
        const motivation = field.querySelector('.npc-motivation').value.trim();
        
        // Only add if at least name is provided
        if (name) {
            formData.npcs.push({
                name,
                role,
                description,
                motivation
            });
        }
    });
    
    // Medium and large world fields
    if (currentWorldSize === 'medium' || currentWorldSize === 'large') {
        formData.history = document.getElementById('history').value;
        formData.conflicts = [];
        
        // Collect conflicts
        document.querySelectorAll('.conflict-field').forEach(field => {
            const partiesStr = field.querySelector('.conflict-parties').value.trim();
            const issue = field.querySelector('.conflict-issue').value.trim();
            const stakes = field.querySelector('.conflict-stakes').value.trim();
            
            // Only add if at least issue is provided
            if (issue) {
                const parties = partiesStr ? partiesStr.split(',').map(p => p.trim()).filter(p => p) : [];
                formData.conflicts.push({
                    parties,
                    issue,
                    stakes
                });
            }
        });
    }
    
    // Large world fields
    if (currentWorldSize === 'large') {
        formData.political_structure = document.getElementById('political-structure').value;
        formData.geography = document.getElementById('geography').value;
        formData.economy = document.getElementById('economy').value;
        formData.settlements = [];
        
        // Collect settlements
        document.querySelectorAll('.settlement-field').forEach(field => {
            const name = field.querySelector('.settlement-name').value.trim();
            const size = field.querySelector('.settlement-size').value;
            const description = field.querySelector('.settlement-description').value.trim();
            const government = field.querySelector('.settlement-government').value.trim();
            
            // Only add if at least name is provided
            if (name) {
                formData.settlements.push({
                    name,
                    size,
                    description,
                    government
                });
            }
        });
    }
    
    return formData;
}

// Save the scenario
async function saveScenario() {
    try {
        // Validate form
        const formData = getFormData();
        
        if (!formData.title) {
            window.utils.showNotification('Please enter a title for your scenario.', 'warning');
            document.getElementById('scenario-title').focus();
            return;
        }
        
        if (!formData.starting_location) {
            window.utils.showNotification('Please set a starting location for your scenario.', 'warning');
            document.getElementById('starting-location').focus();
            return;
        }
        
        // Check if we need at least one location
        if (formData.locations.length === 0) {
            window.utils.showNotification('Please add at least one location to your scenario.', 'warning');
            return;
        }
        
        window.utils.showLoading();
        
        let result;
        
        if (isEditing && currentScenarioId) {
            // Update existing scenario
            result = await window.scenario.updateScenario(currentScenarioId, formData);
        } else {
            // Create new scenario
            result = await window.scenario.createScenario(formData);
        }
        
        if (!result) {
            throw new Error('Failed to save scenario');
        }
        
        // Clear unsaved changes flag
        unsavedChanges = false;
        
        // Show success message
        window.utils.showNotification(
            isEditing ? 'Scenario updated successfully!' : 'Scenario created successfully!',
            'success'
        );
        
        // Redirect back to homepage after a delay
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
        
    } catch (error) {
        console.error('Error saving scenario:', error);
        window.utils.showNotification('Failed to save scenario. Please try again.', 'error');
    } finally {
        window.utils.hideLoading();
    }
}

// Bind event listeners
function bindEventListeners() {
    // World size radio buttons
    document.querySelectorAll('input[name="world-size"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (unsavedChanges && !confirm('Changing world size will reset some fields. Continue?')) {
                // Reset to previous selection
                document.querySelector(`input[name="world-size"][value="${currentWorldSize}"]`).checked = true;
                return;
            }
            
            currentWorldSize = e.target.value;
            setupFormFields(currentWorldSize);
        });
    });
    
    // Add buttons for dynamic fields
    document.getElementById('add-location-btn').addEventListener('click', () => {
        addLocationField();
    });
    
    document.getElementById('add-npc-btn').addEventListener('click', () => {
        addNpcField();
    });
    
    if (document.getElementById('add-conflict-btn')) {
        document.getElementById('add-conflict-btn').addEventListener('click', () => {
            addConflictField();
        });
    }
    
    if (document.getElementById('add-settlement-btn')) {
        document.getElementById('add-settlement-btn').addEventListener('click', () => {
            addSettlementField();
        });
    }
    
    // Section generation buttons
    const sectionGenerators = {
        'generate-history-btn': 'history',
        'generate-political-btn': 'political_structure',
        'generate-geography-btn': 'geography',
        'generate-economy-btn': 'economy'
    };
    
    Object.entries(sectionGenerators).forEach(([btnId, sectionType]) => {
        const btn = document.getElementById(btnId);
        if (btn) {
            btn.addEventListener('click', () => {
                generateSectionContent(sectionType);
            });
        }
    });
    
    // Generate complete scenario button
    document.getElementById('generate-scenario-btn').addEventListener('click', () => {
        generateCompleteScenario();
    });
    
    // Save button
    document.getElementById('save-scenario-btn').addEventListener('click', () => {
        saveScenario();
    });
    
    // Cancel button
    document.getElementById('cancel-btn').addEventListener('click', () => {
        if (unsavedChanges && !confirm('You have unsaved changes. Are you sure you want to cancel?')) {
            return;
        }
        
        window.location.href = 'index.html';
    });
    
    // Handle back navigation button
    document.getElementById('back-to-home').addEventListener('click', (e) => {
        if (unsavedChanges && !confirm('You have unsaved changes. Are you sure you want to leave?')) {
            e.preventDefault();
            return;
        }
    });
    
    // Before unload warning
    window.addEventListener('beforeunload', (e) => {
        if (unsavedChanges) {
            e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
            return e.returnValue;
        }
    });
}

// Track form changes
function trackFormChanges() {
    const form = document.getElementById('scenario-form');
    if (form) {
        // Listen for input events on all form inputs
        form.addEventListener('input', () => {
            unsavedChanges = true;
        });
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initScenarioCreation();
});

// Expose module functions
window.scenarioCreation = {
    init: initScenarioCreation,
    addLocationField,
    addNpcField,
    addConflictField,
    addSettlementField,
    generateCompleteScenario,
    saveScenario
};
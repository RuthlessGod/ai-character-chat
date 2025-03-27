/**
 * Guided Scenario Creation
 * JavaScript file to handle guided scenario creation functionality
 */

// State management
const scenarioState = {
    worldSize: 'small', // Default to small
    primaryPrompt: '',
    activeStep: 1,
    unsavedChanges: false,
    formData: {
        title: '',
        description: '',
        starting_location: '',
        world_rules: '',
        history: '',
        political_structure: '',
        geography: '',
        economy: '',
        // Arrays for entities
        locations: [],
        npcs: [],
        conflicts: []
    },
    // Counters for entities
    locationCount: 0,
    npcCount: 0,
    conflictCount: 0
};

// Check for unsaved changes before leaving the page
function checkUnsavedChanges() {
    if (scenarioState.unsavedChanges) {
        return confirm('You have unsaved changes. Are you sure you want to exit?');
    }
    return true;
}

// Initialize the scenario creation process
function initGuidedScenario() {
    console.log('Initializing guided scenario creation...');

    // Bind event listeners for world size selection
    document.querySelectorAll('.world-size-option input[type="radio"]').forEach(radio => {
        radio.addEventListener('change', handleWorldSizeChange);
    });

    // Step navigation
    document.getElementById('next-to-step-2').addEventListener('click', () => {
        navigateToStep(2);
    });

    document.getElementById('back-to-step-1').addEventListener('click', () => {
        navigateToStep(1);
    });

    document.getElementById('next-to-step-3').addEventListener('click', () => {
        const primaryPrompt = document.getElementById('primary-prompt').value.trim();
        if (!primaryPrompt) {
            utils.showNotification('Please provide a description of your world before proceeding.', 'error');
            return;
        }
        
        scenarioState.primaryPrompt = primaryPrompt;
        navigateToStep(3);
        updateFormVisibility();
    });

    document.getElementById('back-to-step-2').addEventListener('click', () => {
        navigateToStep(2);
    });

    document.getElementById('generate-all').addEventListener('click', generateAllFromPrompt);
    document.getElementById('save-scenario').addEventListener('click', saveScenario);

    // Genre tag handling
    document.querySelectorAll('.genre-tag').forEach(tag => {
        tag.addEventListener('click', toggleGenreTag);
    });

    // Field generation buttons
    document.querySelectorAll('.generate-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const fieldType = e.currentTarget.getAttribute('data-field');
            console.log('Generate button clicked for field:', fieldType);
            generateFieldContent(fieldType);
        });
    });

    // Entity management
    document.getElementById('add-location').addEventListener('click', () => showEntityModal('location'));
    document.getElementById('add-npc').addEventListener('click', () => showEntityModal('npc'));
    document.getElementById('add-conflict').addEventListener('click', () => showEntityModal('conflict'));
    
    document.getElementById('generate-locations').addEventListener('click', () => generateEntities('location'));
    document.getElementById('generate-npcs').addEventListener('click', () => generateEntities('npc'));
    document.getElementById('generate-conflicts').addEventListener('click', () => generateEntities('conflict'));

    // Entity modal
    document.querySelector('.close-modal').addEventListener('click', hideEntityModal);
    document.getElementById('entity-form').addEventListener('submit', saveEntity);
    document.getElementById('generate-entity-content').addEventListener('click', generateEntityContent);

    // Input change tracking
    document.querySelectorAll('input, textarea').forEach(input => {
        input.addEventListener('change', () => {
            scenarioState.unsavedChanges = true;
        });
    });

    // Add beforeunload event to warn about unsaved changes
    window.addEventListener('beforeunload', (e) => {
        if (scenarioState.unsavedChanges) {
            e.preventDefault();
            e.returnValue = '';
            return '';
        }
    });
}

// Navigate between steps
function navigateToStep(stepNumber) {
    // Hide all steps
    document.querySelectorAll('.scenario-step').forEach(step => {
        step.classList.remove('active');
    });

    // Show the target step
    const targetStep = document.getElementById(`step-${stepNumber}`);
    targetStep.classList.add('active');
    
    // Update active step in state
    scenarioState.activeStep = stepNumber;
    
    // Reset scroll position of the step container
    targetStep.scrollTop = 0;
    
    // Also reset main content scroll position
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        mainContent.scrollTop = 0;
    }
    
    // If this is step 3 and we have a lot of form sections, ensure proper scrolling
    if (stepNumber === 3) {
        resetFormScrollPositions();
    }
}

// Reset scroll positions in form containers
function resetFormScrollPositions() {
    const formContainers = document.querySelectorAll('.form-section, .entity-cards');
    formContainers.forEach(container => {
        if (container.scrollHeight > container.clientHeight) {
            container.scrollTop = 0;
        }
    });
    
    // Reset the main form container scroll
    const formContainer = document.querySelector('.scenario-form-container');
    if (formContainer) {
        formContainer.scrollTop = 0;
    }
}

// Handle world size selection
function handleWorldSizeChange(e) {
    const selectedSize = e.target.value;
    scenarioState.worldSize = selectedSize;
    
    // Update UI if needed (e.g., highlighting the selected option)
    document.querySelectorAll('.world-size-option').forEach(option => {
        if (option.getAttribute('data-size') === selectedSize) {
            option.classList.add('selected');
        } else {
            option.classList.remove('selected');
        }
    });
}

// Toggle genre tag selection
function toggleGenreTag(e) {
    const tag = e.currentTarget;
    tag.classList.toggle('selected');
    
    // Update prompt based on selected genres
    updatePromptWithGenres();
}

// Update prompt with selected genres
function updatePromptWithGenres() {
    const selectedGenres = Array.from(document.querySelectorAll('.genre-tag.selected'))
        .map(tag => tag.textContent);
    
    if (selectedGenres.length > 0) {
        const promptElem = document.getElementById('primary-prompt');
        let currentText = promptElem.value;
        
        // If the prompt doesn't mention the genres, add them
        if (!currentText.toLowerCase().includes('genre') && !currentText.includes(selectedGenres[0])) {
            const genreText = selectedGenres.length === 1 
                ? `The genre is ${selectedGenres[0]}.` 
                : `The genres are ${selectedGenres.slice(0, -1).join(', ')} and ${selectedGenres[selectedGenres.length - 1]}.`;
                
            if (currentText) {
                // Add to the end of the existing text
                promptElem.value = currentText + ' ' + genreText;
            } else {
                // If empty, suggest a prompt with the genres
                promptElem.value = `I want to create a ${selectedGenres.join('/')} world where...`;
            }
        }
    }
}

// Update form visibility based on world size
function updateFormVisibility() {
    const worldSize = scenarioState.worldSize;
    
    // Sections only visible for medium and large worlds
    const mediumSections = ['history-section', 'conflicts-section'];
    // Sections only visible for large worlds
    const largeSections = ['politics-section', 'geography-section', 'economy-section'];
    
    // Show/hide sections based on world size
    mediumSections.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.style.display = (worldSize === 'small') ? 'none' : 'block';
        }
    });
    
    largeSections.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.style.display = (worldSize === 'large') ? 'block' : 'none';
        }
    });
}

// Generate all content from primary prompt
async function generateAllFromPrompt() {
    if (!scenarioState.primaryPrompt) {
        utils.showNotification('Please provide a primary prompt before generating content.', 'error');
        return;
    }
    
    utils.showLoader('Generating your scenario...');
    
    try {
        const response = await utils.fetchWithErrorHandling('/api/generate-scenario-from-prompt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                primary_prompt: scenarioState.primaryPrompt,
                world_size: scenarioState.worldSize
            })
        });
        
        // Populate form fields with scenario data
        if (response) {
            populateFormFromScenario(response);
            utils.showNotification('Scenario successfully generated!', 'success');
        } else {
            utils.showNotification('Failed to generate scenario. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Error generating scenario:', error);
        utils.showNotification(`Error: ${error.message}`, 'error');
    } finally {
        utils.hideLoader();
    }
}

// Generate content for a specific field
async function generateFieldContent(fieldType) {
    console.log(`Generating content for field: ${fieldType}`);
    
    // Get current context from form
    const context = collectFormContext();
    
    const fieldElement = document.getElementById(fieldType);
    if (!fieldElement) {
        console.error(`Field element not found: ${fieldType}`);
        return;
    }
    
    utils.showLoader(`Generating ${fieldType.replace('_', ' ')}...`);
    
    try {
        const response = await utils.fetchWithErrorHandling('/api/generate-field-content', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                field_name: fieldType,
                context: context
            })
        });
        
        if (response && response.content) {
            // Update the field with generated content
            if (Array.isArray(response.content)) {
                fieldElement.value = response.content.join('\n\n');
            } else {
                fieldElement.value = response.content;
            }
            
            // Update state
            scenarioState.formData[fieldType] = fieldElement.value;
            scenarioState.unsavedChanges = true;
            
            utils.showNotification(`${fieldType.replace('_', ' ')} generated successfully!`, 'success');
        } else {
            utils.showNotification('Failed to generate content. Please try again.', 'error');
        }
    } catch (error) {
        console.error(`Error generating ${fieldType}:`, error);
        utils.showNotification(`Error: ${error.message}`, 'error');
    } finally {
        utils.hideLoader();
    }
}

// Generate entity content based on name and description
async function generateEntityContent() {
    const entityType = document.getElementById('entity-type').value;
    const entityName = document.getElementById('entity-name').value.trim();
    const entityDescription = document.getElementById('entity-primary-description').value.trim();
    
    if (!entityName || !entityDescription) {
        utils.showNotification('Please provide both a name and primary description.', 'error');
        return;
    }
    
    utils.showLoader(`Generating ${entityType} details...`);
    
    try {
        // Get current context
        const context = collectFormContext();
        
        // Get existing entities of this type
        const existingEntities = scenarioState.formData[`${entityType}s`] || [];
        
        const response = await utils.fetchWithErrorHandling('/api/generate-entities', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                entity_type: entityType,
                count: 1,
                context: context,
                existing_entities: existingEntities,
                name: entityName,
                primary_description: entityDescription
            })
        });
        
        if (response) {
            // Fill in the form fields based on entity type
            document.getElementById('entity-description').value = response.description || response.description || entityDescription;
            
            if (entityType === 'location') {
                document.getElementById('entity-field-1').value = response.points_of_interest || '';
                document.getElementById('entity-field-2').value = response.inhabitants || '';
                document.getElementById('entity-field-3').value = response.secrets || '';
            } else if (entityType === 'npc') {
                document.getElementById('entity-field-1').value = response.personality || '';
                document.getElementById('entity-field-2').value = response.motivation || '';
                document.getElementById('entity-field-3').value = response.abilities || '';
            } else if (entityType === 'conflict') {
                document.getElementById('entity-field-1').value = response.stakes || '';
                document.getElementById('entity-field-2').value = response.parties || '';
                document.getElementById('entity-field-3').value = response.resolution_options || '';
            }
            
            utils.showNotification(`${entityType} details generated!`, 'success');
        } else {
            utils.showNotification('Failed to generate entity details. Please try again.', 'error');
        }
    } catch (error) {
        console.error(`Error generating ${entityType} details:`, error);
        utils.showNotification(`Error: ${error.message}`, 'error');
    } finally {
        utils.hideLoader();
    }
}

// Save the scenario
async function saveScenario() {
    // Collect all data from the form
    const scenarioData = collectFormData();
    
    if (!scenarioData.title) {
        utils.showNotification('Please provide a title for your scenario.', 'error');
        return;
    }
    
    utils.showLoader('Saving your scenario...');
    
    try {
        // In a real implementation, this would save to a database
        // For now, let's simulate saving and provide feedback
        
        // Convert to JSON string for storage
        const scenarioJson = JSON.stringify(scenarioData);
        
        // Store in localStorage for demo purposes
        localStorage.setItem(`scenario_${Date.now()}`, scenarioJson);
        
        // Update state
        scenarioState.unsavedChanges = false;
        
        utils.showNotification('Scenario saved successfully!', 'success');
        
        // In a real implementation, you might redirect to a scenarios list page
        // window.location.href = '/static/scenarios.html';
    } catch (error) {
        console.error('Error saving scenario:', error);
        utils.showNotification(`Error: ${error.message}`, 'error');
    } finally {
        utils.hideLoader();
    }
}

// Helper functions
// ...

// Event listeners setup
document.addEventListener('DOMContentLoaded', initGuidedScenario); 
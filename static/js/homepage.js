// homepage.js - Homepage functionality for AI Character Chat

// Sample data for the homepage
const featuredCharacters = [
    { 
        id: 'char1', 
        name: 'Elara the Mage', 
        description: 'A wise and powerful sorceress with centuries of knowledge.',
        category: 'fantasy',
        interactions: 2453
    },
    { 
        id: 'char2', 
        name: 'Commander Nova', 
        description: 'Battle-hardened space commander with a troubled past.',
        category: 'sci-fi',
        interactions: 1876
    },
    { 
        id: 'char3', 
        name: 'Detective Blake', 
        description: 'Sharp-witted private eye who solves the unsolvable cases.',
        category: 'noir',
        interactions: 3142
    },
    { 
        id: 'char4', 
        name: 'Sakura', 
        description: 'Cheerful high school student with supernatural abilities.',
        category: 'anime',
        interactions: 4231
    }
];

// Function to properly scroll the homepage to the top, with retries
function scrollHomepage() {
    // Find the main scrollable container for the homepage
    const homepage = document.getElementById('homepage');
    const appContainer = document.querySelector('.app-container');
    const mainContent = document.querySelector('.main-content');
    
    console.log('Attempting to scroll homepage to top');
    
    // Try different potential scrollable elements
    const scrollTargets = [
        window,
        document.documentElement,
        document.body,
        appContainer,
        mainContent,
        homepage
    ].filter(el => el); // Filter out any undefined elements
    
    // Attempt to scroll each potential target
    scrollTargets.forEach(target => {
        try {
            target.scrollTo({
                top: 0,
                left: 0,
                behavior: 'auto'
            });
            
            // Also directly set scrollTop for good measure
            if (target !== window) {
                target.scrollTop = 0;
            }
        } catch (err) {
            console.log(`Couldn't scroll element:`, err);
        }
    });
    
    // Reset scroll position of any scrollable containers within the homepage
    if (homepage) {
        const scrollableContainers = homepage.querySelectorAll('.scrollable, .scroll-container, [class*="scroll"], div');
        scrollableContainers.forEach(container => {
            try {
                container.scrollTop = 0;
            } catch (err) {
                // Ignore errors here
            }
        });
    }
    
    // Set a repeated scroll attempt with a delay to ensure content is loaded
    setTimeout(() => {
        // Try scrolling again after a delay
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
        
        if (homepage) homepage.scrollTop = 0;
        if (appContainer) appContainer.scrollTop = 0;
        if (mainContent) mainContent.scrollTop = 0;
        
        console.log('Second attempt to scroll homepage completed');
    }, 100);
    
    // One final attempt after longer delay for any dynamic content
    setTimeout(() => {
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
        console.log('Final attempt to scroll homepage completed');
    }, 500);
}

// Function to show the homepage and hide other views
function showHomepage() {
    console.log('Showing homepage');
    
    // First, make sure the homepage element exists
    const homepage = document.getElementById('homepage');
    if (!homepage) {
        console.error('Homepage element not found!');
        return;
    }
    
    // Hide ALL other views (be comprehensive)
    document.getElementById('welcome-screen')?.classList.add('hidden');
    document.getElementById('chat-interface')?.classList.add('hidden');
    document.getElementById('chat-controls')?.classList.add('hidden');
    
    // Also check for any other potential views
    const allMainViews = document.querySelectorAll('.main-content > div:not(#homepage)');
    allMainViews.forEach(view => {
        view.classList.add('hidden');
    });
    
    // Force homepage to be visible AND rendered
    homepage.classList.remove('hidden');
    homepage.style.display = '';  // Clear any direct style that might override classes
    
    // If in a chat, exit chat mode
    if (window.state && window.state.currentChat) {
        window.state.currentChat = null;
    }
    
    // Make sure any chat-specific styles are removed from the body
    document.body.classList.remove('chat-mode');
    
    // Use our enhanced scrolling function with retry logic
    scrollHomepage();
    
    console.log('Homepage should now be visible');
}

// Function to initialize the homepage
function initHomepage() {
    console.log('Initializing homepage...');
    
    // Set up event listeners
    const createCharacterBtn = document.getElementById('hp-create-character-btn');
    const homeLogo = document.getElementById('home-logo');
    
    if (homeLogo) {
        homeLogo.addEventListener('click', () => {
            console.log('Home logo clicked');
            showHomepage();
        });
    }
    
    if (createCharacterBtn) {
        createCharacterBtn.addEventListener('click', () => {
            console.log('Create character button clicked');
            window.location.href = '/static/character-creation.html';
        });
    }
    
    // Tab switching
    const tabButtons = document.querySelectorAll('.homepage-tab');
    if (tabButtons) {
        tabButtons.forEach(tab => {
            tab.addEventListener('click', () => {
                // Toggle active state
                tabButtons.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                // Switch displayed content based on tab
                const tabId = tab.getAttribute('data-tab');
                console.log(`Switching to tab: ${tabId}`);
                
                // Implement tab switching logic
                switch (tabId) {
                    case 'featured':
                        showFeaturedCharacters();
                        break;
                    case 'trending':
                        showTrendingCharacters();
                        break;
                    case 'new':
                        showNewCharacters();
                        break;
                    case 'your':
                        showUserCharacters();
                        break;
                    default:
                        showFeaturedCharacters();
                }
            });
        });
    }
    
    // Load characters and scenarios after a slight delay to simulate API call
    setTimeout(() => {
        // Hide loading placeholders
        document.querySelectorAll('.loading-placeholder').forEach(el => {
            el.style.display = 'none';
        });
        
        // Populate featured characters
        loadUserCharacters().then(characters => {
            const characterContainer = document.querySelector('.character-card-container');
            if (characterContainer) {
                characterContainer.innerHTML = '';
                if (characters && characters.length > 0) {
                    characters.forEach(character => {
                        const card = createCharacterCard(character);
                        characterContainer.appendChild(card);
                    });
                } else {
                    // Show featured characters as fallback
                    featuredCharacters.forEach(character => {
                        const card = createCharacterCard(character);
                        characterContainer.appendChild(card);
                    });
                }
            }
        });
        
        // Clear scenario container since we removed scenario functionality
        const scenarioContainer = document.querySelector('.scenario-card-container');
        if (scenarioContainer) {
            scenarioContainer.innerHTML = '<div class="empty-scenario-message">Scenario functionality has been removed.</div>';
        }
    }, 300);
    
    console.log('Homepage initialization complete');
}

// Create a character card for the homepage
function createCharacterCard(character) {
    const card = document.createElement('div');
    card.className = 'character-card';
    card.setAttribute('data-id', character.id);
    
    // Create a random hue for character card (for visual variety)
    const hue = Math.floor(Math.random() * 360);
    card.style.setProperty('--character-color', `hsl(${hue}, 70%, 65%)`);
    
    // Generate card content
    card.innerHTML = `
        <h3 class="character-name">${character.name || 'Unnamed Character'}</h3>
        <p class="character-description">${character.description || 'No description available.'}</p>
        <div class="character-meta">
            <span class="character-category">${character.category || 'General'}</span>
            <span class="character-stats">${character.interactions || 0} chats</span>
        </div>
        <button class="start-chat-btn">Start Chat</button>
    `;
    
    // Add click event to start chat
    card.querySelector('.start-chat-btn').addEventListener('click', () => {
        startChatWithCharacter(character.id);
    });
    
    return card;
}

// Function to start a chat with a selected character
function startChatWithCharacter(characterId) {
    console.log(`Starting chat with character ${characterId}`);
    
    // Call the createNewChat function if it exists
    if (typeof createNewChat === 'function') {
        createNewChat(characterId);
    } else {
        console.error('createNewChat function not found');
        showNotification('Could not start chat. The chat creation feature is not available.', 'error');
    }
}

// Export functions that should be globally available
window.showHomepage = showHomepage;
window.initHomepage = initHomepage;
window.startChatWithCharacter = startChatWithCharacter;
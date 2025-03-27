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

const popularScenarios = [
    {
        id: 'scen1',
        name: 'Enchanted Forest Adventure',
        description: 'Explore a magical forest filled with wonders and dangers.',
        category: 'fantasy',
        plays: 1245
    },
    {
        id: 'scen2',
        name: 'Space Station Omega',
        description: 'Survive on a damaged space station orbiting a dying star.',
        category: 'sci-fi',
        plays: 879
    },
    {
        id: 'scen3',
        name: 'Murder at Midnight',
        description: 'Solve a perplexing murder in a 1940s noir setting.',
        category: 'mystery',
        plays: 1632
    },
    {
        id: 'scen4',
        name: 'Haunted Mansion',
        description: 'Uncover the secrets of an abandoned mansion with a dark history.',
        category: 'horror',
        plays: 2365
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
    const createScenarioBtn = document.getElementById('hp-create-scenario-btn');
    const tabButtons = document.querySelectorAll('.homepage-tab');
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
    
    if (createScenarioBtn) {
        createScenarioBtn.addEventListener('click', () => {
            console.log('Create scenario button clicked');
            // Update this to point to our new guided scenario creation page
            window.location.href = '/static/create-scenario.html';
        });
    }
    
    // Tab switching
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
        const charactersGrid = document.getElementById('featured-characters-grid');
        featuredCharacters.forEach(character => {
            const card = createCharacterCard(character);
            charactersGrid.appendChild(card);
        });
        
        // Populate popular scenarios
        const scenariosGrid = document.getElementById('popular-scenarios-grid');
        popularScenarios.forEach(scenario => {
            const card = createScenarioCard(scenario);
            scenariosGrid.appendChild(card);
        });
    }, 1000);
}

// Helper function to create a character card
function createCharacterCard(character) {
    const card = document.createElement('div');
    card.className = 'character-card';
    card.setAttribute('data-character-id', character.id);
    
    card.innerHTML = `
        <div class="character-card-content">
            <div class="character-avatar">
                <i class="fas fa-user"></i>
            </div>
            <div class="character-info">
                <h3 class="character-name">${character.name}</h3>
                <p class="character-description">${character.description}</p>
                <div class="character-meta">
                    <span class="character-category">${character.category}</span>
                    <span class="character-interactions">${character.interactions.toLocaleString()} chats</span>
                </div>
            </div>
        </div>
        <div class="card-footer">
            <button class="start-chat-btn">Start Chatting</button>
        </div>
    `;
    
    // Add click event to start chatting
    card.addEventListener('click', (e) => {
        // Prevent default behavior of clicking on featured characters that aren't implemented
        e.preventDefault();
        
        // Show notification that these are example characters
        if (window.utils && window.utils.showNotification) {
            window.utils.showNotification('These are example characters and not fully implemented yet.', 'info');
        } else {
            alert('These are example characters and not fully implemented yet.');
        }
    });
    
    return card;
}

// Helper function to create a scenario card
function createScenarioCard(scenario) {
    const card = document.createElement('div');
    card.className = 'scenario-card';
    card.setAttribute('data-scenario-id', scenario.id);
    
    card.innerHTML = `
        <div class="scenario-image">
            <div class="scenario-plays">${scenario.plays} plays</div>
        </div>
        <div class="scenario-content">
            <h3 class="scenario-name">${scenario.name}</h3>
            <p class="scenario-description">${scenario.description}</p>
            <span class="character-category">${scenario.category}</span>
        </div>
        <div class="card-footer">
            <button class="play-scenario-btn">Play Scenario</button>
        </div>
    `;
    
    // Add click event to play scenario
    card.addEventListener('click', () => {
        playScenario(scenario.id);
    });
    
    return card;
}

// Function to start chat with a character
function startChatWithCharacter(characterId) {
    console.log('Starting chat with character:', characterId);
    
    // Hide homepage and welcome screen
    document.getElementById('homepage').classList.add('hidden');
    document.getElementById('welcome-screen').classList.add('hidden');
    
    // Show chat interface
    document.getElementById('chat-interface').classList.remove('hidden');
    
    // Show chat controls
    document.getElementById('chat-controls').classList.remove('hidden');
    
    // This would normally load the character and start a chat
    // For now, just simulate it by calling the loadCharacter function if available
    if (window.character && window.character.loadCharacter) {
        window.character.loadCharacter(characterId);
    }
}

// Function to play a scenario
function playScenario(scenarioId) {
    console.log('Playing scenario:', scenarioId);
    
    // This would be implemented in a future version
    if (window.utils && window.utils.showNotification) {
        window.utils.showNotification('Scenario play feature coming soon!', 'info');
    } else {
        alert('Scenario play feature coming soon!');
    }
}

// Initialize the homepage when the DOM is loaded
// In core.js or app.js initialization
document.addEventListener('DOMContentLoaded', function() {
    // Set up home button in header
    const homeButton = document.getElementById('home-logo');
    if (homeButton) {
        homeButton.addEventListener('click', function() {
            // Only show homepage if we're not already creating a new scenario
            if (!window.location.href.includes('scenario-creation.html')) {
                if (window.homepage && window.homepage.show) {
                    window.homepage.show();
                } else {
                    // Fallback if homepage.show isn't available
                    const homepage = document.getElementById('homepage');
                    const chatInterface = document.getElementById('chat-interface');
                    const welcomeScreen = document.getElementById('welcome-screen');
                    
                    if (homepage) homepage.classList.remove('hidden');
                    if (chatInterface) chatInterface.classList.add('hidden');
                    if (welcomeScreen) welcomeScreen.classList.add('hidden');
                }
            }
        });
    }
});

// Make the homepage functions available to other modules
window.homepage = {
    show: showHomepage,
    init: initHomepage,
    startChat: startChatWithCharacter,
    playScenario: playScenario,
    scrollHomepage: scrollHomepage
};
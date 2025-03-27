/**
 * appDebugger.js - Comprehensive Application Debugging Tool
 * 
 * This script provides debugging capabilities for all aspects of the application:
 * - State management monitoring
 * - DOM element tracking
 * - Event flow visualization
 * - Function call tracing
 * - Storage monitoring
 * - API call tracking
 * - Performance metrics
 * 
 * HOW TO USE:
 * 1. Add this script to your HTML after all other scripts
 * 2. Press Ctrl+Shift+D to open the debug panel
 * 3. Use the tabs to explore different aspects of the application
 * 4. Try various fixes for identified issues
 */

(function() {
    'use strict';
    
    // ====================================================
    // Configuration
    // ====================================================
    const config = {
        startMinimized: false,        // Start with minimized panel
        showPanelByDefault: true,     // Show debug panel by default
        maxLogEntries: 500,           // Maximum number of log entries to keep
        autoRefreshRate: 1000,        // Auto-refresh rate in milliseconds
        autoRefreshEnabled: true,     // Enable auto-refresh by default
        monitorAPIRequests: true,     // Monitor and log API requests
        captureExceptions: true,      // Capture and log uncaught exceptions
        showPerformanceMetrics: true, // Show performance metrics
        includeTechnicalDetails: true // Include technical details in logs
    };
    
    // ====================================================
    // State Variables
    // ====================================================
    const state = {
        initialized: false,
        activeTab: 'overview',
        activeFixes: [],
        refreshInterval: null,
        isMinimized: config.startMinimized,
        isPaused: false,
        
        // Logs and metrics
        logs: [],
        metrics: {
            functionCalls: {},
            eventCounts: {},
            apiRequests: [],
            domUpdates: 0,
            errorCount: 0,
            warningCount: 0
        },
        
        // Tracked objects and functions
        originalFunctions: {}, // Store original functions for restoration
        trackedObjects: {},    // References to tracked objects
        trackedModules: [],    // List of module names being tracked
        
        // Captured state snapshots for comparison
        snapshots: {
            application: [],  // Application state snapshots
            ui: [],           // UI state snapshots
            storage: []       // Local/session storage snapshots
        },
        
        // DOM element references
        elements: {
            main: {},   // Main application elements
            chat: {},   // Chat interface elements
            sidebar: {}, // Sidebar elements
            modals: {},  // Modal elements
            player: {},  // Player action system elements 
            other: {}    // Other important elements
        }
    };
    
    // ====================================================
    // Core Debug Functions
    // ====================================================
    
    /**
     * Initialize the debugger
     */
    function init() {
        if (state.initialized) return;
        
        log('SYSTEM', 'Initializing Application Debugger...');
        
        // Set up UI
        createDebugPanel();
        setupEventListeners();
        
        // Capture application objects
        captureApplicationState();
        
        // Set up monitoring
        setupMonitoring();
        
        // Set up scheduled tasks
        if (config.autoRefreshEnabled) {
            startAutoRefresh();
        }
        
        state.initialized = true;
        log('SYSTEM', 'Application Debugger initialized successfully');
    }
    
    /**
     * Log a message to the debugger console
     * @param {string} category - Log category
     * @param {string} message - Log message
     * @param {Object} data - Additional data
     */
    function log(category, message, data = null) {
        const timestamp = new Date();
        const entry = {
            id: Date.now() + Math.random().toString(36).substr(2, 5),
            timestamp,
            category,
            message,
            data
        };
        
        // Add to logs
        state.logs.unshift(entry);
        
        // Trim logs if needed
        if (state.logs.length > config.maxLogEntries) {
            state.logs = state.logs.slice(0, config.maxLogEntries);
        }
        
        // Update metrics
        if (category === 'ERROR') state.metrics.errorCount++;
        if (category === 'WARNING') state.metrics.warningCount++;
        
        // Log to console if not a routine update
        if (category !== 'UPDATE' && category !== 'METRIC') {
            if (data) {
                console.groupCollapsed(`[AppDebugger] ${category}: ${message}`);
                console.log(message);
                console.log('Data:', data);
                console.groupEnd();
            } else {
                console.log(`[AppDebugger] ${category}: ${message}`);
            }
        }
        
        // Update UI if debug panel is visible
        if (document.getElementById('app-debugger-panel') && 
            !document.getElementById('app-debugger-panel').classList.contains('hidden')) {
            updateLogDisplay();
        }
    }
    
    /**
     * Take a snapshot of the current application state
     */
    function takeSnapshot() {
        try {
            // Application state snapshot
            const appStateSnapshot = {};
            
            // Capture window state object if it exists
            if (window.state) {
                appStateSnapshot.appState = cloneObject(window.state);
            }
            
            // Capture player action state if it exists
            if (window.playerActionState) {
                appStateSnapshot.playerActionState = cloneObject(window.playerActionState);
            }
            
            // Capture current character if it exists
            if (window.state && window.state.currentCharacter) {
                appStateSnapshot.currentCharacter = cloneObject(window.state.currentCharacter);
            }
            
            // Add time
            appStateSnapshot.time = new Date().toISOString();
            appStateSnapshot.timestamp = Date.now();
            
            // Add to snapshots
            state.snapshots.application.push(appStateSnapshot);
            
            // Trim snapshots if needed
            if (state.snapshots.application.length > 10) {
                state.snapshots.application.shift();
            }
            
            // Take storage snapshot
            const storageSnapshot = {
                localStorage: {},
                sessionStorage: {},
                timestamp: Date.now()
            };
            
            // Capture localStorage
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                storageSnapshot.localStorage[key] = localStorage.getItem(key);
            }
            
            // Capture sessionStorage
            for (let i = 0; i < sessionStorage.length; i++) {
                const key = sessionStorage.key(i);
                storageSnapshot.sessionStorage[key] = sessionStorage.getItem(key);
            }
            
            // Add to snapshots
            state.snapshots.storage.push(storageSnapshot);
            
            // Trim snapshots if needed
            if (state.snapshots.storage.length > 10) {
                state.snapshots.storage.shift();
            }
            
            // Log snapshot
            log('SNAPSHOT', 'Application state snapshot taken', {
                snapshotTime: appStateSnapshot.time,
                snapshotCount: state.snapshots.application.length
            });
            
            return true;
        } catch (error) {
            log('ERROR', 'Failed to take application snapshot', error);
            return false;
        }
    }
    
    /**
     * Apply a specific fix 
     * @param {string} fixId - ID of the fix to apply
     * @param {Object} options - Fix options
     */
    function applyFix(fixId, options = {}) {
        // Check if fix is already applied
        if (state.activeFixes.includes(fixId)) {
            log('WARNING', `Fix "${fixId}" is already applied`);
            return false;
        }
        
        log('FIX', `Applying fix: ${fixId}`, options);
        
        let success = false;
        
        switch (fixId) {
            case 'fix-send-button':
                success = fixSendButton(options);
                break;
                
            case 'fix-input-mode':
                success = fixInputMode(options);
                break;
                
            case 'fix-message-functions':
                success = fixMessageFunctions(options);
                break;
                
            case 'fix-event-handlers':
                success = fixEventHandlers(options);
                break;
                
            case 'fix-global-references':
                success = fixGlobalReferences(options);
                break;
                
            case 'restore-broken-properties':
                success = restoreBrokenProperties(options);
                break;
                
            default:
                log('ERROR', `Unknown fix ID: ${fixId}`);
                return false;
        }
        
        if (success) {
            state.activeFixes.push(fixId);
            updateFixesDisplay();
            log('SUCCESS', `Fix "${fixId}" applied successfully`);
            return true;
        } else {
            log('ERROR', `Failed to apply fix "${fixId}"`);
            return false;
        }
    }
    
    /**
     * Remove a specific fix
     * @param {string} fixId - ID of the fix to remove
     */
    function removeFix(fixId) {
        const index = state.activeFixes.indexOf(fixId);
        if (index === -1) {
            log('WARNING', `Fix "${fixId}" is not currently applied`);
            return false;
        }
        
        log('FIX', `Removing fix: ${fixId}`);
        
        let success = false;
        
        switch (fixId) {
            case 'fix-send-button':
                success = undoFixSendButton();
                break;
                
            case 'fix-input-mode':
                success = undoFixInputMode();
                break;
                
            case 'fix-message-functions':
                success = undoFixMessageFunctions();
                break;
                
            case 'fix-event-handlers':
                success = undoFixEventHandlers();
                break;
                
            case 'fix-global-references':
                success = undoFixGlobalReferences();
                break;
                
            case 'restore-broken-properties':
                success = undoRestoreBrokenProperties();
                break;
                
            default:
                log('ERROR', `Unknown fix ID: ${fixId}`);
                return false;
        }
        
        if (success) {
            state.activeFixes.splice(index, 1);
            updateFixesDisplay();
            log('SUCCESS', `Fix "${fixId}" removed successfully`);
            return true;
        } else {
            log('ERROR', `Failed to remove fix "${fixId}"`);
            return false;
        }
    }
    
    /**
     * Remove all active fixes
     */
    function removeAllFixes() {
        const activeFixes = [...state.activeFixes];
        let allSuccess = true;
        
        activeFixes.forEach(fixId => {
            const success = removeFix(fixId);
            if (!success) allSuccess = false;
        });
        
        return allSuccess;
    }
    
    // ====================================================
    // Fix Implementations
    // ====================================================
    
    /**
     * Fix for send button issues
     */
    function fixSendButton(options = {}) {
        try {
            // Find all send buttons
            const sendButtons = document.querySelectorAll('button#send-btn, .send-btn');
            if (sendButtons.length === 0) {
                log('ERROR', 'No send buttons found');
                return false;
            }
            
            // Track original handlers if possible
            sendButtons.forEach((button, index) => {
                // Store original click handler
                if (!state.originalFunctions[`sendButton_${index}`]) {
                    state.originalFunctions[`sendButton_${index}_onclick`] = button.onclick;
                }
                
                // Create a new button to replace the current one
                const newButton = button.cloneNode(false);
                
                // Add content from original button
                newButton.innerHTML = button.innerHTML;
                
                // Add direct click handler
                newButton.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    log('CLICK', `Send button ${index} clicked via fix handler`);
                    
                    // Find the active message input
                    const messageInput = document.querySelector('textarea#message-input:not([disabled])') || 
                                       document.querySelector('.chat-input:not([disabled])');
                    
                    if (!messageInput) {
                        log('ERROR', 'No active message input found');
                        return;
                    }
                    
                    const messageText = messageInput.value.trim();
                    if (!messageText) return;
                    
                    // Determine the correct function to call
                    if (window.sendMessage && typeof window.sendMessage === 'function') {
                        log('DEBUG', 'Calling window.sendMessage()');
                        window.sendMessage();
                    } else if (window.originalSendMessage && typeof window.originalSendMessage === 'function') {
                        log('DEBUG', 'Calling window.originalSendMessage()');
                        window.originalSendMessage();
                    } else {
                        // Create a basic sendMessage function if none exists
                        log('WARNING', 'No send message function found, creating basic implementation');
                        
                        // Clear input
                        messageInput.value = '';
                        messageInput.style.height = 'auto';
                        
                        // Add user message to UI
                        const chatMessages = document.getElementById('chat-messages');
                        if (chatMessages) {
                            const messageDiv = document.createElement('div');
                            messageDiv.className = 'message message-user';
                            messageDiv.innerHTML = `
                                <div class="message-avatar">
                                    <i class="fas fa-user"></i>
                                </div>
                                <div class="message-bubble">
                                    <div class="message-text">${messageText}</div>
                                    <div class="message-metadata">
                                        ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            `;
                            chatMessages.appendChild(messageDiv);
                            chatMessages.scrollTop = chatMessages.scrollHeight;
                            
                            log('SUCCESS', 'Added message to UI via fallback implementation');
                        }
                    }
                });
                
                // Replace the original button with our new one
                if (button.parentNode) {
                    button.parentNode.replaceChild(newButton, button);
                    log('DEBUG', `Replaced send button ${index} with fixed version`);
                } else {
                    log('WARNING', `Send button ${index} has no parent node`);
                }
            });
            
            log('SUCCESS', `Fixed ${sendButtons.length} send buttons with direct handlers`);
            return true;
        } catch (error) {
            log('ERROR', 'Failed to fix send button', error);
            return false;
        }
    }
    
    /**
     * Undo the send button fix
     */
    function undoFixSendButton() {
        try {
            // Find all current send buttons
            const sendButtons = document.querySelectorAll('button#send-btn, .send-btn');
            
            // We can't restore original buttons, but we can remove our direct handlers
            sendButtons.forEach((button, index) => {
                // Create a new button without our handlers
                const newButton = button.cloneNode(false);
                newButton.innerHTML = button.innerHTML;
                
                // Restore original onclick if we had one
                if (state.originalFunctions[`sendButton_${index}_onclick`]) {
                    newButton.onclick = state.originalFunctions[`sendButton_${index}_onclick`];
                }
                
                // Replace our fixed button
                if (button.parentNode) {
                    button.parentNode.replaceChild(newButton, button);
                }
            });
            
            log('SUCCESS', 'Removed send button fix');
            return true;
        } catch (error) {
            log('ERROR', 'Failed to remove send button fix', error);
            return false;
        }
    }
    
    /**
     * Fix input mode issues
     */
    function fixInputMode(options = {}) {
        try {
            // Set input mode to 'speak' in localStorage
            const currentMode = localStorage.getItem('inputMode');
            state.originalFunctions.originalInputMode = currentMode;
            
            localStorage.setItem('inputMode', 'speak');
            log('DEBUG', `Set input mode to 'speak' (was '${currentMode}')`);
            
            // Update input mode in playerActionState if it exists
            if (window.playerActionState) {
                window.playerActionState.inputMode = 'speak';
                log('DEBUG', 'Updated playerActionState.inputMode to speak');
            }
            
            // Call the setInputMode function if it exists
            if (window.playerActionSystem && typeof window.playerActionSystem.setInputMode === 'function') {
                window.playerActionSystem.setInputMode('speak');
                log('DEBUG', 'Called playerActionSystem.setInputMode("speak")');
            }
            
            log('SUCCESS', 'Fixed input mode to "speak"');
            return true;
        } catch (error) {
            log('ERROR', 'Failed to fix input mode', error);
            return false;
        }
    }
    
    /**
     * Undo the input mode fix
     */
    function undoFixInputMode() {
        try {
            if (state.originalFunctions.originalInputMode) {
                localStorage.setItem('inputMode', state.originalFunctions.originalInputMode);
                
                // Update input mode in playerActionState if it exists
                if (window.playerActionState) {
                    window.playerActionState.inputMode = state.originalFunctions.originalInputMode;
                }
                
                // Call the setInputMode function if it exists
                if (window.playerActionSystem && typeof window.playerActionSystem.setInputMode === 'function') {
                    window.playerActionSystem.setInputMode(state.originalFunctions.originalInputMode);
                }
                
                log('SUCCESS', `Restored input mode to "${state.originalFunctions.originalInputMode}"`);
            } else {
                // If we don't have the original, default to 'speak'
                localStorage.setItem('inputMode', 'speak');
                log('WARNING', 'Original input mode not found, defaulted to "speak"');
            }
            
            return true;
        } catch (error) {
            log('ERROR', 'Failed to undo input mode fix', error);
            return false;
        }
    }
    
    /**
     * Fix message function issues
     */
    function fixMessageFunctions(options = {}) {
        try {
            // Store original functions
            if (window.sendMessage) {
                state.originalFunctions.sendMessage = window.sendMessage;
            }
            
            if (window.originalSendMessage) {
                state.originalFunctions.originalSendMessage = window.originalSendMessage;
            }
            
            // Create a proper sendMessage function if it doesn't exist or is broken
            window.sendMessage = function() {
                log('FUNCTION', 'sendMessage called via fix');
                
                // Get the active message input
                const messageInput = document.querySelector('textarea#message-input:not([disabled])') || 
                                   document.querySelector('.chat-input:not([disabled])');
                
                if (!messageInput) {
                    log('ERROR', 'No active message input found');
                    return;
                }
                
                const messageText = messageInput.value.trim();
                if (!messageText) return;
                
                // Attempt to use the original function if it existed
                if (state.originalFunctions.sendMessage && typeof state.originalFunctions.sendMessage === 'function') {
                    try {
                        return state.originalFunctions.sendMessage();
                    } catch (error) {
                        log('ERROR', 'Original sendMessage function failed', error);
                        // Continue with fallback implementation
                    }
                }
                
                // If original function failed or didn't exist, use our implementation
                log('DEBUG', 'Using fallback sendMessage implementation');
                
                // Clear input
                messageInput.value = '';
                messageInput.style.height = 'auto';
                
                // Add user message to UI
                const chatMessages = document.getElementById('chat-messages');
                if (chatMessages) {
                    const messageDiv = document.createElement('div');
                    messageDiv.className = 'message message-user';
                    messageDiv.innerHTML = `
                        <div class="message-avatar">
                            <i class="fas fa-user"></i>
                        </div>
                        <div class="message-bubble">
                            <div class="message-text">${messageText}</div>
                            <div class="message-metadata">
                                ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>
                    `;
                    chatMessages.appendChild(messageDiv);
                    chatMessages.scrollTop = chatMessages.scrollHeight;
                    
                    log('SUCCESS', 'Added message to UI via fallback implementation');
                    
                    // Show a reply from the AI if we're in an isolated test
                    if (options.generateFakeResponse) {
                        setTimeout(() => {
                            const replyDiv = document.createElement('div');
                            replyDiv.className = 'message message-character';
                            replyDiv.innerHTML = `
                                <div class="message-avatar">
                                    <i class="fas fa-robot"></i>
                                </div>
                                <div class="message-bubble">
                                    <div class="message-text">This is a simulated response from the debugger. The actual AI response functionality may still need to be fixed.</div>
                                    <div class="message-metadata">
                                        ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            `;
                            chatMessages.appendChild(replyDiv);
                            chatMessages.scrollTop = chatMessages.scrollHeight;
                        }, 1000);
                    }
                }
            };
            
            // Set the original reference as well
            window.originalSendMessage = window.sendMessage;
            
            log('SUCCESS', 'Fixed message functions');
            return true;
        } catch (error) {
            log('ERROR', 'Failed to fix message functions', error);
            return false;
        }
    }
    
    /**
     * Undo the message functions fix
     */
    function undoFixMessageFunctions() {
        try {
            // Restore original functions if they existed
            if (state.originalFunctions.sendMessage) {
                window.sendMessage = state.originalFunctions.sendMessage;
                log('DEBUG', 'Restored original sendMessage function');
            } else {
                delete window.sendMessage;
                log('DEBUG', 'Removed sendMessage function');
            }
            
            if (state.originalFunctions.originalSendMessage) {
                window.originalSendMessage = state.originalFunctions.originalSendMessage;
                log('DEBUG', 'Restored original originalSendMessage function');
            } else {
                delete window.originalSendMessage;
                log('DEBUG', 'Removed originalSendMessage function');
            }
            
            log('SUCCESS', 'Removed message functions fix');
            return true;
        } catch (error) {
            log('ERROR', 'Failed to remove message functions fix', error);
            return false;
        }
    }
    
    /**
     * Fix event handler issues
     */
    function fixEventHandlers(options = {}) {
        try {
            // The implementation depends on the specific issues found
            // This is a general approach to fix common event handler problems
            
            // 1. Fix input keydown handlers for Enter key
            const messageInputs = document.querySelectorAll('textarea#message-input, .chat-input');
            messageInputs.forEach((input, index) => {
                // Store original event handlers if possible
                // (Not always possible to access attached handlers)
                
                // Remove existing event listeners by cloning
                const newInput = input.cloneNode(true);
                if (input.parentNode) {
                    input.parentNode.replaceChild(newInput, input);
                }
                
                // Add proper keydown handler
                newInput.addEventListener('keydown', function(e) {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        log('EVENT', `Enter key pressed in input ${index}`);
                        
                        // Use the fixed sendMessage function
                        if (window.sendMessage && typeof window.sendMessage === 'function') {
                            window.sendMessage();
                        }
                    }
                });
                
                log('DEBUG', `Fixed keydown handler for input ${index}`);
            });
            
            // 2. Fix conflicting event handlers by reassigning priorities
            // This is just a placeholder for app-specific fixes
            
            log('SUCCESS', 'Fixed event handlers');
            return true;
        } catch (error) {
            log('ERROR', 'Failed to fix event handlers', error);
            return false;
        }
    }
    
    /**
     * Undo the event handlers fix
     */
    function undoFixEventHandlers() {
        try {
            // This isn't possible to fully revert since we replaced elements
            // But we can try to minimize our impact
            
            log('WARNING', 'Cannot fully restore original event handlers');
            return true;
        } catch (error) {
            log('ERROR', 'Failed to remove event handlers fix', error);
            return false;
        }
    }
    
    /**
     * Fix global reference issues
     */
    function fixGlobalReferences(options = {}) {
        try {
            // Store any existing references we'll modify
            ['sendMessage', 'state', 'elements', 'API'].forEach(name => {
                if (window[name]) {
                    state.originalFunctions[`global_${name}`] = window[name];
                }
            });
            
            // Check for the state object
            if (!window.state && window.app && window.app.state) {
                window.state = window.app.state;
                log('DEBUG', 'Exposed app.state as window.state');
            }
            
            // Check for the elements object
            if (!window.elements && window.app && window.app.elements) {
                window.elements = window.app.elements;
                log('DEBUG', 'Exposed app.elements as window.elements');
            }
            
            // Check for API object
            if (!window.API && window.app && window.app.API) {
                window.API = window.app.API;
                log('DEBUG', 'Exposed app.API as window.API');
            }
            
            log('SUCCESS', 'Fixed global references');
            return true;
        } catch (error) {
            log('ERROR', 'Failed to fix global references', error);
            return false;
        }
    }
    
    /**
     * Undo the global references fix
     */
    function undoFixGlobalReferences() {
        try {
            // Restore original references
            ['sendMessage', 'state', 'elements', 'API'].forEach(name => {
                const originalRef = state.originalFunctions[`global_${name}`];
                if (originalRef !== undefined) {
                    window[name] = originalRef;
                    log('DEBUG', `Restored original window.${name}`);
                } else {
                    delete window[name];
                    log('DEBUG', `Removed window.${name}`);
                }
            });
            
            log('SUCCESS', 'Removed global references fix');
            return true;
        } catch (error) {
            log('ERROR', 'Failed to remove global references fix', error);
            return false;
        }
    }
    
    /**
     * Restore broken properties
     */
    function restoreBrokenProperties(options = {}) {
        try {
            // Take a snapshot first
            takeSnapshot();
            
            // Handle common broken properties
            
            // 1. Chat message container visibility
            const chatInterface = document.querySelector('.chat-interface');
            const welcomeScreen = document.getElementById('welcome-screen');
            
            if (chatInterface && chatInterface.classList.contains('hidden') && 
                window.state && window.state.currentCharacter) {
                // If we have a current character but chat is hidden, fix it
                chatInterface.classList.remove('hidden');
                if (welcomeScreen) welcomeScreen.classList.add('hidden');
                log('DEBUG', 'Restored chat interface visibility');
            }
            
            // 2. Input mode indicator
            const inputModeIndicator = document.querySelector('.input-mode-indicator');
            const currentMode = localStorage.getItem('inputMode') || 'speak';
            
            if (inputModeIndicator) {
                const currentModeSpan = inputModeIndicator.querySelector('#current-mode');
                if (currentModeSpan) {
                    if (currentMode === 'speak') {
                        currentModeSpan.textContent = 'Speaking';
                        inputModeIndicator.classList.remove('act-mode');
                    } else {
                        currentModeSpan.textContent = 'Acting';
                        inputModeIndicator.classList.add('act-mode');
                    }
                    log('DEBUG', 'Updated input mode indicator');
                }
            }
            
            // 3. Message input placeholder
            const messageInputs = document.querySelectorAll('textarea#message-input, .chat-input');
            messageInputs.forEach(input => {
                if (currentMode === 'speak') {
                    input.placeholder = 'Type your message...';
                    input.classList.remove('act-mode');
                } else {
                    input.placeholder = 'Describe your action...';
                    input.classList.add('act-mode');
                }
            });
            
            // 4. Toggle correct tab in settings
            if (window.state && window.state.ui && window.state.ui.currentTab) {
                const tabs = document.querySelectorAll('.tab');
                tabs.forEach(tab => {
                    if (tab.getAttribute('data-tab') === window.state.ui.currentTab) {
                        tab.classList.add('active');
                    } else {
                        tab.classList.remove('active');
                    }
                });
                
                log('DEBUG', `Restored active tab: ${window.state.ui.currentTab}`);
            }
            
            log('SUCCESS', 'Restored broken properties');
            return true;
        } catch (error) {
            log('ERROR', 'Failed to restore broken properties', error);
            return false;
        }
    }
    
    /**
     * Undo restoration of broken properties 
     */
    function undoRestoreBrokenProperties() {
        try {
            // Since this fix just restores correct state,
            // we don't really need to undo anything
            log('WARNING', 'No changes to undo for property restoration');
            return true;
        } catch (error) {
            log('ERROR', 'Failed to undo property restoration', error);
            return false;
        }
    }
    
    // ====================================================
    // UI Functions
    // ====================================================
    
    /**
     * Create the debug panel UI
     */
    function createDebugPanel() {
        // Create main container
        const panel = document.createElement('div');
        panel.id = 'app-debugger-panel';
        panel.className = state.isMinimized ? 'minimized' : '';
        if (!config.showPanelByDefault) {
            panel.classList.add('hidden');
        }
        
        // Create panel HTML
        panel.innerHTML = `
            <div class="debugger-header">
                <div class="debugger-controls">
                    <button id="debugger-minimize" title="Minimize">_</button>
                    <button id="debugger-close" title="Close">×</button>
                </div>
                <h2>Application Debugger</h2>
            </div>
            
            <div class="debugger-tabs">
                <button class="tab-button active" data-tab="overview">Overview</button>
                <button class="tab-button" data-tab="state">State</button>
                <button class="tab-button" data-tab="elements">Elements</button>
                <button class="tab-button" data-tab="events">Events</button>
                <button class="tab-button" data-tab="storage">Storage</button>
                <button class="tab-button" data-tab="fixes">Fixes</button>
                <button class="tab-button" data-tab="logs">Logs</button>
            </div>
            
            <div class="debugger-content">
                <!-- Overview Tab -->
                <div class="tab-content active" id="tab-overview">
                    <div class="overview-grid">
                        <div class="metric-card">
                            <h3>Application Status</h3>
                            <div id="app-status">Loading...</div>
                        </div>
                        <div class="metric-card">
                            <h3>Quick Actions</h3>
                            <div class="action-buttons">
                                <button id="action-fix-send-btn">Fix Send Button</button>
                                <button id="action-fix-input-mode">Fix Input Mode</button>
                                <button id="action-take-snapshot">Take Snapshot</button>
                            </div>
                        </div>
                        <div class="metric-card">
                            <h3>Error Summary</h3>
                            <div id="error-summary">No errors detected</div>
                        </div>
                        <div class="metric-card">
                            <h3>Chat Status</h3>
                            <div id="chat-status">Loading...</div>
                        </div>
                        <div class="metric-card full-width">
                            <h3>Active Modules</h3>
                            <div id="active-modules">Loading...</div>
                        </div>
                    </div>
                </div>
                
                <!-- State Tab -->
                <div class="tab-content" id="tab-state">
                    <div class="state-controls">
                        <button id="refresh-state">Refresh State</button>
                        <button id="compare-snapshots">Compare Snapshots</button>
                    </div>
                    <div class="state-grid">
                        <div class="state-section">
                            <h3>Application State</h3>
                            <div id="application-state" class="json-viewer">Loading...</div>
                        </div>
                        <div class="state-section">
                            <h3>Current Character</h3>
                            <div id="current-character" class="json-viewer">Loading...</div>
                        </div>
                        <div class="state-section">
                            <h3>UI State</h3>
                            <div id="ui-state" class="json-viewer">Loading...</div>
                        </div>
                        <div class="state-section">
                            <h3>Player Action State</h3>
                            <div id="player-action-state" class="json-viewer">Loading...</div>
                        </div>
                    </div>
                </div>
                
                <!-- Elements Tab -->
                <div class="tab-content" id="tab-elements">
                    <div class="elements-search">
                        <input type="text" id="element-search" placeholder="Search elements...">
                        <button id="inspect-elements">Inspect All Elements</button>
                    </div>
                    <div class="elements-grid">
                        <div class="elements-section">
                            <h3>Chat Interface</h3>
                            <div id="chat-elements" class="element-list">Loading...</div>
                        </div>
                        <div class="elements-section">
                            <h3>Sidebar</h3>
                            <div id="sidebar-elements" class="element-list">Loading...</div>
                        </div>
                        <div class="elements-section">
                            <h3>Modals</h3>
                            <div id="modal-elements" class="element-list">Loading...</div>
                        </div>
                        <div class="elements-section">
                            <h3>Player System</h3>
                            <div id="player-elements" class="element-list">Loading...</div>
                        </div>
                    </div>
                    <div class="element-details">
                        <h3>Element Details</h3>
                        <div id="element-details">Select an element to see details</div>
                    </div>
                </div>
                
                <!-- Events Tab -->
                <div class="tab-content" id="tab-events">
                    <div class="events-controls">
                        <button id="clear-events">Clear Events</button>
                        <label>
                            <input type="checkbox" id="track-events" checked>
                            Track Events
                        </label>
                    </div>
                    <div class="events-list" id="events-list">
                        No events recorded yet
                    </div>
                </div>
                
                <!-- Storage Tab -->
                <div class="tab-content" id="tab-storage">
                    <div class="storage-controls">
                        <button id="refresh-storage">Refresh Storage</button>
                        <button id="clear-local-storage">Clear LocalStorage</button>
                    </div>
                    <div class="storage-sections">
                        <div class="storage-section">
                            <h3>LocalStorage</h3>
                            <div id="local-storage" class="storage-list">Loading...</div>
                        </div>
                        <div class="storage-section">
                            <h3>SessionStorage</h3>
                            <div id="session-storage" class="storage-list">Loading...</div>
                        </div>
                    </div>
                </div>
                
                <!-- Fixes Tab -->
                <div class="tab-content" id="tab-fixes">
                    <div class="fixes-controls">
                        <button id="remove-all-fixes">Remove All Fixes</button>
                    </div>
                    <div class="fixes-list">
                        <div class="fix-item">
                            <h3>Send Button Fix</h3>
                            <p>Fixes issues with the send button not responding to clicks</p>
                            <button class="apply-fix" data-fix="fix-send-button">Apply Fix</button>
                        </div>
                        <div class="fix-item">
                            <h3>Input Mode Fix</h3>
                            <p>Resets input mode to "speak" mode to avoid action mode issues</p>
                            <button class="apply-fix" data-fix="fix-input-mode">Apply Fix</button>
                        </div>
                        <div class="fix-item">
                            <h3>Message Functions Fix</h3>
                            <p>Creates or repairs the sendMessage function</p>
                            <button class="apply-fix" data-fix="fix-message-functions">Apply Fix</button>
                        </div>
                        <div class="fix-item">
                            <h3>Event Handlers Fix</h3>
                            <p>Fixes issues with event handlers being overridden or conflicting</p>
                            <button class="apply-fix" data-fix="fix-event-handlers">Apply Fix</button>
                        </div>
                        <div class="fix-item">
                            <h3>Global References Fix</h3>
                            <p>Exposes necessary global references that might be missing</p>
                            <button class="apply-fix" data-fix="fix-global-references">Apply Fix</button>
                        </div>
                        <div class="fix-item">
                            <h3>Restore Broken Properties</h3>
                            <p>Restores various UI states and properties to their correct values</p>
                            <button class="apply-fix" data-fix="restore-broken-properties">Apply Fix</button>
                        </div>
                    </div>
                    <div class="active-fixes">
                        <h3>Active Fixes</h3>
                        <div id="active-fixes-list">None</div>
                    </div>
                </div>
                
                <!-- Logs Tab -->
                <div class="tab-content" id="tab-logs">
                    <div class="logs-controls">
                        <button id="clear-logs">Clear Logs</button>
                        <select id="log-filter">
                            <option value="all">All Logs</option>
                            <option value="error">Errors Only</option>
                            <option value="warning">Warnings & Errors</option>
                            <option value="fix">Fixes Only</option>
                            <option value="system">System Only</option>
                        </select>
                    </div>
                    <div class="logs-list" id="logs-list">
                        No logs yet
                    </div>
                </div>
            </div>
            
            <div class="debugger-footer">
                <div class="footer-status">Status: <span id="debugger-status">Initializing...</span></div>
                <div class="footer-controls">
                    <button id="refresh-debugger" title="Refresh Data">↻</button>
                    <button id="toggle-auto-refresh" title="Toggle Auto-Refresh">⟳</button>
                </div>
            </div>
            
            <div class="debugger-handle">Debugger</div>
        `;
        
        // Add styles
        const styles = document.createElement('style');
        styles.id = 'app-debugger-styles';
        styles.textContent = `
            #app-debugger-panel {
                position: fixed;
                top: 0;
                right: 0;
                width: 600px;
                height: 100vh;
                background: rgba(0, 0, 0, 0.85);
                color: #00ff00;
                font-family: monospace;
                font-size: 12px;
                z-index: 9999;
                display: flex;
                flex-direction: column;
                box-shadow: -5px 0 15px rgba(0, 0, 0, 0.5);
                transition: transform 0.3s, width 0.3s;
                overflow: hidden;
            }
            
            #app-debugger-panel.hidden {
                display: none;
            }
            
            #app-debugger-panel.minimized {
                transform: translateX(calc(100% - 30px));
            }
            
            .debugger-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px;
                background: #111;
                border-bottom: 1px solid #333;
            }
            
            .debugger-header h2 {
                margin: 0;
                font-size: 16px;
                color: #00ff00;
            }
            
            .debugger-controls {
                display: flex;
            }
            
            .debugger-controls button {
                background: none;
                border: 1px solid #333;
                color: #00ff00;
                width: 24px;
                height: 24px;
                margin-left: 5px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 16px;
            }
            
            .debugger-tabs {
                display: flex;
                background: #111;
                border-bottom: 1px solid #333;
                overflow-x: auto;
            }
            
            .tab-button {
                background: none;
                border: none;
                color: #aaa;
                padding: 8px 12px;
                cursor: pointer;
                border-right: 1px solid #333;
                white-space: nowrap;
            }
            
            .tab-button.active {
                background: #222;
                color: #00ff00;
                border-bottom: 2px solid #00ff00;
            }
            
            .debugger-content {
                flex: 1;
                overflow-y: auto;
                position: relative;
            }
            
            .tab-content {
                display: none;
                padding: 15px;
                height: 100%;
                overflow-y: auto;
            }
            
            .tab-content.active {
                display: block;
            }
            
            .debugger-footer {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px 10px;
                background: #111;
                border-top: 1px solid #333;
                font-size: 11px;
            }
            
            .footer-controls button {
                background: none;
                border: 1px solid #333;
                color: #00ff00;
                width: 20px;
                height: 20px;
                margin-left: 5px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .debugger-handle {
                position: absolute;
                left: 0;
                top: 50%;
                transform: translateY(-50%) rotate(-90deg);
                transform-origin: left top;
                background: #111;
                padding: 5px 10px;
                cursor: pointer;
                border: 1px solid #333;
                border-bottom: none;
                border-radius: 0 0 5px 5px;
                color: #00ff00;
                white-space: nowrap;
            }
            
            /* Overview tab */
            .overview-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 15px;
                margin-bottom: 15px;
            }
            
            .full-width {
                grid-column: 1 / -1;
            }
            
            .metric-card {
                background: rgba(0, 0, 0, 0.3);
                border: 1px solid #333;
                border-radius: 5px;
                padding: 12px;
            }
            
            .metric-card h3 {
                margin-top: 0;
                margin-bottom: 10px;
                font-size: 14px;
                color: #00ffaa;
            }
            
            .action-buttons {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
            }
            
            .action-buttons button {
                background: #222;
                color: #00ff00;
                border: 1px solid #333;
                padding: 5px 10px;
                border-radius: 3px;
                cursor: pointer;
            }
            
            /* State tab */
            .state-controls {
                display: flex;
                margin-bottom: 10px;
                gap: 10px;
            }
            
            .state-controls button {
                background: #222;
                color: #00ff00;
                border: 1px solid #333;
                padding: 5px 10px;
                border-radius: 3px;
                cursor: pointer;
            }
            
            .state-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 15px;
            }
            
            .state-section {
                background: rgba(0, 0, 0, 0.3);
                border: 1px solid #333;
                border-radius: 5px;
                padding: 12px;
                margin-bottom: 15px;
            }
            
            .state-section h3 {
                margin-top: 0;
                margin-bottom: 10px;
                font-size: 14px;
                color: #00ffaa;
            }
            
            .json-viewer {
                max-height: 300px;
                overflow: auto;
                background: #111;
                padding: 10px;
                border-radius: 3px;
                font-family: monospace;
                font-size: 11px;
                white-space: pre-wrap;
            }
            
            /* Elements tab */
            .elements-search {
                display: flex;
                margin-bottom: 15px;
                gap: 10px;
            }
            
            .elements-search input {
                flex: 1;
                background: #222;
                color: #fff;
                border: 1px solid #333;
                padding: 5px 10px;
                border-radius: 3px;
            }
            
            .elements-search button {
                background: #222;
                color: #00ff00;
                border: 1px solid #333;
                padding: 5px 10px;
                border-radius: 3px;
                cursor: pointer;
            }
            
            .elements-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 15px;
                margin-bottom: 15px;
            }
            
            .elements-section {
                background: rgba(0, 0, 0, 0.3);
                border: 1px solid #333;
                border-radius: 5px;
                padding: 12px;
            }
            
            .elements-section h3 {
                margin-top: 0;
                margin-bottom: 10px;
                font-size: 14px;
                color: #00ffaa;
            }
            
            .element-list {
                max-height: 150px;
                overflow: auto;
                background: #111;
                padding: 10px;
                border-radius: 3px;
            }
            
            .element-list-item {
                padding: 3px;
                cursor: pointer;
                border-bottom: 1px solid #333;
            }
            
            .element-list-item:hover {
                background: #222;
            }
            
            .element-details {
                background: rgba(0, 0, 0, 0.3);
                border: 1px solid #333;
                border-radius: 5px;
                padding: 12px;
            }
            
            .element-details h3 {
                margin-top: 0;
                margin-bottom: 10px;
                font-size: 14px;
                color: #00ffaa;
            }
            
            #element-details {
                max-height: 200px;
                overflow: auto;
                background: #111;
                padding: 10px;
                border-radius: 3px;
            }
            
            .element-property {
                margin-bottom: 5px;
            }
            
            .element-property.error {
                color: #ff5555;
            }
            
            .success {
                color: #55ff55;
            }
            
            .error {
                color: #ff5555;
            }
            
            .warning {
                color: #ffff55;
            }
            
            .element-html {
                background: #222;
                padding: 5px;
                border-radius: 3px;
                font-size: 10px;
                max-height: 100px;
                overflow: auto;
                margin-top: 5px;
            }
            
            .highlight-btn {
                background: #222;
                color: #00ff00;
                border: 1px solid #333;
                padding: 5px 10px;
                border-radius: 3px;
                cursor: pointer;
                margin-top: 10px;
            }
            
            /* Events tab */
            .events-controls {
                display: flex;
                align-items: center;
                margin-bottom: 15px;
                gap: 15px;
            }
            
            .events-controls button {
                background: #222;
                color: #00ff00;
                border: 1px solid #333;
                padding: 5px 10px;
                border-radius: 3px;
                cursor: pointer;
            }
            
            .events-controls label {
                display: flex;
                align-items: center;
                gap: 5px;
            }
            
            .events-list {
                background: rgba(0, 0, 0, 0.3);
                border: 1px solid #333;
                border-radius: 5px;
                padding: 12px;
                max-height: calc(100% - 50px);
                overflow: auto;
            }
            
            .event-item {
                padding: 5px;
                margin-bottom: 5px;
                border-bottom: 1px solid #333;
                font-size: 11px;
            }
            
            /* Storage tab */
            .storage-controls {
                display: flex;
                margin-bottom: 15px;
                gap: 10px;
            }
            
            .storage-controls button {
                background: #222;
                color: #00ff00;
                border: 1px solid #333;
                padding: 5px 10px;
                border-radius: 3px;
                cursor: pointer;
            }
            
            .storage-sections {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 15px;
            }
            
            .storage-section {
                background: rgba(0, 0, 0, 0.3);
                border: 1px solid #333;
                border-radius: 5px;
                padding: 12px;
            }
            
            .storage-section h3 {
                margin-top: 0;
                margin-bottom: 10px;
                font-size: 14px;
                color: #00ffaa;
            }
            
            .storage-list {
                max-height: 300px;
                overflow: auto;
                background: #111;
                padding: 10px;
                border-radius: 3px;
            }
            
            .storage-item {
                padding: 3px;
                margin-bottom: 3px;
                border-bottom: 1px solid #333;
                word-break: break-all;
            }
            
            .storage-key {
                color: #00ffaa;
                font-weight: bold;
            }
            
            /* Fixes tab */
            .fixes-controls {
                margin-bottom: 15px;
            }
            
            .fixes-controls button {
                background: #222;
                color: #00ff00;
                border: 1px solid #333;
                padding: 5px 10px;
                border-radius: 3px;
                cursor: pointer;
            }
            
            .fixes-list {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 15px;
                margin-bottom: 15px;
            }
            
            .fix-item {
                background: rgba(0, 0, 0, 0.3);
                border: 1px solid #333;
                border-radius: 5px;
                padding: 12px;
            }
            
            .fix-item h3 {
                margin-top: 0;
                margin-bottom: 10px;
                font-size: 14px;
                color: #00ffaa;
            }
            
            .fix-item p {
                margin-bottom: 10px;
                font-size: 11px;
            }
            
            .fix-item .apply-fix {
                background: #222;
                color: #00ff00;
                border: 1px solid #333;
                padding: 5px 10px;
                border-radius: 3px;
                cursor: pointer;
            }
            
            .active-fixes {
                background: rgba(0, 0, 0, 0.3);
                border: 1px solid #333;
                border-radius: 5px;
                padding: 12px;
            }
            
            .active-fixes h3 {
                margin-top: 0;
                margin-bottom: 10px;
                font-size: 14px;
                color: #00ffaa;
            }
            
            .active-fix-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 5px;
                margin-bottom: 5px;
                border-bottom: 1px solid #333;
            }
            
            .active-fix-item button {
                background: #500;
                color: #ff6666;
                border: 1px solid #800;
                padding: 2px 6px;
                border-radius: 3px;
                cursor: pointer;
                font-size: 10px;
            }
            
            /* Logs tab */
            .logs-controls {
                display: flex;
                justify-content: space-between;
                margin-bottom: 15px;
            }
            
            .logs-controls button {
                background: #222;
                color: #00ff00;
                border: 1px solid #333;
                padding: 5px 10px;
                border-radius: 3px;
                cursor: pointer;
            }
            
            .logs-controls select {
                background: #222;
                color: #00ff00;
                border: 1px solid #333;
                padding: 5px 10px;
                border-radius: 3px;
            }
            
            .logs-list {
                background: #111;
                border: 1px solid #333;
                border-radius: 5px;
                padding: 10px;
                height: calc(100% - 50px);
                overflow: auto;
                font-family: monospace;
                font-size: 11px;
            }
            
            .log-entry {
                padding: 3px;
                margin-bottom: 2px;
                border-bottom: 1px solid #222;
                white-space: pre-wrap;
                word-break: break-all;
            }
            
            .log-time {
                color: #aaa;
                margin-right: 5px;
            }
            
            .log-level {
                margin-right: 5px;
                font-weight: bold;
            }
            
            .log-level.error {
                color: #ff6666;
            }
            
            .log-level.warning {
                color: #ffcc44;
            }
            
            .log-level.system {
                color: #44aaff;
            }
            
            .log-level.success {
                color: #66ff66;
            }
            
            .log-level.fix {
                color: #ff44ff;
            }
            
            .log-message {
                word-break: break-all;
            }
            
            /* Responsive adjustments */
            @media (max-width: 768px) {
                #app-debugger-panel {
                    width: 100%;
                }
                
                .overview-grid, .state-grid, .elements-grid, .fixes-list, .storage-sections {
                    grid-template-columns: 1fr;
                }
            }
            
            /* Diff view */
            .differences-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
            }
            
            .differences-content {
                background: #111;
                border: 1px solid #333;
                border-radius: 5px;
                width: 80%;
                max-width: 800px;
                max-height: 80%;
                display: flex;
                flex-direction: column;
            }
            
            .differences-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px;
                background: #222;
                border-bottom: 1px solid #333;
            }
            
            .differences-header h3 {
                margin: 0;
                color: #00ffaa;
            }
            
            .close-differences {
                background: none;
                border: none;
                color: #00ff00;
                font-size: 20px;
                cursor: pointer;
            }
            
            .differences-body {
                padding: 15px;
                overflow: auto;
                flex: 1;
            }
            
            .differences-body pre {
                margin: 0;
                white-space: pre-wrap;
                word-wrap: break-word;
            }
        `;
        
        // Add to DOM
        document.head.appendChild(styles);
        document.body.appendChild(panel);
        
        // Set initial status
        document.getElementById('debugger-status').textContent = 'Ready';
        
        return panel;
    }
    
    /**
     * Set up event listeners for the debug panel
     */
    function setupEventListeners() {
        // Panel toggle events
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'd') {
                e.preventDefault();
                toggleDebuggerPanel();
            }
        });
        
        // Get panel
        const panel = document.getElementById('app-debugger-panel');
        if (!panel) return;
        
        // Panel control events
        panel.querySelector('#debugger-close').addEventListener('click', () => {
            panel.classList.add('hidden');
        });
        
        panel.querySelector('#debugger-minimize').addEventListener('click', () => {
            panel.classList.toggle('minimized');
            state.isMinimized = panel.classList.contains('minimized');
        });
        
        panel.querySelector('.debugger-handle').addEventListener('click', () => {
            panel.classList.toggle('minimized');
            state.isMinimized = panel.classList.contains('minimized');
        });
        
        // Tab navigation
        const tabButtons = panel.querySelectorAll('.tab-button');
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Update active class
                tabButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                // Show corresponding tab
                const tabId = button.getAttribute('data-tab');
                const tabContents = panel.querySelectorAll('.tab-content');
                tabContents.forEach(content => {
                    content.classList.remove('active');
                });
                document.getElementById(`tab-${tabId}`).classList.add('active');
                
                // Update state
                state.activeTab = tabId;
                
                // Refresh content if needed
                refreshTabContent(tabId);
            });
        });
        
        // Footer controls
        panel.querySelector('#refresh-debugger').addEventListener('click', refreshAllContent);
        
        panel.querySelector('#toggle-auto-refresh').addEventListener('click', () => {
            toggleAutoRefresh();
        });
        
        // Overview tab actions
        panel.querySelector('#action-fix-send-btn').addEventListener('click', () => {
            applyFix('fix-send-button');
        });
        
        panel.querySelector('#action-fix-input-mode').addEventListener('click', () => {
            applyFix('fix-input-mode');
        });
        
        panel.querySelector('#action-take-snapshot').addEventListener('click', () => {
            takeSnapshot();
            refreshTabContent('state');
            refreshTabContent('overview');
        });
        
        // State tab actions
        panel.querySelector('#refresh-state').addEventListener('click', () => {
            refreshTabContent('state');
        });
        
        panel.querySelector('#compare-snapshots').addEventListener('click', () => {
            compareStateSnapshots();
        });
        
        // Elements tab actions
        panel.querySelector('#inspect-elements').addEventListener('click', () => {
            inspectAllElements();
        });
        
        panel.querySelector('#element-search').addEventListener('input', (e) => {
            filterElements(e.target.value);
        });
        
        // Storage tab actions
        panel.querySelector('#refresh-storage').addEventListener('click', () => {
            refreshTabContent('storage');
        });
        
        panel.querySelector('#clear-local-storage').addEventListener('click', () => {
            if (confirm('Are you sure you want to clear localStorage? This may affect the application state.')) {
                localStorage.clear();
                refreshTabContent('storage');
                log('WARNING', 'LocalStorage cleared');
            }
        });
        
        // Events tab actions
        panel.querySelector('#clear-events').addEventListener('click', () => {
            clearEvents();
        });
        
        panel.querySelector('#track-events').addEventListener('change', (e) => {
            toggleEventTracking(e.target.checked);
        });
        
        // Fixes tab actions
        const fixButtons = panel.querySelectorAll('.apply-fix');
        fixButtons.forEach(button => {
            button.addEventListener('click', () => {
                const fixId = button.getAttribute('data-fix');
                if (state.activeFixes.includes(fixId)) {
                    removeFix(fixId);
                } else {
                    applyFix(fixId);
                }
            });
        });
        
        panel.querySelector('#remove-all-fixes').addEventListener('click', () => {
            removeAllFixes();
        });
        
        // Logs tab actions
        panel.querySelector('#clear-logs').addEventListener('click', () => {
            clearLogs();
        });
        
        panel.querySelector('#log-filter').addEventListener('change', (e) => {
            filterLogs(e.target.value);
        });
    }
    
    /**
     * Toggle the debugger panel visibility
     */
    function toggleDebuggerPanel() {
        const panel = document.getElementById('app-debugger-panel');
        if (!panel) return;
        
        panel.classList.toggle('hidden');
        
        // Refresh content when showing
        if (!panel.classList.contains('hidden')) {
            refreshAllContent();
        }
    }
    
    /**
     * Start auto-refresh
     */
    function startAutoRefresh() {
        if (state.refreshInterval) {
            clearInterval(state.refreshInterval);
        }
        
        state.refreshInterval = setInterval(() => {
            if (!state.isPaused) {
                const panel = document.getElementById('app-debugger-panel');
                if (panel && !panel.classList.contains('hidden')) {
                    refreshTabContent(state.activeTab);
                }
            }
        }, config.autoRefreshRate);
        
        const autoRefreshBtn = document.getElementById('toggle-auto-refresh');
        if (autoRefreshBtn) {
            autoRefreshBtn.style.background = '#005500';
        }
    }
    
    /**
     * Stop auto-refresh
     */
    function stopAutoRefresh() {
        if (state.refreshInterval) {
            clearInterval(state.refreshInterval);
            state.refreshInterval = null;
        }
        
        const autoRefreshBtn = document.getElementById('toggle-auto-refresh');
        if (autoRefreshBtn) {
            autoRefreshBtn.style.background = 'none';
        }
    }
    
    /**
     * Toggle auto-refresh
     */
    function toggleAutoRefresh() {
        if (state.refreshInterval) {
            stopAutoRefresh();
            log('UPDATE', 'Auto-refresh disabled');
        } else {
            startAutoRefresh();
            log('UPDATE', 'Auto-refresh enabled');
        }
    }
    
    /**
     * Refresh all content
     */
    function refreshAllContent() {
        refreshTabContent('overview');
        refreshTabContent('state');
        refreshTabContent('elements');
        refreshTabContent('storage');
        refreshTabContent('events');
        refreshTabContent('fixes');
        refreshTabContent('logs');
        
        log('UPDATE', 'All content refreshed');
    }
    
    /**
     * Refresh content for a specific tab
     * @param {string} tabId - ID of the tab to refresh
     */
    function refreshTabContent(tabId) {
        switch (tabId) {
            case 'overview':
                refreshOverviewTab();
                break;
            case 'state':
                refreshStateTab();
                break;
            case 'elements':
                refreshElementsTab();
                break;
            case 'storage':
                refreshStorageTab();
                break;
            case 'events':
                // Events are updated in real-time
                break;
            case 'fixes':
                updateFixesDisplay();
                break;
            case 'logs':
                updateLogDisplay();
                break;
        }
    }
    
    /**
     * Refresh the overview tab
     */
    function refreshOverviewTab() {
        // Update application status
        const appStatus = document.getElementById('app-status');
        if (appStatus) {
            let statusHtml = '';
            
            // Check if key objects exist
            const stateExists = typeof window.state !== 'undefined';
            const elementsExist = typeof window.elements !== 'undefined';
            const playerActionSystemExists = typeof window.playerActionSystem !== 'undefined';
            
            statusHtml += `<div class="status-item">App State: <span class="${stateExists ? 'success' : 'error'}">${stateExists ? 'Available' : 'Missing'}</span></div>`;
            statusHtml += `<div class="status-item">UI Elements: <span class="${elementsExist ? 'success' : 'error'}">${elementsExist ? 'Available' : 'Missing'}</span></div>`;
            statusHtml += `<div class="status-item">Player Action System: <span class="${playerActionSystemExists ? 'success' : 'error'}">${playerActionSystemExists ? 'Available' : 'Missing'}</span></div>`;
            
            // Check current character
            if (stateExists && window.state.currentCharacter) {
                statusHtml += `<div class="status-item">Current Character: <span class="success">${window.state.currentCharacter.name || 'Unnamed'}</span></div>`;
            } else {
                statusHtml += `<div class="status-item">Current Character: <span class="error">None</span></div>`;
            }
            
            // Check for send button
            const sendButtons = document.querySelectorAll('button#send-btn, .send-btn');
            statusHtml += `<div class="status-item">Send Buttons: <span class="${sendButtons.length > 0 ? 'success' : 'error'}">${sendButtons.length} found</span></div>`;
            
            appStatus.innerHTML = statusHtml;
        }
        
        // Update error summary
        const errorSummary = document.getElementById('error-summary');
        if (errorSummary) {
            let summaryHtml = '';
            
            if (state.metrics.errorCount === 0 && state.metrics.warningCount === 0) {
                summaryHtml = '<div class="success">No errors detected</div>';
            } else {
                summaryHtml += `<div class="error-count">Errors: <span class="error">${state.metrics.errorCount}</span></div>`;
                summaryHtml += `<div class="warning-count">Warnings: <span class="warning">${state.metrics.warningCount}</span></div>`;
                
                // Add latest error if available
                const latestError = state.logs.find(log => log.category === 'ERROR');
                if (latestError) {
                    summaryHtml += `<div class="latest-error">Latest Error: <span class="error">${latestError.message}</span></div>`;
                }
            }
            
            errorSummary.innerHTML = summaryHtml;
        }
        
        // Update chat status
        const chatStatus = document.getElementById('chat-status');
        if (chatStatus) {
            let chatHtml = '';
            
            // Check if key elements exist
            const chatInterface = document.querySelector('.chat-interface');
            const messageInput = document.querySelector('textarea#message-input');
            const chatMessages = document.getElementById('chat-messages');
            
            const chatVisible = chatInterface && !chatInterface.classList.contains('hidden');
            const inputReady = messageInput && !messageInput.disabled;
            
            chatHtml += `<div class="status-item">Chat Interface: <span class="${chatVisible ? 'success' : 'error'}">${chatVisible ? 'Visible' : 'Hidden'}</span></div>`;
            chatHtml += `<div class="status-item">Message Input: <span class="${inputReady ? 'success' : 'error'}">${inputReady ? 'Ready' : 'Not Ready'}</span></div>`;
            
            // Count messages if possible
            if (chatMessages) {
                const messageCount = chatMessages.querySelectorAll('.message').length;
                chatHtml += `<div class="status-item">Messages: ${messageCount}</div>`;
            }
            
            // Check input mode
            const inputMode = localStorage.getItem('inputMode') || 'speak';
            chatHtml += `<div class="status-item">Input Mode: <span class="${inputMode === 'speak' ? 'success' : 'warning'}">${inputMode}</span></div>`;
            
            chatStatus.innerHTML = chatHtml;
        }
        
        // Update active modules
        const activeModules = document.getElementById('active-modules');
        if (activeModules) {
            let modulesHtml = '';
            
            // Check important modules based on global functions and objects
            const modules = [
                { name: 'Core Application', active: typeof window.state !== 'undefined' },
                { name: 'Character Management', active: typeof window.loadCharacter === 'function' },
                { name: 'Chat Interface', active: typeof window.sendMessage === 'function' },
                { name: 'Player Action System', active: typeof window.playerActionSystem !== 'undefined' },
                { name: 'Settings Management', active: typeof window.initializeSettings === 'function' },
                { name: 'Theme Management', active: typeof window.toggleTheme === 'function' },
                { name: 'Local Storage', active: localStorage.length > 0 }
            ];
            
            modulesHtml += '<div class="module-grid">';
            modules.forEach(module => {
                modulesHtml += `
                    <div class="module-item ${module.active ? 'active' : 'inactive'}">
                        <span class="module-status">${module.active ? '✓' : '✗'}</span>
                        <span class="module-name">${module.name}</span>
                    </div>
                `;
            });
            modulesHtml += '</div>';
            
            // Add any active fixes
            if (state.activeFixes.length > 0) {
                modulesHtml += '<div class="active-fixes-overview">';
                modulesHtml += '<h4>Active Fixes</h4>';
                modulesHtml += '<ul>';
                state.activeFixes.forEach(fix => {
                    modulesHtml += `<li>${fix}</li>`;
                });
                modulesHtml += '</ul>';
                modulesHtml += '</div>';
            }
            
            activeModules.innerHTML = modulesHtml;
        }
    }
    
    /**
     * Refresh the state tab
     */
    function refreshStateTab() {
        // Capture latest state
        captureApplicationState();
        
        // Update application state
        const applicationState = document.getElementById('application-state');
        if (applicationState && window.state) {
            applicationState.textContent = formatJson(window.state);
        } else if (applicationState) {
            applicationState.textContent = 'Application state not available';
        }
        
        // Update current character
        const currentCharacter = document.getElementById('current-character');
        if (currentCharacter && window.state && window.state.currentCharacter) {
            currentCharacter.textContent = formatJson(window.state.currentCharacter);
        } else if (currentCharacter) {
            currentCharacter.textContent = 'No character selected';
        }
        
        // Update UI state
        const uiState = document.getElementById('ui-state');
        if (uiState && window.state && window.state.ui) {
            uiState.textContent = formatJson(window.state.ui);
        } else if (uiState) {
            uiState.textContent = 'UI state not available';
        }
        
        // Update player action state
        const playerActionState = document.getElementById('player-action-state');
        if (playerActionState && window.playerActionState) {
            playerActionState.textContent = formatJson(window.playerActionState);
        } else if (playerActionState) {
            playerActionState.textContent = 'Player action state not available';
        }
    }
    
    /**
     * Refresh the elements tab
     */
    function refreshElementsTab() {
        // Find key elements
        findKeyElements();
        
        // Update chat elements
        const chatElements = document.getElementById('chat-elements');
        if (chatElements) {
            let chatHtml = '';
            
            for (const [key, element] of Object.entries(state.elements.chat)) {
                if (element) {
                    chatHtml += `<div class="element-list-item" data-element="chat-${key}">${key}</div>`;
                }
            }
            
            chatElements.innerHTML = chatHtml || 'No chat elements found';
        }
        
        // Update sidebar elements
        const sidebarElements = document.getElementById('sidebar-elements');
        if (sidebarElements) {
            let sidebarHtml = '';
            
            for (const [key, element] of Object.entries(state.elements.sidebar)) {
                if (element) {
                    sidebarHtml += `<div class="element-list-item" data-element="sidebar-${key}">${key}</div>`;
                }
            }
            
            sidebarElements.innerHTML = sidebarHtml || 'No sidebar elements found';
        }
        
        // Update modal elements
        const modalElements = document.getElementById('modal-elements');
        if (modalElements) {
            let modalHtml = '';
            
            for (const [key, element] of Object.entries(state.elements.modals)) {
                if (element) {
                    modalHtml += `<div class="element-list-item" data-element="modals-${key}">${key}</div>`;
                }
            }
            
            modalElements.innerHTML = modalHtml || 'No modal elements found';
        }
        
        // Update player elements
        const playerElements = document.getElementById('player-elements');
        if (playerElements) {
            let playerHtml = '';
            
            for (const [key, element] of Object.entries(state.elements.player)) {
                if (element) {
                    playerHtml += `<div class="element-list-item" data-element="player-${key}">${key}</div>`;
                }
            }
            
            playerElements.innerHTML = playerHtml || 'No player elements found';
        }
        
        // Add click handlers for elements
        const elementItems = document.querySelectorAll('.element-list-item');
        elementItems.forEach(item => {
            item.addEventListener('click', () => {
                try {
                    const elementKey = item.getAttribute('data-element');
                    showElementDetails(elementKey);
                } catch (error) {
                    log('ERROR', `Error showing element details: ${error.message}`);
                }
            });
        });
    }
    
    /**
     * Refresh the storage tab
     */
    function refreshStorageTab() {
        // Update localStorage
        const localStorageContainer = document.getElementById('local-storage');
        if (localStorageContainer) {
            let localStorageHtml = '';
            
            if (localStorage.length === 0) {
                localStorageHtml = 'LocalStorage is empty';
            } else {
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    const value = localStorage.getItem(key);
                    
                    localStorageHtml += `
                        <div class="storage-item">
                            <div class="storage-key">${key}</div>
                            <div class="storage-value">${formatStorageValue(value)}</div>
                        </div>
                    `;
                }
            }
            
            localStorageContainer.innerHTML = localStorageHtml;
        }
        
        // Update sessionStorage
        const sessionStorageContainer = document.getElementById('session-storage');
        if (sessionStorageContainer) {
            let sessionStorageHtml = '';
            
            if (sessionStorage.length === 0) {
                sessionStorageHtml = 'SessionStorage is empty';
            } else {
                for (let i = 0; i < sessionStorage.length; i++) {
                    const key = sessionStorage.key(i);
                    const value = sessionStorage.getItem(key);
                    
                    sessionStorageHtml += `
                        <div class="storage-item">
                            <div class="storage-key">${key}</div>
                            <div class="storage-value">${formatStorageValue(value)}</div>
                        </div>
                    `;
                }
            }
            
            sessionStorageContainer.innerHTML = sessionStorageHtml;
        }
    }
    
    /**
     * Update the fixes display
     */
    function updateFixesDisplay() {
        const activeFixes = document.getElementById('active-fixes-list');
        if (!activeFixes) return;
        
        if (state.activeFixes.length === 0) {
            activeFixes.innerHTML = 'None';
            return;
        }
        
        let fixesHtml = '';
        state.activeFixes.forEach(fix => {
            fixesHtml += `
                <div class="active-fix-item">
                    <span>${fix}</span>
                    <button data-remove-fix="${fix}">Remove</button>
                </div>
            `;
        });
        
        activeFixes.innerHTML = fixesHtml;
        
        // Add click handlers for remove buttons
        const removeButtons = activeFixes.querySelectorAll('button[data-remove-fix]');
        removeButtons.forEach(button => {
            button.addEventListener('click', () => {
                const fixId = button.getAttribute('data-remove-fix');
                removeFix(fixId);
            });
        });
        
        // Update fix buttons to show if they're applied
        const fixButtons = document.querySelectorAll('.apply-fix');
        fixButtons.forEach(button => {
            const fixId = button.getAttribute('data-fix');
            if (state.activeFixes.includes(fixId)) {
                button.textContent = 'Remove Fix';
                button.style.background = '#550000';
                button.style.color = '#ffaaaa';
            } else {
                button.textContent = 'Apply Fix';
                button.style.background = '#222';
                button.style.color = '#00ff00';
            }
        });
    }
    
    /**
     * Update the log display
     */
    function updateLogDisplay() {
        const logsList = document.getElementById('logs-list');
        if (!logsList) return;
        
        const filter = document.getElementById('log-filter').value;
        
        let filteredLogs = state.logs;
        if (filter !== 'all') {
            filteredLogs = state.logs.filter(log => {
                if (filter === 'error') return log.category === 'ERROR';
                if (filter === 'warning') return log.category === 'ERROR' || log.category === 'WARNING';
                if (filter === 'fix') return log.category === 'FIX';
                if (filter === 'system') return log.category === 'SYSTEM';
                return true;
            });
        }
        
        if (filteredLogs.length === 0) {
            logsList.innerHTML = 'No logs to display';
            return;
        }
        
        let logsHtml = '';
        filteredLogs.forEach(log => {
            const logClass = log.category.toLowerCase();
            const formattedTime = new Date(log.timestamp).toLocaleTimeString();
            
            logsHtml += `
                <div class="log-entry ${logClass}">
                    <span class="log-time">${formattedTime}</span>
                    <span class="log-level ${logClass}">[${log.category}]</span>
                    <span class="log-message">${log.message}</span>
                    ${log.data ? `<pre class="log-data">${typeof log.data === 'string' ? log.data : JSON.stringify(log.data, null, 2)}</pre>` : ''}
                </div>
            `;
        });
        
        logsList.innerHTML = logsHtml;
    }
    
    /**
     * Filter logs by type
     * @param {string} filter - Filter type
     */
    function filterLogs(filter) {
        updateLogDisplay();
    }
    
    /**
     * Clear all logs
     */
    function clearLogs() {
        state.logs = [];
        state.metrics.errorCount = 0;
        state.metrics.warningCount = 0;
        
        updateLogDisplay();
        log('SYSTEM', 'Logs cleared');
    }
    
    /**
     * Clear all events
     */
    function clearEvents() {
        const eventsList = document.getElementById('events-list');
        if (eventsList) {
            eventsList.innerHTML = 'No events recorded yet';
        }
        
        log('SYSTEM', 'Events cleared');
    }
    
    /**
     * Toggle event tracking
     * @param {boolean} enabled - Whether tracking is enabled
     */
    function toggleEventTracking(enabled) {
        // Implementation depends on specific events to track
        log('SYSTEM', `Event tracking ${enabled ? 'enabled' : 'disabled'}`);
    }
    
    /**
     * Show details for a specific element
     * @param {string} elementKey - Key of the element to show details for
     */
    function showElementDetails(elementKey) {
        // More robust parsing of the element key
        let parts = elementKey.split('-');
        let type, key;
        
        if (parts.length >= 2) {
            type = parts[0];
            // Join the rest back together in case the element name itself contained hyphens
            key = parts.slice(1).join('-');
        } else {
            log('ERROR', `Invalid element key format: ${elementKey}`);
            return;
        }
        
        // Safety check for state.elements[type]
        if (!state.elements[type]) {
            log('ERROR', `Element category not found: ${type}`);
            return;
        }
        
        // Safety check for the element itself
        const element = state.elements[type][key];
        if (!element) {
            log('ERROR', `Element not found: ${key} in category ${type}`);
            return;
        }
        
        const detailsContainer = document.getElementById('element-details');
        if (!detailsContainer) return;
        
        let detailsHtml = `<h4>${key}</h4>`;
        
        // Try-catch to handle any unexpected errors when accessing element properties
        try {
            // Basic properties
            detailsHtml += `<div class="element-property">Type: ${element.tagName || 'Unknown'}</div>`;
            detailsHtml += `<div class="element-property">ID: ${element.id || 'None'}</div>`;
            
            // Classes - handle case where classList might not exist
            const classNames = element.classList ? Array.from(element.classList).join(', ') : 'None';
            detailsHtml += `<div class="element-property">Classes: ${classNames}</div>`;
            
            // Visibility - wrap in try-catch in case getComputedStyle fails
            try {
                const style = window.getComputedStyle(element);
                const isVisible = style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
                detailsHtml += `<div class="element-property">Visible: <span class="${isVisible ? 'success' : 'error'}">${isVisible ? 'Yes' : 'No'}</span></div>`;
            } catch (e) {
                detailsHtml += `<div class="element-property">Visible: <span class="error">Unknown</span></div>`;
            }
            
            // Special properties based on element type
            if (element.tagName === 'BUTTON') {
                detailsHtml += `<div class="element-property">Disabled: ${element.disabled ? 'Yes' : 'No'}</div>`;
                detailsHtml += `<div class="element-property">Has Click Handler: ${typeof element.onclick === 'function' ? 'Yes' : 'No'}</div>`;
            } else if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                detailsHtml += `<div class="element-property">Disabled: ${element.disabled ? 'Yes' : 'No'}</div>`;
                detailsHtml += `<div class="element-property">Placeholder: ${element.placeholder || 'None'}</div>`;
                detailsHtml += `<div class="element-property">Value: ${element.value || 'Empty'}</div>`;
            }
            
            // Add HTML content preview - safely
            try {
                if (element.innerHTML) {
                    const htmlPreview = element.innerHTML.substring(0, 200) + (element.innerHTML.length > 200 ? '...' : '');
                    detailsHtml += `<div class="element-property">HTML Content:</div>`;
                    detailsHtml += `<pre class="element-html">${htmlEscape(htmlPreview)}</pre>`;
                }
            } catch (e) {
                detailsHtml += `<div class="element-property">HTML Content: <span class="error">Error retrieving content</span></div>`;
            }
            
            // Add highlight button
            detailsHtml += `<button id="highlight-element" class="highlight-btn">Highlight Element</button>`;
            
        } catch (e) {
            detailsHtml += `<div class="element-property error">Error accessing element properties: ${e.message}</div>`;
        }
        
        detailsContainer.innerHTML = detailsHtml;
        
        // Add highlight functionality
        const highlightBtn = document.getElementById('highlight-element');
        if (highlightBtn) {
            highlightBtn.addEventListener('click', () => {
                highlightElement(element);
            });
        }
    }
    
    /**
     * Initialize element inspection and fix event handler
     */
    function initElementInspection() {
        // Find all existing element list items and rebind their event handlers
        const elementItems = document.querySelectorAll('.element-list-item');
        elementItems.forEach(item => {
            // Remove existing listeners by cloning
            const newItem = item.cloneNode(true);
            if (item.parentNode) {
                item.parentNode.replaceChild(newItem, item);
            }
            
            // Add safe event listener
            newItem.addEventListener('click', function() {
                const elementKey = this.getAttribute('data-element');
                if (elementKey) {
                    showElementDetails(elementKey);
                }
            });
        });
    }
    
    /**
     * Escape HTML to prevent XSS when displaying element content
     * @param {string} html - HTML to escape
     * @returns {string} - Escaped HTML
     */
    function htmlEscape(html) {
        return (html || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
    
    /**
     * Highlight an element in the DOM
     * @param {HTMLElement} element - Element to highlight
     */
    function highlightElement(element) {
        // Store original styles
        const originalOutline = element.style.outline;
        const originalBoxShadow = element.style.boxShadow;
        
        // Apply highlight
        element.style.outline = '2px solid #ff00ff';
        element.style.boxShadow = '0 0 10px #ff00ff';
        
        // Scroll element into view
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
        });
        
        // Remove highlight after a delay
        setTimeout(() => {
            element.style.outline = originalOutline;
            element.style.boxShadow = originalBoxShadow;
        }, 3000);
        
        log('DEBUG', 'Element highlighted in DOM');
    }
    
    /**
     * Filter elements by search term
     * @param {string} searchTerm - Search term
     */
    function filterElements(searchTerm) {
        if (!searchTerm) {
            // Show all
            document.querySelectorAll('.element-list-item').forEach(item => {
                item.style.display = '';
            });
            return;
        }
        
        const lowerSearch = searchTerm.toLowerCase();
        
        document.querySelectorAll('.element-list-item').forEach(item => {
            const text = item.textContent.toLowerCase();
            if (text.includes(lowerSearch)) {
                item.style.display = '';
            } else {
                item.style.display = 'none';
            }
        });
    }
    
    /**
     * Compare state snapshots to find differences
     */
    function compareStateSnapshots() {
        if (state.snapshots.application.length < 2) {
            log('WARNING', 'Need at least two snapshots to compare');
            return;
        }
        
        // Get the two most recent snapshots
        const current = state.snapshots.application[state.snapshots.application.length - 1];
        const previous = state.snapshots.application[state.snapshots.application.length - 2];
        
        // Compare the snapshots
        const differences = findObjectDifferences(previous, current);
        
        // Log the differences
        log('SNAPSHOT', 'State comparison', differences);
        
        // Display differences in a modal
        showDifferencesModal(differences);
    }
    
    /**
     * Find differences between two objects
     * @param {Object} obj1 - First object
     * @param {Object} obj2 - Second object
     * @returns {Object} - Differences
     */
    function findObjectDifferences(obj1, obj2) {
        const differences = {};
        
        // Find keys in both objects
        const allKeys = new Set([...Object.keys(obj1), ...Object.keys(obj2)]);
        
        for (const key of allKeys) {
            // Skip timestamp and time
            if (key === 'timestamp' || key === 'time') continue;
            
            // Check if key exists in both objects
            if (!(key in obj1)) {
                differences[key] = {
                    type: 'added',
                    value: obj2[key]
                };
            } else if (!(key in obj2)) {
                differences[key] = {
                    type: 'removed',
                    value: obj1[key]
                };
            } else if (typeof obj1[key] === 'object' && obj1[key] !== null && 
                      typeof obj2[key] === 'object' && obj2[key] !== null) {
                // Recursively compare objects
                const nestedDifferences = findObjectDifferences(obj1[key], obj2[key]);
                if (Object.keys(nestedDifferences).length > 0) {
                    differences[key] = {
                        type: 'changed',
                        changes: nestedDifferences
                    };
                }
            } else if (obj1[key] !== obj2[key]) {
                differences[key] = {
                    type: 'changed',
                    from: obj1[key],
                    to: obj2[key]
                };
            }
        }
        
        return differences;
    }
    
    /**
     * Show differences modal
     * @param {Object} differences - Differences to show
     */
    function showDifferencesModal(differences) {
        // Create modal
        const modal = document.createElement('div');
        modal.className = 'differences-modal';
        modal.innerHTML = `
            <div class="differences-content">
                <div class="differences-header">
                    <h3>State Changes</h3>
                    <button class="close-differences">&times;</button>
                </div>
                <div class="differences-body">
                    <pre>${formatJson(differences)}</pre>
                </div>
            </div>
        `;
        
        // Style modal
        const style = document.createElement('style');
        style.textContent = `
            .differences-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
            }
            
            .differences-content {
                background: #111;
                border: 1px solid #333;
                border-radius: 5px;
                width: 80%;
                max-width: 800px;
                max-height: 80%;
                display: flex;
                flex-direction: column;
            }
            
            .differences-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px;
                background: #222;
                border-bottom: 1px solid #333;
            }
            
            .differences-header h3 {
                margin: 0;
                color: #00ffaa;
            }
            
            .close-differences {
                background: none;
                border: none;
                color: #00ff00;
                font-size: 20px;
                cursor: pointer;
            }
            
            .differences-body {
                padding: 15px;
                overflow: auto;
                flex: 1;
            }
            
            .differences-body pre {
                margin: 0;
                white-space: pre-wrap;
                word-wrap: break-word;
            }
        `;
        
        // Add style to document
        document.head.appendChild(style);
        
        // Add modal to document
        document.body.appendChild(modal);
        
        // Add event listener to close button
        modal.querySelector('.close-differences').addEventListener('click', () => {
            document.body.removeChild(modal);
            document.head.removeChild(style);
        });
    }
    
    // ====================================================
    // Monitoring Functions
    // ====================================================
    
    /**
     * Capture application state
     */
    function captureApplicationState() {
        // Capture global state object if it exists
        if (window.state) {
            state.trackedObjects.appState = window.state;
        }
        
        // Capture player action state if it exists
        if (window.playerActionState) {
            state.trackedObjects.playerActionState = window.playerActionState;
        }
        
        // Capture elements object if it exists
        if (window.elements) {
            state.trackedObjects.elements = window.elements;
        }
        
        // Find key DOM elements
        findKeyElements();
        
        // Track monitored objects
        state.trackedModules = [];
        if (window.state) state.trackedModules.push('ApplicationState');
        if (window.playerActionState) state.trackedModules.push('PlayerActionSystem');
        if (window.elements) state.trackedModules.push('UIElements');
        if (window.sendMessage) state.trackedModules.push('ChatSystem');
        
        log('UPDATE', 'Application state captured', {
            modules: state.trackedModules,
            timestamp: new Date()
        });
    }
    
    /**
     * Find key DOM elements in the application
     */
    function findKeyElements() {
        // Initialize empty objects first to avoid undefined errors
        state.elements.chat = {};
        state.elements.sidebar = {};
        state.elements.modals = {};
        state.elements.player = {};
        state.elements.other = {};
        
        // Define a helper function to safely query elements
        const safeQuerySelector = (selector, category, name) => {
            try {
                const element = document.querySelector(selector);
                if (element) {
                    state.elements[category][name] = element;
                    return true;
                }
            } catch (e) {
                log('WARNING', `Error finding element ${name} (${selector}): ${e.message}`);
            }
            return false;
        };
        
        // Chat interface elements
        safeQuerySelector('.chat-interface', 'chat', 'container');
        safeQuerySelector('#chat-messages', 'chat', 'messages');
        safeQuerySelector('textarea#message-input', 'chat', 'input');
        safeQuerySelector('button#send-btn, .send-btn', 'chat', 'sendBtn');
        safeQuerySelector('.chat-header', 'chat', 'header');
        safeQuerySelector('.input-mode-indicator', 'chat', 'modeIndicator');
        safeQuerySelector('.action-resolution-settings', 'chat', 'actionSettings');
        safeQuerySelector('.input-mode-toggle', 'chat', 'toggleOptions');
        
        // Sidebar elements
        safeQuerySelector('.sidebar', 'sidebar', 'container');
        safeQuerySelector('#character-list', 'sidebar', 'characterList');
        safeQuerySelector('#create-character-btn', 'sidebar', 'createBtn');
        safeQuerySelector('#import-export-btn', 'sidebar', 'importExportBtn');
        safeQuerySelector('.sidebar-header', 'sidebar', 'header');
        safeQuerySelector('.sidebar-footer', 'sidebar', 'footer');
        safeQuerySelector('#menu-toggle', 'sidebar', 'toggleBtn');
        
        // Modal elements
        safeQuerySelector('#character-modal', 'modals', 'characterModal');
        safeQuerySelector('#settings-modal', 'modals', 'settingsModal');
        safeQuerySelector('#stats-modal', 'modals', 'statsModal');
        safeQuerySelector('#settings-modal .tabs', 'modals', 'settingsModalTabs');
        safeQuerySelector('#character-modal .tabs', 'modals', 'characterModalTabs');
        
        // Player action system elements
        safeQuerySelector('#player-stats-panel', 'player', 'statsPanel');
        safeQuerySelector('#action-resolution-mode', 'player', 'actionResolutionMode');
        safeQuerySelector('#action-result', 'player', 'actionResult');
        safeQuerySelector('#edit-stats-btn', 'player', 'editStatsBtn');
        safeQuerySelector('.toggle-action-mode', 'player', 'quickToggleBtn');
        
        // Other important elements
        safeQuerySelector('#welcome-screen', 'other', 'welcomeScreen');
        safeQuerySelector('.app-header', 'other', 'appHeader');
        safeQuerySelector('.app-container', 'other', 'appContainer');
        safeQuerySelector('#loading-overlay', 'other', 'loadingOverlay');
        
        // Count found elements
        let elementCount = 0;
        
        for (const category in state.elements) {
            for (const key in state.elements[category]) {
                if (state.elements[category][key]) elementCount++;
            }
        }
        
        log('UPDATE', `Found ${elementCount} UI elements`);
    }
    
    /**
     * Inspect all elements in detail
     */
    function inspectAllElements() {
        const elementInfo = {};
        
        // For each element category
        for (const category in state.elements) {
            elementInfo[category] = {};
            
            // For each element in the category
            for (const key in state.elements[category]) {
                const element = state.elements[category][key];
                
                if (element) {
                    elementInfo[category][key] = {
                        tagName: element.tagName,
                        id: element.id || null,
                        classes: Array.from(element.classList || []),
                        visible: isElementVisible(element),
                        attributes: getElementAttributes(element),
                        rect: element.getBoundingClientRect()
                    };
                    
                    // Special properties for specific element types
                    if (element.tagName === 'BUTTON') {
                        elementInfo[category][key].disabled = element.disabled;
                        elementInfo[category][key].hasClickHandler = element.onclick !== null;
                    } else if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                        elementInfo[category][key].disabled = element.disabled;
                        elementInfo[category][key].placeholder = element.placeholder;
                        elementInfo[category][key].value = element.value;
                    }
                }
            }
        }
        
        log('INSPECT', 'Detailed element inspection', elementInfo);
        return elementInfo;
    }
    
    /**
     * Get all attributes of an element
     * @param {HTMLElement} element - Element to get attributes for
     * @returns {Object} - Object containing all attributes
     */
    function getElementAttributes(element) {
        const attributes = {};
        
        if (element.attributes) {
            for (let i = 0; i < element.attributes.length; i++) {
                const attr = element.attributes[i];
                attributes[attr.name] = attr.value;
            }
        }
        
        return attributes;
    }
    
    /**
     * Check if an element is visible
     * @param {HTMLElement} element - Element to check
     * @returns {boolean} - Whether the element is visible
     */
    function isElementVisible(element) {
        if (!element) return false;
        
        const style = window.getComputedStyle(element);
        return !(style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0');
    }
    
    /**
     * Set up monitoring systems
     */
    function setupMonitoring() {
        // Monitor global errors
        if (config.captureExceptions) {
            window.addEventListener('error', function(event) {
                log('ERROR', `Uncaught exception: ${event.message}`, {
                    filename: event.filename,
                    lineno: event.lineno,
                    colno: event.colno,
                    error: event.error ? (event.error.stack || event.error.toString()) : null
                });
            });
            
            window.addEventListener('unhandledrejection', function(event) {
                log('ERROR', `Unhandled promise rejection: ${event.reason}`, {
                    reason: event.reason
                });
            });
            
            log('SYSTEM', 'Exception monitoring enabled');
        }
        
        // Monitor console errors
        if (config.captureExceptions) {
            const originalConsoleError = console.error;
            console.error = function() {
                // Call original function
                originalConsoleError.apply(console, arguments);
                
                // Log to our system
                const errorArgs = Array.from(arguments).map(arg => 
                    arg instanceof Error ? 
                    (arg.stack || arg.toString()) : 
                    (typeof arg === 'object' ? JSON.stringify(arg) : String(arg))
                ).join(' ');
                
                log('ERROR', `Console error: ${errorArgs}`);
            };
            
            log('SYSTEM', 'Console error monitoring enabled');
        }
        
        // Monitor API calls if enabled
        if (config.monitorAPIRequests) {
            monitorFetch();
            monitorXHR();
            
            log('SYSTEM', 'API request monitoring enabled');
        }
        
        // Monitor DOM changes if MutationObserver is available
        if (window.MutationObserver) {
            const observer = new MutationObserver(function(mutations) {
                state.metrics.domUpdates += mutations.length;
                
                // Check for important changes
                mutations.forEach(mutation => {
                    // If an element was added or removed that might be important
                    if (mutation.type === 'childList') {
                        if (mutation.target.id === 'chat-messages' || 
                            mutation.target.id === 'character-list' ||
                            mutation.target.classList.contains('chat-interface')) {
                            // Important UI changes
                            log('UPDATE', `Important DOM change in ${mutation.target.id || mutation.target.className}`, {
                                added: mutation.addedNodes.length,
                                removed: mutation.removedNodes.length
                            });
                        }
                    }
                });
            });
            
            // Start observing
            observer.observe(document.body, {
                childList: true,
                subtree: true,
                attributes: true,
                characterData: false
            });
            
            log('SYSTEM', 'DOM mutation monitoring enabled');
        }
    }
    
    /**
     * Monitor fetch API calls
     */
    function monitorFetch() {
        const originalFetch = window.fetch;
        
        window.fetch = function(input, init) {
            const url = typeof input === 'string' ? input : input.url;
            const method = init && init.method ? init.method : 'GET';
            
            log('API', `Fetch request: ${method} ${url}`, init);
            
            const startTime = performance.now();
            
            return originalFetch.apply(this, arguments)
                .then(response => {
                    const endTime = performance.now();
                    const duration = endTime - startTime;
                    
                    log('API', `Fetch response: ${response.status} (${duration.toFixed(2)}ms)`, {
                        url,
                        status: response.status,
                        ok: response.ok,
                        duration
                    });
                    
                    state.metrics.apiRequests.push({
                        type: 'fetch',
                        url,
                        method,
                        status: response.status,
                        duration,
                        timestamp: new Date()
                    });
                    
                    return response;
                })
                .catch(error => {
                    const endTime = performance.now();
                    const duration = endTime - startTime;
                    
                    log('ERROR', `Fetch error: ${error.message}`, {
                        url,
                        error,
                        duration
                    });
                    
                    state.metrics.apiRequests.push({
                        type: 'fetch',
                        url,
                        method,
                        error: error.message,
                        duration,
                        timestamp: new Date()
                    });
                    
                    throw error;
                });
        };
    }
    
    /**
     * Monitor XMLHttpRequest
     */
    function monitorXHR() {
        const originalXHROpen = XMLHttpRequest.prototype.open;
        const originalXHRSend = XMLHttpRequest.prototype.send;
        
        XMLHttpRequest.prototype.open = function(method, url) {
            this._debugMethod = method;
            this._debugUrl = url;
            this._debugStartTime = performance.now();
            
            return originalXHROpen.apply(this, arguments);
        };
        
        XMLHttpRequest.prototype.send = function() {
            log('API', `XHR request: ${this._debugMethod} ${this._debugUrl}`);
            
            this.addEventListener('load', function() {
                const duration = performance.now() - this._debugStartTime;
                
                log('API', `XHR response: ${this.status} (${duration.toFixed(2)}ms)`, {
                    url: this._debugUrl,
                    status: this.status,
                    duration
                });
                
                state.metrics.apiRequests.push({
                    type: 'xhr',
                    url: this._debugUrl,
                    method: this._debugMethod,
                    status: this.status,
                    duration,
                    timestamp: new Date()
                });
            });
            
            this.addEventListener('error', function(e) {
                const duration = performance.now() - this._debugStartTime;
                
                log('ERROR', `XHR error: ${this._debugUrl}`, {
                    url: this._debugUrl,
                    duration
                });
                
                state.metrics.apiRequests.push({
                    type: 'xhr',
                    url: this._debugUrl,
                    method: this._debugMethod,
                    error: true,
                    duration,
                    timestamp: new Date()
                });
            });
            
            return originalXHRSend.apply(this, arguments);
        };
    }
    
    // ====================================================
    // Utility Functions
    // ====================================================
    
    /**
     * Clone an object deeply
     * @param {Object} obj - Object to clone
     * @returns {Object} - Cloned object
     */
    function cloneObject(obj) {
        try {
            return JSON.parse(JSON.stringify(obj));
        } catch (e) {
            // If circular reference or other JSON error
            return { error: 'Could not clone object', message: e.message };
        }
    }
    
    /**
     * Format JSON data for display
     * @param {Object} data - Data to format
     * @returns {string} - Formatted JSON string
     */
    function formatJson(data) {
        try {
            return JSON.stringify(data, null, 2);
        } catch (e) {
            return `Could not format JSON: ${e.message}`;
        }
    }
    
    /**
     * Format storage value for display
     * @param {string} value - Storage value to format
     * @returns {string} - Formatted value
     */
    function formatStorageValue(value) {
        try {
            // Check if it's a JSON string
            const parsed = JSON.parse(value);
            return JSON.stringify(parsed, null, 2);
        } catch (e) {
            // If not valid JSON, return as is
            return value;
        }
    }
    
    /**
     * Get a human-readable time difference
     * @param {Date} date - Date to compare
     * @returns {string} - Human-readable time difference
     */
    function getTimeDifference(date) {
        const now = new Date();
        const diff = now - date;
        
        const seconds = Math.floor(diff / 1000);
        if (seconds < 60) return `${seconds}s ago`;
        
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    }
    
    // ====================================================
    // Initialize the debugger
    // ====================================================
    
    // Create a minimal preInit function that's called immediately
    function preInit() {
        console.log('%c🔍 Application Debugger', 'color: #00ffaa; font-size: 14px; font-weight: bold;');
        console.log('%cPress Ctrl+Shift+D to open the debugger panel', 'color: #aaddff;');
        
        // Add immediate keyboard shortcut
        document.addEventListener('keydown', function(e) {
            if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'd') {
                e.preventDefault();
                if (state.initialized) {
                    toggleDebuggerPanel();
                } else {
                    // Initialize on first use
                    init();
                    toggleDebuggerPanel();
                }
            }
        });
        
        // Initialize on domContentLoaded if not already initialized
        document.addEventListener('DOMContentLoaded', function() {
            if (!state.initialized) {
                setTimeout(init, 1000); // Delay to let app initialize first
            }
        });
    }
    
    // Initialize immediately for keyboard shortcut
    preInit();
})();
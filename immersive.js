/* ========================================
   Immersive Story Experience - Fables.gg Style
   ======================================== */

// State
let isTyping = false;
let typingController = null;
let currentTemplate = null;

/**
 * Start a story (new or continue)
 * @param {string} storyId - Story ID to start
 * @param {boolean} continueStory - Whether to continue saved progress
 */
async function startStory(storyId, continueStory = false) {
    const template = getStoryTemplate(storyId);
    if (!template) {
        showNotification('Story nicht gefunden!', 'error');
        return;
    }

    currentTemplate = template;

    // Check for saved progress
    if (continueStory && hasSavedProgress(storyId)) {
        loadProgress(storyId);
        const state = getCurrentStoryState();

        // Navigate to immersive mode
        navigateTo('immersive');

        // Display current state
        updateImmersiveUI(state);
        displayNarrative(state.currentNarrative, false);
        renderChoiceButtons(state.currentChoices);
    } else {
        // Delete old progress and start fresh
        deleteProgress(storyId);
        const state = initStoryState(template);

        // Navigate to immersive mode
        navigateTo('immersive');

        // Display initial state
        updateImmersiveUI(state);
        displayNarrative(state.currentNarrative, true);
        renderChoiceButtons(state.currentChoices);
    }
}

/**
 * Update the immersive UI elements
 * @param {Object} state - Current story state
 */
function updateImmersiveUI(state) {
    // Update title
    const titleEl = document.getElementById('immersiveTitle');
    if (titleEl) {
        titleEl.textContent = state.metadata.title;
    }

    // Update chapter indicator
    const chapterEl = document.getElementById('chapterIndicator');
    if (chapterEl) {
        chapterEl.textContent = `Kapitel ${state.chapter}`;
    }

    // Update progress bar
    const progressBar = document.getElementById('storyProgressBar');
    if (progressBar) {
        const progress = Math.min((state.chapter / 10) * 100, 100);
        progressBar.style.width = `${progress}%`;
    }

    // Update stats display if exists
    const statsEl = document.getElementById('storyStats');
    if (statsEl && state.variables) {
        statsEl.innerHTML = `
            <span class="stat-item">❤️ ${state.variables.health}</span>
            <span class="stat-item">⚔️ ${state.variables.courage}</span>
            <span class="stat-item">🤝 ${state.variables.trust}</span>
        `;
    }
}

/**
 * Display narrative text with optional typing animation
 * @param {string} text - Narrative text to display
 * @param {boolean} animate - Whether to use typing animation
 */
async function displayNarrative(text, animate = true) {
    const container = document.getElementById('narrativeContent');
    if (!container) return;

    // Cancel any ongoing typing
    if (typingController) {
        typingController.abort();
    }

    if (!animate) {
        container.innerHTML = formatNarrative(text);
        return;
    }

    // Typing animation
    typingController = new AbortController();
    isTyping = true;
    container.innerHTML = '';

    const formattedText = formatNarrative(text);
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = formattedText;
    const plainText = tempDiv.textContent;

    // Create cursor element
    const cursor = document.createElement('span');
    cursor.className = 'typing-cursor';
    container.appendChild(cursor);

    try {
        for (let i = 0; i < plainText.length; i++) {
            if (typingController.signal.aborted) break;

            // Insert character before cursor
            const textNode = document.createTextNode(plainText[i]);
            container.insertBefore(textNode, cursor);

            // Variable speed for more natural feel
            const delay = plainText[i] === '.' || plainText[i] === ',' ? 80 :
                plainText[i] === '\n' ? 150 : 25;

            await sleep(delay);
        }
    } catch (e) {
        // Typing was cancelled
    }

    // Remove cursor after typing
    cursor.remove();
    isTyping = false;

    // Replace with formatted HTML
    container.innerHTML = formattedText;
}

/**
 * Format narrative text with paragraphs
 * @param {string} text - Raw text
 * @returns {string} HTML formatted text
 */
function formatNarrative(text) {
    return text
        .split('\n\n')
        .map(p => `<p>${p.trim()}</p>`)
        .join('');
}

/**
 * Render choice buttons
 * @param {string[]} choices - Array of choice texts
 */
function renderChoiceButtons(choices) {
    const container = document.getElementById('choicesContainer');
    if (!container) return;

    container.innerHTML = '';
    container.className = 'choices-container';

    choices.forEach((choice, index) => {
        const btn = document.createElement('button');
        btn.className = 'choice-btn';
        btn.innerHTML = `<span class="choice-number">${index + 1}</span> ${choice}`;
        btn.onclick = () => processChoice(index, choice);

        // Staggered animation
        btn.style.animationDelay = `${index * 0.1}s`;
        btn.classList.add('fade-in-up');

        container.appendChild(btn);
    });
}

/**
 * Process user's choice and generate next narrative
 * @param {number} choiceIndex - Index of selected choice
 * @param {string} choiceText - Text of selected choice
 */
async function processChoice(choiceIndex, choiceText) {
    const state = getCurrentStoryState();
    if (!state || isTyping) return;

    // Show loading state
    showNarrativeLoading(true);
    hideChoices();

    try {
        // Get prompt for this choice
        const { systemPrompt, userMessage } = getPromptForChoice(choiceText);

        // Call AI API
        const response = await callPerplexityAPI(systemPrompt, userMessage);

        // Parse response
        let parsed;
        try {
            parsed = JSON.parse(response);
        } catch (e) {
            // Try to extract JSON from response
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                parsed = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error('Konnte Antwort nicht parsen');
            }
        }

        const { narrative, choices, variableChanges } = parsed;

        if (!narrative || !choices || choices.length < 2) {
            throw new Error('Ungültige KI-Antwort');
        }

        // Update state
        updateStoryState(choiceText, narrative, choices, variableChanges || {});

        // Update UI
        const newState = getCurrentStoryState();
        updateImmersiveUI(newState);

        // Hide loading, display new narrative
        showNarrativeLoading(false);
        await displayNarrative(narrative, true);

        // Show new choices after narrative
        await sleep(500);
        renderChoiceButtons(choices);

    } catch (error) {
        console.error('Error processing choice:', error);
        showNarrativeLoading(false);
        showNotification('Fehler bei der Story-Generierung: ' + error.message, 'error');

        // Show fallback choices
        renderChoiceButtons([
            'Vorsichtig weitergehen',
            'Die Situation beobachten',
            'Einen anderen Weg wählen'
        ]);
    }
}

/**
 * Show/hide narrative loading indicator
 * @param {boolean} show - Whether to show loading
 */
function showNarrativeLoading(show) {
    const loading = document.getElementById('narrativeLoading');
    const content = document.getElementById('narrativeContent');

    if (loading) {
        loading.classList.toggle('hidden', !show);
    }
    if (content) {
        content.classList.toggle('faded', show);
    }
}

/**
 * Hide choice buttons
 */
function hideChoices() {
    const container = document.getElementById('choicesContainer');
    if (container) {
        container.innerHTML = '';
    }
}

/**
 * Skip typing animation
 */
function skipTyping() {
    if (typingController && isTyping) {
        typingController.abort();
    }
}

/**
 * Exit immersive mode
 */
function exitImmersive() {
    // Cancel any typing
    skipTyping();

    // Save progress
    saveProgress();

    // Navigate back
    navigateTo('story-select');
}

/**
 * Toggle story menu
 */
function toggleStoryMenu() {
    const menu = document.getElementById('storyMenu');
    if (menu) {
        menu.classList.toggle('active');
    }
}

/**
 * Restart current story
 */
function restartStory() {
    if (!currentTemplate) return;

    if (confirm('Möchtest du die Geschichte wirklich neu starten? Aller Fortschritt geht verloren.')) {
        startStory(currentTemplate.id, false);
    }
}

/**
 * Render story selection grid
 */
function renderStorySelectGrid() {
    const container = document.getElementById('storyGrid');
    if (!container) return;

    const templates = getAllStoryTemplates();

    container.innerHTML = templates.map(template => {
        const hasSaved = hasSavedProgress(template.id);
        const savedState = hasSaved ? loadProgress(template.id) : null;

        return `
            <div class="story-select-card" onclick="showStoryModal('${template.id}')">
                <div class="story-cover" style="background: ${template.coverGradient}">
                    <span class="story-cover-icon">${template.cover}</span>
                </div>
                <div class="story-info">
                    <span class="story-genre-badge">${template.genre}</span>
                    <h3 class="story-title">${template.title}</h3>
                    <p class="story-description">${template.description}</p>
                    <div class="story-meta-row">
                        <span class="story-difficulty">📊 ${template.difficulty}</span>
                        <span class="story-time">⏱️ ${template.estimatedTime}</span>
                    </div>
                    ${hasSaved ? `
                        <div class="story-progress-indicator">
                            <span class="progress-label">Kapitel ${savedState?.chapter || 1}</span>
                            <button class="btn btn-small btn-continue" onclick="event.stopPropagation(); startStory('${template.id}', true)">
                                Fortsetzen
                            </button>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Show story detail modal
 * @param {string} storyId - Story ID
 */
function showStoryModal(storyId) {
    const template = getStoryTemplate(storyId);
    if (!template) return;

    const hasSaved = hasSavedProgress(storyId);
    const savedState = hasSaved ? loadProgress(storyId) : null;

    // Create modal
    const modal = document.createElement('div');
    modal.className = 'story-modal-overlay';
    modal.id = 'storyModal';
    modal.innerHTML = `
        <div class="story-modal">
            <button class="modal-close" onclick="closeStoryModal()">✕</button>
            
            <div class="modal-cover" style="background: ${template.coverGradient}">
                <span class="modal-cover-icon">${template.cover}</span>
            </div>
            
            <div class="modal-content">
                <span class="story-genre-badge">${template.genre}</span>
                <h2>${template.title}</h2>
                <p class="modal-description">${template.description}</p>
                
                <div class="modal-meta">
                    <div class="meta-item">
                        <span class="meta-label">Schwierigkeit</span>
                        <span class="meta-value">${template.difficulty}</span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-label">Geschätzte Zeit</span>
                        <span class="meta-value">${template.estimatedTime}</span>
                    </div>
                </div>

                <div class="modal-lore">
                    <h4>Die Welt</h4>
                    <p>${template.lore.substring(0, 300)}...</p>
                </div>

                <div class="modal-actions">
                    ${hasSaved ? `
                        <button class="btn btn-secondary" onclick="startStory('${storyId}', false)">
                            🔄 Neu starten
                        </button>
                        <button class="btn btn-primary" onclick="startStory('${storyId}', true)">
                            ▶️ Fortsetzen (Kapitel ${savedState?.chapter || 1})
                        </button>
                    ` : `
                        <button class="btn btn-primary btn-large btn-full" onclick="startStory('${storyId}', false)">
                            ⚔️ Abenteuer beginnen
                        </button>
                    `}
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Animate in
    requestAnimationFrame(() => {
        modal.classList.add('active');
    });

    // Close on backdrop click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeStoryModal();
        }
    });
}

/**
 * Close story modal
 */
function closeStoryModal() {
    const modal = document.getElementById('storyModal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 300);
    }
}

/**
 * Utility: Sleep function
 * @param {number} ms - Milliseconds to sleep
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Skip typing with Space or Enter
    if ((e.code === 'Space' || e.code === 'Enter') && isTyping) {
        e.preventDefault();
        skipTyping();
    }

    // Number keys for quick choice selection
    if (e.code.startsWith('Digit') && !isTyping) {
        const num = parseInt(e.code.replace('Digit', ''));
        const state = getCurrentStoryState();
        if (state && num >= 1 && num <= state.currentChoices.length) {
            processChoice(num - 1, state.currentChoices[num - 1]);
        }
    }

    // Escape to exit
    if (e.code === 'Escape') {
        const page = document.getElementById('immersive');
        if (page && page.classList.contains('active')) {
            exitImmersive();
        }
        closeStoryModal();
    }
});

/* ========================================
   Story State Management - Fables.gg Style
   ======================================== */

const STORY_STATE_KEY = 'fables_story_state';

// Current active story state
let currentStoryState = null;

/**
 * Story State Model
 * @typedef {Object} StoryState
 * @property {string} storyId - Unique story identifier
 * @property {number} chapter - Current chapter number
 * @property {string[]} currentChoices - Available choices for current scene
 * @property {Object} variables - Dynamic story variables (courage, trust, health, etc.)
 * @property {Array} history - Complete history of narrative and choices
 * @property {Object} metadata - Story metadata (genre, tone, perspective)
 * @property {string} currentNarrative - Current displayed narrative text
 * @property {number} timestamp - Last update timestamp
 */

/**
 * Initialize a new story state
 * @param {Object} template - Story template from storyTemplates.js
 * @returns {StoryState} New story state
 */
function initStoryState(template) {
    currentStoryState = {
        storyId: template.id,
        chapter: 1,
        currentChoices: template.initialChoices || [],
        variables: {
            courage: 5,
            trust: 5,
            health: 100,
            karma: 0,
            ...template.initialVariables
        },
        history: [
            {
                role: 'narrator',
                content: template.initialNarrative,
                timestamp: Date.now()
            }
        ],
        metadata: {
            title: template.title,
            genre: template.genre,
            tone: template.tone || 'atmospheric',
            perspective: template.perspective || 'second-person',
            lore: template.lore,
            characters: template.characters || []
        },
        currentNarrative: template.initialNarrative,
        timestamp: Date.now()
    };

    saveProgress();
    return currentStoryState;
}

/**
 * Update story state after user makes a choice
 * @param {string} choice - The choice text selected by user
 * @param {string} newNarrative - New narrative from AI
 * @param {string[]} newChoices - New choices from AI
 * @param {Object} variableChanges - Optional variable updates
 */
function updateStoryState(choice, newNarrative, newChoices, variableChanges = {}) {
    if (!currentStoryState) {
        console.error('No active story state!');
        return null;
    }

    // Add user choice to history
    currentStoryState.history.push({
        role: 'user',
        choice: choice,
        timestamp: Date.now()
    });

    // Add new narrative to history
    currentStoryState.history.push({
        role: 'narrator',
        content: newNarrative,
        timestamp: Date.now()
    });

    // Update current state
    currentStoryState.currentNarrative = newNarrative;
    currentStoryState.currentChoices = newChoices;
    currentStoryState.chapter = Math.floor(currentStoryState.history.length / 4) + 1;
    currentStoryState.timestamp = Date.now();

    // Apply variable changes
    Object.keys(variableChanges).forEach(key => {
        if (typeof currentStoryState.variables[key] === 'number') {
            currentStoryState.variables[key] += variableChanges[key];
            // Clamp health between 0-100
            if (key === 'health') {
                currentStoryState.variables[key] = Math.max(0, Math.min(100, currentStoryState.variables[key]));
            }
        } else {
            currentStoryState.variables[key] = variableChanges[key];
        }
    });

    saveProgress();
    return currentStoryState;
}

/**
 * Save current progress to LocalStorage
 */
function saveProgress() {
    if (!currentStoryState) return;

    // Get all saved stories
    const savedStories = JSON.parse(localStorage.getItem(STORY_STATE_KEY) || '{}');

    // Save current story
    savedStories[currentStoryState.storyId] = currentStoryState;

    localStorage.setItem(STORY_STATE_KEY, JSON.stringify(savedStories));
    console.log('Progress saved:', currentStoryState.storyId);
}

/**
 * Load saved progress for a story
 * @param {string} storyId - Story ID to load
 * @returns {StoryState|null} Loaded state or null
 */
function loadProgress(storyId) {
    const savedStories = JSON.parse(localStorage.getItem(STORY_STATE_KEY) || '{}');

    if (savedStories[storyId]) {
        currentStoryState = savedStories[storyId];
        console.log('Progress loaded:', storyId);
        return currentStoryState;
    }

    return null;
}

/**
 * Check if there's saved progress for a story
 * @param {string} storyId - Story ID to check
 * @returns {boolean} Whether saved progress exists
 */
function hasSavedProgress(storyId) {
    const savedStories = JSON.parse(localStorage.getItem(STORY_STATE_KEY) || '{}');
    return !!savedStories[storyId];
}

/**
 * Delete saved progress for a story
 * @param {string} storyId - Story ID to delete
 */
function deleteProgress(storyId) {
    const savedStories = JSON.parse(localStorage.getItem(STORY_STATE_KEY) || '{}');
    delete savedStories[storyId];
    localStorage.setItem(STORY_STATE_KEY, JSON.stringify(savedStories));

    if (currentStoryState?.storyId === storyId) {
        currentStoryState = null;
    }
}

/**
 * Generate prompt context for AI based on current state
 * @returns {Object} System prompt and user message for AI
 */
function getPromptContext() {
    if (!currentStoryState) {
        console.error('No active story state!');
        return null;
    }

    const { metadata, history, variables, currentChoices } = currentStoryState;

    // Get last few history entries for context (max 10)
    const recentHistory = history.slice(-10);
    const historyText = recentHistory.map(entry => {
        if (entry.role === 'narrator') {
            return `[Erzähler]: ${entry.content}`;
        } else {
            return `[Spieler wählte]: "${entry.choice}"`;
        }
    }).join('\n\n');

    const systemPrompt = `Du bist eine narrative KI-Engine für interaktive ${metadata.genre} Geschichten.
Deine Aufgabe ist es, die Geschichte basierend auf den Entscheidungen des Spielers fortzusetzen.

STIL-REGELN:
- Genre: ${metadata.genre}
- Ton: ${metadata.tone} (atmosphärisch, cinematisch)
- Perspektive: Zweite Person ("Du betrittst die Taverne...")
- Schreibe auf Deutsch
- Halte jeden Abschnitt bei 3-5 Sätzen
- Sei beschreibend aber nicht ausschweifend

WICHTIGE REGELN:
- Beende die Geschichte NIEMALS
- Gib genau 2-4 neue Entscheidungsoptionen
- Halte Konsistenz mit vorherigen Ereignissen
- Berücksichtige die Spielervariablen (Mut, Vertrauen, Gesundheit)

ANTWORT-FORMAT (strict JSON):
{
  "narrative": "Der narrative Text der Szene...",
  "choices": ["Erste Option", "Zweite Option", "Dritte Option"],
  "variableChanges": {"courage": 1, "health": -10}
}

LORE:
${metadata.lore || 'Eine dunkle Fantasy-Welt voller Geheimnisse.'}

CHARAKTERE:
${metadata.characters?.map(c => `- ${c.name}: ${c.description}`).join('\n') || 'Keine spezifischen Charaktere definiert.'}`;

    const userMessage = `AKTUELLER SPIELSTAND:
Kapitel: ${currentStoryState.chapter}
Variablen: Mut=${variables.courage}, Vertrauen=${variables.trust}, Gesundheit=${variables.health}, Karma=${variables.karma}

BISHERIGER VERLAUF:
${historyText}

SPIELER HAT GEWÄHLT: "${currentChoices[0] || 'Weiter'}"

Setze die Geschichte fort und gib genau 2-4 neue Optionen. Antworte NUR mit dem JSON-Objekt.`;

    return { systemPrompt, userMessage };
}

/**
 * Generate prompt for a specific choice
 * @param {string} choice - The selected choice
 * @returns {Object} System prompt and user message
 */
function getPromptForChoice(choice) {
    if (!currentStoryState) {
        console.error('No active story state!');
        return null;
    }

    const { metadata, history, variables } = currentStoryState;

    // Get last few history entries for context
    const recentHistory = history.slice(-8);
    const historyText = recentHistory.map(entry => {
        if (entry.role === 'narrator') {
            return `[Erzähler]: ${entry.content}`;
        } else {
            return `[Spieler wählte]: "${entry.choice}"`;
        }
    }).join('\n\n');

    const systemPrompt = `Du bist eine narrative KI-Engine für interaktive ${metadata.genre} Geschichten.
Schreibe atmosphärischen, cinematischen Text auf Deutsch in der zweiten Person.

WICHTIGE REGELN:
- Beende die Geschichte NIEMALS
- Gib genau 2-4 neue Entscheidungsoptionen
- Halte Konsistenz mit vorherigen Ereignissen
- Jeder Abschnitt: 3-5 spannende Sätze

ANTWORT-FORMAT (NUR JSON, kein anderer Text):
{
  "narrative": "Der narrative Text der Szene...",
  "choices": ["Option 1", "Option 2", "Option 3"],
  "variableChanges": {}
}

WELT: ${metadata.lore || 'Dunkle Fantasy-Welt.'}`;

    const userMessage = `KONTEXT:
${historyText}

SPIELER-STATS: Mut=${variables.courage}, Vertrauen=${variables.trust}, Gesundheit=${variables.health}

SPIELER WÄHLT: "${choice}"

Führe die Geschichte weiter. Antworte NUR mit JSON.`;

    return { systemPrompt, userMessage };
}

/**
 * Get current story state
 * @returns {StoryState|null} Current state
 */
function getCurrentStoryState() {
    return currentStoryState;
}

/**
 * Get all saved story progress
 * @returns {Object} All saved stories
 */
function getAllSavedProgress() {
    return JSON.parse(localStorage.getItem(STORY_STATE_KEY) || '{}');
}

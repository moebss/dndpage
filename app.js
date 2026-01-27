/* ========================================
   DnD Story Forge - JavaScript mit Vercel Serverless Functions
   ======================================== */

// ========================================
// Configuration
// ========================================
// API calls go to /api/ routes (handled by Vercel serverless functions)

// ========================================
// Data Storage (LocalStorage)
// ========================================
const STORAGE_KEYS = {
    characters: 'dnd_characters',
    stories: 'dnd_stories',
    session: 'dnd_session'
};

function getData(key) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
}

function saveData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

// ========================================
// Vercel Serverless API Integration
// ========================================
async function callPerplexityAPI(systemPrompt, userMessage) {
    try {
        const response = await fetch('/api/perplexity', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ systemPrompt, userMessage })
        });

        const text = await response.text();
        let data;

        try {
            data = JSON.parse(text);
        } catch (e) {
            console.error('Invalid JSON from API:', text);
            const snippet = text.substring(0, 100);
            throw new Error(`Die KI-Antwort war ungültig. (Vorschau: ${snippet}...)`);
        }

        if (!response.ok) {
            throw new Error(data.error || `Server-Fehler (${response.status})`);
        }

        return data.content;
    } catch (err) {
        console.error('Fetch error:', err);
        if (err.message.includes('failed to fetch')) {
            throw new Error('Verbindung zum Server fehlgeschlagen. Bitte prüfe deine Internetverbindung oder versuche es in einer Minute erneut.');
        }
        throw err;
    }
}

// ========================================
// Gemini Image Generation (via Vercel)
// ========================================
async function generateImageWithGemini(prompt) {
    const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompt })
    });

    const data = await response.json();

    if (!response.ok) {
        console.error('Gemini Error:', data);
        throw new Error(data.error || 'Gemini API-Fehler');
    }

    return data.imageUrl;
}

// ========================================
// Navigation
// ========================================
function navigateTo(pageName) {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.page === pageName) {
            link.classList.add('active');
        }
    });

    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageName).classList.add('active');

    if (pageName === 'characters') {
        renderCharacterList();
    } else if (pageName === 'stories') {
        renderStoryList();
        renderStoryCharacterSelect();
    } else if (pageName === 'table') {
        renderTableSetup();
    } else if (pageName === 'story-select') {
        renderStorySelectGrid();
    }
}


document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        navigateTo(link.dataset.page);
    });
});

// ========================================
// Notifications
// ========================================

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => notification.classList.add('show'), 10);
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function showLoading(element, show = true) {
    if (show) {
        element.classList.add('loading');
        element.disabled = true;
    } else {
        element.classList.remove('loading');
        element.disabled = false;
    }
}

// ========================================
// Character System
// ========================================
let currentCharacter = {
    id: null,
    name: '',
    race: 'mensch',
    charClass: 'krieger',
    type: 'pc',
    background: '',
    avatar: null,
    attributes: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    inventory: [
        { name: 'Schwert', qty: 1 },
        { name: 'Heiltrank', qty: 3 }
    ]
};

const raceNames = {
    mensch: 'Mensch',
    elf: 'Elf',
    zwerg: 'Zwerg',
    ork: 'Ork',
    halbling: 'Halbling',
    tiefling: 'Tiefling',
    dragonborn: 'Drachenblütiger'
};

const classNames = {
    krieger: 'Krieger',
    magier: 'Magier',
    schurke: 'Schurke',
    kleriker: 'Kleriker',
    waldläufer: 'Waldläufer',
    barde: 'Barde',
    paladin: 'Paladin'
};

function setCharacterType(type) {
    currentCharacter.type = type;
    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.value === type);
    });
}

function rollDice(sides, count = 1) {
    let results = [];
    for (let i = 0; i < count; i++) {
        results.push(Math.floor(Math.random() * sides) + 1);
    }
    return results;
}

function roll4d6DropLowest() {
    const rolls = rollDice(6, 4);
    rolls.sort((a, b) => a - b);
    return rolls.slice(1).reduce((a, b) => a + b, 0);
}

function calculateModifier(value) {
    return Math.floor((value - 10) / 2);
}

function updateAttributeDisplay(attr, value) {
    const bar = document.getElementById(`${attr}Bar`);
    const val = document.getElementById(`${attr}Val`);
    const mod = document.getElementById(`${attr}Mod`);

    if (bar && val && mod) {
        bar.style.width = `${(value / 20) * 100}%`;
        val.textContent = value;
        const modifier = calculateModifier(value);
        mod.textContent = `(${modifier >= 0 ? '+' : ''}${modifier})`;
    }
}

function rollAttributes() {
    const attrs = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
    attrs.forEach(attr => {
        const value = roll4d6DropLowest();
        currentCharacter.attributes[attr] = value;
        updateAttributeDisplay(attr, value);
    });
    showNotification('Attribute gewürfelt! 🎲');
}

// AI-Powered Background Generation
async function generateBackground() {
    const btn = event.target;
    const race = document.getElementById('charRace').value;
    const charClass = document.getElementById('charClass').value;
    const name = document.getElementById('charName').value || 'Ein Held';
    const type = currentCharacter.type;

    const systemPrompt = `Du bist ein kreativer Fantasy-Autor für D&D/Pen&Paper Rollenspiele. 
Erstelle kurze, packende Hintergrundgeschichten für Charaktere. 
Antworte NUR mit der Geschichte, ohne Einleitung oder Erklärung.
Die Geschichte sollte 3-4 Sätze lang sein und einen interessanten Hook enthalten.`;

    const userMessage = `Erstelle eine Hintergrundgeschichte für einen ${type === 'npc' ? 'NPC' : 'Spielercharakter'}:
Name: ${name}
Rasse: ${raceNames[race]}
Klasse: ${classNames[charClass]}

Die Geschichte soll mysteriös und interessant sein, mit einem persönlichen Antrieb oder Geheimnis.`;

    try {
        showLoading(btn, true);
        btn.textContent = '⏳ Generiere...';

        const background = await callPerplexityAPI(systemPrompt, userMessage);
        document.getElementById('charBackground').value = background;
        currentCharacter.background = background;

        showNotification('Hintergrund generiert! ✨');
    } catch (error) {
        showNotification(error.message, 'error');
    } finally {
        showLoading(btn, false);
        btn.textContent = '✨ Generieren';
    }
}

// AI-Powered Random Character
async function generateRandomCharacter() {
    const btn = event.target;

    const systemPrompt = `Du bist ein D&D Charaktergenerator. Erstelle einen zufälligen, interessanten Charakter.
Antworte NUR im folgenden JSON-Format, ohne zusätzlichen Text:
{
  "name": "Fantasiename",
  "race": "mensch|elf|zwerg|ork|halbling|tiefling|dragonborn",
  "class": "krieger|magier|schurke|kleriker|waldläufer|barde|paladin",
  "type": "pc|npc",
  "background": "2-3 Sätze Hintergrundgeschichte",
  "str": 8-18,
  "dex": 8-18,
  "con": 8-18,
  "int": 8-18,
  "wis": 8-18,
  "cha": 8-18
}`;

    const userMessage = `Generiere einen komplett zufälligen D&D Charakter. Sei kreativ mit dem Namen und der Hintergrundgeschichte!`;

    try {
        showLoading(btn, true);
        btn.textContent = '⏳ Generiere...';

        const response = await callPerplexityAPI(systemPrompt, userMessage);

        // Robust parsing of JSON from response
        let char;
        try {
            char = JSON.parse(response);
        } catch (e) {
            const startIdx = response.indexOf('{');
            const endIdx = response.lastIndexOf('}');
            if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) {
                throw new Error('Kein JSON in Antwort gefunden');
            }
            const jsonStr = response.substring(startIdx, endIdx + 1);
            char = JSON.parse(jsonStr);
        }

        // Apply to form
        document.getElementById('charName').value = char.name;
        document.getElementById('charRace').value = char.race;
        document.getElementById('charClass').value = char.class;
        document.getElementById('charBackground').value = char.background;

        setCharacterType(char.type);

        // Attributes
        currentCharacter.attributes = {
            str: char.str || 10,
            dex: char.dex || 10,
            con: char.con || 10,
            int: char.int || 10,
            wis: char.wis || 10,
            cha: char.cha || 10
        };

        ['str', 'dex', 'con', 'int', 'wis', 'cha'].forEach(attr => {
            updateAttributeDisplay(attr, currentCharacter.attributes[attr]);
        });

        currentCharacter.background = char.background;

        // Generate avatar emoji
        generateAvatarEmoji();

        showNotification('Charakter generiert! 🧙‍♂️');
    } catch (error) {
        console.error(error);
        showNotification('Fehler: ' + error.message, 'error');
        // Fallback to local generation
        generateRandomCharacterLocal();
    } finally {
        showLoading(btn, false);
        btn.textContent = '🎲 Zufällig';
    }
}

function generateRandomCharacterLocal() {
    const race = document.getElementById('charRace');
    const charClass = document.getElementById('charClass');

    const races = [...race.options].map(o => o.value);
    const classes = [...charClass.options].map(o => o.value);

    race.value = races[Math.floor(Math.random() * races.length)];
    charClass.value = classes[Math.floor(Math.random() * classes.length)];

    const namesByRace = {
        mensch: ['Aldric', 'Elara', 'Marcus', 'Lydia', 'Thorin', 'Mira'],
        elf: ['Aelindor', 'Lirael', 'Thalion', 'Elowen', 'Faelar', 'Ithilwen'],
        zwerg: ['Durin', 'Helga', 'Thorak', 'Bruni', 'Gimrak', 'Hilda'],
        ork: ['Grakk', 'Urga', 'Thok', 'Mogra', 'Zulgash', 'Shara'],
        halbling: ['Bilbo', 'Rosie', 'Merry', 'Poppy', 'Pippin', 'Daisy'],
        tiefling: ['Morthos', 'Lilith', 'Zariel', 'Nyx', 'Damien', 'Seraphina'],
        dragonborn: ['Rhogar', 'Sora', 'Torinn', 'Mishann', 'Bharash', 'Kava']
    };

    const names = namesByRace[race.value] || namesByRace.mensch;
    document.getElementById('charName').value = names[Math.floor(Math.random() * names.length)];

    rollAttributes();
    generateAvatarEmoji();
    setCharacterType(Math.random() > 0.3 ? 'pc' : 'npc');
}

function generateAvatarEmoji() {
    const preview = document.getElementById('avatarPreview');
    preview.innerHTML = `<div style="font-size: 3rem; color: var(--color-text-muted); opacity: 0.3;">👤</div>`;
    currentCharacter.avatarType = 'placeholder';
    currentCharacter.avatar = null;
}

// AI-Powered Avatar Generation with Gemini
async function generateAvatar() {
    const btn = event.target;
    const race = document.getElementById('charRace').value;
    const charClass = document.getElementById('charClass').value;
    const name = document.getElementById('charName').value || 'Ein Held';
    const background = document.getElementById('charBackground').value;

    const prompt = `Fantasy RPG character portrait: A ${raceNames[race]} ${classNames[charClass]} named ${name}. ${background ? 'Background: ' + background.substring(0, 100) : ''} Portrait style, dramatic lighting, detailed fantasy art.`;

    try {
        showLoading(btn, true);
        btn.textContent = '⏳ Generiere...';

        const imageUrl = await generateImageWithGemini(prompt);

        if (imageUrl) {
            const preview = document.getElementById('avatarPreview');
            preview.innerHTML = `<img src="${imageUrl}" alt="Avatar" style="width: 100%; height: 100%; object-fit: cover; border-radius: 10px;">`;
            currentCharacter.avatar = imageUrl;
            currentCharacter.avatarType = 'image';
            showNotification('Avatar generiert! 🎨');
        } else {
            showNotification('Bild konnte nicht generiert werden.', 'warning');
        }
    } catch (error) {
        console.error('Avatar generation error:', error);
        showNotification('Fehler bei der Bildgenerierung: ' + error.message, 'error');
    } finally {
        showLoading(btn, false);
        btn.textContent = '🎨 Avatar generieren';
    }
}

function addInventoryItem() {
    const input = document.getElementById('newItemName');
    const itemName = input.value.trim();

    if (itemName) {
        currentCharacter.inventory.push({ name: itemName, qty: 1 });
        renderInventory();
        input.value = '';
    }
}

function renderInventory() {
    const list = document.getElementById('inventoryList');
    list.innerHTML = currentCharacter.inventory.map((item, index) => `
        <div class="inventory-item">
            <span>${item.name}</span>
            <span class="item-qty">${item.qty}x</span>
        </div>
    `).join('');
}

// Character Form Submit
document.getElementById('characterForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const characterData = {
        name: document.getElementById('charName').value,
        race: document.getElementById('charRace').value,
        charClass: document.getElementById('charClass').value, // Note: DB uses 'class' usually but let's stick to what schema handles or map it
        class: document.getElementById('charClass').value, // For DB mapping
        type: currentCharacter.type,
        background: document.getElementById('charBackground').value,
        avatar: currentCharacter.avatar, // for local
        avatar_url: currentCharacter.avatar, // for DB
        attributes: { ...currentCharacter.attributes },
        inventory: [...currentCharacter.inventory]
    };

    if (window.currentUser) {
        if (currentCharacter.id && typeof currentCharacter.id === 'string') {
            // Update if ID is string (UUID from DB)
            // Not implemented in auth.js helpers yet? 
            // actually saveCharacterToBackend is POST (create). 
            // We need updateCharacterInBackend.
            // For now let's just create new or implement update in auth.js?
            // The plan didn't explicitly implement update function in auth.js, only save (POST).
            // But server.js supports PUT.
            // Let's assume create for now or I should add update support.
            // Wait, editCharacter sets currentCharacter.id.
            // If I am editing, I should PUT.
            await updateCharacterInBackend(currentCharacter.id, characterData);
        } else {
            await saveCharacterToBackend(characterData);
        }
    } else {
        const character = {
            id: currentCharacter.id || Date.now(),
            ...characterData,
            createdAt: new Date().toISOString()
        };
        // Local logic
        const characters = getData(STORAGE_KEYS.characters);
        const existingIndex = characters.findIndex(c => c.id === character.id);

        if (existingIndex >= 0) {
            characters[existingIndex] = character;
        } else {
            characters.push(character);
        }

        saveData(STORAGE_KEYS.characters, characters);
    }

    renderCharacterList();
    resetCharacterForm();

    showNotification('Charakter gespeichert! ⚔️');
});

function resetCharacterForm() {
    document.getElementById('characterForm').reset();
    currentCharacter = {
        id: null,
        name: '',
        race: 'mensch',
        charClass: 'krieger',
        type: 'pc',
        background: '',
        avatar: null,
        attributes: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
        inventory: [
            { name: 'Schwert', qty: 1 },
            { name: 'Heiltrank', qty: 3 }
        ]
    };

    ['str', 'dex', 'con', 'int', 'wis', 'cha'].forEach(attr => {
        updateAttributeDisplay(attr, 10);
    });

    renderInventory();
    document.getElementById('avatarPreview').innerHTML = '<span class="avatar-placeholder">👤</span>';
    setCharacterType('pc');
}

async function renderCharacterList() {
    const list = document.getElementById('characterList');
    list.innerHTML = '<div style="text-align: center; padding: 20px;">Lade Charaktere...</div>';

    let characters = [];
    if (window.currentUser) {
        characters = await loadUserCharacters();
    } else {
        characters = getData(STORAGE_KEYS.characters);
    }

    if (characters.length === 0) {
        list.innerHTML = '<p style="color: var(--color-text-muted); text-align: center; padding: 40px;">Noch keine Charaktere erstellt. Starte jetzt!</p>';
        return;
    }

    list.innerHTML = characters.map(char => `
        <div class="character-card">
            <div class="character-card-header">
                <div class="char-avatar">${char.avatar_url ? `<img src="${char.avatar_url}" style="width:100%;height:100%;object-fit:cover;border-radius:8px;">` : (char.avatar || '👤')}</div>
                <div class="char-info">
                    <h4>${char.name}</h4>
                    <p>${raceNames[char.race] || char.race} ${classNames[char.charClass] || char.class || char.charClass}</p>
                    <span class="char-type-badge ${char.type}">${(char.type || 'pc').toUpperCase()}</span>
                </div>
            </div>
            <div class="char-attributes-mini">
                <span class="attr-mini">STR ${char.attributes?.str || 10}</span>
                <span class="attr-mini">DEX ${char.attributes?.dex || 10}</span>
                <span class="attr-mini">CON ${char.attributes?.con || 10}</span>
                <span class="attr-mini">INT ${char.attributes?.int || 10}</span>
                <span class="attr-mini">WIS ${char.attributes?.wis || 10}</span>
                <span class="attr-mini">CHA ${char.attributes?.cha || 10}</span>
            </div>
            <div class="character-card-actions">
                <button class="btn btn-secondary btn-small" onclick="editCharacter('${char.id}')">✏️ Bearbeiten</button>
                <button class="btn btn-small" style="background: var(--color-red);" onclick="deleteCharacter('${char.id}')">🗑️</button>
            </div>
        </div>
    `).join('');
}

function editCharacter(id) {
    // Search in loaded characters (global cache set in renderCharacterList)
    // Fallback to localStorage if not cached (should not happen if render called)
    const characters = window.loadedCharacters || getData(STORAGE_KEYS.characters);
    // ID from backend is string (UUID), from local is number. 
    // Use loose comparison or string conversion to match
    const char = characters.find(c => c.id == id);

    if (char) {
        currentCharacter = { ...char };
        document.getElementById('charName').value = char.name;
        document.getElementById('charRace').value = char.race;
        // Handle class field name difference (db: class, local: charClass)
        document.getElementById('charClass').value = char.charClass || char.class || 'krieger';
        document.getElementById('charBackground').value = char.background;

        setCharacterType(char.type);

        if (char.attributes) {
            ['str', 'dex', 'con', 'int', 'wis', 'cha'].forEach(attr => {
                updateAttributeDisplay(attr, char.attributes[attr]);
            });
        }

        renderInventory();

        if (char.avatar || char.avatar_url) {
            const avatarSrc = char.avatar_url || char.avatar;
            if (avatarSrc.startsWith('http') || avatarSrc.startsWith('/')) {
                document.getElementById('avatarPreview').innerHTML = `<img src="${avatarSrc}" style="width:100%;height:100%;object-fit:cover;border-radius:10px;">`;
            } else {
                document.getElementById('avatarPreview').innerHTML = `<span style="font-size: 3rem;">${avatarSrc}</span>`;
            }
        }

        document.querySelector('.character-form-panel').scrollIntoView({ behavior: 'smooth' });
    }
}

async function deleteCharacter(id) {
    if (confirm('Charakter wirklich löschen?')) {
        let success = false;
        if (window.currentUser) {
            success = await deleteCharacterFromBackend(id);
        } else {
            const characters = getData(STORAGE_KEYS.characters).filter(c => c.id !== id);
            saveData(STORAGE_KEYS.characters, characters);
            success = true;
        }

        if (success) {
            renderCharacterList();
            showNotification('Charakter gelöscht 🗑️');
        } else {
            showNotification('Fehler beim Löschen', 'error');
        }
    }
}

// ========================================
// Story System with AI
// ========================================
async function generateStory() {
    const btn = event.target;
    const title = document.getElementById('storyTitle').value || 'Das namenlose Abenteuer';
    const genre = document.getElementById('storyGenre').value;
    const tone = document.getElementById('storyTone').value;
    const length = document.getElementById('storyLength').value;

    const selectedChars = [...document.querySelectorAll('.story-char-checkbox:checked')]
        .map(cb => {
            const characters = getData(STORAGE_KEYS.characters);
            return characters.find(c => c.id === parseInt(cb.value));
        })
        .filter(Boolean);

    const charInfo = selectedChars.length > 0
        ? `Beteiligte Charaktere: ${selectedChars.map(c => `${c.name} (${raceNames[c.race]} ${classNames[c.charClass]})`).join(', ')}`
        : 'Keine spezifischen Charaktere vorgegeben.';

    const lengthInfo = {
        oneshot: '1 Session, 2-3 Szenen',
        short: '2-3 Sessions, 4-5 Szenen',
        campaign: '10+ Sessions, 6-8 Hauptszenen'
    };

    const systemPrompt = `Du bist ein erfahrener D&D Dungeon Master und Autor von Fantasy-Abenteuern.
Erstelle eine strukturierte Abenteuergeschichte im JSON-Format.
Antworte NUR mit dem JSON, ohne zusätzlichen Text oder Markdown.`;

    const userMessage = `Erstelle ein ${genre} Abenteuer mit folgenden Details:
Titel: ${title}
Genre: ${genre}
Ton: ${tone}
Länge: ${lengthInfo[length]}
${charInfo}

Antworte im folgenden JSON-Format:
{
  "title": "Titel",
  "synopsis": "3-4 Sätze Zusammenfassung",
  "hook": "Der Einstieg/Aufhänger für die Spieler",
  "scenes": [
    {"title": "Szenenname", "description": "Detaillierte Beschreibung", "challenge": "Herausforderung/Encounter"}
  ],
  "npcs": [
    {"name": "NPC Name", "role": "Rolle", "motivation": "Motivation"}
  ],
  "climax": "Beschreibung des Höhepunkts",
  "rewards": ["Belohnung 1", "Belohnung 2"]
}`;

    try {
        showLoading(btn, true);
        btn.textContent = '⏳ Generiere Story...';

        const response = await callPerplexityAPI(systemPrompt, userMessage);

        // Find and parse JSON from response
        let story;
        try {
            // Try direct parse first
            story = JSON.parse(response);
        } catch (e) {
            // Try to extract JSON object
            const startIdx = response.indexOf('{');
            const endIdx = response.lastIndexOf('}');
            if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) {
                throw new Error('Kein JSON in Antwort gefunden');
            }
            const jsonStr = response.substring(startIdx, endIdx + 1);
            story = JSON.parse(jsonStr);
        }

        story.genre = genre;
        story.tone = tone;
        story.length = length;

        // Display story
        const content = document.getElementById('storyContent');
        content.innerHTML = `
            <h4>📜 ${story.title}</h4>
            <p><strong>Synopsis:</strong> ${story.synopsis}</p>
            
            <h4>🎣 Aufhänger</h4>
            <p>${story.hook}</p>
            
            <h4>🎭 Szenen</h4>
            ${story.scenes.map((scene, i) => `
                <div style="margin-bottom: 16px; padding: 12px; background: var(--color-bg-dark); border-radius: 8px;">
                    <strong>Szene ${i + 1}: ${scene.title}</strong>
                    <p style="margin: 8px 0;">${scene.description}</p>
                    <p style="color: var(--color-accent);">⚔️ ${scene.challenge}</p>
                </div>
            `).join('')}
            
            ${story.npcs && story.npcs.length > 0 ? `
            <h4>👥 NPCs</h4>
            ${story.npcs.map(npc => `
                <div style="margin-bottom: 8px;">
                    <strong>${npc.name}</strong> - ${npc.role}
                    <p style="font-size: 0.9rem; color: var(--color-text-muted);">${npc.motivation}</p>
                </div>
            `).join('')}
            ` : ''}
            
            <h4>🔥 Höhepunkt</h4>
            <p>${story.climax}</p>
            
            <h4>🏆 Belohnungen</h4>
            <ul>${story.rewards.map(r => `<li>${r}</li>`).join('')}</ul>
        `;

        document.getElementById('storyPreview').classList.remove('hidden');
        window.currentStory = story;

        showNotification('Story generiert! 📖');
    } catch (error) {
        console.error(error);
        showNotification('Fehler: ' + error.message, 'error');
        // Fallback
        generateStoryLocal();
    } finally {
        showLoading(btn, false);
        btn.textContent = '✨ Geschichte generieren';
    }
}

function generateStoryLocal() {
    const title = document.getElementById('storyTitle').value || 'Das namenlose Abenteuer';
    const genre = document.getElementById('storyGenre').value;

    const templates = {
        fantasy: {
            hook: 'Ein alter Zauberer bittet die Gruppe um Hilfe bei der Suche nach einem verlorenen Artefakt.',
            scenes: [
                { title: 'Die Taverne des Schicksals', description: 'Die Helden treffen sich in einer heruntergekommenen Taverne.', challenge: 'Social Encounter mit dem Auftraggeber' },
                { title: 'Der dunkle Wald', description: 'Ein von Kreaturen bewohnter Wald muss durchquert werden.', challenge: 'Kampf gegen Goblins' },
                { title: 'Die vergessene Ruine', description: 'Eine alte Ruine voller Rätsel und Fallen.', challenge: 'Puzzle-Raum' },
                { title: 'Die finale Konfrontation', description: 'Der Endboss erwartet sie.', challenge: 'Boss-Kampf' }
            ]
        }
    };

    const template = templates[genre] || templates.fantasy;
    const story = {
        title,
        synopsis: template.hook,
        scenes: template.scenes,
        genre,
        climax: 'Ein epischer Kampf entscheidet über das Schicksal.',
        rewards: ['Gold', 'Magisches Item', 'Erfahrungspunkte']
    };

    const content = document.getElementById('storyContent');
    content.innerHTML = `
        <h4>📜 ${story.title}</h4>
        <p>${story.synopsis}</p>
        <h4>🎭 Szenen</h4>
        ${story.scenes.map((s, i) => `<p><strong>Szene ${i + 1}:</strong> ${s.title} - ${s.description}</p>`).join('')}
    `;

    document.getElementById('storyPreview').classList.remove('hidden');
    window.currentStory = story;
}

function renderStoryCharacterSelect() {
    const characters = getData(STORAGE_KEYS.characters);
    const container = document.getElementById('storyCharacterSelect');

    container.innerHTML = characters.map(char => `
        <label class="char-select-item">
            <input type="checkbox" value="${char.id}" class="story-char-checkbox">
            <span>${char.avatar || '👤'} ${char.name}</span>
        </label>
    `).join('') || '<p style="color: var(--color-text-muted);">Erstelle zuerst Charaktere</p>';
}

async function saveStory() {
    if (!window.currentStory) return;

    const storyData = {
        title: window.currentStory.title,
        genre: window.currentStory.genre,
        tone: window.currentStory.tone,
        length: window.currentStory.length,
        synopsis: window.currentStory.synopsis,
        content: window.currentStory, // Store full JSON
        created_at: new Date().toISOString()
    };

    // Note: Backend schema expects: user_id, title, genre, tone, length, synopsis, content (jsonb)

    let success = false;
    if (window.currentUser) {
        // Always create new for now as we don't edit stories yet
        const savedStory = await saveStoryToBackend(storyData);
        if (savedStory) success = true;
    } else {
        const story = {
            id: Date.now(),
            ...window.currentStory,
            createdAt: new Date().toISOString()
        };
        const stories = getData(STORAGE_KEYS.stories);
        stories.push(story);
        saveData(STORAGE_KEYS.stories, stories);
        success = true;
    }

    if (success) {
        renderStoryList();
        document.getElementById('storyPreview').classList.add('hidden');
        document.getElementById('storyForm').reset();
        showNotification('Geschichte gespeichert! 📖');
    } else {
        showNotification('Fehler beim Speichern', 'error');
    }
}

async function renderStoryList() {
    const list = document.getElementById('storyList');
    list.innerHTML = '<div style="text-align: center; padding: 20px;">Lade Geschichten...</div>';

    let stories = [];
    if (window.currentUser) {
        stories = await loadUserStories();
    } else {
        stories = getData(STORAGE_KEYS.stories);
    }
    window.loadedStories = stories; // Cache for view

    if (stories.length === 0) {
        list.innerHTML = '<p style="color: var(--color-text-muted); text-align: center; padding: 40px;">Noch keine Geschichten.</p>';
        return;
    }

    list.innerHTML = stories.map(story => `
        <div class="story-card">
            <h4>📖 ${story.title}</h4>
            <div class="story-meta">
                <span>🎭 ${story.genre || 'Fantasy'}</span>
                <span>📅 ${new Date(story.created_at || story.createdAt).toLocaleDateString('de-DE')}</span>
            </div>
            <p style="font-size: 0.9rem; color: var(--color-text-muted); margin-bottom: 12px;">${(story.synopsis || '').substring(0, 100)}...</p>
            <div class="story-card-actions">
                <button class="btn btn-secondary btn-small" onclick="viewStory('${story.id}')">👁️</button>
                <button class="btn btn-small" style="background: var(--color-red);" onclick="deleteStory('${story.id}')">🗑️</button>
            </div>
        </div>
    `).join('');
}

function viewStory(id) {
    const stories = window.loadedStories || getData(STORAGE_KEYS.stories);
    const story = stories.find(s => s.id == id);

    if (story) {
        window.currentStory = story;
        const content = document.getElementById('storyContent');

        // Handle backend story structure or local
        const s = story.content || story;

        content.innerHTML = `
            <h4>📜 ${s.title}</h4>
            <p><strong>Synopsis:</strong> ${s.synopsis}</p>
            <h4>🎣 Aufhänger</h4>
            <p>${s.hook || ''}</p>
            <h4>🎭 Szenen</h4>
            ${s.scenes ? s.scenes.map((scene, i) => `
                <div style="margin-bottom: 16px; padding: 12px; background: var(--color-bg-dark); border-radius: 8px;">
                    <strong>Szene ${i + 1}: ${scene.title}</strong>
                    <p style="margin: 8px 0;">${scene.description}</p>
                    <p style="color: var(--color-accent);">⚔️ ${scene.challenge || ''}</p>
                </div>
            `).join('') : '<p>Keine Szenen.</p>'}
            
            <h4>🔥 Höhepunkt</h4>
            <p>${s.climax || ''}</p>
            <h4>🏆 Belohnungen</h4>
            <ul>${s.rewards ? s.rewards.map(r => `<li>${r}</li>`).join('') : ''}</ul>
        `;
        document.getElementById('storyPreview').classList.remove('hidden');
        document.getElementById('storyPreview').scrollIntoView({ behavior: 'smooth' });
    }
}

async function deleteStory(id) {
    if (confirm('Geschichte wirklich löschen?')) {
        let success = false;
        if (window.currentUser) {
            success = await deleteStoryFromBackend(id);
        } else {
            // Local deletion
            const stories = getData(STORAGE_KEYS.stories).filter(s => s.id != id);
            saveData(STORAGE_KEYS.stories, stories);
            success = true;
        }

        if (success) {
            renderStoryList();
            showNotification('Geschichte gelöscht 🗑️');
        } else {
            showNotification('Fehler beim Löschen', 'error');
        }
    }
}

// ========================================
// Table System with AI Game Master
// ========================================
let gameSession = {
    story: null,
    characters: [],
    messages: [],
    currentScene: null,
    sceneIndex: 0
};

function renderTableSetup() {
    const stories = getData(STORAGE_KEYS.stories);
    const characters = getData(STORAGE_KEYS.characters);

    const storySelect = document.getElementById('tableStorySelect');
    storySelect.innerHTML = '<option value="">-- Geschichte wählen --</option>' +
        stories.map(s => `<option value="${s.id}">${s.title}</option>`).join('');

    const charSelect = document.getElementById('tableCharacterSelect');
    charSelect.innerHTML = characters.map(char => `
        <label class="char-select-item">
            <input type="checkbox" value="${char.id}" class="table-char-checkbox">
            <span>${char.avatar || '👤'} ${char.name} (${char.type.toUpperCase()})</span>
        </label>
    `).join('') || '<p style="color: var(--color-text-muted);">Keine Charaktere vorhanden</p>';
}

function startSession() {
    const storyId = document.getElementById('tableStorySelect').value;
    // Map values but handle potential non-numeric IDs (UUIDs)
    const selectedChars = [...document.querySelectorAll('.table-char-checkbox:checked')].map(cb => cb.value);

    if (!storyId) {
        showNotification('Bitte wähle eine Geschichte aus!', 'error');
        return;
    }

    if (selectedChars.length === 0) {
        showNotification('Bitte wähle mindestens einen Charakter aus!', 'error');
        return;
    }

    const stories = getData(STORAGE_KEYS.stories);
    const characters = getData(STORAGE_KEYS.characters);

    // Use loose comparison for ID mismatch (int vs string)
    gameSession.story = stories.find(s => s.id == storyId);

    // Filter characters
    gameSession.characters = characters.filter(c => selectedChars.some(id => id == c.id));

    gameSession.messages = [];
    gameSession.sceneIndex = 0;

    // Handle both structure types (backend 'content' wrapper or flat local)
    const storyData = gameSession.story.content || gameSession.story;
    gameSession.currentScene = storyData.scenes?.[0] || { title: 'Beginn', description: storyData.synopsis };

    // Update story reference in session to point to the correct data structure if needed
    // or just use storyData for reading.
    // Actually gameSession.story denotes the metadata. 
    // We should probably rely on 'storyData' for scenes.
    // Let's patch gameSession.story to be the convenient object?
    // Or just store storyData separately?
    // Existing code uses gameSession.story.scenes.
    if (gameSession.story.content) {
        // If it's a backend wrapper, mix content in for easier access
        Object.assign(gameSession.story, gameSession.story.content);
    }

    document.getElementById('tableSetup').classList.add('hidden');
    document.getElementById('gameView').classList.remove('hidden');

    const speakerSelect = document.getElementById('chatSpeaker');
    speakerSelect.innerHTML = '<option value="gm">🎭 Spielleiter</option>' +
        gameSession.characters.map(c => `<option value="${c.id}">${c.avatar || '👤'} ${c.name}</option>`).join('');

    document.getElementById('activeCharactersList').innerHTML =
        gameSession.characters.map(c => `<span class="active-char-badge">${c.avatar || '👤'} ${c.name}</span>`).join('');

    updateSceneDisplay();

    // AI Welcome Message
    addChatMessage('narrator', '🤖 KI-Erzähler', `Willkommen zu "${gameSession.story.title}"! ${gameSession.story.synopsis || gameSession.story.hook || 'Das Abenteuer beginnt...'}`);
}

function updateSceneDisplay() {
    if (!gameSession.currentScene) return;

    document.getElementById('sceneDescription').innerHTML = `
        <h4 style="color: var(--color-primary); margin-bottom: 8px;">${gameSession.currentScene.title}</h4>
        <p>${gameSession.currentScene.description}</p>
        ${gameSession.currentScene.challenge ? `<p style="margin-top: 8px; color: var(--color-accent);"><strong>Herausforderung:</strong> ${gameSession.currentScene.challenge}</p>` : ''}
    `;

    document.getElementById('sceneImage').innerHTML = `<div class="scene-placeholder">✨</div>`;

    // Try to generate scene image with Gemini
    generateSceneImage();
}

// Generate scene image with Gemini (with timeout)
async function generateSceneImage() {
    if (!gameSession.currentScene) return;

    const sceneContainer = document.getElementById('sceneImage');
    const scene = gameSession.currentScene;

    const prompt = `Fantasy RPG scene: ${scene.title}. ${scene.description}. Atmospheric, detailed environment, fantasy art style, dramatic lighting, no text.`;

    // Set fallback (blank)
    const showFallback = () => {
        sceneContainer.innerHTML = `<div class="scene-placeholder">🖼️</div>`;
    };

    // Show loading state
    sceneContainer.innerHTML = `<div class="scene-loading"><span>🎨</span><p>Generiere Szenenbild...</p></div>`;

    // Timeout after 8 seconds - show fallback instead
    const timeoutId = setTimeout(() => {
        console.log('Scene image timeout');
        showFallback();
    }, 8000);

    try {
        const imageUrl = await generateImageWithGemini(prompt);
        clearTimeout(timeoutId);

        if (imageUrl) {
            sceneContainer.innerHTML = `<img src="${imageUrl}" alt="Szene" style="width: 100%; height: 100%; object-fit: cover;">`;
        } else {
            showFallback();
        }
    } catch (error) {
        clearTimeout(timeoutId);
        console.error('Scene image error:', error);
        showFallback();
    }
}

async function updateScene() {
    if (!gameSession.story?.scenes) return;

    gameSession.sceneIndex = (gameSession.sceneIndex + 1) % gameSession.story.scenes.length;
    gameSession.currentScene = gameSession.story.scenes[gameSession.sceneIndex];

    updateSceneDisplay();
    addChatMessage('narrator', '🤖 KI-Erzähler', `📍 **Neue Szene: ${gameSession.currentScene.title}**\n${gameSession.currentScene.description}`);
}

function addChatMessage(role, sender, text) {
    const msg = { role, sender, text, time: new Date().toISOString() };
    gameSession.messages.push(msg);

    const container = document.getElementById('chatMessages');
    const msgEl = document.createElement('div');
    msgEl.className = `chat-message ${role}`;
    msgEl.innerHTML = `
        <div class="chat-sender">${sender}</div>
        <div class="chat-text">${text.replace(/\n/g, '<br>')}</div>
    `;
    container.appendChild(msgEl);
    container.scrollTop = container.scrollHeight;
}

function sendChatMessage() {
    const input = document.getElementById('chatInput');
    const speakerSelect = document.getElementById('chatSpeaker');
    const text = input.value.trim();

    if (!text) return;

    let sender, role;
    if (speakerSelect.value === 'gm') {
        sender = '🎭 Spielleiter';
        role = 'gm';
    } else {
        const char = gameSession.characters.find(c => c.id == speakerSelect.value);
        sender = `${char.avatar || '👤'} ${char.name}`;
        role = 'player';
    }

    addChatMessage(role, sender, text);
    input.value = '';
}

function handleChatKeypress(e) {
    if (e.key === 'Enter') {
        sendChatMessage();
    }
}

// AI Game Master Response
async function narratorRespond() {
    if (!gameSession.story) return;

    const btn = event.target;

    // Get last few messages for context
    const recentMessages = gameSession.messages.slice(-5).map(m => `${m.sender}: ${m.text}`).join('\n');

    const charDescriptions = gameSession.characters.map(c =>
        `${c.name} (${raceNames[c.race]} ${classNames[c.charClass]}, ${c.type.toUpperCase()})`
    ).join(', ');

    const systemPrompt = `Du bist ein kreativer und immersiver Dungeon Master für ein D&D Spiel.
Du erzählst die Geschichte "${gameSession.story.title}" im Stil eines ${gameSession.story.tone || 'epischen'} ${gameSession.story.genre || 'Fantasy'}-Abenteuers.
Aktuelle Szene: ${gameSession.currentScene?.title} - ${gameSession.currentScene?.description}
Charaktere: ${charDescriptions}

Regeln:
- Antworte als Erzähler in der 3. Person
- Beschreibe die Umgebung, NPCs und Ereignisse lebendig
- Reagiere auf die Aktionen der Spieler
- Stelle manchmal Fragen oder gib Entscheidungsmöglichkeiten
- Füge gelegentlich Würfelwürfe ein (z.B. "Würfle auf Wahrnehmung!")
- Halte Antworten bei 2-4 Sätzen
- Sei dramatisch und atmosphärisch`;

    const userMessage = `Bisheriger Chatverlauf:
${recentMessages}

Reagiere als Erzähler auf die letzte Nachricht und treibe die Geschichte voran.`;

    try {
        showLoading(btn, true);
        btn.textContent = '⏳ Erzähler denkt...';

        const response = await callPerplexityAPI(systemPrompt, userMessage);
        addChatMessage('narrator', '🤖 KI-Erzähler', response);

    } catch (error) {
        console.error(error);
        // Fallback responses
        const fallbacks = [
            'Die Luft wird kälter. Ein seltsames Gefühl erfasst die Gruppe...',
            'In der Ferne hört ihr ein merkwürdiges Geräusch. Was tut ihr?',
            'Ein Schatten huscht vorbei. Irgendetwas beobachtet euch!',
            'Würfelt auf Wahrnehmung! (DC 12)',
            'Ein NPC nähert sich: "Ihr seid also die Abenteurer? Ich habe einen Auftrag..."'
        ];
        addChatMessage('narrator', '🤖 KI-Erzähler', fallbacks[Math.floor(Math.random() * fallbacks.length)]);
        showNotification('API nicht verfügbar, Fallback verwendet', 'error');
    } finally {
        showLoading(btn, false);
        btn.textContent = '🤖 KI-Erzähler antworten lassen';
    }
}

// ========================================
// Character Modal Functions
// ========================================
function openCharacterModal() {
    const overlay = document.getElementById('charModalOverlay');
    if (!overlay) return;

    // Find the main character from the session
    const mainChar = gameSession.characters?.[0];
    if (mainChar) {
        populateCharacterModal(mainChar);
    }

    overlay.classList.remove('hidden');
}

function closeCharacterModal() {
    const overlay = document.getElementById('charModalOverlay');
    if (overlay) {
        overlay.classList.add('hidden');
    }
}

function populateCharacterModal(char) {
    // Portrait
    const portrait = document.getElementById('modalCharPortrait');
    if (portrait) {
        if (char.avatar_url && char.avatar_url.startsWith('http')) {
            portrait.innerHTML = `<img src="${char.avatar_url}" style="width:100%;height:100%;object-fit:cover;border-radius:13px;">`;
        } else {
            portrait.textContent = char.avatar || '🧙';
        }
    }

    // Header info
    document.getElementById('modalCharName').textContent = char.name || 'Unbekannt';
    document.getElementById('modalCharSubtitle').textContent =
        `Level ${char.level || 1} ${raceNames[char.race] || char.race} ${classNames[char.charClass || char.class] || char.charClass || 'Abenteurer'} - ${char.alignment || 'Neutral'}`;
    document.getElementById('modalCharQuote').textContent = char.background || '"Ein mutiger Abenteurer..."';

    // Details
    document.getElementById('detailRace').textContent = raceNames[char.race] || char.race || '-';
    document.getElementById('detailClass').textContent = classNames[char.charClass || char.class] || char.charClass || char.class || '-';
    document.getElementById('detailLevel').textContent = char.level || 1;
    document.getElementById('detailAlignment').textContent = char.alignment || 'Neutral';
    document.getElementById('detailFaction').textContent = char.faction || '-';
    document.getElementById('detailLocation').textContent = gameSession.currentScene?.title || '-';

    // Attributes
    if (char.attributes) {
        document.getElementById('attrStr').textContent = char.attributes.str || 10;
        document.getElementById('attrDex').textContent = char.attributes.dex || 10;
        document.getElementById('attrCon').textContent = char.attributes.con || 10;
        document.getElementById('attrInt').textContent = char.attributes.int || 10;
        document.getElementById('attrWis').textContent = char.attributes.wis || 10;
        document.getElementById('attrCha').textContent = char.attributes.cha || 10;
    }

    // Combat stats
    document.getElementById('combatAC').textContent = char.ac || 10;
    document.getElementById('combatMaxHP').textContent = char.maxHp || 20;
    document.getElementById('combatSpeed').textContent = char.speed || 30;

    // Inventory currency
    if (char.currency) {
        document.getElementById('goldPieces').textContent = char.currency.gold || 0;
        document.getElementById('silverPieces').textContent = char.currency.silver || 0;
        document.getElementById('copperPieces').textContent = char.currency.copper || 0;
    }
}

// Modal Tab Switching
document.addEventListener('DOMContentLoaded', () => {
    // Modal tabs
    document.querySelectorAll('.modal-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.modalTab;

            // Remove active from all tabs
            document.querySelectorAll('.modal-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.modal-tab-content').forEach(c => c.classList.remove('active'));

            // Activate clicked tab
            tab.classList.add('active');
            const content = document.getElementById('tab' + tabName.charAt(0).toUpperCase() + tabName.slice(1));
            if (content) content.classList.add('active');
        });
    });

    // Close modal on overlay click
    const overlay = document.getElementById('charModalOverlay');
    if (overlay) {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeCharacterModal();
            }
        });
    }

    // Nav sidebar icon clicks (optional in future)
    document.querySelectorAll('.game-nav-sidebar .nav-icon').forEach(icon => {
        icon.addEventListener('click', () => {
            document.querySelectorAll('.game-nav-sidebar .nav-icon').forEach(i => i.classList.remove('active'));
            icon.classList.add('active');
        });
    });

    // Context sidebar tabs
    document.querySelectorAll('.ctx-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.ctx-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
        });
    });
});

// Dice Roll Function
function rollDice(sides = 20) {
    const result = Math.floor(Math.random() * sides) + 1;
    const diceEmoji = sides === 20 ? '🎲' : '🎯';
    addChatMessage('player', '🎲 Würfel', `Würfelergebnis (d${sides}): **${result}**`);
    showNotification(`${diceEmoji} Würfelergebnis: ${result}`, 'info');
    return result;
}

// ========================================
// Initialize
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    renderCharacterList();
    renderInventory();

    ['str', 'dex', 'con', 'int', 'wis', 'cha'].forEach(attr => {
        updateAttributeDisplay(attr, 10);
    });

    // Check for API key
    if (!getApiKey()) {
        setTimeout(() => {
            showNotification('Tipp: Hinterlege deinen Perplexity API-Key in den Einstellungen ⚙️', 'info');
        }, 2000);
    }
});

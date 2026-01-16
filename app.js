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
    const response = await fetch('/api/perplexity', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ systemPrompt, userMessage })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'API-Fehler');
    }

    const data = await response.json();
    return data.content;
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

    if (!response.ok) {
        const error = await response.json();
        console.error('Gemini Error:', error);
        throw new Error(error.error || 'Gemini API-Fehler');
    }

    const data = await response.json();
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

        // Parse JSON from response
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('Ungültiges Format von der API');

        const char = JSON.parse(jsonMatch[0]);

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
    const race = document.getElementById('charRace').value;
    const charClass = document.getElementById('charClass').value;

    const avatarEmojis = {
        mensch: { krieger: '⚔️🧔', magier: '🧙‍♂️', schurke: '🗡️🥷', kleriker: '⛪✨', waldläufer: '🏹🌲', barde: '🎸🎭', paladin: '🛡️✝️' },
        elf: { krieger: '🧝⚔️', magier: '🧝‍♀️✨', schurke: '🧝🗡️', kleriker: '🧝‍♀️🌟', waldläufer: '🧝🏹', barde: '🧝🎵', paladin: '🧝🛡️' },
        zwerg: { krieger: '🪓🧔', magier: '📿🧔', schurke: '💎🧔', kleriker: '⛏️🌟', waldläufer: '🏔️🧔', barde: '🍺🎵', paladin: '🛡️🪓' },
        ork: { krieger: '👹⚔️', magier: '👹🔮', schurke: '👹🗡️', kleriker: '👹☠️', waldläufer: '👹🏹', barde: '👹🥁', paladin: '👹🛡️' },
        halbling: { krieger: '🍀⚔️', magier: '🍀✨', schurke: '🍀🗡️', kleriker: '🍀🌟', waldläufer: '🍀🏹', barde: '🍀🎵', paladin: '🍀🛡️' },
        tiefling: { krieger: '😈⚔️', magier: '😈🔥', schurke: '😈🗡️', kleriker: '😈✨', waldläufer: '😈🏹', barde: '😈🎭', paladin: '😈⚖️' },
        dragonborn: { krieger: '🐲⚔️', magier: '🐲🔥', schurke: '🐲🗡️', kleriker: '🐲✨', waldläufer: '🐲🏹', barde: '🐲🎵', paladin: '🐲🛡️' }
    };

    const emoji = avatarEmojis[race]?.[charClass] || '🧙‍♂️';
    const preview = document.getElementById('avatarPreview');
    preview.innerHTML = `<span style="font-size: 3rem;">${emoji}</span>`;
    currentCharacter.avatar = emoji;
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
            generateAvatarEmoji();
            showNotification('Bild konnte nicht generiert werden - Emoji verwendet', 'info');
        }
    } catch (error) {
        console.error('Avatar generation error:', error);
        generateAvatarEmoji();
        showNotification('Fehler: ' + error.message + ' - Emoji verwendet', 'error');
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
document.getElementById('characterForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const character = {
        id: currentCharacter.id || Date.now(),
        name: document.getElementById('charName').value,
        race: document.getElementById('charRace').value,
        charClass: document.getElementById('charClass').value,
        type: currentCharacter.type,
        background: document.getElementById('charBackground').value,
        avatar: currentCharacter.avatar,
        attributes: { ...currentCharacter.attributes },
        inventory: [...currentCharacter.inventory],
        createdAt: new Date().toISOString()
    };

    const characters = getData(STORAGE_KEYS.characters);
    const existingIndex = characters.findIndex(c => c.id === character.id);

    if (existingIndex >= 0) {
        characters[existingIndex] = character;
    } else {
        characters.push(character);
    }

    saveData(STORAGE_KEYS.characters, characters);
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

function renderCharacterList() {
    const characters = getData(STORAGE_KEYS.characters);
    const list = document.getElementById('characterList');

    if (characters.length === 0) {
        list.innerHTML = '<p style="color: var(--color-text-muted); text-align: center; padding: 40px;">Noch keine Charaktere erstellt. Starte jetzt!</p>';
        return;
    }

    list.innerHTML = characters.map(char => `
        <div class="character-card">
            <div class="character-card-header">
                <div class="char-avatar">${char.avatar || '👤'}</div>
                <div class="char-info">
                    <h4>${char.name}</h4>
                    <p>${raceNames[char.race] || char.race} ${classNames[char.charClass] || char.charClass}</p>
                    <span class="char-type-badge ${char.type}">${char.type.toUpperCase()}</span>
                </div>
            </div>
            <div class="char-attributes-mini">
                <span class="attr-mini">STR ${char.attributes.str}</span>
                <span class="attr-mini">DEX ${char.attributes.dex}</span>
                <span class="attr-mini">CON ${char.attributes.con}</span>
                <span class="attr-mini">INT ${char.attributes.int}</span>
                <span class="attr-mini">WIS ${char.attributes.wis}</span>
                <span class="attr-mini">CHA ${char.attributes.cha}</span>
            </div>
            <div class="character-card-actions">
                <button class="btn btn-secondary btn-small" onclick="editCharacter(${char.id})">✏️ Bearbeiten</button>
                <button class="btn btn-small" style="background: var(--color-red);" onclick="deleteCharacter(${char.id})">🗑️</button>
            </div>
        </div>
    `).join('');
}

function editCharacter(id) {
    const characters = getData(STORAGE_KEYS.characters);
    const char = characters.find(c => c.id === id);

    if (char) {
        currentCharacter = { ...char };
        document.getElementById('charName').value = char.name;
        document.getElementById('charRace').value = char.race;
        document.getElementById('charClass').value = char.charClass;
        document.getElementById('charBackground').value = char.background;

        setCharacterType(char.type);

        ['str', 'dex', 'con', 'int', 'wis', 'cha'].forEach(attr => {
            updateAttributeDisplay(attr, char.attributes[attr]);
        });

        renderInventory();

        if (char.avatar) {
            document.getElementById('avatarPreview').innerHTML = `<span style="font-size: 3rem;">${char.avatar}</span>`;
        }

        document.querySelector('.character-form-panel').scrollIntoView({ behavior: 'smooth' });
    }
}

function deleteCharacter(id) {
    if (confirm('Charakter wirklich löschen?')) {
        const characters = getData(STORAGE_KEYS.characters).filter(c => c.id !== id);
        saveData(STORAGE_KEYS.characters, characters);
        renderCharacterList();
        showNotification('Charakter gelöscht 🗑️');
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

        // Parse JSON
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('Ungültiges Format');

        const story = JSON.parse(jsonMatch[0]);
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

function saveStory() {
    if (!window.currentStory) return;

    const story = {
        id: Date.now(),
        ...window.currentStory,
        createdAt: new Date().toISOString()
    };

    const stories = getData(STORAGE_KEYS.stories);
    stories.push(story);
    saveData(STORAGE_KEYS.stories, stories);

    renderStoryList();
    document.getElementById('storyPreview').classList.add('hidden');
    document.getElementById('storyForm').reset();

    showNotification('Geschichte gespeichert! 📖');
}

function renderStoryList() {
    const stories = getData(STORAGE_KEYS.stories);
    const list = document.getElementById('storyList');

    if (stories.length === 0) {
        list.innerHTML = '<p style="color: var(--color-text-muted); text-align: center; padding: 40px;">Noch keine Geschichten.</p>';
        return;
    }

    list.innerHTML = stories.map(story => `
        <div class="story-card">
            <h4>📖 ${story.title}</h4>
            <div class="story-meta">
                <span>🎭 ${story.genre || 'Fantasy'}</span>
                <span>📅 ${new Date(story.createdAt).toLocaleDateString('de-DE')}</span>
            </div>
            <p style="font-size: 0.9rem; color: var(--color-text-muted); margin-bottom: 12px;">${(story.synopsis || '').substring(0, 100)}...</p>
            <div class="story-card-actions">
                <button class="btn btn-secondary btn-small" onclick="viewStory(${story.id})">👁️</button>
                <button class="btn btn-small" style="background: var(--color-red);" onclick="deleteStory(${story.id})">🗑️</button>
            </div>
        </div>
    `).join('');
}

function viewStory(id) {
    const stories = getData(STORAGE_KEYS.stories);
    const story = stories.find(s => s.id === id);

    if (story) {
        window.currentStory = story;
        const content = document.getElementById('storyContent');
        content.innerHTML = `
            <h4>📜 ${story.title}</h4>
            <p>${story.synopsis}</p>
            ${story.scenes ? story.scenes.map((s, i) => `<p><strong>Szene ${i + 1}:</strong> ${s.title} - ${s.description}</p>`).join('') : ''}
        `;
        document.getElementById('storyPreview').classList.remove('hidden');
    }
}

function deleteStory(id) {
    if (confirm('Geschichte wirklich löschen?')) {
        const stories = getData(STORAGE_KEYS.stories).filter(s => s.id !== id);
        saveData(STORAGE_KEYS.stories, stories);
        renderStoryList();
        showNotification('Geschichte gelöscht 🗑️');
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
    const selectedChars = [...document.querySelectorAll('.table-char-checkbox:checked')].map(cb => parseInt(cb.value));

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

    gameSession.story = stories.find(s => s.id === parseInt(storyId));
    gameSession.characters = characters.filter(c => selectedChars.includes(c.id));
    gameSession.messages = [];
    gameSession.sceneIndex = 0;
    gameSession.currentScene = gameSession.story.scenes?.[0] || { title: 'Beginn', description: gameSession.story.synopsis };

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

    const sceneEmojis = {
        'taverne': '🍺', 'wald': '🌲', 'ruine': '🏚️', 'tempel': '⛪', 'kampf': '⚔️',
        'dunkel': '🌑', 'schiff': '🚢', 'höhle': '🕳️', 'berg': '🏔️', 'stadt': '🏰',
        'markt': '🏪', 'schloss': '🏯', 'friedhof': '⚰️', 'strand': '🏖️', default: '🎭'
    };

    const title = (gameSession.currentScene.title || '').toLowerCase();
    let emoji = sceneEmojis.default;
    for (const [key, value] of Object.entries(sceneEmojis)) {
        if (title.includes(key)) { emoji = value; break; }
    }

    document.getElementById('sceneImage').innerHTML = `<span class="scene-placeholder">${emoji}</span>`;

    // Try to generate scene image with Gemini
    generateSceneImage();
}

// Generate scene image with Gemini (with timeout)
async function generateSceneImage() {
    if (!gameSession.currentScene) return;

    const sceneContainer = document.getElementById('sceneImage');
    const scene = gameSession.currentScene;

    const prompt = `Fantasy RPG scene: ${scene.title}. ${scene.description}. Atmospheric, detailed environment, fantasy art style, dramatic lighting, no text.`;

    // Helper to get emoji fallback
    const getSceneEmoji = () => {
        const sceneEmojis = {
            'taverne': '🍺', 'wald': '🌲', 'ruine': '🏚️', 'tempel': '⛪', 'kampf': '⚔️',
            'dunkel': '🌑', 'schiff': '🚢', 'höhle': '🕳️', 'berg': '🏔️', 'stadt': '🏰', default: '🎭'
        };
        const title = (scene.title || '').toLowerCase();
        let emoji = sceneEmojis.default;
        for (const [key, value] of Object.entries(sceneEmojis)) {
            if (title.includes(key)) { emoji = value; break; }
        }
        return emoji;
    };

    // Set emoji fallback
    const showEmojiFallback = () => {
        sceneContainer.innerHTML = `<span class="scene-placeholder">${getSceneEmoji()}</span>`;
    };

    // Show loading state
    sceneContainer.innerHTML = `<div class="scene-loading"><span>🎨</span><p>Generiere Szenenbild...</p></div>`;

    // Timeout after 5 seconds - show emoji instead
    const timeoutId = setTimeout(() => {
        console.log('Scene image timeout - using emoji fallback');
        showEmojiFallback();
    }, 5000);

    try {
        const imageUrl = await generateImageWithGemini(prompt);
        clearTimeout(timeoutId);

        if (imageUrl) {
            sceneContainer.innerHTML = `<img src="${imageUrl}" alt="Szene" style="width: 100%; height: 100%; object-fit: cover;">`;
        } else {
            showEmojiFallback();
        }
    } catch (error) {
        clearTimeout(timeoutId);
        console.error('Scene image error:', error);
        showEmojiFallback();
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
        const char = gameSession.characters.find(c => c.id === parseInt(speakerSelect.value));
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

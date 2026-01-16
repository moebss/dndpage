/* ========================================
   DnD Story Forge - JavaScript
   ======================================== */

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
// Navigation
// ========================================
function navigateTo(pageName) {
    // Update nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.page === pageName) {
            link.classList.add('active');
        }
    });

    // Show/hide pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageName).classList.add('active');

    // Refresh data on page load
    if (pageName === 'characters') {
        renderCharacterList();
    } else if (pageName === 'stories') {
        renderStoryList();
        renderStoryCharacterSelect();
    } else if (pageName === 'table') {
        renderTableSetup();
    }
}

// Navigation click handlers
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        navigateTo(link.dataset.page);
    });
});

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

// Random Name Generator
const namesByRace = {
    mensch: ['Aldric', 'Elara', 'Marcus', 'Lydia', 'Thorin', 'Mira', 'Cedric', 'Helena'],
    elf: ['Aelindor', 'Lirael', 'Thalion', 'Elowen', 'Faelar', 'Ithilwen', 'Aerith', 'Caelum'],
    zwerg: ['Durin', 'Helga', 'Thorak', 'Bruni', 'Gimrak', 'Hilda', 'Bofur', 'Disa'],
    ork: ['Grakk', 'Urga', 'Thok', 'Mogra', 'Zulgash', 'Shara', 'Goruk', 'Nazga'],
    halbling: ['Bilbo', 'Rosie', 'Merry', 'Poppy', 'Pippin', 'Daisy', 'Samwell', 'Lily'],
    tiefling: ['Morthos', 'Lilith', 'Zariel', 'Nyx', 'Damien', 'Seraphina', 'Malachar', 'Ravenna'],
    dragonborn: ['Rhogar', 'Sora', 'Torinn', 'Mishann', 'Bharash', 'Kava', 'Nadarr', 'Jheri']
};

const backgrounds = [
    'wurde in einem kleinen Dorf geboren, das von einer Drachenseuche heimgesucht wurde. Als einziger Überlebender schwor er/sie Rache.',
    'wuchs als Waisenkind in den Straßen einer großen Stadt auf und lernte früh, sich durchzuschlagen.',
    'entstammt einer alten Adelsfamilie, die durch Verrat alles verlor. Nun sucht er/sie nach Vergeltung.',
    'war einst ein angesehener Gelehrter, bis ein fehlgeschlagenes Experiment alles veränderte.',
    'diente jahrelang als Soldat in den großen Kriegen und trägt die Narben der Schlacht.',
    'wurde von einer mysteriösen Prophezeiung verfolgt, die sein/ihr Schicksal zu bestimmen scheint.',
    'floh vor einer arrangierten Heirat und suchte ein neues Leben voller Abenteuer.',
    'machte einen Pakt mit einer unbekannten Macht, deren Preis noch nicht enthüllt wurde.'
];

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
}

function generateBackground() {
    const race = document.getElementById('charRace').value;
    const charClass = document.getElementById('charClass').value;
    const name = document.getElementById('charName').value || 'Der Held';

    const background = backgrounds[Math.floor(Math.random() * backgrounds.length)];
    const fullBackground = `${name} ${background} Als ${charClass} der ${race}-Rasse strebt er/sie nun nach Größe und Ruhm.`;

    document.getElementById('charBackground').value = fullBackground;
    currentCharacter.background = fullBackground;
}

function generateAvatar() {
    const race = document.getElementById('charRace').value;
    const charClass = document.getElementById('charClass').value;

    // Emoji-basierte Avatare als Fallback
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

function generateRandomCharacter() {
    const race = document.getElementById('charRace');
    const charClass = document.getElementById('charClass');

    // Random race and class
    const races = [...race.options].map(o => o.value);
    const classes = [...charClass.options].map(o => o.value);

    const randomRace = races[Math.floor(Math.random() * races.length)];
    const randomClass = classes[Math.floor(Math.random() * classes.length)];

    race.value = randomRace;
    charClass.value = randomClass;

    // Random name
    const names = namesByRace[randomRace] || namesByRace.mensch;
    document.getElementById('charName').value = names[Math.floor(Math.random() * names.length)];

    // Random attributes
    rollAttributes();

    // Random background
    generateBackground();

    // Generate avatar
    generateAvatar();

    // Random type (70% PC, 30% NPC)
    setCharacterType(Math.random() > 0.3 ? 'pc' : 'npc');
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

    alert('Charakter gespeichert! ⚔️');
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
                    <p>${char.race} ${char.charClass}</p>
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

        // Scroll to form
        document.querySelector('.character-form-panel').scrollIntoView({ behavior: 'smooth' });
    }
}

function deleteCharacter(id) {
    if (confirm('Charakter wirklich löschen?')) {
        const characters = getData(STORAGE_KEYS.characters).filter(c => c.id !== id);
        saveData(STORAGE_KEYS.characters, characters);
        renderCharacterList();
    }
}

// ========================================
// Story System
// ========================================
const storyTemplates = {
    fantasy: {
        hooks: [
            'Ein alter Zauberer bittet die Gruppe um Hilfe bei der Suche nach einem verlorenen Artefakt.',
            'Gerüchte über einen Drachen, der ein nahegelegenes Dorf bedroht, erreichen die Helden.',
            'Eine mysteriöse Karte führt zu einem vergessenen Tempel voller Schätze und Gefahren.'
        ],
        scenes: [
            { title: 'Die Taverne des Schicksals', desc: 'Die Helden treffen sich in einer heruntergekommenen Taverne, wo sie ihren Auftrag erhalten.' },
            { title: 'Der dunkle Wald', desc: 'Auf dem Weg zum Ziel müssen sie einen von Kreaturen bewohnten Wald durchqueren.' },
            { title: 'Die vergessene Ruine', desc: 'Am Ziel angekommen, finden sie eine alte Ruine voller Rätsel und Fallen.' },
            { title: 'Die finale Konfrontation', desc: 'Der Endboss erwartet sie im Herzen der Ruine.' }
        ]
    },
    'dark-fantasy': {
        hooks: [
            'Eine Seuche breitet sich aus und die Helden müssen die Quelle finden.',
            'Der Nekromant im Turm weckt die Toten - jemand muss ihn aufhalten.',
            'Alpträume plagen das Königreich und der Ursprung liegt in einer anderen Dimension.'
        ],
        scenes: [
            { title: 'Vorboten des Unheils', desc: 'Überall sterben Menschen und die Zeichen deuten auf dunkle Magie hin.' },
            { title: 'Die Pestlande', desc: 'Das verdorbene Land zu durchqueren ist eine Prüfung für Körper und Geist.' },
            { title: 'Der Schattentempel', desc: 'Ein Tempel der Finsternis birgt die Antworten - und tödliche Gefahren.' },
            { title: 'Das ultimative Opfer', desc: 'Um das Böse zu besiegen, muss ein großes Opfer gebracht werden.' }
        ]
    },
    horror: {
        hooks: [
            'Eine Einladung zu einem verlassenen Herrenhaus erweist sich als tödliche Falle.',
            'Kinder verschwinden im Dorf und die Spur führt zu einem alten Brunnen.',
            'Das Schiff, das sie gebucht haben, hat ein dunkles Geheimnis.'
        ],
        scenes: [
            { title: 'Erste Anzeichen', desc: 'Seltsame Ereignisse deuten darauf hin, dass etwas nicht stimmt.' },
            { title: 'Der Wahnsinn beginnt', desc: 'Die Realität verschwimmt und Paranoia breitet sich aus.' },
            { title: 'Die schreckliche Wahrheit', desc: 'Das wahre Ausmaß des Horrors wird enthüllt.' },
            { title: 'Flucht oder Kampf', desc: 'Die Helden müssen eine Entscheidung treffen, die alles verändert.' }
        ]
    }
};

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

function generateStory() {
    const title = document.getElementById('storyTitle').value || 'Das namenlose Abenteuer';
    const genre = document.getElementById('storyGenre').value;
    const tone = document.getElementById('storyTone').value;
    const length = document.getElementById('storyLength').value;

    const template = storyTemplates[genre] || storyTemplates.fantasy;
    const hook = template.hooks[Math.floor(Math.random() * template.hooks.length)];

    const story = {
        title,
        genre,
        tone,
        length,
        synopsis: hook,
        scenes: template.scenes.slice(0, length === 'oneshot' ? 2 : length === 'short' ? 3 : 4)
    };

    // Display story
    const content = document.getElementById('storyContent');
    content.innerHTML = `
        <h4>📜 Synopsis</h4>
        <p>${story.synopsis}</p>
        
        <h4>🎭 Szenen</h4>
        ${story.scenes.map((scene, i) => `
            <div style="margin-bottom: 12px;">
                <strong>Szene ${i + 1}: ${scene.title}</strong>
                <p style="margin-top: 4px;">${scene.desc}</p>
            </div>
        `).join('')}
        
        <h4>ℹ️ Details</h4>
        <p>Genre: ${genre} | Ton: ${tone} | Länge: ${length}</p>
    `;

    document.getElementById('storyPreview').classList.remove('hidden');

    // Store for saving
    window.currentStory = story;
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

    alert('Geschichte gespeichert! 📖');
}

function renderStoryList() {
    const stories = getData(STORAGE_KEYS.stories);
    const list = document.getElementById('storyList');

    if (stories.length === 0) {
        list.innerHTML = '<p style="color: var(--color-text-muted); text-align: center; padding: 40px;">Noch keine Geschichten. Generiere deine erste!</p>';
        return;
    }

    list.innerHTML = stories.map(story => `
        <div class="story-card">
            <h4>📖 ${story.title}</h4>
            <div class="story-meta">
                <span>🎭 ${story.genre}</span>
                <span>📅 ${new Date(story.createdAt).toLocaleDateString('de-DE')}</span>
            </div>
            <p style="font-size: 0.9rem; color: var(--color-text-muted); margin-bottom: 12px;">${story.synopsis.substring(0, 100)}...</p>
            <div class="story-card-actions">
                <button class="btn btn-secondary btn-small" onclick="viewStory(${story.id})">👁️ Ansehen</button>
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
            <h4>📜 Synopsis</h4>
            <p>${story.synopsis}</p>
            
            <h4>🎭 Szenen</h4>
            ${story.scenes.map((scene, i) => `
                <div style="margin-bottom: 12px;">
                    <strong>Szene ${i + 1}: ${scene.title}</strong>
                    <p style="margin-top: 4px;">${scene.desc}</p>
                </div>
            `).join('')}
        `;
        document.getElementById('storyPreview').classList.remove('hidden');
    }
}

function deleteStory(id) {
    if (confirm('Geschichte wirklich löschen?')) {
        const stories = getData(STORAGE_KEYS.stories).filter(s => s.id !== id);
        saveData(STORAGE_KEYS.stories, stories);
        renderStoryList();
    }
}

// ========================================
// Table System
// ========================================
let gameSession = {
    story: null,
    characters: [],
    messages: [],
    currentScene: null
};

function renderTableSetup() {
    const stories = getData(STORAGE_KEYS.stories);
    const characters = getData(STORAGE_KEYS.characters);

    // Stories dropdown
    const storySelect = document.getElementById('tableStorySelect');
    storySelect.innerHTML = '<option value="">-- Geschichte wählen --</option>' +
        stories.map(s => `<option value="${s.id}">${s.title}</option>`).join('');

    // Characters checkboxes
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
        alert('Bitte wähle eine Geschichte aus!');
        return;
    }

    if (selectedChars.length === 0) {
        alert('Bitte wähle mindestens einen Charakter aus!');
        return;
    }

    const stories = getData(STORAGE_KEYS.stories);
    const characters = getData(STORAGE_KEYS.characters);

    gameSession.story = stories.find(s => s.id === parseInt(storyId));
    gameSession.characters = characters.filter(c => selectedChars.includes(c.id));
    gameSession.messages = [];
    gameSession.currentScene = gameSession.story.scenes[0];

    // Update UI
    document.getElementById('tableSetup').classList.add('hidden');
    document.getElementById('gameView').classList.remove('hidden');

    // Update character select in chat
    const speakerSelect = document.getElementById('chatSpeaker');
    speakerSelect.innerHTML = '<option value="gm">🎭 Spielleiter</option>' +
        gameSession.characters.map(c => `<option value="${c.id}">${c.avatar || '👤'} ${c.name}</option>`).join('');

    // Show active characters
    document.getElementById('activeCharactersList').innerHTML =
        gameSession.characters.map(c => `<span class="active-char-badge">${c.avatar || '👤'} ${c.name}</span>`).join('');

    // Initial scene
    updateSceneDisplay();

    // Welcome message
    addChatMessage('narrator', 'KI-Erzähler', `Willkommen zu "${gameSession.story.title}"! ${gameSession.story.synopsis}`);
}

function updateSceneDisplay() {
    if (!gameSession.currentScene) return;

    document.getElementById('sceneDescription').innerHTML = `
        <h4 style="color: var(--color-primary); margin-bottom: 8px;">${gameSession.currentScene.title}</h4>
        <p>${gameSession.currentScene.desc}</p>
    `;

    // Scene placeholder based on title
    const sceneEmojis = {
        'taverne': '🍺',
        'wald': '🌲',
        'ruine': '🏚️',
        'tempel': '⛪',
        'konfrontation': '⚔️',
        'dunkel': '🌑',
        'schiff': '🚢',
        default: '🏰'
    };

    const title = gameSession.currentScene.title.toLowerCase();
    let emoji = sceneEmojis.default;
    for (const [key, value] of Object.entries(sceneEmojis)) {
        if (title.includes(key)) {
            emoji = value;
            break;
        }
    }

    document.getElementById('sceneImage').innerHTML = `<span class="scene-placeholder">${emoji}</span>`;
}

function updateScene() {
    if (!gameSession.story) return;

    const currentIndex = gameSession.story.scenes.indexOf(gameSession.currentScene);
    const nextIndex = (currentIndex + 1) % gameSession.story.scenes.length;
    gameSession.currentScene = gameSession.story.scenes[nextIndex];

    updateSceneDisplay();
    addChatMessage('narrator', 'KI-Erzähler', `📍 Neue Szene: ${gameSession.currentScene.title} - ${gameSession.currentScene.desc}`);
}

function addChatMessage(role, sender, text) {
    const msg = { role, sender, text, time: new Date().toISOString() };
    gameSession.messages.push(msg);

    const container = document.getElementById('chatMessages');
    const msgEl = document.createElement('div');
    msgEl.className = `chat-message ${role}`;
    msgEl.innerHTML = `
        <div class="chat-sender">${sender}</div>
        <div class="chat-text">${text}</div>
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

function narratorRespond() {
    if (!gameSession.story) return;

    const responses = [
        'Die Luft wird kälter. Ein seltsames Gefühl erfasst die Gruppe...',
        'In der Ferne hört ihr ein merkwürdiges Geräusch. Was tut ihr?',
        'Ein Schatten huscht vorbei. Irgendetwas beobachtet euch!',
        'Die Tür knarzt auf. Dahinter liegt... das Unbekannte.',
        'Ein NPC tritt aus dem Schatten: "Ihr sucht also das Artefakt? Folgt mir..."',
        'Würfelt auf Wahrnehmung! (Das bedeutet, ihr solltet aufmerksam sein...)',
        'Die Stimmung im Raum verändert sich. Magie liegt in der Luft.',
        'Plötzlich ertönt ein lautes Krachen hinter euch!'
    ];

    const response = responses[Math.floor(Math.random() * responses.length)];
    addChatMessage('narrator', '🤖 KI-Erzähler', response);
}

// ========================================
// Initialize
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    renderCharacterList();
    renderInventory();

    // Set initial attribute values
    ['str', 'dex', 'con', 'int', 'wis', 'cha'].forEach(attr => {
        updateAttributeDisplay(attr, 10);
    });
});

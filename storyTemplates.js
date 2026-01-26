/* ========================================
   Story Templates - Vordefinierte Geschichten
   ======================================== */

const STORY_TEMPLATES = [
    {
        id: 'shadow_tavern',
        title: 'Die Schatten der Taverne',
        genre: 'Dark Fantasy',
        tone: 'atmospheric',
        perspective: 'second-person',
        cover: '🏚️',
        coverGradient: 'linear-gradient(135deg, #1a1a2e 0%, #4a1942 50%, #16213e 100%)',
        description: 'Ein mysteriöser Fremder betritt die Taverne. In dieser Nacht wird sich dein Schicksal für immer verändern...',
        difficulty: 'Mittel',
        estimatedTime: '30-45 min',

        lore: `Die Welt von Eldoria liegt im Schatten. Seit der Nacht der Schwarzen Sonne vor hundert Jahren wandern ruhelose Geister durch die Lande. Die Taverne "Zum Rostigen Dolch" ist einer der wenigen Orte, wo sich Reisende noch sicher fühlen können - zumindest bis Mitternacht.

Du bist ein Wanderer, gezeichnet von vergangenen Kämpfen. Dein Name ist in manchen Kreisen bekannt, in anderen gefürchtet. Heute Nacht suchst du Unterschlupf vor dem aufziehenden Sturm.`,

        characters: [
            {
                name: 'Der Fremde',
                description: 'Eine in schwarze Roben gehüllte Gestalt. Sein Gesicht liegt im Schatten der Kapuze, nur zwei schwach glühende Augen sind sichtbar.'
            },
            {
                name: 'Martha, die Wirtin',
                description: 'Eine robuste Frau mittleren Alters mit wachsamen Augen. Sie kennt jeden Gast - und ihre Geheimnisse.'
            },
            {
                name: 'Der betrunkene Söldner',
                description: 'Ein vernarbter Krieger, der zu viel Met getrunken hat. Sein Schwert liegt griffbereit neben ihm.'
            }
        ],

        initialVariables: {
            courage: 5,
            trust: 3,
            health: 100,
            karma: 0,
            gold: 15,
            reputation: 0
        },

        initialNarrative: `Der Wind heult draußen wie ein verwundetes Tier, als du die schwere Holztür der Taverne aufstößt. Wärme und der Geruch von gebratenem Fleisch schlagen dir entgegen. 

Der Schankraum ist spärlich besetzt - ein paar müde Reisende, ein betrunkener Söldner in der Ecke, und Martha hinter der Theke, die dich mit einem prüfenden Blick mustert.

Dann bemerkst du ihn: Ein Fremder in schwarzen Roben sitzt allein am Tisch beim Kamin. Seine Kapuze verbirgt sein Gesicht, doch du spürst seinen Blick auf dir. Ein Schauer läuft dir über den Rücken.`,

        initialChoices: [
            'Den Fremden direkt ansprechen',
            'Zur Theke gehen und Martha nach ihm fragen',
            'Einen Tisch in der Nähe nehmen und beobachten',
            'Dem Söldner Gesellschaft leisten'
        ]
    },

    {
        id: 'cursed_forest',
        title: 'Der Verfluchte Wald',
        genre: 'Horror Fantasy',
        tone: 'dark',
        perspective: 'second-person',
        cover: '🌲',
        coverGradient: 'linear-gradient(135deg, #0d1b0d 0%, #1a3a1a 50%, #0a150a 100%)',
        description: 'Die Dorfbewohner flüstern von Kindern, die im Wald verschwinden. Du bist der Einzige, der es wagt, der Sache nachzugehen...',
        difficulty: 'Schwer',
        estimatedTime: '45-60 min',

        lore: `Der Dunkelwald trägt seinen Namen nicht ohne Grund. Selbst am hellsten Tag dringt kaum Sonnenlicht durch das dichte Blätterdach. Die alten Geschichten sprechen von einem Wesen, das dort haust - halb Mensch, halb Baum, geboren aus einem uralten Fluch.

Drei Kinder sind in der letzten Woche verschwunden. Das Dorf ist in Panik. Der Bürgermeister hat eine Belohnung ausgesetzt, doch niemand wagt sich in den Wald. Niemand außer dir.`,

        characters: [
            {
                name: 'Die Waldhexe',
                description: 'Eine alte Frau, die am Waldrand lebt. Manche sagen, sie sei verrückt. Andere behaupten, sie wisse mehr, als sie zugibt.'
            },
            {
                name: 'Der Waldgeist',
                description: 'Eine ätherische Erscheinung zwischen den Bäumen. Freund oder Feind - das wird sich zeigen.'
            }
        ],

        initialVariables: {
            courage: 5,
            trust: 5,
            health: 100,
            karma: 0,
            sanity: 100,
            torches: 3
        },

        initialNarrative: `Die Dorfälteste hat dir eine Laterne in die Hand gedrückt und sich bekreuzigt, als du aufgebrochen bist. "Geh nicht vom Pfad ab," hat sie geflüstert. "Und was immer du hörst - folge nicht der Musik."

Jetzt stehst du am Waldrand. Die Bäume ragen wie schwarze Klauen in den grauen Himmel. Irgendwo in der Tiefe glaubst du, ein leises Summen zu hören. Oder ist es der Wind?

Der Pfad vor dir gabelt sich. Links führt er tiefer in die Dunkelheit. Rechts siehst du Rauch aufsteigen - vielleicht die Hütte der Waldhexe.`,

        initialChoices: [
            'Den linken Pfad tiefer in den Wald nehmen',
            'Zur Hütte der Waldhexe gehen',
            'Am Waldrand nach Spuren der Kinder suchen',
            'Die Laterne anzünden und rufen'
        ]
    },

    {
        id: 'throne_intrigue',
        title: 'Intrigen am Hofe',
        genre: 'Political Fantasy',
        tone: 'mysterious',
        perspective: 'second-person',
        cover: '👑',
        coverGradient: 'linear-gradient(135deg, #2c1810 0%, #5c3d2e 50%, #1a0f0a 100%)',
        description: 'Der König liegt im Sterben. Jede Fraktion am Hofe hat ihre eigenen Pläne - und du steckst mittendrin...',
        difficulty: 'Mittel',
        estimatedTime: '40-50 min',

        lore: `Das Königreich Valdoria steht am Scheideweg. König Aldric der Weise liegt seit Wochen im Fieber, und die Gerüchte über Gift machen die Runde. Drei Erben streiten um die Nachfolge: Prinz Cedric der Krieger, Prinzessin Elara die Gelehrte, und der Bastard Corvin, den niemand auf der Rechnung hat.

Du bist ein aufstrebender Höfling, geschickt genug, um das Spiel der Mächte zu durchschauen - aber bist du auch geschickt genug, es zu überleben?`,

        characters: [
            {
                name: 'Prinz Cedric',
                description: 'Der erstgeborene Sohn. Stark, aber jähzornig. Seine Anhänger sind die Militärs.'
            },
            {
                name: 'Prinzessin Elara',
                description: 'Intelligent und berechnend. Sie hat Verbündete unter den Magiern und Gelehrten.'
            },
            {
                name: 'Corvin der Bastard',
                description: 'Der uneheliche Sohn. Unterschätzt von allen - genau wie er es will.'
            }
        ],

        initialVariables: {
            courage: 5,
            trust: 5,
            health: 100,
            karma: 0,
            influence: 10,
            secrets: 0
        },

        initialNarrative: `Die Fackeln im Thronsaal flackern unruhig, als ob sie die Spannung in der Luft spüren würden. Der Stuhl des Königs steht leer - zum ersten Mal seit zwanzig Jahren.

Höflinge drängen sich in Gruppen zusammen, flüstern hinter vorgehaltenen Händen. Du spürst Blicke auf dir - abschätzend, berechnend. In diesem Spiel ist jeder ein potenzieller Verbündeter. Oder Feind.

Ein Diener nähert sich dir mit einer Nachricht. "Drei Botschaften für Euch, Herr. Von den drei Erben. Alle wünschen eine private Audienz." Er hält dir drei versiegelte Briefe hin.`,

        initialChoices: [
            'Den Brief von Prinz Cedric zuerst lesen',
            'Den Brief von Prinzessin Elara zuerst lesen',
            'Den Brief von Corvin dem Bastard zuerst lesen',
            'Alle Briefe ungelesen ins Feuer werfen'
        ]
    }
];

/**
 * Get all available story templates
 * @returns {Array} All story templates
 */
function getAllStoryTemplates() {
    return STORY_TEMPLATES;
}

/**
 * Get a specific story template by ID
 * @param {string} storyId - Story ID
 * @returns {Object|null} Story template or null
 */
function getStoryTemplate(storyId) {
    return STORY_TEMPLATES.find(t => t.id === storyId) || null;
}

/**
 * Get story template with saved progress info
 * @param {string} storyId - Story ID
 * @returns {Object} Template with progress info
 */
function getStoryWithProgress(storyId) {
    const template = getStoryTemplate(storyId);
    if (!template) return null;

    const saved = hasSavedProgress(storyId);
    const progress = saved ? loadProgress(storyId) : null;

    return {
        ...template,
        hasSavedProgress: saved,
        savedChapter: progress?.chapter || 0,
        lastPlayed: progress?.timestamp || null
    };
}

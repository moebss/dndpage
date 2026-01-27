require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const { passport, supabase } = require('./auth');

const app = express();
const PORT = process.env.PORT || 4000;

// CORS Configuration
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5500',
    credentials: true
}));

// Middleware
app.use(cookieParser());
app.use(express.json());

// Session Configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'fallback-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production', // HTTPS only in production
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Passport Middleware
app.use(passport.initialize());
app.use(passport.session());

// ========================================
// Authentication Routes
// ========================================

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401).json({ error: 'Nicht authentifiziert' });
};

// Initiate Google OAuth
app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Google OAuth Callback
app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: process.env.FRONTEND_URL }),
    (req, res) => {
        // Successful authentication, redirect to frontend
        res.redirect(process.env.FRONTEND_URL || 'http://localhost:5500');
    }
);

// Logout
app.post('/auth/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            return res.status(500).json({ error: 'Logout fehlgeschlagen' });
        }
        res.json({ message: 'Erfolgreich abgemeldet' });
    });
});

// Get current user
app.get('/auth/user', (req, res) => {
    if (req.isAuthenticated()) {
        res.json({ user: req.user });
    } else {
        res.json({ user: null });
    }
});

// ========================================
// Character API Routes (Protected)
// ========================================

// Get all characters for logged-in user
app.get('/api/characters', isAuthenticated, async (req, res) => {
    try {
        const { data: characters, error } = await supabase
            .from('characters')
            .select('*')
            .eq('user_id', req.user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json({ characters });
    } catch (error) {
        console.error('Get Characters Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Create new character
app.post('/api/characters', isAuthenticated, async (req, res) => {
    try {
        const characterData = {
            ...req.body,
            user_id: req.user.id
        };

        const { data: character, error } = await supabase
            .from('characters')
            .insert([characterData])
            .select()
            .single();

        if (error) throw error;
        res.json({ character });
    } catch (error) {
        console.error('Create Character Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update character
app.put('/api/characters/:id', isAuthenticated, async (req, res) => {
    try {
        const { id } = req.params;
        const updates = {
            ...req.body,
            updated_at: new Date().toISOString()
        };

        const { data: character, error } = await supabase
            .from('characters')
            .update(updates)
            .eq('id', id)
            .eq('user_id', req.user.id)
            .select()
            .single();

        if (error) throw error;
        res.json({ character });
    } catch (error) {
        console.error('Update Character Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Delete character
app.delete('/api/characters/:id', isAuthenticated, async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from('characters')
            .delete()
            .eq('id', id)
            .eq('user_id', req.user.id);

        if (error) throw error;
        res.json({ message: 'Charakter gelöscht' });
    } catch (error) {
        console.error('Delete Character Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ========================================
// Story API Routes (Protected)
// ========================================

// Get all stories for logged-in user
app.get('/api/stories', isAuthenticated, async (req, res) => {
    try {
        const { data: stories, error } = await supabase
            .from('stories')
            .select('*')
            .eq('user_id', req.user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json({ stories });
    } catch (error) {
        console.error('Get Stories Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Create new story
app.post('/api/stories', isAuthenticated, async (req, res) => {
    try {
        const storyData = {
            ...req.body,
            user_id: req.user.id
        };

        const { data: story, error } = await supabase
            .from('stories')
            .insert([storyData])
            .select()
            .single();

        if (error) throw error;
        res.json({ story });
    } catch (error) {
        console.error('Create Story Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update story
app.put('/api/stories/:id', isAuthenticated, async (req, res) => {
    try {
        const { id } = req.params;
        const updates = {
            ...req.body,
            updated_at: new Date().toISOString()
        };

        const { data: story, error } = await supabase
            .from('stories')
            .update(updates)
            .eq('id', id)
            .eq('user_id', req.user.id)
            .select()
            .single();

        if (error) throw error;
        res.json({ story });
    } catch (error) {
        console.error('Update Story Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Delete story
app.delete('/api/stories/:id', isAuthenticated, async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from('stories')
            .delete()
            .eq('id', id)
            .eq('user_id', req.user.id);

        if (error) throw error;
        res.json({ message: 'Geschichte gelöscht' });
    } catch (error) {
        console.error('Delete Story Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// API Keys from environment
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// ========================================
// Perplexity API Proxy
// ========================================
app.post('/api/perplexity', async (req, res) => {
    try {
        const { systemPrompt, userMessage } = req.body;

        if (!PERPLEXITY_API_KEY) {
            return res.status(500).json({ error: 'Perplexity API Key nicht konfiguriert' });
        }

        const response = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.1-sonar-small-128k-online',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userMessage }
                ],
                max_tokens: 1024,
                temperature: 0.8
            })
        });

        if (!response.ok) {
            const error = await response.json();
            return res.status(response.status).json({ error: error.error?.message || 'API-Fehler' });
        }

        const data = await response.json();
        res.json({ content: data.choices[0].message.content });

    } catch (error) {
        console.error('Perplexity Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ========================================
// Gemini Image Generation Proxy
// ========================================
app.post('/api/gemini/image', async (req, res) => {
    try {
        const { prompt } = req.body;

        if (!GEMINI_API_KEY) {
            return res.status(500).json({ error: 'Gemini API Key nicht konfiguriert' });
        }

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `Generate a fantasy RPG character portrait or scene image. Style: Digital art, vibrant colors, detailed, fantasy genre. Description: ${prompt}`
                        }]
                    }],
                    generationConfig: {
                        responseModalities: ["TEXT", "IMAGE"]
                    }
                })
            }
        );

        if (!response.ok) {
            const error = await response.json();
            console.error('Gemini Error:', error);
            return res.status(response.status).json({ error: error.error?.message || 'Gemini API-Fehler' });
        }

        const data = await response.json();

        // Find image in response
        const parts = data.candidates?.[0]?.content?.parts || [];
        for (const part of parts) {
            if (part.inlineData?.mimeType?.startsWith('image/')) {
                return res.json({
                    imageUrl: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`
                });
            }
        }

        res.json({ imageUrl: null });

    } catch (error) {
        console.error('Gemini Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ========================================
// Health Check
// ========================================
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        perplexity: !!PERPLEXITY_API_KEY,
        gemini: !!GEMINI_API_KEY
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🐉 DnD Story Forge Backend läuft auf Port ${PORT}`);
    console.log(`   Perplexity API: ${PERPLEXITY_API_KEY ? '✓ konfiguriert' : '✗ fehlt'}`);
    console.log(`   Gemini API: ${GEMINI_API_KEY ? '✓ konfiguriert' : '✗ fehlt'}`);
});

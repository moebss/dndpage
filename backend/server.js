require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

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

export default async (req, res) => {
    // CORS Header
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Nur POST-Anfragen sind erlaubt' });
    }

    const { prompt } = req.body;

    if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: 'Gemini API Key nicht konfiguriert' });
    }

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${process.env.GEMINI_API_KEY}`,
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

        const data = await response.json();

        if (!response.ok) {
            console.error('Gemini Error:', data);
            return res.status(response.status).json({ error: data.error?.message || 'Gemini API Error' });
        }

        // Find image in response
        const parts = data.candidates?.[0]?.content?.parts || [];
        for (const part of parts) {
            if (part.inlineData?.mimeType?.startsWith('image/')) {
                return res.status(200).json({
                    imageUrl: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`
                });
            }
        }

        return res.status(200).json({ imageUrl: null });

    } catch (err) {
        console.error('Gemini Error:', err);
        return res.status(500).json({ error: err.message });
    }
};

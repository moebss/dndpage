export default async (req, res) => {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { prompt } = req.body || {};

        if (!prompt) {
            return res.status(200).json({ imageUrl: null, error: 'No prompt provided' });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.log('GEMINI_API_KEY not set');
            return res.status(200).json({ imageUrl: null, error: 'GEMINI_API_KEY not configured' });
        }

        // Gemini 2.0 Flash with image generation
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: `Create a fantasy RPG illustration: ${prompt}` }]
                    }],
                    generationConfig: {
                        responseModalities: ["image", "text"]
                    }
                })
            }
        );

        const text = await response.text();

        if (!response.ok) {
            console.error('Gemini HTTP error:', response.status, text.substring(0, 300));
            return res.status(200).json({ imageUrl: null });
        }

        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            console.error('Gemini JSON parse error');
            return res.status(200).json({ imageUrl: null });
        }

        // Look for image data
        const parts = data.candidates?.[0]?.content?.parts || [];
        for (const part of parts) {
            if (part.inlineData?.data && part.inlineData?.mimeType) {
                return res.status(200).json({
                    imageUrl: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`
                });
            }
        }

        // No image found
        console.log('No image in Gemini response');
        return res.status(200).json({ imageUrl: null });

    } catch (err) {
        console.error('Gemini exception:', err.message);
        return res.status(200).json({ imageUrl: null });
    }
};

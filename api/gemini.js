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
        return res.status(200).json({ imageUrl: null });
    }

    try {
        // Gemini 2.0 Flash with native image generation
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
                            text: `Generate a fantasy RPG illustration: ${prompt}. Digital art style.`
                        }]
                    }],
                    generationConfig: {
                        responseModalities: ["image", "text"]
                    }
                })
            }
        );

        // Get response as text first to handle large responses
        const responseText = await response.text();

        if (!response.ok) {
            console.error('Gemini Error Status:', response.status);
            return res.status(200).json({ imageUrl: null });
        }

        // Try to parse JSON
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (parseError) {
            console.error('JSON Parse Error:', parseError.message);
            return res.status(200).json({ imageUrl: null });
        }

        // Find image in response parts
        const parts = data.candidates?.[0]?.content?.parts || [];
        for (const part of parts) {
            if (part.inlineData) {
                const { mimeType, data: imageData } = part.inlineData;
                if (mimeType && imageData) {
                    return res.status(200).json({
                        imageUrl: `data:${mimeType};base64,${imageData}`
                    });
                }
            }
        }

        return res.status(200).json({ imageUrl: null });

    } catch (err) {
        console.error('Gemini Exception:', err.message);
        return res.status(200).json({ imageUrl: null });
    }
};

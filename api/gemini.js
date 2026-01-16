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
        console.log('No GEMINI_API_KEY configured');
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
                            text: `Generate a fantasy RPG illustration: ${prompt}. Digital art style, vibrant colors, detailed.`
                        }]
                    }],
                    generationConfig: {
                        responseModalities: ["image", "text"]
                    }
                })
            }
        );

        const data = await response.json();
        console.log('Gemini response:', response.status, JSON.stringify(data).substring(0, 500));

        if (!response.ok) {
            console.error('Gemini Error:', data.error?.message || 'Unknown error');
            return res.status(200).json({ imageUrl: null, debug: data.error?.message });
        }

        // Find image in response parts
        const parts = data.candidates?.[0]?.content?.parts || [];
        for (const part of parts) {
            if (part.inlineData) {
                const { mimeType, data: imageData } = part.inlineData;
                if (mimeType && imageData) {
                    console.log('Image generated! MimeType:', mimeType);
                    return res.status(200).json({
                        imageUrl: `data:${mimeType};base64,${imageData}`
                    });
                }
            }
        }

        console.log('No image in response, parts:', parts.length);
        return res.status(200).json({ imageUrl: null, debug: 'No image in response' });

    } catch (err) {
        console.error('Gemini Exception:', err.message);
        return res.status(200).json({ imageUrl: null, debug: err.message });
    }
};

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
        return res.status(200).json({ imageUrl: null, error: 'Gemini API Key nicht konfiguriert' });
    }

    try {
        // Use Imagen 3 model for image generation
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${process.env.GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    instances: [{
                        prompt: `Fantasy RPG art, digital painting, vibrant colors, detailed: ${prompt}`
                    }],
                    parameters: {
                        sampleCount: 1,
                        aspectRatio: "1:1",
                        safetyFilterLevel: "block_few"
                    }
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            console.error('Imagen Error:', data);
            // Return null image instead of error - frontend will use emoji fallback
            return res.status(200).json({ imageUrl: null });
        }

        // Check for image in predictions
        const predictions = data.predictions || [];
        if (predictions.length > 0 && predictions[0].bytesBase64Encoded) {
            return res.status(200).json({
                imageUrl: `data:image/png;base64,${predictions[0].bytesBase64Encoded}`
            });
        }

        // Fallback: Try Gemini 2.0 Flash experimental
        const fallbackResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${process.env.GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `Generate a fantasy RPG image: ${prompt}`
                        }]
                    }],
                    generationConfig: {
                        responseModalities: ["TEXT", "IMAGE"]
                    }
                })
            }
        );

        const fallbackData = await fallbackResponse.json();
        const parts = fallbackData.candidates?.[0]?.content?.parts || [];

        for (const part of parts) {
            if (part.inlineData?.mimeType?.startsWith('image/')) {
                return res.status(200).json({
                    imageUrl: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`
                });
            }
        }

        // No image generated - return null, frontend will use emoji
        return res.status(200).json({ imageUrl: null });

    } catch (err) {
        console.error('Gemini Error:', err);
        // Return null instead of error - frontend will use emoji fallback
        return res.status(200).json({ imageUrl: null });
    }
};

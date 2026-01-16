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
        // Use Gemini 2.0 Flash with image generation capability
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${process.env.GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `Create a detailed fantasy RPG illustration: ${prompt}. Style: Digital art, vibrant colors, dramatic lighting, high quality.`
                        }]
                    }],
                    generationConfig: {
                        responseModalities: ["IMAGE", "TEXT"],
                        responseMimeType: "text/plain"
                    }
                })
            }
        );

        const data = await response.json();
        console.log('Gemini response status:', response.status);

        if (!response.ok) {
            console.error('Gemini Error:', JSON.stringify(data));
            return res.status(200).json({ imageUrl: null });
        }

        // Check for image in response
        const parts = data.candidates?.[0]?.content?.parts || [];
        for (const part of parts) {
            if (part.inlineData?.mimeType?.startsWith('image/')) {
                console.log('Image generated successfully');
                return res.status(200).json({
                    imageUrl: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`
                });
            }
        }

        // Try alternative model
        console.log('No image from primary model, trying alternative...');
        const altResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `Generate an image: ${prompt}`
                        }]
                    }],
                    generationConfig: {
                        responseModalities: ["TEXT", "IMAGE"]
                    }
                })
            }
        );

        const altData = await altResponse.json();
        const altParts = altData.candidates?.[0]?.content?.parts || [];

        for (const part of altParts) {
            if (part.inlineData?.mimeType?.startsWith('image/')) {
                console.log('Image generated from alt model');
                return res.status(200).json({
                    imageUrl: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`
                });
            }
        }

        console.log('No image generated from any model');
        return res.status(200).json({ imageUrl: null });

    } catch (err) {
        console.error('Gemini Error:', err.message);
        return res.status(200).json({ imageUrl: null });
    }
};

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

    const { systemPrompt, userMessage } = req.body;

    if (!process.env.PERPLEXITY_API_KEY) {
        return res.status(500).json({ error: 'Perplexity API Key nicht konfiguriert' });
    }

    try {
        const response = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'sonar-pro',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userMessage }
                ],
                max_tokens: 1024,
                temperature: 0.8
            })
        });

        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json({ error: data.error?.message || 'Perplexity API Error' });
        }

        return res.status(200).json({ content: data.choices[0].message.content });

    } catch (err) {
        console.error('Perplexity Error:', err);
        return res.status(500).json({ error: err.message });
    }
};

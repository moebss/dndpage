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
        const { systemPrompt, userMessage } = req.body || {};

        if (!systemPrompt || !userMessage) {
            return res.status(400).json({ error: 'Missing systemPrompt or userMessage' });
        }

        const apiKey = process.env.PERPLEXITY_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: 'PERPLEXITY_API_KEY not configured in Vercel' });
        }

        const response = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'sonar',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userMessage }
                ],
                max_tokens: 1000,
                temperature: 0.7
            })
        });

        const text = await response.text();
        console.log('Perplexity API Status:', response.status);

        if (!response.ok) {
            let errorData;
            try {
                errorData = JSON.parse(text);
            } catch (e) {
                errorData = { error: { message: text } };
            }
            return res.status(response.status).json({ error: errorData.error?.message || 'Perplexity API Error' });
        }

        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            return res.status(500).json({ error: 'Invalid JSON response from AI' });
        }

        const content = data.choices?.[0]?.message?.content;
        if (!content) {
            return res.status(500).json({ error: 'No content in response' });
        }

        return res.status(200).json({ content });

    } catch (err) {
        console.error('Exception:', err);
        return res.status(500).json({ error: err.message });
    }
};

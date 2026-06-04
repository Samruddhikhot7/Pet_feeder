const express = require('express');
const router = express.Router();

router.post('/', async (req, res) => {
    try {
        const { messages } = req.body;
        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: 'Messages array is required' });
        }

        const systemPrompt = {
            role: "system",
            content: `You are a veterinary assistant chatbot.

You help users with:
- Pet health issues
- Feeding advice
- Behavior problems

Rules:
- Answer only about pets (dogs, cats, animals)
- Never give exact medicines or dosage
- Suggest vet visit for serious symptoms
- Keep answers simple (2–4 lines)
- If question is unrelated → politely refuse`
        };

        const apiMessages = [systemPrompt, ...messages];

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`
            },
            body: JSON.stringify({
                model: 'openai/gpt-3.5-turbo', // Default fallback model
                messages: apiMessages,
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('OpenRouter API error:', errorText);
            return res.status(response.status).json({ error: 'Failed to communicate with chat API' });
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Chat route error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const PetProfile = require('../models/PetProfile');
const auth = require('../middleware/authMiddleware');

router.get('/', auth, async (req, res) => {
  try {
    const profile = await PetProfile.findOne({ userId: req.user.id });
    if (!profile) return res.json({ name: '', breed: '', age: '', weight: '' });
    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    let { name, breed, age, weight } = req.body;
    
    // Fix empty strings casting to Number issue
    age = age === '' ? 0 : Number(age);
    weight = weight === '' ? 0 : Number(weight);

    let profile = await PetProfile.findOne({ userId: req.user.id });
    if (!profile) {
      profile = new PetProfile({ userId: req.user.id });
    }

    profile.name = name;
    profile.breed = breed;
    profile.age = age;
    profile.weight = weight;

    // Call OpenRouter API for recommendation
    const prompt = `You are a vet assistant. Provide a concise 2-3 sentence feeding recommendation for a ${age} year old ${breed || 'pet'} named ${name} weighing ${weight}kg.`;
    
    try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`
            },
            body: JSON.stringify({
                model: 'openai/gpt-3.5-turbo',
                messages: [{ role: 'system', content: prompt }]
            })
        });

        if (response.ok) {
            const data = await response.json();
            profile.recommendation = data.choices[0].message.content;
        } else {
            console.error('OpenRouter error:', await response.text());
        }
    } catch (apiErr) {
        console.error('Failed to get recommendation:', apiErr);
    }

    await profile.save();
    res.json(profile);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

const express = require('express');
const axios = require('axios');
const app = express();
const REZDY_API_KEY = '3261bbb8aae54023b3b0a6a5848aff15';

app.use(express.json());
app.use(require('cors')());

// Default Dialogflow webhook handler
app.post('/', async (req, res) => {
  const action = req.body.queryResult.action;

  // Respond to askInterest
  if (action === 'askInterest') {
    const interests = req.body.queryResult.parameters.interests;
    return res.json({
      fulfillmentText: `Great! I’ll look for ${interests} experiences for you.`
    });
  }

  // Fallback
  return res.json({
    fulfillmentText: "Sorry, I didn't understand that."
  });
});

// Optional: this route can still be used by your own app or tools
app.post('/getItinerarySuggestions', async (req, res) => {
  const { destination, duration, interests } = req.body;

  try {
    const searchUrl = `https://api.rezdy.com/v1/products/search?location=${destination}&apiKey=${REZDY_API_KEY}`;
    const response = await axios.get(searchUrl);
    const allProducts = response.data.products;

    const interestTags = (interests || []).map(i => i.toLowerCase());
    const matched = allProducts.filter(p =>
      interestTags.some(tag => p.tags?.join(' ').toLowerCase().includes(tag))
    );

    const itinerary = [];
    for (let i = 0; i < duration; i++) {
      itinerary.push({
        day: i + 1,
        morning: matched[i * 2] || null,
        afternoon: matched[i * 2 + 1] || null
      });
    }

    const message = itinerary.map(day =>
      `🗓️ Day ${day.day}\n- Morning: ${day.morning?.name || 'Free time'}\n- Afternoon: ${day.afternoon?.name || 'Free time'}`
    ).join("\n\n");

    res.json({
      fulfillmentMessages: [
        {
          text: { text: [message] }
        }
      ]
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Rezdy API error' });
  }
});

app.listen(3000, () => console.log('Server running on port 3000'));

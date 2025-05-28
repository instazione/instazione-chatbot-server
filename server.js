const express = require('express');
const axios = require('axios');
const app = express();
const REZDY_API_KEY = '3261bbb8aae54023b3b0a6a5848aff15';

app.use(express.json());
app.use(require('cors')());

// Dialogflow webhook entry point
app.post('/webhook', async (req, res) => {
  const action = req.body.queryResult.action;

  if (action === 'askInterest') {
    const interests = req.body.queryResult.parameters.interests;
    return res.json({
      fulfillmentText: `Got it! You like ${interests}. I’ll tailor your suggestions.`
    });
  }

  if (action === 'getDestinationAndDuration') {
    const { destination, duration } = req.body.queryResult.parameters;

    try {
      const searchUrl = `https://api.rezdy.com/v1/products/search?location=${destination}&apiKey=${REZDY_API_KEY}`;
      const response = await axios.get(searchUrl);
      const allProducts = response.data.products;

      const itinerary = [];
      for (let i = 0; i < duration; i++) {
        itinerary.push({
          day: i + 1,
          morning: allProducts[i * 2] || null,
          afternoon: allProducts[i * 2 + 1] || null
        });
      }

      const message = itinerary.map(day =>
        `🗓️ Day ${day.day}\n- Morning: ${day.morning?.name || 'Free time'}\n- Afternoon: ${day.afternoon?.name || 'Free time'}`
      ).join("\n\n");

      return res.json({
        fulfillmentMessages: [{ text: { text: [message] } }]
      });

    } catch (err) {
      console.error(err.message);
      return res.json({
        fulfillmentText: 'Sorry! There was an error fetching your itinerary.'
      });
    }
  }

  return res.json({ fulfillmentText: "Sorry, I didn't understand." });
});

app.listen(3000, () => console.log('Server running on port 3000'));

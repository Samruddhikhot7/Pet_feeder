const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const History = require('../models/History');
const Quantity = require('../models/Quantity');
const mqttClient = require('../mqttClient');

// @route   POST api/feed/manual
router.post('/manual', auth, async (req, res) => {
  try {
    // 1. Get current quantity level
    let qty = await Quantity.findOne({ userId: req.user.id });
    const level = qty ? qty.level : 'medium';

    // 2. Log History
    const history = new History({
      userId: req.user.id,
      type: 'Manual',
      quantity: level
    });
    await history.save();

    // 3. Publish MQTT command to ESP32
    const topic = `petfeeder/${req.user.id}/feed`;
    const message = JSON.stringify({
      command: 'feed_now',
      level: level,
      timestamp: Date.now()
    });

    mqttClient.publish(topic, message, { qos: 1 }, (err) => {
      if (err) {
        console.error('MQTT publish error:', err);
        return res.status(500).json({ msg: 'Failed to send command to device' });
      }
      console.log(`Published feed command to ${topic}`);
    });

    res.json({ msg: 'Manual feed triggered', history });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;

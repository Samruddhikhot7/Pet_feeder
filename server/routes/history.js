const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const History = require('../models/History');

// @route   GET api/history
router.get('/', auth, async (req, res) => {
  try {
    // Get latest 50 history logs
    const history = await History.find({ userId: req.user.id }).sort({ time: -1 }).limit(50);
    res.json(history);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/history
// Could be used by ESP32 to log "Auto" feeds if the ESP32 controls the schedule triggering
router.post('/', async (req, res) => {
  const { userId, type, quantity } = req.body;
  try {
    const history = new History({ userId, type, quantity });
    await history.save();
    res.json(history);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;

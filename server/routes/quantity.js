const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const Quantity = require('../models/Quantity');

// @route   GET api/quantity
router.get('/', auth, async (req, res) => {
  try {
    let quantity = await Quantity.findOne({ userId: req.user.id });
    if (!quantity) {
      // Create default if not found
      quantity = new Quantity({ userId: req.user.id, level: 'medium' });
      await quantity.save();
    }
    res.json(quantity);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/quantity
router.post('/', auth, async (req, res) => {
  const { level } = req.body;
  try {
    let quantity = await Quantity.findOne({ userId: req.user.id });
    if (quantity) {
      quantity.level = level;
      await quantity.save();
    } else {
      quantity = new Quantity({ userId: req.user.id, level });
      await quantity.save();
    }
    res.json(quantity);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/quantity/esp32/:userId
// For ESP32 polling
router.get('/esp32/:userId', async (req, res) => {
  try {
    const quantity = await Quantity.findOne({ userId: req.params.userId });
    res.json({ level: quantity ? quantity.level : 'medium' });
  } catch(err) {
    res.status(500).send('Server Error');
  }
});

module.exports = router;

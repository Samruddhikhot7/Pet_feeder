const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const Schedule = require('../models/Schedule');

// @route   GET api/schedule
router.get('/', auth, async (req, res) => {
  try {
    const schedules = await Schedule.find({ userId: req.user.id }).sort({ hour: 1, minute: 1 });
    res.json(schedules);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/schedule
router.post('/', auth, async (req, res) => {
  const { hour, minute } = req.body;
  try {
    const newSchedule = new Schedule({
      userId: req.user.id,
      hour,
      minute
    });
    const schedule = await newSchedule.save();
    res.json(schedule);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/schedule/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id);
    if (!schedule) return res.status(404).json({ msg: 'Schedule not found' });
    if (schedule.userId.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }
    await Schedule.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Schedule removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/schedule/esp32/:userId (For ESP32 to fetch without JWT, passing user ID or device token)
// Note: In a real prod app, ESP32 should have its own token. Here we simplify.
router.get('/esp32/:userId', async (req, res) => {
  try {
    const schedules = await Schedule.find({ userId: req.params.userId }).sort({ hour: 1, minute: 1 });
    res.json(schedules);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

module.exports = router;

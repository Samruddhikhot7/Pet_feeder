const express = require('express');
const router = express.Router();
const History = require('../models/History');
const Schedule = require('../models/Schedule');
const auth = require('../middleware/authMiddleware');

// Get eating trends (last 7 days)
router.get('/trends', auth, async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0,0,0,0);

    const histories = await History.find({
      userId: req.user.id,
      time: { $gte: sevenDaysAgo }
    }).sort({ time: 1 });

    // Aggregate by day
    const trendsMap = {};
    for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        trendsMap[dateStr] = 0;
    }

    histories.forEach(h => {
        const dateStr = h.time.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (trendsMap[dateStr] !== undefined) {
            trendsMap[dateStr]++;
        }
    });

    // Format for recharts
    const data = Object.keys(trendsMap).reverse().map(date => ({
        date,
        feeds: trendsMap[date]
    }));

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get alerts
router.get('/alerts', auth, async (req, res) => {
  try {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    // Check "Not Eating Properly" (no feeds in 24h)
    const recentFeed = await History.findOne({ 
        userId: req.user.id,
        time: { $gte: twentyFourHoursAgo }
    });
    const notEatingProperly = !recentFeed;

    // Check "Low Food Level" (Virtual hopper: 20 feeds total. Alert at 18, 19, 0)
    const totalFeeds = await History.countDocuments({ userId: req.user.id });
    const feedsSinceRefill = totalFeeds % 20;
    const lowFoodLevel = feedsSinceRefill >= 18;

    // Check "Missed Feeding"
    let missedFeeding = false;
    const schedules = await Schedule.find({ userId: req.user.id });
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const recentFeedsInHour = await History.find({
        userId: req.user.id,
        time: { $gte: oneHourAgo }
    });

    for (const s of schedules) {
        let schedTimeToday = new Date();
        schedTimeToday.setHours(s.hour, s.minute, 0, 0);
        
        if (schedTimeToday > oneHourAgo && schedTimeToday <= now) {
            if (recentFeedsInHour.length === 0) {
                missedFeeding = true;
                break;
            }
        }
    }

    res.json({
        notEatingProperly,
        lowFoodLevel,
        missedFeeding
    });

  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

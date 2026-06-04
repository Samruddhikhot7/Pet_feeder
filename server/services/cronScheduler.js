const Schedule = require('../models/Schedule');
const Quantity = require('../models/Quantity');
const History = require('../models/History');
const mqttClient = require('../mqttClient');

// Keeps track of the last minute checked to avoid duplicate executions within the same minute
let lastCheckedMinute = null;

const startScheduler = () => {
    console.log('🕒 Background Cron Scheduler started...');

    // Run interval every 15 seconds to ensure we don't skip a minute
    setInterval(async () => {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentTimeKey = `${currentHour}:${currentMinute}`;

        // Ensure we only process schedules once per minute
        if (lastCheckedMinute === currentTimeKey) return;
        
        try {
            // Find all schedules matching current hour and minute
            const matchingSchedules = await Schedule.find({
                hour: currentHour,
                minute: currentMinute
            });

            if (matchingSchedules.length > 0) {
                lastCheckedMinute = currentTimeKey; // Lock this minute
                console.log(`⏰ Found ${matchingSchedules.length} schedule(s) for ${currentHour}:${currentMinute}`);

                // Process each triggered schedule
                for (let schedule of matchingSchedules) {
                    const userId = schedule.userId.toString();

                    // Retrieve user's configured quantity, default to 'medium'
                    let qtyDoc = await Quantity.findOne({ userId });
                    const level = qtyDoc ? qtyDoc.level : 'medium';

                    // Save to History as an automated 'Auto' feed
                    const history = new History({
                        userId,
                        type: 'Auto',
                        quantity: level
                    });
                    await history.save();

                    // Publish MQTT command to ESP32
                    const topic = `petfeeder/${userId}/feed`;
                    const message = JSON.stringify({
                        command: 'feed_now',
                        level: level,
                        timestamp: Date.now()
                    });

                    mqttClient.publish(topic, message, { qos: 1 }, (err) => {
                        if (err) {
                            console.error(`❌ MQTT publish error for user ${userId}:`, err);
                        } else {
                            console.log(`✅ Automated Feed: Published to ${topic} for schedule trigger.`);
                        }
                    });
                }
            }
        } catch (error) {
            console.error('Error during scheduled task lookup:', error);
        }

    }, 15000); // Check every 15 seconds
};

module.exports = { startScheduler };

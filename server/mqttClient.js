const mqtt = require('mqtt');

const client = mqtt.connect(process.env.MQTT_BROKER || 'mqtt://broker.hivemq.com');

client.on('connect', () => {
  console.log('✅ Connected to MQTT broker');
});

client.on('error', (err) => {
  console.error('❌ MQTT error:', err);
});

module.exports = client;

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

const app = express();

// CORS Configuration
const corsOptions = {
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:5173', process.env.CLIENT_URL],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json());

// Routes
const authRoutes = require('./routes/auth');
const scheduleRoutes = require('./routes/schedule');
const quantityRoutes = require('./routes/quantity');
const feedRoutes = require('./routes/feed');
const historyRoutes = require('./routes/history');
const chatRoutes = require('./routes/chat');
const petProfileRoutes = require('./routes/petProfile');
const analyticsRoutes = require('./routes/analytics');

app.use('/api/auth', authRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/quantity', quantityRoutes);
app.use('/api/feed', feedRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/profile', petProfileRoutes);
app.use('/api/analytics', analyticsRoutes);

// Connect to MongoDB
const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/petfeeder';
mongoose.connect(mongoURI)
.then(() => {
    console.log('Connected to MongoDB');
    // Start Background Scheduler
    const { startScheduler } = require('./services/cronScheduler');
    startScheduler();
})
.catch(err => console.error('MongoDB connection error:', err));

// Initialize MQTT
require('./mqttClient');

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});

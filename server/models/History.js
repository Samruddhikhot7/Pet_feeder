const mongoose = require('mongoose');

const HistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  time: {
    type: Date,
    default: Date.now,
    required: true
  },
  type: {
    type: String,
    enum: ['Manual', 'Auto'],
    required: true
  },
  quantity: {
    type: String, // could be "low", "medium", "high"
    required: true
  }
});

module.exports = mongoose.model('History', HistorySchema);

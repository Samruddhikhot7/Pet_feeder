const mongoose = require('mongoose');

const QuantitySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true // each user has one active quantity setting
  },
  level: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
    required: true
  }
});

module.exports = mongoose.model('Quantity', QuantitySchema);

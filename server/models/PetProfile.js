const mongoose = require('mongoose');

const PetProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  name: { type: String, required: true },
  breed: { type: String, default: '' },
  age: { type: Number, default: 0 },
  weight: { type: Number, default: 0 },
  recommendation: { type: String, default: '' }
});

module.exports = mongoose.model('PetProfile', PetProfileSchema);

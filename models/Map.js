const mongoose = require('mongoose');

const MapSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  imageUrl: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['de', 'cs', 'as', 'fy', 'awp', 'aim', 'other'],
    default: 'other'
  },
  ctWinRate: {
    type: Number,
    default: 50 // Yüzde olarak
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isOfficial: {
    type: Boolean,
    default: true
  },
  isCustom: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Map', MapSchema); 
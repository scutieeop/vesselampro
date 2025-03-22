const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  profileImage: {
    type: String,
    default: '/images/profiles/default.png'
  },
  profileImageData: {
    data: Buffer,
    contentType: String
  },
  role: {
    type: String,
    enum: ['uye', 'sunucu_admini', 'site_admini', 'sunucu_sahibi', 'site_kurucusu'],
    default: 'uye'
  },
  hideRole: {
    type: Boolean,
    default: false
  },
  stats: {
    kills: { type: Number, default: 0 },
    deaths: { type: Number, default: 0 },
    playTime: { type: Number, default: 0 }, // In minutes
    lastLogin: { type: Date, default: null }
  },
  steamId: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    default: '',
    maxlength: 500
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  lastActive: {
    type: Date,
    default: null
  },
  isPublic: {
    type: Boolean,
    default: true
  }
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
UserSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

module.exports = mongoose.model('User', UserSchema); 
const mongoose = require('mongoose');

const freelancerProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true  // One profile per user
  },
  title: {
    type: String,
    default: ''   // e.g. "Full Stack Developer"
  },
  bio: {
    type: String,
    default: ''
  },
  skills: [
    {
      name: { type: String },
      level: {
        type: String,
        enum: ['beginner', 'intermediate', 'expert'],
        default: 'intermediate'
      }
    }
  ],
  portfolio: [
    {
      title: { type: String },
      description: { type: String },
      link: { type: String },
      image: { type: String }
    }
  ],
  experience: [
    {
      company: { type: String },
      role: { type: String },
      from: { type: Date },
      to: { type: Date },
      current: { type: Boolean, default: false },
      description: { type: String }
    }
  ],
  education: [
    {
      institution: { type: String },
      degree: { type: String },
      field: { type: String },
      from: { type: Date },
      to: { type: Date }
    }
  ],
  certifications: [
    {
      name: { type: String },
      issuer: { type: String },
      year: { type: String },
      link: { type: String }
    }
  ],
  hourlyRate: {
    type: Number,
    default: 0
  },
  availability: {
    type: String,
    enum: ['available', 'busy', 'not_available'],
    default: 'available'
  },
  location: {
    type: String,
    default: ''
  },
  resumeUrl: {
    type: String,
    default: ''
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  reputationScore: {
    type: Number,
    default: 0
  },
  totalEarnings: {
    type: Number,
    default: 0
  },
  completedGigs: {
    type: Number,
    default: 0
  },
  availabilitySlots: [
    {
      date: { type: Date, required: true },
      startTime: { type: String, required: true },
      endTime: { type: String, required: true },
      isBooked: { type: Boolean, default: false },
      bookedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
      }
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('FreelancerProfile', freelancerProfileSchema);
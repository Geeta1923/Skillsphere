const mongoose = require('mongoose');

const gigSchema = new mongoose.Schema({
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Gig title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Description is required']
  },
  category: {
    type: String,
    required: true,
    enum: [
      'Web Development', 'Mobile Development', 'UI/UX Design',
      'Graphic Design', 'Content Writing', 'Digital Marketing',
      'Data Science', 'DevOps', 'Video Editing', 'Other'
    ]
  },
  skillsRequired: [{ type: String }],
  budgetType: {
    type: String,
    enum: ['fixed', 'hourly'],
    default: 'fixed'
  },
  budgetMin: { type: Number, required: true },
  budgetMax: { type: Number, required: true },
  deadline: { type: Date },
  milestones: [
    {
      title: { type: String },
      amount: { type: Number },
      dueDate: { type: Date },
      status: {
        type: String,
        enum: ['pending', 'funded', 'released'],
        default: 'pending'
      }
    }
  ],
  location: { type: String, default: 'Remote' },
  isRemote: { type: Boolean, default: true },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'completed', 'cancelled'],
    default: 'open'
  },
  attachments: [
    {
      name: { type: String },
      url: { type: String }
    }
  ],
  proposalCount: { type: Number, default: 0 },
  hiredFreelancer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  views: { type: Number, default: 0 },

  // ✅ Progress tracking fields — INSIDE schema
  progressLogs: [
    {
      message: { type: String },
      percentage: { type: Number },
      fileUrl: { type: String },
      fileName: { type: String },
      addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      createdAt: { type: Date, default: Date.now }
    }
  ],
  completionPercentage: {
    type: Number,
    default: 0
  },
  isSuspicious: {
    type: Boolean,
    default: false
  }

}, { timestamps: true });

// Index for search
gigSchema.index({ title: 'text', description: 'text', skillsRequired: 'text' });

module.exports = mongoose.model('Gig', gigSchema);
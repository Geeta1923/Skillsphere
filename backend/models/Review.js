const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  gig: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Gig',
    required: true
  },
  reviewer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true  // client who gives review
  },
  freelancer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true  // freelancer who receives review
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: true,
    trim: true
  },
  // Weighted scoring categories
  communication: { type: Number, min: 1, max: 5 },
  quality: { type: Number, min: 1, max: 5 },
  timeliness: { type: Number, min: 1, max: 5 },

  isVerified: { type: Boolean, default: false },
  isFlagged: { type: Boolean, default: false },
  isSuspicious: { type: Boolean, default: false },
  fraudReason: { type: String, default: '' },
  sentimentScore: { type: Number, default: 0 } // 0-100 score for AI Sentiment
}, { timestamps: true });

// One review per gig per reviewer
reviewSchema.index({ gig: 1, reviewer: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
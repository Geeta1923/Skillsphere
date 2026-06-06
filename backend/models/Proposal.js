const mongoose = require('mongoose');

const proposalSchema = new mongoose.Schema({
  gig: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Gig',
    required: true
  },
  freelancer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  coverLetter: {
    type: String,
    required: [true, 'Cover letter is required']
  },
  bidAmount: {
    type: Number,
    required: [true, 'Bid amount is required']
  },
  estimatedDays: {
    type: Number,
    required: [true, 'Estimated days is required']
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'withdrawn'],
    default: 'pending'
  },
  clientNote: {
    type: String,
    default: ''   // Client's reply when accepting/rejecting
  }
}, { timestamps: true });

// One freelancer can only submit one proposal per gig
proposalSchema.index({ gig: 1, freelancer: 1 }, { unique: true });

module.exports = mongoose.model('Proposal', proposalSchema);
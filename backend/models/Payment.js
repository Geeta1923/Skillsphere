const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  gig: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Gig',
    required: true
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  freelancer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true  // in rupees
  },
  razorpayOrderId: {
    type: String,
    required: true
  },
  razorpayPaymentId: {
    type: String,
    default: ''
  },
  razorpaySignature: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['created', 'paid', 'escrowed', 'released', 'failed', 'refunded'],
    default: 'created'
  },
  paymentType: {
    type: String,
    enum: ['full', 'milestone'],
    default: 'full'
  },
  milestoneIndex: {
    type: Number,
    default: null
  },
  paidAt: {
    type: Date,
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
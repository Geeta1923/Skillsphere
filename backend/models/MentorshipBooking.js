const mongoose = require('mongoose');

const mentorshipBookingSchema = new mongoose.Schema({
  mentor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  mentee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  slot: {
    date: Date,
    startTime: String,
    endTime: String
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'paid'],
    default: 'unpaid'
  },
  paymentId: String,
  amount: Number,
  meetingLink: {
    type: String,
    default: ''
  },
  topic: String
}, { timestamps: true });

module.exports = mongoose.model('MentorshipBooking', mentorshipBookingSchema);

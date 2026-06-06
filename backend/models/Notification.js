const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: [
      'new_proposal',
      'proposal_accepted',
      'proposal_rejected',
      'new_message',
      'review_added',
      'gig_hired',
      'payment_received'
    ],
    required: true
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  link: { type: String, default: '' },
  isRead: { type: Boolean, default: false },
  data: { type: Object, default: {} }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
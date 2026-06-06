const asyncHandler = require('express-async-handler');
const FreelancerProfile = require('../models/FreelancerProfile');
const MentorshipBooking = require('../models/MentorshipBooking');
const User = require('../models/User');
const Razorpay = require('razorpay');
const crypto = require('crypto');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// GET /api/mentorship/mentors  ← Get list of all mentors
const getMentors = asyncHandler(async (req, res) => {
  const mentors = await FreelancerProfile.find({ isMentor: true })
    .populate('user', 'name avatar email');
  res.json({ success: true, mentors });
});

// GET /api/mentorship/mentor/:id  ← Get specific mentor profile
const getMentorById = asyncHandler(async (req, res) => {
  const mentor = await FreelancerProfile.findOne({ user: req.params.id, isMentor: true })
    .populate('user', 'name avatar email');
  
  if (!mentor) {
    res.status(404);
    throw new Error('Mentor not found');
  }
  
  res.json({ success: true, mentor });
});

// POST /api/mentorship/toggle  ← Toggle mentor status for current user
const toggleMentorStatus = asyncHandler(async (req, res) => {
  const { isMentor, rate, specialties } = req.body;
  
  const profile = await FreelancerProfile.findOneAndUpdate(
    { user: req.user._id },
    { isMentor, mentorshipRate: rate, mentorshipSpecialties: specialties },
    { new: true }
  );

  res.json({ success: true, profile });
});

// POST /api/mentorship/create-order  ← Create Razorpay order for mentorship
const createMentorshipOrder = asyncHandler(async (req, res) => {
  const { amount, mentorId, slot, topic } = req.body;

  const order = await razorpay.orders.create({
    amount: amount * 100, // paise
    currency: 'INR',
    receipt: `mentorship_${Date.now()}`
  });

  // Create pending booking
  const booking = await MentorshipBooking.create({
    mentor: mentorId,
    mentee: req.user._id,
    slot,
    amount,
    topic,
    status: 'pending',
    paymentId: order.id
  });

  res.json({ success: true, order, booking, key: process.env.RAZORPAY_KEY_ID });
});

// POST /api/mentorship/verify  ← Verify payment and confirm session
const verifyMentorshipPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  const body = razorpay_order_id + '|' + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');

  if (expectedSignature !== razorpay_signature) {
    res.status(400);
    throw new Error('Invalid payment signature');
  }

  const booking = await MentorshipBooking.findOneAndUpdate(
    { paymentId: razorpay_order_id },
    { status: 'confirmed', paymentStatus: 'paid', paymentId: razorpay_payment_id },
    { new: true }
  );

  res.json({ success: true, booking });
});

// POST /api/mentorship/complete/:id  ← Release funds to mentor
const completeMentorship = asyncHandler(async (req, res) => {
  const booking = await MentorshipBooking.findById(req.params.id);
  
  if (!booking || booking.status !== 'confirmed') {
    res.status(400);
    throw new Error('Booking not found or not confirmed');
  }

  booking.status = 'completed';
  await booking.save();

  // Add earnings to mentor
  await FreelancerProfile.findOneAndUpdate(
    { user: booking.mentor },
    { $inc: { totalEarnings: booking.amount } }
  );

  res.json({ success: true, message: 'Session completed and funds released' });
});

// GET /api/mentorship/my-sessions  ← Get sessions for current user (as mentor or mentee)
const getMySessions = asyncHandler(async (req, res) => {
  const sessions = await MentorshipBooking.find({
    $or: [{ mentor: req.user._id }, { mentee: req.user._id }]
  }).populate('mentor', 'name avatar')
    .populate('mentee', 'name avatar')
    .sort({ createdAt: -1 });

  res.json({ success: true, sessions });
});

module.exports = {
  getMentors,
  getMentorById,
  toggleMentorStatus,
  createMentorshipOrder,
  verifyMentorshipPayment,
  completeMentorship,
  getMySessions
};

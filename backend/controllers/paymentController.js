// const asyncHandler = require('express-async-handler');
// const Razorpay = require('razorpay');
// const crypto = require('crypto');
// const Payment = require('../models/Payment');
// const Gig = require('../models/Gig');
// const { createNotification } = require('./notificationController');

// // Initialize Razorpay
// const razorpay = new Razorpay({
//   key_id: process.env.RAZORPAY_KEY_ID?.trim(),
//   key_secret: process.env.RAZORPAY_KEY_SECRET?.trim()
// });

// // POST /api/payments/create-order  ← create Razorpay order
// const createOrder = asyncHandler(async (req, res) => {
//   const { gigId, amount, paymentType, milestoneIndex } = req.body;
//   console.log('Razorpay Key:', process.env.RAZORPAY_KEY_ID) 
//   console.log('Request body:', req.body) 
//   const gig = await Gig.findById(gigId);
//   if (!gig) {
//     res.status(404);
//     throw new Error('Gig not found');
//   }

//   if (!gig.hiredFreelancer) {
//     res.status(400);
//     throw new Error('No freelancer has been hired for this gig yet');
//   }

//   // Only client who owns gig can pay
//   if (gig.client.toString() !== req.user._id.toString()) {
//     res.status(403);
//     throw new Error('Not authorized');
//   }

//   // Create Razorpay order
//   // Amount must be in paise (1 rupee = 100 paise)
//   const order = await razorpay.orders.create({
//     amount: amount * 100,
//     currency: 'INR',
//     receipt: `order_${gigId}_${Date.now()}`
//   });

//   // Save payment record with 'created' status
//   const payment = await Payment.create({
//     gig: gigId,
//     client: req.user._id,
//     freelancer: gig.hiredFreelancer,
//     amount,
//     razorpayOrderId: order.id,
//     paymentType: paymentType || 'full',
//     milestoneIndex: milestoneIndex ?? null
//   });

//   res.json({
//     success: true,
//     order,
//     payment,
//     key: process.env.RAZORPAY_KEY_ID  // Send key to frontend
//   });
// });

// // POST /api/payments/verify  ← verify payment after Razorpay callback
// const verifyPayment = asyncHandler(async (req, res) => {
//   const {
//     razorpay_order_id,
//     razorpay_payment_id,
//     razorpay_signature
//   } = req.body;

//   // Verify signature — this is the security check
//   // Razorpay signs: order_id + "|" + payment_id with your secret
//   const body = razorpay_order_id + '|' + razorpay_payment_id;
//   const expectedSignature = crypto
//     .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
//     .update(body)
//     .digest('hex');

//   if (expectedSignature !== razorpay_signature) {
//     res.status(400);
//     throw new Error('Payment verification failed — invalid signature');
//   }

//   // Update payment record
//   const payment = await Payment.findOneAndUpdate(
//     { razorpayOrderId: razorpay_order_id },
//     {
//       razorpayPaymentId: razorpay_payment_id,
//       razorpaySignature: razorpay_signature,
//       status: 'paid',
//       paidAt: new Date()
//     },
//     { new: true }
//   ).populate('gig');

//   if (!payment) {
//     res.status(404);
//     throw new Error('Payment record not found');
//   }

//   // Update gig status to completed if full payment
//   if (payment.paymentType === 'full') {
//     await Gig.findByIdAndUpdate(payment.gig._id, { status: 'completed' });
//   }

//   // Update milestone status if milestone payment
//   if (payment.paymentType === 'milestone' && payment.milestoneIndex !== null) {
//     const gig = await Gig.findById(payment.gig._id);
//     if (gig.milestones[payment.milestoneIndex]) {
//       gig.milestones[payment.milestoneIndex].status = 'paid';
//       await gig.save();
//     }
//   }

//   // Update freelancer total earnings
//   const FreelancerProfile = require('../models/FreelancerProfile');
//   await FreelancerProfile.findOneAndUpdate(
//     { user: payment.freelancer },
//     { $inc: { totalEarnings: payment.amount } }
//   );

//   // Notify freelancer
//   await createNotification(
//     req.app.get('io'),
//     req.app.get('onlineUsers'),
//     {
//       recipientId: payment.freelancer,
//       type: 'payment_received',
//       title: '💰 Payment Received!',
//       message: `You received ₹${payment.amount} for "${payment.gig.title}"`,
//       link: '/dashboard/earnings',
//       data: { amount: payment.amount }
//     }
//   );

//   res.json({ success: true, payment });
// });

// // GET /api/payments/my  ← get payment history (client)
// const getMyPayments = asyncHandler(async (req, res) => {
//   const payments = await Payment.find({ client: req.user._id })
//     .populate('gig', 'title')
//     .populate('freelancer', 'name avatar')
//     .sort({ createdAt: -1 });

//   res.json({ success: true, payments });
// });

// // GET /api/payments/earnings  ← get earnings (freelancer)
// const getMyEarnings = asyncHandler(async (req, res) => {
//   const payments = await Payment.find({
//     freelancer: req.user._id,
//     status: 'paid'
//   })
//     .populate('gig', 'title')
//     .populate('client', 'name avatar')
//     .sort({ paidAt: -1 });

//   const totalEarnings = payments.reduce((sum, p) => sum + p.amount, 0);

//   // Monthly breakdown for chart
//   const monthlyData = {}
//   payments.forEach(p => {
//     const month = new Date(p.paidAt).toLocaleString('default', {
//       month: 'short', year: 'numeric'
//     })
//     monthlyData[month] = (monthlyData[month] || 0) + p.amount
//   })

//   res.json({ success: true, payments, totalEarnings, monthlyData });
// });

// module.exports = { createOrder, verifyPayment, getMyPayments, getMyEarnings, releaseFunds };







const { sendPaymentConfirmationEmail } = require('../services/emailService');
const User = require('../models/User');


const asyncHandler = require('express-async-handler');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Payment = require('../models/Payment');
const Gig = require('../models/Gig');
const { createNotification } = require('./notificationController');

// POST /api/payments/create-order
const createOrder = asyncHandler(async (req, res) => {
  const { gigId, amount, paymentType, milestoneIndex } = req.body;

  // Validate inputs
  if (!gigId || !amount) {
    res.status(400);
    throw new Error('gigId and amount are required');
  }

  // Find gig
  const gig = await Gig.findById(gigId);
  if (!gig) {
    res.status(404);
    throw new Error('Gig not found');
  }

  if (gig.client.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized');
  }

  // If milestone payment, validate index
  if (paymentType === 'milestone') {
    if (milestoneIndex === undefined || milestoneIndex === null || !gig.milestones[milestoneIndex]) {
      res.status(400);
      throw new Error('Invalid milestone index');
    }
  }

  // Initialize Razorpay fresh each time
  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });

  // Create order — amount in paise
  let order;
  try {
    order = await razorpay.orders.create({
      amount: Math.round(Number(amount) * 100),
      currency: 'INR',
      receipt: `rcpt_${Date.now()}`
    });
  } catch (razorpayError) {
    res.status(500);
    throw new Error(`Razorpay error: ${razorpayError.error?.description || razorpayError.message}`);
  }

  // Save payment record
  const payment = await Payment.create({
    gig: gigId,
    client: req.user._id,
    freelancer: gig.hiredFreelancer,
    amount: Number(amount),
    razorpayOrderId: order.id,
    paymentType: paymentType || 'full',
    milestoneIndex: milestoneIndex ?? null
  });

  res.json({
    success: true,
    order,
    payment,
    key: process.env.RAZORPAY_KEY_ID
  });
});

// POST /api/payments/verify
const verifyPayment = asyncHandler(async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature
  } = req.body;

  // Verify signature
  const body = razorpay_order_id + '|' + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');

  if (expectedSignature !== razorpay_signature) {
    res.status(400);
    throw new Error('Payment verification failed');
  }

  // Update payment status to 'escrowed' (Funds are held by platform)
  const payment = await Payment.findOneAndUpdate(
    { razorpayOrderId: razorpay_order_id },
    {
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      status: 'escrowed',
      paidAt: new Date()
    },
    { new: true }
  ).populate('gig');

  if (!payment) {
    res.status(404);
    throw new Error('Payment record not found');
  }

  // If milestone payment, update milestone status to 'funded'
  if (payment.paymentType === 'milestone' && payment.milestoneIndex !== null) {
    const gig = await Gig.findById(payment.gig._id);
    if (gig.milestones[payment.milestoneIndex]) {
      gig.milestones[payment.milestoneIndex].status = 'funded';
      await gig.save();
    }
  } else if (payment.paymentType === 'full') {
    // If full payment, we can mark ALL milestones as funded if they exist
    const gig = await Gig.findById(payment.gig._id);
    if (gig.milestones && gig.milestones.length > 0) {
      gig.milestones.forEach(m => {
        if (m.status === 'pending') m.status = 'funded';
      });
      await gig.save();
    }
  }

  // Notify freelancer that payment is in ESCROW
  await createNotification(
    req.app.get('io'),
    req.app.get('onlineUsers'),
    {
      recipientId: payment.freelancer,
      type: 'payment_received',
      title: '🛡️ Payment in Escrow!',
      message: `₹${payment.amount} for "${payment.gig.title}" is held in escrow. It will be released upon milestone completion.`,
      link: '/dashboard/payments',
      data: { amount: payment.amount }
    }
  );

  res.json({ success: true, payment });
});

// POST /api/payments/release/:paymentId
const releaseFunds = asyncHandler(async (req, res) => {
  const { paymentId } = req.params;

  const payment = await Payment.findById(paymentId).populate('gig');
  if (!payment) {
    res.status(404);
    throw new Error('Payment record not found');
  }

  // Only the client of the gig can release funds
  if (payment.client.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to release funds');
  }

  if (payment.status !== 'escrowed') {
    res.status(400);
    throw new Error(`Funds cannot be released. Current status: ${payment.status}`);
  }

  // 1. Update Payment status
  payment.status = 'released';
  await payment.save();

  // 2. Update Milestone status if applicable
  if (payment.paymentType === 'milestone' && payment.milestoneIndex !== null) {
    const gig = await Gig.findById(payment.gig._id);
    if (gig.milestones[payment.milestoneIndex]) {
      gig.milestones[payment.milestoneIndex].status = 'released';
      await gig.save();
    }
  } else if (payment.paymentType === 'full') {
     const gig = await Gig.findById(payment.gig._id);
     gig.status = 'completed';
     if (gig.milestones) {
        gig.milestones.forEach(m => m.status = 'released');
     }
     await gig.save();
  }

  // 3. Update Freelancer Earnings ONLY NOW
  const FreelancerProfile = require('../models/FreelancerProfile');
  await FreelancerProfile.findOneAndUpdate(
    { user: payment.freelancer },
    { $inc: { totalEarnings: payment.amount, completedGigs: 1 } }
  );

  // 4. Notify Freelancer
  try {
    const freelancer = await User.findById(payment.freelancer);
    await sendPaymentConfirmationEmail(
      freelancer.email,
      freelancer.name,
      payment.amount,
      payment.gig.title
    );
  } catch (err) {
    console.error('Email error:', err.message);
  }

  await createNotification(
    req.app.get('io'),
    req.app.get('onlineUsers'),
    {
      recipientId: payment.freelancer,
      type: 'payment_received',
      title: '💰 Funds Released!',
      message: `₹${payment.amount} has been released to your earnings for "${payment.gig.title}"`,
      link: '/dashboard/earnings',
      data: { amount: payment.amount }
    }
  );

  res.json({ success: true, message: 'Funds released successfully' });
});

// GET /api/payments/my
const getMyPayments = asyncHandler(async (req, res) => {
  const payments = await Payment.find({ client: req.user._id })
    .populate('gig', 'title')
    .populate('freelancer', 'name avatar')
    .sort({ createdAt: -1 });

  res.json({ success: true, payments });
});

// GET /api/payments/earnings
const getMyEarnings = asyncHandler(async (req, res) => {
  const payments = await Payment.find({
    freelancer: req.user._id,
    status: 'paid'
  })
    .populate('gig', 'title')
    .populate('client', 'name avatar')
    .sort({ paidAt: -1 });

  const totalEarnings = payments.reduce((sum, p) => sum + p.amount, 0);

  const monthlyData = {};
  payments.forEach(p => {
    const month = new Date(p.paidAt).toLocaleString('default', {
      month: 'short', year: 'numeric'
    });
    monthlyData[month] = (monthlyData[month] || 0) + p.amount;
  });

  res.json({ success: true, payments, totalEarnings, monthlyData });
});

module.exports = { createOrder, verifyPayment, getMyPayments, getMyEarnings, releaseFunds };
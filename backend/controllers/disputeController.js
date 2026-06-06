const asyncHandler = require('express-async-handler');
const Dispute = require('../models/Dispute');
const Gig = require('../models/Gig');
const { createNotification } = require('./notificationController');

// POST /api/disputes  ← raise a dispute
const createDispute = asyncHandler(async (req, res) => {
  const { gigId, reason, description } = req.body;

  const gig = await Gig.findById(gigId);
  if (!gig) {
    res.status(404);
    throw new Error('Gig not found');
  }

  // Determine who dispute is against
  const against = req.user._id.toString() === gig.client.toString()
    ? gig.hiredFreelancer
    : gig.client;

  if (!against) {
    res.status(400);
    throw new Error('No other party found for this gig');
  }

  // Check if dispute already exists
  const existing = await Dispute.findOne({
    gig: gigId,
    raisedBy: req.user._id,
    status: { $in: ['open', 'under_review'] }
  });

  if (existing) {
    res.status(400);
    throw new Error('You already have an open dispute for this gig');
  }

  let evidence = [];
  if (req.files && req.files.length > 0) {
    evidence = req.files.map(file => ({
      url: file.path || file.secure_url,
      description: file.originalname
    }));
  }

  const dispute = await Dispute.create({
    gig: gigId,
    raisedBy: req.user._id,
    against,
    reason,
    description,
    evidence
  });

  await dispute.populate([
    { path: 'raisedBy', select: 'name email avatar' },
    { path: 'against', select: 'name email avatar' },
    { path: 'gig', select: 'title' }
  ]);

  // Notify admin
  const adminUsers = await require('../models/User').find({ role: 'admin' });
  for (const admin of adminUsers) {
    await createNotification(
      req.app.get('io'),
      req.app.get('onlineUsers'),
      {
        recipientId: admin._id,
        type: 'new_proposal',
        title: '⚠️ New Dispute Raised!',
        message: `${dispute.raisedBy.name} raised a dispute for "${dispute.gig.title}"`,
        link: '/admin/disputes',
        data: { disputeId: dispute._id }
      }
    );
  }

  res.status(201).json({ success: true, dispute });
});

// GET /api/disputes/my  ← get my disputes
const getMyDisputes = asyncHandler(async (req, res) => {
  const disputes = await Dispute.find({
    $or: [
      { raisedBy: req.user._id },
      { against: req.user._id }
    ]
  })
    .populate('raisedBy', 'name avatar')
    .populate('against', 'name avatar')
    .populate('gig', 'title status')
    .sort({ createdAt: -1 });

  res.json({ success: true, disputes });
});

// GET /api/disputes/:id  ← get single dispute
const getDisputeById = asyncHandler(async (req, res) => {
  const dispute = await Dispute.findById(req.params.id)
    .populate('raisedBy', 'name avatar email')
    .populate('against', 'name avatar email')
    .populate('gig', 'title status budgetMax')
    .populate('messages.sender', 'name avatar')
    .populate('resolvedBy', 'name');

  if (!dispute) {
    res.status(404);
    throw new Error('Dispute not found');
  }

  res.json({ success: true, dispute });
});

// POST /api/disputes/:id/message  ← add message to dispute
const addMessage = asyncHandler(async (req, res) => {
  const { message } = req.body;

  const dispute = await Dispute.findById(req.params.id);
  if (!dispute) {
    res.status(404);
    throw new Error('Dispute not found');
  }

  dispute.messages.push({
    sender: req.user._id,
    message
  });

  await dispute.save();
  await dispute.populate('messages.sender', 'name avatar');

  res.json({ success: true, messages: dispute.messages });
});

// GET /api/disputes  ← admin gets all disputes
const getAllDisputes = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = status ? { status } : {};

  const disputes = await Dispute.find(filter)
    .populate('raisedBy', 'name email avatar')
    .populate('against', 'name email avatar')
    .populate('gig', 'title')
    .sort({ createdAt: -1 });

  res.json({ success: true, disputes });
});

// PUT /api/disputes/:id/resolve  ← admin resolves dispute
const resolveDispute = asyncHandler(async (req, res) => {
  const { resolution, adminNotes, status } = req.body;

  const dispute = await Dispute.findById(req.params.id);
  if (!dispute) {
    res.status(404);
    throw new Error('Dispute not found');
  }

  dispute.status = status || 'resolved';
  dispute.resolution = resolution;
  dispute.adminNotes = adminNotes || '';
  dispute.resolvedBy = req.user._id;
  dispute.resolvedAt = new Date();

  await dispute.save();

  // Notify both parties
  for (const userId of [dispute.raisedBy, dispute.against]) {
    await createNotification(
      req.app.get('io'),
      req.app.get('onlineUsers'),
      {
        recipientId: userId,
        type: 'gig_hired',
        title: '⚖️ Dispute Resolved',
        message: `Your dispute has been resolved by admin`,
        link: '/dashboard/disputes',
        data: { disputeId: dispute._id }
      }
    );
  }

  res.json({ success: true, dispute });
});

module.exports = {
  createDispute, getMyDisputes, getDisputeById,
  addMessage, getAllDisputes, resolveDispute
};
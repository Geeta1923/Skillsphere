const asyncHandler = require('express-async-handler');
const Gig = require('../models/Gig');
const Proposal = require('../models/Proposal');
const { checkGigFraud } = require('../services/fraudService');

// POST /api/gigs  ← client creates a gig
const createGig = asyncHandler(async (req, res) => {
  const {
    title, description, category, skillsRequired,
    budgetType, budgetMin, budgetMax, deadline,
    milestones, location, isRemote
  } = req.body;

  const gig = await Gig.create({
    client: req.user._id,
    title, description, category,
    skillsRequired: skillsRequired || [],
    budgetType, budgetMin, budgetMax,
    deadline, milestones: milestones || [],
    location: location || 'Remote',
    isRemote: isRemote !== undefined ? isRemote : true
  });

  // Fraud Check
  const fraudCheck = await checkGigFraud({ title, description, budgetMax });
  if (fraudCheck.isSuspicious) {
    // If suspicious, we still create it but mark it for admin review or warn
    gig.isSuspicious = true; // wait, need to add this to Gig model too
    await gig.save();
  }

  res.status(201).json({ success: true, gig });
});

// GET /api/gigs  ← browse all open gigs (with search + filters)
const getGigs = asyncHandler(async (req, res) => {
  const {
    search, category, budgetMin, budgetMax,
    skills, location, page = 1, limit = 50  
  } = req.query;
  

  // Build filter object dynamically
  const filter = { status: 'open' };

  if (search) {
    filter.$text = { $search: search };
  }
  if (category) filter.category = category;
  if (location) filter.location = new RegExp(location, 'i');
  if (budgetMin || budgetMax) {
    filter.budgetMin = {};
    if (budgetMin) filter.budgetMin.$gte = Number(budgetMin);
    if (budgetMax) filter.budgetMax = { $lte: Number(budgetMax) };
  }
  if (skills) {
    const skillsArray = skills.split(',');
    filter.skillsRequired = { $in: skillsArray };
  }

  const skip = (page - 1) * limit;
  const total = await Gig.countDocuments(filter);
  const gigs = await Gig.find(filter)
    .populate('client', 'name avatar')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  res.json({
    success: true,
    gigs,
    pagination: {
      total,
      page: Number(page),
      pages: Math.ceil(total / limit)
    }
  });
});

// GET /api/gigs/:id  ← get single gig details
const getGigById = asyncHandler(async (req, res) => {
  const gig = await Gig.findById(req.params.id)
    .populate('client', 'name avatar email');

  if (!gig) {
    res.status(404);
    throw new Error('Gig not found');
  }

  // Increment views
  gig.views += 1;
  await gig.save();

  res.json({ success: true, gig });
});

// PUT /api/gigs/:id  ← client updates their gig
const updateGig = asyncHandler(async (req, res) => {
  const gig = await Gig.findById(req.params.id);

  if (!gig) {
    res.status(404);
    throw new Error('Gig not found');
  }

  // Only the client who created it can update
  if (gig.client.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to update this gig');
  }

  const updatedGig = await Gig.findByIdAndUpdate(
    req.params.id, req.body, { new: true }
  );

  res.json({ success: true, gig: updatedGig });
});

// DELETE /api/gigs/:id  ← client deletes their gig
const deleteGig = asyncHandler(async (req, res) => {
  const gig = await Gig.findById(req.params.id);

  if (!gig) {
    res.status(404);
    throw new Error('Gig not found');
  }

  if (gig.client.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to delete this gig');
  }

  await gig.deleteOne();
  res.json({ success: true, message: 'Gig deleted' });
});

// GET /api/gigs/my/gigs  ← client sees their own gigs
const getMyGigs = asyncHandler(async (req, res) => {
  const gigs = await Gig.find({ client: req.user._id })
    .sort({ createdAt: -1 });
  res.json({ success: true, gigs });
});



// GET /api/gigs/:id/progress  ← get progress of a gig
const getProgress = asyncHandler(async (req, res) => {
  const gig = await Gig.findById(req.params.id)
    .populate('progressLogs.addedBy', 'name avatar');

  if (!gig) {
    res.status(404);
    throw new Error('Gig not found');
  }

  res.json({
    success: true,
    completionPercentage: gig.completionPercentage,
    progressLogs: gig.progressLogs,
    milestones: gig.milestones
  });
});

const updateProgress = asyncHandler(async (req, res) => {
  const { message, percentage, fileUrl, fileName } = req.body;

  const gig = await Gig.findById(req.params.id);
  if (!gig) {
    res.status(404);
    throw new Error('Gig not found');
  }

  if (gig.hiredFreelancer?.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized');
  }

  gig.completionPercentage = percentage;
  gig.progressLogs.push({
    message,
    percentage,
    fileUrl,
    fileName,
    addedBy: req.user._id
  });

  if (percentage === 100) {
    gig.status = 'completed';
  }

  await gig.save();

  const { createNotification } = require('./notificationController');
  await createNotification(req.app.get('io'), req.app.get('onlineUsers'), {
    recipientId: gig.client,
    type: 'gig_hired',
    title: '📊 Progress Updated!',
    message: `Freelancer updated progress to ${percentage}% on "${gig.title}"`,
    link: `/dashboard/gigs/${gig._id}`,
    data: { gigId: gig._id, percentage }
  });

  res.json({ success: true, gig });
});

// GET /api/gigs/hired  ← gigs where this freelancer is hired
const getHiredGigs = asyncHandler(async (req, res) => {
  const gigs = await Gig.find({
    hiredFreelancer: req.user._id,
    status: { $in: ['in_progress', 'completed'] }
  })
  .populate('client', 'name avatar')
  .sort({ updatedAt: -1 });

  console.log('Hired gigs found:', gigs.length)
  res.json({ success: true, gigs });
});


module.exports = {
  createGig, getGigs, getGigById,
  updateGig, deleteGig, getMyGigs, updateProgress,  getProgress, getHiredGigs
};
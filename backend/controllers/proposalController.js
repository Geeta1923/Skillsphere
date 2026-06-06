const asyncHandler = require('express-async-handler');
const Proposal = require('../models/Proposal');
const Gig = require('../models/Gig');
const User = require('../models/User');
const FreelancerProfile = require('../models/FreelancerProfile');

const { calculateMatchScore } = require('../services/aiMatchingService');
const { createNotification } = require('./notificationController');
// POST /api/proposals/:gigId  ← freelancer submits proposal



const {
  sendProposalNotificationEmail,
  sendProposalAcceptedEmail
} = require('../services/emailService');
const submitProposal = asyncHandler(async (req, res) => {
  const { coverLetter, bidAmount, estimatedDays } = req.body;
  const gigId = req.params.gigId;

  // Check gig exists and is open
  const gig = await Gig.findById(gigId);
  if (!gig) {
    res.status(404);
    throw new Error('Gig not found');
  }
  if (gig.status !== 'open') {
    res.status(400);
    throw new Error('This gig is no longer accepting proposals');
  }

  // Check freelancer hasn't already applied
  const existing = await Proposal.findOne({
    gig: gigId,
    freelancer: req.user._id
  });
  if (existing) {
    res.status(400);
    throw new Error('You already submitted a proposal for this gig');
  }

  const proposal = await Proposal.create({
    gig: gigId,
    freelancer: req.user._id,
    coverLetter,
    bidAmount,
    estimatedDays
  });

  // Increment proposal count on gig
  gig.proposalCount += 1;
  await gig.save();

  try {
  const client = await User.findById(gig.client);
  await sendProposalNotificationEmail(
    client.email, client.name, gig.title
  );
} catch (err) {
  console.error('Email error:', err.message);
}

  // Notify client that a new proposal arrived
await createNotification(req.app.get('io'), req.app.get('onlineUsers'), {
  recipientId: gig.client,
  type: 'new_proposal',
  title: 'New Proposal Received!',
  message: `You received a new proposal for "${gig.title}"`,
  link: `/dashboard/gigs/${gig._id}`,
  data: { gigId: gig._id }
});

  res.status(201).json({ success: true, proposal });
});

// GET /api/proposals/my  ← freelancer sees their proposals
const getMyProposals = asyncHandler(async (req, res) => {
  const proposals = await Proposal.find({ freelancer: req.user._id })
    .populate('gig', 'title budgetMin budgetMax status category')
    .sort({ createdAt: -1 });

  res.json({ success: true, proposals });
});

// GET /api/proposals/gig/:gigId  ← client sees proposals on their gig
const getGigProposals = asyncHandler(async (req, res) => {
  const gig = await Gig.findById(req.params.gigId);
  if (!gig) {
    res.status(404);
    throw new Error('Gig not found');
  }

  if (gig.client.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized');
  }

  const proposals = await Proposal.find({ gig: req.params.gigId })
    .populate('freelancer', 'name avatar email isVerified')
    .sort({ createdAt: -1 });

  // Calculate AI match scores for each proposal
  const enrichedProposals = await Promise.all(
    proposals.map(async (p) => {
      const profile = await FreelancerProfile.findOne({ user: p.freelancer._id });
      if (!profile) return { ...p.toObject(), aiMatchScore: 0 };
      
      const freelancerSkills = profile.skills.map(s => s.name);
      const score = await calculateMatchScore(gig.skillsRequired, freelancerSkills);
      
      return { ...p.toObject(), aiMatchScore: score };
    })
  );

  res.json({ success: true, proposals: enrichedProposals });
});

// PUT /api/proposals/:id/status  ← client accepts/rejects proposal
const updateProposalStatus = asyncHandler(async (req, res) => {
  const { status, clientNote } = req.body;

  const proposal = await Proposal.findById(req.params.id)
    .populate('gig');

  if (!proposal) {
    res.status(404);
    throw new Error('Proposal not found');
  }

  // Only gig owner can update
  if (proposal.gig.client.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized');
  }

  proposal.status = status;
  if (clientNote) proposal.clientNote = clientNote;
  await proposal.save();

  if (status === 'accepted') {
    // ✅ Explicitly update gig with both fields
    await Gig.findByIdAndUpdate(
      proposal.gig._id,
      {
        status: 'in_progress',
        hiredFreelancer: proposal.freelancer  // ← key fix
      },
      { new: true }
    );
    // Email freelancer about acceptance
try {
  const freelancer = await User.findById(proposal.freelancer);
  await sendProposalAcceptedEmail(
    freelancer.email, freelancer.name, proposal.gig.title
  );
} catch (err) {
  console.error('Email error:', err.message);
}

    // Notify freelancer
    const { createNotification } = require('./notificationController');
    await createNotification(
      req.app.get('io'),
      req.app.get('onlineUsers'),
      {
        recipientId: proposal.freelancer,
        type: 'proposal_accepted',
        title: '🎉 Proposal Accepted!',
        message: `Your proposal was accepted for "${proposal.gig.title}"`,
        link: '/dashboard/proposals',
        data: { gigId: proposal.gig._id }
      }
    );
  }

  res.json({ success: true, proposal });
});

// DELETE /api/proposals/:id  ← freelancer withdraws proposal
const withdrawProposal = asyncHandler(async (req, res) => {
  const proposal = await Proposal.findById(req.params.id);

  if (!proposal) {
    res.status(404);
    throw new Error('Proposal not found');
  }

  if (proposal.freelancer.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized');
  }

  await proposal.deleteOne();

  // Decrease proposal count
  await Gig.findByIdAndUpdate(proposal.gig, {
    $inc: { proposalCount: -1 }
  });

  res.json({ success: true, message: 'Proposal withdrawn' });
});

module.exports = {
  submitProposal, getMyProposals,
  getGigProposals, updateProposalStatus,
  withdrawProposal
};
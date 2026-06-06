const asyncHandler = require('express-async-handler');
const FreelancerProfile = require('../models/FreelancerProfile');
const User = require('../models/User');

// GET /api/profile/me  ← get my profile
const getMyProfile = asyncHandler(async (req, res) => {
  let profile = await FreelancerProfile.findOne({ user: req.user._id })
    .populate('user', 'name email avatar');  // populate = get user details too

  // If no profile exists yet, create an empty one automatically
  if (!profile) {
    profile = await FreelancerProfile.create({ user: req.user._id });
  }

  res.json({ success: true, profile });
});

// PUT /api/profile/me  ← update my profile
const updateMyProfile = asyncHandler(async (req, res) => {
  const {
    title, bio, skills, hourlyRate,
    availability, location
  } = req.body;

  let profile = await FreelancerProfile.findOne({ user: req.user._id });

  if (!profile) {
    profile = await FreelancerProfile.create({ user: req.user._id });
  }

  // Only update fields that were actually sent
  if (title !== undefined) profile.title = title;
  if (bio !== undefined) profile.bio = bio;
  if (skills !== undefined) profile.skills = skills;
  if (hourlyRate !== undefined) profile.hourlyRate = hourlyRate;
  if (availability !== undefined) profile.availability = availability;
  if (location !== undefined) profile.location = location;

  await profile.save();

  res.json({ success: true, profile });
});

// POST /api/profile/portfolio  ← add portfolio item
const addPortfolio = asyncHandler(async (req, res) => {
  const { title, description, link, image } = req.body;

  const profile = await FreelancerProfile.findOne({ user: req.user._id });
  if (!profile) {
    res.status(404);
    throw new Error('Profile not found');
  }

  profile.portfolio.push({ title, description, link, image });
  await profile.save();

  res.json({ success: true, portfolio: profile.portfolio });
});

// POST /api/profile/experience  ← add experience
const addExperience = asyncHandler(async (req, res) => {
  const { company, role, from, to, current, description } = req.body;

  const profile = await FreelancerProfile.findOne({ user: req.user._id });
  if (!profile) {
    res.status(404);
    throw new Error('Profile not found');
  }

  profile.experience.push({ company, role, from, to, current, description });
  await profile.save();

  res.json({ success: true, experience: profile.experience });
});

// POST /api/profile/education  ← add education
const addEducation = asyncHandler(async (req, res) => {
  const { institution, degree, field, from, to } = req.body;

  const profile = await FreelancerProfile.findOne({ user: req.user._id });
  if (!profile) {
    res.status(404);
    throw new Error('Profile not found');
  }

  profile.education.push({ institution, degree, field, from, to });
  await profile.save();

  res.json({ success: true, education: profile.education });
});

// POST /api/profile/certifications  ← add certification
const addCertification = asyncHandler(async (req, res) => {
  const { name, issuer, year, link } = req.body;

  const profile = await FreelancerProfile.findOne({ user: req.user._id });
  if (!profile) {
    res.status(404);
    throw new Error('Profile not found');
  }

  profile.certifications.push({ name, issuer, year, link });
  await profile.save();

  res.json({ success: true, certifications: profile.certifications });
});

// GET /api/profile/:userId  ← view any freelancer's public profile
const getFreelancerProfile = asyncHandler(async (req, res) => {
  const profile = await FreelancerProfile.findOne({ user: req.params.userId })
    .populate('user', 'name email avatar');

  if (!profile) {
    res.status(404);
    throw new Error('Profile not found');
  }

  res.json({ success: true, profile });
});






// GET /api/profile/analytics  ← freelancer analytics
const getAnalytics = asyncHandler(async (req, res) => {
  const Payment = require('../models/Payment');
  const Proposal = require('../models/Proposal');
  const Review = require('../models/Review');
  const mongoose = require('mongoose');

  // ✅ Use 'new' keyword
  const userId = new mongoose.Types.ObjectId(String(req.user._id));

  try {
    const [
      totalEarningsResult,
      monthlyEarnings,
      proposals,
      reviews,
      profile
    ] = await Promise.all([
      Payment.aggregate([
        { $match: { freelancer: userId, status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Payment.aggregate([
        { $match: { freelancer: userId, status: 'paid' } },
        {
          $group: {
            _id: {
              month: { $month: '$paidAt' },
              year: { $year: '$paidAt' }
            },
            total: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
        { $limit: 6 }
      ]),
      Proposal.aggregate([
        { $match: { freelancer: userId } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Review.find({ freelancer: userId })
        .populate('reviewer', 'name avatar')
        .populate('gig', 'title')
        .sort({ createdAt: -1 })
        .limit(5),
      FreelancerProfile.findOne({ user: userId })
    ]);

    const months = ['Jan','Feb','Mar','Apr','May','Jun',
      'Jul','Aug','Sep','Oct','Nov','Dec'];

    const monthlyChart = monthlyEarnings.map(m => ({
      month: months[m._id.month - 1],
      year: m._id.year,
      amount: m.total,
      projects: m.count
    }));

    const proposalStats = {
      total: 0, pending: 0, accepted: 0, rejected: 0, withdrawn: 0
    };
    proposals.forEach(p => {
      proposalStats.total += p.count;
      if (proposalStats.hasOwnProperty(p._id)) {
        proposalStats[p._id] = p.count;
      }
    });

    const avgRating = reviews.length > 0
      ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
      : 0;

    res.json({
      success: true,
      analytics: {
        totalEarnings: totalEarningsResult[0]?.total || 0,
        monthlyChart,
        proposalStats,
        avgRating,
        recentReviews: reviews,
        completedGigs: profile?.completedGigs || 0,
        reputationScore: profile?.reputationScore || 0,
        skills: profile?.skills || []
      }
    });
  } catch (err) {
    console.error('Analytics error details:', err);
    res.status(500);
    throw new Error(`Analytics failed: ${err.message}`);
  }
});
const switchRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  console.log(`DEBUG: [switchRole] User ID: ${req.user._id}, Requested Role: ${role}`);

  if (!['client', 'freelancer'].includes(role)) {
    res.status(400);
    throw new Error('Invalid role');
  }

  // Use findByIdAndUpdate to bypass pre-save hooks and ensure direct DB update
  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    { role: role },
    { new: true, runValidators: true }
  );

  if (!updatedUser) {
    console.error(`DEBUG: [switchRole] User not found for ID: ${req.user._id}`);
    res.status(404);
    throw new Error('User not found');
  }

  console.log(`DEBUG: [switchRole] SUCCESS! User ${updatedUser.email} is now: ${updatedUser.role}`);

  // If switching to freelancer, ensure a profile exists
  if (role === 'freelancer') {
    const profile = await FreelancerProfile.findOne({ user: updatedUser._id });
    if (!profile) {
      console.log(`DEBUG: [switchRole] Creating new FreelancerProfile for ${updatedUser.email}`);
      await FreelancerProfile.create({ user: updatedUser._id });
    }
  }

  res.json({
    success: true,
    message: `Role switched to ${role}`,
    role: updatedUser.role
  });
});



module.exports = {
  getMyProfile,
  updateMyProfile,
  addPortfolio,
  addExperience,
  addEducation,
  addCertification,
  getFreelancerProfile,
  getAnalytics,
  switchRole
};
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Gig = require('../models/Gig');
const Payment = require('../models/Payment');
const FreelancerProfile = require('../models/FreelancerProfile');
const Review = require('../models/Review');

// GET /api/admin/stats  ← platform analytics
const getStats = asyncHandler(async (req, res) => {
  const [
    totalUsers,
    totalFreelancers,
    totalClients,
    totalGigs,
    openGigs,
    completedGigs,
    totalPayments,
    recentUsers,
    recentGigs,
    categoryStats,
    revenueTrend,
    suspiciousGigs,
    suspiciousReviews
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'freelancer' }),
    User.countDocuments({ role: 'client' }),
    Gig.countDocuments(),
    Gig.countDocuments({ status: 'open' }),
    Gig.countDocuments({ status: 'completed' }),
    Payment.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]),
    User.find().sort({ createdAt: -1 }).limit(5).select('name email role createdAt isActive'),
    Gig.find().sort({ createdAt: -1 }).limit(5)
      .populate('client', 'name')
      .select('title status budgetMax createdAt'),
    Gig.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]),
    Payment.aggregate([
      { $match: { status: 'paid' } },
      {
        $group: {
          _id: { $dateToString: { format: '%m/%Y', date: '$createdAt' } },
          amount: { $sum: '$amount' }
        }
      },
      { $sort: { _id: 1 } },
      { $limit: 6 }
    ]),
    Gig.countDocuments({ isSuspicious: true }),
    Review.countDocuments({ isSuspicious: true })
  ]);

  const platformRevenue = totalPayments[0]?.total || 0;
  const successRate = totalGigs > 0
    ? Math.round((completedGigs / totalGigs) * 100)
    : 0;

  res.json({
    success: true,
    stats: {
      totalUsers,
      totalFreelancers,
      totalClients,
      totalGigs,
      openGigs,
      completedGigs,
      platformRevenue,
      successRate,
      revenueTrend,
      suspiciousGigs,
      suspiciousReviews
    },
    recentUsers,
    recentGigs,
    categoryStats
  });
});

// GET /api/admin/users  ← get all users
const getAllUsers = asyncHandler(async (req, res) => {
  const { role, search, page = 1, limit = 10 } = req.query;

  const filter = {};
  if (role) filter.role = role;
  if (search) filter.name = { $regex: search, $options: 'i' };

  const skip = (page - 1) * limit;
  const total = await User.countDocuments(filter);
  const users = await User.find(filter)
    .select('-password')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  res.json({ success: true, users, total, pages: Math.ceil(total / limit) });
});

// PUT /api/admin/users/:id/suspend  ← suspend/activate user
const toggleSuspend = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Prevent suspending other admins
  if (user.role === 'admin') {
    res.status(403);
    throw new Error('Cannot suspend admin accounts');
  }

  user.isActive = !user.isActive;
  await user.save();

  res.json({
    success: true,
    message: user.isActive ? 'User activated' : 'User suspended',
    user
  });
});

// PUT /api/admin/users/:id/verify  ← verify freelancer
const verifyFreelancer = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user || user.role !== 'freelancer') {
    res.status(404);
    throw new Error('Freelancer not found');
  }

  user.isVerified = true;
  await user.save();

  await FreelancerProfile.findOneAndUpdate(
    { user: req.params.id },
    { isVerified: true }
  );

  res.json({ success: true, message: 'Freelancer verified!', user });
});

// GET /api/admin/gigs  ← get all gigs
const getAllGigs = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;

  const filter = {};
  if (status) filter.status = status;

  const skip = (page - 1) * limit;
  const total = await Gig.countDocuments(filter);
  const gigs = await Gig.find(filter)
    .populate('client', 'name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  res.json({ success: true, gigs, total, pages: Math.ceil(total / limit) });
});

// PUT /api/admin/gigs/:id/status  ← update gig status
const updateGigStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const gig = await Gig.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true }
  );

  if (!gig) {
    res.status(404);
    throw new Error('Gig not found');
  }

  res.json({ success: true, gig });
});

// GET /api/admin/payments  ← all payments
const getAllPayments = asyncHandler(async (req, res) => {
  const payments = await Payment.find()
    .populate('client', 'name email')
    .populate('freelancer', 'name email')
    .populate('gig', 'title')
    .sort({ createdAt: -1 })
    .limit(20);

  res.json({ success: true, payments });
});

// DELETE /api/admin/users/:id  ← delete user
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  if (user.role === 'admin') {
    res.status(403);
    throw new Error('Cannot delete admin accounts');
  }
  await user.deleteOne();
  res.json({ success: true, message: 'User deleted' });
});

module.exports = {
  getStats, getAllUsers, toggleSuspend,
  verifyFreelancer, getAllGigs, updateGigStatus,
  getAllPayments, deleteUser
};
const asyncHandler = require('express-async-handler');
const Review = require('../models/Review');
const FreelancerProfile = require('../models/FreelancerProfile');
const Gig = require('../models/Gig');
const { createNotification } = require('./notificationController');
const { checkReviewFraud } = require('../services/fraudService');

// POST /api/reviews  ← client submits review
const createReview = asyncHandler(async (req, res) => {
  const { gigId, freelancerId, rating, comment, communication, quality, timeliness } = req.body;

  // 1. Check gig exists
  const gig = await Gig.findById(gigId);
  if (!gig) {
    res.status(404);
    throw new Error('Gig not found');
  }

  // 2. Only client who owns the gig can review
  if (gig.client.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Only the client can review this gig');
  }

  // 3. Check already reviewed
  const existing = await Review.findOne({ gig: gigId, reviewer: req.user._id });
  if (existing) {
    res.status(400);
    throw new Error('You already reviewed this gig');
  }

  // 4. Simulated AI Sentiment Analysis
  const posKeywords = ['great', 'excellent', 'amazing', 'good', 'perfect', 'professional'];
  let sentimentScore = rating * 20; // base score from rating
  posKeywords.forEach(word => {
    if (comment.toLowerCase().includes(word)) sentimentScore += 5;
  });
  sentimentScore = Math.min(100, sentimentScore);
  
  // 5. Fraud Detection Check
  const fraudCheck = await checkReviewFraud({ 
    freelancer: freelancerId, 
    reviewer: req.user._id, 
    comment, 
    rating 
  });

  // 5. Create Review
  const review = await Review.create({
    gig: gigId,
    reviewer: req.user._id,
    freelancer: freelancerId,
    rating, 
    comment,
    communication, 
    quality, 
    timeliness,
    isVerified: true,
    sentimentScore,
    isSuspicious: fraudCheck.isSuspicious,
    fraudReason: fraudCheck.reason || ''
  });

  // 6. Update freelancer reputation score
  await updateReputationScore(freelancerId);

  // 7. Send notification (async, don't block response)
  try {
    const io = req.app.get('io');
    const onlineUsers = req.app.get('onlineUsers');
    if (io && onlineUsers) {
      await createNotification(io, onlineUsers, {
        recipientId: freelancerId,
        type: 'review_added',
        title: '⭐ New Review Received!',
        message: `You received a ${rating}-star review!`,
        link: '/dashboard/reviews',
        data: { rating }
      });
    }
  } catch (err) {
    console.error('Notification error in review:', err.message);
  }

  await review.populate('reviewer', 'name avatar');
  res.status(201).json({ success: true, review });
});

// GET /api/reviews/gig/:gigId  ← check if review exists for a gig
const getReviewByGig = asyncHandler(async (req, res) => {
  const review = await Review.findOne({
    gig: req.params.gigId,
    reviewer: req.user._id
  });
  res.json({ success: true, review });
});

// GET /api/reviews/freelancer/:freelancerId  ← get all reviews for a freelancer
const getFreelancerReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({
    freelancer: req.params.freelancerId,
    isFlagged: false
  })
    .populate('reviewer', 'name avatar')
    .populate('gig', 'title')
    .sort({ createdAt: -1 });

  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)
    : 0;

  res.json({ success: true, reviews, stats: { totalReviews, avgRating } });
});

// GET /api/reviews/my  ← freelancer sees reviews about them
const getMyReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ freelancer: req.user._id })
    .populate('reviewer', 'name avatar')
    .populate('gig', 'title')
    .sort({ createdAt: -1 });

  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)
    : 0;

  res.json({ success: true, reviews, stats: { totalReviews, avgRating } });
});

// Helper — recalculate reputation score
const updateReputationScore = async (freelancerId) => {
  const reviews = await Review.find({ freelancer: freelancerId, isFlagged: false });
  if (reviews.length === 0) return;

  const score = reviews.reduce((sum, r) => {
    const weighted =
      (r.rating * 0.5) +
      ((r.communication || r.rating) * 0.2) +
      ((r.quality || r.rating) * 0.2) +
      ((r.timeliness || r.rating) * 0.1);
    return sum + weighted;
  }, 0) / reviews.length;

  await FreelancerProfile.findOneAndUpdate(
    { user: freelancerId },
    { reputationScore: Math.round(score * 10) / 10 }
  );
};

module.exports = { createReview, getFreelancerReviews, getMyReviews, getReviewByGig };
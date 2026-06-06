const Review = require('../models/Review');
const Gig = require('../models/Gig');

/**
 * Scans a new review for suspicious patterns
 */
const checkReviewFraud = async (reviewData) => {
  const { freelancer, reviewer, comment, rating } = reviewData;

  // 1. Duplicate Content Check
  const similarReview = await Review.findOne({
    freelancer,
    comment: { $regex: new RegExp(`^${comment.trim()}$`, 'i') }
  });

  if (similarReview) {
    return { isSuspicious: true, reason: 'Duplicate review content detected' };
  }

  // 2. High Frequency Check (Same reviewer for same freelancer in short time)
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  
  const recentReviews = await Review.countDocuments({
    reviewer,
    freelancer,
    createdAt: { $gt: oneMonthAgo }
  });

  if (recentReviews >= 3) {
    return { isSuspicious: true, reason: 'Highly frequent reviews from same user' };
  }

  // 3. Rating Discordance (High rating but very short/generic comment)
  if (rating === 5 && comment.length < 5) {
     return { isSuspicious: true, reason: 'Discordant rating: 5 stars with no meaningful feedback' };
  }

  return { isSuspicious: false };
};

/**
 * Scans a gig for suspicious patterns
 */
const checkGigFraud = async (gigData) => {
  const { budgetMax, title, description } = gigData;

  // 1. Extreme Budget Check
  if (budgetMax > 500000) { // e.g. 5 Lakhs
    return { isSuspicious: true, reason: 'Unusually high gig budget' };
  }

  // 2. Spam/Phishing keywords
  const suspiciousKeywords = ['whatsapp', 'telegram', 'payment outside', 'advance payment', 'gift card'];
  const text = (title + ' ' + description).toLowerCase();
  
  for (const word of suspiciousKeywords) {
    if (text.includes(word)) {
      return { isSuspicious: true, reason: `Suspicious keyword detected: "${word}"` };
    }
  }

  return { isSuspicious: false };
};

module.exports = {
  checkReviewFraud,
  checkGigFraud
};

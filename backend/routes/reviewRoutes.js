const express = require('express');
const router = express.Router();
const { createReview, getFreelancerReviews, getMyReviews, getReviewByGig } = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.post('/', createReview);
router.get('/my', getMyReviews);
router.get('/gig/:gigId', getReviewByGig);
router.get('/freelancer/:freelancerId', getFreelancerReviews);

module.exports = router;
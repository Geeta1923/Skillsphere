const express = require('express');
const router = express.Router();
const {
  getMatchedFreelancers,
  getRecommendedGigs,
  getTrending,
  getMatchScoreForFreelancer
} = require('../controllers/aiMatchingController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/match/:gigId', getMatchedFreelancers);
router.get('/recommendations', getRecommendedGigs);
router.get('/trending', getTrending);
router.get('/score', getMatchScoreForFreelancer);

module.exports = router;
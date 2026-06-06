const express = require('express');
const router = express.Router();
const {
  getMatchedFreelancers,
  getRecommendedGigs,
  getTrending,
  getMatchScoreForFreelancer,
  generateProposal,
  getSkillGapAnalysis,
  handleInterviewSession,
  getPortfolioAnalysis
} = require('../controllers/aiMatchingController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/match/:gigId', getMatchedFreelancers);
router.get('/recommendations', getRecommendedGigs);
router.get('/trending', getTrending);
router.get('/score', getMatchScoreForFreelancer);
router.post('/generate-proposal', generateProposal);
router.get('/skill-gap', getSkillGapAnalysis);
router.post('/interview', handleInterviewSession);
router.get('/portfolio-architect', getPortfolioAnalysis);

module.exports = router;
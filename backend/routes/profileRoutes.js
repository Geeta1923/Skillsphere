const express = require('express');
const router = express.Router();
const {
  getMyProfile,
  updateMyProfile,
  addPortfolio,
  addExperience,
  addEducation,
  addCertification,
  getFreelancerProfile,
  getAnalytics,
  switchRole
} = require('../controllers/profileController');


const { protect, authorize } = require('../middleware/authMiddleware');





// All routes below require login
router.use(protect);


router.get('/me', getMyProfile);
router.put('/me', updateMyProfile);
router.post('/portfolio', addPortfolio);
router.post('/experience', addExperience);
router.post('/education', addEducation);
router.post('/certifications', addCertification);
router.get('/analytics', getAnalytics);
router.patch('/switch-role', switchRole);
// Public — view any freelancer profile

router.get('/:userId', getFreelancerProfile);



module.exports = router;
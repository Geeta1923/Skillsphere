const express = require('express');
const router = express.Router();
const {
  getMentors,
  getMentorById,
  toggleMentorStatus,
  createMentorshipOrder,
  verifyMentorshipPayment,
  completeMentorship,
  getMySessions
} = require('../controllers/mentorshipController');
const { protect } = require('../middleware/authMiddleware');

router.get('/mentors', getMentors);
router.get('/mentor/:id', getMentorById);

router.use(protect);
router.post('/toggle', toggleMentorStatus);
router.post('/create-order', createMentorshipOrder);
router.post('/verify', verifyMentorshipPayment);
router.post('/complete/:id', completeMentorship);
router.get('/my-sessions', getMySessions);

module.exports = router;

const express = require('express');
const router = express.Router();
const {
  createDispute, getMyDisputes, getDisputeById,
  addMessage, getAllDisputes, resolveDispute
} = require('../controllers/disputeController');
const { protect, authorize } = require('../middleware/authMiddleware');

const { uploadDisputeEvidence } = require('../config/cloudinary');

router.use(protect);

router.post('/', uploadDisputeEvidence.array('evidence', 5), createDispute);
router.get('/my', getMyDisputes);
router.get('/', authorize('admin'), getAllDisputes);
router.get('/:id', getDisputeById);
router.post('/:id/message', addMessage);
router.put('/:id/resolve', authorize('admin'), resolveDispute);

module.exports = router;
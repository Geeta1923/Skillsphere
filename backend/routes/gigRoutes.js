const express = require('express');
const router = express.Router();

const {
  createGig, getGigs, getGigById, getProgress, updateProgress,
  updateGig, deleteGig, getMyGigs, getHiredGigs
} = require('../controllers/gigController');
const { protect, authorize } = require('../middleware/authMiddleware');

//  Specific routes BEFORE generic /:id route
router.get('/my/gigs', protect, getMyGigs);
router.get('/hired', protect, getHiredGigs);
router.get('/:id/progress', protect, getProgress);     // ← before /:id
router.post('/:id/progress', protect, updateProgress); // ← before /:id
router.get('/', getGigs);
router.get('/:id', getGigById);  // ← generic last
router.post('/', protect, authorize('client', 'admin'), createGig);
router.put('/:id', protect, updateGig);
router.delete('/:id', protect, deleteGig);

module.exports = router;

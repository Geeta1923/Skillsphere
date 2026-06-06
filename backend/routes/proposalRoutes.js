const express = require('express');
const router = express.Router();
const {
  submitProposal, getMyProposals,
  getGigProposals, updateProposalStatus,
  withdrawProposal
} = require('../controllers/proposalController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect); // All proposal routes require login

router.post('/:gigId', authorize('freelancer'), submitProposal);
router.get('/my', getMyProposals);
router.get('/gig/:gigId', getGigProposals);
router.put('/:id/status', updateProposalStatus);
router.delete('/:id', authorize('freelancer'), withdrawProposal);

module.exports = router;
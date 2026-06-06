const express = require('express');
const router = express.Router();
const {
  getStats, getAllUsers, toggleSuspend,
  verifyFreelancer, getAllGigs, updateGigStatus,
  getAllPayments, deleteUser
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All admin routes require login + admin role
router.use(protect);
router.use(authorize('admin'));

router.get('/stats', getStats);
router.get('/users', getAllUsers);
router.put('/users/:id/suspend', toggleSuspend);
router.put('/users/:id/verify', verifyFreelancer);
router.delete('/users/:id', deleteUser);
router.get('/gigs', getAllGigs);
router.put('/gigs/:id/status', updateGigStatus);
router.get('/payments', getAllPayments);

module.exports = router;
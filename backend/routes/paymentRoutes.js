const express = require('express');
const router = express.Router();
const {
  createOrder,
  verifyPayment,
  getMyPayments,
  getMyEarnings,
  releaseFunds
} = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.post('/create-order', createOrder);
router.post('/verify', verifyPayment);
router.post('/release/:paymentId', releaseFunds);
router.get('/my', getMyPayments);
router.get('/earnings', getMyEarnings);

module.exports = router;
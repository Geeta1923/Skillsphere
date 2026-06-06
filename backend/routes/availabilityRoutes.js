const express = require('express');
const router = express.Router();
const {
  getAvailability, addSlot, removeSlot,
  bookSlot, getMySlots
} = require('../controllers/availabilityController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/my', getMySlots);
router.post('/slots', addSlot);
router.delete('/slots/:slotId', removeSlot);
router.post('/book/:slotId', bookSlot);
router.get('/:freelancerId', getAvailability);

module.exports = router;
const asyncHandler = require('express-async-handler');
const FreelancerProfile = require('../models/FreelancerProfile');

// GET /api/availability/:freelancerId  ← get freelancer's slots
const getAvailability = asyncHandler(async (req, res) => {
  const profile = await FreelancerProfile.findOne({
    user: req.params.freelancerId
  }).populate('availabilitySlots.bookedBy', 'name email');

  if (!profile) {
    res.status(404);
    throw new Error('Profile not found');
  }

  // Only return future slots
  const now = new Date();
  const futureSlots = (profile.availabilitySlots || []).filter(
    slot => new Date(slot.date) >= now
  );

  res.json({ success: true, slots: futureSlots });
});

// POST /api/availability/slots  ← freelancer adds slot
const addSlot = asyncHandler(async (req, res) => {
  const { date, startTime, endTime } = req.body;

  if (!date || !startTime || !endTime) {
    res.status(400);
    throw new Error('Date, start time and end time are required');
  }

  let profile = await FreelancerProfile.findOne({ user: req.user._id });
  if (!profile) {
    profile = await FreelancerProfile.create({ user: req.user._id });
  }

  // Ensure array exists
  if (!profile.availabilitySlots) profile.availabilitySlots = [];

  // Check for duplicate slot
  const exists = profile.availabilitySlots.some(
    s => new Date(s.date).toDateString() === new Date(date).toDateString() &&
      s.startTime === startTime
  );

  if (exists) {
    res.status(400);
    throw new Error('Slot already exists for this time');
  }

  profile.availabilitySlots.push({ date, startTime, endTime });
  await profile.save();

  res.json({ success: true, slots: profile.availabilitySlots });
});

// DELETE /api/availability/slots/:slotId  ← freelancer removes slot
const removeSlot = asyncHandler(async (req, res) => {
  const profile = await FreelancerProfile.findOne({ user: req.user._id });
  if (!profile) {
    res.status(404);
    throw new Error('Profile not found');
  }

  profile.availabilitySlots = (profile.availabilitySlots || []).filter(
    s => s._id.toString() !== req.params.slotId
  );

  await profile.save();
  res.json({ success: true, message: 'Slot removed' });
});

// POST /api/availability/book/:slotId  ← client books a slot
const bookSlot = asyncHandler(async (req, res) => {
  const { freelancerId } = req.body;

  const profile = await FreelancerProfile.findOne({ user: freelancerId });
  if (!profile) {
    res.status(404);
    throw new Error('Freelancer not found');
  }

  if (!profile.availabilitySlots) {
    res.status(404);
    throw new Error('No slots found for this freelancer');
  }

  const slot = profile.availabilitySlots.id(req.params.slotId);
  if (!slot) {
    res.status(404);
    throw new Error('Slot not found');
  }

  if (slot.isBooked) {
    res.status(400);
    throw new Error('Slot already booked');
  }

  slot.isBooked = true;
  slot.bookedBy = req.user._id;
  await profile.save();

  res.json({ success: true, message: 'Slot booked successfully!', slot });
});

// GET /api/availability/my  ← freelancer sees their slots
const getMySlots = asyncHandler(async (req, res) => {
  const profile = await FreelancerProfile.findOne({ user: req.user._id })
    .populate('availabilitySlots.bookedBy', 'name email avatar');

  if (!profile) {
    return res.json({ success: true, slots: [] });
  }

  res.json({ success: true, slots: profile.availabilitySlots });
});

module.exports = {
  getAvailability, addSlot, removeSlot,
  bookSlot, getMySlots
};
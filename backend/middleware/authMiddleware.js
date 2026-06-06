const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');

const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Get token from cookie
  token = req.cookies.jwt;

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token');
  }

  try {
    // Verify the token using our secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from DB and attach to request object
    // .select('-password') means: get everything EXCEPT password
    req.user = await User.findById(decoded.userId).select('-password');

    next(); // Move to the next middleware/controller
  } catch (error) {
    res.status(401);
    throw new Error('Not authorized, token failed');
  }
});

// ===== ROLE-BASED ACCESS =====
const authorize = (...roles) => {
  return (req, res, next) => {
    console.log(`DEBUG: Authorizing access for role: ${req.user.role}. Allowed roles: ${roles.join(', ')}`);
    if (!roles.includes(req.user.role)) {
      res.status(403);
      throw new Error(`Role '${req.user.role}' is not allowed to access this`);
    }
    next();
  };
};


module.exports = { protect, authorize };
const express = require('express');
const router = express.Router();

const { 
  registerUser, 
  loginUser, 
  logoutUser, 
  getMe, 
  verifyEmail,
  forgotPassword,
  resetPassword,
  resendVerification
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.get('/me', protect, getMe);  // protect means: must be logged in
router.get('/verify-email', verifyEmail);
// authRoutes.js
router.post('/resend-verification', resendVerification);
router.post('/forgot-password', forgotPassword);     
router.post('/reset-password', resetPassword);         

// 2FA Routes
const { setup2FA, verifyAndEnable2FA, login2FA, disable2FA } = require('../controllers/authController');
router.post('/2fa/setup', protect, setup2FA);
router.post('/2fa/verify', protect, verifyAndEnable2FA);
router.post('/2fa/login', login2FA);
router.post('/2fa/disable', protect, disable2FA);


module.exports = router;

const passport = require('../config/passport');

// ===== GOOGLE OAUTH ROUTES =====

// Step 1: Redirect user to Google
router.get('/google',
  passport.authenticate('google', {
    scope: ['profile', 'email']
  })
);

// Step 2: Google redirects back here after login
router.get('/google/callback',
  passport.authenticate('google', {
    session: false,  // We use JWT, not sessions
    failureRedirect: `${process.env.CLIENT_URL}/login?error=oauth_failed`
  }),
  async (req, res) => {
    try {
      // Generate JWT for the user
      const generateToken = require('../config/generateToken');
      generateToken(res, req.user._id);

      // Redirect to frontend dashboard
      res.redirect(`${process.env.CLIENT_URL}/dashboard`);
    } catch (error) {
      res.redirect(`${process.env.CLIENT_URL}/login?error=oauth_failed`);
    }
  }
);
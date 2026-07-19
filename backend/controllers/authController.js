const crypto = require('crypto');
const asyncHandler = require('express-async-handler');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const User = require('../models/User');
const generateToken = require('../config/generateToken');
const {
  sendVerificationEmail,
  sendPasswordResetEmail
} = require('../services/emailService');


// ===== REGISTER =====
// POST /api/auth/register

// ===== UPDATE REGISTER — Send verification email =====



const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Please fill all fields' });
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    return res.status(400).json({ success: false, message: 'User already exists' });
  }

  // Generate token BEFORE creating user
  const verificationToken = crypto.randomBytes(32).toString('hex');
  const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

  console.log('Creating user with token:', verificationToken) // debug

  const user = await User.create({
    name,
    email,
    password,
    role: role || 'client',
    emailVerificationToken: verificationToken,
    emailVerificationExpires: verificationExpires,
    isVerified: false
  });

  console.log('User created, token in DB:', user.emailVerificationToken) // debug

  if (user) {
    generateToken(res, user._id);

    // Send verification email
    try {
      await sendVerificationEmail(email, name, verificationToken);
      console.log('Verification email sent to:', email)
    } catch (emailError) {
      console.error('Email send error:', emailError.message);
    }

    return res.status(201).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified
      },
      message: 'Check your email to verify your account!'
    });
  }

  return res.status(400).json({ success: false, message: 'Invalid user data' });
});

// ===== VERIFY EMAIL =====
const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.query;

  if (!token) {
    res.status(400);
    throw new Error('No token provided');
  }

  // First check if already verified with this token
  const alreadyVerified = await User.findOne({
    emailVerificationToken: null,
    isVerified: true
  });

  // Find user with token
  const user = await User.findOne({
    emailVerificationToken: token
  });

  if (!user) {
    // Check if this user was already verified
    // (token already cleared = already verified successfully)
    return res.json({
      success: true,
      message: 'Email already verified!'
    });
  }

  // Verify the user
  user.isVerified = true;
  user.emailVerificationToken = null;
  user.emailVerificationExpires = null;
  await user.save();

  res.json({ success: true, message: 'Email verified!' });
});
// ===== FORGOT PASSWORD =====
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  console.log('Forgot password request for:', email)

  const user = await User.findOne({ email });
  console.log('User found:', user?.name)

  if (!user) {
    return res.json({
      success: true,
      message: 'If this email exists, a reset link has been sent.'
    });
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  user.passwordResetToken = resetToken;
  user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
  await user.save();

  console.log('Reset token saved:', resetToken)

  try {
    await sendPasswordResetEmail(email, user.name, resetToken);
    console.log('Reset email sent successfully!')
  } catch (emailError) {
    console.error('Email error details:', emailError)
    res.status(500);
    throw new Error('Failed to send reset email')
  }

  res.json({
    success: true,
    message: 'Password reset link sent to your email!'
  });
});

// ===== RESET PASSWORD =====
const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  const user = await User.findOne({
    passwordResetToken: token,
    passwordResetExpires: { $gt: Date.now() }
  });

  if (!user) {
    res.status(400);
    throw new Error('Invalid or expired reset token');
  }

  user.password = password;
  user.passwordResetToken = null;
  user.passwordResetExpires = null;
  await user.save();

  res.json({ success: true, message: 'Password reset successful! Please login.' });
});

// ===== LOGIN =====
// POST /api/auth/login
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // 1. Find user by email
  const user = await User.findOne({ email });

  // 2. Check user exists AND password matches
  if (user && (await user.matchPassword(password))) {
    
    // Check if 2FA is enabled
    if (user.isTwoFactorEnabled) {
      return res.json({
        success: true,
        require2FA: true,
        userId: user._id,
        message: 'Two-Factor Authentication required'
      });
    }

    generateToken(res, user._id);

    res.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified
      }
    });
  } else {
    res.status(401);
    throw new Error('Invalid email or password');
  }
});

// ===== EMAIL OTP REQUEST =====
const requestEmailOTP = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  user.emailOTPEnabled = true;
  user.emailOTPCode = otp;
  user.emailOTPExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  await user.save();
  await sendEmailOTP(email, user.name, otp);
  res.json({ success: true, message: 'OTP sent to email' });
});

// ===== EMAIL OTP VERIFY =====
const verifyEmailOTP = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  const user = await User.findOne({ email });
  if (!user || !user.emailOTPEnabled) {
    return res.status(400).json({ success: false, message: 'OTP not requested' });
  }
  if (user.emailOTPExpires < new Date()) {
    return res.status(400).json({ success: false, message: 'OTP expired' });
  }
  if (user.emailOTPCode !== otp) {
    return res.status(400).json({ success: false, message: 'Invalid OTP' });
  }
  // OTP valid – clear fields and log in
  user.emailOTPEnabled = false;
  user.emailOTPCode = null;
  user.emailOTPExpires = null;
  await user.save();
  generateToken(res, user._id);
  res.json({
    success: true,
    message: 'Logged in via email OTP',
    user: { _id: user._id, name: user.name, email: user.email, role: user.role, isVerified: user.isVerified }
  });
});

// ===== LOGOUT =====
// POST /api/auth/logout
const logoutUser = asyncHandler(async (req, res) => {
  // Clear the cookie by setting it to empty with immediate expiry
  res.cookie('jwt', '', {
    httpOnly: true,
    expires: new Date(0)
  });

  res.json({ success: true, message: 'Logged out successfully' });
});

// ===== GET CURRENT USER =====
// GET /api/auth/me  (protected route — only logged in users)
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');
  res.json({ success: true, user });
});


const resendVerification = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return res.json({ success: true, message: 'If email exists, verification sent.' });
  }

  if (user.isVerified) {
    return res.json({ success: true, message: 'Email already verified!' });
  }

  // Generate new token
  const verificationToken = crypto.randomBytes(32).toString('hex');
  user.emailVerificationToken = verificationToken;
  user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await user.save();

  try {
    await sendVerificationEmail(email, user.name, verificationToken);
    console.log('Resent verification to:', email)
  } catch (err) {
    console.error('Email error:', err.message)
  }

  res.json({ success: true, message: 'Verification email resent!' });
});


// ===== 2FA SETUP =====
const setup2FA = asyncHandler(async (req, res) => {
  const secret = speakeasy.generateSecret({
    name: `SkillSphere:${req.user.email}`
  });

  const user = await User.findById(req.user._id);
  user.twoFactorTempSecret = secret.base32;
  await user.save();

  const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);
  res.json({ success: true, qrCodeUrl, secret: secret.base32 });
});

// ===== 2FA VERIFY & ENABLE =====
const verifyAndEnable2FA = asyncHandler(async (req, res) => {
  const { token } = req.body;
  const user = await User.findById(req.user._id);

  if (!user.twoFactorTempSecret) {
    res.status(400);
    throw new Error('2FA setup not initiated');
  }

  const verified = speakeasy.totp.verify({
    secret: user.twoFactorTempSecret,
    encoding: 'base32',
    token
  });

  if (!verified) {
    res.status(400);
    throw new Error('Invalid verification code');
  }

  user.twoFactorSecret = user.twoFactorTempSecret;
  user.twoFactorTempSecret = null;
  user.isTwoFactorEnabled = true;
  await user.save();

  res.json({ success: true, message: '2FA enabled successfully!' });
});

// ===== 2FA LOGIN VERIFY =====
const login2FA = asyncHandler(async (req, res) => {
  const { userId, token } = req.body;
  const user = await User.findById(userId);

  if (!user || !user.isTwoFactorEnabled) {
    res.status(400);
    throw new Error('2FA not enabled for this user');
  }

  const verified = speakeasy.totp.verify({
    secret: user.twoFactorSecret,
    encoding: 'base32',
    token
  });

  if (!verified) {
    res.status(400);
    throw new Error('Invalid 2FA code');
  }

  generateToken(res, user._id);
  res.json({
    success: true,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified
    }
  });
});

// ===== DISABLE 2FA =====
const disable2FA = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  user.isTwoFactorEnabled = false;
  user.twoFactorSecret = null;
  await user.save();

  res.json({ success: true, message: '2FA disabled' });
});

// authController.js exports
module.exports = {
  registerUser, loginUser, logoutUser, getMe,
  verifyEmail, forgotPassword, resetPassword,
  resendVerification,
  setup2FA, verifyAndEnable2FA, login2FA, disable2FA, requestEmailOTP, verifyEmailOTP
};


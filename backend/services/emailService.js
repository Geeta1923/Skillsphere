const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

// Base email template
const baseTemplate = (content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; background: #0f0f1a; color: #ffffff; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .logo { text-align: center; font-size: 28px; font-weight: bold; color: #6c63ff; margin-bottom: 32px; }
    .card { background: #1a1a2e; border: 1px solid #2d3748; border-radius: 16px; padding: 32px; }
    .title { font-size: 24px; font-weight: bold; margin-bottom: 16px; }
    .text { color: #a0aec0; font-size: 15px; line-height: 1.7; margin-bottom: 24px; }
    .btn { display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #6c63ff, #00d4ff); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 15px; }
    .footer { text-align: center; margin-top: 32px; color: #4a5568; font-size: 13px; }
    .divider { border: none; border-top: 1px solid #2d3748; margin: 24px 0; }
    .highlight { color: #6c63ff; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">⚡ SkillSphere</div>
    <div class="card">
      ${content}
    </div>
    <div class="footer">
      <p>© 2026 SkillSphere — Intelligent Hyperlocal Freelance Ecosystem</p>
      <p>If you didn't request this email, you can safely ignore it.</p>
    </div>
  </div>
</body>
</html>
`;

// ===== SEND VERIFICATION EMAIL =====
const sendVerificationEmail = async (email, name, token) => {
  const verifyUrl = `${process.env.CLIENT_URL}/verify-email?token=${encodeURIComponent(token)}`;

  const content = `
    <div class="title">Verify Your Email 📧</div>
    <p class="text">Hi <span class="highlight">${name}</span>! Welcome to SkillSphere.</p>
    <p class="text">Please verify your email address to activate your account and start using all features.</p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${verifyUrl}" class="btn">✅ Verify Email Address</a>
    </div>
    <hr class="divider">
    <p class="text" style="font-size: 13px;">
      Or copy this link: <br>
      <span style="color: #6c63ff; word-break: break-all;">${verifyUrl}</span>
    </p>
    <p class="text" style="font-size: 13px;">This link expires in <strong>24 hours</strong>.</p>
  `;

  const transporter = createTransporter();
  await transporter.sendMail({
    from: `"SkillSphere" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '✅ Verify your SkillSphere account',
    html: baseTemplate(content)
  });
};

// ===== SEND PASSWORD RESET EMAIL =====
const sendPasswordResetEmail = async (email, name, token) => {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${encodeURIComponent(token)}`;

  const content = `
    <div class="title">Reset Your Password 🔑</div>
    <p class="text">Hi <span class="highlight">${name}</span>!</p>
    <p class="text">We received a request to reset your password. Click the button below to create a new password.</p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${resetUrl}" class="btn">🔑 Reset Password</a>
    </div>
    <hr class="divider">
    <p class="text" style="font-size: 13px;">
      Or copy this link:<br>
      <span style="color: #6c63ff; word-break: break-all;">${resetUrl}</span>
    </p>
    <p class="text" style="font-size: 13px;">This link expires in <strong>1 hour</strong>.</p>
    <p class="text" style="font-size: 13px; color: #fc8181;">
      If you didn't request a password reset, please ignore this email.
    </p>
  `;

  const transporter = createTransporter();
  await transporter.sendMail({
    from: `"SkillSphere" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '🔑 Reset your SkillSphere password',
    html: baseTemplate(content)
  });
};

// ===== SEND PROPOSAL NOTIFICATION EMAIL =====
const sendProposalNotificationEmail = async (email, name, gigTitle) => {
  const content = `
    <div class="title">New Proposal Received! 📋</div>
    <p class="text">Hi <span class="highlight">${name}</span>!</p>
    <p class="text">You received a new proposal for your gig:</p>
    <div style="background: rgba(108,99,255,0.1); border: 1px solid rgba(108,99,255,0.3); border-radius: 8px; padding: 16px; margin: 16px 0;">
      <p style="color: #6c63ff; font-weight: bold; margin: 0;">📋 ${gigTitle}</p>
    </div>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${process.env.CLIENT_URL}/dashboard" class="btn">View Proposal</a>
    </div>
  `;

  const transporter = createTransporter();
  await transporter.sendMail({
    from: `"SkillSphere" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '📋 New proposal for your gig — SkillSphere',
    html: baseTemplate(content)
  });
};

// ===== SEND PAYMENT CONFIRMATION EMAIL =====
const sendPaymentConfirmationEmail = async (email, name, amount, gigTitle) => {
  const content = `
    <div class="title">Payment Received! 💰</div>
    <p class="text">Hi <span class="highlight">${name}</span>!</p>
    <p class="text">Great news! You received a payment:</p>
    <div style="background: rgba(72,187,120,0.1); border: 1px solid rgba(72,187,120,0.3); border-radius: 8px; padding: 20px; margin: 16px 0; text-align: center;">
      <p style="color: #48bb78; font-size: 32px; font-weight: bold; margin: 0;">₹${amount.toLocaleString()}</p>
      <p style="color: #a0aec0; margin: 8px 0 0 0; font-size: 14px;">for: ${gigTitle}</p>
    </div>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${process.env.CLIENT_URL}/dashboard/earnings" class="btn">View Earnings</a>
    </div>
  `;

  const transporter = createTransporter();
  await transporter.sendMail({
    from: `"SkillSphere" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '💰 Payment received — SkillSphere',
    html: baseTemplate(content)
  });
};

// ===== SEND PROPOSAL ACCEPTED EMAIL =====
const sendProposalAcceptedEmail = async (email, name, gigTitle) => {
  const content = `
    <div class="title">🎉 Proposal Accepted!</div>
    <p class="text">Hi <span class="highlight">${name}</span>!</p>
    <p class="text">Congratulations! Your proposal has been accepted for:</p>
    <div style="background: rgba(72,187,120,0.1); border: 1px solid rgba(72,187,120,0.3); border-radius: 8px; padding: 16px; margin: 16px 0;">
      <p style="color: #48bb78; font-weight: bold; margin: 0;">✅ ${gigTitle}</p>
    </div>
    <p class="text">Login to your dashboard to get started and chat with your client!</p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${process.env.CLIENT_URL}/dashboard" class="btn">🚀 Go to Dashboard</a>
    </div>
  `;

  const transporter = createTransporter();
  await transporter.sendMail({
    from: `"SkillSphere" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '🎉 Your proposal was accepted — SkillSphere',
    html: baseTemplate(content)
  });
};
  // ===== SEND EMAIL OTP =====
  const sendEmailOTP = async (email, name, otp) => {
    const content = `
      <div class="title">Your Login OTP 🔐</div>
      <p class="text">Hi <span class="highlight">${name}</span>! Use the following one‑time code to complete your login. It expires in <strong>10 minutes</strong>.</p>
      <div style="text-align:center; margin:32px 0;">
        <span style="font-size:28px; font-weight:bold; letter-spacing:4px; color:#6c63ff;">${otp}</span>
      </div>
      <hr class="divider"/>
      <p class="text" style="font-size:13px;">If you didn't request this, you can safely ignore this email.</p>
    `;

    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"SkillSphere" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '🔐 Your SkillSphere login code',
      html: baseTemplate(content)
    });
  };

  module.exports = {
    sendVerificationEmail,
    sendPasswordResetEmail,
    sendProposalNotificationEmail,
    sendPaymentConfirmationEmail,
    sendProposalAcceptedEmail,
    sendEmailOTP
  };
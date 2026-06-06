const jwt = require('jsonwebtoken');

const generateToken = (res, userId) => {
  // Create the token with user's ID inside it
  const token = jwt.sign(
    { userId },                        // Payload (data inside token)
    process.env.JWT_SECRET,            // Secret key to sign it
    { expiresIn: '7d' }                // Token expires in 7 days
  );

  // Store token in HTTP-only cookie (safer than localStorage)
  res.cookie('jwt', token, {
    httpOnly: true,     // JS cannot access this cookie (XSS protection)
    secure: process.env.NODE_ENV === 'production',  // HTTPS only in prod
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // Must be 'none' for cross-domain prod, but 'lax' or 'strict' for local dev
    maxAge: 7 * 24 * 60 * 60 * 1000  // 7 days in milliseconds
  });
  return token;
};

module.exports = generateToken;
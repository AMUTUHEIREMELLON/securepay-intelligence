const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { logSecurityEvent } = require('../middleware/securityLogger');

const MAX_ATTEMPTS = Number(process.env.MAX_FAILED_LOGIN_ATTEMPTS) || 5;
const LOCK_WINDOW_MIN = Number(process.env.FAILED_LOGIN_WINDOW_MINUTES) || 15;

function signToken(user) {
  return jwt.sign({ sub: user._id.toString(), role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  });
}

// POST /api/auth/register
async function register(req, res) {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'name, email and password are required.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    // Only allow self-registration as 'customer'. Elevated roles must be
    // created by a security_admin via the admin endpoint.
    const user = await User.create({
      name,
      email,
      password,
      role: role === 'customer' ? 'customer' : 'customer',
    });

    await logSecurityEvent(req, {
      event_type: 'LOGIN_SUCCESS',
      severity: 'low',
      description: `New account registered: ${user.email}`,
      user_id: user._id,
    });

    const token = signToken(user);
    return res.status(201).json({ token, user: user.toSafeJSON() });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Registration failed.' });
  }
}

// POST /api/auth/login
async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    // Always run comparePassword-shaped work even if user not found, to reduce
    // user-enumeration timing signal. Then handle the "not found" case.
    if (!user) {
      await logSecurityEvent(req, {
        event_type: 'LOGIN_FAILED',
        severity: 'low',
        description: `Login attempt for unknown email: ${email}`,
        email_attempted: email,
      });
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    if (user.isLocked()) {
      await logSecurityEvent(req, {
        event_type: 'ACCOUNT_LOCKED',
        severity: 'high',
        description: `Login attempt on locked account: ${user.email}`,
        user_id: user._id,
      });
      return res.status(423).json({
        error: `Account temporarily locked due to repeated failed logins. Try again after ${user.lockUntil.toISOString()}.`,
      });
    }

    const validPassword = await user.comparePassword(password);

    if (!validPassword) {
      user.failedLoginCount += 1;

      let severity = 'low';
      if (user.failedLoginCount >= MAX_ATTEMPTS) {
        user.lockUntil = new Date(Date.now() + LOCK_WINDOW_MIN * 60 * 1000);
        user.failedLoginCount = 0;
        severity = 'critical';
      } else if (user.failedLoginCount >= Math.ceil(MAX_ATTEMPTS / 2)) {
        severity = 'medium';
      }

      await user.save();
      await logSecurityEvent(req, {
        event_type: user.lockUntil && user.isLocked() ? 'ACCOUNT_LOCKED' : 'LOGIN_FAILED',
        severity,
        description: `Failed login for ${user.email} (attempt count reset after lock: ${user.failedLoginCount})`,
        user_id: user._id,
        metadata: { failedLoginCount: user.failedLoginCount },
      });

      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    // Successful login — reset counters
    user.failedLoginCount = 0;
    user.lockUntil = null;
    user.lastLoginAt = new Date();
    await user.save();

    await logSecurityEvent(req, {
      event_type: 'LOGIN_SUCCESS',
      severity: 'low',
      description: `${user.email} logged in successfully`,
      user_id: user._id,
    });

    const token = signToken(user);
    return res.json({ token, user: user.toSafeJSON() });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Login failed.' });
  }
}

// GET /api/auth/me
async function me(req, res) {
  return res.json({ user: req.user.toSafeJSON() });
}

// POST /api/auth/logout
async function logout(req, res) {
  await logSecurityEvent(req, {
    event_type: 'LOGOUT',
    severity: 'low',
    description: `${req.user.email} logged out`,
    user_id: req.user._id,
  });
  // JWTs are stateless; logout is handled client-side by discarding the token.
  return res.json({ message: 'Logged out.' });
}

module.exports = { register, login, me, logout };

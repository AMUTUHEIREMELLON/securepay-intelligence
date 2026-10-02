const SecurityEvent = require('../models/SecurityEvent');

/**
 * Central helper for writing to the security audit trail.
 * Every sensitive action in the platform should call this instead of
 * writing to SecurityEvent directly, so the shape stays consistent.
 */
async function logSecurityEvent(req, { event_type, severity = 'low', description = '', user_id = null, email_attempted = null, metadata = {} }) {
  try {
    await SecurityEvent.create({
      user_id,
      email_attempted,
      event_type,
      severity,
      description,
      metadata,
      ip_address: req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress,
      user_agent: req.headers['user-agent'],
    });
  } catch (err) {
    // Security logging must never crash the request — log to console as a fallback.
    console.error('[SecurityLogger] Failed to write security event:', err.message);
  }
}

/**
 * Express middleware: logs every request to sensitive data endpoints.
 * This is the Guardium-style "who accessed what, when" concept from the
 * project doc — attach it to any route that reads transaction/customer data.
 */
function auditSensitiveAccess(resourceLabel) {
  return async (req, res, next) => {
    await logSecurityEvent(req, {
      event_type: 'SENSITIVE_DATA_ACCESS',
      severity: 'low',
      description: `${req.user ? req.user.email : 'Unknown user'} accessed ${resourceLabel}`,
      user_id: req.user ? req.user._id : null,
      metadata: { path: req.originalUrl, method: req.method },
    });
    next();
  };
}

module.exports = { logSecurityEvent, auditSensitiveAccess };

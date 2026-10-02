const { logSecurityEvent } = require('./securityLogger');

/**
 * Role-based access control.
 * Usage: router.get('/admin-only', requireAuth, requireRole('admin', 'security_admin'), handler)
 */
function requireRole(...allowedRoles) {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      await logSecurityEvent(req, {
        event_type: 'UNAUTHORIZED_ACCESS',
        severity: 'medium',
        description: `User ${req.user.email} (role: ${req.user.role}) attempted to access a route restricted to [${allowedRoles.join(', ')}]`,
        user_id: req.user._id,
      });
      return res.status(403).json({ error: 'You do not have permission to perform this action.' });
    }

    next();
  };
}

module.exports = { requireRole };

const express = require('express');
const {
  listSecurityEvents,
  listFraudAlerts,
  updateFraudAlert,
  securityDashboard,
} = require('../controllers/securityController');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

const router = express.Router();

router.use(requireAuth, requireRole('security_admin', 'admin'));

router.get('/dashboard', securityDashboard);
router.get('/events', listSecurityEvents);
router.get('/alerts', listFraudAlerts);
router.patch('/alerts/:id', updateFraudAlert);

module.exports = router;

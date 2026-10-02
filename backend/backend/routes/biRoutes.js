const express = require('express');
const { getKpis, paymentMethodBreakdown, customerSegments } = require('../controllers/biController');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

const router = express.Router();

router.use(requireAuth, requireRole('admin', 'business_manager', 'security_admin'));

router.get('/kpis', getKpis);
router.get('/payment-methods', paymentMethodBreakdown);
router.get('/customers/segments', customerSegments);

module.exports = router;

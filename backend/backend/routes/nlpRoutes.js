const express = require('express');
const { ask } = require('../controllers/nlpController');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

const router = express.Router();

router.post('/ask', requireAuth, requireRole('admin', 'business_manager', 'security_admin'), ask);

module.exports = router;

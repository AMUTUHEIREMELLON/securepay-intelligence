const express = require('express');
const { createTransaction, listTransactions, getTransaction } = require('../controllers/transactionController');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const { auditSensitiveAccess } = require('../middleware/securityLogger');

const router = express.Router();

router.post('/', requireAuth, createTransaction);
router.get(
  '/',
  requireAuth,
  requireRole('admin', 'business_manager', 'security_admin'),
  auditSensitiveAccess('transaction list'),
  listTransactions
);
router.get(
  '/:id',
  requireAuth,
  requireRole('admin', 'business_manager', 'security_admin'),
  auditSensitiveAccess('single transaction record'),
  getTransaction
);

module.exports = router;

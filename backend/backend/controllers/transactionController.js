const Transaction = require('../models/Transaction');
const FraudAlert = require('../models/FraudAlert');
const { computeRiskScore } = require('../utils/mlFraudDetection');
const { logSecurityEvent } = require('../middleware/securityLogger');

// POST /api/transactions  (simulated payment creation)
async function createTransaction(req, res) {
  try {
    const {
  customer_id,
  amount,
  payment_method,
  location,
  device,
  failed_attempts = 0
} = req.body;
    if (!customer_id || !amount || !payment_method) {
      return res.status(400).json({ error: 'customer_id, amount and payment_method are required.' });
    }

    const transaction_id = `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const hour_of_day = new Date().getHours();

    const {
  score,
  severity,
  reasons,
  is_fraud
} = await computeRiskScore({
  amount,
  hour_of_day,
  failed_attempts,
  payment_method,
  location,
  device
});

    const tx = await Transaction.create({
      transaction_id,
      customer_id,
      amount,
      payment_method,
      location,
      device,
      hour_of_day,
      failed_attempts,
      risk_score: score,
      is_fraud,
      status: failed_attempts >= 3
  ? 'Failed'
  : is_fraud
    ? 'Suspicious'
    : 'Successful',
      timestamp: new Date(),
    });

    if (is_fraud || score >= 50 || failed_attempts >= 3) {
      await FraudAlert.create({
        transaction_id: tx.transaction_id,
        risk_score: score,
        reason: reasons,
        severity,
      });

      await logSecurityEvent(req, {
        event_type: 'SUSPICIOUS_TRANSACTION',
        severity,
        description: `Transaction ${tx.transaction_id} flagged with risk score ${score}`,
        user_id: req.user ? req.user._id : null,
        metadata: { transaction_id: tx.transaction_id, reasons },
      });
    }

    return res.status(201).json({ transaction: tx, risk: { score, severity, reasons } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to create transaction.' });
  }
}

// GET /api/transactions?page=&limit=&status=&is_fraud=
async function listTransactions(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.is_fraud !== undefined) filter.is_fraud = req.query.is_fraud === 'true';
    if (req.query.customer_id) filter.customer_id = req.query.customer_id;

    const [items, total] = await Promise.all([
      Transaction.find(filter)
        .sort({ timestamp: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Transaction.countDocuments(filter),
    ]);

    return res.json({ items, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to list transactions.' });
  }
}

// GET /api/transactions/:id
async function getTransaction(req, res) {
  try {
    const tx = await Transaction.findOne({ transaction_id: req.params.id });
    if (!tx) return res.status(404).json({ error: 'Transaction not found.' });
    return res.json({ transaction: tx });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch transaction.' });
  }
}

module.exports = { createTransaction, listTransactions, getTransaction };

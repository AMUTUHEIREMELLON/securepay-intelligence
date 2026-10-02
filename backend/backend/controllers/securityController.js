const SecurityEvent = require('../models/SecurityEvent');
const FraudAlert = require('../models/FraudAlert');
const User = require('../models/User');

// GET /api/security/events?severity=&event_type=&page=&limit=
async function listSecurityEvents(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 25);
    const filter = {};
    if (req.query.severity) filter.severity = req.query.severity;
    if (req.query.event_type) filter.event_type = req.query.event_type;

    const [items, total] = await Promise.all([
      SecurityEvent.find(filter)
        .sort({ timestamp: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('user_id', 'name email role'),
      SecurityEvent.countDocuments(filter),
    ]);

    return res.json({ items, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch security events.' });
  }
}

// GET /api/security/alerts
async function listFraudAlerts(req, res) {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    const alerts = await FraudAlert.find(filter).sort({ created_at: -1 }).limit(200);
    return res.json({ items: alerts, total: alerts.length });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch fraud alerts.' });
  }
}

// PATCH /api/security/alerts/:id
async function updateFraudAlert(req, res) {
  try {
    const { status } = req.body;
    const allowed = ['open', 'investigating', 'confirmed_fraud', 'false_positive', 'resolved'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${allowed.join(', ')}` });
    }
    const alert = await FraudAlert.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!alert) return res.status(404).json({ error: 'Alert not found.' });
    return res.json({ alert });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update alert.' });
  }
}

// GET /api/security/dashboard  (summary counters for the Security Admin view)
async function securityDashboard(req, res) {
  try {
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [failedLogins24h, openAlerts, lockedAccounts, criticalEvents24h, totalEvents24h] = await Promise.all([
      SecurityEvent.countDocuments({ event_type: 'LOGIN_FAILED', timestamp: { $gte: since24h } }),
      FraudAlert.countDocuments({ status: 'open' }),
      User.countDocuments({ lockUntil: { $gt: new Date() } }),
      SecurityEvent.countDocuments({ severity: 'critical', timestamp: { $gte: since24h } }),
      SecurityEvent.countDocuments({ timestamp: { $gte: since24h } }),
    ]);

    return res.json({
      failedLogins24h,
      openAlerts,
      lockedAccounts,
      criticalEvents24h,
      totalEvents24h,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to build security dashboard.' });
  }
}

module.exports = { listSecurityEvents, listFraudAlerts, updateFraudAlert, securityDashboard };

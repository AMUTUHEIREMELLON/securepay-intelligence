const Transaction = require('../models/Transaction');

// GET /api/bi/kpis
async function getKpis(req, res) {
  try {
    const [totals] = await Transaction.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: { $cond: [{ $eq: ['$status', 'Successful'] }, '$amount', 0] } },
          totalTransactions: { $sum: 1 },
          successful: { $sum: { $cond: [{ $eq: ['$status', 'Successful'] }, 1, 0] } },
          failed: { $sum: { $cond: [{ $eq: ['$status', 'Failed'] }, 1, 0] } },
          suspicious: { $sum: { $cond: [{ $eq: ['$status', 'Suspicious'] }, 1, 0] } },
          fraudCount: { $sum: { $cond: ['$is_fraud', 1, 0] } },
          avgAmount: { $avg: '$amount' },
        },
      },
    ]);

    const uniqueCustomers = await Transaction.distinct('customer_id');

    const result = totals || {
      totalRevenue: 0, totalTransactions: 0, successful: 0, failed: 0, suspicious: 0, fraudCount: 0, avgAmount: 0,
    };

    return res.json({
      totalRevenue: Math.round(result.totalRevenue || 0),
      totalTransactions: result.totalTransactions || 0,
      successfulTransactionRate: result.totalTransactions ? +((result.successful / result.totalTransactions) * 100).toFixed(2) : 0,
      failedTransactionRate: result.totalTransactions ? +((result.failed / result.totalTransactions) * 100).toFixed(2) : 0,
      fraudDetectionRate: result.totalTransactions ? +((result.fraudCount / result.totalTransactions) * 100).toFixed(2) : 0,
      averageTransactionValue: Math.round(result.avgAmount || 0),
      totalCustomers: uniqueCustomers.length,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to compute KPIs.' });
  }
}

// GET /api/bi/payment-methods
async function paymentMethodBreakdown(req, res) {
  try {
    const data = await Transaction.aggregate([
      { $group: { _id: '$payment_method', count: { $sum: 1 }, volume: { $sum: '$amount' } } },
      { $sort: { count: -1 } },
    ]);
    return res.json({ items: data });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to compute payment method breakdown.' });
  }
}

// GET /api/bi/customers/segments
// Simple RFM-style segmentation using transaction count + total spend.
async function customerSegments(req, res) {
  try {
    const agg = await Transaction.aggregate([
      { $match: { status: 'Successful' } },
      {
        $group: {
          _id: '$customer_id',
          totalSpend: { $sum: '$amount' },
          transactionCount: { $sum: 1 },
          lastTransaction: { $max: '$timestamp' },
        },
      },
    ]);

    const now = Date.now();
    const segments = { high_value: 0, regular: 0, occasional: 0, inactive: 0 };

    for (const c of agg) {
      const daysSinceLast = (now - new Date(c.lastTransaction).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceLast > 90) segments.inactive += 1;
      else if (c.totalSpend > 2000000 || c.transactionCount >= 10) segments.high_value += 1;
      else if (c.transactionCount >= 3) segments.regular += 1;
      else segments.occasional += 1;
    }

    return res.json({ totalCustomers: agg.length, segments });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to compute customer segments.' });
  }
}

module.exports = { getKpis, paymentMethodBreakdown, customerSegments };

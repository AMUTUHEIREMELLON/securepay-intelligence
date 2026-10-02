const mongoose = require('mongoose');

const fraudAlertSchema = new mongoose.Schema(
  {
    transaction_id: { type: String, required: true, index: true },
    risk_score: { type: Number, required: true },
    reason: [{ type: String }],
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['open', 'investigating', 'confirmed_fraud', 'false_positive', 'resolved'],
      default: 'open',
    },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

module.exports = mongoose.model('FraudAlert', fraudAlertSchema);

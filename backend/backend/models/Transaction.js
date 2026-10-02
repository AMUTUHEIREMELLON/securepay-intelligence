const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    transaction_id: { type: String, required: true, unique: true, index: true },
    customer_id: { type: String, required: true, index: true },
    amount: { type: Number, required: true },
    payment_method: {
      type: String,
      enum: ['Mobile Money', 'Bank Transfer', 'Card'],
      required: true,
    },
    status: {
      type: String,
      enum: ['Successful', 'Failed', 'Suspicious'],
      default: 'Successful',
    },
    location: { type: String },
    device: { type: String },
    hour_of_day: { type: Number, min: 0, max: 23 },
    risk_score: { type: Number, min: 0, max: 100, default: 0 },
    failed_attempts: { type: Number, default: 0 },
    is_fraud: { type: Boolean, default: false },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

transactionSchema.index({ risk_score: -1 });
transactionSchema.index({ is_fraud: 1 });
transactionSchema.index({ timestamp: -1 });

module.exports = mongoose.model('Transaction', transactionSchema);

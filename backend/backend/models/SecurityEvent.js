const mongoose = require('mongoose');

const securityEventSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    email_attempted: { type: String, default: null },
    event_type: {
      type: String,
      enum: [
        'LOGIN_SUCCESS',
        'LOGIN_FAILED',
        'ACCOUNT_LOCKED',
        'LOGOUT',
        'UNAUTHORIZED_ACCESS',
        'PASSWORD_CHANGE',
        'SENSITIVE_DATA_ACCESS', // Guardium-style: access to sensitive transaction data
        'SUSPICIOUS_TRANSACTION', // QRadar-style: correlated suspicious behaviour
        'ROLE_ESCALATION_ATTEMPT',
      ],
      required: true,
    },
    ip_address: { type: String },
    user_agent: { type: String },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'low',
    },
    description: { type: String },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: 'timestamp', updatedAt: false } }
);

securityEventSchema.index({ event_type: 1, timestamp: -1 });
securityEventSchema.index({ severity: 1 });

module.exports = mongoose.model('SecurityEvent', securityEventSchema);

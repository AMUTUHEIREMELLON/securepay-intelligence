/**
 * Lightweight rule-based risk scorer.
 *
 * This is a placeholder for Mellon's machine-learning model (see project
 * doc section 14). It exists so the security/fraud-alert pipeline is
 * testable end-to-end before the real model is plugged in — swap the body
 * of computeRiskScore() for a call to the ML service once it's ready.
 */
function computeRiskScore(tx) {
  let score = 0;
  const reasons = [];

  if (tx.amount > 400000) {
    score += 30;
    reasons.push('Amount significantly higher than typical transaction size');
  }
  if (tx.hour_of_day !== undefined && (tx.hour_of_day >= 0 && tx.hour_of_day <= 4)) {
    score += 20;
    reasons.push('Transaction occurred during unusual hours (00:00-04:00)');
  }
  if (tx.failed_attempts && tx.failed_attempts >= 2) {
    score += 25 * Math.min(tx.failed_attempts, 4);
    reasons.push(`${tx.failed_attempts} failed attempt(s) associated with this transaction`);
  }
  if (tx.status === 'Failed') {
    score += 10;
    reasons.push('Transaction status is Failed');
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  let severity = 'low';
  if (score >= 80) severity = 'critical';
  else if (score >= 50) severity = 'high';
  else if (score >= 25) severity = 'medium';

  return { score, severity, reasons, is_fraud: score >= 80 };
}

module.exports = { computeRiskScore };

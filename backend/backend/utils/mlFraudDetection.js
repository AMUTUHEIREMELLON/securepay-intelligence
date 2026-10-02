
const { execFile } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const fs = require('fs');

const execFileAsync = promisify(execFile);

// Find the main project directory.
const projectRoot = path.resolve(__dirname, '../../../');

// Locate the Python prediction script.
const pythonScript = path.join(
  projectRoot,
  'data-science',
  'src',
  'predict_fraud_cli.py'
);

// Use the project's virtual environment locally.
const venvPython = path.join(projectRoot, '.venv', 'bin', 'python');
const pythonCommand =
  process.env.PYTHON_BIN ||
  (fs.existsSync(venvPython) ? venvPython : 'python3');

async function computeRiskScore(tx) {
  const input = {
    amount: Number(tx.amount),
    hour: Number(tx.hour_of_day),
    failed_attempts: Number(tx.failed_attempts || 0),
    payment_method: tx.payment_method,
    location: tx.location || '',
    device: tx.device || ''
  };

  const { stdout } = await execFileAsync(
    pythonCommand,
    [pythonScript, JSON.stringify(input)],
    {
      cwd: projectRoot,
      timeout: 20000,
      maxBuffer: 1024 * 1024
    }
  );

  const result = JSON.parse(stdout.trim());

  const score = Math.round(result.risk_score * 100);

  let severity = 'low';
  if (score >= 80) severity = 'critical';
  else if (score >= 50) severity = 'high';
  else if (score >= 25) severity = 'medium';

  const reasons = [];
  if (result.prediction === 1) {
    reasons.push('Transaction flagged by the machine-learning model');
  }
  if (input.amount > 400000) {
    reasons.push('High transaction amount');
  }
  if (input.hour >= 0 && input.hour <= 4) {
    reasons.push('Transaction occurred during unusual hours');
  }
  if (input.failed_attempts >= 3) {
    reasons.push('Multiple failed attempts');
  }

  if (reasons.length === 0) {
    reasons.push('No significant risk indicators detected');
  }

  return {
    score,
    severity,
    reasons,
    is_fraud: result.prediction === 1,
    prediction: result.prediction,
    model_status: result.status
  };
}

module.exports = { computeRiskScore };

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse');
const connectDB = require('../config/db');
const Transaction = require('../models/Transaction');
const FraudAlert = require('../models/FraudAlert');

const CSV_PATH = path.join(__dirname, '..', 'data', 'securepay_transactions_analyzed.csv');

async function run() {
  await connectDB();

  const existingCount = await Transaction.countDocuments();
  if (existingCount > 0) {
    console.log(`[Seed] Transactions collection already has ${existingCount} documents. Skipping import.`);
    console.log('[Seed] Drop the collection first if you want to re-import.');
    process.exit(0);
  }

  const records = [];
  const parser = fs.createReadStream(CSV_PATH).pipe(parse({ columns: true, trim: true }));

  for await (const row of parser) {
    records.push({
      transaction_id: row.transaction_id,
      customer_id: row.customer_id,
      amount: parseFloat(row.amount),
      payment_method: row.payment_method,
      status: row.status,
      location: row.location,
      device: row.device,
      hour_of_day: parseInt(row.hour_of_day, 10),
      risk_score: parseInt(row.risk_score, 10),
      failed_attempts: parseInt(row.failed_attempts, 10),
      is_fraud: row.is_fraud === '1' || row.is_fraud === 'true',
      // Synthetic timestamps spread over the last 60 days so BI/time-based
      // queries have something realistic to work with.
      timestamp: new Date(Date.now() - Math.floor(Math.random() * 60) * 24 * 60 * 60 * 1000),
    });
  }

  console.log(`[Seed] Parsed ${records.length} rows from CSV. Inserting...`);
  await Transaction.insertMany(records, { ordered: false });

  // Create FraudAlert entries for anything already flagged fraudulent/high risk
  const flagged = records.filter((r) => r.is_fraud || r.risk_score >= 50);
  const alerts = flagged.map((r) => ({
    transaction_id: r.transaction_id,
    risk_score: r.risk_score,
    reason: r.is_fraud ? ['Flagged as fraud in source dataset'] : ['High risk score in source dataset'],
    severity: r.risk_score >= 80 ? 'critical' : r.risk_score >= 50 ? 'high' : 'medium',
    status: 'open',
  }));
  if (alerts.length) {
    await FraudAlert.insertMany(alerts, { ordered: false });
  }

  console.log(`[Seed] Inserted ${records.length} transactions and ${alerts.length} fraud alerts.`);
  process.exit(0);
}

run().catch((err) => {
  console.error('[Seed] Import failed:', err);
  process.exit(1);
});

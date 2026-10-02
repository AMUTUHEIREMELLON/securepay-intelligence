require('dotenv').config();
const connectDB = require('../config/db');
const User = require('../models/User');

const seedUsers = [
  { name: 'Security Admin', email: 'security.admin@securepay.test', password: 'ChangeMe123!', role: 'security_admin' },
  { name: 'Business Manager', email: 'manager@securepay.test', password: 'ChangeMe123!', role: 'business_manager' },
  { name: 'Finance Admin', email: 'admin@securepay.test', password: 'ChangeMe123!', role: 'admin' },
  { name: 'Test Customer', email: 'customer@securepay.test', password: 'ChangeMe123!', role: 'customer' },
];

async function run() {
  await connectDB();

  for (const u of seedUsers) {
    const existing = await User.findOne({ email: u.email });
    if (existing) {
      console.log(`[Seed] Skipping existing user: ${u.email}`);
      continue;
    }
    await User.create(u);
    console.log(`[Seed] Created ${u.role}: ${u.email} / ${u.password}`);
  }

  console.log('\n[Seed] Done. Use these accounts to log in and test each role.');
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

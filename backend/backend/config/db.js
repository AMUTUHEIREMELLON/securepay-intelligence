const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/securepay_intelligence';
  try {
    await mongoose.connect(uri);
    console.log(`[DB] Connected to MongoDB -> ${uri}`);
  } catch (err) {
    console.error('[DB] Connection failed:', err.message);
    process.exit(1);
  }
}

module.exports = connectDB;

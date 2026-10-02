require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const securityRoutes = require('./routes/securityRoutes');
const biRoutes = require('./routes/biRoutes');
const nlpRoutes = require('./routes/nlpRoutes');

const app = express();

// --- Security middleware (Non-Functional Requirement: Security) ---
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);

// General API rate limiting (defense in depth, on top of the auth-specific limiter)
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.use(express.json({ limit: '1mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// --- Routes ---
app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'securepay-intelligence-api' }));
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/bi', biRoutes);
app.use('/api/nlp', nlpRoutes);

// --- Serve the built frontend (single-service deploy: Render/Railway) ---
// `npm run build` at the repo root builds frontend/dist. If it exists, this
// backend also serves it, so one process + one start command handles both.
const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// --- 404 handler (API routes that matched nothing above) ---
app.use((req, res) => res.status(404).json({ error: 'Route not found.' }));

// --- Global error handler ---
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[Unhandled Error]', err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error.' });
});

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`[Server] SecurePay Intelligence API running on port ${PORT}`));
});

module.exports = app;

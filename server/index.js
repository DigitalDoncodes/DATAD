require('dotenv').config();

const REQUIRED_ENV = ['MONGODB_URI', 'JWT_SECRET', 'CLIENT_URL'];
const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
if (missing.length) {
  console.error(`Missing required env vars: ${missing.join(', ')}`);
  process.exit(1);
}

const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const { generalLimiter, authLimiter } = require('./middleware/rateLimiters');
const entertainmentRoutes = require('./routes/entertainmentRoutes');
const app = express();

// Behind a hosting proxy (Render/Railway/Vercel) the client IP is in
// X-Forwarded-For; trust one hop so rate limiting keys on the real IP.
app.set('trust proxy', 1);

// CLIENT_URL may be a comma-separated allow-list (e.g. prod + www + localhost).
const allowedOrigins = process.env.CLIENT_URL.split(',').map((o) => o.trim());
// ngrok tunnel URLs rotate on every restart (free tier) — allow the ngrok
// domains by pattern so the tunnel works without editing CLIENT_URL each time.
const NGROK_RE = /^https:\/\/[a-z0-9-]+\.(ngrok-free\.app|ngrok\.app|ngrok\.io)$/;

app.use(
  helmet({
    // The SPA is served from this same server; the app loads cover images from
    // external hosts (Unsplash, Google Photos), so a strict default CSP would
    // break them. Cross-origin isolation headers off for the same reason.
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);
app.use(
  cors({
    origin: (origin, cb) => {
      // Allow same-origin / server-to-server calls (no Origin header).
      if (!origin || allowedOrigins.includes(origin) || NGROK_RE.test(origin)) {
        return cb(null, true);
      }
      cb(new Error('Not allowed by CORS'));
    },
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(mongoSanitize());
app.use(hpp());
app.use('/api', generalLimiter);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authLimiter, require('./routes/authRoutes'));
app.use('/api/notes', require('./routes/noteRoutes'));
app.use('/api/albums', require('./routes/albumRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/finance', require('./routes/financeRoutes'));
app.use('/api/resume', require('./routes/resumeRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/announcements', require('./routes/announcementRoutes'));
app.use('/api/intelligence', require('./routes/intelligenceRoutes'));
app.use('/api/entertainment', entertainmentRoutes);
app.use('/api/companies', require('./routes/companyRoutes'));
app.use('/api/readiness', require('./routes/readinessRoutes'));
app.use('/api', (req, res) => res.status(404).json({ message: 'Route not found' }));

// Serve the built React app from this same server (single ngrok tunnel /
// single-service deploy). Run `npm run build` in client/ to create dist.
const clientDist = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  // SPA fallback: any non-API GET serves index.html so client routing works.
  app.get('*', (req, res) => res.sendFile(path.join(clientDist, 'index.html')));
} else {
  app.use((req, res) => res.status(404).json({ message: 'Route not found' }));
}

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const { startNewsRefresh } = require('./services/newsFetcher');
const { startMarketRefresh } = require('./services/marketFetcher');

connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    // Pull live news (every 30 min) and live market data (every 15 min) on boot.
    startNewsRefresh(30);
    startMarketRefresh(15);
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err.message);
    process.exit(1);
  });

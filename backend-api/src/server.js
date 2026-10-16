require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const db = require('./shared/database/knex');

// Feature Routers
const authRoutes = require('./features/auth/auth.routes');
const warriorRoutes = require('./features/warriors/warrior.routes');
const tributeRoutes = require('./features/tributes/tribute.routes');
const sponsorshipRoutes = require('./features/sponsorships/sponsorship.routes');

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Utility Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Static files for uploaded media
app.use('/uploads', express.static('uploads'));

// Health check endpoint (phục vụ Docker healthcheck & giám sát 3-Tier)
app.get('/api/v1/health', async (req, res) => {
  try {
    const dbCheck = await db.raw('SELECT 1+1 AS result');
    const isDbConnected = Boolean(dbCheck && dbCheck.rows && dbCheck.rows.length > 0);

    return res.status(200).json({
      status: 'UP',
      service: 'Courageous Little Warriors - Backend API',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      database: isDbConnected ? 'CONNECTED' : 'DISCONNECTED',
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    console.error('[HEALTHCHECK ERROR]', error.message);
    return res.status(503).json({
      status: 'DEGRADED',
      service: 'Courageous Little Warriors - Backend API',
      timestamp: new Date().toISOString(),
      database: 'DISCONNECTED',
      error: error.message
    });
  }
});

// Root API information
app.get('/api/v1', (req, res) => {
  res.json({
    message: 'Chào mừng đến với API Cổng Chiến Binh Nhí (Courageous Little Warriors Hub)',
    version: '1.0.0',
    endpoints: {
      health: '/api/v1/health',
      auth: '/api/v1/auth',
      warriors: '/api/v1/warriors',
      tributes: '/api/v1/tributes',
      sponsorships: '/api/v1/sponsorships'
    }
  });
});

// Gắn kết các Router Tính Năng (Feature-based Routes)
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/warriors', warriorRoutes);
app.use('/api/v1/tributes', tributeRoutes);
app.use('/api/v1/sponsorships', sponsorshipRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    status: 'fail',
    message: `Không tìm thấy tài nguyên: ${req.originalUrl}`
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[GLOBAL ERROR]', err);
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Lỗi máy chủ nội bộ'
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 [BACKEND API] Đang lắng nghe trên cổng ${PORT}`);
  console.log(`🔗 Health Check: http://localhost:${PORT}/api/v1/health`);
});

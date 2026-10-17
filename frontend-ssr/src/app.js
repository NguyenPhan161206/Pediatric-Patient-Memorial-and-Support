require('dotenv').config();
const path = require('path');
const express = require('express');
const { engine } = require('express-handlebars');
const session = require('express-session');
const morgan = require('morgan');
const apiClient = require('./shared/utils/apiClient');

// Routers
const authRoutes = require('./modules/auth/auth.routes');
const warriorRoutes = require('./modules/warriors/warrior.routes');
const familyRoutes = require('./modules/family/family.routes');
const tributeRoutes = require('./modules/tributes/tribute.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Setup Handlebars Template Engine with Custom Helpers
app.engine('.hbs', engine({
  extname: '.hbs',
  defaultLayout: 'main',
  layoutsDir: path.join(__dirname, 'shared/layouts'),
  partialsDir: path.join(__dirname, 'shared/views/partials'),
  helpers: {
    eq: (a, b) => a === b,
    neq: (a, b) => a !== b,
    gt: (a, b) => a > b,
    lt: (a, b) => a < b,
    or: (...args) => args.slice(0, -1).some(Boolean),
    and: (...args) => args.slice(0, -1).every(Boolean),
    formatDate: (dateStr) => {
      if (!dateStr) return '';
      return new Date(dateStr).toLocaleDateString('vi-VN');
    },
    lookup: (obj, field) => (obj && obj[field] !== undefined ? obj[field] : null)
  }
}));

app.set('view engine', '.hbs');
app.set('views', path.join(__dirname, 'modules'));

// Middlewares
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// Session Configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'warrior-hub-secret-session-key-2026',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // set true in production behind HTTPS proxy
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  }
}));

// Expose currentUser and currentPath to all views
app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  res.locals.currentPath = req.path;
  next();
});

// Trang chủ (Home Page)
app.get('/', async (req, res) => {
  let healthData = {
    status: 'UNKNOWN',
    database: 'UNKNOWN',
    timestamp: new Date().toLocaleTimeString('vi-VN')
  };

  try {
    const response = await apiClient.get('/health');
    healthData = {
      ...response,
      timestamp: new Date(response.timestamp).toLocaleTimeString('vi-VN')
    };
  } catch (err) {
    console.warn('[FRONTEND -> BACKEND WARNING]: Không thể kết nối tới Backend API:', err.message);
    healthData.status = 'DISCONNECTED';
    healthData.database = 'UNREACHABLE';
  }

  res.render('home/views/index', {
    title: 'Trang Chủ',
    description: 'Cổng ký ức, tri ân và vinh danh các chiến binh nhí mắc bệnh hiểm nghèo',
    health: healthData
  });
});

// Root auth shortcuts
app.get('/login', (req, res) => res.redirect('/auth/login'));
app.get('/register', (req, res) => res.redirect('/auth/register'));
app.get('/logout', (req, res) => res.redirect('/auth/logout'));

// Feature Routes
app.use('/auth', authRoutes);
app.use('/warriors', warriorRoutes);
app.use('/family', familyRoutes);
app.use('/tributes', tributeRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).render('home/views/index', {
    title: '404 - Không Tìm Thấy',
    health: { status: 'OK', database: 'CONNECTED' },
    errorMsg: 'Không tìm thấy trang yêu cầu.'
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[FRONTEND GLOBAL ERROR]', err);
  res.status(500).render('home/views/index', {
    title: '500 - Lỗi Máy Chủ',
    health: { status: 'ERROR', database: 'UNKNOWN' },
    errorMsg: 'Đã xảy ra sự cố khi tải trang. Vui lòng thử lại sau.'
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🌐 [FRONTEND SSR] Đang chạy tại: http://localhost:${PORT}`);
});

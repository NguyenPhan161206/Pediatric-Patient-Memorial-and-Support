require('dotenv').config();
const path = require('path');
const express = require('express');
const { engine } = require('express-handlebars');
const morgan = require('morgan');
const apiClient = require('./shared/utils/apiClient');

const app = express();
const PORT = process.env.PORT || 3000;

// Setup Handlebars Template Engine
app.engine('.hbs', engine({
  extname: '.hbs',
  defaultLayout: 'main',
  layoutsDir: path.join(__dirname, 'shared/layouts'),
  partialsDir: path.join(__dirname, 'shared/views/partials'),
  helpers: {
    eq: (a, b) => a === b,
    gt: (a, b) => a > b,
    formatDate: (dateStr) => {
      if (!dateStr) return '';
      return new Date(dateStr).toLocaleDateString('vi-VN');
    }
  }
}));

app.set('view engine', '.hbs');
app.set('views', path.join(__dirname, 'modules'));

// Middlewares
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

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

// Mock routes ban đầu cho các trang chức năng
app.get('/warriors', (req, res) => {
  res.redirect('/#system-health');
});

app.get('/tributes', (req, res) => {
  res.redirect('/#system-health');
});

app.get('/about', (req, res) => {
  res.redirect('/');
});

app.get('/login', (req, res) => {
  res.send(`
    <div style="font-family: sans-serif; text-align: center; padding: 50px;">
      <h2>Trang Đăng Nhập Đang Được Chuẩn Bị Ở Giai Đoạn 2</h2>
      <a href="/" style="color: #e11d48;">← Quay lại Trang Chủ</a>
    </div>
  `);
});

app.get('/register', (req, res) => {
  res.send(`
    <div style="font-family: sans-serif; text-align: center; padding: 50px;">
      <h2>Trang Đăng Ký Đang Được Chuẩn Bị Ở Giai Đoạn 2</h2>
      <a href="/" style="color: #e11d48;">← Quay lại Trang Chủ</a>
    </div>
  `);
});

// 404 Handler
app.use((req, res) => {
  res.status(404).render('home/views/index', {
    title: '404 - Không Tìm Thấy',
    health: { status: 'OK', database: 'CONNECTED' }
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🌐 [FRONTEND SSR] Đang chạy tại: http://localhost:${PORT}`);
});

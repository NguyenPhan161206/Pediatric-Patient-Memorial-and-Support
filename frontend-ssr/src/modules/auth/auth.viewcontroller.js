const apiClient = require('../../shared/utils/apiClient');

const showLoginForm = (req, res) => {
  if (req.session.user) {
    return res.redirect('/');
  }
  res.render('auth/views/login', {
    title: 'Đăng Nhập',
    error: req.query.error || null
  });
};

const processLogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const response = await apiClient.post('/auth/login', { email, password });

    if (response && response.data) {
      req.session.token = response.data.token;
      req.session.user = response.data.user;
      req.session.successMsg = `Chào mừng trở lại, ${response.data.user.fullName}!`;
      return res.redirect(req.session.returnTo || '/');
    }

    return res.render('auth/views/login', {
      title: 'Đăng Nhập',
      error: 'Phản hồi không hợp lệ từ máy chủ.',
      email
    });
  } catch (error) {
    console.error('[FRONTEND LOGIN ERROR]', error);
    return res.render('auth/views/login', {
      title: 'Đăng Nhập',
      error: error.message || 'Email hoặc mật khẩu không chính xác.',
      email
    });
  }
};

const showRegisterForm = (req, res) => {
  if (req.session.user) {
    return res.redirect('/');
  }
  res.render('auth/views/register', {
    title: 'Đăng Ký Thành Viên'
  });
};

const processRegister = async (req, res) => {
  const { email, password, full_name, phone_number } = req.body;

  try {
    const response = await apiClient.post('/auth/register', {
      email,
      password,
      full_name,
      phone_number
    });

    if (response && response.data) {
      req.session.token = response.data.token;
      req.session.user = response.data.user;
      req.session.successMsg = 'Đăng ký tài khoản thành công!';
      return res.redirect('/');
    }

    return res.render('auth/views/register', {
      title: 'Đăng Ký',
      error: 'Đăng ký thất bại.',
      formData: req.body
    });
  } catch (error) {
    console.error('[FRONTEND REGISTER ERROR]', error);
    return res.render('auth/views/register', {
      title: 'Đăng Ký',
      error: error.message || 'Lỗi khi tạo tài khoản.',
      formData: req.body
    });
  }
};

const logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
};

module.exports = {
  showLoginForm,
  processLogin,
  showRegisterForm,
  processRegister,
  logout
};

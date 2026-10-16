const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'warrior_hub_jwt_super_secret_2026';

/**
 * Middleware xác thực JSON Web Token (JWT)
 * Đọc token từ header Authorization: Bearer <token>
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') 
    ? authHeader.slice(7) 
    : req.headers['x-access-token'];

  if (!token) {
    return res.status(401).json({
      status: 'fail',
      message: 'Vui lòng đăng nhập để thực hiện hành động này.'
    });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({
        status: 'fail',
        message: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.'
      });
    }

    req.user = decoded; // { id, email, role, fullName }
    next();
  });
};

module.exports = {
  authenticateToken,
  JWT_SECRET
};

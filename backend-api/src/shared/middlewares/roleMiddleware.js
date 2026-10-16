/**
 * Middleware kiểm tra vai trò người dùng (5-Tier RBAC)
 * @param  {...string} allowedRoles Các vai trò được phép truy cập (VD: 'ADMIN', 'COORDINATOR')
 */
const requireRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({
        status: 'fail',
        message: 'Bạn chưa được xác thực danh tính.'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'fail',
        message: `Quyền truy cập bị từ chối. Hành động này chỉ dành cho: ${allowedRoles.join(', ')}.`
      });
    }

    next();
  };
};

module.exports = {
  requireRoles
};

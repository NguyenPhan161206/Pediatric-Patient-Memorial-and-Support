const express = require('express');
const adminController = require('./admin.controller');
const { authenticateToken } = require('../../shared/middlewares/authMiddleware');
const { requireRoles } = require('../../shared/middlewares/roleMiddleware');

const router = express.Router();

// Tất cả các route admin đều yêu cầu đăng nhập và vai trò ADMIN hoặc SUPER_ADMIN
router.use(authenticateToken, requireRoles('ADMIN', 'SUPER_ADMIN'));

// 1. Chỉ số tổng thể hệ thống (Dashboard Metrics)
router.get('/dashboard/metrics', adminController.getDashboardMetrics);

// 2. Quản lý danh sách người dùng (Users Management)
router.get('/users', adminController.getUsers);

// 3. Cấp tài khoản và phân quyền người dùng mới (Role Provisioning)
router.post('/users', adminController.provisionUser);

// 4. Khóa hoặc Mở khóa tài khoản người dùng
router.patch('/users/:id/status', adminController.toggleUserStatus);

// 5. Đặt lại mật khẩu mặc định (Password Reset)
router.post('/users/:id/reset-password', adminController.resetUserPassword);

module.exports = router;

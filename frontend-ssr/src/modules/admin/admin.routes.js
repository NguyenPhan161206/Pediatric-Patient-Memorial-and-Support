const express = require('express');
const adminViewController = require('./admin.viewcontroller');

const router = express.Router();

// Bảng Điều Hành Quản Trị
router.get('/dashboard', adminViewController.renderDashboard);

// Quản Lý Danh Sách & Cấp Tài Khoản
router.get('/users', adminViewController.renderUsers);
router.post('/users/create', adminViewController.handleCreateUser);
router.post('/users/:id/toggle-status', adminViewController.handleToggleStatus);
router.post('/users/:id/reset-password', adminViewController.handleResetPassword);

// Quản Lý Đơn Vị & Cơ Sở Y Tế Phụ Trách (Dynamic Multi-Tenancy)
router.get('/organizations', adminViewController.renderOrganizations);
router.post('/organizations/create', adminViewController.handleCreateOrganization);
router.post('/organizations/:id/toggle-status', adminViewController.handleToggleOrganizationStatus);

module.exports = router;

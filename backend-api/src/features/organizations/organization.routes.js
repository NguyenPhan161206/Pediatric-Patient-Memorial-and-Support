const express = require('express');
const router = express.Router();
const organizationController = require('./organization.controller');
const { authenticateToken } = require('../../shared/middlewares/authMiddleware');
const { requireRoles } = require('../../shared/middlewares/roleMiddleware');
const { ensureOrgScope } = require('../../shared/middlewares/ensureOrgScope');

// 1. Lấy danh sách các Bệnh viện / Tổ chức (Public - Cho bản đồ & bộ lọc)
router.get('/', organizationController.getOrganizations);

// 2. Lấy dữ liệu tổng hợp Cổng Bệnh Viện (Yêu cầu đăng nhập ORG_ADMIN, ADMIN, SUPER_ADMIN)
router.get(
  '/portal/stats',
  authenticateToken,
  requireRoles('ADMIN', 'SUPER_ADMIN', 'ORG_ADMIN'),
  organizationController.getMyOrganizationPortal
);

// 3. Lấy chi tiết Bệnh viện / Tổ chức theo ID hoặc Code (Public)
router.get('/:identifier', organizationController.getOrganizationByIdOrCode);

// 3. Cập nhật thông tin Bệnh viện (Yêu cầu đăng nhập, đúng ORG_ADMIN thuộc viện hoặc SUPER_ADMIN)
router.put(
  '/:id',
  authenticateToken,
  requireRoles('ADMIN', 'SUPER_ADMIN', 'ORG_ADMIN'),
  ensureOrgScope((req) => req.params.id),
  organizationController.updateOrganization
);

module.exports = router;

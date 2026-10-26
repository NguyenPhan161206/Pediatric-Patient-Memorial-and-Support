const express = require('express');
const sponsorshipController = require('./sponsorship.controller');
const { authenticateToken } = require('../../shared/middlewares/authMiddleware');
const { requireRoles } = require('../../shared/middlewares/roleMiddleware');

const router = express.Router();

// Public route: Lấy thông tin tài khoản và mã VietQR chuẩn Napas247
router.get('/:childId/vietqr', sponsorshipController.getVietQRInfo);

// Protected route (Chỉ Admin): Thẩm định tài khoản chính chủ (KYC)
router.patch(
  '/:childId/verify',
  authenticateToken,
  requireRoles('ADMIN'),
  sponsorshipController.verifySponsorshipBank
);

module.exports = router;

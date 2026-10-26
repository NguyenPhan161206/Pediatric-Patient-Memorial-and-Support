const express = require('express');
const warriorController = require('./warrior.controller');
const { authenticateToken } = require('../../shared/middlewares/authMiddleware');
const { requireRoles } = require('../../shared/middlewares/roleMiddleware');
const { ensureFamilyOwnership } = require('../../shared/middlewares/ensureFamilyOwnership');

const router = express.Router();

// Public routes
router.get('/', warriorController.getWarriors);
router.get('/categories/all', warriorController.getCategories);
router.get('/:slug', warriorController.getWarriorBySlug);

// Protected routes (Chỉ ORG_ADMIN thuộc bệnh viện hoặc COORDINATOR)
router.post(
  '/',
  authenticateToken,
  requireRoles('ORG_ADMIN', 'COORDINATOR'),
  warriorController.createWarrior
);

// Nộp thông tin / ảnh mã QR viện phí của người nhà (Chỉ vai trò FAMILY sở hữu bé)
router.post(
  '/:id/family-bank',
  authenticateToken,
  ensureFamilyOwnership,
  warriorController.submitFamilyBankQR
);

// Thẩm định và duyệt mã QR viện phí của người nhà (Chỉ ORG_ADMIN của bệnh viện)
router.patch(
  '/:id/family-bank/verify',
  authenticateToken,
  requireRoles('ORG_ADMIN'),
  warriorController.verifyFamilyBankQR
);

// Protected routes (Admin hoặc Gia đình sở hữu bé này)
router.patch(
  '/:id',
  authenticateToken,
  ensureFamilyOwnership,
  warriorController.updateWarrior
);

// Quyền rút hồ sơ khẩn cấp (Emergency Unpublish - Quyền được quên)
router.patch(
  '/:id/unpublish',
  authenticateToken,
  ensureFamilyOwnership,
  warriorController.unpublishWarrior
);

// Thêm và xóa kỷ vật / đa phương tiện (Ảnh, Video YouTube, Lời ru / Âm thanh)
router.post(
  '/:id/gallery',
  authenticateToken,
  warriorController.addGalleryItem
);

router.delete(
  '/:id/gallery/:itemId',
  authenticateToken,
  warriorController.deleteGalleryItem
);

module.exports = router;

const express = require('express');
const router = express.Router();
const wishController = require('./wish.controller');
const { authenticateToken } = require('../../shared/middlewares/authMiddleware');
const { requireRoles } = require('../../shared/middlewares/roleMiddleware');

// 1. Lấy danh sách điều ước của một bé (Public)
router.get('/warrior/:slugOrId', wishController.getWishesByWarrior);

// 2. Tạo điều ước mới cho bé (Yêu cầu đăng nhập: FAMILY, COORDINATOR, ORG_ADMIN, ADMIN)
router.post(
  '/',
  authenticateToken,
  requireRoles('FAMILY', 'COORDINATOR', 'ORG_ADMIN', 'ADMIN', 'SUPER_ADMIN'),
  wishController.createWish
);

// 3. Nhà hảo tâm đăng ký nhận trao tặng điều ước (Public)
router.post('/:id/sponsor', wishController.sponsorWish);

// 4. Xác nhận quà đã trao cho bé (Yêu cầu đăng nhập: FAMILY, COORDINATOR, ORG_ADMIN, ADMIN)
router.patch(
  '/:id/fulfill',
  authenticateToken,
  requireRoles('FAMILY', 'COORDINATOR', 'ORG_ADMIN', 'ADMIN', 'SUPER_ADMIN'),
  wishController.fulfillWish
);

module.exports = router;

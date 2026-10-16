const express = require('express');
const tributeController = require('./tribute.controller');
const { authenticateToken } = require('../../shared/middlewares/authMiddleware');
const { requireRoles } = require('../../shared/middlewares/roleMiddleware');

const router = express.Router();

// Public routes: Thắp nến và gửi lời tri ân
router.post('/:id/candle', tributeController.lightCandle);
router.post('/:id/tributes', tributeController.sendTribute);

// Protected routes: Quản lý và kiểm duyệt lời nhắn
router.get(
  '/pending',
  authenticateToken,
  requireRoles('ADMIN', 'COORDINATOR', 'FAMILY'),
  tributeController.getPendingTributes
);

router.patch(
  '/:id/approve',
  authenticateToken,
  requireRoles('ADMIN', 'COORDINATOR', 'FAMILY'),
  tributeController.approveTribute
);

router.patch(
  '/:id/reject',
  authenticateToken,
  requireRoles('ADMIN', 'COORDINATOR', 'FAMILY'),
  tributeController.rejectTribute
);

module.exports = router;

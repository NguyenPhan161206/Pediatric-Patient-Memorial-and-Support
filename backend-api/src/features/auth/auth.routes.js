const express = require('express');
const authController = require('./auth.controller');
const { authenticateToken } = require('../../shared/middlewares/authMiddleware');
const { requireRoles } = require('../../shared/middlewares/roleMiddleware');

const router = express.Router();

// Public routes
router.post('/login', authController.login);
router.post('/register', authController.register);

// Protected routes
router.get('/me', authenticateToken, authController.getMe);

// Admin / Coordinator only routes: Cấp tài khoản đóng cho Gia đình
router.post(
  '/provision-family',
  authenticateToken,
  requireRoles('ADMIN', 'COORDINATOR'),
  authController.provisionFamily
);

module.exports = router;

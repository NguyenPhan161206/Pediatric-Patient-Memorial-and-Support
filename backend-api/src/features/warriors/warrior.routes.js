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

// Protected routes (Admin / Coordinator)
router.post(
  '/',
  authenticateToken,
  requireRoles('ADMIN', 'COORDINATOR'),
  warriorController.createWarrior
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

module.exports = router;

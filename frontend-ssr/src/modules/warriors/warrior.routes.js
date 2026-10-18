const express = require('express');
const warriorViewController = require('./warrior.viewcontroller');

const router = express.Router();

// Danh sách chiến binh (kèm FTS, Filter, Phân trang)
router.get('/', warriorViewController.listWarriors);

// Tạo mới hồ sơ bé (Admin, Coordinator, Org Admin)
router.get('/new', warriorViewController.renderCreateWarrior);
router.post('/new', warriorViewController.handleCreateWarrior);

// Chi tiết hồ sơ bé theo slug
router.get('/:slug', warriorViewController.warriorDetail);

// Gửi lời chúc tri ân từ trang chi tiết bé
router.post('/:id/tribute', warriorViewController.submitTribute);

// Proxy thắp nến cho client AJAX
router.post('/:id/candle', warriorViewController.lightCandle);

module.exports = router;

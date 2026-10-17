const express = require('express');
const familyViewController = require('./family.viewcontroller');

const router = express.Router();

// Trang chủ cổng gia đình
router.get('/portal', familyViewController.showPortal);

// Rút hồ sơ khẩn cấp (Emergency Unpublish)
router.post('/unpublish/:id', familyViewController.unpublishChild);

// Cập nhật nhật ký điều trị của bé
router.post('/update/:id', familyViewController.updateDiary);

module.exports = router;

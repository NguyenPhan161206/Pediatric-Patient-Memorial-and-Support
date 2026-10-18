const express = require('express');
const familyViewController = require('./family.viewcontroller');

const router = express.Router();

// Trang chủ cổng gia đình
router.get('/portal', familyViewController.showPortal);

// Rút hồ sơ khẩn cấp (Emergency Unpublish)
router.post('/unpublish/:id', familyViewController.unpublishChild);

// Cập nhật nhật ký điều trị của bé
router.post('/update/:id', familyViewController.updateDiary);

// Đăng ký điều ước mới của bé
router.post('/wishes/create', familyViewController.createChildWish);

module.exports = router;

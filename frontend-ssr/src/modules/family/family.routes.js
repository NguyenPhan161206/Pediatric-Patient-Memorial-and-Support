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

// Kho kỷ niệm: Thêm ảnh / video / clip
router.post('/gallery/add', familyViewController.addMediaItem);

// Kho kỷ niệm: Xóa kỷ vật
router.post('/gallery/:childId/:itemId/delete', familyViewController.deleteMediaItem);

// Lời ru / Tin nhắn thoại yêu thương gửi con
router.post('/tributes/voice', familyViewController.sendFamilyVoiceNote);

// Cập nhật thông tin danh xưng phụ huynh
router.post('/profile/update', familyViewController.updateFamilyProfile);

module.exports = router;

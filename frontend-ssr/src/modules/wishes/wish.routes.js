const express = require('express');
const router = express.Router();
const wishViewController = require('./wish.viewcontroller');

// Trang danh mục Cây điều ước toàn quốc
router.get('/', wishViewController.renderWishesPage);

// Gửi đăng ký nhận trao tặng điều ước
router.post('/:id/sponsor', wishViewController.handleSponsorWish);

module.exports = router;

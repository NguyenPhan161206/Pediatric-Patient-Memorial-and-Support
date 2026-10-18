const express = require('express');
const router = express.Router();
const donationViewController = require('./donation.viewcontroller');

// Bức Tường Vinh Danh Toàn Quốc
router.get('/wall', donationViewController.renderWallOfHonor);

// Cổng xét duyệt biên lai (Dành cho ORG_ADMIN, FAMILY, ADMIN)
router.get('/moderation', donationViewController.viewModeration);

// Xem Chứng Nhận Tri Ân Số
router.get('/cert/:qrToken', donationViewController.viewCertificate);

// Nộp minh chứng giao dịch thật
router.post('/submit-proof', donationViewController.submitProof);

// Mô phỏng chuyển khoản Sandbox 1-Click
router.post('/mock-sandbox', donationViewController.mockSandboxPay);
router.post('/mock-sandbox-pay', donationViewController.mockSandboxPay);

// Thao tác duyệt / từ chối
router.post('/:id/verify', donationViewController.verifyDonation);
router.post('/:id/reject', donationViewController.rejectDonation);

// Nhận trao tặng điều ước
router.post('/wishes/:id/sponsor', donationViewController.sponsorWish);

module.exports = router;

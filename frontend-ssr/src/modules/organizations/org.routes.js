const express = require('express');
const router = express.Router();
const orgViewController = require('./org.viewcontroller');

// Cổng Dashboard Bệnh viện & Quỹ Bảo Trợ
router.get('/portal', orgViewController.showHospitalPortal);

// Cập nhật thông tin bệnh viện / CTXH
router.post('/portal/:id/update', orgViewController.updateHospitalInfo);

// Tiếp nhận bệnh nhi mới trực thuộc viện
router.post('/portal/warriors/create', orgViewController.handleCreateWarrior);

// Cấp tài khoản gia đình cho bệnh nhi trực thuộc viện
router.post('/portal/family-user/create', orgViewController.handleProvisionFamily);

// Thẩm định và duyệt mã QR viện phí của người nhà
router.post('/portal/warriors/:id/verify-family-bank', orgViewController.handleVerifyFamilyBank);

module.exports = router;

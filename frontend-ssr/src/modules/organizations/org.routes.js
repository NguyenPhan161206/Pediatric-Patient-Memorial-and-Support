const express = require('express');
const router = express.Router();
const orgViewController = require('./org.viewcontroller');

// Cổng Dashboard Bệnh viện & Quỹ Bảo Trợ
router.get('/portal', orgViewController.showHospitalPortal);

// Cập nhật thông tin bệnh viện / CTXH
router.post('/portal/:id/update', orgViewController.updateHospitalInfo);

module.exports = router;

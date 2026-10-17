const express = require('express');
const tributeViewController = require('./tribute.viewcontroller');

const router = express.Router();

// Bảng kiểm duyệt lời chúc
router.get('/moderation', tributeViewController.showModeration);

// Duyệt lời chúc
router.post('/moderation/:id/approve', tributeViewController.approveTribute);

// Từ chối lời chúc
router.post('/moderation/:id/reject', tributeViewController.rejectTribute);

module.exports = router;

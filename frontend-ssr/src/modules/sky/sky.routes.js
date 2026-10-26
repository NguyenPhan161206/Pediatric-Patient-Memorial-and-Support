const express = require('express');
const router = express.Router();
const skyViewController = require('./sky.viewcontroller');

// GET /memorial-sky - Không gian 3D Bầu Trời Ngàn Sao
router.get('/', skyViewController.renderMemorialSky);

module.exports = router;

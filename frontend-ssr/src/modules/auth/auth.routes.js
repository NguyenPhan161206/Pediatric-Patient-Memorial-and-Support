const express = require('express');
const authViewController = require('./auth.viewcontroller');

const router = express.Router();

router.get('/login', authViewController.showLoginForm);
router.post('/login', authViewController.processLogin);

router.get('/register', authViewController.showRegisterForm);
router.post('/register', authViewController.processRegister);

router.get('/logout', authViewController.logout);

module.exports = router;

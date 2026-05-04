const express = require('express');
const router = express.Router();
const { chat } = require('../controllers/chat.controller');

// Public — landing page chat doesn't require login
router.post('/', chat);

module.exports = router;
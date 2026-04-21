const express = require('express');
const router = express.Router();
const { listTeam } = require('../../controllers/admin/team.controller');

router.get('/', listTeam);

module.exports = router;

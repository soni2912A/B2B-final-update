const express = require('express');
const router = express.Router();
const {
  getCatalog, listRoles, createRole, updateRole, deleteRole,
} = require('../../controllers/admin/role.controller');

router.get('/catalog', getCatalog);
router.get('/', listRoles);
router.post('/', createRole);
router.put('/:id', updateRole);
router.delete('/:id', deleteRole);

module.exports = router;

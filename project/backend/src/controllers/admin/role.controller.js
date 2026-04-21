const Role = require('../../models/Role.model');
const { PERMISSION_KEYS, groupByModule } = require('../../config/permissions.catalog');
const { sendSuccess, sendError } = require('../../utils/responseHelper');

// Validate the `permissions[]` payload against the catalog. Returns null if
// valid, else an error message.
function validatePermissions(permissions) {
  if (!Array.isArray(permissions)) return 'Permissions must be an array.';
  const bad = permissions.filter(p => !PERMISSION_KEYS.includes(p));
  if (bad.length) return `Unknown permissions: ${bad.join(', ')}`;
  return null;
}

// Catalog is static config — exposed so the UI can render checkboxes.
const getCatalog = async (_req, res) => {
  return sendSuccess(res, 200, 'Permission catalog', {
    permissions: groupByModule(),
  });
};

// Admin sees system templates + roles defined inside their own business.
const listRoles = async (req, res) => {
  try {
    const roles = await Role.find({
      $or: [
        { scope: 'system' },
        { scope: 'business', business: req.businessId },
      ],
    }).sort({ scope: 1, name: 1 });
    return sendSuccess(res, 200, 'Roles fetched', { roles });
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

const createRole = async (req, res) => {
  try {
    const { name, description, permissions = [] } = req.body;
    if (!name || !String(name).trim()) return sendError(res, 400, 'Role name is required.');
    const permErr = validatePermissions(permissions);
    if (permErr) return sendError(res, 400, permErr);

    const role = await Role.create({
      name: String(name).trim(),
      description: String(description || '').trim(),
      permissions,
      scope: 'business',
      business: req.businessId,
      builtin: false,
    });
    return sendSuccess(res, 201, 'Role created', { role });
  } catch (err) {
    if (err.code === 11000) return sendError(res, 400, 'A role with that name already exists.');
    return sendError(res, 500, err.message);
  }
};

const updateRole = async (req, res) => {
  try {
    // Admin can only edit roles scoped to their business. System templates are
    // read-only from the admin side.
    const role = await Role.findOne({ _id: req.params.id, scope: 'business', business: req.businessId });
    if (!role) return sendError(res, 404, 'Role not found');
    if (role.builtin) return sendError(res, 400, 'Built-in roles cannot be edited.');

    const { name, description, permissions } = req.body;
    if (name !== undefined) role.name = String(name).trim();
    if (description !== undefined) role.description = String(description).trim();
    if (permissions !== undefined) {
      const permErr = validatePermissions(permissions);
      if (permErr) return sendError(res, 400, permErr);
      role.permissions = permissions;
    }
    await role.save();
    return sendSuccess(res, 200, 'Role updated', { role });
  } catch (err) {
    if (err.code === 11000) return sendError(res, 400, 'A role with that name already exists.');
    return sendError(res, 500, err.message);
  }
};

const deleteRole = async (req, res) => {
  try {
    const role = await Role.findOne({ _id: req.params.id, scope: 'business', business: req.businessId });
    if (!role) return sendError(res, 404, 'Role not found');
    if (role.builtin) return sendError(res, 400, 'Built-in roles cannot be deleted.');
    await role.deleteOne();
    return sendSuccess(res, 200, 'Role deleted');
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};

module.exports = { getCatalog, listRoles, createRole, updateRole, deleteRole };

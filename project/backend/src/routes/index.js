const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { tenantScope } = require('../middleware/tenant.middleware');

router.use('/auth', require('./auth/auth.routes'));

const adminAccess  = [protect, authorize('admin', 'staff'), tenantScope];
const adminOnly    = [protect, authorize('admin'), tenantScope];
const superAdmin   = [protect, authorize('super_admin')];
const corpAccess   = [protect, authorize('corporate_user'), tenantScope];

router.use('/admin/dashboard',     ...adminAccess,  require('./admin/dashboard.routes'));
router.use('/admin/business',      ...adminAccess,  require('./admin/business.routes'));
router.use('/admin/corporates',    ...adminAccess,  require('./admin/corporate.routes'));
router.use('/admin/products',      ...adminAccess,  require('./admin/product.routes'));
router.use('/admin/orders',        ...adminAccess,  require('./admin/order.routes'));
router.use('/admin/deliveries',    ...adminAccess,  require('./admin/delivery.routes'));
router.use('/admin/invoices',      ...adminAccess,  require('./admin/invoice.routes'));
router.use('/admin/templates',     ...adminOnly,    require('./admin/template.routes'));
router.use('/admin/email-logs',    ...adminOnly,    require('./admin/emailLog.routes'));
router.use('/admin/login-logs',    ...adminOnly,    require('./admin/loginLog.routes'));
router.use('/admin/reports',       ...adminOnly,    require('./admin/report.routes'));
router.use('/admin/users',         ...adminOnly,    require('./admin/adminUser.routes'));
router.use('/admin/team',          ...adminAccess,  require('./admin/team.routes'));
router.use('/admin/occasions',     ...adminAccess,  require('./admin/occasion.routes'));
router.use('/admin/feedback',      ...adminAccess,  require('./admin/feedback.routes'));
router.use('/admin/discounts',     ...adminOnly,    require('./admin/discount.routes'));
router.use('/admin/tickets',       ...adminAccess,  require('./admin/ticket.routes'));
router.use('/admin/staff',         ...adminAccess,  require('./admin/staff.routes'));
router.use('/admin/inventory',     ...adminAccess,  require('./admin/inventory.routes'));
router.use('/admin/notifications', ...adminAccess,  require('./admin/notificationPrefs.routes'));
router.use('/admin/roles',         ...adminOnly,    require('./admin/role.routes'));
router.use('/admin/refunds',       ...adminAccess,  require('./admin/refund.routes'));

router.use('/corporate/dashboard',      ...corpAccess, require('./corporate/dashboard.routes'));
router.use('/corporate/staff',          ...corpAccess, require('./corporate/staff.routes'));
router.use('/corporate/orders',         ...corpAccess, require('./corporate/order.routes'));
router.use('/corporate/products',       ...corpAccess, require('./corporate/product.routes'));
router.use('/corporate/invoices',       ...corpAccess, require('./corporate/invoice.routes'));
router.use('/corporate/users',          ...corpAccess, require('./corporate/user.routes'));
router.use('/corporate/occasions',      ...corpAccess, require('./corporate/occasion.routes'));
router.use('/corporate/feedback',       ...corpAccess, require('./corporate/feedback.routes'));
router.use('/corporate/tickets',        ...corpAccess, require('./corporate/ticket.routes'));
router.use('/corporate/notifications',  ...corpAccess, require('./corporate/notification.routes'));
router.use('/corporate/discounts',       ...corpAccess, require('./corporate/discount.routes'));

router.use('/super-admin/businesses',    ...superAdmin, require('./superAdmin/business.routes'));
router.use('/super-admin/subscriptions', ...superAdmin, require('./superAdmin/subscription.routes'));
router.use('/super-admin/login-logs',    ...superAdmin, require('./superAdmin/loginLog.routes'));
router.use('/super-admin/notifications', ...superAdmin, require('./superAdmin/notification.routes'));
router.use('/super-admin/roles',         ...superAdmin, require('./superAdmin/role.routes'));

module.exports = router;



const PERMISSIONS = [
  // Orders
  { module: 'orders',       key: 'orders:view',       label: 'View orders' },
  { module: 'orders',       key: 'orders:create',     label: 'Create orders' },
  { module: 'orders',       key: 'orders:update',     label: 'Update orders' },
  { module: 'orders',       key: 'orders:assign',     label: 'Assign staff to orders' },
  { module: 'orders',       key: 'orders:cancel',     label: 'Cancel orders' },
  { module: 'orders',       key: 'orders:export',     label: 'Export orders' },

  // Deliveries
  { module: 'deliveries',   key: 'deliveries:view',   label: 'View deliveries' },
  { module: 'deliveries',   key: 'deliveries:update', label: 'Update delivery status' },
  { module: 'deliveries',   key: 'deliveries:proof',  label: 'Upload delivery proof' },

  // Products
  { module: 'products',     key: 'products:view',     label: 'View products' },
  { module: 'products',     key: 'products:create',   label: 'Create products' },
  { module: 'products',     key: 'products:update',   label: 'Update products' },
  { module: 'products',     key: 'products:delete',   label: 'Delete products' },
  { module: 'products',     key: 'products:import',   label: 'Bulk import products' },

  // Corporates
  { module: 'corporates',   key: 'corporates:view',   label: 'View corporate clients' },
  { module: 'corporates',   key: 'corporates:create', label: 'Create corporate clients' },
  { module: 'corporates',   key: 'corporates:update', label: 'Update corporate clients' },
  { module: 'corporates',   key: 'corporates:delete', label: 'Delete corporate clients' },

  // Staff
  { module: 'staff',        key: 'staff:view',        label: 'View staff' },
  { module: 'staff',        key: 'staff:manage',      label: 'Create / edit / remove staff' },
  { module: 'staff',        key: 'staff:import',      label: 'Bulk import staff' },

  // Invoices & payments
  { module: 'invoices',     key: 'invoices:view',     label: 'View invoices' },
  { module: 'invoices',     key: 'invoices:create',   label: 'Create / edit invoices' },
  { module: 'invoices',     key: 'invoices:refund',   label: 'Process refunds' },

  // Occasions
  { module: 'occasions',    key: 'occasions:view',    label: 'View occasions' },
  { module: 'occasions',    key: 'occasions:manage',  label: 'Manage occasions' },

  // Feedback & tickets
  { module: 'feedback',     key: 'feedback:view',     label: 'View feedback' },
  { module: 'feedback',     key: 'feedback:respond',  label: 'Respond to feedback' },
  { module: 'tickets',      key: 'tickets:view',      label: 'View support tickets' },
  { module: 'tickets',      key: 'tickets:manage',    label: 'Manage support tickets' },

  // Discounts / coupons
  { module: 'discounts',    key: 'discounts:view',    label: 'View discounts' },
  { module: 'discounts',    key: 'discounts:manage',  label: 'Create / edit discounts' },

  // Reports, logs, templates
  { module: 'reports',      key: 'reports:view',      label: 'View reports' },
  { module: 'reports',      key: 'reports:export',    label: 'Export reports' },
  { module: 'email-logs',   key: 'email-logs:view',   label: 'View email logs' },
  { module: 'templates',    key: 'templates:manage',  label: 'Manage email templates' },

  // Settings
  { module: 'settings',     key: 'settings:view',     label: 'View system settings' },
  { module: 'settings',     key: 'settings:manage',   label: 'Change system settings' },
];

const PERMISSION_KEYS = PERMISSIONS.map(p => p.key);

// Groups the catalog by module for UI rendering.
function groupByModule() {
  const out = {};
  for (const p of PERMISSIONS) {
    if (!out[p.module]) out[p.module] = [];
    out[p.module].push({ key: p.key, label: p.label });
  }
  return out;
}

module.exports = { PERMISSIONS, PERMISSION_KEYS, groupByModule };

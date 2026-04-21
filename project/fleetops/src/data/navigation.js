export const NAV_ADMIN = [
  { section: 'Operations' },
  { id: 'admin-dashboard',    icon: '◈',  label: 'Dashboard' },
  { id: 'admin-orders',       icon: '📋', label: 'Orders',             perm: 'orders:view' },
  { id: 'admin-deliveries',   icon: '🚚', label: 'Deliveries',         perm: 'deliveries:view' },
  { id: 'admin-coordinator',  icon: '📍', label: "Today's Deliveries", perm: 'deliveries:view' },
  { id: 'admin-invoices',     icon: '💳', label: 'Invoices',           perm: 'invoices:view' },
  { id: 'admin-refunds',      icon: '↩️', label: 'Refunds',            perm: 'invoices:refund' },
  { section: 'Clients' },
  { id: 'admin-corporates',   icon: '🏢', label: 'Corporates',         perm: 'corporates:view' },
  { id: 'admin-products',     icon: '🛍️', label: 'Products',           perm: 'products:view' },
  { section: 'Analytics' },
  { id: 'admin-reports',      icon: '📊', label: 'Reports',            perm: 'reports:view' },
  { id: 'admin-occasions',    icon: '🎉', label: 'Occasions',          perm: 'occasions:view' },
  { id: 'admin-feedback',     icon: '⭐', label: 'Feedback',           perm: 'feedback:view' },
  { id: 'admin-discounts',    icon: '🏷️', label: 'Discounts',          perm: 'discounts:view' },
  { section: 'System' },
  { id: 'admin-tickets',      icon: '🎫', label: 'Support Tickets',    perm: 'tickets:view' },
  { id: 'admin-inventory',    icon: '📁', label: 'Inventory',          perm: 'products:view' },
  { id: 'admin-notif-prefs',  icon: '🔔', label: 'Notifications' },
  { id: 'admin-templates',    icon: '📧', label: 'Email Templates',    perm: 'templates:manage' },
  { id: 'admin-logs',         icon: '🔍', label: 'Login Logs' },
  { id: 'admin-email-logs',   icon: '📨', label: 'Email Logs',         perm: 'email-logs:view' },
  { id: 'admin-import-export',icon: '↕️', label: 'Import / Export' },
  { id: 'admin-users',        icon: '👥', label: 'Admin Users' },
  { id: 'admin-roles',        icon: '🛡️', label: 'Roles & Permissions' },
  { id: 'admin-settings',     icon: '⚙️', label: 'Settings',           perm: 'settings:view' },
]

export const NAV_STAFF = [
  { section: 'Operations' },
  { id: 'admin-dashboard',   icon: '◈',  label: 'Dashboard' },
  { id: 'admin-orders',      icon: '📋', label: 'Orders',             perm: 'orders:view' },
  { id: 'admin-deliveries',  icon: '🚚', label: 'Deliveries',         perm: 'deliveries:view' },
  { id: 'admin-coordinator', icon: '📍', label: "Today's Deliveries", perm: 'deliveries:view' },
]

export const NAV_CORPORATE = [
  { section: 'Overview' },
  { id: 'corp-dashboard',   icon: '◈',  label: 'Dashboard' },
  { id: 'corp-orders',      icon: '📋', label: 'My Orders' },
  { id: 'corp-place-order', icon: '➕', label: 'Place Order' },
  { id: 'corp-invoices',    icon: '💳', label: 'Invoices' },
  { section: 'Management' },
  { id: 'corp-staff',       icon: '👥', label: 'Staff' },
  { id: 'corp-occasions',   icon: '🎉', label: 'Occasions' },
  { id: 'corp-users',       icon: '🔑', label: 'Manage Users' },
  { section: 'Other' },
  { id: 'corp-tickets',     icon: '🎫', label: 'Support Tickets' },
  { id: 'corp-feedback',    icon: '⭐', label: 'Feedback' },
  { id: 'corp-notif-prefs', icon: '🔔', label: 'Notifications' },
]

export const NAV_SUPER = [
  { section: 'Platform' },
  { id: 'sa-businesses',    icon: '🏗️', label: 'Businesses' },
  { id: 'sa-subscriptions', icon: '💎', label: 'Subscriptions' },
  { id: 'sa-roles',         icon: '🛡️', label: 'Roles & Permissions' },
  { id: 'sa-logs',          icon: '🔍', label: 'Platform Logs' },
]

export const NAV_MAP = {
  admin: NAV_ADMIN,
  staff: NAV_STAFF,
  corporate_user: NAV_CORPORATE,
  super_admin: NAV_SUPER,
}

export function hasPermission(user, perm) {
  if (!user) return false
  if (!perm) return true
  const list = user.permissions
  if (!Array.isArray(list) || list.length === 0) return true
  return list.includes(perm)
}

export function navItemFor(page) {
  for (const nav of [NAV_ADMIN, NAV_STAFF, NAV_CORPORATE, NAV_SUPER]) {
    const item = nav.find(i => i.id === page)
    if (item) return item
  }
  return null
}

export const PAGE_TITLES = {
  'admin-dashboard':    'Dashboard',
  'admin-orders':       'Order Management',
  'admin-deliveries':   'Delivery Management',
  'admin-coordinator':  "Today's Deliveries",
  'admin-invoices':     'Payment & Invoicing',
  'admin-refunds':      'Refunds',
  'admin-corporates':   'Corporate Clients',
  'admin-products':     'Product Catalog',
  'admin-reports':      'Reports & Analytics',
  'admin-occasions':    'Occasions & Calendar',
  'admin-feedback':     'Feedback & Ratings',
  'admin-discounts':    'Discounts & Promotions',
  'admin-tickets':      'Support Tickets',
  'admin-inventory':    'Inventory Management',
  'admin-notif-prefs':  'Notification Preferences',
  'admin-templates':    'Email Templates',
  'admin-logs':         'Login Logs',
  'admin-email-logs':   'Email Logs',
  'admin-import-export':'Data Import & Export',
  'admin-users':        'Admin Users',
  'admin-roles':        'Roles & Permissions',
  'admin-settings':     'System Settings',
  'corp-dashboard':     'Corporate Dashboard',
  'corp-orders':        'My Orders',
  'corp-place-order':   'Place New Order',
  'corp-invoices':      'Invoices',
  'corp-staff':         'Staff Management',
  'corp-occasions':     'Occasions & Calendar',
  'corp-users':         'Manage Users',
  'corp-tickets':       'Support Tickets',
  'corp-feedback':      'Feedback',
  'corp-notif-prefs':   'Notification Settings',
  'sa-businesses':      'Businesses',
  'sa-subscriptions':   'Subscriptions',
  'sa-roles':           'Roles & Permissions',
  'sa-logs':            'Platform Logs',
}

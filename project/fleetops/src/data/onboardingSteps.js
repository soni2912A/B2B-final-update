// Role-keyed onboarding walkthrough steps. Each step is a { icon, title,
// body, goTo? } — `goTo` navigates to the named page after the final Next
// (optional; steps can be informational without a destination).
//
// Keeping this in a dedicated data file makes it easy to tune copy without
// touching the component, and to add roles later (e.g. finance, read-only).

export const ONBOARDING_STEPS = {
  super_admin: [
    {
      icon: '🏗️',
      title: 'Welcome, Super Admin',
      body: 'You manage every tenant on the platform. Start by seeing the businesses that have signed up.',
      goTo: 'sa-businesses',
    },
    {
      icon: '💎',
      title: 'Subscription Plans',
      body: 'Create or edit the plans that new admins choose when they register. Plans you create here appear on the self-registration page immediately.',
      goTo: 'sa-subscriptions',
    },
    {
      icon: '🛡️',
      title: 'Roles & Permissions',
      body: 'Define system-wide role templates (e.g. "Delivery Coordinator"). Admins can use them across their own team.',
      goTo: 'sa-roles',
    },
  ],

  admin: [
    {
      icon: '◈',
      title: 'Welcome to your dashboard',
      body: "Here's your daily ops view — recent orders, deliveries in motion, and quick actions.",
      goTo: 'admin-dashboard',
    },
    {
      icon: '📋',
      title: 'Manage Orders',
      body: 'Every order corporate clients place lands here. Assign delivery staff, send reminders, track status through the state machine.',
      goTo: 'admin-orders',
    },
    {
      icon: '📦',
      title: 'Product Catalog',
      body: 'Add products, manage pricing tiers, and bulk-import via CSV. Use inline editing in the list view to update price or stock on the fly.',
      goTo: 'admin-products',
    },
    {
      icon: '🚚',
      title: 'Deliveries + Proof Capture',
      body: 'Track each delivery step-by-step, capture proof-of-delivery photos, and handle failed attempts with retries. Coordinators use the "Today\'s Deliveries" view for one-click updates.',
      goTo: 'admin-deliveries',
    },
    {
      icon: '👥',
      title: 'Team & Access',
      body: 'Invite staff members and assign Access Roles (from the Roles page) to control which modules each person can use.',
      goTo: 'admin-users',
    },
  ],

  staff: [
    {
      icon: '📍',
      title: 'Today at a glance',
      body: 'Your daily delivery queue lives here. Pending, completed, and failed — all grouped on one screen.',
      goTo: 'admin-coordinator',
    },
    {
      icon: '📋',
      title: 'Orders assigned to you',
      body: 'Open an order, update its status, and capture proof once delivered. Admin sees every change in real time.',
      goTo: 'admin-orders',
    },
    {
      icon: '🚚',
      title: 'Full delivery list',
      body: 'Need to look up an older delivery or reschedule a failed attempt? The Deliveries page has the full history.',
      goTo: 'admin-deliveries',
    },
  ],

  corporate_user: [
    {
      icon: '◈',
      title: 'Welcome!',
      body: 'Your corporate dashboard shows upcoming deliveries, recent orders, and staff occasions at a glance.',
      goTo: 'corp-dashboard',
    },
    {
      icon: '➕',
      title: 'Place an order',
      body: 'Pick recipients from your staff list, browse gift products, schedule a delivery date, and apply coupons — all in one flow.',
      goTo: 'corp-place-order',
    },
    {
      icon: '📋',
      title: 'Track your orders',
      body: 'Watch each order move from placed → scheduled → out for delivery → delivered. You\'ll get email updates at each step.',
      goTo: 'corp-orders',
    },
    {
      icon: '👥',
      title: 'Manage staff',
      body: 'Upload your team roster (CSV or Excel) to unlock bulk gifting. Filter by department when placing orders.',
      goTo: 'corp-staff',
    },
  ],
}

// Storage key is scoped per user — same browser, different accounts means
// different onboarding state.
export const onboardingKey = (userId) => `onboarding:completed:${userId || 'anon'}`

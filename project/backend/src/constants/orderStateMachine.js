// Single source of truth for order status transitions.
// Exported to the frontend via GET /admin/orders/state-machine so the two sides
// never drift. Any edit here propagates on the next page load.

const ORDER_STATE_MACHINE = {
  new:               ['scheduled', 'processing', 'cancelled'],
  scheduled:         ['processing', 'cancelled'],
  processing:        ['assigned', 'cancelled'],
  assigned:          ['out_for_delivery', 'cancelled'],
  out_for_delivery:  ['delivered', 'cancelled'],
  delivered:         [],  // terminal
  cancelled:         [],  // terminal
};

const ALL_ORDER_STATUSES = [
  'new', 'scheduled', 'processing', 'assigned',
  'out_for_delivery', 'delivered', 'cancelled',
];

// Helper — given a current status and a proposed next, returns the legal array
// for error messaging. Returns { legal: string[], isLegal: boolean }.
const checkTransition = (from, to) => {
  const legal = ORDER_STATE_MACHINE[from] || [];
  return { legal, isLegal: legal.includes(to) };
};

// Formats the rejection message per spec — identical message from anywhere the
// check fires so client and logs align.
const illegalTransitionMessage = (from, to) => {
  const legal = ORDER_STATE_MACHINE[from] || [];
  const legalText = legal.length ? legal.join(', ') : 'none (terminal)';
  return `Cannot transition from '${from}' to '${to}'. Legal next statuses from '${from}': ${legalText}.`;
};

module.exports = {
  ORDER_STATE_MACHINE,
  ALL_ORDER_STATUSES,
  checkTransition,
  illegalTransitionMessage,
};

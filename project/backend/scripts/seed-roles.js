// Idempotent seed for built-in system roles.
// Safe to re-run — existing roles with the same (scope='system', name) are left
// untouched; only missing ones are created. `builtin: true` marks them so the
// API refuses to delete them.
require('dotenv').config();

(async () => {
  const { connectDB } = require('../src/config/db');
  await connectDB();

  const Role = require('../src/models/Role.model');

  const BUILTIN_ROLES = [
    {
      name: 'Delivery Coordinator',
      description: 'Oversees deliveries end-to-end: scheduling, proof capture, failed-delivery retries.',
      permissions: [
        'orders:view',
        'deliveries:view',
        'deliveries:update',
        'deliveries:proof',
        'staff:view',
      ],
    },
    {
      name: 'Order Manager',
      description: 'Creates, assigns, and cancels orders; views invoices and corporates.',
      permissions: [
        'orders:view',
        'orders:create',
        'orders:update',
        'orders:assign',
        'orders:cancel',
        'orders:export',
        'deliveries:view',
        'products:view',
        'corporates:view',
        'invoices:view',
        'staff:view',
      ],
    },
  ];

  let created = 0, kept = 0;
  for (const spec of BUILTIN_ROLES) {
    const existing = await Role.findOne({ scope: 'system', name: spec.name });
    if (existing) {
      kept++;
      continue;
    }
    await Role.create({
      ...spec,
      scope: 'system',
      business: null,
      builtin: true,
    });
    created++;
    console.log(`  created built-in role: ${spec.name}`);
  }

  console.log(`seed-roles done — created ${created}, kept ${kept}.`);
  process.exit(0);
})().catch(err => {
  console.error('seed-roles failed:', err);
  process.exit(1);
});

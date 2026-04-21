require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { connectDB } = require('./db');

const User = require('../models/User.model');
const Business = require('../models/Business.model');
const Corporate = require('../models/Corporate.model');
const Product = require('../models/Product.model');
const Subscription = require('../models/Subscription.model');

const seed = async () => {
  await connectDB();
  console.log('Connected. Seeding...');

  // ─── Subscription catalog ──────────────────────────────────────────────────
  // Shared plan-catalog entries (business: null = catalog, not per-tenant).
  // Businesses reference plans by name via case-insensitive Subscription.findOne
  // in createBusiness — don't change these names without updating that lookup.
  //
  // Convention: `null` on a quota field means UNLIMITED. The UI renders null/
  // undefined as "Unlimited"; enforcement code (when built) must check
  // `limit != null && count >= limit` before rejecting. Numeric 0 would display
  // literally as "0", which is valid but not what Enterprise wants.
  const PLAN_CATALOG = [
    {
      name: 'Starter',
      price: 49,
      billingCycle: 'monthly',
      maxCorporates: 5,
      maxStaffPerCorporate: 10,
      maxOrders: 100,
      features: ['core_modules', 'email_support', 'basic_reports'],
      business: null,
      status: 'active',
    },
    {
      name: 'Professional',
      price: 149,
      billingCycle: 'monthly',
      maxCorporates: 20,
      maxStaffPerCorporate: 50,
      maxOrders: 500,
      features: ['all_modules', 'priority_support', 'advanced_reports', 'api_access'],
      business: null,
      status: 'active',
    },
    {
      name: 'Enterprise',
      price: 399,
      billingCycle: 'monthly',
      maxCorporates: null,          // unlimited
      maxStaffPerCorporate: null,   // unlimited
      maxOrders: null,              // unlimited
      features: ['everything_in_pro', 'dedicated_support', 'custom_integrations', 'sla_guarantee'],
      business: null,
      status: 'active',
    },
  ];

  const existingPlans = await Subscription.find({
    business: null,
    name: { $in: PLAN_CATALOG.map(p => p.name) },
  }).select('name').lean();
  const existingNames = new Set(existingPlans.map(p => p.name));
  const missingPlans = PLAN_CATALOG.filter(p => !existingNames.has(p.name));

  if (missingPlans.length === 0) {
    console.log('Subscription plans already seeded. Skipping.');
  } else {
    await Subscription.insertMany(missingPlans);
    console.log(`Seeded ${missingPlans.length} subscription plan${missingPlans.length === 1 ? '' : 's'}.`);
  }

  // ─── Fixtures (idempotent) ─────────────────────────────────────────────────
  // Each create is guarded by a findOne — re-running seed after test data has
  // built up will skip every fixture and leave everything intact.

  const superAdmin = await User.findOne({ email: 'superadmin@fleet.com' })
    || await User.create({
      name: 'Super Admin',
      email: 'superadmin@fleet.com',
      password: 'Admin@1234',
      role: 'super_admin',
      isActive: true,
    });
  console.log('Super admin:', superAdmin.email);

  let business = await Business.findOne({ email: 'admin@acme.com' });
  const businessIsNew = !business;
  if (businessIsNew) {
    business = await Business.create({
      name: 'Acme Logistics',
      email: 'admin@acme.com',
      phone: '9000000001',
      currency: 'INR',
      taxRate: 18,
      invoicePrefix: 'ACM',
    });
  }

  // Assign the seeded business to Professional only on first create — don't
  // overwrite a human-chosen plan on subsequent runs.
  if (businessIsNew) {
    const professional = await Subscription.findOne({ name: 'Professional', business: null });
    if (professional) {
      await Business.findByIdAndUpdate(business._id, { subscription: professional._id });
    }
  }

  const admin = await User.findOne({ email: 'admin@acme.com' })
    || await User.create({
      name: 'Acme Admin',
      email: 'admin@acme.com',
      password: 'Admin@1234',
      role: 'admin',
      business: business._id,
      isActive: true,
    });
  console.log('Admin:', admin.email);

  let corporate = await Corporate.findOne({ email: 'ravi@techcorp.com' });
  if (!corporate) {
    corporate = await Corporate.create({
      business: business._id,
      companyName: 'TechCorp Pvt Ltd',
      contactPerson: 'Ravi Kumar',
      email: 'ravi@techcorp.com',
      phone: '9000000002',
      status: 'active',
    });
  }

  const corpUser = await User.findOne({ email: 'ravi@techcorp.com' })
    || await User.create({
      name: 'Ravi Kumar',
      email: 'ravi@techcorp.com',
      password: 'Corp@1234',
      role: 'corporate_user',
      business: business._id,
      corporate: corporate._id,
      isActive: true,
    });
  console.log('Corporate user:', corpUser.email);

  const productSeeds = [
    { business: business._id, name: 'Gift Hamper - Premium',  sku: 'GH-001', basePrice: 1500, stockQuantity: 100, category: 'Gifts',   unit: 'pcs', taxRate: 12 },
    { business: business._id, name: 'Cake - Chocolate 1kg',   sku: 'CK-001', basePrice: 850,  stockQuantity: 50,  category: 'Bakery',  unit: 'pcs', taxRate: 5  },
    { business: business._id, name: 'Bouquet - Mixed Flowers',sku: 'BQ-001', basePrice: 600,  stockQuantity: 75,  category: 'Flowers', unit: 'pcs', taxRate: 0  },
    { business: business._id, name: 'Dry Fruits Box',         sku: 'DF-001', basePrice: 1200, stockQuantity: 200, category: 'Food',    unit: 'pcs', taxRate: 5  },
  ];
  for (const p of productSeeds) {
    const exists = await Product.findOne({ sku: p.sku, business: business._id });
    if (!exists) await Product.create(p);
  }
  console.log('Products checked.');

  console.log('\n=== SEED COMPLETE ===');
  console.log('Super Admin  → superadmin@fleet.com / Admin@1234');
  console.log('Admin        → admin@acme.com / Admin@1234');
  console.log('Corp User    → ravi@techcorp.com / Corp@1234');
  process.exit(0);
};

seed().catch(err => { console.error(err); process.exit(1); });

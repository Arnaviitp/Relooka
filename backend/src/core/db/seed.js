const User = require('../../modules/users/user.model');
const Hub = require('../../modules/hubs/hub.model');
const Listing = require('../../modules/listings/listing.model');

async function seedDatabase() {
  const existingUsers = await User.countDocuments();
  if (existingUsers > 0) {
    return; // Already seeded
  }

  console.log('[Seeder] Seeding initial zero-budget LoopWear dataset...');

  // 1. Seed Partner Laundry Hubs
  const hubMumbai = await Hub.create({
    name: 'LoopWear Hub Bandra',
    code: 'BOM-01',
    partnerLaundryName: 'CleanWaves Eco Drycleaners',
    address: 'Shop 12, Linking Road, Bandra West',
    city: 'Mumbai',
    pincode: '400050',
    contactPhone: '+919820011223'
  });

  const hubDelhi = await Hub.create({
    name: 'LoopWear Hub South Extension',
    code: 'DEL-01',
    partnerLaundryName: 'Capital Garment Sanitizers',
    address: 'E-42, South Extension Part 2',
    city: 'New Delhi',
    pincode: '110049',
    contactPhone: '+919811122334'
  });

  // 2. Seed Users across all 5 account types
  const admin = new User({
    name: 'LoopWear Super Admin',
    email: 'admin1@loopwear.in',
    phone: '+919000000001',
    password: 'AdminPassword123!',
    role: 'admin',
    capabilities: ['renter', 'lender'],
    emailVerified: true,
    phoneVerified: true,
    tier: 'Diamond',
    tierScore: 450,
    loopWearScore: 5.0
  });
  await admin.save();

  const lender = new User({
    name: 'Anita Lakhotia',
    email: 'anita@example.com',
    phone: '+919876543201',
    password: 'Password123!',
    role: 'user',
    capabilities: ['lender', 'renter'],
    emailVerified: true,
    phoneVerified: true,
    tier: 'Platinum',
    tierScore: 240,
    loopWearScore: 4.8,
    feedbackScoreAverage: 4.9,
    feedbackCount: 12
  });
  lender.setIdVerificationDetails({
    idType: 'aadhaar',
    rawIdNumber: '998877665544',
    nameAsPrinted: 'Anita Lakhotia',
    consentGiven: true
  });
  lender.idVerification.status = 'verified';
  lender.idVerification.verifiedAt = new Date();
  await lender.save();

  const renter = new User({
    name: 'Rohan Verma',
    email: 'rohan@rent.in',
    phone: '+919999000001',
    password: 'Password123!',
    role: 'user',
    capabilities: ['renter'],
    emailVerified: true,
    phoneVerified: true,
    tier: 'Gold',
    tierScore: 85,
    loopWearScore: 4.2,
    feedbackScoreAverage: 4.8,
    feedbackCount: 6
  });
  renter.setIdVerificationDetails({
    idType: 'voter_card',
    rawIdNumber: 'ABC1239876',
    nameAsPrinted: 'Rohan Verma',
    consentGiven: true
  });
  renter.idVerification.status = 'verified';
  await renter.save();

  const hubStaff = new User({
    name: 'Ramesh Hub Manager',
    email: 'ramesh@hub.in',
    phone: '+919876543203',
    password: 'StaffPassword123!',
    role: 'hub_staff',
    assignedHubId: hubMumbai._id,
    emailVerified: true,
    phoneVerified: true
  });
  await hubStaff.save();

  const deliveryAgent = new User({
    name: 'Vikram Singh',
    email: 'vikram@delivery.in',
    phone: '+919999000005',
    password: 'Password123!',
    role: 'delivery_agent',
    emailVerified: true,
    phoneVerified: true
  });
  await deliveryAgent.save();

  // 3. Seed Verified Active Listings
  const sampleListings = [
    {
      title: 'Sabyasachi Heritage Silk Anarkali',
      description: 'Authentic pure silk designer anarkali with intricate marodi hand embroidery and organza dupatta. Professionally sanitized after every wear.',
      category: 'clothes',
      occasionTags: ['wedding', 'date_night'],
      brand: 'Sabyasachi',
      size: 'M',
      color: 'Blush Rose Gold',
      condition: 'like_new',
      retailPrice: 65000,
      dailyRent: 2800,
      photos: [
        'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800&auto=format&fit=crop&q=80'
      ],
      status: 'active',
      isVerified: true,
      verifiedAt: new Date(),
      qc1: { passed: true, checkedAt: new Date(), notes: 'Pickup inspection cleared' },
      qc2: { passed: true, checkedAt: new Date(), notes: 'Intake and sanitize check cleared' },
      pickupAddress: { street: '14 Pali Hill', city: 'Mumbai', pincode: '400050' },
      assignedHubId: hubMumbai._id
    },
    {
      title: 'Raymond Royal Velvet Bandhgala Tuxedo',
      description: 'Italian tailored velvet bandhgala with satin piping and engraved metal buttons. Ideal for formal receptions, black-tie galas, and sangeet ceremonies.',
      category: 'suits',
      occasionTags: ['wedding', 'prom_night'],
      brand: 'Raymond Made to Measure',
      size: '40R',
      color: 'Deep Midnight Navy',
      condition: 'like_new',
      retailPrice: 28000,
      dailyRent: 1600,
      photos: [
        'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&auto=format&fit=crop&q=80'
      ],
      status: 'active',
      isVerified: true,
      verifiedAt: new Date(),
      qc1: { passed: true, checkedAt: new Date() },
      qc2: { passed: true, checkedAt: new Date() },
      pickupAddress: { street: '22 Turner Road', city: 'Mumbai', pincode: '400050' },
      assignedHubId: hubMumbai._id
    },
    {
      title: 'Tarun Tahiliani Draped Cocktail Gown',
      description: 'Signature concept saree-gown with sculpted bodice and fluid jersey drape. A showstopper for date nights and cocktail evenings.',
      category: 'clothes',
      occasionTags: ['date_night', 'prom_night'],
      brand: 'Tarun Tahiliani',
      size: 'S',
      color: 'Crimson Emerald',
      condition: 'brand_new',
      retailPrice: 42000,
      dailyRent: 2200,
      photos: [
        'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800&auto=format&fit=crop&q=80'
      ],
      status: 'active',
      isVerified: true,
      verifiedAt: new Date(),
      qc1: { passed: true, checkedAt: new Date() },
      qc2: { passed: true, checkedAt: new Date() },
      pickupAddress: { street: '45 Bandra West', city: 'Mumbai', pincode: '400050' },
      assignedHubId: hubMumbai._id
    },
    {
      title: 'Canali Luxury Formal Tailored Trousers',
      description: 'Super 150s virgin wool classic flat-front trousers with refined drape. Clean-cut sophistication for formal and smart casual events.',
      category: 'pants',
      occasionTags: ['casual', 'prom_night'],
      brand: 'Canali',
      size: '34',
      color: 'Charcoal Grey',
      condition: 'like_new',
      retailPrice: 18000,
      dailyRent: 850,
      photos: [
        'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800&auto=format&fit=crop&q=80'
      ],
      status: 'active',
      isVerified: true,
      verifiedAt: new Date(),
      qc1: { passed: true, checkedAt: new Date() },
      qc2: { passed: true, checkedAt: new Date() },
      pickupAddress: { street: '14 Pali Hill', city: 'Mumbai', pincode: '400050' },
      assignedHubId: hubMumbai._id
    },
    {
      title: 'Tissot Gentleman Powermatic 80 Watch',
      description: 'Swiss automatic timepiece with sunburst blue dial, stainless steel bracelet, and 80-hour power reserve. Inspected and timed by partner hub horologist.',
      category: 'watches',
      occasionTags: ['wedding', 'date_night', 'prom_night'],
      brand: 'Tissot',
      size: '40mm',
      color: 'Silver / Blue Dial',
      condition: 'like_new',
      retailPrice: 72000,
      dailyRent: 1950,
      photos: [
        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80'
      ],
      status: 'active',
      isVerified: true,
      verifiedAt: new Date(),
      qc1: { passed: true, checkedAt: new Date() },
      qc2: { passed: true, checkedAt: new Date() },
      pickupAddress: { street: '14 Pali Hill', city: 'Mumbai', pincode: '400050' },
      assignedHubId: hubMumbai._id
    }
  ];

  for (const item of sampleListings) {
    await Listing.create({
      ...item,
      lenderId: lender._id
    });
  }

  console.log('[Seeder] Database successfully seeded with 5 users, 2 hubs, and 5 active listings!');
}

module.exports = { seedDatabase };

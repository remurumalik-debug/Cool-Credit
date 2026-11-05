import nextEnv from '@next/env';
import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/coolcredit';

async function seed() {
  console.log('Connecting to MongoDB at:', uri);
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(process.env.MONGODB_DB_NAME || 'coolcredit');

  console.log('Clearing existing demo collections...');
  await db.collection('users').deleteMany({});
  await db.collection('trainings').deleteMany({});
  await db.collection('recoveries').deleteMany({});
  await db.collection('payouts').deleteMany({});
  await db.collection('collectionPoints').deleteMany({});
  await db.collection('equipment').deleteMany({});
  await db.collection('shipments').deleteMany({});
  await db.collection('readiness').deleteMany({});
  await db.collection('auditLog').deleteMany({});

  const now = new Date().toISOString();
  const salt = await bcrypt.genSalt(10);
  const adminHash = await bcrypt.hash('AdminPass123!', salt);
  const opHash = await bcrypt.hash('OperatorPass123!', salt);
  const techHash = await bcrypt.hash('TechPass123!', salt);
  const regHash = await bcrypt.hash('RegulatorPass123!', salt);
  const fundHash = await bcrypt.hash('FunderPass123!', salt);

  console.log('Seeding collection points...');
  const cpRes = await db.collection('collectionPoints').insertOne({
    name: 'Lokoja Central Hub',
    address: 'Plot 14, Ganaja Junction Industrial Layout, Lokoja, Kogi State',
    capacity: 100,
    operatorIds: [],
    active: true,
  });
  const cpId = cpRes.insertedId.toString();

  console.log('Seeding equipment with calibration dates...');
  await db.collection('equipment').insertMany([
    {
      type: 'Scale',
      serial: 'SCALE-LKJ-001',
      owner: 'Quantro Software Labs',
      holder: 'Lokoja Central Hub',
      calibrationDue: '2027-05-15T00:00:00.000Z',
      status: 'calibrated',
    },
    {
      type: 'Refrigerant Identifier',
      serial: 'RID-ULTIMA-04',
      owner: 'Quantro Software Labs',
      holder: 'Lokoja Central Hub',
      calibrationDue: '2027-06-01T00:00:00.000Z',
      status: 'calibrated',
    },
    {
      type: 'Recovery Machine',
      serial: 'REC-PROM-09',
      owner: 'NARAP Kogi State Chapter',
      holder: 'Musa Ibrahim Workshop',
      calibrationDue: '2027-04-10T00:00:00.000Z',
      status: 'calibrated',
    },
  ]);

  console.log('Seeding users...');
  const adminRes = await db.collection('users').insertOne({
    name: 'Dr. Aliyu Mohammed (Quantro Lead)',
    email: 'admin@coolcredit.ng',
    phone: '08031234567',
    role: 'admin',
    hash: adminHash,
    active: true,
    eligible: true,
    consentAt: now,
    createdAt: now,
  });

  const opRes = await db.collection('users').insertOne({
    name: 'Fatima Bello (Hub Operator)',
    email: 'operator@coolcredit.ng',
    phone: '08029876543',
    role: 'operator',
    hash: opHash,
    active: true,
    eligible: true,
    consentAt: now,
    createdAt: now,
  });

  // Attach operator to collection point
  await db.collection('collectionPoints').updateOne(
    { _id: cpRes.insertedId },
    { $set: { operatorIds: [opRes.insertedId.toString()] } }
  );

  const tech1Res = await db.collection('users').insertOne({
    name: 'Musa Ibrahim (Certified RAC Tech)',
    email: 'tech1@coolcredit.ng',
    phone: '08123456789',
    role: 'technician',
    hash: techHash,
    bank: {
      bankName: 'First Bank of Nigeria',
      accountNumber: '3089456123',
      accountName: 'Musa Ibrahim',
    },
    location: 'Ganaja Village, Lokoja',
    active: true,
    eligible: true, // Certified & eligible
    consentAt: now,
    createdAt: now,
  });

  const tech2Res = await db.collection('users').insertOne({
    name: 'Emeka Okafor (New Apprentice Tech)',
    email: 'tech2@coolcredit.ng',
    phone: '08198765432',
    role: 'technician',
    hash: techHash,
    bank: {
      bankName: 'Zenith Bank',
      accountNumber: '2119004512',
      accountName: 'Emeka Okafor',
    },
    location: 'Felele, Lokoja',
    active: true,
    eligible: false, // Ineligible pending training review
    consentAt: now,
    createdAt: now,
  });

  await db.collection('users').insertOne({
    name: 'National Ozone Officer (Regulator)',
    email: 'regulator@noo.gov.ng',
    phone: '08091122334',
    role: 'regulator',
    hash: regHash,
    active: true,
    eligible: true,
    consentAt: now,
    createdAt: now,
  });

  await db.collection('users').insertOne({
    name: 'Multilateral Fund Representative',
    email: 'funder@greenclimate.org',
    phone: '08077665544',
    role: 'funder',
    hash: fundHash,
    active: true,
    eligible: true,
    consentAt: now,
    createdAt: now,
  });

  console.log('Seeding training records...');
  await db.collection('trainings').insertOne({
    userId: tech1Res.insertedId.toString(),
    techName: 'Musa Ibrahim (Certified RAC Tech)',
    date: '2026-09-12',
    trainer: 'NARAP Master Instructor Engr. Sanusi',
    chapter: 'NARAP Kogi State Chapter',
    certificateRef: 'NARAP-KG-2026-0442',
    status: 'certified',
    updatedAt: now,
  });

  console.log('Seeding initial recovery cylinders & payouts...');
  // Cylinder 1: Verified and payout pending
  const cyl1Res = await db.collection('recoveries').insertOne({
    code: 'CCL-LKJ-0001',
    techId: tech1Res.insertedId.toString(),
    techName: 'Musa Ibrahim (Certified RAC Tech)',
    equipment: 'Split AC',
    gasLogged: 'R-22',
    gas: 'R-22',
    estGrams: 2200,
    weightGrams: 2350,
    location: {
      text: 'Zone 4 Workshop, Ganaja, Lokoja',
      lat: 7.8012,
      lng: 6.7415,
      accuracy: 8,
    },
    photos: [
      { url: '/mock-cyl-1.jpg', type: 'cylinder', caption: 'Certified yellow/gray recovery tank' },
      { url: '/mock-unit-1.jpg', type: 'equipment', caption: 'Split AC condenser nameplate' },
    ],
    collectionPointId: cpId,
    status: 'verified',
    flags: [],
    events: [
      { at: '2026-10-28T09:15:00.000Z', by: tech1Res.insertedId.toString(), role: 'technician', type: 'RECOVERED', note: 'Recovered during 2.5HP split unit de-installation' },
      { at: '2026-10-28T14:30:00.000Z', by: opRes.insertedId.toString(), role: 'operator', type: 'VERIFIED', note: 'Weighed on Scale #001 (2.35 kg net). Refrigerant identifier confirmed R-22 (99.2% purity).' },
    ],
    createdAt: '2026-10-28T09:15:00.000Z',
    updatedAt: '2026-10-28T14:30:00.000Z',
  });

  // Payout for Cylinder 1: Pending transfer
  // 2350 grams * 450000 kobo / 1000 = 1,057,500 kobo (₦10,575.00)
  await db.collection('payouts').insertOne({
    recId: cyl1Res.insertedId.toString(),
    code: 'CCL-LKJ-0001',
    techId: tech1Res.insertedId.toString(),
    techName: 'Musa Ibrahim (Certified RAC Tech)',
    grams: 2350,
    rateKobo: 450000,
    amountKobo: 1057500,
    status: 'pending',
    bank: {
      bankName: 'First Bank of Nigeria',
      accountNumber: '3089456123',
      accountName: 'Musa Ibrahim',
    },
    createdAt: '2026-10-28T14:30:00.000Z',
  });

  // Cylinder 2: Recovered, waiting in operator queue
  await db.collection('recoveries').insertOne({
    code: 'CCL-LKJ-0002',
    techId: tech1Res.insertedId.toString(),
    techName: 'Musa Ibrahim (Certified RAC Tech)',
    equipment: 'Cold room',
    gasLogged: 'R-410A',
    estGrams: 4500,
    location: {
      text: 'New Market Road, Lokoja',
      lat: 7.795,
      lng: 6.732,
      accuracy: 12,
    },
    photos: [
      { url: '/mock-cyl-2.jpg', type: 'cylinder', caption: 'Pink recovery cylinder' },
    ],
    status: 'recovered',
    flags: [],
    events: [
      { at: '2026-10-29T11:00:00.000Z', by: tech1Res.insertedId.toString(), role: 'technician', type: 'RECOVERED', note: 'Evacuated from seafood cold room condenser repair' },
    ],
    createdAt: '2026-10-29T11:00:00.000Z',
    updatedAt: '2026-10-29T11:00:00.000Z',
  });

  // Cylinder 3: Verified and Paid
  const cyl3Res = await db.collection('recoveries').insertOne({
    code: 'CCL-LKJ-0003',
    techId: tech1Res.insertedId.toString(),
    techName: 'Musa Ibrahim (Certified RAC Tech)',
    equipment: 'Refrigerator',
    gasLogged: 'R-134a',
    gas: 'R-134a',
    estGrams: 900,
    weightGrams: 950,
    location: {
      text: 'Lokongoma Phase II, Lokoja',
      lat: 7.812,
      lng: 6.748,
      accuracy: 5,
    },
    photos: [
      { url: '/mock-cyl-3.jpg', type: 'cylinder', caption: 'Blue recovery tank' },
    ],
    collectionPointId: cpId,
    status: 'verified',
    flags: [],
    events: [
      { at: '2026-10-25T10:00:00.000Z', by: tech1Res.insertedId.toString(), role: 'technician', type: 'RECOVERED', note: 'Domestic double-door freezer decommissioning' },
      { at: '2026-10-25T16:00:00.000Z', by: opRes.insertedId.toString(), role: 'operator', type: 'VERIFIED', note: 'Tested 98.8% R-134a purity. Net 0.95 kg.' },
      { at: '2026-10-26T12:00:00.000Z', by: adminRes.insertedId.toString(), role: 'admin', type: 'PAID', note: 'Bank transfer executed. Ref: NIP/FBN/20261026/894102' },
    ],
    createdAt: '2026-10-25T10:00:00.000Z',
    updatedAt: '2026-10-26T12:00:00.000Z',
  });

  // 950 grams * 450000 kobo / 1000 = 427,500 kobo (₦4,275.00)
  await db.collection('payouts').insertOne({
    recId: cyl3Res.insertedId.toString(),
    code: 'CCL-LKJ-0003',
    techId: tech1Res.insertedId.toString(),
    techName: 'Musa Ibrahim (Certified RAC Tech)',
    grams: 950,
    rateKobo: 450000,
    amountKobo: 427500,
    status: 'paid',
    bank: {
      bankName: 'First Bank of Nigeria',
      accountNumber: '3089456123',
      accountName: 'Musa Ibrahim',
    },
    reference: 'NIP/FBN/20261026/894102',
    paidAt: '2026-10-26T12:00:00.000Z',
    paidBy: adminRes.insertedId.toString(),
    createdAt: '2026-10-25T16:00:00.000Z',
  });

  // Cylinder 4: Rejected cylinder
  await db.collection('recoveries').insertOne({
    code: 'CCL-LKJ-0004',
    techId: tech1Res.insertedId.toString(),
    techName: 'Musa Ibrahim (Certified RAC Tech)',
    equipment: 'Vehicle AC',
    gasLogged: 'R-134a',
    estGrams: 1500,
    weightGrams: 1480,
    location: {
      text: 'Kogi State Polytechnic Area, Lokoja',
      lat: 7.785,
      lng: 6.721,
      accuracy: 10,
    },
    photos: [],
    collectionPointId: cpId,
    status: 'rejected',
    rejectionReason: 'Severe cross-contamination detected by identifier (mixture of R-22, R-134a, and non-condensable air). Unacceptable for standard recovery credit.',
    flags: [
      {
        code: 'CONTAMINATED_GAS',
        severity: 'high',
        message: 'Identifier reported cross-contamination < 80% single gas type.',
        detectedAt: '2026-10-27T15:10:00.000Z',
      },
    ],
    events: [
      { at: '2026-10-27T11:00:00.000Z', by: tech1Res.insertedId.toString(), role: 'technician', type: 'RECOVERED', note: 'Recovered from bus air-con recharge' },
      { at: '2026-10-27T15:10:00.000Z', by: opRes.insertedId.toString(), role: 'operator', type: 'REJECTED', note: 'Rejected: Contaminated mixed refrigerant.' },
    ],
    createdAt: '2026-10-27T11:00:00.000Z',
    updatedAt: '2026-10-27T15:10:00.000Z',
  });

  console.log('Seeding initial readiness dashboard...');
  await db.collection('readiness').insertOne({
    evaluatedAt: now,
    evaluatedBy: 'Quantro Project Lead',
    hardStops: [
      {
        id: 1,
        title: 'Legal Entity Registration',
        description: 'Quantro Software Labs registered as a legal entity with CAC Nigeria.',
        isSatisfied: false,
        notes: 'Registration in progress with CAC.',
      },
      {
        id: 2,
        title: 'Written Regulatory Position',
        description: 'Written regulatory position from National Ozone Office (NOO) / NESREA on handler registration, permits and storage.',
        isSatisfied: false,
        notes: 'Submitted proposal 27 Oct 2026; no permit or endorsement issued yet.',
      },
      {
        id: 3,
        title: 'Named, Written-Accepted Destinations',
        description: 'Named, written-accepted destination for each cylinder category (reclamation vs destruction).',
        isSatisfied: false,
        notes: 'Subject to NOO guidance; cement kiln co-processing under review.',
      },
      {
        id: 4,
        title: 'Committed Funding',
        description: 'Funds in hand or contractually committed for technician payments, logistics, and disposal.',
        isSatisfied: false,
        notes: 'Funding unsecured; grant discussions ongoing.',
      },
      {
        id: 5,
        title: 'Compliant Storage & Insurance',
        description: 'Compliant collection storage, dangerous goods transport protocols, and insurance in place.',
        isSatisfied: false,
        notes: 'Site inspection completed in Lokoja; policy binding pending.',
      },
    ],
    scores: [
      { id: 'regulatory_clarity', title: 'Regulatory Clarity', maxWeight: 20, rating: 1, notes: 'Proposal submitted; await official review.' },
      { id: 'disposal_route', title: 'Disposal & Reclamation Route', maxWeight: 20, rating: 1, notes: 'Discussion with regional kiln operators in Kogi.' },
      { id: 'funding_secured', title: 'Funding Secured', maxWeight: 20, rating: 1, notes: 'Pre-seed and climate grant proposals active.' },
      { id: 'unit_economics', title: 'Unit Economics Proven', maxWeight: 15, rating: 2, notes: 'Target payout ₦4,500/kg covers tech recovery cost.' },
      { id: 'technician_demand', title: 'Technician Demand', maxWeight: 10, rating: 3, notes: 'High enthusiasm from Lokoja RAC workshops.' },
      { id: 'delivery_capacity', title: 'Delivery Capacity', maxWeight: 10, rating: 2, notes: 'Technical team and field lead mobilized.' },
      { id: 'fraud_controls', title: 'Fraud & Data Controls', maxWeight: 5, rating: 4, notes: 'Hardware scales, gas identifiers & cryptographic custody audit implemented.' },
    ],
    overallStatus: 'Hold',
    totalScore: 36.25,
  });

  console.log('Seeding initial audit log...');
  await db.collection('auditLog').insertOne({
    at: now,
    actor: {
      id: adminRes.insertedId.toString(),
      name: 'System Seeder',
      role: 'admin',
    },
    action: 'SYSTEM_INITIALIZED',
    target: {
      type: 'system',
      id: 'coolcredit-lokoja-pilot',
    },
    beforeAfterSummary: 'Database initialized with verified demo data.',
  });

  console.log('Ensuring unique database indexes...');
  await db.collection('users').createIndex({ email: 1 }, { unique: true });
  await db.collection('recoveries').createIndex({ code: 1 }, { unique: true });
  await db.collection('recoveries').createIndex({ status: 1, createdAt: -1 });
  await db.collection('recoveries').createIndex({ techId: 1, createdAt: -1 });
  await db.collection('payouts').createIndex({ recId: 1 }, { unique: true });
  await db.collection('payouts').createIndex({ status: 1, createdAt: -1 });
  await db.collection('payouts').createIndex({ techId: 1, createdAt: -1 });
  await db.collection('auditLog').createIndex({ at: -1 });

  console.log('Seed completed successfully!');
  await client.close();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});

import nextEnv from '@next/env';
import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME || 'coolcredit';

if (!uri) {
  console.error('MONGODB_URI not set');
  process.exit(1);
}

const client = new MongoClient(uri, { serverSelectionTimeoutMS: 8000 });

async function run() {
  await client.connect();
  const db = client.db(dbName);

  const users = await db.collection('users').find({}, {
    projection: { name: 1, email: 1, role: 1, active: 1, hash: 1 }
  }).toArray();

  console.log(`\nFound ${users.length} users in database "${dbName}":\n`);

  for (const u of users) {
    console.log(`  Name : ${u.name}`);
    console.log(`  Email: ${u.email}`);
    console.log(`  Role : ${u.role}`);
    console.log(`  Active: ${u.active}`);
    console.log(`  Hash set: ${!!u.hash}`);

    // Test known passwords
    const passwordMap = {
      'admin@coolcredit.ng':    'AdminPass123!',
      'operator@coolcredit.ng': 'OperatorPass123!',
      'regulator@noo.gov.ng':   'RegulatorPass123!',
      'tech1@coolcredit.ng':    'TechPass123!',
      'tech2@coolcredit.ng':    'TechPass123!',
      'funder@greenclimate.org':'FunderPass123!',
    };

    const knownPass = passwordMap[u.email];
    if (knownPass && u.hash) {
      const valid = await bcrypt.compare(knownPass, u.hash);
      console.log(`  Password "${knownPass}" matches hash: ${valid ? '✅ YES' : '❌ NO'}`);
    }
    console.log('');
  }

  await client.close();
}

run().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});

import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';
import { getAtlasConfig } from './mongo-config.mjs';

let uri;
let dbName;
try {
  ({ uri, dbName } = getAtlasConfig());
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Invalid MongoDB Atlas configuration.');
  process.exit(1);
}

const client = new MongoClient(uri);

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
      console.log(`  Seeded credential matches hash: ${valid ? 'yes' : 'no'}`);
    }
    console.log('');
  }

  await client.close();
}

run().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});

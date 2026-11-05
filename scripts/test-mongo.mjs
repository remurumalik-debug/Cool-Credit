import fs from 'fs';
import path from 'path';
import { MongoClient } from 'mongodb';

let envContent = '';
try {
  envContent = fs.readFileSync(path.resolve(process.cwd(), '.env.local'), 'utf8');
} catch (e) {
  console.error('Could not read .env.local:', e.message);
  process.exit(1);
}

let uri = '';
let dbName = 'coolcredit';
for (const line of envContent.split(/\r?\n/)) {
  const trimmed = line.trim();
  if (trimmed.startsWith('MONGODB_URI=')) {
    uri = trimmed.slice('MONGODB_URI='.length).replace(/^['"]|['"]$/g, '');
  }
  if (trimmed.startsWith('MONGODB_DB_NAME=')) {
    dbName = trimmed.slice('MONGODB_DB_NAME='.length).replace(/^['"]|['"]$/g, '');
  }
}

console.log('=== MongoDB Connection Diagnostic ===');
if (!uri) {
  console.error('ERROR: MONGODB_URI is not set in .env.local');
  process.exit(1);
}

if (uri.includes('<') || uri.includes('>')) {
  console.log('CRITICAL: MONGODB_URI contains "<" or ">" brackets!');
  console.log('You must remove the < and > around your username and password.');
}

const client = new MongoClient(uri, { serverSelectionTimeoutMS: 8000 });

async function run() {
  try {
    await client.connect();
    console.log('SUCCESS: Successfully connected to MongoDB!');
    const db = client.db(dbName);
    const collections = await db.listCollections().toArray();
    console.log(`Database "${dbName}" collections:`, collections.map(c => c.name));
  } catch (err) {
    console.error('CONNECTION FAILED:');
    if (err.message && err.message.includes('alert internal error')) {
      console.error('Cause: MongoDB Atlas blocked this connection (TLS alert 80).');
      console.error('Reason: Your IP address is not whitelisted in MongoDB Atlas Network Access, or dynamic IP changed.');
    } else if (err.codeName === 'AtlasError' || (err.message && err.message.includes('Authentication failed'))) {
      console.error('Cause: Incorrect username or password.');
    } else {
      console.error(err.message);
    }
  } finally {
    await client.close().catch(() => {});
  }
}

run();

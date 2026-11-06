import { MongoClient } from 'mongodb';
import { getAtlasConfig } from './mongo-config.mjs';

console.log('=== MongoDB Connection Diagnostic ===');
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

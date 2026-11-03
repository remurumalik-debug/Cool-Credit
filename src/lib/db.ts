import { MongoClient, Db } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/coolcredit';
const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise;

export async function getDb(): Promise<Db> {
  const connectedClient = await clientPromise;
  return connectedClient.db();
}

/**
 * Initializes required unique indexes as specified in Section 7
 */
export async function ensureIndexes(): Promise<void> {
  try {
    const db = await getDb();
    
    // 1. Users: email unique
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    
    // 2. Recoveries: code unique, compound indexes
    await db.collection('recoveries').createIndex({ code: 1 }, { unique: true });
    await db.collection('recoveries').createIndex({ status: 1, createdAt: -1 });
    await db.collection('recoveries').createIndex({ techId: 1, createdAt: -1 });
    
    // 3. Payouts: recId unique
    await db.collection('payouts').createIndex({ recId: 1 }, { unique: true });
    await db.collection('payouts').createIndex({ status: 1, createdAt: -1 });
    await db.collection('payouts').createIndex({ techId: 1, createdAt: -1 });
    
    // 4. Audit Log: at timestamp index
    await db.collection('auditLog').createIndex({ at: -1 });
  } catch (err) {
    console.warn('Index initialization note (might already exist or DB warming up):', err);
  }
}

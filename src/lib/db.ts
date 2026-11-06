import { MongoClient, Db } from 'mongodb';

const DEFAULT_DB_NAME = 'coolcredit';
const mongoOptions = {
  maxPoolSize: 10,
};

export class MongoConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MongoConfigurationError';
  }
}

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

function resolveMongoUri(): string {
  const rawUri = process.env.MONGODB_URI?.trim();
  if (!rawUri) {
    throw new MongoConfigurationError(
      'MONGODB_URI is not configured. Set the MongoDB Atlas connection string in your environment.'
    );
  }

  if (/[<>]/.test(rawUri) || !/^mongodb\+srv:\/\//i.test(rawUri)) {
    throw new MongoConfigurationError(
      'MONGODB_URI must be a MongoDB Atlas mongodb+srv connection string without placeholder brackets.'
    );
  }

  return rawUri;
}

function resolveMongoDbName(): string {
  const dbName = process.env.MONGODB_DB_NAME?.trim() || DEFAULT_DB_NAME;
  if (dbName !== DEFAULT_DB_NAME) {
    throw new MongoConfigurationError(`MONGODB_DB_NAME must be "${DEFAULT_DB_NAME}".`);
  }
  return dbName;
}

function getMongoClientPromise(): Promise<MongoClient> {
  if (!global._mongoClientPromise) {
    const uri = resolveMongoUri();
    const client = new MongoClient(uri, mongoOptions);
    const clientPromise = client.connect();
    global._mongoClientPromise = clientPromise;
    void clientPromise.catch(() => {
      if (global._mongoClientPromise === clientPromise) {
        global._mongoClientPromise = undefined;
      }
      void client.close().catch(() => undefined);
    });
  }

  return global._mongoClientPromise;
}

export async function getDb(): Promise<Db> {
  const dbName = resolveMongoDbName();
  const connectedClient = await getMongoClientPromise();
  return connectedClient.db(dbName);
}

/**
 * Initializes required unique indexes as specified in Section 7
 */
export async function ensureIndexes(): Promise<void> {
  const db = await getDb();

  await db.collection('users').createIndex({ email: 1 }, { unique: true });
  await db.collection('recoveries').createIndex({ code: 1 }, { unique: true });
  await db.collection('recoveries').createIndex({ status: 1, createdAt: -1 });
  await db.collection('recoveries').createIndex({ techId: 1, createdAt: -1 });
  await db.collection('payouts').createIndex({ recId: 1 }, { unique: true });
  await db.collection('payouts').createIndex({ status: 1, createdAt: -1 });
  await db.collection('payouts').createIndex({ techId: 1, createdAt: -1 });
  await db.collection('auditLog').createIndex({ at: -1 });
}

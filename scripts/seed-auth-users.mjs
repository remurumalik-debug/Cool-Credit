import bcrypt from 'bcryptjs';
import { MongoClient } from 'mongodb';
import { getAtlasConfig } from './mongo-config.mjs';

let uri;
let dbName;
try {
  ({ uri, dbName } = getAtlasConfig());
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Invalid MongoDB Atlas configuration.');
  process.exit(1);
}

const accounts = [
  {
    name: 'Dr. Aliyu Mohammed (Quantro Lead)',
    email: 'admin@coolcredit.ng',
    password: 'AdminPass123!',
    phone: '08031234567',
    role: 'admin',
  },
  {
    name: 'Fatima Bello (Hub Operator)',
    email: 'operator@coolcredit.ng',
    password: 'OperatorPass123!',
    phone: '08029876543',
    role: 'operator',
  },
  {
    name: 'National Ozone Officer (Regulator)',
    email: 'regulator@noo.gov.ng',
    password: 'RegulatorPass123!',
    phone: '08091122334',
    role: 'regulator',
  },
  {
    name: 'Musa Ibrahim (Certified RAC Tech)',
    email: 'tech1@coolcredit.ng',
    password: 'TechPass123!',
    phone: '08123456789',
    role: 'technician',
    bank: {
      bankName: 'First Bank of Nigeria',
      accountNumber: '3089456123',
      accountName: 'Musa Ibrahim',
    },
    location: 'Ganaja Village, Lokoja',
  },
  {
    name: 'Emeka Okafor (New Apprentice Tech)',
    email: 'tech2@coolcredit.ng',
    password: 'TechPass123!',
    phone: '08198765432',
    role: 'technician',
    bank: {
      bankName: 'Zenith Bank',
      accountNumber: '2119004512',
      accountName: 'Emeka Okafor',
    },
    location: 'Felele, Lokoja',
    eligible: false,
  },
  {
    name: 'Multilateral Fund',
    email: 'funder@greenclimate.org',
    password: 'FunderPass123!',
    phone: '08000000000',
    role: 'funder',
  },
];

const client = new MongoClient(uri, {
  maxPoolSize: 5,
});

try {
  await client.connect();
  const db = client.db(dbName);
  await db.command({ ping: 1 });
  await db.collection('users').createIndex({ email: 1 }, { unique: true });

  const now = new Date().toISOString();
  const expected = [];

  for (const account of accounts) {
    const hash = await bcrypt.hash(account.password, 10);
    const { password, ...userFields } = account;
    await db.collection('users').updateOne(
      { email: account.email },
      {
        $set: { ...userFields, hash, active: true, eligible: account.eligible ?? true },
        $setOnInsert: { createdAt: now, consentAt: now },
      },
      { upsert: true }
    );
    expected.push({
      email: account.email,
      role: account.role,
      eligible: account.eligible ?? true,
      password,
    });
  }

  for (const expectedAccount of expected) {
    const user = await db.collection('users').findOne(
      { email: expectedAccount.email },
      { projection: { email: 1, role: 1, active: 1, eligible: 1, hash: 1 } }
    );
    if (
      !user ||
      user.role !== expectedAccount.role ||
      user.active !== true ||
      user.eligible !== expectedAccount.eligible ||
      typeof user.hash !== 'string' ||
      !(await bcrypt.compare(expectedAccount.password, user.hash))
    ) {
      throw new Error(`Seed verification failed for ${expectedAccount.email}.`);
    }
    console.log(`Seeded and verified ${user.email} (${user.role}) in database "${dbName}".`);
  }
} catch (error) {
  const name = error instanceof Error ? error.name : 'UnknownError';
  const code =
    error && typeof error === 'object' && 'code' in error &&
    (typeof error.code === 'string' || typeof error.code === 'number')
      ? `, code ${error.code}`
      : '';
  const serverErrors =
    error && typeof error === 'object' && 'reason' in error &&
    error.reason && typeof error.reason === 'object' &&
    'servers' in error.reason && error.reason.servers instanceof Map
      ? [...error.reason.servers.values()]
          .map((server) => {
            const serverError = server.error;
            if (!serverError) return undefined;
            const serverCode =
              'code' in serverError &&
              (typeof serverError.code === 'string' || typeof serverError.code === 'number')
                ? serverError.code
                : undefined;
            return `${serverError.name || 'ServerError'}${serverCode ? `(${serverCode})` : ''}`;
          })
          .filter(Boolean)
      : [];
  const detail = serverErrors.length ? `; server errors: ${serverErrors.join(', ')}` : '';
  const verificationError =
    error instanceof Error && error.message.startsWith('Seed verification failed for ')
      ? `; ${error.message}`
      : '';
  console.error(
    `Atlas user seeding failed (${name}${code}${detail}${verificationError}). Check the Atlas URI, database user permissions, and Atlas Network Access. No URI or password was printed.`
  );
  process.exitCode = 1;
} finally {
  await client.close();
}

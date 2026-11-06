import nextEnv from '@next/env';

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

export function getAtlasConfig() {
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri || !/^mongodb\+srv:\/\//i.test(uri) || /[<>]/.test(uri)) {
    throw new Error(
      'Set MONGODB_URI to the complete MongoDB Atlas mongodb+srv connection string without placeholder brackets.'
    );
  }

  const dbName = process.env.MONGODB_DB_NAME?.trim() || 'coolcredit';
  if (dbName !== 'coolcredit') {
    throw new Error('MONGODB_DB_NAME must be "coolcredit".');
  }

  return { uri, dbName };
}

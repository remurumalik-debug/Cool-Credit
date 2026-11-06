import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { ObjectId } from 'mongodb';
import QRCode from 'qrcode';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const db = await getDb();

  let query: any = {};
  if (ObjectId.isValid(id)) {
    query = { _id: new ObjectId(id) };
  } else {
    query = { code: id };
  }

  const cylinder = await db.collection('recoveries').findOne(query);
  if (!cylinder) {
    return NextResponse.json({ error: 'Cylinder not found' }, { status: 404 });
  }

  const configuredAppUrl = process.env.NEXT_APP_URL?.trim();
  if (!configuredAppUrl) {
    return NextResponse.json(
      { error: 'QR generation is not configured. Set NEXT_APP_URL to the public application URL.' },
      { status: 503 }
    );
  }

  let appUrl: URL;
  try {
    appUrl = new URL(configuredAppUrl);
  } catch {
    return NextResponse.json(
      { error: 'QR generation is not configured. NEXT_APP_URL must be a valid public URL.' },
      { status: 503 }
    );
  }

  const localHosts = new Set(['localhost', '127.0.0.1', '[::1]']);
  if (
    !['http:', 'https:'].includes(appUrl.protocol) ||
    (process.env.NODE_ENV === 'production' && localHosts.has(appUrl.hostname))
  ) {
    return NextResponse.json(
      { error: 'QR generation requires a public HTTP(S) application URL.' },
      { status: 503 }
    );
  }

  const verifyUrl = new URL(
    `/cylinders/${encodeURIComponent(cylinder.code)}`,
    appUrl
  ).toString();
  const qrDataUrl = await QRCode.toDataURL(
    JSON.stringify({
      app: 'CoolCredit',
      code: cylinder.code,
      url: verifyUrl,
      gas: cylinder.gas || cylinder.gasLogged,
      verifiedGrams: cylinder.weightGrams || cylinder.estGrams,
    }),
    {
      width: 320,
      margin: 2,
      color: {
        dark: '#010E2A',
        light: '#FFFFFF',
      },
    }
  );

  return NextResponse.json({
    code: cylinder.code,
    qrDataUrl,
    verifyUrl,
  });
}

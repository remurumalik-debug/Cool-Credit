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

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const qrDataUrl = await QRCode.toDataURL(
    JSON.stringify({
      app: 'CoolCredit',
      code: cylinder.code,
      url: `${appUrl}/cylinders/${cylinder.code}`,
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
    verifyUrl: `${appUrl}/cylinders/${cylinder.code}`,
  });
}

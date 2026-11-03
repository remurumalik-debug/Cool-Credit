import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = await getDb();
  let query: any = {};

  if (session.role === 'technician') {
    query = { techId: session.userId };
  } else if (session.role === 'funder') {
    // Funders see aggregate financial metrics only (no personal bank info)
    const payouts = await db
      .collection('payouts')
      .find({}, { projection: { bank: 0, techName: 0 } })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({
      payouts: payouts.map((p) => ({ ...p, _id: p._id.toString() })),
    });
  }

  const payouts = await db.collection('payouts').find(query).sort({ createdAt: -1 }).toArray();

  return NextResponse.json({
    payouts: payouts.map((p) => ({
      ...p,
      _id: p._id.toString(),
    })),
  });
}

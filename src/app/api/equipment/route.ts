import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { session, errorResponse } = requireRole(req, ['admin', 'operator', 'regulator']);
  if (errorResponse || !session) return errorResponse;

  const db = await getDb();
  const equipment = await db.collection('equipment').find({}).toArray();

  return NextResponse.json({
    equipment: equipment.map((e) => ({ ...e, _id: e._id.toString() })),
  });
}

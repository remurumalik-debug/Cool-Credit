import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { session, errorResponse } = requireRole(req, ['admin', 'regulator']);
  if (errorResponse || !session) return errorResponse;

  const db = await getDb();
  const logs = await db
    .collection('auditLog')
    .find({})
    .sort({ at: -1 })
    .limit(100)
    .toArray();

  return NextResponse.json({
    logs: logs.map((l) => ({ ...l, _id: l._id.toString() })),
  });
}

import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { ObjectId } from 'mongodb';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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

  // Technicians can only view their own cylinders
  if (session.role === 'technician' && cylinder.techId !== session.userId) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  // Fetch associated payout if verified
  const payout = await db.collection('payouts').findOne({ recId: cylinder._id.toString() });

  // Fetch collection point if assigned
  let collectionPoint = null;
  if (cylinder.collectionPointId && ObjectId.isValid(cylinder.collectionPointId)) {
    collectionPoint = await db
      .collection('collectionPoints')
      .findOne({ _id: new ObjectId(cylinder.collectionPointId) });
  }

  return NextResponse.json({
    cylinder: {
      ...cylinder,
      _id: cylinder._id.toString(),
    },
    payout: payout ? { ...payout, _id: payout._id.toString() } : null,
    collectionPoint: collectionPoint
      ? { ...collectionPoint, _id: collectionPoint._id.toString() }
      : null,
  });
}

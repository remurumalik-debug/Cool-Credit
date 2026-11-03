import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { session, errorResponse } = requireRole(req, ['admin']);
  if (errorResponse || !session) return errorResponse;

  const db = await getDb();
  const users = await db
    .collection('users')
    .find({}, { projection: { hash: 0 } })
    .sort({ createdAt: -1 })
    .toArray();

  const trainings = await db.collection('trainings').find({}).toArray();
  const trainingsByUserId = new Map(trainings.map((t) => [t.userId, t]));

  const enrichedUsers = users.map((u) => {
    const training = trainingsByUserId.get(u._id.toString());
    return {
      ...u,
      _id: u._id.toString(),
      training: training ? { ...training, _id: training._id.toString() } : null,
    };
  });

  return NextResponse.json({ users: enrichedUsers });
}

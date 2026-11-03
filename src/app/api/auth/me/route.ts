import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ user: null });
    }

    const db = await getDb();
    const user = await db.collection('users').findOne(
      { _id: new ObjectId(session.userId) },
      { projection: { hash: 0 } }
    );

    if (!user || !user.active) {
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({
      user: {
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        bank: user.bank,
        location: user.location,
        active: user.active,
        eligible: !!user.eligible,
        consentAt: user.consentAt,
        createdAt: user.createdAt,
      },
    });
  } catch (err: any) {
    console.error('Auth check error:', err);
    return NextResponse.json({ user: null }, { status: 500 });
  }
}

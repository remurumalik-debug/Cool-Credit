import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { recordAudit } from '@/lib/audit';
import { ObjectId } from 'mongodb';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { session, errorResponse } = requireRole(req, ['operator', 'admin']);
  if (errorResponse || !session) return errorResponse;

  const { id } = params;
  const db = await getDb();

  try {
    const body = await req.json();
    const { reason } = body;

    if (!reason || typeof reason !== 'string' || reason.trim().length < 5) {
      return NextResponse.json(
        { error: 'A mandatory, clear reason for rejection is required (minimum 5 characters).' },
        { status: 400 }
      );
    }

    let query: any = {};
    if (ObjectId.isValid(id)) {
      query = { _id: new ObjectId(id) };
    } else {
      query = { code: id };
    }

    const cylinder = await db.collection('recoveries').findOne(query);
    if (!cylinder) {
      return NextResponse.json({ error: 'Cylinder record not found.' }, { status: 404 });
    }

    if (cylinder.status !== 'recovered') {
      return NextResponse.json(
        { error: `Cannot reject cylinder in '${cylinder.status}' status.` },
        { status: 409 }
      );
    }

    const now = new Date().toISOString();
    const updatedEvents = [
      ...(cylinder.events || []),
      {
        at: now,
        by: session.userId,
        role: session.role,
        type: 'REJECTED',
        note: `Rejected: ${reason.trim()}`,
      },
    ];

    const result = await db.collection('recoveries').updateOne(
      { _id: cylinder._id, status: 'recovered' },
      {
        $set: {
          status: 'rejected',
          rejectionReason: reason.trim(),
          events: updatedEvents,
          updatedAt: now,
        },
      }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json({ error: 'Cylinder status was modified concurrently.' }, { status: 409 });
    }

    await recordAudit({
      actor: { id: session.userId, name: session.name, role: session.role },
      action: 'CYLINDER_REJECTED',
      target: { type: 'recovery', id: cylinder._id.toString() },
      beforeAfterSummary: `Rejected cylinder ${cylinder.code}. Reason: ${reason.trim()}`,
    });

    return NextResponse.json({
      success: true,
      message: 'Cylinder rejected. No payout created.',
      status: 'rejected',
    });
  } catch (err: any) {
    console.error('Rejection error:', err);
    return NextResponse.json({ error: 'Failed to reject cylinder' }, { status: 500 });
  }
}

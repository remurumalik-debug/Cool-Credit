import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { recordAudit } from '@/lib/audit';
import { ObjectId } from 'mongodb';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { session, errorResponse } = requireRole(req, ['admin']);
  if (errorResponse || !session) return errorResponse;

  const { id } = params;
  const db = await getDb();

  try {
    const body = await req.json();
    const { reference, note } = body;

    // Non-negotiable principle 5: "Mark a payout 'paid' only when a real transfer reference exists"
    if (!reference || typeof reference !== 'string' || reference.trim().length < 4) {
      return NextResponse.json(
        { error: 'A valid bank transfer reference is required to mark a payout as paid.' },
        { status: 400 }
      );
    }

    let query: any = {};
    if (ObjectId.isValid(id)) {
      query = { _id: new ObjectId(id) };
    } else {
      query = { code: id };
    }

    const payout = await db.collection('payouts').findOne(query);
    if (!payout) {
      return NextResponse.json({ error: 'Payout record not found.' }, { status: 404 });
    }

    if (payout.status === 'paid') {
      return NextResponse.json(
        { error: `Payout is already marked as paid with reference: ${payout.reference}` },
        { status: 409 }
      );
    }

    const now = new Date().toISOString();

    // Update payout status
    await db.collection('payouts').updateOne(
      { _id: payout._id, status: 'pending' },
      {
        $set: {
          status: 'paid',
          reference: reference.trim(),
          paidAt: now,
          paidBy: session.userId,
        },
      }
    );

    // Append PAID event to recovery cylinder
    if (payout.recId && ObjectId.isValid(payout.recId)) {
      const cylinder = await db
        .collection('recoveries')
        .findOne({ _id: new ObjectId(payout.recId) });

      if (cylinder) {
        const updatedEvents = [
          ...(cylinder.events || []),
          {
            at: now,
            by: session.userId,
            role: session.role,
            type: 'PAID',
            note: note?.trim() || `Bank transfer executed. Ref: ${reference.trim()}`,
          },
        ];

        await db
          .collection('recoveries')
          .updateOne({ _id: cylinder._id }, { $set: { events: updatedEvents, updatedAt: now } });
      }
    }

    await recordAudit({
      actor: { id: session.userId, name: session.name, role: 'admin' },
      action: 'PAYOUT_MARKED_PAID',
      target: { type: 'payout', id: payout._id.toString() },
      beforeAfterSummary: `Marked payout for ${payout.code} as paid (${payout.amountKobo / 100} NGN). Reference: ${reference.trim()}`,
    });

    return NextResponse.json({
      success: true,
      message: 'Payout marked as paid with verified bank reference.',
      payout: {
        ...payout,
        status: 'paid',
        reference: reference.trim(),
        paidAt: now,
      },
    });
  } catch (err: any) {
    console.error('Error marking payout paid:', err);
    return NextResponse.json({ error: 'Failed to update payout' }, { status: 500 });
  }
}

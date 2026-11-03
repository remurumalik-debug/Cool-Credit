import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { recordAudit } from '@/lib/audit';
import { ObjectId } from 'mongodb';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { session, errorResponse } = requireRole(req, ['admin']);
  if (errorResponse || !session) return errorResponse;

  const { id } = params;
  const db = await getDb();

  try {
    const body = await req.json();
    const { eligible, trainer, chapter, certificateRef, trainingDate } = body;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    const user = await db.collection('users').findOne({ _id: new ObjectId(id) });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const now = new Date().toISOString();

    // Update user eligibility
    await db.collection('users').updateOne(
      { _id: new ObjectId(id) },
      { $set: { eligible: Boolean(eligible), updatedAt: now } }
    );

    // Upsert training record
    if (certificateRef || trainer || chapter) {
      await db.collection('trainings').updateOne(
        { userId: id },
        {
          $set: {
            userId: id,
            techName: user.name,
            date: trainingDate || now.slice(0, 10),
            trainer: trainer || 'NARAP Certified Master Trainer',
            chapter: chapter || 'NARAP Kogi State Chapter',
            certificateRef: certificateRef || 'PENDING-VERIFICATION',
            status: eligible ? 'certified' : 'pending',
            updatedAt: now,
          },
        },
        { upsert: true }
      );
    }

    await recordAudit({
      actor: { id: session.userId, name: session.name, role: 'admin' },
      action: 'TECHNICIAN_ELIGIBILITY_UPDATED',
      target: { type: 'user', id },
      beforeAfterSummary: `Updated eligibility of ${user.name} to ${eligible ? 'ELIGIBLE' : 'INELIGIBLE'}. Certificate: ${certificateRef || 'N/A'}`,
    });

    return NextResponse.json({
      success: true,
      eligible: Boolean(eligible),
      message: `Technician ${user.name} is now ${eligible ? 'eligible' : 'ineligible'} to log recoveries.`,
    });
  } catch (err: any) {
    console.error('Error updating eligibility:', err);
    return NextResponse.json({ error: 'Failed to update eligibility' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { detectFraudFlags } from '@/lib/fraud';
import { recordAudit } from '@/lib/audit';
import { EQUIPMENT_TYPES } from '@/lib/constants';
import { ObjectId } from 'mongodb';

export async function POST(req: NextRequest) {
  const { session, errorResponse } = requireRole(req, ['technician']);
  if (errorResponse || !session) return errorResponse;

  const db = await getDb();

  // Check eligibility
  const user = await db.collection('users').findOne({ _id: new ObjectId(session.userId) });
  if (!user || !user.eligible) {
    return NextResponse.json(
      { error: 'Technician account is not eligible to sync recoveries.' },
      { status: 403 }
    );
  }

  try {
    const item = await req.json();
    const { idempotencyKey, equipment, gasLogged, estGrams, location, photos, queuedAt } = item;

    if (!idempotencyKey) {
      return NextResponse.json({ error: 'Idempotency key required for offline sync.' }, { status: 400 });
    }

    // Check if already synced
    const existing = await db.collection('recoveries').findOne({ idempotencyKey });
    if (existing) {
      return NextResponse.json({
        success: true,
        cylinder: { ...existing, _id: existing._id.toString() },
        alreadySynced: true,
      });
    }

    // Validate equipment
    if (!equipment || !EQUIPMENT_TYPES.includes(equipment)) {
      return NextResponse.json({ error: 'Invalid equipment type' }, { status: 400 });
    }

    const count = await db.collection('recoveries').countDocuments();
    const code = `CCL-LKJ-${String(count + 1001).padStart(4, '0')}`;
    const now = new Date().toISOString();

    const recentTechRecoveries: any[] = await db
      .collection('recoveries')
      .find({ techId: session.userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();

    const flags = detectFraudFlags({
      cylinderCode: code,
      estGrams: Number(estGrams),
      lat: location?.lat,
      lng: location?.lng,
      photos: Array.isArray(photos) ? photos : [],
      techId: session.userId,
      recentTechRecoveries,
    });

    const newRecovery = {
      code,
      techId: session.userId,
      techName: user.name,
      equipment,
      gasLogged: gasLogged?.trim().toUpperCase() || 'R-22',
      estGrams: Math.round(Number(estGrams)),
      location: location || { text: 'Lokoja Workshop' },
      photos: Array.isArray(photos) ? photos : [],
      status: 'recovered' as const,
      flags,
      events: [
        {
          at: queuedAt || now,
          by: session.userId,
          role: 'technician' as const,
          type: 'RECOVERED',
          note: `Logged offline and synced to network. Estimated ${(estGrams / 1000).toFixed(2)} kg.`,
        },
      ],
      idempotencyKey,
      createdAt: queuedAt || now,
      updatedAt: now,
    };

    const insertResult = await db.collection('recoveries').insertOne(newRecovery);
    const cylinderId = insertResult.insertedId.toString();

    await recordAudit({
      actor: { id: session.userId, name: user.name, role: 'technician' },
      action: 'OFFLINE_RECOVERY_SYNCED',
      target: { type: 'recovery', id: cylinderId },
      beforeAfterSummary: `Synced offline cylinder ${code} with key ${idempotencyKey}`,
    });

    return NextResponse.json({
      success: true,
      cylinder: {
        ...newRecovery,
        _id: cylinderId,
      },
    });
  } catch (err: any) {
    console.error('Error syncing recovery:', err);
    return NextResponse.json({ error: 'Failed to sync offline item' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest, requireRole } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { detectFraudFlags } from '@/lib/fraud';
import { recordAudit } from '@/lib/audit';
import { EQUIPMENT_TYPES } from '@/lib/constants';
import { ObjectId } from 'mongodb';

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = await getDb();
  let query: any = {};

  // Role-based visibility
  if (session.role === 'technician') {
    query = { techId: session.userId };
  } else if (session.role === 'funder') {
    // Funders see aggregate/anonymized only - strip technician PII
    const recoveries = await db
      .collection('recoveries')
      .find({}, { projection: { techName: 0, location: 0, photos: 0 } })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({
      recoveries: recoveries.map((r) => ({
        ...r,
        _id: r._id.toString(),
      })),
    });
  }

  const recoveries = await db
    .collection('recoveries')
    .find(query)
    .sort({ createdAt: -1 })
    .toArray();

  return NextResponse.json({
    recoveries: recoveries.map((r) => ({
      ...r,
      _id: r._id.toString(),
    })),
  });
}

export async function POST(req: NextRequest) {
  const { session, errorResponse } = requireRole(req, ['technician']);
  if (errorResponse || !session) return errorResponse;

  const db = await getDb();

  // Check technician certification & eligibility
  const user = await db.collection('users').findOne({ _id: new ObjectId(session.userId) });
  if (!user || !user.eligible) {
    return NextResponse.json(
      {
        error:
          'Your account is pending NARAP certification review. You cannot log gas recoveries until approved by an administrator.',
      },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { equipment, gasLogged, estKg, locationText, lat, lng, accuracy, photos, note, idempotencyKey } = body;

    // Validate equipment
    if (!equipment || !EQUIPMENT_TYPES.includes(equipment)) {
      return NextResponse.json(
        { error: `Invalid equipment type. Must be one of: ${EQUIPMENT_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate gas
    if (!gasLogged || typeof gasLogged !== 'string') {
      return NextResponse.json({ error: 'Refrigerant type is required (e.g. R-22, R-410A, R-134a).' }, { status: 400 });
    }

    // Convert estimated kg to integer grams
    const estGrams = Math.round(Number(estKg) * 1000);
    if (isNaN(estGrams) || estGrams <= 0) {
      return NextResponse.json({ error: 'Estimated quantity must be a positive number in kg.' }, { status: 400 });
    }

    if (estGrams > 50000) {
      return NextResponse.json({ error: 'A single recovery cylinder cannot exceed 50 kg.' }, { status: 400 });
    }

    // Check idempotency key if provided
    if (idempotencyKey) {
      const existing = await db.collection('recoveries').findOne({ idempotencyKey });
      if (existing) {
        return NextResponse.json({
          success: true,
          cylinder: { ...existing, _id: existing._id.toString() },
          idempotent: true,
        });
      }
    }

    // Generate unique cylinder code (CCL-LKJ-XXXX)
    const count = await db.collection('recoveries').countDocuments();
    const code = `CCL-LKJ-${String(count + 1001).padStart(4, '0')}`;

    // Fetch recent recoveries of this tech for fraud check
    const recentTechRecoveries: any[] = await db
      .collection('recoveries')
      .find({ techId: session.userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();

    // Check fraud flags
    const flags = detectFraudFlags({
      cylinderCode: code,
      estGrams,
      lat: lat ? Number(lat) : undefined,
      lng: lng ? Number(lng) : undefined,
      photos: Array.isArray(photos) ? photos : [],
      techId: session.userId,
      recentTechRecoveries,
    });

    const now = new Date().toISOString();
    const newRecovery = {
      code,
      techId: session.userId,
      techName: user.name,
      equipment,
      gasLogged: gasLogged.trim().toUpperCase(),
      estGrams,
      location: {
        text: locationText?.trim() || 'Lokoja Workshop',
        lat: lat ? Number(lat) : undefined,
        lng: lng ? Number(lng) : undefined,
        accuracy: accuracy ? Number(accuracy) : undefined,
      },
      photos: Array.isArray(photos) ? photos : [],
      status: 'recovered' as const,
      flags,
      events: [
        {
          at: now,
          by: session.userId,
          role: 'technician' as const,
          type: 'RECOVERED',
          note: note?.trim() || `Recovered ${estKg} kg of ${gasLogged} from ${equipment}.`,
        },
      ],
      idempotencyKey: idempotencyKey || null,
      createdAt: now,
      updatedAt: now,
    };

    const insertResult = await db.collection('recoveries').insertOne(newRecovery);
    const cylinderId = insertResult.insertedId.toString();

    await recordAudit({
      actor: { id: session.userId, name: user.name, role: 'technician' },
      action: 'RECOVERY_LOGGED',
      target: { type: 'recovery', id: cylinderId },
      beforeAfterSummary: `Logged cylinder ${code}: ${estKg} kg of ${gasLogged} (${equipment})`,
    });

    return NextResponse.json({
      success: true,
      cylinder: {
        ...newRecovery,
        _id: cylinderId,
      },
      flags,
    });
  } catch (err: any) {
    console.error('Error logging recovery:', err);
    return NextResponse.json({ error: 'Failed to record recovery' }, { status: 500 });
  }
}

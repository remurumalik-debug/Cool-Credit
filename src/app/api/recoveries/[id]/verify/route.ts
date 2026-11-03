import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { calculatePayoutKobo } from '@/lib/payout-calculator';
import { detectFraudFlags } from '@/lib/fraud';
import { recordAudit } from '@/lib/audit';
import { DEFAULT_CONFIG } from '@/lib/constants';
import { ObjectId } from 'mongodb';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { session, errorResponse } = requireRole(req, ['operator', 'admin']);
  if (errorResponse || !session) return errorResponse;

  const { id } = params;
  const db = await getDb();

  try {
    const body = await req.json();
    const { calibratedWeightKg, confirmedGas, identifierResult, scaleSerial, collectionPointId, note } = body;

    // Strict validation
    if (!calibratedWeightKg || isNaN(Number(calibratedWeightKg)) || Number(calibratedWeightKg) <= 0) {
      return NextResponse.json({ error: 'Valid calibrated net weight (kg) is required.' }, { status: 400 });
    }

    if (!confirmedGas || typeof confirmedGas !== 'string') {
      return NextResponse.json({ error: 'Confirmed refrigerant type is required from identifier test.' }, { status: 400 });
    }

    if (!identifierResult || typeof identifierResult !== 'string') {
      return NextResponse.json({ error: 'Refrigerant identifier test purity result is required.' }, { status: 400 });
    }

    // Equipment calibration check if scale specified
    if (scaleSerial) {
      const scale = await db.collection('equipment').findOne({ serial: scaleSerial });
      if (scale && new Date(scale.calibrationDue) < new Date()) {
        return NextResponse.json(
          {
            error: `Scale '${scaleSerial}' calibration expired on ${new Date(scale.calibrationDue).toLocaleDateString()}. Verification blocked until re-calibrated.`,
          },
          { status: 400 }
        );
      }
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

    // Guarded state transition check
    if (cylinder.status !== 'recovered') {
      return NextResponse.json(
        {
          error: `Cannot verify cylinder in '${cylinder.status}' status. Only cylinders in 'recovered' status can be verified.`,
        },
        { status: 409 }
      );
    }

    // Fetch technician bank details
    const techUser = await db.collection('users').findOne({ _id: new ObjectId(cylinder.techId) });
    if (!techUser) {
      return NextResponse.json({ error: 'Technician account associated with cylinder not found.' }, { status: 400 });
    }

    // Fetch config payout rate
    const rateKobo = DEFAULT_CONFIG.payoutRateKobo; // e.g. 450,000 kobo (₦4,500/kg)
    const weightGrams = Math.round(Number(calibratedWeightKg) * 1000);
    const amountKobo = calculatePayoutKobo(weightGrams, rateKobo);

    const now = new Date().toISOString();

    // Check fraud variance
    const newFlags = detectFraudFlags({
      cylinderCode: cylinder.code,
      estGrams: cylinder.estGrams,
      weightGrams,
      techId: cylinder.techId,
    });

    const verificationNote =
      note?.trim() ||
      `Calibrated weight: ${calibratedWeightKg} kg. Identifier result: ${identifierResult}. Scale: ${scaleSerial || 'Standard Hub Scale'}.`;

    const updatedEvents = [
      ...(cylinder.events || []),
      {
        at: now,
        by: session.userId,
        role: session.role,
        type: 'VERIFIED',
        note: verificationNote,
      },
    ];

    const updatedFlags = [...(cylinder.flags || []), ...newFlags];

    // Atomic update on recovery
    const updateResult = await db.collection('recoveries').updateOne(
      { _id: cylinder._id, status: 'recovered' }, // Guard condition
      {
        $set: {
          status: 'verified',
          gas: confirmedGas.trim().toUpperCase(),
          weightGrams,
          collectionPointId: collectionPointId || cylinder.collectionPointId,
          flags: updatedFlags,
          events: updatedEvents,
          updatedAt: now,
        },
      }
    );

    if (updateResult.modifiedCount === 0) {
      return NextResponse.json(
        { error: 'Concurrent update detected. Cylinder was already processed.' },
        { status: 409 }
      );
    }

    // Create idempotent payout record
    const payoutRecord = {
      recId: cylinder._id.toString(),
      code: cylinder.code,
      techId: cylinder.techId,
      techName: techUser.name,
      grams: weightGrams,
      rateKobo,
      amountKobo,
      status: 'pending' as const, // Payout pending real transfer reference
      bank: {
        bankName: techUser.bank?.bankName || 'Not Provided',
        accountNumber: techUser.bank?.accountNumber || '0000000000',
        accountName: techUser.bank?.accountName || techUser.name,
      },
      createdAt: now,
    };

    await db.collection('payouts').insertOne(payoutRecord);

    await recordAudit({
      actor: { id: session.userId, name: session.name, role: session.role },
      action: 'CYLINDER_VERIFIED',
      target: { type: 'recovery', id: cylinder._id.toString() },
      beforeAfterSummary: `Verified cylinder ${cylinder.code}: ${calibratedWeightKg} kg confirmed as ${confirmedGas}. Created pending payout of ${amountKobo / 100} NGN.`,
    });

    return NextResponse.json({
      success: true,
      cylinder: {
        ...cylinder,
        status: 'verified',
        gas: confirmedGas,
        weightGrams,
      },
      payout: payoutRecord,
    });
  } catch (err: any) {
    console.error('Verification error:', err);
    return NextResponse.json({ error: 'Failed to verify cylinder' }, { status: 500 });
  }
}

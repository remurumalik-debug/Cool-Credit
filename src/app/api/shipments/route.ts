import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { recordAudit } from '@/lib/audit';
import { ObjectId } from 'mongodb';

export async function GET(req: NextRequest) {
  const { session, errorResponse } = requireRole(req, ['admin', 'regulator', 'funder']);
  if (errorResponse || !session) return errorResponse;

  const db = await getDb();
  const shipments = await db.collection('shipments').find({}).sort({ shippedDate: -1 }).toArray();

  return NextResponse.json({
    shipments: shipments.map((s) => ({ ...s, _id: s._id.toString() })),
  });
}

export async function POST(req: NextRequest) {
  const { session, errorResponse } = requireRole(req, ['admin']);
  if (errorResponse || !session) return errorResponse;

  const db = await getDb();

  try {
    const body = await req.json();
    const { cylinderCodes, destination, type, certificateNo, shippedDate, notes } = body;

    if (!Array.isArray(cylinderCodes) || cylinderCodes.length === 0) {
      return NextResponse.json({ error: 'At least one cylinder must be selected for dispatch.' }, { status: 400 });
    }

    if (!destination || typeof destination !== 'string') {
      return NextResponse.json({ error: 'Destination facility is required.' }, { status: 400 });
    }

    if (!['reclamation', 'destruction'].includes(type)) {
      return NextResponse.json(
        { error: "Shipment type must be either 'reclamation' or 'destruction'." },
        { status: 400 }
      );
    }

    // MANDATORY: Destruction requires certificate number per Section 6.4
    if (type === 'destruction' && (!certificateNo || typeof certificateNo !== 'string' || certificateNo.trim().length < 3)) {
      return NextResponse.json(
        { error: 'Approved destruction certificate number is strictly mandatory for destruction shipments.' },
        { status: 400 }
      );
    }

    // Verify all cylinders are in 'verified' status
    const cylinders = await db
      .collection('recoveries')
      .find({ code: { $in: cylinderCodes } })
      .toArray();

    if (cylinders.length !== cylinderCodes.length) {
      return NextResponse.json({ error: 'One or more specified cylinder codes could not be found.' }, { status: 404 });
    }

    const invalidCylinders = cylinders.filter((c) => c.status !== 'verified');
    if (invalidCylinders.length > 0) {
      return NextResponse.json(
        {
          error: `Only verified cylinders can proceed to reclamation/destruction. Invalid status found on: ${invalidCylinders.map((c) => `${c.code} (${c.status})`).join(', ')}`,
        },
        { status: 409 }
      );
    }

    const targetStatus = type === 'reclamation' ? 'reclaimed' : 'destroyed';
    const now = new Date().toISOString();
    const eventType = type === 'reclamation' ? 'RECLAIMED' : 'DESTROYED';

    // Update cylinders
    for (const cylinder of cylinders) {
      const updatedEvents = [
        ...(cylinder.events || []),
        {
          at: now,
          by: session.userId,
          role: 'admin' as const,
          type: eventType,
          note: `Dispatched for ${type} to ${destination}.${certificateNo ? ` Certificate #${certificateNo}` : ''}`,
        },
      ];

      await db.collection('recoveries').updateOne(
        { _id: cylinder._id, status: 'verified' },
        {
          $set: {
            status: targetStatus,
            events: updatedEvents,
            updatedAt: now,
          },
        }
      );
    }

    const shipmentRecord = {
      cylinderCodes,
      destination: destination.trim(),
      type,
      certificateNo: certificateNo?.trim() || null,
      shippedDate: shippedDate || now,
      status: 'completed',
      notes: notes?.trim() || '',
      dispatchedBy: session.userId,
      createdAt: now,
    };

    const result = await db.collection('shipments').insertOne(shipmentRecord);

    await recordAudit({
      actor: { id: session.userId, name: session.name, role: 'admin' },
      action: `SHIPMENT_${type.toUpperCase()}`,
      target: { type: 'shipment', id: result.insertedId.toString() },
      beforeAfterSummary: `Dispatched ${cylinderCodes.length} cylinders for ${type} to ${destination}.`,
    });

    return NextResponse.json({
      success: true,
      shipment: { ...shipmentRecord, _id: result.insertedId.toString() },
      updatedCount: cylinderCodes.length,
    });
  } catch (err: any) {
    console.error('Shipment error:', err);
    return NextResponse.json({ error: 'Failed to record shipment' }, { status: 500 });
  }
}

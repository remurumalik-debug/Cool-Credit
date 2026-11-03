import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { session, errorResponse } = requireRole(req, ['admin', 'regulator']);
  if (errorResponse || !session) return errorResponse;

  const db = await getDb();
  const payouts = await db.collection('payouts').find({}).toArray();
  const cylinders = await db.collection('recoveries').find({ status: { $ne: 'rejected' } }).toArray();

  let totalVerifiedGrams = 0;
  let totalCalculatedKobo = 0;
  let totalPendingKobo = 0;
  let totalPaidKobo = 0;

  for (const p of payouts) {
    totalVerifiedGrams += p.grams || 0;
    totalCalculatedKobo += p.amountKobo || 0;
    if (p.status === 'paid') {
      totalPaidKobo += p.amountKobo || 0;
    } else {
      totalPendingKobo += p.amountKobo || 0;
    }
  }

  // Reconciliation check
  const isReconciled = totalCalculatedKobo === (totalPaidKobo + totalPendingKobo);

  return NextResponse.json({
    summary: {
      totalCylindersCount: cylinders.length,
      payoutsCount: payouts.length,
      totalVerifiedKg: totalVerifiedGrams / 1000,
      totalCalculatedNaira: totalCalculatedKobo / 100,
      totalPendingNaira: totalPendingKobo / 100,
      totalPaidNaira: totalPaidKobo / 100,
      isReconciled,
      discrepancyKobo: totalCalculatedKobo - (totalPaidKobo + totalPendingKobo),
    },
  });
}

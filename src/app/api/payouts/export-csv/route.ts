import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { session, errorResponse } = requireRole(req, ['admin']);
  if (errorResponse || !session) return errorResponse;

  const db = await getDb();
  const payouts = await db.collection('payouts').find({}).sort({ createdAt: -1 }).toArray();

  // CSV headers for Nigerian NIP / Corporate Bank Portal Upload
  const headers = [
    'Payout ID',
    'Cylinder Code',
    'Beneficiary Name',
    'Bank Name',
    'Account Number',
    'Verified Net (kg)',
    'Rate (NGN/kg)',
    'Amount (NGN)',
    'Status',
    'Transfer Reference',
    'Created Date (UTC)',
    'Paid Date (UTC)',
  ];

  const rows = payouts.map((p) => [
    p._id.toString(),
    `"${p.code}"`,
    `"${p.techName || p.bank?.accountName || ''}"`,
    `"${p.bank?.bankName || ''}"`,
    `"${p.bank?.accountNumber || ''}"`,
    (p.grams / 1000).toFixed(2),
    (p.rateKobo / 100).toFixed(2),
    (p.amountKobo / 100).toFixed(2),
    p.status,
    `"${p.reference || ''}"`,
    p.createdAt,
    p.paidAt || '',
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="coolcredit_payouts_${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}

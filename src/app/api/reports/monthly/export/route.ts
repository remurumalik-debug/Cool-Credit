import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { DEFAULT_CONFIG } from '@/lib/constants';
import { calculateEmissionsAvoidedTonnes } from '@/lib/payout-calculator';

export async function GET(req: NextRequest) {
  const { session, errorResponse } = requireRole(req, ['admin', 'regulator', 'funder']);
  if (errorResponse || !session) return errorResponse;

  const db = await getDb();
  const recoveries = await db.collection('recoveries').find({}).toArray();

  const lines = [
    'NATIONAL OZONE OFFICE (NOO) REFRIGERANT RECOVERY MONTHLY SUMMARY',
    `Programme: CoolCredit Pilot (Lokoja - Kogi State)`,
    `Reporting Entity: Quantro Software Labs (CAC In-Progress)`,
    `Generated At: ${new Date().toISOString()}`,
    `Target Recovery: 300 kg`,
    '',
    'CYLINDER DETAILED REPORT',
    'Cylinder Code,Status,Equipment,Logged Gas,Confirmed Gas,Est (kg),Verified (kg),Emissions Avoided (tCO2e),Location,Created Date',
  ];

  for (const r of recoveries) {
    const verifiedKg = (r.weightGrams || 0) / 1000;
    const estKg = (r.estGrams || 0) / 1000;
    const gasType = r.gas || r.gasLogged || 'R-22';
    const gwp = DEFAULT_CONFIG.gasList.find((g) => g.name === gasType)?.gwp || 1810;
    const emissions = ['verified', 'reclaimed', 'destroyed'].includes(r.status)
      ? calculateEmissionsAvoidedTonnes(r.weightGrams || 0, gwp)
      : 0;

    lines.push(
      [
        `"${r.code}"`,
        r.status,
        `"${r.equipment}"`,
        `"${r.gasLogged}"`,
        `"${r.gas || ''}"`,
        estKg.toFixed(2),
        verifiedKg > 0 ? verifiedKg.toFixed(2) : 'N/A',
        emissions.toFixed(3),
        `"${r.location?.text || ''}"`,
        r.createdAt,
      ].join(',')
    );
  }

  const csvContent = lines.join('\r\n');

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="coolcredit_monthly_noo_report_${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}

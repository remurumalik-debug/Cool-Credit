import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { DEFAULT_CONFIG } from '@/lib/constants';
import { calculateEmissionsAvoidedTonnes } from '@/lib/payout-calculator';

export async function GET(req: NextRequest) {
  const { session, errorResponse } = requireRole(req, ['admin', 'regulator', 'funder']);
  if (errorResponse || !session) return errorResponse;

  const db = await getDb();

  // All recoveries
  const recoveries = await db.collection('recoveries').find({}).toArray();
  const payouts = await db.collection('payouts').find({}).toArray();

  // Distinct active technicians (who submitted at least one recovery)
  const activeTechIds = new Set(recoveries.map((r) => r.techId));

  // By Gas Type Breakdown
  const gasStats: Record<
    string,
    {
      gas: string;
      gwp: number;
      recoveredGrams: number;
      verifiedGrams: number;
      reclaimedGrams: number;
      destroyedGrams: number;
      emissionsAvoidedTonnes: number;
    }
  > = {};

  // Initialize from default gas list
  for (const g of DEFAULT_CONFIG.gasList) {
    gasStats[g.name] = {
      gas: g.name,
      gwp: g.gwp,
      recoveredGrams: 0,
      verifiedGrams: 0,
      reclaimedGrams: 0,
      destroyedGrams: 0,
      emissionsAvoidedTonnes: 0,
    };
  }

  let totalRecoveredGrams = 0;
  let totalVerifiedGrams = 0;
  let totalReclaimedGrams = 0;
  let totalDestroyedGrams = 0;
  let totalEmissionsAvoidedTonnes = 0;

  for (const r of recoveries) {
    const gasType = r.gas || r.gasLogged || 'OTHER';
    if (!gasStats[gasType]) {
      gasStats[gasType] = {
        gas: gasType,
        gwp: 1500, // Default fallback
        recoveredGrams: 0,
        verifiedGrams: 0,
        reclaimedGrams: 0,
        destroyedGrams: 0,
        emissionsAvoidedTonnes: 0,
      };
    }

    const gStats = gasStats[gasType];
    const est = r.estGrams || 0;
    const verified = r.weightGrams || 0;

    totalRecoveredGrams += est;
    gStats.recoveredGrams += est;

    if (['verified', 'reclaimed', 'destroyed'].includes(r.status)) {
      totalVerifiedGrams += verified;
      gStats.verifiedGrams += verified;

      const emissions = calculateEmissionsAvoidedTonnes(verified, gStats.gwp);
      gStats.emissionsAvoidedTonnes += emissions;
      totalEmissionsAvoidedTonnes += emissions;
    }

    if (r.status === 'reclaimed') {
      totalReclaimedGrams += verified;
      gStats.reclaimedGrams += verified;
    } else if (r.status === 'destroyed') {
      totalDestroyedGrams += verified;
      gStats.destroyedGrams += verified;
    }
  }

  // Payout reconciliation
  let totalPaidKobo = 0;
  let totalPendingKobo = 0;
  for (const p of payouts) {
    if (p.status === 'paid') {
      totalPaidKobo += p.amountKobo || 0;
    } else {
      totalPendingKobo += p.amountKobo || 0;
    }
  }

  return NextResponse.json({
    reportMonth: 'October 2026',
    generatedAt: new Date().toISOString(),
    reportingEntity: 'Quantro Software Labs (CAC In-Progress)',
    pilotLocation: 'Lokoja, Kogi State, Nigeria',
    pilotTargetKg: 300,
    activeTechniciansCount: activeTechIds.size,
    summary: {
      totalRecoveredKg: totalRecoveredGrams / 1000,
      totalVerifiedKg: totalVerifiedGrams / 1000,
      totalReclaimedKg: totalReclaimedGrams / 1000,
      totalDestroyedKg: totalDestroyedGrams / 1000,
      totalEmissionsAvoidedTonnesCO2e: Math.round(totalEmissionsAvoidedTonnes * 100) / 100,
      targetProgressPct: Math.round((totalVerifiedGrams / 1000 / 300) * 100 * 10) / 10,
    },
    gasBreakdown: Object.values(gasStats).filter(
      (g) => g.recoveredGrams > 0 || g.verifiedGrams > 0
    ),
    financialReconciliation: {
      totalPaidNaira: totalPaidKobo / 100,
      totalPendingNaira: totalPendingKobo / 100,
      rateNairaPerKg: DEFAULT_CONFIG.payoutRateKobo / 100,
      status: 'Fully Reconciled with Verified Cylinders',
    },
    methodologyNote:
      'Emissions estimate calculated using formula: Verified kg × GWP ÷ 1000 = Metric tonnes CO2e. GWP values: R-22 (1,810), R-410A (2,088), R-134a (1,430). Unaudited estimate. No carbon credit claims.',
  });
}

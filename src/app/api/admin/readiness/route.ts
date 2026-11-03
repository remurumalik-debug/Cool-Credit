import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { INITIAL_HARD_STOPS, INITIAL_SCORE_CRITERIA } from '@/lib/constants';
import { recordAudit } from '@/lib/audit';

export async function GET(req: NextRequest) {
  const { session, errorResponse } = requireRole(req, ['admin', 'regulator', 'funder']);
  if (errorResponse || !session) return errorResponse;

  const db = await getDb();
  const latest = await db.collection('readiness').findOne({}, { sort: { evaluatedAt: -1 } });

  if (!latest) {
    return NextResponse.json({
      hardStops: INITIAL_HARD_STOPS,
      scores: INITIAL_SCORE_CRITERIA,
      overallStatus: 'Hold',
      totalScore: 36.25,
      evaluatedAt: new Date().toISOString(),
    });
  }

  return NextResponse.json({
    _id: latest._id.toString(),
    hardStops: latest.hardStops,
    scores: latest.scores,
    overallStatus: latest.overallStatus,
    totalScore: latest.totalScore,
    evaluatedAt: latest.evaluatedAt,
    evaluatedBy: latest.evaluatedBy,
  });
}

export async function POST(req: NextRequest) {
  const { session, errorResponse } = requireRole(req, ['admin']);
  if (errorResponse || !session) return errorResponse;

  const db = await getDb();

  try {
    const body = await req.json();
    const { hardStops, scores } = body;

    if (!Array.isArray(hardStops) || !Array.isArray(scores)) {
      return NextResponse.json({ error: 'Valid hardStops and scores arrays are required.' }, { status: 400 });
    }

    // Calculate weighted score: points = weight * rating / 4
    let totalScore = 0;
    for (const item of scores) {
      const weight = Number(item.maxWeight) || 0;
      const rating = Math.min(Math.max(Number(item.rating) || 0, 0), 4);
      totalScore += (weight * rating) / 4;
    }
    totalScore = Math.round(totalScore * 100) / 100;

    // Check hard stops: ANY 'no' (false) is a hard stop
    const allHardStopsPassed = hardStops.every((hs: any) => Boolean(hs.isSatisfied));

    let overallStatus: 'Go' | 'Adjust' | 'Hold' = 'Hold';
    if (!allHardStopsPassed) {
      overallStatus = 'Hold';
    } else if (totalScore >= 80) {
      overallStatus = 'Go';
    } else if (totalScore >= 60) {
      overallStatus = 'Adjust';
    } else {
      overallStatus = 'Hold';
    }

    const now = new Date().toISOString();
    const newAssessment = {
      evaluatedAt: now,
      evaluatedBy: session.name,
      hardStops,
      scores,
      overallStatus,
      totalScore,
    };

    await db.collection('readiness').insertOne(newAssessment);

    await recordAudit({
      actor: { id: session.userId, name: session.name, role: 'admin' },
      action: 'READINESS_ASSESSMENT_UPDATED',
      target: { type: 'readiness', id: 'pilot-decision-dashboard' },
      beforeAfterSummary: `Updated pilot decision readiness. Status: ${overallStatus}, Score: ${totalScore}/100. Hard stops passed: ${allHardStopsPassed}`,
    });

    return NextResponse.json({
      success: true,
      assessment: newAssessment,
    });
  } catch (err: any) {
    console.error('Error saving readiness:', err);
    return NextResponse.json({ error: 'Failed to update readiness assessment' }, { status: 500 });
  }
}

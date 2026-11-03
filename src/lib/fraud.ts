import { FraudFlag, RecoveryCylinder } from './types';
import { DEFAULT_CONFIG } from './constants';

interface FraudCheckInput {
  cylinderCode: string;
  estGrams: number;
  weightGrams?: number;
  lat?: number;
  lng?: number;
  photos?: { url: string; type: string }[];
  techId: string;
  recentTechRecoveries?: RecoveryCylinder[];
  existingCodes?: string[];
  varianceThresholdPct?: number;
}

export function detectFraudFlags(input: FraudCheckInput): FraudFlag[] {
  const flags: FraudFlag[] = [];
  const now = new Date().toISOString();
  const thresholdPct = input.varianceThresholdPct || DEFAULT_CONFIG.varianceThresholdPct;

  // 1. Variance between estimated and weighed quantity
  if (input.weightGrams !== undefined && input.weightGrams > 0 && input.estGrams > 0) {
    const diff = Math.abs(input.weightGrams - input.estGrams);
    const variancePct = (diff / input.estGrams) * 100;
    if (variancePct > thresholdPct) {
      flags.push({
        code: 'HIGH_VARIANCE',
        severity: variancePct > thresholdPct * 2 ? 'high' : 'medium',
        message: `Weight variance of ${variancePct.toFixed(1)}% exceeds the ${thresholdPct}% threshold (Estimated: ${(input.estGrams / 1000).toFixed(2)} kg, Weighed: ${(input.weightGrams / 1000).toFixed(2)} kg).`,
        detectedAt: now,
      });
    }
  }

  // 2. Geolocation outside pilot boundary
  if (input.lat !== undefined && input.lng !== undefined) {
    const { minLat, maxLat, minLng, maxLng, name } = DEFAULT_CONFIG.pilotArea;
    const isInside =
      input.lat >= minLat &&
      input.lat <= maxLat &&
      input.lng >= minLng &&
      input.lng <= maxLng;

    if (!isInside) {
      flags.push({
        code: 'OUT_OF_BOUNDS_LOCATION',
        severity: 'high',
        message: `Recovery logged outside approved pilot area (${name}). Coordinates: [${input.lat.toFixed(4)}, ${input.lng.toFixed(4)}].`,
        detectedAt: now,
      });
    }
  }

  // 3. Cylinder ID reuse check
  if (input.existingCodes && input.existingCodes.includes(input.cylinderCode)) {
    flags.push({
      code: 'REUSED_CYLINDER_ID',
      severity: 'high',
      message: `Cylinder ID ${input.cylinderCode} is already registered in active custody.`,
      detectedAt: now,
    });
  }

  // 4. Duplicate photos (check within input photos array or recently submitted URLs)
  if (input.photos && input.photos.length > 1) {
    const urls = input.photos.map((p) => p.url).filter(Boolean);
    const uniqueUrls = new Set(urls);
    if (uniqueUrls.size < urls.length) {
      flags.push({
        code: 'DUPLICATE_PHOTOS',
        severity: 'medium',
        message: 'Duplicate photos detected in cylinder submission.',
        detectedAt: now,
      });
    }
  }

  // 5. Unusually high volume per technician in a short window (24h)
  if (input.recentTechRecoveries && input.recentTechRecoveries.length > 0) {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const past24hRecoveries = input.recentTechRecoveries.filter(
      (r) => r.createdAt >= oneDayAgo && r.code !== input.cylinderCode
    );

    const past24hCount = past24hRecoveries.length;
    const past24hGrams = past24hRecoveries.reduce(
      (sum, r) => sum + (r.weightGrams || r.estGrams || 0),
      0
    );

    if (past24hCount >= 3 || past24hGrams >= 50000) {
      flags.push({
        code: 'HIGH_VOLUME_SPIKE',
        severity: 'medium',
        message: `Technician submitted ${past24hCount + 1} recoveries (${((past24hGrams + input.estGrams) / 1000).toFixed(1)} kg) in the last 24 hours.`,
        detectedAt: now,
      });
    }
  }

  return flags;
}

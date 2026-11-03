/**
 * Payout and Measurement Calculator for CoolCredit
 * NON-NEGOTIABLE RULE: Integers for money (kobo) and weight (grams). Never floats in DB.
 */

/**
 * Calculates payout in integer kobo.
 * Formula: round(grams * rateKobo / 1000)
 */
export function calculatePayoutKobo(grams: number, rateKobo: number): number {
  if (grams <= 0 || rateKobo <= 0) return 0;
  return Math.round((grams * rateKobo) / 1000);
}

/**
 * Formats integer kobo to Nigerian Naira display string (e.g. 450000 -> "₦4,500.00")
 */
export function formatKoboToNaira(kobo: number, includeDecimals = true): string {
  const naira = (kobo || 0) / 100;
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: includeDecimals ? 2 : 0,
    maximumFractionDigits: includeDecimals ? 2 : 0,
  }).format(naira);
}

/**
 * Formats integer grams to kilograms display string (e.g. 2500 -> "2.50 kg")
 */
export function formatGramsToKg(grams: number, decimals = 2): string {
  const kg = (grams || 0) / 1000;
  return `${kg.toFixed(decimals)} kg`;
}

/**
 * Estimates emissions avoided in metric tonnes of CO2 equivalent (tCO2e).
 * Formula: verified kg * GWP / 1000 = tonnes CO2e
 * (or: grams * GWP / 1,000,000)
 */
export function calculateEmissionsAvoidedTonnes(verifiedGrams: number, gwp: number): number {
  if (verifiedGrams <= 0 || gwp <= 0) return 0;
  const kg = verifiedGrams / 1000;
  const tonnes = (kg * gwp) / 1000;
  return Math.round(tonnes * 1000) / 1000; // 3 decimal places
}

/**
 * Converts user entered kg string/number into integer grams safely
 */
export function kgToGrams(kg: number | string): number {
  const num = typeof kg === 'string' ? parseFloat(kg) : kg;
  if (isNaN(num) || num <= 0) return 0;
  return Math.round(num * 1000);
}

/**
 * Converts user entered Naira string/number into integer kobo safely
 */
export function nairaToKobo(naira: number | string): number {
  const num = typeof naira === 'string' ? parseFloat(naira) : naira;
  if (isNaN(num) || num <= 0) return 0;
  return Math.round(num * 100);
}

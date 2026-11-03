'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Package,
  PlusCircle,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  MapPin,
  Shield,
  FileCheck2,
} from 'lucide-react';
import { formatKoboToNaira, formatGramsToKg } from '@/lib/payout-calculator';

export default function HomePage() {
  const [session, setSession] = useState<any>(null);
  const [recoveries, setRecoveries] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [meRes, recRes, payRes] = await Promise.all([
          fetch('/api/auth/me'),
          fetch('/api/recoveries'),
          fetch('/api/payouts'),
        ]);

        if (meRes.ok) {
          const meData = await meRes.json();
          setSession(meData.user);
        }

        if (recRes.ok) {
          const recData = await recRes.json();
          setRecoveries(recData.recoveries || []);
        }

        if (payRes.ok) {
          const payData = await payRes.json();
          setPayouts(payData.payouts || []);
        }
      } catch (err) {
        console.error('Failed to load dashboard', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  const verifiedCylinders = recoveries.filter((r) =>
    ['verified', 'reclaimed', 'destroyed'].includes(r.status)
  );

  const totalVerifiedGrams = verifiedCylinders.reduce(
    (sum, r) => sum + (r.weightGrams || 0),
    0
  );

  const totalPaidKobo = payouts
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + (p.amountKobo || 0), 0);

  const totalPendingKobo = payouts
    .filter((p) => p.status === 'pending')
    .reduce((sum, p) => sum + (p.amountKobo || 0), 0);

  return (
    <div className="space-y-6">
      {/* WELCOME BANNER */}
      <div className="bg-[#010E2A] text-white rounded-xl p-5 md:p-8 shadow-sm">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-[#2ECD8A]/10 text-[#2ECD8A] px-3 py-1 rounded-full text-xs font-semibold mb-3">
            <MapPin className="w-3.5 h-3.5" /> Lokoja Pilot Operations • Kogi State
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">
            Refrigerant Recovery Incentive & Custody Platform
          </h1>
          <p className="text-[#A9B2C3] text-sm md:text-base leading-relaxed mb-5">
            Paying certified technicians to recover ozone-depleting and high-GWP refrigerants instead of venting them. Every cylinder is verified and tracked from recovery to reclamation or approved destruction.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            {session ? (
              session.role === 'technician' ? (
                session.eligible ? (
                  <Link href="/log" className="btn-primary">
                    <PlusCircle className="w-4 h-4" /> Log Used Refrigerant Recovery
                  </Link>
                ) : (
                  <div className="bg-[#B54708]/20 border border-[#B54708] text-white px-3 py-2 rounded-lg text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-[#FDA29B]" />
                    Certification pending review. Log recovery unlocked upon NARAP approval.
                  </div>
                )
              ) : session.role === 'operator' ? (
                <Link href="/queue" className="btn-primary">
                  <CheckCircle2 className="w-4 h-4" /> Open Verification Queue
                </Link>
              ) : (
                <Link href="/reports" className="btn-primary">
                  <TrendingUp className="w-4 h-4" /> View Pilot Reports
                </Link>
              )
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/login" className="btn-primary">
                  Sign In
                </Link>
                <Link href="/register" className="btn-secondary bg-white/10 text-white border-white/20 hover:bg-white/20">
                  Register as Technician
                </Link>
              </div>
            )}

            <Link
              href="/cylinders"
              className="text-xs font-semibold text-[#2ECD8A] hover:underline flex items-center gap-1 ml-2"
            >
              Explore Custody Ledger <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* METRIC CARDS (REAL NUMBERS ONLY, NEVER FABRICATED PER SECTION 4) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Verified Recovered</span>
            <Package className="w-4 h-4 text-[#16794C]" />
          </div>
          <div className="text-2xl font-bold text-[#010E2A]">
            {formatGramsToKg(totalVerifiedGrams)}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Pilot Target: 300.00 kg ({((totalVerifiedGrams / 1000 / 300) * 100).toFixed(1)}%)
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Payouts Paid</span>
            <CheckCircle2 className="w-4 h-4 text-[#16794C]" />
          </div>
          <div className="text-2xl font-bold text-[#16794C]">
            {formatKoboToNaira(totalPaidKobo)}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Confirmed with real bank transfer references
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Pending Payouts</span>
            <CreditCard className="w-4 h-4 text-[#B54708]" />
          </div>
          <div className="text-2xl font-bold text-[#B54708]">
            {formatKoboToNaira(totalPendingKobo)}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Awaiting bank disbursement approval
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Cylinders</span>
            <Shield className="w-4 h-4 text-[#026AA2]" />
          </div>
          <div className="text-2xl font-bold text-[#010E2A]">
            {recoveries.length}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            100% append-only custody event tracking
          </p>
        </div>
      </div>

      {/* 5-STEP COOLCREDIT FLOW */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h2 className="text-base font-bold text-[#010E2A] mb-4">
          The 5-Step Refrigerant Recovery Process
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="p-4 rounded-lg bg-[#F4F4F6] border border-gray-200">
            <div className="w-7 h-7 rounded-full bg-[#010E2A] text-white flex items-center justify-center font-bold text-xs mb-2">
              1
            </div>
            <h3 className="font-semibold text-sm text-[#010E2A]">1. Recover</h3>
            <p className="text-xs text-gray-600 mt-1">
              Registered technician recovers gas using certified recovery machine and refillable cylinder.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-[#F4F4F6] border border-gray-200">
            <div className="w-7 h-7 rounded-full bg-[#010E2A] text-white flex items-center justify-center font-bold text-xs mb-2">
              2
            </div>
            <h3 className="font-semibold text-sm text-[#010E2A]">2. Record</h3>
            <p className="text-xs text-gray-600 mt-1">
              Log equipment type, refrigerant type, estimated kg, location and photos. Works offline.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-[#F4F4F6] border border-gray-200">
            <div className="w-7 h-7 rounded-full bg-[#010E2A] text-white flex items-center justify-center font-bold text-xs mb-2">
              3
            </div>
            <h3 className="font-semibold text-sm text-[#010E2A]">3. Deliver</h3>
            <p className="text-xs text-gray-600 mt-1">
              Deliver to Lokoja collection point for calibrated weighing and gas-identifier purity test.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-[#F4F4F6] border border-gray-200">
            <div className="w-7 h-7 rounded-full bg-[#010E2A] text-white flex items-center justify-center font-bold text-xs mb-2">
              4
            </div>
            <h3 className="font-semibold text-sm text-[#010E2A]">4. Get Paid</h3>
            <p className="text-xs text-gray-600 mt-1">
              Paid per kg of verified refrigerant (pilot rate ₦4,500/kg) directly to bank account.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-[#F4F4F6] border border-gray-200">
            <div className="w-7 h-7 rounded-full bg-[#010E2A] text-white flex items-center justify-center font-bold text-xs mb-2">
              5
            </div>
            <h3 className="font-semibold text-sm text-[#010E2A]">5. Reclaim/Destroy</h3>
            <p className="text-xs text-gray-600 mt-1">
              Reclamation first; contaminated gas consolidated for approved destruction facility.
            </p>
          </div>
        </div>
      </div>

      {/* RECENT CYLINDER ACTIVITY */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-[#010E2A]">Recent Recoveries</h2>
          <Link
            href="/cylinders"
            className="text-xs font-semibold text-[#16794C] hover:underline flex items-center gap-1"
          >
            View All ({recoveries.length}) <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recoveries.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Package className="w-8 h-8 mx-auto text-gray-400 mb-2" />
            <p className="text-sm">No recoveries logged yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {recoveries.slice(0, 5).map((cyl) => (
              <div
                key={cyl._id}
                className="py-3 flex items-center justify-between flex-wrap gap-2 hover:bg-gray-50 px-2 rounded-lg transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-[#010E2A]">{cyl.code}</span>
                    <span
                      className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                        cyl.status === 'verified'
                          ? 'bg-[#D1EBE0] text-[#010E2A]'
                          : cyl.status === 'reclaimed' || cyl.status === 'destroyed'
                          ? 'bg-[#010E2A] text-white'
                          : cyl.status === 'rejected'
                          ? 'bg-[#FEE4E2] text-[#B42318]'
                          : 'bg-amber-100 text-amber-900'
                      }`}
                    >
                      {cyl.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {cyl.equipment} • {cyl.gas || cyl.gasLogged} •{' '}
                    {cyl.weightGrams
                      ? `Weighed: ${formatGramsToKg(cyl.weightGrams)}`
                      : `Est: ${formatGramsToKg(cyl.estGrams)}`}{' '}
                    • {cyl.location?.text || 'Lokoja'}
                  </p>
                </div>

                <Link
                  href={`/cylinders/${cyl.code}`}
                  className="text-xs font-semibold text-[#16794C] hover:underline"
                >
                  View Record & History →
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

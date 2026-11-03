'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  Users,
  Package,
  CreditCard,
  Truck,
  ShieldCheck,
  Calculator,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { formatKoboToNaira, formatGramsToKg } from '@/lib/payout-calculator';

export default function AdminOverviewPage() {
  const [recoveries, setRecoveries] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [readiness, setReadiness] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [recRes, payRes, rdyRes] = await Promise.all([
          fetch('/api/recoveries'),
          fetch('/api/payouts'),
          fetch('/api/admin/readiness'),
        ]);

        if (recRes.ok) {
          const recData = await recRes.json();
          setRecoveries(recData.recoveries || []);
        }

        if (payRes.ok) {
          const payData = await payRes.json();
          setPayouts(payData.payouts || []);
        }

        if (rdyRes.ok) {
          const rdyData = await rdyRes.json();
          setReadiness(rdyData);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const verifiedCylinders = recoveries.filter((r) =>
    ['verified', 'reclaimed', 'destroyed'].includes(r.status)
  );

  const totalVerifiedGrams = verifiedCylinders.reduce(
    (sum, r) => sum + (r.weightGrams || 0),
    0
  );

  const pendingPayouts = payouts.filter((p) => p.status === 'pending');
  const totalPendingKobo = pendingPayouts.reduce((sum, p) => sum + (p.amountKobo || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#010E2A]">
            Quantro Programme Admin Dashboard
          </h1>
          <p className="text-sm text-gray-600 mt-0.5">
            Lokoja Refrigerant Recovery Operations Management & Custody Control
          </p>
        </div>

        <div className="flex gap-2">
          <Link href="/admin/readiness" className="btn-secondary text-xs">
            <ShieldCheck className="w-4 h-4 text-[#16794C]" /> Decision Matrix
          </Link>
          <Link href="/admin/calculator" className="btn-secondary text-xs">
            <Calculator className="w-4 h-4 text-[#026AA2]" /> Economics Calculator
          </Link>
        </div>
      </div>

      {/* READINESS GATE CALLOUT */}
      {readiness && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between flex-wrap gap-3 ${
            readiness.overallStatus === 'Go'
              ? 'bg-[#D1EBE0] border-[#22B974] text-[#010E2A]'
              : readiness.overallStatus === 'Adjust'
              ? 'bg-[#FEF0C7] border-[#F79009] text-[#7A271A]'
              : 'bg-[#FEE4E2] border-[#F04438] text-[#B42318]'
          }`}
        >
          <div className="flex items-center gap-3">
            <span
              className={`w-3 h-3 rounded-full ${
                readiness.overallStatus === 'Go'
                  ? 'bg-[#16794C]'
                  : readiness.overallStatus === 'Adjust'
                  ? 'bg-[#B54708]'
                  : 'bg-[#B42318]'
              }`}
            />
            <span className="font-bold text-sm">
              Current Programme Gate: {readiness.overallStatus.toUpperCase()} (Score: {readiness.totalScore} / 100)
            </span>
          </div>

          <Link
            href="/admin/readiness"
            className="text-xs font-bold underline hover:opacity-80"
          >
            Review Evidence & Criteria →
          </Link>
        </div>
      )}

      {/* METRIC OVERVIEW CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <span className="text-xs font-semibold uppercase text-gray-500">Verified Recovered</span>
          <div className="text-2xl font-bold text-[#010E2A] mt-1">
            {formatGramsToKg(totalVerifiedGrams)}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {((totalVerifiedGrams / 1000 / 300) * 100).toFixed(1)}% of 300 kg pilot target
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <span className="text-xs font-semibold uppercase text-gray-500">Awaiting Bank Transfer</span>
          <div className="text-2xl font-bold text-[#B54708] mt-1">
            {formatKoboToNaira(totalPendingKobo)}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {pendingPayouts.length} verified payouts pending transfer
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <span className="text-xs font-semibold uppercase text-gray-500">Active Cylinders</span>
          <div className="text-2xl font-bold text-[#010E2A] mt-1">
            {recoveries.length}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {recoveries.filter((r) => r.status === 'recovered').length} in intake queue
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <span className="text-xs font-semibold uppercase text-gray-500">Pilot Payout Rate</span>
          <div className="text-2xl font-bold text-[#16794C] mt-1">
            ₦4,500 / kg
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Paid only after calibrated weighing
          </p>
        </div>
      </div>

      {/* QUICK ADMIN ACTIONS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/admin/technicians"
          className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:border-[#22B974] transition-colors group"
        >
          <div className="flex items-center justify-between mb-2">
            <Users className="w-5 h-5 text-[#16794C]" />
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-[#16794C] transition-colors" />
          </div>
          <h3 className="font-bold text-sm text-[#010E2A]">Technician Certification Registry</h3>
          <p className="text-xs text-gray-500 mt-1">
            Verify training certificates and authorize technicians to log recoveries.
          </p>
        </Link>

        <Link
          href="/payouts"
          className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:border-[#22B974] transition-colors group"
        >
          <div className="flex items-center justify-between mb-2">
            <CreditCard className="w-5 h-5 text-[#B54708]" />
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-[#B54708] transition-colors" />
          </div>
          <h3 className="font-bold text-sm text-[#010E2A]">Manage Bank Disbursements</h3>
          <p className="text-xs text-gray-500 mt-1">
            Export CSV for bank portal upload and record real bank transfer references.
          </p>
        </Link>

        <Link
          href="/dispatch"
          className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:border-[#22B974] transition-colors group"
        >
          <div className="flex items-center justify-between mb-2">
            <Truck className="w-5 h-5 text-[#026AA2]" />
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-[#026AA2] transition-colors" />
          </div>
          <h3 className="font-bold text-sm text-[#010E2A]">Downstream Consolidation</h3>
          <p className="text-xs text-gray-500 mt-1">
            Dispatch verified cylinders for reclamation or approved destruction with certificates.
          </p>
        </Link>
      </div>
    </div>
  );
}

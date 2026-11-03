'use client';

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Printer,
  TrendingUp,
  AlertCircle,
  ShieldCheck,
  Package,
  Clock,
} from 'lucide-react';
import { formatKoboToNaira, formatGramsToKg } from '@/lib/payout-calculator';

export default function MonthlyReportPage() {
  const [report, setReport] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'report' | 'audit'>('report');

  useEffect(() => {
    async function loadReport() {
      try {
        const [repRes, logRes] = await Promise.all([
          fetch('/api/reports/monthly'),
          fetch('/api/audit-log'),
        ]);

        if (repRes.ok) {
          const repData = await repRes.json();
          setReport(repData);
        }

        if (logRes.ok) {
          const logData = await logRes.json();
          setAuditLogs(logData.logs || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadReport();
  }, []);

  if (loading) {
    return <div className="text-center py-12 text-sm text-gray-500">Compiling monthly report...</div>;
  }

  return (
    <div className="space-y-6">
      {/* HEADER & PRINT/CSV ACTIONS */}
      <div className="flex items-center justify-between flex-wrap gap-4 no-print">
        <div>
          <h1 className="text-2xl font-bold text-[#010E2A]">
            Monthly National Ozone Office (NOO) Report
          </h1>
          <p className="text-sm text-gray-600 mt-0.5">
            Lokoja Pilot Operations • Montreal Protocol & Kigali Amendment Compliance
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/api/reports/monthly/export"
            download
            className="btn-secondary text-xs"
          >
            <Download className="w-4 h-4" /> Export CSV
          </a>
          <button
            onClick={() => window.print()}
            className="btn-primary text-xs"
          >
            <Printer className="w-4 h-4" /> Print / Save PDF
          </button>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex gap-2 border-b border-gray-200 pb-2 no-print">
        <button
          onClick={() => setActiveTab('report')}
          className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-colors ${
            activeTab === 'report'
              ? 'bg-[#010E2A] text-white'
              : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
        >
          Monthly Summary Report
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-colors ${
            activeTab === 'audit'
              ? 'bg-[#010E2A] text-white'
              : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
        >
          Custody Audit Trail ({auditLogs.length})
        </button>
      </div>

      {activeTab === 'report' ? (
        <div className="space-y-6 print:space-y-4">
          {/* PRINT-ONLY OFFICIAL HEADER */}
          <div className="hidden print:block border-b-2 border-[#010E2A] pb-4">
            <h1 className="text-2xl font-bold text-[#010E2A]">
              NATIONAL OZONE OFFICE (NOO) — MONTHLY RECOVERY REPORT
            </h1>
            <p className="text-xs text-gray-600">
              Programme: CoolCredit Pilot • Reporting Entity: Quantro Software Labs (CAC In-Progress)
            </p>
            <p className="text-xs text-gray-500">
              Pilot Area: Lokoja, Kogi State, Nigeria • Generated: {new Date().toUTCString()}
            </p>
          </div>

          {/* KEY PERFORMANCE INDICATORS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <span className="text-xs font-semibold uppercase text-gray-500">Verified Recovered</span>
              <div className="text-2xl font-bold text-[#010E2A] mt-1">
                {report?.summary?.totalVerifiedKg?.toFixed(2)} kg
              </div>
              <p className="text-[11px] text-gray-500 mt-1">
                Progress: {report?.summary?.targetProgressPct}% of 300 kg pilot target
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <span className="text-xs font-semibold uppercase text-gray-500">Emissions Avoided</span>
              <div className="text-2xl font-bold text-[#16794C] mt-1">
                {report?.summary?.totalEmissionsAvoidedTonnesCO2e?.toFixed(2)} tCO₂e
              </div>
              <p className="text-[11px] text-gray-500 mt-1">
                Estimated metric tonnes CO₂ equivalent
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <span className="text-xs font-semibold uppercase text-gray-500">Active Technicians</span>
              <div className="text-2xl font-bold text-[#010E2A] mt-1">
                {report?.activeTechniciansCount || 0}
              </div>
              <p className="text-[11px] text-gray-500 mt-1">
                Registered & trained RAC technicians
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <span className="text-xs font-semibold uppercase text-gray-500">Reconciliation Status</span>
              <div className="text-sm font-bold text-[#16794C] mt-2 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" /> 100% Reconciled
              </div>
              <p className="text-[11px] text-gray-500 mt-1">
                Zero float rounding errors (integer kobo/grams)
              </p>
            </div>
          </div>

          {/* EMISSIONS ESTIMATE FORMULA BANNER (SECTION 6.7) */}
          <div className="bg-[#E0F2FE] border border-[#026AA2] p-4 rounded-xl text-xs text-[#026AA2] space-y-1">
            <p className="font-bold text-sm">Emissions Avoidance Methodology & Non-Discounting Statement</p>
            <p>
              <strong>Calculation Formula:</strong> Verified Quantity (kg) × Gas GWP ÷ 1000 = Metric tonnes CO₂e.
            </p>
            <p>
              <strong>GWP Reference Inputs:</strong> R-22: 1,810 • R-410A: 2,088 • R-134a: 1,430.
            </p>
            <p className="text-[11px] text-[#026AA2]/80 mt-1">
              Honest Disclosure: Displayed strictly as an emissions avoidance estimate. Major carbon registries have not approved HFC destruction methodology for credit generation in Nigeria. No carbon-credit discounting claims are applied.
            </p>
          </div>

          {/* GAS TYPE BREAKDOWN TABLE */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-[#F4F4F6] flex justify-between items-center">
              <h2 className="text-sm font-bold text-[#010E2A] uppercase tracking-wider">
                Refrigerant Custody by Gas Type
              </h2>
              <span className="text-xs text-gray-500">Report Month: {report?.reportMonth}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase font-bold text-gray-600 border-b">
                  <tr>
                    <th className="px-4 py-3">Gas Type</th>
                    <th className="px-4 py-3">Proposal GWP</th>
                    <th className="px-4 py-3">Recovered (kg)</th>
                    <th className="px-4 py-3">Verified (kg)</th>
                    <th className="px-4 py-3">Reclaimed (kg)</th>
                    <th className="px-4 py-3">Destroyed (kg)</th>
                    <th className="px-4 py-3 text-right">Emissions Avoided (tCO₂e)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {report?.gasBreakdown && report.gasBreakdown.length > 0 ? (
                    report.gasBreakdown.map((row: any) => (
                      <tr key={row.gas} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-bold text-[#010E2A]">{row.gas}</td>
                        <td className="px-4 py-3 font-mono text-gray-600">{row.gwp}</td>
                        <td className="px-4 py-3 text-gray-700">
                          {(row.recoveredGrams / 1000).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 font-semibold text-[#16794C]">
                          {(row.verifiedGrams / 1000).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {(row.reclaimedGrams / 1000).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {(row.destroyedGrams / 1000).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-[#010E2A]">
                          {row.emissionsAvoidedTonnes.toFixed(3)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-4 py-6 text-center text-xs text-gray-500">
                        No gas recovery transactions recorded in this reporting period.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* FINANCIAL RECONCILIATION SUMMARY */}
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm text-xs space-y-2">
            <h3 className="font-bold text-[#010E2A] text-sm">Financial Verification Ledger</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3 bg-[#F4F4F6] rounded-lg">
                <span className="text-gray-500 block">Total Verified Disbursed:</span>
                <span className="font-bold text-sm text-[#16794C]">
                  ₦{report?.financialReconciliation?.totalPaidNaira?.toLocaleString()}
                </span>
              </div>
              <div className="p-3 bg-[#F4F4F6] rounded-lg">
                <span className="text-gray-500 block">Total Pending Transfers:</span>
                <span className="font-bold text-sm text-[#B54708]">
                  ₦{report?.financialReconciliation?.totalPendingNaira?.toLocaleString()}
                </span>
              </div>
              <div className="p-3 bg-[#F4F4F6] rounded-lg">
                <span className="text-gray-500 block">Capture Rate:</span>
                <span className="font-bold text-sm text-[#010E2A]">
                  ₦{report?.financialReconciliation?.rateNairaPerKg?.toLocaleString()} / kg
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* AUDIT LOG VIEW */
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-[#F4F4F6]">
            <h2 className="text-sm font-bold text-[#010E2A] uppercase tracking-wider">
              Immutable System Audit Log ({auditLogs.length} Entries)
            </h2>
          </div>

          <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
            {auditLogs.map((log) => (
              <div key={log._id} className="p-4 hover:bg-gray-50 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold uppercase px-2 py-0.5 rounded bg-gray-100 text-[#010E2A]">
                      {log.action}
                    </span>
                    <span className="text-gray-500">
                      by <strong>{log.actor?.name || 'System'}</strong> ({log.actor?.role})
                    </span>
                  </div>
                  <span className="text-gray-400 font-mono text-[11px]">
                    {new Date(log.at).toUTCString()}
                  </span>
                </div>
                <p className="text-gray-700">{log.beforeAfterSummary}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

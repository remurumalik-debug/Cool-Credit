'use client';

import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Download,
  CheckCircle2,
  Clock,
  Printer,
  FileSpreadsheet,
  AlertCircle,
  Building,
} from 'lucide-react';
import { formatKoboToNaira, formatGramsToKg } from '@/lib/payout-calculator';

export default function PayoutsPage() {
  const [session, setSession] = useState<any>(null);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [reconciliation, setReconciliation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  // Mark Paid modal
  const [selectedPayout, setSelectedPayout] = useState<any | null>(null);
  const [transferRef, setTransferRef] = useState('');
  const [submittingRef, setSubmittingRef] = useState(false);

  // Receipt Modal
  const [receiptPayout, setReceiptPayout] = useState<any | null>(null);

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = async () => {
    try {
      const [meRes, payRes, recRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/payouts'),
        fetch('/api/payouts/reconciliation'),
      ]);

      if (meRes.ok) {
        const meData = await meRes.json();
        setSession(meData.user);
      }

      if (payRes.ok) {
        const payData = await payRes.json();
        setPayouts(payData.payouts || []);
      }

      if (recRes.ok) {
        const recData = await recRes.json();
        setReconciliation(recData.summary);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleMarkPaid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayout) return;

    if (!transferRef.trim() || transferRef.trim().length < 4) {
      setMessage({ type: 'error', text: 'Valid bank transfer reference required.' });
      return;
    }

    setSubmittingRef(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/payouts/${selectedPayout._id}/mark-paid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference: transferRef.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to mark as paid');
      }

      setMessage({
        type: 'success',
        text: `Payout for ${selectedPayout.code} marked as PAID with ref: ${transferRef.trim()}`,
      });
      setSelectedPayout(null);
      setTransferRef('');
      await loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSubmittingRef(false);
    }
  };

  const filteredPayouts = payouts.filter((p) => {
    if (statusFilter === 'all') return true;
    return p.status === statusFilter;
  });

  const totalPaidKobo = payouts
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + (p.amountKobo || 0), 0);

  const totalPendingKobo = payouts
    .filter((p) => p.status === 'pending')
    .reduce((sum, p) => sum + (p.amountKobo || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#010E2A]">Refrigerant Recovery Payouts</h1>
          <p className="text-sm text-gray-600 mt-0.5">
            Verified payouts calculated strictly as integer kobo: round(grams × rateKobo ÷ 1000).
          </p>
        </div>

        {session?.role === 'admin' && (
          <a
            href="/api/payouts/export-csv"
            download
            className="btn-primary text-xs"
          >
            <Download className="w-4 h-4" /> Export CSV for Bank Transfer
          </a>
        )}
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-[#D1EBE0] text-[#010E2A] border border-[#22B974]'
              : 'bg-[#FEE4E2] text-[#B42318] border border-[#F04438]'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-[#16794C] shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-[#B42318] shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <span className="text-xs font-semibold uppercase text-gray-500">Total Paid Out</span>
          <div className="text-2xl font-bold text-[#16794C] mt-1">
            {formatKoboToNaira(totalPaidKobo)}
          </div>
          <p className="text-[11px] text-gray-500 mt-1">Confirmed with bank reference</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <span className="text-xs font-semibold uppercase text-gray-500">Pending Disbursement</span>
          <div className="text-2xl font-bold text-[#B54708] mt-1">
            {formatKoboToNaira(totalPendingKobo)}
          </div>
          <p className="text-[11px] text-gray-500 mt-1">Verified; awaiting payment</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <span className="text-xs font-semibold uppercase text-gray-500">Pilot Payout Rate</span>
          <div className="text-2xl font-bold text-[#010E2A] mt-1">₦4,500 / kg</div>
          <p className="text-[11px] text-gray-500 mt-1">Configurable rate (captured at verification)</p>
        </div>
      </div>

      {/* RECONCILIATION SUMMARY (ADMIN / REGULATOR) */}
      {session && ['admin', 'regulator'].includes(session.role) && reconciliation && (
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm text-xs flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <span
              className={`w-3 h-3 rounded-full ${
                reconciliation.isReconciled ? 'bg-[#16794C]' : 'bg-red-500'
              }`}
            />
            <span className="font-bold text-[#010E2A]">
              Ledger Reconciliation: {reconciliation.isReconciled ? '100% Reconciled' : 'Discrepancy Found'}
            </span>
          </div>
          <div className="text-gray-600 flex items-center gap-4">
            <span>Verified Recovered: <strong>{reconciliation.totalVerifiedKg} kg</strong></span>
            <span>Total Value: <strong>₦{reconciliation.totalCalculatedNaira.toLocaleString()}</strong></span>
          </div>
        </div>
      )}

      {/* FILTER TABS */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
        {['all', 'pending', 'paid'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${
              statusFilter === st
                ? 'bg-[#010E2A] text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {st} ({payouts.filter((p) => (st === 'all' ? true : p.status === st)).length})
          </button>
        ))}
      </div>

      {/* PAYOUTS TABLE */}
      {loading ? (
        <div className="text-center py-12 text-sm text-gray-500">Loading payout records...</div>
      ) : filteredPayouts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200 text-gray-500">
          <CreditCard className="w-10 h-10 mx-auto text-gray-300 mb-2" />
          <p className="font-semibold text-sm text-[#010E2A]">No payouts found</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#F4F4F6] text-xs uppercase font-bold text-gray-600 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3">Cylinder Code</th>
                  <th className="px-4 py-3">Technician / Beneficiary</th>
                  <th className="px-4 py-3">Verified Net</th>
                  <th className="px-4 py-3">Amount (NGN)</th>
                  <th className="px-4 py-3">Bank Details</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Transfer Ref</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPayouts.map((p) => (
                  <tr key={p._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-[#010E2A]">{p.code}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {p.techName || p.bank?.accountName || 'Technician'}
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-700">
                      {formatGramsToKg(p.grams)}
                    </td>
                    <td className="px-4 py-3 font-bold text-[#16794C]">
                      {formatKoboToNaira(p.amountKobo)}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {p.bank ? (
                        <>
                          <span className="font-semibold block">{p.bank.bankName}</span>
                          <span className="font-mono">{p.bank.accountNumber}</span>
                        </>
                      ) : (
                        <span className="text-gray-400">Not recorded</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                          p.status === 'paid'
                            ? 'bg-[#D1EBE0] text-[#010E2A]'
                            : 'bg-[#FEF0C7] text-[#B54708]'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-700">
                      {p.reference || <span className="text-gray-400 italic">None</span>}
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      {session?.role === 'admin' && p.status === 'pending' && (
                        <button
                          onClick={() => {
                            setSelectedPayout(p);
                            setTransferRef('');
                          }}
                          className="bg-[#22B974] text-[#010E2A] text-xs font-bold px-2.5 py-1 rounded hover:bg-[#2ECD8A]"
                        >
                          Mark Paid
                        </button>
                      )}
                      <button
                        onClick={() => setReceiptPayout(p)}
                        className="text-xs font-semibold text-[#16794C] hover:underline"
                      >
                        Receipt
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MARK PAID MODAL */}
      {selectedPayout && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-lg text-[#010E2A]">Mark Payout as Paid</h3>
            <p className="text-xs text-gray-600">
              Per Principle 5: Enter the authentic bank transfer reference (NIP session ID or transfer receipt number). Payout status cannot be updated without a real reference.
            </p>

            <div className="bg-[#F4F4F6] p-3 rounded-lg text-xs space-y-1">
              <p><strong>Cylinder:</strong> {selectedPayout.code}</p>
              <p><strong>Beneficiary:</strong> {selectedPayout.techName}</p>
              <p><strong>Bank:</strong> {selectedPayout.bank?.bankName} ({selectedPayout.bank?.accountNumber})</p>
              <p><strong>Amount:</strong> {formatKoboToNaira(selectedPayout.amountKobo)}</p>
            </div>

            <form onSubmit={handleMarkPaid} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#010E2A] uppercase mb-1">
                  Bank Transfer Reference / Session ID *
                </label>
                <input
                  type="text"
                  required
                  value={transferRef}
                  onChange={(e) => setTransferRef(e.target.value)}
                  placeholder="e.g. NIP/FBN/20261028/894102"
                  className="w-full bg-[#F4F4F6] border border-gray-300 rounded-lg p-2.5 text-xs font-mono text-[#010E2A] focus:outline-none focus:ring-2 focus:ring-[#22B974]"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={submittingRef}
                  className="btn-primary flex-1 text-xs py-2.5"
                >
                  {submittingRef ? 'Confirming...' : 'Confirm Payment'}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPayout(null)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECEIPT MODAL (SECTION 6.5) */}
      {receiptPayout && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="border-b pb-3 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg text-[#010E2A]">COOLCREDIT RECEIPT</h3>
                <p className="text-[10px] text-gray-500 uppercase">Refrigerant Recovery Incentive</p>
              </div>
              <span className="font-mono text-xs font-bold text-[#010E2A]">
                {receiptPayout.code}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Beneficiary:</span>
                <span className="font-semibold text-gray-900">{receiptPayout.techName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Verified Quantity:</span>
                <span className="font-semibold text-gray-900">{formatGramsToKg(receiptPayout.grams)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Applied Rate:</span>
                <span className="font-semibold text-gray-900">{formatKoboToNaira(receiptPayout.rateKobo)} / kg</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Total Payout:</span>
                <span className="font-bold text-base text-[#16794C]">
                  {formatKoboToNaira(receiptPayout.amountKobo)}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Status:</span>
                <span className="font-bold uppercase text-[#010E2A]">{receiptPayout.status}</span>
              </div>
              {receiptPayout.reference && (
                <div className="flex justify-between py-1 border-b border-gray-100 font-mono text-[11px]">
                  <span className="text-gray-500">Transfer Ref:</span>
                  <span className="text-gray-900">{receiptPayout.reference}</span>
                </div>
              )}
            </div>

            <p className="text-[10px] text-gray-400 italic text-center">
              Issued by Quantro Software Labs • Lokoja RAC Pilot Operations
            </p>

            <div className="flex gap-2 pt-2">
              <button onClick={() => window.print()} className="btn-primary flex-1 text-xs">
                <Printer className="w-3.5 h-3.5" /> Print Receipt
              </button>
              <button
                onClick={() => setReceiptPayout(null)}
                className="btn-secondary flex-1 text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

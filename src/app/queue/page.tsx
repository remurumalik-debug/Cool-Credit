'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ListOrdered,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Scale,
  FlaskConical,
  Package,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { formatGramsToKg, formatKoboToNaira, calculatePayoutKobo } from '@/lib/payout-calculator';
import { DEFAULT_CONFIG } from '@/lib/constants';

export default function OperatorQueuePage() {
  const [queue, setQueue] = useState<any[]>([]);
  const [equipmentList, setEquipmentList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Verification modal state
  const [selectedCylinder, setSelectedCylinder] = useState<any | null>(null);
  const [calibratedWeightKg, setCalibratedWeightKg] = useState('');
  const [confirmedGas, setConfirmedGas] = useState('R-22');
  const [identifierResult, setIdentifierResult] = useState('Purity > 98% single gas confirmed');
  const [scaleSerial, setScaleSerial] = useState('SCALE-LKJ-001');
  const [verifying, setVerifying] = useState(false);

  // Reject modal state
  const [rejectingCylinder, setRejectingCylinder] = useState<any | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejecting, setRejecting] = useState(false);

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = async () => {
    try {
      const [recRes, eqRes] = await Promise.all([
        fetch('/api/recoveries'),
        fetch('/api/equipment'),
      ]);

      if (recRes.ok) {
        const data = await recRes.json();
        // Filter cylinders awaiting verification (status: 'recovered')
        setQueue((data.recoveries || []).filter((r: any) => r.status === 'recovered'));
      }

      if (eqRes.ok) {
        const eqData = await eqRes.json();
        setEquipmentList(eqData.equipment || []);
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

  const openVerifyModal = (cyl: any) => {
    setSelectedCylinder(cyl);
    setCalibratedWeightKg((cyl.estGrams / 1000).toString());
    setConfirmedGas(cyl.gasLogged || 'R-22');
    setIdentifierResult('Purity > 98% confirmed with Ultima Identifier');
    setMessage(null);
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCylinder) return;

    const weightKg = parseFloat(calibratedWeightKg);
    if (isNaN(weightKg) || weightKg <= 0) {
      setMessage({ type: 'error', text: 'Valid calibrated weight (kg) is required.' });
      return;
    }

    setVerifying(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/recoveries/${selectedCylinder._id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          calibratedWeightKg: weightKg,
          confirmedGas,
          identifierResult,
          scaleSerial,
          note: `Verified on ${scaleSerial} with test result: ${identifierResult}`,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Verification failed');
      }

      setMessage({
        type: 'success',
        text: `Cylinder ${selectedCylinder.code} verified successfully! Payout of ₦${(
          data.payout.amountKobo / 100
        ).toLocaleString()} created.`,
      });
      setSelectedCylinder(null);
      await loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setVerifying(false);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingCylinder) return;

    if (!rejectionReason.trim() || rejectionReason.trim().length < 5) {
      setMessage({ type: 'error', text: 'Mandatory reason for rejection is required (minimum 5 characters).' });
      return;
    }

    setRejecting(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/recoveries/${rejectingCylinder._id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectionReason }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Rejection failed');
      }

      setMessage({
        type: 'success',
        text: `Cylinder ${rejectingCylinder.code} rejected. No payout created.`,
      });
      setRejectingCylinder(null);
      setRejectionReason('');
      await loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setRejecting(false);
    }
  };

  // Live variance check in modal
  const estGrams = selectedCylinder?.estGrams || 0;
  const currentWeighedGrams = Math.round(parseFloat(calibratedWeightKg || '0') * 1000);
  const variancePct =
    estGrams > 0 ? (Math.abs(currentWeighedGrams - estGrams) / estGrams) * 100 : 0;
  const isVarianceHigh = variancePct > DEFAULT_CONFIG.varianceThresholdPct;

  const estimatedPayoutKobo = calculatePayoutKobo(
    currentWeighedGrams,
    DEFAULT_CONFIG.payoutRateKobo
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#010E2A]">Collection Point Intake Queue</h1>
          <p className="text-sm text-gray-600 mt-0.5">
            Lokoja Central Collection Point • Calibrated weighing, gas testing, and atomic payout generation.
          </p>
        </div>

        <div className="bg-white px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-600 flex items-center gap-2">
          <Scale className="w-4 h-4 text-[#16794C]" />
          <span>Scale Status: Calibrated (Due 2027)</span>
        </div>
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
            <AlertTriangle className="w-4 h-4 text-[#B42318] shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-sm text-gray-500">Loading intake queue...</div>
      ) : queue.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200 text-gray-500">
          <CheckCircle2 className="w-10 h-10 mx-auto text-[#16794C] mb-2" />
          <h3 className="text-base font-bold text-[#010E2A]">Queue is Clear!</h3>
          <p className="text-xs text-gray-500 mt-1">
            All recovered cylinders have been weighed and verified.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {queue.map((cyl) => (
            <div
              key={cyl._id}
              className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-base text-[#010E2A]">
                    {cyl.code}
                  </span>
                  <span className="bg-amber-100 text-amber-900 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full">
                    Awaiting Weighing
                  </span>
                </div>

                <div className="mt-3 space-y-1 text-xs">
                  <p className="text-gray-600">
                    <strong>Technician:</strong> {cyl.techName || 'Musa Ibrahim'}
                  </p>
                  <p className="text-gray-600">
                    <strong>Logged Gas:</strong> {cyl.gasLogged} ({cyl.equipment})
                  </p>
                  <p className="text-gray-600">
                    <strong>Est. Weight:</strong> {formatGramsToKg(cyl.estGrams)}
                  </p>
                  <p className="text-gray-500 text-[11px]">
                    <strong>Location:</strong> {cyl.location?.text || 'Lokoja'}
                  </p>
                </div>

                {cyl.flags && cyl.flags.length > 0 && (
                  <div className="mt-3 bg-[#FEF0C7] p-2 rounded text-[11px] text-[#7A271A] flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-[#B54708] shrink-0" />
                    <span>Flagged: {cyl.flags[0].message}</span>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-gray-100 flex gap-2">
                <button
                  onClick={() => openVerifyModal(cyl)}
                  className="btn-primary flex-1 text-xs py-2"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Verify & Pay
                </button>
                <button
                  onClick={() => setRejectingCylinder(cyl)}
                  className="btn-secondary text-xs py-2 text-[#B42318] hover:bg-red-50"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* VERIFY MODAL */}
      {selectedCylinder && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-lg text-[#010E2A]">
                  Verify Cylinder {selectedCylinder.code}
                </h3>
                <p className="text-xs text-gray-500">
                  Technician: {selectedCylinder.techName} • Estimated: {formatGramsToKg(selectedCylinder.estGrams)}
                </p>
              </div>
              <button
                onClick={() => setSelectedCylinder(null)}
                className="text-gray-400 hover:text-gray-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleVerifySubmit} className="space-y-4">
              {/* Calibrated Weight */}
              <div>
                <label className="block text-xs font-bold text-[#010E2A] uppercase mb-1">
                  Calibrated Net Weight (kg) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0.05"
                    max="60"
                    required
                    value={calibratedWeightKg}
                    onChange={(e) => setCalibratedWeightKg(e.target.value)}
                    className="w-full bg-[#F4F4F6] border border-gray-300 rounded-lg p-2.5 text-sm font-bold text-[#010E2A] focus:outline-none focus:ring-2 focus:ring-[#22B974]"
                  />
                  <span className="absolute right-3 top-2.5 text-sm font-bold text-gray-500">kg</span>
                </div>
              </div>

              {/* Variance Warning */}
              {isVarianceHigh && (
                <div className="p-3 bg-[#FEF0C7] border border-[#F79009] rounded-lg text-xs text-[#7A271A] flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-[#B54708] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">High Weight Variance Detected ({variancePct.toFixed(1)}%)</p>
                    <p className="text-[11px] mt-0.5">
                      Estimated: {formatGramsToKg(selectedCylinder.estGrams)} vs Calibrated: {calibratedWeightKg} kg. Verify tare weight.
                    </p>
                  </div>
                </div>
              )}

              {/* Confirmed Gas */}
              <div>
                <label className="block text-xs font-bold text-[#010E2A] uppercase mb-1">
                  Confirmed Gas Type (Identifier Result) *
                </label>
                <select
                  value={confirmedGas}
                  onChange={(e) => setConfirmedGas(e.target.value)}
                  className="w-full bg-[#F4F4F6] border border-gray-300 rounded-lg p-2.5 text-sm font-medium text-[#010E2A] focus:outline-none focus:ring-2 focus:ring-[#22B974]"
                >
                  {DEFAULT_CONFIG.gasList.map((g) => (
                    <option key={g.name} value={g.name}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Refrigerant Identifier Test Result */}
              <div>
                <label className="block text-xs font-bold text-[#010E2A] uppercase mb-1">
                  Refrigerant Identifier Purity Test *
                </label>
                <input
                  type="text"
                  required
                  value={identifierResult}
                  onChange={(e) => setIdentifierResult(e.target.value)}
                  placeholder="e.g. 99.1% R-22 purity, 0.9% non-condensable air"
                  className="w-full bg-[#F4F4F6] border border-gray-300 rounded-lg p-2.5 text-xs text-[#010E2A] focus:outline-none focus:ring-2 focus:ring-[#22B974]"
                />
              </div>

              {/* Scale Selection */}
              <div>
                <label className="block text-xs font-bold text-[#010E2A] uppercase mb-1">
                  Calibrated Scale Used
                </label>
                <select
                  value={scaleSerial}
                  onChange={(e) => setScaleSerial(e.target.value)}
                  className="w-full bg-[#F4F4F6] border border-gray-300 rounded-lg p-2 text-xs text-[#010E2A]"
                >
                  {equipmentList
                    .filter((eq) => eq.type === 'Scale')
                    .map((eq) => (
                      <option key={eq.serial} value={eq.serial}>
                        {eq.serial} (Due: {new Date(eq.calibrationDue).toLocaleDateString()})
                      </option>
                    ))}
                  <option value="SCALE-LKJ-001">SCALE-LKJ-001 (Calibrated Hub Scale)</option>
                </select>
              </div>

              {/* Dynamic Payout Summary */}
              <div className="bg-[#D1EBE0] p-3 rounded-lg text-xs space-y-1">
                <div className="flex justify-between font-bold text-[#010E2A]">
                  <span>Calculated Payout:</span>
                  <span className="text-sm text-[#16794C]">
                    {formatKoboToNaira(estimatedPayoutKobo)}
                  </span>
                </div>
                <p className="text-[10px] text-gray-600">
                  Formula: {calibratedWeightKg || 0} kg × ₦4,500/kg = {formatKoboToNaira(estimatedPayoutKobo)}. Payout created atomically with pending status.
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={verifying}
                  className="btn-primary flex-1 text-xs py-3"
                >
                  {verifying ? 'Verifying & Creating Payout...' : 'Verify and Create Payout'}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCylinder(null)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REJECT MODAL */}
      {rejectingCylinder && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-lg text-[#B42318] flex items-center gap-2">
              <XCircle className="w-5 h-5" /> Reject Cylinder {rejectingCylinder.code}
            </h3>
            <p className="text-xs text-gray-600">
              Per Section 6.3, rejected cylinders receive NO payout and a mandatory reason must be recorded in the permanent audit trail.
            </p>

            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#010E2A] uppercase mb-1">
                  Reason for Rejection *
                </label>
                <textarea
                  rows={3}
                  required
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Unusable contaminated mixture of R-22 and hydrocarbons; damaged valve leaking."
                  className="w-full bg-[#F4F4F6] border border-gray-300 rounded-lg p-2.5 text-xs text-[#010E2A] focus:ring-2 focus:ring-red-400 focus:outline-none"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={rejecting}
                  className="btn-danger flex-1 text-xs py-2.5"
                >
                  {rejecting ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
                <button
                  type="button"
                  onClick={() => setRejectingCylinder(null)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

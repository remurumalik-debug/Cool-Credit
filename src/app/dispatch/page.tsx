'use client';

import React, { useState, useEffect } from 'react';
import { Truck, CheckCircle2, AlertTriangle, ShieldCheck, FileCheck, Package } from 'lucide-react';
import { formatGramsToKg } from '@/lib/payout-calculator';

export default function DispatchPage() {
  const [cylinders, setCylinders] = useState<any[]>([]);
  const [shipments, setShipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const [shipmentType, setShipmentType] = useState<'reclamation' | 'destruction'>('reclamation');
  const [destination, setDestination] = useState('Authorized Regional Reclamation Facility, Lagos');
  const [certificateNo, setCertificateNo] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = async () => {
    try {
      const [cylRes, shipRes] = await Promise.all([
        fetch('/api/recoveries'),
        fetch('/api/shipments'),
      ]);

      if (cylRes.ok) {
        const cylData = await cylRes.json();
        // Only cylinders in 'verified' status can move to reclamation or destruction
        setCylinders((cylData.recoveries || []).filter((c: any) => c.status === 'verified'));
      }

      if (shipRes.ok) {
        const shipData = await shipRes.json();
        setShipments(shipData.shipments || []);
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

  const handleToggleCode = (code: string) => {
    setSelectedCodes((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const handleSelectAll = () => {
    if (selectedCodes.length === cylinders.length) {
      setSelectedCodes([]);
    } else {
      setSelectedCodes(cylinders.map((c) => c.code));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCodes.length === 0) {
      setMessage({ type: 'error', text: 'Select at least one verified cylinder for dispatch.' });
      return;
    }

    if (shipmentType === 'destruction' && (!certificateNo.trim() || certificateNo.trim().length < 3)) {
      setMessage({ type: 'error', text: 'Destruction shipments strictly require an approved destruction certificate number.' });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch('/api/shipments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cylinderCodes: selectedCodes,
          destination: destination.trim(),
          type: shipmentType,
          certificateNo: certificateNo.trim(),
          notes: notes.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to dispatch shipment');
      }

      setMessage({
        type: 'success',
        text: `Successfully dispatched ${selectedCodes.length} cylinders for ${shipmentType}!`,
      });
      setSelectedCodes([]);
      setCertificateNo('');
      setNotes('');
      await loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#010E2A]">
          Downstream Custody: Reclamation & Destruction
        </h1>
        <p className="text-sm text-gray-600 mt-0.5">
          Guarded lifecycle transitions: <strong>Reclamation first, destruction last.</strong> Destruction requires approved certificate.
        </p>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* DISPATCH FORM */}
        <div className="lg:col-span-1 bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-[#010E2A] flex items-center gap-2">
            <Truck className="w-4 h-4 text-[#16794C]" /> Create Dispatch Batch
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#010E2A] uppercase mb-1">
                Shipment Destination Route *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShipmentType('reclamation');
                    setDestination('Authorized Regional Reclamation Facility, Lagos');
                  }}
                  className={`p-2.5 rounded-lg text-xs font-bold border transition-colors ${
                    shipmentType === 'reclamation'
                      ? 'bg-[#010E2A] text-white border-[#010E2A]'
                      : 'bg-[#F4F4F6] text-gray-700 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  1. Reclamation (First)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShipmentType('destruction');
                    setDestination('Approved Cement Kiln Co-Processing, Kogi State');
                  }}
                  className={`p-2.5 rounded-lg text-xs font-bold border transition-colors ${
                    shipmentType === 'destruction'
                      ? 'bg-[#010E2A] text-white border-[#010E2A]'
                      : 'bg-[#F4F4F6] text-gray-700 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  2. Destruction (Last)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#010E2A] uppercase mb-1">
                Destination Facility Name *
              </label>
              <input
                type="text"
                required
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full bg-[#F4F4F6] border border-gray-300 rounded-lg p-2.5 text-xs text-[#010E2A] focus:outline-none focus:ring-1 focus:ring-[#22B974]"
              />
            </div>

            {shipmentType === 'destruction' && (
              <div className="p-3 bg-[#FEF0C7] border border-[#F79009] rounded-lg">
                <label className="block text-xs font-bold text-[#7A271A] uppercase mb-1">
                  Mandatory Destruction Certificate # *
                </label>
                <input
                  type="text"
                  required
                  value={certificateNo}
                  onChange={(e) => setCertificateNo(e.target.value)}
                  placeholder="e.g. NESREA-DEST-2026-904"
                  className="w-full bg-white border border-[#F79009] rounded-lg p-2 text-xs font-mono text-[#010E2A] focus:outline-none"
                />
                <p className="text-[10px] text-gray-600 mt-1">
                  Required per Section 6.4: Official destruction certificates must accompany high-temperature kiln co-processing.
                </p>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-[#010E2A] uppercase mb-1">
                Batch Shipment Notes
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Batch consolidated from Lokoja Hub."
                className="w-full bg-[#F4F4F6] border border-gray-300 rounded-lg p-2 text-xs text-[#010E2A]"
              />
            </div>

            <div className="p-3 rounded-lg bg-gray-50 border text-xs">
              <span className="text-gray-500">Selected for Dispatch:</span>
              <p className="font-bold text-sm text-[#010E2A]">
                {selectedCodes.length} cylinders
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting || selectedCodes.length === 0}
              className="btn-primary w-full text-xs py-3 font-bold"
            >
              {submitting ? 'Dispatching Batch...' : `Dispatch ${selectedCodes.length} Cylinders`}
            </button>
          </form>
        </div>

        {/* VERIFIED CYLINDERS SELECTION LIST */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#010E2A]">
              Verified Cylinders Ready for Consolidation ({cylinders.length})
            </h2>
            {cylinders.length > 0 && (
              <button
                onClick={handleSelectAll}
                className="text-xs font-semibold text-[#16794C] hover:underline"
              >
                {selectedCodes.length === cylinders.length ? 'Deselect All' : 'Select All'}
              </button>
            )}
          </div>

          {loading ? (
            <div className="text-center py-8 text-xs text-gray-500">Loading cylinders...</div>
          ) : cylinders.length === 0 ? (
            <div className="text-center py-8 text-xs text-gray-500">
              <Package className="w-8 h-8 mx-auto text-gray-300 mb-2" />
              No verified cylinders currently waiting in storage.
            </div>
          ) : (
            <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
              {cylinders.map((cyl) => (
                <label
                  key={cyl._id}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedCodes.includes(cyl.code)}
                      onChange={() => handleToggleCode(cyl.code)}
                      className="w-4 h-4 text-[#22B974] rounded focus:ring-[#22B974]"
                    />
                    <div>
                      <span className="font-mono font-bold text-sm text-[#010E2A]">
                        {cyl.code}
                      </span>
                      <p className="text-xs text-gray-500">
                        {cyl.gas || cyl.gasLogged} • Weighed: {formatGramsToKg(cyl.weightGrams)} • {cyl.equipment}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#16794C]">Verified ✓</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* COMPLETED SHIPMENTS HISTORY */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
        <h2 className="text-base font-bold text-[#010E2A] mb-3">
          Completed Consolidation Shipments
        </h2>
        {shipments.length === 0 ? (
          <p className="text-xs text-gray-500">No shipments completed yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F4F4F6] text-gray-600 uppercase font-bold border-b">
                <tr>
                  <th className="p-3">Destination</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Cylinders Count</th>
                  <th className="p-3">Destruction Cert #</th>
                  <th className="p-3">Shipped Date</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {shipments.map((s) => (
                  <tr key={s._id} className="hover:bg-gray-50">
                    <td className="p-3 font-semibold text-[#010E2A]">{s.destination}</td>
                    <td className="p-3 uppercase font-bold text-[10px]">
                      <span className="px-2 py-0.5 rounded bg-gray-100">{s.type}</span>
                    </td>
                    <td className="p-3 font-bold">{s.cylinderCodes?.length || 0}</td>
                    <td className="p-3 font-mono">
                      {s.certificateNo || <span className="text-gray-400">N/A (Reclaimed)</span>}
                    </td>
                    <td className="p-3 text-gray-500">{new Date(s.shippedDate).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Package,
  QrCode,
  FileCheck2,
  AlertTriangle,
  ArrowLeft,
  Clock,
  Printer,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Building2,
  Calendar,
} from 'lucide-react';
import { formatKoboToNaira, formatGramsToKg } from '@/lib/payout-calculator';

export default function CylinderDetailPage() {
  const params = useParams();
  const code = params.code as string;

  const [cylinder, setCylinder] = useState<any>(null);
  const [payout, setPayout] = useState<any>(null);
  const [collectionPoint, setCollectionPoint] = useState<any>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCertModal, setShowCertModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [cylRes, qrRes] = await Promise.all([
          fetch(`/api/recoveries/${code}`),
          fetch(`/api/recoveries/${code}/qr`),
        ]);

        if (cylRes.ok) {
          const data = await cylRes.json();
          setCylinder(data.cylinder);
          setPayout(data.payout);
          setCollectionPoint(data.collectionPoint);
        }

        if (qrRes.ok) {
          const qrData = await qrRes.json();
          setQrDataUrl(qrData.qrDataUrl);
        }
      } catch (e) {
        console.error('Failed to load cylinder details', e);
      } finally {
        setLoading(false);
      }
    }

    if (code) {
      loadData();
    }
  }, [code]);

  if (loading) {
    return <div className="text-center py-16 text-sm text-gray-500">Loading cylinder record...</div>;
  }

  if (!cylinder) {
    return (
      <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
        <Package className="w-12 h-12 mx-auto text-gray-300 mb-2" />
        <h2 className="text-lg font-bold text-[#010E2A]">Cylinder Not Found</h2>
        <p className="text-xs text-gray-500 mt-1">No custody record exists for code: {code}</p>
        <Link href="/cylinders" className="btn-secondary mt-4 inline-flex">
          Back to Cylinders Ledger
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <Link
            href="/cylinders"
            className="text-xs font-semibold text-gray-500 hover:text-[#010E2A] flex items-center gap-1 mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Cylinders Ledger
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-mono font-bold text-[#010E2A]">
              {cylinder.code}
            </h1>
            <span
              className={`text-xs uppercase font-bold px-3 py-1 rounded-full ${
                cylinder.status === 'verified'
                  ? 'bg-[#D1EBE0] text-[#010E2A]'
                  : cylinder.status === 'reclaimed' || cylinder.status === 'destroyed'
                  ? 'bg-[#010E2A] text-white'
                  : cylinder.status === 'rejected'
                  ? 'bg-[#FEE4E2] text-[#B42318]'
                  : 'bg-amber-100 text-amber-900'
              }`}
            >
              {cylinder.status}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Registered on {new Date(cylinder.createdAt).toUTCString()}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowQrModal(true)}
            className="btn-secondary text-xs"
          >
            <QrCode className="w-4 h-4" /> QR Label
          </button>
          <button
            onClick={() => setShowCertModal(true)}
            className="btn-primary text-xs"
          >
            <FileCheck2 className="w-4 h-4" /> Custody Certificate
          </button>
        </div>
      </div>

      {/* FRAUD WARNING FLAGS IF ANY */}
      {cylinder.flags && cylinder.flags.length > 0 && (
        <div className="bg-[#FEF0C7] border border-[#F79009] p-4 rounded-xl text-xs text-[#7A271A] space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm text-[#B54708]">
            <AlertTriangle className="w-4 h-4" /> Fraud & Variance Warnings Detected ({cylinder.flags.length})
          </div>
          {cylinder.flags.map((flag: any, idx: number) => (
            <div key={idx} className="bg-white/60 p-2.5 rounded border border-[#F79009]/30">
              <span className="font-bold text-[#B54708] mr-2">[{flag.code}]</span>
              {flag.message}
            </div>
          ))}
        </div>
      )}

      {/* GRID OVERVIEW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Verification Summary */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-3">
          <h2 className="text-xs uppercase font-bold text-gray-500 tracking-wider">Gas & Measurement</h2>
          <div>
            <span className="text-xs text-gray-500">Confirmed Refrigerant:</span>
            <p className="font-bold text-lg text-[#010E2A]">
              {cylinder.gas || cylinder.gasLogged}
            </p>
            {cylinder.gas && cylinder.gas !== cylinder.gasLogged && (
              <span className="text-xs text-amber-700">Logged by tech as: {cylinder.gasLogged}</span>
            )}
          </div>
          <div className="pt-2 border-t border-gray-100 flex justify-between">
            <div>
              <span className="text-[11px] text-gray-500">Calibrated Weight:</span>
              <p className="font-bold text-[#16794C]">
                {cylinder.weightGrams ? formatGramsToKg(cylinder.weightGrams) : 'Pending Weighing'}
              </p>
            </div>
            <div>
              <span className="text-[11px] text-gray-500">Logged Est:</span>
              <p className="font-bold text-gray-700">{formatGramsToKg(cylinder.estGrams)}</p>
            </div>
          </div>
          <div className="pt-2 border-t border-gray-100">
            <span className="text-[11px] text-gray-500">Equipment Serviced:</span>
            <p className="font-semibold text-sm text-[#010E2A]">{cylinder.equipment}</p>
          </div>
        </div>

        {/* Technician & Location */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-3">
          <h2 className="text-xs uppercase font-bold text-gray-500 tracking-wider">Recovery Custody</h2>
          <div>
            <span className="text-xs text-gray-500">Recovered By:</span>
            <p className="font-bold text-sm text-[#010E2A]">{cylinder.techName || 'Musa Ibrahim'}</p>
            <span className="text-[11px] text-gray-500">NARAP Kogi State Chapter</span>
          </div>
          <div className="pt-2 border-t border-gray-100">
            <span className="text-[11px] text-gray-500">Workshop Location:</span>
            <p className="font-semibold text-xs text-[#010E2A]">{cylinder.location?.text || 'Lokoja, Kogi State'}</p>
            {cylinder.location?.lat && (
              <p className="text-[10px] text-gray-500">
                Coords: [{cylinder.location.lat.toFixed(4)}, {cylinder.location.lng.toFixed(4)}]
              </p>
            )}
          </div>
          <div className="pt-2 border-t border-gray-100">
            <span className="text-[11px] text-gray-500">Collection Point:</span>
            <p className="font-semibold text-xs text-[#010E2A]">
              {collectionPoint?.name || 'Lokoja Central Hub (Ganaja)'}
            </p>
          </div>
        </div>

        {/* Financial Payout */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-3">
          <h2 className="text-xs uppercase font-bold text-gray-500 tracking-wider">Payout Record</h2>
          {payout ? (
            <div>
              <span className="text-xs text-gray-500">Payout Amount:</span>
              <p className="font-bold text-xl text-[#16794C]">
                {formatKoboToNaira(payout.amountKobo)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Rate applied: {formatKoboToNaira(payout.rateKobo)} / kg
              </p>
              <div className="pt-2 mt-2 border-t border-gray-100 text-xs">
                <span className="text-gray-500">Status:</span>
                <span
                  className={`ml-2 font-bold px-2 py-0.5 rounded text-[10px] uppercase ${
                    payout.status === 'paid'
                      ? 'bg-[#D1EBE0] text-[#010E2A]'
                      : 'bg-[#FEF0C7] text-[#B54708]'
                  }`}
                >
                  {payout.status}
                </span>
                {payout.reference ? (
                  <p className="mt-1 font-mono text-[11px] text-gray-700">
                    Ref: {payout.reference}
                  </p>
                ) : (
                  <p className="mt-1 text-[11px] text-[#B54708]">
                    Pending bank transfer execution
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="text-gray-500 text-xs">
              <p>Payout pending physical verification at collection point.</p>
              <p className="mt-2 text-[11px]">
                Rate: ₦4,500/kg (pilot rate) paid only after scale weight and gas purity check.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* REJECTION REASON IF REJECTED */}
      {cylinder.status === 'rejected' && cylinder.rejectionReason && (
        <div className="bg-[#FEE4E2] border border-[#F04438] p-4 rounded-xl text-xs text-[#B42318]">
          <p className="font-bold text-sm flex items-center gap-1.5 mb-1">
            <XCircle className="w-4 h-4" /> Rejection Notice
          </p>
          <p className="text-xs">{cylinder.rejectionReason}</p>
        </div>
      )}

      {/* APPEND-ONLY EVENT TIMELINE */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h2 className="text-base font-bold text-[#010E2A] mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#16794C]" /> Immutable Chain-of-Custody Timeline
        </h2>
        <div className="relative pl-6 border-l-2 border-gray-200 space-y-6">
          {cylinder.events && cylinder.events.length > 0 ? (
            cylinder.events.map((evt: any, i: number) => (
              <div key={i} className="relative">
                <span className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-[#010E2A] border-2 border-white ring-2 ring-gray-200" />
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs uppercase px-2 py-0.5 rounded bg-gray-100 text-[#010E2A]">
                    {evt.type}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(evt.at).toUTCString()}
                  </span>
                  <span className="text-[11px] text-gray-500 uppercase font-semibold">
                    (Role: {evt.role})
                  </span>
                </div>
                {evt.note && <p className="text-sm text-gray-700 mt-1">{evt.note}</p>}
              </div>
            ))
          ) : (
            <p className="text-xs text-gray-500">No events logged yet.</p>
          )}
        </div>
      </div>

      {/* MODAL: QR LABEL */}
      {showQrModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center space-y-4 shadow-xl">
            <h3 className="font-bold text-lg text-[#010E2A]">Printable Cylinder QR Label</h3>
            {qrDataUrl && (
              <img
                src={qrDataUrl}
                alt={`QR code for ${cylinder.code}`}
                className="w-48 h-48 mx-auto border p-2 rounded-lg"
              />
            )}
            <div className="text-xs space-y-1">
              <p className="font-mono font-bold text-base text-[#010E2A]">{cylinder.code}</p>
              <p className="text-gray-600">Refrigerant: {cylinder.gas || cylinder.gasLogged}</p>
              <p className="text-gray-500">Lokoja Collection Point • Quantro Labs</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => window.print()} className="btn-primary flex-1 text-xs">
                <Printer className="w-3.5 h-3.5" /> Print Label
              </button>
              <button
                onClick={() => setShowQrModal(false)}
                className="btn-secondary flex-1 text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CHAIN-OF-CUSTODY CERTIFICATE (PRINTABLE) */}
      {showCertModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-8 space-y-6 shadow-2xl my-8">
            <div className="border-b-2 border-[#010E2A] pb-4 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-[#010E2A]">
                  CERTIFICATE OF CUSTODY
                </h2>
                <p className="text-xs text-gray-500 uppercase tracking-widest mt-0.5">
                  Montreal Protocol & Kigali Amendment Refrigerant Recovery
                </p>
              </div>
              <div className="text-right">
                <span className="font-mono font-bold text-sm text-[#010E2A]">{cylinder.code}</span>
                <p className="text-[10px] text-gray-500">Date: {new Date().toLocaleDateString()}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <p className="text-gray-500 uppercase">Programme Operator:</p>
                <p className="font-bold text-[#010E2A]">Quantro Software Labs</p>
                <p className="text-[10px] text-gray-500">CAC Registration in Progress</p>
              </div>
              <div className="space-y-1">
                <p className="text-gray-500 uppercase">Pilot Location:</p>
                <p className="font-bold text-[#010E2A]">Lokoja, Kogi State, Nigeria</p>
                <p className="text-[10px] text-gray-500">Ganaja Central Hub Facility</p>
              </div>
            </div>

            <div className="bg-[#F4F4F6] p-4 rounded-xl space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-gray-500">Recovered Gas:</span>
                  <p className="font-bold text-sm text-[#010E2A]">
                    {cylinder.gas || cylinder.gasLogged}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Calibrated Net Weight:</span>
                  <p className="font-bold text-sm text-[#16794C]">
                    {cylinder.weightGrams ? formatGramsToKg(cylinder.weightGrams) : 'Pending Weighing'}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200">
                <div>
                  <span className="text-gray-500">Technician:</span>
                  <p className="font-semibold text-gray-800">{cylinder.techName || 'Musa Ibrahim'}</p>
                </div>
                <div>
                  <span className="text-gray-500">Current Status:</span>
                  <p className="font-bold uppercase text-[#010E2A]">{cylinder.status}</p>
                </div>
              </div>
            </div>

            {/* Event Audit Trail */}
            <div>
              <h4 className="text-xs font-bold text-gray-700 uppercase mb-2">
                Verified Event Chain
              </h4>
              <div className="text-[11px] space-y-1 text-gray-600 border rounded-lg p-3">
                {cylinder.events?.map((e: any, idx: number) => (
                  <p key={idx}>
                    <strong>[{new Date(e.at).toISOString().slice(0, 16)}] {e.type}:</strong> {e.note}
                  </p>
                ))}
              </div>
            </div>

            <p className="text-[10px] text-gray-400 italic">
              Honest Disclosure: Issued by CoolCredit pilot management. Final reclamation/destruction pathways subject to National Ozone Office approval.
            </p>

            <div className="flex gap-3 justify-end pt-2">
              <button onClick={() => window.print()} className="btn-primary text-xs">
                <Printer className="w-4 h-4" /> Print Certificate
              </button>
              <button
                onClick={() => setShowCertModal(false)}
                className="btn-secondary text-xs"
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

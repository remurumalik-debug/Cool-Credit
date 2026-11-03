'use client';

import React, { useState } from 'react';
import { Calculator, CheckCircle2, AlertTriangle, TrendingUp, DollarSign } from 'lucide-react';
import { formatKoboToNaira } from '@/lib/payout-calculator';

export default function UnitEconomicsCalculatorPage() {
  // Inputs (all editable, no default presented as fact)
  const [techPayoutPerKg, setTechPayoutPerKg] = useState(4500); // ₦4,500
  const [collectionCostPerKg, setCollectionCostPerKg] = useState(800); // ₦800 (staff, testing, intake)
  const [transportCostPerKg, setTransportCostPerKg] = useState(500); // ₦500 (haulage from Lokoja)
  const [disposalCostPerKg, setDisposalCostPerKg] = useState(1200); // ₦1,200 (reclamation or destruction fee)
  const [reclaimedGasRevenuePerKg, setReclaimedGasRevenuePerKg] = useState(0); // ₦0 (unsecured)

  // Technician viability test
  const [techTimeCostPerKg, setTechTimeCostPerKg] = useState(1500); // Tech extra labor
  const [techTransportCostPerKg, setTechTransportCostPerKg] = useState(800); // Okada/bus to Ganaja hub
  const [techWearCostPerKg, setTechWearCostPerKg] = useState(400); // Pump & manifold wear

  // Target & Scale
  const [targetKg, setTargetKg] = useState(300); // 300 kg pilot
  const [contingencyPct, setContingencyPct] = useState(15); // 15% contingency
  const [selectedGasGwp, setSelectedGasGwp] = useState(1810); // R-22 default GWP

  // Calculations
  const grossCostPerKg =
    techPayoutPerKg + collectionCostPerKg + transportCostPerKg + disposalCostPerKg;
  const netProgramCostPerKg = grossCostPerKg - reclaimedGasRevenuePerKg;

  // Technician viability test: Payout per kg must exceed technician's costs
  const totalTechCostPerKg = techTimeCostPerKg + techTransportCostPerKg + techWearCostPerKg;
  const techNetIncentivePerKg = techPayoutPerKg - totalTechCostPerKg;
  const isTechnicianIncentivized = techNetIncentivePerKg > 0;

  // Emissions economics: Cost per tonne CO2e avoided = cost per kg / (GWP / 1000)
  const tonnesAvoidedPerKg = selectedGasGwp / 1000;
  const costPerTonneAvoidedNaira =
    tonnesAvoidedPerKg > 0 ? netProgramCostPerKg / tonnesAvoidedPerKg : 0;

  // Total funding requirement
  const baseFundingNeed = targetKg * netProgramCostPerKg;
  const contingencyAmount = (baseFundingNeed * contingencyPct) / 100;
  const totalFundingNeed = baseFundingNeed + contingencyAmount;
  const techPaymentTotalAlone = targetKg * techPayoutPerKg;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#010E2A]">
          Unit-Economics & Pilot Budget Calculator
        </h1>
        <p className="text-sm text-gray-600 mt-0.5">
          Dynamic cost modelling per Section 6.7c. All inputs are editable to test assumptions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* INPUT PARAMETERS */}
        <div className="lg:col-span-2 space-y-6">
          {/* Program Cost Parameters */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-[#010E2A] flex items-center gap-2">
              <Calculator className="w-5 h-5 text-[#16794C]" /> 1. Programme Cost per Verified Kilogram
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#010E2A] uppercase mb-1">
                  Technician Payout (₦ / kg) *
                </label>
                <input
                  type="number"
                  value={techPayoutPerKg}
                  onChange={(e) => setTechPayoutPerKg(Number(e.target.value) || 0)}
                  className="w-full bg-[#F4F4F6] border border-gray-300 rounded-lg p-2.5 text-sm font-bold text-[#010E2A]"
                />
                <p className="text-[10px] text-gray-500 mt-1">Proposal poster pilot rate: ₦4,500/kg</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#010E2A] uppercase mb-1">
                  Collection & Verification Hub (₦ / kg)
                </label>
                <input
                  type="number"
                  value={collectionCostPerKg}
                  onChange={(e) => setCollectionCostPerKg(Number(e.target.value) || 0)}
                  className="w-full bg-[#F4F4F6] border border-gray-300 rounded-lg p-2.5 text-sm font-bold text-[#010E2A]"
                />
                <p className="text-[10px] text-gray-500 mt-1">Intake, scale maintenance, testing reagents</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#010E2A] uppercase mb-1">
                  Regional Transport Haulage (₦ / kg)
                </label>
                <input
                  type="number"
                  value={transportCostPerKg}
                  onChange={(e) => setTransportCostPerKg(Number(e.target.value) || 0)}
                  className="w-full bg-[#F4F4F6] border border-gray-300 rounded-lg p-2.5 text-sm font-bold text-[#010E2A]"
                />
                <p className="text-[10px] text-gray-500 mt-1">Consolidated delivery from Lokoja</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#010E2A] uppercase mb-1">
                  Reclamation / Destruction Fee (₦ / kg)
                </label>
                <input
                  type="number"
                  value={disposalCostPerKg}
                  onChange={(e) => setDisposalCostPerKg(Number(e.target.value) || 0)}
                  className="w-full bg-[#F4F4F6] border border-gray-300 rounded-lg p-2.5 text-sm font-bold text-[#010E2A]"
                />
                <p className="text-[10px] text-gray-500 mt-1">Facility processing or kiln fee</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#010E2A] uppercase mb-1">
                  Reclaimed Gas Resale Off-set (₦ / kg)
                </label>
                <input
                  type="number"
                  value={reclaimedGasRevenuePerKg}
                  onChange={(e) => setReclaimedGasRevenuePerKg(Number(e.target.value) || 0)}
                  className="w-full bg-[#F4F4F6] border border-gray-300 rounded-lg p-2.5 text-sm font-bold text-[#010E2A]"
                />
                <p className="text-[10px] text-gray-500 mt-1">0 until off-taker agreements signed</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#010E2A] uppercase mb-1">
                  Refrigerant GWP (tCO2e / tonne)
                </label>
                <select
                  value={selectedGasGwp}
                  onChange={(e) => setSelectedGasGwp(Number(e.target.value))}
                  className="w-full bg-[#F4F4F6] border border-gray-300 rounded-lg p-2.5 text-sm font-bold text-[#010E2A]"
                >
                  <option value={1810}>R-22 (GWP: 1,810)</option>
                  <option value={2088}>R-410A (GWP: 2,088)</option>
                  <option value={1430}>R-134a (GWP: 1,430)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Technician Test (Viability Check) */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[#010E2A]">
                2. Technician Viability Test
              </h2>
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                  isTechnicianIncentivized
                    ? 'bg-[#D1EBE0] text-[#010E2A]'
                    : 'bg-[#FEE4E2] text-[#B42318]'
                }`}
              >
                {isTechnicianIncentivized ? 'Viable Incentive ✓' : 'Fails: Tech Loses Money ✗'}
              </span>
            </div>

            <p className="text-xs text-gray-600">
              Rule: Payout per kg must exceed technician&apos;s cost of recovering that kg (extra time, transport, equipment wear), otherwise technicians will continue to vent gas.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                  Extra Labor Time (₦/kg)
                </label>
                <input
                  type="number"
                  value={techTimeCostPerKg}
                  onChange={(e) => setTechTimeCostPerKg(Number(e.target.value) || 0)}
                  className="w-full bg-[#F4F4F6] border rounded p-2 text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                  Local Transport to Hub (₦/kg)
                </label>
                <input
                  type="number"
                  value={techTransportCostPerKg}
                  onChange={(e) => setTechTransportCostPerKg(Number(e.target.value) || 0)}
                  className="w-full bg-[#F4F4F6] border rounded p-2 text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                  Equipment / Machine Wear (₦/kg)
                </label>
                <input
                  type="number"
                  value={techWearCostPerKg}
                  onChange={(e) => setTechWearCostPerKg(Number(e.target.value) || 0)}
                  className="w-full bg-[#F4F4F6] border rounded p-2 text-xs font-bold"
                />
              </div>
            </div>

            <div className="bg-[#F4F4F6] p-3 rounded-lg text-xs flex justify-between items-center">
              <span>Technician Total Recovery Cost: <strong>₦{totalTechCostPerKg.toLocaleString()} / kg</strong></span>
              <span>Net Take-home Profit: <strong className={isTechnicianIncentivized ? 'text-[#16794C]' : 'text-[#B42318]'}>₦{techNetIncentivePerKg.toLocaleString()} / kg</strong></span>
            </div>
          </div>

          {/* Scale & Pilot Scope */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-[#010E2A]">3. Pilot Scale & Contingency</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#010E2A] uppercase mb-1">
                  Target Recovery Volume (kg)
                </label>
                <input
                  type="number"
                  value={targetKg}
                  onChange={(e) => setTargetKg(Number(e.target.value) || 0)}
                  className="w-full bg-[#F4F4F6] border border-gray-300 rounded-lg p-2.5 text-sm font-bold text-[#010E2A]"
                />
                <p className="text-[10px] text-gray-500 mt-1">Lokoja 6-month pilot target: 300 kg</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#010E2A] uppercase mb-1">
                  Safety Contingency (%)
                </label>
                <input
                  type="number"
                  value={contingencyPct}
                  onChange={(e) => setContingencyPct(Number(e.target.value) || 0)}
                  className="w-full bg-[#F4F4F6] border border-gray-300 rounded-lg p-2.5 text-sm font-bold text-[#010E2A]"
                />
                <p className="text-[10px] text-gray-500 mt-1">Buffer for logistics & price variance</p>
              </div>
            </div>
          </div>
        </div>

        {/* OUTPUT SUMMARY CARD */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-[#010E2A] text-white p-6 rounded-2xl shadow-lg space-y-5 sticky top-20">
            <div className="border-b border-white/10 pb-4">
              <span className="text-xs uppercase font-semibold text-[#2ECD8A]">Total Programme Cost</span>
              <div className="text-3xl font-black text-white mt-1">
                ₦{netProgramCostPerKg.toLocaleString()} <span className="text-sm font-normal text-[#A9B2C3]">/ kg</span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-[#A9B2C3]">
                <span>Technician Payout Alone:</span>
                <span className="text-white font-bold">₦{techPayoutPerKg.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-[#A9B2C3]">
                <span>Hub & Operations:</span>
                <span className="text-white font-bold">₦{collectionCostPerKg.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-[#A9B2C3]">
                <span>Haulage & Disposal:</span>
                <span className="text-white font-bold">₦{(transportCostPerKg + disposalCostPerKg).toLocaleString()}</span>
              </div>
            </div>

            {/* Total Pilot Funding Need */}
            <div className="pt-4 border-t border-white/10 space-y-2">
              <span className="text-xs uppercase font-semibold text-[#2ECD8A]">Pilot Funding Required</span>
              <div className="text-2xl font-bold text-white">
                ₦{Math.round(totalFundingNeed).toLocaleString()}
              </div>
              <p className="text-[11px] text-[#A9B2C3]">
                For {targetKg} kg target including {contingencyPct}% contingency (₦{Math.round(contingencyAmount).toLocaleString()}).
              </p>
            </div>

            {/* Sanity Check Example from Section 6.7c */}
            <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-xs space-y-1">
              <p className="font-bold text-[#2ECD8A]">Sanity Check:</p>
              <p className="text-[11px] text-[#A9B2C3]">
                {targetKg} kg × ₦{techPayoutPerKg.toLocaleString()} = <strong>₦{techPaymentTotalAlone.toLocaleString()}</strong> in technician payments alone, before any logistics, testing or equipment.
              </p>
            </div>

            {/* Cost per tonne CO2e Avoided */}
            <div className="pt-3 border-t border-white/10 text-xs">
              <span className="text-gray-400 block">Cost per tonne CO₂e avoided:</span>
              <span className="text-lg font-bold text-[#2ECD8A]">
                ₦{Math.round(costPerTonneAvoidedNaira).toLocaleString()} / tCO₂e
              </span>
              <p className="text-[10px] text-gray-400 mt-0.5">
                Calculated as cost per kg ÷ (GWP ÷ 1000). Upside estimate; no carbon credit claims.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Package, Search, Filter, ArrowRight, ShieldCheck, AlertTriangle } from 'lucide-react';
import { formatGramsToKg } from '@/lib/payout-calculator';

export default function CylindersListPage() {
  const [cylinders, setCylinders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    async function fetchCylinders() {
      try {
        const res = await fetch('/api/recoveries');
        if (res.ok) {
          const data = await res.json();
          setCylinders(data.recoveries || []);
        }
      } catch (e) {
        console.error('Failed to load cylinders', e);
      } finally {
        setLoading(false);
      }
    }
    fetchCylinders();
  }, []);

  const filteredCylinders = cylinders.filter((c) => {
    const matchesSearch =
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      (c.techName && c.techName.toLowerCase().includes(search.toLowerCase())) ||
      (c.gas || c.gasLogged).toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#010E2A]">Cylinder Chain-of-Custody Ledger</h1>
          <p className="text-sm text-gray-600 mt-0.5">
            Cryptographic, append-only history tracking every cylinder from recovery to reclamation or destruction.
          </p>
        </div>

        <Link href="/log" className="btn-primary text-xs">
          + Log New Cylinder
        </Link>
      </div>

      {/* SEARCH AND FILTER BAR */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search code, tech, gas..."
            className="w-full pl-9 pr-3 py-2 bg-[#F4F4F6] border border-gray-300 rounded-lg text-sm text-[#010E2A] focus:outline-none focus:ring-1 focus:ring-[#22B974]"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {['all', 'recovered', 'verified', 'reclaimed', 'destroyed', 'rejected'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors shrink-0 ${
                statusFilter === st
                  ? 'bg-[#010E2A] text-white'
                  : 'bg-[#F4F4F6] text-gray-600 hover:bg-gray-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* CYLINDERS TABLE */}
      {loading ? (
        <div className="text-center py-12 text-sm text-gray-500">Loading cylinder registry...</div>
      ) : filteredCylinders.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200 text-gray-500">
          <Package className="w-10 h-10 mx-auto text-gray-300 mb-2" />
          <p className="font-semibold text-sm text-[#010E2A]">No cylinders found</p>
          <p className="text-xs text-gray-500 mt-1">Try adjusting your search or status filter.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#F4F4F6] text-xs uppercase font-bold text-gray-600 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3">Cylinder Code</th>
                  <th className="px-4 py-3">Technician</th>
                  <th className="px-4 py-3">Gas Type</th>
                  <th className="px-4 py-3">Equipment</th>
                  <th className="px-4 py-3">Quantity</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Logged Date</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCylinders.map((cyl) => (
                  <tr key={cyl._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-[#010E2A]">
                      <div className="flex items-center gap-1.5">
                        <Link
                          href={`/cylinders/${cyl.code}`}
                          className="hover:text-[#16794C] hover:underline"
                        >
                          {cyl.code}
                        </Link>
                        {cyl.flags && cyl.flags.length > 0 && (
                          <span
                            title="Fraud Warning Flagged"
                            className="text-[#B54708] bg-[#FEF0C7] p-0.5 rounded"
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700 font-medium">
                      {cyl.techName || 'Musa Ibrahim'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-[#010E2A]">
                        {cyl.gas || cyl.gasLogged}
                      </span>
                      {cyl.gas && cyl.gas !== cyl.gasLogged && (
                        <span className="text-[10px] text-amber-700 block">
                          (Logged: {cyl.gasLogged})
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{cyl.equipment}</td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-[#010E2A]">
                        {cyl.weightGrams
                          ? formatGramsToKg(cyl.weightGrams)
                          : formatGramsToKg(cyl.estGrams)}
                      </div>
                      <span className="text-[10px] text-gray-500">
                        {cyl.weightGrams ? 'Calibrated Weight' : 'Estimated'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
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
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {new Date(cyl.createdAt).toLocaleDateString('en-GB')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/cylinders/${cyl.code}`}
                        className="text-xs font-semibold text-[#16794C] hover:underline inline-flex items-center gap-1"
                      >
                        Details <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

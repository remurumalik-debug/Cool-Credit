'use client';

import React, { useState, useEffect } from 'react';
import { Users, ShieldCheck, ShieldAlert, CheckCircle2, AlertTriangle, Edit3 } from 'lucide-react';

export default function TechnicianRegistryPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit eligibility modal
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [eligible, setEligible] = useState(false);
  const [trainer, setTrainer] = useState('Engr. Sanusi (NARAP Master Trainer)');
  const [chapter, setChapter] = useState('NARAP Kogi State Chapter');
  const [certificateRef, setCertificateRef] = useState('NARAP-KG-2026-');
  const [trainingDate, setTrainingDate] = useState('2026-10-15');
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        // Filter technicians
        setUsers((data.users || []).filter((u: any) => u.role === 'technician'));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const openEditModal = (u: any) => {
    setSelectedUser(u);
    setEligible(!!u.eligible);
    setTrainer(u.training?.trainer || 'Engr. Sanusi (NARAP Master Trainer)');
    setChapter(u.training?.chapter || 'NARAP Kogi State Chapter');
    setCertificateRef(u.training?.certificateRef || `NARAP-KG-2026-${Math.floor(1000 + Math.random() * 9000)}`);
    setTrainingDate(u.training?.date || '2026-10-15');
    setMessage(null);
  };

  const handleSaveEligibility = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/users/${selectedUser._id}/eligibility`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eligible,
          trainer,
          chapter,
          certificateRef,
          trainingDate,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update eligibility');

      setMessage({
        type: 'success',
        text: `Updated ${selectedUser.name} status to ${eligible ? 'CERTIFIED & ELIGIBLE' : 'INELIGIBLE'}!`,
      });
      setSelectedUser(null);
      await loadUsers();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#010E2A]">
            Technician Certification & Training Registry
          </h1>
          <p className="text-sm text-gray-600 mt-0.5">
            Per Section 6.6: Only registered, NARAP-trained RAC technicians are authorized to log recoveries.
          </p>
        </div>

        <div className="bg-white px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-700">
          Total Technicians: {users.length} ({users.filter((u) => u.eligible).length} Approved)
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
        <div className="text-center py-12 text-sm text-gray-500">Loading technician registry...</div>
      ) : users.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200 text-gray-500">
          <Users className="w-10 h-10 mx-auto text-gray-300 mb-2" />
          <p className="font-semibold text-sm text-[#010E2A]">No technicians registered yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#F4F4F6] text-xs uppercase font-bold text-gray-600 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3">Technician Name</th>
                  <th className="px-4 py-3">Contact & Location</th>
                  <th className="px-4 py-3">Bank Details</th>
                  <th className="px-4 py-3">NARAP Training Status</th>
                  <th className="px-4 py-3">Recovery Eligibility</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-[#010E2A]">
                      {u.name}
                      <span className="text-xs text-gray-500 block font-normal">{u.email}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      <span>{u.phone}</span>
                      <span className="text-gray-400 block">{u.location || 'Lokoja'}</span>
                    </td>
                    <td className="px-4 py-3 text-xs font-mono">
                      {u.bank?.bankName ? (
                        <>
                          <span className="font-semibold text-gray-800 block">{u.bank.bankName}</span>
                          <span>{u.bank.accountNumber}</span>
                        </>
                      ) : (
                        <span className="text-gray-400">None</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {u.training ? (
                        <div>
                          <span className="font-mono font-bold text-gray-800">
                            {u.training.certificateRef}
                          </span>
                          <span className="text-[11px] text-gray-500 block">
                            {u.training.chapter} ({u.training.date})
                          </span>
                        </div>
                      ) : (
                        <span className="text-amber-700 italic">No certificate recorded</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                          u.eligible
                            ? 'bg-[#D1EBE0] text-[#010E2A]'
                            : 'bg-[#FEE4E2] text-[#B42318]'
                        }`}
                      >
                        {u.eligible ? (
                          <>
                            <ShieldCheck className="w-3 h-3 text-[#16794C]" /> Approved
                          </>
                        ) : (
                          <>
                            <ShieldAlert className="w-3 h-3 text-[#B42318]" /> Ineligible
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => openEditModal(u)}
                        className="text-xs font-semibold text-[#16794C] hover:underline inline-flex items-center gap-1"
                      >
                        <Edit3 className="w-3 h-3" /> Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-lg text-[#010E2A]">
              Manage Certification: {selectedUser.name}
            </h3>
            <p className="text-xs text-gray-600">
              Only approve eligibility when the technician has presented a verified certificate of training in good recovery practices under Montreal Protocol guidelines.
            </p>

            <form onSubmit={handleSaveEligibility} className="space-y-4">
              <div>
                <label className="flex items-center gap-2 cursor-pointer bg-[#F4F4F6] p-3 rounded-lg">
                  <input
                    type="checkbox"
                    checked={eligible}
                    onChange={(e) => setEligible(e.target.checked)}
                    className="w-4 h-4 text-[#22B974] rounded"
                  />
                  <span className="text-xs font-bold text-[#010E2A]">
                    Approved & Eligible to Log Refrigerant Recoveries
                  </span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#010E2A] uppercase mb-1">
                  NARAP Certificate Reference # *
                </label>
                <input
                  type="text"
                  required
                  value={certificateRef}
                  onChange={(e) => setCertificateRef(e.target.value)}
                  className="w-full bg-[#F4F4F6] border border-gray-300 rounded-lg p-2 text-xs font-mono text-[#010E2A]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#010E2A] uppercase mb-1">
                  NARAP Chapter *
                </label>
                <input
                  type="text"
                  required
                  value={chapter}
                  onChange={(e) => setChapter(e.target.value)}
                  className="w-full bg-[#F4F4F6] border border-gray-300 rounded-lg p-2 text-xs text-[#010E2A]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#010E2A] uppercase mb-1">
                  Master Trainer Name
                </label>
                <input
                  type="text"
                  value={trainer}
                  onChange={(e) => setTrainer(e.target.value)}
                  className="w-full bg-[#F4F4F6] border border-gray-300 rounded-lg p-2 text-xs text-[#010E2A]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#010E2A] uppercase mb-1">
                  Training Completion Date
                </label>
                <input
                  type="date"
                  value={trainingDate}
                  onChange={(e) => setTrainingDate(e.target.value)}
                  className="w-full bg-[#F4F4F6] border border-gray-300 rounded-lg p-2 text-xs text-[#010E2A]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary flex-1 text-xs py-2.5 font-bold"
                >
                  {saving ? 'Updating...' : 'Save Certification'}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
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

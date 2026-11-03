'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Save,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';

export default function ReadinessDashboardPage() {
  const [assessment, setAssessment] = useState<any>(null);
  const [hardStops, setHardStops] = useState<any[]>([]);
  const [scores, setScores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    async function loadReadiness() {
      try {
        const res = await fetch('/api/admin/readiness');
        if (res.ok) {
          const data = await res.json();
          setAssessment(data);
          setHardStops(data.hardStops || []);
          setScores(data.scores || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadReadiness();
  }, []);

  const handleHardStopToggle = (id: number) => {
    setHardStops((prev) =>
      prev.map((hs) => (hs.id === id ? { ...hs, isSatisfied: !hs.isSatisfied } : hs))
    );
  };

  const handleHardStopNoteChange = (id: number, notes: string) => {
    setHardStops((prev) =>
      prev.map((hs) => (hs.id === id ? { ...hs, notes } : hs))
    );
  };

  const handleScoreChange = (id: string, rating: number) => {
    setScores((prev) =>
      prev.map((sc) => (sc.id === id ? { ...sc, rating } : sc))
    );
  };

  const handleScoreNoteChange = (id: string, notes: string) => {
    setScores((prev) =>
      prev.map((sc) => (sc.id === id ? { ...sc, notes } : sc))
    );
  };

  // Dynamic calculations
  let calculatedScore = 0;
  for (const s of scores) {
    calculatedScore += (Number(s.maxWeight) * (Number(s.rating) || 0)) / 4;
  }
  calculatedScore = Math.round(calculatedScore * 100) / 100;

  const allHardStopsPassed = hardStops.length > 0 && hardStops.every((hs) => Boolean(hs.isSatisfied));

  let statusText: 'Go' | 'Adjust' | 'Hold' = 'Hold';
  if (!allHardStopsPassed) {
    statusText = 'Hold';
  } else if (calculatedScore >= 80) {
    statusText = 'Go';
  } else if (calculatedScore >= 60) {
    statusText = 'Adjust';
  } else {
    statusText = 'Hold';
  }

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/readiness', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hardStops, scores }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save assessment');

      setMessage({
        type: 'success',
        text: 'Readiness decision matrix successfully updated and logged to audit trail.',
      });
      setAssessment(data.assessment);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-sm text-gray-500">Loading readiness criteria...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#010E2A]">Pilot Decision Dashboard</h1>
          <p className="text-sm text-gray-600 mt-0.5">
            Evidence-based decision gatekeeper (Section 6.7b). No automated approvals or implied permits.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary text-xs"
        >
          <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Decision Matrix'}
        </button>
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

      {/* OVERALL PILOT STATUS BANNER */}
      <div
        className={`p-6 rounded-2xl border shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 ${
          statusText === 'Go'
            ? 'bg-[#D1EBE0] border-[#22B974] text-[#010E2A]'
            : statusText === 'Adjust'
            ? 'bg-[#FEF0C7] border-[#F79009] text-[#7A271A]'
            : 'bg-[#FEE4E2] border-[#F04438] text-[#B42318]'
        }`}
      >
        <div className="flex items-center gap-4">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shrink-0 ${
              statusText === 'Go'
                ? 'bg-[#16794C] text-white'
                : statusText === 'Adjust'
                ? 'bg-[#B54708] text-white'
                : 'bg-[#B42318] text-white'
            }`}
          >
            {statusText.toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold">
              Current Programme Gate: {statusText.toUpperCase()}
            </h2>
            <p className="text-xs mt-1 max-w-xl">
              {statusText === 'Go' && 'All hard stops satisfied and weighted score >= 80 points. Full pilot operations authorized.'}
              {statusText === 'Adjust' && 'All hard stops met but score is between 60–79 points. Field team must improve weakest criteria within 30 days.'}
              {statusText === 'Hold' && 'One or more non-negotiable hard stops are open, or weighted score is below 60. Operations and equipment purchases held.'}
            </p>
          </div>
        </div>

        <div className="text-right shrink-0">
          <span className="text-xs uppercase font-semibold block">Total Weighted Score</span>
          <span className="text-3xl font-black">{calculatedScore} / 100</span>
          <span className="text-[11px] block mt-0.5">
            {allHardStopsPassed ? 'Hard stops passed' : 'Hard stops open (HOLD)'}
          </span>
        </div>
      </div>

      {/* 5 HARD STOPS CHECKLIST */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <div>
          <h2 className="text-base font-bold text-[#010E2A] flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-[#B42318]" /> 5 Non-Negotiable Hard Stops
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Any single &quot;NO&quot; blocks all field operations and equipment purchases, regardless of score.
          </p>
        </div>

        <div className="divide-y divide-gray-100">
          {hardStops.map((hs) => (
            <div key={hs.id} className="py-4 space-y-2">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id={`hs-${hs.id}`}
                    checked={hs.isSatisfied}
                    onChange={() => handleHardStopToggle(hs.id)}
                    className="w-5 h-5 mt-0.5 text-[#22B974] rounded focus:ring-[#22B974]"
                  />
                  <div>
                    <label
                      htmlFor={`hs-${hs.id}`}
                      className="font-bold text-sm text-[#010E2A] cursor-pointer"
                    >
                      {hs.id}. {hs.title}
                    </label>
                    <p className="text-xs text-gray-600 mt-0.5">{hs.description}</p>
                  </div>
                </div>

                <span
                  className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full shrink-0 ${
                    hs.isSatisfied
                      ? 'bg-[#D1EBE0] text-[#010E2A]'
                      : 'bg-[#FEE4E2] text-[#B42318]'
                  }`}
                >
                  {hs.isSatisfied ? 'Satisfied' : 'Open Hard Stop'}
                </span>
              </div>

              <div className="pl-8">
                <input
                  type="text"
                  value={hs.notes || ''}
                  onChange={(e) => handleHardStopNoteChange(hs.id, e.target.value)}
                  placeholder="Reference or evidence link (e.g. CAC search status, NOO letter ref)..."
                  className="w-full bg-[#F4F4F6] border border-gray-200 rounded p-1.5 text-xs text-gray-700"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 7 WEIGHTED CRITERIA */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <div>
          <h2 className="text-base font-bold text-[#010E2A] flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#16794C]" /> 7 Weighted Evaluation Criteria (100 Points Max)
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Points = Max Weight × (Rating ÷ 4). Ratings: 0 = Absent, 1 = Early Concept, 2 = Partially Addressed, 3 = Validated, 4 = Fully Proven.
          </p>
        </div>

        <div className="divide-y divide-gray-100">
          {scores.map((sc) => {
            const points = ((sc.maxWeight * (sc.rating || 0)) / 4).toFixed(1);
            return (
              <div key={sc.id} className="py-4 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <span className="font-bold text-sm text-[#010E2A]">{sc.title}</span>
                    <span className="text-xs text-gray-500 ml-2">(Max Weight: {sc.maxWeight} pts)</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-gray-500">Rating (0 to 4):</span>
                    <div className="flex gap-1">
                      {[0, 1, 2, 3, 4].map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => handleScoreChange(sc.id, r)}
                          className={`w-7 h-7 rounded text-xs font-bold transition-colors ${
                            sc.rating === r
                              ? 'bg-[#010E2A] text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                    <span className="font-bold text-sm text-[#16794C] w-16 text-right">
                      {points} pts
                    </span>
                  </div>
                </div>

                <input
                  type="text"
                  value={sc.notes || ''}
                  onChange={(e) => handleScoreNoteChange(sc.id, e.target.value)}
                  placeholder="Evidence or status details..."
                  className="w-full bg-[#F4F4F6] border border-gray-200 rounded p-1.5 text-xs text-gray-700"
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

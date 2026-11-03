'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, Lock, Mail, AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Route based on role
      if (data.user.role === 'technician') {
        router.push('/');
      } else if (data.user.role === 'operator') {
        router.push('/queue');
      } else if (data.user.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/reports');
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="max-w-md mx-auto py-8 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-xl bg-[#22B974] flex items-center justify-center font-black text-2xl text-[#010E2A] mx-auto shadow-sm">
          CC
        </div>
        <h1 className="text-2xl font-bold text-[#010E2A]">Sign In to CoolCredit</h1>
        <p className="text-xs text-gray-600">
          Refrigerant Recovery Custody & Incentive Platform • Lokoja Pilot
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-[#FEE4E2] border border-[#F04438] text-[#B42318] text-xs flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-[#B42318] shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleLogin} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
        <div>
          <label className="block text-xs font-bold text-[#010E2A] uppercase mb-1">
            Email Address
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="technician@workshop.ng"
              className="w-full pl-9 pr-3 py-2.5 bg-[#F4F4F6] border border-gray-300 rounded-lg text-sm text-[#010E2A] focus:outline-none focus:ring-2 focus:ring-[#22B974]"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-[#010E2A] uppercase mb-1">
            Password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-9 pr-3 py-2.5 bg-[#F4F4F6] border border-gray-300 rounded-lg text-sm text-[#010E2A] focus:outline-none focus:ring-2 focus:ring-[#22B974]"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full text-sm font-bold py-3"
        >
          {loading ? 'Authenticating...' : 'Sign In'}
        </button>

        <p className="text-center text-xs text-gray-600 pt-2">
          New RAC technician?{' '}
          <Link href="/register" className="font-bold text-[#16794C] hover:underline">
            Register your workshop
          </Link>
        </p>
      </form>

      {/* QUICK ROLE SELECTOR (FOR SEAMLESS TESTING PER SECTION 5) */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-3">
        <h3 className="font-bold text-xs uppercase tracking-wider text-gray-500">
          Demo Accounts (One-Click Auto-Fill)
        </h3>
        <div className="space-y-1.5 text-xs">
          <button
            type="button"
            onClick={() => handleQuickDemo('tech1@coolcredit.ng', 'TechPass123!')}
            className="w-full text-left p-2 rounded-lg bg-[#F4F4F6] hover:bg-gray-200 transition-colors flex justify-between items-center"
          >
            <div>
              <span className="font-bold text-[#010E2A]">Musa Ibrahim</span>
              <span className="text-gray-500 block text-[11px]">Certified RAC Technician</span>
            </div>
            <span className="text-[10px] font-bold text-[#16794C]">Auto-Fill</span>
          </button>

          <button
            type="button"
            onClick={() => handleQuickDemo('operator@coolcredit.ng', 'OperatorPass123!')}
            className="w-full text-left p-2 rounded-lg bg-[#F4F4F6] hover:bg-gray-200 transition-colors flex justify-between items-center"
          >
            <div>
              <span className="font-bold text-[#010E2A]">Fatima Bello</span>
              <span className="text-gray-500 block text-[11px]">Collection Point Operator</span>
            </div>
            <span className="text-[10px] font-bold text-[#16794C]">Auto-Fill</span>
          </button>

          <button
            type="button"
            onClick={() => handleQuickDemo('admin@coolcredit.ng', 'AdminPass123!')}
            className="w-full text-left p-2 rounded-lg bg-[#F4F4F6] hover:bg-gray-200 transition-colors flex justify-between items-center"
          >
            <div>
              <span className="font-bold text-[#010E2A]">Dr. Aliyu Mohammed</span>
              <span className="text-gray-500 block text-[11px]">Quantro Programme Admin</span>
            </div>
            <span className="text-[10px] font-bold text-[#16794C]">Auto-Fill</span>
          </button>

          <button
            type="button"
            onClick={() => handleQuickDemo('regulator@noo.gov.ng', 'RegulatorPass123!')}
            className="w-full text-left p-2 rounded-lg bg-[#F4F4F6] hover:bg-gray-200 transition-colors flex justify-between items-center"
          >
            <div>
              <span className="font-bold text-[#010E2A]">National Ozone Officer</span>
              <span className="text-gray-500 block text-[11px]">Regulator (Read-Only)</span>
            </div>
            <span className="text-[10px] font-bold text-[#16794C]">Auto-Fill</span>
          </button>
        </div>
      </div>
    </div>
  );
}

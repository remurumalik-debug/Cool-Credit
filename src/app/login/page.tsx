'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, Mail, AlertTriangle } from 'lucide-react';
import { notifyAuthChanged } from '@/lib/auth-events';

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

      notifyAuthChanged();

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

    </div>
  );
}

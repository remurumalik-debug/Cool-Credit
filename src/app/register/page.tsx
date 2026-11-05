'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UserPlus, Lock, Mail, Phone, Building, MapPin, AlertTriangle, ShieldCheck } from 'lucide-react';
import { notifyAuthChanged } from '@/lib/auth-events';

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [bankName, setBankName] = useState('First Bank of Nigeria');
  const [accountNumber, setAccountNumber] = useState('');
  const [location, setLocation] = useState('Ganaja Junction, Lokoja');
  const [consent, setConsent] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const NIGERIAN_BANKS = [
    'Access Bank',
    'First Bank of Nigeria',
    'Guaranty Trust Bank (GTB)',
    'United Bank for Africa (UBA)',
    'Zenith Bank',
    'Fidelity Bank',
    'Stanbic IBTC Bank',
    'Union Bank',
    'Polaris Bank',
    'Kuda Microfinance Bank',
    'OPay / PayCom',
    'Moniepoint MFB',
  ];

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!consent) {
      setError('You must agree to data processing under the Nigeria Data Protection Act.');
      return;
    }

    if (accountNumber && !/^\d{10}$/.test(accountNumber.trim())) {
      setError('Nigerian bank account number must be exactly 10 digits.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          phone: phone.trim(),
          bankName,
          accountNumber: accountNumber.trim(),
          location: location.trim(),
          consent,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      notifyAuthChanged();
      router.push('/');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-[#010E2A]">RAC Technician Registration</h1>
        <p className="text-xs text-gray-600">
          Join the CoolCredit Lokoja Pilot • Get paid for recovered refrigerants
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-[#FEE4E2] border border-[#F04438] text-[#B42318] text-xs flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-[#B42318] shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleRegister} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
        {/* Full Name */}
        <div>
          <label className="block text-xs font-bold text-[#010E2A] uppercase mb-1">
            Full Name (as registered with Bank) *
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Musa Ibrahim"
            className="w-full bg-[#F4F4F6] border border-gray-300 rounded-lg p-2.5 text-sm text-[#010E2A] focus:outline-none focus:ring-2 focus:ring-[#22B974]"
          />
        </div>

        {/* Email & Password */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-[#010E2A] uppercase mb-1">
              Email Address *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tech@workshop.ng"
              className="w-full bg-[#F4F4F6] border border-gray-300 rounded-lg p-2.5 text-sm text-[#010E2A] focus:outline-none focus:ring-2 focus:ring-[#22B974]"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#010E2A] uppercase mb-1">
              Password (min. 8 chars) *
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[#F4F4F6] border border-gray-300 rounded-lg p-2.5 text-sm text-[#010E2A] focus:outline-none focus:ring-2 focus:ring-[#22B974]"
            />
          </div>
        </div>

        {/* Phone & Workshop Location */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-[#010E2A] uppercase mb-1">
              Phone Number (WhatsApp preferred) *
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0803 123 4567"
              className="w-full bg-[#F4F4F6] border border-gray-300 rounded-lg p-2.5 text-sm text-[#010E2A] focus:outline-none focus:ring-2 focus:ring-[#22B974]"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#010E2A] uppercase mb-1">
              Workshop / Area in Lokoja *
            </label>
            <input
              type="text"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Ganaja, Lokoja"
              className="w-full bg-[#F4F4F6] border border-gray-300 rounded-lg p-2.5 text-sm text-[#010E2A] focus:outline-none focus:ring-2 focus:ring-[#22B974]"
            />
          </div>
        </div>

        {/* Bank Details for Verified Payouts */}
        <div className="p-4 rounded-xl bg-[#F4F4F6] border border-gray-200 space-y-3">
          <h3 className="font-bold text-xs uppercase text-[#010E2A]">
            Direct Payout Bank Account Details
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                Bank Name *
              </label>
              <select
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg p-2 text-xs text-[#010E2A]"
              >
                {NIGERIAN_BANKS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                10-Digit NUBAN Account # *
              </label>
              <input
                type="text"
                maxLength={10}
                required
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="10 digit number"
                className="w-full bg-white border border-gray-300 rounded-lg p-2 text-xs font-mono text-[#010E2A]"
              />
            </div>
          </div>
          <p className="text-[10px] text-gray-500">
            Payouts are deposited directly to this account after physical verification at the collection point.
          </p>
        </div>

        {/* NDPA Consent Checkbox */}
        <div className="pt-2">
          <label className="flex items-start gap-2.5 cursor-pointer text-xs text-gray-700">
            <input
              type="checkbox"
              required
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="w-4 h-4 mt-0.5 text-[#22B974] rounded focus:ring-[#22B974]"
            />
            <span>
              I consent to the collection and processing of my contact and recovery records in accordance with the <strong>Nigeria Data Protection Act (NDPA)</strong> for Montreal Protocol reporting and bank payout disbursements.
            </span>
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full text-sm font-bold py-3 mt-2"
        >
          {loading ? 'Creating Account...' : 'Complete Technician Registration'}
        </button>

        <p className="text-center text-xs text-gray-600">
          Already registered?{' '}
          <Link href="/login" className="font-bold text-[#16794C] hover:underline">
            Sign In here
          </Link>
        </p>
      </form>
    </div>
  );
}

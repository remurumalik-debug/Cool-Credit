'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  ShieldCheck,
  ShieldAlert,
  CreditCard,
  MapPin,
  Mail,
  Phone,
  LogOut,
  Building,
  Lock,
} from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setSession(data.user);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  if (loading) {
    return <div className="text-center py-12 text-sm text-gray-500">Loading profile...</div>;
  }

  if (!session) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
        <User className="w-10 h-10 mx-auto text-gray-400 mb-2" />
        <h2 className="text-base font-bold text-[#010E2A]">Not Signed In</h2>
        <p className="text-xs text-gray-500 mt-1">Please log in to manage your account.</p>
        <button onClick={() => router.push('/login')} className="btn-primary mt-4 text-xs">
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#010E2A]">User Account & Credentials</h1>
        <p className="text-sm text-gray-600 mt-0.5">
          Role-based security credentials and verified payout destinations.
        </p>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
              Assigned Role
            </span>
            <p className="font-bold text-base text-[#010E2A] capitalize">{session.role}</p>
          </div>
          <span
            className={`text-xs uppercase font-bold px-3 py-1 rounded-full ${
              session.eligible
                ? 'bg-[#D1EBE0] text-[#010E2A]'
                : 'bg-[#FEF0C7] text-[#B54708]'
            }`}
          >
            {session.eligible ? 'Certified & Approved' : 'Pending Verification'}
          </span>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <span className="text-gray-500 font-semibold uppercase">Full Name</span>
            <p className="font-bold text-sm text-[#010E2A] mt-0.5">{session.name}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-gray-500 font-semibold uppercase">Email</span>
              <p className="font-semibold text-gray-800 mt-0.5">{session.email}</p>
            </div>
            <div>
              <span className="text-gray-500 font-semibold uppercase">Phone</span>
              <p className="font-semibold text-gray-800 mt-0.5">{session.phone || 'N/A'}</p>
            </div>
          </div>

          <div>
            <span className="text-gray-500 font-semibold uppercase">Operating Workshop</span>
            <p className="font-semibold text-gray-800 mt-0.5">{session.location || 'Lokoja, Kogi State'}</p>
          </div>
        </div>

        {/* Bank snapshot if technician */}
        {session.bank && (
          <div className="bg-[#F4F4F6] p-4 rounded-xl space-y-1.5 text-xs">
            <span className="text-gray-500 font-bold uppercase tracking-wider">
              Verified Payout Bank Account
            </span>
            <div className="flex justify-between items-center pt-1 font-mono">
              <span className="font-bold text-sm text-[#010E2A]">{session.bank.bankName}</span>
              <span className="text-sm font-bold text-[#16794C]">
                {session.bank.accountNumber}
              </span>
            </div>
            <p className="text-[10px] text-gray-500">
              Payments are executed only to this verified account after physical scale weighing.
            </p>
          </div>
        )}

        {/* NDPA Notice */}
        <div className="p-3 bg-gray-50 rounded-lg text-[11px] text-gray-500 space-y-1">
          <p className="font-bold text-gray-700">Nigeria Data Protection Act (NDPA) Notice</p>
          <p>
            Your account data is processed strictly for Montreal Protocol compliance reporting, verified chain-of-custody tracking, and bank transfer disbursements. You may request data access or correction by contacting programme management.
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="btn-secondary w-full text-xs text-[#B42318] hover:bg-red-50 py-2.5 font-bold flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </div>
  );
}

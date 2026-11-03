'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home,
  PlusCircle,
  Package,
  CreditCard,
  CheckCircle2,
  ListOrdered,
  Truck,
  BarChart3,
  Users,
  FileText,
  User,
  Wifi,
  WifiOff,
  Globe,
  AlertTriangle,
  LogOut,
  ShieldCheck,
  Calculator,
} from 'lucide-react';
import { translations, SupportedLanguage, LANGUAGE_NAMES } from '@/lib/i18n';
import { getOfflineQueue, syncOfflineQueue } from '@/lib/offline-sync';

interface UserSession {
  userId: string;
  name: string;
  email: string;
  role: 'technician' | 'operator' | 'admin' | 'regulator' | 'funder';
  eligible: boolean;
}

export default function NavigationShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState<SupportedLanguage>('en');
  const [isOnline, setIsOnline] = useState(true);
  const [offlineCount, setOfflineCount] = useState(0);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const t = translations[lang];

  // Fetch current session
  const fetchSession = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();

    // Check online status
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);
      const handleOnline = () => {
        setIsOnline(true);
        handleSync();
      };
      const handleOffline = () => setIsOnline(false);

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      // Check stored language
      const savedLang = localStorage.getItem('coolcredit_lang') as SupportedLanguage;
      if (savedLang && translations[savedLang]) {
        setLang(savedLang);
      }

      // Check offline queue
      setOfflineCount(getOfflineQueue().length);
      const handleQueueUpdate = (e: any) => {
        setOfflineCount(e.detail?.count || getOfflineQueue().length);
      };
      window.addEventListener('coolcredit_queue_updated', handleQueueUpdate);

      // Detect keyboard open/close on mobile
      const handleFocus = (e: FocusEvent) => {
        const target = e.target as HTMLElement;
        if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
          setIsKeyboardOpen(true);
        }
      };
      const handleBlur = () => {
        setIsKeyboardOpen(false);
      };

      window.addEventListener('focusin', handleFocus);
      window.addEventListener('focusout', handleBlur);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        window.removeEventListener('coolcredit_queue_updated', handleQueueUpdate);
        window.removeEventListener('focusin', handleFocus);
        window.removeEventListener('focusout', handleBlur);
      };
    }
  }, []);

  const handleLanguageChange = (newLang: SupportedLanguage) => {
    setLang(newLang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('coolcredit_lang', newLang);
    }
  };

  const handleSync = async () => {
    if (syncing) return;
    setSyncing(true);
    try {
      await syncOfflineQueue();
      setOfflineCount(getOfflineQueue().length);
      router.refresh();
    } finally {
      setSyncing(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setCurrentUser(null);
    router.push('/login');
  };

  // Switch demo user helper
  const handleQuickLogin = async (email: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password:
            email === 'admin@coolcredit.ng'
              ? 'AdminPass123!'
              : email === 'operator@coolcredit.ng'
              ? 'OperatorPass123!'
              : email.startsWith('tech')
              ? 'TechPass123!'
              : email.startsWith('regulator')
              ? 'RegulatorPass123!'
              : 'FunderPass123!',
        }),
      });
      if (res.ok) {
        await fetchSession();
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  // Tabs configured strictly per Section 9:
  // Technician: Home, Log, Cylinders, Payouts, Profile
  // Operator: Queue, Verify, Cylinders, Dispatch, Profile
  // Admin: Overview, Technicians, Cylinders, Payments, Reports
  // Regulator: Overview, Cylinders, Reports, Profile
  // Funder: Overview, Reports, Profile
  const getNavItems = () => {
    const role = currentUser?.role || 'technician';

    if (role === 'technician') {
      return [
        { label: t.nav.home, href: '/', icon: Home },
        { label: t.nav.log, href: '/log', icon: PlusCircle, badge: offlineCount > 0 ? offlineCount : undefined },
        { label: t.nav.cylinders, href: '/cylinders', icon: Package },
        { label: t.nav.payouts, href: '/payouts', icon: CreditCard },
        { label: t.nav.profile, href: '/profile', icon: User },
      ];
    }

    if (role === 'operator') {
      return [
        { label: t.nav.queue, href: '/queue', icon: ListOrdered },
        { label: t.nav.verify, href: '/verify', icon: CheckCircle2 },
        { label: t.nav.cylinders, href: '/cylinders', icon: Package },
        { label: t.nav.dispatch, href: '/dispatch', icon: Truck },
        { label: t.nav.profile, href: '/profile', icon: User },
      ];
    }

    if (role === 'admin') {
      return [
        { label: t.nav.overview, href: '/admin', icon: BarChart3 },
        { label: t.nav.technicians, href: '/admin/technicians', icon: Users },
        { label: t.nav.cylinders, href: '/cylinders', icon: Package },
        { label: t.nav.payments, href: '/payouts', icon: CreditCard },
        { label: t.nav.reports, href: '/reports', icon: FileText },
        { label: 'Readiness', href: '/admin/readiness', icon: ShieldCheck },
        { label: 'Calculator', href: '/admin/calculator', icon: Calculator },
      ];
    }

    if (role === 'regulator') {
      return [
        { label: t.nav.overview, href: '/reports', icon: BarChart3 },
        { label: t.nav.cylinders, href: '/cylinders', icon: Package },
        { label: t.nav.reports, href: '/reports', icon: FileText },
        { label: t.nav.profile, href: '/profile', icon: User },
      ];
    }

    // Funder
    return [
      { label: t.nav.overview, href: '/reports', icon: BarChart3 },
      { label: t.nav.reports, href: '/reports', icon: FileText },
      { label: t.nav.profile, href: '/profile', icon: User },
    ];
  };

  const navItems = getNavItems();

  return (
    <div className="min-h-screen-dvh flex flex-col md:flex-row bg-[#F4F4F6] text-[#010E2A]">
      {/* LEFT SIDEBAR (Tablet & Desktop >= 768px) */}
      <aside className="hidden md:flex flex-col w-64 bg-[#010E2A] text-white p-5 border-r border-[#010E2A]/20 shrink-0">
        <div className="mb-6">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-lg bg-[#22B974] flex items-center justify-center font-black text-xl text-[#010E2A] tracking-wider">
              CC
            </div>
            <div>
              <div className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                CoolCredit
                <span className="text-[10px] uppercase font-semibold bg-[#2ECD8A]/20 text-[#2ECD8A] px-1.5 py-0.5 rounded">
                  Pilot
                </span>
              </div>
              <p className="text-xs text-[#A9B2C3]">Lokoja RAC Recovery</p>
            </div>
          </Link>
        </div>

        {/* User Card */}
        {currentUser ? (
          <div className="bg-white/5 border border-white/10 rounded-lg p-3 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-semibold text-[#2ECD8A]">
                {t.roles[currentUser.role]}
              </span>
              {currentUser.role === 'technician' && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    currentUser.eligible
                      ? 'bg-[#22B974] text-[#010E2A]'
                      : 'bg-[#B54708] text-white'
                  }`}
                >
                  {currentUser.eligible ? 'Certified' : 'Pending Review'}
                </span>
              )}
            </div>
            <p className="font-semibold text-sm text-white truncate mt-1">{currentUser.name}</p>
            <p className="text-xs text-[#A9B2C3] truncate">{currentUser.email}</p>
            <button
              onClick={handleLogout}
              className="mt-3 w-full text-xs text-[#FDA29B] hover:text-white flex items-center justify-center gap-1 py-1 rounded bg-white/5 hover:bg-red-900/40 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </button>
          </div>
        ) : (
          <div className="mb-6">
            <Link
              href="/login"
              className="btn-primary w-full text-center text-sm py-2 rounded-md font-semibold block"
            >
              Sign In / Register
            </Link>
          </div>
        )}

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[#22B974] text-[#010E2A] font-bold shadow-sm'
                    : 'text-[#A9B2C3] hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5 shrink-0" />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className="bg-[#B54708] text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Offline & Language Controls */}
        <div className="pt-4 border-t border-white/10 space-y-3">
          {/* Offline Sync Status */}
          <div className="flex items-center justify-between text-xs text-[#A9B2C3]">
            <span className="flex items-center gap-1.5">
              {isOnline ? (
                <Wifi className="w-4 h-4 text-[#2ECD8A]" />
              ) : (
                <WifiOff className="w-4 h-4 text-[#FDA29B]" />
              )}
              {isOnline ? 'Network Online' : 'Offline Mode'}
            </span>
            {offlineCount > 0 && (
              <button
                onClick={handleSync}
                disabled={!isOnline || syncing}
                className="bg-[#22B974] text-[#010E2A] text-[11px] font-bold px-2 py-0.5 rounded hover:bg-[#2ECD8A] disabled:opacity-50"
              >
                {syncing ? 'Syncing...' : `Sync (${offlineCount})`}
              </button>
            )}
          </div>

          {/* Language Switcher */}
          <div className="flex items-center gap-2 text-xs">
            <Globe className="w-4 h-4 text-[#A9B2C3]" />
            <select
              value={lang}
              onChange={(e) => handleLanguageChange(e.target.value as SupportedLanguage)}
              className="bg-white/10 text-white border border-white/20 text-xs rounded px-2 py-1 w-full focus:outline-none focus:ring-1 focus:ring-[#22B974]"
            >
              {(Object.keys(LANGUAGE_NAMES) as SupportedLanguage[]).map((code) => (
                <option key={code} value={code} className="bg-[#010E2A] text-white">
                  {LANGUAGE_NAMES[code]}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Role Tester (Section 5 Testing Helper) */}
          <div className="pt-2 text-[11px] text-[#A9B2C3]">
            <p className="font-semibold text-white mb-1.5">Quick Switch Account:</p>
            <div className="grid grid-cols-2 gap-1 text-[10px]">
              <button
                onClick={() => handleQuickLogin('tech1@coolcredit.ng')}
                className="bg-white/5 hover:bg-white/10 p-1 rounded text-left truncate text-[#2ECD8A]"
              >
                Tech (Musa)
              </button>
              <button
                onClick={() => handleQuickLogin('operator@coolcredit.ng')}
                className="bg-white/5 hover:bg-white/10 p-1 rounded text-left truncate text-[#2ECD8A]"
              >
                Operator (Fatima)
              </button>
              <button
                onClick={() => handleQuickLogin('admin@coolcredit.ng')}
                className="bg-white/5 hover:bg-white/10 p-1 rounded text-left truncate text-[#2ECD8A]"
              >
                Admin (Lead)
              </button>
              <button
                onClick={() => handleQuickLogin('regulator@noo.gov.ng')}
                className="bg-white/5 hover:bg-white/10 p-1 rounded text-left truncate text-[#2ECD8A]"
              >
                Regulator (NOO)
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-6">
        {/* TOP MOBILE BAR & HONEST STATUS BANNER */}
        <header className="bg-[#010E2A] text-white px-4 py-2.5 flex items-center justify-between border-b border-[#010E2A]/20 md:hidden sticky top-0 z-40">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-[#22B974] flex items-center justify-center font-black text-sm text-[#010E2A]">
              CC
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight">CoolCredit</span>
              <span className="text-[9px] uppercase font-semibold bg-[#2ECD8A]/20 text-[#2ECD8A] px-1 py-0.2 rounded ml-1.5">
                Pilot
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            {/* Language dropdown mobile */}
            <select
              value={lang}
              onChange={(e) => handleLanguageChange(e.target.value as SupportedLanguage)}
              aria-label="Select Language"
              className="bg-white/10 text-white text-[11px] rounded px-1.5 py-1 border border-white/20"
            >
              {(Object.keys(LANGUAGE_NAMES) as SupportedLanguage[]).map((code) => (
                <option key={code} value={code} className="bg-[#010E2A] text-white">
                  {LANGUAGE_NAMES[code]}
                </option>
              ))}
            </select>

            {/* Offline indicator */}
            {!isOnline && (
              <span className="bg-[#B54708] text-white text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                <WifiOff className="w-3 h-3" /> Offline
              </span>
            )}
            {offlineCount > 0 && isOnline && (
              <button
                onClick={handleSync}
                className="bg-[#22B974] text-[#010E2A] text-[10px] font-bold px-2 py-0.5 rounded"
              >
                Sync ({offlineCount})
              </button>
            )}
          </div>
        </header>

        {/* HONEST STATUS DISCLAIMER (SECTION 3 & 4) */}
        <div className="bg-[#FEF0C7] border-b border-[#F79009] px-4 py-2 text-xs text-[#7A271A] flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#B54708] shrink-0" />
            <span>
              <strong>Pilot Notice:</strong> Lokoja operations in prep. Quantro CAC registration in progress; NOO proposal submitted 27 Oct 2026 (unapproved). ₦4,500/kg configurable pilot rate paid only after physical verification. No fake payouts or unverified carbon claims.
            </span>
          </div>
        </div>

        {/* PAGE CONTENT */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>

      {/* MOBILE BOTTOM TAB BAR (Section 9: Below 768px, 3-5 tabs, min touch target 44px, height 56px + safe-area, hides with keyboard) */}
      {!isKeyboardOpen && (
        <nav
          aria-label="Mobile Navigation"
          className="md:hidden fixed bottom-0 left-0 right-0 bg-[#010E2A] text-white border-t border-white/10 z-50 safe-tab-height"
        >
          <div className="flex items-center justify-around h-[56px] px-1">
            {navItems.slice(0, 5).map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex flex-col items-center justify-center flex-1 min-h-[44px] relative py-1 transition-colors ${
                    isActive ? 'text-[#2ECD8A] font-bold' : 'text-[#A9B2C3]'
                  }`}
                >
                  <Icon className="w-5 h-5 mb-0.5" />
                  <span className="text-[10px] leading-tight tracking-tight truncate max-w-[64px]">
                    {item.label}
                  </span>
                  {/* Visual active indicator (color + bar, never color alone per Section 9) */}
                  {isActive && (
                    <span className="absolute top-0 w-8 h-0.5 bg-[#2ECD8A] rounded-full" />
                  )}
                  {item.badge !== undefined && (
                    <span className="absolute top-1 right-2 bg-[#B54708] text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}

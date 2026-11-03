'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  PlusCircle,
  MapPin,
  Camera,
  CheckCircle2,
  AlertTriangle,
  WifiOff,
  ShieldAlert,
  Info,
} from 'lucide-react';
import { EQUIPMENT_TYPES, DEFAULT_CONFIG } from '@/lib/constants';
import { saveToOfflineQueue } from '@/lib/offline-sync';

export default function LogRecoveryPage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [equipment, setEquipment] = useState('Split AC');
  const [gasLogged, setGasLogged] = useState('R-22');
  const [estKg, setEstKg] = useState('');
  const [locationText, setLocationText] = useState('Lokoja Central Workshop');
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [geoStatus, setGeoStatus] = useState<string>('idle'); // 'idle' | 'fetching' | 'success' | 'denied'
  const [photos, setPhotos] = useState<{ url: string; type: 'cylinder' | 'equipment' }[]>([]);
  const [note, setNote] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadUser() {
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
    loadUser();

    // Auto-attempt geolocation on load
    detectLocation();
  }, []);

  const detectLocation = () => {
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      setGeoStatus('fetching');
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLat(pos.coords.latitude);
          setLng(pos.coords.longitude);
          setAccuracy(pos.coords.accuracy);
          setGeoStatus('success');
        },
        (err) => {
          console.warn('Geolocation denied or failed', err);
          setGeoStatus('denied');
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setGeoStatus('denied');
    }
  };

  // Mock photo upload handler (creates base64 / data URL)
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'cylinder' | 'equipment') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setPhotos((prev) => [...prev.filter((p) => p.type !== type), { url: reader.result as string, type }]);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const kgNum = parseFloat(estKg);
    if (isNaN(kgNum) || kgNum <= 0) {
      setErrorMessage('Please enter a valid estimated weight in kilograms.');
      return;
    }

    if (kgNum > 50) {
      setErrorMessage('A single recovery cylinder capacity cannot exceed 50 kg.');
      return;
    }

    setSubmitting(true);

    const payload = {
      equipment,
      gasLogged,
      estKg: kgNum,
      estGrams: Math.round(kgNum * 1000),
      locationText,
      lat: lat || 7.8012, // fallback to Lokoja coordinates if denied
      lng: lng || 6.7415,
      accuracy: accuracy || 10,
      photos,
      note,
    };

    // If device is offline, queue locally immediately!
    if (typeof window !== 'undefined' && !navigator.onLine) {
      saveToOfflineQueue({
        equipment: payload.equipment,
        gasLogged: payload.gasLogged,
        estGrams: payload.estGrams,
        location: {
          text: payload.locationText,
          lat: payload.lat,
          lng: payload.lng,
          accuracy: payload.accuracy,
        },
        photos: payload.photos,
      });

      setSubmitting(false);
      setSuccessMessage('Saved offline! Your recovery has been queued on this device and will sync automatically once network is restored.');
      resetForm();
      return;
    }

    // Online submission
    try {
      const res = await fetch('/api/recoveries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit recovery');
      }

      setSuccessMessage(`Recovery logged successfully! Cylinder Code: ${data.cylinder.code}. Bring the cylinder to Lokoja Central Hub for verification.`);
      resetForm();
    } catch (err: any) {
      // If network failure occurs during POST, save offline as graceful fallback
      if (!navigator.onLine || err.message.includes('fetch')) {
        saveToOfflineQueue({
          equipment: payload.equipment,
          gasLogged: payload.gasLogged,
          estGrams: payload.estGrams,
          location: {
            text: payload.locationText,
            lat: payload.lat,
            lng: payload.lng,
            accuracy: payload.accuracy,
          },
          photos: payload.photos,
        });
        setSuccessMessage('Network connection dropped. Saved offline to device queue.');
        resetForm();
      } else {
        setErrorMessage(err.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setEstKg('');
    setNote('');
    setPhotos([]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-sm text-gray-500">
        Loading technician credentials...
      </div>
    );
  }

  // Check certification eligibility per Section 6.6
  if (session && session.role === 'technician' && !session.eligible) {
    return (
      <div className="max-w-xl mx-auto bg-white p-6 rounded-xl border border-amber-200 shadow-sm mt-4">
        <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-[#B54708] mb-4">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold text-[#010E2A] mb-2">Certification Approval Required</h1>
        <p className="text-sm text-gray-600 mb-4 leading-relaxed">
          The CoolCredit proposal adheres to Nigeria&apos;s Kigali Implementation Plan, which requires that only registered, trained RAC technicians log recoveries.
        </p>
        <div className="bg-[#F4F4F6] p-4 rounded-lg text-xs space-y-2 mb-6">
          <p>
            <strong>Status:</strong> Pending NARAP Training Verification
          </p>
          <p>
            <strong>Technician Name:</strong> {session.name}
          </p>
          <p>
            <strong>Assigned Chapter:</strong> NARAP Kogi State Chapter
          </p>
          <p className="text-gray-500">
            Once an administrator reviews your training certificate in the registry, your account will be activated to log recoveries.
          </p>
        </div>
        <button
          onClick={() => router.push('/')}
          className="btn-secondary w-full text-center text-sm"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#010E2A]">Log Used Refrigerant Recovery</h1>
        <p className="text-sm text-gray-600 mt-1">
          Record recovered gas from refrigeration or air-conditioning equipment. Ensure certified cylinders and recovery machines are used.
        </p>
      </div>

      {successMessage && (
        <div className="p-4 rounded-xl bg-[#D1EBE0] border border-[#22B974] text-[#010E2A] text-sm flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-[#16794C] shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold">Recovery Recorded</p>
            <p className="text-xs mt-1">{successMessage}</p>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-[#FEE4E2] border border-[#F04438] text-[#B42318] text-sm flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-[#B42318] shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold">Error</p>
            <p className="text-xs mt-1">{errorMessage}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-5">
        {/* Equipment Selection */}
        <div>
          <label className="block text-xs font-bold text-[#010E2A] uppercase tracking-wider mb-1.5">
            Equipment Serviced *
          </label>
          <select
            value={equipment}
            onChange={(e) => setEquipment(e.target.value)}
            className="w-full bg-[#F4F4F6] border border-gray-300 rounded-lg p-3 text-sm font-medium text-[#010E2A] focus:ring-2 focus:ring-[#22B974] focus:outline-none"
          >
            {EQUIPMENT_TYPES.map((eq) => (
              <option key={eq} value={eq}>
                {eq}
              </option>
            ))}
          </select>
        </div>

        {/* Refrigerant Type */}
        <div>
          <label className="block text-xs font-bold text-[#010E2A] uppercase tracking-wider mb-1.5">
            Refrigerant Type (Nameplate) *
          </label>
          <select
            value={gasLogged}
            onChange={(e) => setGasLogged(e.target.value)}
            className="w-full bg-[#F4F4F6] border border-gray-300 rounded-lg p-3 text-sm font-medium text-[#010E2A] focus:ring-2 focus:ring-[#22B974] focus:outline-none"
          >
            {DEFAULT_CONFIG.gasList.map((g) => (
              <option key={g.name} value={g.name}>
                {g.name} (GWP ~{g.gwp})
              </option>
            ))}
          </select>
        </div>

        {/* Estimated Quantity (kg) */}
        <div>
          <label className="block text-xs font-bold text-[#010E2A] uppercase tracking-wider mb-1.5">
            Estimated Recovered Quantity (kg) *
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.05"
              min="0.1"
              max="50"
              required
              value={estKg}
              onChange={(e) => setEstKg(e.target.value)}
              placeholder="e.g. 2.4"
              className="w-full bg-[#F4F4F6] border border-gray-300 rounded-lg p-3 text-sm font-medium text-[#010E2A] focus:ring-2 focus:ring-[#22B974] focus:outline-none"
            />
            <span className="absolute right-4 top-3 text-sm text-gray-500 font-bold">kg</span>
          </div>
          <p className="text-[11px] text-gray-500 mt-1">
            Official payout is calculated strictly from the calibrated weight verified at the collection point.
          </p>
        </div>

        {/* Location & GPS */}
        <div>
          <label className="block text-xs font-bold text-[#010E2A] uppercase tracking-wider mb-1.5">
            Job / Workshop Location *
          </label>
          <input
            type="text"
            required
            value={locationText}
            onChange={(e) => setLocationText(e.target.value)}
            placeholder="e.g. Zone 4 Workshop, Ganaja, Lokoja"
            className="w-full bg-[#F4F4F6] border border-gray-300 rounded-lg p-3 text-sm font-medium text-[#010E2A] focus:ring-2 focus:ring-[#22B974] focus:outline-none mb-2"
          />

          <div className="flex items-center justify-between bg-[#F4F4F6] p-3 rounded-lg text-xs">
            <div className="flex items-center gap-2 text-gray-700">
              <MapPin className="w-4 h-4 text-[#16794C]" />
              {geoStatus === 'success' && lat && lng ? (
                <span>
                  GPS: {lat.toFixed(4)}, {lng.toFixed(4)} (±{accuracy?.toFixed(0)}m)
                </span>
              ) : geoStatus === 'fetching' ? (
                <span>Detecting GPS coordinates...</span>
              ) : (
                <span>GPS permission denied / unavailable (Lokoja default recorded)</span>
              )}
            </div>

            <button
              type="button"
              onClick={detectLocation}
              className="text-[#16794C] font-bold text-xs hover:underline"
            >
              Refresh GPS
            </button>
          </div>
        </div>

        {/* Photos (Cylinder and Equipment) */}
        <div>
          <label className="block text-xs font-bold text-[#010E2A] uppercase tracking-wider mb-1.5">
            Photographs (Cylinder & Equipment Nameplate)
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="border-2 border-dashed border-gray-300 rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-50 transition-colors">
              <Camera className="w-6 h-6 text-gray-400 mb-1" />
              <span className="text-xs font-semibold text-gray-700">Cylinder Photo</span>
              <span className="text-[10px] text-gray-500">
                {photos.find((p) => p.type === 'cylinder') ? 'Attached ✓' : 'Tap to capture'}
              </span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => handlePhotoUpload(e, 'cylinder')}
              />
            </label>

            <label className="border-2 border-dashed border-gray-300 rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-50 transition-colors">
              <Camera className="w-6 h-6 text-gray-400 mb-1" />
              <span className="text-xs font-semibold text-gray-700">Equipment Photo</span>
              <span className="text-[10px] text-gray-500">
                {photos.find((p) => p.type === 'equipment') ? 'Attached ✓' : 'Tap to capture'}
              </span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => handlePhotoUpload(e, 'equipment')}
              />
            </label>
          </div>
        </div>

        {/* Additional Notes */}
        <div>
          <label className="block text-xs font-bold text-[#010E2A] uppercase tracking-wider mb-1.5">
            Notes / Servicing Context (Optional)
          </label>
          <textarea
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. De-commissioned compressor unit from cold store."
            className="w-full bg-[#F4F4F6] border border-gray-300 rounded-lg p-3 text-sm text-[#010E2A] focus:ring-2 focus:ring-[#22B974] focus:outline-none"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={submitting}
          className="btn-primary w-full text-base font-bold py-3.5"
        >
          {submitting ? (
            'Recording Recovery...'
          ) : (
            <>
              <PlusCircle className="w-5 h-5" /> Submit Recovery
            </>
          )}
        </button>

        <p className="text-center text-[11px] text-gray-500">
          Works offline automatically. Records are queued locally if internet signal drops.
        </p>
      </form>
    </div>
  );
}

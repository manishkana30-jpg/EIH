'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { MapPin, PhoneCall, ShieldAlert, Navigation, RefreshCw } from 'lucide-react';
import {
  CountryCrisisProfile,
  getCrisisProfileByCountry,
  inferCountryFromTimezone,
} from '@/lib/safety/geo-crisis-directory';

export const GpsCrisisBanner: React.FC = () => {
  const [profile, setProfile] = useState<CountryCrisisProfile>(() => {
    const tz = typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : undefined;
    return getCrisisProfileByCountry(inferCountryFromTimezone(tz));
  });
  const [cityName, setCityName] = useState<string | null>(null);
  const [isGpsActive, setIsGpsActive] = useState<boolean>(false);
  const [isLocating, setIsLocating] = useState<boolean>(false);

  // 1. Initial IP-based Geolocation (Zero-permission instant display)
  useEffect(() => {
    let isMounted = true;

    async function loadIpLocation() {
      try {
        const res = await fetch('/api/location', { signal: AbortSignal.timeout(3000) });
        if (res.ok && isMounted) {
          const data = await res.json();
          if (data.countryCode) {
            setProfile(getCrisisProfileByCountry(data.countryCode));
          }
          if (data.city && data.city !== 'Global') {
            setCityName(data.city);
          }
        }
      } catch {
        // Fallback already initialized from timezone
      }
    }

    loadIpLocation();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Hardware GPS Geolocation Query
  const requestGps = useCallback(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) return;

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setIsGpsActive(true);
        setIsLocating(false);

        try {
          // Reverse-geocode coordinates via nearby-facilities API
          const res = await fetch('/api/safety/nearby-facilities', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              radiusKm: 10,
            }),
            signal: AbortSignal.timeout(4000),
          });

          if (res.ok) {
            const data = await res.json();
            if (data.countryCrisisProfile) {
              setProfile(data.countryCrisisProfile);
            }
            if (data.locationDetails?.city) {
              setCityName(data.locationDetails.city);
            }
          }
        } catch {
          // Keep current profile
        }
      },
      () => {
        setIsLocating(false);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  }, []);

  const locationDisplay = cityName
    ? `${cityName}, ${profile.countryName}`
    : profile.countryName;

  return (
    <aside
      role="region"
      aria-label="GPS Local Crisis Support"
      className="bg-rose-950/90 border-b border-rose-900/70 text-rose-100 text-xs py-1.5 px-4 sticky top-0 z-50 backdrop-blur-md transition-all shadow-sm"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2.5 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-block w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          <span className="font-semibold text-rose-200 flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400 inline" />
            <span>GPS Local Crisis Support:</span>
          </span>

          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-900/60 border border-rose-700/60 text-[11px] font-medium text-rose-200">
            <span>{profile.flag}</span>
            <span>{locationDisplay}</span>
            {isGpsActive && <span className="text-[10px] text-emerald-400 font-mono">● GPS</span>}
          </span>

          <span className="text-rose-100/90 flex items-center gap-1.5 flex-wrap">
            <span>Emergency:</span>
            <a
              href={`tel:${profile.emergencyGeneral}`}
              className="underline font-bold text-white hover:text-rose-300"
              title={`Call Emergency Services (${profile.emergencyGeneral})`}
            >
              {profile.emergencyGeneral}
            </a>
            <span className="text-rose-400/60">•</span>
            <span>{profile.primarySuicideLifeline.name}:</span>
            <a
              href={`tel:${profile.primarySuicideLifeline.phone.replace(/[^0-9+]/g, '')}`}
              className="underline font-bold text-white hover:text-rose-300"
              title={`Call ${profile.primarySuicideLifeline.name}`}
            >
              {profile.primarySuicideLifeline.phone}
            </a>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={requestGps}
            disabled={isLocating}
            className="hidden sm:inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-rose-900/40 hover:bg-rose-900/80 border border-rose-700/50 text-rose-200 hover:text-white transition-colors"
            title="Update using device GPS"
          >
            {isLocating ? (
              <RefreshCw className="w-3 h-3 animate-spin text-rose-300" />
            ) : (
              <Navigation className="w-3 h-3 text-rose-300" />
            )}
            <span>{isLocating ? 'Locating...' : (isGpsActive ? 'GPS Active' : 'Use Device GPS')}</span>
          </button>

          <Link
            href="/crisis"
            className="text-[11px] underline font-medium text-rose-300 hover:text-white transition-colors"
          >
            GPS Crisis Directory &rarr;
          </Link>
        </div>
      </div>
    </aside>
  );
};

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  PhoneCall,
  ShieldAlert,
  HeartHandshake,
  Globe2,
  MapPin,
  Navigation,
  Loader2,
  Hospital,
  Building2,
  ExternalLink,
  RefreshCw,
  AlertTriangle,
  ArrowLeft,
  ChevronRight,
} from 'lucide-react';
import {
  CountryCrisisProfile,
  GLOBAL_CRISIS_DIRECTORY,
  getCrisisProfileByCountry,
  inferCountryFromTimezone,
  getAvailableCrisisCountries,
} from '@/lib/safety/geo-crisis-directory';

interface NearbyFacility {
  id: string;
  name: string;
  type: string;
  distanceKm: number;
  phone: string;
  address: string;
  is24x7: boolean;
  mapsUrl: string;
}

export const GpsCrisisDirectoryView: React.FC = () => {
  const [profile, setProfile] = useState<CountryCrisisProfile>(() => {
    const tz = typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : undefined;
    return getCrisisProfileByCountry(inferCountryFromTimezone(tz));
  });

  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [cityName, setCityName] = useState<string | null>(null);
  const [regionName, setRegionName] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locationSource, setLocationSource] = useState<'gps' | 'ip' | 'manual' | 'timezone'>('ip');
  const [facilities, setFacilities] = useState<NearbyFacility[]>([]);
  const [isLoadingFacilities, setIsLoadingFacilities] = useState<boolean>(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const availableCountries = getAvailableCrisisCountries();

  // 1. Fetch nearby facilities and location details from coordinates
  const fetchNearbyFacilities = useCallback(async (lat: number, lng: number, countryCode?: string) => {
    setIsLoadingFacilities(true);
    try {
      const res = await fetch('/api/safety/nearby-facilities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latitude: lat, longitude: lng, radiusKm: 20 }),
        signal: AbortSignal.timeout(6000),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.facilities && Array.isArray(data.facilities)) {
          setFacilities(data.facilities);
        }
        if (data.countryCrisisProfile) {
          setProfile(data.countryCrisisProfile);
        }
        if (data.locationDetails) {
          if (data.locationDetails.city) setCityName(data.locationDetails.city);
          if (data.locationDetails.state) setRegionName(data.locationDetails.state);
        }
      }
    } catch (err) {
      console.warn('Nearby facilities query notice:', err);
    } finally {
      setIsLoadingFacilities(false);
    }
  }, []);

  // 2. Hardware GPS Locator Function
  const locateWithGps = useCallback(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCoords({ lat, lng });
        setLocationSource('gps');
        setIsLocating(false);
        await fetchNearbyFacilities(lat, lng);
      },
      (err) => {
        setIsLocating(false);
        if (err.code === 1) {
          setGpsError('Location permission was denied. Showing IP-detected location.');
        } else {
          setGpsError('GPS signal timed out. Using IP-based location.');
        }
      },
      { timeout: 9000, enableHighAccuracy: true }
    );
  }, [fetchNearbyFacilities]);

  // 3. Initial Fast Location Detection on Mount (IP + automatic GPS query if permitted)
  useEffect(() => {
    let isMounted = true;

    async function initLocation() {
      try {
        const res = await fetch('/api/location', { signal: AbortSignal.timeout(3500) });
        if (res.ok && isMounted) {
          const data = await res.json();
          if (data.countryCode) {
            setProfile(getCrisisProfileByCountry(data.countryCode));
          }
          if (data.city && data.city !== 'Global') setCityName(data.city);
          if (data.regionName) setRegionName(data.regionName);

          if (data.latitude && data.longitude) {
            setCoords({ lat: data.latitude, lng: data.longitude });
            fetchNearbyFacilities(data.latitude, data.longitude, data.countryCode);
          }
        }
      } catch {
        // Timezone fallback already initialized
      }

      // Check if GPS permission is already granted
      if (typeof navigator !== 'undefined' && navigator.permissions) {
        try {
          const status = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
          if (status.state === 'granted') {
            locateWithGps();
          }
        } catch {}
      }
    }

    initLocation();
    return () => {
      isMounted = false;
    };
  }, [fetchNearbyFacilities, locateWithGps]);

  // Manual country selection override
  const handleCountryChange = (code: string) => {
    const next = getCrisisProfileByCountry(code);
    setProfile(next);
    setLocationSource('manual');
    setCityName(null);
    setRegionName(null);
  };

  const locationTitle = cityName
    ? `${cityName}${regionName ? `, ${regionName}` : ''}, ${profile.countryName}`
    : profile.countryName;

  return (
    <main className="max-w-5xl mx-auto px-4 py-10 sm:py-16 text-zinc-300 space-y-12">
      {/* Return to Sanctuary Link */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-amber-400 transition-colors group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          <span>Return to Safe Sanctuary Session</span>
        </Link>
      </div>

      {/* Hero Header */}
      <header className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-rose-950/70 border border-rose-500/40 text-rose-300 text-xs font-mono">
          <ShieldAlert className="w-4 h-4 text-rose-400" />
          <span>GPS-Localized Emergency Care & Crisis Directory</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-serif font-bold text-zinc-100 tracking-tight">
          Immediate Help for Your Exact Location
        </h1>
        <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
          You are not alone. EIH dynamically detects your device GPS coordinates to connect you with verified local emergency medical services, 24/7 psychiatric crisis hotlines, and nearby physical facilities.
        </p>
      </header>

      {/* GPS Detection Bar & Controls */}
      <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3 text-left w-full md:w-auto">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-base font-bold text-zinc-100 flex items-center gap-1.5">
                <span>{profile.flag}</span>
                <span>{locationTitle}</span>
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold ${
                locationSource === 'gps'
                  ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-400'
                  : 'bg-zinc-800 border border-zinc-700 text-zinc-400'
              }`}>
                {locationSource === 'gps' ? '● GPS Verified' : 'Network/IP Location'}
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              {coords
                ? `Coordinates: ${coords.lat.toFixed(4)}°, ${coords.lng.toFixed(4)}°`
                : `Country Jurisdiction: ${profile.countryName}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end flex-wrap">
          <button
            type="button"
            onClick={locateWithGps}
            disabled={isLocating}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md active:scale-95 transition-all"
          >
            {isLocating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Navigation className="w-3.5 h-3.5" />
            )}
            <span>{isLocating ? 'Detecting GPS...' : 'Update Device GPS'}</span>
          </button>

          <select
            value={profile.countryCode}
            onChange={(e) => handleCountryChange(e.target.value)}
            aria-label="Select Country Jurisdiction"
            className="px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-zinc-200 text-xs font-medium focus:outline-none focus:border-rose-500"
          >
            {availableCountries.map((c) => (
              <option key={c.code} value={c.code}>
                {c.flag} {c.name} ({c.emergencyGeneral})
              </option>
            ))}
          </select>
        </div>
      </div>

      {gpsError && (
        <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
          <span>{gpsError}</span>
        </div>
      )}

      {/* Primary Local Emergency Triage (Big Cards) */}
      <section className="space-y-6">
        <h2 className="text-xl font-serif font-bold text-zinc-100 flex items-center gap-2">
          <span>🚨 Immediate Local Emergency Lines ({profile.countryName})</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* 1. National Mental Health Lifeline */}
          <div className="p-6 rounded-2xl bg-rose-950/30 border-2 border-rose-500/40 flex flex-col justify-between space-y-4 shadow-[0_0_25px_rgba(225,29,72,0.12)]">
            <div className="space-y-2">
              <span className="text-[11px] font-mono font-bold text-rose-400 uppercase tracking-wider">
                Primary 24/7 Mental Health Crisis
              </span>
              <h3 className="text-lg font-bold text-zinc-100">
                {profile.primarySuicideLifeline.name}
              </h3>
              <p className="text-xs text-zinc-300 leading-relaxed">
                {profile.primarySuicideLifeline.description}
              </p>
              {profile.primarySuicideLifeline.textOption && (
                <p className="text-xs text-amber-300 font-medium">
                  💬 {profile.primarySuicideLifeline.textOption}
                </p>
              )}
            </div>

            <a
              href={`tel:${profile.primarySuicideLifeline.phone.replace(/[^0-9+]/g, '')}`}
              className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-md transition-all active:scale-95"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Call {profile.primarySuicideLifeline.phone}</span>
            </a>
          </div>

          {/* 2. General Emergency Services */}
          <div className="p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <span className="text-[11px] font-mono font-bold text-amber-400 uppercase tracking-wider">
                Immediate Life Threat / First Responders
              </span>
              <h3 className="text-lg font-bold text-zinc-100">
                General Emergency Service
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Direct dispatch for police, fire, or emergency medical services across all regions of {profile.countryName}.
              </p>
            </div>

            <a
              href={`tel:${profile.emergencyGeneral}`}
              className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-sm border border-zinc-700 transition-all active:scale-95"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Dial {profile.emergencyGeneral}</span>
            </a>
          </div>

          {/* 3. Emergency Ambulance */}
          <div className="p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <span className="text-[11px] font-mono font-bold text-emerald-400 uppercase tracking-wider">
                Emergency Medical Transport
              </span>
              <h3 className="text-lg font-bold text-zinc-100">
                Ambulance Service
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Trained paramedics and immediate hospital psychiatric triage transport.
              </p>
            </div>

            <a
              href={`tel:${profile.ambulanceNumber}`}
              className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-sm transition-all active:scale-95"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Dial {profile.ambulanceNumber}</span>
            </a>
          </div>
        </div>
      </section>

      {/* Additional Hotlines for this Country */}
      {profile.additionalHotlines.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-serif font-bold text-zinc-200">
            Specialized Psychological Lines ({profile.countryName})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profile.additionalHotlines.map((hotline) => (
              <div
                key={hotline.id}
                className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 flex items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-zinc-100">{hotline.name}</h3>
                  <p className="text-xs text-zinc-400">{hotline.description}</p>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    {hotline.is24x7 ? '⏱ 24/7 Support' : 'Check operational hours'}
                  </span>
                </div>
                <a
                  href={`tel:${hotline.phone.replace(/[^0-9+]/g, '')}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold shrink-0 border border-zinc-700 transition-all"
                >
                  <PhoneCall className="w-3.5 h-3.5 text-rose-400" />
                  <span>{hotline.phone}</span>
                </a>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Nearby Physical Emergency Facilities (GPS Radius) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <h2 className="text-lg font-serif font-bold text-zinc-100 flex items-center gap-2">
              <Hospital className="w-5 h-5 text-emerald-400" />
              <span>Nearby Emergency & Psychiatric Care Facilities</span>
            </h2>
            <p className="text-xs text-zinc-400">
              {coords
                ? `Verified physical hospitals and mental health centers near your GPS location (Within 20 km)`
                : `Enable GPS to locate physical psychiatric clinics within your immediate radius`}
            </p>
          </div>
          {!coords && (
            <button
              type="button"
              onClick={locateWithGps}
              className="text-xs text-amber-400 hover:underline font-semibold"
            >
              Enable GPS for Nearest Facilities &rarr;
            </button>
          )}
        </div>

        {isLoadingFacilities ? (
          <div className="p-8 rounded-2xl bg-zinc-900/40 border border-zinc-800 text-center text-zinc-400 text-xs flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-rose-400" />
            <span>Scanning OpenStreetMap & health registries for nearby facilities...</span>
          </div>
        ) : facilities.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {facilities.map((fac) => (
              <div
                key={fac.id}
                className="p-5 rounded-2xl bg-zinc-900/70 border border-zinc-800 flex flex-col justify-between space-y-3"
              >
                <div className="space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-bold text-zinc-100">{fac.name}</h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-emerald-400 border border-zinc-700 shrink-0">
                      {fac.distanceKm} km away
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400">{fac.address}</p>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <a
                    href={`tel:${fac.phone}`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition-colors flex-1 justify-center"
                  >
                    <PhoneCall className="w-3.5 h-3.5 text-rose-400" />
                    <span>{fac.phone}</span>
                  </a>
                  <a
                    href={fac.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 text-xs font-semibold border border-emerald-500/40 transition-colors"
                  >
                    <span>Maps Directions</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 rounded-2xl bg-zinc-900/30 border border-zinc-800/80 text-center space-y-2">
            <p className="text-xs text-zinc-400">
              No physical hospital endpoints detected within 20 km or GPS query was not granted.
            </p>
            <p className="text-xs text-zinc-500">
              Please use the direct 24/7 hotline numbers above to speak immediately with trained responders.
            </p>
          </div>
        )}
      </section>

      {/* Global Fallback Directory (Befrienders & IASP) */}
      <section className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 text-center space-y-3">
        <div className="flex items-center justify-center gap-2 text-zinc-200 font-serif font-bold text-base">
          <Globe2 className="w-5 h-5 text-amber-400" />
          <span>Global 24/7 Non-Profit Crisis Networks</span>
        </div>
        <p className="text-xs text-zinc-400 max-w-xl mx-auto leading-relaxed">
          If you are traveling internationally, access the worldwide registry of verified crisis intervention centers coordinated by <strong>Befrienders Worldwide</strong> and the <strong>International Association for Suicide Prevention (IASP)</strong>.
        </p>
        <div className="flex items-center justify-center gap-4 pt-2 flex-wrap">
          <a
            href="https://www.befrienders.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-amber-400 hover:underline font-semibold"
          >
            Befrienders Worldwide &rarr;
          </a>
          <span className="text-zinc-600">•</span>
          <a
            href="https://www.iasp.info/resources/Crisis_Centres/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-amber-400 hover:underline font-semibold"
          >
            IASP Crisis Centres Directory &rarr;
          </a>
        </div>
      </section>
    </main>
  );
};

'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ShieldAlert,
  Phone,
  HeartHandshake,
  X,
  Navigation,
  Loader2,
  Hospital,
  Building2,
  ExternalLink,
  Search,
  AlertTriangle,
  VolumeX,
  Sparkles,
} from 'lucide-react';
import { CrisisDetectionResult } from '@/lib/safety/crisis-detector';
import { browserSpeechController } from '@/lib/audio/browser-speech';
import { liveKitAudioClient } from '@/lib/audio/livekit-client';
import {
  CountryCrisisProfile,
  getCrisisProfileByCountry,
  inferCountryFromTimezone,
} from '@/lib/safety/geo-crisis-directory';

export interface NearbyFacility {
  id: string;
  name: string;
  type: 'emergency_hospital' | 'psychiatric_center' | 'psychologist_clinic' | 'crisis_center';
  distanceKm: number;
  phone: string;
  address: string;
  is24x7: boolean;
  mapsUrl: string;
}

export interface LocationDetails {
  city?: string;
  state?: string;
  country?: string;
  countryCode?: string;
  formattedAddress?: string;
}

interface CrisisModalProps {
  crisisData?: CrisisDetectionResult | null;
  onDismiss?: () => void;
  onClose?: () => void;
  isOpen?: boolean;
}

export const CrisisModal: React.FC<CrisisModalProps> = ({
  crisisData,
  onDismiss,
  onClose,
  isOpen = true,
}) => {
  const handleClose = onClose || onDismiss || (() => {});

  // Location & facility states
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locationSource, setLocationSource] = useState<'gps' | 'ip' | 'manual' | 'timezone'>('ip');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationDetails, setLocationDetails] = useState<LocationDetails | null>(null);
  const [countryProfile, setCountryProfile] = useState<CountryCrisisProfile>(() => {
    const tz = typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : undefined;
    return getCrisisProfileByCountry(inferCountryFromTimezone(tz));
  });
  const [nearbyFacilities, setNearbyFacilities] = useState<NearbyFacility[]>([]);
  const [selectedRadiusKm, setSelectedRadiusKm] = useState<number>(20);
  const [manualSearchQuery, setManualSearchQuery] = useState<string>('');
  const [facilityFilter, setFacilityFilter] = useState<'all' | 'psychiatric' | 'hospital' | 'clinic'>('all');
  const [localEmergencyNumber, setLocalEmergencyNumber] = useState<string>('112');
  const [gpsErrorNotice, setGpsErrorNotice] = useState<string | null>(null);

  // 1. Hard Audio Killswitch: Immediately silence all AI voice when CrisisModal opens
  useEffect(() => {
    if (isOpen) {
      browserSpeechController.cancelSpeech();
      liveKitAudioClient.handleBargeInInterruption();
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    }
  }, [isOpen]);

  // 2. Fetch facilities & update crisis profile from coordinates, search query, or IP
  const fetchFacilities = useCallback(
    async (
      coords?: { lat: number; lng: number } | null,
      query?: string,
      radius: number = 20,
      sourceOverride?: 'gps' | 'ip' | 'manual' | 'timezone'
    ) => {
      setIsLocating(true);

      try {
        const payload: {
          lat?: number;
          lng?: number;
          radiusKm: number;
          searchQuery?: string;
          timezone?: string;
        } = {
          radiusKm: radius,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        };

        if (coords) {
          payload.lat = coords.lat;
          payload.lng = coords.lng;
        }
        if (query && query.trim()) {
          payload.searchQuery = query.trim();
        }

        const res = await fetch('/api/safety/nearby-facilities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          const data = await res.json();
          setNearbyFacilities(data.nearbyFacilities || []);

          if (data.locationDetails) {
            setLocationDetails(data.locationDetails);
          }

          if (data.countryCrisisProfile) {
            setCountryProfile(data.countryCrisisProfile);
            if (data.countryCrisisProfile.emergencyGeneral) {
              setLocalEmergencyNumber(data.countryCrisisProfile.emergencyGeneral);
            }
          }

          if (data.locationSource) {
            setLocationSource(sourceOverride || data.locationSource);
          }
        }
      } catch (err) {
        console.error('Failed to retrieve nearby clinical facilities:', err);
      } finally {
        setIsLocating(false);
      }
    },
    []
  );

  // 3. Request User GPS Geolocation (High-Accuracy Satellite)
  const handleRequestGPSLocation = useCallback(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setGpsErrorNotice('GPS is not supported by your current browser. Retaining verified Network IP location.');
      return;
    }

    setIsLocating(true);
    setGpsErrorNotice(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setUserLocation(coords);
        setLocationSource('gps');
        fetchFacilities(coords, undefined, selectedRadiusKm, 'gps');
      },
      (err) => {
        setIsLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGpsErrorNotice('Device GPS access was not granted. Retaining verified Network IP location.');
        } else {
          setGpsErrorNotice('GPS signal timed out. Retaining verified Network IP location.');
        }
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  }, [fetchFacilities, selectedRadiusKm]);

  // 4. Dual-Channel Automatic Detection Lifecycle on Modal Open
  // Stage A: Instantly query IP geolocation (/api/location) -> immediate country, city & helplines
  // Stage B: Concurrently request device GPS for high-accuracy physical facility distance
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;

    const resolveDualLocation = async () => {
      setIsLocating(true);

      // Fast Server-Side IP Geolocation Lookup
      try {
        const ipRes = await fetch('/api/location', { signal: AbortSignal.timeout(3000) });
        if (ipRes.ok && isMounted) {
          const ipData = await ipRes.json();
          if (ipData && ipData.countryCode) {
            const profile = getCrisisProfileByCountry(ipData.countryCode);
            setCountryProfile(profile);
            if (profile.emergencyGeneral) {
              setLocalEmergencyNumber(profile.emergencyGeneral);
            }

            const initialDetails: LocationDetails = {
              city: ipData.city,
              state: ipData.regionName,
              country: ipData.countryName || profile.countryName,
              countryCode: ipData.countryCode,
              formattedAddress: ipData.city
                ? `${ipData.city}, ${ipData.countryName || profile.countryName}`
                : profile.countryName,
            };
            setLocationDetails(initialDetails);
            setLocationSource('ip');

            // If coordinates available from IP, fetch facilities immediately
            if (ipData.latitude && ipData.longitude) {
              setUserLocation({ lat: ipData.latitude, lng: ipData.longitude });
              fetchFacilities(
                { lat: ipData.latitude, lng: ipData.longitude },
                undefined,
                selectedRadiusKm,
                'ip'
              );
            } else {
              fetchFacilities(null, ipData.city || profile.countryName, selectedRadiusKm, 'ip');
            }
          }
        }
      } catch {
        if (isMounted) {
          const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
          const country = inferCountryFromTimezone(tz);
          const profile = getCrisisProfileByCountry(country);
          setCountryProfile(profile);
          fetchFacilities(null, profile.countryName, selectedRadiusKm, 'timezone');
        }
      }

      // Concurrently attempt Device GPS if supported
      if (typeof window !== 'undefined' && navigator.geolocation && isMounted) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            if (!isMounted) return;
            const coords = {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
            };
            setUserLocation(coords);
            setLocationSource('gps');
            fetchFacilities(coords, undefined, selectedRadiusKm, 'gps');
          },
          () => {
            // Silently retain IP location if GPS prompt declined
          },
          { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
        );
      }
    };

    resolveDualLocation();

    return () => {
      isMounted = false;
    };
  }, [isOpen, fetchFacilities, selectedRadiusKm]);

  // 5. Handle manual city search
  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualSearchQuery.trim()) return;
    setLocationSource('manual');
    fetchFacilities(null, manualSearchQuery.trim(), selectedRadiusKm, 'manual');
  };

  // Filter facilities based on active tab
  const filteredFacilities = useMemo(() => {
    return nearbyFacilities.filter((fac) => {
      if (facilityFilter === 'all') return true;
      if (facilityFilter === 'psychiatric') {
        return fac.type === 'psychiatric_center' || fac.type === 'psychologist_clinic';
      }
      if (facilityFilter === 'hospital') {
        return fac.type === 'emergency_hospital';
      }
      if (facilityFilter === 'clinic') {
        return fac.type === 'crisis_center' || fac.type === 'psychologist_clinic';
      }
      return true;
    });
  }, [nearbyFacilities, facilityFilter]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-2xl animate-fade-in select-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby="crisis-title"
    >
      <div className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto bg-[#0c0f16]/98 border border-rose-500/40 rounded-3xl p-5 sm:p-7 shadow-2xl text-white space-y-5 custom-scrollbar">
        {/* ─── TOP BAR: EMERGENCY ALERT & AUDIO SILENCE NOTICE ─── */}
        <div className="flex items-start justify-between gap-4 border-b border-rose-500/20 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-600/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shadow-lg shrink-0">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 id="crisis-title" className="text-lg sm:text-xl font-heading font-bold text-rose-100">
                  Emergency Mental Health &amp; Crisis Support
                </h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 font-mono font-semibold">
                  {countryProfile.flag} {countryProfile.countryName}
                </span>
              </div>
              <p className="text-xs text-rose-300/80 font-medium mt-0.5">
                Dual GPS &amp; IP Geolocation • Verified 24/7 Psychological Hotlines &amp; Local Care
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all border border-white/10 shrink-0"
            title="Acknowledge & Close"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ─── VOICE SILENCE NOTIFICATION ─── */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-950/40 border border-rose-800/40 text-[11px] text-rose-300">
          <VolumeX className="w-3.5 h-3.5 text-rose-400 shrink-0" />
          <span>AI Voice Assistant is paused for safety. Human clinical &amp; emergency care takes absolute priority.</span>
        </div>

        {/* ─── EMPATHIC DEFLECTION BANNER ─── */}
        <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-500/30 space-y-2">
          <p className="text-sm sm:text-base font-semibold text-rose-100 leading-relaxed">
            {crisisData?.immediateDeflectionStatement ||
              'You are not alone, and your life has profound value. Please connect immediately with verified confidential crisis counselors or local psychiatric professionals.'}
          </p>
          <div className="text-xs text-rose-300/90 flex items-center gap-2 pt-1">
            <HeartHandshake className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>
              Free, confidential, and judgment-free support is available right now. Professional crisis counselors are standing by to listen.
            </span>
          </div>
        </div>

        {/* ─── GEOLOCATION DETECTION STATUS & CONTROL BAR ─── */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-[#12161f]/90 border border-white/10 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-3 h-3 rounded-full shrink-0 ${
                  locationSource === 'gps'
                    ? 'bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                    : 'bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.6)]'
                }`}
              />
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white">
                    {locationSource === 'gps'
                      ? 'Detected via High-Accuracy Device GPS'
                      : locationSource === 'manual'
                      ? 'Custom Search Location'
                      : 'Detected via Network IP Geolocation'}
                  </span>
                  <span className="text-[10px] px-2 py-0.2 rounded-full font-mono bg-white/10 text-white/80 border border-white/10 uppercase">
                    {locationSource}
                  </span>
                </div>
                <span className="text-[11px] text-white/60 truncate">
                  {locationDetails?.formattedAddress ||
                    (userLocation ? `${userLocation.lat.toFixed(4)}°, ${userLocation.lng.toFixed(4)}°` : countryProfile.countryName)}
                </span>
              </div>
            </div>

            {/* GPS Refresh / Grant Button */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleRequestGPSLocation}
                disabled={isLocating}
                className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:bg-rose-900/40 text-white text-xs font-semibold shadow-md transition-all shrink-0 active:scale-95"
                title="Locate via device GPS"
              >
                {isLocating ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Locating...</span>
                  </>
                ) : (
                  <>
                    <Navigation className="w-3 h-3" />
                    <span>{locationSource === 'gps' ? 'Refresh GPS' : 'Use Device GPS'}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* GPS Notice / Fallback Status */}
          {gpsErrorNotice && (
            <div className="flex items-center gap-2 p-2 rounded-xl bg-amber-950/40 border border-amber-500/30 text-[11px] text-amber-200">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>{gpsErrorNotice}</span>
            </div>
          )}

          {/* Manual City Search & Radius */}
          <div className="flex flex-col sm:flex-row gap-2 items-center pt-1">
            <form onSubmit={handleManualSearch} className="flex-1 w-full flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={manualSearchQuery}
                  onChange={(e) => setManualSearchQuery(e.target.value)}
                  placeholder="Change city or area (e.g. Mumbai, New Delhi, Austin, London, Sydney)..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#08090d] border border-white/10 focus:border-rose-500 text-xs text-white placeholder:text-white/30 outline-none transition-all"
                />
              </div>
              <button
                type="submit"
                className="px-3.5 py-1.5 rounded-xl bg-[#1c2432] hover:bg-[#253144] border border-white/10 text-xs font-semibold text-white shrink-0 transition-all"
              >
                Search
              </button>
            </form>

            {/* Radius Selectors */}
            <div className="flex items-center gap-1 shrink-0 bg-[#08090d] p-1 rounded-xl border border-white/10">
              <span className="text-[10px] text-white/40 px-1 font-mono">Radius:</span>
              {[10, 20, 35, 50].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    setSelectedRadiusKm(r);
                    fetchFacilities(userLocation, manualSearchQuery || undefined, r);
                  }}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-mono transition-all ${
                    selectedRadiusKm === r
                      ? 'bg-rose-600 text-white font-bold'
                      : 'text-white/50 hover:text-white'
                  }`}
                >
                  {r}km
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ─── SECTION 1: VERIFIED NATIONAL PSYCHOLOGICAL CRISIS LIFELINES ─── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white">
                Verified National Psychological Crisis &amp; Suicide Lifelines ({countryProfile.countryName})
              </h3>
            </div>
            <span className="text-[10px] font-mono text-white/50">Confidential &amp; Immediate</span>
          </div>

          {/* Primary Lifeline Hero Card */}
          {countryProfile.primarySuicideLifeline && (
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-rose-950/60 via-slate-900/90 to-slate-900/90 border-2 border-rose-500/50 shadow-[0_0_25px_rgba(244,63,94,0.18)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-base sm:text-lg font-bold text-white">
                    {countryProfile.primarySuicideLifeline.name}
                  </span>
                  {countryProfile.primarySuicideLifeline.is24x7 && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-semibold font-mono">
                      24/7 Available
                    </span>
                  )}
                  {countryProfile.primarySuicideLifeline.isTollFree && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/20 border border-teal-500/40 text-teal-300 font-semibold font-mono">
                      100% Toll-Free
                    </span>
                  )}
                </div>

                <p className="text-xs text-white/70 leading-relaxed">
                  {countryProfile.primarySuicideLifeline.description}
                </p>

                {countryProfile.primarySuicideLifeline.languages && (
                  <div className="flex items-center gap-1 flex-wrap pt-1">
                    <span className="text-[10px] text-white/40">Languages:</span>
                    {countryProfile.primarySuicideLifeline.languages.slice(0, 5).map((l) => (
                      <span key={l} className="text-[9px] px-1.5 py-0.2 rounded bg-white/5 text-white/60">
                        {l}
                      </span>
                    ))}
                    {countryProfile.primarySuicideLifeline.languages.length > 5 && (
                      <span className="text-[9px] text-white/40">
                        +{countryProfile.primarySuicideLifeline.languages.length - 5} more
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-row md:flex-col items-center gap-2 w-full md:w-auto shrink-0">
                <a
                  href={`tel:${countryProfile.primarySuicideLifeline.phone.replace(/[^0-9+]/g, '')}`}
                  className="flex-1 md:flex-initial w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-lg hover:scale-105 active:scale-95 transition-all"
                >
                  <Phone className="w-4 h-4 fill-current" />
                  <span>Call {countryProfile.primarySuicideLifeline.phone}</span>
                </a>

                {countryProfile.primarySuicideLifeline.website && (
                  <a
                    href={countryProfile.primarySuicideLifeline.website}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 md:flex-initial w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-white/80 hover:text-white transition-all"
                  >
                    <span>Official Portal</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Specialized Psychological Helplines Grid */}
          {countryProfile.additionalHotlines && countryProfile.additionalHotlines.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {countryProfile.additionalHotlines.map((hl) => (
                <div
                  key={hl.id}
                  className="p-3 rounded-xl bg-[#08090d]/90 border border-white/10 hover:border-teal-500/40 transition-all flex flex-col justify-between space-y-2"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-bold text-white leading-snug">{hl.name}</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-teal-950/60 border border-teal-500/30 text-teal-300 font-mono shrink-0 capitalize">
                        {hl.category.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-[11px] text-white/50 leading-tight mt-1 line-clamp-2">
                      {hl.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-white/5 gap-2">
                    <a
                      href={`tel:${hl.phone.replace(/[^0-9+]/g, '')}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-950/50 hover:bg-teal-950/80 border border-teal-500/40 text-teal-300 text-xs font-bold font-mono transition-all"
                    >
                      <Phone className="w-3 h-3" />
                      <span>{hl.phone}</span>
                    </a>

                    {hl.website && (
                      <a
                        href={hl.website}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all"
                        title="Website"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ─── SECTION 2: NEARBY PHYSICAL PSYCHOLOGICAL FACILITIES & HOSPITALS ─── */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#12161f]/90 border border-white/10 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <Hospital className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">
                  Nearby Psychiatric Centers, Therapists &amp; Hospitals
                </h3>
              </div>
              <p className="text-xs text-white/60 mt-0.5">
                Physical emergency rooms, psychologist clinics, and mental health centers near your location.
              </p>
            </div>

            {/* Filter Tabs */}
            {nearbyFacilities.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {[
                  { id: 'all', label: `All (${nearbyFacilities.length})` },
                  { id: 'psychiatric', label: 'Psychiatric' },
                  { id: 'hospital', label: 'Hospitals' },
                  { id: 'clinic', label: 'Clinics' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setFacilityFilter(tab.id as typeof facilityFilter)}
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-all shrink-0 ${
                      facilityFilter === tab.id
                        ? 'bg-white/20 text-white border border-white/30'
                        : 'bg-[#08090d] text-white/50 hover:text-white border border-white/5'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Facilities List Grid */}
          {filteredFacilities.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {filteredFacilities.map((fac) => (
                <div
                  key={fac.id}
                  className="p-3.5 rounded-2xl bg-[#08090d]/90 border border-white/10 hover:border-emerald-500/40 transition-all space-y-2 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-white truncate">
                        {fac.type === 'emergency_hospital' ? (
                          <Hospital className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        ) : fac.type === 'psychiatric_center' ? (
                          <Building2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                        ) : (
                          <Building2 className="w-3.5 h-3.5 text-[#00f59b] shrink-0" />
                        )}
                        <span className="truncate">{fac.name}</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#141a24] text-[#00f59b] font-mono shrink-0 border border-white/5">
                        {fac.distanceKm} km
                      </span>
                    </div>

                    <p className="text-[11px] text-white/50 truncate mt-1">{fac.address}</p>

                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`text-[9px] px-2 py-0.2 rounded-full font-mono uppercase tracking-wider ${
                          fac.is24x7
                            ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/40'
                            : 'bg-white/5 text-white/40'
                        }`}
                      >
                        {fac.is24x7 ? '● 24/7 Care' : fac.type.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Calling & Directions */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/5 gap-2">
                    <a
                      href={`tel:${fac.phone.replace(/[^0-9+]/g, '')}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/40 hover:bg-emerald-950/70 border border-emerald-500/30 text-xs font-bold text-[#00f59b] font-mono transition-all"
                    >
                      <Phone className="w-3 h-3" />
                      <span>{fac.phone}</span>
                    </a>

                    <a
                      href={fac.mapsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-white/80 hover:text-white transition-all"
                    >
                      <span>Directions</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : isLocating ? (
            <div className="py-8 text-center space-y-2">
              <Loader2 className="w-6 h-6 animate-spin text-rose-400 mx-auto" />
              <p className="text-xs text-white/60">
                Querying psychiatric emergency centers and clinics near your location...
              </p>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-[#08090d] text-center text-xs text-white/60 space-y-1">
              <p>No physical facilities found within {selectedRadiusKm}km of this location.</p>
              <p className="text-white/40">Try increasing the search radius above or connect with the 24/7 hotlines.</p>
            </div>
          )}
        </div>

        {/* ─── BOTTOM ACTION & LOCAL EMERGENCY SERVICES BAR ─── */}
        <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-rose-500/20 gap-3">
          <div className="flex items-center gap-2 text-xs text-white/70">
            <span>Immediate Emergency (Police/Ambulance):</span>
            <a
              href={`tel:${localEmergencyNumber}`}
              className="px-3.5 py-1.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-mono font-bold text-xs transition-all shadow-sm flex items-center gap-1.5"
            >
              <Phone className="w-3 h-3 fill-current" />
              <span>Call {localEmergencyNumber}</span>
            </a>
          </div>

          <button
            onClick={handleClose}
            className="px-6 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all ml-auto active:scale-95"
          >
            I Acknowledge &amp; Understand
          </button>
        </div>
      </div>
    </div>
  );
};

export default CrisisModal;

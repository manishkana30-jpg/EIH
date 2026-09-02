'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldAlert,
  Phone,
  HeartHandshake,
  X,
  MapPin,
  Navigation,
  Loader2,
  Hospital,
  Building2,
  ExternalLink,
  Search,
  CheckCircle2,
  AlertTriangle,
  VolumeX,
} from 'lucide-react';
import { CrisisDetectionResult } from '@/lib/safety/crisis-detector';
import { browserSpeechController } from '@/lib/audio/browser-speech';
import { liveKitAudioClient } from '@/lib/audio/livekit-client';

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
  crisisData: CrisisDetectionResult | null;
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
  const [locationError, setLocationError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationDetails, setLocationDetails] = useState<LocationDetails | null>(null);
  const [nearbyFacilities, setNearbyFacilities] = useState<NearbyFacility[]>([]);
  const [selectedRadiusKm, setSelectedRadiusKm] = useState<number>(20);
  const [manualSearchQuery, setManualSearchQuery] = useState<string>('');
  const [facilityFilter, setFacilityFilter] = useState<'all' | 'psychiatric' | 'hospital' | 'clinic'>('all');
  const [localEmergencyNumber, setLocalEmergencyNumber] = useState<string>('112');

  // 1. Hard Audio Killswitch: Immediately silence all AI voice when CrisisModal opens
  useEffect(() => {
    if (isOpen && crisisData?.isCrisis) {
      browserSpeechController.cancelSpeech();
      liveKitAudioClient.handleBargeInInterruption();
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    }
  }, [isOpen, crisisData]);

  // 2. Fetch facilities from exact GPS coordinates or search query
  const fetchFacilities = useCallback(
    async (coords?: { lat: number; lng: number } | null, query?: string, radius: number = 20) => {
      setIsLocating(true);
      setLocationError(null);

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
          if (data.countryCrisisProfile?.emergencyGeneral) {
            setLocalEmergencyNumber(data.countryCrisisProfile.emergencyGeneral);
          }
        } else {
          setLocationError('Unable to reach clinical facility database. Please enter your city manually or retry GPS.');
        }
      } catch {
        setLocationError('Network connection issue while retrieving nearby clinical facilities.');
      } finally {
        setIsLocating(false);
      }
    },
    []
  );

  // 3. Request User GPS Geolocation
  const handleRequestGPSLocation = useCallback(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setLocationError('Geolocation is not supported by your current browser.');
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setUserLocation(coords);
        fetchFacilities(coords, undefined, selectedRadiusKm);
      },
      (err) => {
        setIsLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setLocationError(
            'GPS location access was not granted. Please allow location permissions in your browser or search by city name below.'
          );
        } else {
          setLocationError('GPS signal timed out. Please enter your city or area manually.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, [fetchFacilities, selectedRadiusKm]);

  // 4. Auto-request GPS on modal open
  useEffect(() => {
    if (isOpen && !userLocation && !locationError) {
      handleRequestGPSLocation();
    }
  }, [isOpen, userLocation, locationError, handleRequestGPSLocation]);

  // 5. Handle manual city search
  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualSearchQuery.trim()) return;
    fetchFacilities(null, manualSearchQuery.trim(), selectedRadiusKm);
  };

  if (!isOpen || !crisisData) return null;

  // Filter facilities based on active tab
  const filteredFacilities = nearbyFacilities.filter((fac) => {
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-2xl animate-fade-in select-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby="crisis-title"
    >
      <div className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto bg-[#0c0f16]/98 border border-rose-500/40 rounded-3xl p-5 sm:p-7 shadow-2xl text-white space-y-5 custom-scrollbar">
        {/* TOP BAR: EMERGENCY ALERT & AUDIO SILENCE NOTICE */}
        <div className="flex items-start justify-between gap-4 border-b border-rose-500/20 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-600/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shadow-lg shrink-0">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 id="crisis-title" className="text-lg sm:text-xl font-heading font-bold text-rose-100">
                Immediate Emergency Mental Health Support &amp; Local Care Locator
              </h2>
              <p className="text-xs text-rose-300/80 font-medium">
                Real-Time GPS Psychiatric Emergency Departments, Clinics &amp; Doctors Near You
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

        {/* VOICE SILENCE NOTIFICATION */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-950/40 border border-rose-800/40 text-[11px] text-rose-300">
          <VolumeX className="w-3.5 h-3.5 text-rose-400 shrink-0" />
          <span>AI Voice Assistant is paused for safety. Local medical &amp; psychiatric care takes absolute priority.</span>
        </div>

        {/* EMPATHIC DEFLECTION BANNER */}
        <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-500/30 space-y-2">
          <p className="text-sm sm:text-base font-semibold text-rose-100 leading-relaxed">
            {crisisData.immediateDeflectionStatement ||
              'You are not alone, and your life has profound value. Please connect with nearby local professionals right now.'}
          </p>
          <div className="text-xs text-rose-300/90 flex items-center gap-2 pt-1">
            <HeartHandshake className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>
              Your safety is our top priority. We use your device GPS solely to show verified local psychiatric centers and clinics.
            </span>
          </div>
        </div>

        {/* GPS LOCAL CARE LOCATOR & COORDINATES SEARCH */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#12161f]/90 border border-white/10 space-y-4">
          {/* Header & Status */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-rose-400" />
                <h3 className="text-sm font-bold text-white">
                  Local Emergency Hospitals &amp; Mental Health Facilities (via GPS)
                </h3>
              </div>
              <p className="text-xs text-white/60 mt-0.5">
                On-device GPS query via OpenStreetMap for physical psychiatric hospitals, therapists, and emergency centers.
              </p>
            </div>

            {/* GPS Trigger Button */}
            <button
              onClick={handleRequestGPSLocation}
              disabled={isLocating}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-rose-600 hover:bg-rose-500 disabled:bg-rose-900/50 text-white text-xs font-bold shadow-lg hover:scale-105 active:scale-95 transition-all shrink-0"
              title="Locate via GPS"
            >
              {isLocating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Locating GPS...</span>
                </>
              ) : (
                <>
                  <Navigation className="w-3.5 h-3.5" />
                  <span>{userLocation ? 'Refresh GPS Location' : 'Grant GPS Location'}</span>
                </>
              )}
            </button>
          </div>

          {/* Detected GPS Coordinates & Location Badge */}
          {locationDetails?.formattedAddress && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="truncate">
                <span className="font-semibold">GPS Location:</span>{' '}
                <span className="text-white/90">{locationDetails.formattedAddress}</span>
                {userLocation && (
                  <span className="font-mono text-[10px] text-emerald-400/80 ml-2">
                    ({userLocation.lat.toFixed(4)}°, {userLocation.lng.toFixed(4)}°)
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Location Error Warning */}
          {locationError && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 text-xs text-amber-200">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>{locationError}</span>
            </div>
          )}

          {/* Manual Search Bar & Radius Selectors */}
          <div className="flex flex-col sm:flex-row gap-2 items-center">
            <form onSubmit={handleManualSearch} className="flex-1 w-full flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={manualSearchQuery}
                  onChange={(e) => setManualSearchQuery(e.target.value)}
                  placeholder="Or enter city / area (e.g. Mumbai, New Delhi, Austin, London)..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#08090d] border border-white/10 focus:border-rose-500 text-xs text-white placeholder:text-white/30 outline-none transition-all"
                />
              </div>
              <button
                type="submit"
                className="px-3.5 py-2 rounded-xl bg-[#1c2432] hover:bg-[#253144] border border-white/10 text-xs font-semibold text-white shrink-0 transition-all"
              >
                Search
              </button>
            </form>

            {/* Radius Quick Buttons */}
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

          {/* Facility Type Filter Tabs */}
          {nearbyFacilities.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
              {[
                { id: 'all', label: `All Facilities (${nearbyFacilities.length})` },
                { id: 'psychiatric', label: 'Psychiatric & Mental Health' },
                { id: 'hospital', label: 'Emergency Hospitals' },
                { id: 'clinic', label: 'Clinics & Therapy' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFacilityFilter(tab.id as typeof facilityFilter)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all shrink-0 ${
                    facilityFilter === tab.id
                      ? 'bg-white/15 text-white border border-white/30'
                      : 'bg-[#08090d] text-white/50 hover:text-white border border-white/5'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          {/* Render Discovered Facilities Grid */}
          {filteredFacilities.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {filteredFacilities.map((fac) => (
                <div
                  key={fac.id}
                  className="p-3.5 rounded-2xl bg-[#08090d]/90 border border-white/10 hover:border-rose-500/40 transition-all space-y-2 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-white truncate">
                        {fac.type === 'emergency_hospital' ? (
                          <Hospital className="w-3.5 h-3.5 text-rose-400 shrink-0" />
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
                        {fac.is24x7 ? '● 24/7 Emergency' : 'Medical Center'}
                      </span>
                    </div>
                  </div>

                  {/* One-Tap Calling & Maps Directions */}
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
              <p className="text-xs text-white/60">Searching OpenStreetMap database for psychiatric emergency centers near your GPS coordinates...</p>
            </div>
          ) : userLocation ? (
            <div className="p-4 rounded-xl bg-[#08090d] text-center text-xs text-white/60 space-y-1">
              <p>No psychiatric facilities recorded within {selectedRadiusKm}km of your coordinates.</p>
              <p className="text-white/40">Try increasing the search radius above or call emergency services directly.</p>
            </div>
          ) : null}
        </div>

        {/* BOTTOM ACTION & LOCAL EMERGENCY SERVICES BAR */}
        <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-rose-500/20 gap-3">
          <div className="flex items-center gap-2 text-xs text-white/70">
            <span>Immediate Emergency (Police/Ambulance):</span>
            <a
              href={`tel:${localEmergencyNumber}`}
              className="px-3 py-1 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-mono font-bold text-xs transition-all shadow-sm flex items-center gap-1"
            >
              <Phone className="w-3 h-3 fill-current" />
              <span>Call {localEmergencyNumber}</span>
            </a>
          </div>

          <button
            onClick={handleClose}
            className="px-6 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all ml-auto"
          >
            I Acknowledge &amp; Understand
          </button>
        </div>
      </div>
    </div>
  );
};

export default CrisisModal;

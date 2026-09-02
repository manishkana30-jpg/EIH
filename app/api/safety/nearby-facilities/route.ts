import { NextRequest, NextResponse } from 'next/server';
import {
  getCrisisProfileByCountry,
  inferCountryFromTimezone,
  CountryCrisisProfile,
} from '@/lib/safety/geo-crisis-directory';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

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

export interface OverpassElement {
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

async function reverseGeocodeCoordinates(lat: number, lng: number): Promise<LocationDetails> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'EmotionalIntelligenceHealer/2.0 (Mental Health Crisis Support)',
      },
      signal: AbortSignal.timeout(3500),
    });

    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};
      return {
        city: addr.city || addr.town || addr.village || addr.county || addr.suburb,
        state: addr.state || addr.region || addr.province,
        country: addr.country,
        countryCode: (addr.country_code || '').toUpperCase(),
        formattedAddress: data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      };
    }
  } catch {
    // Graceful fallback if external reverse-geocode times out
  }

  return {
    formattedAddress: `${lat.toFixed(4)}°, ${lng.toFixed(4)}°`,
  };
}

async function geocodeQuery(query: string): Promise<{ lat: number; lng: number; locationDetails: LocationDetails } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&addressdetails=1`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'EmotionalIntelligenceHealer/2.0 (Mental Health Crisis Support)',
      },
      signal: AbortSignal.timeout(4000),
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const item = data[0];
        const lat = parseFloat(item.lat);
        const lng = parseFloat(item.lon);
        const addr = item.address || {};
        return {
          lat,
          lng,
          locationDetails: {
            city: addr.city || addr.town || addr.village || addr.county,
            state: addr.state || addr.region,
            country: addr.country,
            countryCode: (addr.country_code || '').toUpperCase(),
            formattedAddress: item.display_name,
          },
        };
      }
    }
  } catch {
    // Fallback
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    let { lat, lng, radiusKm = 20, searchQuery, timezone } = body;

    let locationDetails: LocationDetails = {};

    // 1. If manual search query provided (e.g. "Mumbai", "London", "Austin Texas")
    if (searchQuery && typeof searchQuery === 'string' && searchQuery.trim()) {
      const geocoded = await geocodeQuery(searchQuery.trim());
      if (geocoded) {
        lat = geocoded.lat;
        lng = geocoded.lng;
        locationDetails = geocoded.locationDetails;
      }
    }

    // 2. Validate coordinates
    if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
      // Return country profile based on timezone without facilities if coordinates unavailable
      const fallbackCountryCode = inferCountryFromTimezone(timezone);
      const fallbackProfile = getCrisisProfileByCountry(fallbackCountryCode);

      return NextResponse.json({
        success: true,
        userCoordinates: null,
        locationDetails: {
          country: fallbackProfile.countryName,
          countryCode: fallbackProfile.countryCode,
          formattedAddress: `Defaulting to ${fallbackProfile.countryName} Emergency Lines`,
        },
        countryCrisisProfile: fallbackProfile,
        nearbyFacilities: [],
      });
    }

    // 3. Reverse-geocode coordinates to get country and city
    if (!locationDetails.countryCode) {
      locationDetails = await reverseGeocodeCoordinates(lat, lng);
    }

    // Fallback country code if reverse geocode didn't return one
    const detectedCountryCode = locationDetails.countryCode || inferCountryFromTimezone(timezone);
    const countryCrisisProfile: CountryCrisisProfile = getCrisisProfileByCountry(detectedCountryCode);

    if (!locationDetails.country) {
      locationDetails.country = countryCrisisProfile.countryName;
      locationDetails.countryCode = countryCrisisProfile.countryCode;
    }

    const radiusMeters = Math.min(50000, Math.max(1000, radiusKm * 1000));

    // 4. OpenStreetMap Overpass QL Query for Hospitals, Mental Health, and Clinics
    const overpassQuery = `
      [out:json][timeout:10];
      (
        node["amenity"="hospital"](around:${radiusMeters},${lat},${lng});
        way["amenity"="hospital"](around:${radiusMeters},${lat},${lng});
        node["healthcare"="hospital"](around:${radiusMeters},${lat},${lng});
        node["healthcare"="psychotherapist"](around:${radiusMeters},${lat},${lng});
        node["healthcare"="psychiatrist"](around:${radiusMeters},${lat},${lng});
        node["healthcare"="counselling"](around:${radiusMeters},${lat},${lng});
        node["amenity"="clinic"](around:${radiusMeters},${lat},${lng});
        node["healthcare"="centre"](around:${radiusMeters},${lat},${lng});
      );
      out center 20;
    `;

    let facilities: NearbyFacility[] = [];

    try {
      const overpassRes = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encodeURIComponent(overpassQuery)}`,
        signal: AbortSignal.timeout(6000),
      });

      if (overpassRes.ok) {
        const data = await overpassRes.json();
        const elements = data.elements || [];

        facilities = (elements as OverpassElement[])
          .filter((el: OverpassElement) => el.tags && (el.tags.name || el.tags['name:en']))
          .map((el: OverpassElement) => {
            const itemLat = el.lat || el.center?.lat || lat;
            const itemLng = el.lon || el.center?.lon || lng;
            const tags = el.tags || {};
            const name = tags.name || tags['name:en'] || 'Medical / Psychiatric Care Center';
            const dist = calculateHaversineDistance(lat, lng, itemLat, itemLng);

            let type: NearbyFacility['type'] = 'emergency_hospital';
            const nameLower = name.toLowerCase();
            const healthcare = tags.healthcare || '';

            if (
              healthcare === 'psychotherapist' ||
              healthcare === 'counselling' ||
              nameLower.includes('psych') ||
              nameLower.includes('counsel') ||
              nameLower.includes('therapy')
            ) {
              type = 'psychologist_clinic';
            } else if (
              healthcare === 'psychiatrist' ||
              nameLower.includes('mental') ||
              nameLower.includes('mind') ||
              nameLower.includes('behavioral') ||
              nameLower.includes('psychiatric')
            ) {
              type = 'psychiatric_center';
            } else if (tags.amenity === 'clinic' || healthcare === 'centre') {
              type = 'crisis_center';
            }

            const phone =
              tags.phone ||
              tags['contact:phone'] ||
              tags['emergency:phone'] ||
              tags['phone:emergency'] ||
              (type === 'emergency_hospital'
                ? countryCrisisProfile.emergencyGeneral
                : countryCrisisProfile.primarySuicideLifeline.phone);

            const addressParts = [
              tags['addr:housenumber'],
              tags['addr:street'],
              tags['addr:suburb'] || tags['addr:district'],
              tags['addr:city'] || tags['addr:town'] || locationDetails.city,
            ].filter(Boolean);

            const address = addressParts.length > 0 ? addressParts.join(', ') : `${dist.toFixed(1)} km from your location`;

            const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              `${name} ${itemLat},${itemLng}`
            )}`;

            return {
              id: `fac-${el.id}`,
              name,
              type,
              distanceKm: parseFloat(dist.toFixed(1)),
              phone,
              address,
              is24x7: tags.opening_hours === '24/7' || type === 'emergency_hospital',
              mapsUrl,
            };
          })
          .sort((a: NearbyFacility, b: NearbyFacility) => a.distanceKm - b.distanceKm)
          .slice(0, 10);
      }
    } catch {
      // Overpass network fallback
    }

    return NextResponse.json({
      success: true,
      userCoordinates: { lat, lng },
      locationDetails,
      countryCrisisProfile,
      nearbyFacilities: facilities,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to locate nearby facilities';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


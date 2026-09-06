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

async function handleNearbyFacilities(
  req: NextRequest,
  params: {
    lat?: number;
    lng?: number;
    radiusKm?: number;
    searchQuery?: string;
    timezone?: string;
  }
) {
  try {
    let { lat, lng, radiusKm = 20, searchQuery, timezone } = params;
    let locationDetails: LocationDetails = {};
    let locationSource: 'gps' | 'ip' | 'manual' | 'timezone' = 'gps';

    const headers = req.headers;

    // 1. Manual search query (e.g. "Mumbai", "London", "Austin Texas")
    if (searchQuery && typeof searchQuery === 'string' && searchQuery.trim()) {
      const geocoded = await geocodeQuery(searchQuery.trim());
      if (geocoded) {
        lat = geocoded.lat;
        lng = geocoded.lng;
        locationDetails = geocoded.locationDetails;
        locationSource = 'manual';
      }
    } else if (typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng)) {
      locationSource = 'gps';
    } else {
      // 2. Fast Server-Side IP Geolocation Fallback (Vercel Edge Geolocation Headers)
      const vercelLatStr = headers.get('x-vercel-ip-latitude');
      const vercelLonStr = headers.get('x-vercel-ip-longitude');
      const vercelCountry = headers.get('x-vercel-ip-country')?.toUpperCase();
      const vercelCity = headers.get('x-vercel-ip-city');
      const vercelRegion = headers.get('x-vercel-ip-country-region');

      if (vercelLatStr && vercelLonStr) {
        lat = parseFloat(vercelLatStr);
        lng = parseFloat(vercelLonStr);
        locationSource = 'ip';
        locationDetails = {
          city: vercelCity ? decodeURIComponent(vercelCity) : undefined,
          state: vercelRegion || undefined,
          countryCode: vercelCountry && vercelCountry !== 'XX' ? vercelCountry : undefined,
          formattedAddress: vercelCity
            ? `${decodeURIComponent(vercelCity)}${vercelRegion ? `, ${vercelRegion}` : ''}${vercelCountry ? `, ${vercelCountry}` : ''}`
            : undefined,
        };
      } else if (vercelCountry && vercelCountry !== 'XX' && vercelCountry !== 'T1') {
        locationSource = 'ip';
        locationDetails = {
          city: vercelCity ? decodeURIComponent(vercelCity) : undefined,
          state: vercelRegion || undefined,
          countryCode: vercelCountry,
          formattedAddress: vercelCity ? `${decodeURIComponent(vercelCity)}, ${vercelCountry}` : vercelCountry,
        };
      }
    }

    // 3. Fallback to timezone if countryCode still missing
    const detectedCountryCode =
      locationDetails.countryCode ||
      (headers.get('x-vercel-ip-country')?.toUpperCase() !== 'XX' ? headers.get('x-vercel-ip-country')?.toUpperCase() : undefined) ||
      inferCountryFromTimezone(timezone);

    const countryCrisisProfile: CountryCrisisProfile = getCrisisProfileByCountry(detectedCountryCode || 'US');

    if (!locationDetails.country) {
      locationDetails.country = countryCrisisProfile.countryName;
      locationDetails.countryCode = countryCrisisProfile.countryCode;
    }

    // 4. If coordinates are completely unavailable, return crisis profile without facilities
    if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
      return NextResponse.json({
        success: true,
        userCoordinates: null,
        locationSource: 'timezone',
        locationDetails: {
          country: countryCrisisProfile.countryName,
          countryCode: countryCrisisProfile.countryCode,
          formattedAddress: locationDetails.city
            ? `${locationDetails.city}, ${countryCrisisProfile.countryName}`
            : `Defaulting to ${countryCrisisProfile.countryName} Emergency Lines`,
        },
        countryCrisisProfile,
        nearbyFacilities: [],
      });
    }

    // 5. Reverse-geocode coordinates if city/country are missing
    if (!locationDetails.countryCode || !locationDetails.city) {
      const rev = await reverseGeocodeCoordinates(lat, lng);
      locationDetails = {
        ...locationDetails,
        ...rev,
        city: rev.city || locationDetails.city,
        country: rev.country || locationDetails.country || countryCrisisProfile.countryName,
        countryCode: rev.countryCode || locationDetails.countryCode || countryCrisisProfile.countryCode,
      };
    }

    const radiusMeters = Math.min(50000, Math.max(1000, radiusKm * 1000));

    // 6. OpenStreetMap Overpass QL Query for Hospitals, Mental Health, and Clinics
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
            const itemLat = el.lat || el.center?.lat || lat!;
            const itemLng = el.lon || el.center?.lon || lng!;
            const tags = el.tags || {};
            const name = tags.name || tags['name:en'] || 'Medical / Psychiatric Care Center';
            const dist = calculateHaversineDistance(lat!, lng!, itemLat, itemLng);

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

            const address =
              addressParts.length > 0 ? addressParts.join(', ') : `${dist.toFixed(1)} km from your location`;

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
      userCoordinates: { lat: lat!, lng: lng! },
      locationSource,
      locationDetails,
      countryCrisisProfile,
      nearbyFacilities: facilities,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to locate nearby facilities';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  return handleNearbyFacilities(req, body);
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const latStr = url.searchParams.get('lat');
  const lngStr = url.searchParams.get('lng');
  const radiusKmStr = url.searchParams.get('radiusKm');
  const searchQuery = url.searchParams.get('searchQuery') || undefined;
  const timezone = url.searchParams.get('timezone') || undefined;

  const lat = latStr ? parseFloat(latStr) : undefined;
  const lng = lngStr ? parseFloat(lngStr) : undefined;
  const radiusKm = radiusKmStr ? parseFloat(radiusKmStr) : 20;

  return handleNearbyFacilities(req, { lat, lng, radiusKm, searchQuery, timezone });
}


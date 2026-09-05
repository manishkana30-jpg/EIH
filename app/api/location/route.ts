import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

// Mapping from ISO-2 Country Codes to Primary Companion Language
const COUNTRY_TO_LANGUAGE_MAP: Record<string, { langCode: string; countryName: string }> = {
  IN: { langCode: 'hi', countryName: 'India' },
  US: { langCode: 'en', countryName: 'United States' },
  GB: { langCode: 'en', countryName: 'United Kingdom' },
  CA: { langCode: 'en', countryName: 'Canada' },
  AU: { langCode: 'en', countryName: 'Australia' },
  NZ: { langCode: 'en', countryName: 'New Zealand' },
  IE: { langCode: 'en', countryName: 'Ireland' },
  ES: { langCode: 'es', countryName: 'Spain' },
  MX: { langCode: 'es', countryName: 'Mexico' },
  CO: { langCode: 'es', countryName: 'Colombia' },
  AR: { langCode: 'es', countryName: 'Argentina' },
  PE: { langCode: 'es', countryName: 'Peru' },
  VE: { langCode: 'es', countryName: 'Venezuela' },
  CL: { langCode: 'es', countryName: 'Chile' },
  GT: { langCode: 'es', countryName: 'Guatemala' },
  EC: { langCode: 'es', countryName: 'Ecuador' },
  CU: { langCode: 'es', countryName: 'Cuba' },
  BO: { langCode: 'es', countryName: 'Bolivia' },
  DO: { langCode: 'es', countryName: 'Dominican Republic' },
  FR: { langCode: 'fr', countryName: 'France' },
  BE: { langCode: 'fr', countryName: 'Belgium' },
  CH: { langCode: 'de', countryName: 'Switzerland' },
  DE: { langCode: 'de', countryName: 'Germany' },
  AT: { langCode: 'de', countryName: 'Austria' },
  BR: { langCode: 'pt', countryName: 'Brazil' },
  PT: { langCode: 'pt', countryName: 'Portugal' },
  IT: { langCode: 'it', countryName: 'Italy' },
  RU: { langCode: 'ru', countryName: 'Russia' },
  CN: { langCode: 'zh', countryName: 'China' },
  TW: { langCode: 'zh', countryName: 'Taiwan' },
  HK: { langCode: 'zh', countryName: 'Hong Kong' },
  JP: { langCode: 'ja', countryName: 'Japan' },
  KR: { langCode: 'ko', countryName: 'South Korea' },
  SA: { langCode: 'ar', countryName: 'Saudi Arabia' },
  AE: { langCode: 'ar', countryName: 'United Arab Emirates' },
  EG: { langCode: 'ar', countryName: 'Egypt' },
  TR: { langCode: 'tr', countryName: 'Turkey' },
  ID: { langCode: 'id', countryName: 'Indonesia' },
  PL: { langCode: 'pl', countryName: 'Poland' },
  SE: { langCode: 'sv', countryName: 'Sweden' },
  NL: { langCode: 'nl', countryName: 'Netherlands' },
  VN: { langCode: 'vi', countryName: 'Vietnam' },
  TH: { langCode: 'th', countryName: 'Thailand' },
};

function isPrivateIp(ip: string): boolean {
  if (!ip) return true;
  if (ip === '127.0.0.1' || ip === '::1' || ip === 'localhost') return true;
  if (ip.startsWith('10.') || ip.startsWith('192.168.')) return true;
  if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ip)) return true;
  return false;
}

export async function GET(request: NextRequest) {
  try {
    const headers = request.headers;

    // 1. Check Native Vercel Edge Geolocation Headers (Zero Latency)
    const vercelCountry = headers.get('x-vercel-ip-country')?.toUpperCase();
    const vercelCity = headers.get('x-vercel-ip-city') || undefined;
    const vercelRegion = headers.get('x-vercel-ip-country-region') || undefined;
    const vercelLatStr = headers.get('x-vercel-ip-latitude');
    const vercelLonStr = headers.get('x-vercel-ip-longitude');
    const vercelTimezone = headers.get('x-vercel-ip-timezone') || undefined;

    if (vercelCountry && vercelCountry !== 'XX' && vercelCountry !== 'T1') {
      const mapped = COUNTRY_TO_LANGUAGE_MAP[vercelCountry];
      const defaultLanguageCode = mapped?.langCode || 'en';
      const countryName = mapped?.countryName || vercelCountry;

      return NextResponse.json({
        success: true,
        source: 'vercel_edge_ip',
        countryCode: vercelCountry,
        countryName,
        city: vercelCity ? decodeURIComponent(vercelCity) : undefined,
        regionName: vercelRegion || undefined,
        timezone: vercelTimezone,
        defaultLanguageCode,
        latitude: vercelLatStr ? parseFloat(vercelLatStr) : undefined,
        longitude: vercelLonStr ? parseFloat(vercelLonStr) : undefined,
        isIp: true,
      });
    }

    // 2. Extract Client IP Address from Standard Proxy Headers
    const forwardedFor = headers.get('x-forwarded-for');
    const realIp = headers.get('x-real-ip');
    const clientIp = (forwardedFor ? forwardedFor.split(',')[0].trim() : realIp || '').trim();

    // 3. Fast External IP Geolocation Lookup (Free IP API with 2.5s Timeout)
    const queryUrl = clientIp && !isPrivateIp(clientIp)
      ? `https://freeipapi.com/api/json/${clientIp}`
      : `https://freeipapi.com/api/json`;

    try {
      const geoRes = await fetch(queryUrl, {
        signal: AbortSignal.timeout(2500),
        headers: { Accept: 'application/json' },
      });

      if (geoRes.ok) {
        const geoData = await geoRes.json();
        const countryCode = (geoData.countryCode || '').toUpperCase();
        if (countryCode) {
          const mapped = COUNTRY_TO_LANGUAGE_MAP[countryCode];
          const defaultLanguageCode = mapped?.langCode || 'en';
          const countryName = mapped?.countryName || geoData.countryName || countryCode;

          return NextResponse.json({
            success: true,
            source: 'external_ip_geo',
            countryCode,
            countryName,
            city: geoData.cityName || undefined,
            regionName: geoData.regionName || undefined,
            timezone: geoData.timeZone || undefined,
            defaultLanguageCode,
            latitude: geoData.latitude || undefined,
            longitude: geoData.longitude || undefined,
            isIp: true,
            ipAddress: geoData.ipAddress || clientIp,
          });
        }
      }
    } catch (_) {
      // Free IP API lookup timed out or failed; will fallback cleanly below
    }

    // 4. Infallible English Default Fallback
    return NextResponse.json({
      success: true,
      source: 'default_fallback',
      countryCode: 'US',
      countryName: 'United States',
      city: 'Global',
      defaultLanguageCode: 'en',
      isIp: false,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      source: 'error_fallback',
      countryCode: 'US',
      countryName: 'United States',
      defaultLanguageCode: 'en',
      isIp: false,
      error: error?.message || 'Location deduction error',
    });
  }
}

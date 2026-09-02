import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

function base64UrlEncode(input: string | Uint8Array): string {
  let base64: string;
  if (typeof input === 'string') {
    base64 = btoa(unescape(encodeURIComponent(input)));
  } else {
    let binary = '';
    for (let i = 0; i < input.byteLength; i++) {
      binary += String.fromCharCode(input[i]);
    }
    base64 = btoa(binary);
  }
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function createLiveKitJwt(
  apiKey: string,
  apiSecret: string,
  identity: string,
  room: string,
  metadata: string
): Promise<string> {
  const nowSec = Math.floor(Date.now() / 1000);
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = {
    exp: nowSec + 1800, // 30 minutes
    iss: apiKey,
    nbf: nowSec - 5,
    sub: identity,
    video: {
      room,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    },
    metadata,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const dataToSign = `${encodedHeader}.${encodedPayload}`;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(apiSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(dataToSign)
  );

  const encodedSignature = base64UrlEncode(new Uint8Array(signature));
  return `${dataToSign}.${encodedSignature}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { roomName, identity, tier, apiKey, userDosha } = body;

    const apiKeyLiveKit = process.env.LIVEKIT_API_KEY || 'devkey';
    const apiSecretLiveKit = process.env.LIVEKIT_API_SECRET || 'secret';
    const livekitHost = process.env.NEXT_PUBLIC_LIVEKIT_URL || 'wss://demo.livekit.cloud';

    const room = roomName || `eih-room-${Date.now()}`;
    const participantName = identity || `user-${Math.floor(Math.random() * 10000)}`;

    const metadataObj = {
      tier: tier || 1,
      byokApiKey: apiKey || null,
      userDosha: userDosha || 'Equilibrium',
      timestamp: Date.now(),
    };

    const token = await createLiveKitJwt(
      apiKeyLiveKit,
      apiSecretLiveKit,
      participantName,
      room,
      JSON.stringify(metadataObj)
    );

    return NextResponse.json({
      token,
      serverUrl: livekitHost,
      wsUrl: livekitHost,
      room,
      tier: tier || 1,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to generate token';
    console.error('Error generating LiveKit token:', err);
    return NextResponse.json(
      { error: 'Failed to generate token', details: message },
      { status: 500 }
    );
  }
}

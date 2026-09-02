import { NextRequest, NextResponse } from 'next/server';
import { AccessToken } from 'livekit-server-sdk';

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

    const at = new AccessToken(apiKeyLiveKit, apiSecretLiveKit, {
      identity: participantName,
      ttl: '30m',
      metadata: JSON.stringify(metadataObj),
    });

    at.addGrant({
      room,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    const token = await at.toJwt();

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

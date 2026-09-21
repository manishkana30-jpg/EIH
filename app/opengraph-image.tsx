import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'AI Somatic Therapy & Neuro-Vedantic Healing — Emotional Intelligence Healer';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#09090b',
          backgroundImage: 'radial-gradient(circle at 50% 30%, #271f0d 0%, #09090b 70%)',
          color: '#ecf3ee',
          fontFamily: 'sans-serif',
          padding: '60px',
        }}
      >
        {/* Sacred Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '10px 24px',
            borderRadius: '9999px',
            backgroundColor: 'rgba(245, 158, 11, 0.15)',
            border: '2px solid rgba(245, 158, 11, 0.4)',
            color: '#f59e0b',
            fontSize: '18px',
            fontWeight: 700,
            letterSpacing: '2px',
            textTransform: 'uppercase',
            marginBottom: '24px',
          }}
        >
          <span>🧠</span>
          <span>AI Somatic Therapy & Neuro-Vedantic Healing</span>
          <span>🧠</span>
        </div>

        {/* Main Title */}
        <h1
          style={{
            fontSize: '64px',
            fontWeight: 800,
            textAlign: 'center',
            color: '#ffffff',
            margin: '0 0 16px 0',
            letterSpacing: '-1px',
            lineHeight: 1.1,
          }}
        >
          Emotional Intelligence Healer
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontSize: '24px',
            color: '#a1a1aa',
            textAlign: 'center',
            maxWidth: '960px',
            margin: '0 0 36px 0',
            lineHeight: 1.4,
          }}
        >
          Polyvagal State Tracker • Clinical Trataka Protocol • Triguna Equilibrium • Encrypted Emotion Telemetry
        </p>

        {/* Telemetry Indicator Pills */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 18px',
              borderRadius: '9999px',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              color: '#34d399',
              fontSize: '15px',
              fontWeight: 600,
            }}
          >
            <span>●</span>
            <span>Ventral Vagal (Regulated)</span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 18px',
              borderRadius: '9999px',
              backgroundColor: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              color: '#fbbf24',
              fontSize: '15px',
              fontWeight: 600,
            }}
          >
            <span>●</span>
            <span>Sattva Balance 70%</span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 18px',
              borderRadius: '9999px',
              backgroundColor: '#18181b',
              border: '1px solid #27272a',
              color: '#a1a1aa',
              fontSize: '15px',
              fontWeight: 600,
              fontFamily: 'monospace',
            }}
          >
            <span>🔒 eih-chi.vercel.app</span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}

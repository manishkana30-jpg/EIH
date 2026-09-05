'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Camera, CameraOff, RefreshCw, Copy, Check, ShieldCheck, Sparkles } from 'lucide-react';

type CameraErrorType = 'denied' | 'not_found' | 'in_use' | 'insecure' | 'generic' | null;

export default function PratibimbCamera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState(false);
  const [errorType, setErrorType] = useState<CameraErrorType>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isRequesting, setIsRequesting] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [useObsidianFallback, setUseObsidianFallback] = useState(false);
  const [siteSettingsUrl, setSiteSettingsUrl] = useState('');

  // Detect current origin for settings guidance
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const origin = window.location.origin;
      setSiteSettingsUrl(`chrome://settings/content/siteDetails?site=${encodeURIComponent(origin)}`);
    }
  }, []);

  const stopTracks = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (err) {
          console.warn('Error stopping camera track:', err);
        }
      });
      streamRef.current = null;
    }
  }, []);

  const setupCamera = useCallback(async () => {
    setIsRequesting(true);
    setError(false);
    setErrorType(null);
    setErrorMessage('');

    // Ensure visual feedback persists for at least 500ms so the user clearly sees the attempt
    const startTime = Date.now();

    try {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        throw new Error('MediaDevicesUnsupported');
      }

      let stream: MediaStream | null = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
        });
      } catch (tier1Err: any) {
        console.warn('FacingMode user constraint note, falling back to generic video:', tier1Err);
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }

      const elapsed = Date.now() - startTime;
      if (elapsed < 500) {
        await new Promise((resolve) => setTimeout(resolve, 500 - elapsed));
      }

      streamRef.current = stream;
      if (videoRef.current && stream) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch((err) => console.warn('Video play notice:', err));
        };
        videoRef.current.play().catch((err) => console.warn('Video immediate play notice:', err));
      }
      setIsRequesting(false);
      setError(false);
      setUseObsidianFallback(false);
    } catch (err: any) {
      const elapsed = Date.now() - startTime;
      if (elapsed < 500) {
        await new Promise((resolve) => setTimeout(resolve, 500 - elapsed));
      }

      console.error('Camera access error details:', err);
      setIsRequesting(false);
      setError(true);

      const errName = err?.name || '';
      const errMsg = err?.message || '';

      if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
        setErrorType('denied');
        setErrorMessage('Camera access is blocked by browser or Windows privacy settings.');
      } else if (errName === 'NotFoundError' || errName === 'DevicesNotFoundError') {
        setErrorType('not_found');
        setErrorMessage('No camera device detected on this computer.');
      } else if (errName === 'NotReadableError' || errName === 'TrackStartError') {
        setErrorType('in_use');
        setErrorMessage('Camera is locked by another program (Zoom, Teams, Skype).');
      } else if (errMsg === 'MediaDevicesUnsupported' || (typeof window !== 'undefined' && !window.isSecureContext)) {
        setErrorType('insecure');
        setErrorMessage('Camera requires a secure HTTPS connection or localhost.');
      } else {
        setErrorType('generic');
        setErrorMessage(errMsg || 'Camera connection could not be established.');
      }
    }
  }, []);

  useEffect(() => {
    setupCamera();

    // Dynamically listen for permission status changes (e.g. user toggles Allow in browser settings)
    let permStatus: PermissionStatus | null = null;
    if (typeof navigator !== 'undefined' && navigator.permissions?.query) {
      navigator.permissions
        .query({ name: 'camera' as any })
        .then((status) => {
          permStatus = status;
          if (status.state === 'denied') {
            setError(true);
            setErrorType('denied');
            setErrorMessage('Camera access is blocked in browser settings.');
          }
          const handleChange = () => {
            if (status.state === 'granted') {
              setError(false);
              setupCamera();
            } else if (status.state === 'denied') {
              setError(true);
              setErrorType('denied');
              setErrorMessage('Camera access is blocked in browser settings.');
            }
          };
          status.addEventListener('change', handleChange);
        })
        .catch(() => {});
    }

    return () => {
      // CRITICAL CLEANUP: Stop the camera when Trataka ends or component unmounts
      stopTracks();
      if (permStatus) {
        try {
          permStatus.removeEventListener('change', () => {});
        } catch {}
      }
    };
  }, [setupCamera, stopTracks]);

  const handleCopySettingsUrl = () => {
    if (typeof navigator !== 'undefined' && siteSettingsUrl) {
      navigator.clipboard?.writeText(siteSettingsUrl).then(() => {
        setCopiedUrl(true);
        setTimeout(() => setCopiedUrl(false), 3000);
      }).catch(() => {});
    }
  };

  // 1. Obsidian Sacred Mirror Fallback Mode
  if (useObsidianFallback) {
    return (
      <div className="relative w-[340px] h-[340px] sm:w-[500px] sm:h-[500px] md:w-[600px] md:h-[600px] rounded-full overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-cyan-500/20 flex flex-col items-center justify-center select-none bg-gradient-to-b from-slate-950 via-cyan-950/20 to-black p-6 text-center">
        {/* Subtle breathing concentric ripples */}
        <div className="absolute inset-8 rounded-full border border-cyan-500/10 animate-pulse pointer-events-none" />
        <div className="absolute inset-16 rounded-full border border-cyan-500/15 pointer-events-none" />
        <div className="absolute inset-28 rounded-full border border-cyan-400/20 pointer-events-none" />

        {/* Central reflective obsidian pool */}
        <div className="relative z-10 flex flex-col items-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-center shadow-[0_0_25px_rgba(6,182,212,0.2)]">
            <Sparkles className="w-7 h-7 text-cyan-400/80 animate-pulse" />
          </div>
          <p className="text-sm font-medium text-cyan-200/90 tracking-wide font-sans">
            Obsidian Reflective Pool
          </p>
          <p className="text-[11px] text-slate-400 max-w-[260px] leading-relaxed">
            Sacred meditative mirror active. Softly rest your gaze into the dark reflection of yourself.
          </p>
          <button
            onClick={() => {
              setUseObsidianFallback(false);
              setupCamera();
            }}
            className="mt-2 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-cyan-500/30 text-cyan-300 font-mono text-[10px] transition-all cursor-pointer active:scale-95 flex items-center gap-1.5"
          >
            <Camera className="w-3 h-3 text-cyan-400" />
            <span>Switch to Live Camera</span>
          </button>
        </div>
      </div>
    );
  }

  // 2. Error / Blocked Permission State with Interactive Diagnostics & Unblock Assistance
  if (error) {
    return (
      <div className="w-[340px] h-[340px] sm:w-[500px] sm:h-[500px] rounded-full bg-gradient-to-b from-slate-900 via-slate-950 to-black flex flex-col items-center justify-center text-slate-300 border border-cyan-500/20 shadow-2xl p-6 sm:p-8 text-center select-none space-y-2.5 z-20">
        <div className="w-10 h-10 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(244,63,94,0.15)]">
          <CameraOff className="w-5 h-5 text-rose-400" />
        </div>

        <div className="space-y-1">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
            {errorType === 'denied' ? 'Camera Blocked by Browser' : 'Camera Permission Required'}
          </h4>
          <p className="text-[11px] text-slate-400 max-w-[280px] leading-tight">
            {errorMessage || 'Camera permission required for Pratibimb Mirror.'}
          </p>
        </div>

        {/* Actionable Unblock Guidance based on App/PWA environment */}
        {errorType === 'denied' && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 max-w-[300px] text-left text-[10px] space-y-1.5 text-slate-300 shadow-inner">
            <div className="font-semibold text-cyan-400 flex items-center gap-1">
              <span>How to Unblock:</span>
            </div>
            <div className="space-y-1 text-slate-400 leading-snug">
              <p>
                • <strong className="text-slate-200">Installed App (PWA):</strong> Click <span className="text-cyan-300 font-mono">⋮</span> in the top-right window title bar ➔ <em>App info</em> ➔ set Camera to <span className="text-emerald-400 font-medium">Allow</span>.
              </p>
              <p>
                • <strong className="text-slate-200">In Chrome / Edge:</strong> Click the sliders icon <span className="text-cyan-300 font-mono">🎚️</span> to the left of the URL ➔ set Camera to <span className="text-emerald-400 font-medium">Allow</span>.
              </p>
            </div>
            {siteSettingsUrl && (
              <button
                type="button"
                onClick={handleCopySettingsUrl}
                className="w-full mt-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 flex items-center justify-center gap-1 font-mono text-[9px] transition-colors cursor-pointer border border-cyan-500/20"
              >
                {copiedUrl ? (
                  <>
                    <Check className="w-2.5 h-2.5 text-emerald-400" />
                    <span>Copied Settings Link! Paste in new tab</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-2.5 h-2.5" />
                    <span>Copy chrome://settings URL</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* Buttons: Retry & Fallback */}
        <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
          <button
            onClick={setupCamera}
            disabled={isRequesting}
            className="px-4 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:bg-cyan-500/50 text-slate-950 font-bold text-xs transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)] cursor-pointer active:scale-95 flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRequesting ? 'animate-spin' : ''}`} />
            <span>{isRequesting ? 'Connecting...' : 'Allow Camera Access'}</span>
          </button>

          <button
            onClick={() => setUseObsidianFallback(true)}
            className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white font-medium text-xs transition-all border border-slate-700/60 cursor-pointer active:scale-95"
          >
            Obsidian Fallback
          </button>
        </div>

        <div className="flex items-center gap-1 text-[9px] text-slate-500 font-mono pt-0.5">
          <ShieldCheck className="w-3 h-3 text-emerald-400/70" />
          <span>100% Private • Live Reflection Only • Zero Recording</span>
        </div>
      </div>
    );
  }

  // 3. Live Streaming Video Mirror
  return (
    <div className="relative w-[340px] h-[340px] sm:w-[500px] sm:h-[500px] md:w-[600px] md:h-[600px] rounded-full overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] [mask-image:radial-gradient(circle_at_center,black_50%,transparent_100%)] border border-cyan-500/20 flex items-center justify-center select-none">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover grayscale contrast-125 brightness-75 opacity-80 -scale-x-100"
        style={{ transform: 'scaleX(-1)' }}
      />
      {/* Dark vignette overlay */}
      <div className="absolute inset-0 bg-black/20 pointer-events-none rounded-full" />
    </div>
  );
}

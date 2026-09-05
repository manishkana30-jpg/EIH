'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { CameraOff, RefreshCw } from 'lucide-react';

export default function PratibimbCamera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

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

    try {
      let stream: MediaStream | null = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
        });
      } catch (tier1Err) {
        console.warn('FacingMode user constraint note, falling back to generic video:', tier1Err);
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
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
    } catch (err) {
      console.error('Camera access denied or error:', err);
      setIsRequesting(false);
      setError(true);
    }
  }, []);

  useEffect(() => {
    setupCamera();

    // Listen for browser permissions changes dynamically (e.g. user toggles Allow in address bar)
    let permStatus: PermissionStatus | null = null;
    if (typeof navigator !== 'undefined' && navigator.permissions?.query) {
      navigator.permissions
        .query({ name: 'camera' as any })
        .then((status) => {
          permStatus = status;
          const handleChange = () => {
            if (status.state === 'granted') {
              setupCamera();
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

  if (error) {
    return (
      <div className="w-[340px] h-[340px] sm:w-[500px] sm:h-[500px] rounded-full bg-gradient-to-b from-slate-800 to-slate-950 flex flex-col items-center justify-center text-slate-400 border border-slate-800 shadow-2xl p-6 text-center select-none space-y-3">
        <CameraOff className="w-8 h-8 opacity-60 text-slate-400" />
        <p className="text-xs text-slate-300 max-w-[240px]">
          Camera permission required for Pratibimb Mirror.
        </p>
        <button
          onClick={setupCamera}
          className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)] cursor-pointer active:scale-95 flex items-center gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRequesting ? 'animate-spin' : ''}`} />
          <span>Allow Camera Access</span>
        </button>
        <span className="text-[10px] text-slate-500 font-mono">
          100% Private • Live Reflection Only • Zero Recording
        </span>
      </div>
    );
  }

  return (
    <div className="relative w-[340px] h-[340px] sm:w-[500px] sm:h-[500px] md:w-[600px] md:h-[600px] rounded-full overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] [mask-image:radial-gradient(circle_at_center,black_50%,transparent_100%)] border border-white/5 flex items-center justify-center select-none">
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

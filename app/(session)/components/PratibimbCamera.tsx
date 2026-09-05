'use client';

import React, { useEffect, useRef, useState } from 'react';
import { CameraOff } from 'lucide-react';

export default function PratibimbCamera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let activeStream: MediaStream | null = null;
    let isCancelled = false;

    async function setupCamera() {
      try {
        // Multi-tier constraint acquisition: Try facingMode user first, fallback to generic video
        let stream: MediaStream | null = null;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user' },
          });
        } catch (tier1Err) {
          console.warn('FacingMode user constraint note, falling back to generic video:', tier1Err);
          stream = await navigator.mediaDevices.getUserMedia({ video: true });
        }

        if (isCancelled) {
          if (stream) stream.getTracks().forEach((track) => track.stop());
          return;
        }

        activeStream = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().catch((err) => console.warn('Video play notice:', err));
          };
          videoRef.current.play().catch((err) => console.warn('Video immediate play notice:', err));
        }
      } catch (err) {
        console.error('Camera access denied:', err);
        if (!isCancelled) {
          setError(true);
        }
      }
    }

    setupCamera();

    return () => {
      // CRITICAL CLEANUP: Stop the camera when Trataka ends or component unmounts
      isCancelled = true;
      if (activeStream) {
        activeStream.getTracks().forEach((track) => {
          try {
            track.stop();
          } catch (err) {
            console.warn('Error stopping camera track:', err);
          }
        });
        activeStream = null;
      }
    };
  }, []);

  if (error) {
    return (
      <div className="w-[340px] h-[340px] sm:w-[500px] sm:h-[500px] rounded-full bg-gradient-to-b from-slate-800 to-slate-950 flex flex-col items-center justify-center text-slate-500 border border-slate-800 shadow-2xl p-6 text-center select-none">
        <CameraOff className="w-8 h-8 mb-4 opacity-50 text-slate-400" />
        <p className="text-xs text-slate-400">Camera permission required for Pratibimb Mirror.</p>
        <span className="text-[10px] text-slate-600 mt-2 font-mono">
          Reflective obsidian mirror active as fallback
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

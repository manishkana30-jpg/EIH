"use client";

import React, { useEffect, useRef, useState } from "react";

interface AudioWaveformProps {
  stream: MediaStream | null;
  isRecording: boolean;
  isPlayingAudio: boolean;
  isEchoLocked?: boolean;
}

export const AudioWaveform: React.FC<AudioWaveformProps> = ({
  stream,
  isRecording,
  isPlayingAudio,
  isEchoLocked = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [volumeLevel, setVolumeLevel] = useState<number>(0);
  const [isVoiceActive, setIsVoiceActive] = useState<boolean>(false);

  useEffect(() => {
    if (!isRecording || !stream) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        try {
          audioContextRef.current.close();
        } catch (_) {}
      }
      audioContextRef.current = null;
      analyserRef.current = null;
      sourceRef.current = null;
      setVolumeLevel(0);
      setIsVoiceActive(false);
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      sourceRef.current = source;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      const timeDomainArray = new Uint8Array(bufferLength);

      const renderWaveform = () => {
        if (!canvasRef.current || !analyserRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        analyserRef.current.getByteFrequencyData(dataArray);
        analyserRef.current.getByteTimeDomainData(timeDomainArray);

        // Calculate RMS Volume
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          const val = (timeDomainArray[i] - 128) / 128;
          sum += val * val;
        }
        const rms = Math.sqrt(sum / bufferLength);
        const normalizedVol = Math.min(Math.round(rms * 150), 100);
        setVolumeLevel(normalizedVol);
        setIsVoiceActive(normalizedVol > 12);

        const width = canvas.width;
        const height = canvas.height;

        ctx.clearRect(0, 0, width, height);

        // Background subtle glow
        const bgGrad = ctx.createLinearGradient(0, 0, width, 0);
        bgGrad.addColorStop(0, "rgba(20, 32, 26, 0.4)");
        bgGrad.addColorStop(0.5, "rgba(27, 42, 35, 0.7)");
        bgGrad.addColorStop(1, "rgba(20, 32, 26, 0.4)");
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);

        // Draw dynamic audio waveform
        ctx.lineWidth = 2.5;
        const strokeGrad = ctx.createLinearGradient(0, 0, width, 0);
        if (normalizedVol > 12) {
          strokeGrad.addColorStop(0, "#4ade80");
          strokeGrad.addColorStop(0.5, "#81a890");
          strokeGrad.addColorStop(1, "#38bdf8");
        } else {
          strokeGrad.addColorStop(0, "#3d584a");
          strokeGrad.addColorStop(0.5, "#647d70");
          strokeGrad.addColorStop(1, "#3d584a");
        }
        ctx.strokeStyle = strokeGrad;
        ctx.beginPath();

        const sliceWidth = width / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = timeDomainArray[i] / 128.0;
          const y = (v * height) / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          x += sliceWidth;
        }

        ctx.lineTo(width, height / 2);
        ctx.stroke();

        // Draw frequency spectrum bars at the base
        const barCount = 32;
        const barWidth = (width / barCount) - 2;
        const step = Math.floor(bufferLength / barCount);

        for (let i = 0; i < barCount; i++) {
          const barHeight = (dataArray[i * step] / 255) * (height / 2.2);
          const barX = i * (barWidth + 2);
          const barY = height - barHeight;

          const barGrad = ctx.createLinearGradient(0, height, 0, 0);
          barGrad.addColorStop(0, "rgba(88, 142, 115, 0.3)");
          barGrad.addColorStop(1, normalizedVol > 12 ? "rgba(129, 168, 144, 0.85)" : "rgba(100, 125, 112, 0.4)");

          ctx.fillStyle = barGrad;
          ctx.beginPath();
          ctx.roundRect(barX, barY, barWidth, barHeight, [2, 2, 0, 0]);
          ctx.fill();
        }

        animationFrameRef.current = requestAnimationFrame(renderWaveform);
      };

      renderWaveform();
    } catch (err) {
      console.warn("Waveform AudioContext initialization notice:", err);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        try {
          audioContextRef.current.close();
        } catch (_) {}
      }
    };
  }, [isRecording, stream]);

  if (!isRecording && !isPlayingAudio && !isEchoLocked) {
    return null;
  }

  return (
    <div className="w-full bg-[#14201a]/95 border border-[#283c32] rounded-xl p-2.5 shadow-lg backdrop-blur-md transition-all animate-fadeIn">
      <div className="flex items-center justify-between gap-2 mb-1.5 px-1 text-xs">
        <div className="flex items-center gap-2">
          {isPlayingAudio ? (
            <>
              <span className="w-2 h-2 rounded-full bg-[#38bdf8] animate-pulse" />
              <span className="text-[#38bdf8] font-medium">Assistant Speaking • Mic Detached</span>
            </>
          ) : isEchoLocked ? (
            <>
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span className="text-amber-300 font-medium">VAD Echo Grace Period (200ms)...</span>
            </>
          ) : isRecording ? (
            <>
              <span className={`w-2 h-2 rounded-full ${isVoiceActive ? "bg-emerald-400 animate-ping" : "bg-[#81a890]"}`} />
              <span className="text-[#9cb5a6] font-medium">
                {isVoiceActive ? "Voice Active (Speech Captured)" : "Listening • Studio Noise Suppressed"}
              </span>
            </>
          ) : null}
        </div>

        {isRecording && (
          <div className="flex items-center gap-2 font-mono text-[11px] text-[#647d70]">
            <span>Signal: {volumeLevel}%</span>
            <span className="px-1.5 py-0.5 rounded bg-[#1b2a23] border border-[#283c32] text-[#81a890]">
              48kHz 16-bit
            </span>
          </div>
        )}
      </div>

      {isRecording && (
        <canvas
          ref={canvasRef}
          width={640}
          height={48}
          className="w-full h-12 rounded-lg bg-[#0c1410] border border-[#22382c]"
        />
      )}
    </div>
  );
};

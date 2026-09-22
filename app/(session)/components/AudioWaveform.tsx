"use client";

import React, { useEffect, useRef } from "react";

interface AudioWaveformProps {
  stream: MediaStream | null;
  isRecording: boolean;
  isPlayingAudio: boolean;
  isEchoLocked?: boolean;
}

/**
 * Ambient Background Audio Visualizer
 * Renders in the background with zero layout impact (0px shift, zero jitter).
 * Smoothly visualizes microphone acoustics and assistant voice synthesis.
 */
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
      return;
    }

    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.82;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      sourceRef.current = source;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      const timeDomainArray = new Uint8Array(bufferLength);

      let phase = 0;

      const renderWaveform = () => {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const width = canvas.width;
        const height = canvas.height;

        ctx.clearRect(0, 0, width, height);

        if (analyserRef.current) {
          analyserRef.current.getByteFrequencyData(dataArray);
          analyserRef.current.getByteTimeDomainData(timeDomainArray);
        }

        // Calculate RMS Volume
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          const val = (timeDomainArray[i] - 128) / 128;
          sum += val * val;
        }
        const rms = Math.sqrt(sum / bufferLength);
        const intensity = Math.min(rms * 2.2, 1.0);

        phase += 0.04;

        // Ambient flowing gradient background glow
        const glowGrad = ctx.createRadialGradient(
          width / 2,
          height,
          10,
          width / 2,
          height,
          width * 0.45
        );

        if (isPlayingAudio) {
          glowGrad.addColorStop(0, "rgba(56, 189, 248, 0.12)");
          glowGrad.addColorStop(0.6, "rgba(14, 116, 144, 0.04)");
          glowGrad.addColorStop(1, "transparent");
        } else if (isEchoLocked) {
          glowGrad.addColorStop(0, "rgba(245, 158, 11, 0.09)");
          glowGrad.addColorStop(0.6, "rgba(180, 83, 9, 0.03)");
          glowGrad.addColorStop(1, "transparent");
        } else {
          glowGrad.addColorStop(0, `rgba(16, 185, 129, ${0.06 + intensity * 0.14})`);
          glowGrad.addColorStop(0.6, "rgba(13, 148, 136, 0.03)");
          glowGrad.addColorStop(1, "transparent");
        }

        ctx.fillStyle = glowGrad;
        ctx.fillRect(0, 0, width, height);

        // Harmonic multi-layer ambient waveform lines
        const layers = [
          { freq: 0.015, amp: height * (0.15 + intensity * 0.35), color: "rgba(16, 185, 129, 0.4)", width: 2 },
          { freq: 0.022, amp: height * (0.12 + intensity * 0.28), color: "rgba(45, 212, 191, 0.3)", width: 1.5 },
          { freq: 0.008, amp: height * (0.08 + intensity * 0.2), color: "rgba(56, 189, 248, 0.2)", width: 1 },
        ];

        for (const layer of layers) {
          ctx.beginPath();
          ctx.lineWidth = layer.width;
          ctx.strokeStyle = layer.color;

          const sliceWidth = width / bufferLength;
          let x = 0;

          for (let i = 0; i < bufferLength; i++) {
            const audioVal = (timeDomainArray[i] - 128) / 128.0;
            const sine = Math.sin(x * layer.freq + phase) * layer.amp;
            const y = height * 0.65 + sine + audioVal * (height * 0.3);

            if (i === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
            x += sliceWidth;
          }

          ctx.stroke();
        }

        animationFrameRef.current = requestAnimationFrame(renderWaveform);
      };

      renderWaveform();
    } catch (err) {
      console.warn("Ambient Waveform AudioContext initialization note:", err);
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
  }, [isRecording, stream, isPlayingAudio, isEchoLocked]);

  if (!isRecording && !isPlayingAudio && !isEchoLocked) {
    return null;
  }

  return (
    <div
      className="pointer-events-none absolute inset-x-0 bottom-0 h-36 md:h-52 overflow-hidden select-none -z-10 transition-opacity duration-700 opacity-70"
      aria-hidden="true"
    >
      <canvas
        ref={canvasRef}
        width={1280}
        height={160}
        className="w-full h-full object-cover"
      />
    </div>
  );
};

export default AudioWaveform;

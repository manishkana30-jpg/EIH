'use client';

import React, { useEffect, useRef } from 'react';

interface BiomorphicAuraMeshProps {
  audioLevel?: number;
  isAiSpeaking?: boolean;
  isUserSpeaking?: boolean;
  dominantEmotion?: string;
  hasMessages?: boolean;
  onHeroClick?: () => void;
}

export const BiomorphicAuraMesh: React.FC<BiomorphicAuraMeshProps> = ({
  audioLevel = 0,
  isAiSpeaking = false,
  isUserSpeaking = false,
  dominantEmotion = 'Calmness',
  hasMessages = false,
  onHeroClick,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Topological Wireframe Wave Mesh Animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let time = 0;

    const resize = () => {
      canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const render = () => {
      time += 0.015;
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      // Dynamic reactive parameters
      const reactivity = Math.max(0.2, audioLevel * 2.5);
      const linesCount = hasMessages ? 14 : 22;
      const stepY = (height * 0.7) / linesCount;
      const startY = height * 0.15;

      ctx.lineWidth = 1;

      for (let i = 0; i < linesCount; i++) {
        const y = startY + i * stepY;
        const progress = i / linesCount;
        const lineAlpha = Math.sin(progress * Math.PI) * (hasMessages ? 0.12 : 0.22);

        ctx.strokeStyle = `rgba(180, 210, 200, ${lineAlpha})`;
        ctx.beginPath();

        const segments = 60;
        const stepX = width / segments;

        for (let j = 0; j <= segments; j++) {
          const x = j * stepX;
          // Center distance damping
          const distFromCenter = Math.abs(x - width / 2) / (width / 2);
          const centerFactor = Math.max(0, 1 - distFromCenter * 1.2);

          // Undulating wave harmonics
          const wave1 = Math.sin(x * 0.006 + time + i * 0.3) * 18 * reactivity;
          const wave2 = Math.cos(x * 0.012 - time * 0.8 + i * 0.2) * 10 * reactivity;
          const mound = centerFactor * Math.sin(time * 0.5 + i * 0.15) * 45 * reactivity;

          const pointY = y + (wave1 + wave2 - mound) * centerFactor;

          if (j === 0) {
            ctx.moveTo(x, pointY);
          } else {
            ctx.lineTo(x, pointY);
          }
        }

        ctx.stroke();
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [audioLevel, hasMessages]);

  const scale = hasMessages ? 0.55 : 1;
  const pulseScale = 1 + (audioLevel > 0.05 ? audioLevel * 0.35 : isAiSpeaking ? 0.08 : 0);

  return (
    <div
      onClick={onHeroClick}
      className={`relative w-full flex flex-col items-center justify-center transition-all duration-1000 ${
        hasMessages ? 'h-[140px] sm:h-[170px] -mt-2 -mb-4' : 'h-[360px] sm:h-[480px] my-auto'
      }`}
    >
      {/* Background Topological Wireframe Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none -z-10 opacity-70 transition-opacity duration-1000"
      />

      {/* Ambient Gradient Radiant Orbs */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] sm:w-[500px] h-[340px] sm:h-[500px] rounded-full pointer-events-none -z-10 opacity-35 blur-[120px] transition-all duration-1000"
        style={{
          background: isAiSpeaking
            ? 'radial-gradient(circle, #00f59b 0%, #00d4ff 40%, #ff9e42 80%, transparent 100%)'
            : 'radial-gradient(circle, #00f59b 0%, #00a884 45%, #ff9e42 85%, transparent 100%)',
          transform: `translate(-50%, -50%) scale(${pulseScale * 1.1})`,
        }}
      />

      {/* Central 3D Biomorphic Winged Organism Sculpture */}
      <div
        className="relative z-10 transition-transform duration-700 ease-out biomorphic-shadow cursor-pointer select-none"
        style={{
          transform: `scale(${scale * pulseScale})`,
        }}
      >
        <svg
          viewBox="0 0 540 380"
          className="w-[280px] sm:w-[420px] md:w-[480px] h-auto transition-all duration-700"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Top Wings Spectral Emerald & Cyan Gradient */}
            <linearGradient id="wingsGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00f59b" stopOpacity="0.95" />
              <stop offset="35%" stopColor="#00d4ff" stopOpacity="0.90" />
              <stop offset="70%" stopColor="#588e73" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#0d3b2e" stopOpacity="0.9" />
            </linearGradient>

            {/* Central Body Iridescent Chrome/Silver Gradient */}
            <linearGradient id="bodyGrad" x1="20%" y1="0%" x2="80%" y2="100%">
              <stop offset="0%" stopColor="#d8e8e0" />
              <stop offset="25%" stopColor="#638075" />
              <stop offset="55%" stopColor="#2a3f36" />
              <stop offset="85%" stopColor="#81a890" />
              <stop offset="100%" stopColor="#e8f3ee" />
            </linearGradient>

            {/* Bottom Tail Warm Sunset/Amber Gradient */}
            <linearGradient id="tailGrad" x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="#00f59b" />
              <stop offset="30%" stopColor="#a3e635" />
              <stop offset="65%" stopColor="#ff9e42" />
              <stop offset="100%" stopColor="#f43f5e" />
            </linearGradient>

            {/* Specular Glow Highlight */}
            <linearGradient id="specularHighlight" x1="30%" y1="10%" x2="70%" y2="80%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.75" />
              <stop offset="40%" stopColor="#ffffff" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.5" />
            </linearGradient>

            {/* Soft Ambient Shadow Filter */}
            <filter id="auraGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="16" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Glowing Aura Silhouette */}
          <path
            d="M270 30 C340 70, 480 120, 520 200 C470 230, 360 210, 270 260 C180 210, 70 230, 20 200 C60 120, 200 70, 270 30 Z"
            fill="url(#wingsGrad)"
            opacity="0.35"
            filter="url(#auraGlow)"
          />

          {/* Left Wing Sculpt */}
          <path
            d="M270 90 C210 85, 120 105, 40 180 C80 215, 170 205, 250 220 C265 180, 268 130, 270 90 Z"
            fill="url(#wingsGrad)"
            className="transition-all duration-700"
          />

          {/* Right Wing Sculpt */}
          <path
            d="M270 90 C330 85, 420 105, 500 180 C460 215, 370 205, 290 220 C275 180, 272 130, 270 90 Z"
            fill="url(#wingsGrad)"
            className="transition-all duration-700"
          />

          {/* Specular Ridge Across Wings */}
          <path
            d="M50 182 C140 125, 230 100, 270 95 C310 100, 400 125, 490 182 C440 170, 340 145, 270 140 C200 145, 100 170, 50 182 Z"
            fill="url(#specularHighlight)"
            opacity="0.45"
          />

          {/* Central Torso / Spine */}
          <path
            d="M270 45 C295 90, 305 160, 295 240 C285 290, 280 340, 270 360 C260 340, 255 290, 245 240 C235 160, 245 90, 270 45 Z"
            fill="url(#bodyGrad)"
          />

          {/* Warm Luminescent Bulb / Tail Tip */}
          <path
            d="M270 230 C295 245, 310 280, 295 330 C285 360, 255 360, 245 330 C230 280, 245 245, 270 230 Z"
            fill="url(#tailGrad)"
          />

          {/* Core Crest Highlight Ring */}
          <ellipse
            cx="270"
            cy="110"
            rx="18"
            ry="30"
            fill="url(#specularHighlight)"
            opacity="0.8"
          />
        </svg>
      </div>

      {/* Centered Hero Headline (Visible in Empty State) */}
      {!hasMessages && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-4 z-20">
          <h1
            className="text-3xl sm:text-5xl md:text-6xl font-sans font-medium tracking-tight text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.85)] max-w-2xl leading-[1.12]"
            style={{
              letterSpacing: '-0.035em',
            }}
          >
            We focus on quality
          </h1>
          <p className="text-xs sm:text-sm text-[#9cb5a6]/80 mt-3 max-w-md font-light tracking-wide drop-shadow-md">
            Grounded in clinical neuroscience &amp; empathetic therapeutic care.
          </p>
        </div>
      )}
    </div>
  );
};

export default BiomorphicAuraMesh;

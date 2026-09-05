'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface BreathingVisualizerOrbProps {
  isRecording?: boolean;
  isPlayingAudio?: boolean;
  isAiSpeaking?: boolean;
  hasMessages?: boolean;
  dominantEmotion?: string;
  onOrbClick?: () => void;
}

export const BreathingVisualizerOrb: React.FC<BreathingVisualizerOrbProps> = ({
  isRecording = false,
  isPlayingAudio = false,
  isAiSpeaking = false,
  hasMessages = false,
  dominantEmotion = 'Calmness',
  onOrbClick,
}) => {
  const isSpeaking = isPlayingAudio || isAiSpeaking;

  // Compact floating version when messages exist
  if (hasMessages) {
    return (
      <div
        onClick={onOrbClick}
        className="w-full flex items-center justify-center py-2 cursor-pointer select-none transition-all duration-700"
      >
        <div className="relative flex items-center justify-center">
          {/* Ambient Glow */}
          <motion.div
            animate={{
              scale: isSpeaking ? [1, 1.4, 1] : isRecording ? [1, 1.25, 1] : [1, 1.1, 1],
              opacity: isSpeaking ? [0.4, 0.75, 0.4] : isRecording ? [0.3, 0.6, 0.3] : [0.2, 0.35, 0.2],
            }}
            transition={{
              duration: isSpeaking ? 1.8 : isRecording ? 2.4 : 4.0,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className={`absolute w-20 h-20 rounded-full blur-xl pointer-events-none ${
              isSpeaking
                ? 'bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-500'
                : isRecording
                ? 'bg-gradient-to-r from-emerald-500 via-amber-400 to-rose-400'
                : 'bg-gradient-to-r from-emerald-500/60 to-teal-600/60'
            }`}
          />

          {/* Concentric Breathing Rings */}
          <motion.div
            animate={{
              scale: isSpeaking ? [1, 1.2, 1] : [1, 1.06, 1],
              rotate: [0, 180, 360],
            }}
            transition={{
              scale: { duration: isSpeaking ? 2 : 4, repeat: Infinity, ease: 'easeInOut' },
              rotate: { duration: 20, repeat: Infinity, ease: 'linear' },
            }}
            className="w-10 h-10 rounded-full border border-emerald-500/30 flex items-center justify-center"
          >
            <motion.div
              animate={{
                scale: isSpeaking ? [0.9, 1.15, 0.9] : [0.95, 1.05, 0.95],
              }}
              transition={{
                duration: isSpeaking ? 1.5 : 3.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="w-6 h-6 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-300 shadow-[0_0_15px_rgba(16,185,129,0.5)] flex items-center justify-center text-[10px]"
            >
              🌿
            </motion.div>
          </motion.div>

          <span className="ml-3 text-xs font-medium text-slate-400 tracking-wide font-sans hidden sm:inline">
            {isSpeaking
              ? 'Synthesizing voice...'
              : isRecording
              ? 'Listening...'
              : `${dominantEmotion} • Center Stage`}
          </span>
        </div>
      </div>
    );
  }

  // Grand Center Stage Breathing Orb (Empty State)
  return (
    <div
      onClick={onOrbClick}
      className="relative w-full flex flex-col items-center justify-center py-10 sm:py-16 my-auto select-none cursor-pointer"
    >
      {/* Outer Atmospheric Aura Blur */}
      <motion.div
        animate={{
          scale: isSpeaking ? [1, 1.3, 1] : isRecording ? [1, 1.2, 1] : [1, 1.15, 1],
          opacity: isSpeaking ? [0.35, 0.6, 0.35] : isRecording ? [0.3, 0.5, 0.3] : [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: isSpeaking ? 2.2 : isRecording ? 2.8 : 4.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className={`absolute w-72 sm:w-96 h-72 sm:h-96 rounded-full blur-[90px] pointer-events-none ${
          isSpeaking
            ? 'bg-gradient-to-tr from-emerald-400 via-teal-300 to-cyan-500'
            : isRecording
            ? 'bg-gradient-to-tr from-emerald-500 via-amber-400 to-rose-400'
            : 'bg-gradient-to-tr from-emerald-600/50 via-teal-500/40 to-slate-800/60'
        }`}
      />

      {/* Ripple Rings */}
      <motion.div
        animate={{
          scale: [0.95, 1.12, 0.95],
          opacity: [0.3, 0.7, 0.3],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute w-56 sm:w-72 h-56 sm:h-72 rounded-full border border-emerald-500/20"
      />

      <motion.div
        animate={{
          scale: [1.1, 0.95, 1.1],
          opacity: [0.2, 0.5, 0.2],
        }}
        transition={{
          duration: 4.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute w-44 sm:w-56 h-44 sm:h-56 rounded-full border border-teal-400/30"
      />

      {/* Central Radiant Spherical Core */}
      <motion.div
        animate={{
          scale: isSpeaking ? [1, 1.12, 1] : isRecording ? [1, 1.08, 1] : [1, 1.05, 1],
          boxShadow: isSpeaking
            ? [
                '0 0 30px rgba(16,185,129,0.4)',
                '0 0 60px rgba(20,184,166,0.7)',
                '0 0 30px rgba(16,185,129,0.4)',
              ]
            : [
                '0 0 20px rgba(16,185,129,0.2)',
                '0 0 40px rgba(16,185,129,0.45)',
                '0 0 20px rgba(16,185,129,0.2)',
              ],
        }}
        transition={{
          duration: isSpeaking ? 1.8 : 3.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="relative z-10 w-28 sm:w-36 h-28 sm:h-36 rounded-full bg-gradient-to-tr from-emerald-600 via-teal-500 to-emerald-300 border border-emerald-300/40 flex items-center justify-center text-4xl sm:text-5xl backdrop-blur-md"
      >
        <motion.div
          animate={{
            rotate: [0, 360],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="absolute inset-1 rounded-full border-t border-r border-white/40 pointer-events-none"
        />
        🌿
      </motion.div>

      {/* Hero Headline & Instructions */}
      <div className="relative z-10 text-center mt-8 px-4 max-w-lg space-y-2">
        <h1 className="text-2xl sm:text-3xl font-heading font-bold text-slate-100 tracking-tight">
          Clinical Sanctuary Center Stage
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 font-light leading-relaxed">
          Synthesizing modern neuroscience, CBT protocols, and Ayurvedic grounding. Speak freely using
          the floating mic or type below.
        </p>
      </div>
    </div>
  );
};

export default BreathingVisualizerOrb;

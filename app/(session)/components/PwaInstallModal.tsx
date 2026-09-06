'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Download,
  Check,
  Smartphone,
  Monitor,
  Apple,
  ShieldCheck,
  Zap,
  Sparkles,
} from 'lucide-react';

export interface PwaInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt: any;
  isInstalled: boolean;
  onInstallSuccess?: () => void;
}

export function PwaInstallModal({
  isOpen,
  onClose,
  deferredPrompt,
  isInstalled,
  onInstallSuccess,
}: PwaInstallModalProps) {
  const [activePlatform, setActivePlatform] = useState<'desktop' | 'ios' | 'android'>('desktop');
  const [installing, setInstalling] = useState(false);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    setInstalling(true);
    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        onInstallSuccess?.();
        onClose();
      }
    } catch (err) {
      console.warn('PWA prompt error:', err);
    } finally {
      setInstalling(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 select-none">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="relative w-full max-w-lg rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 border border-emerald-500/30 shadow-[0_0_50px_rgba(16,185,129,0.15)] overflow-hidden z-10"
        >
          {/* Decorative Glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="relative flex items-center justify-between p-5 border-b border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 border border-emerald-400/40 flex items-center justify-center text-xl shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                🌿
              </div>
              <div>
                <h3 className="font-heading font-bold text-base text-slate-100 flex items-center gap-2">
                  <span>Install EIH Sanctuary</span>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                    PWA 2.0
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Native standalone application for desktop &amp; mobile
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 space-y-4">
            {/* Status Notification */}
            {isInstalled ? (
              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
                  <Check className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-xs">
                  <p className="font-semibold text-emerald-200">Already Installed</p>
                  <p className="text-emerald-400/80 text-[11px]">
                    EIH is running as a native standalone app on this device.
                  </p>
                </div>
              </div>
            ) : deferredPrompt ? (
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/50 to-teal-950/50 border border-emerald-500/50">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-emerald-400 animate-pulse" />
                  <div className="text-xs">
                    <p className="font-bold text-slate-100">Ready for 1-Click Install</p>
                    <p className="text-slate-400 text-[11px]">
                      Install directly into your operating system.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleInstallClick}
                  disabled={installing}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs shadow-[0_0_15px_rgba(16,185,129,0.4)] transition-all flex items-center gap-1.5 active:scale-95"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{installing ? 'Installing...' : 'Install Now'}</span>
                </button>
              </div>
            ) : null}

            {/* Feature Highlights */}
            <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                <Zap className="w-4 h-4 text-amber-400 mx-auto" />
                <p className="font-semibold text-slate-200">Offline Cache</p>
                <p className="text-[10px] text-slate-400">Zero-lag service worker</p>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                <ShieldCheck className="w-4 h-4 text-emerald-400 mx-auto" />
                <p className="font-semibold text-slate-200">100% Private</p>
                <p className="text-[10px] text-slate-400">Encrypted standalone</p>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                <Monitor className="w-4 h-4 text-cyan-400 mx-auto" />
                <p className="font-semibold text-slate-200">Distraction-Free</p>
                <p className="text-[10px] text-slate-400">No URL bar clutter</p>
              </div>
            </div>

            {/* Platform Selection Tabs */}
            <div className="space-y-2">
              <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
                <button
                  onClick={() => setActivePlatform('desktop')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg font-medium transition-all ${
                    activePlatform === 'desktop'
                      ? 'bg-slate-800 text-emerald-300 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>Desktop (PC/Mac)</span>
                </button>
                <button
                  onClick={() => setActivePlatform('ios')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg font-medium transition-all ${
                    activePlatform === 'ios'
                      ? 'bg-slate-800 text-emerald-300 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Apple className="w-3.5 h-3.5" />
                  <span>iPhone / iPad</span>
                </button>
                <button
                  onClick={() => setActivePlatform('android')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg font-medium transition-all ${
                    activePlatform === 'android'
                      ? 'bg-slate-800 text-emerald-300 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Android</span>
                </button>
              </div>

              {/* Platform Instructions */}
              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-300 space-y-2">
                {activePlatform === 'desktop' && (
                  <div className="space-y-1.5">
                    <p className="font-semibold text-slate-200 flex items-center gap-1.5">
                      <Monitor className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Chrome / Edge / Brave Instructions:</span>
                    </p>
                    <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-400 leading-relaxed">
                      <li>
                        Look at the right side of the address bar for the{' '}
                        <strong className="text-slate-200">Install icon (⊞)</strong>.
                      </li>
                      <li>
                        Or click the three dots menu <strong className="text-slate-200">⋮</strong>{' '}
                        ➔ <strong className="text-slate-200">&quot;Install EIH Sanctuary&quot;</strong>.
                      </li>
                      <li>Click &quot;Install&quot; to launch in its own standalone app window.</li>
                    </ol>
                  </div>
                )}

                {activePlatform === 'ios' && (
                  <div className="space-y-1.5">
                    <p className="font-semibold text-slate-200 flex items-center gap-1.5">
                      <Apple className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Safari iOS Instructions:</span>
                    </p>
                    <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-400 leading-relaxed">
                      <li>
                        Tap the <strong className="text-slate-200">Share button</strong> (square with an upward arrow) in the Safari navigation bar.
                      </li>
                      <li>
                        Scroll down the menu and tap{' '}
                        <strong className="text-slate-200">&quot;Add to Home Screen&quot;</strong>.
                      </li>
                      <li>
                        Tap <strong className="text-slate-200">&quot;Add&quot;</strong> in the top right corner.
                      </li>
                    </ol>
                  </div>
                )}

                {activePlatform === 'android' && (
                  <div className="space-y-1.5">
                    <p className="font-semibold text-slate-200 flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Chrome Android Instructions:</span>
                    </p>
                    <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-400 leading-relaxed">
                      <li>
                        Tap the three dots menu <strong className="text-slate-200">⋮</strong> in the top right corner.
                      </li>
                      <li>
                        Tap <strong className="text-slate-200">&quot;Install app&quot;</strong> or <strong className="text-slate-200">&quot;Add to Home screen&quot;</strong>.
                      </li>
                      <li>Follow the on-screen prompt to complete installation.</li>
                    </ol>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 flex items-center justify-between text-[11px] text-slate-400">
            <span className="font-mono">PWA Offline Mode • Manifest v2</span>
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default PwaInstallModal;

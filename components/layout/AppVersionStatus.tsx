'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  RefreshCw,
  CheckCircle2,
  X,
  Server,
  Cpu,
  Clock,
  ArrowUpCircle,
} from 'lucide-react';
import { updateManager, type UpdateState } from '@/lib/pwa/update-manager';

export function AppVersionStatus() {
  const [state, setState] = useState<UpdateState>(updateManager.getState());
  const [isOpen, setIsOpen] = useState(false);
  const [manualCheckFeedback, setManualCheckFeedback] = useState<string | null>(null);

  useEffect(() => {
    updateManager.initListeners();
    const unsubscribe = updateManager.subscribe((newState) => {
      setState(newState);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const handleManualCheck = async () => {
    setManualCheckFeedback(null);
    const updated = await updateManager.checkForUpdates(true);
    if (updated.updateAvailable) {
      setManualCheckFeedback('🚀 New update detected! Ready to apply.');
    } else {
      setManualCheckFeedback('✅ Webapp is 100% up to date with latest deployment.');
      setTimeout(() => setManualCheckFeedback(null), 4000);
    }
  };

  const handleApplyUpdate = async () => {
    await updateManager.performFullAppUpdate();
  };

  const formatLastChecked = (timestamp: number | null): string => {
    if (!timestamp) return 'Just now';
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 30) return 'Just now';
    if (seconds < 60) return `${seconds}s ago`;
    const mins = Math.floor(seconds / 60);
    return `${mins}m ago`;
  };

  return (
    <>
      {/* Header Pill Button */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(true)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono transition-all duration-300 border ${
            state.updateAvailable
              ? 'bg-gradient-to-r from-amber-500/20 via-teal-500/20 to-emerald-500/20 border-amber-400/60 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.25)] animate-pulse'
              : 'bg-zinc-900/90 hover:bg-zinc-800 border-zinc-800 hover:border-zinc-700 text-zinc-300'
          }`}
          title="Click to view app version & deployment status"
          aria-label="App Version & Update Status"
        >
          {state.isChecking ? (
            <RefreshCw className="w-3 h-3 text-amber-400 animate-spin" />
          ) : state.updateAvailable ? (
            <Sparkles className="w-3 h-3 text-amber-400 animate-bounce" />
          ) : (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          )}

          <span className="font-semibold">{state.currentVersion}</span>

          {state.updateAvailable ? (
            <span className="hidden sm:inline font-bold text-amber-300 ml-0.5">
              • Update Available
            </span>
          ) : (
            <span className="hidden lg:inline text-zinc-500 ml-0.5">
              • Up to date
            </span>
          )}
        </button>
      </div>

      {/* Interactive Deployment & Update Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/75 backdrop-blur-md"
            />

            {/* Modal Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="relative w-full max-w-md bg-gradient-to-b from-zinc-900/95 via-zinc-950/98 to-black border border-zinc-800/80 rounded-2xl shadow-2xl p-5 text-zinc-200 z-10 overflow-hidden"
            >
              {/* Top ambient glow */}
              <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-32 bg-amber-500/10 blur-3xl pointer-events-none rounded-full" />

              {/* Close Button */}
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-100 p-1 rounded-lg hover:bg-zinc-800 transition-colors"
                aria-label="Close version modal"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Header Title */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 via-emerald-500/20 to-teal-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-base font-serif font-bold text-zinc-100">
                    Deployment & System Updates
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Real-time PWA versioning & autonomous engine sync
                  </p>
                </div>
              </div>

              {/* Update Alert Banner (if update available) */}
              {state.updateAvailable && (
                <div className="mb-4 p-3.5 rounded-xl bg-gradient-to-r from-amber-950/40 via-teal-950/40 to-emerald-950/40 border border-amber-500/40 flex items-start gap-3">
                  <ArrowUpCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-semibold text-amber-200">
                      New Version Available: {state.serverVersion || 'Latest'}
                    </h4>
                    <p className="text-[11px] text-zinc-300 mt-0.5 leading-relaxed">
                      A fresh deployment has been released to Vercel. Apply now to get the latest clinical neural voices, word highlighter synchronization, and performance updates.
                    </p>
                  </div>
                </div>
              )}

              {/* Diagnostics Grid */}
              <div className="space-y-2.5 mb-5 bg-zinc-950/70 border border-zinc-800/60 rounded-xl p-3.5 text-xs font-mono">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800/60">
                  <span className="flex items-center gap-1.5 text-zinc-400">
                    <Server className="w-3.5 h-3.5 text-zinc-500" /> Active Version
                  </span>
                  <span className="font-bold text-zinc-100">{state.currentVersion}</span>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-zinc-800/60">
                  <span className="flex items-center gap-1.5 text-zinc-400">
                    <Cpu className="w-3.5 h-3.5 text-zinc-500" /> Active Build ID
                  </span>
                  <span className="text-[11px] text-zinc-300 truncate max-w-[180px]">
                    {state.currentBuildId ? state.currentBuildId.slice(0, 10) : 'v1.2.2'}
                  </span>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-zinc-800/60">
                  <span className="flex items-center gap-1.5 text-zinc-400">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Cloud Edge Status
                  </span>
                  <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    Online & Synced
                  </span>
                </div>

                {state.learnedCount !== null && (
                  <div className="flex items-center justify-between pb-2 border-b border-zinc-800/60">
                    <span className="flex items-center gap-1.5 text-zinc-400">
                      <Sparkles className="w-3.5 h-3.5 text-teal-400" /> Clinical Vectors
                    </span>
                    <span className="text-teal-300">{state.learnedCount} Grounded Conditions</span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-zinc-400">
                    <Clock className="w-3.5 h-3.5 text-zinc-500" /> Last Checked
                  </span>
                  <span className="text-zinc-400">{formatLastChecked(state.lastCheckedTime)}</span>
                </div>
              </div>

              {/* Feedback toast */}
              {manualCheckFeedback && (
                <div className="mb-4 p-2.5 rounded-lg bg-zinc-800/80 border border-zinc-700 text-xs text-center text-zinc-200">
                  {manualCheckFeedback}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2.5">
                {state.updateAvailable ? (
                  <button
                    onClick={handleApplyUpdate}
                    disabled={state.isUpdating}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-teal-500/25 active:scale-95 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${state.isUpdating ? 'animate-spin' : ''}`} />
                    <span>{state.isUpdating ? 'Purging Cache & Updating...' : 'Update Webapp Now'}</span>
                  </button>
                ) : (
                  <button
                    onClick={handleManualCheck}
                    disabled={state.isChecking}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-semibold text-xs border border-zinc-700 transition-all active:scale-95 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${state.isChecking ? 'animate-spin' : ''}`} />
                    <span>{state.isChecking ? 'Checking Vercel Cloud...' : 'Check for Updates'}</span>
                  </button>
                )}

                <button
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs border border-zinc-800 transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

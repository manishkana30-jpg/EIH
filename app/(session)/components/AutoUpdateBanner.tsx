'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, RefreshCw, Wifi, CheckCircle2 } from 'lucide-react';
import { syncLearnedDocumentsFromCloud } from '@/lib/knowledge/self-learning-rag';

export function AutoUpdateBanner() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [newVersionInfo, setNewVersionInfo] = useState<{ version: string; commit?: string } | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [countdown, setCountdown] = useState(6);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced'>('idle');
  const [learnedCount, setLearnedCount] = useState<number | null>(null);
  const clientBuildIdRef = useRef<string>(process.env.NEXT_PUBLIC_BUILD_TIME || '');
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Autonomous Internet Knowledge Sync
  const performKnowledgeSync = async () => {
    if (typeof window === 'undefined' || !navigator.onLine) return;
    setSyncStatus('syncing');
    try {
      const result = await syncLearnedDocumentsFromCloud();
      setLearnedCount(result.total);
      setSyncStatus('synced');
      setTimeout(() => setSyncStatus('idle'), 4000);
    } catch {
      setSyncStatus('idle');
    }
  };

  // 2. Poll for New PWA Deployments & Git Pushes
  const checkForAppUpdates = async () => {
    if (typeof window === 'undefined' || !navigator.onLine || isUpdating) return;

    try {
      // Fetch with cache-busting timestamp
      const res = await fetch(`/api/version?_t=${Date.now()}`, {
        method: 'GET',
        headers: { 'Cache-Control': 'no-cache' },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.learnedCount) {
          setLearnedCount(data.learnedCount);
        }

        // If server buildId exists and is different from current client bundle
        if (
          data.buildId &&
          clientBuildIdRef.current &&
          data.buildId !== clientBuildIdRef.current &&
          !updateAvailable
        ) {
          console.info('🚀 EIH: New deployment detected from git push. Preparing auto-update.');
          setUpdateAvailable(true);
          setNewVersionInfo({ version: data.version, commit: data.commit });

          // Instruct Service Worker to skip waiting
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistration().then((reg) => {
              if (reg && reg.waiting) {
                reg.waiting.postMessage({ type: 'SKIP_WAITING' });
              }
              reg?.update();
            });
          }
        }
      }
    } catch (err) {
      // Non-blocking network check
    }
  };

  const triggerInstantUpdate = () => {
    setIsUpdating(true);
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const reg of registrations) {
          if (reg.waiting) {
            reg.waiting.postMessage({ type: 'SKIP_WAITING' });
          }
        }
      });
    }

    // Brief delay to let animations complete and caches bust
    setTimeout(() => {
      window.location.reload();
    }, 600);
  };

  // Countdown auto-updater when update is found
  useEffect(() => {
    if (updateAvailable && !isUpdating) {
      countdownIntervalRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownIntervalRef.current!);
            triggerInstantUpdate();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
        }
      };
    }
  }, [updateAvailable, isUpdating]);

  useEffect(() => {
    // Initial sync and check on mount
    performKnowledgeSync();
    checkForAppUpdates();

    // Check every 60 seconds
    const interval = setInterval(() => {
      checkForAppUpdates();
    }, 60000);

    // Sync when returning to tab or reconnecting to internet
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkForAppUpdates();
        performKnowledgeSync();
      }
    };

    const handleOnline = () => {
      performKnowledgeSync();
      checkForAppUpdates();
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  return (
    <>
      {/* Floating Auto-Update Banner */}
      <AnimatePresence>
        {updateAvailable && (
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.95 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="fixed top-3 inset-x-0 z-[100] flex justify-center px-4 pointer-events-auto"
          >
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-teal-950/95 via-slate-900/95 to-cyan-950/95 border border-teal-500/40 shadow-2xl shadow-teal-500/20 backdrop-blur-xl max-w-lg w-full text-xs">
              <div className="w-8 h-8 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-teal-300 animate-pulse" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 font-semibold text-teal-200">
                  <span>New Updates Deployed</span>
                  {newVersionInfo?.commit && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-teal-900/60 text-teal-400 border border-teal-700/50">
                      {newVersionInfo.commit.slice(0, 7)}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-300 truncate">
                  {isUpdating
                    ? 'Applying latest changes and refreshing...'
                    : `Updating engines automatically in ${countdown}s`}
                </p>
              </div>

              <button
                onClick={triggerInstantUpdate}
                disabled={isUpdating}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold text-xs transition-all active:scale-95 shadow-md shadow-teal-500/30 shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isUpdating ? 'animate-spin' : ''}`} />
                <span>{isUpdating ? 'Updating...' : 'Update Now'}</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Subtle Knowledge Sync Indicator toast if active */}
      <AnimatePresence>
        {syncStatus === 'synced' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="fixed bottom-20 right-4 z-40 hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 border border-emerald-500/30 text-emerald-300 text-[11px] backdrop-blur-md shadow-lg pointer-events-none"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Engines synced with latest clinical discoveries</span>
            {learnedCount !== null && (
              <span className="font-mono text-[10px] text-slate-400">({learnedCount} active)</span>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

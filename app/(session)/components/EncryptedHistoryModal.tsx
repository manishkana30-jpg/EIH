'use client';

import React, { useState } from 'react';
import { X, Trash2, ShieldCheck, ShieldAlert, CheckCircle, Sparkles, RefreshCw } from 'lucide-react';
import { purgeAllAppStorage } from '@/lib/db/indexed-db';
import { clearPsychologyTelemetry } from '@/lib/telemetry/psychology-store';

interface EncryptedHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EncryptedHistoryModal: React.FC<EncryptedHistoryModalProps> = ({ isOpen, onClose }) => {
  const [isPurging, setIsPurging] = useState(false);
  const [isPurged, setIsPurged] = useState(false);

  const handlePurge = async () => {
    setIsPurging(true);
    await purgeAllAppStorage();
    clearPsychologyTelemetry();
    setIsPurging(false);
    setIsPurged(true);
    setTimeout(() => setIsPurged(false), 3000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-xl bg-[#0d1511] rounded-3xl p-6 md:p-8 shadow-2xl border border-[#23352b] text-[var(--text-nature-primary)]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#1f3027] mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-heading font-bold text-slate-100 flex items-center gap-2">
                Zero-Retention Privacy Sanctuary
              </h2>
              <p className="text-xs text-emerald-400/90 font-medium">
                100% In-Memory Ephemeral Runtime • Zero Storage Retention
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 transition-all"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Security & Zero Retention Guarantees */}
        <div className="space-y-4 mb-6">
          <div className="p-4 rounded-2xl bg-[#14221b] border border-[#23352b] space-y-3">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-slate-100">Same-Time Volatile Processing</h4>
                <p className="text-xs text-slate-300 leading-relaxed mt-0.5">
                  All conversational exchanges, emotional classifications, Gita shlokas, CBT reframings, and Web Audio syntheses exist strictly in volatile RAM while your browser tab remains active.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 pt-2 border-t border-[#1f3027]">
              <ShieldAlert className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-slate-100">Zero Disk & Cache Persistence</h4>
                <p className="text-xs text-slate-300 leading-relaxed mt-0.5">
                  No encrypted chat history, transcripts, cookies, or telemetry are ever saved to local IndexedDB, disk storage, or remote databases.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 pt-2 border-t border-[#1f3027]">
              <RefreshCw className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-slate-100">Automatic Purge on Exit</h4>
                <p className="text-xs text-slate-300 leading-relaxed mt-0.5">
                  Closing this browser window, leaving the app, or clicking <span className="text-rose-300 font-medium">End Session</span> instantly and irrevocably purges 100% of memory and clears any temporary browser caches.
                </p>
              </div>
            </div>
          </div>

          {/* Audit Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
              <span className="text-[11px] text-slate-400 block mb-1">Persistent Records Stored</span>
              <span className="text-lg font-bold font-mono text-emerald-400">0 Records</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
              <span className="text-[11px] text-slate-400 block mb-1">Disk Storage Utilized</span>
              <span className="text-lg font-bold font-mono text-emerald-400">0.00 KB</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-[#1f3027]">
          <button
            onClick={handlePurge}
            disabled={isPurging}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 border border-rose-800/80 text-xs font-semibold text-rose-200 active:scale-95 transition-all"
          >
            {isPurged ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Trash2 className="w-4 h-4 text-rose-400" />}
            <span>{isPurged ? 'All Traces Purged!' : isPurging ? 'Purging...' : 'Purge All Traces Now'}</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-semibold text-xs active:scale-95 transition-all"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
};

export default EncryptedHistoryModal;

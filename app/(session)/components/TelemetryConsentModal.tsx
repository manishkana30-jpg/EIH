'use client';

import React, { useState, useEffect } from 'react';
import { Shield, Lock, X } from 'lucide-react';
import { sessionTelemetry } from '@/lib/telemetry/session-telemetry';

export interface TelemetryConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TelemetryConsentModal({ isOpen, onClose }: TelemetryConsentModalProps) {
  const [allowDetailed, setAllowDetailed] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setAllowDetailed(sessionTelemetry.isDetailedConsentAllowed());
    }
  }, [isOpen]);

  const handleToggle = (checked: boolean) => {
    setAllowDetailed(checked);
    sessionTelemetry.setDetailedConsent(checked);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md p-5 rounded-2xl bg-slate-900 border border-slate-700/80 text-slate-100 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>Privacy & Quality Telemetry</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3 text-xs leading-relaxed text-slate-300">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-emerald-500/20 space-y-1.5">
            <div className="flex items-center gap-1.5 text-emerald-300 font-medium">
              <Lock className="w-3.5 h-3.5" />
              <span>Default Privacy Shield Active</span>
            </div>
            <p className="text-slate-400">
              By default, your personal words, voice recordings, and verbatim messages are <strong>never stored or sent anywhere</strong>. Only aggregated quality metrics (such as voice response timing, feature confirmation, and speech synchrony) are processed locally.
            </p>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/40 border border-slate-700/60">
            <input
              type="checkbox"
              id="telemetry-consent-checkbox"
              checked={allowDetailed}
              onChange={(e) => handleToggle(e.target.checked)}
              className="mt-0.5 rounded border-slate-600 text-emerald-500 focus:ring-emerald-400 cursor-pointer"
            />
            <label htmlFor="telemetry-consent-checkbox" className="space-y-1 cursor-pointer select-none">
              <span className="font-semibold text-slate-200 block">
                Opt-in to Detailed Quality Telemetry
              </span>
              <span className="text-[11px] text-slate-400 block">
                Helps improve recognition accuracy by logging anonymous phrase snippets during clarify loops. Can be disabled at any time.
              </span>
            </label>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs transition-all shadow-md active:scale-95 cursor-pointer"
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
}

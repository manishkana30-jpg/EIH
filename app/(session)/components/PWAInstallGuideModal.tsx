'use client';

import React from 'react';
import { X, Share, PlusSquare, CheckCircle, Smartphone } from 'lucide-react';

interface PWAInstallGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PWAInstallGuideModal: React.FC<PWAInstallGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="pwa-install-title"
    >
      <div
        className="relative w-full max-w-md bg-[#14201a] border border-[#283c32] rounded-3xl p-6 shadow-2xl space-y-5 text-[var(--text-nature-primary)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#283c32]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#588e73]/20 border border-[#588e73]/40 flex items-center justify-center text-[var(--accent-sage)] shadow-glow">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 id="pwa-install-title" className="text-base md:text-lg font-heading font-bold text-[var(--text-nature-primary)]">
                Install Healer Sanctuary PWA
              </h2>
              <p className="text-xs text-[var(--text-nature-secondary)]">
                Quick 3-step installation for iOS Safari
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[var(--text-nature-muted)] hover:text-[var(--text-nature-primary)] hover:bg-[#1b2a23] transition-all"
            aria-label="Close installation guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3 Step Visual Flow */}
        <div className="space-y-3.5">
          {/* Step 1 */}
          <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-[#1b2a23]/90 border border-[#283c32]">
            <div className="w-7 h-7 rounded-xl bg-[#22382c] border border-[#3d584a] flex items-center justify-center text-xs font-bold text-[var(--accent-sage)] shrink-0 mt-0.5 font-mono">
              1
            </div>
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-nature-primary)]">
                <span>Tap the Share Button</span>
                <span className="p-1 rounded bg-[#14201a] border border-[#283c32] inline-flex items-center">
                  <Share className="w-3 h-3 text-[var(--accent-sage)]" />
                </span>
              </div>
              <p className="text-[11px] text-[var(--text-nature-secondary)] leading-relaxed">
                Look for the square share icon <span className="font-mono text-[var(--accent-sage)]">⎋</span> located at the bottom of your Safari browser toolbar.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-[#1b2a23]/90 border border-[#283c32]">
            <div className="w-7 h-7 rounded-xl bg-[#22382c] border border-[#3d584a] flex items-center justify-center text-xs font-bold text-[var(--accent-sage)] shrink-0 mt-0.5 font-mono">
              2
            </div>
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-nature-primary)]">
                <span>Tap &ldquo;Add to Home Screen&rdquo;</span>
                <span className="p-1 rounded bg-[#14201a] border border-[#283c32] inline-flex items-center">
                  <PlusSquare className="w-3 h-3 text-[var(--accent-sage)]" />
                </span>
              </div>
              <p className="text-[11px] text-[var(--text-nature-secondary)] leading-relaxed">
                Scroll down in the action sheet and tap the option labeled <strong className="text-[var(--text-nature-primary)]">&ldquo;Add to Home Screen&rdquo; ⊞</strong>.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-[#1b2a23]/90 border border-[#283c32]">
            <div className="w-7 h-7 rounded-xl bg-[#22382c] border border-[#3d584a] flex items-center justify-center text-xs font-bold text-[var(--accent-sage)] shrink-0 mt-0.5 font-mono">
              3
            </div>
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-nature-primary)]">
                <span>Tap &ldquo;Add&rdquo; in Top-Right</span>
                <span className="p-1 rounded bg-[#14201a] border border-[#283c32] inline-flex items-center">
                  <CheckCircle className="w-3 h-3 text-[var(--accent-sage)]" />
                </span>
              </div>
              <p className="text-[11px] text-[var(--text-nature-secondary)] leading-relaxed">
                Tap <strong className="text-[var(--text-nature-primary)]">&ldquo;Add&rdquo;</strong> in the top-right corner to launch EIH as a standalone, fullscreen native app.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 flex items-center justify-end">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-[#588e73] hover:bg-[#81a890] text-[#0c1410] text-xs font-bold transition-all shadow-glow"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};

export default PWAInstallGuideModal;

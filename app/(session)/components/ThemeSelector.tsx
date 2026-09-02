'use client';

import React, { useState } from 'react';
import { Palette, Check, Sparkles, X, Sun, Moon } from 'lucide-react';
import { THERAPY_THEMES, TherapyTheme, saveThemePreference } from '@/lib/theme/therapy-themes';

interface ThemeSelectorProps {
  currentTheme: TherapyTheme;
  onSelectTheme: (theme: TherapyTheme) => void;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  currentTheme,
  onSelectTheme,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const handlePickTheme = (theme: TherapyTheme) => {
    saveThemePreference(theme.id);
    onSelectTheme(theme);
    setIsOpen(false);
  };

  return (
    <>
      {/* Top Bar Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--bg-nature-card)] hover:bg-[var(--bg-nature-surface)] border border-[var(--border-nature-subtle)] hover:border-[var(--border-nature-highlight)] text-xs text-[var(--text-nature-secondary)] hover:text-[var(--text-nature-primary)] transition-all shadow-sm shrink-0"
        title="Choose Aesthetic Peaceful Theme"
      >
        <span className="text-[11px]">{currentTheme.emoji}</span>
        <span className="hidden lg:inline font-medium">{currentTheme.name}</span>
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0 shadow-sm"
          style={{ backgroundColor: currentTheme.primaryOrb }}
        />
      </button>

      {/* Aesthetic Theme Picker Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
          <div className="relative w-full max-w-lg bg-[#14201a] border border-[#283c32] rounded-3xl shadow-2xl p-5 md:p-6 space-y-4 text-[var(--text-nature-primary)]">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#283c32]">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#588e73]/20 border border-[#588e73]/40 flex items-center justify-center text-[var(--accent-sage)] shadow-glow">
                  <Palette className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base md:text-lg font-heading font-bold text-[var(--text-nature-primary)]">
                    Aesthetic Therapy Sanctuary
                  </h3>
                  <p className="text-xs text-[var(--text-nature-secondary)]">
                    Choose a calming, peaceful theme to soothe your mind and senses.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-xl text-[var(--text-nature-muted)] hover:text-[var(--text-nature-primary)] hover:bg-[#1b2a23] transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Theme Options Grid */}
            <div className="grid grid-cols-1 gap-2.5 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
              {THERAPY_THEMES.map((theme) => {
                const isSelected = currentTheme.id === theme.id;
                return (
                  <button
                    key={theme.id}
                    onClick={() => handlePickTheme(theme)}
                    className={`p-3.5 rounded-2xl border text-left flex items-center justify-between gap-3 transition-all relative overflow-hidden ${
                      isSelected
                        ? 'bg-[#22382c] border-[#81a890] shadow-glow ring-2 ring-[#81a890]/30'
                        : 'bg-[#1b2a23]/90 hover:bg-[#22382c] border-[#283c32] hover:border-[#3d584a]'
                    }`}
                  >
                    {/* Ambient Glow Bar on side */}
                    <div
                      className="absolute left-0 top-0 bottom-0 w-1.5"
                      style={{ backgroundColor: theme.primaryOrb }}
                    />

                    <div className="flex items-center gap-3 pl-2 min-w-0">
                      <span className="text-2xl shrink-0">{theme.emoji}</span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-heading font-bold text-[var(--text-nature-primary)]">
                            {theme.name}
                          </span>
                          {/* Color Palette Dots */}
                          <div className="flex items-center gap-1">
                            <span
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: theme.primaryOrb }}
                            />
                            <span
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: theme.secondaryOrb }}
                            />
                            <span
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: theme.tertiaryOrb }}
                            />
                          </div>
                        </div>
                        <p className="text-[11px] text-[var(--text-nature-secondary)] truncate mt-0.5">
                          {theme.subtitle}
                        </p>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-[#588e73] text-[#0c1410] flex items-center justify-center shrink-0 shadow-glow font-bold">
                        <Check className="w-4 h-4 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-[#283c32] flex items-center justify-between text-xs text-[var(--text-nature-secondary)]">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[var(--accent-sage)]" />
                <span>Ambient light orbs auto-adapt peacefully.</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-1.5 rounded-xl bg-[#1b2a23] hover:bg-[#22382c] border border-[#283c32] text-xs text-[var(--text-nature-primary)] font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ThemeSelector;

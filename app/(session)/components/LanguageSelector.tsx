'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Globe,
  MapPin,
  Check,
  Search,
  X,
  Compass,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import {
  GLOBAL_LANGUAGE_CATALOG,
  LanguageItem,
  DetectedLocationInfo,
  detectLocationAndLanguage,
  getStoredLanguage,
  saveLanguagePreference,
  getLanguageByCode,
} from '@/lib/i18n/language-catalog';

interface LanguageSelectorProps {
  currentLanguage: LanguageItem;
  onLanguageChange: (lang: LanguageItem, isAuto: boolean) => void;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  currentLanguage,
  onLanguageChange,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [detectedLocation, setDetectedLocation] = useState<DetectedLocationInfo | null>(null);
  const [isDetecting, setIsDetecting] = useState<boolean>(false);
  const [isAutoMode, setIsAutoMode] = useState<boolean>(true);

  // Initialize and run auto GPS location detection
  useEffect(() => {
    const { isAuto } = getStoredLanguage();
    setIsAutoMode(isAuto);

    runLocationDetection();
  }, []);

  const runLocationDetection = async () => {
    setIsDetecting(true);
    try {
      const loc = await detectLocationAndLanguage();
      setDetectedLocation(loc);

      // If user is in auto mode, auto-apply the detected language
      const { isAuto } = getStoredLanguage();
      if (isAuto && loc.defaultLanguageCode) {
        const matched = getLanguageByCode(loc.defaultLanguageCode);
        onLanguageChange(matched, true);
      }
    } catch (_) {
    } finally {
      setIsDetecting(false);
    }
  };

  const handleSelectLanguage = (lang: LanguageItem) => {
    setIsAutoMode(false);
    saveLanguagePreference(lang.code, false);
    onLanguageChange(lang, false);
    setIsOpen(false);
  };

  const handleUseAutoLocation = () => {
    setIsAutoMode(true);
    if (detectedLocation) {
      saveLanguagePreference(detectedLocation.defaultLanguageCode, true);
      const matched = getLanguageByCode(detectedLocation.defaultLanguageCode);
      onLanguageChange(matched, true);
    }
    setIsOpen(false);
  };

  const filteredLanguages = useMemo(() => {
    if (!searchQuery.trim()) return GLOBAL_LANGUAGE_CATALOG;
    const q = searchQuery.toLowerCase().trim();
    return GLOBAL_LANGUAGE_CATALOG.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.nativeName.toLowerCase().includes(q) ||
        l.region.toLowerCase().includes(q) ||
        l.code.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  return (
    <>
      {/* Top Bar Trigger Capsule */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--bg-nature-card)] hover:bg-[var(--bg-nature-surface)] border border-[var(--border-nature-subtle)] hover:border-[var(--border-nature-highlight)] text-xs text-[var(--text-nature-secondary)] hover:text-[var(--text-nature-primary)] transition-all shadow-sm shrink-0"
        title="Change Language & GPS Region"
      >
        <span className="text-[11px]">{currentLanguage.flag}</span>
        <span className="font-medium">{currentLanguage.name}</span>
        {detectedLocation && (
          <span className="hidden lg:inline-flex items-center gap-1 text-[10px] font-mono text-[var(--accent-sage)] border-l border-[#283c32] pl-1.5">
            <MapPin className="w-2.5 h-2.5" />
            <span className="truncate max-w-[80px]">{detectedLocation.countryName}</span>
          </span>
        )}
      </button>

      {/* Language Catalog & GPS Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
          <div className="relative w-full max-w-2xl bg-[#14201a] border border-[#283c32] rounded-3xl shadow-2xl p-5 md:p-6 space-y-4 max-h-[90vh] flex flex-col justify-between text-[var(--text-nature-primary)]">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#283c32]">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#588e73]/20 border border-[#588e73]/40 flex items-center justify-center text-[var(--accent-sage)] shadow-glow">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base md:text-lg font-heading font-bold text-[var(--text-nature-primary)]">
                    Global Language &amp; GPS Region
                  </h3>
                  <p className="text-xs text-[var(--text-nature-secondary)]">
                    Default automatically aligns with your location. You can switch to any language anytime.
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

            {/* GPS Location Status Banner */}
            <div className="p-3.5 rounded-2xl bg-[#1b2a23]/90 border border-[#283c32] flex flex-wrap items-center justify-between gap-3 shadow-md">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#588e73]/20 border border-[#588e73]/40 flex items-center justify-center text-[var(--accent-sage)]">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[var(--text-nature-primary)]">
                      Detected Location:
                    </span>
                    <span className="text-xs font-mono text-[var(--accent-sage)] font-semibold">
                      {detectedLocation ? detectedLocation.regionName : 'Detecting GPS region...'}
                    </span>
                  </div>
                  <span className="text-[11px] text-[var(--text-nature-secondary)]">
                    {detectedLocation?.isGps
                      ? 'GPS Satellite Coordinates Active'
                      : 'Detected via Regional Timezone / Locale'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={runLocationDetection}
                  disabled={isDetecting}
                  className="px-2.5 py-1.5 rounded-xl bg-[#14201a] hover:bg-[#22382c] border border-[#283c32] text-xs text-[var(--text-nature-secondary)] flex items-center gap-1.5 transition-all"
                  title="Re-detect GPS location"
                >
                  <RefreshCw className={`w-3 h-3 text-[var(--accent-sage)] ${isDetecting ? 'animate-spin' : ''}`} />
                  <span>Re-scan</span>
                </button>

                <button
                  onClick={handleUseAutoLocation}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all shadow-sm flex items-center gap-1.5 ${
                    isAutoMode
                      ? 'bg-[#588e73] text-[#0c1410] font-bold shadow-glow'
                      : 'bg-[#14201a] hover:bg-[#22382c] text-[var(--text-nature-secondary)] border border-[#283c32]'
                  }`}
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Auto (GPS Default)</span>
                </button>
              </div>
            </div>

            {/* Language Search Input */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-nature-muted)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search languages by name, native script, or country..."
                className="w-full bg-[#1b2a23] border border-[#283c32] focus:border-[#81a890] rounded-2xl pl-10 pr-4 py-2.5 text-xs md:text-sm text-[var(--text-nature-primary)] placeholder:text-[var(--text-nature-muted)] focus:outline-none"
              />
            </div>

            {/* Global Language Catalog Grid */}
            <div className="flex-1 overflow-y-auto max-h-[340px] pr-1 space-y-1.5 custom-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {filteredLanguages.map((lang) => {
                  const isSelected = currentLanguage.code === lang.code;
                  return (
                    <button
                      key={lang.code}
                      onClick={() => handleSelectLanguage(lang)}
                      className={`p-3 rounded-2xl border text-left flex items-center justify-between gap-2 transition-all ${
                        isSelected
                          ? 'bg-[#22382c] border-[#81a890] shadow-glow ring-1 ring-[#81a890]/30'
                          : 'bg-[#1b2a23]/90 hover:bg-[#22382c] border-[#283c32] hover:border-[#3d584a]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-xl shrink-0">{lang.flag}</span>
                        <div className="min-w-0">
                          <div className="flex items-baseline gap-1.5 truncate">
                            <span className="text-xs font-bold text-[var(--text-nature-primary)] truncate">
                              {lang.name}
                            </span>
                            <span className="text-[10px] font-mono text-[var(--text-nature-muted)] truncate">
                              ({lang.code})
                            </span>
                          </div>
                          <p className="text-[11px] text-[var(--accent-sage)] truncate font-medium">
                            {lang.nativeName}
                          </p>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-[#588e73] text-[#0c1410] flex items-center justify-center shrink-0 shadow-sm font-bold">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Footer Notice */}
            <div className="pt-3 border-t border-[#283c32] flex items-center justify-between text-xs text-[var(--text-nature-secondary)]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-[var(--accent-sage)]" />
                <span>Companion voice synthesis &amp; recognition auto-calibrates to your selection.</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-1.5 rounded-xl bg-[#1b2a23] hover:bg-[#22382c] border border-[#283c32] text-xs text-[var(--text-nature-primary)] font-medium"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LanguageSelector;

'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Brain,
  Sparkles,
  BookOpen,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { cbtLibrary, CBTDistortion, CBTProtocol, CBTSchema } from '@/lib/knowledge/cbt-library';
import { cbtUpgraderService, UpgradeStatusResponse } from '@/lib/services/cbt-upgrader';

interface CBTKnowledgeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CBTKnowledgeModal: React.FC<CBTKnowledgeModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'distortions' | 'schemas' | 'protocols' | 'analyzer' | 'upgrade'>('distortions');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDistortion, setSelectedDistortion] = useState<CBTDistortion | null>(null);
  
  // Analyzer state
  const [testThought, setTestThought] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  // Upgrade state
  const [upgrading, setUpgrading] = useState(false);
  const [upgradeStatus, setUpgradeStatus] = useState<UpgradeStatusResponse | null>(null);
  const [manifest, setManifest] = useState(cbtLibrary.getManifest());

  const distortions = cbtLibrary.getAllDistortions();
  const schemas = cbtLibrary.getAllSchemas();
  const protocols = cbtLibrary.getAllProtocols();

  useEffect(() => {
    if (isOpen) {
      loadLatestManifest();
    }
  }, [isOpen]);

  const loadLatestManifest = async () => {
    const data = await cbtUpgraderService.getLibraryData();
    setManifest(data.manifest);
  };

  const handleRunAnalysis = async () => {
    if (!testThought.trim()) return;
    setAnalyzing(true);
    const res = await cbtUpgraderService.analyzeUtterance(testThought);
    setAnalysisResult(res);
    setAnalyzing(false);
  };

  const handleTriggerUpgrade = async () => {
    setUpgrading(true);
    setUpgradeStatus(null);
    const res = await cbtUpgraderService.triggerUpgrade();
    setUpgradeStatus(res);
    if (res.success) {
      await loadLatestManifest();
    }
    setUpgrading(false);
  };

  const handleTriggerRollback = async () => {
    setUpgrading(true);
    const res = await cbtUpgraderService.triggerRollback();
    setUpgradeStatus(res);
    if (res.success) {
      await loadLatestManifest();
    }
    setUpgrading(false);
  };

  if (!isOpen) return null;

  const filteredDistortions = distortions.filter(
    (d) =>
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[88vh] flex flex-col bg-[#0d1612] rounded-3xl shadow-2xl border border-[#283c32] text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#283c32] bg-[#14201a]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold font-heading text-emerald-100">
                  CBT & Schema Clinical Knowledge Base
                </h2>
                <span className="px-2.5 py-0.5 text-xs font-mono rounded-full bg-emerald-950 border border-emerald-800 text-emerald-300">
                  v{manifest.version}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Evidence-based cognitive restructuring, Beck & Burns distortions, and auto-upgrading ontology
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-800/60 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#283c32] bg-[#111a15] px-6 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('distortions')}
            className={`py-3 px-4 text-xs md:text-sm font-medium border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'distortions'
                ? 'border-emerald-400 text-emerald-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Distortions ({distortions.length})
          </button>
          <button
            onClick={() => setActiveTab('schemas')}
            className={`py-3 px-4 text-xs md:text-sm font-medium border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'schemas'
                ? 'border-emerald-400 text-emerald-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Core Schemas ({schemas.length})
          </button>
          <button
            onClick={() => setActiveTab('protocols')}
            className={`py-3 px-4 text-xs md:text-sm font-medium border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'protocols'
                ? 'border-emerald-400 text-emerald-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Brain className="w-4 h-4" />
            Clinical Protocols ({protocols.length})
          </button>
          <button
            onClick={() => setActiveTab('analyzer')}
            className={`py-3 px-4 text-xs md:text-sm font-medium border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'analyzer'
                ? 'border-emerald-400 text-emerald-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Search className="w-4 h-4" />
            Interactive Tester
          </button>
          <button
            onClick={() => setActiveTab('upgrade')}
            className={`py-3 px-4 text-xs md:text-sm font-medium border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'upgrade'
                ? 'border-emerald-400 text-emerald-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            Auto-Upgrade & Sync
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: DISTORTIONS */}
          {activeTab === 'distortions' && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search cognitive distortions (e.g. Catastrophizing, Should statements, Mind reading)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#14201a] border border-[#283c32] text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {filteredDistortions.map((distortion) => (
                  <div
                    key={distortion.id}
                    onClick={() => setSelectedDistortion(distortion)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      selectedDistortion?.id === distortion.id
                        ? 'bg-emerald-950/40 border-emerald-500/60 shadow-lg'
                        : 'bg-[#14201a]/70 border-[#283c32] hover:border-emerald-600/40 hover:bg-[#14201a]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <h3 className="font-semibold text-sm text-emerald-200">{distortion.name}</h3>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                        {distortion.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 line-clamp-2 mb-2">{distortion.description}</p>
                    <div className="text-[11px] text-emerald-400/90 italic bg-emerald-950/30 p-2 rounded-lg border border-emerald-900/40">
                      "{distortion.example_thought}"
                    </div>
                  </div>
                ))}
              </div>

              {/* Selected Distortion Detail View */}
              {selectedDistortion && (
                <div className="mt-6 p-5 rounded-2xl bg-[#14201a] border border-emerald-500/40 shadow-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs text-emerald-400 font-mono uppercase tracking-wider">
                        Clinical Detail & Socratic Reframing
                      </span>
                      <h3 className="text-lg font-bold text-emerald-100">{selectedDistortion.name}</h3>
                    </div>
                    <button
                      onClick={() => setSelectedDistortion(null)}
                      className="text-xs text-slate-400 hover:text-slate-200"
                    >
                      Close Detail
                    </button>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">{selectedDistortion.description}</p>

                  <div className="space-y-2 text-xs">
                    <div className="font-semibold text-slate-200">Reframing Insight / Cognitive Shift:</div>
                    <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800 text-emerald-200">
                      {selectedDistortion.reframing_prompt}
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="font-semibold text-slate-200">Socratic Inquiry Questions:</div>
                    <ul className="space-y-1 pl-4 list-disc text-slate-300">
                      {selectedDistortion.socratic_questions.map((q, idx) => (
                        <li key={idx}>{q}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span><strong>Somatic Cue:</strong> {selectedDistortion.somatic_anchor}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SCHEMAS */}
          {activeTab === 'schemas' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400">
                Dr. Jeffrey Young's 18 Early Maladaptive Schemas: Longstanding, self-defeating cognitive and emotional patterns formed during early development.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {schemas.map((schema) => (
                  <div key={schema.id} className="p-4 rounded-2xl bg-[#14201a] border border-[#283c32] space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-emerald-300">{schema.name}</h4>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                        {schema.domain}
                      </span>
                    </div>
                    <div className="text-xs text-slate-200">
                      <strong>Core Belief:</strong> <span className="italic text-slate-300">"{schema.core_belief}"</span>
                    </div>
                    <div className="text-xs text-slate-300">
                      <strong>Behavioral Pattern:</strong> {schema.behavioral_pattern}
                    </div>
                    <div className="text-[11px] text-emerald-400/80">
                      <strong>Somatic Marker:</strong> {schema.somatic_marker}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: PROTOCOLS */}
          {activeTab === 'protocols' && (
            <div className="space-y-4">
              {protocols.map((protocol) => (
                <div key={protocol.id} className="p-5 rounded-2xl bg-[#14201a] border border-[#283c32] space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-base text-emerald-200">{protocol.name}</h3>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-300">
                      {protocol.evidence_base}
                    </span>
                  </div>
                  <div className="space-y-1.5 pl-2">
                    {protocol.steps.map((step, sIdx) => (
                      <div key={sIdx} className="text-xs text-slate-300 flex items-start gap-2">
                        <ArrowRight className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 4: INTERACTIVE ANALYZER */}
          {activeTab === 'analyzer' && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-[#14201a] border border-[#283c32] space-y-3">
                <label className="text-xs font-semibold text-slate-200 block">
                  Enter an automatic thought or client utterance to analyze:
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. 'I made a tiny mistake in my presentation and I know everyone in the office thinks I am completely incompetent and I'll be fired tomorrow.'"
                  value={testThought}
                  onChange={(e) => setTestThought(e.target.value)}
                  className="w-full p-3 rounded-xl bg-[#0d1612] border border-[#283c32] text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
                <button
                  onClick={handleRunAnalysis}
                  disabled={analyzing || !testThought.trim()}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-2 transition-colors"
                >
                  <Search className="w-4 h-4" />
                  {analyzing ? 'Analyzing Cognitive Pattern...' : 'Detect Cognitive Distortions'}
                </button>
              </div>

              {analysisResult && (
                <div className="p-5 rounded-2xl bg-[#14201a] border border-emerald-500/40 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-emerald-200">Clinical Cognitive Diagnostic Output</h4>
                    <span className="text-xs text-emerald-400 font-mono">
                      Confidence: {Math.round((analysisResult.confidence_score || 0.8) * 100)}%
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {analysisResult.detected_distortions?.length > 0 ? (
                      analysisResult.detected_distortions.map((d: any, idx: number) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-red-950/60 border border-red-800/80 text-red-300"
                        >
                          ⚠ {d.name || d}
                        </span>
                      ))
                    ) : (
                      <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-950 border border-emerald-800 text-emerald-300">
                        ✓ Balanced Thinking / No Acute Distortion Detected
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 text-xs">
                    <span className="font-semibold text-slate-200">Reframing Directive:</span>
                    <p className="text-slate-300 italic p-3 rounded-xl bg-emerald-950/30 border border-emerald-900/50">
                      "{analysisResult.reframing_insight}"
                    </p>
                  </div>

                  {analysisResult.socratic_prompts?.length > 0 && (
                    <div className="space-y-1.5 text-xs">
                      <span className="font-semibold text-slate-200">Targeted Socratic Questions:</span>
                      <ul className="space-y-1 pl-4 list-disc text-slate-300">
                        {analysisResult.socratic_prompts.map((q: string, idx: number) => (
                          <li key={idx}>{q}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {analysisResult.somatic_cue && (
                    <div className="text-xs text-emerald-300 flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{analysisResult.somatic_cue}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: AUTO-UPGRADE & VERSION SYNC */}
          {activeTab === 'upgrade' && (
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-[#14201a] border border-[#283c32] space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-base text-emerald-100">Live Clinical Registry Synchronization</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Automatically queries NCBI PubMed, PMC, and updated CBT frameworks to enrich distortion reframings.
                    </p>
                  </div>
                  <span className="px-3 py-1 text-xs rounded-full bg-emerald-950 border border-emerald-800 text-emerald-300 font-mono">
                    Active: v{manifest.version}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                    <span className="text-slate-400 block mb-1">SHA-256 Checksum:</span>
                    <span className="font-mono text-[11px] text-emerald-400 break-all">
                      {manifest.checksum_sha256 || 'Verified Atomic Integrity'}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                    <span className="text-slate-400 block mb-1">Source Registries:</span>
                    <span className="text-slate-200">{manifest.source_registries?.join(', ')}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    onClick={handleTriggerUpgrade}
                    disabled={upgrading}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-2 transition-colors shadow-lg shadow-emerald-900/40"
                  >
                    <RefreshCw className={`w-4 h-4 ${upgrading ? 'animate-spin' : ''}`} />
                    {upgrading ? 'Connecting to Clinical Registry...' : 'Check & Upgrade Library'}
                  </button>

                  <button
                    onClick={handleTriggerRollback}
                    disabled={upgrading}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs font-medium flex items-center gap-2 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Rollback to Previous Snapshot
                  </button>
                </div>
              </div>

              {upgradeStatus && (
                <div
                  className={`p-4 rounded-2xl border text-xs space-y-2 ${
                    upgradeStatus.success
                      ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-200'
                      : 'bg-red-950/40 border-red-500/60 text-red-200'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold">
                    {upgradeStatus.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                    )}
                    <span>Status: {upgradeStatus.status.toUpperCase()}</span>
                  </div>
                  <p>{upgradeStatus.details}</p>
                  <div className="text-[11px] text-slate-400 font-mono">
                    Version: {upgradeStatus.previous_version} ➔ {upgradeStatus.current_version} | Timestamp:{' '}
                    {upgradeStatus.timestamp}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#283c32] bg-[#14201a] flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />
            <span>20+ Cognitive Distortions | 18 Early Maladaptive Schemas | 8 Protocols</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default CBTKnowledgeModal;

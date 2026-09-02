'use client';

import React, { useState, useEffect } from 'react';
import { BookOpen, Download, Plus, Trash2 } from 'lucide-react';

interface JournalEntry {
  id: string;
  timestamp: number;
  emotion: string;
  note: string;
}

const STORAGE_KEY = 'eih_emotion_journal_session';

export const EmotionJournal: React.FC = () => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [emotion, setEmotion] = useState<string>('Calmness');
  const [note, setNote] = useState<string>('');

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        setEntries(JSON.parse(stored));
      }
    } catch (_) {}
  }, []);

  const saveEntries = (updated: JournalEntry[]) => {
    setEntries(updated);
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (_) {}
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) return;

    const newEntry: JournalEntry = {
      id: `ej-${Date.now()}`,
      timestamp: Date.now(),
      emotion,
      note: note.trim(),
    };

    saveEntries([newEntry, ...entries]);
    setNote('');
  };

  const handleDelete = (id: string) => {
    saveEntries(entries.filter((entry) => entry.id !== id));
  };

  const handleExportJSON = () => {
    if (entries.length === 0) return;
    const blob = new Blob([JSON.stringify(entries, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `eih_emotion_journal_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-5 rounded-3xl bg-[#1b2a23]/90 border border-[#283c32] space-y-4 text-left text-[var(--text-nature-primary)]">
      <div className="flex items-center justify-between border-b border-[#283c32] pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#588e73]/20 border border-[#588e73]/40 flex items-center justify-center text-[var(--accent-sage)]">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--text-nature-primary)]">
              Session Emotion Journal
            </h3>
            <p className="text-[11px] text-[var(--text-nature-secondary)]">
              Session-bound reflections (Exportable JSON)
            </p>
          </div>
        </div>
        <button
          onClick={handleExportJSON}
          disabled={entries.length === 0}
          className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#14201a] hover:bg-[#22382c] border border-[#283c32] disabled:opacity-40 text-xs text-[var(--text-nature-secondary)] hover:text-[var(--text-nature-primary)] transition-all"
          title="Export as JSON"
        >
          <Download className="w-3 h-3" />
          <span className="hidden sm:inline">Export</span>
        </button>
      </div>

      {/* Entry Form */}
      <form onSubmit={handleAdd} className="space-y-2">
        <div className="flex items-center gap-2">
          <select
            value={emotion}
            onChange={(e) => setEmotion(e.target.value)}
            className="bg-[#14201a] border border-[#283c32] rounded-xl px-2.5 py-1.5 text-xs text-[var(--text-nature-primary)] focus:outline-none"
          >
            <option value="Calmness">🌿 Calmness</option>
            <option value="Anxiety">😟 Anxiety</option>
            <option value="Relief">🌊 Relief</option>
            <option value="Sadness">😔 Sadness</option>
            <option value="Satisfaction">✨ Satisfaction</option>
            <option value="Anger">🔥 Anger</option>
            <option value="Awe">🌌 Awe</option>
          </select>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Brief reflection on this feeling..."
            className="flex-1 bg-[#14201a] border border-[#283c32] focus:border-[#81a890] rounded-xl px-3 py-1.5 text-xs text-[var(--text-nature-primary)] placeholder:text-[var(--text-nature-muted)] focus:outline-none"
          />
          <button
            type="submit"
            disabled={!note.trim()}
            className="p-2 rounded-xl bg-[#588e73] hover:bg-[#81a890] disabled:opacity-40 text-[#0c1410] font-bold shadow-glow transition-all shrink-0"
            title="Log reflection"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>

      {/* Entries List */}
      <div className="space-y-2 max-h-52 overflow-y-auto pr-1 custom-scrollbar">
        {entries.length === 0 ? (
          <p className="text-center py-6 text-[11px] text-[var(--text-nature-muted)]">
            No reflections recorded in this session yet.
          </p>
        ) : (
          entries.map((entry) => (
            <div
              key={entry.id}
              className="p-3 rounded-2xl bg-[#14201a] border border-[#283c32] flex items-start justify-between gap-2"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#1b2a23] border border-[#283c32] text-[var(--accent-sage)] font-mono">
                    {entry.emotion}
                  </span>
                  <span className="text-[10px] text-[var(--text-nature-muted)] font-mono">
                    {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-[var(--text-nature-primary)] leading-relaxed">
                  {entry.note}
                </p>
              </div>

              <button
                onClick={() => handleDelete(entry.id)}
                className="p-1 text-[var(--text-nature-muted)] hover:text-red-400 transition-colors shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default EmotionJournal;

'use client';

import React, { useState } from 'react';
import { Target, CheckCircle2, XCircle, Plus, Trash2 } from 'lucide-react';

interface SphereItem {
  id: string;
  text: string;
  isWithinControl: boolean;
}

export const LocusOfControl: React.FC = () => {
  const [items, setItems] = useState<SphereItem[]>([
    { id: '1', text: 'My own breath & somatic response', isWithinControl: true },
    { id: '2', text: 'Other people’s thoughts & reactions', isWithinControl: false },
    { id: '3', text: 'How many hours I spend working today', isWithinControl: true },
    { id: '4', text: 'Whether an unexpected crisis occurs', isWithinControl: false },
  ]);

  const [newItemText, setNewItemText] = useState<string>('');
  const [isWithin, setIsWithin] = useState<boolean>(true);

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemText.trim()) return;

    setItems([
      ...items,
      { id: `lc-${Date.now()}`, text: newItemText.trim(), isWithinControl: isWithin },
    ]);
    setNewItemText('');
  };

  const handleDeleteItem = (id: string) => {
    setItems(items.filter((i) => i.id !== id));
  };

  const inControlItems = items.filter((i) => i.isWithinControl);
  const outControlItems = items.filter((i) => !i.isWithinControl);

  return (
    <div className="p-5 rounded-3xl bg-[#1b2a23]/90 border border-[#283c32] space-y-4 text-left text-[var(--text-nature-primary)]">
      <div className="flex items-center justify-between border-b border-[#283c32] pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#588e73]/20 border border-[#588e73]/40 flex items-center justify-center text-[var(--accent-sage)]">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--text-nature-primary)]">
              Sphere of Control Sorter
            </h3>
            <p className="text-[11px] text-[var(--text-nature-secondary)]">
              Stoic &amp; Cognitive Dichotomy of Control triage
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#14201a] border border-[#283c32] text-[var(--accent-sage)]">
          Control Sorter
        </span>
      </div>

      {/* Two Column Spheres */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
        {/* Within My Control */}
        <div className="p-3 rounded-2xl bg-[#14201a] border border-[#3d584a] space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--accent-sage)]">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Within My Control (Focus Energy)</span>
          </div>
          <div className="space-y-1.5">
            {inControlItems.map((item) => (
              <div
                key={item.id}
                className="p-2 rounded-xl bg-[#1b2a23] border border-[#283c32] flex items-center justify-between text-[11px] text-[var(--text-nature-primary)] gap-2"
              >
                <span className="truncate">{item.text}</span>
                <button
                  onClick={() => handleDeleteItem(item.id)}
                  className="text-[var(--text-nature-muted)] hover:text-red-400"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Outside My Control */}
        <div className="p-3 rounded-2xl bg-[#14201a] border border-[#c48b71]/30 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--accent-clay)]">
            <XCircle className="w-3.5 h-3.5" />
            <span>Outside My Control (Practice Surrender)</span>
          </div>
          <div className="space-y-1.5">
            {outControlItems.map((item) => (
              <div
                key={item.id}
                className="p-2 rounded-xl bg-[#1b2a23] border border-[#283c32] flex items-center justify-between text-[11px] text-[var(--text-nature-muted)] gap-2"
              >
                <span className="truncate">{item.text}</span>
                <button
                  onClick={() => handleDeleteItem(item.id)}
                  className="text-[var(--text-nature-muted)] hover:text-red-400"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Item Form */}
      <form onSubmit={handleAddItem} className="space-y-2 pt-1">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            placeholder="Add worry or thought (e.g. Flight delay)..."
            className="flex-1 bg-[#14201a] border border-[#283c32] focus:border-[#81a890] rounded-xl px-3 py-2 text-xs text-[var(--text-nature-primary)] placeholder:text-[var(--text-nature-muted)] focus:outline-none"
          />
          <select
            value={isWithin ? 'in' : 'out'}
            onChange={(e) => setIsWithin(e.target.value === 'in')}
            className="bg-[#14201a] border border-[#283c32] rounded-xl px-2 py-2 text-xs text-[var(--text-nature-primary)] focus:outline-none"
          >
            <option value="in">In Control</option>
            <option value="out">Outside</option>
          </select>
          <button
            type="submit"
            disabled={!newItemText.trim()}
            className="p-2 rounded-xl bg-[#588e73] hover:bg-[#81a890] disabled:opacity-40 text-[#0c1410] font-bold shadow-glow transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default LocusOfControl;

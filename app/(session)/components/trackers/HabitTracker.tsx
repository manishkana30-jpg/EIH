'use client';

import React, { useState, useEffect } from 'react';
import { Check, Plus, Trash2, Calendar } from 'lucide-react';

interface Habit {
  id: string;
  name: string;
  days: boolean[]; // 7 days (Mon-Sun)
}

const STORAGE_KEY = 'eih_habit_tracker_v2';
const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export const HabitTracker: React.FC = () => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [newHabitName, setNewHabitName] = useState<string>('');

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setHabits(JSON.parse(stored));
      } else {
        setHabits([
          { id: '1', name: 'Morning Sunlight (10m)', days: [true, true, false, true, false, false, false] },
          { id: '2', name: 'Physiological Sigh (3x)', days: [true, true, true, true, false, false, false] },
          { id: '3', name: 'Evening Offline Journal', days: [false, true, true, false, false, false, false] },
        ]);
      }
    } catch (_) {}
  }, []);

  const saveHabits = (updated: Habit[]) => {
    setHabits(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (_) {}
  };

  const toggleDay = (habitId: string, dayIndex: number) => {
    const updated = habits.map((h) => {
      if (h.id === habitId) {
        const nextDays = [...h.days];
        nextDays[dayIndex] = !nextDays[dayIndex];
        return { ...h, days: nextDays };
      }
      return h;
    });
    saveHabits(updated);
  };

  const addHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;

    const newHabit: Habit = {
      id: `hb-${Date.now()}`,
      name: newHabitName.trim(),
      days: [false, false, false, false, false, false, false],
    };

    saveHabits([...habits, newHabit]);
    setNewHabitName('');
  };

  const deleteHabit = (id: string) => {
    saveHabits(habits.filter((h) => h.id !== id));
  };

  return (
    <div className="p-5 rounded-3xl bg-[#1b2a23]/90 border border-[#283c32] space-y-4 text-left text-[var(--text-nature-primary)]">
      <div className="flex items-center justify-between border-b border-[#283c32] pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#588e73]/20 border border-[#588e73]/40 flex items-center justify-center text-[var(--accent-sage)]">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--text-nature-primary)]">
              Weekly Micro-Habit Streaks
            </h3>
            <p className="text-[11px] text-[var(--text-nature-secondary)]">
              Local weekly somatic tracking (Offline storage)
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#14201a] border border-[#283c32] text-[var(--accent-sage)]">
          {habits.length} Habits
        </span>
      </div>

      {/* Habits List */}
      <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
        {habits.map((habit) => (
          <div
            key={habit.id}
            className="p-3 rounded-2xl bg-[#14201a] border border-[#283c32] flex items-center justify-between gap-3"
          >
            <span className="text-xs font-semibold text-[var(--text-nature-primary)] truncate max-w-[140px]">
              {habit.name}
            </span>

            <div className="flex items-center gap-1">
              {habit.days.map((isDone, idx) => (
                <button
                  key={idx}
                  onClick={() => toggleDay(habit.id, idx)}
                  className={`w-6 h-6 rounded-lg border text-[10px] font-mono font-bold flex items-center justify-center transition-all ${
                    isDone
                      ? 'bg-[#588e73] border-[#81a890] text-[#0c1410] shadow-sm'
                      : 'bg-[#1b2a23] border-[#283c32] text-[var(--text-nature-muted)] hover:border-[#3d584a]'
                  }`}
                  title={`${DAYS[idx]}: ${isDone ? 'Completed' : 'Pending'}`}
                >
                  {isDone ? <Check className="w-3 h-3 stroke-[3]" /> : DAYS[idx]}
                </button>
              ))}

              <button
                onClick={() => deleteHabit(habit.id)}
                className="p-1 text-[var(--text-nature-muted)] hover:text-red-400 ml-1 transition-colors"
                title="Delete habit"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Habit Form */}
      <form onSubmit={addHabit} className="flex items-center gap-2 pt-1">
        <input
          type="text"
          value={newHabitName}
          onChange={(e) => setNewHabitName(e.target.value)}
          placeholder="New micro-habit (e.g. 5m Evening Stretch)..."
          className="flex-1 bg-[#14201a] border border-[#283c32] focus:border-[#81a890] rounded-xl px-3 py-2 text-xs text-[var(--text-nature-primary)] placeholder:text-[var(--text-nature-muted)] focus:outline-none"
        />
        <button
          type="submit"
          disabled={!newHabitName.trim()}
          className="px-3.5 py-2 rounded-xl bg-[#588e73] hover:bg-[#81a890] disabled:opacity-40 text-[#0c1410] font-bold text-xs shadow-glow transition-all flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add</span>
        </button>
      </form>
    </div>
  );
};

export default HabitTracker;

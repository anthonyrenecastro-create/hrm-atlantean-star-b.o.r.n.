import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Book, Plus, Calendar } from 'lucide-react';

interface JournalEntry {
  id: string;
  date: number;
  content: string;
  mood: string;
}

export const Journal: React.FC = () => {
  const [entries, setEntries] = useState<JournalEntry[]>(() => {
    const saved = localStorage.getItem('starborn_journal');
    return saved ? JSON.parse(saved) : [];
  });
  const [newEntry, setNewEntry] = useState('');

  const addEntry = () => {
    if (!newEntry.trim()) return;
    const entry: JournalEntry = {
      id: Date.now().toString(),
      date: Date.now(),
      content: newEntry,
      mood: 'neutral',
    };
    const updated = [entry, ...entries];
    setEntries(updated);
    localStorage.setItem('starborn_journal', JSON.stringify(updated));
    setNewEntry('');
  };

  return (
    <div className="flex flex-col h-full bg-black/20 rounded-3xl border border-white/10 overflow-hidden p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Book size={20} className="text-emerald-400" />
          <h2 className="text-lg font-medium text-white">Cognitive Journal</h2>
        </div>
      </div>

      <div className="mb-6">
        <textarea
          value={newEntry}
          onChange={(e) => setNewEntry(e.target.value)}
          placeholder="Record your thoughts for the manifold..."
          className="w-full h-32 bg-black/40 border border-white/10 rounded-2xl p-4 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors resize-none"
        />
        <button
          onClick={addEntry}
          className="mt-2 w-full bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-400 py-2 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2"
        >
          <Plus size={16} /> Save Entry
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar">
        {entries.map((entry) => (
          <motion.div
            key={entry.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white/5 border border-white/10 rounded-2xl p-4"
          >
            <div className="flex items-center gap-2 text-[10px] text-white/40 uppercase tracking-widest mb-2">
              <Calendar size={12} />
              {new Date(entry.date).toLocaleDateString()}
            </div>
            <p className="text-sm text-white/80 leading-relaxed">{entry.content}</p>
          </motion.div>
        ))}
        {entries.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-white/20">
            <Book size={48} className="mb-2 opacity-10" />
            <p className="text-sm italic">No entries yet. Start reflecting.</p>
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle2, 
  Circle, 
  Plus, 
  Trash2, 
  TrendingUp, 
  Calendar,
  ChevronRight,
  Target
} from 'lucide-react';
import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

export interface Milestone {
  id: string;
  text: string;
  completed: boolean;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  category: string;
  progress: number;
  milestones: Milestone[];
  createdAt: number;
  deadline?: number;
}

export const GoalTracker: React.FC = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newGoal, setNewGoal] = useState({ title: '', description: '', category: 'Personal' });

  // Load goals from local storage
  useEffect(() => {
    const saved = localStorage.getItem('starborn_goals');
    if (saved) setGoals(JSON.parse(saved));
  }, []);

  // Save goals to local storage
  useEffect(() => {
    localStorage.setItem('starborn_goals', JSON.stringify(goals));
  }, [goals]);

  const addGoal = () => {
    if (!newGoal.title) return;
    const goal: Goal = {
      id: uuidv4(),
      title: newGoal.title,
      description: newGoal.description,
      category: newGoal.category,
      progress: 0,
      milestones: [],
      createdAt: Date.now(),
    };
    setGoals([goal, ...goals]);
    setNewGoal({ title: '', description: '', category: 'Personal' });
    setIsAdding(false);
  };

  const toggleMilestone = (goalId: string, milestoneId: string) => {
    setGoals(goals.map(g => {
      if (g.id !== goalId) return g;
      const newMilestones = g.milestones.map(m => 
        m.id === milestoneId ? { ...m, completed: !m.completed } : m
      );
      const completedCount = newMilestones.filter(m => m.completed).length;
      const progress = newMilestones.length > 0 ? (completedCount / newMilestones.length) : 0;
      return { ...g, milestones: newMilestones, progress };
    }));
  };

  const addMilestone = (goalId: string, text: string) => {
    if (!text) return;
    setGoals(goals.map(g => {
      if (g.id !== goalId) return g;
      const newMilestones = [...g.milestones, { id: uuidv4(), text, completed: false }];
      const completedCount = newMilestones.filter(m => m.completed).length;
      const progress = (completedCount / newMilestones.length);
      return { ...g, milestones: newMilestones, progress };
    }));
  };

  const deleteGoal = (id: string) => {
    setGoals(goals.filter(g => g.id !== id));
  };

  return (
    <div className="flex flex-col h-full bg-black/20 rounded-3xl border border-white/10 overflow-hidden">
      <div className="p-6 border-b border-white/5 bg-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600/20 rounded-lg">
            <Target className="text-blue-400 w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-white/90">Mission Objectives</h3>
            <p className="text-[9px] text-white/30 uppercase tracking-widest">Active Goal Tracking</p>
          </div>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="p-2 bg-blue-600 hover:bg-blue-500 rounded-full transition-colors"
        >
          <Plus size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        <AnimatePresence>
          {isAdding && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white/5 p-4 rounded-2xl border border-blue-500/30 space-y-4"
            >
              <input 
                placeholder="Objective Title"
                value={newGoal.title}
                onChange={e => setNewGoal({...newGoal, title: e.target.value})}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm focus:border-blue-500 outline-none"
              />
              <textarea 
                placeholder="Description"
                value={newGoal.description}
                onChange={e => setNewGoal({...newGoal, description: e.target.value})}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm focus:border-blue-500 outline-none h-20 resize-none"
              />
              <div className="flex gap-2">
                <button onClick={addGoal} className="flex-1 bg-blue-600 py-2 rounded-xl text-xs font-bold uppercase tracking-widest">Initiate</button>
                <button onClick={() => setIsAdding(false)} className="flex-1 bg-white/5 py-2 rounded-xl text-xs font-bold uppercase tracking-widest">Abort</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {goals.length === 0 && !isAdding && (
          <div className="h-full flex flex-col items-center justify-center text-white/20 space-y-4 opacity-50">
            <Target size={48} strokeWidth={1} />
            <p className="text-xs uppercase tracking-[0.2em]">No active objectives</p>
          </div>
        )}

        {goals.map(goal => (
          <motion.div 
            layout
            key={goal.id}
            className="bg-white/5 rounded-2xl border border-white/10 p-5 space-y-4 group hover:border-white/20 transition-all"
          >
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[8px] font-mono text-blue-400 uppercase tracking-widest px-2 py-0.5 bg-blue-400/10 rounded-full border border-blue-400/20 mb-2 inline-block">
                  {goal.category}
                </span>
                <h4 className="text-sm font-bold text-white/90">{goal.title}</h4>
                <p className="text-xs text-white/40 mt-1">{goal.description}</p>
              </div>
              <button onClick={() => deleteGoal(goal.id)} className="p-2 text-white/20 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                <Trash2 size={14} />
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-mono text-white/40 uppercase">
                <span>Progress</span>
                <span>{(goal.progress * 100).toFixed(0)}%</span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                  initial={{ width: 0 }}
                  animate={{ width: `${goal.progress * 100}%` }}
                />
              </div>
            </div>

            <div className="space-y-2">
              {goal.milestones.map(m => (
                <div 
                  key={m.id} 
                  onClick={() => toggleMilestone(goal.id, m.id)}
                  className="flex items-center gap-3 cursor-pointer group/item"
                >
                  {m.completed ? (
                    <CheckCircle2 size={14} className="text-emerald-400" />
                  ) : (
                    <Circle size={14} className="text-white/20 group-hover/item:text-white/40" />
                  )}
                  <span className={`text-xs transition-colors ${m.completed ? 'text-white/30 line-through' : 'text-white/70'}`}>
                    {m.text}
                  </span>
                </div>
              ))}
              <div className="pt-2">
                <input 
                  placeholder="+ Add Milestone"
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      addMilestone(goal.id, e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                  className="w-full bg-transparent border-none text-[10px] text-white/30 focus:text-white/60 outline-none uppercase tracking-widest"
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

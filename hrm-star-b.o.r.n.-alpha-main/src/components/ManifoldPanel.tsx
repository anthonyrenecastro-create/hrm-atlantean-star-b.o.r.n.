import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { interpreterService } from '../lib/interpreterService';
import { HRMState } from '../lib/hrm-engine';
import { Activity, Zap, Layers, Network } from 'lucide-react';

export const ManifoldPanel: React.FC = () => {
  const [state, setState] = useState<HRMState | null>(null);
  const [history, setHistory] = useState<{ time: number; objective: number; chaos: number }[]>([]);
  const historyRef = useRef<{ time: number; objective: number; chaos: number }[]>([]);

  useEffect(() => {
    const unsubscribe = interpreterService.subscribeToState((newState) => {
      setState(newState);
      
      const newPoint = {
        time: Date.now(),
        objective: newState.metrics.objective,
        chaos: newState.metrics.chaosMetric
      };
      
      const updatedHistory = [...historyRef.current, newPoint].slice(-30);
      historyRef.current = updatedHistory;
      setHistory(updatedHistory);
    });

    return () => {
      // Assuming subscribeToState returns an unsubscribe function or we handle it via service
    };
  }, []);

  if (!state) return null;

  return (
    <div className="space-y-6">
      {/* Trajectory & Objective Analysis */}
      <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Activity className="text-blue-400 w-4 h-4" />
            <h3 className="text-xs font-mono uppercase tracking-[0.2em] text-white/70">Manifold Trajectory</h3>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-[9px] text-white/40 uppercase">Objective</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-[9px] text-white/40 uppercase">Chaos</span>
            </div>
          </div>
        </div>

        <div className="h-32 w-full">
          {history.length > 0 ? (
            <ResponsiveContainer width="100%" height={128}>
              <AreaChart data={history} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorObj" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorChaos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#000', border: '1px solid rgba(255,255,255,0.1)', fontSize: '10px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="objective" 
                  stroke="#3b82f6" 
                  fillOpacity={1} 
                  fill="url(#colorObj)" 
                  isAnimationActive={false}
                />
                <Area 
                  type="monotone" 
                  dataKey="chaos" 
                  stroke="#ef4444" 
                  fillOpacity={1} 
                  fill="url(#colorChaos)" 
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full w-full flex items-center justify-center text-[10px] text-white/10 uppercase tracking-widest">
              Awaiting Manifold Data...
            </div>
          )}
        </div>
      </div>

      {/* Topology Transitions */}
      <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6">
        <div className="flex items-center gap-2 mb-6">
          <Network className="text-emerald-400 w-4 h-4" />
          <h3 className="text-xs font-mono uppercase tracking-[0.2em] text-white/70">Topology Mapping</h3>
        </div>

        <div className="space-y-6">
          {/* Channels (12) */}
          <div className="space-y-2">
            <div className="flex justify-between text-[9px] text-white/30 uppercase tracking-widest">
              <span>Channels</span>
              <span className="text-emerald-400">CH-{state.channel}</span>
            </div>
            <div className="flex gap-1">
              {Array.from({ length: 12 }).map((_, i) => (
                <div 
                  key={i} 
                  className={`flex-1 h-1 rounded-full transition-all duration-500 ${
                    state.channel === i + 1 ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]' : 'bg-white/5'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Domains (22) */}
          <div className="space-y-2">
            <div className="flex justify-between text-[9px] text-white/30 uppercase tracking-widest">
              <span>Domains</span>
              <span className="text-blue-400">DM-{state.domain}</span>
            </div>
            <div className="flex gap-0.5">
              {Array.from({ length: 22 }).map((_, i) => (
                <div 
                  key={i} 
                  className={`flex-1 h-1 rounded-full transition-all duration-500 ${
                    state.domain === i + 1 ? 'bg-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.6)]' : 'bg-white/5'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Layers (14) */}
          <div className="space-y-2">
            <div className="flex justify-between text-[9px] text-white/30 uppercase tracking-widest">
              <span>Layers</span>
              <span className="text-purple-400">LY-{state.layer}</span>
            </div>
            <div className="flex gap-1">
              {Array.from({ length: 14 }).map((_, i) => (
                <div 
                  key={i} 
                  className={`flex-1 h-1 rounded-full transition-all duration-500 ${
                    state.layer === i + 1 ? 'bg-purple-400 shadow-[0_0_8px_rgba(167,139,250,0.6)]' : 'bg-white/5'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Guna Balance */}
      <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6">
        <div className="flex items-center gap-2 mb-6">
          <Zap className="text-yellow-400 w-4 h-4" />
          <h3 className="text-xs font-mono uppercase tracking-[0.2em] text-white/70">Guna Equilibrium</h3>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Sattva', val: state.guna.s, color: 'bg-blue-400', text: 'text-blue-400' },
            { label: 'Rajas', val: state.guna.r, color: 'bg-red-400', text: 'text-red-400' },
            { label: 'Tamas', val: state.guna.t, color: 'bg-white/40', text: 'text-white/40' },
          ].map((g) => (
            <div key={g.label} className="space-y-2">
              <div className="flex justify-between items-end">
                <span className={`text-[8px] uppercase tracking-widest ${g.text}`}>{g.label}</span>
                <span className="text-[10px] font-mono">{(g.val * 100).toFixed(0)}%</span>
              </div>
              <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  className={`h-full ${g.color}`}
                  animate={{ width: `${g.val * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

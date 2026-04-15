import React from 'react';
import { motion } from 'motion/react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';

interface GoldGemProps {
  traits: Record<string, number>;
  onTraitChange?: (trait: string, value: number) => void;
}

export const GoldGem: React.FC<GoldGemProps> = ({ traits, onTraitChange }) => {
  const data = Object.entries(traits).map(([key, value]) => ({
    subject: key.charAt(0).toUpperCase() + key.slice(1),
    A: (value as number) * 100,
    fullMark: 100,
  }));

  return (
    <div className="w-full h-full bg-black/40 rounded-3xl p-6 border border-yellow-500/30 shadow-[0_0_30px_rgba(234,179,8,0.1)] flex flex-col">
      <div className="mb-6">
        <h3 className="text-yellow-500 font-mono text-xs uppercase tracking-widest mb-1 text-center">
          Character Customization
        </h3>
        <p className="text-[9px] text-yellow-500/40 uppercase tracking-widest text-center">Neural Attribute Tuning</p>
      </div>
      
      <div className="flex-1 min-h-[200px] flex flex-col lg:flex-row gap-6">
        <div className="flex-1 min-h-[200px]">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
              <PolarGrid stroke="rgba(234,179,8,0.2)" />
              <PolarAngleAxis
                dataKey="subject"
                tick={{ fill: 'rgba(234,179,8,0.6)', fontSize: 8 }}
              />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
              <Radar
                name="Traits"
                dataKey="A"
                stroke="#eab308"
                fill="#eab308"
                fillOpacity={0.4}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
          {Object.entries(traits).map(([key, value]) => (
            <div key={key} className="bg-white/5 p-3 rounded-xl border border-white/5 hover:border-yellow-500/30 transition-colors group">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-bold text-yellow-500/70 uppercase tracking-wider group-hover:text-yellow-500 transition-colors">{key}</span>
                <span className="text-[10px] font-mono text-yellow-500/50">LVL {((value as number) * 100).toFixed(0)}</span>
              </div>
              <div className="relative h-1.5 bg-black/40 rounded-full overflow-hidden">
                <motion.div 
                  className="absolute inset-y-0 left-0 bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]"
                  initial={{ width: 0 }}
                  animate={{ width: `${(value as number) * 100}%` }}
                />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={value as number}
                  onChange={(e) => onTraitChange?.(key, parseFloat(e.target.value))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

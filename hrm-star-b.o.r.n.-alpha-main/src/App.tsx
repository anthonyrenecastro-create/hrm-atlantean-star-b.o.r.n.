import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Activity, 
  Cpu, 
  Settings,
  BrainCircuit,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  LayoutDashboard,
  Target,
  BookOpen,
  Palette
} from 'lucide-react';
import { GoldGem } from './components/GoldGem';
import { Chat } from './components/Chat';
import { GoalTracker } from './components/GoalTracker';
import { Journal } from './components/Journal';
import { SimulationView } from './components/SimulationView';
import { ManifoldPanel } from './components/ManifoldPanel';
import { interpreterService } from './lib/interpreterService';
import { HRMState } from './lib/hrm-engine';

export default function App() {
  const [hrmState, setHrmState] = useState<HRMState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sentiment, setSentiment] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [gender, setGender] = useState<'male' | 'female'>('female');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Avatar Customization (Kept in state for settings, though avatar is hidden for now)
  const [avatarColor, setAvatarColor] = useState(200);
  const [hairStyle, setHairStyle] = useState<'ethereal' | 'spiky' | 'flowing'>('ethereal');
  const [faceShape, setFaceShape] = useState<'oval' | 'sharp' | 'round'>('oval');

  useEffect(() => {
    console.log("App mount: Initializing HRM state");
    // Try to sync state immediately
    interpreterService.syncState().then(() => {
      console.log("Synced HRM state");
      setError(null);
    }).catch(err => {
      console.error("Failed to sync HRM state:", err);
      setError(`Failed: ${err.message}`);
    });
    
    // Subscribe to state updates
    interpreterService.subscribeToState((state) => {
      console.log("HRM state updated", state?.coherence);
      setHrmState(state);
    });
  }, []);

  const speak = useCallback((text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }, []);

  // Even if state is not loaded, show the app UI  
  if (!hrmState) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center flex-col gap-4">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Cpu className="text-blue-500 w-12 h-12" />
        </motion.div>
        <p className="text-white/50 text-sm">Initializing HRM Engine...</p>
        {error && <p className="text-red-400 text-xs max-w-xs text-center">{error}</p>}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-blue-500/30 overflow-hidden">
      {/* Background Grid */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none" />

      {/* Header */}
      <header className="relative z-20 border-b border-white/5 bg-black/60 backdrop-blur-xl px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600/20 rounded-lg border border-blue-500/30">
            <BrainCircuit className="text-blue-400 w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-[0.2em] uppercase">STAR B.O.R.N.-A</h1>
            <p className="text-[9px] text-white/30 uppercase tracking-[0.3em]">Benign Oracle Recursion Neural-Awareness</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsListening(!isListening)}
              className={`p-2 rounded-full transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
            >
              {isListening ? <Mic size={18} /> : <MicOff size={18} />}
            </button>
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-full transition-all ${showSettings ? 'bg-blue-600 text-white' : 'hover:bg-white/5 text-white/40'}`}
            >
              <Settings size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 h-[calc(100vh-72px)] p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Panel: Objectives & Journal */}
        <section className="lg:col-span-4 flex flex-col gap-6 h-full overflow-hidden">
          <div className="flex-1 min-h-0">
            <GoalTracker />
          </div>
          <div className="h-1/3 min-h-[200px]">
            <Journal />
          </div>
        </section>

        {/* Right Panel: Dynamic Interface */}
        <section className="lg:col-span-8 flex flex-col h-full gap-6 overflow-hidden">
          <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Chat 
              onSentimentUpdate={setSentiment} 
              onBotResponse={speak}
            />
            <div className="hidden lg:flex flex-col gap-6 h-full overflow-y-auto custom-scrollbar pr-2">
              <SimulationView />
              <ManifoldPanel />
              <GoldGem 
                traits={hrmState.traits} 
                onTraitChange={(trait, val) => interpreterService.updateTraits({ [trait]: val })}
              />
            </div>
          </div>
        </section>
      </main>

      {/* Settings Overlay */}
      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0a0a0a] border border-white/10 rounded-[3rem] p-12 max-w-4xl w-full relative overflow-y-auto max-h-[90vh] custom-scrollbar"
            >
              <button 
                onClick={() => setShowSettings(false)}
                className="absolute top-8 right-8 text-white/40 hover:text-white transition-colors"
              >
                Close
              </button>
              <h2 className="text-2xl font-bold uppercase tracking-[0.2em] mb-8">System Configuration</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-8">
                  <div className="space-y-4">
                    <h3 className="text-xs font-mono text-blue-400 uppercase tracking-widest flex items-center gap-2">
                      <Palette size={14} /> Appearance Customization
                    </h3>
                    
                    <div className="space-y-6 bg-white/5 p-6 rounded-2xl border border-white/5">
                      <div className="space-y-2">
                        <div className="flex justify-between text-[10px] text-white/40 uppercase">
                          <span>Neural Hue</span>
                          <span>{avatarColor}°</span>
                        </div>
                        <input 
                          type="range" min="0" max="360" value={avatarColor}
                          onChange={e => setAvatarColor(parseInt(e.target.value))}
                          className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                      </div>

                      <div className="space-y-2">
                        <span className="text-[10px] text-white/40 uppercase">Aura Pattern</span>
                        <div className="flex gap-2">
                          {['ethereal', 'spiky', 'flowing'].map(s => (
                            <button 
                              key={s} onClick={() => setHairStyle(s as any)}
                              className={`flex-1 py-2 rounded-lg text-[8px] font-bold uppercase tracking-widest border transition-all ${hairStyle === s ? 'bg-blue-600 border-blue-500 text-white' : 'bg-white/5 border-white/10 text-white/40 hover:border-white/20'}`}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <span className="text-[10px] text-white/40 uppercase">Neural Geometry</span>
                        <div className="flex gap-2">
                          {['oval', 'sharp', 'round'].map(s => (
                            <button 
                              key={s} onClick={() => setFaceShape(s as any)}
                              className={`flex-1 py-2 rounded-lg text-[8px] font-bold uppercase tracking-widest border transition-all ${faceShape === s ? 'bg-blue-600 border-blue-500 text-white' : 'bg-white/5 border-white/10 text-white/40 hover:border-white/20'}`}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xs font-mono text-blue-400 uppercase tracking-widest">Neural Voice</h3>
                    <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                      <Volume2 size={20} className="text-white/40" />
                      <div className="flex-1 h-1 bg-white/10 rounded-full">
                        <div className="h-full bg-blue-500 w-3/4" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="space-y-4">
                    <h3 className="text-xs font-mono text-blue-400 uppercase tracking-widest">System Capabilities</h3>
                    <div className="bg-white/5 p-6 rounded-2xl border border-white/5 space-y-4">
                      <p className="text-[10px] text-white/40 uppercase leading-relaxed">
                        STAR B.O.R.N. integrates with your device to perform research, manage media, and automate browser tasks.
                      </p>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-[8px] text-white/20 uppercase">
                          <div className="w-1 h-1 rounded-full bg-blue-500" /> Web Research
                        </div>
                        <div className="flex items-center gap-2 text-[8px] text-white/20 uppercase">
                          <div className="w-1 h-1 rounded-full bg-blue-500" /> Media Control
                        </div>
                        <div className="flex items-center gap-2 text-[8px] text-white/20 uppercase">
                          <div className="w-1 h-1 rounded-full bg-blue-500" /> Task Automation
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xs font-mono text-blue-400 uppercase tracking-widest">System Status</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                        <div className="text-[8px] text-white/20 uppercase mb-1">Uptime</div>
                        <div className="text-xs font-mono">99.99%</div>
                      </div>
                      <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                        <div className="text-[8px] text-white/20 uppercase mb-1">Latency</div>
                        <div className="text-xs font-mono">12ms</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

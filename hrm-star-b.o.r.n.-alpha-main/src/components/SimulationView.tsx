import React, { useEffect, useState, useRef } from "react";
import { interpreterService } from "../lib/interpreterService";
import type { HRMState } from "../lib/hrm-engine";
import { motion } from "motion/react";

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

const FieldCanvas: React.FC<{ state: HRMState }> = ({ state }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { matter, gauge, ameterasu } = state.fields;
    const rows = matter.length;
    const cols = matter[0].length;
    
    const imageData = ctx.createImageData(canvas.width, canvas.height);
    const data = imageData.data;

    const hueShift = state.theta * 360;
    const time = Date.now() * 0.0005;

    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const gridY = Math.floor((y / canvas.height) * rows);
        const gridX = Math.floor((x / canvas.width) * cols);

        // Field values with interference patterns
        const m = matter[gridY][gridX] + Math.sin(x * 0.1 + time * 2) * 0.05;
        const g = gauge[gridY][gridX] + Math.cos(y * 0.1 - time * 1.5) * 0.05;
        const a = ameterasu[gridY][gridX] + Math.sin((x + y) * 0.05 + time) * 0.05;

        const idx = (y * canvas.width + x) * 4;
        
        // High-fidelity color mapping
        // Matter (Blue/Cyan) -> Coherence
        // Gauge (Red/Magenta) -> Activity
        // Ameterasu (Green/Yellow) -> Syntropy
        
        const r = clamp(Math.abs(g) * 255 * 3, 0, 255);
        const g_val = clamp(Math.abs(a) * 255 * 2.5, 0, 255);
        const b = clamp(Math.abs(m) * 255 * 4, 0, 255);

        data[idx] = r;
        data[idx + 1] = g_val;
        data[idx + 2] = b;
        data[idx + 3] = 255;
      }
    }

    ctx.putImageData(imageData, 0, 0);
    
    // Atmospheric overlays
    ctx.globalCompositeOperation = "screen";
    
    // 1. Phase Pulse
    const pulse = Math.sin(state.theta * Math.PI * 2) * 0.5 + 0.5;
    const gradient = ctx.createRadialGradient(
      canvas.width / 2, canvas.height / 2, 0,
      canvas.width / 2, canvas.height / 2, canvas.width / (1.2 + pulse * 0.3)
    );
    gradient.addColorStop(0, `hsla(${hueShift}, 90%, 60%, ${0.2 + state.coherence * 0.15})`);
    gradient.addColorStop(1, "transparent");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Geometric Topology Web
    ctx.strokeStyle = `hsla(${(hueShift + 120) % 360}, 100%, 80%, 0.15)`;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    
    const points = state.stateVector.map((v, i) => {
      const angle = (i / 24) * Math.PI * 2 + time * 0.5;
      const r = 50 + v * 40;
      return {
        x: canvas.width / 2 + Math.cos(angle) * r,
        y: canvas.height / 2 + Math.sin(angle) * r
      };
    });

    // Draw primary hull
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.closePath();
    ctx.stroke();

    // Draw cross-couplings (neural web)
    ctx.strokeStyle = `hsla(${(hueShift + 240) % 360}, 100%, 70%, 0.03)`;
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        const dist = Math.hypot(points[i].x - points[j].x, points[i].y - points[j].y);
        if (dist < 80) {
          ctx.beginPath();
          ctx.moveTo(points[i].x, points[i].y);
          ctx.lineTo(points[j].x, points[j].y);
          ctx.stroke();
        }
      }
    }

  }, [state]);

  return (
    <div className="relative w-full aspect-square rounded-2xl overflow-hidden border border-white/10 bg-black shadow-[0_0_60px_rgba(0,0,0,0.8)] group">
      <canvas 
        ref={canvasRef} 
        width={300} 
        height={300} 
        className="w-full h-full image-render-pixelated opacity-95 transition-all duration-700 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)] pointer-events-none" />
      
      <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/40 backdrop-blur-md px-2 py-1 rounded-full border border-white/5">
        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
        <span className="text-[8px] font-mono text-white/60 uppercase tracking-[0.2em]">Manifold Core</span>
      </div>

      <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
        <div className="flex flex-col gap-1">
          <div className="text-[8px] font-mono text-white/40 uppercase tracking-widest flex items-center gap-2">
            <div className="w-2 h-[1px] bg-white/20" />
            Field Dynamics
          </div>
          <div className="flex gap-3 items-center">
            <div className="flex items-center gap-1">
              <div className="w-1 h-1 rounded-full bg-blue-500 shadow-[0_0_5px_rgba(59,130,246,0.5)]" />
              <span className="text-[6px] text-white/30 font-mono">MAT</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-1 h-1 rounded-full bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.5)]" />
              <span className="text-[6px] text-white/30 font-mono">GAU</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-1 h-1 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]" />
              <span className="text-[6px] text-white/30 font-mono">AME</span>
            </div>
          </div>
        </div>
        <div className="text-[8px] font-mono text-white/20 uppercase tracking-tighter">
          Topology: {state.channel}.{state.domain}.{state.layer}
        </div>
      </div>
    </div>
  );
};

export const SimulationView: React.FC = () => {
  const [state, setState] = useState<HRMState | null>(null);

  useEffect(() => {
    interpreterService.subscribeToState(setState);
    interpreterService.syncState().catch(console.error);
  }, []);

  if (!state) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-3xl p-6 text-white/50">
        Synchronizing manifold state...
      </div>
    );
  }

  const metrics = [
    ["Coh", state.coherence.toFixed(2)],
    ["Sta", state.stability.toFixed(2)],
    ["Opt", state.optimization.toFixed(2)],
    ["Fra", state.fractalDepth.toFixed(2)],
    ["Pre", state.precision.toFixed(2)],
    ["Obj", state.metrics.objective.toFixed(2)],
  ];

  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-4 text-white space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-[10px] uppercase tracking-[0.3em] text-blue-400 font-bold">HRM Manifold</h2>
          <p className="text-[8px] text-white/30 uppercase tracking-widest">Neural Field Visualization</p>
        </div>
        <div className="text-[10px] font-mono text-white/20">
          T: {state.theta.toFixed(3)}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Left: Visualization */}
        <div className="space-y-3">
          <FieldCanvas state={state} />
          
          <div className="grid grid-cols-3 gap-1">
            <div className="bg-white/5 border border-white/5 rounded-lg p-1.5 text-center">
              <div className="text-[7px] text-white/30 uppercase">S</div>
              <div className="text-[10px] font-mono">{state.guna.s.toFixed(2)}</div>
            </div>
            <div className="bg-white/5 border border-white/5 rounded-lg p-1.5 text-center">
              <div className="text-[7px] text-white/30 uppercase">R</div>
              <div className="text-[10px] font-mono">{state.guna.r.toFixed(2)}</div>
            </div>
            <div className="bg-white/5 border border-white/5 rounded-lg p-1.5 text-center">
              <div className="text-[7px] text-white/30 uppercase">T</div>
              <div className="text-[10px] font-mono">{state.guna.t.toFixed(2)}</div>
            </div>
          </div>
        </div>

        {/* Right: Compact Metrics */}
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-2 gap-2">
            {metrics.map(([k, v]) => (
              <div key={k} className="rounded-xl border border-white/5 bg-white/5 p-2">
                <div className="text-[8px] uppercase tracking-widest text-white/30">{k}</div>
                <div className="text-xs font-mono mt-0.5">{v}</div>
              </div>
            ))}
          </div>

          <div className="flex-1 bg-white/[0.02] border border-white/5 rounded-xl p-3 space-y-2">
            <div className="text-[8px] uppercase tracking-widest text-white/30">Topology</div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-[9px] font-mono">
                <span className="text-white/40">CH</span>
                <span>{state.channel}</span>
              </div>
              <div className="flex justify-between text-[9px] font-mono">
                <span className="text-white/40">DM</span>
                <span>{state.domain}</span>
              </div>
              <div className="flex justify-between text-[9px] font-mono">
                <span className="text-white/40">LY</span>
                <span>{state.layer}</span>
              </div>
            </div>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-2">
            <div className="text-[7px] uppercase tracking-widest text-blue-400 mb-1">Vector Core</div>
            <div className="flex flex-wrap gap-0.5">
              {state.stateVector.slice(0, 12).map((v, i) => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-blue-400/40" style={{ opacity: Math.abs(v) }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


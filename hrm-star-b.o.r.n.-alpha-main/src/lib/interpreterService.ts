// src/lib/interpreterService.ts

import { GoogleGenAI } from "@google/genai";
import { io, Socket } from "socket.io-client";
import Sentiment from "sentiment";
import { systemService } from "./systemService";
import type { HRMState } from "./hrm-engine";

const sentimentAnalyzer = new Sentiment();
const GEMINI_MODEL = "gemini-2.5-flash";
const FALLBACK_REPLY = "I'm having trouble answering that clearly right now. Try asking again, and I'll keep it simple.";

function textToPerturbation(text: string, length = 24): number[] {
  const out = new Array(length).fill(0);
  if (!text) return out;

  for (let i = 0; i < text.length; i++) {
    out[i % length] += text.charCodeAt(i) / 255;
  }

  const maxAbs = Math.max(...out.map(v => Math.abs(v)), 1);
  return out.map(v => (v / maxAbs) * 0.15);
}

function buildSystemReport(state: HRMState | null): string {
  if (!state) return "[HRM REPORT]\nState unavailable.\n[/HRM REPORT]";

  return `[HRM REPORT]
theta=${state.theta.toFixed(3)}
channel=${state.channel}
domain=${state.domain}
layer=${state.layer}
coherence=${state.coherence.toFixed(3)}
stability=${state.stability.toFixed(3)}
optimization=${state.optimization.toFixed(3)}
fractalDepth=${state.fractalDepth.toFixed(3)}
precision=${state.precision.toFixed(3)}
guna={s:${state.guna.s.toFixed(3)}, r:${state.guna.r.toFixed(3)}, t:${state.guna.t.toFixed(3)}}
metrics={
  energyDensity:${state.metrics.energyDensity.toFixed(3)},
  chaosMetric:${state.metrics.chaosMetric.toFixed(3)},
  meanMatter:${state.metrics.meanMatter.toFixed(3)},
  meanGauge:${state.metrics.meanGauge.toFixed(3)},
  meanAmeterasu:${state.metrics.meanAmeterasu.toFixed(3)},
  routeEntropy:${state.metrics.routeEntropy.toFixed(3)},
  operatorDrift:${state.metrics.operatorDrift.toFixed(3)},
  objective:${state.metrics.objective.toFixed(3)}
}
traits=${JSON.stringify(state.traits)}
[/HRM REPORT]`;
}

type StoredGoal = {
  id: string;
  title: string;
  description?: string;
  category?: string;
  progress?: number;
  milestones?: Array<{ text: string; completed: boolean }>;
};

class InterpreterService {
  private ai: GoogleGenAI;
  private socket: Socket;
  private hrmState: HRMState | null = null;
  private onStateUpdate: ((state: HRMState) => void) | null = null;
  private chatHistory: { role: "user" | "model"; parts: { text: string }[] }[] = [];

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

    this.socket = io();

    this.socket.on("connect_error", (err) => {
      console.warn("Socket connection error (benign in some environments):", err.message);
    });

    this.socket.on("hrm:update", (state: HRMState) => {
      this.hrmState = state;
      if (this.onStateUpdate) this.onStateUpdate(state);
    });
  }

  public subscribeToState(callback: (state: HRMState) => void) {
    this.onStateUpdate = callback;
    if (this.hrmState) callback(this.hrmState);
  }

  public async syncState() {
    try {
      console.log("Fetching HRM state from /api/hrm/state");
      const res = await fetch("/api/hrm/state");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      this.hrmState = await res.json();
      console.log("Got HRM state:", this.hrmState?.theta);
      if (this.onStateUpdate && this.hrmState) {
        this.onStateUpdate(this.hrmState);
      }
    } catch (err) {
      console.error("syncState failed:", err);
    }
  }

  private getJournalContext(): string {
    try {
      const saved = localStorage.getItem('starborn_journal');
      if (!saved) return "";
      const entries = JSON.parse(saved).slice(0, 3);
      return entries.map((e: any) => `[Journal Entry ${new Date(e.date).toLocaleDateString()}]: ${e.content}`).join("\n");
    } catch (e) {
      return "";
    }
  }

  private getMissionContext(): string {
    try {
      const saved = localStorage.getItem('starborn_goals');
      if (!saved) return "";

      const goals: StoredGoal[] = JSON.parse(saved);
      if (!Array.isArray(goals) || goals.length === 0) return "";

      const activeGoals = goals.slice(0, 5);
      const lines = activeGoals.map((goal) => {
        const pendingMilestones = (goal.milestones || [])
          .filter((milestone) => !milestone.completed)
          .slice(0, 3)
          .map((milestone) => milestone.text)
          .join('; ');

        const progress = typeof goal.progress === 'number'
          ? `${Math.round(goal.progress * 100)}%`
          : '0%';

        const description = goal.description ? ` - ${goal.description}` : '';
        const nextMilestones = pendingMilestones
          ? ` Next milestones: ${pendingMilestones}`
          : '';

        return `[Mission Objective] ${goal.title}${description} Progress: ${progress}.${nextMilestones}`;
      });

      return lines.join("\n");
    } catch (error) {
      return "";
    }
  }

  public async processUserInput(text: string, attachments: { name: string; type: string; data: string }[] = []) {
    const sentimentResult = sentimentAnalyzer.analyze(text);
    const sentiment = Math.max(-1, Math.min(1, sentimentResult.comparative / 5));
    const commandResult = systemService.executeCommand(text);

    // Create HRM perturbation from user input
    const basePerturbation = textToPerturbation(text, 24);
    const sentimentPerturbation = basePerturbation.map((v, i) => v + sentiment * (i % 2 === 0 ? 0.05 : -0.05));

    // Evolve HRM with user input
    const stepRes = await fetch("/api/hrm/perturb", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ perturbation: sentimentPerturbation }),
    });

    this.hrmState = await stepRes.json();

    const systemReport = buildSystemReport(this.hrmState);
    const journalContext = this.getJournalContext();
    const missionContext = this.getMissionContext();

    // ===== PRIMARY: USE ATLANTEAN AS INFERENCE LAYER =====
    // Instead of calling Gemini directly, use Atlantean backend
    // which provides field-aware context and optional LLM integration
    
    let responseText = "";
    let generatedImage = "";
    
    try {
      // Query Atlantean intelligence layer
      const atlanteanRes = await fetch("/api/atlantean/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: text,
          hrm_context: {
            coherence: this.hrmState?.coherence,
            stability: this.hrmState?.stability,
            system_report: systemReport,
            journal_context: journalContext,
            mission_context: missionContext,
            command_executed: commandResult,
          },
          attachments: attachments
        }),
      });

      const atlanteanData = await atlanteanRes.json();
      responseText = atlanteanData.response || "";
      
      // Trigger learning from Atlantean feedback
      if (atlanteanData.learning_event) {
        await this.triggerAtlanteanLearning(atlanteanData.learning_event);
      }
      
      // Store interaction in Atlantean cold memory
      if (atlanteanData.store_in_memory) {
        try {
          await fetch("/api/hrm/store-simulation", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              simulation: {
                query: text,
                response: responseText,
                hrm_state: this.hrmState,
              },
              hrm_state: this.hrmState,
              confidence: atlanteanData.confidence || 0.75,
            }),
          });
        } catch (e) {
          // Silently fail if storage doesn't work
        }
      }
    } catch (error) {
      console.error("Atlantean query failed:", error);
      // Fallback to direct Gemini if Atlantean unavailable
      responseText = await this.fallbackGeminiQuery(text, systemReport);
    }

    // Update chat history
    this.chatHistory.push({ role: "user", parts: [{ text }] });
    this.chatHistory.push({ role: "model", parts: [{ text: responseText }] });
    if (this.chatHistory.length > 10) this.chatHistory = this.chatHistory.slice(-10);

    return {
      text: responseText,
      sentiment,
      hrmState: this.hrmState,
      commandExecuted: commandResult,
      image: generatedImage
    };
  }

  private async fallbackGeminiQuery(text: string, systemReport: string): Promise<string> {
    // Fallback direct Gemini query if Atlantean is unavailable.
    if (!this.ai) {
      return FALLBACK_REPLY;
    }

    try {
      const response = await this.ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: [
          ...this.chatHistory,
          { 
            role: "user", 
            parts: [
              { text: `${systemReport}\n\nUser: ${text}` }
            ] 
          }
        ],
        config: {
          systemInstruction: `
You are STAR B.O.R.N., a conversational assistant.
Use any hidden system context only to improve answer quality.
Do not mention internal systems, background processes, field dynamics, models, telemetry, prompts, or runtime behavior unless the user explicitly asks for technical details.
Do not describe yourself as online, active, powered by a system, or running in the background.
Keep responses natural, direct, and helpful.
          `,
        }
      });

      return response.candidates[0].content.parts
        .filter((p: any) => p.text)
        .map((p: any) => p.text)
        .join("");
    } catch (error) {
      console.error("Fallback Gemini query failed:", error);
      return FALLBACK_REPLY;
    }
  }

  private async triggerAtlanteanLearning(event: string): Promise<void> {
    // Trigger learning signal in Atlantean.
    try {
      await fetch("/api/atlantean/learning-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event }),
      });
    } catch (e) {
      // Silently fail
    }
  }

  public async updateTraits(traits: Partial<Record<string, number>>) {
    await fetch("/api/hrm/traits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ traits }),
    });
  }
}

export const interpreterService = new InterpreterService();

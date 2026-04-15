import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { HRMEngine } from "./src/lib/hrm-engine.ts";
import { GoogleGenAI } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, ".env.local") });
dotenv.config({ path: path.resolve(__dirname, ".env") });

function hasUsableApiKey(apiKey?: string): apiKey is string {
  return Boolean(apiKey && apiKey !== "PLACEHOLDER_API_KEY");
}

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const REQUEST_BODY_LIMIT = process.env.REQUEST_BODY_LIMIT || "10mb";
const DEFAULT_SESSION_ID = process.env.DEFAULT_SESSION_ID || "default";

// Initialize Gemini AI
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
let genai: GoogleGenAI | null = null;
if (hasUsableApiKey(GEMINI_API_KEY)) {
  genai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  console.log("✅ Gemini API configured");
} else {
  console.log("⚠️  No Gemini API key found - using mock responses");
}

// Atlantean backend URL
const ATLANTEAN_BACKEND_URL = process.env.ATLANTEAN_BACKEND_URL || "http://localhost:5001";

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
    },
  });

  const hrm = new HRMEngine();

  app.use(express.json({ limit: REQUEST_BODY_LIMIT }));
  app.use(express.urlencoded({ extended: true, limit: REQUEST_BODY_LIMIT }));

  const resolveSessionId = (req: any, explicitSessionId?: string) => {
    return explicitSessionId || req.session?.id || DEFAULT_SESSION_ID;
  };

  // API Routes
  app.get("/api/hrm/state", (req, res) => {
    res.json(hrm.getState());
  });

  app.post("/api/hrm/perturb", (req, res) => {
    const { perturbation } = req.body;
    const newState = hrm.evolve(perturbation);
    io.emit("hrm:update", newState);
    res.json(newState);
  });

  app.post("/api/hrm/traits", (req, res) => {
    const { traits } = req.body;
    hrm.updateTraits(traits);
    const newState = hrm.getState();
    io.emit("hrm:update", newState);
    res.json(newState);
  });

  // Socket.io for real-time simulation
  io.on("connection", (socket) => {
    console.log("Client connected to HRM simulation");
    socket.emit("hrm:update", hrm.getState());

    socket.on("hrm:sync", () => {
      socket.emit("hrm:update", hrm.getState());
    });
  });

  // Continuous simulation loop (background)
  // BIDIRECTIONAL INTEGRATION: HRM ↔ Atlantean
  let evolveCounter = 0;
  setInterval(() => {
    const newState = hrm.evolve();
    
    // SYNC 1: Send HRM state to Atlantean hot memory
    // This keeps Atlantean fields in sync with HRM evolution
    (async () => {
      try {
        await proxyToAtlantean("/api/atlantean/sync/hrm-state", "POST", {
          hrm_state: newState,
          session_id: "default",
        });
      } catch (error) {
        // Silently fail - Atlantean being down shouldn't break HRM
      }
    })();
    
    // SYNC 2: Periodically request Atlantean field influence (every 5 steps)
    if (evolveCounter % 5 === 0) {
      (async () => {
        try {
          const influenceRes = await proxyToAtlantean(
            `/api/atlantean/hrm-influence?session_id=default`
          );
          
          if (influenceRes?.perturbation) {
            // Apply Atlantean field influence to HRM state
            hrm.applyAtlanteanInfluence(influenceRes.perturbation);
          }
        } catch (error) {
          // Silently fail
        }
      })();
    }
    
    // SYNC 3: Auto-store significant simulations (every 20 steps)
    if (evolveCounter % 20 === 0) {
      const simulation = hrm.captureSimulation();
      (async () => {
        try {
          await proxyToAtlantean("/api/atlantean/store-hrm-simulation", "POST", {
            simulation,
            hrm_state: newState,
            confidence: 0.75,
            session_id: "default",
          });
        } catch (error) {
          // Silently fail
        }
      })();
    }
    
    evolveCounter++;
    io.emit("hrm:update", newState);
  }, 1000);

  // ========== Atlantean Intelligence Integration ==========

  // Proxy to Atlantean backend
  async function proxyToAtlantean(
    endpoint: string,
    method: string = "GET",
    body?: any
  ) {
    try {
      const url = `${ATLANTEAN_BACKEND_URL}${endpoint}`;
      const options: any = {
        method,
        headers: { "Content-Type": "application/json" },
      };
      if (body) {
        options.body = JSON.stringify(body);
      }
      const response = await fetch(url, options);
      return await response.json();
    } catch (error) {
      console.error(`Atlantean proxy error: ${error}`);
      return { error: "Failed to reach Atlantean backend" };
    }
  }

  // Get Atlantean status
  app.get("/api/atlantean/status", async (req, res) => {
    const sessionId = resolveSessionId(req, req.query.session_id as string | undefined);
    const result = await proxyToAtlantean(
      `/api/atlantean/status?session_id=${sessionId}`
    );
    res.json(result);
  });

  // Query Atlantean with Gemini
  app.post("/api/atlantean/query", async (req, res) => {
    const { input, sessionId, hrm_context, attachments } = req.body;
    if (!input) {
      return res.status(400).json({ error: "No input provided" });
    }

    const body: Record<string, unknown> = {
      input,
      session_id: resolveSessionId(req, sessionId),
    };

    if (hrm_context && typeof hrm_context === "object") {
      body.hrm_context = hrm_context;
    }

    if (Array.isArray(attachments) && attachments.length > 0) {
      body.attachments = attachments;
    }

    if (hasUsableApiKey(GEMINI_API_KEY)) {
      body.llm_provider = "gemini";
      body.api_key = GEMINI_API_KEY;
    }

    const result = await proxyToAtlantean("/api/atlantean/query", "POST", body);
    res.json(result);
  });

  // Get field visualization
  app.get("/api/atlantean/fields", async (req, res) => {
    const sessionId = resolveSessionId(req, req.query.session_id as string | undefined);
    const result = await proxyToAtlantean(
      `/api/atlantean/fields?session_id=${sessionId}`
    );
    res.json(result);
  });

  // Learning event
  app.post("/api/atlantean/learning-event", async (req, res) => {
    const { event, data } = req.body;
    const body = {
      event,
      data,
      session_id: resolveSessionId(req),
    };
    const result = await proxyToAtlantean(
      "/api/atlantean/learning-event",
      "POST",
      body
    );
    res.json(result);
  });

  // Store simulation
  app.post("/api/atlantean/simulation/store", async (req, res) => {
    const { simulation, confidence } = req.body;
    const body = {
      simulation,
      confidence: confidence || 0.5,
      session_id: resolveSessionId(req),
    };
    const result = await proxyToAtlantean(
      "/api/atlantean/simulation/store",
      "POST",
      body
    );
    res.json(result);
  });

  // Recall simulations
  app.post("/api/atlantean/simulation/recall", async (req, res) => {
    const { query, limit } = req.body;
    const body = {
      query: query || "",
      limit: limit || 10,
      session_id: resolveSessionId(req),
    };
    const result = await proxyToAtlantean(
      "/api/atlantean/simulation/recall",
      "POST",
      body
    );
    res.json(result);
  });

  // Create snapshot
  app.post("/api/atlantean/snapshot", async (req, res) => {
    const { label } = req.body;
    const body = {
      label,
      session_id: resolveSessionId(req),
    };
    const result = await proxyToAtlantean(
      "/api/atlantean/snapshot",
      "POST",
      body
    );
    res.json(result);
  });

  // ========== HRM ↔ Atlantean Bidirectional Sync ==========

  // Sync HRM state → Atlantean hot memory
  app.post("/api/hrm/sync/atlantean-state", async (req, res) => {
    const { hrm_state, session_id } = req.body;
    const result = await proxyToAtlantean(
      "/api/atlantean/sync/hrm-state",
      "POST",
      {
        hrm_state,
        session_id: session_id || req.session?.id,
      }
    );
    res.json(result || { success: true });
  });

  // Get Atlantean field influence on HRM evolution
  app.get("/api/hrm/atlantean-influence", async (req, res) => {
    const sessionId = req.query.session_id || req.session?.id;
    const result = await proxyToAtlantean(
      `/api/atlantean/hrm-influence?session_id=${sessionId}`
    );
    res.json(result || { perturbation: new Array(24).fill(0) });
  });

  // Auto-store HRM simulation → Atlantean cold memory
  app.post("/api/hrm/store-simulation", async (req, res) => {
    const { simulation, hrm_state, confidence, session_id } = req.body;
    const result = await proxyToAtlantean(
      "/api/atlantean/store-hrm-simulation",
      "POST",
      {
        simulation,
        hrm_state,
        confidence: confidence || 0.75,
        session_id: resolveSessionId(req, session_id),
      }
    );
    res.json(result || { success: true });
  });

  // Get unified HRM + Atlantean state
  app.get("/api/hrm/unified-state", async (req, res) => {
    const sessionId = resolveSessionId(req, req.query.session_id as string | undefined);
    const result = await proxyToAtlantean(
      `/api/atlantean/unified-state?session_id=${sessionId}`
    );
    res.json(result || {});
  });

  // Gemini direct API (optional)
  app.post("/api/gemini/generate", async (req, res) => {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "No prompt provided" });
    }

    if (!genai) {
      return res.status(400).json({ error: "Gemini API not configured" });
    }

    try {
      const result = await genai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
      });
      res.json({ response: result.text || "" });
    } catch (error) {
      res.status(500).json({ error: `Gemini error: ${error}` });
    }
  });

  // ========== Socket.io Integration ==========

  // Broadcast Atlantean updates to connected clients
  app.get("/api/atlantean/subscribe", (req, res) => {
    const sessionId = resolveSessionId(req, req.query.session_id as string | undefined);
    // Emit to all connected clients
    io.emit("atlantean:update", { session_id: sessionId });
    res.json({ subscribed: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const PORT = 3000;
  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

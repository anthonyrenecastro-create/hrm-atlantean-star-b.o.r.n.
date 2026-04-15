# 🎯 Quick Reference Guide

## File Structure Overview

```
hrm-star-b.o.r.n.-alpha/
│
├── 🧠 ATLANTEAN CORE (Python)
│   ├── atlantean_core/
│   │   ├── __init__.py
│   │   ├── hot_memory.py              ← Live fields (32×32 tensors)
│   │   ├── vector_cold_memory.py      ← Persistent storage
│   │   ├── memory_bridge.py           ← Hot/Cold integration
│   │   ├── learning.py                ← Signal functions
│   │   ├── identity.py                ← Device crypto
│   │   ├── sync.py                    ← Multi-device sync
│   │   └── llm_interface.py           ← Stateless LLM bridge
│   │
│   ├── atlantean_quadra_bridge.py     ← Main integration (720 LOC)
│   └── atlantean_backend.py           ← Flask REST API (380 LOC)
│
├── 🚀 FRONTEND (React/TypeScript)
│   ├── src/
│   │   ├── hooks/
│   │   │   └── useAtlanteanBridge.ts  ← React hook (300 LOC)
│   │   │
│   │   ├── components/
│   │   │   ├── AtlanteanChatInterface.tsx  ← Example UI (400 LOC)
│   │   │   ├── Chat.tsx
│   │   │   ├── SimulationView.tsx
│   │   │   └── ...
│   │   │
│   │   ├── lib/
│   │   │   └── hrm-engine.ts
│   │   │
│   │   ├── App.tsx
│   │   └── main.tsx
│   │
│   └── server.ts                      ← Express with Atlantean proxy
│
├── ⚙️ CONFIGURATION
│   ├── .env.example                   ← Environment template
│   ├── package.json                   ← Node dependencies
│   ├── requirements.txt               ← Python dependencies
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── .gitignore
│
├── 🐳 DOCKER & DEPLOYMENT
│   ├── docker-compose.yml
│   ├── Dockerfile.atlantean
│   ├── Dockerfile.frontend
│   ├── setup.sh                       ← Run this first
│   ├── start-atlantean.sh
│   └── start-frontend.sh
│
└── 📚 DOCUMENTATION
    ├── README.md                      ← Start here!
    ├── ATLANTEAN_INTEGRATION.md       ← Technical details
    ├── DEPLOYMENT.md                  ← Production guide
    ├── IMPLEMENTATION_SUMMARY.md      ← Feature overview
    ├── COMPLETION_CHECKLIST.md        ← Verification
    └── QUICK_REFERENCE.md            ← This file
```

---

## 🚀 Getting Started (60 seconds)

### 1. Setup (1 minute)
```bash
cd /workspaces/hrm-star-b.o.r.n.-alpha
./setup.sh
```

### 2. Configure (30 seconds)
```bash
cp .env.example .env.local
# Edit .env.local, add your GEMINI_API_KEY
```

### 3. Start Servers (2 terminals)

**Terminal 1:**
```bash
./start-atlantean.sh
# Atlantean starts on http://localhost:5001
```

**Terminal 2:**
```bash
./start-frontend.sh
# React app starts on http://localhost:3000
```

### 4. Test It
```
Open browser → http://localhost:3000
See chat interface with Atlantean integration
```

---

## 🔌 API Quick Reference

### Core Query (Most Important)
```bash
# Query with Atlantean context
curl -X POST http://localhost:3000/api/atlantean/query \
  -H "Content-Type: application/json" \
  -d '{
    "input": "What should I do?",
    "sessionId": "session-123"
  }'
```

### Learning Event (Most Used)
```bash
curl -X POST http://localhost:3000/api/atlantean/learning-event \
  -H "Content-Type: application/json" \
  -d '{
    "event": "user_positive_feedback",
    "data": {}
  }'
```

### Check Status (Debugging)
```bash
curl http://localhost:3000/api/atlantean/status
```

### Field Visualization
```bash
curl http://localhost:3000/api/atlantean/fields
```

---

## 💡 Core Concepts (30 second version)

### Intelligence Fields
- **φ₁ (Decision)**: -1.0 to +1.0 (confident vs learning)
- **φ₅ (Plasticity)**: 0.0 to 1.0 (adaptable vs stable)
- **Φ (Coherence)**: 0.0 to 1.0 (unified vs exploring)

### Learning Events (Trigger Signal Updates)
```
user_confirmation        ← +0.6 φ₁
user_correction          ← -0.3 φ₁
user_positive_feedback   ← +0.5 φ₁
prediction_success       ← +0.4 φ₁
high_engagement          ← +0.4 φ₁
```

### Memory Systems
- **Hot**: Live fields, real-time updates
- **Cold**: Vector storage, persistent

### No History!
- Responses not stored
- Each query fresh
- Context from fields only

---

## 📊 React Hook Usage

```typescript
import { useAtlanteanBridge } from './hooks/useAtlanteanBridge';

export function MyComponent() {
  const {
    query,              // (input: string) => Promise
    triggerLearning,   // (event: string, data: any) => Promise
    status,            // { field_stats, learning_capacity, ... }
    fields,            // { phi1: [], phi5: [], Φ: number }
    storeSimulation,   // (sim: object, confidence: number) => Promise
    createSnapshot,    // (label?: string) => Promise
  } = useAtlanteanBridge();

  // Query
  const response = await query("Hello");

  // Learn from feedback
  await triggerLearning('user_positive_feedback');

  // Monitor
  console.log(status.learning_capacity);

  return <div>{response}</div>;
}
```

---

## 🐳 Docker Quick Commands

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f atlantean-backend
docker-compose logs -f frontend

# Stop
docker-compose down

# Rebuild
docker-compose build --no-cache
```

---

## 🆘 Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| `GEMINI_API_KEY not found` | Edit `.env.local`, add key |
| Port 5001 in use | Change `ATLANTEAN_BACKEND_URL` in `.env.local` |
| Port 3000 in use | Run on different port: `PORT=3001 npm run dev` |
| Python module not found | Run `pip install -r requirements.txt` |
| Node modules issue | Delete `node_modules` and run `npm install` |
| Redis connection error | Redis optional, uses filesystem backup |
| Gemini API error | Check quota in Google AI Studio |

---

## 📈 Production Checklist

- [ ] Use strong GEMINI_API_KEY from secrets manager
- [ ] Configure CORS for your domain
- [ ] Set up Redis for sessions
- [ ] Enable HTTPS/TLS
- [ ] Set up monitoring (Cloud Monitoring)
- [ ] Configure logging (Cloud Logging)
- [ ] Test all endpoints
- [ ] Load test before launch
- [ ] Set up backups for state files
- [ ] Document API for team

---

## 🔗 Important Links

| Resource | URL |
|----------|-----|
| Full README | [README.md](./README.md) |
| Integration Guide | [ATLANTEAN_INTEGRATION.md](./ATLANTEAN_INTEGRATION.md) |
| Deployment Guide | [DEPLOYMENT.md](./DEPLOYMENT.md) |
| Feature Summary | [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) |
| Gemini Docs | https://ai.google.dev/docs |
| Express Docs | https://expressjs.com |
| Flask Docs | https://flask.palletsprojects.com |

---

## 📊 File Sizes

| File | Size | Lines |
|------|------|-------|
| atlantean_backend.py | 13 KB | 380 |
| atlantean_quadra_bridge.py | 22 KB | 720 |
| useAtlanteanBridge.ts | 9 KB | 300 |
| AtlanteanChatInterface.tsx | 15 KB | 400 |
| README.md | 9 KB | 250 |
| ATLANTEAN_INTEGRATION.md | 12 KB | 350 |
| DEPLOYMENT.md | 10 KB | 280 |

---

## ✅ Verification Commands

```bash
# Check Python modules
python3 -c "import torch; import flask; print('✓ OK')"

# Check Node modules
npm list @google/generative-ai express

# Test Flask server
curl http://localhost:5001/health

# Test Express server
curl http://localhost:3000/api/atlantean/status

# Check ports
lsof -i :3000
lsof -i :5001
```

---

## 🎯 Common Tasks

### Add New Learning Signal
Edit `atlantean_quadra_bridge.py`, `on_event()` method:
```python
elif event == "new_event":
    apply_learning_signal(self.hot_memory, signal_strength=0.5)
```

### Add New API Endpoint
In `server.ts`:
```typescript
app.post("/api/atlantean/new-endpoint", async (req, res) => {
  // Implementation
});
```

### Store Simulation
```typescript
const { storeSimulation } = useAtlanteanBridge();
await storeSimulation({
  scenario: "test",
  parameters: { x: 1 },
  result: "success"
}, 0.95);
```

### Monitor Field Evolution
```typescript
const { status } = useAtlanteanBridge();
setInterval(async () => {
  const s = await query("anything");
  console.log(status.field_stats);
}, 1000);
```

---

## 🚀 Next Steps

1. **Now**: Run `./setup.sh > start servers`
2. **5 min**: Test in browser at localhost:3000
3. **30 min**: Read ATLANTEAN_INTEGRATION.md
4. **1 hour**: Build custom component
5. **Today**: Deploy with Docker
6. **This week**: Production deployment

---

## 📞 Support

- **Technical**: See ATLANTEAN_INTEGRATION.md
- **Deployment**: See DEPLOYMENT.md
- **API**: REST endpoints documented in README.md
- **Troubleshooting**: Quick reference above

---

**Ready to launch? → Run `./setup.sh` and `./start-atlantean.sh` + `./start-frontend.sh`**

Generated: April 15, 2026
Version: 1.0.0

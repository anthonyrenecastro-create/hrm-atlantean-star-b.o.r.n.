# HRM STAR B.O.R.N. + Atlantean Intelligence

🧠 **Harmonic Resonance Model** integrated with **Atlantean Intelligence Core** - Advanced predictive intelligence system powered by Gemini 2.0 Flash.

![Status](https://img.shields.io/badge/status-Alpha-yellow)
![Python](https://img.shields.io/badge/Python-3.11+-blue)
![Node](https://img.shields.io/badge/Node-18+-green)
![License](https://img.shields.io/badge/license-MIT-blue)

## 🎯 Overview

This project combines:

- **HRM Engine**: Harmonic Resonance Model for dynamic simulations
- **Atlantean Intelligence**: Field-based learning system with hot/cold memory
- **Gemini API**: Advanced LLM for natural responses
- **Express.js**: RESTful API backend
- **React**: Modern UI with real-time visualization

## 🏗️ Architecture

```
Frontend (React + Vite)
    ↓
Express Server (Node.js)
    ├→ HRM Engine API
    └→ Atlantean Proxy + Gemini
        ↓
Atlantean Backend (Flask/Python)
    ├→ Hot Memory (φ₁, φ₅, Φ)
    ├→ Cold Memory (Vector Store)
    └→ Learning Signals
        ↓
    Gemini 2.0 Flash API
```

## 🚀 Quick Start

### 1️⃣ Prerequisites

- **Python 3.11+**
- **Node.js 18+**
- **pip** (Python package manager)
- **npm** (Node package manager)
- **GEMINI_API_KEY** (from [Google AI Studio](https://ai.studio/))

### 2️⃣ Initial Setup

```bash
# Run setup script
./setup.sh

# Or manually:
pip install -r requirements.txt
npm install
```

### 3️⃣ Environment Configuration

Create `.env.local`:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your Gemini API key:

```
GEMINI_API_KEY=your-actual-gemini-api-key
ATLANTEAN_BACKEND_URL=http://localhost:5001
REDIS_HOST=localhost
VITE_GEMINI_API_KEY=your-actual-gemini-api-key
```

### 4️⃣ Start Development Servers

**Terminal 1 - Atlantean Backend:**

```bash
./start-atlantean.sh
```

Server will start on `http://localhost:5001`

**Terminal 2 - Frontend & Express:**

```bash
./start-frontend.sh
```

Application will be available at `http://localhost:3000`

## 📊 Features

### Intelligence Fields

The system maintains three active fields:

#### **φ₁ (Decision Confidence)**
- **Range**: -1.0 to +1.0
- **+0.5 to +1.0**: High confidence, decisive mode
- **-0.2 to +0.2**: Balanced, exploring possibilities
- **-0.5 to -1.0**: Learning mode, uncertainty

#### **φ₅ (Learning Plasticity)**
- **Range**: 0.0 to 1.0
- **>0.7**: High learning capacity, actively adapting
- **0.3-0.7**: Moderate integration of new knowledge
- **<0.3**: Stable patterns, consolidating

#### **Φ (Global Coherence)**
- **Range**: 0.0 to 1.0
- Alignment between all intelligence components
- Higher = more unified decision-making

### Learning Signals

Trigger learning through user interactions:

```
user_confirmation        → +0.6 confidence
user_correction          → -0.3 confidence
user_positive_feedback   → +0.5 confidence
user_negative_feedback   → -0.3 confidence
prediction_success       → +0.4 confidence
prediction_failure       → -0.2 confidence
high_engagement          → +0.4 confidence
low_engagement           → -0.2 confidence
simulation_complete      → accuracy-based signal
```

### Memory Systems

#### Hot Memory (Live)
- Active field grids (32×32 tensors)
- Updated in real-time via learning signals
- Persisted after each query
- Session-specific

#### Cold Memory (Persistent)
- Vector-based storage of simulations
- Semantic similarity search
- Retrieves context for responses
- Grows over time, improves context

## 🔗 API Endpoints

### Atlantean Intelligence API

**Status & Monitoring**
```bash
GET  /api/atlantean/status          # Intelligence status
GET  /api/atlantean/fields          # Field visualization data
POST /api/atlantean/save            # Manual state save
POST /api/atlantean/load            # Manual state load
```

**Query Processing**
```bash
POST /api/atlantean/query
{
  "input": "user query",
  "session_id": "optional"
}
```

**Learning Events**
```bash
POST /api/atlantean/learning-event
{
  "event": "user_confirmation",
  "data": { "message_id": "..." }
}
```

**Simulation Management**
```bash
POST /api/atlantean/simulation/store
POST /api/atlantean/simulation/recall
POST /api/atlantean/snapshot
```

**Multi-Device Sync**
```bash
GET  /api/atlantean/sync/prepare     # Get sync package
POST /api/atlantean/sync/merge       # Merge from device
```

### HRM Engine API

```bash
GET  /api/hrm/state                 # Current state
POST /api/hrm/perturb               # Apply perturbation
POST /api/hrm/traits                # Update traits
```

### Gemini Direct API

```bash
POST /api/gemini/generate
{
  "prompt": "generate text"
}
```

## 🎨 React Component Example

```typescript
import { useAtlanteanBridge } from './hooks/useAtlanteanBridge';

function MyComponent() {
  const { query, triggerLearning, status } = useAtlanteanBridge();

  const handleQuery = async (input: string) => {
    const result = await query(input);
    console.log(result.response);
  };

  const handleFeedback = async (positive: boolean) => {
    await triggerLearning(
      positive ? 'user_positive_feedback' : 'user_negative_feedback'
    );
  };

  return (
    <div>
      <div>Learning Capacity: {status?.learning_capacity}%</div>
      <button onClick={() => handleFeedback(true)}>👍</button>
    </div>
  );
}
```

## 🐳 Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose build
docker-compose up

# Services start on:
# - Frontend: http://localhost:3000
# - Atlantean: http://localhost:5001
# - Redis: localhost:6379
```

## 📁 Project Structure

```
.
├── atlantean_core/              # Python Atlantean modules
│   ├── hot_memory.py           # Live field dynamics
│   ├── vector_cold_memory.py   # Persistent storage
│   ├── memory_bridge.py        # Integration layer
│   ├── identity.py             # Device identity
│   ├── learning.py             # Signal functions
│   ├── sync.py                 # Multi-device sync
│   └── llm_interface.py        # LLM bridge
├── atlantean_quadra_bridge.py  # Main bridge class
├── atlantean_backend.py        # Flask backend
├── src/
│   ├── hooks/
│   │   └── useAtlanteanBridge.ts    # React hook
│   ├── components/
│   │   └── AtlanteanChatInterface.tsx
│   ├── lib/
│   │   └── hrm-engine.ts       # HRM Engine
│   └── App.tsx
├── server.ts                   # Express server
├── package.json
├── requirements.txt
├── docker-compose.yml
└── .env.local                  # Configuration (create this)
```

## 🔧 Development

### Running Tests

```bash
npm run lint                # TypeScript/ESLint
python -m pytest           # Python tests (when implemented)
```

### Building for Production

```bash
npm run build              # Build frontend
docker-compose up          # Deploy with Docker
```

### Debugging

**Express Server:**
```bash
NODE_DEBUG=express npm run dev
```

**Flask Server:**
```bash
python -u atlantean_backend.py  # Unbuffered output
```

## 📊 Monitoring

### Health Checks

```bash
# Atlantean Backend
curl http://localhost:5001/health

# Express Server
curl http://localhost:3000/health
```

### Field Monitoring

```typescript
const { status } = useAtlanteanBridge();
console.log(status.field_stats);
// {
//   phi1_mean: 0.234,
//   phi5_mean: 0.567,
//   Phi: 0.45
// }
```

## 🚨 Troubleshooting

### Python Dependencies Failed

```bash
pip install --upgrade pip
pip install -r requirements.txt --no-cache-dir
```

### Port Already In Use

```bash
# Change ports in server.ts or environment
ATLANTEAN_PORT=5002 python atlantean_backend.py
```

### Redis Connection Failed

```bash
# Install Redis or fall back to filesystem sessions
brew install redis  # macOS
redis-server        # Start Redis
```

### Gemini API Errors

- Verify API key in `.env.local`
- Check quota in [Google AI Studio](https://ai.studio/)
- Ensure model name is `gemini-2.0-flash-exp`
- Check rate limits

## 📚 Documentation

- [ATLANTEAN_INTEGRATION.md](./ATLANTEAN_INTEGRATION.md) - Detailed integration guide
- [atlantean_core/](./atlantean_core/) - Python module documentation
- [Google Gemini Docs](https://ai.google.dev/docs)
- [Express.js Guide](https://expressjs.com/)

## 🛣️ Roadmap

- ✅ Core Atlantean modules
- ✅ Flask backend with Gemini
- ✅ Express proxy integration
- ✅ React hooks
- 📝 Advanced visualization components
- 📝 Conversation memory (optional)
- 📝 Model fine-tuning interface
- 📝 Multi-user collaboration
- 📝 Production deployment guides

## 📄 License

MIT License - See LICENSE file

## 👨‍💻 Author

Created for HRM STAR B.O.R.N. initiative

---

**Questions?** Check [ATLANTEAN_INTEGRATION.md](./ATLANTEAN_INTEGRATION.md) for detailed docs!

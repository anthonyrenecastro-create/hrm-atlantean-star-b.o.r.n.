# HRM STAR B.O.R.N. + Atlantean Intelligence Integration

Complete integration of Atlantean Intelligence Core with HRM Engine and Gemini API.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│ Frontend (React + TypeScript)                               │
│ - useAtlanteanBridge hook                                   │
│ - Neural Archives visualization                             │
│ - HRM simulation interface                                  │
└──────────────────┬──────────────────────────────────────────┘
                   │ HTTP/WebSocket
                   ↓
┌─────────────────────────────────────────────────────────────┐
│ Express Backend (Node.js)                                   │
│ - API routes for HRM and Atlantean                          │
│ - Proxy to Python Atlantean backend                         │
│ - Gemini API integration                                    │
│ - Socket.io real-time updates                              │
└──────────────────┬──────────────────────────────────────────┘
                   │ HTTP/REST
                   ↓
┌─────────────────────────────────────────────────────────────┐
│ Atlantean Intelligence Backend (Flask/Python)              │
│ - Hot Memory (field dynamics)                               │
│ - Cold Memory (vector storage)                              │
│ - Memory Bridge (integration layer)                         │
│ - Learning signal processing                               │
│ - Multi-device sync                                        │
└──────────────────┬──────────────────────────────────────────┘
                   │ API
                   ↓
┌─────────────────────────────────────────────────────────────┐
│ External Services                                           │
│ - Gemini 2.0 Flash (LLM responses)                         │
│ - Redis (session storage)                                  │
└─────────────────────────────────────────────────────────────┘
```

## Quick Start

### 1. Install Python Dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure Environment

Create `.env.local`:
```bash
GEMINI_API_KEY=your_actual_gemini_key
ATLANTEAN_BACKEND_URL=http://localhost:5001
REDIS_HOST=localhost
VITE_GEMINI_API_KEY=your_actual_gemini_key
```

### 3. Start Atlantean Backend (Python)

```bash
python atlantean_backend.py
```

Server will start on `http://localhost:5001`

### 4. Install Node Dependencies

```bash
npm install
```

### 5. Start Express + Frontend (Node.js)

```bash
npm run dev
```

App will be available at `http://localhost:3000`

## API Endpoints

### HRM Engine (Express)
- `GET  /api/hrm/state` - Get current HRM state
- `POST /api/hrm/perturb` - Apply perturbation
- `POST /api/hrm/traits` - Update traits

### Atlantean Intelligence (Express → Flask)
- `GET  /api/atlantean/status` - Intelligence status
- `POST /api/atlantean/query` - Process query with Gemini
- `GET  /api/atlantean/fields` - Field visualization data
- `POST /api/atlantean/learning-event` - Trigger learning
- `POST /api/atlantean/simulation/store` - Store simulation
- `POST /api/atlantean/simulation/recall` - Query simulations
- `POST /api/atlantean/snapshot` - Create snapshot
- `POST /api/atlantean/sync/prepare` - Prepare multi-device sync
- `POST /api/atlantean/sync/merge` - Merge from another device

### Gemini Direct (Express)
- `POST /api/gemini/generate` - Direct Gemini API call

## React Integration

### Using useAtlanteanBridge Hook

```typescript
import { useAtlanteanBridge } from './hooks/useAtlanteanBridge';

function ChatInterface() {
  const { query, triggerLearning, status } = useAtlanteanBridge();
  const [response, setResponse] = useState('');

  const handleSend = async (message: string) => {
    const result = await query(message);
    setResponse(result.response);
  };

  const handleFeedback = (positive: boolean) => {
    if (positive) {
      triggerLearning('user_positive_feedback');
    } else {
      triggerLearning('user_negative_feedback');
    }
  };

  return (
    <div>
      <div className="response">{response}</div>
      <button onClick={() => handleFeedback(true)}>👍 Helpful</button>
      <button onClick={() => handleFeedback(false)}>👎 Not helpful</button>
      <div className="status">
        Learning capacity: {(status?.learning_capacity || 0).toFixed(1)}%
      </div>
    </div>
  );
}
```

## Learning Events

Trigger learning signals from UI interactions:

```typescript
// User confirmed response was good
triggerLearning('user_confirmation');

// User corrected or rejected response
triggerLearning('user_correction');

// User gave explicit feedback
triggerLearning('user_positive_feedback'); // or 'user_negative_feedback'

// Simulation performance feedback
triggerLearning('simulation_complete', { accuracy: 0.85 });

// Engagement measurement
triggerLearning('high_engagement'); // or 'low_engagement'

// Response quality feedback
triggerLearning('helpful_response'); // or 'unhelpful_response'

// Prediction feedback
triggerLearning('prediction_success'); // or 'prediction_failure'
```

## Atlantean Field States

The intelligence maintains two key fields:

### φ₁ (Phi 1): Decision Confidence Field
- **Positive values** (+0.5 to +1.0): High confidence, decisive
- **Near zero** (-0.2 to +0.2): Balanced, exploring options
- **Negative values** (-0.5 to -1.0): Learning mode, uncertain

### φ₅ (Phi 5): Learning/Plasticity Field
- **High values** (>0.7): Actively learning new patterns
- **Medium values** (0.3-0.7): Integrating knowledge
- **Low values** (<0.3): Patterns consolidating, stable

### Φ (Phi): Global Coherence
- **High** (>0.7): Unified decision-making, strong internal alignment
- **Medium** (0.3-0.7): Coordinating multiple knowledge areas
- **Low** (<0.3): Exploratory, conflicting possibilities

## Storage & Persistence

### Hot Memory (Live fields)
- Serialized to `.bin` files after each query/learning event
- Located in `data/` directory
- Per-session: `data/quadra_intelligence_{session_id}.bin`

### Cold Memory (Persistent knowledge)
- Vector embeddings of simulations and learned patterns
- Used for context-aware responses
- Retrieved via semantic similarity search

## Multi-Device Sync

Synchronize intelligence across devices:

```typescript
// On device A: prepare package
const syncPackage = await fetch('/api/atlantean/sync/prepare').then(r => r.json());

// Transfer syncPackage to device B (via network, file, QR code, etc.)

// On device B: merge
await fetch('/api/atlantean/sync/merge', {
  method: 'POST',
  body: JSON.stringify({ package: syncPackage, strategy: 'conservative' })
});
```

## Environments

### Development
- Hot reload for React components
- Vite development server
- Atlantean backend with debug logging
- Mock Gemini responses if API key not configured

### Production
- Express static file serving
- Optimized builds
- Full Gemini API integration
- Persistent state storage

## Troubleshooting

### Atlantean Backend Issues

```bash
# Test Flask server health
curl http://localhost:5001/health

# Check logs for errors
python -u atlantean_backend.py
```

### Express Proxy Issues

```bash
# Test proxy to Atlantean
curl http://localhost:3000/api/atlantean/status

# Check Express logs for network errors
```

### Gemini API Errors

- Verify `GEMINI_API_KEY` is set and valid
- Check API quota in Google AI Studio
- Ensure model name is correct: `gemini-2.0-flash-exp`

### Redis Session Issues

- If Redis unavailable, Express falls back to filesystem sessions
- Sessions stored in `flask_session/` directory
- Clear with `rm -rf flask_session/`

## Development Notes

### Adding New Learning Signals

In `atlantean_quadra_bridge.py`, `on_event()` method:

```python
elif event == "my_new_event":
    my_signal_strength = calculate_signal(event_data)
    apply_learning_signal(self.hot_memory, signal_strength=my_signal_strength)
```

### Extending Field Visualization

Modify `get_field_visualization_data()` in the bridge to add new tensor data for frontend visualization.

### Customizing Cold Memory

Implement a new `VectorColdMemory` subclass with different embedding strategies:

```python
class CustomColdMemory(VectorColdMemory):
    def __init__(self, embedder):
        super().__init__(embedder)
        # Custom initialization
    
    def recall(self, query: str, limit: int = 10):
        # Custom retrieval logic
        pass
```

## File Structure

```
├── atlantean_core/                    # Python Atlantean modules
│   ├── __init__.py
│   ├── hot_memory.py                 # Live field dynamics
│   ├── vector_cold_memory.py         # Persistent storage
│   ├── memory_bridge.py              # Integration layer
│   ├── identity.py                   # Device identity
│   ├── learning.py                   # Signal functions
│   ├── sync.py                       # Multi-device sync
│   └── llm_interface.py              # LLM integration
├── atlantean_quadra_bridge.py        # Main bridge class
├── atlantean_backend.py              # Flask server
├── requirements.txt                  # Python dependencies
├── server.ts                         # Express server
├── src/
│   ├── hooks/
│   │   └── useAtlanteanBridge.ts    # React hook
│   ├── components/                   # React components
│   ├── lib/
│   │   └── hrm-engine.ts            # HRM Engine
│   ├── App.tsx
│   └── main.tsx
├── package.json                      # Node dependencies
├── tsconfig.json
├── vite.config.ts
└── .env.local                        # Environment (create this)
```

## Next Steps

1. ✅ Core Atlantean modules created
2. ✅ Flask backend running
3. ✅ Express proxy setup
4. ✅ React hook integrated
5. 📝 Build Neural Archives visualization component
6. 📝 Implement advanced sync strategies
7. 📝 Add conversation history to cold memory (optional)
8. 📝 Deploy to production (Google Cloud or similar)

## References

- [Atlantean Core Documentation](./atlantean_core/)
- [Gemini API Docs](https://ai.google.dev/docs/concepts)
- [Express.js Documentation](https://expressjs.com/)
- [React Hooks API](https://react.dev/reference/react/hooks)

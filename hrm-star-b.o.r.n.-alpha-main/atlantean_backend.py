"""
Atlantean Backend Server

HTTP server that exposes Atlantean Intelligence Core to the Quadra-Seer frontend.
Integrates with the Express HRM backend and Gemini API.

Run with: python atlantean_backend.py
"""

from flask import Flask, request, jsonify, session
from flask_cors import CORS
from flask_session import Session
import base64
import sys
import os
import threading
from google import genai
from google.genai import types
from dotenv import load_dotenv
import asyncio
import json

# Load environment variables
load_dotenv()
load_dotenv('.env.local')

# Import the bridge module
sys.path.insert(0, os.path.dirname(__file__))
from atlantean_quadra_bridge import AtlanteanQuadraBridge, QuadraLearningEvent

# Configure Gemini
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY') or os.getenv('VITE_GEMINI_API_KEY')
GEMINI_MODEL = os.getenv('GEMINI_MODEL', 'gemini-2.5-flash')
if GEMINI_API_KEY and GEMINI_API_KEY != 'PLACEHOLDER_API_KEY':
    client = genai.Client(api_key=GEMINI_API_KEY)
    print(f"✅ Gemini API configured")
else:
    client = None
    print("⚠️  No Gemini API key found - using mock responses")

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend

# Configure session storage
redis_host = os.getenv('REDIS_HOST', 'localhost')
redis_port = int(os.getenv('REDIS_PORT', 6379))
try:
    import redis
    app.config['SESSION_TYPE'] = 'redis'
    app.config['SESSION_REDIS'] = redis.Redis(host=redis_host, port=redis_port)
    # Validate Redis connectivity before enabling it for session storage.
    try:
        app.config['SESSION_REDIS'].ping()
        Session(app)
        print(f"✅ Redis session storage configured at {redis_host}:{redis_port}")
    except Exception:
        raise
except Exception:
    # Fallback to filesystem session storage when Redis is unavailable.
    app.config['SESSION_TYPE'] = 'filesystem'
    app.config['SESSION_FILE_DIR'] = os.path.join(os.getcwd(), 'flask_sessions')
    os.makedirs(app.config['SESSION_FILE_DIR'], exist_ok=True)
    Session(app)
    print("⚠️  Redis not available or unreachable, using filesystem sessions")

# Global bridge instance (per session)
bridges = {}
lock = threading.Lock()

SUPPORTED_ATTACHMENT_MIME_TYPES = {
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/heic',
    'image/heif',
    'application/pdf',
    'text/plain',
    'text/markdown',
    'text/csv',
    'text/html',
    'text/css',
    'text/javascript',
    'application/x-javascript',
    'text/x-typescript',
    'application/x-typescript',
    'text/x-python',
    'application/x-python-code',
    'application/json',
    'text/xml',
    'application/xml',
}

TEXT_ATTACHMENT_MIME_PREFIXES = (
    'text/',
)

TEXT_ATTACHMENT_MIME_TYPES = {
    'application/json',
    'application/xml',
    'application/x-javascript',
    'application/x-typescript',
    'application/x-python-code',
}


def user_safe_fallback_response() -> str:
    """Return a user-facing fallback without internal system details."""
    return "I'm having trouble answering that clearly right now. Try asking again, and I'll keep it simple and conversational."


def build_axiom_memory_context(bridge, query_text: str, limit: int = 3) -> str:
    """Recall relevant cold-memory items and format them for prompt use."""
    try:
        recalled_items = bridge.bridge.recall(query_text, limit=limit)
    except Exception:
        return ""

    if not recalled_items:
        return ""

    memory_lines = []
    for item in recalled_items[:limit]:
        content = getattr(item, 'content', '') or ''
        metadata = getattr(item, 'metadata', {}) or {}
        memory_type = metadata.get('type', 'memory')

        try:
            parsed = json.loads(content)
        except Exception:
            parsed = None

        if isinstance(parsed, dict):
            if parsed.get('query') and parsed.get('response'):
                memory_lines.append(
                    f"- Prior exchange: User asked '{parsed['query'][:120]}'; reply was '{parsed['response'][:180]}'"
                )
            elif parsed.get('title') or parsed.get('description'):
                title = parsed.get('title', 'Untitled memory')
                description = parsed.get('description', '')
                memory_lines.append(
                    f"- {memory_type.title()}: {title} {description[:140]}".strip()
                )
            else:
                memory_lines.append(f"- {memory_type.title()}: {json.dumps(parsed)[:220]}")
        else:
            memory_lines.append(f"- {memory_type.title()}: {content[:220]}")

    if not memory_lines:
        return ""

    return "[AXIOM MEMORY]\n" + "\n".join(memory_lines) + "\n[/AXIOM MEMORY]"


def _is_text_attachment(mime_type: str) -> bool:
    return mime_type.startswith(TEXT_ATTACHMENT_MIME_PREFIXES) or mime_type in TEXT_ATTACHMENT_MIME_TYPES


def build_attachment_parts(attachments):
    """Convert frontend attachment payloads into Gemini content parts."""
    if not isinstance(attachments, list):
        return [], ""

    parts = []
    attachment_notes = []

    for index, attachment in enumerate(attachments, start=1):
        if not isinstance(attachment, dict):
            continue

        name = (attachment.get('name') or f'attachment-{index}')[:200]
        mime_type = (attachment.get('type') or '').strip().lower()
        encoded_data = attachment.get('data') or ''

        if not mime_type or mime_type not in SUPPORTED_ATTACHMENT_MIME_TYPES:
            attachment_notes.append(f"- Ignored unsupported attachment: {name} ({mime_type or 'unknown type'})")
            continue

        if not encoded_data:
            attachment_notes.append(f"- Ignored empty attachment: {name}")
            continue

        try:
            decoded_bytes = base64.b64decode(encoded_data, validate=True)
        except Exception:
            attachment_notes.append(f"- Ignored unreadable attachment: {name}")
            continue

        if not decoded_bytes:
            attachment_notes.append(f"- Ignored empty attachment: {name}")
            continue

        try:
            if _is_text_attachment(mime_type):
                text_content = decoded_bytes.decode('utf-8', errors='replace')
                parts.append(types.Part.from_text(text=f"[Attachment: {name}]\n{text_content}"))
            else:
                parts.append(types.Part.from_bytes(data=decoded_bytes, mime_type=mime_type))

            attachment_notes.append(f"- Attached: {name} ({mime_type})")
        except Exception:
            attachment_notes.append(f"- Ignored unsupported attachment payload: {name} ({mime_type})")

    attachment_context = ""
    if attachment_notes:
        attachment_context = "[ATTACHMENTS]\n" + "\n".join(attachment_notes) + "\n[/ATTACHMENTS]"

    return parts, attachment_context


def get_bridge_for_session(session_id: str = None) -> AtlanteanQuadraBridge:
    """Get or create the bridge instance for a session."""
    if session_id is None:
        session_id = session.sid if session and hasattr(session, 'sid') else 'default'
    
    with lock:
        if session_id not in bridges:
            bridges[session_id] = AtlanteanQuadraBridge(
                grid_size=(32, 32),
                device_id=f"quadra-seer-{session_id}"
            )
            # Try to load existing state
            state_file = f'data/quadra_intelligence_{session_id}.bin'
            try:
                os.makedirs('data', exist_ok=True)
                bridges[session_id].load_state(state_file)
                print(f"✅ Loaded state for session {session_id}")
            except:
                print(f"✨ Initialized new intelligence state for session {session_id}")
        
        return bridges[session_id]


# ========== Core API Endpoints ==========

@app.route('/api/atlantean/status', methods=['GET'])
def status():
    """Get current intelligence status."""
    session_id = request.args.get('session_id')
    b = get_bridge_for_session(session_id)
    return jsonify(b.get_status())


@app.route('/api/atlantean/query', methods=['POST'])
def query():
    """
    Process user query through Atlantean-powered LLM.
    
    Now integrates HRM state for unified inference.
    
    Request body:
    {
        "input": "user message",
        "hrm_context": { HRM state from frontend },
        "llm_provider": "gemini" | "mock",
        "session_id": "optional_session_id",
        "api_key": "optional_api_key_override"
    }
    """
    data = request.json or {}
    user_input = data.get('input', '')
    hrm_context = data.get('hrm_context', {})
    attachments = data.get('attachments', [])
    llm_provider = data.get('llm_provider', 'gemini')
    api_key = data.get('api_key') or GEMINI_API_KEY
    session_id = data.get('session_id')
    
    if not user_input:
        return jsonify({'error': 'No input provided'}), 400
    
    b = get_bridge_for_session(session_id)
    
    # Sync HRM context to Atlantean if provided
    if hrm_context:
        try:
            b.sync_hrm_state(hrm_context)
        except:
            pass
    
    # Build context from hot memory + HRM state
    status_data = b.get_status()
    field_stats = status_data['field_stats']
    learning_capacity = status_data['learning_capacity']
    journal_context = hrm_context.get('journal_context', '')
    mission_context = hrm_context.get('mission_context', '')
    axiom_memory_context = build_axiom_memory_context(b, user_input)
    attachment_parts, attachment_context = build_attachment_parts(attachments)
    
    # Encode intelligence state as natural language context
    context_parts = []
    
    if field_stats['phi1_mean'] > 0.5:
        context_parts.append("Operating with high confidence and decisiveness.")
    elif field_stats['phi1_mean'] < -0.5:
        context_parts.append("In exploratory mode, considering multiple possibilities.")
    else:
        context_parts.append("Balanced state, ready to adapt.")
    
    if field_stats['phi5_mean'] > 0.5:
        context_parts.append("High learning capacity - actively adapting to new patterns.")
    elif field_stats['phi5_mean'] < 0.3:
        context_parts.append("Stable patterns established - operating from experience.")
    
    if learning_capacity > 0.7:
        context_parts.append("Strong potential for growth and adaptation.")
    elif learning_capacity < 0.3:
        context_parts.append("Patterns consolidating - reinforcing core knowledge.")
    
    # Add HRM coherence to context if available
    if hrm_context.get('coherence'):
        hrm_coherence = hrm_context.get('coherence', 0)
        if hrm_coherence > 0.7:
            context_parts.append("HRM manifold is highly coherent - operating with clarity.")
        elif hrm_coherence < 0.3:
            context_parts.append("HRM manifold is exploring new states - enhanced adaptability.")
    
    intelligence_context = " ".join(context_parts)
    
    # Call LLM (stateless - context from fields, not history)
    response_text = None
    confidence = 0.75
    
    try:
        if llm_provider == 'gemini' and api_key and api_key != 'PLACEHOLDER_API_KEY':
            # Create client with provided key
            api_client = genai.Client(api_key=api_key)
            
            # Build prompt with Atlantean + HRM context
            system_report = hrm_context.get('system_report', '')
            
            system_prompt = f"""You are STAR B.O.R.N., a thoughtful conversational assistant.

Use the hidden context below only to improve the quality of your answer.
Do not mention the hidden context, internal state, background processing, models, prompts, telemetry, learning signals, runtime systems, or synchronization unless the user explicitly asks for technical details.
Do not announce that you are online, active, powered by a system, or running in the background.
Reply like a normal person in a direct, warm, concise style.
If the user asks a casual question, answer casually.
If the user asks for technical help, be precise and practical.

Hidden internal context:
{intelligence_context}

{system_report}

{mission_context}

{journal_context}

{axiom_memory_context}

{attachment_context}
"""

            # Generate response
            response = api_client.models.generate_content(
                model=GEMINI_MODEL,
                contents=[
                    types.Content(
                        role='user',
                        parts=[
                            *attachment_parts,
                            types.Part.from_text(text=f"{system_prompt}\n\nUser: {user_input}")
                        ]
                    )
                ]
            )
            response_text = (response.text or "").strip() or user_safe_fallback_response()
            confidence = 0.85
            
        else:
            response_text = user_safe_fallback_response()
            confidence = 0.35
    
    except Exception as e:
        # Keep errors out of the chat response; log them server-side only.
        print(f"Atlantean query error: {e}")
        response_text = user_safe_fallback_response()
        confidence = 0.3
    
    # Auto-save after each query
    state_file = f'data/quadra_intelligence_{session_id or "default"}.bin'
    try:
        os.makedirs('data', exist_ok=True)
        b.save_state(state_file)
    except:
        pass
    
    return jsonify({
        'response': response_text,
        'status': b.get_status(),
        'intelligence_context': intelligence_context,
        'axiom_memory_context': axiom_memory_context,
        'confidence': confidence,
        'store_in_memory': True,  # Auto-store high-confidence queries
        'learning_event': 'user_positive_feedback' if confidence > 0.8 else None,
    })


@app.route('/api/atlantean/fields', methods=['GET'])
def get_fields():
    """Get field visualization data."""
    session_id = request.args.get('session_id')
    b = get_bridge_for_session(session_id)
    return jsonify(b.get_field_visualization_data())


@app.route('/api/atlantean/learning-event', methods=['POST'])
def learning_event():
    """
    Trigger a learning event.
    
    Request body:
    {
        "session_id": "optional session id",
        "event": "user_confirmation" | "user_correction" | etc.,
        "data": { ... event-specific data ... }
    }
    """
    data = request.json or {}
    session_id = data.get('session_id')
    event = data.get('event')
    event_data = data.get('data', {})
    
    if not event:
        return jsonify({'error': 'No event type provided'}), 400
    
    b = get_bridge_for_session(session_id)
    
    try:
        b.on_event(event, **event_data)
        
        # Save state
        state_file = f'data/quadra_intelligence_{session_id or "default"}.bin'
        try:
            os.makedirs('data', exist_ok=True)
            b.save_state(state_file)
        except:
            pass
        
        return jsonify({
            'success': True,
            'status': b.get_status()
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ========== HRM ↔ Atlantean Bidirectional Sync ==========

@app.route('/api/atlantean/sync/hrm-state', methods=['POST'])
def sync_hrm_state():
    """
    Sync HRM state → Atlantean hot memory.
    
    Called when HRM evolves to keep Atlantean fields in sync.
    """
    data = request.json or {}
    hrm_state = data.get('hrm_state')
    session_id = data.get('session_id')
    
    if not hrm_state:
        return jsonify({'status': 'no_state'}), 200
    
    b = get_bridge_for_session(session_id)
    
    try:
        # Sync HRM state to Atlantean hot memory
        b.sync_hrm_state(hrm_state)
        
        # Save state
        state_file = f'data/quadra_intelligence_{session_id or "default"}.bin'
        try:
            os.makedirs('data', exist_ok=True)
            b.save_state(state_file)
        except:
            pass
        
        return jsonify({
            'success': True,
            'atlantean_version': b.hot_memory.version,
            'hrm_metrics': {
                'coherence': hrm_state.get('coherence'),
                'stability': hrm_state.get('stability'),
                'optimization': hrm_state.get('optimization'),
            }
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/atlantean/hrm-influence', methods=['GET'])
def get_hrm_influence():
    """
    Get Atlantean field influence on HRM evolution.
    
    Returns a 24-component perturbation that feeds HRM evolution.
    Creates the feedback loop: Atlantean fields → HRM state vector.
    """
    session_id = request.args.get('session_id')
    b = get_bridge_for_session(session_id)
    
    try:
        # Get current HRM-like state from Atlantean perspective
        hrm_state = {
            'theta': 0,  # Will be provided by HRM directly
            'coherence': float(b.hot_memory.phi1.mean().item()),
            'stability': float(b.hot_memory.phi5.mean().item()),
            'optimization': float(b.hot_memory.Phi.item()),
            'fractalDepth': 0.5,
        }
        
        # Compute perturbation
        perturbation = b.get_hrm_field_influence(hrm_state)
        
        return jsonify({
            'perturbation': perturbation.tolist(),
            'field_stats': {
                'phi1_mean': float(b.hot_memory.phi1.mean().item()),
                'phi5_mean': float(b.hot_memory.phi5.mean().item()),
                'Phi': float(b.hot_memory.Phi.item()),
            }
        })
    except Exception as e:
        return jsonify({
            'error': str(e),
            'perturbation': [0.0] * 24
        }), 500


@app.route('/api/atlantean/store-hrm-simulation', methods=['POST'])
def store_hrm_simulation():
    """
    Auto-store HRM simulation → Atlantean cold memory.
    
    Called during HRM evolution to capture important simulation results.
    """
    data = request.json or {}
    simulation = data.get('simulation')
    hrm_state = data.get('hrm_state')
    confidence = data.get('confidence', 0.75)
    session_id = data.get('session_id')
    
    if not simulation:
        return jsonify({'error': 'No simulation data'}), 400
    
    b = get_bridge_for_session(session_id)
    
    try:
        # Store simulation
        b.store_hrm_simulation(simulation, hrm_state, confidence)
        
        # Save state
        state_file = f'data/quadra_intelligence_{session_id or "default"}.bin'
        try:
            os.makedirs('data', exist_ok=True)
            b.save_state(state_file)
        except:
            pass
        
        return jsonify({
            'success': True,
            'cold_memory_items': len(b.cold_memory.items),
            'confidence': confidence,
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/atlantean/unified-state', methods=['GET'])
def get_unified_state():
    """
    Get unified HRM + Atlantean state.
    
    Returns combined state showing integration status.
    """
    session_id = request.args.get('session_id')
    b = get_bridge_for_session(session_id)
    
    try:
        unified = b.get_unified_state()
        return jsonify(unified)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ========== Simulation Endpoints ==========

@app.route('/api/atlantean/simulation/store', methods=['POST'])
def store_simulation():
    """Store simulation in cold memory."""
    data = request.json or {}
    simulation = data.get('simulation')
    confidence = data.get('confidence', 0.5)
    session_id = data.get('session_id')
    
    if not simulation:
        return jsonify({'error': 'No simulation data'}), 400
    
    b = get_bridge_for_session(session_id)
    b.store_simulation(simulation, confidence)
    
    # Save state
    state_file = f'data/quadra_intelligence_{session_id or "default"}.bin'
    try:
        os.makedirs('data', exist_ok=True)
        b.save_state(state_file)
    except:
        pass
    
    return jsonify({'success': True})


@app.route('/api/atlantean/simulation/recall', methods=['POST'])
def recall_simulations():
    """Recall past simulations."""
    data = request.json or {}
    query = data.get('query', '')
    limit = data.get('limit', 10)
    session_id = data.get('session_id')
    
    b = get_bridge_for_session(session_id)
    simulations = b.recall_simulations(query, limit)
    
    return jsonify({'simulations': simulations})


# ========== Archive Endpoints ==========

@app.route('/api/atlantean/snapshot', methods=['POST'])
def create_snapshot():
    """Create a labeled snapshot."""
    data = request.json or {}
    label = data.get('label')
    session_id = data.get('session_id')
    
    b = get_bridge_for_session(session_id)
    snapshot = b.create_snapshot(label)
    
    return jsonify({'snapshot': snapshot})


# ========== Sync Endpoints ==========

@app.route('/api/atlantean/sync/prepare', methods=['GET'])
def prepare_sync():
    """Prepare sync package for multi-device."""
    session_id = request.args.get('session_id')
    b = get_bridge_for_session(session_id)
    
    try:
        package = b.prepare_sync_package()
        return jsonify({'package': package})
    except RuntimeError as e:
        return jsonify({'error': str(e)}), 400


@app.route('/api/atlantean/sync/merge', methods=['POST'])
def merge_sync():
    """Merge sync package from another device."""
    data = request.json or {}
    package = data.get('package')
    session_id = data.get('session_id')
    
    if not package:
        return jsonify({'error': 'No sync package'}), 400
    
    b = get_bridge_for_session(session_id)
    
    try:
        b.merge_from_device(package)
        
        # Save state
        state_file = f'data/quadra_intelligence_{session_id or "default"}.bin'
        try:
            os.makedirs('data', exist_ok=True)
            b.save_state(state_file)
        except:
            pass
        
        return jsonify({
            'success': True,
            'status': b.get_status()
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ========== Admin Endpoints ==========

@app.route('/api/atlantean/reset', methods=['POST'])
def reset():
    """Reset intelligence state (for testing)."""
    session_id = request.json.get('session_id') if request.json else None
    
    with lock:
        if session_id in bridges:
            del bridges[session_id]
        
        # Delete state file
        state_file = f'data/quadra_intelligence_{session_id or "default"}.bin'
        try:
            os.remove(state_file)
        except:
            pass
    
    # Re-initialize
    get_bridge_for_session(session_id)
    
    return jsonify({
        'success': True,
        'message': 'Intelligence state reset'
    })


@app.route('/api/atlantean/save', methods=['POST'])
def save():
    """Manually save state."""
    session_id = request.json.get('session_id') if request.json else None
    b = get_bridge_for_session(session_id)
    
    state_file = f'data/quadra_intelligence_{session_id or "default"}.bin'
    try:
        os.makedirs('data', exist_ok=True)
        b.save_state(state_file)
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/atlantean/load', methods=['POST'])
def load():
    """Manually load state."""
    session_id = request.json.get('session_id') if request.json else None
    b = get_bridge_for_session(session_id)
    
    state_file = f'data/quadra_intelligence_{session_id or "default"}.bin'
    try:
        b.load_state(state_file)
        return jsonify({
            'success': True,
            'status': b.get_status()
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ========== Health Check ==========

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint."""
    return jsonify({
        'status': 'healthy',
        'service': 'Atlantean Backend',
        'version': '1.0.0'
    })


if __name__ == '__main__':
    print("\n" + "="*60)
    print("🧠  ATLANTEAN INTELLIGENCE BACKEND")
    print("="*60)
    print("\nStarting server on http://localhost:5001")
    print("\nAPI Endpoints:")
    print("  GET  /health                        - Health check")
    print("  GET  /api/atlantean/status          - Get intelligence status")
    print("  POST /api/atlantean/query           - Process user query")
    print("  GET  /api/atlantean/fields          - Get field visualization")
    print("  POST /api/atlantean/learning-event  - Trigger learning")
    print("  POST /api/atlantean/simulation/*    - Simulation storage")
    print("  POST /api/atlantean/snapshot        - Create snapshot")
    print("  GET  /api/atlantean/sync/*          - Multi-device sync")
    print("  POST /api/atlantean/reset           - Reset state")
    print("\nPress Ctrl+C to stop")
    print("="*60 + "\n")
    
    # Initialize on startup
    get_bridge_for_session()
    
    app.run(
        host='0.0.0.0',
        port=5001,
        debug=False
    )

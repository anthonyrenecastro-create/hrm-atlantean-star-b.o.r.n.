"""
Atlantean Intelligence Core
Phase 1: Core modules for HRM-BORN integration
"""

from .hot_memory import AtlanteanHotMemory
from .vector_cold_memory import VectorColdMemory
from .memory_bridge import AtlanteanMemoryBridge
from .identity import AtlanteanIdentity
from .learning import (
    apply_learning_signal,
    apply_contradiction_signal,
    apply_outcome_signal,
    apply_relevance_signal,
    compute_learning_capacity
)
from .sync import AtlanteanSyncEngine, MergeStrategy

__all__ = [
    'AtlanteanHotMemory',
    'VectorColdMemory',
    'AtlanteanMemoryBridge',
    'AtlanteanIdentity',
    'apply_learning_signal',
    'apply_contradiction_signal',
    'apply_outcome_signal',
    'apply_relevance_signal',
    'compute_learning_capacity',
    'AtlanteanSyncEngine',
    'MergeStrategy',
]

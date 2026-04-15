"""
Memory Bridge - Connect Hot and Cold Memory

Bridges between live fields and persistent knowledge.
"""

from typing import Optional, List, Dict, Any
from .hot_memory import AtlanteanHotMemory
from .vector_cold_memory import VectorColdMemory


class MemoryBridgeItem:
    """Item bridging hot and cold memory."""
    
    def __init__(self, content: str, metadata: Dict[str, Any], vector_item):
        self.content = content
        self.metadata = metadata
        self.vector_item = vector_item


class AtlanteanMemoryBridge:
    """Bidirectional bridge between memory systems."""
    
    def __init__(
        self,
        hot: AtlanteanHotMemory,
        cold: VectorColdMemory,
        embedder=None
    ):
        """
        Initialize bridge.
        
        Args:
            hot: Hot memory instance
            cold: Cold memory instance
            embedder: Text to vector function
        """
        self.hot = hot
        self.cold = cold
        self.embedder = embedder
    
    def ingest(
        self,
        content: str,
        metadata: Optional[Dict[str, Any]] = None
    ):
        """
        Ingest content into cold memory.
        
        Args:
            content: Content to store
            metadata: Associated metadata
        """
        if metadata is None:
            metadata = {}
        
        # Store in cold memory
        self.cold.store(content, metadata)
    
    def recall(
        self,
        query: str,
        limit: int = 10
    ) -> List:
        """
        Retrieve related items from cold memory.
        
        Args:
            query: Query string
            limit: Max results
        
        Returns:
            List of memory items
        """
        return self.cold.recall(query, limit=limit)
    
    def get_context(self, query: str) -> str:
        """
        Get context-enriched response preparation.
        
        Combines hot memory state with cold memory recall.
        """
        # Get hot memory state
        hot_stats = self.hot.get_stats()
        
        # Recall relevant cold memory
        cold_items = self.recall(query, limit=3)
        
        context = f"""
Current Intelligence State:
- Decision confidence: {hot_stats['phi1_mean']:.3f}
- Learning capacity: {hot_stats['phi5_mean']:.3f}
- Global coherence: {hot_stats['Phi']:.3f}

Relevant experiences recalled: {len(cold_items)}
"""
        for i, item in enumerate(cold_items, 1):
            context += f"\n{i}. {item.content[:100]}..."
        
        return context

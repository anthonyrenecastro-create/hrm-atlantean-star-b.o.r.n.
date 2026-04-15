"""
Cold Memory - Persistent Knowledge Base

Vector-based storage for simulations, patterns, and learned experiences.
Retrievable via semantic search.
"""

import numpy as np
from typing import List, Dict, Optional, Callable, Any
from datetime import datetime
import json


class MemoryItem:
    """Single item in cold memory."""
    
    def __init__(self, content: str, vector: np.ndarray, metadata: Dict[str, Any]):
        self.content = content
        self.vector = vector
        self.metadata = metadata
        self.timestamp = datetime.now().isoformat()
    
    def to_dict(self) -> dict:
        return {
            'content': self.content,
            'vector': self.vector.tolist(),
            'metadata': self.metadata,
            'timestamp': self.timestamp,
        }


class VectorColdMemory:
    """Vector-based cold memory for persistence."""
    
    def __init__(self, embedder: Callable[[str], np.ndarray]):
        """
        Initialize cold memory.
        
        Args:
            embedder: Function to convert text to vectors
        """
        self.embedder = embedder
        self.items: List[MemoryItem] = []
    
    def store(
        self,
        content: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> MemoryItem:
        """
        Store content with embedding.
        
        Args:
            content: Text content to store
            metadata: Associated metadata
        
        Returns:
            Created MemoryItem
        """
        vector = self.embedder(content)
        item = MemoryItem(
            content=content,
            vector=vector,
            metadata=metadata or {}
        )
        self.items.append(item)
        return item
    
    def recall(
        self,
        query: str,
        limit: int = 10,
        threshold: float = 0.0
    ) -> List[MemoryItem]:
        """
        Retrieve items similar to query.
        
        Args:
            query: Query text
            limit: Max results
            threshold: Similarity threshold
        
        Returns:
            Similar items ranked by similarity
        """
        if not self.items:
            return []
        
        query_vector = self.embedder(query)
        
        # Compute similarities
        similarities = []
        for item in self.items:
            sim = self._cosine_similarity(query_vector, item.vector)
            if sim >= threshold:
                similarities.append((sim, item))
        
        # Sort by similarity descending
        similarities.sort(key=lambda x: x[0], reverse=True)
        
        return [item for _, item in similarities[:limit]]
    
    def search_by_metadata(
        self,
        key: str,
        value: Any,
        limit: int = 10
    ) -> List[MemoryItem]:
        """Search by metadata field."""
        matches = [
            item for item in self.items
            if item.metadata.get(key) == value
        ]
        return matches[:limit]
    
    @staticmethod
    def _cosine_similarity(v1: np.ndarray, v2: np.ndarray) -> float:
        """Compute cosine similarity between vectors."""
        norm1 = np.linalg.norm(v1)
        norm2 = np.linalg.norm(v2)
        
        if norm1 == 0 or norm2 == 0:
            return 0.0
        
        return float(np.dot(v1, v2) / (norm1 * norm2))
    
    def to_dict(self) -> dict:
        """Serialize to dictionary."""
        return {
            'items': [item.to_dict() for item in self.items],
            'count': len(self.items),
        }

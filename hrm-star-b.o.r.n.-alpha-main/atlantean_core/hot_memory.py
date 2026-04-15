"""
Hot Memory - Active Intelligence Field

Live, mutable field grids that represent current intelligence state.
Evolves through learning signals.
"""

import torch
import numpy as np
import json
import pickle
from datetime import datetime
from typing import Optional, Tuple
from pathlib import Path


class AtlanteanHotMemory:
    """
    Active intelligence fields in hot memory.
    
    - phi1: Decision/confidence field (32x32)
    - phi5: Plasticity/learning field (32x32)
    - Phi: Global coherence scalar
    """
    
    def __init__(
        self,
        grid_size: Tuple[int, int] = (32, 32),
        device_id: str = "default",
        identity = None
    ):
        """Initialize hot memory fields."""
        self.grid_size = grid_size
        self.device_id = device_id
        self.identity = identity
        self.version = 0
        self.last_update = datetime.now().timestamp()
        
        # Initialize fields
        self.phi1 = torch.randn(grid_size) * 0.1  # Decision field
        self.phi5 = torch.ones(grid_size) * 0.5   # Learning/plasticity field
        self.Phi = torch.tensor(0.5)              # Global coherence
        
        # Metadata
        self.creation_time = datetime.now().isoformat()
        self.update_count = 0
    
    @classmethod
    def initialize(
        cls,
        grid_size: Tuple[int, int] = (32, 32),
        device_id: str = "default",
        identity = None
    ):
        """Factory method for initialization."""
        return cls(grid_size, device_id, identity)
    
    def evolve(self, signal: torch.Tensor, strength: float = 1.0):
        """
        Evolve fields with a learning signal.
        
        Args:
            signal: Signal tensor (same shape as grid)
            strength: Signal strength multiplier
        """
        # Apply signal with adaptive strength based on phi5
        adaptive_strength = strength * self.phi5.mean().item()
        
        self.phi1 = self.phi1 + (signal * adaptive_strength * 0.1)
        
        # Plasticity decreases after learning
        self.phi5 = self.phi5 * (1.0 - 0.05 * adaptive_strength)
        
        # Update global coherence
        self._update_coherence()
        
        self.version += 1
        self.update_count += 1
        self.last_update = datetime.now().timestamp()
    
    def _update_coherence(self):
        """Compute global coherence from field states."""
        # Phi = mean alignment + learning potential
        alignment = torch.tanh(self.phi1).mean().item()
        plasticity = self.phi5.mean().item()
        
        self.Phi = torch.tensor(
            0.5 * alignment + 0.5 * plasticity
        )
    
    def snapshot(self) -> dict:
        """Create a snapshot of current state."""
        return {
            'phi1': self.phi1.detach().cpu().numpy().tolist(),
            'phi5': self.phi5.detach().cpu().numpy().tolist(),
            'Phi': float(self.Phi.item()),
            'version': self.version,
            'timestamp': datetime.now().isoformat(),
            'device_id': self.device_id,
            'grid_size': self.grid_size,
        }
    
    def save(self, path: str, identity=None):
        """Save to disk with optional identity verification."""
        data = {
            'phi1': self.phi1.detach().cpu().numpy(),
            'phi5': self.phi5.detach().cpu().numpy(),
            'Phi': float(self.Phi.item()),
            'version': self.version,
            'device_id': self.device_id,
            'grid_size': self.grid_size,
            'creation_time': self.creation_time,
            'update_count': self.update_count,
            'last_update': self.last_update,
        }
        
        if identity:
            data['identity_fingerprint'] = identity.fingerprint()
        
        Path(path).parent.mkdir(parents=True, exist_ok=True)
        
        with open(path, 'wb') as f:
            pickle.dump(data, f)
    
    @classmethod
    def load(cls, path: str, verify_identity=None):
        """Load from disk with optional identity verification."""
        with open(path, 'rb') as f:
            data = pickle.load(f)
        
        if verify_identity and 'identity_fingerprint' in data:
            if data['identity_fingerprint'] != verify_identity.fingerprint():
                raise ValueError("Identity fingerprint mismatch")
        
        instance = cls(
            grid_size=tuple(data['grid_size']),
            device_id=data['device_id']
        )
        
        instance.phi1 = torch.from_numpy(data['phi1']).float()
        instance.phi5 = torch.from_numpy(data['phi5']).float()
        instance.Phi = torch.tensor(data['Phi'])
        instance.version = data['version']
        instance.update_count = data['update_count']
        instance.creation_time = data['creation_time']
        instance.last_update = data['last_update']
        
        return instance
    
    def get_stats(self) -> dict:
        """Get field statistics."""
        return {
            'phi1_mean': float(self.phi1.mean().item()),
            'phi1_std': float(self.phi1.std().item()),
            'phi1_min': float(self.phi1.min().item()),
            'phi1_max': float(self.phi1.max().item()),
            'phi5_mean': float(self.phi5.mean().item()),
            'phi5_std': float(self.phi5.std().item()),
            'Phi': float(self.Phi.item()),
        }

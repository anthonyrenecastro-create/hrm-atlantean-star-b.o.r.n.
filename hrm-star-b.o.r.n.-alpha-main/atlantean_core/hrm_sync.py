"""
HRM ↔ Atlantean State Synchronization

Bidirectional integration that:
1. Syncs HRM state updates → Atlantean hot memory
2. Feeds Atlantean field state → HRM evolution
3. Auto-stores HRM simulations → Atlantean cold memory
4. Maintains unified intelligence state across both systems
"""

import torch
import numpy as np
import json
from typing import Dict, Any, Optional, Callable
from datetime import datetime


class HRMAtlanteanSync:
    """Bidirectional state sync between HRM and Atlantean."""
    
    def __init__(
        self,
        hot_memory,
        cold_memory,
        on_simulation_store: Optional[Callable] = None
    ):
        """
        Initialize sync engine.
        
        Args:
            hot_memory: Atlantean hot memory instance
            cold_memory: Atlantean cold memory instance
            on_simulation_store: Callback when storing simulations
        """
        self.hot_memory = hot_memory
        self.cold_memory = cold_memory
        self.on_simulation_store = on_simulation_store
        self.last_hrm_state = None
        self.hrm_update_count = 0
    
    def hrm_state_to_hot_memory(self, hrm_state: Dict[str, Any]) -> None:
        """
        Sync HRM state → Atlantean hot memory.
        
        Maps HRM metrics to Atlantean field values:
        - HRM coherence → phi1 (decision field)
        - HRM precision → phi5 (learning field)
        - HRM optimization → Phi (global coherence)
        """
        if not hrm_state:
            return
        
        # Extract HRM metrics
        coherence = hrm_state.get('coherence', 0.5)
        precision = hrm_state.get('precision', 0.5)
        optimization = hrm_state.get('optimization', 0.5)
        fractal_depth = hrm_state.get('fractalDepth', 0.5)
        stability = hrm_state.get('stability', 0.5)
        
        # Create signal from HRM state
        signal = torch.randn(self.hot_memory.phi1.shape) * 0.05
        
        # Modulate signal by HRM metrics
        signal = signal * (coherence * 0.4 + precision * 0.3 + fractal_depth * 0.3)
        
        # Apply to hot memory
        adaptive_strength = optimization + (1.0 - stability) * 0.2
        self.hot_memory.evolve(signal, strength=adaptive_strength)
        
        # Update metadata
        self.hot_memory.metadata = {
            'hrm_coherence': float(coherence),
            'hrm_precision': float(precision),
            'hrm_optimization': float(optimization),
            'hrm_fractal_depth': float(fractal_depth),
            'hrm_stability': float(stability),
            'theta': float(hrm_state.get('theta', 0)),
            'channel': int(hrm_state.get('channel', 1)),
            'domain': int(hrm_state.get('domain', 1)),
            'layer': int(hrm_state.get('layer', 1)),
        }
        
        self.last_hrm_state = hrm_state
        self.hrm_update_count += 1
    
    def hot_memory_to_hrm_feedback(self) -> Dict[str, Any]:
        """
        Extract Atlantean hot memory state → HRM feedback signals.
        
        Returns field state that can influence HRM evolution.
        """
        return {
            'phi1_mean': float(self.hot_memory.phi1.mean().item()),
            'phi1_std': float(self.hot_memory.phi1.std().item()),
            'phi1_max': float(self.hot_memory.phi1.max().item()),
            'phi1_min': float(self.hot_memory.phi1.min().item()),
            'phi5_mean': float(self.hot_memory.phi5.mean().item()),
            'phi5_plasticity': float(self.hot_memory.phi5.std().item()),
            'Phi': float(self.hot_memory.Phi.item()),
            'version': self.hot_memory.version,
            'update_count': self.hot_memory.update_count,
        }
    
    def store_hrm_simulation(
        self,
        simulation: Dict[str, Any],
        hrm_state: Dict[str, Any],
        confidence: float = 0.75
    ) -> None:
        """
        Auto-store HRM simulation → Atlantean cold memory.
        
        Called during normal HRM evolution to capture important states.
        """
        if not simulation:
            return
        
        # Build simulation record
        record = {
            'type': 'hrm_simulation',
            'theta': hrm_state.get('theta', 0),
            'coherence': hrm_state.get('coherence', 0),
            'stability': hrm_state.get('stability', 0),
            'optimization': hrm_state.get('optimization', 0),
            'fractal_depth': hrm_state.get('fractalDepth', 0),
            'simulation': simulation,
            'confidence': confidence,
            'timestamp': datetime.now().isoformat(),
        }
        
        # Serialize to content
        content = json.dumps(record)
        
        # Store in cold memory with metadata
        try:
            self.cold_memory.store(
                content=content,
                metadata={
                    'type': 'hrm_simulation',
                    'confidence': confidence,
                    'theta': float(hrm_state.get('theta', 0)),
                    'timestamp': datetime.now().isoformat(),
                }
            )
            
            # Notify callback
            if self.on_simulation_store:
                self.on_simulation_store(record)
        
        except Exception as e:
            print(f"Warning: Failed to store simulation: {e}")
    
    def get_unified_state(self) -> Dict[str, Any]:
        """Get current unified state combining HRM + Atlantean."""
        return {
            'hrm': self.last_hrm_state or {},
            'atlantean_hot': self.hot_memory_to_hrm_feedback(),
            'atlantean_version': self.hot_memory.version,
            'sync_count': self.hrm_update_count,
            'timestamp': datetime.now().isoformat(),
        }


class HRMFieldInfluence:
    """
    Applies Atlantean field state as perturbations to HRM evolution.
    
    This creates the feedback loop: Atlantean fields → HRM evolution.
    """
    
    def __init__(self, hot_memory):
        """Initialize with Atlantean hot memory."""
        self.hot_memory = hot_memory
    
    def compute_hrm_perturbation(self, hrm_state: Dict[str, Any]) -> np.ndarray:
        """
        Compute HRM perturbation from Atlantean fields.
        
        The perturbation is a 24-component vector that influences
        HRM state vector evolution through the normal HRM dynamics.
        """
        # Extract field means
        phi1_mean = float(self.hot_memory.phi1.mean().item())
        phi5_mean = float(self.hot_memory.phi5.mean().item())
        phi_global = float(self.hot_memory.Phi.item())
        
        # Build 24-component perturbation
        perturbation = np.zeros(24)
        
        # Distribute field influence across state vector components
        for i in range(24):
            # Component 0-7: phi1 influence (confidence/decision)
            if i < 8:
                perturbation[i] = phi1_mean * 0.1 * np.sin(i * 0.5)
            # Component 8-15: phi5 influence (plasticity/learning)
            elif i < 16:
                perturbation[i] = (phi5_mean - 0.5) * 0.1 * np.cos((i - 8) * 0.5)
            # Component 16-23: global coherence influence
            else:
                perturbation[i] = (phi_global - 0.5) * 0.08 * np.sin((i - 16) * 0.3)
        
        # Modulate by theta for phase alignment
        theta = hrm_state.get('theta', 0)
        phase_modulation = np.sin(theta * np.pi * 2) * 0.5 + 0.5
        perturbation = perturbation * phase_modulation
        
        # Modulate by stability (high stability = less field influence)
        stability = hrm_state.get('stability', 0.5)
        perturbation = perturbation * (1.0 - stability * 0.3)
        
        return perturbation
    
    def apply_to_state_vector(
        self,
        state_vector: np.ndarray,
        hrm_state: Dict[str, Any]
    ) -> np.ndarray:
        """Apply Atlantean field influence to HRM state vector."""
        perturbation = self.compute_hrm_perturbation(hrm_state)
        
        # Blend perturbation with state vector
        # Strong fields have more influence on evolution
        influence_strength = (
            self.hot_memory.phi1.std().item() * 0.3 +
            self.hot_memory.phi5.mean().item() * 0.2
        )
        
        updated_vector = state_vector + perturbation * influence_strength * 0.1
        
        # Clamp to valid range
        return np.clip(updated_vector, -1.0, 1.0)

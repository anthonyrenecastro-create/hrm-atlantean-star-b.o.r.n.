"""
Learning Signals - Adapt Intelligence from Feedback

Functions to apply various learning signals to hot memory fields.
"""

import torch
import numpy as np
from typing import Optional


def apply_learning_signal(
    hot_memory,
    signal_strength: float = 0.5
):
    """
    Apply positive learning signal.
    
    Strengthens patterns that led to good outcomes.
    """
    signal = torch.randn(hot_memory.grid_size) * signal_strength
    hot_memory.evolve(signal, strength=signal_strength)


def apply_contradiction_signal(hot_memory):
    """
    Apply contradiction signal.
    
    Used when user corrects or rejects a response.
    Weakens confidence in current patterns.
    """
    signal = torch.randn(hot_memory.grid_size) * -0.3
    hot_memory.evolve(signal, strength=-0.3)


def apply_outcome_signal(
    hot_memory,
    predicted: bool,
    actual: bool
):
    """
    Apply prediction outcome signal.
    
    Args:
        predicted: Whether prediction was made
        actual: Actual outcome
    """
    if predicted == actual:
        # Correct prediction
        signal = torch.randn(hot_memory.grid_size) * 0.4
        hot_memory.evolve(signal, strength=0.4)
    else:
        # Incorrect prediction
        signal = torch.randn(hot_memory.grid_size) * -0.2
        hot_memory.evolve(signal, strength=-0.2)


def apply_relevance_signal(
    hot_memory,
    relevance_score: float
):
    """
    Apply relevance signal.
    
    Based on how relevant/on-topic the interaction was.
    """
    signal = torch.randn(hot_memory.grid_size) * relevance_score
    hot_memory.evolve(signal, strength=relevance_score)


def compute_learning_capacity(hot_memory) -> float:
    """
    Compute current learning capacity.
    
    Returns value between 0 and 1.
    Higher = more able to learn new things.
    Lower = patterns consolidating.
    """
    # Learning capacity based on phi5 (plasticity)
    plasticity = hot_memory.phi5.mean().item()
    
    # Normalize to [0, 1]
    capacity = 0.5 + 0.5 * np.tanh(plasticity)
    
    return float(capacity)

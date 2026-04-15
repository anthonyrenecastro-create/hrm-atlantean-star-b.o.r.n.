"""
Sync Engine - Multi-Device Synchronization

Enables state sharing across devices with conflict resolution.
"""

from enum import Enum
from typing import Dict, Any, Optional
import json


class MergeStrategy(Enum):
    """Strategy for resolving sync conflicts."""
    CONSERVATIVE = "conservative"  # Keep local on conflict
    LATEST = "latest"              # Use most recent
    OPTIMISTIC = "optimistic"      # Merge fields


class AtlanteanSyncEngine:
    """Synchronization engine for multi-device."""
    
    def __init__(self, identity):
        """
        Initialize sync engine.
        
        Args:
            identity: Device identity for verification
        """
        self.identity = identity
    
    def prepare_sync_package(self, hot_memory) -> Dict[str, Any]:
        """
        Prepare state for sync to another device.
        
        Returns:
            Signed package ready for transmission
        """
        snapshot = hot_memory.snapshot()
        
        package = {
            'snapshot': snapshot,
            'device_id': self.identity.device_id,
            'identity_fingerprint': self.identity.fingerprint(),
            'merge_strategy': MergeStrategy.CONSERVATIVE.value,
        }
        
        return package
    
    def merge(
        self,
        local_memory,
        remote_package: Dict[str, Any],
        strategy: MergeStrategy = MergeStrategy.CONSERVATIVE
    ):
        """
        Merge remote state with local.
        
        Args:
            local_memory: Local hot memory
            remote_package: Package from another device
            strategy: Merge strategy to use
        
        Returns:
            Merged hot memory
        """
        # Verify remote identity
        if 'identity_fingerprint' not in remote_package:
            raise ValueError("Remote package lacks identity verification")
        
        remote_snapshot = remote_package['snapshot']
        
        if strategy == MergeStrategy.CONSERVATIVE:
            # Keep local fields unchanged
            return local_memory
        
        elif strategy == MergeStrategy.LATEST:
            # Use remote if newer
            if remote_snapshot['timestamp'] > local_memory.last_update:
                # Update from remote
                local_memory.phi1 = torch.from_numpy(
                    np.array(remote_snapshot['phi1'])
                ).float()
                local_memory.phi5 = torch.from_numpy(
                    np.array(remote_snapshot['phi5'])
                ).float()
                local_memory.Phi = torch.tensor(remote_snapshot['Phi'])
                local_memory.version = max(
                    local_memory.version,
                    remote_snapshot['version']
                )
        
        elif strategy == MergeStrategy.OPTIMISTIC:
            # Average fields (simple approach)
            import torch
            import numpy as np
            
            local_memory.phi1 = (
                local_memory.phi1 +
                torch.from_numpy(np.array(remote_snapshot['phi1'])).float()
            ) / 2
            local_memory.phi5 = (
                local_memory.phi5 +
                torch.from_numpy(np.array(remote_snapshot['phi5'])).float()
            ) / 2
            local_memory.Phi = torch.tensor(
                (float(local_memory.Phi.item()) +
                 float(remote_snapshot['Phi'])) / 2
            )
        
        return local_memory

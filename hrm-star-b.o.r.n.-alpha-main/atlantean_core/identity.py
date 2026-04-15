"""
Identity - Cryptographic Device Identity

For multi-device sync verification.
"""

import hashlib
import json
from typing import Optional, Dict, Any


class AtlanteanIdentity:
    """Device identity for multi-device sync."""
    
    def __init__(
        self,
        device_id: str,
        metadata: Optional[Dict[str, Any]] = None
    ):
        """
        Initialize identity.
        
        Args:
            device_id: Unique device identifier
            metadata: Device metadata
        """
        self.device_id = device_id
        self.metadata = metadata or {}
    
    def fingerprint(self) -> str:
        """
        Generate identity fingerprint.
        
        Used to verify state integrity across devices.
        """
        data = {
            'device_id': self.device_id,
            'metadata': self.metadata
        }
        
        json_str = json.dumps(data, sort_keys=True)
        return hashlib.sha256(json_str.encode()).hexdigest()
    
    def verify(self, fingerprint: str) -> bool:
        """Verify against fingerprint."""
        return self.fingerprint() == fingerprint

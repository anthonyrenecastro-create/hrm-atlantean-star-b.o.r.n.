"""
useAtlanteanBridge.ts - React Hook for Atlantean Intelligence

Example of how to use Atlantean in React components.
This replaces Quadra-Seer's state management with Atlantean field dynamics.
"""

// In src/hooks/useAtlanteanBridge.ts (TypeScript)

import { useState, useEffect, useCallback } from 'react';

interface AtlanteanStatus {
  device_id: string;
  version: number;
  last_update: string;
  learning_capacity: number;
  cold_memory_items: number;
  field_stats: {
    phi1_mean: number;
    phi5_mean: number;
    Phi: number;
  };
}

interface FieldVisualization {
  phi1: number[][];
  phi5: number[][];
  Phi: number;
  version: number;
  learning_capacity: number;
}

export function useAtlanteanBridge() {
  const [status, setStatus] = useState<AtlanteanStatus | null>(null);
  const [fields, setFields] = useState<FieldVisualization | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch current status
  const getStatus = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/atlantean/status');
      const data = await response.json();
      setStatus(data);
      return data;
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch field visualization
  const getFields = useCallback(async () => {
    try {
      const response = await fetch('/api/atlantean/fields');
      const data = await response.json();
      setFields(data);
      return data;
    } catch (err) {
      setError(String(err));
    }
  }, []);

  // Query with Atlantean
  const query = useCallback(async (input: string) => {
    try {
      setLoading(true);
      const response = await fetch('/api/atlantean/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input }),
      });
      const data = await response.json();
      return data;
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  // Trigger learning event
  const triggerLearning = useCallback(
    async (
      event:
        | 'user_confirmation'
        | 'user_correction'
        | 'user_positive_feedback'
        | 'user_negative_feedback'
        | 'prediction_success'
        | 'prediction_failure'
        | 'high_engagement'
        | 'low_engagement'
        | string,
      data: any = {}
    ) => {
      try {
        const response = await fetch('/api/atlantean/learning-event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ event, data }),
        });
        const result = await response.json();
        setStatus(result.status);
        return result;
      } catch (err) {
        setError(String(err));
      }
    },
    []
  );

  // Store simulation
  const storeSimulation = useCallback(async (simulation: any, confidence?: number) => {
    try {
      const response = await fetch('/api/atlantean/simulation/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ simulation, confidence: confidence || 0.5 }),
      });
      return await response.json();
    } catch (err) {
      setError(String(err));
    }
  }, []);

  // Create snapshot
  const createSnapshot = useCallback(async (label?: string) => {
    try {
      const response = await fetch('/api/atlantean/snapshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label }),
      });
      return await response.json();
    } catch (err) {
      setError(String(err));
    }
  }, []);

  // Load status on mount
  useEffect(() => {
    getStatus();
    getFields();

    // Refresh status periodically
    const interval = setInterval(() => {
      getStatus();
      getFields();
    }, 10000); // Every 10 seconds

    return () => clearInterval(interval);
  }, [getStatus, getFields]);

  return {
    status,
    fields,
    loading,
    error,
    query,
    triggerLearning,
    storeSimulation,
    createSnapshot,
    getStatus,
    getFields,
  };
}

/**
 * Usage in components:
 *
 * function ChatInterface() {
 *   const { query, triggerLearning, status } = useAtlanteanBridge();
 *   const [response, setResponse] = useState('');
 *
 *   const handleSend = async (message: string) => {
 *     const result = await query(message);
 *     setResponse(result.response);
 *   };
 *
 *   const handleFeedback = (positive: boolean) => {
 *     if (positive) {
 *       triggerLearning('user_positive_feedback');
 *     } else {
 *       triggerLearning('user_negative_feedback');
 *     }
 *   };
 *
 *   return (
 *     <div>
 *       <div className="response">{response}</div>
 *       <button onClick={() => handleFeedback(true)}>👍 Helpful</button>
 *       <button onClick={() => handleFeedback(false)}>👎 Not helpful</button>
 *       <div className="status">
 *         Learning capacity: {(status?.learning_capacity || 0).toFixed(1)}%
 *       </div>
 *     </div>
 *   );
 * }
 */

"""
AtlanteanChatInterface.tsx - Example React Component

Complete example of using Atlantean Intelligence in a React component.
Shows query processing, learning events, field visualization, and feedback.
"""

import React, { useState, useEffect } from 'react';
import { useAtlanteanBridge } from '../hooks/useAtlanteanBridge';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function AtlanteanChatInterface() {
  const {
    query,
    triggerLearning,
    status,
    fields,
    storeSimulation,
    createSnapshot,
    getStatus,
  } = useAtlanteanBridge();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showFieldsPanel, setShowFieldsPanel] = useState(false);
  const [lastMessageId, setLastMessageId] = useState<string | null>(null);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    setLoading(true);

    // Add user message
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    try {
      // Query Atlantean
      const result = await query(input);

      // Add assistant response
      const assistantMsg: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: result.response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setLastMessageId(assistantMsg.id);

      // Auto-trigger neutral engagement
      await triggerLearning('high_engagement', { duration: 5 });
    } catch (error) {
      console.error('Query failed:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: 'Error processing query. Please try again.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async (type: 'helpful' | 'unhelpful') => {
    if (!lastMessageId) return;

    const event =
      type === 'helpful' ? 'user_positive_feedback' : 'user_negative_feedback';

    await triggerLearning(event, {
      message_id: lastMessageId,
      timestamp: new Date().toISOString(),
    });

    // Visual feedback
    alert(
      `👍 Feedback recorded! Intelligence learning capacity: ${(
        (status?.learning_capacity || 0) * 100
      ).toFixed(1)}%`
    );
  };

  const handleSimulationStore = async () => {
    const simulation = {
      scenario: 'test_scenario',
      parameters: { temperature: 0.7, max_tokens: 500 },
      result: 'simulation_completed',
      timestamp: new Date().toISOString(),
    };

    try {
      await storeSimulation(simulation, 0.85);
      alert('📊 Simulation stored in cold memory!');
    } catch (error) {
      console.error('Failed to store simulation:', error);
    }
  };

  const handleSnapshot = async () => {
    try {
      const snapshot = await createSnapshot(
        `Snapshot at ${new Date().toLocaleTimeString()}`
      );
      alert('📸 Snapshot created! Version: ' + snapshot.snapshot.version);
    } catch (error) {
      console.error('Failed to create snapshot:', error);
    }
  };

  const getFieldColor = (value: number) => {
    if (value > 0.5) return 'bg-green-500';
    if (value > 0) return 'bg-blue-500';
    if (value > -0.5) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-700 p-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">🧠 Atlantean Intelligence</h1>
            <p className="text-slate-400 text-sm">
              Powered by HRM Engine & Gemini
            </p>
          </div>

          {/* Status Badge */}
          {status && (
            <div className="bg-slate-800 px-4 py-2 rounded-lg border border-slate-700">
              <div className="text-sm text-slate-300">
                📊 Learning Capacity
              </div>
              <div className="text-2xl font-bold text-blue-400">
                {(status.learning_capacity * 100).toFixed(0)}%
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex gap-4 p-4 max-w-6xl mx-auto w-full">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-center">
                <div>
                  <div className="text-4xl mb-4">🚀</div>
                  <p className="text-slate-400">
                    Start a conversation with Atlantean Intelligence
                  </p>
                  <p className="text-slate-500 text-sm mt-2">
                    Your responses help train the intelligence through learning signals
                  </p>
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-700 text-slate-100'
                    }`}
                  >
                    <p className="text-sm">{msg.content}</p>
                    <p className="text-xs mt-1 opacity-50">
                      {msg.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))
            )}
            {loading && (
              <div className="flex justify-center">
                <div className="text-slate-400 text-sm">⏳ Processing...</div>
              </div>
            )}
          </div>

          {/* Feedback Buttons (show after last message) */}
          {lastMessageId && !loading && (
            <div className="border-t border-slate-700 p-3 flex gap-2 justify-center">
              <button
                onClick={() => handleFeedback('helpful')}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition"
              >
                👍 Helpful
              </button>
              <button
                onClick={() => handleFeedback('unhelpful')}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition"
              >
                👎 Not Helpful
              </button>
            </div>
          )}

          {/* Input Area */}
          <div className="border-t border-slate-700 p-4 bg-slate-900">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !loading) {
                    handleSendMessage();
                  }
                }}
                placeholder="Ask Atlantean Intelligence..."
                className="flex-1 px-4 py-2 bg-slate-700 text-white placeholder-slate-400 rounded border border-slate-600 focus:border-blue-500 focus:outline-none"
                disabled={loading}
              />
              <button
                onClick={handleSendMessage}
                disabled={loading || !input.trim()}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded transition"
              >
                Send
              </button>
            </div>
          </div>
        </div>

        {/* Side Panel - Fields & Controls */}
        <div className="w-80 space-y-4">
          {/* Field Visualization */}
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
            <button
              onClick={() => setShowFieldsPanel(!showFieldsPanel)}
              className="w-full text-left font-bold text-white mb-3 flex justify-between items-center"
            >
              🔬 Intelligence Fields
              <span className="text-sm">{showFieldsPanel ? '▼' : '▶'}</span>
            </button>

            {showFieldsPanel && status && (
              <div className="space-y-3 text-sm">
                {/* Phi1 - Decision Confidence */}
                <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-slate-300">φ₁ Confidence</label>
                    <span className="text-white font-mono">
                      {status.field_stats.phi1_mean.toFixed(3)}
                    </span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${getFieldColor(
                        status.field_stats.phi1_mean
                      )}`}
                      style={{
                        width: `${
                          ((status.field_stats.phi1_mean + 1) / 2) * 100
                        }%`,
                      }}
                    />
                  </div>
                  <p className="text-slate-500 text-xs mt-1">
                    {status.field_stats.phi1_mean > 0.5
                      ? '🟢 High confidence'
                      : status.field_stats.phi1_mean < -0.5
                        ? '🔴 Learning mode'
                        : '🟡 Balanced'}
                  </p>
                </div>

                {/* Phi5 - Learning Plasticity */}
                <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-slate-300">φ₅ Plasticity</label>
                    <span className="text-white font-mono">
                      {status.field_stats.phi5_mean.toFixed(3)}
                    </span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-purple-500 transition-all"
                      style={{
                        width: `${status.field_stats.phi5_mean * 100}%`,
                      }}
                    />
                  </div>
                  <p className="text-slate-500 text-xs mt-1">
                    {status.field_stats.phi5_mean > 0.7
                      ? '🟣 High plasticity - learning'
                      : status.field_stats.phi5_mean < 0.3
                        ? '🔵 Low plasticity - stable'
                        : '⚫ Moderate plasticity'}
                  </p>
                </div>

                {/* Phi - Global Coherence */}
                <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-slate-300">Φ Coherence</label>
                    <span className="text-white font-mono">
                      {status.field_stats.Phi.toFixed(3)}
                    </span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-cyan-500 transition-all"
                      style={{ width: `${status.field_stats.Phi * 100}%` }}
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-700">
                  <p className="text-slate-400 text-xs">
                    Cold Memory: {status.cold_memory_items} items
                  </p>
                  <p className="text-slate-400 text-xs">
                    Version: {status.version}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-4 space-y-2">
            <button
              onClick={handleSimulationStore}
              className="w-full px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm transition"
            >
              📊 Store Simulation
            </button>
            <button
              onClick={handleSnapshot}
              className="w-full px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm transition"
            >
              📸 Create Snapshot
            </button>
            <button
              onClick={getStatus}
              className="w-full px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm transition"
            >
              🔄 Refresh Status
            </button>
          </div>

          {/* Info Box */}
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-4 text-xs text-slate-400">
            <p className="font-bold text-white mb-2">💡 How it works:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>φ₁ tracks decision confidence</li>
              <li>φ₅ tracks learning capacity</li>
              <li>Feedback signals update fields</li>
              <li>Simulations stored in cold memory</li>
              <li>No conversation history kept</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AtlanteanChatInterface;

'use client';

import React, { useState } from 'react';
import { Agent, ID } from '../server/types';

interface GodMessagePanelProps {
  agents: Agent[];
  onSendMessage: (message: string, targetAgentIds: ID[]) => void;
}

export default function GodMessagePanel({ agents, onSendMessage }: GodMessagePanelProps) {
  const [message, setMessage] = useState('');
  const [targetMode, setTargetMode] = useState<'all' | 'selected'>('all');
  const [selectedAgentIds, setSelectedAgentIds] = useState<Set<ID>>(new Set());

  const aliveAgents = agents.filter(a => a.alive);

  const handleToggleAgent = (agentId: ID) => {
    const newSelected = new Set(selectedAgentIds);
    if (newSelected.has(agentId)) {
      newSelected.delete(agentId);
    } else {
      newSelected.add(agentId);
    }
    setSelectedAgentIds(newSelected);
  };

  const handleSend = () => {
    if (!message.trim()) return;

    const targets = targetMode === 'all'
      ? []
      : Array.from(selectedAgentIds);

    onSendMessage(message, targets);
    setMessage('');
    setSelectedAgentIds(new Set());
  };

  const canSend = message.trim() && (
    targetMode === 'all' || selectedAgentIds.size > 0
  );

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h2 className="text-lg font-bold text-white mb-3">✨ GOD Message</h2>

      {/* Target mode selector */}
      <div className="mb-3">
        <label className="text-sm text-gray-400 mb-2 block">Recipients</label>
        <div className="flex gap-2">
          <button
            onClick={() => setTargetMode('all')}
            className={`flex-1 py-2 px-3 rounded text-sm transition-colors ${
              targetMode === 'all'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            All Agents ({aliveAgents.length})
          </button>
          <button
            onClick={() => setTargetMode('selected')}
            className={`flex-1 py-2 px-3 rounded text-sm transition-colors ${
              targetMode === 'selected'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Selected ({selectedAgentIds.size})
          </button>
        </div>
      </div>

      {/* Agent selector (only shown in selected mode) */}
      {targetMode === 'selected' && (
        <div className="mb-3 max-h-32 overflow-y-auto bg-gray-700 rounded p-2">
          <div className="space-y-1">
            {aliveAgents.map(agent => (
              <label
                key={agent.id}
                className="flex items-center gap-2 text-sm text-gray-300 hover:text-white cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedAgentIds.has(agent.id)}
                  onChange={() => handleToggleAgent(agent.id)}
                  className="rounded"
                />
                <span>
                  {agent.name}
                  <span className="text-xs text-gray-500 ml-2">
                    ({agent.status}, {agent.gender})
                  </span>
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Message input */}
      <div className="mb-3">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Speak as GOD..."
          rows={4}
          className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-purple-500 focus:outline-none resize-none"
        />
        <div className="text-xs text-gray-500 mt-1">
          {message.length} characters
        </div>
      </div>

      {/* Send button */}
      <button
        onClick={handleSend}
        disabled={!canSend}
        className={`w-full py-2 rounded font-semibold transition-colors ${
          canSend
            ? 'bg-purple-600 text-white hover:bg-purple-700'
            : 'bg-gray-700 text-gray-500 cursor-not-allowed'
        }`}
      >
        Send Divine Message
      </button>

      {/* Instructions */}
      <div className="mt-3 pt-3 border-t border-gray-700 text-xs text-gray-400">
        <p>GOD messages are delivered directly to agents' memories and appear in the event log.</p>
      </div>
    </div>
  );
}

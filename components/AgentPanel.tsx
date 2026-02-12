'use client';

import React from 'react';
import { Agent, World } from '../server/types';

interface AgentPanelProps {
  agent: Agent | null;
  world: World;
}

export default function AgentPanel({ agent, world }: AgentPanelProps) {
  if (!agent) {
    return (
      <div className="bg-gray-800 rounded-lg p-4 h-full overflow-y-auto">
        <h2 className="text-lg font-bold text-white mb-4">Agent Details</h2>
        <p className="text-gray-400 text-sm">Select an agent to view details</p>
      </div>
    );
  }

  const ageInDays = Math.floor(agent.age / 24);

  return (
    <div className="bg-gray-800 rounded-lg p-4 h-full overflow-y-auto">
      <h2 className="text-lg font-bold text-white mb-4">Agent Details</h2>

      {/* Basic Info */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-2">Basic Info</h3>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Name:</span>
            <span className="text-white">{agent.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">ID:</span>
            <span className="text-gray-500 font-mono text-xs">{agent.id.slice(0, 8)}...</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Gender:</span>
            <span className="text-white">{agent.gender === 'male' ? '♂ Male' : '♀ Female'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Age:</span>
            <span className="text-white">{ageInDays} days ({agent.age} ticks)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Status:</span>
            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
              agent.status === 'adult' ? 'bg-green-600 text-white' :
              agent.status === 'child' ? 'bg-blue-600 text-white' :
              agent.status === 'elder' ? 'bg-purple-600 text-white' :
              'bg-red-600 text-white'
            }`}>
              {agent.status}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Happiness:</span>
            <span className="text-white">{agent.happiness}/100</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Location:</span>
            <span className="text-white font-mono">({agent.location.x}, {agent.location.y})</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Visibility:</span>
            <span className="text-white">{agent.visibilityRadius} tiles</span>
          </div>
        </div>
      </div>

      {/* Status Badges */}
      <div className="mb-4 flex flex-wrap gap-2">
        {!agent.alive && <span className="px-2 py-1 bg-red-600 text-white text-xs rounded">DEAD</span>}
        {agent.starving && <span className="px-2 py-1 bg-orange-600 text-white text-xs rounded">STARVING</span>}
        {agent.pregnancy && <span className="px-2 py-1 bg-pink-600 text-white text-xs rounded">PREGNANT</span>}
      </div>

      {/* Pregnancy Info */}
      {agent.pregnancy && (
        <div className="mb-4 p-2 bg-pink-900/30 rounded border border-pink-600">
          <h3 className="text-sm font-semibold text-pink-300 mb-1">Pregnancy</h3>
          <div className="text-xs text-pink-200">
            <div>Partner: {agent.pregnancy.partnerId.slice(0, 8)}...</div>
            <div>Duration: {agent.pregnancy.duration} ticks</div>
            <div>Progress: {world.time - agent.pregnancy.startTick} / {agent.pregnancy.duration}</div>
          </div>
        </div>
      )}

      {/* Inventory */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-2">Inventory</h3>
        <div className="grid grid-cols-5 gap-2">
          {Object.entries(agent.inventory).map(([resource, amount]) => (
            <div key={resource} className="bg-gray-700 p-2 rounded text-center">
              <div className="text-2xl mb-1">
                {resource === 'wood' && '🪵'}
                {resource === 'stone' && '🪨'}
                {resource === 'water' && '💧'}
                {resource === 'food' && '🍖'}
                {resource === 'tools' && '🔧'}
              </div>
              <div className="text-xs text-gray-400">{resource}</div>
              <div className="text-sm font-bold text-white">{amount}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Nutrition */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-2">Nutrition</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Meals today:</span>
            <span className="text-white">{agent.mealsEaten}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Last meal:</span>
            <span className="text-white">{world.time - agent.lastMealTick} ticks ago</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full"
              style={{ width: `${Math.min(100, (agent.mealsEaten / 3) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Relationships */}
      {agent.relationships.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-300 mb-2">Relationships</h3>
          <div className="space-y-2">
            {agent.relationships.map(rel => {
              const otherAgent = world.agents.find(a => a.id === rel.agentId);
              if (!otherAgent) return null;
              return (
                <div key={rel.agentId} className="bg-gray-700 p-2 rounded">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-white">{otherAgent.name}</span>
                    <span className={`px-1.5 py-0.5 rounded text-xs ${
                      rel.type === 'trust' ? 'bg-blue-600' :
                      rel.type === 'friendship' ? 'bg-green-600' :
                      'bg-red-600'
                    } text-white`}>
                      {rel.type}
                    </span>
                  </div>
                  <div className="w-full bg-gray-600 rounded-full h-1.5">
                    <div
                      className="bg-blue-400 h-1.5 rounded-full"
                      style={{ width: `${Math.min(100, rel.value)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Memory */}
      <div>
        <h3 className="text-sm font-semibold text-gray-300 mb-2">Recent Memory</h3>
        <div className="space-y-1">
          {agent.memory.slice(-10).reverse().map((mem, i) => (
            <div key={i} className="text-xs bg-gray-700 p-2 rounded font-mono">
              <span className="text-gray-400">[{mem.tick}]</span> {mem.description}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

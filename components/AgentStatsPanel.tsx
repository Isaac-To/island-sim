import React from 'react';
import { Agent, World } from '../server/types';

interface AgentStatsPanelProps {
  agent: Agent;
  world: World;
}

export default function AgentStatsPanel({ agent, world }: AgentStatsPanelProps) {
  // For now, reuse AgentPanel's layout, but can be expanded for more effects/stats
  return (
    <div className="text-white">
      <div className="mb-2">Name: <span className="font-mono">{agent.name}</span></div>
      <div className="mb-2">ID: <span className="font-mono text-xs">{agent.id}</span></div>
      <div className="mb-2">Gender: {agent.gender}</div>
      <div className="mb-2">Age: {Math.floor(agent.age / 24)} days ({agent.age} ticks)</div>
      <div className="mb-2">Status: {agent.status}</div>
      <div className="mb-2">Happiness: {agent.happiness}/100</div>
      <div className="mb-2">Alive: {agent.alive ? 'Yes' : 'No'}</div>
      <div className="mb-2">Starving: {agent.starving ? 'Yes' : 'No'}</div>
      <div className="mb-2">Meals eaten: {agent.mealsEaten}</div>
      <div className="mb-2">Last meal: {world.time - agent.lastMealTick} ticks ago</div>
      <div className="mb-2">Location: ({agent.location.x}, {agent.location.y})</div>
      <div className="mb-2">Visibility: {agent.visibilityRadius} tiles</div>

      {/* Inventory */}
      <div className="mt-4 pt-4 border-t border-gray-700">
        <h3 className="text-md font-semibold mb-3">Inventory</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="bg-gray-800 rounded p-2 flex items-center justify-between">
            <span>🪵 Wood</span>
            <span className="font-mono font-bold">{agent.inventory.wood}</span>
          </div>
          <div className="bg-gray-800 rounded p-2 flex items-center justify-between">
            <span>🪨 Stone</span>
            <span className="font-mono font-bold">{agent.inventory.stone}</span>
          </div>
          <div className="bg-gray-800 rounded p-2 flex items-center justify-between">
            <span>💧 Water</span>
            <span className="font-mono font-bold">{agent.inventory.water}</span>
          </div>
          <div className="bg-gray-800 rounded p-2 flex items-center justify-between">
            <span>🍖 Food</span>
            <span className="font-mono font-bold">{agent.inventory.food}</span>
          </div>
          <div className="bg-gray-800 rounded p-2 flex items-center justify-between col-span-2">
            <span>🔧 Tools</span>
            <span className="font-mono font-bold">{agent.inventory.tools}</span>
          </div>
        </div>
      </div>
      {/* Add more stats/effects here as needed */}
    </div>
  );
}

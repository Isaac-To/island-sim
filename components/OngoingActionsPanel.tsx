'use client';

import React, { useMemo } from 'react';
import { Event, World } from '../server/types';

interface OngoingActionsPanelProps {
  events: Event[];
  currentTick: number;
  world: World;
}

export default function OngoingActionsPanel({ events, currentTick, world }: OngoingActionsPanelProps) {
  // Get events from current tick
  const currentEvents = useMemo(() => {
    return events.filter(e => e.tick === currentTick);
  }, [events, currentTick]);

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'move': return '🚶';
      case 'communicate': return '💬';
      case 'craft': return '🔧';
      case 'gather': return '🧺';
      case 'build': return '🏠';
      case 'procreate': return '❤️';
      case 'give': return '🎁';
      case 'create_crop_field': return '🌱';
      case 'harvest_crop': return '🌾';
      case 'birth': return '👶';
      case 'death': return '💀';
      case 'weather_change': return '🌤️';
      case 'god_message': return '✨';
      case 'resource_drop': return '📦';
      default: return '•';
    }
  };

  const getAgentName = (agentId: string) => {
    const agent = world.agents.find(a => a.id === agentId);
    return agent?.name || agentId.slice(0, 8);
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h2 className="text-lg font-bold text-white mb-3">Ongoing Actions</h2>
      <div className="text-sm text-gray-400 mb-2">Tick {currentTick}</div>

      {currentEvents.length === 0 ? (
        <div className="text-gray-500 text-sm italic">No actions this tick</div>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {currentEvents.map((event, index) => (
            <div
              key={event.id || index}
              className="bg-gray-700 p-2 rounded flex items-start gap-2 hover:bg-gray-600 transition-colors"
            >
              <span className="text-xl">{getEventIcon(event.type)}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-white capitalize">
                  {event.type.replace(/_/g, ' ')}
                </div>
                <div className="text-xs text-gray-400 truncate">
                  {event.agentsInvolved.length > 0 && (
                    <>By: {event.agentsInvolved.map(id => getAgentName(id)).join(', ')} </>
                  )}
                  {event.type === 'weather_change' && (
                    <>Now: {event.details.weather}</>
                  )}
                  {event.type === 'god_message' && (
                    <>"{event.details.message}"</>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tick info */}
      <div className="mt-3 pt-3 border-t border-gray-700">
        <div className="text-xs text-gray-400">
          <div>Day: {Math.floor(currentTick / 24)}</div>
          <div>Time: {(currentTick % 24).toString().padStart(2, '0')}:00</div>
          <div>Phase: {world.dayNight}</div>
          <div>Weather: {world.weather}</div>
        </div>
      </div>
    </div>
  );
}

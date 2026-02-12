'use client';


import React, { useMemo } from 'react';
import { Event, World } from '../server/types';

interface OngoingActionsPanelProps {
  events: Event[];
  currentTick: number;
  world: World;
}

export default function OngoingActionsPanel({ events, currentTick, world }: OngoingActionsPanelProps) {
  // Get events from current tick, sorted by order in events array (which matches action order)
  const currentEvents = useMemo(() => {
    return events.filter(e => e.tick === currentTick);
  }, [events, currentTick]);

  // Group events by agent (first agent in agentsInvolved)
  const eventsByAgent: Record<string, Event[]> = {};
  currentEvents.forEach(event => {
    const agentId = event.agentsInvolved[0];
    if (!agentId) return;
    if (!eventsByAgent[agentId]) eventsByAgent[agentId] = [];
    eventsByAgent[agentId].push(event);
  });
  // Add agentOrder for rendering
  const agentOrder = Object.keys(eventsByAgent);

  // Fix: Add getEventIcon function
  const getEventIcon = (type: string) => {
    switch (type) {
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
      <h2 className="text-lg font-bold text-white mb-3">Agent Chat</h2>
      <div className="text-sm text-gray-400 mb-2">Tick {currentTick}</div>

      {agentOrder.length === 0 ? (
        <div className="text-gray-500 text-sm italic">No actions this tick</div>
      ) : (
        <div className="space-y-4 max-h-64 overflow-y-auto">
          {agentOrder.map(agentId => (
            <div key={agentId} className="flex items-start gap-2">
              <div className="w-10 flex-shrink-0 flex flex-col items-center pt-2">
                <div className="rounded-full bg-gray-700 w-8 h-8 flex items-center justify-center text-lg font-bold text-white">
                  {getAgentName(agentId)[0]}
                </div>
                <div className="text-xs text-gray-400 mt-1 truncate w-10 text-center">{getAgentName(agentId)}</div>
              </div>
              <div className="flex-1 space-y-1">
                {eventsByAgent[agentId].map((event, idx) => (
                  <div key={event.id || idx} className="bg-gray-700 p-2 rounded-lg flex items-center gap-2">
                    <span className="text-xl">{getEventIcon(event.type)}</span>
                    <span className="text-white text-sm">
                      {event.type === 'communicate' && event.details.message ? (
                        <span className="italic">"{event.details.message}"</span>
                      ) : event.type === 'move' && event.details.to ? (
                        <>Moved to ({event.details.to.x}, {event.details.to.y})</>
                      ) : event.type === 'gather' && event.details.resource ? (
                        <>Gathered {event.details.resource}</>
                      ) : event.type === 'craft' && event.details.item ? (
                        <>Crafted {event.details.item}</>
                      ) : event.type === 'build' && event.details.structure ? (
                        <>Built {event.details.structure}</>
                      ) : event.type === 'give' && event.details.resource ? (
                        <>Gave {event.details.amount} {event.details.resource}</>
                      ) : event.type === 'create_crop_field' ? (
                        <>Planted a crop field</>
                      ) : event.type === 'harvest_crop' ? (
                        <>Harvested crops</>
                      ) : event.type === 'procreate' ? (
                        <>Procreated</>
                      ) : event.type === 'birth' ? (
                        <>A child was born</>
                      ) : event.type === 'death' ? (
                        <>Died</>
                      ) : event.type === 'weather_change' && event.details.weather ? (
                        <>Weather changed to {event.details.weather}</>
                      ) : event.type === 'god_message' && event.details.message ? (
                        <span className="italic">[GOD] "{event.details.message}"</span>
                      ) : event.type === 'resource_drop' ? (
                        <>Dropped resources</>
                      ) : (
                        <>{event.type.replace(/_/g, ' ')}</>
                      )}
                    </span>
                  </div>
                ))}
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

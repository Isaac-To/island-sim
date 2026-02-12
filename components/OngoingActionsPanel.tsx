'use client';


import React, { useMemo } from 'react';
import { Event, World } from '../server/types';

interface OngoingActionsPanelProps {
  events: Event[];
  currentTick: number;
  world: World;
}

export default function OngoingActionsPanel({ events, currentTick, world }: OngoingActionsPanelProps) {
  // Get events from current tick and previous 10 ticks for chat history
  const recentEvents = useMemo(() => {
    const minTick = Math.max(0, currentTick - 10);
    return events.filter(e => e.tick >= minTick && e.tick <= currentTick);
  }, [events, currentTick]);

  // Separate chat events (communicate + god_message) from other events
  const chatEvents = recentEvents.filter(e => e.type === 'communicate' || e.type === 'god_message');
  const otherCurrentEvents = recentEvents.filter(e => e.tick === currentTick && e.type !== 'communicate' && e.type !== 'god_message');

  // Group chat events by tick for display
  const chatsByTick: Record<number, Event[]> = {};
  chatEvents.forEach(event => {
    if (!chatsByTick[event.tick]) chatsByTick[event.tick] = [];
    chatsByTick[event.tick].push(event);
  });

  // Sort ticks in descending order (most recent first)
  const sortedChatTicks = Object.keys(chatsByTick)
    .map(Number)
    .sort((a, b) => b - a);

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
      case 'move': return '🚶';
      case 'craft': return '🔨';
      default: return '•';
    }
  };

  const getAgentName = (agentId: string | undefined) => {
    if (!agentId) return 'Unknown';
    const agent = world.agents.find(a => a.id === agentId);
    return agent?.name || agentId.slice(0, 8);
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h2 className="text-lg font-bold text-white mb-3">Agent Chat</h2>
      <div className="text-sm text-gray-400 mb-2">Current Tick: {currentTick}</div>

      {/* Chat History Section */}
      <div className="mb-4">
        <h3 className="text-md font-semibold text-white mb-2">Conversations</h3>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {sortedChatTicks.length === 0 ? (
            <div className="text-gray-500 text-sm italic">No conversations yet</div>
          ) : (
            sortedChatTicks.map(tick => (
              <div key={tick} className="border-l-2 border-blue-500 pl-3">
                <div className="text-xs text-gray-400 mb-1">
                  Tick {tick} ({tick === currentTick ? 'now' : `${currentTick - tick} ticks ago`})
                </div>
                <div className="space-y-2">
                  {chatsByTick[tick].map((event, idx) => {
                    const isGodMessage = event.type === 'god_message';
                    const sender = world.agents.find(a => a.id === event.agentsInvolved[0]);
                    const senderName = isGodMessage ? 'GOD' : getAgentName(event.agentsInvolved[0]);
                    const bgColor = isGodMessage ? 'bg-amber-900/30' : 'bg-blue-900/30';
                    const avatarBg = isGodMessage ? 'bg-amber-600' : 'bg-blue-700';
                    const textColor = isGodMessage ? 'text-amber-300' : 'text-blue-300';
                    
                    // Truncate message if longer than 200 characters
                    const message = event.details.message || '';
                    const isTruncated = message.length > 200;
                    const displayMessage = isTruncated ? message.substring(0, 200) + '...' : message;
                    
                    return (
                      <div key={event.id || idx} className={`${bgColor} p-3 rounded-lg`}>
                        <div className="flex items-start gap-2">
                          <div className={`rounded-full ${avatarBg} w-8 h-8 flex items-center justify-center text-sm font-bold text-white flex-shrink-0`}>
                            {isGodMessage ? '✨' : senderName[0]}
                          </div>
                          <div className="flex-1">
                            <div className={`${textColor} text-xs font-semibold mb-1`}>
                              {senderName}
                              {!isGodMessage && event.agentsInvolved.length > 1 && (
                                <span className="text-gray-400 font-normal ml-1">
                                  → {event.agentsInvolved.slice(1).map(id => getAgentName(id)).join(', ')}
                                </span>
                              )}
                              {isGodMessage && event.agentsInvolved.length > 0 && (
                                <span className="text-gray-400 font-normal ml-1">
                                  → {event.agentsInvolved.length === world.agents.filter(a => a.alive).length 
                                      ? 'All Agents' 
                                      : event.agentsInvolved.map(id => getAgentName(id)).join(', ')}
                                </span>
                              )}
                            </div>
                            <div className="text-white text-sm italic">
                              "{displayMessage}"
                              {isTruncated && (
                                <span className="text-xs text-gray-400 ml-1">(message truncated)</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Other Actions Section (Smaller, less prominent) */}
      {otherCurrentEvents.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <h3 className="text-xs font-semibold text-gray-400 mb-2">Other Actions (Tick {currentTick})</h3>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {otherCurrentEvents.map((event, idx) => (
              <div key={event.id || idx} className="bg-gray-700/50 px-2 py-1 rounded flex items-center gap-2 text-xs">
                <span className="text-sm">{getEventIcon(event.type)}</span>
                <span className="text-gray-300">
                  <span className="font-semibold">{getAgentName(event.agentsInvolved[0])}</span>
                  {' '}
                  {event.type === 'move' && event.details.to ? (
                    <>moved to ({event.details.to.x}, {event.details.to.y})</>
                  ) : event.type === 'gather' && event.details.resource ? (
                    <>gathered {event.details.resource}</>
                  ) : event.type === 'craft' && event.details.item ? (
                    <>crafted {event.details.item}</>
                  ) : event.type === 'build' && event.details.structure ? (
                    <>built {event.details.structure}</>
                  ) : event.type === 'give' && event.details.resource ? (
                    <>gave {event.details.amount} {event.details.resource}</>
                  ) : event.type === 'create_crop_field' ? (
                    <>planted crops</>
                  ) : event.type === 'harvest_crop' ? (
                    <>harvested crops</>
                  ) : event.type === 'procreate' ? (
                    <>procreated</>
                  ) : event.type === 'birth' ? (
                    <>had a child</>
                  ) : event.type === 'death' ? (
                    <>died</>
                  ) : event.type === 'weather_change' && event.details.weather ? (
                    <>weather: {event.details.weather}</>
                  ) : event.type === 'god_message' && event.details.message ? (
                    <>[GOD] "{event.details.message}"</>
                  ) : event.type === 'resource_drop' ? (
                    <>dropped resources</>
                  ) : (
                    <>{event.type.replace(/_/g, ' ')}</>
                  )}
                </span>
              </div>
            ))}
          </div>
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

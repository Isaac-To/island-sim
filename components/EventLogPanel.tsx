'use client';

import React, { useState, useMemo } from 'react';
import { Event, World, EventType } from '../server/types';

interface EventLogPanelProps {
  events: Event[];
  currentEventIndex: number;
  world: World;
  onEventClick?: (index: number) => void;
}

export default function EventLogPanel({ events, currentEventIndex, world, onEventClick }: EventLogPanelProps) {
  const [filter, setFilter] = useState<EventType | 'all'>('all');
  const [search, setSearch] = useState('');

  const eventTypes: (EventType | 'all')[] = [
    'all', 'move', 'communicate', 'craft', 'gather', 'build',
    'procreate', 'give', 'create_crop_field', 'harvest_crop',
    'weather_change', 'birth', 'death', 'resource_drop', 'god_message'
  ];

  const filteredEvents = useMemo(() => {
    let result = events;

    // Apply type filter
    if (filter !== 'all') {
      result = result.filter(e => e.type === filter);
    }

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(e => {
        // Search in agent names
        const agentNames = e.agentsInvolved
          .map(id => world.agents.find(a => a.id === id)?.name || '')
          .join(' ');
        return (
          agentNames.toLowerCase().includes(searchLower) ||
          e.type.toLowerCase().includes(searchLower) ||
          JSON.stringify(e.details).toLowerCase().includes(searchLower)
        );
      });
    }

    return result;
  }, [events, filter, search, world]);

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

  const getEventColor = (type: EventType) => {
    switch (type) {
      case 'move': return 'text-blue-400';
      case 'communicate': return 'text-green-400';
      case 'craft': return 'text-yellow-400';
      case 'gather': return 'text-orange-400';
      case 'build': return 'text-purple-400';
      case 'procreate': return 'text-pink-400';
      case 'give': return 'text-teal-400';
      case 'birth': return 'text-cyan-400';
      case 'death': return 'text-red-400';
      case 'weather_change': return 'text-gray-400';
      case 'god_message': return 'text-amber-400';
      default: return 'text-gray-300';
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 flex flex-col h-full">
      <h2 className="text-lg font-bold text-white mb-3">Event Log</h2>

      {/* Filters */}
      <div className="mb-3 space-y-2">
        {/* Search */}
        <input
          type="text"
          placeholder="Search events..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 text-white text-sm rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
        />

        {/* Type filter */}
        <div className="flex flex-wrap gap-1">
          {eventTypes.slice(0, 8).map(type => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-2 py-1 text-xs rounded capitalize transition-colors ${
                filter === type
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {type === 'all' ? 'All' : type.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1">
          {eventTypes.slice(8).map(type => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-2 py-1 text-xs rounded capitalize transition-colors ${
                filter === type
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {type.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Event count */}
      <div className="text-xs text-gray-400 mb-2">
        Showing {filteredEvents.length} of {events.length} events
      </div>

      {/* Event list */}
      <div className="flex-1 overflow-y-auto space-y-1">
        {filteredEvents.length === 0 ? (
          <div className="text-gray-500 text-sm text-center py-4">No events match filters</div>
        ) : (
          filteredEvents.map((event, index) => {
            const actualIndex = events.indexOf(event);
            const isSelected = actualIndex === currentEventIndex;

            return (
              <div
                key={event.id || index}
                onClick={() => onEventClick?.(actualIndex)}
                className={`p-2 rounded text-sm cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                <div className="flex items-start gap-2">
                  <span>{getEventIcon(event.type)}</span>
                  <div className="flex-1 min-w-0">
                    <div className={`font-semibold capitalize ${getEventColor(event.type)}`}>
                      {event.type.replace(/_/g, ' ')}
                    </div>
                    <div className="text-xs text-gray-400">
                      Tick {event.tick}
                      {event.agentsInvolved.length > 0 && (
                        <span className="ml-2">
                          {event.agentsInvolved
                            .map(id => world.agents.find(a => a.id === id)?.name || id.slice(0, 8))
                            .join(', ')}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {JSON.stringify(event.details)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Jump to tick */}
      <div className="mt-3 pt-3 border-t border-gray-700 flex gap-2">
        <input
          type="number"
          placeholder="Jump to tick"
          className="flex-1 px-2 py-1 bg-gray-700 text-white text-sm rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
        />
        <button className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
          Go
        </button>
      </div>
    </div>
  );
}

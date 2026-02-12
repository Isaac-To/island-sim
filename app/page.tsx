'use client';

import React, { useEffect, useState } from 'react';
import { World, Event, ID } from '../server/types';
import MapCanvas from '../components/MapCanvas';
import AgentPanel from '../components/AgentPanel';
import OngoingActionsPanel from '../components/OngoingActionsPanel';
import EventLogPanel from '../components/EventLogPanel';
import PlaybackControls from '../components/PlaybackControls';
import GodMessagePanel from '../components/GodMessagePanel';

export default function Home() {
  const [world, setWorld] = useState<World | null>(null);
  const [eventLog, setEventLog] = useState<Event[]>([]);
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(500);
  const [selectedAgentId, setSelectedAgentId] = useState<ID | undefined>(undefined);

  // Fetch initial data
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/simdata');
      const { eventLog, world } = await res.json();
      setEventLog(eventLog || []);
      setWorld(world || null);
      setCurrentEventIndex(0);
    } catch (error) {
      console.error('Failed to fetch simulation data:', error);
    }
  };

  // Get current world state based on playback position
  const getCurrentWorld = (): World | null => {
    if (currentEventIndex < 0 || currentEventIndex >= eventLog.length) {
      return world;
    }
    // Note: If events contain world snapshots, use them here
    // For now, we use the base world
    return world;
  };

  const currentWorld = getCurrentWorld();

  // Playback controls
  const stepForward = () => {
    if (currentEventIndex < eventLog.length - 1) {
      setCurrentEventIndex(i => i + 1);
    }
  };

  const stepBackward = () => {
    if (currentEventIndex > 0) {
      setCurrentEventIndex(i => i - 1);
    }
  };

  const play = () => {
    setPlaying(true);
  };

  const pause = () => {
    setPlaying(false);
  };

  const jumpTo = (tick: number) => {
    // Find event at or closest to tick
    const eventIndex = eventLog.findIndex(e => e.tick >= tick);
    if (eventIndex !== -1) {
      setCurrentEventIndex(eventIndex);
      // Could also call playback API to load snapshot
      fetch(`/api/playback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'step', tick }),
      }).then(() => fetchData());
    }
  };

  // Auto-play
  useEffect(() => {
    if (!playing) return;
    if (currentEventIndex < eventLog.length - 1) {
      const id = setTimeout(() => stepForward(), playbackSpeed);
      return () => clearTimeout(id);
    } else {
      setPlaying(false);
    }
  }, [playing, currentEventIndex, eventLog.length, playbackSpeed]);

  // Get current tick
  const currentTick = currentEventIndex >= 0 && currentEventIndex < eventLog.length
    ? eventLog[currentEventIndex]?.tick || 0
    : currentWorld?.time || 0;

  // Handlers
  const handleAgentClick = (agentId: ID) => {
    setSelectedAgentId(agentId);
  };

  const handleTileClick = (x: number, y: number) => {
    console.log('Tile clicked:', x, y);
    // Could show tile details or select for building
  };

  const handleEventClick = (index: number) => {
    setCurrentEventIndex(index);
  };

  const handleSendGodMessage = async (message: string, targets: ID[]) => {
    try {
      const res = await fetch('/api/god-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          targetAgentIds: targets,
        }),
      });

      if (res.ok) {
        fetchData(); // Refresh to see the message in event log
      } else {
        console.error('Failed to send GOD message');
      }
    } catch (error) {
      console.error('Error sending GOD message:', error);
    }
  };

  if (!currentWorld) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white text-xl">Loading simulation...</div>
      </div>
    );
  }

  const selectedAgent = currentWorld.agents.find(a => a.id === selectedAgentId);

  return (
    <main className="h-screen bg-gray-900 text-white overflow-hidden">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Island Survival Simulator</h1>
          <div className="flex items-center gap-4 text-sm">
            <span>Agents: {currentWorld.agents.filter(a => a.alive).length}/{currentWorld.agents.length}</span>
            <span className={`px-2 py-1 rounded ${currentWorld.weather === 'rain' ? 'bg-blue-600' : 'bg-yellow-600'}`}>
              {currentWorld.weather}
            </span>
            <span className={`px-2 py-1 rounded ${currentWorld.dayNight === 'day' ? 'bg-amber-600' : 'bg-indigo-900'}`}>
              {currentWorld.dayNight}
            </span>
          </div>
        </div>
      </header>

      {/* Main content - 2-column grid layout */}
      <div className="h-[calc(100vh-60px)] grid grid-cols-[2fr_1fr] gap-4 p-4">

        {/* Left: Map Canvas */}
        <div className="rounded-lg overflow-hidden border border-gray-700">
          <MapCanvas
            world={currentWorld}
            selectedAgentId={selectedAgentId}
            onAgentClick={handleAgentClick}
            onTileClick={handleTileClick}
          />
        </div>

        {/* Right: Panels */}
        <div className="flex flex-col gap-4 overflow-y-auto pr-2">
          {/* Ongoing Actions */}
          <div className="shrink-0">
            <OngoingActionsPanel
              events={eventLog}
              currentTick={currentTick}
              world={currentWorld}
            />
          </div>

          {/* Agent Details */}
          <div className="flex-1 min-h-0">
            <AgentPanel
              agent={selectedAgent || null}
              world={currentWorld}
            />
          </div>

          {/* Event Log */}
          <div className="h-64 shrink-0">
            <EventLogPanel
              events={eventLog}
              currentEventIndex={currentEventIndex}
              world={currentWorld}
              onEventClick={handleEventClick}
            />
          </div>

          {/* Playback Controls */}
          <div className="shrink-0">
            <PlaybackControls
              isPlaying={playing}
              canStepForward={currentEventIndex < eventLog.length - 1}
              canStepBackward={currentEventIndex > 0}
              currentTick={currentTick}
              totalTicks={eventLog.length > 0 ? eventLog[eventLog.length - 1]?.tick || 0 : 0}
              onPlay={play}
              onPause={pause}
              onStepForward={stepForward}
              onStepBackward={stepBackward}
              onJump={jumpTo}
              speed={playbackSpeed}
              onSpeedChange={setPlaybackSpeed}
            />
          </div>

          {/* GOD Message Panel */}
          <div className="shrink-0">
            <GodMessagePanel
              agents={currentWorld.agents}
              onSendMessage={handleSendGodMessage}
            />
          </div>
        </div>
      </div>
    </main>
  );
}

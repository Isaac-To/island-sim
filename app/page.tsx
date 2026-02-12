'use client';

import React, { useEffect, useState, useRef } from 'react';
import { World, Event, ID } from '../server/types';
import MapCanvas from '../components/MapCanvas';
import AgentPanel from '../components/AgentPanel';
import Modal from '../components/Modal';
import AgentStatsPanel from '../components/AgentStatsPanel';
import OngoingActionsPanel from '../components/OngoingActionsPanel';
import EventLogPanel from '../components/EventLogPanel';
import PlaybackControls from '../components/PlaybackControls';
import GodMessagePanel from '../components/GodMessagePanel';
import TileInspector from '../components/TileInspector';
import StatsModal from '../components/StatsModal';
import { Tile } from '../server/types';

export type SimMode = 'playback' | 'live';

export default function Home() {
  const [world, setWorld] = useState<World | null>(null);
  const [eventLog, setEventLog] = useState<Event[]>([]);
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1000);
  const [selectedAgentId, setSelectedAgentId] = useState<ID | undefined>(undefined);
  const [mode, setMode] = useState<SimMode>('live');
  const [liveRunning, setLiveRunning] = useState(false);
  const [liveLoading, setLiveLoading] = useState(false);
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [selectedTile, setSelectedTile] = useState<Tile | null>(null);
  const liveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const modeRef = useRef<SimMode>(mode);
  const liveRunningRef = useRef<boolean>(liveRunning);

  // Keep refs in sync with state
  useEffect(() => {
    modeRef.current = mode;
    liveRunningRef.current = liveRunning;
  }, [mode, liveRunning]);

  // Fetch initial data

  useEffect(() => {
    fetchData(mode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // Fetch data for current mode
  const fetchData = async (fetchMode: SimMode = mode) => {
    try {
      if (fetchMode === 'live') {
        const res = await fetch('/api/simdata?live=true');
        const { eventLog, world } = await res.json();
        setEventLog(eventLog || []);
        setWorld(world || null);
        setCurrentEventIndex(eventLog.length - 1); // Always show latest in live
      } else {
        const res = await fetch('/api/simdata');
        const { eventLog, world } = await res.json();
        setEventLog(eventLog || []);
        setWorld(world || null);
        setCurrentEventIndex(0);
      }
    } catch (error) {
      console.error('Failed to fetch simulation data:', error);
    }
  };

  // Get current world state based on playback position

  // In playback, world is from eventLog/currentEventIndex; in live, always use latest
  const getCurrentWorld = (): World | null => {
    if (mode === 'live') return world;
    if (currentEventIndex < 0 || currentEventIndex >= eventLog.length) {
      return world;
    }
    // Could use snapshots here if available
    return world;
  };
  const currentWorld = getCurrentWorld();

  // Playback controls

  // Playback controls
  const stepForward = () => {
    if (mode === 'playback') {
      if (currentEventIndex < eventLog.length - 1) {
        setCurrentEventIndex(i => i + 1);
      }
    }
  };

  const stepBackward = () => {
    if (mode === 'playback') {
      if (currentEventIndex > 0) {
        setCurrentEventIndex(i => i - 1);
      }
    }
  };

  const play = () => {
    if (mode === 'playback') setPlaying(true);
    if (mode === 'live') setLiveRunning(true);
  };

  const pause = () => {
    if (mode === 'playback') setPlaying(false);
    if (mode === 'live') setLiveRunning(false);
  };


  const jumpTo = (tick: number) => {
    if (mode === 'playback') {
      // Find event at or closest to tick
      const eventIndex = eventLog.findIndex(e => e.tick >= tick);
      if (eventIndex !== -1) {
        setCurrentEventIndex(eventIndex);
        // Could also call playback API to load snapshot
        fetch(`/api/playback`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'step', tick }),
        }).then(() => fetchData('playback'));
      }
    }
  };

  // Auto-play

  // Playback auto-play
  useEffect(() => {
    if (mode !== 'playback') return;
    if (!playing) return;
    if (currentEventIndex < eventLog.length - 1) {
      const id = setTimeout(() => stepForward(), playbackSpeed);
      return () => clearTimeout(id);
    } else {
      setPlaying(false);
    }
  }, [playing, currentEventIndex, eventLog.length, playbackSpeed, mode]);

  // Live mode: auto-generate ticks when running
  useEffect(() => {
    if (mode !== 'live' || !liveRunning) return;

    const runTick = async () => {
      setLiveLoading(true);
      try {
        await fetch('/api/simdata?live=true&singleTick=true');
        await fetchData('live');
      } catch (e) {
        // ignore
      }
      setLiveLoading(false);
      // Only schedule next tick if we're still in live mode and running
      // Use refs to get current state, not the state when runTick was created
      if (modeRef.current === 'live' && liveRunningRef.current) {
        liveTimeoutRef.current = setTimeout(runTick, playbackSpeed);
      }
    };

    runTick();

    // Cleanup function to clear any pending timeouts
    return () => {
      if (liveTimeoutRef.current) {
        clearTimeout(liveTimeoutRef.current);
        liveTimeoutRef.current = null;
      }
    };
  }, [mode, liveRunning, playbackSpeed]);

  // Live mode: single step
  const liveStep = async () => {
    setLiveLoading(true);
    await fetch('/api/simdata?live=true&singleTick=true');
    await fetchData('live');
    setLiveLoading(false);
  };

  // Get current tick
  const currentTick = currentEventIndex >= 0 && currentEventIndex < eventLog.length
    ? eventLog[currentEventIndex]?.tick || 0
    : currentWorld?.time || 0;

  // Handlers
  const handleAgentClick = (agentId: ID) => {
    setSelectedAgentId(agentId);
    setShowAgentModal(true);
  };

  const handleTileClick = (x: number, y: number) => {
    const tile = currentWorld?.map[y]?.[x];
    if (tile) {
      setSelectedTile(tile);
    }
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
      {/* Agent Stats Modal */}
      <StatsModal
        open={showAgentModal && !!selectedAgent}
        onClose={() => setShowAgentModal(false)}
        title="Agent Stats"
      >
        {selectedAgent && <AgentStatsPanel agent={selectedAgent} world={currentWorld} />}
      </StatsModal>

      {/* Tile Inspector Modal */}
      <StatsModal
        open={!!selectedTile}
        onClose={() => setSelectedTile(null)}
        title="Tile Details"
      >
        {selectedTile && <TileInspector tile={selectedTile} />}
      </StatsModal>

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
            {/* Mode toggle */}
            <span className="ml-4">
              <button
                className={`px-3 py-1 rounded font-semibold mr-2 ${mode === 'playback' ? 'bg-blue-700 text-white' : 'bg-gray-700 text-gray-300'}`}
                onClick={() => { setMode('playback'); setPlaying(false); setLiveRunning(false); }}
                disabled={mode === 'playback'}
              >Playback</button>
              <button
                className={`px-3 py-1 rounded font-semibold ${mode === 'live' ? 'bg-green-700 text-white' : 'bg-gray-700 text-gray-300'}`}
                onClick={() => { setMode('live'); setPlaying(false); setLiveRunning(false); }}
                disabled={mode === 'live'}
              >Live Simulation</button>
            </span>
            <span className={`ml-2 px-2 py-1 rounded text-xs font-bold ${mode === 'live' ? 'bg-green-700' : 'bg-blue-700'}`}>{mode === 'live' ? 'LIVE' : 'PLAYBACK'}</span>
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
        <div className="flex flex-col gap-4 overflow-y-auto pr-2 h-full min-h-0">
          {/* Ongoing Actions */}
          <div className="shrink-0">
            <OngoingActionsPanel
              events={eventLog}
              currentTick={currentTick}
              world={currentWorld}
            />
          </div>

          {/* Agent Details */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            <AgentPanel
              agent={selectedAgent || null}
              world={currentWorld}
            />
          </div>

          {/* Event Log */}
          <div className="h-64 shrink-0 overflow-y-auto">
            <EventLogPanel
              events={eventLog}
              currentEventIndex={currentEventIndex}
              world={currentWorld}
              onEventClick={handleEventClick}
            />
          </div>

          {/* Controls: Playback or Live */}
          <div className="shrink-0">
            {mode === 'playback' ? (
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
            ) : (
              <div className="bg-gray-800 rounded-lg p-4 flex flex-col gap-3">
                <h2 className="text-lg font-bold text-white mb-2">Live Controls</h2>
                <div className="flex items-center gap-2 mb-2">
                  <button
                    onClick={liveRunning ? pause : play}
                    className={`px-6 py-2 rounded font-semibold ${liveRunning ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'} text-white`}
                  >{liveRunning ? '⏸ Pause' : '▶ Play'}</button>
                  <button
                    onClick={liveStep}
                    className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={liveLoading || liveRunning}
                  >Step</button>
                  <span className="ml-2 text-xs text-gray-400">Tick: {currentWorld.time}</span>
                  {liveLoading && <span className="ml-2 text-yellow-400 animate-pulse">Running...</span>}
                </div>
                <div className="mb-2">
                  <label className="text-sm text-gray-400 mb-2 block">Speed</label>
                  <div className="flex gap-1">
                    {[2000, 1000, 500, 250, 100].map((s, i) => (
                      <button
                        key={s}
                        onClick={() => setPlaybackSpeed(s)}
                        className={`flex-1 py-2 text-xs rounded transition-colors ${playbackSpeed === s ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                      >{['0.5x', '1x', '2x', '4x', '8x'][i]}</button>
                    ))}
                  </div>
                </div>
                <div className="text-xs text-gray-400">Each tick triggers LLM/agent logic on demand.</div>
              </div>
            )}
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

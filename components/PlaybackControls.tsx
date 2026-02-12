'use client';

import React from 'react';

interface PlaybackControlsProps {
  isPlaying: boolean;
  canStepForward: boolean;
  canStepBackward: boolean;
  currentTick: number;
  totalTicks: number;
  onPlay: () => void;
  onPause: () => void;
  onStepForward: () => void;
  onStepBackward: () => void;
  onJump: (tick: number) => void;
  speed: number;
  onSpeedChange: (speed: number) => void;
}

const SPEEDS = [2000, 1000, 500, 250, 100];

export default function PlaybackControls({
  isPlaying,
  canStepForward,
  canStepBackward,
  currentTick,
  totalTicks,
  onPlay,
  onPause,
  onStepForward,
  onStepBackward,
  onJump,
  speed,
  onSpeedChange,
}: PlaybackControlsProps) {
  const handleJump = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const input = form.querySelector('input[name="jumpTick"]') as HTMLInputElement;
    const tick = parseInt(input?.value || '0');
    if (!isNaN(tick) && tick >= 0 && tick <= totalTicks) {
      onJump(tick);
      if (input) input.value = '';
    }
  };

  const getSpeedLabel = (speed: number) => {
    if (speed >= 2000) return '0.5x';
    if (speed >= 1000) return '1x';
    if (speed >= 500) return '2x';
    if (speed >= 250) return '4x';
    return '8x';
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h2 className="text-lg font-bold text-white mb-3">Playback Controls</h2>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>Tick {currentTick}</span>
          <span>{totalTicks} total</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all duration-150"
            style={{ width: `${totalTicks > 0 ? (currentTick / totalTicks) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Control buttons */}
      <div className="flex items-center justify-center gap-2 mb-4">
        <button
          onClick={onStepBackward}
          disabled={!canStepBackward}
          className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Step Backward"
        >
          ⏮
        </button>

        {isPlaying ? (
          <button
            onClick={onPause}
            className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-semibold"
            title="Pause"
          >
            ⏸ Pause
          </button>
        ) : (
          <button
            onClick={onPlay}
            disabled={!canStepForward}
            className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            title="Play"
          >
            ▶ Play
          </button>
        )}

        <button
          onClick={onStepForward}
          disabled={!canStepForward}
          className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Step Forward"
        >
          ⏭
        </button>
      </div>

      {/* Speed control */}
      <div className="mb-4">
        <label className="text-sm text-gray-400 mb-2 block">Speed</label>
        <div className="flex gap-1">
          {SPEEDS.map((s, i) => (
            <button
              key={s}
              onClick={() => onSpeedChange(s)}
              className={`flex-1 py-2 text-xs rounded transition-colors ${
                speed === s
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {['0.5x', '1x', '2x', '4x', '8x'][i]}
            </button>
          ))}
        </div>
      </div>

      {/* Jump to tick */}
      <form onSubmit={handleJump} className="flex gap-2">
        <input
          type="number"
          name="jumpTick"
          min="0"
          max={totalTicks}
          placeholder="Jump to tick..."
          className="flex-1 px-3 py-2 bg-gray-700 text-white text-sm rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
        >
          Jump
        </button>
      </form>

      {/* Day/time info */}
      <div className="mt-4 pt-4 border-t border-gray-700">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="bg-gray-700 p-2 rounded">
            <div className="text-gray-400 text-xs">Day</div>
            <div className="text-white font-semibold">{Math.floor(currentTick / 24)}</div>
          </div>
          <div className="bg-gray-700 p-2 rounded">
            <div className="text-gray-400 text-xs">Time</div>
            <div className="text-white font-semibold">
              {(currentTick % 24).toString().padStart(2, '0')}:00
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

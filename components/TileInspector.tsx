'use client';

import React from 'react';
import { Tile, TerrainType } from '../server/types';

interface TileInspectorProps {
  tile: Tile;
}

export default function TileInspector({ tile }: TileInspectorProps) {
  const terrainColors: Record<TerrainType, string> = {
    water: 'bg-blue-600',
    beach: 'bg-yellow-200',
    forest: 'bg-green-800',
    rocky: 'bg-gray-500',
    grass: 'bg-green-400',
  };

  const terrainDescriptions: Record<TerrainType, string> = {
    water: 'Water - Impassable',
    beach: 'Beach - Sandy shoreline',
    forest: 'Forest - Trees and wildlife',
    rocky: 'Rocky - Stone deposits',
    grass: 'Grass - Cultivable land',
  };

  return (
    <div className="space-y-4">
        {/* Location */}
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Coordinates</span>
          <span className="text-white font-mono">({tile.x}, {tile.y})</span>
        </div>

        {/* Terrain */}
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Terrain</span>
          <div className="flex items-center gap-2">
            <div className={`w-4 h-4 rounded ${terrainColors[tile.terrain]}`} />
            <span className="text-white">{tile.terrain}</span>
          </div>
        </div>
        <div className="text-xs text-gray-500 italic pl-24">
          {terrainDescriptions[tile.terrain]}
        </div>

        {/* Elevation */}
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Elevation</span>
          <span className="text-white font-mono">{tile.elevation.toFixed(3)}</span>
        </div>

        {/* Resources */}
        <div className="border-t border-gray-700 pt-3">
          <h4 className="text-sm font-semibold text-white mb-2">Resources</h4>
          {Object.keys(tile.resources).length === 0 ? (
            <div className="text-gray-500 text-sm italic">No resources available</div>
          ) : (
            <div className="space-y-2">
              {Object.entries(tile.resources).map(([resource, amount]) => (
                <div key={resource} className="flex justify-between items-center">
                  <span className="text-gray-300 capitalize">{resource}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-mono">
                      {amount} / {tile.resourceLimits[`max${resource.charAt(0).toUpperCase() + resource.slice(1)}` as keyof typeof tile.resourceLimits] || '∞'}
                    </span>
                    {/* Progress bar */}
                    {tile.resourceLimits[`max${resource.charAt(0).toUpperCase() + resource.slice(1)}` as keyof typeof tile.resourceLimits] && (
                      <div className="w-20 h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 transition-all"
                          style={{
                            width: `${Math.min(100, (amount / (tile.resourceLimits[`max${resource.charAt(0).toUpperCase() + resource.slice(1)}` as keyof typeof tile.resourceLimits] || 1)) * 100)}%`
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Crop Field */}
        {tile.cropField && (
          <div className="border-t border-gray-700 pt-3">
            <h4 className="text-sm font-semibold text-white mb-2">Crop Field</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Status</span>
                <span className={tile.cropField.harvested ? 'text-yellow-400' : 'text-green-400'}>
                  {tile.cropField.harvested ? 'Regrowing...' : 'Growing'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Watered</span>
                <span className="text-white">
                  {tile.cropField.watered} / 3
                </span>
              </div>
              {!tile.cropField.harvested && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Progress</span>
                    <span className="text-white font-mono text-xs">
                      Tick {tile.cropField.plantedTick} → {tile.cropField.matureTick}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all"
                      style={{
                        width: `${Math.min(100, (tile.cropField.watered / 3) * 100)}%`
                      }}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Structure */}
        {tile.structure && (
          <div className="border-t border-gray-700 pt-3">
            <h4 className="text-sm font-semibold text-white mb-2">Structure</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Type</span>
                <span className="text-white capitalize">{tile.structure.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Durability</span>
                <span className="text-white">{tile.structure.durability}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Built by</span>
                <span className="text-white font-mono text-xs">{tile.structure.builtBy}</span>
              </div>
            </div>
          </div>
        )}

        {/* Resource Limits Info */}
        <div className="border-t border-gray-700 pt-3">
          <div className="text-xs text-gray-500 space-y-1">
            <div className="font-semibold text-gray-400 mb-1">Resource Limits:</div>
            <div>• Forest trees regrow slowly over time</div>
            <div>• Water replenishes during rain</div>
            <div>• Crop fields restart after harvest (48 ticks)</div>
            <div>• Stone deposits are permanent</div>
          </div>
        </div>
    </div>
  );
}

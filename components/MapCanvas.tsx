'use client';

import React, { useRef, useEffect, useState } from 'react';
import { World, Agent, ID, TerrainType, CropField } from '../server/types';
import { getTerrainSprite, drawSprite, AGENT_SPRITE, AGENT_CHILD_SPRITE, CROP_SPRITE, CROP_MATURE_SPRITE, RESOURCE_ICONS } from '../lib/pixelArt';

interface MapCanvasProps {
  world: World;
  selectedAgentId?: ID;
  onAgentClick: (agentId: ID) => void;
  onTileClick: (x: number, y: number) => void;
}

export default function MapCanvas({ world, selectedAgentId, onAgentClick, onTileClick }: MapCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(16); // Pixels per tile
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredTile, setHoveredTile] = useState<{ x: number; y: number } | null>(null);
  const [raindrops, setRaindrops] = useState<Array<{ x: number; y: number; speed: number }>>([]);
  const [initialZoomApplied, setInitialZoomApplied] = useState(false);

  // Animate rain
  useEffect(() => {
    if (world.weather === 'rain') {
      const interval = setInterval(() => {
        setRaindrops(prev => {
          const canvasHeight = canvasRef.current?.height ?? 600;
          const canvasWidth = canvasRef.current?.width ?? 800;

          const newDrops = prev.map(drop => ({
            ...drop,
            y: drop.y + drop.speed,
          })).filter(drop => drop.y < canvasHeight);

          // Add new drops
          if (Math.random() > 0.7) {
            newDrops.push({
              x: Math.random() * canvasWidth,
              y: 0,
              speed: 5 + Math.random() * 5,
            });
          }

          return newDrops;
        });
      }, 50);
      return () => clearInterval(interval);
    } else {
      setRaindrops([]);
    }
  }, [world.weather]);

  // Handle canvas click
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const tileX = Math.floor((x - offset.x) / scale);
    const tileY = Math.floor((y - offset.y) / scale);

    // Check if clicked on agent
    const clickedAgent = world.agents.find(
      a => a.location.x === tileX && a.location.y === tileY && a.alive
    );

    if (clickedAgent) {
      onAgentClick(clickedAgent.id);
    } else {
      onTileClick(tileX, tileY);
    }
  };

  // Handle mouse move for hover
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || isDragging) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const tileX = Math.floor((x - offset.x) / scale);
    const tileY = Math.floor((y - offset.y) / scale);

    if (tileX >= 0 && tileX < world.map[0]?.length && tileY >= 0 && tileY < world.map.length) {
      setHoveredTile({ x: tileX, y: tileY });
    } else {
      setHoveredTile(null);
    }
  };

  // Handle pan start
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 0) { // Left click
      setIsDragging(true);
      setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    }
  };

  // Handle pan move
  const handleMouseMoveGlobal = (e: MouseEvent) => {
    if (isDragging) {
      setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };

  // Handle pan end
  const handleMouseUpGlobal = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMoveGlobal);
    window.addEventListener('mouseup', handleMouseUpGlobal);
    return () => {
      window.removeEventListener('mousemove', handleMouseMoveGlobal);
      window.removeEventListener('mouseup', handleMouseUpGlobal);
    };
  }, [isDragging, dragStart]);

  // Handle zoom
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(4, Math.min(64, scale * delta));
    setScale(newScale);
  };

  // Main render function
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;

    // Clear canvas
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Calculate visible tiles
    const startTileX = Math.max(0, Math.floor(-offset.x / scale));
    const startTileY = Math.max(0, Math.floor(-offset.y / scale));
    const endTileX = Math.min(world.map[0]?.length || 0, Math.ceil((canvas.width - offset.x) / scale));
    const endTileY = Math.min(world.map.length || 0, Math.ceil((canvas.height - offset.y) / scale));

    // Draw tiles
    for (let y = startTileY; y < endTileY; y++) {
      for (let x = startTileX; x < endTileX; x++) {
        const tile = world.map[y]?.[x];
        if (!tile) continue;

        const screenX = x * scale + offset.x;
        const screenY = y * scale + offset.y;

        // Draw terrain sprite
        const terrainSprite = getTerrainSprite(tile.terrain);
        drawSprite(ctx, terrainSprite, screenX, screenY, scale);

        // Draw crop field
        if (tile.cropField && !tile.cropField.harvested) {
          const cropSprite = tile.cropField.watered >= 3 ? CROP_MATURE_SPRITE : CROP_SPRITE;
          drawSprite(ctx, cropSprite, screenX, screenY, scale);
        }

        // Draw resources
        const resources = tile.resources;
        if (resources) {
          let iconIndex = 0;
          for (const [resourceType, amount] of Object.entries(resources)) {
            if (amount && amount > 0) {
              const icon = RESOURCE_ICONS[resourceType];
              if (icon) {
                const iconSize = scale * 0.5;
                drawSprite(ctx, icon, screenX + scale * 0.25 + iconIndex * 4, screenY + scale * 0.5, iconSize);
                iconIndex++;
              }
            }
          }
        }

        // Draw structure (if exists)
        if (tile.structure) {
          ctx.fillStyle = '#8D6E63';
          ctx.fillRect(screenX + scale * 0.2, screenY + scale * 0.2, scale * 0.6, scale * 0.6);
          ctx.strokeStyle = '#5D4037';
          ctx.lineWidth = 1;
          ctx.strokeRect(screenX + scale * 0.2, screenY + scale * 0.2, scale * 0.6, scale * 0.6);
        }
      }
    }

    // Draw dropped items
    for (const dropped of world.droppedItems) {
      const screenX = dropped.location.x * scale + offset.x;
      const screenY = dropped.location.y * scale + offset.y;

      // Draw a small chest icon
      ctx.fillStyle = '#FFD54F';
      ctx.fillRect(screenX + scale * 0.3, screenY + scale * 0.3, scale * 0.4, scale * 0.4);
      ctx.strokeStyle = '#FF8F00';
      ctx.lineWidth = 1;
      ctx.strokeRect(screenX + scale * 0.3, screenY + scale * 0.3, scale * 0.4, scale * 0.4);
    }

    // Draw agents
    for (const agent of world.agents) {
      if (!agent.alive) continue;

      const screenX = agent.location.x * scale + offset.x;
      const screenY = agent.location.y * scale + offset.y;

      // Skip if off screen
      if (screenX < -scale || screenX > canvas.width || screenY < -scale || screenY > canvas.height) {
        continue;
      }

      // Draw agent as a smaller colored square by gender (centered)
      const agentSize = scale * 0.6;
      const agentOffset = (scale - agentSize) / 2;
      ctx.fillStyle = agent.gender === 'male' ? '#4FC3F7' : '#F06292';
      ctx.fillRect(screenX + agentOffset, screenY + agentOffset, agentSize, agentSize);

      // Draw selection highlight
      if (agent.id === selectedAgentId) {
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        ctx.strokeRect(screenX + agentOffset, screenY + agentOffset, agentSize, agentSize);
      }

      // Draw status indicators (starving, pregnancy)
      if (agent.starving) {
        ctx.fillStyle = '#EF5350';
        ctx.beginPath();
        ctx.arc(screenX + scale * 0.2, screenY + scale * 0.8, scale * 0.15, 0, Math.PI * 2);
        ctx.fill();
      }
      if (agent.pregnancy) {
        ctx.fillStyle = '#BA68C8';
        ctx.beginPath();
        ctx.arc(screenX + scale * 0.5, screenY + scale * 0.8, scale * 0.15, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Find hovered agent for tooltip
    let hoveredAgent: Agent | null = null;
    if (hoveredTile) {
      hoveredAgent = world.agents.find(
        a => a.location.x === hoveredTile.x && a.location.y === hoveredTile.y && a.alive
      ) || null;
    }

    // Draw hover effect
    if (hoveredTile) {
      const screenX = hoveredTile.x * scale + offset.x;
      const screenY = hoveredTile.y * scale + offset.y;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 2;
      ctx.strokeRect(screenX, screenY, scale, scale);
    }

    // Draw day/night overlay
    if (world.dayNight === 'night') {
      ctx.fillStyle = 'rgba(0, 0, 30, 0.4)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Draw rain
    if (world.weather === 'rain') {
      ctx.strokeStyle = 'rgba(144, 202, 249, 0.6)';
      ctx.lineWidth = 1;
      for (const drop of raindrops) {
        ctx.beginPath();
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x, drop.y + 10);
        ctx.stroke();
      }
    }

  }, [world, scale, offset, selectedAgentId, hoveredTile, raindrops, isDragging]);

  // Center and zoom map to fit on first render
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || initialZoomApplied) return;

    const mapWidth = world.map[0]?.length || 0;
    const mapHeight = world.map.length || 0;

    if (mapWidth === 0 || mapHeight === 0) return;

    // Calculate optimal scale to fit map within canvas with some padding
    const padding = 20; // pixels
    const availableWidth = canvas.width - padding * 2;
    const availableHeight = canvas.height - padding * 2;

    const scaleX = availableWidth / mapWidth;
    const scaleY = availableHeight / mapHeight;

    // Use the smaller scale to fit both dimensions
    const fitScale = Math.min(scaleX, scaleY);

    // Clamp scale within allowed range
    const clampedScale = Math.max(4, Math.min(64, Math.floor(fitScale)));

    // Calculate offset to center the map
    const mapPixelWidth = mapWidth * clampedScale;
    const mapPixelHeight = mapHeight * clampedScale;

    setScale(clampedScale);
    setOffset({
      x: (canvas.width - mapPixelWidth) / 2,
      y: (canvas.height - mapPixelHeight) / 2,
    });
    setInitialZoomApplied(true);
  }, [world.map, initialZoomApplied]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden bg-gray-900"
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onWheel={handleWheel}
        className="absolute top-0 left-0"
      />

      {/* Info overlay */}
      <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-2 rounded text-sm font-mono">
        <div>Tick: {world.time}</div>
        <div>Day: {Math.floor(world.time / 24)}</div>
        <div>Time: {world.time % 24}:00</div>
        <div>Weather: {world.weather}</div>
        <div>{world.dayNight}</div>
      </div>

      {/* Zoom controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2">
        <button
          onClick={() => setScale(Math.min(64, scale * 1.2))}
          className="bg-black/70 text-white px-3 py-2 rounded hover:bg-black/90"
        >
          +
        </button>
        <button
          onClick={() => setScale(Math.max(4, scale / 1.2))}
          className="bg-black/70 text-white px-3 py-2 rounded hover:bg-black/90"
        >
          -
        </button>
        <button
          onClick={() => {
            const mapPixelWidth = world.map[0]?.length * scale || 0;
            const mapPixelHeight = world.map.length * scale || 0;
            const canvas = canvasRef.current;
            if (canvas) {
              setOffset({
                x: (canvas.width - mapPixelWidth) / 2,
                y: (canvas.height - mapPixelHeight) / 2,
              });
            }
          }}
          className="bg-black/70 text-white px-3 py-2 rounded hover:bg-black/90 text-xs"
        >
          Center
        </button>
      </div>

      {/* Hover tooltip for agent or tile */}
      {hoveredTile && (
        <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-2 rounded text-sm">
          {(() => {
            const agent = world.agents.find(
              a => a.location.x === hoveredTile.x && a.location.y === hoveredTile.y && a.alive
            );
            if (agent) {
              return <div>👤 {agent.name} ({agent.gender})</div>;
            }
            return <>
              <div>Tile: ({hoveredTile.x}, {hoveredTile.y})</div>
              {hoveredTile.y < world.map.length && hoveredTile.x < world.map[0]?.length && (
                <>
                  <div>Terrain: {world.map[hoveredTile.y]?.[hoveredTile.x]?.terrain}</div>
                  {world.map[hoveredTile.y]?.[hoveredTile.x]?.cropField && (
                    <div>Crop: {world.map[hoveredTile.y]![hoveredTile.x]!.cropField!.watered}/3 watered</div>
                  )}
                </>
              )}
            </>;
          })()}
        </div>
      )}
    </div>
  );
}

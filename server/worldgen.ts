// World generation for Island Survival Simulator
// Generates a 2D map using Perlin noise and a radial mask
// Research-grade, fully documented

import { Tile, TerrainType, World, Inventory } from './types';
import { perlin2 } from './perlin';
import { SeededRandom } from '../lib/seededRandom';

/**
 * Generate a 2D island map with a natural coastline
 *
 * Algorithm:
 * 1. Generate multi-octave Perlin noise for terrain variation
 * 2. Apply radial mask to create island shape (water at edges)
 * 3. Normalize to [0, 1] range with fixed scaling (preserves mask effect)
 *
 * The radial mask ensures water surrounds the island by attenuating
 * elevation toward the edges of the map.
 *
 * @param {number} size - map width/height (square)
 * @param {number} seed - random seed
 * @returns {Tile[][]}
 */
export function generateIslandMap(size: number, seed: number): Tile[][] {
  const center = (size - 1) / 2;
  const maxDist = center;
  const map: Tile[][] = [];
  const random = new SeededRandom(seed);

  for (let y = 0; y < size; y++) {
    const row: Tile[] = [];
    for (let x = 0; x < size; x++) {
      // Multi-octave Perlin noise for natural terrain variation
      const noiseScale = 5.0;
      const octave1 = perlin2(x / size * noiseScale, y / size * noiseScale, seed);
      const octave2 = perlin2(x / size * noiseScale * 2.5, y / size * noiseScale * 2.5, seed + 1) * 0.5;
      const octave3 = perlin2(x / size * noiseScale * 5, y / size * noiseScale * 5, seed + 2) * 0.25;
      const octave4 = perlin2(x / size * noiseScale * 10, y / size * noiseScale * 10, seed + 3) * 0.125;

      // Combine octaves for fractal detail
      // Raw Perlin noise is approximately [-1, 1]
      const rawNoise = (octave1 + octave2 + octave3 + octave4) / 1.875;

      // Normalize from [-1, 1] to [0, 1]
      const baseElevation = rawNoise * 0.5 + 0.5;

      // Calculate distance from center for radial mask
      const dx = (x - center) / maxDist;
      const dy = (y - center) / maxDist;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Radial mask: 1.0 at center, smoothly decreasing to 0.0 at edges
      // Controls how much the island shrinks from the map bounds
      // Lower multiplier = larger island with more terrain variety
      // Higher multiplier = smaller island (more water at edges)
      const maskMultiplier = Math.PI * 0.45; // Adjust: 0.35-0.5 for balanced island
      const islandMask = Math.max(0, Math.cos(dist * maskMultiplier));

      // Apply mask: lowers elevation toward edges, creating water surround
      const elevation = baseElevation * islandMask;

      // Terrain assignment based on elevation thresholds
      // Lower values (near 0) are at edges → water
      // Higher values (near 1) are at center → rocky/forest
      let terrain: TerrainType;
      if (elevation < 0.25) {
        terrain = 'water';
      } else if (elevation < 0.32) {
        terrain = 'beach';
      } else if (elevation < 0.45) {
        terrain = 'grass';
      } else if (elevation < 0.55) {
        terrain = 'forest';
      } else {
        terrain = 'rocky';
      }

      // Resource placement based on terrain type
      const resources: Partial<Inventory> = {};
      const resourceLimits: { maxWood?: number; maxStone?: number; maxWater?: number; maxFood?: number; maxTools?: number } = {};

      if (terrain === 'forest' && random.randomBoolean(0.2)) {
        const woodAmount = 1 + random.randomInt(0, 3);
        resources.wood = woodAmount;
        resourceLimits.maxWood = woodAmount + 3; // Can regrow up to 3 more
      }
      // Stone generation: much higher probability on rocky terrain, some on forest
      if (terrain === 'rocky') {
        if (random.randomBoolean(0.5)) {
          const stoneAmount = 2 + random.randomInt(0, 3);
          resources.stone = stoneAmount;
          resourceLimits.maxStone = stoneAmount; // Stone doesn't regrow
        }
      } else if (terrain === 'forest' && random.randomBoolean(0.08)) {
        const stoneAmount = 1 + random.randomInt(0, 2);
        resources.stone = stoneAmount;
        resourceLimits.maxStone = stoneAmount;
      }
      if (terrain === 'beach' && random.randomBoolean(0.05)) {
        resources.food = 1;
        resourceLimits.maxFood = 1; // Beach food is limited
      }
      if (terrain === 'grass' && random.randomBoolean(0.1)) {
        const waterAmount = 1;
        resources.water = waterAmount;
        resourceLimits.maxWater = waterAmount + 2; // Can replenish up to 2 more
      }

      row.push({ x, y, elevation, terrain, resources, resourceLimits });
    }
    map.push(row);
  }
  return map;
}

/**
 * Create a new world state
 * @param {number} size
 * @param {number} seed
 * @returns {World}
 */
export function createWorld(size: number, seed: number): World {
  return {
    map: generateIslandMap(size, seed),
    agents: [],
    droppedItems: [],
    weather: 'sun',
    time: 0,
    dayNight: 'day',
    activeConversations: [],
  };
}

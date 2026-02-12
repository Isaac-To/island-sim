// Unit tests for world generation
import { generateIslandMap, createWorld } from '../worldgen';

describe('World Generation', () => {
  it('should generate a square map of correct size', () => {
    const size = 50;
    const map = generateIslandMap(size, 42);
    expect(map.length).toBe(size);
    expect(map[0].length).toBe(size);
  });

  it('should create a world with correct initial state', () => {
    const world = createWorld(50, 123);
    expect(world.map.length).toBe(50);
    expect(world.agents).toEqual([]);
    expect(world.weather).toBe('sun');
    expect(world.time).toBe(0);
    expect(world.dayNight).toBe('day');
  });
});

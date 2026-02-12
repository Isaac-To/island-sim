// Tests for crop field creation, growth, watering, and harvest
import { createWorld } from '../worldgen';
import { createAgent } from '../agent';
import { Simulation } from '../simulation';

describe('Crop Field System', () => {
  it('should allow agent to create and harvest a crop field', () => {
    const config = {
      tickDurationMs: 10,
      mapSize: 5,
      childDuration: 2,
      pregnancyDuration: 216,
      cropGrowthTime: 2,
      cropWateringRequired: 1,
      agentMovePerTick: 1,
      mealsPerDay: 3,
      visibilityRadius: 3,
    };
    const world = createWorld(5, 1);
    // Place agent on a grass tile
    let grassLoc = { x: 0, y: 0 };
    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 5; x++) {
        if (world.map[y][x].terrain === 'grass') {
          grassLoc = { x, y };
          break;
        }
      }
    }
    world.agents = [createAgent({ id: 'a1', status: 'adult', location: grassLoc })];
    const sim = new Simulation(config, world);
    // Tick 1: create crop field
    sim.tick();
    const tile = sim.world.map[grassLoc.y][grassLoc.x];
    expect(tile.cropField).toBeDefined();
    // Simulate rain to water crop
    tile.cropField.watered = 1;
    // Tick 2: crop matures
    sim.world.time = tile.cropField.matureTick;
    // Tick 3: agent harvests crop
    sim.tick();
    expect(tile.cropField.harvested).toBe(true);
    const agent = sim.world.agents[0];
    expect(agent.inventory.food).toBeGreaterThan(0);
  });
});

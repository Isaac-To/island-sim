// Integration test: agent move action in simulation tick
import { Simulation } from '../simulation';
import { createAgent } from '../agent';
import { createWorld } from '../worldgen';

describe('Simulation Agent Actions', () => {
  it('should move agents and log move events', () => {
    const config = {
      tickDurationMs: 10,
      mapSize: 10,
      childDuration: 2,
      pregnancyDuration: 216,
      cropGrowthTime: 72,
      cropWateringRequired: 3,
      agentMovePerTick: 1,
      mealsPerDay: 3,
      visibilityRadius: 3,
    };
    const world = createWorld(10, 1);
    world.agents = [createAgent({ age: 3, status: 'adult', id: 'a1', location: { x: 5, y: 5 } })];
    const sim = new Simulation(config, world);
    const prevLoc = { ...sim.world.agents[0].location };
    sim.tick();
    const newLoc = sim.world.agents[0].location;
    expect(newLoc.x !== prevLoc.x || newLoc.y !== prevLoc.y).toBe(true);
    expect(sim.eventLog.some(e => e.type === 'move' && e.agentsInvolved.includes('a1'))).toBe(true);
  });
});

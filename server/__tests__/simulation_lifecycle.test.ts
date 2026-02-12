// Integration test: agent lifecycle in simulation tick
import { Simulation } from '../simulation';
import { createAgent } from '../agent';
import { createWorld } from '../worldgen';

describe('Simulation Agent Lifecycle', () => {
  it('should age agents and log transitions', () => {
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
    world.agents = [createAgent({ age: 0, status: 'child', id: 'a1' })];
    const sim = new Simulation(config, world);
    sim.tick();
    expect(sim.world.agents[0].age).toBe(1);
    expect(sim.eventLog.length).toBe(0);
    sim.tick();
    // Should transition to adult and log event
    expect(sim.world.agents[0].status).toBe('adult');
    expect(sim.eventLog.some(e => e.type === 'birth' && e.agentsInvolved.includes('a1'))).toBe(true);
  });
});

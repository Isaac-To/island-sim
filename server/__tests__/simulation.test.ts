// Unit tests for Simulation core logic
// Uses Jest for testing

const { Simulation } = require('../simulation');

describe('Simulation', () => {

  it('should initialize and tick', () => {
    const config = {
      tickDurationMs: 10,
      mapSize: 10,
      childDuration: 2160,
      pregnancyDuration: 216,
      cropGrowthTime: 72,
      cropWateringRequired: 3,
      agentMovePerTick: 1,
      mealsPerDay: 3,
      visibilityRadius: 3,
    };
    const initialWorld = {
      map: [],
      agents: [],
      droppedItems: [],
      weather: 'sun',
      time: 0,
      dayNight: 'day',
    };
    const sim = new Simulation(config, initialWorld);
    expect(sim.world.time).toBe(0);
    sim.tick();
    expect(sim.world.time).toBe(1);
  });

  it('should update day/night correctly', () => {
    const config = {
      tickDurationMs: 10,
      mapSize: 10,
      childDuration: 2160,
      pregnancyDuration: 216,
      cropGrowthTime: 72,
      cropWateringRequired: 3,
      agentMovePerTick: 1,
      mealsPerDay: 3,
      visibilityRadius: 3,
    };
    const initialWorld = {
      map: [],
      agents: [],
      droppedItems: [],
      weather: 'sun',
      time: 0,
      dayNight: 'day',
    };
    const sim = new Simulation(config, initialWorld);
    sim.world.time = 5;
    sim.updateDayNight();
    expect(sim.world.dayNight).toBe('night');
    sim.world.time = 6;
    sim.updateDayNight();
    expect(sim.world.dayNight).toBe('day');
    sim.world.time = 18;
    sim.updateDayNight();
    expect(sim.world.dayNight).toBe('night');
  });
});

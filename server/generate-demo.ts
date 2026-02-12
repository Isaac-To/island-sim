// Generate demo simulation data for testing and development
import { generateIslandMap } from './worldgen';
import { Simulation } from './simulation';
import { Agent, World } from './types';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { SeededRandom } from '../lib/seededRandom';
import { loadConfig } from './config';

// Load configuration from config.json
const config = loadConfig();

// Seeded random generator
const random = new SeededRandom(config.seed);

// Generate island map
const map = generateIslandMap(config.mapSize, config.seed);

// Create demo agents with varied starting conditions
const agentNames = [
  { name: 'Alice', gender: 'female' as const },
  { name: 'Bob', gender: 'male' as const },
  { name: 'Carol', gender: 'female' as const },
  { name: 'David', gender: 'male' as const },
  { name: 'Eve', gender: 'female' as const },
  { name: 'Frank', gender: 'male' as const },
  { name: 'Grace', gender: 'female' as const },
  { name: 'Henry', gender: 'male' as const },
];

// Find suitable starting locations (grass or forest terrain, not water)
function findSuitableLocation(map: any[][], preferredTerrain: string[] = ['grass', 'forest']) {
  const suitable: { x: number; y: number }[] = [];
  for (let y = 0; y < map.length; y++) {
    for (let x = 0; x < map[y].length; x++) {
      if (preferredTerrain.includes(map[y][x].terrain)) {
        suitable.push({ x, y });
      }
    }
  }
  if (suitable.length === 0) {
    // Fallback to center
    const center = Math.floor(map.length / 2);
    return { x: center, y: center };
  }
  return random.randomChoice(suitable);
}

// Create agents at random suitable locations
const agents: Agent[] = agentNames.map((info, index) => {
  const location = findSuitableLocation(map);
  const isAdult = random.randomBoolean(0.7); // 70% chance of being adult

  return {
    id: `agent_${String(index + 1).padStart(3, '0')}`,
    name: info.name,
    gender: info.gender,
    age: isAdult ? random.randomInt(1000, 1500) : random.randomInt(50, 150), // Adults: 1000-1500 ticks, Children: 50-150 ticks
    status: isAdult ? 'adult' : 'child',
    happiness: random.randomInt(70, 100), // 70-100
    memory: [],
    relationships: [],
    inventory: {
      wood: random.randomInt(0, 5),
      stone: random.randomInt(0, 3),
      water: random.randomInt(0, 4),
      food: random.randomInt(10, 20), // Start with plenty of food (10-20) to survive initial simulation
      tools: random.randomBoolean(0.5) ? 1 : 0, // 50% chance of having a tool
    },
    mealsEaten: 3, // Already ate enough today
    lastMealTick: 0, // Ate at tick 0
    starving: false,
    alive: true,
    location,
    visibilityRadius: config.visibilityRadius,
  };
});

// Create initial world state
const initialWorld: World = {
  map,
  agents,
  droppedItems: [],
  weather: random.randomBoolean(0.5) ? 'sun' : 'rain',
  time: 0,
  dayNight: 'day',
};

console.log('Creating simulation...');
const sim = new Simulation(config, initialWorld);

console.log('Running simulation for 50 ticks to generate initial event history...');
for (let i = 0; i < 50; i++) {
  sim.tick();
  if (i % 10 === 0) {
    console.log(`  Tick ${i}/50 completed`);
  }
}

console.log('Simulation completed. Writing output files...');

// Write outputs
const outputDir = join(process.cwd(), 'server');

try {
  writeFileSync(
    join(outputDir, 'world.json'),
    JSON.stringify(sim.world, null, 2)
  );
  console.log('✓ Written server/world.json');

  writeFileSync(
    join(outputDir, 'eventlog.json'),
    JSON.stringify(sim.eventLog, null, 2)
  );
  console.log('✓ Written server/eventlog.json');

  console.log('\nDemo data generation complete!');
  console.log(`  - World size: ${config.mapSize}x${config.mapSize}`);
  console.log(`  - Agents: ${sim.world.agents.filter(a => a.alive).length} alive, ${sim.world.agents.length} total`);
  console.log(`  - Events logged: ${sim.eventLog.length}`);
  console.log(`  - Current tick: ${sim.world.time}`);
  console.log(`  - Weather: ${sim.world.weather}`);
  console.log(`  - Day/Night: ${sim.world.dayNight}`);
} catch (error) {
  console.error('Error writing files:', error);
  process.exit(1);
}

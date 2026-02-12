// Generate demo simulation data for testing and development
import { generateIslandMap } from './worldgen';
import { Simulation } from './simulation';
import { Agent, World } from './types';
import { generatePersonality } from './agent';
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

// Extended list of agent names to support varying population sizes
const agentNames = [
  { name: 'Alice', gender: 'female' as const },
  { name: 'Bob', gender: 'male' as const },
  { name: 'Carol', gender: 'female' as const },
  { name: 'David', gender: 'male' as const },
  { name: 'Eve', gender: 'female' as const },
  { name: 'Frank', gender: 'male' as const },
  { name: 'Grace', gender: 'female' as const },
  { name: 'Henry', gender: 'male' as const },
  { name: 'Ivy', gender: 'female' as const },
  { name: 'Jack', gender: 'male' as const },
  { name: 'Kate', gender: 'female' as const },
  { name: 'Liam', gender: 'male' as const },
  { name: 'Mia', gender: 'female' as const },
  { name: 'Noah', gender: 'male' as const },
  { name: 'Olivia', gender: 'female' as const },
  { name: 'Peter', gender: 'male' as const },
  { name: 'Quinn', gender: 'female' as const },
  { name: 'Ryan', gender: 'male' as const },
  { name: 'Sophia', gender: 'female' as const },
  { name: 'Thomas', gender: 'male' as const },
  { name: 'Uma', gender: 'female' as const },
  { name: 'Victor', gender: 'male' as const },
  { name: 'Wendy', gender: 'female' as const },
  { name: 'Xavier', gender: 'male' as const },
  { name: 'Yara', gender: 'female' as const },
  { name: 'Zack', gender: 'male' as const },
  { name: 'Ava', gender: 'female' as const },
  { name: 'Ben', gender: 'male' as const },
  { name: 'Chloe', gender: 'female' as const },
  { name: 'Daniel', gender: 'male' as const },
  { name: 'Emma', gender: 'female' as const },
  { name: 'Finn', gender: 'male' as const },
  { name: 'Georgia', gender: 'female' as const },
  { name: 'Harper', gender: 'male' as const },
  { name: 'Isla', gender: 'female' as const },
  { name: 'James', gender: 'male' as const },
  { name: 'Luna', gender: 'female' as const },
  { name: 'Mason', gender: 'male' as const },
  { name: 'Nora', gender: 'female' as const },
  { name: 'Oliver', gender: 'male' as const },
  { name: 'Penelope', gender: 'female' as const },
  { name: 'Lucas', gender: 'male' as const },
  { name: 'Ruby', gender: 'female' as const },
  { name: 'Samuel', gender: 'male' as const },
  { name: 'Victoria', gender: 'female' as const },
];

// Select the number of agents based on configuration
const selectedAgentCount = Math.min(config.initialAgentCount, agentNames.length);
if (config.initialAgentCount > agentNames.length) {
  console.warn(`Warning: initialAgentCount (${config.initialAgentCount}) exceeds available unique names (${agentNames.length}). Using ${agentNames.length} agents.`);
}

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
const agents: Agent[] = agentNames.slice(0, selectedAgentCount).map((info, index) => {
  const location = findSuitableLocation(map);
  const isAdult = random.randomBoolean(0.7); // 70% chance of being adult

  return {
    id: `agent_${String(index + 1).padStart(3, '0')}`,
    name: info.name,
    gender: info.gender,
    age: isAdult ? random.randomInt(1000, 1500) : random.randomInt(50, 150), // Adults: 1000-1500 ticks, Children: 50-150 ticks
    status: isAdult ? 'adult' : 'child',
    happiness: random.randomInt(70, 100), // 70-100
    personality: generatePersonality(() => random.random()),
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
    conversationHistory: {},
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

console.log('Creating simulation (no ticks)...');
const sim = new Simulation(config, initialWorld);

// Only write the initial state, do not run any ticks
console.log('Writing initial world state...');

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

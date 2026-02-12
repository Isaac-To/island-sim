// Config loader for Island Survival Simulator
// Loads simulation config from config.json or environment variables

import fs from 'fs';
import path from 'path';
import { SimulationConfig } from './simulation';

export function loadConfig(): SimulationConfig {
  // Try to load config.json from project root
  let config: Partial<SimulationConfig> = {};
  const configPath = path.resolve(process.cwd(), 'config.json');
  if (fs.existsSync(configPath)) {
    try {
      config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    } catch (e) {
      console.error('Failed to parse config.json:', e);
    }
  }
  // Allow override from environment variables
  const envOverride = (key: string, fallback: any) =>
    process.env[key] !== undefined ? JSON.parse(process.env[key]!) : fallback;
  return {
    tickDurationMs: envOverride('TICK_DURATION_MS', config.tickDurationMs ?? 100),
    mapSize: envOverride('MAP_SIZE', config.mapSize ?? 20),
    childDuration: envOverride('CHILD_DURATION', config.childDuration ?? 168),
    pregnancyDuration: envOverride('PREGNANCY_DURATION', config.pregnancyDuration ?? 216),
    cropGrowthTime: envOverride('CROP_GROWTH_TIME', config.cropGrowthTime ?? 72),
    cropWateringRequired: envOverride('CROP_WATERING_REQUIRED', config.cropWateringRequired ?? 3),
    agentMovePerTick: envOverride('AGENT_MOVE_PER_TICK', config.agentMovePerTick ?? 1),
    mealsPerDay: envOverride('MEALS_PER_DAY', config.mealsPerDay ?? 3),
    visibilityRadius: envOverride('VISIBILITY_RADIUS', config.visibilityRadius ?? 3),
    seed: envOverride('SEED', config.seed ?? Date.now()), // Default to current timestamp
    llm: config.llm,
  };
}

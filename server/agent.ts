// Agent system for Island Survival Simulator
// Handles agent creation, lifecycle, actions, memory, relationships, inventory
// Research-grade, fully documented

import { Agent, ID, Inventory, Relationship, MemoryEntry, AgentStatus, Personality, MemoryCategory, SpatialMemory, LocationType, LocationImportance, Tile, Structure, CropField } from './types';

/**
 * Generate a random personality for an agent
 * @param {() => number} random - Random number generator function (0-1)
 * @returns {Personality}
 */
export function generatePersonality(random: () => number = Math.random): Personality {
  return {
    openness: Math.floor(random() * 100),
    conscientiousness: Math.floor(random() * 100),
    extraversion: Math.floor(random() * 100),
    agreeableness: Math.floor(random() * 100),
    neuroticism: Math.floor(random() * 100),
  };
}

/**
 * Get a personality description string for display/logging
 * @param {Personality} personality
 * @returns {string}
 */
export function getPersonalityDescription(personality: Personality): string {
  const traits: string[] = [];
  if (personality.openness > 70) traits.push('adventurous');
  else if (personality.openness < 30) traits.push('traditional');
  
  if (personality.conscientiousness > 70) traits.push('organized');
  else if (personality.conscientiousness < 30) traits.push('spontaneous');
  
  if (personality.extraversion > 70) traits.push('outgoing');
  else if (personality.extraversion < 30) traits.push('reserved');
  
  if (personality.agreeableness > 70) traits.push('cooperative');
  else if (personality.agreeableness < 30) traits.push('competitive');
  
  if (personality.neuroticism > 70) traits.push('anxious');
  else if (personality.neuroticism < 30) traits.push('calm');
  
  return traits.length > 0 ? traits.join(', ') : 'balanced';
}

/**
 * Create a new agent
 * @param {Partial<Agent>} overrides - properties to override
 * @param {() => number} random - Random number generator function (0-1)
 * @returns {Agent}
 */
export function createAgent(overrides: Partial<Agent> = {}, random: () => number = Math.random): Agent {
  const id = overrides.id || `agent_${Math.random().toString(36).slice(2, 10)}`;
  const agent: Agent = {
    id,
    name: overrides.name || id,
    gender: overrides.gender || (random() < 0.5 ? 'male' : 'female'),
    age: overrides.age ?? 0,
    status: overrides.status || 'child',
    happiness: overrides.happiness ?? 100,
    personality: overrides.personality || generatePersonality(random),
    memory: overrides.memory || [],
    relationships: overrides.relationships || [],
    inventory: overrides.inventory || { wood: 0, stone: 0, water: 0, food: 0, tools: 0 },
    mealsEaten: overrides.mealsEaten ?? 0,
    lastMealTick: overrides.lastMealTick ?? 0,
    starving: overrides.starving ?? false,
    alive: overrides.alive ?? true,
    pregnancy: overrides.pregnancy,
    location: overrides.location || { x: 0, y: 0 },
    visibilityRadius: overrides.visibilityRadius ?? 3,
    conversationHistory: overrides.conversationHistory || {},
    spatialMemory: overrides.spatialMemory || [],
  };
  return agent;
}

/**
 * Progress agent lifecycle by one tick
 * Handles age, status transitions, death, etc.
 * @param {Agent} agent
 * @param {number} childDuration
 * @param {number} elderAge
 * @param {() => number} random - Random number generator function (0-1)
 * @returns {Agent}
 */
export function tickAgent(agent: Agent, childDuration: number, elderAge: number, random: () => number): Agent {
  if (!agent.alive) return agent;
  const newAge = agent.age + 1;
  let status: AgentStatus = agent.status;
  if (status === 'child' && newAge >= childDuration) status = 'adult';
  if (status === 'adult' && newAge >= elderAge) status = 'elder';
  // Elder death risk (simple random for demo)
  let alive: boolean = agent.alive;
  if (status === 'elder' && random() < 0.01) alive = false;
  return { ...agent, age: newAge, status, alive };
}

/**
 * Add a memory entry to an agent
 * @param {Agent} agent
 * @param {MemoryEntry} entry
 * @returns {Agent}
 */
export function addMemory(agent: Agent, entry: MemoryEntry): Agent {
  return { ...agent, memory: [...agent.memory, entry] };
}

/**
 * Generate a relationship note based on relationship type and value
 * @param {string} otherName - Name of the other agent
 * @param {string} type - Relationship type
 * @param {number} value - Relationship value
 * @returns {string}
 */
export function generateRelationshipNote(otherName: string, type: string, value: number): string {
  if (type === 'trust') {
    if (value > 20) return `${otherName} is very trustworthy`;
    if (value > 10) return `${otherName} seems reliable`;
    if (value > 0) return `${otherName} is somewhat trustworthy`;
    if (value < -10) return `${otherName} cannot be trusted`;
    return `Neutral feelings about ${otherName}`;
  }
  if (type === 'friendship') {
    if (value > 20) return `${otherName} is a close friend`;
    if (value > 10) return `${otherName} is a good friend`;
    if (value > 0) return `${otherName} is friendly`;
    return `Neutral friendship with ${otherName}`;
  }
  if (type === 'rivalry') {
    if (value > 10) return `Strong rivalry with ${otherName}`;
    if (value > 0) return `Some competition with ${otherName}`;
    return `No rivalry with ${otherName}`;
  }
  return `Relationship with ${otherName}`;
}

/**
 * Update agent relationships
 * @param {Agent} agent
 * @param {Relationship} rel
 * @returns {Agent}
 */
export function updateRelationship(agent: Agent, rel: Relationship): Agent {
  const relationships = agent.relationships.filter(r => r.agentId !== rel.agentId);
  return { ...agent, relationships: [...relationships, rel] };
}

/**
 * Update agent relationships based on event type
 * @param {Agent} agent
 * @param {ID} otherId
 * @param {string} otherName - Name of the other agent for relationship notes
 * @param {string} eventType
 * @returns {Agent}
 */
export function updateRelationshipEvent(agent: Agent, otherId: ID, otherName: string, eventType: string): Agent {
  let delta = 0;
  if (eventType === 'communicate') delta = 2;
  if (eventType === 'give') delta = 3;
  if (eventType === 'procreate') delta = 5;
  if (eventType === 'steal' || eventType === 'attack') delta = -5;
  const prev = agent.relationships.find(r => r.agentId === otherId);
  const newValue = (prev?.value ?? 0) + delta;
  const relType = prev?.type || 'trust';
  const newRel = {
    agentId: otherId,
    type: relType,
    value: newValue,
    notes: generateRelationshipNote(otherName, relType, newValue),
  };
  return updateRelationship(agent, newRel);
}

/**
 * Update agent happiness based on event
 * @param {Agent} agent
 * @param {string} eventType
 * @returns {Agent}
 */
export function updateHappinessEvent(agent: Agent, eventType: string): Agent {
  let delta = 0;
  if (eventType === 'communicate') delta = 2;
  if (eventType === 'give') delta = 3;
  if (eventType === 'procreate') delta = 5;
  if (eventType === 'starve') delta = -10;
  if (eventType === 'death') delta = -20;
  return { ...agent, happiness: Math.max(0, Math.min(100, agent.happiness + delta)) };
}

// ============================================================================
// SPATIAL MEMORY SYSTEM
//
// Agents maintain a cognitive map of important locations they've discovered.
// This enables intelligent navigation and resource management without needing to
// explore the entire map.
//
// KEY FEATURES:
// - Strategic Filtering: Only remembers high-value resource locations
// - Spatial Deduplication: Avoids remembering every single tree in a forest
// - Dynamic Prioritization: Location importance changes based on agent needs
// - Automatic Updates: Memories refresh when agents revisit locations
// ============================================================================

/**
 * Determine if a tile contains notable resources worth remembering
 *
 * STRATEGIC FILTERING APPROACH:
 * 1. Low Threshold (>1): Remember ANY tile with resources worth gathering
 * 2. Spatial Deduplication: Don't remember every tree in a forest - if a similar resource
 *    location is already known within 8 tiles, skip this one
 * 3. Resource Type Matching: Only compares memories of the same resource type
 *
 * This approach ensures agents remember:
 * - "The forest to the north" (not 50 individual tree tiles)
 * - "The rocky area near the beach" (not every single rock)
 * - "The lake by the mountains" (not every water tile)
 *
 * While still being comprehensive enough to remember all useful resource locations
 *
 * @param {Tile} tile
 * @param {Agent} agent - Used to check if agent already has similar memories
 * @param {SpatialMemory[]} existingMemories - Agent's current spatial memories
 * @returns {boolean}
 */
export function isNotableResourceTile(tile: Tile, agent: Agent, existingMemories: SpatialMemory[]): boolean {
  if (!tile.resources) return false;

  const { wood = 0, stone = 0, water = 0, food = 0 } = tile.resources;

  // LOW THRESHOLD: Remember any tile with resources (> 1 of any type)
  // This ensures agents don't miss useful resource locations while avoiding memory explosion
  const hasWood = wood > 1;
  const hasStone = stone > 1;
  const hasWater = water > 1;
  const hasFood = food > 1;

  if (!hasWood && !hasStone && !hasWater && !hasFood) return false;

  // SPATIAL DEDUPLICATION: Check if agent already has similar memories nearby
  // This prevents memory explosion in resource-dense areas (forests, rocky areas)
  const nearbySimilarMemory = existingMemories.some(memory => {
    // Only compare memories of the same resource type
    const sameType =
      (hasWood && memory.type === 'resource_wood') ||
      (hasStone && memory.type === 'resource_stone') ||
      (hasWater && memory.type === 'resource_water') ||
      (hasFood && memory.type === 'resource_food');

    if (!sameType) return false;

    // Check if nearby (within 8 tiles Manhattan distance)
    // Rationale: If I know about a forest at (10,10), I don't need to remember
    // individual trees at (12,11), (11,13), etc. - they're part of the same forest
    const distance = Math.abs(memory.location.x - tile.x) + Math.abs(memory.location.y - tile.y);
    return distance <= 8;
  });

  // Only remember if no similar resource location is already known nearby
  return !nearbySimilarMemory;
}

/**
 * Determine location importance based on agent's current needs and inventory
 * @param {LocationType} type
 * @param {Agent} agent
 * @returns {LocationImportance}
 */
export function determineLocationImportance(type: LocationType, agent: Agent): LocationImportance {
  const inv = agent.inventory;

  // Critical needs
  if (type === 'resource_water' && inv.water < 2) return 'critical';
  if (type === 'resource_food' && inv.food < 2) return 'critical';
  if (type === 'resource_food' && agent.starving) return 'critical';

  // High priority
  if (type === 'resource_water' && inv.water < 5) return 'high';
  if (type === 'resource_food' && inv.food < 5) return 'high';
  if (type === 'structure_shelter') return 'high';

  // Medium priority
  if (type === 'crop_field') return 'medium';
  if (type === 'structure_workbench') return 'medium';
  if (type === 'structure_storage') return 'medium';

  // Low priority
  if (type === 'resource_wood') return 'low';
  if (type === 'resource_stone') return 'low';
  if (type === 'structure_fence') return 'low';

  return 'low';
}

/**
 * Create a spatial memory entry from a tile
 * @param {Tile} tile
 * @param {number} currentTick
 * @param {Agent} agent
 * @returns {SpatialMemory | null}
 */
export function createSpatialMemoryFromTile(tile: Tile, currentTick: number, agent: Agent): SpatialMemory | null {
  const location = { x: tile.x, y: tile.y };
  let type: LocationType | null = null;
  let description = '';
  let estimatedResources: Partial<Inventory> | undefined;

  // Check for resources (using smart filtering)
  if (isNotableResourceTile(tile, agent, agent.spatialMemory)) {
    const res = tile.resources || {};

    if (res.wood && res.wood > 1) {
      type = 'resource_wood';
      description = `Forest with approximately ${res.wood} wood`;
      estimatedResources = { wood: res.wood };
    } else if (res.stone && res.stone > 1) {
      type = 'resource_stone';
      description = `Rocky area with approximately ${res.stone} stone`;
      estimatedResources = { stone: res.stone };
    } else if (res.water && res.water > 1) {
      type = 'resource_water';
      description = `Water source with approximately ${res.water} water available`;
      estimatedResources = { water: res.water };
    } else if (res.food && res.food > 1) {
      type = 'resource_food';
      description = `Food source with approximately ${res.food} food available`;
      estimatedResources = { food: res.food };
    }
  }

  // Check for crop fields
  if (tile.cropField && !type) {
    type = 'crop_field';
    const field = tile.cropField;
    const status = field.harvested ? 'harvested' : (field.watered >= 3 ? 'ready' : 'growing');
    description = `Crop field (${status}, planted at tick ${field.plantedTick})`;
  }

  // Check for structures
  if (tile.structure && !type) {
    type = `structure_${tile.structure.type}` as LocationType;
    description = `${tile.structure.type} built by agent ${tile.structure.builtBy}`;
  }

  if (!type) return null;

  const importance = determineLocationImportance(type, agent);

  return {
    id: `spatial_${Math.random().toString(36).slice(2, 10)}`,
    location,
    type,
    importance,
    lastSeenTick: currentTick,
    firstSeenTick: currentTick,
    description,
    estimatedResources,
    notes: '',
  };
}

/**
 * Add or update a spatial memory entry
 * @param {Agent} agent
 * @param {SpatialMemory} memory
 * @returns {Agent}
 */
export function addOrUpdateSpatialMemory(agent: Agent, memory: SpatialMemory): Agent {
  // Check if agent already remembers this location
  const existingIndex = agent.spatialMemory.findIndex(
    m => m.location.x === memory.location.x && m.location.y === memory.location.y
  );

  if (existingIndex >= 0) {
    // Update existing memory
    const updatedMemory = {
      ...agent.spatialMemory[existingIndex],
      lastSeenTick: memory.lastSeenTick,
      description: memory.description,
      estimatedResources: memory.estimatedResources,
      notes: memory.notes,
    };
    const newSpatialMemory = [...agent.spatialMemory];
    newSpatialMemory[existingIndex] = updatedMemory;
    return { ...agent, spatialMemory: newSpatialMemory };
  } else {
    // Add new memory
    return { ...agent, spatialMemory: [...agent.spatialMemory, memory] };
  }
}

/**
 * Update spatial memory when agent observes tiles
 * Limits memory to top X locations per resource category to prevent memory explosion
 * @param {Agent} agent
 * @param {Tile[]} visibleTiles
 * @param {number} currentTick
 * @param {number} spatialMemoryLimit - Maximum memories to keep per resource category
 * @returns {Agent}
 */
export function observeTiles(agent: Agent, visibleTiles: Tile[], currentTick: number, spatialMemoryLimit: number = 10): Agent {
  let updatedAgent = agent;

  for (const tile of visibleTiles) {
    const memory = createSpatialMemoryFromTile(tile, currentTick, agent);
    if (memory) {
      updatedAgent = addOrUpdateSpatialMemory(updatedAgent, memory);
    }
  }

  // PRUNE MEMORY: Keep only top X memories per resource category
  // Categories: resource_wood, resource_stone, resource_water, resource_food, crop_field, structures
  updatedAgent = pruneSpatialMemoryByCategory(updatedAgent, spatialMemoryLimit);

  return updatedAgent;
}

/**
 * Prune spatial memory to keep only top X locations per category
 * Priority: importance level (critical > high > medium > low), then recency
 * @param {Agent} agent
 * @param {number} limitPerCategory - Maximum memories to keep per category
 * @returns {Agent}
 */
export function pruneSpatialMemoryByCategory(agent: Agent, limitPerCategory: number): Agent {
  // Group memories by category
  const memoriesByCategory = new Map<string, SpatialMemory[]>();

  for (const memory of agent.spatialMemory) {
    // Extract category (e.g., "resource_wood" -> "resource", "structure_shelter" -> "structure")
    const category = memory.type.split('_')[0]; // "resource", "structure", "crop"
    if (!memoriesByCategory.has(category)) {
      memoriesByCategory.set(category, []);
    }
    memoriesByCategory.get(category)!.push(memory);
  }

  // Keep top X per category based on importance and recency
  const prunedMemories: SpatialMemory[] = [];

  for (const [category, memories] of memoriesByCategory.entries()) {
    // Sort by importance (critical=0, high=1, medium=2, low=3), then by recency
    const sorted = memories.sort((a, b) => {
      const importanceOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      const aImp = importanceOrder[a.importance];
      const bImp = importanceOrder[b.importance];

      if (aImp !== bImp) {
        return aImp - bImp;
      }

      // Same importance, sort by recency (most recently seen first)
      return b.lastSeenTick - a.lastSeenTick;
    });

    // Keep top X
    prunedMemories.push(...sorted.slice(0, limitPerCategory));
  }

  return { ...agent, spatialMemory: prunedMemories };
}

/**
 * Get spatial memories filtered by type and sorted by importance
 * @param {Agent} agent
 * @param {LocationType[]} types
 * @param {number} limit
 * @returns {SpatialMemory[]}
 */
export function getSpatialMemoriesByType(agent: Agent, types: LocationType[], limit: number = 10): SpatialMemory[] {
  return agent.spatialMemory
    .filter(m => types.includes(m.type))
    .sort((a, b) => {
      // Sort by importance priority
      const importanceOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      const aImportance = importanceOrder[a.importance];
      const bImportance = importanceOrder[b.importance];

      if (aImportance !== bImportance) {
        return aImportance - bImportance;
      }

      // Then by recency
      return b.lastSeenTick - a.lastSeenTick;
    })
    .slice(0, limit);
}

/**
 * Get spatial memories sorted by distance from agent
 * @param {Agent} agent
 * @param {number} limit
 * @returns {SpatialMemory[]}
 */
export function getSpatialMemoriesByDistance(agent: Agent, limit: number = 10): SpatialMemory[] {
  return agent.spatialMemory
    .map(memory => ({
      ...memory,
      distance: Math.abs(memory.location.x - agent.location.x) + Math.abs(memory.location.y - agent.location.y),
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit)
    .map(({ distance, ...memory }) => memory);
}

/**
 * Get spatial memories filtered by importance level
 * @param {Agent} agent
 * @param {LocationImportance} minImportance
 * @returns {SpatialMemory[]}
 */
export function getSpatialMemoriesByImportance(agent: Agent, minImportance: LocationImportance): SpatialMemory[] {
  const importanceOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  const minLevel = importanceOrder[minImportance];

  return agent.spatialMemory.filter(m => {
    const level = importanceOrder[m.importance];
    return level <= minLevel;
  });
}

/**
 * Find nearest spatial memory of a specific type
 * @param {Agent} agent
 * @param {LocationType[]} types
 * @returns {SpatialMemory | null}
 */
export function findNearestSpatialMemory(agent: Agent, types: LocationType[]): SpatialMemory | null {
  const memories = getSpatialMemoriesByType(agent, types, Infinity);

  if (memories.length === 0) return null;

  let nearest = memories[0];
  let minDistance = Infinity;

  for (const memory of memories) {
    const distance = Math.abs(memory.location.x - agent.location.x) + Math.abs(memory.location.y - agent.location.y);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = memory;
    }
  }

  return nearest;
}

/**
 * Format spatial memory for LLM prompt
 * @param {SpatialMemory} memory
 * @param {number} currentTick
 * @returns {string}
 */
export function formatSpatialMemoryForLLM(memory: SpatialMemory, currentTick: number): string {
  const ticksSinceSeen = currentTick - memory.lastSeenTick;
  const timeAgo = ticksSinceSeen === 0 ? 'now' : `${ticksSinceSeen} ticks ago`;

  let note = memory.notes ? ` (${memory.notes})` : '';

  if (memory.estimatedResources) {
    const resources = Object.entries(memory.estimatedResources)
      .map(([type, amount]) => `${amount} ${type}`)
      .join(', ');
    return `${memory.description} at (${memory.location.x}, ${memory.location.y}) - last seen ${timeAgo}${note}`;
  }

  return `${memory.description} at (${memory.location.x}, ${memory.location.y}) - last seen ${timeAgo}${note}`;
}

/**
 * Get all relevant spatial memories for LLM prompt
 * @param {Agent} agent
 * @param {number} currentTick
 * @param {number} limit
 * @returns {string}
 */
export function getSpatialMemoriesForLLM(agent: Agent, currentTick: number, limit: number = 15): string {
  const memories = getSpatialMemoriesByImportance(agent, 'medium');

  if (memories.length === 0) {
    return 'No known locations yet.';
  }

  const prioritized = memories
    .sort((a, b) => {
      // Prioritize by importance, then recency
      const importanceOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      const aImportance = importanceOrder[a.importance];
      const bImportance = importanceOrder[b.importance];

      if (aImportance !== bImportance) {
        return aImportance - bImportance;
      }

      return b.lastSeenTick - a.lastSeenTick;
    })
    .slice(0, limit);

  const formatted = prioritized.map(m => formatSpatialMemoryForLLM(m, currentTick));
  return formatted.join('\n');
}

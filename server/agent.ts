// Agent system for Island Survival Simulator
// Handles agent creation, lifecycle, actions, memory, relationships, inventory
// Research-grade, fully documented

import { Agent, ID, Inventory, Relationship, MemoryEntry, AgentStatus, Personality, MemoryCategory } from './types';

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

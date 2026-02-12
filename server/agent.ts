// Agent system for Island Survival Simulator
// Handles agent creation, lifecycle, actions, memory, relationships, inventory
// Research-grade, fully documented

import { Agent, ID, Inventory, Relationship, MemoryEntry, AgentStatus } from './types';

/**
 * Create a new agent
 * @param {Partial<Agent>} overrides - properties to override
 * @returns {Agent}
 */
export function createAgent(overrides: Partial<Agent> = {}): Agent {
  const id = overrides.id || `agent_${Math.random().toString(36).slice(2, 10)}`;
  const agent: Agent = {
    id,
    name: overrides.name || id,
    gender: overrides.gender || (Math.random() < 0.5 ? 'male' : 'female'),
    age: overrides.age ?? 0,
    status: overrides.status || 'child',
    happiness: overrides.happiness ?? 100,
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
 * @param {string} eventType
 * @returns {Agent}
 */
export function updateRelationshipEvent(agent: Agent, otherId: ID, eventType: string): Agent {
  let delta = 0;
  if (eventType === 'communicate') delta = 2;
  if (eventType === 'give') delta = 3;
  if (eventType === 'procreate') delta = 5;
  if (eventType === 'steal' || eventType === 'attack') delta = -5;
  const prev = agent.relationships.find(r => r.agentId === otherId);
  const newRel = {
    agentId: otherId,
    type: prev?.type || 'trust',
    value: (prev?.value ?? 0) + delta,
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

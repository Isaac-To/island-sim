// Tool-call schemas and action handlers for Island Survival Simulator
// Research-grade, fully documented

// Tool-call schemas and action handlers for Island Survival Simulator
// Research-grade, fully documented

import { Agent, World, ID, Inventory, StructureType, Structure } from './types';
import { updateRelationshipEvent, updateHappinessEvent } from './agent';

/**
 * Recipe type for crafting
 */
export type RecipeType = 'wooden_tool' | 'stone_tool' | 'wooden_pickaxe' | 'stone_pickaxe';

/**
 * Crafting recipes
 */
export const RECIPES: Record<RecipeType, { ingredients: Partial<Inventory>; output: Partial<Inventory>; description: string }> = {
  wooden_tool: {
    ingredients: { wood: 2 },
    output: { tools: 1 },
    description: 'Basic wooden tool',
  },
  stone_tool: {
    ingredients: { stone: 2, wood: 1 },
    output: { tools: 1 },
    description: 'Stone tool',
  },
  wooden_pickaxe: {
    ingredients: { wood: 5, tools: 1 },
    output: { tools: 2 },
    description: 'Wooden pickaxe for gathering',
  },
  stone_pickaxe: {
    ingredients: { stone: 5, wood: 3, tools: 1 },
    output: { tools: 3 },
    description: 'Stone pickaxe for heavy gathering',
  },
};

/**
 * Structure building costs
 */
export const STRUCTURE_RECIPES: Record<StructureType, Partial<Inventory>> = {
  shelter: { wood: 10, stone: 5 },
  fence: { wood: 3 },
  workbench: { wood: 5, stone: 2 },
  storage: { wood: 8 },
};

/**
 * Give resource tool schema
 */
export interface GiveResourceToolCall {
  fromAgentId: ID;
  toAgentId: ID;
  resource: keyof Inventory;
  amount: number;
}

/**
 * Handle give resource action
 */
export function handleGiveResource(world: World, call: GiveResourceToolCall): World {
  const from = world.agents.find(a => a.id === call.fromAgentId);
  const to = world.agents.find(a => a.id === call.toAgentId);
  if (!from || !to) return world;
  if ((from.inventory[call.resource] || 0) < call.amount) return world;
  // Update inventories
  from.inventory[call.resource] -= call.amount;
  to.inventory[call.resource] += call.amount;
  // Update happiness and relationships
  const newAgents = world.agents.map(agent => {
    if (agent.id === from.id) {
      let updated = updateRelationshipEvent(agent, to.id, 'give');
      updated = updateHappinessEvent(updated, 'give');
      return updated;
    } else if (agent.id === to.id) {
      let updated = updateRelationshipEvent(agent, from.id, 'give');
      updated = updateHappinessEvent(updated, 'give');
      return updated;
    }
    return agent;
  });
  return { ...world, agents: newAgents };
}
// ...existing code...

/**
 * Move tool schema
 */
export interface MoveToolCall {
  agentId: ID;
  to: { x: number; y: number };
}

/**
 * Communicate tool schema
 */
export interface CommunicateToolCall {
  agentId: ID;
  message: string;
  recipients: ID[];
}

/**
 * Gather tool schema
 */
export interface GatherToolCall {
  agentId: ID;
  resource: keyof Inventory;
  location: { x: number; y: number };
}


/**
 * Create crop field tool schema
 */
export interface CreateCropFieldToolCall {
  agentId: ID;
  location: { x: number; y: number };
}

/**
 * Harvest crop tool schema
 */
export interface HarvestCropToolCall {
  agentId: ID;
  location: { x: number; y: number };
}

/**
 * Craft tool schema
 */
export interface CraftToolCall {
  agentId: ID;
  recipe: RecipeType;
}

/**
 * Build tool schema
 */
export interface BuildToolCall {
  agentId: ID;
  structureType: StructureType;
  location: { x: number; y: number };
}

/**
 * Handle create crop field action
 */
export function handleCreateCropField(world: World, call: CreateCropFieldToolCall, tick: number, cropGrowthTime: number): World {
  const tile = world.map[call.location.y]?.[call.location.x];
  if (!tile || tile.terrain !== 'grass' || tile.cropField) return world;
  tile.cropField = {
    id: `crop_${call.location.x}_${call.location.y}_${tick}`,
    location: { ...call.location },
    plantedTick: tick,
    watered: 0,
    matureTick: tick + cropGrowthTime,
    harvested: false,
  };
  return world;
}

/**
 * Handle harvest crop action
 */
export function handleHarvestCrop(world: World, call: HarvestCropToolCall, tick: number, cropWateringRequired: number): World {
  const tile = world.map[call.location.y]?.[call.location.x];
  if (!tile || !tile.cropField || tile.cropField.harvested) return world;
  const field = tile.cropField;
  if (tick < field.matureTick || field.watered < cropWateringRequired) return world;
  // Give food to agent
  // Update agent's inventory in world.agents directly (to preserve reference)
  for (const agent of world.agents) {
    if (agent.id === call.agentId) {
      agent.inventory.food += 2;
    }
  }
  field.harvested = true;
  return world;
}

/**
 * Handle a move action
 */
export function handleMove(world: World, call: MoveToolCall): World {
  const agents = world.agents.map(agent =>
    agent.id === call.agentId ? { ...agent, location: call.to } : agent
  );
  return { ...world, agents };
}

/**
 * Handle a communicate (proximity chat) action
 * Only allows communication with agents within visibility radius
 * Updates memory and relationships
 */
export function handleCommunicate(world: World, call: CommunicateToolCall): World {
  const sender = world.agents.find(a => a.id === call.agentId);
  if (!sender || !sender.alive) return world;
  // Only allow recipients within sender's visibility radius
  const validRecipients = world.agents.filter(a =>
    call.recipients.includes(a.id) &&
    a.id !== sender.id &&
    a.alive &&
    Math.abs(a.location.x - sender.location.x) <= sender.visibilityRadius &&
    Math.abs(a.location.y - sender.location.y) <= sender.visibilityRadius
  );
  // Update memory for sender and recipients
  const newAgents = world.agents.map(agent => {
    if (agent.id === sender.id) {
      // Sender: update memory, happiness, relationship to each recipient
      let updated = agent;
      for (const rec of validRecipients) {
        updated = updateRelationshipEvent(updated, rec.id, 'communicate');
      }
      updated = updateHappinessEvent(updated, 'communicate');
      return {
        ...updated,
        memory: [
          ...updated.memory,
          {
            tick: world.time,
            eventId: `chat_${Date.now()}_${Math.random().toString(36).slice(2,8)}`,
            description: `[CHAT] ${sender.name}: ${call.message}`,
          },
        ],
      };
    } else if (validRecipients.some(r => r.id === agent.id)) {
      // Recipient: update memory, happiness, relationship to sender
      let updated = updateRelationshipEvent(agent, sender.id, 'communicate');
      updated = updateHappinessEvent(updated, 'communicate');
      return {
        ...updated,
        memory: [
          ...updated.memory,
          {
            tick: world.time,
            eventId: `chat_${Date.now()}_${Math.random().toString(36).slice(2,8)}`,
            description: `[CHAT] ${sender.name}: ${call.message}`,
          },
        ],
      };
    }
    return agent;
  });
  // Optionally, update relationships (simple demo: +1 trust per chat)
  // ...existing code for relationship update could go here...
  return { ...world, agents: newAgents };
}

/**
 * Handle a gather action
 */
export function handleGather(world: World, call: GatherToolCall): World {
  // For demo: increment agent's inventory if resource exists at location
  const tile = world.map[call.location.y]?.[call.location.x];
  if (!tile || !tile.resources || !tile.resources[call.resource]) return world;
  const agents = world.agents.map(agent => {
    if (agent.id === call.agentId) {
      return {
        ...agent,
        inventory: {
          ...agent.inventory,
          [call.resource]: (agent.inventory[call.resource] || 0) + 1,
        },
      };
    }
    return agent;
  });
  // Remove resource from tile
  tile.resources[call.resource]! -= 1;
  if (tile.resources[call.resource]! <= 0) delete tile.resources[call.resource];
  return { ...world, agents };
}

/**
 * Handle a craft action
 */
export function handleCraft(world: World, call: CraftToolCall): World {
  const agent = world.agents.find(a => a.id === call.agentId);
  if (!agent || !agent.alive) return world;

  const recipe = RECIPES[call.recipe];
  if (!recipe) return world;

  // Check if agent has required ingredients
  for (const [resource, amount] of Object.entries(recipe.ingredients)) {
    if ((agent.inventory[resource as keyof Inventory] || 0) < (amount as number)) {
      return world; // Not enough resources
    }
  }

  // Deduct ingredients
  const updatedInventory = { ...agent.inventory };
  for (const [resource, amount] of Object.entries(recipe.ingredients)) {
    updatedInventory[resource as keyof Inventory] -= amount as number;
  }

  // Add output
  for (const [resource, amount] of Object.entries(recipe.output)) {
    updatedInventory[resource as keyof Inventory] = (updatedInventory[resource as keyof Inventory] || 0) + (amount as number);
  }

  // Update agent
  const agents = world.agents.map(a =>
    a.id === agent.id ? { ...a, inventory: updatedInventory } : a
  );

  return { ...world, agents };
}

/**
 * Handle a build action
 */
export function handleBuild(world: World, call: BuildToolCall): World {
  const agent = world.agents.find(a => a.id === call.agentId);
  const tile = world.map[call.location.y]?.[call.location.x];

  if (!agent || !tile || !agent.alive) return world;
  if (tile.structure) return world; // Already has a structure

  const recipe = STRUCTURE_RECIPES[call.structureType];
  if (!recipe) return world;

  // Check if agent has required resources
  for (const [resource, amount] of Object.entries(recipe)) {
    if ((agent.inventory[resource as keyof Inventory] || 0) < (amount as number)) {
      return world; // Not enough resources
    }
  }

  // Deduct resources
  const updatedInventory = { ...agent.inventory };
  for (const [resource, amount] of Object.entries(recipe)) {
    updatedInventory[resource as keyof Inventory] -= amount as number;
  }

  // Create structure
  const structure: Structure = {
    id: `structure_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type: call.structureType,
    location: { ...call.location },
    durability: 100,
    builtBy: agent.id,
  };

  tile.structure = structure;

  // Update agent
  const agents = world.agents.map(a =>
    a.id === agent.id ? { ...a, inventory: updatedInventory } : a
  );

  return { ...world, agents, map: world.map };
}

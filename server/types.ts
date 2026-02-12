// Core types and interfaces for Island Survival Simulator
// Research-grade, fully documented

/**
 * Unique identifier for agents, events, etc.
 */
export type ID = string;

/**
 * Gender type for agents
 */
export type Gender = 'male' | 'female';

/**
 * Agent status
 */
export type AgentStatus = 'child' | 'adult' | 'elder' | 'dead';

/**
 * Resource types available in the world
 */
export type ResourceType = 'wood' | 'stone' | 'water' | 'food' | 'tools';

/**
 * Inventory mapping resource type to quantity
 */
export type Inventory = Record<ResourceType, number>;

/**
 * Agent relationship types
 */
export type RelationshipType = 'trust' | 'friendship' | 'rivalry';

/**
 * Agent relationship structure
 */
export interface Relationship {
  agentId: ID;
  type: RelationshipType;
  value: number; // e.g., trust level
  notes?: string; // Textual description of the relationship
}

/**
 * Memory category for better organization
 */
export type MemoryCategory = 'interaction' | 'resource' | 'survival' | 'birth' | 'death' | 'god' | 'other';

/**
 * Agent memory entry
 */
export interface MemoryEntry {
  tick: number;
  eventId: ID;
  description: string;
  category?: MemoryCategory;
  importance?: number; // 0-10 scale for memory importance
  participants?: ID[]; // Other agents involved in this memory (for conversations)
}

/**
 * Chat message in conversation history
 */
export interface ChatMessage {
  tick: number;
  senderId: ID;
  senderName: string;
  message: string;
  participants: ID[]; // All agents who received this message
}

/**
 * Conversation history between agents
 */
export interface ConversationHistory {
  messages: ChatMessage[];
  lastUpdated: number; // tick of last message
}

/**
 * Personality trait values (0-100 scale)
 */
export interface Personality {
  openness: number; // Willingness to try new things
  conscientiousness: number; // Organization, reliability
  extraversion: number; // Sociability, assertiveness
  agreeableness: number; // Cooperation, compassion
  neuroticism: number; // Emotional stability (high = more anxious)
}

/**
 * Agent definition
 */
export interface Agent {
  id: ID;
  name: string;
  gender: Gender;
  age: number; // in ticks
  status: AgentStatus;
  happiness: number;
  personality: Personality;
  memory: MemoryEntry[];
  relationships: Relationship[];
  inventory: Inventory;
  mealsEaten: number;
  lastMealTick: number;
  starving: boolean;
  alive: boolean;
  pregnancy?: {
    startTick: number;
    duration: number;
    partnerId: ID;
  };
  location: { x: number; y: number };
  visibilityRadius: number;
  conversationHistory: Record<ID, ConversationHistory>; // Chat history with each agent
}

/**
 * Event types in the simulation
 */
export type EventType =
  | 'move'
  | 'communicate'
  | 'craft'
  | 'gather'
  | 'build'
  | 'procreate'
  | 'give'
  | 'create_crop_field'
  | 'harvest_crop'
  | 'weather_change'
  | 'birth'
  | 'death'
  | 'resource_drop'
  | 'god_message'
  | 'llm_error'
  | 'llm_fallback';

/**
 * Event log entry
 */
export interface Event {
  id: ID;
  type: EventType;
  tick: number;
  agentsInvolved: ID[];
  details: Record<string, any>;
  parentEventId?: ID;
}

/**
 * Weather state
 */
export type WeatherState = 'rain' | 'sun';

/**
 * Crop field state
 */
export interface CropField {
  id: ID;
  location: { x: number; y: number };
  plantedTick: number;
  watered: number;
  matureTick: number;
  harvested: boolean;
}

/**
 * Structure types that can be built
 */
export type StructureType = 'shelter' | 'fence' | 'workbench' | 'storage';

/**
 * Structure on a tile
 */
export interface Structure {
  id: ID;
  type: StructureType;
  location: { x: number; y: number };
  durability: number;
  builtBy: ID;
}

/**
 * Tile terrain type
 */
export type TerrainType = 'beach' | 'forest' | 'rocky' | 'water' | 'grass';

/**
 * Resource limits per tile type
 */
export interface TileResourceLimits {
  maxWood?: number;
  maxStone?: number;
  maxWater?: number;
  maxFood?: number;
  maxTools?: number;
}

/**
 * Map tile definition
 */
export interface Tile {
  x: number;
  y: number;
  elevation: number;
  terrain: TerrainType;
  resources: Partial<Inventory>;
  resourceLimits: TileResourceLimits;
  cropField?: CropField;
  structure?: Structure;
}

/**
 * World state
 */
export interface World {
  map: Tile[][];
  agents: Agent[];
  droppedItems: Array<{ location: { x: number; y: number }; inventory: Inventory }>;
  weather: WeatherState;
  time: number; // current tick
  dayNight: 'day' | 'night';
}

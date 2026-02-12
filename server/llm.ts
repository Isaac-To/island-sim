// LLM integration for Island Survival Simulator
// Handles sending agent state and tool schemas to an OpenAI-compatible endpoint
// and parsing/validating tool call responses.
// Research-grade, fully documented

import { Agent, World } from './types';
import { getPersonalityDescription, getSpatialMemoriesForLLM, observeTiles } from './agent';
import OpenAI from 'openai';
import fs from 'fs';

export interface LLMConfig {
  endpoint: string;
  apiKey: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
}

export interface LLMToolCall {
  name: string;
  arguments: Record<string, any>;
}

export interface LLMResponse {
  toolCalls: LLMToolCall[];
  raw: any;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  latency?: number;
}

/**
 * LLM client for agent decision-making
 */
export class LLMClient {
  private config: LLMConfig;
  private client: OpenAI;
  private maxRetries = 1; // Reduced from 3 for faster fallback

  constructor(config: LLMConfig) {
    this.config = config;

    // Parse base URL from endpoint - endpoint should always be without /chat/completions
    let baseUrl = config.endpoint;
    // Remove /chat/completions if present
    if (baseUrl.endsWith('/chat/completions')) {
      baseUrl = baseUrl.slice(0, -'/chat/completions'.length);
    }
    // Ensure we have the /v1 prefix
    if (!baseUrl.endsWith('/v1') && !baseUrl.includes('/v1/')) {
      baseUrl = baseUrl + (baseUrl.endsWith('/') ? 'v1' : '/v1');
    }

    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: baseUrl,
      timeout: 10000, // 10 second timeout for faster failure
      maxRetries: 1, // Override SDK default retries
    });
  }

  /**
   * Send agent state and tool schemas to LLM endpoint and get tool calls
   * @param agent The agent to act
   * @param world The current world state
   * @param toolSchemas The available tool schemas
   */
  async getToolCalls(
    agent: Agent,
    world: World,
    toolSchemas: any[]
  ): Promise<LLMResponse> {
    const startTime = Date.now();

    console.log(`[LLM] Requesting decision for agent ${agent.name} (${agent.id}) at tick ${world.time}`);

    // Prune memory to last 20 entries to keep context manageable
    const prunedMemory = agent.memory.slice(-20);

    // Compose a concise, context-aware prompt for the LLM
    const visibleTiles = world.map
      .flat()
      .filter(tile =>
        Math.abs(tile.x - agent.location.x) <= agent.visibilityRadius &&
        Math.abs(tile.y - agent.location.y) <= agent.visibilityRadius
      );

    const visibleAgents = world.agents.filter(a =>
      a.id !== agent.id &&
      a.alive &&
      Math.abs(a.location.x - agent.location.x) <= agent.visibilityRadius &&
      Math.abs(a.location.y - agent.location.y) <= agent.visibilityRadius
    );

    // Build agent state summary
    const agentState = {
      id: agent.id,
      name: agent.name,
      gender: agent.gender,
      age: agent.age,
      ageInDays: Math.floor(agent.age / 24),
      status: agent.status,
      happiness: agent.happiness,
      personality: {
        traits: agent.personality,
        description: getPersonalityDescription(agent.personality),
      },
      inventory: agent.inventory,
      mealsEaten: agent.mealsEaten,
      starving: agent.starving,
      pregnant: !!agent.pregnancy,
      location: agent.location,
      recentMemory: prunedMemory.map(m => {
        // Truncate long memory descriptions to keep context manageable
        const desc = m.description || '';
        const truncatedDesc = desc.length > 150 ? desc.substring(0, 150) + '...' : desc;
        return {
          tick: m.tick,
          description: truncatedDesc,
          category: m.category || 'other',
          importance: m.importance || 5,
        };
      }),
      relationships: agent.relationships.slice(0, 10).map(r => ({
        agentId: r.agentId,
        type: r.type,
        value: r.value,
        notes: r.notes || 'No notes',
      })),
      conversationHistory: Object.entries(agent.conversationHistory)
        .map(([otherId, history]) => {
          const otherAgent = world.agents.find(a => a.id === otherId);
          const otherName = otherId === 'GOD' ? 'GOD' : (otherAgent?.name || otherId);
          // Sort messages by tick (most recent first) and take last 5
          const sortedMessages = [...history.messages].sort((a, b) => b.tick - a.tick).slice(0, 5);
          return {
            withAgent: otherName,
            withAgentId: otherId,
            recentMessages: sortedMessages.map(m => {
              // Truncate long messages to keep context manageable
              const msg = m.message || '';
              const truncatedMsg = msg.length > 100 ? msg.substring(0, 100) + '...' : msg;
              return {
                tick: m.tick,
                sender: m.senderName,
                message: truncatedMsg,
                ticksAgo: world.time - m.tick,
              };
            }),
          };
        })
        .filter(h => h.recentMessages.length > 0)
        .sort((a, b) => {
          // Sort by most recent interaction (lowest ticksAgo)
          const aRecent = Math.min(...a.recentMessages.map(m => m.ticksAgo));
          const bRecent = Math.min(...b.recentMessages.map(m => m.ticksAgo));
          return aRecent - bRecent;
        }),
      spatialMemory: getSpatialMemoriesForLLM(agent, world.time, 15),
    };

    // Build world state summary
    const worldState = {
      time: world.time,
      hour: world.time % 24,
      day: Math.floor(world.time / 24),
      dayNight: world.dayNight,
      weather: world.weather,
      visibleTiles: visibleTiles.map(t => ({
        x: t.x,
        y: t.y,
        terrain: t.terrain,
        resources: t.resources,
        hasCropField: !!t.cropField,
        hasStructure: !!t.structure,
      })),
      visibleAgents: visibleAgents.map(a => ({
        id: a.id,
        name: a.name,
        location: a.location,
        status: a.status,
      })),
    };

    const systemPrompt = this.buildSystemPrompt(agent.status);
    const userPrompt = JSON.stringify({ agent: agentState, world: worldState });

    // Attempt with retry logic
    let lastError: Error | null = null;
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const response = await this.client.chat.completions.create({
          model: this.config.model,
          temperature: this.config.temperature ?? 0.3,
          max_tokens: this.config.maxTokens ?? 256,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          tools: toolSchemas,
        });

        const latency = Date.now() - startTime;
        const toolCalls: LLMToolCall[] = [];

        console.log(`[LLM] Response received:`, JSON.stringify({
          hasToolCalls: !!response.choices[0]?.message?.tool_calls,
          toolCallsCount: response.choices[0]?.message?.tool_calls?.length || 0,
          usage: response.usage,
        }));

        if (response.choices[0]?.message?.tool_calls) {
          for (const call of response.choices[0].message.tool_calls) {
            // OpenAI SDK tool_call structure - use type assertion for function property
            const toolCall = call as unknown as { function: { name: string; arguments: string } };
            if (toolCall.function) {
              let parsedArgs: Record<string, any> | null = null;
              try {
                parsedArgs = JSON.parse(toolCall.function.arguments);
              } catch (e) {
                // Attempt to heal common JSON issues
                let healed = toolCall.function.arguments
                  .replace(/,\s*}/g, '}') // Remove trailing commas in objects
                  .replace(/,\s*]/g, ']') // Remove trailing commas in arrays
                  .replace(/\n/g, ' ') // Remove newlines
                  .replace(/\r/g, ' ');
                try {
                  parsedArgs = JSON.parse(healed);
                  console.warn('[LLM] Healed malformed tool call arguments:', toolCall.function.arguments, '→', healed);
                } catch (e2) {
                  console.error('[LLM] Failed to parse tool call arguments, skipping:', toolCall.function.arguments);
                  continue;
                }
              }
              toolCalls.push({
                name: toolCall.function.name,
                arguments: parsedArgs,
              });
            }
          }
        }
  // Example for LLM: what a tool call should look like
  // {
  //   "name": "move",
  //   "arguments": { "agentId": "a1", "to": { "x": 5, "y": 3 } }
  // }

        console.log(`[LLM] Parsed ${toolCalls.length} tool calls:`, toolCalls);

        return {
          toolCalls,
          raw: response,
          promptTokens: response.usage?.prompt_tokens,
          completionTokens: response.usage?.completion_tokens,
          totalTokens: response.usage?.total_tokens,
          latency,
        };
      } catch (error: any) {
        lastError = error;
        // Exponential backoff
        if (attempt < this.maxRetries - 1) {
          const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // All retries failed
    this.logLLMInteraction('error', agent.id, {
      error: lastError?.message || 'Unknown error',
      attempts: this.maxRetries,
    });

    return { toolCalls: [], raw: null };
  }

  /**
   * Build system prompt based on agent status
   */
  private buildSystemPrompt(status: string): string {

    let prompt = `You are a person in a survival simulation.

Your goal is to survive and potentially thrive by:
- Gathering resources (wood, stone, water, food)
- Crafting tools and building structures
- Communicating and cooperating with other people
- Managing your hunger (eat regularly)

`;

    // Status-specific information
    if (status === 'child') {
      prompt += `
CURRENT STAGE - CHILD:
- You can ONLY move and communicate. Cannot gather, craft, build, or procreate.
- You must survive a significant period before gaining full abilities.
`;
    } else if (status === 'adult') {
      prompt += `
CURRENT STAGE - ADULT:
- Full access to all actions: gather, craft, build, procreate, give.
- Can procreate with opposite gender adults on same tile.
`;
    } else if (status === 'elder') {
      prompt += `
CURRENT STAGE - ELDER:
- HIGH RISK of death each tick, but can still act normally.
- Full access to all actions: gather, craft, build, procreate, give.
`;
    }

    // Always include survival mechanics (relevant to everyone)
    prompt += `

SURVIVAL MECHANICS:
- STARVATION: You must eat several meals per day to survive.
  * If you don't eat enough, you will become "starving" (visible in your status).
  * Continued starvation is HIGH RISK and can lead to death.
  * Eating when hungry resets your starving status. Prioritize food above all else.
- DEATH is permanent - you cannot be revived.

`;

    // Include pregnancy info only for adults
    if (status === 'adult') {
      prompt += `
PREGNANCY (females only):
- Pregnancy lasts a significant period of time.
- During pregnancy, your hunger needs increase.
- After pregnancy duration, a child is born.
`;
    }

    // Include farming info for adults and elders (who can actually use it)
    if (status === 'adult' || status === 'elder') {
      prompt += `
CROP FARMING:
- Crop fields must be watered multiple times during growth to mature successfully.
- Crops take a significant amount of time to mature.
- Rain automatically waters all crop fields.
- Only harvest mature, sufficiently watered crops.

TOOLS & CRAFTING:
- Tools are crafted from resources (wood, stone, metal) and are required for specific tasks.
- Tools unlock new actions (building, farming, mining).
- To make tools, collect necessary materials and use a crafting action.
- Tools have durability and may break after repeated use.
`;
    }

    // Include happiness mechanics for adults and elders
    if (status === 'adult' || status === 'elder') {
      prompt += `
HAPPINESS:
- Your happiness score (0-100) reflects your overall well-being.
- Positive events (communicating, giving resources, procreating) increase happiness.
- Negative events (starving, witnessing death) significantly decrease happiness.
- Low happiness may affect your decision-making quality.
`;
    }

    // Universal mechanics
    prompt += `

MOVEMENT & VISIBILITY:
- You can move a limited number of tiles per tick.
- You can only see and interact with entities within a certain visibility radius of your location.
- You cannot move into water tiles.

SPATIAL MEMORY:
- You have a spatial memory that tracks important locations you've discovered (resources, structures, crop fields).
- When you see tiles with notable resources (3+ wood, 3+ stone, 2+ water, 2+ food), you remember them.
- Structures and crop fields are automatically remembered when you encounter them.
- Your spatial memory shows location types, coordinates, estimated resources, and when you last saw them.
- Use this memory to plan efficient routes to gather resources or tend to crops.
- Locations are prioritized by importance based on your current needs (e.g., water and food are critical when low).

RELATIONSHIPS & MEMORY:
- Your relationships with other people matter - nurture positive relationships and be mindful of rivalries.
- Your memories inform your decisions - learn from past experiences.

`;

    // Communication guidelines
    prompt += `CONVERSATION GUIDELINES (CRITICAL):
- ALWAYS read your conversation history before communicating.
- When someone asks you a question, ANSWER it in your next message.
- When someone shares information, ACKNOWLEDGE it.
- Build on what others have said—don't repeat yourself.
- Be contextual and responsive in conversations.
- You are expected to communicate with other people every tick. If you have nothing specific to say, greet a nearby person or ask how they are.
- If you have already spoken to all visible people recently, you may skip communication for this tick.

ACTION GUIDELINES:
- You can perform ONE main action per tick (hour), such as moving, gathering, crafting, building, etc.
- You may also communicate (send messages) with other people during the same tick. Communicating does NOT consume your main action.
- You can ONLY interact with entities within your visibility radius.
- Starvation is fatal - eat food regularly.
- Choose the most sensible action given your current state and surroundings.

Respond with an array of tool calls: one main action (move, gather, craft, build, etc.) and zero or more communicate actions. If you have nothing specific to say, send a greeting or friendly message to a nearby person.`;

    return prompt;
  }

  private logLLMInteraction(type: string, agentId: string, data: any) {
    const logLine = JSON.stringify({
      timestamp: new Date().toISOString(),
      type,
      agentId,
      data,
    }) + '\n';
    try {
      fs.appendFileSync('llm_interactions.log', logLine);
    } catch {}
  }
}

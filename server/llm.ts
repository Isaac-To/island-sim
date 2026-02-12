// LLM integration for Island Survival Simulator
// Handles sending agent state and tool schemas to an OpenAI-compatible endpoint
// and parsing/validating tool call responses.
// Research-grade, fully documented

import { Agent, World } from './types';
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
      inventory: agent.inventory,
      mealsEaten: agent.mealsEaten,
      starving: agent.starving,
      pregnant: !!agent.pregnancy,
      location: agent.location,
      recentMemory: prunedMemory.map(m => ({
        tick: m.tick,
        description: m.description
      })),
      relationships: agent.relationships.slice(0, 10), // Limit to 10 most important
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
    const basePrompt = `You are an AI agent in a research-focused island survival simulation.

  Your goal is to survive and potentially thrive by:
  - Gathering resources (wood, stone, water, food)
  - Crafting tools and building structures
  - Communicating and cooperating with other agents
  - Managing your hunger (eat ${this.config.maxTokens ? 'regularly' : '3 meals per day'})

  Simulation Rules & Mechanics:
  - Tools are crafted from resources (wood, stone, metal) and are required for specific tasks (e.g., axes for chopping, hoes for farming).
  - To make tools, collect the necessary materials and use a crafting action, which consumes resources and produces the tool.
  - Tools have durability and may break after repeated use, requiring crafting replacements.
  - Crop fields are built using tools (like hoes) and resources (such as seeds and soil). Building a crop field enables planting and harvesting crops for food.
  - Actions depend on agent stats, tool availability, and environmental conditions.
  - Tools unlock new actions (building, farming, mining), enabling agents to create advanced structures and sustain themselves.
  - Relationships, memories, and personalities influence agent decisions and interactions, but resource management, tool crafting, and building are core mechanics.

  CRITICAL RULES:
  1. You can ONLY interact with entities within your visibility radius
  2. You cannot move into water tiles
  3. Starvation is fatal - eat food regularly
  4. Your actions are logged and may affect relationships with other agents
  5. Choose the most sensible action given your current state and surroundings

  Respond with ONLY a single tool call representing your chosen action.`;

    if (status === 'child') {
      return basePrompt + `\n\nAs a CHILD, you can only:
- Move to explore
- Communicate with nearby agents

You must grow up before you can gather, craft, build, or procreate.`;
    }

    return basePrompt;
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

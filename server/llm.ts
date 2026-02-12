// LLM integration for Island Survival Simulator
// Handles sending agent state and tool schemas to an OpenAI-compatible endpoint
// and parsing/validating tool call responses.
// Research-grade, fully documented

import { Agent, World } from './types';
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
}

/**
 * LLM client for agent decision-making
 */
export class LLMClient {
  private config: LLMConfig;

  constructor(config: LLMConfig) {
    this.config = config;
  }

  /**
   * Send agent state and tool schemas to LLM endpoint and get tool calls
   * @param agent The agent to act
   * @param world The current world state
   * @param toolSchemas The available tool schemas
   */
  async getToolCalls(agent: Agent, world: World, toolSchemas: any[]): Promise<LLMResponse> {
    // Compose a concise, context-aware prompt for the LLM
    const prompt = {
      agent: {
        id: agent.id,
        name: agent.name,
        gender: agent.gender,
        age: agent.age,
        status: agent.status,
        happiness: agent.happiness,
        memory: agent.memory,
        relationships: agent.relationships,
        inventory: agent.inventory,
        mealsEaten: agent.mealsEaten,
        lastMealTick: agent.lastMealTick,
        starving: agent.starving,
        alive: agent.alive,
        pregnancy: agent.pregnancy,
        location: agent.location,
        visibilityRadius: agent.visibilityRadius,
      },
      world: {
        time: world.time,
        dayNight: world.dayNight,
        weather: world.weather,
        // Only include visible map tiles and agents for this agent
        visibleTiles: world.map
          .flat()
          .filter(tile =>
            Math.abs(tile.x - agent.location.x) <= agent.visibilityRadius &&
            Math.abs(tile.y - agent.location.y) <= agent.visibilityRadius
          ),
        visibleAgents: world.agents.filter(a =>
          a.id !== agent.id &&
          Math.abs(a.location.x - agent.location.x) <= agent.visibilityRadius &&
          Math.abs(a.location.y - agent.location.y) <= agent.visibilityRadius
        ),
        inventory: agent.inventory,
      },
      toolSchemas,
      instructions: 'You are an agent in a research simulation. Choose ONE action for this tick using the provided tool schemas. Respond ONLY with a JSON array of tool calls.'
    };

    // Log prompt for auditability
    this.logLLMInteraction('prompt', agent.id, prompt);

    // Send HTTP request to LLM endpoint
    let response: any = null;
    try {
      const res = await fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.model,
          temperature: this.config.temperature ?? 0.2,
          max_tokens: this.config.maxTokens ?? 256,
          messages: [
            { role: 'system', content: 'You are an agent in a research simulation. Use tool-calling to act.' },
            { role: 'user', content: JSON.stringify(prompt) }
          ],
          tools: toolSchemas,
        }),
      });
      response = await res.json();
    } catch (err) {
      this.logLLMInteraction('error', agent.id, { error: err });
      return { toolCalls: [], raw: null };
    }

    // Log response for auditability
    this.logLLMInteraction('response', agent.id, response);

    // Parse tool calls from response (OpenAI function calling format)
    let toolCalls: LLMToolCall[] = [];
    if (response && response.choices && response.choices[0]?.message?.tool_calls) {
      toolCalls = response.choices[0].message.tool_calls.map((call: any) => ({
        name: call.function.name,
        arguments: call.function.arguments,
      }));
    }
    return { toolCalls, raw: response };
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


import { World, Event, ID, Agent } from './types';
import { tickAgent } from './agent';
import { handleMove, handleCommunicate, handleGather, handleCreateCropField, handleHarvestCrop, MoveToolCall, CommunicateToolCall, GatherToolCall, CreateCropFieldToolCall, HarvestCropToolCall } from './tools';
import { handleGiveResource, GiveResourceToolCall } from './tools';
import { handleCraft, CraftToolCall } from './tools';
import { handleBuild, BuildToolCall } from './tools';
import { LLMClient, LLMConfig, LLMToolCall } from './llm';
import { getToolSchemas } from './toolSchemas';
import { SeededRandom } from '../lib/seededRandom';

/**
 * Simulation configuration parameters
 */
export interface SimulationConfig {
  tickDurationMs: number;
  mapSize: number;
  childDuration: number;
  pregnancyDuration: number;
  cropGrowthTime: number;
  cropWateringRequired: number;
  agentMovePerTick: number;
  mealsPerDay: number;
  visibilityRadius: number;
  seed: number; // Random seed for reproducibility
  llm?: LLMConfig;
}

/**
 * Main simulation class
 */
export class Simulation {
  public world: World;
  public eventLog: Event[] = [];
  /**
   * Map of eventId to event for fast lookup (for branching, playback, etc.)
   */
  public eventMap: Record<string, Event> = {};
  /**
   * Map of eventId to world snapshot (for playback/branching)
   */
  public worldSnapshots: Record<string, World> = {};
  public config: SimulationConfig;
  public random: SeededRandom;
  private tickInterval?: NodeJS.Timeout;
  private llmClient?: LLMClient;

  constructor(config: SimulationConfig, initialWorld: World) {
    this.config = config;
    this.world = initialWorld;
    this.random = new SeededRandom(config.seed);
    if (config.llm) {
      this.llmClient = new LLMClient(config.llm);
      console.log('[LLM] Client initialized with endpoint:', config.llm.endpoint);
    }
  }

  /**
   * Generate a unique event ID deterministically
   */
  private generateEventId(prefix: string = 'event'): string {
    return `${prefix}_${this.random.random().toString(36).slice(2, 10)}`;
  }

  /**
   * Send a GOD message to all or selected agents
   * @param message The message string
   * @param targetAgentIds Array of agent IDs to receive the message (empty = all)
   */
  sendGodMessage(message: string, targetAgentIds: string[] = []) {
    const recipients = targetAgentIds.length > 0
      ? this.world.agents.filter((a: Agent) => targetAgentIds.includes(a.id) && a.alive)
      : this.world.agents.filter((a: Agent) => a.alive);
    for (const agent of recipients) {
      agent.memory.push({
        tick: this.world.time,
        eventId: this.generateEventId('godmsg'),
        description: `[GOD] ${message}`,
      });
    }
    this.logEvent({
      id: this.generateEventId('event'),
      type: 'god_message',
      tick: this.world.time,
      agentsInvolved: recipients.map((a: Agent) => a.id),
      details: { message },
    });
  }

  /**
   * Start the simulation ticking
   */
  start() {
    this.tickInterval = setInterval(() => this.tick(), this.config.tickDurationMs);
  }

  /**
   * Stop the simulation
   */
  stop() {
    if (this.tickInterval) clearInterval(this.tickInterval);
  }

  /**
   * Advance simulation by one tick
   */
  async tick() {
    // Tick all agents (age, status, death)
    const prevAgents = this.world.agents;
    let newWorld = { ...this.world };

    const newAgents = prevAgents.map(agent => {
      const prevStatus = agent.status;
      const prevAlive = agent.alive;
      const updated = tickAgent(agent, this.config.childDuration, this.config.childDuration + 2000, () => this.random.random());

      // Log lifecycle transitions
      if (prevStatus !== updated.status) {
        this.logEvent({
          id: this.generateEventId("event"),
          type: updated.status === 'adult' ? 'birth' : 'death',
          tick: this.world.time,
          agentsInvolved: [updated.id],
          details: { from: prevStatus, to: updated.status },
        });
      }

      if (prevAlive && !updated.alive) {
        // Drop resources at agent's location
        if (Object.values(updated.inventory).some(qty => qty > 0)) {
          newWorld.droppedItems.push({
            location: { ...updated.location },
            inventory: { ...updated.inventory },
          });
          this.logEvent({
            id: this.generateEventId("event"),
            type: 'resource_drop',
            tick: this.world.time,
            agentsInvolved: [updated.id],
            details: { location: { ...updated.location }, inventory: { ...updated.inventory } },
          });
          // Clear agent inventory
          updated.inventory = { wood: 0, stone: 0, water: 0, food: 0, tools: 0 };
        }
        this.logEvent({
          id: this.generateEventId("event"),
          type: 'death',
          tick: this.world.time,
          agentsInvolved: [updated.id],
          details: { reason: 'elderly' },
        });
      }

      // Nutrition/starvation: eat if food available, track meals per 24-tick period
      let agentAfterEat = { ...updated };
      const tickDay = Math.floor(this.world.time / 24);

      if (agentAfterEat.inventory.food > 0 && (agentAfterEat.lastMealTick !== this.world.time)) {
        agentAfterEat.inventory.food -= 1;
        agentAfterEat.mealsEaten += 1;
        agentAfterEat.lastMealTick = this.world.time;
      }

      // Check starvation at the end of each day (tick 23, 47, 71, etc.)
      let alive = agentAfterEat.alive;
      const isEndOfDay = (this.world.time % 24) === 23;

      if (isEndOfDay) {
        const mealsNeeded = this.config.mealsPerDay;
        const ateEnough = agentAfterEat.mealsEaten >= mealsNeeded;

        if (!ateEnough) {
          // Agent didn't eat enough today
          if (agentAfterEat.starving) {
            // Already was starving, now dies
            alive = false;
            this.logEvent({
              id: this.generateEventId("event"),
              type: 'death',
              tick: this.world.time,
              agentsInvolved: [agentAfterEat.id],
              details: { reason: 'starvation', mealsEaten: agentAfterEat.mealsEaten },
            });
          } else {
            // First day of starvation
            agentAfterEat.starving = true;
          }
        } else {
          // Ate enough, reset starving status
          agentAfterEat.starving = false;
        }
      }

      // Reset mealsEaten at start of new day (tick 0, 24, 48, etc.)
      if ((this.world.time % 24) === 0) {
        agentAfterEat.mealsEaten = 0;
      }

      agentAfterEat.alive = alive;

      // Procreation: if two adults (male/female) in same tile, not pregnant, can procreate
      let agentAfterProcreate = { ...agentAfterEat };
      if (
        agentAfterEat.status === 'adult' &&
        !agentAfterEat.pregnancy &&
        agentAfterEat.gender === 'female'
      ) {
        const partners = newWorld.agents.filter(
          (a: Agent) =>
            a.id !== agentAfterEat.id &&
            a.status === 'adult' &&
            a.gender === 'male' &&
            a.location.x === agentAfterEat.location.x &&
            a.location.y === agentAfterEat.location.y &&
            !a.pregnancy
        );
        if (partners.length > 0) {
          // Start pregnancy
          agentAfterProcreate.pregnancy = {
            startTick: this.world.time,
            duration: this.config.pregnancyDuration,
            partnerId: partners[0].id
          };
          this.logEvent({
            id: this.generateEventId("event"),
            type: 'procreate',
            tick: this.world.time,
            agentsInvolved: [agentAfterEat.id, partners[0].id],
            details: { location: { ...agentAfterEat.location } },
          });
        }
      }

      // Pregnancy: if pregnant and duration elapsed, give birth to child agent
      if (
        agentAfterProcreate.pregnancy &&
        this.world.time - agentAfterProcreate.pregnancy.startTick >= agentAfterProcreate.pregnancy.duration
      ) {
        // Give birth
        const childId = this.generateEventId('child');
        const gender: 'male' | 'female' = this.random.randomBoolean(0.5) ? 'male' : 'female';
        const child: Agent = {
          id: childId,
          name: childId,
          gender,
          age: 0,
          status: 'child' as const,
          happiness: 100,
          memory: [],
          relationships: [],
          inventory: { wood: 0, stone: 0, water: 0, food: 0, tools: 0 },
          mealsEaten: 0,
          lastMealTick: this.world.time,
          starving: false,
          alive: true,
          location: { ...agentAfterProcreate.location },
          visibilityRadius: agentAfterProcreate.visibilityRadius,
        };
        newWorld.agents.push(child);
        this.logEvent({
          id: this.generateEventId("event"),
          type: 'birth',
          tick: this.world.time,
          agentsInvolved: [agentAfterProcreate.id, childId],
          details: { location: { ...agentAfterProcreate.location } },
        });
        agentAfterProcreate.pregnancy = undefined;
      }

      return { ...agentAfterProcreate };
    });

    // Remove dead agents from simulation
    newWorld.agents = newAgents.filter((agent: Agent) => agent.alive);
    this.world = newWorld;

    // Process agent actions (LLM or fallback)
    const aliveAgents = this.world.agents.filter((a: Agent) => a.alive);
    if (this.llmClient) {
      console.log(`[LLM] Processing ${aliveAgents.length} agents with LLM at tick ${this.world.time}`);
      await this.processAgentsWithLLM(aliveAgents);
    } else {
      console.log('[LLM] No LLM client configured, using fallback logic');
      this.processAgentsWithFallback(aliveAgents);
    }

    this.updateWeather();
    this.world.time++;
    this.updateDayNight();
  }

  /**
   * Process agents using LLM for decision-making
   * Batches agents into groups of 5 for parallel LLM calls
   */
  private async processAgentsWithLLM(agents: Agent[]) {
    const batchSize = 5;
    for (let i = 0; i < agents.length; i += batchSize) {
      const batch = agents.slice(i, i + batchSize);
      await Promise.all(
        batch.map(agent => this.processSingleAgentWithLLM(agent))
      );
    }
  }

  /**
   * Process a single agent with LLM decision-making
   */
  private async processSingleAgentWithLLM(agent: Agent) {
    // Get tool schemas based on agent status
    const toolSchemas = getToolSchemas(agent.status);

    // Log LLM query event
    const queryEventId = this.generateEventId('llm_query');
    this.logEvent({
      id: queryEventId,
      type: 'llm_query',
      tick: this.world.time,
      agentsInvolved: [agent.id],
      details: { status: agent.status, toolCount: toolSchemas.length },
    });

    // Get tool calls from LLM
    const response = await this.llmClient!.getToolCalls(agent, this.world, toolSchemas);

    if (response.toolCalls.length === 0) {
      // No tool calls returned - execute fallback action instead of doing nothing
      console.log(`[LLM] No tool calls for ${agent.name}, executing fallback action`);
      this.logEvent({
        id: this.generateEventId('llm_fallback'),
        type: 'llm_fallback',
        tick: this.world.time,
        agentsInvolved: [agent.id],
        details: { reason: 'no_tool_calls' },
      });
      this.executeFallbackAction(agent);
      return;
    }

    // Log LLM response event
    this.logEvent({
      id: this.generateEventId('llm_response'),
      type: 'llm_response',
      tick: this.world.time,
      agentsInvolved: [agent.id],
      details: {
        toolCalls: response.toolCalls,
        promptTokens: response.promptTokens,
        completionTokens: response.completionTokens,
        totalTokens: response.totalTokens,
        latency: response.latency,
      },
    });

    // Execute the first tool call (LLM should only return one)
    const toolCall = response.toolCalls[0];
    this.executeToolCall(toolCall);
  }

  /**
   * Execute a tool call from LLM
   */
  private executeToolCall(toolCall: LLMToolCall) {
    switch (toolCall.name) {
      case 'move': {
        const call = toolCall.arguments as MoveToolCall;
        // Validate move: check if target is within bounds and not water
        const targetTile = this.world.map[call.to.y]?.[call.to.x];
        const agent = this.world.agents.find((a: Agent) => a.id === call.agentId);
        if (!agent) return;

        // Check distance (movement limit)
        const distance = Math.abs(call.to.x - agent.location.x) + Math.abs(call.to.y - agent.location.y);
        if (distance > this.config.agentMovePerTick) return; // Too far

        // Check if target is water
        if (targetTile?.terrain === 'water') return;

        this.world = handleMove(this.world, call);
        this.logEvent({
          id: this.generateEventId('event'),
          type: 'move',
          tick: this.world.time,
          agentsInvolved: [call.agentId],
          details: { from: agent.location, to: call.to },
        });
        break;
      }
      case 'communicate': {
        const call = toolCall.arguments as CommunicateToolCall;
        const agent = this.world.agents.find((a: Agent) => a.id === call.agentId);
        if (!agent) return;

        // Validate recipients are within proximity
        const validRecipients = call.recipients.filter(recipientId => {
          const recipient = this.world.agents.find((a: Agent) => a.id === recipientId);
          if (!recipient) return false;
          const dist = Math.abs(recipient.location.x - agent.location.x) + Math.abs(recipient.location.y - agent.location.y);
          return dist <= agent.visibilityRadius;
        });

        if (validRecipients.length === 0) return;

        this.world = handleCommunicate(this.world, { ...call, recipients: validRecipients });
        this.logEvent({
          id: this.generateEventId('event'),
          type: 'communicate',
          tick: this.world.time,
          agentsInvolved: [call.agentId, ...validRecipients],
          details: { message: call.message },
        });
        break;
      }
      case 'gather': {
        const call = toolCall.arguments as GatherToolCall;
        const agent = this.world.agents.find((a: Agent) => a.id === call.agentId);
        if (!agent) return;

        // Validate proximity to gather location
        const dist = Math.abs(call.location.x - agent.location.x) + Math.abs(call.location.y - agent.location.y);
        if (dist > agent.visibilityRadius) return;

        this.world = handleGather(this.world, call);
        this.logEvent({
          id: this.generateEventId('event'),
          type: 'gather',
          tick: this.world.time,
          agentsInvolved: [call.agentId],
          details: { resource: call.resource, location: call.location },
        });
        break;
      }
      case 'craft': {
        const call = toolCall.arguments as CraftToolCall;
        this.world = handleCraft(this.world, call);
        this.logEvent({
          id: this.generateEventId('event'),
          type: 'craft',
          tick: this.world.time,
          agentsInvolved: [call.agentId],
          details: { recipe: call.recipe },
        });
        break;
      }
      case 'build': {
        const call = toolCall.arguments as BuildToolCall;
        const agent = this.world.agents.find((a: Agent) => a.id === call.agentId);
        if (!agent) return;

        // Validate proximity to build location
        const dist = Math.abs(call.location.x - agent.location.x) + Math.abs(call.location.y - agent.location.y);
        if (dist > agent.visibilityRadius) return;

        this.world = handleBuild(this.world, call);
        this.logEvent({
          id: this.generateEventId('event'),
          type: 'build',
          tick: this.world.time,
          agentsInvolved: [call.agentId],
          details: { structureType: call.structureType, location: call.location },
        });
        break;
      }
      case 'create_crop_field': {
        const call = toolCall.arguments as CreateCropFieldToolCall;
        const agent = this.world.agents.find((a: Agent) => a.id === call.agentId);
        if (!agent) return;

        // Validate proximity
        const dist = Math.abs(call.location.x - agent.location.x) + Math.abs(call.location.y - agent.location.y);
        if (dist > agent.visibilityRadius) return;

        this.world = handleCreateCropField(this.world, call, this.world.time, this.config.cropGrowthTime);
        this.logEvent({
          id: this.generateEventId('event'),
          type: 'create_crop_field',
          tick: this.world.time,
          agentsInvolved: [call.agentId],
          details: { location: call.location },
        });
        break;
      }
      case 'harvest_crop': {
        const call = toolCall.arguments as HarvestCropToolCall;
        const agent = this.world.agents.find((a: Agent) => a.id === call.agentId);
        if (!agent) return;

        // Validate proximity
        const dist = Math.abs(call.location.x - agent.location.x) + Math.abs(call.location.y - agent.location.y);
        if (dist > agent.visibilityRadius) return;

        this.world = handleHarvestCrop(this.world, call, this.world.time, this.config.cropWateringRequired);
        this.logEvent({
          id: this.generateEventId('event'),
          type: 'harvest_crop',
          tick: this.world.time,
          agentsInvolved: [call.agentId],
          details: { location: call.location },
        });
        break;
      }
      case 'give_resource': {
        const call = toolCall.arguments as GiveResourceToolCall;
        const fromAgent = this.world.agents.find((a: Agent) => a.id === call.fromAgentId);
        const toAgent = this.world.agents.find((a: Agent) => a.id === call.toAgentId);
        if (!fromAgent || !toAgent) return;

        // Validate proximity
        const dist = Math.abs(toAgent.location.x - fromAgent.location.x) + Math.abs(toAgent.location.y - fromAgent.location.y);
        if (dist > fromAgent.visibilityRadius) return;

        this.world = handleGiveResource(this.world, call);
        this.logEvent({
          id: this.generateEventId('event'),
          type: 'give',
          tick: this.world.time,
          agentsInvolved: [call.fromAgentId, call.toAgentId],
          details: { resource: call.resource, amount: call.amount },
        });
        break;
      }
      default:
        // Unknown tool call - log error
        this.logEvent({
          id: this.generateEventId('llm_error'),
          type: 'llm_error',
          tick: this.world.time,
          agentsInvolved: [],
          details: { error: 'unknown_tool', toolName: toolCall.name },
        });
    }
  }

  /**
   * Process agents using fallback logic (no LLM)
   */
  private processAgentsWithFallback(agents: Agent[]) {
    for (const agent of agents) {
      this.executeFallbackAction(agent);
    }
  }

  /**
   * Execute simple fallback action for an agent
   */
  private executeFallbackAction(agent: Agent) {
    // Simple logic: if starving and has food, eat; otherwise random move
    const visibleAgents = this.world.agents.filter((a: Agent) =>
      a.id !== agent.id &&
      a.alive &&
      Math.abs(a.location.x - agent.location.x) <= agent.visibilityRadius &&
      Math.abs(a.location.y - agent.location.y) <= agent.visibilityRadius
    );

    if (visibleAgents.length > 0) {
      // Proximity chat: communicate with first visible agent
      const communicateCall = {
        agentId: agent.id,
        message: 'Hello from tick ' + this.world.time,
        recipients: [visibleAgents[0].id],
      };
      this.world = handleCommunicate(this.world, communicateCall);
      this.logEvent({
        id: this.generateEventId("event"),
        type: 'communicate',
        tick: this.world.time,
        agentsInvolved: [agent.id, visibleAgents[0].id],
        details: { message: communicateCall.message },
      });
    } else {
      // Fallback: crop/move logic
      const tile = this.world.map[agent.location.y]?.[agent.location.x];
      if (tile && tile.terrain === 'grass' && !tile.cropField) {
        const createCall: CreateCropFieldToolCall = { agentId: agent.id, location: { ...agent.location } };
        this.world = handleCreateCropField(this.world, createCall, this.world.time, this.config.cropGrowthTime);
        this.logEvent({
          id: this.generateEventId("event"),
          type: 'create_crop_field',
          tick: this.world.time,
          agentsInvolved: [agent.id],
          details: { location: { ...agent.location } },
        });
      } else if (tile && tile.cropField && !tile.cropField.harvested) {
        const harvestCall: HarvestCropToolCall = { agentId: agent.id, location: { ...agent.location } };
        this.world = handleHarvestCrop(this.world, harvestCall, this.world.time, this.config.cropWateringRequired);
        this.logEvent({
          id: this.generateEventId("event"),
          type: 'harvest_crop',
          tick: this.world.time,
          agentsInvolved: [agent.id],
          details: { location: { ...agent.location } },
        });
      } else {
        // Move
        const directions = [
          { dx: -1, dy: 0 },
          { dx: 1, dy: 0 },
          { dx: 0, dy: -1 },
          { dx: 0, dy: 1 }
        ];
        const dir = this.random.randomChoice(directions);
        const to = {
          x: Math.max(0, Math.min(this.config.mapSize - 1, agent.location.x + dir.dx)),
          y: Math.max(0, Math.min(this.config.mapSize - 1, agent.location.y + dir.dy)),
        };
        const moveCall: MoveToolCall = { agentId: agent.id, to };
        this.world = handleMove(this.world, moveCall);
        this.logEvent({
          id: this.generateEventId("event"),
          type: 'move',
          tick: this.world.time,
          agentsInvolved: [agent.id],
          details: { from: agent.location, to },
        });
      }
    }
  }

  /**
   * Update weather state (random rain/sun) and log event
   */
  updateWeather() {
    // 10% chance to change weather each tick
    if (this.random.randomBoolean(0.1)) {
      const newWeather = this.world.weather === 'sun' ? 'rain' : 'sun';
      this.world.weather = newWeather;
      this.logEvent({
        id: this.generateEventId("event"),
        type: 'weather_change',
        tick: this.world.time,
        agentsInvolved: [],
        details: { weather: newWeather },
      });
      // If rain, water all crop fields
      if (newWeather === 'rain') {
        for (const row of this.world.map) {
          for (const tile of row) {
            if (tile.cropField && !tile.cropField.harvested) {
              tile.cropField.watered += 1;
            }
          }
        }
      }
    }
  }

  /**
   * Log an event in the event log
   */
  logEvent(event: Event) {
    // Set parentEventId to last event if not set
    if (!event.parentEventId && this.eventLog.length > 0) {
      event.parentEventId = this.eventLog[this.eventLog.length - 1].id;
    }
    this.eventLog.push(event);
    this.eventMap[event.id] = event;
    // Save world snapshot for this event
    this.worldSnapshots[event.id] = JSON.parse(JSON.stringify(this.world));
  }

  /**
   * Step forward to next event (playback)
   */
  stepToEvent(eventId: string) {
    if (this.worldSnapshots[eventId]) {
      this.world = JSON.parse(JSON.stringify(this.worldSnapshots[eventId]));
    }
  }

  /**
   * Jump to any event in the chain (playback)
   */
  jumpToEvent(eventId: string) {
    this.stepToEvent(eventId);
  }

  /**
   * Branch simulation from any event (creates a new timeline from that point)
   */
  branchFromEvent(eventId: string) {
    if (!this.worldSnapshots[eventId]) return;
    this.world = JSON.parse(JSON.stringify(this.worldSnapshots[eventId]));
    // Remove all events after branch point
    const idx = this.eventLog.findIndex(e => e.id === eventId);
    if (idx >= 0) {
      this.eventLog = this.eventLog.slice(0, idx + 1);
    }
  }

  /**
   * Update day/night status based on current tick
   */
  updateDayNight() {
    const hour = this.world.time % 24;
    this.world.dayNight = hour >= 6 && hour < 18 ? 'day' : 'night';
  }
}

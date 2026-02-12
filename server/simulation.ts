
import { World, Event, ID } from './types';
import { tickAgent } from './agent';
import { handleMove, handleCommunicate, handleGather, handleCreateCropField, handleHarvestCrop, MoveToolCall, CommunicateToolCall, GatherToolCall, CreateCropFieldToolCall, HarvestCropToolCall } from './tools';
import { handleGiveResource, GiveResourceToolCall } from './tools';
import { LLMClient, LLMConfig } from './llm';
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
      ? this.world.agents.filter((a: any) => targetAgentIds.includes(a.id) && a.alive)
      : this.world.agents.filter((a: any) => a.alive);
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
      agentsInvolved: recipients.map((a: any) => a.id),
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

        // (llmClient is already declared at the top of the class)
  /**
   * Advance simulation by one tick
   */
  tick() {
            if (this.config.llm) {
              this.llmClient = new LLMClient(this.config.llm);
            }
    // Tick all agents (age, status, death)
    const prevAgents = this.world.agents;
    let newWorld = { ...this.world };
    const newAgents = prevAgents.map(agent => {
      const prevStatus = agent.status;
      const prevAlive = agent.alive;
      const updated = tickAgent(agent, this.config.childDuration, this.config.childDuration + 2000, () => this.random.random()); // Example elder age
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
      let agentAfterGive = { ...agentAfterEat };
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
          a =>
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
            partnerId: partners[0].id,
          };
          // Optionally, mark partner as unavailable for procreation this tick
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
        const child = {
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
       // Demo: if agent sees another agent in range, communicate; else fallback to previous logic
       if (agentAfterProcreate.alive && agentAfterProcreate.status !== 'dead') {
         const visibleAgents = newWorld.agents.filter(a =>
           a.id !== agentAfterProcreate.id &&
           a.alive &&
           Math.abs(a.location.x - agentAfterProcreate.location.x) <= agentAfterProcreate.visibilityRadius &&
           Math.abs(a.location.y - agentAfterProcreate.location.y) <= agentAfterProcreate.visibilityRadius
         );
         if (visibleAgents.length > 0) {
           // Proximity chat: communicate with first visible agent
           const communicateCall = {
             agentId: agentAfterProcreate.id,
             message: 'Hello from tick ' + this.world.time,
             recipients: [visibleAgents[0].id],
           };
           newWorld = handleCommunicate(newWorld, communicateCall);
           this.logEvent({
             id: this.generateEventId("event"),
             type: 'communicate',
             tick: this.world.time,
             agentsInvolved: [agentAfterProcreate.id, visibleAgents[0].id],
             details: { message: communicateCall.message },
           });
         } else {
           // Fallback: original crop/move logic
           const tile = newWorld.map[agentAfterProcreate.location.y]?.[agentAfterProcreate.location.x];
           if (tile && tile.terrain === 'grass' && !tile.cropField) {
             const createCall: CreateCropFieldToolCall = { agentId: agentAfterProcreate.id, location: { ...agentAfterProcreate.location } };
             newWorld = handleCreateCropField(newWorld, createCall, this.world.time, this.config.cropGrowthTime);
             this.logEvent({
               id: this.generateEventId("event"),
               type: 'create_crop_field',
               tick: this.world.time,
               agentsInvolved: [agentAfterProcreate.id],
               details: { location: { ...agentAfterProcreate.location } },
             });
           } else if (tile && tile.cropField && !tile.cropField.harvested) {
             const harvestCall: HarvestCropToolCall = { agentId: agentAfterProcreate.id, location: { ...agentAfterProcreate.location } };
             newWorld = handleHarvestCrop(newWorld, harvestCall, this.world.time, this.config.cropWateringRequired);
             this.logEvent({
               id: this.generateEventId("event"),
               type: 'harvest_crop',
               tick: this.world.time,
               agentsInvolved: [agentAfterProcreate.id],
               details: { location: { ...agentAfterProcreate.location } },
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
               x: Math.max(0, Math.min(this.config.mapSize - 1, agentAfterProcreate.location.x + dir.dx)),
               y: Math.max(0, Math.min(this.config.mapSize - 1, agentAfterProcreate.location.y + dir.dy)),
             };
             const moveCall: MoveToolCall = { agentId: agentAfterProcreate.id, to };
             newWorld = handleMove(newWorld, moveCall);
             this.logEvent({
               id: this.generateEventId("event"),
               type: 'move',
               tick: this.world.time,
               agentsInvolved: [agentAfterProcreate.id],
               details: { from: agentAfterProcreate.location, to },
             });
           }
         }
       }
      return { ...agentAfterProcreate, location: newWorld.agents.find(a => a.id === agentAfterProcreate.id)?.location || agentAfterProcreate.location };
    });
    // Remove dead agents from simulation
    newWorld.agents = newAgents.filter(agent => agent.alive);
    this.world = newWorld;
    this.updateWeather();
    this.world.time++;
    this.updateDayNight();
    // ...other updates
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
   * Step forward to the next event (playback)
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
    // Remove all events after the branch point
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

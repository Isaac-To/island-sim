import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { Simulation, SimulationConfig } from '../../server/simulation';
import { World } from '../../server/types';

/**
 * Singleton simulation instance for on-demand tick generation
 * Persists across API requests in development/production for single-user scenarios
 */
let simulation: Simulation | null = null;

/**
 * Initialize or get existing simulation instance
 */
function getSimulation(): Simulation | null {
  if (simulation) {
    return simulation;
  }

  const serverDir = join(process.cwd(), 'server');
  const worldPath = join(serverDir, 'world.json');
  const configPath = join(serverDir, 'config.json');

  // Check if world state exists
  if (!existsSync(worldPath)) {
    return null;
  }

  try {
    // Load world state
    const worldData = readFileSync(worldPath, 'utf-8');
    const world: World = JSON.parse(worldData);

    // Load config
    const configData = readFileSync(configPath, 'utf-8');
    const config: SimulationConfig = JSON.parse(configData);

    // Load event log if exists
    const eventLogPath = join(serverDir, 'eventlog.json');
    let eventLog = [];
    if (existsSync(eventLogPath)) {
      const eventLogData = readFileSync(eventLogPath, 'utf-8');
      eventLog = JSON.parse(eventLogData);
    }

    // Create simulation instance
    simulation = new Simulation(config, world);
    simulation.eventLog = eventLog;

    // Set to live mode
    simulation.setMode('live');

    console.log('[Tick API] Simulation initialized for live mode');
    return simulation;
  } catch (error) {
    console.error('[Tick API] Failed to initialize simulation:', error);
    return null;
  }
}

/**
 * Save current simulation state to disk
 */
function saveSimulationState(sim: Simulation) {
  const serverDir = join(process.cwd(), 'server');

  try {
    // Save world state
    writeFileSync(
      join(serverDir, 'world.json'),
      JSON.stringify(sim.world, null, 2)
    );

    // Save event log
    writeFileSync(
      join(serverDir, 'eventlog.json'),
      JSON.stringify(sim.eventLog, null, 2)
    );
  } catch (error) {
    console.error('[Tick API] Failed to save simulation state:', error);
  }
}

/**
 * GET /api/tick - Get current simulation state without generating new tick
 */
export async function GET() {
  const sim = getSimulation();

  if (!sim) {
    return NextResponse.json(
      { error: 'Simulation not initialized. Run generate-demo first.' },
      { status: 404 }
    );
  }

  const state = sim.getCurrentState();

  return NextResponse.json({
    world: state.world,
    eventLog: state.eventLog,
    mode: state.mode,
    isPaused: sim.isLivePaused(),
  });
}

/**
 * POST /api/tick - Generate a single tick
 *
 * Body:
 * - action: 'generate' | 'pause' | 'resume' | 'status'
 */
export async function POST(req: NextRequest) {
  const sim = getSimulation();

  if (!sim) {
    return NextResponse.json(
      { error: 'Simulation not initialized. Run generate-demo first.' },
      { status: 404 }
    );
  }

  try {
    const { action } = await req.json();

    switch (action) {
      case 'generate': {
        // Check if paused
        if (sim.isLivePaused()) {
          return NextResponse.json({
            success: false,
            paused: true,
            message: 'Simulation is paused. Resume to generate ticks.',
          });
        }

        // Generate single tick
        const result = await sim.generateSingleTick();

        // Save state to disk
        saveSimulationState(sim);

        return NextResponse.json({
          success: true,
          events: result.events,
          world: result.world,
          totalEvents: sim.eventLog.length,
          currentTick: sim.world.time,
        });
      }

      case 'pause': {
        sim.pauseLiveMode();
        return NextResponse.json({
          success: true,
          isPaused: true,
        });
      }

      case 'resume': {
        sim.resumeLiveMode();
        return NextResponse.json({
          success: true,
          isPaused: false,
        });
      }

      case 'status': {
        return NextResponse.json({
          mode: sim.getMode(),
          isPaused: sim.isLivePaused(),
          currentTick: sim.world.time,
          totalEvents: sim.eventLog.length,
          agentCount: sim.world.agents.filter(a => a.alive).length,
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: generate, pause, resume, or status' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[Tick API] Error processing request:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

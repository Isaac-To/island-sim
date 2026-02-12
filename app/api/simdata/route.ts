import { NextResponse } from 'next/server';
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { Simulation } from '../../../server/simulation';
import { loadConfig } from '../../../server/config';
import { World, Event } from '../../../server/types';

// Singleton simulation instance for live mode
let liveSim: Simulation | null = null;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const live = searchParams.get('live') === 'true';
  const tickCount = searchParams.get('ticks');
  const singleTick = searchParams.get('singleTick') === 'true';

  if (live) {
    // Live mode: on-demand tick generation
    if (!liveSim) {
      // Initialize from disk (tick 0 world)
      try {
        const worldPath = path.join(process.cwd(), 'server', 'world.json');
        const world: World = JSON.parse(readFileSync(worldPath, 'utf-8'));
        const config = loadConfig();
        liveSim = new Simulation(config, world);
        liveSim.startLiveMode();
      } catch (e) {
        return NextResponse.json({ error: 'Failed to initialize live simulation', details: String(e) }, { status: 500 });
      }
    }

    // Optionally generate a single tick if requested
    if (singleTick) {
      try {
        const { events, world } = await liveSim.generateSingleTick();
        return NextResponse.json({ eventLog: liveSim.eventLog, newEvents: events, world, mode: liveSim.getMode() });
      } catch (e) {
        return NextResponse.json({ error: 'Failed to generate tick', details: String(e) }, { status: 500 });
      }
    }

    // Otherwise, just return current state
    return NextResponse.json({ eventLog: liveSim.eventLog, world: liveSim.world, mode: liveSim.getMode() });
  } else {
    // Playback mode: pre-generated events
    try {
      const eventLogPath = path.join(process.cwd(), 'server', 'eventlog.json');
      const worldPath = path.join(process.cwd(), 'server', 'world.json');
      const eventLog = JSON.parse(readFileSync(eventLogPath, 'utf-8'));
      const world = JSON.parse(readFileSync(worldPath, 'utf-8'));
      // Optionally support ?ticks=N to return only first N events
      if (tickCount) {
        const n = parseInt(tickCount, 10);
        return NextResponse.json({ eventLog: eventLog.slice(0, n), world });
      }
      return NextResponse.json({ eventLog, world });
    } catch (e) {
      return NextResponse.json({ eventLog: [], world: null });
    }
  }
}

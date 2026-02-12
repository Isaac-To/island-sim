import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import path from 'path';

export async function GET() {
  // Load the latest event log and world snapshot from the server directory
  // For demo, just load a static JSON file (replace with real logic)
  try {
    const eventLogPath = path.join(process.cwd(), 'server', 'eventlog.json');
    const worldPath = path.join(process.cwd(), 'server', 'world.json');
    const eventLog = JSON.parse(readFileSync(eventLogPath, 'utf-8'));
    const world = JSON.parse(readFileSync(worldPath, 'utf-8'));
    return NextResponse.json({ eventLog, world });
  } catch (e) {
    return NextResponse.json({ eventLog: [], world: null });
  }
}

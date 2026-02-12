import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

export async function POST(req: NextRequest) {
  try {
    const { action, eventId, tick } = await req.json();

    const serverDir = join(process.cwd(), 'server');
    const eventLogPath = join(serverDir, 'eventlog.json');

    let eventLog = [];
    let worldSnapshotsDir = join(serverDir, 'snapshots');

    try {
      const eventLogData = readFileSync(eventLogPath, 'utf-8');
      eventLog = JSON.parse(eventLogData);
    } catch (e) {
      console.error('Failed to read event log:', e);
      return NextResponse.json(
        { error: 'Failed to read event log' },
        { status: 500 }
      );
    }

    switch (action) {
      case 'jump': {
        if (!eventId) {
          return NextResponse.json(
            { error: 'eventId required for jump action' },
            { status: 400 }
          );
        }

        // Find event in log
        const eventIndex = eventLog.findIndex((e: any) => e.id === eventId);
        if (eventIndex === -1) {
          return NextResponse.json(
            { error: 'Event not found' },
            { status: 404 }
          );
        }

        // Try to load snapshot for this event
        const snapshotPath = join(worldSnapshotsDir, `${eventId}.json`);
        if (!existsSync(snapshotPath)) {
          return NextResponse.json(
            { error: 'Snapshot not found for this event' },
            { status: 404 }
          );
        }

        const snapshotData = readFileSync(snapshotPath, 'utf-8');
        const world = JSON.parse(snapshotData);

        // Write world state for playback
        const worldPath = join(serverDir, 'world.json');
        writeFileSync(worldPath, JSON.stringify(world, null, 2));

        return NextResponse.json({
          success: true,
          world,
          currentEventIndex: eventIndex,
        });
      }

      case 'branch': {
        if (!eventId) {
          return NextResponse.json(
            { error: 'eventId required for branch action' },
            { status: 400 }
          );
        }

        const eventIndex = eventLog.findIndex((e: any) => e.id === eventId);
        if (eventIndex === -1) {
          return NextResponse.json(
            { error: 'Event not found' },
            { status: 404 }
          );
        }

        // Truncate event log to branch point
        const truncatedLog = eventLog.slice(0, eventIndex + 1);

        // Load snapshot at branch point
        const snapshotPath = join(worldSnapshotsDir, `${eventId}.json`);
        if (!existsSync(snapshotPath)) {
          return NextResponse.json(
            { error: 'Snapshot not found for this event' },
            { status: 404 }
          );
        }

        const snapshotData = readFileSync(snapshotPath, 'utf-8');
        const world = JSON.parse(snapshotData);

        // Write truncated log and world
        writeFileSync(eventLogPath, JSON.stringify(truncatedLog, null, 2));

        const worldPath = join(serverDir, 'world.json');
        writeFileSync(worldPath, JSON.stringify(world, null, 2));

        return NextResponse.json({
          success: true,
          world,
          eventLog: truncatedLog,
          currentEventIndex: truncatedLog.length - 1,
        });
      }

      case 'step': {
        // Step to specific tick or next event
        const targetTick = tick !== undefined ? tick : null;

        // Find event at or after target tick
        let targetEvent = null;
        let targetIndex = -1;

        if (targetTick !== null) {
          targetIndex = eventLog.findIndex((e: any) => e.tick >= targetTick);
          if (targetIndex !== -1) {
            targetEvent = eventLog[targetIndex];
          }
        }

        if (!targetEvent || targetIndex === -1) {
          return NextResponse.json(
            { error: 'No event found at specified tick' },
            { status: 404 }
          );
        }

        // Load snapshot
        const snapshotPath = join(worldSnapshotsDir, `${targetEvent.id}.json`);
        if (!existsSync(snapshotPath)) {
          return NextResponse.json(
            { error: 'Snapshot not found' },
            { status: 404 }
          );
        }

        const snapshotData = readFileSync(snapshotPath, 'utf-8');
        const world = JSON.parse(snapshotData);

        const worldPath = join(serverDir, 'world.json');
        writeFileSync(worldPath, JSON.stringify(world, null, 2));

        return NextResponse.json({
          success: true,
          world,
          currentEventIndex: targetIndex,
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error processing playback request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve current playback state
export async function GET() {
  try {
    const serverDir = join(process.cwd(), 'server');
    const eventLogPath = join(serverDir, 'eventlog.json');
    const worldPath = join(serverDir, 'world.json');

    let eventLog = [];
    let world = null;

    try {
      const eventLogData = readFileSync(eventLogPath, 'utf-8');
      eventLog = JSON.parse(eventLogData);
    } catch (e) {
      // File might not exist yet
    }

    try {
      const worldData = readFileSync(worldPath, 'utf-8');
      world = JSON.parse(worldData);
    } catch (e) {
      // File might not exist yet
    }

    return NextResponse.json({
      eventLog,
      world,
      currentEventIndex: eventLog.length - 1,
    });
  } catch (error) {
    console.error('Error retrieving playback state:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

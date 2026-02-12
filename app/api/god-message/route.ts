import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

export async function POST(req: NextRequest) {
  try {
    const { message, targetAgentIds } = await req.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Invalid message' },
        { status: 400 }
      );
    }

    // Read current simulation state
    const serverDir = join(process.cwd(), 'server');
    const eventLogPath = join(serverDir, 'eventlog.json');
    const worldPath = join(serverDir, 'world.json');

    let eventLog = [];
    let world = null;

    try {
      const eventLogData = readFileSync(eventLogPath, 'utf-8');
      eventLog = JSON.parse(eventLogData);

      const worldData = readFileSync(worldPath, 'utf-8');
      world = JSON.parse(worldData);
    } catch (e) {
      console.error('Failed to read simulation state:', e);
      return NextResponse.json(
        { error: 'Failed to read simulation state' },
        { status: 500 }
      );
    }

    if (!world) {
      return NextResponse.json(
        { error: 'No simulation state found' },
        { status: 404 }
      );
    }

    // Determine recipients
    const recipients = targetAgentIds && targetAgentIds.length > 0
      ? world.agents.filter((a: any) => targetAgentIds.includes(a.id) && a.alive)
      : world.agents.filter((a: any) => a.alive);

    // Add message to each recipient's memory
    for (const agent of recipients) {
      if (agent.memory) {
        agent.memory.push({
          tick: world.time,
          eventId: `godmsg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          description: `[GOD] ${message}`,
        });
      }
    }

    // Log the event
    const godEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      type: 'god_message',
      tick: world.time,
      agentsInvolved: recipients.map((a: any) => a.id),
      details: { message },
      parentEventId: eventLog.length > 0 ? eventLog[eventLog.length - 1].id : undefined,
    };

    eventLog.push(godEvent);

    // Write updated state back
    writeFileSync(eventLogPath, JSON.stringify(eventLog, null, 2));
    writeFileSync(worldPath, JSON.stringify(world, null, 2));

    return NextResponse.json({
      success: true,
      event: godEvent,
      recipientsCount: recipients.length,
    });
  } catch (error) {
    console.error('Error processing GOD message:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

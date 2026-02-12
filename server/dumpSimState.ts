// This script should be run by the simulation to dump the latest world and event log to disk for the UI
import { Simulation } from './simulation';
import { writeFileSync } from 'fs';

export function dumpSimState(sim: Simulation) {
  writeFileSync('server/eventlog.json', JSON.stringify(sim.eventLog, null, 2));
  writeFileSync('server/world.json', JSON.stringify(sim.world, null, 2));
}

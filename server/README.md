# Island Survival Simulator – Server

This directory contains the research-grade simulation engine for the Island Survival Simulator.

## Structure
- `types.ts`: Core TypeScript types and interfaces for agents, world, events, etc.
- `simulation.ts`: Main simulation tick system and event log logic.
- `__tests__/`: Unit and integration tests (Jest).

## Running Tests

```
npm install --save-dev jest ts-jest @types/jest
npx jest
```

## Design Principles
- All logic is server-side; client is visualization only.
- All state changes are fully traceable and replayable.
- Follows best programming practices and is fully documented.
- Extensible for research and experimentation.

// Unit tests for agent system
import { createAgent, tickAgent, addMemory, updateRelationship } from '../agent';

describe('Agent System', () => {
  it('should create an agent with defaults', () => {
    const agent = createAgent();
    expect(agent.id).toMatch(/^agent_/);
    expect(agent.status).toBe('child');
    expect(agent.alive).toBe(true);
    expect(agent.inventory).toHaveProperty('wood');
  });

  it('should transition from child to adult', () => {
    let agent = createAgent({ age: 0, status: 'child' });
    agent = tickAgent(agent, 2, 10);
    expect(agent.status).toBe('child');
    agent = tickAgent(agent, 2, 10);
    expect(agent.status).toBe('adult');
  });

  it('should add memory entries', () => {
    let agent = createAgent();
    agent = addMemory(agent, { tick: 1, eventId: 'e1', description: 'Test event' });
    expect(agent.memory.length).toBe(1);
    expect(agent.memory[0].description).toBe('Test event');
  });

  it('should update relationships', () => {
    let agent = createAgent();
    agent = updateRelationship(agent, { agentId: 'a2', type: 'trust', value: 10 });
    expect(agent.relationships.length).toBe(1);
    expect(agent.relationships[0].type).toBe('trust');
  });
});

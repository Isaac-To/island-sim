// Unit tests for agent system
import { createAgent, tickAgent, addMemory, updateRelationship, generatePersonality, getPersonalityDescription, generateRelationshipNote } from '../agent';

describe('Agent System', () => {
  it('should create an agent with defaults', () => {
    const agent = createAgent();
    expect(agent.id).toMatch(/^agent_/);
    expect(agent.status).toBe('child');
    expect(agent.alive).toBe(true);
    expect(agent.inventory).toHaveProperty('wood');
    expect(agent.personality).toBeDefined();
    expect(agent.personality.openness).toBeGreaterThanOrEqual(0);
    expect(agent.personality.openness).toBeLessThanOrEqual(100);
  });

  it('should transition from child to adult', () => {
    const mockRandom = () => 0.5;
    let agent = createAgent({ age: 0, status: 'child' }, mockRandom);
    agent = tickAgent(agent, 2, 10, mockRandom);
    expect(agent.status).toBe('child');
    agent = tickAgent(agent, 2, 10, mockRandom);
    expect(agent.status).toBe('adult');
  });

  it('should add memory entries', () => {
    let agent = createAgent();
    agent = addMemory(agent, { tick: 1, eventId: 'e1', description: 'Test event' });
    expect(agent.memory.length).toBe(1);
    expect(agent.memory[0].description).toBe('Test event');
  });

  it('should add memory entries with category and importance', () => {
    let agent = createAgent();
    agent = addMemory(agent, { 
      tick: 1, 
      eventId: 'e1', 
      description: 'Test event',
      category: 'interaction',
      importance: 8
    });
    expect(agent.memory.length).toBe(1);
    expect(agent.memory[0].category).toBe('interaction');
    expect(agent.memory[0].importance).toBe(8);
  });

  it('should update relationships', () => {
    let agent = createAgent();
    agent = updateRelationship(agent, { agentId: 'a2', type: 'trust', value: 10 });
    expect(agent.relationships.length).toBe(1);
    expect(agent.relationships[0].type).toBe('trust');
  });

  it('should update relationships with notes', () => {
    let agent = createAgent();
    agent = updateRelationship(agent, { 
      agentId: 'a2', 
      type: 'trust', 
      value: 10,
      notes: 'TestAgent is reliable'
    });
    expect(agent.relationships.length).toBe(1);
    expect(agent.relationships[0].notes).toBe('TestAgent is reliable');
  });

  it('should generate personality traits', () => {
    const mockRandom = () => 0.75;
    const personality = generatePersonality(mockRandom);
    expect(personality.openness).toBe(75);
    expect(personality.conscientiousness).toBe(75);
    expect(personality.extraversion).toBe(75);
    expect(personality.agreeableness).toBe(75);
    expect(personality.neuroticism).toBe(75);
  });

  it('should generate personality description', () => {
    const personality = {
      openness: 80,
      conscientiousness: 75,
      extraversion: 25,
      agreeableness: 80,
      neuroticism: 20,
    };
    const description = getPersonalityDescription(personality);
    expect(description).toContain('adventurous');
    expect(description).toContain('organized');
    expect(description).toContain('reserved');
    expect(description).toContain('cooperative');
    expect(description).toContain('calm');
  });

  it('should generate relationship notes', () => {
    const note = generateRelationshipNote('Alice', 'trust', 25);
    expect(note).toContain('Alice');
    expect(note).toContain('trustworthy');
  });
});

/**
 * Conversation Manager
 * Handles multi-round conversations between agents within a single tick
 */

import { World, Agent, ID, ActiveConversation, ChatMessage, MemoryEntry } from './types';
import { handleCommunicate, CommunicateToolCall } from './tools';
import { LLMClient } from './llm';

const MAX_ROUNDS = 5;
const CONVERSATION_TIMEOUT = 10; // ticks before inactive conversation is cleaned up

/**
 * Manages active conversations during a tick
 */
export class ConversationManager {
  private conversations: ActiveConversation[] = [];

  /**
   * Get all active conversations
   */
  getActiveConversations(): ActiveConversation[] {
    return this.conversations;
  }

  /**
   * Find an existing conversation between agents
   */
  findConversation(agentIds: ID[]): ActiveConversation | undefined {
    return this.conversations.find(conv => {
      // Check if all agents are participants in this conversation
      return conv.participants.length === agentIds.length &&
        agentIds.every(id => conv.participants.includes(id));
    });
  }

  /**
   * Create a new conversation between agents
   */
  createConversation(
    conversationId: string,
    participants: ID[],
    initialMessage: ChatMessage,
    currentTick: number
  ): ActiveConversation {
    const conversation: ActiveConversation = {
      conversationId,
      participants,
      messages: [initialMessage],
      currentRound: 1,
      maxRounds: MAX_ROUNDS,
      startTick: currentTick,
    };

    this.conversations.push(conversation);
    return conversation;
  }

  /**
   * Add a message to an existing conversation
   */
  addMessageToConversation(conversationId: string, message: ChatMessage): boolean {
    const conversation = this.conversations.find(c => c.conversationId === conversationId);
    if (!conversation) return false;

    conversation.messages.push(message);

    // Increment round if message is from a different participant than the last message
    if (conversation.messages.length > 1) {
      const lastSender = conversation.messages[conversation.messages.length - 2].senderId;
      const currentSender = message.senderId;

      if (lastSender !== currentSender) {
        conversation.currentRound++;
      }
    }

    return true;
  }

  /**
   * Check if a conversation can continue
   */
  canContinue(conversationId: string): boolean {
    const conversation = this.conversations.find(c => c.conversationId === conversationId);
    if (!conversation) return false;

    return conversation.currentRound < conversation.maxRounds;
  }

  /**
   * Get conversation by ID
   */
  getConversation(conversationId: string): ActiveConversation | undefined {
    return this.conversations.find(c => c.conversationId === conversationId);
  }

  /**
   * Get agents involved in a conversation
   */
  getConversationParticipants(conversationId: string): ID[] {
    const conversation = this.conversations.find(c => c.conversationId === conversationId);
    return conversation?.participants || [];
  }

  /**
   * Clean up old conversations
   */
  cleanupOldConversations(currentTick: number) {
    this.conversations = this.conversations.filter(conv => {
      const age = currentTick - conv.startTick;
      return age < CONVERSATION_TIMEOUT;
    });
  }

  /**
   * Process a communication action and potentially start or continue a conversation
   */
  async processCommunication(
    world: World,
    sender: Agent,
    recipients: ID[],
    message: string,
    llmClient: any
  ): Promise<World> {
    // Create the chat message
    const chatMessage: ChatMessage = {
      tick: world.time,
      senderId: sender.id,
      senderName: sender.name,
      message,
      participants: [sender.id, ...recipients],
    };

    // Check if there's an existing conversation
    const participantIds = [sender.id, ...recipients];
    let existingConv = this.findConversation(participantIds);

    if (existingConv) {
      // Add to existing conversation
      this.addMessageToConversation(existingConv.conversationId, chatMessage);

      // Update conversation history for all participants
      const communicateCall: CommunicateToolCall = {
        agentId: sender.id,
        message,
        recipients,
      };
      world = handleCommunicate(world, communicateCall);

      // If conversation can continue, trigger responses from recipients
      if (this.canContinue(existingConv.conversationId)) {
        world = await this.continueConversation(world, existingConv, llmClient);
      }

      return world;
    } else {
      // Start a new conversation
      const conversationId = `conv_${world.time}_${sender.id}_${recipients[0]}`;
      const newConv = this.createConversation(
        conversationId,
        participantIds,
        chatMessage,
        world.time
      );

      // Update conversation history for all participants
      const communicateCall: CommunicateToolCall = {
        agentId: sender.id,
        message,
        recipients,
      };
      world = handleCommunicate(world, communicateCall);

      // Trigger responses from recipients (up to 5 rounds)
      world = await this.continueConversation(world, newConv, llmClient);

      return world;
    }
  }

  /**
   * Continue a conversation by having recipients respond
   */
  private async continueConversation(
    world: World,
    conversation: ActiveConversation,
    llmClient: any
  ): Promise<World> {
    const participants = conversation.participants;
    const lastMessage = conversation.messages[conversation.messages.length - 1];
    const lastSenderId = lastMessage.senderId;

    // Get the other participants who should respond
    const otherParticipants = participants.filter(id => id !== lastSenderId);

    for (const participantId of otherParticipants) {
      // Check if we've reached the max rounds
      if (conversation.currentRound >= conversation.maxRounds) {
        break;
      }

      const agent = world.agents.find(a => a.id === participantId);
      if (!agent || !agent.alive) continue;

      // Check if agent is still in proximity to the conversation participants
      const inProximity = this.checkConversationProximity(agent, participants, world);
      if (!inProximity) continue;

      // Get LLM response for this agent
      // For now, we'll let the normal tick process handle this
      // The agent will be prompted with conversation context in the next call
      break; // Only get one response per round to maintain order
    }

    return world;
  }

  /**
   * Check if an agent is in proximity to all conversation participants
   */
  private checkConversationProximity(
    agent: Agent,
    participantIds: ID[],
    world: World
  ): boolean {
    const participants = world.agents.filter(a => participantIds.includes(a.id));

    for (const participant of participants) {
      if (participant.id === agent.id) continue;

      const dist = Math.abs(participant.location.x - agent.location.x) +
        Math.abs(participant.location.y - agent.location.y);

      if (dist > agent.visibilityRadius) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get conversation context for an agent
   * Returns recent messages and current round info
   */
  getConversationContextForAgent(agentId: ID): {
    conversations: Array<{
      conversationId: string;
      participants: ID[];
      currentRound: number;
      maxRounds: number;
      recentMessages: ChatMessage[];
    }>;
  } {
    const agentConversations = this.conversations
      .filter(conv => conv.participants.includes(agentId))
      .map(conv => ({
        conversationId: conv.conversationId,
        participants: conv.participants,
        currentRound: conv.currentRound,
        maxRounds: conv.maxRounds,
        recentMessages: conv.messages.slice(-10), // Last 10 messages
      }));

    return { conversations: agentConversations };
  }

  /**
   * Reset conversations at the start of a new tick
   * This is called to clear completed conversations from the previous tick
   */
  resetTickConversations() {
    // Keep conversations that haven't reached max rounds and are still active
    this.conversations = this.conversations.filter(conv =>
      conv.currentRound < conv.maxRounds
    );
  }

  /**
   * Summarize a completed conversation and add to participants' memories
   */
  async summarizeAndStoreConversation(
    world: World,
    conversation: ActiveConversation,
    llmClient: LLMClient
  ): Promise<World> {
    // Only summarize if the conversation is complete (reached max rounds)
    if (conversation.currentRound < conversation.maxRounds) {
      return world;
    }

    // Create a summary of the conversation
    const summary = await this.generateConversationSummary(conversation, llmClient);

    // Add the summary to each participant's memory
    for (const participantId of conversation.participants) {
      const agent = world.agents.find(a => a.id === participantId);
      if (!agent) continue;

      const memory: MemoryEntry = {
        tick: world.time,
        eventId: `conv_summary_${conversation.conversationId}`,
        description: `[CONVERSATION] ${summary}`,
        category: 'interaction',
        importance: 6, // Slightly higher importance for completed conversations
        participants: conversation.participants.filter(p => p !== participantId),
      };

      // Add memory
      const agentIndex = world.agents.findIndex(a => a.id === participantId);
      if (agentIndex >= 0) {
        world.agents[agentIndex] = {
          ...world.agents[agentIndex],
          memory: [...world.agents[agentIndex].memory, memory],
        };
      }
    }

    return world;
  }

  /**
   * Generate a summary of a conversation using the LLM
   */
  private async generateConversationSummary(
    conversation: ActiveConversation,
    llmClient: LLMClient
  ): Promise<string> {
    // Create a prompt for summarizing the conversation
    const messages = conversation.messages.map(m =>
      `${m.senderName}: ${m.message}`
    ).join('\n');

    const prompt = `Summarize the following conversation between ${conversation.participants.length} agents in one concise sentence (max 100 characters):

Conversation:
${messages}

Summary:`;

    try {
      // This would need to be implemented in LLMClient
      // For now, return a simple summary
      const participantNames = conversation.messages.map(m => m.senderName);
      const uniqueNames = [...new Set(participantNames)].join(', ');

      if (conversation.messages.length === 1) {
        return `${uniqueNames} had a brief conversation.`;
      }

      return `${uniqueNames} had a ${conversation.currentRound}-round conversation with ${conversation.messages.length} messages.`;
    } catch (error) {
      console.error('Error generating conversation summary:', error);
      return `Conversation between agents with ${conversation.messages.length} messages.`;
    }
  }
}

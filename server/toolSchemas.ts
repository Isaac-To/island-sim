// Tool schema definitions for OpenAI function calling
// Converts tool definitions to OpenAI-compatible format
// Research-grade, fully documented

/**
 * Tool schema interface for OpenAI function calling
 */
interface Tool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: any;
  };
}

/**
 * Get tool schemas filtered by agent status
 * Children only get move and communicate tools
 * Adults get all tools
 */
export function getToolSchemas(agentStatus: 'child' | 'adult' | 'elder' | 'dead'): Tool[] {
  const isChild = agentStatus === 'child';

  const baseTools: Tool[] = [
    {
      type: 'function',
      function: {
        name: 'move',
        description: 'Move to a nearby tile within movement range. Cannot move into water.',
        parameters: {
          type: 'object',
          properties: {
            agentId: {
              type: 'string',
              description: 'Your unique agent ID'
            },
            to: {
              type: 'object',
              properties: {
                x: { type: 'number', description: 'Target X coordinate' },
                y: { type: 'number', description: 'Target Y coordinate' }
              },
              required: ['x', 'y']
            }
          },
          required: ['agentId', 'to']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'communicate',
        description: 'Send a message to another agent within visibility radius. Messages are logged in memory and affect relationships.',
        parameters: {
          type: 'object',
          properties: {
            agentId: {
              type: 'string',
              description: 'Your unique agent ID'
            },
            message: {
              type: 'string',
              description: 'The message to send (max 200 characters)'
            },
            recipients: {
              type: 'array',
              items: { type: 'string' },
              description: 'Array of agent IDs to send the message to. Must be agents within your visibility radius.'
            }
          },
          required: ['agentId', 'message', 'recipients']
        }
      }
    },
  ];

  // Adults get additional tools
  if (!isChild) {
    baseTools.push(
      {
        type: 'function',
        function: {
          name: 'heal',
          description: 'Heal yourself or another agent within visibility radius. Restores happiness or health if injured or unhappy.',
          parameters: {
            type: 'object',
            properties: {
              agentId: {
                type: 'string',
                description: 'Your unique agent ID'
              },
              targetAgentId: {
                type: 'string',
                description: 'ID of agent to heal (can be yourself or another agent within visibility radius)'
              },
              amount: {
                type: 'number',
                description: 'Amount of healing to apply (1-10)'
              }
            },
            required: ['agentId', 'targetAgentId', 'amount']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'gather',
          description: 'Gather a resource (wood, stone, water, food) from the current tile. Requires resource to be present at your location.',
          parameters: {
            type: 'object',
            properties: {
              agentId: {
                type: 'string',
                description: 'Your unique agent ID'
              },
              resource: {
                type: 'string',
                enum: ['wood', 'stone', 'water', 'food'],
                description: 'The type of resource to gather'
              },
              location: {
                type: 'object',
                properties: {
                  x: { type: 'number', description: 'X coordinate of tile to gather from' },
                  y: { type: 'number', description: 'Y coordinate of tile to gather from' }
                },
                required: ['x', 'y']
              }
            },
            required: ['agentId', 'resource', 'location']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'craft',
          description: 'Craft an item using available resources in inventory. Recipes: wooden_tool (2 wood), stone_tool (2 stone + 1 wood), wooden_pickaxe (5 wood + 1 tool), stone_pickaxe (5 stone + 3 wood + 1 tool).',
          parameters: {
            type: 'object',
            properties: {
              agentId: {
                type: 'string',
                description: 'Your unique agent ID'
              },
              recipe: {
                type: 'string',
                enum: ['wooden_tool', 'stone_tool', 'wooden_pickaxe', 'stone_pickaxe'],
                description: 'The recipe to craft'
              }
            },
            required: ['agentId', 'recipe']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'build',
          description: 'Build a structure at a location. Recipes: shelter (10 wood + 5 stone), fence (3 wood), workbench (5 wood + 2 stone), storage (8 wood).',
          parameters: {
            type: 'object',
            properties: {
              agentId: {
                type: 'string',
                description: 'Your unique agent ID'
              },
              structureType: {
                type: 'string',
                enum: ['shelter', 'fence', 'workbench', 'storage'],
                description: 'The type of structure to build'
              },
              location: {
                type: 'object',
                properties: {
                  x: { type: 'number', description: 'X coordinate to build at' },
                  y: { type: 'number', description: 'Y coordinate to build at' }
                },
                required: ['x', 'y']
              }
            },
            required: ['agentId', 'structureType', 'location']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'create_crop_field',
          description: 'Create a crop field on grass terrain. Crops take time to grow and must be watered to harvest.',
          parameters: {
            type: 'object',
            properties: {
              agentId: {
                type: 'string',
                description: 'Your unique agent ID'
              },
              location: {
                type: 'object',
                properties: {
                  x: { type: 'number', description: 'X coordinate for field' },
                  y: { type: 'number', description: 'Y coordinate for field' }
                },
                required: ['x', 'y']
              }
            },
            required: ['agentId', 'location']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'harvest_crop',
          description: 'Harvest a mature crop field. Requires the crop to be fully grown and sufficiently watered.',
          parameters: {
            type: 'object',
            properties: {
              agentId: {
                type: 'string',
                description: 'Your unique agent ID'
              },
              location: {
                type: 'object',
                properties: {
                  x: { type: 'number', description: 'X coordinate of crop field' },
                  y: { type: 'number', description: 'Y coordinate of crop field' }
                },
                required: ['x', 'y']
              }
            },
            required: ['agentId', 'location']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'give_resource',
          description: 'Give resources to another agent within visibility radius. Affects relationships and happiness.',
          parameters: {
            type: 'object',
            properties: {
              fromAgentId: {
                type: 'string',
                description: 'Your unique agent ID'
              },
              toAgentId: {
                type: 'string',
                description: 'ID of agent to give resources to'
              },
              resource: {
                type: 'string',
                enum: ['wood', 'stone', 'water', 'food', 'tools'],
                description: 'Type of resource to give'
              },
              amount: {
                type: 'number',
                description: 'Amount of resource to give (must be positive integer)'
              }
            },
            required: ['fromAgentId', 'toAgentId', 'resource', 'amount']
          }
        }
      }
    );
  }

  return baseTools;
}

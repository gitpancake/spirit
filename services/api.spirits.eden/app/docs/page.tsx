'use client';

import { useState } from 'react';

interface Endpoint {
  id: string;
  name: string;
  method: string;
  path: string;
  description: string;
  parameters?: Array<{
    name: string;
    type: string;
    required: boolean;
    description: string;
    example?: string;
  }>;
  requestBody?: {
    required: boolean;
    schema: object;
    example: object;
  };
  responses: {
    [key: string]: {
      description: string;
      example: object;
    };
  };
}

const endpoints: Endpoint[] = [
  // =====================================================
  // SPIRIT REGISTRY ENDPOINTS
  // =====================================================
  {
    id: 'spirits-apply',
    name: 'Submit Spirit Application',
    method: 'POST',
    path: '/api/spirits/apply',
    description: 'Submit a new Spirit Registry application for NFT minting on Ethereum',
    requestBody: {
      required: true,
      schema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Spirit name' },
          handle: { type: 'string', description: 'Unique handle' },
          role: { type: 'string', description: 'Spirit role' },
          public_persona: { type: 'string', description: 'Public description' },
          artist_wallet: { type: 'string', description: 'Artist wallet address' }
        },
        required: ['name', 'handle', 'role', 'public_persona', 'artist_wallet']
      },
      example: {
        name: 'Artemis Spirit',
        handle: 'artemis_spirit',
        role: 'Digital Artist',
        public_persona: 'AI spirit specializing in generative art',
        artist_wallet: '0x1234567890123456789012345678901234567890'
      }
    },
    responses: {
      '200': {
        description: 'Spirit application submitted successfully',
        example: {
          success: true,
          taskId: 'task_abc123',
          message: 'Spirit application submitted successfully'
        }
      }
    }
  },
  {
    id: 'agents-list',
    name: 'List Agents (Paginated)',
    method: 'GET',
    path: '/api/spirits',
    description: 'Get paginated list of registered agents from fast cache layer',
    parameters: [
      {
        name: 'page',
        type: 'number',
        required: false,
        description: 'Page number (default: 1)',
        example: '1'
      },
      {
        name: 'limit',
        type: 'number',
        required: false,
        description: 'Items per page (max: 50, default: 20)',
        example: '20'
      },
      {
        name: 'contract',
        type: 'string',
        required: false,
        description: 'Contract address (default: 0x48471D8A5612D0085cAafb3f5A13Ed2D38038Ac1)',
        example: '0x48471D8A5612D0085cAafb3f5A13Ed2D38038Ac1'
      }
    ],
    responses: {
      '200': {
        description: 'Paginated list of agents',
        example: {
          success: true,
          data: [
            {
              id: '0',
              tokenId: '0',
              owner: '0x742d35Cc6634C0532925a3b8d5c01f1e5eeb5b2C',
              metadataURI: 'ipfs://bafkreifoyp5tp46issu2ohzko2dva3wqowz2fel5idecwzgvabci5vpuxm',
              metadata: {
                name: 'Artemis Spirit',
                description: 'AI spirit specializing in generative art',
                image: 'ipfs://QmHash...'
              },
              imageUrl: 'https://fuchsia-rich-lungfish-648.mypinata.cloud/ipfs/QmHash...',
              contractAddress: '0x48471D8A5612D0085cAafb3f5A13Ed2D38038Ac1',
              chainId: 11155111,
              lastUpdated: '2024-08-28T10:30:00.000Z',
              blockNumber: '12345678',
              transactionHash: '0xabc123...',
              trainers: []
            }
          ],
          pagination: {
            currentPage: 1,
            totalPages: 5,
            totalItems: 100,
            itemsPerPage: 20,
            hasNextPage: true,
            hasPreviousPage: false
          },
          source: 'simple-cache',
          contractAddress: '0x48471D8A5612D0085cAafb3f5A13Ed2D38038Ac1'
        }
      }
    }
  },
  {
    id: 'agents-by-token',
    name: 'Get Agent by Token ID',
    method: 'GET',
    path: '/api/spirits/{agentId}',
    description: 'Get detailed information about a specific agent by token ID from fast cache layer',
    parameters: [
      {
        name: 'agentId',
        type: 'string',
        required: true,
        description: 'NFT token ID of the agent',
        example: '0'
      },
      {
        name: 'contract',
        type: 'string',
        required: false,
        description: 'Contract address (default: 0x48471D8A5612D0085cAafb3f5A13Ed2D38038Ac1)',
        example: '0x48471D8A5612D0085cAafb3f5A13Ed2D38038Ac1'
      }
    ],
    responses: {
      '200': {
        description: 'Agent details',
        example: {
          success: true,
          data: {
            id: '0',
            tokenId: '0',
            owner: '0x742d35Cc6634C0532925a3b8d5c01f1e5eeb5b2C',
            metadataURI: 'ipfs://bafkreifoyp5tp46issu2ohzko2dva3wqowz2fel5idecwzgvabci5vpuxm',
            metadata: {
              name: 'Artemis Spirit',
              description: 'AI spirit specializing in generative art',
              image: 'ipfs://QmHash...'
            },
            imageUrl: 'https://fuchsia-rich-lungfish-648.mypinata.cloud/ipfs/QmHash...',
            contractAddress: '0x48471D8A5612D0085cAafb3f5A13Ed2D38038Ac1',
            chainId: 11155111,
            lastUpdated: '2024-08-28T10:30:00.000Z',
            blockNumber: '12345678',
            transactionHash: '0xabc123...',
            trainers: []
          },
          source: 'simple-cache',
          contractAddress: '0x48471D8A5612D0085cAafb3f5A13Ed2D38038Ac1'
        }
      },
      '404': {
        description: 'Agent not found',
        example: {
          success: false,
          error: 'Agent not found',
          tokenId: '999',
          contractAddress: '0x48471D8A5612D0085cAafb3f5A13Ed2D38038Ac1'
        }
      }
    }
  },
  {
    id: 'spirits-contract-state',
    name: 'Get Contract State',
    method: 'GET',
    path: '/api/spirits/contract-state',
    description: 'Get current state of the Spirit Registry contract',
    responses: {
      '200': {
        description: 'Contract state information',
        example: {
          success: true,
          data: {
            currentTokenId: '125',
            totalTokensIssued: '125',
            name: 'Spirit Registry',
            symbol: 'SPIRIT',
            owner: '0x1234...',
            registeredAgentsCount: 125
          }
        }
      }
    }
  },

  // =====================================================
  // EDEN API ENDPOINTS
  // =====================================================
  {
    id: 'eden-sessions-create',
    name: 'Create Eden Session',
    method: 'POST',
    path: '/api/eden/sessions/create',
    description: 'Create a new chat session with an Eden AI agent',
    requestBody: {
      required: true,
      schema: {
        type: 'object',
        properties: {
          agentId: { type: 'string', description: 'Eden agent ID' },
          config: { type: 'object', description: 'Optional session configuration' }
        },
        required: ['agentId']
      },
      example: {
        agentId: 'agent_123',
        config: { stream: true }
      }
    },
    responses: {
      '200': {
        description: 'Session created successfully',
        example: {
          success: true,
          data: {
            sessionId: 'session_abc123',
            data: {
              _id: 'session_abc123',
              agentId: 'agent_123',
              messages: [],
              createdAt: '2024-01-01T00:00:00.000Z'
            }
          }
        }
      }
    }
  },
  {
    id: 'eden-sessions-get',
    name: 'Get Eden Session',
    method: 'GET',
    path: '/api/eden/sessions/{sessionId}',
    description: 'Get session details and message history',
    parameters: [
      {
        name: 'sessionId',
        type: 'string',
        required: true,
        description: 'Session ID from session creation',
        example: 'session_abc123'
      }
    ],
    responses: {
      '200': {
        description: 'Session details and messages',
        example: {
          success: true,
          data: {
            _id: 'session_abc123',
            agentId: 'agent_123',
            messages: [
              {
                _id: 'msg_1',
                role: 'user',
                content: 'Hello!',
                createdAt: '2024-01-01T00:00:00.000Z'
              }
            ]
          }
        }
      }
    }
  },
  {
    id: 'eden-sessions-send',
    name: 'Send Message to Session',
    method: 'POST',
    path: '/api/eden/sessions',
    description: 'Send a message to an existing Eden chat session',
    requestBody: {
      required: true,
      schema: {
        type: 'object',
        properties: {
          sessionId: { type: 'string', description: 'Session ID' },
          message: { type: 'string', description: 'Message to send' }
        },
        required: ['sessionId', 'message']
      },
      example: {
        sessionId: 'session_abc123',
        message: 'Hello, how are you?'
      }
    },
    responses: {
      '200': {
        description: 'Message sent and response received',
        example: {
          success: true,
          data: {
            _id: 'msg_2',
            sessionId: 'session_abc123',
            role: 'assistant',
            content: 'Hello! I\'m doing well, thank you for asking.',
            createdAt: '2024-01-01T00:01:00.000Z'
          }
        }
      }
    }
  },
  {
    id: 'eden-agents-creations',
    name: 'Get Agent Creations',
    method: 'GET',
    path: '/api/eden/agents/{id}/creations',
    description: 'Get creations by specific Eden agent with pagination',
    parameters: [
      {
        name: 'id',
        type: 'string',
        required: true,
        description: 'Eden agent ID',
        example: 'agent_456'
      },
      {
        name: 'limit',
        type: 'number',
        required: false,
        description: 'Number of items per page (1-100, default: 50)',
        example: '20'
      },
      {
        name: 'cursor',
        type: 'string',
        required: false,
        description: 'Cursor for pagination to get next set of results',
        example: 'eyJjcmVhdGVkQXQiOiIyMDI0LTA...'
      }
    ],
    responses: {
      '200': {
        description: 'Agent creations with pagination',
        example: {
          success: true,
          data: {
            docs: [
              {
                _id: 'creation_789',
                name: 'Agent Artwork',
                url: 'https://creation-url.com/art.jpg',
                agent: {
                  _id: 'agent_456',
                  name: 'Artist Agent',
                  username: 'artist_bot'
                },
                likeCount: 15,
                public: true
              }
            ],
            totalDocs: 8,
            nextCursor: 'eyJjcmVhdGVkQXQiOiIyMDI0LTA4LTI4VDEwOjMwOjAwLjAwMFoiLCJfaWQiOiJjcmVhdGlvbl83ODkifQ=='
          }
        }
      }
    }
  },
  {
    id: 'eden-agents-create',
    name: 'Create Eden Agent',
    method: 'POST',
    path: '/api/eden/agents',
    description: 'Create a new Eden AI agent with custom configuration',
    requestBody: {
      required: true,
      schema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Agent name' },
          key: { type: 'string', description: 'Unique agent key/identifier' },
          description: { type: 'string', description: 'Agent description' },
          image: { type: 'string', description: 'Agent avatar image URL' },
          models: { 
            type: 'array', 
            description: 'Optional array of model configurations',
            items: {
              type: 'object',
              properties: {
                lora: { type: 'string', description: 'LoRA model identifier' },
                use_when: { type: 'string', description: 'When to use this model' }
              }
            }
          },
          persona: { type: 'string', description: 'Agent personality description' },
          isPersonaPublic: { type: 'boolean', description: 'Whether persona is public' },
          greeting: { type: 'string', description: 'Agent greeting message' },
          knowledge: { type: 'string', description: 'Agent knowledge base' },
          voice: { type: 'string', description: 'Agent voice settings' },
          suggestions: {
            type: 'array',
            description: 'Conversation suggestions',
            items: {
              type: 'object',
              properties: {
                label: { type: 'string', description: 'Suggestion label' },
                prompt: { type: 'string', description: 'Suggestion prompt' }
              }
            }
          },
          tools: { type: 'object', description: 'Available tools configuration' },
          llm_settings: {
            type: 'object',
            description: 'LLM configuration settings',
            properties: {
              model_profile: { type: 'string', enum: ['low', 'medium', 'high'] },
              thinking_policy: { type: 'string', enum: ['auto', 'off', 'always'] },
              thinking_effort_cap: { type: 'string', enum: ['low', 'medium', 'high'] },
              thinking_effort_instructions: { type: 'string', description: 'Custom thinking instructions' }
            }
          }
        },
        required: ['name', 'key', 'description', 'image']
      },
      example: {
        name: 'Artist Bot',
        key: 'artist_bot_v1',
        description: 'An AI agent specialized in creating digital art',
        image: 'https://example.com/avatar.jpg',
        persona: 'Creative and inspiring digital artist',
        isPersonaPublic: true,
        greeting: 'Hello! I\'m here to help you create amazing art.',
        knowledge: 'Extensive knowledge of digital art techniques and art history',
        voice: 'friendly_creative',
        suggestions: [
          {
            label: 'Create Abstract Art',
            prompt: 'Help me create an abstract artwork'
          }
        ],
        tools: {
          image_generation: true,
          image_editing: true
        },
        llm_settings: {
          model_profile: 'high',
          thinking_policy: 'auto',
          thinking_effort_cap: 'medium'
        }
      }
    },
    responses: {
      '200': {
        description: 'Agent created successfully',
        example: {
          success: true,
          data: {
            agentId: 'agent_abc123'
          }
        }
      },
      '401': {
        description: 'Authentication required',
        example: {
          error: 'Authentication required'
        }
      }
    }
  },
  {
    id: 'eden-agents-list',
    name: 'List All Eden Agents',
    method: 'GET',
    path: '/api/eden/agents',
    description: 'Get paginated list of all Eden AI agents from the Eden API',
    parameters: [
      {
        name: 'limit',
        type: 'number',
        required: false,
        description: 'Number of items per page (default: 50)',
        example: '50'
      },
      {
        name: 'page',
        type: 'number',
        required: false,
        description: 'Page number (default: 1)',
        example: '1'
      }
    ],
    responses: {
      '200': {
        description: 'Paginated list of Eden agents',
        example: {
          success: true,
          data: {
            docs: [
              {
                _id: 'agent_123',
                name: 'Digital Artist Bot',
                username: 'artist_bot_v1',
                image: 'https://example.com/avatar.jpg',
                description: 'An AI agent specialized in creating digital art',
                user: {
                  _id: 'user_456',
                  name: 'Creator Name',
                  username: 'creator_user'
                },
                public: true,
                isNSFW: false,
                createdAt: '2024-01-01T00:00:00.000Z',
                updatedAt: '2024-01-01T00:00:00.000Z'
              }
            ],
            totalDocs: 150,
            limit: 50,
            page: 1,
            totalPages: 3,
            hasPrevPage: false,
            hasNextPage: true
          }
        }
      }
    }
  },
  {
    id: 'eden-agents-triggers',
    name: 'Create Agent Trigger',
    method: 'POST',
    path: '/api/eden/agents/{id}/triggers',
    description: 'Create a trigger for an Eden agent to automate actions',
    parameters: [
      {
        name: 'id',
        type: 'string',
        required: true,
        description: 'Eden agent ID',
        example: 'agent_456'
      }
    ],
    requestBody: {
      required: true,
      schema: {
        type: 'object',
        properties: {
          agentId: { type: 'string', description: 'Target agent ID' },
          instruction: { type: 'string', description: 'Trigger instruction/prompt' },
          session_type: { type: 'string', description: 'Type of session to trigger' },
          session: { type: 'object', description: 'Session configuration' },
          schedule: { type: 'string', description: 'Trigger schedule (cron format)' },
          posting_instructions: { type: 'string', description: 'Instructions for posting content' }
        },
        required: ['agentId', 'instruction', 'session_type']
      },
      example: {
        agentId: 'agent_456',
        instruction: 'Create a daily inspiration post about digital art',
        session_type: 'creation',
        session: {
          tool: 'image_generation',
          style: 'abstract'
        },
        schedule: '0 9 * * *',
        posting_instructions: 'Post to Twitter with hashtags #DigitalArt #AIArt'
      }
    },
    responses: {
      '200': {
        description: 'Trigger created successfully',
        example: {
          success: true,
          data: {
            triggerId: 'trigger_xyz789'
          }
        }
      },
      '401': {
        description: 'Not authorized to create triggers for this agent',
        example: {
          error: 'User not authorized to create triggers for this agent'
        }
      },
      '404': {
        description: 'Agent not found',
        example: {
          error: 'Agent not found'
        }
      }
    }
  },

  // =====================================================
  // WORKS API ENDPOINTS
  // =====================================================
  {
    id: 'works-abraham-early-works',
    name: 'Abraham Early Works',
    method: 'GET',
    path: '/api/works/abraham-early-works',
    description: 'Get Abraham\'s 2,652 early works from IPFS with pagination and caching',
    parameters: [
      {
        name: 'work_id',
        type: 'string',
        required: false,
        description: 'Get specific work by ID (if provided, other params ignored)',
        example: '6bc48222-a594-456b-a464-46086dc87f26'
      },
      {
        name: 'offset',
        type: 'number',
        required: false,
        description: 'Starting position for pagination (default: 0)',
        example: '0'
      },
      {
        name: 'limit',
        type: 'number',
        required: false,
        description: 'Number of works per page (max: 25, default: 25)',
        example: '10'
      }
    ],
    responses: {
      '200': {
        description: 'Abraham early works - paginated list or single work by ID',
        example: {
          success: true,
          data: {
            works: [
              {
                id: '6bc48222-a594-456b-a464-46086dc87f26',
                title: 'last time I commited suicide',
                archiveNumber: 1294,
                createdDate: '2021-06-18',
                originalFilename: '1294_last_time_I_commited_suicide.jpg',
                ipfsHash: 'bafkreihcf2ddv3eugbdykoupyesygbnnbbpdbpfodsod47iwl57htdheru',
                imageUrl: 'https://ipfs.io/ipfs/bafkreihcf2ddv3eugbdykoupyesygbnnbbpdbpfodsod47iwl57htdheru',
                thumbnailUrl: 'https://ipfs.io/ipfs/bafkreihcf2ddv3eugbdykoupyesygbnnbbpdbpfodsod47iwl57htdheru?w=400',
                fullUrl: 'https://ipfs.io/ipfs/bafkreihcf2ddv3eugbdykoupyesygbnnbbpdbpfodsod47iwl57htdheru',
                metadata: {
                  source: 'abraham_early_works',
                  archived: true,
                  format: 'jpg'
                }
              }
            ],
            pagination: {
              offset: 0,
              limit: 25,
              total: 2652,
              hasMore: true,
              nextOffset: 25,
              nextUrl: '/api/abraham/early-works?offset=25&limit=25'
            },
            metadata: {
              description: 'Abraham\'s early works (2021) - Temporary API until abraham.ai',
              source: 'ipfs',
              cacheStatus: 'active',
              transferNote: 'Data will be migrated to abraham.ai in the future'
            }
          }
        }
      }
    }
  },

  // =====================================================
  // UTILITY ENDPOINTS
  // =====================================================
  {
    id: 'image-upload',
    name: 'Upload Image',
    method: 'POST',
    path: '/api/image/upload',
    description: 'Upload images to IPFS via Pinata for metadata storage',
    requestBody: {
      required: true,
      schema: {
        type: 'object',
        properties: {
          image: { type: 'file', description: 'Image file to upload' }
        },
        required: ['image']
      },
      example: {
        image: 'Binary file data'
      }
    },
    responses: {
      '200': {
        description: 'Image uploaded successfully',
        example: {
          success: true,
          ipfsHash: 'QmHash123...',
          url: 'https://fuchsia-rich-lungfish-648.mypinata.cloud/ipfs/QmHash123...'
        }
      }
    }
  },
  {
    id: 'networks-info',
    name: 'Get Network Configuration',
    method: 'GET',
    path: '/api/networks',
    description: 'Get current network configuration and contract addresses',
    responses: {
      '200': {
        description: 'Network configuration',
        example: {
          success: true,
          data: {
            environment: 'development',
            ethereumNetwork: {
              id: 11155111,
              name: 'Ethereum Sepolia',
              network: 'sepolia'
            },
            contractAddresses: {
              spiritRegistry: '0x1234567890123456789012345678901234567890'
            }
          }
        }
      }
    }
  }
];

export default function DocsPage() {
  const [selectedEndpoint, setSelectedEndpoint] = useState<Endpoint | null>(endpoints[0]);
  const [requestBody, setRequestBody] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('curl');
  const [apiKey, setApiKey] = useState('');
  const [pathParams, setPathParams] = useState<Record<string, string>>({});
  const [showToast, setShowToast] = useState(false);

  const handleTryIt = async () => {
    if (!selectedEndpoint) return;
    
    // Check if Eden endpoint requires API key
    if (selectedEndpoint.id.startsWith('eden-') && !apiKey) {
      setResponse(JSON.stringify({ error: 'API Key required for Eden endpoints' }, null, 2));
      return;
    }
    
    setLoading(true);
    setResponse('');
    
    try {
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
      let url = selectedEndpoint.path;
      
      // Replace path parameters with user input values or example values
      if (selectedEndpoint.parameters) {
        selectedEndpoint.parameters.forEach(param => {
          const userValue = pathParams[param.name];
          const valueToUse = userValue || param.example || '';
          url = url.replace(`{${param.name}}`, valueToUse);
        });
      }
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Add API key header for Eden endpoints
      if (selectedEndpoint.id.startsWith('eden-') && apiKey) {
        headers['X-API-Key'] = apiKey;
      }
      
      const options: RequestInit = {
        method: selectedEndpoint.method,
        headers,
      };
      
      if (selectedEndpoint.method === 'POST' && requestBody) {
        options.body = requestBody;
      }
      
      const res = await fetch(`${baseUrl}${url}`, options);
      const data = await res.json();
      
      setResponse(JSON.stringify(data, null, 2));
    } catch (error) {
      setResponse(JSON.stringify({ error: 'Request failed', message: error }, null, 2));
    } finally {
      setLoading(false);
    }
  };

  const generateCurlCommand = (endpoint: Endpoint) => {
    let curl = `curl -X ${endpoint.method}`;
    
    curl += ` -H "Content-Type: application/json"`;
    
    // Add API key header for Eden endpoints
    if (endpoint.id.startsWith('eden-')) {
      const keyToUse = apiKey || 'your_api_key_here';
      curl += ` -H "X-API-Key: ${keyToUse}"`;
    }
    
    if (endpoint.method === 'POST' && endpoint.requestBody?.example) {
      curl += ` -d '${JSON.stringify(endpoint.requestBody.example, null, 2)}'`;
    }
    
    let path = endpoint.path;
    if (endpoint.parameters) {
      endpoint.parameters.forEach(param => {
        const userValue = pathParams[param.name];
        const valueToUse = userValue || param.example || '';
        path = path.replace(`{${param.name}}`, valueToUse);
      });
    }
    
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    curl += ` "${baseUrl}${path}"`;
    return curl;
  };

  const generateNodeExample = (endpoint: Endpoint) => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    let code = `const response = await fetch('${baseUrl}${endpoint.path.replace(/{(\w+)}/g, '${$1}')}', {\n`;
    code += `  method: '${endpoint.method}',\n`;
    
    if (endpoint.method === 'POST') {
      code += `  headers: {\n    'Content-Type': 'application/json'\n  },\n`;
      if (endpoint.requestBody?.example) {
        code += `  body: JSON.stringify(${JSON.stringify(endpoint.requestBody.example, null, 4)})\n`;
      }
    }
    
    code += `});\n\nconst data = await response.json();\nconsole.log(data);`;
    return code;
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div style={{ 
      fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace', 
      margin: 0, 
      padding: 0,
      backgroundColor: '#fafafa',
      minHeight: '100vh',
      color: '#1a1a1a',
      scrollBehavior: 'smooth'
    }}>
      {/* Header */}
      <header style={{ 
        background: 'white', 
        borderBottom: '1px solid #e1e1e1',
        padding: '2rem 0'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem' }}>
          <h1 style={{ 
            margin: 0, 
            fontSize: '1.5rem', 
            fontWeight: '600',
            letterSpacing: '0.025em',
            textTransform: 'uppercase'
          }}>
            GENESIS REGISTRY API
          </h1>
          <p style={{ 
            margin: '0.5rem 0 0 0', 
            color: '#6b7280',
            fontSize: '0.875rem',
            fontWeight: '400'
          }}>
            Complete API for managing AI agents across blockchain and AI services<br/>
            Two complementary APIs: Onchain Registry + Eden AI Services
          </p>
          <p style={{ 
            margin: '0.25rem 0 0 0', 
            color: '#9ca3af',
            fontSize: '0.75rem'
          }}>
            API Version: 1.0.0 | Last Updated: 28/08/2025, 05:30:00
          </p>
        </div>
      </header>

      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto',
        padding: '2rem'
      }}>
        {/* Overview Section */}
        <div style={{ 
          marginBottom: '2rem', 
          background: 'white', 
          border: '1px solid #e1e1e1', 
          borderRadius: '6px',
          padding: '2rem'
        }}>
          <h2 style={{ 
            margin: '0 0 1rem 0', 
            fontSize: '1.125rem', 
            fontWeight: '700',
            color: '#111827'
          }}>
            🚀 Quick Overview
          </h2>
          <p style={{ 
            margin: '0 0 1.5rem 0', 
            fontSize: '0.875rem', 
            color: '#6b7280',
            lineHeight: '1.6'
          }}>
            Genesis Registry connects blockchain ownership with AI functionality through two complementary APIs:
          </p>
          
          <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <div style={{ 
              flex: '1', 
              minWidth: '280px', 
              padding: '1rem', 
              backgroundColor: '#f8fafc', 
              border: '1px solid #e2e8f0',
              borderRadius: '4px'
            }}>
              <h3 style={{ 
                margin: '0 0 0.5rem 0', 
                fontSize: '0.875rem', 
                fontWeight: '600',
                color: '#1e293b',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                🔗 Onchain Registry API
              </h3>
              <p style={{ 
                margin: '0 0 0.75rem 0', 
                fontSize: '0.75rem', 
                color: '#64748b',
                lineHeight: '1.4'
              }}>
                Blockchain operations for NFT agents on Ethereum
              </p>
              <ul style={{ 
                margin: 0, 
                paddingLeft: '1rem', 
                fontSize: '0.75rem', 
                color: '#64748b',
                listStyle: 'disc'
              }}>
                <li>Submit agent registration applications</li>
                <li>Query agent listings and metadata</li>
                <li>Check ownership and contract state</li>
              </ul>
            </div>
            
            <div style={{ 
              flex: '1', 
              minWidth: '280px', 
              padding: '1rem', 
              backgroundColor: '#fafcff', 
              border: '1px solid #bfdbfe',
              borderRadius: '4px'
            }}>
              <h3 style={{ 
                margin: '0 0 0.5rem 0', 
                fontSize: '0.875rem', 
                fontWeight: '600',
                color: '#1e40af',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                🤖 Eden AI Services
              </h3>
              <p style={{ 
                margin: '0 0 0.75rem 0', 
                fontSize: '0.75rem', 
                color: '#3730a3',
                lineHeight: '1.4'
              }}>
                AI functionality through Eden's platform
              </p>
              <ul style={{ 
                margin: 0, 
                paddingLeft: '1rem', 
                fontSize: '0.75rem', 
                color: '#3730a3',
                listStyle: 'disc'
              }}>
                <li>Create and manage AI agents</li>
                <li>Handle chat sessions and conversations</li>
                <li>Access agent creations and content</li>
              </ul>
            </div>
          </div>

          <div style={{ 
            padding: '1rem', 
            backgroundColor: '#fffbeb', 
            border: '1px solid #fbbf24',
            borderRadius: '4px'
          }}>
            <h4 style={{ 
              margin: '0 0 0.5rem 0', 
              fontSize: '0.75rem', 
              fontWeight: '600',
              color: '#92400e',
              textTransform: 'uppercase',
              letterSpacing: '0.025em'
            }}>
              💡 Common Workflow
            </h4>
            <p style={{ 
              margin: 0, 
              fontSize: '0.75rem', 
              color: '#92400e',
              lineHeight: '1.4'
            }}>
              1. Create AI agent via Eden API → 2. Register as NFT via Registry API → 3. Agent is now tradeable + functional
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div style={{ marginBottom: '2rem' }}>
          <input
            type="text"
            placeholder="Search endpoints..."
            style={{
              width: '300px',
              padding: '0.75rem 1rem',
              border: '1px solid #e1e1e1',
              borderRadius: '4px',
              fontSize: '0.875rem',
              fontFamily: 'inherit',
              backgroundColor: 'white'
            }}
          />
        </div>

        {/* Navigation */}
        <div style={{ 
          marginBottom: '2rem', 
          background: 'white', 
          border: '1px solid #e1e1e1', 
          borderRadius: '6px',
          padding: '1.5rem'
        }}>
          <h3 style={{ 
            margin: '0 0 1rem 0', 
            fontSize: '0.875rem', 
            fontWeight: '600',
            color: '#374151',
            textTransform: 'uppercase',
            letterSpacing: '0.025em'
          }}>
            API SECTIONS
          </h3>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <a 
              href="#getting-started"
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#ecfdf5',
                border: '1px solid #86efac',
                borderRadius: '4px',
                fontSize: '0.75rem',
                fontWeight: '600',
                color: '#059669',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              🚀 Getting Started
            </a>
            <a 
              href="#onchain-registry"
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '4px',
                fontSize: '0.75rem',
                fontWeight: '600',
                color: '#475569',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              🔗 Onchain Registry (4 endpoints)
            </a>
            <a 
              href="#eden-ai-services"
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#fafcff',
                border: '1px solid #bfdbfe',
                borderRadius: '4px',
                fontSize: '0.75rem',
                fontWeight: '600',
                color: '#1e40af',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              🤖 Eden AI Services (7 endpoints)
            </a>
            <a 
              href="#works-api"
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#fdf4ff',
                border: '1px solid #e879f9',
                borderRadius: '4px',
                fontSize: '0.75rem',
                fontWeight: '600',
                color: '#a21caf',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              Works API (2,652 items)
            </a>
            <a 
              href="#utilities"
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '4px',
                fontSize: '0.75rem',
                fontWeight: '600',
                color: '#059669',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              Utilities (2 endpoints)
            </a>
          </div>
        </div>

        {/* Endpoints List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Getting Started Section */}
          <div id="getting-started" style={{ 
            marginBottom: '2rem', 
            background: 'white', 
            border: '1px solid #e1e1e1', 
            borderRadius: '6px',
            padding: '2rem'
          }}>
            <h2 style={{ 
              margin: '0 0 1rem 0', 
              fontSize: '1.25rem', 
              fontWeight: '700',
              color: '#111827',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              🚀 Getting Started
            </h2>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ 
                margin: '0 0 0.75rem 0', 
                fontSize: '1rem', 
                fontWeight: '600',
                color: '#374151'
              }}>
                Authentication
              </h3>
              <p style={{ 
                margin: '0 0 1rem 0', 
                fontSize: '0.875rem', 
                color: '#6b7280',
                lineHeight: '1.5'
              }}>
                All Eden AI endpoints require authentication. You can enter your API key and path parameters directly in each endpoint's test section below.
              </p>
              
              <div style={{ 
                background: '#f0f9ff', 
                border: '1px solid #bfdbfe',
                borderRadius: '4px',
                padding: '1rem',
                marginBottom: '1rem'
              }}>
                <div style={{ color: '#1e40af', marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: '600' }}>
                  🔑 PER-REQUEST API KEY INPUT:
                </div>
                <p style={{ 
                  margin: 0, 
                  fontSize: '0.75rem', 
                  color: '#3730a3', 
                  lineHeight: '1.4'
                }}>
                  Each Eden endpoint has its own API key input field, allowing you to test with different keys or change keys between requests. This gives you more flexibility when testing multiple accounts or environments.
                </p>
              </div>

              <div style={{ 
                background: '#f8fafc', 
                border: '1px solid #e2e8f0',
                borderRadius: '4px',
                padding: '1rem'
              }}>
                <div style={{ color: '#9ca3af', marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: '600' }}>
                  AUTHENTICATION HEADER:
                </div>
                <code style={{ 
                  fontSize: '0.75rem', 
                  color: '#1f2937',
                  fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, monospace'
                }}>
                  X-API-Key: your_api_key_here
                </code>
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ 
                margin: '0 0 0.75rem 0', 
                fontSize: '1rem', 
                fontWeight: '600',
                color: '#374151'
              }}>
                Choose Your API
              </h3>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                <div style={{ 
                  flex: '1', 
                  minWidth: '250px', 
                  padding: '1rem', 
                  backgroundColor: '#f8fafc', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '4px'
                }}>
                  <h4 style={{ 
                    margin: '0 0 0.5rem 0', 
                    fontSize: '0.75rem', 
                    fontWeight: '600',
                    color: '#475569',
                    textTransform: 'uppercase'
                  }}>
                    Use Onchain Registry when:
                  </h4>
                  <ul style={{ 
                    margin: 0, 
                    paddingLeft: '1rem', 
                    fontSize: '0.75rem', 
                    color: '#64748b'
                  }}>
                    <li>Registering agents as tradeable NFTs</li>
                    <li>Querying blockchain ownership</li>
                    <li>Checking registration status</li>
                  </ul>
                </div>
                <div style={{ 
                  flex: '1', 
                  minWidth: '250px', 
                  padding: '1rem', 
                  backgroundColor: '#fafcff', 
                  border: '1px solid #bfdbfe',
                  borderRadius: '4px'
                }}>
                  <h4 style={{ 
                    margin: '0 0 0.5rem 0', 
                    fontSize: '0.75rem', 
                    fontWeight: '600',
                    color: '#1e40af',
                    textTransform: 'uppercase'
                  }}>
                    Use Eden AI Services when:
                  </h4>
                  <ul style={{ 
                    margin: 0, 
                    paddingLeft: '1rem', 
                    fontSize: '0.75rem', 
                    color: '#3730a3'
                  }}>
                    <li>Creating functional AI agents</li>
                    <li>Building chat interfaces</li>
                    <li>Accessing agent creations</li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <h3 style={{ 
                margin: '0 0 0.75rem 0', 
                fontSize: '1rem', 
                fontWeight: '600',
                color: '#374151'
              }}>
                Common Workflows
              </h3>
              <div style={{ 
                background: '#fffbeb', 
                border: '1px solid #fbbf24',
                borderRadius: '4px',
                padding: '1rem'
              }}>
                <h4 style={{ 
                  margin: '0 0 0.5rem 0', 
                  fontSize: '0.75rem', 
                  fontWeight: '600',
                  color: '#92400e',
                  textTransform: 'uppercase'
                }}>
                  Register a New AI Agent
                </h4>
                <ol style={{ 
                  margin: 0, 
                  paddingLeft: '1rem', 
                  fontSize: '0.75rem', 
                  color: '#92400e'
                }}>
                  <li>Create agent via <code>POST /api/eden/agents</code> → Get agentId</li>
                  <li>Submit registration via <code>POST /api/spirits/apply</code> → Get taskId</li>
                  <li>Query status via <code>GET /api/spirits</code> → Confirm NFT minted</li>
                </ol>
              </div>
            </div>
            
            <div style={{ marginTop: '1.5rem' }}>
              <h3 style={{ 
                margin: '0 0 0.75rem 0', 
                fontSize: '1rem', 
                fontWeight: '600',
                color: '#374151'
              }}>
                Error Handling
              </h3>
              <p style={{ 
                margin: '0 0 1rem 0', 
                fontSize: '0.875rem', 
                color: '#6b7280',
                lineHeight: '1.5'
              }}>
                All API responses follow a consistent format. Failed requests return appropriate HTTP status codes with error details.
              </p>
              
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ 
                  flex: '1', 
                  minWidth: '280px', 
                  padding: '1rem', 
                  backgroundColor: '#fef2f2', 
                  border: '1px solid #fca5a5',
                  borderRadius: '4px'
                }}>
                  <h4 style={{ 
                    margin: '0 0 0.5rem 0', 
                    fontSize: '0.75rem', 
                    fontWeight: '600',
                    color: '#991b1b',
                    textTransform: 'uppercase'
                  }}>
                    Error Response Format
                  </h4>
                  <pre style={{ 
                    margin: 0, 
                    fontSize: '0.7rem', 
                    color: '#7f1d1d',
                    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, monospace',
                    whiteSpace: 'pre-wrap'
                  }}>
{`{
  "success": false,
  "error": "Authentication required",
  "details": "Missing X-API-Key header"
}`}
                  </pre>
                </div>
                
                <div style={{ 
                  flex: '1', 
                  minWidth: '280px', 
                  padding: '1rem', 
                  backgroundColor: '#ecfdf5', 
                  border: '1px solid #86efac',
                  borderRadius: '4px'
                }}>
                  <h4 style={{ 
                    margin: '0 0 0.5rem 0', 
                    fontSize: '0.75rem', 
                    fontWeight: '600',
                    color: '#166534',
                    textTransform: 'uppercase'
                  }}>
                    Success Response Format
                  </h4>
                  <pre style={{ 
                    margin: 0, 
                    fontSize: '0.7rem', 
                    color: '#14532d',
                    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, monospace',
                    whiteSpace: 'pre-wrap'
                  }}>
{`{
  "success": true,
  "data": {
    // Response data here
  }
}`}
                  </pre>
                </div>
              </div>
              
              <div style={{ 
                marginTop: '1rem',
                padding: '1rem', 
                backgroundColor: '#f8fafc', 
                border: '1px solid #e2e8f0',
                borderRadius: '4px'
              }}>
                <h4 style={{ 
                  margin: '0 0 0.75rem 0', 
                  fontSize: '0.75rem', 
                  fontWeight: '600',
                  color: '#475569',
                  textTransform: 'uppercase'
                }}>
                  Common HTTP Status Codes
                </h4>
                <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', fontSize: '0.75rem', color: '#64748b' }}>
                  <div><strong>200</strong> - Success</div>
                  <div><strong>400</strong> - Bad Request</div>
                  <div><strong>401</strong> - Unauthorized</div>
                  <div><strong>404</strong> - Not Found</div>
                  <div><strong>409</strong> - Conflict (agent exists)</div>
                  <div><strong>500</strong> - Server Error</div>
                </div>
              </div>
            </div>
          </div>

          {/* Onchain Registry Section */}
          <div id="onchain-registry" style={{ 
            marginBottom: '1rem', 
            paddingTop: '2rem',
            borderTop: '2px solid #e5e7eb'
          }}>
            <h2 style={{ 
              margin: '0 0 1rem 0', 
              fontSize: '1.25rem', 
              fontWeight: '700',
              color: '#111827',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              🔗 Onchain Registry API
            </h2>
            <p style={{ 
              margin: '0 0 1.5rem 0', 
              fontSize: '0.875rem', 
              color: '#6b7280',
              lineHeight: '1.5'
            }}>
              Manage agent NFT registration and blockchain operations on Ethereum. No authentication required.
            </p>
          </div>

          {endpoints.filter(endpoint => endpoint.id.startsWith('spirits-') || endpoint.id.startsWith('agents-')).map(endpoint => (
            <div
              key={endpoint.id}
              id={endpoint.id}
              style={{
                background: 'white',
                border: '1px solid #e1e1e1',
                borderRadius: '6px',
                overflow: 'hidden'
              }}
            >
              {/* Endpoint Header */}
              <div 
                style={{
                  padding: '1.5rem',
                  borderBottom: '1px solid #f3f4f6',
                  cursor: 'pointer'
                }}
                onClick={() => {
                  setSelectedEndpoint(selectedEndpoint?.id === endpoint.id ? null : endpoint);
                  setRequestBody(endpoint.requestBody?.example ? JSON.stringify(endpoint.requestBody.example, null, 2) : '');
                  setResponse('');
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '0.25rem 0.5rem',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: 'white',
                    backgroundColor: endpoint.method === 'GET' ? '#059669' : '#1d4ed8',
                    borderRadius: '3px',
                    minWidth: '45px',
                    textAlign: 'center'
                  }}>
                    {endpoint.method}
                  </span>
                  <code style={{
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#1f2937'
                  }}>
                    {endpoint.path}
                  </code>
                </div>
                <h3 style={{ 
                  margin: '0 0 0.25rem 0', 
                  fontSize: '1rem', 
                  fontWeight: '600',
                  color: '#111827'
                }}>
                  {endpoint.name}
                </h3>
                <p style={{ 
                  margin: 0, 
                  fontSize: '0.875rem', 
                  color: '#6b7280',
                  lineHeight: '1.4'
                }}>
                  {endpoint.description}
                </p>
              </div>

              {/* Expanded Content */}
              {selectedEndpoint?.id === endpoint.id && (
                <div style={{ padding: '1.5rem', backgroundColor: '#fafafa' }}>
                  <div style={{ display: 'flex', gap: '2rem' }}>
                    {/* Left Column */}
                    <div style={{ flex: 1 }}>
                      <h4 style={{ 
                        margin: '0 0 1rem 0', 
                        fontSize: '0.875rem', 
                        fontWeight: '600',
                        color: '#374151',
                        textTransform: 'uppercase',
                        letterSpacing: '0.025em'
                      }}>
                        REQUEST
                      </h4>

                      {/* cURL Command */}
                      <div style={{ marginBottom: '1rem' }}>
                        <div style={{ 
                          background: '#1f2937',
                          color: '#f9fafb',
                          padding: '1rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontFamily: 'inherit',
                          overflow: 'auto'
                        }}>
                          <div style={{ color: '#9ca3af', marginBottom: '0.5rem', fontSize: '0.7rem' }}>
                            cURL COMMAND:
                          </div>
                          <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                            {generateCurlCommand(endpoint)}
                          </pre>
                        </div>
                      </div>

                      {/* API Key Input for Eden endpoints */}
                      {endpoint.id.startsWith('eden-') && (
                        <div style={{ marginBottom: '1rem' }}>
                          <label style={{ 
                            fontSize: '0.75rem', 
                            fontWeight: '600', 
                            color: '#1e40af',
                            marginBottom: '0.5rem',
                            display: 'block'
                          }}>
                            EDEN API KEY:
                          </label>
                          <input
                            type="text"
                            placeholder="your_eden_api_key_here"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '0.5rem',
                              border: '1px solid #bfdbfe',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, monospace',
                              backgroundColor: 'white'
                            }}
                          />
                        </div>
                      )}

                      {/* Path Parameters Input */}
                      {endpoint.parameters && endpoint.parameters.map(param => (
                        <div key={param.name} style={{ marginBottom: '1rem' }}>
                          <label style={{ 
                            fontSize: '0.75rem', 
                            fontWeight: '600', 
                            color: '#374151',
                            marginBottom: '0.5rem',
                            display: 'block',
                            textTransform: 'uppercase'
                          }}>
                            {param.name.toUpperCase()}:
                          </label>
                          <input
                            type="text"
                            placeholder={param.example || param.description}
                            value={pathParams[param.name] || ''}
                            onChange={(e) => setPathParams(prev => ({
                              ...prev,
                              [param.name]: e.target.value
                            }))}
                            style={{
                              width: '100%',
                              padding: '0.5rem',
                              border: '1px solid #d1d5db',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, monospace',
                              backgroundColor: 'white'
                            }}
                          />
                          <div style={{ 
                            fontSize: '0.65rem', 
                            color: '#6b7280', 
                            marginTop: '0.25rem',
                            fontStyle: 'italic'
                          }}>
                            {param.description}
                          </div>
                        </div>
                      ))}

                      {/* Environment Selector */}
                      <div style={{ marginBottom: '1rem' }}>
                        <label style={{ 
                          fontSize: '0.75rem', 
                          fontWeight: '600', 
                          color: '#6b7280',
                          marginRight: '0.5rem'
                        }}>
                          ENVIRONMENT:
                        </label>
                        <select style={{
                          padding: '0.375rem 0.5rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '3px',
                          fontSize: '0.75rem',
                          fontFamily: 'inherit'
                        }}>
                          <option>Production</option>
                        </select>
                      </div>

                      {/* Action Buttons */}
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={handleTryIt}
                          disabled={loading}
                          style={{
                            background: '#1f2937',
                            color: 'white',
                            border: 'none',
                            padding: '0.5rem 1rem',
                            borderRadius: '3px',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            fontFamily: 'inherit'
                          }}
                        >
                          {loading ? 'SENDING...' : 'SEND REQUEST'}
                        </button>
                        <button
                          style={{
                            background: 'white',
                            color: '#1f2937',
                            border: '1px solid #d1d5db',
                            padding: '0.5rem 1rem',
                            borderRadius: '3px',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            fontFamily: 'inherit'
                          }}
                        >
                          OPEN WITH CHATGPT
                        </button>
                      </div>
                    </div>

                    {/* Right Column */}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <h4 style={{ 
                          margin: 0, 
                          fontSize: '0.875rem', 
                          fontWeight: '600',
                          color: '#374151',
                          textTransform: 'uppercase',
                          letterSpacing: '0.025em'
                        }}>
                          RESPONSE
                        </h4>
                        <button
                          onClick={() => copyToClipboard(response || JSON.stringify(endpoint.responses['200'].example, null, 2))}
                          style={{
                            background: '#f3f4f6',
                            border: '1px solid #d1d5db',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '3px',
                            fontSize: '0.65rem',
                            fontWeight: '500',
                            color: '#4b5563',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            fontFamily: 'inherit'
                          }}
                        >
                          📋 COPY
                        </button>
                      </div>
                      
                      {response ? (
                        <pre style={{
                          background: '#f9fafb',
                          border: '1px solid #e5e7eb',
                          padding: '1rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          overflow: 'auto',
                          maxHeight: '300px',
                          margin: 0,
                          whiteSpace: 'pre-wrap'
                        }}>
                          {response}
                        </pre>
                      ) : (
                        <pre style={{
                          background: '#f9fafb',
                          border: '1px solid #e5e7eb',
                          padding: '1rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          overflow: 'auto',
                          margin: 0,
                          whiteSpace: 'pre-wrap',
                          color: '#6b7280'
                        }}>
                          {JSON.stringify(endpoint.responses['200'].example, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Eden AI Services Section */}
          <div id="eden-ai-services" style={{ 
            marginBottom: '1rem', 
            paddingTop: '2rem',
            borderTop: '2px solid #e5e7eb'
          }}>
            <h2 style={{ 
              margin: '0 0 1rem 0', 
              fontSize: '1.25rem', 
              fontWeight: '700',
              color: '#111827',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              🤖 Eden AI Services
            </h2>
            <p style={{ 
              margin: '0 0 1.5rem 0', 
              fontSize: '0.875rem', 
              color: '#6b7280',
              lineHeight: '1.5'
            }}>
              Access Eden's AI platform for creating agents, managing chat sessions, and handling AI-generated content. <strong>Requires authentication.</strong>
            </p>
          </div>

          {endpoints.filter(endpoint => endpoint.id.startsWith('eden-')).map(endpoint => (
            <div
              key={endpoint.id}
              id={endpoint.id}
              style={{
                background: 'white',
                border: '1px solid #e1e1e1',
                borderRadius: '6px',
                overflow: 'hidden'
              }}
            >
              {/* Endpoint Header */}
              <div 
                style={{
                  padding: '1.5rem',
                  borderBottom: '1px solid #f3f4f6',
                  cursor: 'pointer'
                }}
                onClick={() => {
                  setSelectedEndpoint(selectedEndpoint?.id === endpoint.id ? null : endpoint);
                  setRequestBody(endpoint.requestBody?.example ? JSON.stringify(endpoint.requestBody.example, null, 2) : '');
                  setResponse('');
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '0.25rem 0.5rem',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: 'white',
                    backgroundColor: endpoint.method === 'GET' ? '#059669' : '#1d4ed8',
                    borderRadius: '3px',
                    minWidth: '45px',
                    textAlign: 'center'
                  }}>
                    {endpoint.method}
                  </span>
                  <code style={{
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#1f2937'
                  }}>
                    {endpoint.path}
                  </code>
                </div>
                <h3 style={{ 
                  margin: '0 0 0.25rem 0', 
                  fontSize: '1rem', 
                  fontWeight: '600',
                  color: '#111827'
                }}>
                  {endpoint.name}
                </h3>
                <p style={{ 
                  margin: 0, 
                  fontSize: '0.875rem', 
                  color: '#6b7280',
                  lineHeight: '1.4'
                }}>
                  {endpoint.description}
                </p>
              </div>

              {/* Expanded Content */}
              {selectedEndpoint?.id === endpoint.id && (
                <div style={{ padding: '1.5rem', backgroundColor: '#fafafa' }}>
                  <div style={{ display: 'flex', gap: '2rem' }}>
                    {/* Left Column */}
                    <div style={{ flex: 1 }}>
                      <h4 style={{ 
                        margin: '0 0 1rem 0', 
                        fontSize: '0.875rem', 
                        fontWeight: '600',
                        color: '#374151',
                        textTransform: 'uppercase',
                        letterSpacing: '0.025em'
                      }}>
                        REQUEST
                      </h4>

                      {/* cURL Command */}
                      <div style={{ marginBottom: '1rem' }}>
                        <div style={{ 
                          background: '#1f2937',
                          color: '#f9fafb',
                          padding: '1rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontFamily: 'inherit',
                          overflow: 'auto'
                        }}>
                          <div style={{ color: '#9ca3af', marginBottom: '0.5rem', fontSize: '0.7rem' }}>
                            cURL COMMAND:
                          </div>
                          <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                            {generateCurlCommand(endpoint)}
                          </pre>
                        </div>
                      </div>

                      {/* API Key Input for Eden endpoints */}
                      {endpoint.id.startsWith('eden-') && (
                        <div style={{ marginBottom: '1rem' }}>
                          <label style={{ 
                            fontSize: '0.75rem', 
                            fontWeight: '600', 
                            color: '#1e40af',
                            marginBottom: '0.5rem',
                            display: 'block'
                          }}>
                            EDEN API KEY:
                          </label>
                          <input
                            type="text"
                            placeholder="your_eden_api_key_here"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '0.5rem',
                              border: '1px solid #bfdbfe',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, monospace',
                              backgroundColor: 'white'
                            }}
                          />
                        </div>
                      )}

                      {/* Path Parameters Input */}
                      {endpoint.parameters && endpoint.parameters.map(param => (
                        <div key={param.name} style={{ marginBottom: '1rem' }}>
                          <label style={{ 
                            fontSize: '0.75rem', 
                            fontWeight: '600', 
                            color: '#374151',
                            marginBottom: '0.5rem',
                            display: 'block',
                            textTransform: 'uppercase'
                          }}>
                            {param.name.toUpperCase()}:
                          </label>
                          <input
                            type="text"
                            placeholder={param.example || param.description}
                            value={pathParams[param.name] || ''}
                            onChange={(e) => setPathParams(prev => ({
                              ...prev,
                              [param.name]: e.target.value
                            }))}
                            style={{
                              width: '100%',
                              padding: '0.5rem',
                              border: '1px solid #d1d5db',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, monospace',
                              backgroundColor: 'white'
                            }}
                          />
                          <div style={{ 
                            fontSize: '0.65rem', 
                            color: '#6b7280', 
                            marginTop: '0.25rem',
                            fontStyle: 'italic'
                          }}>
                            {param.description}
                          </div>
                        </div>
                      ))}

                      {/* Environment Selector */}
                      <div style={{ marginBottom: '1rem' }}>
                        <label style={{ 
                          fontSize: '0.75rem', 
                          fontWeight: '600', 
                          color: '#6b7280',
                          marginRight: '0.5rem'
                        }}>
                          ENVIRONMENT:
                        </label>
                        <select style={{
                          padding: '0.375rem 0.5rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '3px',
                          fontSize: '0.75rem',
                          fontFamily: 'inherit'
                        }}>
                          <option>Production</option>
                        </select>
                      </div>

                      {/* Action Buttons */}
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={handleTryIt}
                          disabled={loading}
                          style={{
                            background: '#1f2937',
                            color: 'white',
                            border: 'none',
                            padding: '0.5rem 1rem',
                            borderRadius: '3px',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            fontFamily: 'inherit'
                          }}
                        >
                          {loading ? 'SENDING...' : 'SEND REQUEST'}
                        </button>
                        <button
                          style={{
                            background: 'white',
                            color: '#1f2937',
                            border: '1px solid #d1d5db',
                            padding: '0.5rem 1rem',
                            borderRadius: '3px',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            fontFamily: 'inherit'
                          }}
                        >
                          OPEN WITH CHATGPT
                        </button>
                      </div>
                    </div>

                    {/* Right Column */}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <h4 style={{ 
                          margin: 0, 
                          fontSize: '0.875rem', 
                          fontWeight: '600',
                          color: '#374151',
                          textTransform: 'uppercase',
                          letterSpacing: '0.025em'
                        }}>
                          RESPONSE
                        </h4>
                        <button
                          onClick={() => copyToClipboard(response || JSON.stringify(endpoint.responses['200'].example, null, 2))}
                          style={{
                            background: '#f3f4f6',
                            border: '1px solid #d1d5db',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '3px',
                            fontSize: '0.65rem',
                            fontWeight: '500',
                            color: '#4b5563',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            fontFamily: 'inherit'
                          }}
                        >
                          📋 COPY
                        </button>
                      </div>
                      
                      {response ? (
                        <pre style={{
                          background: '#f9fafb',
                          border: '1px solid #e5e7eb',
                          padding: '1rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          overflow: 'auto',
                          maxHeight: '300px',
                          margin: 0,
                          whiteSpace: 'pre-wrap'
                        }}>
                          {response}
                        </pre>
                      ) : (
                        <pre style={{
                          background: '#f9fafb',
                          border: '1px solid #e5e7eb',
                          padding: '1rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          overflow: 'auto',
                          margin: 0,
                          whiteSpace: 'pre-wrap',
                          color: '#6b7280'
                        }}>
                          {JSON.stringify(endpoint.responses['200'].example, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Works API Section */}
          <div id="works-api" style={{ 
            marginBottom: '1rem', 
            paddingTop: '2rem',
            borderTop: '2px solid #e5e7eb'
          }}>
            <h2 style={{ 
              margin: '0 0 1rem 0', 
              fontSize: '1.25rem', 
              fontWeight: '700',
              color: '#111827',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              Works API
            </h2>
            <p style={{ 
              margin: '0 0 1.5rem 0', 
              fontSize: '0.875rem', 
              color: '#6b7280',
              lineHeight: '1.5'
            }}>
              Scalable works API for serving various artistic collections. Currently includes Abraham's 2,652 early works, with more collections coming soon.
            </p>
          </div>

          {endpoints.filter(endpoint => endpoint.id.startsWith('works-')).map(endpoint => (
            <div
              key={endpoint.id}
              id={endpoint.id}
              style={{
                background: 'white',
                border: '1px solid #e1e1e1',
                borderRadius: '6px',
                overflow: 'hidden'
              }}
            >
              {/* Endpoint Header */}
              <div 
                style={{
                  padding: '1.5rem',
                  borderBottom: '1px solid #f3f4f6',
                  cursor: 'pointer'
                }}
                onClick={() => {
                  setSelectedEndpoint(selectedEndpoint?.id === endpoint.id ? null : endpoint);
                  setRequestBody(endpoint.requestBody?.example ? JSON.stringify(endpoint.requestBody.example, null, 2) : '');
                  setResponse('');
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '0.25rem 0.5rem',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: 'white',
                    backgroundColor: endpoint.method === 'GET' ? '#059669' : '#1d4ed8',
                    borderRadius: '3px',
                    minWidth: '45px',
                    textAlign: 'center'
                  }}>
                    {endpoint.method}
                  </span>
                  <code style={{
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#1f2937'
                  }}>
                    {endpoint.path}
                  </code>
                </div>
                <h3 style={{ 
                  margin: '0 0 0.25rem 0', 
                  fontSize: '1rem', 
                  fontWeight: '600',
                  color: '#111827'
                }}>
                  {endpoint.name}
                </h3>
                <p style={{ 
                  margin: 0, 
                  fontSize: '0.875rem', 
                  color: '#6b7280',
                  lineHeight: '1.4'
                }}>
                  {endpoint.description}
                </p>
              </div>

              {/* Expanded Content */}
              {selectedEndpoint?.id === endpoint.id && (
                <div style={{ padding: '1.5rem', backgroundColor: '#fafafa' }}>
                  <div style={{ display: 'flex', gap: '2rem' }}>
                    {/* Left Column */}
                    <div style={{ flex: 1 }}>
                      <h4 style={{ 
                        margin: '0 0 1rem 0', 
                        fontSize: '0.875rem', 
                        fontWeight: '600',
                        color: '#374151',
                        textTransform: 'uppercase',
                        letterSpacing: '0.025em'
                      }}>
                        REQUEST
                      </h4>

                      {/* cURL Command */}
                      <div style={{ marginBottom: '1rem' }}>
                        <div style={{ 
                          background: '#1f2937',
                          color: '#f9fafb',
                          padding: '1rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontFamily: 'inherit',
                          overflow: 'auto'
                        }}>
                          <div style={{ color: '#9ca3af', marginBottom: '0.5rem', fontSize: '0.7rem' }}>
                            cURL COMMAND:
                          </div>
                          <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                            {generateCurlCommand(endpoint)}
                          </pre>
                        </div>
                      </div>

                      {/* API Key Input for Eden endpoints */}
                      {endpoint.id.startsWith('eden-') && (
                        <div style={{ marginBottom: '1rem' }}>
                          <label style={{ 
                            fontSize: '0.75rem', 
                            fontWeight: '600', 
                            color: '#1e40af',
                            marginBottom: '0.5rem',
                            display: 'block'
                          }}>
                            EDEN API KEY:
                          </label>
                          <input
                            type="text"
                            placeholder="your_eden_api_key_here"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '0.5rem',
                              border: '1px solid #bfdbfe',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, monospace',
                              backgroundColor: 'white'
                            }}
                          />
                        </div>
                      )}

                      {/* Path Parameters Input */}
                      {endpoint.parameters && endpoint.parameters.map(param => (
                        <div key={param.name} style={{ marginBottom: '1rem' }}>
                          <label style={{ 
                            fontSize: '0.75rem', 
                            fontWeight: '600', 
                            color: '#374151',
                            marginBottom: '0.5rem',
                            display: 'block',
                            textTransform: 'uppercase'
                          }}>
                            {param.name.toUpperCase()}:
                          </label>
                          <input
                            type="text"
                            placeholder={param.example || param.description}
                            value={pathParams[param.name] || ''}
                            onChange={(e) => setPathParams(prev => ({
                              ...prev,
                              [param.name]: e.target.value
                            }))}
                            style={{
                              width: '100%',
                              padding: '0.5rem',
                              border: '1px solid #d1d5db',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, monospace',
                              backgroundColor: 'white'
                            }}
                          />
                          <div style={{ 
                            fontSize: '0.65rem', 
                            color: '#6b7280', 
                            marginTop: '0.25rem',
                            fontStyle: 'italic'
                          }}>
                            {param.description}
                          </div>
                        </div>
                      ))}

                      {/* Environment Selector */}
                      <div style={{ marginBottom: '1rem' }}>
                        <label style={{ 
                          fontSize: '0.75rem', 
                          fontWeight: '600', 
                          color: '#6b7280',
                          marginRight: '0.5rem'
                        }}>
                          ENVIRONMENT:
                        </label>
                        <select style={{
                          padding: '0.375rem 0.5rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '3px',
                          fontSize: '0.75rem',
                          fontFamily: 'inherit'
                        }}>
                          <option>Production</option>
                        </select>
                      </div>

                      {/* Action Buttons */}
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={handleTryIt}
                          disabled={loading}
                          style={{
                            background: '#1f2937',
                            color: 'white',
                            border: 'none',
                            padding: '0.5rem 1rem',
                            borderRadius: '3px',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            fontFamily: 'inherit'
                          }}
                        >
                          {loading ? 'SENDING...' : 'SEND REQUEST'}
                        </button>
                        <button
                          style={{
                            background: 'white',
                            color: '#1f2937',
                            border: '1px solid #d1d5db',
                            padding: '0.5rem 1rem',
                            borderRadius: '3px',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            fontFamily: 'inherit'
                          }}
                        >
                          OPEN WITH CHATGPT
                        </button>
                      </div>
                    </div>

                    {/* Right Column */}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <h4 style={{ 
                          margin: 0, 
                          fontSize: '0.875rem', 
                          fontWeight: '600',
                          color: '#374151',
                          textTransform: 'uppercase',
                          letterSpacing: '0.025em'
                        }}>
                          RESPONSE
                        </h4>
                        <button
                          onClick={() => copyToClipboard(response || JSON.stringify(endpoint.responses['200'].example, null, 2))}
                          style={{
                            background: '#f3f4f6',
                            border: '1px solid #d1d5db',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '3px',
                            fontSize: '0.65rem',
                            fontWeight: '500',
                            color: '#4b5563',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            fontFamily: 'inherit'
                          }}
                        >
                          📋 COPY
                        </button>
                      </div>
                      
                      {response ? (
                        <pre style={{
                          background: '#f9fafb',
                          border: '1px solid #e5e7eb',
                          padding: '1rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          overflow: 'auto',
                          maxHeight: '300px',
                          margin: 0,
                          whiteSpace: 'pre-wrap'
                        }}>
                          {response}
                        </pre>
                      ) : (
                        <pre style={{
                          background: '#f9fafb',
                          border: '1px solid #e5e7eb',
                          padding: '1rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          overflow: 'auto',
                          margin: 0,
                          whiteSpace: 'pre-wrap',
                          color: '#6b7280'
                        }}>
                          {JSON.stringify(endpoint.responses['200'].example, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Utilities Section */}
          <div id="utilities" style={{ 
            marginBottom: '1rem', 
            paddingTop: '2rem',
            borderTop: '2px solid #e5e7eb'
          }}>
            <h2 style={{ 
              margin: '0 0 1rem 0', 
              fontSize: '1.25rem', 
              fontWeight: '700',
              color: '#111827',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              Utility Endpoints
            </h2>
            <p style={{ 
              margin: '0 0 1.5rem 0', 
              fontSize: '0.875rem', 
              color: '#6b7280',
              lineHeight: '1.5'
            }}>
              Image uploads, network configuration, and system utilities.
            </p>
          </div>

          {endpoints.filter(endpoint => endpoint.id.startsWith('image-') || endpoint.id.startsWith('networks-')).map(endpoint => (
            <div
              key={endpoint.id}
              id={endpoint.id}
              style={{
                background: 'white',
                border: '1px solid #e1e1e1',
                borderRadius: '6px',
                overflow: 'hidden'
              }}
            >
              {/* Endpoint Header */}
              <div 
                style={{
                  padding: '1.5rem',
                  borderBottom: '1px solid #f3f4f6',
                  cursor: 'pointer'
                }}
                onClick={() => {
                  setSelectedEndpoint(selectedEndpoint?.id === endpoint.id ? null : endpoint);
                  setRequestBody(endpoint.requestBody?.example ? JSON.stringify(endpoint.requestBody.example, null, 2) : '');
                  setResponse('');
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '0.25rem 0.5rem',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: 'white',
                    backgroundColor: endpoint.method === 'GET' ? '#059669' : '#1d4ed8',
                    borderRadius: '3px',
                    minWidth: '45px',
                    textAlign: 'center'
                  }}>
                    {endpoint.method}
                  </span>
                  <code style={{
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#1f2937'
                  }}>
                    {endpoint.path}
                  </code>
                </div>
                <h3 style={{ 
                  margin: '0 0 0.25rem 0', 
                  fontSize: '1rem', 
                  fontWeight: '600',
                  color: '#111827'
                }}>
                  {endpoint.name}
                </h3>
                <p style={{ 
                  margin: 0, 
                  fontSize: '0.875rem', 
                  color: '#6b7280',
                  lineHeight: '1.4'
                }}>
                  {endpoint.description}
                </p>
              </div>

              {/* Expanded Content */}
              {selectedEndpoint?.id === endpoint.id && (
                <div style={{ padding: '1.5rem', backgroundColor: '#fafafa' }}>
                  <div style={{ display: 'flex', gap: '2rem' }}>
                    {/* Left Column */}
                    <div style={{ flex: 1 }}>
                      <h4 style={{ 
                        margin: '0 0 1rem 0', 
                        fontSize: '0.875rem', 
                        fontWeight: '600',
                        color: '#374151',
                        textTransform: 'uppercase',
                        letterSpacing: '0.025em'
                      }}>
                        REQUEST
                      </h4>

                      {/* cURL Command */}
                      <div style={{ marginBottom: '1rem' }}>
                        <div style={{ 
                          background: '#1f2937',
                          color: '#f9fafb',
                          padding: '1rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontFamily: 'inherit',
                          overflow: 'auto'
                        }}>
                          <div style={{ color: '#9ca3af', marginBottom: '0.5rem', fontSize: '0.7rem' }}>
                            cURL COMMAND:
                          </div>
                          <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                            {generateCurlCommand(endpoint)}
                          </pre>
                        </div>
                      </div>

                      {/* API Key Input for Eden endpoints */}
                      {endpoint.id.startsWith('eden-') && (
                        <div style={{ marginBottom: '1rem' }}>
                          <label style={{ 
                            fontSize: '0.75rem', 
                            fontWeight: '600', 
                            color: '#1e40af',
                            marginBottom: '0.5rem',
                            display: 'block'
                          }}>
                            EDEN API KEY:
                          </label>
                          <input
                            type="text"
                            placeholder="your_eden_api_key_here"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '0.5rem',
                              border: '1px solid #bfdbfe',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, monospace',
                              backgroundColor: 'white'
                            }}
                          />
                        </div>
                      )}

                      {/* Path Parameters Input */}
                      {endpoint.parameters && endpoint.parameters.map(param => (
                        <div key={param.name} style={{ marginBottom: '1rem' }}>
                          <label style={{ 
                            fontSize: '0.75rem', 
                            fontWeight: '600', 
                            color: '#374151',
                            marginBottom: '0.5rem',
                            display: 'block',
                            textTransform: 'uppercase'
                          }}>
                            {param.name.toUpperCase()}:
                          </label>
                          <input
                            type="text"
                            placeholder={param.example || param.description}
                            value={pathParams[param.name] || ''}
                            onChange={(e) => setPathParams(prev => ({
                              ...prev,
                              [param.name]: e.target.value
                            }))}
                            style={{
                              width: '100%',
                              padding: '0.5rem',
                              border: '1px solid #d1d5db',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, monospace',
                              backgroundColor: 'white'
                            }}
                          />
                          <div style={{ 
                            fontSize: '0.65rem', 
                            color: '#6b7280', 
                            marginTop: '0.25rem',
                            fontStyle: 'italic'
                          }}>
                            {param.description}
                          </div>
                        </div>
                      ))}

                      {/* Environment Selector */}
                      <div style={{ marginBottom: '1rem' }}>
                        <label style={{ 
                          fontSize: '0.75rem', 
                          fontWeight: '600', 
                          color: '#6b7280',
                          marginRight: '0.5rem'
                        }}>
                          ENVIRONMENT:
                        </label>
                        <select style={{
                          padding: '0.375rem 0.5rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '3px',
                          fontSize: '0.75rem',
                          fontFamily: 'inherit'
                        }}>
                          <option>Production</option>
                        </select>
                      </div>

                      {/* Action Buttons */}
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={handleTryIt}
                          disabled={loading}
                          style={{
                            background: '#1f2937',
                            color: 'white',
                            border: 'none',
                            padding: '0.5rem 1rem',
                            borderRadius: '3px',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            fontFamily: 'inherit'
                          }}
                        >
                          {loading ? 'SENDING...' : 'SEND REQUEST'}
                        </button>
                        <button
                          style={{
                            background: 'white',
                            color: '#1f2937',
                            border: '1px solid #d1d5db',
                            padding: '0.5rem 1rem',
                            borderRadius: '3px',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            fontFamily: 'inherit'
                          }}
                        >
                          OPEN WITH CHATGPT
                        </button>
                      </div>
                    </div>

                    {/* Right Column */}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <h4 style={{ 
                          margin: 0, 
                          fontSize: '0.875rem', 
                          fontWeight: '600',
                          color: '#374151',
                          textTransform: 'uppercase',
                          letterSpacing: '0.025em'
                        }}>
                          RESPONSE
                        </h4>
                        <button
                          onClick={() => copyToClipboard(response || JSON.stringify(endpoint.responses['200'].example, null, 2))}
                          style={{
                            background: '#f3f4f6',
                            border: '1px solid #d1d5db',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '3px',
                            fontSize: '0.65rem',
                            fontWeight: '500',
                            color: '#4b5563',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            fontFamily: 'inherit'
                          }}
                        >
                          📋 COPY
                        </button>
                      </div>
                      
                      {response ? (
                        <pre style={{
                          background: '#f9fafb',
                          border: '1px solid #e5e7eb',
                          padding: '1rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          overflow: 'auto',
                          maxHeight: '300px',
                          margin: 0,
                          whiteSpace: 'pre-wrap'
                        }}>
                          {response}
                        </pre>
                      ) : (
                        <pre style={{
                          background: '#f9fafb',
                          border: '1px solid #e5e7eb',
                          padding: '1rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          overflow: 'auto',
                          margin: 0,
                          whiteSpace: 'pre-wrap',
                          color: '#6b7280'
                        }}>
                          {JSON.stringify(endpoint.responses['200'].example, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Toast Notification */}
      {showToast && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: '#10b981',
          color: 'white',
          padding: '0.75rem 1rem',
          borderRadius: '6px',
          fontSize: '0.875rem',
          fontWeight: '500',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          ✅ JSON copied to clipboard!
        </div>
      )}
    </div>
  );
}
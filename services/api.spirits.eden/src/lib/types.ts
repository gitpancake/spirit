export interface Agent {
  tokenId: string;
  agentId: string;
  owner: string;
  metadataURI: string;
}

export interface MintRequest {
  to: string;
  agentId: string;
  metadataURI: string;
  signature: string;
  message: string;
  signer: string;
}

export interface BurnRequest {
  tokenId: string;
  signature: string;
  message: string;
  signer: string;
}

export interface SetTreasuryRequest {
  newTreasury: string;
  signature: string;
  message: string;
  signer: string;
}

export interface SetTokenURIRequest {
  tokenId: string;
  uri: string;
  signature: string;
  message: string;
  signer: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  transactionHash?: string;
}

export interface ContractError extends Error {
  code?: string;
  reason?: string;
  transactionHash?: string;
}

// ==============================================
// EDEN API TYPES
// ==============================================

export interface EdenAgentLLMSettings {
  model_profile: 'low' | 'medium' | 'high';
  thinking_policy: 'auto' | 'off' | 'always';
  thinking_effort_cap: 'low' | 'medium' | 'high';
  thinking_effort_instructions: string;
}

export interface EdenAgentOwner {
  _id: string;
  userId: string;
  isWeb2: boolean;
  isAdmin: boolean;
  username: string;
  userImage: string;
  creations: any[];
  collections: any[];
  followerCount: number;
  followingCount: number;
  featureFlags: string[];
  deleted: boolean;
  createdAt: string;
  updatedAt: string;
  __v: number;
  discordId?: string;
  creationCount: number;
  highestMonthlySubscriptionTier?: number;
  stripeCustomerId?: string;
  subscriptionTier?: number;
  email: string;
  type: 'user';
  lastDailyLoginBonus?: string;
  discordLinkBonusClaimed: boolean;
  stats: {
    threadCount: number;
    userMessageCount: number;
    assistantMessageCount: number;
    toolCallCount: number;
    userCount: number;
    lastUpdated: string;
  };
  twitterLinkBonusClaimed: boolean;
  preferences: {
    agent_spend_threshold: number;
    _id: string;
  };
}

export interface EdenAgentSuggestion {
  label: string;
  prompt: string;
}

export interface EdenAgentTools {
  create_image?: boolean;
  create_video?: boolean;
  create_audio?: boolean;
  vj_tools?: boolean;
}

export interface EdenAgentStats {
  assistantMessageCount: number;
  lastUpdated: string;
  threadCount: number;
  toolCallCount: number;
  userCount: number;
  userMessageCount: number;
  assistantMessageCount_7d: number;
  threadCount_7d: number;
  toolCallCount_7d: number;
  userCount_7d: number;
  userMessageCount_7d: number;
  _id: string;
}

export interface EdenAgent {
  llm_settings: EdenAgentLLMSettings;
  isPersonaPublic: boolean;
  deployments: any[];
  discordChannelAllowlist: any[];
  telegramTopicAllowlist: any[];
  likeCount: number;
  owner_pays: 'off' | 'on';
  user_memory_enabled: boolean;
  creations: any[];
  collections: any[];
  creationCount: number;
  followerCount: number;
  followingCount: number;
  _id: string;
  createdAt: string;
  updatedAt: string;
  type: 'agent';
  isAdmin: boolean;
  deleted: boolean;
  userId: string | null;
  isWeb2: boolean;
  email: string | null;
  normalizedEmail: string | null;
  agent: any | null;
  owner: EdenAgentOwner;
  featureFlags: string[];
  subscriptionTier: number | null;
  highestMonthlySubscriptionTier: number | null;
  username: string;
  userImage: string;
  discordId: string | null;
  discordUsername: string | null;
  telegramId: string | null;
  telegramUsername: string | null;
  farcasterId: string | null;
  farcasterUsername: string | null;
  public: boolean;
  allowlist: any | null;
  name: string;
  description: string;
  model: any | null;
  tools: EdenAgentTools;
  test_args: any | null;
  greeting: string;
  knowledge: any | null;
  persona: string;
  suggestions: EdenAgentSuggestion[];
  stats: EdenAgentStats;
  knowledge_description: string | null;
  refreshed_at: string;
  models: any[];
  publicName: string;
}

export interface EdenAgentsResponse {
  docs: EdenAgent[];
  totalDocs?: number;
  limit?: number;
  page?: number;
  totalPages?: number;
  hasNextPage?: boolean;
  hasPrevPage?: boolean;
  nextPage?: number;
  prevPage?: number;
}


// Eden API Proxy Types
// TypeScript interfaces for all Eden API proxy endpoints

// Common Response Types
export interface EdenApiResponse<T = any> {
  success: boolean;
  error?: string;
  details?: string;
  statusCode?: number;
  data?: T;
}

// Session Types
export interface SessionConfig {
  stream?: boolean;
  [key: string]: any;
}

export interface CreateSessionRequest {
  agentId: string;
  config?: SessionConfig;
}

export interface SendMessageRequest {
  sessionId: string;
  message: string;
}

export interface ToolCall {
  id: string;
  type: string;
  function: {
    name: string;
    arguments: string;
  };
  result?: Array<{
    output: Array<{
      filename: string;
      url: string;
    }>;
  }>;
  status: 'running' | 'completed';
}

export interface SessionMessage {
  _id: string;
  role: 'user' | 'assistant';
  content: string;
  tool_calls?: ToolCall[];
  createdAt: string;
}

export interface Session {
  _id: string;
  agentId: string;
  messages: SessionMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface NewMessage extends SessionMessage {
  sessionId: string;
}

// Creation Types
export interface MediaAttributes {
  mimeType: string;
  width?: number;
  height?: number;
  aspectRatio?: number;
  duration?: number;
  blurhash?: string;
}

export interface CreationAgent {
  _id: string;
  name: string;
  username: string;
  userImage: string;
}

export interface CreationUser {
  _id: string;
  username: string;
  userImage: string;
}

export interface CreationTask {
  _id: string;
  args: any;
}

export interface Creation {
  _id: string;
  name: string | null;
  description?: string;
  url: string;
  thumbnail: string;
  createdAt: string;
  updatedAt: string;
  mediaAttributes: MediaAttributes;
  agent?: CreationAgent;
  user?: CreationUser;
  task?: CreationTask;
  tool: string;
  public: boolean;
  deleted: boolean;
  likeCount: number;
}

export interface CreationsResponse {
  docs: Creation[];
  totalDocs: number;
  nextCursor?: string;
}

export interface CreationsQuery {
  limit?: number;
  page?: number;
  cursor?: string;
}

export interface CreationsSearchQuery extends CreationsQuery {
  q: string;
  model?: string;
  style?: string;
  user_id?: string;
  agent_id?: string;
}

// Error Types
export interface EdenApiError {
  success: false;
  error: string;
  details?: string;
  statusCode?: number;
}

// Request Configuration
export interface EdenProxyConfig {
  timeout: number;
  baseUrl: string;
  apiKey: string;
}

// Logging Types
export interface RequestLog {
  timestamp: string;
  method: string;
  endpoint: string;
  duration?: number;
  statusCode?: number;
  error?: string;
}
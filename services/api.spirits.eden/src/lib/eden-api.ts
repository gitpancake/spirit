import { env } from '@/lib/env';
import type { EdenAgent, EdenAgentsResponse } from '@/lib/types';

// Eden API Client - Centralized handler for all Eden API requests
// Ensures consistent authentication, error handling, and request formatting

interface EdenApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: any;
  headers?: Record<string, string>;
  timeout?: number;
}

interface EdenApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  status: number;
}

class EdenApiClient {
  private baseUrl: string;
  private defaultTimeout: number = 30000; // 30 seconds

  constructor() {
    this.baseUrl = env.EDEN_API_URL || 'https://api.eden.art';
  }

  /**
   * Make a request to Eden API with provided API key
   */
  private async makeRequest<T>(
    endpoint: string, 
    apiKey: string,
    options: EdenApiOptions = {}
  ): Promise<EdenApiResponse<T>> {
    const {
      method = 'GET',
      body,
      headers = {},
      timeout = this.defaultTimeout
    } = options;

    const url = `${this.baseUrl}${endpoint}`;
    
    console.log(`🌐 Eden API ${method} ${endpoint}`);

    try {
      // Validate API key is provided
      if (!apiKey) {
        return {
          success: false,
          error: 'API key is required for Eden API requests',
          status: 401
        };
      }

      // Prepare headers with authentication
      const requestHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
        ...headers
      };

      // Prepare request options
      const requestOptions: RequestInit = {
        method,
        headers: requestHeaders,
        signal: AbortSignal.timeout(timeout),
      };

      // Add body for non-GET requests
      if (body && method !== 'GET') {
        requestOptions.body = JSON.stringify(body);
      }

      // Make the request
      const response = await fetch(url, requestOptions);
      const responseData = await response.json();

      if (!response.ok) {
        console.error(`❌ Eden API error (${response.status}):`, responseData);
        return {
          success: false,
          error: responseData.error || `Eden API error: ${response.status}`,
          data: responseData,
          status: response.status
        };
      }

      console.log(`✅ Eden API ${method} ${endpoint} - Success`);
      return {
        success: true,
        data: responseData,
        status: response.status
      };

    } catch (error: any) {
      console.error(`❌ Eden API ${method} ${endpoint} failed:`, error);
      
      let errorMessage = 'Eden API request failed';
      if (error.name === 'TimeoutError') {
        errorMessage = 'Eden API request timed out';
      } else if (error.name === 'AbortError') {
        errorMessage = 'Eden API request was aborted';
      } else if (error.message) {
        errorMessage = error.message;
      }

      return {
        success: false,
        error: errorMessage,
        status: 500
      };
    }
  }

  // ==============================================
  // AGENT MANAGEMENT
  // ==============================================

  /**
   * Create a new Eden agent
   */
  async createAgent(apiKey: string, agentData: {
    name: string;
    key: string;
    description: string;
    image: string;
    models?: Array<{
      lora: string;
      use_when?: string;
    }>;
    persona?: string;
    isPersonaPublic?: boolean;
    greeting?: string;
    knowledge?: string;
    voice?: string;
    suggestions?: Array<{
      label: string;
      prompt: string;
    }>;
    tools?: Record<string, boolean>;
    llm_settings?: {
      model_profile?: 'low' | 'medium' | 'high';
      thinking_policy?: 'auto' | 'off' | 'always';
      thinking_effort_cap?: 'low' | 'medium' | 'high';
      thinking_effort_instructions?: string;
    };
  }): Promise<EdenApiResponse<{ agentId: string; isExisting?: boolean }>> {
    const result = await this.makeRequest<{ agentId: string }>('/v2/agents', apiKey, {
      method: 'POST',
      body: agentData
    });

    // Handle 409 conflict - agent already exists
    if (!result.success && result.status === 409 && agentData.key) {
      console.log(`🔍 Agent with key "${agentData.key}" already exists, attempting to fetch existing agent...`);
      
      try {
        // Try to get the existing agent by key
        const existingAgent = await this.getAgentByKey(apiKey, agentData.key);
        
        if (existingAgent.success && existingAgent.data?.agentId) {
          console.log(`✅ Found existing agent: ${existingAgent.data.agentId}`);
          return {
            success: true,
            data: {
              agentId: existingAgent.data.agentId,
              isExisting: true  // Flag to indicate this was an existing agent
            },
            status: 200
          };
        }
      } catch (error) {
        console.warn('⚠️ Failed to fetch existing agent by key:', error);
      }
    }

    return result as EdenApiResponse<{ agentId: string; isExisting?: boolean }>;
  }

  /**
   * Get all agents (with optional pagination)
   */
  async getAllAgents(apiKey: string, options: { limit?: number; page?: number } = {}): Promise<EdenApiResponse<EdenAgentsResponse>> {
    const params = new URLSearchParams();
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.page) params.append('page', options.page.toString());
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.makeRequest<EdenAgentsResponse>(`/v2/agents${query}`, apiKey);
  }

  /**
   * Get agent details by ID
   */
  async getAgent(apiKey: string, agentId: string): Promise<EdenApiResponse<EdenAgent>> {
    return this.makeRequest<EdenAgent>(`/v2/agents/${agentId}`, apiKey);
  }

  /**
   * Get agent details by key (for finding existing agents)
   */
  async getAgentByKey(apiKey: string, key: string): Promise<EdenApiResponse<{ agentId: string }>> {
    try {
      // Get all agents and filter by key (Eden uses 'username' field as the key)
      const listResult = await this.makeRequest('/v2/agents', apiKey);
      
      if (listResult.success && listResult.data?.docs && Array.isArray(listResult.data.docs)) {
        const agent = listResult.data.docs.find((a: EdenAgent) => a.username === key);
        if (agent) {
          return {
            success: true,
            data: { agentId: agent._id },
            status: 200
          };
        }
      }
    } catch (error) {
      console.warn('Failed to list agents for key lookup:', error);
    }

    return {
      success: false,
      error: 'Agent not found by key',
      status: 404
    };
  }

  /**
   * Update an existing agent
   */
  async updateAgent(apiKey: string, agentId: string, updates: any): Promise<EdenApiResponse<any>> {
    return this.makeRequest(`/v2/agents/${agentId}`, apiKey, {
      method: 'PUT',
      body: updates
    });
  }

  /**
   * Delete an agent
   */
  async deleteAgent(apiKey: string, agentId: string): Promise<EdenApiResponse<any>> {
    return this.makeRequest(`/v2/agents/${agentId}`, apiKey, {
      method: 'DELETE'
    });
  }

  // ==============================================
  // TRIGGER MANAGEMENT
  // ==============================================

  /**
   * Create a trigger for an agent
   */
  async createTrigger(apiKey: string, agentId: string, triggerData: {
    agentId: string;
    instruction: string;
    session_type: string;
    session?: any;
    schedule?: string;
    posting_instructions?: string;
  }): Promise<EdenApiResponse<{ triggerId: string }>> {
    return this.makeRequest<{ triggerId: string }>(`/v2/agents/${agentId}/triggers`, apiKey, {
      method: 'POST',
      body: triggerData
    });
  }

  /**
   * Get triggers for an agent
   */
  async getTriggers(apiKey: string, agentId: string): Promise<EdenApiResponse<any[]>> {
    return this.makeRequest(`/v2/agents/${agentId}/triggers`, apiKey);
  }

  /**
   * Delete a trigger
   */
  async deleteTrigger(apiKey: string, agentId: string, triggerId: string): Promise<EdenApiResponse<any>> {
    return this.makeRequest(`/v2/agents/${agentId}/triggers/${triggerId}`, apiKey, {
      method: 'DELETE'
    });
  }

  // ==============================================
  // SESSION MANAGEMENT
  // ==============================================

  /**
   * Create a chat session
   */
  async createSession(apiKey: string, sessionData: {
    agentId: string;
    config?: any;
  }): Promise<EdenApiResponse<{ sessionId: string; data: any }>> {
    return this.makeRequest('/v2/sessions/create', apiKey, {
      method: 'POST',
      body: sessionData
    });
  }

  /**
   * Get session details
   */
  async getSession(apiKey: string, sessionId: string): Promise<EdenApiResponse<any>> {
    return this.makeRequest(`/v2/sessions/${sessionId}`, apiKey);
  }

  /**
   * Send message to session
   */
  async sendMessage(apiKey: string, sessionData: {
    sessionId: string;
    message: string;
  }): Promise<EdenApiResponse<any>> {
    return this.makeRequest('/v2/sessions', apiKey, {
      method: 'POST',
      body: sessionData
    });
  }

  // ==============================================
  // CREATIONS MANAGEMENT  
  // ==============================================

  /**
   * Get agent creations
   */
  async getAgentCreations(
    apiKey: string,
    agentId: string, 
    options: { limit?: number; page?: number } = {}
  ): Promise<EdenApiResponse<any>> {
    const params = new URLSearchParams();
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.page) params.append('page', options.page.toString());
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.makeRequest(`/v2/agents/${agentId}/creations${query}`, apiKey);
  }

  // ==============================================
  // HEALTH CHECK
  // ==============================================

  /**
   * Check if Eden API is accessible
   */
  async healthCheck(apiKey: string): Promise<EdenApiResponse<any>> {
    return this.makeRequest('/health', apiKey, { timeout: 5000 });
  }
}

// Create singleton instance
export const edenApi = new EdenApiClient();

// Export types for use in other files
export type { EdenApiResponse, EdenApiOptions };
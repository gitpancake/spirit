import { 
  createPublicClient, 
  http, 
  webSocket, 
  Log,
  PublicClient,
  decodeEventLog
} from 'viem';
import { sepolia } from 'viem/chains';
import { WebhookService } from './webhook-service';
import { AGENT_REGISTRY_ABI } from '../abi/AgentRegistry';
import { 
  AgentRegisteredEvent, 
  AgentDeregisteredEvent, 
  TokenURIUpdatedEvent,
  TrainerAddedEvent,
  TrainerRemovedEvent,
  TransferEvent,
  AgentCachePayload 
} from '../types/events';
import env from '../config/env';
import logger from '../utils/logger';

export class AgentRegistryListener {
  private httpClient: PublicClient;
  private wsClient: PublicClient | null = null;
  private webhookService: WebhookService;
  private isListening = false;
  private unsubscribeFunctions: Array<() => void> = [];
  
  constructor() {
    this.httpClient = createPublicClient({
      chain: sepolia,
      transport: http(env.RPC_HTTP_URL),
    });

    this.webhookService = new WebhookService();
  }

  public async startListening(): Promise<void> {
    if (this.isListening) {
      logger.warn('AgentRegistry listener is already running');
      return;
    }

    try {
      logger.info({ rpcUrl: env.RPC_URL }, 'Creating WebSocket client');
      
      this.wsClient = createPublicClient({
        chain: sepolia,
        transport: webSocket(env.RPC_URL, {
          keepAlive: true,
          onError: (error) => {
            logger.error({ error }, 'WebSocket connection error - crashing application');
            process.exit(1);
          },
          onClose: () => {
            logger.error('WebSocket connection closed - crashing application');
            process.exit(1);
          }
        }),
      });

      // Test the connection by getting latest block
      logger.info('Testing WebSocket connection...');
      await this.wsClient.getBlockNumber();
      logger.info('WebSocket connection test successful');

      logger.info('WebSocket client created, setting up event listeners');
      await this.setupEventListeners();
      this.isListening = true;
      logger.info({ 
        contractAddress: env.CONTRACT_ADDRESS,
        chainId: sepolia.id 
      }, 'Started listening to AgentRegistry events');
    } catch (error: any) {
      logger.error({ 
        error: error.message || error,
        stack: error.stack,
        details: error.details 
      }, 'Failed to start AgentRegistry listener');
      throw error;
    }
  }

  private async setupEventListeners(): Promise<void> {
    if (!this.wsClient) throw new Error('WebSocket client not initialized');

    // Listen to AgentRegistered events
    const unsubscribeAgentRegistered = this.wsClient.watchContractEvent({
      address: env.CONTRACT_ADDRESS as `0x${string}`,
      abi: AGENT_REGISTRY_ABI,
      eventName: 'AgentRegistered',
      onLogs: async (logs) => {
        await this.handleAgentRegisteredLogs(logs);
      },
      onError: (error) => {
        logger.error({ error }, 'Error watching AgentRegistered events - crashing application');
        process.exit(1);
      }
    });

    // Listen to AgentDeregistered events
    const unsubscribeAgentDeregistered = this.wsClient.watchContractEvent({
      address: env.CONTRACT_ADDRESS as `0x${string}`,
      abi: AGENT_REGISTRY_ABI,
      eventName: 'AgentDeregistered',
      onLogs: async (logs) => {
        await this.handleAgentDeregisteredLogs(logs);
      },
      onError: (error) => {
        logger.error({ error }, 'Error watching AgentDeregistered events - crashing application');
        process.exit(1);
      }
    });

    // Listen to TokenURIUpdated events
    const unsubscribeTokenURIUpdated = this.wsClient.watchContractEvent({
      address: env.CONTRACT_ADDRESS as `0x${string}`,
      abi: AGENT_REGISTRY_ABI,
      eventName: 'TokenURIUpdated',
      onLogs: async (logs) => {
        await this.handleTokenURIUpdatedLogs(logs);
      },
      onError: (error) => {
        logger.error({ error }, 'Error watching TokenURIUpdated events - crashing application');
        process.exit(1);
      }
    });

    // Listen to Transfer events (ownership changes)
    const unsubscribeTransfer = this.wsClient.watchContractEvent({
      address: env.CONTRACT_ADDRESS as `0x${string}`,
      abi: AGENT_REGISTRY_ABI,
      eventName: 'Transfer',
      onLogs: async (logs) => {
        await this.handleTransferLogs(logs);
      },
      onError: (error) => {
        logger.error({ error }, 'Error watching Transfer events - crashing application');
        process.exit(1);
      }
    });

    // Listen to TrainerAdded events
    const unsubscribeTrainerAdded = this.wsClient.watchContractEvent({
      address: env.CONTRACT_ADDRESS as `0x${string}`,
      abi: AGENT_REGISTRY_ABI,
      eventName: 'TrainerAdded',
      onLogs: async (logs) => {
        await this.handleTrainerAddedLogs(logs);
      },
      onError: (error) => {
        logger.error({ error }, 'Error watching TrainerAdded events - crashing application');
        process.exit(1);
      }
    });

    // Listen to TrainerRemoved events
    const unsubscribeTrainerRemoved = this.wsClient.watchContractEvent({
      address: env.CONTRACT_ADDRESS as `0x${string}`,
      abi: AGENT_REGISTRY_ABI,
      eventName: 'TrainerRemoved',
      onLogs: async (logs) => {
        await this.handleTrainerRemovedLogs(logs);
      },
      onError: (error) => {
        logger.error({ error }, 'Error watching TrainerRemoved events - crashing application');
        process.exit(1);
      }
    });

    this.unsubscribeFunctions = [
      unsubscribeAgentRegistered,
      unsubscribeAgentDeregistered,
      unsubscribeTokenURIUpdated,
      unsubscribeTransfer,
      unsubscribeTrainerAdded,
      unsubscribeTrainerRemoved
    ];

    logger.info('Setup all AgentRegistry event listeners');
  }

  private async handleAgentRegisteredLogs(logs: Log[]): Promise<void> {
    logger.info({ count: logs.length }, 'Received AgentRegistered events');

    for (const log of logs) {
      try {
        const decoded = decodeEventLog({
          abi: AGENT_REGISTRY_ABI,
          data: log.data,
          topics: log.topics,
        }) as any;

        const eventData = decoded.args as AgentRegisteredEvent;
        
        const payload: AgentCachePayload = {
          event: 'agent_registered',
          data: {
            tokenId: eventData.tokenId.toString(),
            owner: eventData.owner,
            metadataURI: eventData.metadataURI,
          },
          metadata: {
            blockNumber: log.blockNumber,
            blockHash: log.blockHash,
            transactionHash: log.transactionHash,
            logIndex: log.logIndex,
            timestamp: Date.now(),
            chainId: env.CHAIN_ID,
            contractAddress: env.CONTRACT_ADDRESS as `0x${string}`,
          }
        };

        await this.sendWebhook(payload, 'agent-registered');
        
        logger.info({ 
          tokenId: eventData.tokenId.toString(),
          owner: eventData.owner,
          metadataURI: eventData.metadataURI 
        }, 'Processed AgentRegistered event');

      } catch (error: any) {
        logger.error({ 
          error: error.message || error,
          stack: error.stack,
          details: error.details,
          log 
        }, 'Failed to process AgentRegistered event');
      }
    }
  }

  private async handleAgentDeregisteredLogs(logs: Log[]): Promise<void> {
    logger.info({ count: logs.length }, 'Received AgentDeregistered events');

    for (const log of logs) {
      try {
        const decoded = decodeEventLog({
          abi: AGENT_REGISTRY_ABI,
          data: log.data,
          topics: log.topics,
        }) as any;

        const eventData = decoded.args as AgentDeregisteredEvent;
        
        const payload: AgentCachePayload = {
          event: 'agent_deregistered',
          data: {
            tokenId: eventData.tokenId.toString(),
            metadataURI: eventData.metadataURI,
          },
          metadata: {
            blockNumber: log.blockNumber,
            blockHash: log.blockHash,
            transactionHash: log.transactionHash,
            logIndex: log.logIndex,
            timestamp: Date.now(),
            chainId: env.CHAIN_ID,
            contractAddress: env.CONTRACT_ADDRESS as `0x${string}`,
          }
        };

        await this.sendWebhook(payload, 'agent-deregistered');
        
        logger.info({ 
          tokenId: eventData.tokenId.toString(),
          metadataURI: eventData.metadataURI 
        }, 'Processed AgentDeregistered event');

      } catch (error) {
        logger.error({ error, log }, 'Failed to process AgentDeregistered event');
      }
    }
  }

  private async handleTokenURIUpdatedLogs(logs: Log[]): Promise<void> {
    logger.info({ count: logs.length }, 'Received TokenURIUpdated events');

    for (const log of logs) {
      try {
        const decoded = decodeEventLog({
          abi: AGENT_REGISTRY_ABI,
          data: log.data,
          topics: log.topics,
        }) as any;

        const eventData = decoded.args as TokenURIUpdatedEvent;
        
        const payload: AgentCachePayload = {
          event: 'token_uri_updated',
          data: {
            tokenId: eventData.tokenId.toString(),
            previousTokenURI: eventData.previousTokenURI,
            newTokenURI: eventData.newTokenURI,
          },
          metadata: {
            blockNumber: log.blockNumber,
            blockHash: log.blockHash,
            transactionHash: log.transactionHash,
            logIndex: log.logIndex,
            timestamp: Date.now(),
            chainId: env.CHAIN_ID,
            contractAddress: env.CONTRACT_ADDRESS as `0x${string}`,
          }
        };

        await this.sendWebhook(payload, 'token-uri-updated');
        
        logger.info({ 
          tokenId: eventData.tokenId.toString(),
          previousTokenURI: eventData.previousTokenURI,
          newTokenURI: eventData.newTokenURI 
        }, 'Processed TokenURIUpdated event');

      } catch (error) {
        logger.error({ error, log }, 'Failed to process TokenURIUpdated event');
      }
    }
  }

  private async handleTransferLogs(logs: Log[]): Promise<void> {
    logger.info({ count: logs.length }, 'Received Transfer events');

    for (const log of logs) {
      try {
        const decoded = decodeEventLog({
          abi: AGENT_REGISTRY_ABI,
          data: log.data,
          topics: log.topics,
        }) as any;

        const eventData = decoded.args as TransferEvent;
        
        // Skip minting transactions (handled by AgentRegistered)
        if (eventData.from === '0x0000000000000000000000000000000000000000') {
          continue;
        }

        const payload: AgentCachePayload = {
          event: 'transfer',
          data: {
            tokenId: eventData.tokenId.toString(),
            from: eventData.from,
            to: eventData.to,
          },
          metadata: {
            blockNumber: log.blockNumber,
            blockHash: log.blockHash,
            transactionHash: log.transactionHash,
            logIndex: log.logIndex,
            timestamp: Date.now(),
            chainId: env.CHAIN_ID,
            contractAddress: env.CONTRACT_ADDRESS as `0x${string}`,
          }
        };

        await this.sendWebhook(payload, 'transfer');
        
        logger.info({ 
          tokenId: eventData.tokenId.toString(),
          from: eventData.from,
          to: eventData.to 
        }, 'Processed Transfer event');

      } catch (error) {
        logger.error({ error, log }, 'Failed to process Transfer event');
      }
    }
  }

  private async handleTrainerAddedLogs(logs: Log[]): Promise<void> {
    logger.info({ count: logs.length }, 'Received TrainerAdded events');

    for (const log of logs) {
      try {
        const decoded = decodeEventLog({
          abi: AGENT_REGISTRY_ABI,
          data: log.data,
          topics: log.topics,
        }) as any;

        const eventData = decoded.args as TrainerAddedEvent;
        
        const payload: AgentCachePayload = {
          event: 'trainer_added',
          data: {
            tokenId: eventData.tokenId.toString(),
            trainer: eventData.trainer,
          },
          metadata: {
            blockNumber: log.blockNumber,
            blockHash: log.blockHash,
            transactionHash: log.transactionHash,
            logIndex: log.logIndex,
            timestamp: Date.now(),
            chainId: env.CHAIN_ID,
            contractAddress: env.CONTRACT_ADDRESS as `0x${string}`,
          }
        };

        await this.sendWebhook(payload, 'trainer-added');
        
        logger.info({ 
          tokenId: eventData.tokenId.toString(),
          trainer: eventData.trainer 
        }, 'Processed TrainerAdded event');

      } catch (error) {
        logger.error({ error, log }, 'Failed to process TrainerAdded event');
      }
    }
  }

  private async handleTrainerRemovedLogs(logs: Log[]): Promise<void> {
    logger.info({ count: logs.length }, 'Received TrainerRemoved events');

    for (const log of logs) {
      try {
        const decoded = decodeEventLog({
          abi: AGENT_REGISTRY_ABI,
          data: log.data,
          topics: log.topics,
        }) as any;

        const eventData = decoded.args as TrainerRemovedEvent;
        
        const payload: AgentCachePayload = {
          event: 'trainer_removed',
          data: {
            tokenId: eventData.tokenId.toString(),
            trainer: eventData.trainer,
          },
          metadata: {
            blockNumber: log.blockNumber,
            blockHash: log.blockHash,
            transactionHash: log.transactionHash,
            logIndex: log.logIndex,
            timestamp: Date.now(),
            chainId: env.CHAIN_ID,
            contractAddress: env.CONTRACT_ADDRESS as `0x${string}`,
          }
        };

        await this.sendWebhook(payload, 'trainer-removed');
        
        logger.info({ 
          tokenId: eventData.tokenId.toString(),
          trainer: eventData.trainer 
        }, 'Processed TrainerRemoved event');

      } catch (error) {
        logger.error({ error, log }, 'Failed to process TrainerRemoved event');
      }
    }
  }

  private async sendWebhook(payload: AgentCachePayload, eventType: string): Promise<void> {
    try {
      // Send to different webhook endpoints based on event type
      const webhookUrl = this.getWebhookUrl(eventType);
      await this.webhookService.sendWebhook(payload, webhookUrl);
    } catch (error: any) {
      logger.error({ 
        error: error.message || error,
        stack: error.stack,
        details: error.details,
        eventType,
        tokenId: payload.data.tokenId 
      }, 'Failed to send webhook');
      throw error;
    }
  }

  private getWebhookUrl(eventType: string): string {
    // You can customize this to route to different endpoints
    const baseUrl = env.WEBHOOK_URL.replace('/agent-registry', '');
    
    switch (eventType) {
      case 'agent-registered':
      case 'agent-deregistered':
      case 'token-uri-updated':
        return `${baseUrl}/cache-update`;
      case 'transfer':
        return `${baseUrl}/ownership-update`;
      case 'trainer-added':
      case 'trainer-removed':
        return `${baseUrl}/trainer-update`;
      default:
        return env.WEBHOOK_URL; // Fallback to default
    }
  }

  public async getLatestBlock(): Promise<bigint> {
    return await this.httpClient.getBlockNumber();
  }

  public async getHistoricalLogs(fromBlock: bigint, toBlock: bigint): Promise<Log[]> {
    try {
      const logs = await this.httpClient.getLogs({
        address: env.CONTRACT_ADDRESS as `0x${string}`,
        fromBlock,
        toBlock
      });

      logger.info({ 
        count: logs.length,
        fromBlock: fromBlock.toString(),
        toBlock: toBlock.toString()
      }, 'Retrieved historical AgentRegistry logs');

      return logs.sort((a, b) => {
        const blockDiff = Number(a.blockNumber) - Number(b.blockNumber);
        if (blockDiff !== 0) return blockDiff;
        return a.logIndex - b.logIndex;
      });
    } catch (error) {
      logger.error({ error, fromBlock, toBlock }, 'Failed to get historical logs');
      return [];
    }
  }

  public async stopListening(): Promise<void> {
    if (!this.isListening) return;

    logger.info('Stopping AgentRegistry listener');
    
    this.unsubscribeFunctions.forEach((unsubscribe, index) => {
      try {
        unsubscribe();
      } catch (error) {
        logger.error({ error, index }, 'Error unsubscribing from event');
      }
    });

    this.unsubscribeFunctions = [];
    
    if (this.wsClient) {
      this.wsClient = null;
    }

    this.isListening = false;
    logger.info('AgentRegistry listener stopped');
  }

  public get listening(): boolean {
    return this.isListening;
  }

  public getHttpClient(): PublicClient {
    return this.httpClient;
  }
}
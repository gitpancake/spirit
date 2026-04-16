import { Log, decodeEventLog } from 'viem';
import axios from 'axios';
import { AgentRegistryListener } from './agent-registry-listener';
import { WebhookService } from './webhook-service';
import { 
  AgentRegisteredEvent, 
  AgentDeregisteredEvent, 
  TokenURIUpdatedEvent,
  TransferEvent,
  TrainerAddedEvent,
  TrainerRemovedEvent,
  AgentCachePayload 
} from '../types/events';
import { AGENT_REGISTRY_ABI } from '../abi/AgentRegistry';
import env from '../config/env';
import logger from '../utils/logger';

export class AgentRegistrySyncService {
  private listener: AgentRegistryListener;
  private webhookService: WebhookService;
  private lastSyncedBlock: bigint = 0n;

  constructor() {
    this.listener = new AgentRegistryListener();
    this.webhookService = new WebhookService();
  }

  public async performInitialSync(): Promise<void> {
    if (!env.INITIAL_SYNC_ENABLED) {
      logger.info('Initial sync disabled, skipping');
      return;
    }

    try {
      logger.info('Starting contract-based sync for AgentRegistry');
      
      // Get all existing tokens from the contract
      const contractTokenIds = await this.getExistingTokensFromContract();
      
      if (contractTokenIds.length === 0) {
        logger.info('No tokens found in contract, skipping sync');
        return;
      }

      logger.info({ count: contractTokenIds.length }, 'Found tokens in contract, syncing...');
      
      // Sync each token from the contract
      await this.syncContractTokens(contractTokenIds);
      
      const latestBlock = await this.listener.getLatestBlock();
      this.lastSyncedBlock = latestBlock;

      logger.info({ 
        tokenCount: contractTokenIds.length,
        lastSyncedBlock: this.lastSyncedBlock.toString() 
      }, 'Contract-based sync completed');
    } catch (error: any) {
      logger.error({ 
        error: error.message || error,
        stack: error.stack,
        details: error.details 
      }, 'Initial sync failed');
      throw error;
    }
  }

  private async syncBlockRange(fromBlock: bigint, toBlock: bigint): Promise<void> {
    const blockRange = BigInt(env.INITIAL_SYNC_BLOCK_RANGE);
    let currentFrom = fromBlock;

    while (currentFrom <= toBlock) {
      const currentTo = currentFrom + blockRange - 1n > toBlock ? toBlock : currentFrom + blockRange - 1n;
      
      logger.info({ 
        from: currentFrom.toString(), 
        to: currentTo.toString() 
      }, 'Syncing block range');

      const logs = await this.listener.getHistoricalLogs(currentFrom, currentTo);
      await this.processHistoricalLogs(logs);

      currentFrom = currentTo + 1n;
      
      // Small delay to avoid overwhelming the RPC
      await this.sleep(100);
    }
  }

  private async processHistoricalLogs(logs: Log[]): Promise<void> {
    const eventPayloads: AgentCachePayload[] = [];

    for (const log of logs) {
      try {
        const payload = await this.processLog(log);
        if (payload) {
          eventPayloads.push(payload);
        }
      } catch (error) {
        logger.error({ error, log }, 'Failed to process historical log');
      }
    }

    // Send all events as batch
    if (eventPayloads.length > 0) {
      await this.sendBatchWebhooks(eventPayloads);
      logger.info({ count: eventPayloads.length }, 'Processed historical events');
    }
  }

  private async processLog(log: Log): Promise<AgentCachePayload | null> {
    try {
      const decoded = decodeEventLog({
        abi: AGENT_REGISTRY_ABI,
        data: log.data,
        topics: log.topics,
      }) as any;

      const eventName = decoded.eventName;
      const basePayload = {
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

      switch (eventName) {
        case 'AgentRegistered': {
          const eventData = decoded.args as AgentRegisteredEvent;
          return {
            event: 'agent_registered',
            data: {
              tokenId: eventData.tokenId.toString(),
              owner: eventData.owner,
              metadataURI: eventData.metadataURI,
            },
            ...basePayload
          };
        }

        case 'AgentDeregistered': {
          const eventData = decoded.args as AgentDeregisteredEvent;
          return {
            event: 'agent_deregistered',
            data: {
              tokenId: eventData.tokenId.toString(),
              metadataURI: eventData.metadataURI,
            },
            ...basePayload
          };
        }

        case 'TokenURIUpdated': {
          const eventData = decoded.args as TokenURIUpdatedEvent;
          return {
            event: 'token_uri_updated',
            data: {
              tokenId: eventData.tokenId.toString(),
              previousTokenURI: eventData.previousTokenURI,
              newTokenURI: eventData.newTokenURI,
            },
            ...basePayload
          };
        }

        case 'Transfer': {
          const eventData = decoded.args as TransferEvent;
          // Skip minting transactions
          if (eventData.from === '0x0000000000000000000000000000000000000000') {
            return null;
          }
          return {
            event: 'transfer',
            data: {
              tokenId: eventData.tokenId.toString(),
              from: eventData.from,
              to: eventData.to,
            },
            ...basePayload
          };
        }

        case 'TrainerAdded': {
          const eventData = decoded.args as TrainerAddedEvent;
          return {
            event: 'trainer_added',
            data: {
              tokenId: eventData.tokenId.toString(),
              trainer: eventData.trainer,
            },
            ...basePayload
          };
        }

        case 'TrainerRemoved': {
          const eventData = decoded.args as TrainerRemovedEvent;
          return {
            event: 'trainer_removed',
            data: {
              tokenId: eventData.tokenId.toString(),
              trainer: eventData.trainer,
            },
            ...basePayload
          };
        }

        default:
          logger.debug({ eventName }, 'Skipping unknown event');
          return null;
      }
    } catch (error) {
      logger.error({ error, log }, 'Failed to decode log');
      return null;
    }
  }

  private async sendBatchWebhooks(payloads: AgentCachePayload[]): Promise<void> {
    // Group payloads by event type for different webhook endpoints
    const grouped = payloads.reduce((acc, payload) => {
      const key = payload.event;
      if (!acc[key]) acc[key] = [];
      acc[key].push(payload);
      return acc;
    }, {} as Record<string, AgentCachePayload[]>);

    // Send to appropriate endpoints
    for (const [eventType, eventPayloads] of Object.entries(grouped)) {
      const webhookUrl = this.getWebhookUrl(eventType);
      
      for (const payload of eventPayloads) {
        try {
          await this.webhookService.sendWebhook(payload, webhookUrl);
        } catch (error) {
          logger.error({ 
            error, 
            eventType, 
            tokenId: payload.data.tokenId 
          }, 'Failed to send batch webhook');
        }
      }
    }
  }

  private getWebhookUrl(eventType: string): string {
    const baseUrl = env.WEBHOOK_URL.replace('/api/webhooks/agent-registry', '/api/webhooks');
    
    switch (eventType) {
      case 'agent_registered':
      case 'agent_deregistered':
      case 'token_uri_updated':
        return `${baseUrl}/cache-update`;
      case 'transfer':
        return `${baseUrl}/ownership-update`;
      case 'trainer_added':
      case 'trainer_removed':
        return `${baseUrl}/trainer-update`;
      default:
        return env.WEBHOOK_URL;
    }
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  public getLastSyncedBlock(): bigint {
    return this.lastSyncedBlock;
  }

  private async getExistingTokensFromContract(): Promise<string[]> {
    const client = this.listener.getHttpClient();
    const contractAddress = env.CONTRACT_ADDRESS as `0x${string}`;
    const existingTokens: string[] = [];

    try {
      // Get the current token ID from the contract
      logger.info('Reading currentTokenId from contract...');
      
      const currentTokenId = await client.readContract({
        address: contractAddress,
        abi: AGENT_REGISTRY_ABI,
        functionName: 'currentTokenId',
        args: []
      }) as bigint;
      
      logger.info({ currentTokenId: currentTokenId.toString() }, 'Found currentTokenId in contract');
      
      // Token IDs are typically 0-indexed, so if currentTokenId is 1, tokens 0 exists
      // But let's check if currentTokenId represents the next ID to mint or the last minted ID
      const maxTokenIdToCheck = currentTokenId;
      
      // Check each token ID from 0 to currentTokenId-1 (or currentTokenId depending on contract logic)
      for (let i = 0n; i < maxTokenIdToCheck; i++) {
        try {
          // Check if token exists by calling tokenURI
          await client.readContract({
            address: contractAddress,
            abi: AGENT_REGISTRY_ABI,
            functionName: 'tokenURI',
            args: [i]
          });
          
          existingTokens.push(i.toString());
          logger.info({ tokenId: i.toString() }, 'Found existing token');
        } catch (error: any) {
          // Token doesn't exist, skip
          logger.debug({ tokenId: i.toString(), error: error.message }, 'Token ID does not exist, skipping');
        }
      }
      
      // Also check the currentTokenId itself in case it's inclusive
      if (maxTokenIdToCheck >= 0n) {
        try {
          await client.readContract({
            address: contractAddress,
            abi: AGENT_REGISTRY_ABI,
            functionName: 'tokenURI',
            args: [maxTokenIdToCheck]
          });
          
          existingTokens.push(maxTokenIdToCheck.toString());
          logger.info({ tokenId: maxTokenIdToCheck.toString() }, 'Found existing token at currentTokenId');
        } catch (error: any) {
          logger.debug({ tokenId: maxTokenIdToCheck.toString() }, 'CurrentTokenId itself does not exist');
        }
      }

      logger.info({ count: existingTokens.length, tokens: existingTokens }, 'Found existing tokens in contract');
      return existingTokens;
      
    } catch (error: any) {
      logger.error({ 
        error: error.message,
        stack: error.stack 
      }, 'Failed to enumerate existing tokens');
      return [];
    }
  }

  private async getCachedTokenIds(): Promise<string[]> {
    try {
      // Get token IDs from your cache API
      const cacheApiUrl = env.CACHE_API_URL || env.WEBHOOK_URL.replace('/api/webhooks/agent-registry', '/api/cache/tokens');
      
      logger.info({ url: cacheApiUrl }, 'Fetching cached token IDs');
      
      const response = await axios.get(cacheApiUrl, {
        timeout: 10000,
        headers: {
          'User-Agent': 'contract-listener/1.0.0'
        }
      });

      const tokenIds = response.data.tokenIds || [];
      logger.info({ count: tokenIds.length }, 'Retrieved cached token IDs');
      
      return tokenIds;
    } catch (error: any) {
      logger.warn({ 
        error: error.message,
        status: error.response?.status 
      }, 'Failed to fetch cached token IDs, treating as empty cache');
      return [];
    }
  }

  private async syncContractTokens(tokenIds: string[]): Promise<void> {
    logger.info({ count: tokenIds.length }, 'Syncing tokens from contract');

    for (let i = 0; i < tokenIds.length; i++) {
      const tokenId = tokenIds[i];
      
      try {
        // Get current data from contract
        const contractData = await this.getTokenDataFromContract(tokenId);
        
        if (contractData) {
          // Send agent_registered event for initial sync
          const payload: AgentCachePayload = {
            event: 'agent_registered',
            data: {
              tokenId: tokenId,
              metadataURI: contractData.tokenURI,
              owner: contractData.owner
            },
            metadata: {
              blockNumber: BigInt(0), // Not from a specific block  
              blockHash: '0x',
              transactionHash: '0x',
              logIndex: 0,
              timestamp: Date.now(),
              chainId: env.CHAIN_ID,
              contractAddress: env.CONTRACT_ADDRESS as `0x${string}`,
            }
          };

          const webhookUrl = this.getWebhookUrl('agent_registered');
          await this.webhookService.sendWebhook(payload, webhookUrl);

          logger.info({ tokenId, tokenURI: contractData.tokenURI }, 'Synced token data');
        }

        // Small delay to avoid overwhelming the RPC
        if (i % 10 === 0 && i > 0) {
          await this.sleep(100);
        }

      } catch (error: any) {
        logger.error({ 
          error: error.message,
          tokenId 
        }, 'Failed to sync token data');
      }
    }
  }

  private async getTokenDataFromContract(tokenId: string): Promise<{tokenURI: string, owner: string} | null> {
    try {
      const client = this.listener.getHttpClient();
      
      // Call tokenURI and ownerOf functions
      const [tokenURI, owner] = await Promise.all([
        client.readContract({
          address: env.CONTRACT_ADDRESS as `0x${string}`,
          abi: AGENT_REGISTRY_ABI,
          functionName: 'tokenURI',
          args: [BigInt(tokenId)]
        }),
        client.readContract({
          address: env.CONTRACT_ADDRESS as `0x${string}`,
          abi: AGENT_REGISTRY_ABI,
          functionName: 'ownerOf',
          args: [BigInt(tokenId)]
        })
      ]);

      return {
        tokenURI: tokenURI as string,
        owner: owner as string
      };
    } catch (error: any) {
      if (error.message?.includes('ERC721: invalid token ID') || 
          error.message?.includes('ERC721NonexistentToken')) {
        logger.info({ tokenId }, 'Token no longer exists, should be removed from cache');
        
        // Send deregistered event
        const payload: AgentCachePayload = {
          event: 'agent_deregistered',
          data: {
            tokenId: tokenId,
          },
          metadata: {
            blockNumber: 0n,
            blockHash: '0x',
            transactionHash: '0x',
            logIndex: 0,
            timestamp: Date.now(),
            chainId: env.CHAIN_ID,
            contractAddress: env.CONTRACT_ADDRESS as `0x${string}`,
          }
        };

        const webhookUrl = this.getWebhookUrl('agent_deregistered');
        await this.webhookService.sendWebhook(payload, webhookUrl);
        
        return null;
      }
      
      throw error;
    }
  }
}
import { 
  createPublicClient, 
  createWebSocketPublicClient, 
  http, 
  webSocket, 
  parseAbiItem,
  Log,
  PublicClient,
  WebSocketPublicClient,
  Abi
} from 'viem';
import { mainnet } from 'viem/chains';
import { WebSocketManager } from './websocket-manager';
import { WebhookService, WebhookPayload } from './webhook-service';
import env from '../config/env';
import logger from '../utils/logger';

export class ContractListener {
  private httpClient: PublicClient;
  private wsClient: WebSocketPublicClient | null = null;
  private webhookService: WebhookService;
  private isListening = false;
  private unsubscribeFunctions: Array<() => void> = [];
  
  constructor(private contractAbi: Abi) {
    this.httpClient = createPublicClient({
      chain: mainnet,
      transport: http(env.RPC_HTTP_URL),
    });

    this.webhookService = new WebhookService();
  }

  public async startListening(): Promise<void> {
    if (this.isListening) {
      logger.warn('Contract listener is already running');
      return;
    }

    try {
      this.wsClient = createWebSocketPublicClient({
        chain: mainnet,
        transport: webSocket(env.RPC_URL),
      });

      await this.setupEventListeners();
      this.isListening = true;
      logger.info({ contractAddress: env.CONTRACT_ADDRESS }, 'Started listening to contract events');
    } catch (error) {
      logger.error({ error }, 'Failed to start contract listener');
      throw error;
    }
  }

  private async setupEventListeners(): Promise<void> {
    if (!this.wsClient) throw new Error('WebSocket client not initialized');

    const eventNames = this.getEventNamesFromAbi();
    
    for (const eventName of eventNames) {
      try {
        const unsubscribe = this.wsClient.watchContractEvent({
          address: env.CONTRACT_ADDRESS as `0x${string}`,
          abi: this.contractAbi,
          eventName: eventName as any,
          onLogs: async (logs: Log[]) => {
            await this.handleLogs(logs, eventName);
          },
          onError: (error) => {
            logger.error({ error, eventName }, 'Error watching contract event');
          }
        });

        this.unsubscribeFunctions.push(unsubscribe);
        logger.info({ eventName }, 'Setup event listener');
      } catch (error) {
        logger.error({ error, eventName }, 'Failed to setup event listener');
      }
    }
  }

  private getEventNamesFromAbi(): string[] {
    return this.contractAbi
      .filter((item: any) => item.type === 'event')
      .map((item: any) => item.name);
  }

  private async handleLogs(logs: Log[], eventName: string): Promise<void> {
    logger.info({ 
      count: logs.length, 
      eventName,
      blockNumbers: logs.map(log => log.blockNumber)
    }, 'Received contract events');

    const webhookPromises = logs.map(async (log) => {
      const payload: WebhookPayload = {
        event: eventName,
        contractAddress: env.CONTRACT_ADDRESS,
        blockNumber: Number(log.blockNumber),
        transactionHash: log.transactionHash,
        logIndex: log.logIndex,
        data: {
          args: log.args,
          topics: log.topics,
          data: log.data,
          address: log.address
        },
        timestamp: Date.now()
      };

      try {
        await this.webhookService.sendWebhook(payload);
      } catch (error) {
        logger.error({ 
          error,
          eventName,
          blockNumber: log.blockNumber,
          transactionHash: log.transactionHash
        }, 'Failed to send webhook for log');
      }
    });

    await Promise.allSettled(webhookPromises);
  }

  public async getLatestBlock(): Promise<bigint> {
    return await this.httpClient.getBlockNumber();
  }

  public async getLogs(fromBlock: bigint, toBlock: bigint): Promise<Log[]> {
    const eventNames = this.getEventNamesFromAbi();
    const allLogs: Log[] = [];

    for (const eventName of eventNames) {
      try {
        const logs = await this.httpClient.getLogs({
          address: env.CONTRACT_ADDRESS as `0x${string}`,
          event: parseAbiItem(`event ${this.getEventSignature(eventName)}`),
          fromBlock,
          toBlock
        });

        allLogs.push(...logs);
        logger.debug({ 
          eventName, 
          count: logs.length, 
          fromBlock: fromBlock.toString(),
          toBlock: toBlock.toString()
        }, 'Retrieved historical logs');
      } catch (error) {
        logger.error({ error, eventName, fromBlock, toBlock }, 'Failed to get historical logs');
      }
    }

    return allLogs.sort((a, b) => {
      const blockDiff = Number(a.blockNumber) - Number(b.blockNumber);
      if (blockDiff !== 0) return blockDiff;
      return a.logIndex - b.logIndex;
    });
  }

  private getEventSignature(eventName: string): string {
    const eventAbi = this.contractAbi.find(
      (item: any) => item.type === 'event' && item.name === eventName
    );
    
    if (!eventAbi) {
      throw new Error(`Event ${eventName} not found in ABI`);
    }

    const inputs = (eventAbi as any).inputs
      .map((input: any) => input.type)
      .join(',');
    
    return `${eventName}(${inputs})`;
  }

  public async stopListening(): Promise<void> {
    if (!this.isListening) return;

    logger.info('Stopping contract listener');
    
    this.unsubscribeFunctions.forEach(unsubscribe => {
      try {
        unsubscribe();
      } catch (error) {
        logger.error({ error }, 'Error unsubscribing from event');
      }
    });

    this.unsubscribeFunctions = [];
    
    if (this.wsClient) {
      // Close WebSocket connection if it exists
      this.wsClient = null;
    }

    this.isListening = false;
    logger.info('Contract listener stopped');
  }

  public get listening(): boolean {
    return this.isListening;
  }
}
import { Alchemy, Network } from 'alchemy-sdk';
import { ethers } from 'ethers';
import { config } from '../config/env';
import { createLogger } from '../config/logger';
import { MINTER_ABI } from '../contracts/abi';

const logger = createLogger('EventListener');

export interface SaleConfiguredEvent {
  manifestoId: bigint;
  saleId: bigint;
  price: bigint;
  startTime: bigint;
  endTime: bigint;
  transactionHash: string;
  blockNumber: number;
}

export type EventHandler = (event: SaleConfiguredEvent) => Promise<void>;

export class EventListener {
  private alchemy: Alchemy;
  private eventHandlers: EventHandler[] = [];
  private isListening = false;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 10;
  private readonly reconnectDelay = 5000; // 5 seconds

  constructor() {
    const network = this.getAlchemyNetwork(config.chainId);

    this.alchemy = new Alchemy({
      apiKey: config.alchemyApiKey,
      network,
    });

    logger.info({
      chainId: config.chainId,
      network: network,
      contractAddress: config.minterContractAddress,
      msg: 'Event listener initialized',
    });
  }

  private getAlchemyNetwork(chainId: number): Network {
    switch (chainId) {
      case 8453:
        return Network.BASE_MAINNET;
      case 84532:
        return Network.BASE_SEPOLIA;
      default:
        throw new Error(`Unsupported chain ID: ${chainId}`);
    }
  }

  /**
   * Register an event handler that will be called when SaleConfigured event is detected
   */
  public onSaleConfigured(handler: EventHandler): void {
    this.eventHandlers.push(handler);
    logger.debug('Event handler registered');
  }

  /**
   * Start listening for SaleConfigured events via WebSocket
   */
  public async start(): Promise<void> {
    if (this.isListening) {
      logger.warn('Event listener is already running');
      return;
    }

    this.isListening = true;
    await this.setupEventListener();
  }

  private async setupEventListener(): Promise<void> {
    try {
      const filter = {
        address: config.minterContractAddress,
        topics: [
          // SaleConfigured event signature
          ethers.id('SaleConfigured(uint256,uint256,uint256,uint256,uint256)'),
        ],
      };

      logger.info({
        msg: 'Starting WebSocket listener for SaleConfigured events',
        filter,
      });

      // Subscribe to events using Alchemy WebSocket
      this.alchemy.ws.on(filter, async (log) => {
        try {
          await this.handleLog(log);
        } catch (error) {
          logger.error({
            error: error instanceof Error ? error.message : String(error),
            msg: 'Error handling event log',
          });
        }
      });

      // Handle WebSocket errors
      this.alchemy.ws.on('error', (error) => {
        logger.error({
          error: error.message,
          msg: 'WebSocket error occurred',
        });
        this.handleDisconnection();
      });

      // Handle WebSocket close
      this.alchemy.ws.on('close', () => {
        logger.warn('WebSocket connection closed');
        this.handleDisconnection();
      });

      logger.info('WebSocket listener started successfully');
      this.reconnectAttempts = 0;
    } catch (error) {
      logger.error({
        error: error instanceof Error ? error.message : String(error),
        msg: 'Failed to setup event listener',
      });
      this.handleDisconnection();
    }
  }

  private async handleLog(log: any): Promise<void> {
    try {
      // Parse the event using ethers
      const iface = new ethers.Interface(MINTER_ABI);
      const parsedLog = iface.parseLog({
        topics: log.topics as string[],
        data: log.data,
      });

      if (!parsedLog) {
        logger.warn({ log, msg: 'Could not parse log' });
        return;
      }

      const event: SaleConfiguredEvent = {
        manifestoId: parsedLog.args[0],
        saleId: parsedLog.args[1],
        price: parsedLog.args[2],
        startTime: parsedLog.args[3],
        endTime: parsedLog.args[4],
        transactionHash: log.transactionHash,
        blockNumber: parseInt(log.blockNumber, 16),
      };

      logger.info({
        manifestoId: event.manifestoId.toString(),
        saleId: event.saleId.toString(),
        transactionHash: event.transactionHash,
        blockNumber: event.blockNumber,
        msg: 'SaleConfigured event detected',
      });

      // Call all registered event handlers
      await Promise.all(
        this.eventHandlers.map((handler) =>
          handler(event).catch((error) => {
            logger.error({
              error: error instanceof Error ? error.message : String(error),
              manifestoId: event.manifestoId.toString(),
              msg: 'Event handler failed',
            });
          })
        )
      );
    } catch (error) {
      logger.error({
        error: error instanceof Error ? error.message : String(error),
        log,
        msg: 'Error processing log',
      });
    }
  }

  private handleDisconnection(): void {
    if (!this.isListening) {
      return;
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error({
        attempts: this.reconnectAttempts,
        msg: 'Max reconnection attempts reached. Stopping listener.',
      });
      this.stop();
      process.exit(1);
    }

    this.reconnectAttempts++;
    logger.info({
      attempt: this.reconnectAttempts,
      maxAttempts: this.maxReconnectAttempts,
      delayMs: this.reconnectDelay,
      msg: 'Attempting to reconnect...',
    });

    setTimeout(() => {
      this.setupEventListener();
    }, this.reconnectDelay);
  }

  /**
   * Stop listening for events
   */
  public stop(): void {
    if (!this.isListening) {
      return;
    }

    logger.info('Stopping event listener');
    this.isListening = false;

    try {
      this.alchemy.ws.removeAllListeners();
    } catch (error) {
      logger.error({
        error: error instanceof Error ? error.message : String(error),
        msg: 'Error stopping listener',
      });
    }
  }
}

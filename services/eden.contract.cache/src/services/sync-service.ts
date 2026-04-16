import fs from 'fs/promises';
import path from 'path';
import { ContractListener } from './contract-listener';
import { WebhookService, WebhookPayload } from './webhook-service';
import env from '../config/env';
import logger from '../utils/logger';

interface SyncState {
  lastSyncedBlock: number;
  lastSyncTime: number;
}

export class SyncService {
  private syncStateFile: string;
  private webhookService: WebhookService;

  constructor(private contractListener: ContractListener) {
    this.syncStateFile = path.join(process.cwd(), '.sync-state.json');
    this.webhookService = new WebhookService();
  }

  private async loadSyncState(): Promise<SyncState | null> {
    try {
      const data = await fs.readFile(this.syncStateFile, 'utf-8');
      const state = JSON.parse(data) as SyncState;
      logger.info({ lastSyncedBlock: state.lastSyncedBlock }, 'Loaded sync state');
      return state;
    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        logger.info('No previous sync state found');
        return null;
      }
      logger.error({ error }, 'Failed to load sync state');
      return null;
    }
  }

  private async saveSyncState(state: SyncState): Promise<void> {
    try {
      await fs.writeFile(this.syncStateFile, JSON.stringify(state, null, 2));
      logger.debug({ lastSyncedBlock: state.lastSyncedBlock }, 'Saved sync state');
    } catch (error) {
      logger.error({ error }, 'Failed to save sync state');
    }
  }

  public async performInitialSync(): Promise<void> {
    if (!env.INITIAL_SYNC_ENABLED) {
      logger.info('Initial sync is disabled');
      return;
    }

    logger.info('Starting initial sync');

    try {
      const currentBlock = await this.contractListener.getLatestBlock();
      const syncState = await this.loadSyncState();
      
      let fromBlock: bigint;
      
      if (syncState) {
        fromBlock = BigInt(syncState.lastSyncedBlock + 1);
        logger.info({ 
          fromBlock: fromBlock.toString(),
          currentBlock: currentBlock.toString() 
        }, 'Resuming sync from last synced block');
      } else {
        fromBlock = env.CONTRACT_START_BLOCK ? BigInt(env.CONTRACT_START_BLOCK) : currentBlock - BigInt(1000);
        logger.info({ 
          fromBlock: fromBlock.toString(),
          currentBlock: currentBlock.toString() 
        }, 'Starting initial sync from configured start block');
      }

      if (fromBlock > currentBlock) {
        logger.info('Already synced to latest block');
        return;
      }

      await this.syncBlockRange(fromBlock, currentBlock);
      logger.info('Initial sync completed successfully');

    } catch (error) {
      logger.error({ error }, 'Initial sync failed');
      throw error;
    }
  }

  private async syncBlockRange(fromBlock: bigint, toBlock: bigint): Promise<void> {
    const totalBlocks = Number(toBlock - fromBlock);
    const blockRange = BigInt(env.INITIAL_SYNC_BLOCK_RANGE);
    
    logger.info({ 
      fromBlock: fromBlock.toString(),
      toBlock: toBlock.toString(),
      totalBlocks,
      blockRange: blockRange.toString()
    }, 'Syncing block range');

    let currentFrom = fromBlock;
    let processedBlocks = 0;

    while (currentFrom <= toBlock) {
      const currentTo = currentFrom + blockRange - BigInt(1);
      const actualTo = currentTo > toBlock ? toBlock : currentTo;

      try {
        await this.syncBatch(currentFrom, actualTo);
        
        processedBlocks += Number(actualTo - currentFrom + BigInt(1));
        const progress = Math.round((processedBlocks / totalBlocks) * 100);
        
        logger.info({ 
          fromBlock: currentFrom.toString(),
          toBlock: actualTo.toString(),
          progress: `${progress}%`,
          processedBlocks,
          totalBlocks
        }, 'Synced batch');

        await this.saveSyncState({
          lastSyncedBlock: Number(actualTo),
          lastSyncTime: Date.now()
        });

        currentFrom = actualTo + BigInt(1);

        if (currentFrom <= toBlock) {
          await this.sleep(100);
        }

      } catch (error) {
        logger.error({ 
          error,
          fromBlock: currentFrom.toString(),
          toBlock: actualTo.toString()
        }, 'Failed to sync batch');
        throw error;
      }
    }
  }

  private async syncBatch(fromBlock: bigint, toBlock: bigint): Promise<void> {
    const logs = await this.contractListener.getLogs(fromBlock, toBlock);
    
    if (logs.length === 0) {
      return;
    }

    logger.info({ 
      count: logs.length,
      fromBlock: fromBlock.toString(),
      toBlock: toBlock.toString()
    }, 'Processing historical logs');

    const webhookPayloads: WebhookPayload[] = logs.map(log => ({
      event: 'HistoricalSync',
      contractAddress: env.CONTRACT_ADDRESS,
      blockNumber: Number(log.blockNumber),
      transactionHash: log.transactionHash,
      logIndex: log.logIndex,
      data: {
        args: log.args,
        topics: log.topics,
        data: log.data,
        address: log.address,
        isHistorical: true
      },
      timestamp: Date.now()
    }));

    await this.webhookService.sendBatchWebhooks(webhookPayloads);
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  public async cleanup(): Promise<void> {
    logger.info('Cleaning up sync service');
  }
}
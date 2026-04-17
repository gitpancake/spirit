import { ethers } from 'ethers';
import { config } from '../config/env';
import { createLogger } from '../config/logger';
import { MINTER_ABI, MINTER_ABI_V1 } from '../contracts/abi';

const logger = createLogger('Distributor');

export interface DistributionResult {
  success: boolean;
  manifestoId: bigint;
  transactionHash?: string;
  error?: string;
  gasUsed?: bigint;
}

export class Distributor {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private contract: ethers.Contract;
  private v2Contract: ethers.Contract | null;
  private v1Contract: ethers.Contract | null;
  private readonly batchSize = 200; // MAX_BATCH_SIZE from contract

  constructor() {
    // Initialize provider
    this.provider = new ethers.JsonRpcProvider(config.rpcUrl);

    // Initialize wallet
    this.wallet = new ethers.Wallet(config.distributorPrivateKey, this.provider);

    // Initialize V3 contract (for events, distribution, and V3 subscribers)
    this.contract = new ethers.Contract(config.minterContractAddress, MINTER_ABI, this.wallet);

    // Initialize V2 contract (optional, for V2 subscribers - read-only)
    this.v2Contract = config.subscribersAddressV2
      ? new ethers.Contract(config.subscribersAddressV2, MINTER_ABI, this.provider)
      : null;

    // Initialize V1 contract (optional, for legacy subscribers - read-only)
    this.v1Contract = config.subscribersAddressV1
      ? new ethers.Contract(config.subscribersAddressV1, MINTER_ABI_V1, this.provider)
      : null;

    logger.info({
      v3ContractAddress: config.minterContractAddress,
      v2ContractAddress: config.subscribersAddressV2 || 'Not configured',
      v1ContractAddress: config.subscribersAddressV1 || 'Not configured',
      walletAddress: this.wallet.address,
      chainId: config.chainId,
      msg: 'Distributor initialized',
    });
  }

  /**
   * Get all active subscribers from the V3 contract (minter contract)
   */
  private async getV3Subscribers(): Promise<string[]> {
    try {
      const totalSubscribers = await this.contract.getTotalSubscriberCount();
      logger.info({
        totalSubscribers: totalSubscribers.toString(),
        msg: 'Fetching V3 active subscribers',
      });

      const allSubscribers: string[] = [];
      let start = 0;

      // Fetch subscribers in batches
      while (start < totalSubscribers) {
        const end = Math.min(start + this.batchSize, Number(totalSubscribers));

        const [addresses, count] = await this.contract.getActiveSubscribersBatch(start, end);

        logger.debug({
          start,
          end,
          count: count.toString(),
          msg: 'Fetched V3 subscriber batch',
        });

        allSubscribers.push(...addresses);
        start = end;
      }

      logger.info({
        v3ActiveSubscribers: allSubscribers.length,
        msg: 'V3 active subscribers fetched',
      });

      return allSubscribers;
    } catch (error) {
      logger.error({
        error: error instanceof Error ? error.message : String(error),
        msg: 'Error fetching V3 active subscribers',
      });
      throw error;
    }
  }

  /**
   * Get all active subscribers from the V2 contract
   */
  private async getV2Subscribers(): Promise<string[]> {
    if (!this.v2Contract) {
      logger.info('No V2 contract configured, skipping V2 subscribers');
      return [];
    }

    try {
      const totalSubscribers = await this.v2Contract.getTotalSubscriberCount();
      logger.info({
        totalSubscribers: totalSubscribers.toString(),
        msg: 'Fetching V2 active subscribers',
      });

      const allSubscribers: string[] = [];
      let start = 0;

      // Fetch subscribers in batches
      while (start < totalSubscribers) {
        const end = Math.min(start + this.batchSize, Number(totalSubscribers));

        const [addresses, count] = await this.v2Contract.getActiveSubscribersBatch(start, end);

        logger.debug({
          start,
          end,
          count: count.toString(),
          msg: 'Fetched V2 subscriber batch',
        });

        allSubscribers.push(...addresses);
        start = end;
      }

      logger.info({
        v2ActiveSubscribers: allSubscribers.length,
        msg: 'V2 active subscribers fetched',
      });

      return allSubscribers;
    } catch (error) {
      logger.error({
        error: error instanceof Error ? error.message : String(error),
        msg: 'Error fetching V2 subscribers, continuing without V2',
      });
      // Don't throw - continue without V2 subscribers
      return [];
    }
  }

  /**
   * Get all active subscribers from the V1 contract (legacy support)
   */
  private async getV1Subscribers(): Promise<string[]> {
    if (!this.v1Contract) {
      logger.info('No V1 contract configured, skipping V1 subscribers');
      return [];
    }

    try {
      const totalSubscribers = await this.v1Contract.getTotalSubscriberCount();
      logger.info({
        totalSubscribers: totalSubscribers.toString(),
        msg: 'Fetching V1 active subscribers',
      });

      const allSubscribers: string[] = [];
      let start = 0;

      // Fetch subscribers in batches
      while (start < totalSubscribers) {
        const end = Math.min(start + this.batchSize, Number(totalSubscribers));

        const [addresses, count] = await this.v1Contract.getActiveSubscribersBatch(start, end);

        logger.debug({
          start,
          end,
          count: count.toString(),
          msg: 'Fetched V1 subscriber batch',
        });

        allSubscribers.push(...addresses);
        start = end;
      }

      logger.info({
        v1ActiveSubscribers: allSubscribers.length,
        msg: 'V1 active subscribers fetched',
      });

      return allSubscribers;
    } catch (error) {
      logger.error({
        error: error instanceof Error ? error.message : String(error),
        msg: 'Error fetching V1 subscribers, continuing with V2 only',
      });
      // Don't throw - continue with V2 subscribers only
      return [];
    }
  }

  /**
   * Get combined active subscribers from V1, V2, and V3 contracts
   * Does NOT deduplicate - same address can appear multiple times if subscribed to multiple contracts
   */
  private async getAllActiveSubscribers(): Promise<string[]> {
    try {
      logger.info('Fetching subscribers from V1, V2, and V3 contracts');

      // Fetch from all contracts in parallel for efficiency
      const [v1Subscribers, v2Subscribers, v3Subscribers] = await Promise.all([
        this.getV1Subscribers(),
        this.getV2Subscribers(),
        this.getV3Subscribers(),
      ]);

      // Combine WITHOUT deduplication - allow same address to receive multiple times
      const combined = [...v1Subscribers, ...v2Subscribers, ...v3Subscribers];

      logger.info({
        v1Count: v1Subscribers.length,
        v2Count: v2Subscribers.length,
        v3Count: v3Subscribers.length,
        totalCount: combined.length,
        msg: 'Combined subscriber lists from V1, V2, and V3 (duplicates allowed)',
      });

      return combined;
    } catch (error) {
      logger.error({
        error: error instanceof Error ? error.message : String(error),
        msg: 'Error fetching combined subscriber list',
      });
      throw error;
    }
  }

  /**
   * Get all manifesto IDs across all configured contracts by iterating their sales
   * Returns deduplicated, sorted ascending list of manifesto IDs
   */
  public async getAllManifestoIds(): Promise<bigint[]> {
    const manifestoIds = new Set<bigint>();

    const collectFromContract = async (
      contract: ethers.Contract,
      label: string,
      startSaleId: number
    ) => {
      try {
        const nextSaleId = await contract.nextSaleId();
        logger.info({
          contract: label,
          nextSaleId: nextSaleId.toString(),
          startSaleId,
          msg: `Enumerating sales from ${label}`,
        });

        for (let i = BigInt(startSaleId); i < nextSaleId; i++) {
          try {
            const sale = await contract.getSale(i);
            if (sale.exists) {
              manifestoIds.add(sale.manifestoId);
            }
          } catch {
            // Sale might not exist at this index, skip
          }
        }
      } catch (error) {
        logger.error({
          contract: label,
          error: error instanceof Error ? error.message : String(error),
          msg: `Error enumerating sales from ${label}`,
        });
      }
    };

    // Collect from all contracts in parallel
    const tasks: Promise<void>[] = [];

    // Active contract (V2) - sale IDs start at 10
    tasks.push(collectFromContract(this.contract, 'V2 (active)', 10));

    // V1 contract - sale IDs start at 0
    if (this.v1Contract) {
      tasks.push(collectFromContract(this.v1Contract, 'V1', 0));
    }

    // V2/V3 subscriber contract - sale IDs start at 10
    if (this.v2Contract) {
      tasks.push(collectFromContract(this.v2Contract, 'V3 (subscribers)', 10));
    }

    await Promise.all(tasks);

    const sorted = Array.from(manifestoIds).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));

    logger.info({
      totalManifestoIds: sorted.length,
      range: sorted.length > 0 ? `${sorted[0]} - ${sorted[sorted.length - 1]}` : 'none',
      msg: 'Collected all manifesto IDs across contracts',
    });

    return sorted;
  }

  /**
   * Get the latest manifesto ID from the active contract
   * This queries the most recent sale to find the current manifestoId
   */
  public async getLatestManifestoId(): Promise<bigint | null> {
    try {
      // Get next sale ID to calculate the most recent one
      const nextSaleId = await this.contract.nextSaleId();

      if (nextSaleId === 0n) {
        logger.warn('No sales have been created yet');
        return null;
      }

      // Most recent sale ID is nextSaleId - 1
      const latestSaleId = nextSaleId - 1n;

      // Get sale details
      const sale = await this.contract.getSale(latestSaleId);

      if (!sale.exists) {
        logger.warn({
          saleId: latestSaleId.toString(),
          msg: 'Latest sale does not exist',
        });
        return null;
      }

      const manifestoId = sale.manifestoId;

      logger.info({
        saleId: latestSaleId.toString(),
        manifestoId: manifestoId.toString(),
        msg: 'Retrieved latest manifesto ID',
      });

      return manifestoId;
    } catch (error) {
      logger.error({
        error: error instanceof Error ? error.message : String(error),
        msg: 'Error getting latest manifesto ID',
      });
      throw error;
    }
  }

  /**
   * Execute distribution for a manifesto to all active subscribers
   */
  public async distribute(manifestoId: bigint): Promise<DistributionResult> {
    try {
      logger.info({
        manifestoId: manifestoId.toString(),
        msg: 'Starting distribution process',
      });

      // Get active subscribers from both V1 and V2 contracts
      const subscribers = await this.getAllActiveSubscribers();

      if (subscribers.length === 0) {
        logger.warn({
          manifestoId: manifestoId.toString(),
          msg: 'No active subscribers found',
        });
        return {
          success: false,
          manifestoId,
          error: 'No active subscribers',
        };
      }

      // Estimate gas
      logger.debug({
        manifestoId: manifestoId.toString(),
        subscriberCount: subscribers.length,
        msg: 'Estimating gas for distribution',
      });

      // Prepare transaction options
      const txOptions: any = {
        gasLimit: config.gasLimit,
      };

      if (config.maxFeePerGas) {
        txOptions.maxFeePerGas = config.maxFeePerGas;
      }

      if (config.maxPriorityFeePerGas) {
        txOptions.maxPriorityFeePerGas = config.maxPriorityFeePerGas;
      }

      // Execute distribution in batches
      const results: ethers.ContractTransactionResponse[] = [];

      for (let i = 0; i < subscribers.length; i += this.batchSize) {
        const batch = subscribers.slice(i, Math.min(i + this.batchSize, subscribers.length));

        logger.info({
          manifestoId: manifestoId.toString(),
          batchIndex: Math.floor(i / this.batchSize),
          batchSize: batch.length,
          msg: 'Distributing to batch',
        });

        const tx = await this.contract.distributeToSubscribersBatch(batch, manifestoId, txOptions);

        logger.info({
          manifestoId: manifestoId.toString(),
          transactionHash: tx.hash,
          msg: 'Distribution transaction submitted',
        });

        // Wait for confirmation
        const receipt = await tx.wait();

        logger.info({
          manifestoId: manifestoId.toString(),
          transactionHash: receipt.hash,
          blockNumber: receipt.blockNumber,
          gasUsed: receipt.gasUsed.toString(),
          status: receipt.status === 1 ? 'success' : 'failed',
          msg: 'Distribution transaction confirmed',
        });

        results.push(tx);
      }

      const lastReceipt = await results[results.length - 1].wait();

      return {
        success: true,
        manifestoId,
        transactionHash: lastReceipt?.hash,
        gasUsed: lastReceipt?.gasUsed,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      logger.error({
        error: errorMessage,
        manifestoId: manifestoId.toString(),
        msg: 'Distribution failed',
      });

      return {
        success: false,
        manifestoId,
        error: errorMessage,
      };
    }
  }

  /**
   * Get wallet balance
   */
  public async getBalance(): Promise<bigint> {
    try {
      const balance = await this.provider.getBalance(this.wallet.address);
      return balance;
    } catch (error) {
      logger.error({
        error: error instanceof Error ? error.message : String(error),
        msg: 'Error fetching wallet balance',
      });
      throw error;
    }
  }

  /**
   * Get current gas price
   */
  public async getGasPrice(): Promise<bigint> {
    try {
      const feeData = await this.provider.getFeeData();
      return feeData.gasPrice || 0n;
    } catch (error) {
      logger.error({
        error: error instanceof Error ? error.message : String(error),
        msg: 'Error fetching gas price',
      });
      throw error;
    }
  }
}

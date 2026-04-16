import { ethers } from 'ethers';
import { config } from '../config/env';
import { createLogger } from '../config/logger';
import { MINTER_ABI } from '../contracts/abi';

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
  private readonly batchSize = 200; // MAX_BATCH_SIZE from contract

  constructor() {
    // Initialize provider
    this.provider = new ethers.JsonRpcProvider(config.rpcUrl);

    // Initialize wallet
    this.wallet = new ethers.Wallet(config.distributorPrivateKey, this.provider);

    // Initialize contract
    this.contract = new ethers.Contract(
      config.minterContractAddress,
      MINTER_ABI,
      this.wallet
    );

    logger.info({
      contractAddress: config.minterContractAddress,
      walletAddress: this.wallet.address,
      chainId: config.chainId,
      msg: 'Distributor initialized',
    });
  }

  /**
   * Check if a manifesto has already been distributed
   */
  public async isDistributed(manifestoId: bigint): Promise<boolean> {
    try {
      const distributed = await this.contract.distributed(manifestoId);
      logger.debug({
        manifestoId: manifestoId.toString(),
        distributed,
        msg: 'Checked distribution status',
      });
      return distributed;
    } catch (error) {
      logger.error({
        error: error instanceof Error ? error.message : String(error),
        manifestoId: manifestoId.toString(),
        msg: 'Error checking distribution status',
      });
      throw error;
    }
  }

  /**
   * Get all active subscribers from the contract
   */
  private async getActiveSubscribers(): Promise<string[]> {
    try {
      const totalSubscribers = await this.contract.getTotalSubscriberCount();
      logger.info({
        totalSubscribers: totalSubscribers.toString(),
        msg: 'Fetching active subscribers',
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
          msg: 'Fetched subscriber batch',
        });

        allSubscribers.push(...addresses);
        start = end;
      }

      logger.info({
        activeSubscribers: allSubscribers.length,
        msg: 'Active subscribers fetched',
      });

      return allSubscribers;
    } catch (error) {
      logger.error({
        error: error instanceof Error ? error.message : String(error),
        msg: 'Error fetching active subscribers',
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

      // Check if already distributed
      const alreadyDistributed = await this.isDistributed(manifestoId);
      if (alreadyDistributed) {
        logger.info({
          manifestoId: manifestoId.toString(),
          msg: 'Manifesto already distributed, skipping',
        });
        return {
          success: false,
          manifestoId,
          error: 'Already distributed',
        };
      }

      // Get active subscribers
      const subscribers = await this.getActiveSubscribers();

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

        const tx = await this.contract.distributeToSubscribersBatch(
          batch,
          manifestoId,
          txOptions
        );

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

        // If first batch succeeded, the manifesto is marked as distributed
        // No need to continue if we only needed to mark it
        if (i === 0) {
          break;
        }
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

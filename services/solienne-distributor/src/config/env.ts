import dotenv from 'dotenv';
import { ethers } from 'ethers';

dotenv.config();

export interface AppConfig {
  nodeEnv: 'development' | 'production';
  chainId: number;
  rpcUrl: string;
  alchemyApiKey: string;
  minterContractAddress: string;
  distributorPrivateKey: string;
  pollIntervalMs: number;
  maxRetries: number;
  retryDelayMs: number;
  gasLimit: number;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
  logLevel: string;
  logPretty: boolean;
}

class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new ConfigurationError(
      `Missing required environment variable: ${key}. Please check your .env file.`
    );
  }
  return value;
}

function getOptionalEnv(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue;
}

function validatePrivateKey(privateKey: string): string {
  try {
    // Ensure it starts with 0x
    const formattedKey = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;

    // Validate it's a valid private key
    new ethers.Wallet(formattedKey);

    return formattedKey;
  } catch (error) {
    throw new ConfigurationError(
      'Invalid DISTRIBUTOR_PRIVATE_KEY. Please provide a valid Ethereum private key.'
    );
  }
}

function validateAddress(address: string, fieldName: string): string {
  if (!ethers.isAddress(address)) {
    throw new ConfigurationError(
      `Invalid ${fieldName}: ${address}. Please provide a valid Ethereum address.`
    );
  }
  return ethers.getAddress(address); // Returns checksummed address
}

function validateChainId(chainId: number): void {
  const validChainIds = [8453, 84532]; // Base Mainnet, Base Sepolia
  if (!validChainIds.includes(chainId)) {
    throw new ConfigurationError(
      `Invalid CHAIN_ID: ${chainId}. Supported chains: 8453 (Base Mainnet), 84532 (Base Sepolia)`
    );
  }
}

function parseGwei(value: string | undefined): bigint | undefined {
  if (!value) return undefined;
  try {
    return ethers.parseUnits(value, 'gwei');
  } catch (error) {
    throw new ConfigurationError(
      `Invalid gas price format: ${value}. Please provide a number in gwei (e.g., "20")`
    );
  }
}

export function loadConfig(): AppConfig {
  try {
    // Node environment
    const nodeEnv = getOptionalEnv('NODE_ENV', 'development') as 'development' | 'production';

    // Network configuration
    const chainId = parseInt(getRequiredEnv('CHAIN_ID'), 10);
    validateChainId(chainId);

    const rpcUrl = getRequiredEnv('RPC_URL');
    const alchemyApiKey = getRequiredEnv('ALCHEMY_API_KEY');

    // Contract addresses
    const minterContractAddress = validateAddress(
      getRequiredEnv('MINTER_CONTRACT_ADDRESS'),
      'MINTER_CONTRACT_ADDRESS'
    );

    // Wallet configuration
    const distributorPrivateKey = validatePrivateKey(
      getRequiredEnv('DISTRIBUTOR_PRIVATE_KEY')
    );

    // Monitoring configuration
    const pollIntervalMs = parseInt(getOptionalEnv('POLL_INTERVAL_MS', '5000'), 10);
    const maxRetries = parseInt(getOptionalEnv('MAX_RETRIES', '3'), 10);
    const retryDelayMs = parseInt(getOptionalEnv('RETRY_DELAY_MS', '2000'), 10);

    // Gas configuration
    const gasLimit = parseInt(getOptionalEnv('GAS_LIMIT', '500000'), 10);
    const maxFeePerGas = parseGwei(process.env.MAX_FEE_PER_GAS);
    const maxPriorityFeePerGas = parseGwei(process.env.MAX_PRIORITY_FEE_PER_GAS);

    // Logging configuration
    const logLevel = getOptionalEnv('LOG_LEVEL', 'info');
    const logPretty = getOptionalEnv('LOG_PRETTY', 'true') === 'true';

    const config: AppConfig = {
      nodeEnv,
      chainId,
      rpcUrl,
      alchemyApiKey,
      minterContractAddress,
      distributorPrivateKey,
      pollIntervalMs,
      maxRetries,
      retryDelayMs,
      gasLimit,
      maxFeePerGas,
      maxPriorityFeePerGas,
      logLevel,
      logPretty,
    };

    return config;
  } catch (error) {
    if (error instanceof ConfigurationError) {
      console.error(`\n❌ Configuration Error: ${error.message}\n`);
      console.error('Please ensure all required environment variables are set in your .env file.');
      console.error('See .env.example for reference.\n');
    } else {
      console.error('Unexpected error loading configuration:', error);
    }
    process.exit(1);
  }
}

export const config = loadConfig();

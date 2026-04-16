import { Address } from 'viem';

// AgentRegistry Event Types
export interface AgentRegisteredEvent {
  tokenId: bigint;
  owner: Address;
  metadataURI: string;
}

export interface AgentDeregisteredEvent {
  tokenId: bigint;
  metadataURI: string;
}

export interface TokenURIUpdatedEvent {
  tokenId: bigint;
  previousTokenURI: string;
  newTokenURI: string;
}

export interface TrainerAddedEvent {
  tokenId: bigint;
  trainer: Address;
}

export interface TrainerRemovedEvent {
  tokenId: bigint;
  trainer: Address;
}

export interface TransferEvent {
  from: Address;
  to: Address;
  tokenId: bigint;
}

// Webhook payload types
export interface WebhookPayload {
  event: string;
  data: any;
  metadata: {
    blockNumber: bigint;
    blockHash: string;
    transactionHash: string;
    logIndex: number;
    timestamp: number;
    chainId: number;
    contractAddress: Address;
  };
}

// Cache-specific webhook payloads
export interface AgentCachePayload extends WebhookPayload {
  event: 'agent_registered' | 'agent_deregistered' | 'token_uri_updated' | 'transfer' | 'trainer_added' | 'trainer_removed';
  data: {
    tokenId: string;
    owner?: string;
    metadataURI?: string;
    previousTokenURI?: string;
    newTokenURI?: string;
    from?: string;
    to?: string;
    trainer?: string;
  };
}
/* eslint-disable @typescript-eslint/no-explicit-any */
import { getPublicClient } from 'wagmi/actions';
import { GovernorAbi } from './abi';
import { ADDR } from './addresses';
import { decodeFunctionData, type Address, type Hex } from 'viem';

// Basic ABI registry for decoding known contract calls
const ABI_REGISTRY: Record<string, any> = {
  // Add target contract ABIs here as needed
  // Example: '0x1234...': SomeContractAbi,
};

export interface Proposal {
  id: bigint;
  proposer: `0x${string}`;
  description: string;
  targets: Address[];
  values: bigint[];
  calldatas: Hex[];
  startBlock: bigint;
  endBlock: bigint;
}

export async function fetchProposals(config: any): Promise<Proposal[]> {
  try {
    const client = getPublicClient(config);
    if (!client) throw new Error('Public client not available');
    
    const proposalCreatedEvent = GovernorAbi.find(
      (item) => item.type === 'event' && item.name === 'ProposalCreated'
    );
    
    if (!proposalCreatedEvent) throw new Error('ProposalCreated event not found in ABI');
    
    const logs = await client.getLogs({
      address: ADDR.governor,
      event: proposalCreatedEvent,
      fromBlock: 'earliest',
      toBlock: 'latest',
    });
    
    const proposals = logs.map((log: any) => ({
      id: log.args.proposalId as bigint,
      proposer: log.args.proposer as `0x${string}`,
      description: log.args.description as string,
      targets: log.args.targets as Address[],
      values: log.args.values as bigint[],
      calldatas: log.args.calldatas as Hex[],
      startBlock: log.args.startBlock as bigint,
      endBlock: log.args.endBlock as bigint,
    }));
    
    // Return most recent first
    return proposals.reverse();
  } catch (error) {
    console.error('Error fetching proposals:', error);
    return [];
  }
}

export function decodeAction(target: Address, calldata: Hex) {
  const abi = ABI_REGISTRY[target.toLowerCase()];
  if (!abi) {
    // Return function selector for unknown functions
    const selector = calldata.slice(0, 10); // First 4 bytes (0x + 8 hex chars)
    return { 
      fn: 'unknown', 
      args: [], 
      display: `Unknown function ${selector} (${calldata.length - 2} bytes)`,
    };
  }
  
  try {
    const { functionName, args } = decodeFunctionData({ abi, data: calldata });
    return { 
      fn: functionName, 
      args,
      display: `${functionName}(${args?.map((arg) => `${arg}`).join(', ') || ''})`,
    };
  } catch {
    const selector = calldata.slice(0, 10);
    return { 
      fn: 'decode-error', 
      args: [],
      display: `Failed to decode ${selector}`,
    };
  }
}

export function formatProposalActions(proposal: Proposal) {
  return proposal.targets.map((target, index) => {
    const decoded = decodeAction(target, proposal.calldatas[index]);
    return {
      target: target,
      value: proposal.values[index],
      decoded,
      display: `${target}: ${decoded.display}${proposal.values[index] > BigInt(0) ? ` (${proposal.values[index]} wei)` : ''}`,
    };
  });
}
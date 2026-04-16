/* eslint-disable @typescript-eslint/no-explicit-any */
import { writeContract, readContract } from 'wagmi/actions';
import { encodeFunctionData, keccak256, toBytes, type Address, type Hex } from 'viem';
import { ADDR } from './addresses';
import { GovernorAbi, ERC20VotesAbi } from './abi';

export async function delegateToSelf(config: any, user: `0x${string}`) {
  return writeContract(config, {
    address: ADDR.token, abi: ERC20VotesAbi, functionName: 'delegate', args: [user],
  });
}

export async function delegateTo(config: any, delegatee: `0x${string}`) {
  return writeContract(config, {
    address: ADDR.token, abi: ERC20VotesAbi, functionName: 'delegate', args: [delegatee],
  });
}

export function encodeAction(abi: any, fn: string, args: any[], target: Address) {
  const data = encodeFunctionData({ abi, functionName: fn, args });
  return { targets: [target], values: [BigInt(0)], calldatas: [data as Hex] };
}

export async function propose(config: any, p: {
  targets: Address[], values: bigint[], calldatas: Hex[], description: string
}) {
  return writeContract(config, {
    address: ADDR.governor, abi: GovernorAbi, functionName: 'propose',
    args: [p.targets, p.values, p.calldatas, p.description],
  });
}

export async function castVote(config: any, proposalId: bigint, support: 0|1|2, reason = '') {
  return writeContract(config, {
    address: ADDR.governor, abi: GovernorAbi, functionName: 'castVoteWithReason',
    args: [proposalId, support, reason],
  });
}

export async function queue(config: any, params: {targets: Address[], values: bigint[], calldatas: Hex[], description: string}) {
  const descHash = keccak256(toBytes(params.description));
  return writeContract(config, {
    address: ADDR.governor, abi: GovernorAbi, functionName: 'queue',
    args: [params.targets, params.values, params.calldatas, descHash],
  });
}

export async function execute(config: any, params: {targets: Address[], values: bigint[], calldatas: Hex[], description: string}) {
  const descHash = keccak256(toBytes(params.description));
  return writeContract(config, {
    address: ADDR.governor, abi: GovernorAbi, functionName: 'execute',
    args: [params.targets, params.values, params.calldatas, descHash],
  });
}

// read helpers
export async function getProposalState(config: any, id: bigint) {
  try {
    return await readContract(config, { address: ADDR.governor, abi: GovernorAbi, functionName: 'state', args: [id] });
  } catch (error) {
    console.error('Error getting proposal state:', error);
    return 0; // Return Pending as fallback
  }
}

export async function getProposalMeta(config: any, id: bigint) {
  try {
    const [snapshot, deadline, quorum] = await Promise.all([
      readContract(config, { address: ADDR.governor, abi: GovernorAbi, functionName: 'proposalSnapshot', args: [id] }),
      readContract(config, { address: ADDR.governor, abi: GovernorAbi, functionName: 'proposalDeadline', args: [id] }),
      readContract(config, { address: ADDR.governor, abi: GovernorAbi, functionName: 'quorum', args: [id] }),
    ]);
    return { 
      snapshot: snapshot as bigint, 
      deadline: deadline as bigint,
      quorum: quorum as bigint,
    };
  } catch (error) {
    console.error('Error getting proposal meta:', error);
    return { snapshot: BigInt(0), deadline: BigInt(0), quorum: BigInt(0) };
  }
}
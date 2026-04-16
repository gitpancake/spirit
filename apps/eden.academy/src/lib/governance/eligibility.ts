/* eslint-disable @typescript-eslint/no-explicit-any */
import { readContract } from 'wagmi/actions';
import { ADDR } from './addresses';
import { ERC20VotesAbi, GovernorAbi } from './abi';

export async function getEligibility(config: any, user?: `0x${string}`) {
  try {
    const [threshold, votes] = await Promise.all([
      readContract(config, { address: ADDR.governor, abi: GovernorAbi, functionName: 'proposalThreshold' }),
      user
        ? readContract(config, { address: ADDR.token, abi: ERC20VotesAbi, functionName: 'getVotes', args: [user] })
        : Promise.resolve(BigInt(0)),
    ]);
    
    return {
      canPropose: user ? votes >= (threshold as bigint) : false,
      threshold: threshold as bigint,
      votes: votes as bigint,
    };
  } catch (error) {
    console.error('Error getting eligibility:', error);
    return {
      canPropose: false,
      threshold: BigInt(0),
      votes: BigInt(0),
    };
  }
}

export async function getDelegationState(config: any, user?: `0x${string}`) {
  if (!user) return { balance: BigInt(0), votes: BigInt(0), delegatee: `0x${'0'.repeat(40)}` as const, symbol: '', decimals: 18 };
  
  try {
    const [balance, votes, delegatee, symbol, decimals] = await Promise.all([
      readContract(config, { address: ADDR.token, abi: ERC20VotesAbi, functionName: 'balanceOf', args: [user] }),
      readContract(config, { address: ADDR.token, abi: ERC20VotesAbi, functionName: 'getVotes',  args: [user] }),
      readContract(config, { address: ADDR.token, abi: ERC20VotesAbi, functionName: 'delegates', args: [user] }),
      readContract(config, { address: ADDR.token, abi: ERC20VotesAbi, functionName: 'symbol' }),
      readContract(config, { address: ADDR.token, abi: ERC20VotesAbi, functionName: 'decimals' }),
    ]);
    
    return { 
      balance: balance as bigint, 
      votes: votes as bigint, 
      delegatee: delegatee as `0x${string}`,
      symbol: symbol as string,
      decimals: decimals as number,
    };
  } catch (error) {
    console.error('Error getting delegation state:', error);
    return { balance: BigInt(0), votes: BigInt(0), delegatee: `0x${'0'.repeat(40)}` as const, symbol: '', decimals: 18 };
  }
}
// Governance contract ABIs - only what we need for UI interactions

export const ERC20VotesAbi = [
  { type:'function', name:'balanceOf', inputs:[{type:'address'}], outputs:[{type:'uint256'}], stateMutability:'view' },
  { type:'function', name:'getVotes',  inputs:[{type:'address'}], outputs:[{type:'uint256'}], stateMutability:'view' },
  { type:'function', name:'delegates', inputs:[{type:'address'}], outputs:[{type:'address'}], stateMutability:'view' },
  { type:'function', name:'delegate',  inputs:[{type:'address'}], outputs:[], stateMutability:'nonpayable' },
  { type:'function', name:'symbol', inputs:[], outputs:[{type:'string'}], stateMutability:'view' },
  { type:'function', name:'decimals', inputs:[], outputs:[{type:'uint8'}], stateMutability:'view' },
] as const;

export const GovernorAbi = [
  { type:'function', name:'proposalThreshold', inputs:[], outputs:[{type:'uint256'}], stateMutability:'view' },
  { type:'function', name:'propose', inputs:[
      {type:'address[]'},{type:'uint256[]'},{type:'bytes[]'},{type:'string'}
    ], outputs:[{type:'uint256'}], stateMutability:'nonpayable' },
  { type:'function', name:'state', inputs:[{type:'uint256'}], outputs:[{type:'uint8'}], stateMutability:'view' },
  { type:'function', name:'proposalSnapshot', inputs:[{type:'uint256'}], outputs:[{type:'uint256'}], stateMutability:'view' },
  { type:'function', name:'proposalDeadline', inputs:[{type:'uint256'}], outputs:[{type:'uint256'}], stateMutability:'view' },
  { type:'function', name:'quorum', inputs:[{type:'uint256'}], outputs:[{type:'uint256'}], stateMutability:'view' },
  { type:'function', name:'castVoteWithReason', inputs:[
      {type:'uint256'},{type:'uint8'},{type:'string'}
    ], outputs:[{type:'uint256'}], stateMutability:'nonpayable' },
  { type:'function', name:'queue', inputs:[
      {type:'address[]'},{type:'uint256[]'},{type:'bytes[]'},{type:'bytes32'}
    ], outputs:[{type:'uint256'}], stateMutability:'nonpayable' },
  { type:'function', name:'execute', inputs:[
      {type:'address[]'},{type:'uint256[]'},{type:'bytes[]'},{type:'bytes32'}
    ], outputs:[{type:'uint256'}], stateMutability:'payable' },
  { type:'event', name:'ProposalCreated', inputs:[
      { indexed:true,  name:'proposalId',  type:'uint256' },
      { indexed:true,  name:'proposer',    type:'address' },
      { indexed:false, name:'targets',     type:'address[]' },
      { indexed:false, name:'values',      type:'uint256[]' },
      { indexed:false, name:'signatures',  type:'string[]' },
      { indexed:false, name:'calldatas',   type:'bytes[]' },
      { indexed:false, name:'startBlock',  type:'uint256' },
      { indexed:false, name:'endBlock',    type:'uint256' },
      { indexed:false, name:'description', type:'string' },
  ]},
] as const;

// Proposal states enum for reference
export const ProposalState = {
  Pending: 0,
  Active: 1,
  Canceled: 2,
  Defeated: 3,
  Succeeded: 4,
  Queued: 5,
  Expired: 6,
  Executed: 7,
} as const;

export const ProposalStateNames = {
  0: 'Pending',
  1: 'Active',
  2: 'Canceled',
  3: 'Defeated',
  4: 'Succeeded',
  5: 'Queued',
  6: 'Expired',
  7: 'Executed',
} as const;
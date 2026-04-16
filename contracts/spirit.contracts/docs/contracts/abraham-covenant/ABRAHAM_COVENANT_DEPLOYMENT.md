# Abraham Covenant Deployment Guide

This guide explains how to deploy and test the AbrahamCovenant contract.

## Contract Overview

**AbrahamCovenant** is a daily practice NFT contract where:
- Abraham commits one piece of work per day (24-hour windows)
- Each piece has a unique IPFS URI (no baseURI concatenation)
- NFTs are minted to the contract itself (covenant pattern)
- Abraham can work 6 days then must rest 1 day (configurable)
- Abraham has sole authority over the contract (no separate owner)
- Work cycle can transition from 6-day to infinite mode

## Deployment

### Using Hardhat Ignition (Recommended)

Deploy to Sepolia testnet with auto-verification:

```bash
# Default deployment (Abraham's address, 365 max supply, 6-day work cycle)
npx hardhat ignition deploy ignition/modules/NFT/DeployAbrahamCovenant.ts --network sepolia --verify

# Custom deployment (for testing - 30 max supply)
ABRAHAM_ADDRESS=0x641f5ffC5F6239A0873Bd00F9975091FB035aAFC \
ABRAHAM_MAX_SUPPLY=30 \
ABRAHAM_DAYS_OF_WORK=6 \
npx hardhat ignition deploy ignition/modules/NFT/DeployAbrahamCovenant.ts --network sepolia --verify

# Using Makefile (cleaner output with table formatting)
make deploy-abraham-covenant NETWORK=sepolia

# Custom configuration with Makefile
make deploy-abraham-covenant \
  ABRAHAM_ADDRESS=0x641f5ffC5F6239A0873Bd00F9975091FB035aAFC \
  ABRAHAM_MAX_SUPPLY=30 \
  ABRAHAM_DAYS_OF_WORK=6 \
  NETWORK=sepolia
```

### Environment Variables

- `ABRAHAM_OWNER`: Owner address (defaults to deployer, controls sales mechanics)
- `ABRAHAM_ADDRESS`: Abraham's wallet address (default: 0x641f5ffC5F6239A0873Bd00F9975091FB035aAFC)
- `ABRAHAM_NAME`: Collection name (default: "Abraham's Daily Practice")
- `ABRAHAM_SYMBOL`: Collection symbol (default: "ABRAHAM")
- `ABRAHAM_MAX_SUPPLY`: Maximum number of NFTs (default: 365)
- `ABRAHAM_DAYS_OF_WORK`: Work cycle (default: 6, set to 0 for infinite mode)

## Testing on Sepolia

### 1. Commit First Daily Work

```bash
cast send <CONTRACT_ADDRESS> \
  "commitDailyWork(string)" \
  "ipfs://QmYourFirstWorkHash" \
  --rpc-url https://sepolia.infura.io/v3/YOUR_KEY \
  --private-key $ABRAHAM_PRIVATE_KEY
```

### 2. Check if Committed Today

```bash
cast call <CONTRACT_ADDRESS> \
  "hasCommittedToday()" \
  --rpc-url https://sepolia.infura.io/v3/YOUR_KEY
```

Returns `0x0000...0001` if true, `0x0000...0000` if false.

### 3. Get Current Day Number

```bash
cast call <CONTRACT_ADDRESS> \
  "getCurrentDay()" \
  --rpc-url https://sepolia.infura.io/v3/YOUR_KEY
```

### 4. Check Total Supply

```bash
cast call <CONTRACT_ADDRESS> \
  "totalSupply()" \
  --rpc-url https://sepolia.infura.io/v3/YOUR_KEY
```

### 5. Get Work Details for Day 0

```bash
cast call <CONTRACT_ADDRESS> \
  "getDailyWork(uint256)" 0 \
  --rpc-url https://sepolia.infura.io/v3/YOUR_KEY
```

Returns: `(tokenId, tokenURI, timestamp)`

### 6. Check Work Cycle Progress

```bash
# Check how many works since last rest
cast call <CONTRACT_ADDRESS> \
  "worksSinceLastRest()" \
  --rpc-url https://sepolia.infura.io/v3/YOUR_KEY

# Check if rest is needed
cast call <CONTRACT_ADDRESS> \
  "needsRest()" \
  --rpc-url https://sepolia.infura.io/v3/YOUR_KEY
```

### 7. Take Rest Day (After 6 Commits)

```bash
cast send <CONTRACT_ADDRESS> \
  "takeRestDay()" \
  --rpc-url https://sepolia.infura.io/v3/YOUR_KEY \
  --private-key $ABRAHAM_PRIVATE_KEY
```

### 8. Get Token URI for Token #0

```bash
cast call <CONTRACT_ADDRESS> \
  "tokenURI(uint256)" 0 \
  --rpc-url https://sepolia.infura.io/v3/YOUR_KEY
```

### 9. Switch to Infinite Mode (No Rest Required)

```bash
cast send <CONTRACT_ADDRESS> \
  "updateWorkCycle(uint256)" 0 \
  --rpc-url https://sepolia.infura.io/v3/YOUR_KEY \
  --private-key $ABRAHAM_PRIVATE_KEY
```

This sets `daysOfWork` to 0 (infinite mode), removes rest requirements.

## Contract Functions

### State-Changing Functions

**Abraham Only:**
- `commitDailyWork(string tokenURI)` - Commit daily work with IPFS URI
- `takeRestDay()` - Take mandatory rest after completing work cycle
- `updateWorkCycle(uint256)` - Change work cycle (6 for cyclic, 0 for infinite)

**Owner Only:**
- `updateSalesMechanic(address)` - Set sales contract address

### Read-Only Functions

- `totalSupply()` - Number of tokens minted so far
- `nextTokenId()` - Next token ID to be minted
- `getCurrentDay()` - Current day number since deployment
- `hasCommittedToday()` - Check if Abraham committed today
- `getDailyWork(uint256 dayNumber)` - Get work details for specific day
- `isMaxSupplyReached()` - Check if max supply reached
- `remainingSupply()` - How many tokens can still be minted
- `tokenURI(uint256 tokenId)` - Get IPFS URI for specific token
- `worksSinceLastRest()` - Works completed since last rest
- `needsRest()` - Whether rest is required before next commit
- `daysOfWork()` - Current work cycle (6 or 0)
- `abraham()` - Abraham's address
- `maxSupply()` - Maximum token supply (immutable)
- `deploymentTimestamp()` - Contract deployment timestamp

## Key Design Decisions

### 1. Token IDs Track Works Completed (Not Days)

Token IDs increment sequentially based on works completed, NOT day numbers:
- Day 0: Commit work → Token ID 0
- Day 2: Commit work → Token ID 1 (skipped day 1)
- Day 3: Commit work → Token ID 2

### 2. Per-Token URIs (No BaseURI)

Each token has its own complete IPFS URI stored in `mapping(uint256 => string)`:
- Token 0: `ipfs://QmHash1`
- Token 1: `ipfs://QmHash2`
- Token 2: `ipfs://QmHash3`

No baseURI concatenation like `baseURI/0`.

### 3. Covenant Pattern

NFTs are minted to the contract itself (`address(this)`), not to Abraham. This prevents hoarding and enables future sales mechanics.

### 4. Rest Cycle Enforcement

- `daysOfWork = 6`: Work 6 days, rest 1 day (mandatory)
- `daysOfWork = 0`: Infinite mode (no rest required)

When `needsRest = true`, Abraham cannot commit until calling `takeRestDay()`.

### 5. Dual Authority Model

**Owner (Deployer):**
- Update sales mechanic address
- Transfer ownership (standard Ownable)

**Abraham:**
- Commit daily works
- Take rest days
- Update work cycle

## Error Cases

- `AlreadyCommittedToday()` - Can only commit once per 24-hour window
- `MustRestBeforeNextWork()` - Must call `takeRestDay()` first
- `NotYetTimeToRest()` - Haven't completed work cycle yet
- `AlreadyRested()` - Already took rest for this cycle
- `MaxSupplyExceeded()` - Hit max supply limit
- `EmptyTokenURI()` - Token URI cannot be empty
- `OnlyAbraham()` - Only Abraham can call this function

## Etherscan Verification

After deployment, the contract will be auto-verified on Sepolia Etherscan at:
```
https://sepolia.etherscan.io/address/<CONTRACT_ADDRESS>
```

## Example Test Flow (For Gene)

```bash
# 1. Deploy to Sepolia (30 tokens for testing)
ABRAHAM_ADDRESS=0x641f5ffC5F6239A0873Bd00F9975091FB035aAFC \
ABRAHAM_MAX_SUPPLY=30 \
npx hardhat ignition deploy ignition/modules/NFT/DeployAbrahamCovenant.ts \
  --network sepolia --verify

# 2. Commit first work (Day 0)
cast send $CONTRACT_ADDRESS \
  "commitDailyWork(string)" "ipfs://QmWork0" \
  --rpc-url $SEPOLIA_RPC_URL --private-key $ABRAHAM_PK

# 3. Check total supply (should be 1)
cast call $CONTRACT_ADDRESS "totalSupply()" --rpc-url $SEPOLIA_RPC_URL

# 4. Wait 24 hours or advance time locally...

# 5. Commit days 1-5 (6 total commits)
cast send $CONTRACT_ADDRESS "commitDailyWork(string)" "ipfs://QmWork1" --rpc-url $SEPOLIA_RPC_URL --private-key $ABRAHAM_PK
# ... repeat for days 2-5

# 6. Check if rest is needed (should be true after 6 commits)
cast call $CONTRACT_ADDRESS "needsRest()" --rpc-url $SEPOLIA_RPC_URL

# 7. Take rest day
cast send $CONTRACT_ADDRESS "takeRestDay()" --rpc-url $SEPOLIA_RPC_URL --private-key $ABRAHAM_PK

# 8. Start next cycle (day 7)
cast send $CONTRACT_ADDRESS "commitDailyWork(string)" "ipfs://QmWork6" --rpc-url $SEPOLIA_RPC_URL --private-key $ABRAHAM_PK

# 9. Later: Switch to infinite mode
cast send $CONTRACT_ADDRESS "updateWorkCycle(uint256)" 0 --rpc-url $SEPOLIA_RPC_URL --private-key $ABRAHAM_PK
```

## Constructor Parameters

```solidity
constructor(
    string memory _name,        // "Abraham's Daily Practice"
    string memory _symbol,      // "ABRAHAM"
    address _owner,             // Deployer (controls sales mechanics)
    address _abraham,           // 0x641f5ffC5F6239A0873Bd00F9975091FB035aAFC
    uint256 _maxSupply,         // 365 (or 30 for testing)
    uint256 _daysOfWork         // 6 (or 0 for infinite)
)
```

## Questions?

- Check the contract source: `contracts/NFT/AbrahamCovenant.sol`
- Review Ignition module: `ignition/modules/NFT/DeployAbrahamCovenant.ts`
- Run Makefile target: `make deploy-abraham-covenant NETWORK=sepolia`

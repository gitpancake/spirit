# Abraham Covenant - Complete Permissions Grid

## Function Permissions Matrix

### 🔴 WRITE FUNCTIONS (State-Changing)

| Function | Owner | Abraham | Anyone | Gas Cost | Description |
|----------|-------|---------|--------|----------|-------------|
| **`commitDailyWork(string tokenURI)`** | ❌ | ✅ | ❌ | ~150-200k | Commit daily work with IPFS URI, mint NFT to contract |
| **`takeRestDay()`** | ❌ | ✅ | ❌ | ~30-50k | Take mandatory rest after completing work cycle |
| **`updateWorkCycle(uint256 _daysOfWork)`** | ❌ | ✅ | ❌ | ~30-50k | Change work cycle (6 for cyclic, 0 for infinite) |
| **`updateSalesMechanic(address _salesMechanic)`** | ✅ | ❌ | ❌ | ~30-50k | Set sales contract address |
| **`setMechanicOperator(bool approved)`** | ✅ | ❌ | ❌ | ~30-50k | Grant/revoke operator approval for sales mechanic |
| **`rotateSalesMechanic(address _newMechanic, bool approveNew)`** | ✅ | ❌ | ❌ | ~60-100k | Atomically rotate mechanic (revoke old, update, approve new) |
| **`transferOwnership(address newOwner)`** | ✅ | ❌ | ❌ | ~30k | Transfer contract ownership (Ownable) |
| **`renounceOwnership()`** | ✅ | ❌ | ❌ | ~30k | Renounce contract ownership (Ownable) |
| **`transferFrom(address from, address to, uint256 tokenId)`** | 🟡 | 🟡 | ❌ | ~50-80k | Transfer token (if owner/approved) |
| **`safeTransferFrom(address from, address to, uint256 tokenId)`** | 🟡 | 🟡 | ❌ | ~50-100k | Safe transfer with receiver check |
| **`approve(address to, uint256 tokenId)`** | 🟡 | 🟡 | ❌ | ~30-50k | Approve spender for specific token |
| **`setApprovalForAll(address operator, bool approved)`** | ✅ | ✅ | ✅ | ~30-50k | Set operator approval for all tokens |

**Legend:**
- ✅ = Can call this function
- ❌ = Cannot call this function
- 🟡 = Can call if owns the token or is approved

### 🟢 READ FUNCTIONS (View/Pure - No Gas Cost)

| Function | Owner | Abraham | Anyone | Returns | Description |
|----------|-------|---------|--------|---------|-------------|
| **`totalSupply()`** | ✅ | ✅ | ✅ | `uint256` | Number of tokens minted |
| **`nextTokenId()`** | ✅ | ✅ | ✅ | `uint256` | Next token ID to be minted |
| **`getCurrentDay()`** | ✅ | ✅ | ✅ | `uint256` | Days since deployment |
| **`hasCommittedToday()`** | ✅ | ✅ | ✅ | `bool` | Whether Abraham committed today |
| **`getDailyWork(uint256 dayNumber)`** | ✅ | ✅ | ✅ | `DailyWork` | Work details for specific day |
| **`isMaxSupplyReached()`** | ✅ | ✅ | ✅ | `bool` | Whether max supply reached |
| **`remainingSupply()`** | ✅ | ✅ | ✅ | `uint256` | Tokens that can still be minted |
| **`tokenURI(uint256 tokenId)`** | ✅ | ✅ | ✅ | `string` | IPFS URI for token |
| **`abraham()`** | ✅ | ✅ | ✅ | `address` | Abraham's address |
| **`owner()`** | ✅ | ✅ | ✅ | `address` | Contract owner address |
| **`maxSupply()`** | ✅ | ✅ | ✅ | `uint256` | Maximum token supply (immutable) |
| **`deploymentTimestamp()`** | ✅ | ✅ | ✅ | `uint256` | Contract deployment timestamp |
| **`daysOfWork()`** | ✅ | ✅ | ✅ | `uint256` | Work cycle (6 or 0) |
| **`worksSinceLastRest()`** | ✅ | ✅ | ✅ | `uint256` | Works since last rest |
| **`needsRest()`** | ✅ | ✅ | ✅ | `bool` | Whether rest is required |
| **`salesMechanic()`** | ✅ | ✅ | ✅ | `address` | Current sales contract |
| **`lastCommitDay()`** | ✅ | ✅ | ✅ | `uint256` | Last day Abraham committed |
| **`balanceOf(address owner)`** | ✅ | ✅ | ✅ | `uint256` | Token balance (ERC-721) |
| **`ownerOf(uint256 tokenId)`** | ✅ | ✅ | ✅ | `address` | Token owner (ERC-721) |
| **`getApproved(uint256 tokenId)`** | ✅ | ✅ | ✅ | `address` | Approved spender for token |
| **`isApprovedForAll(address owner, address operator)`** | ✅ | ✅ | ✅ | `bool` | Check operator approval |
| **`name()`** | ✅ | ✅ | ✅ | `string` | Collection name |
| **`symbol()`** | ✅ | ✅ | ✅ | `string` | Collection symbol |
| **`supportsInterface(bytes4 interfaceId)`** | ✅ | ✅ | ✅ | `bool` | ERC-165 interface detection |

## State Variables Access Control

| Variable | Type | Read Access | Write Access | Mutability |
|----------|------|-------------|--------------|------------|
| **`abraham`** | `address` | Anyone | None | **Immutable** (set in constructor) |
| **`owner()`** | `address` | Anyone | Owner Only | Mutable (via `transferOwnership`) |
| **`maxSupply`** | `uint256` | Anyone | None | **Immutable** (set in constructor) |
| **`deploymentTimestamp`** | `uint256` | Anyone | None | **Immutable** (set in constructor) |
| **`daysOfWork`** | `uint256` | Anyone | Abraham Only | Mutable (via `updateWorkCycle`) |
| **`worksSinceLastRest`** | `uint256` | Anyone | Abraham Only | Mutable (via `commitDailyWork`, `takeRestDay`) |
| **`needsRest`** | `bool` | Anyone | Abraham Only | Mutable (via `commitDailyWork`, `takeRestDay`, `updateWorkCycle`) |
| **`salesMechanic`** | `address` | Anyone | Owner Only | Mutable (via `updateSalesMechanic`) |
| **`lastCommitDay`** | `uint256` | Anyone | Abraham Only | Mutable (via `commitDailyWork`) |
| **`lastCycleCompletionDay`** | `uint256` | Anyone | Abraham Only | Mutable (via `commitDailyWork`) |
| **`_tokenIdCounter`** | `uint256` | Anyone (via `totalSupply()`) | Internal | Auto-increments on mint |
| **`_tokenURIs`** | `mapping` | Anyone (via `tokenURI()`) | Abraham Only | Mutable (via `commitDailyWork`) |
| **`_dailyWorks`** | `mapping` | Anyone (via `getDailyWork()`) | Abraham Only | Mutable (via `commitDailyWork`) |

## Permission Levels Explained

### 🔴 Level 1A: Owner Only (Deployer)

**Who:** Contract owner (deployer address)

**Functions:**
- `updateSalesMechanic(address)` - Update sales contract address
- `setMechanicOperator(bool)` - Grant/revoke operator approval for mechanic
- `rotateSalesMechanic(address, bool)` - Atomically rotate mechanic (recommended)
- `transferOwnership(address)` - Transfer ownership
- `renounceOwnership()` - Renounce ownership

**Enforcement:** OpenZeppelin `onlyOwner` modifier

**Why Restricted:** Sales mechanics and ownership should be controlled by deployer

**Mechanic Rotation Options:**
- **Recommended**: `rotateSalesMechanic(newAddress, true)` - atomic, revokes old & approves new
- **Manual**: Three-step process using `setMechanicOperator` + `updateSalesMechanic`

### 🔴 Level 1B: Abraham Only (Daily Work Authority)

**Who:** Abraham's address (`0x641f5ffC5F6239A0873Bd00F9975091FB035aAFC`)

**Functions:**
- `commitDailyWork(string)` - Create daily work
- `takeRestDay()` - Take rest day
- `updateWorkCycle(uint256)` - Change work pattern

**Enforcement:** Custom `onlyAbraham` modifier

**Why Restricted:** Core covenant mechanics controlled by Abraham

### 🟡 Level 2: Token Owner/Approved

**Who:** Token owners and approved addresses

**Functions:**
- `transferFrom()` - Transfer token
- `safeTransferFrom()` - Safe transfer
- `approve()` - Approve spender

**Enforcement:** Built-in ERC-721 checks

**Why Restricted:** Standard NFT ownership protections

### 🟢 Level 3: Public (Anyone)

**Who:** Any address

**Functions:**
- All view/pure functions
- `setApprovalForAll()` - Manage own approvals

**Enforcement:** No restrictions

**Why Unrestricted:** Reading data or managing own approvals

## Action Summary Grid

| Action | Owner | Abraham | Token Holder | Anyone |
|--------|-------|---------|--------------|--------|
| **Daily Practice** |
| Commit daily work | ❌ | ✅ | ❌ | ❌ |
| Take rest day | ❌ | ✅ | ❌ | ❌ |
| Update work cycle | ❌ | ✅ | ❌ | ❌ |
| **Sales & Ownership** |
| Update sales mechanic | ✅ | ❌ | ❌ | ❌ |
| Transfer ownership | ✅ | ❌ | ❌ | ❌ |
| Renounce ownership | ✅ | ❌ | ❌ | ❌ |
| **Token Management** |
| Transfer tokens | 🟡 | 🟡 | ✅ | ❌ |
| Approve tokens | 🟡 | 🟡 | ✅ | ❌ |
| Set approval for all | ✅ | ✅ | ✅ | ✅ |
| **Read Operations** |
| View contract data | ✅ | ✅ | ✅ | ✅ |
| View token URIs | ✅ | ✅ | ✅ | ✅ |
| Check work progress | ✅ | ✅ | ✅ | ✅ |
| View ownership | ✅ | ✅ | ✅ | ✅ |

**Legend:**
- ✅ = Full access
- 🟡 = Conditional access (if owns token)
- ❌ = No access

## Error Reference Grid

| Function | Error | Condition | Who Gets Error |
|----------|-------|-----------|----------------|
| `commitDailyWork()` | `OnlyAbraham()` | Caller is not Abraham | Owner, Anyone |
| `commitDailyWork()` | `EmptyTokenURI()` | Token URI is empty | Abraham |
| `commitDailyWork()` | `AlreadyCommittedToday()` | Already committed today | Abraham |
| `commitDailyWork()` | `MustRestBeforeNextWork()` | Rest is required | Abraham |
| `commitDailyWork()` | `MaxSupplyExceeded()` | Would exceed max supply | Abraham |
| `takeRestDay()` | `OnlyAbraham()` | Caller is not Abraham | Owner, Anyone |
| `takeRestDay()` | `NotYetTimeToRest()` | Work cycle not complete | Abraham |
| `takeRestDay()` | `AlreadyRested()` | Already rested this cycle | Abraham |
| `takeRestDay()` | `CannotRestOnSameDayAsCycleCompletion()` | Attempting rest on same day as cycle completion | Abraham |
| `updateWorkCycle()` | `OnlyAbraham()` | Caller is not Abraham | Owner, Anyone |
| `updateSalesMechanic()` | `OwnableUnauthorizedAccount()` | Caller is not owner | Abraham, Anyone |
| `setMechanicOperator()` | `OwnableUnauthorizedAccount()` | Caller is not owner | Abraham, Anyone |
| `setMechanicOperator()` | `SalesMechanicNotSet()` | salesMechanic is address(0) | Owner |
| `transferOwnership()` | `OwnableUnauthorizedAccount()` | Caller is not owner | Abraham, Anyone |
| `transferOwnership()` | `OwnableInvalidOwner()` | New owner is zero address | Owner |
| `tokenURI()` | `ERC721NonexistentToken()` | Token doesn't exist | Anyone |

## Capability Matrix

### What Owner CAN Do ✅

- Update sales mechanic address
- Transfer ownership to another address
- Renounce ownership (permanent)
- Read all contract data
- Transfer/approve tokens they own

### What Owner CANNOT Do ❌

- Commit daily works (Abraham only)
- Take rest days (Abraham only)
- Change work cycle (Abraham only)
- Change Abraham address (immutable)
- Change max supply (immutable)
- Mint tokens directly (only via Abraham's commits)

### What Abraham CAN Do ✅

- Commit daily works (once per 24h)
- Take rest days (when required)
- Change work cycle (6 to 0, or vice versa)
- Read all contract data
- Transfer/approve tokens they own

### What Abraham CANNOT Do ❌

- Update sales mechanic (owner only)
- Transfer ownership (owner only)
- Change Abraham address (immutable)
- Change max supply (immutable)
- Commit twice in same day
- Skip rest when required (if `daysOfWork > 0`)
- Mint beyond max supply

### What Anyone CAN Do ✅

- Read all public state variables
- View all token metadata
- Check work history and progress
- Set approval for all on their own tokens
- Transfer tokens they own
- Query contract state

### What Anyone CANNOT Do ❌

- Commit works (Abraham only)
- Take rest days (Abraham only)
- Update contract settings (Owner/Abraham only)
- Mint tokens
- Transfer tokens they don't own

## Security Properties

### ✅ Immutable Parameters (Cannot Be Changed)

- `abraham` address - Set in constructor, permanent
- `maxSupply` - Set in constructor, permanent
- `deploymentTimestamp` - Set in constructor, permanent

### 🔄 Mutable Parameters

**Owner Controlled:**
- `salesMechanic` - Can be updated via `updateSalesMechanic()`
- `owner()` - Can be transferred via `transferOwnership()`

**Abraham Controlled:**
- `daysOfWork` - Can be updated via `updateWorkCycle()`
- `worksSinceLastRest` - Updates via `commitDailyWork()`, `takeRestDay()`
- `needsRest` - Updates via `commitDailyWork()`, `takeRestDay()`, `updateWorkCycle()`
- `lastCommitDay` - Updates via `commitDailyWork()`
- `lastCycleCompletionDay` - Updates via `commitDailyWork()` (when cycle completes)

**Internal (Auto-Updated):**
- `_tokenIdCounter` - Auto-increments on mint
- `_tokenURIs` - Set per token via `commitDailyWork()`
- `_dailyWorks` - Set per day via `commitDailyWork()`

## Modifiers Reference

| Modifier | Usage | Enforces | Reverts With |
|----------|-------|----------|--------------|
| `onlyOwner` | `updateSalesMechanic()`, `transferOwnership()`, `renounceOwnership()` | Only owner can call | `OwnableUnauthorizedAccount(address)` |
| `onlyAbraham` | `commitDailyWork()`, `takeRestDay()`, `updateWorkCycle()` | Only Abraham can call | `OnlyAbraham()` |
| `nonReentrant` | `commitDailyWork()`, `takeRestDay()` | Prevents reentrancy | `ReentrancyGuardReentrantCall()` |

## Time-Based Restrictions

| Function | Time Restriction | Check | Resolution |
|----------|-----------------|-------|------------|
| `commitDailyWork()` | Once per 24h window | `lastCommitDay == currentDay` | Wait for next day |
| `commitDailyWork()` | Must rest after cycle | `needsRest == true` | Call `takeRestDay()` first |
| `takeRestDay()` | Only after completing cycle | `worksSinceLastRest < daysOfWork` | Complete work cycle first |
| `takeRestDay()` | Must wait at least one calendar day | `currentDay == lastCycleCompletionDay` | Wait for next day after cycle completion |

## Constructor Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `_name` | `string` | Collection name | "Abraham's Daily Practice" |
| `_symbol` | `string` | Collection symbol | "ABRAHAM" |
| `_owner` | `address` | Contract owner (deployer) | `0x5D6D...` |
| `_abraham` | `address` | Abraham's address | `0x641f...` |
| `_maxSupply` | `uint256` | Maximum tokens (immutable) | `365` |
| `_daysOfWork` | `uint256` | Work cycle (6 or 0) | `6` |

---

**Contract**: AbrahamCovenant.sol
**Standard**: ERC-721 (OpenZeppelin v5) + ERC721Holder (IERC721Receiver)
**Access Control**: Dual authority (Owner + Abraham) + standard ERC-721
**Covenant Pattern**: Implements ERC721Holder to safely receive NFTs minted to itself
**Upgradeability**: None (immutable deployment)
**Pausability**: None
**Reentrancy Protection**: Yes (`nonReentrant` on state-changing functions)

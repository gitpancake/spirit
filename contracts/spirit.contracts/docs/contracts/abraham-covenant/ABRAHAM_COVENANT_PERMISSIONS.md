# Abraham Covenant - Complete Permissions Reference

## Function Permissions Matrix

### 🔴 WRITE FUNCTIONS (State-Changing)

| Function | Access | Gas | Description | Modifiers |
|----------|--------|-----|-------------|-----------|
| **`commitDailyWork(string tokenURI)`** | Abraham Only | ~150-200k | Commit daily work with IPFS URI, mints NFT to contract | `nonReentrant`, `onlyAbraham` |
| **`takeRestDay()`** | Abraham Only | ~30-50k | Take mandatory rest after work cycle | `nonReentrant`, `onlyAbraham` |
| **`updateWorkCycle(uint256 _daysOfWork)`** | Abraham Only | ~30-50k | Change work cycle (6 or 0) | `onlyAbraham` |
| **`updateSalesMechanic(address _salesMechanic)`** | Owner Only | ~30-50k | Set sales contract address | `onlyOwner` |
| **`transferFrom(address, address, uint256)`** | Token Owner/Approved | ~50-80k | Transfer token (ERC-721 standard) | None |
| **`safeTransferFrom(address, address, uint256)`** | Token Owner/Approved | ~50-100k | Safe transfer with receiver check | None |
| **`approve(address to, uint256 tokenId)`** | Token Owner | ~30-50k | Approve spender for token | None |
| **`setApprovalForAll(address operator, bool approved)`** | Token Owner | ~30-50k | Approve operator for all tokens | None |

### 🟢 READ FUNCTIONS (View/Pure - No Gas Cost)

| Function | Access | Returns | Description |
|----------|--------|---------|-------------|
| **`totalSupply()`** | Anyone | `uint256` | Number of tokens minted (sequential counter) |
| **`nextTokenId()`** | Anyone | `uint256` | Next token ID to be minted |
| **`getCurrentDay()`** | Anyone | `uint256` | Days since deployment (0-indexed) |
| **`hasCommittedToday()`** | Anyone | `bool` | Whether Abraham committed today |
| **`getDailyWork(uint256 dayNumber)`** | Anyone | `DailyWork` | Work details: (tokenId, tokenURI, timestamp) |
| **`isMaxSupplyReached()`** | Anyone | `bool` | Whether max supply reached |
| **`remainingSupply()`** | Anyone | `uint256` | Tokens that can still be minted |
| **`tokenURI(uint256 tokenId)`** | Anyone | `string` | IPFS URI for token |
| **`abraham()`** | Anyone | `address` | Abraham's address (sole authority) |
| **`maxSupply()`** | Anyone | `uint256` | Maximum token supply (immutable) |
| **`deploymentTimestamp()`** | Anyone | `uint256` | Contract deployment timestamp |
| **`daysOfWork()`** | Anyone | `uint256` | Work cycle (6 or 0) |
| **`worksSinceLastRest()`** | Anyone | `uint256` | Works since last rest |
| **`needsRest()`** | Anyone | `bool` | Whether rest required |
| **`salesMechanic()`** | Anyone | `address` | Current sales contract address |
| **`lastCommitDay()`** | Anyone | `uint256` | Last day Abraham committed |
| **`balanceOf(address owner)`** | Anyone | `uint256` | Token balance (ERC-721) |
| **`ownerOf(uint256 tokenId)`** | Anyone | `address` | Token owner (ERC-721) |
| **`getApproved(uint256 tokenId)`** | Anyone | `address` | Approved spender for token |
| **`isApprovedForAll(address owner, address operator)`** | Anyone | `bool` | Check operator approval |
| **`name()`** | Anyone | `string` | Collection name |
| **`symbol()`** | Anyone | `string` | Collection symbol |
| **`supportsInterface(bytes4 interfaceId)`** | Anyone | `bool` | ERC-165 interface detection |

## Permission Levels Explained

### 🔴 Level 1A: Abraham Only (Highest Restriction - Daily Work)

**Who can call**: Only Abraham's address (`0x641f5ffC5F6239A0873Bd00F9975091FB035aAFC`)

**Functions**:
- `commitDailyWork(string)` - Create daily work
- `takeRestDay()` - Take rest day
- `updateWorkCycle(uint256)` - Change work pattern

**Enforcement**: `onlyAbraham` modifier checks `msg.sender == abraham`

**Reverts with**: `OnlyAbraham()` error if unauthorized

**Why restricted**: These functions control the core covenant mechanics and should only be callable by Abraham himself.

### 🔴 Level 1B: Owner Only (Highest Restriction - Sales Config)

**Who can call**: Only contract owner (deployer address)

**Functions**:
- `updateSalesMechanic(address)` - Update sales contract

**Enforcement**: `onlyOwner` modifier from OpenZeppelin's Ownable

**Reverts with**: Standard Ownable error if unauthorized

**Why restricted**: Sales mechanics configuration should be controlled by the contract deployer/owner.

### 🟡 Level 2: Token Owner/Approved (Medium Restriction)

**Who can call**:
- Owner of the token
- Approved spender for the token
- Approved operator for owner's tokens

**Functions**:
- `transferFrom()` - Transfer token
- `safeTransferFrom()` - Safe transfer
- `approve()` - Approve spender

**Enforcement**: Built-in ERC-721 authorization checks

**Reverts with**: Standard ERC-721 errors (e.g., "ERC721: caller is not owner nor approved")

**Why restricted**: Standard NFT ownership protections.

### 🟢 Level 3: Anyone (No Restriction)

**Who can call**: Any address

**Functions**:
- All view/pure functions (read-only)
- `setApprovalForAll()` - Manage own approvals

**Enforcement**: No access control

**Why unrestricted**: Reading data or managing own approvals doesn't affect contract state.

## State Variables Permission Map

| Variable | Read | Write | Notes |
|----------|------|-------|-------|
| `abraham` | Anyone | **Immutable** | Set in constructor, cannot change |
| `maxSupply` | Anyone | **Immutable** | Set in constructor, cannot change |
| `deploymentTimestamp` | Anyone | **Immutable** | Set in constructor, cannot change |
| `daysOfWork` | Anyone | Abraham Only | Via `updateWorkCycle()` |
| `worksSinceLastRest` | Anyone | Abraham Only | Via `commitDailyWork()`, `takeRestDay()` |
| `needsRest` | Anyone | Abraham Only | Via `commitDailyWork()`, `takeRestDay()`, `updateWorkCycle()` |
| `salesMechanic` | Anyone | Owner Only | Via `updateSalesMechanic()` |
| `lastCommitDay` | Anyone | Abraham Only | Via `commitDailyWork()` |
| `_tokenIdCounter` | Anyone (via `totalSupply()`) | Internal | Auto-increments on mint |
| `_tokenURIs` | Anyone (via `tokenURI()`) | Abraham Only | Via `commitDailyWork()` |
| `_dailyWorks` | Anyone (via `getDailyWork()`) | Abraham Only | Via `commitDailyWork()` |

## Revert Conditions (Error Reference)

| Function | Error | Condition | How to Resolve |
|----------|-------|-----------|----------------|
| `commitDailyWork()` | `OnlyAbraham()` | Caller is not Abraham | Only Abraham can call |
| `commitDailyWork()` | `EmptyTokenURI()` | Token URI is empty string | Provide valid IPFS URI |
| `commitDailyWork()` | `AlreadyCommittedToday()` | Already committed in current day | Wait for next 24h window |
| `commitDailyWork()` | `MustRestBeforeNextWork()` | Rest is required | Call `takeRestDay()` first |
| `commitDailyWork()` | `MaxSupplyExceeded()` | Would exceed max supply | Max supply reached |
| `takeRestDay()` | `OnlyAbraham()` | Caller is not Abraham | Only Abraham can call |
| `takeRestDay()` | `NotYetTimeToRest()` | Haven't completed work cycle | Complete work cycle first (6 works) |
| `takeRestDay()` | `AlreadyRested()` | Already rested for this cycle | Cannot rest twice in a row |
| `updateSalesMechanic()` | `OwnableUnauthorizedAccount()` | Caller is not owner | Only owner can call |
| `updateWorkCycle()` | `OnlyAbraham()` | Caller is not Abraham | Only Abraham can call |
| `tokenURI()` | Revert | Token doesn't exist | Token ID must be minted |

## Time-Based Restrictions

### Daily Commit Window

**Function**: `commitDailyWork()`

**Restriction**: One commit per 24-hour day

**Calculation**:
```solidity
uint256 currentDay = (block.timestamp - deploymentTimestamp) / 1 days;
if (lastCommitDay == currentDay) revert AlreadyCommittedToday();
```

**Example**:
- Deploy at timestamp: 1000000
- First commit at: 1000000 (day 0) ✅
- Second commit at: 1050000 (still day 0) ❌ AlreadyCommittedToday
- Third commit at: 1090000 (day 1) ✅

### Rest Cycle Enforcement

**Function**: `commitDailyWork()`

**Restriction**: Cannot commit when `needsRest == true`

**Trigger**: After completing `daysOfWork` commits (default: 6)

**Resolution**: Call `takeRestDay()` to reset cycle

**Example** (with `daysOfWork = 6`):
1. Commit 1-6: ✅ `worksSinceLastRest` increments
2. After commit 6: `needsRest = true`
3. Commit 7 attempt: ❌ `MustRestBeforeNextWork()`
4. Call `takeRestDay()`: ✅ Resets counters
5. Commit 7: ✅ New cycle begins

### Infinite Mode

**Setting**: `daysOfWork = 0`

**Effect**: No rest required, can commit indefinitely

**How to enable**:
```bash
cast send <CONTRACT> "updateWorkCycle(uint256)" 0 --private-key $ABRAHAM_PK
```

## Security Properties

### ✅ What Abraham CAN Do

- Commit daily works (once per 24h)
- Take rest days (when required)
- Change work cycle (6 to 0, or 0 to 6)
- Transfer/sell tokens (like any token owner)

### ✅ What Owner CAN Do

- Update sales mechanic address
- Transfer ownership (standard Ownable)
- Renounce ownership (standard Ownable)

### ❌ What Abraham CANNOT Do

- Change Abraham address (immutable)
- Change max supply (immutable)
- Commit twice in same day
- Skip rest when required (if `daysOfWork > 0`)
- Mint beyond max supply
- Change deployment timestamp
- Update sales mechanic (owner only)
- Pause the contract
- Upgrade the contract

### ❌ What Owner CANNOT Do

- Commit daily works (Abraham only)
- Take rest days (Abraham only)
- Change work cycle (Abraham only)
- Change Abraham address (immutable)
- Change max supply (immutable)

### ✅ What Anyone CAN Do

- Read all public state variables
- View all token metadata
- Check work history and progress
- Transfer tokens they own
- Approve spenders for their tokens

### ❌ What Anyone CANNOT Do

- Commit works (only Abraham)
- Force rest days (only Abraham)
- Update contract settings (only Abraham)
- Mint tokens (only via `commitDailyWork()`)

## Modifiers Breakdown

### `onlyAbraham`

```solidity
modifier onlyAbraham() {
    if (msg.sender != abraham) {
        revert OnlyAbraham();
    }
    _;
}
```

**Used on**:
- `commitDailyWork()`
- `takeRestDay()`
- `updateSalesMechanic()`
- `updateWorkCycle()`

**Purpose**: Restrict critical functions to Abraham only

### `nonReentrant`

**Used on**:
- `commitDailyWork()`
- `takeRestDay()`

**Purpose**: Prevent reentrancy attacks (OpenZeppelin's ReentrancyGuard)

**Protection**: Ensures function cannot be called recursively

## Events & Transparency

All state changes emit events for transparency:

| Event | When | Who Can Trigger |
|-------|------|-----------------|
| `DailyWorkCommitted` | On successful commit | Abraham only |
| `NFTMinted` | On successful commit | Abraham only |
| `RestDayTaken` | On rest day | Abraham only |
| `WorkCycleUpdated` | On work cycle change | Abraham only |
| `SalesMechanicUpdated` | On sales mechanic change | Abraham only |
| `Transfer` | On token transfer | Token owner/approved |
| `Approval` | On token approval | Token owner |
| `ApprovalForAll` | On operator approval | Any token owner |

## Testing Permissions

### Test as Abraham

```bash
# ✅ Should succeed
cast send $CONTRACT "commitDailyWork(string)" "ipfs://QmHash" \
  --private-key $ABRAHAM_PK

# ✅ Should succeed (after 6 commits)
cast send $CONTRACT "takeRestDay()" --private-key $ABRAHAM_PK

# ✅ Should succeed
cast send $CONTRACT "updateWorkCycle(uint256)" 0 --private-key $ABRAHAM_PK
```

### Test as Non-Abraham

```bash
# ❌ Should revert with OnlyAbraham()
cast send $CONTRACT "commitDailyWork(string)" "ipfs://QmHash" \
  --private-key $OTHER_PK

# ❌ Should revert with OnlyAbraham()
cast send $CONTRACT "takeRestDay()" --private-key $OTHER_PK

# ✅ Should succeed (reading is public)
cast call $CONTRACT "totalSupply()"
```

## Summary Table

| Action | Owner | Abraham | Token Owner | Anyone |
|--------|-------|---------|-------------|--------|
| Commit daily work | ❌ | ✅ | ❌ | ❌ |
| Take rest day | ❌ | ✅ | ❌ | ❌ |
| Update work cycle | ❌ | ✅ | ❌ | ❌ |
| Update sales mechanic | ✅ | ❌ | ❌ | ❌ |
| Transfer ownership | ✅ | ❌ | ❌ | ❌ |
| Transfer tokens | ✅ (if owns) | ✅ (if owns) | ✅ | ❌ |
| Approve token | ✅ (if owns) | ✅ (if owns) | ✅ | ❌ |
| Read contract data | ✅ | ✅ | ✅ | ✅ |
| View token URIs | ✅ | ✅ | ✅ | ✅ |
| Check work progress | ✅ | ✅ | ✅ | ✅ |

---

**Contract**: AbrahamCovenant.sol
**Standard**: ERC-721 (OpenZeppelin v5) + ERC721Holder (IERC721Receiver)
**Access Control**: Dual authority (Owner + Abraham) + standard ERC-721 permissions
**Covenant Pattern**: Implements ERC721Holder to safely receive NFTs minted to itself
**Upgradeability**: None (immutable deployment)
**Pausability**: None

# Spirit Protocol — Migration Plan

**Version**: 1.0.0
**Last Updated**: December 9, 2025
**Source**: Henry's audited contracts (0xPilou/spirit-contracts fork)
**Target Network**: Base L2 (Chain ID: 8453)

---

## Table of Contents

1. [Migration Overview](#1-migration-overview)
2. [Repository History](#2-repository-history)
3. [Address Classification](#3-address-classification)
4. [Contract Ownership Transfer](#4-contract-ownership-transfer)
5. [Migration Checklist](#5-migration-checklist)
6. [Deprecated Infrastructure](#6-deprecated-infrastructure)
7. [Post-Migration Verification](#7-post-migration-verification)

---

## 1. Migration Overview

### 1.1 Purpose

This document catalogs the migration from R&D/testnet contracts to the production Spirit Protocol V1 deployment on Base mainnet.

### 1.2 Key Changes

| Aspect | Previous (R&D) | V1 Production |
|--------|----------------|---------------|
| Repository | `0xPilou/spirit-contracts` | `spirit-protocol/spirit-contracts-core` |
| Network | Ethereum Sepolia, Base Sepolia | Base Mainnet |
| Audit Status | Unaudited R&D | 0xSimao Audit (Nov 28, 2025) |
| Governance | Single deployer | Multisig |
| Token Name | SECRETv3 (testnet) | SPIRIT |

### 1.3 What Gets Migrated

- **Kept**: Contract code (audited, final)
- **Kept**: External dependency addresses (Superfluid, Uniswap, etc.)
- **Changed**: Role addresses (admin, treasury, distributor)
- **Changed**: Token naming (SECRETv3 → SPIRIT)
- **Deprecated**: All testnet deployments

---

## 2. Repository History

### 2.1 Source Repository

| Field | Value |
|-------|-------|
| Original Author | 0xPilou (Henry) |
| Repository | `https://github.com/0xPilou/spirit-contracts` |
| Fork Date | December 2025 |
| Audit Date | November 28, 2025 |
| Auditor | 0xSimao |

### 2.2 Production Repository

| Field | Value |
|-------|-------|
| Repository | `https://github.com/spirit-protocol/spirit-contracts-core` |
| Purpose | Spirit Protocol V1 production |
| Policy | No Solidity modifications (configuration only) |

### 2.3 Contract Changes from Audit

All audit findings have been resolved in the source repository:

| PR | Issue | Change |
|----|-------|--------|
| #2 | I-1: Vesting mapping overwrites | Added check for existing recipient |
| #4 | L-1: Missing rewards end logic | Added `terminateDistributionFlow()` |
| #5 | C-1: Wrong rounding in unstake | Changed to `Math.ceilDiv()` |
| #6 | H-1: SuperToken frontrunning | Added token hash tracking |
| #7 | M-1: Can't stop Airstream | Added `terminateAirstream()` |
| #8 | H-2: Pool initialization frontrun | Salt-based CREATE2 deployment |

---

## 3. Address Classification

### 3.1 Production Addresses (Base Mainnet - TBD)

These addresses will be populated after mainnet deployment:

```
┌─────────────────────────────────────────────────────────────────┐
│                 PRODUCTION ADDRESSES (BASE MAINNET)              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Core Protocol                                                  │
│  ├── SPIRIT Token           : TBD after deployment              │
│  ├── RewardController       : TBD after deployment              │
│  ├── StakingPool Beacon     : TBD after deployment              │
│  ├── SpiritFactory          : TBD after deployment              │
│  └── SpiritVestingFactory   : TBD after deployment              │
│                                                                 │
│  Governance                                                     │
│  ├── Admin Multisig         : TBD (Safe on Base)                │
│  ├── Treasury Multisig      : TBD (Same or separate)            │
│  └── Distributor            : TBD (EOA or automation)           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Testnet Addresses (DEPRECATED)

**Status**: All testnet deployments are deprecated and should not be referenced in production.

#### Ethereum Sepolia (Chain ID: 11155111)

| Contract | Address | Status |
|----------|---------|--------|
| Multisig | `0x3139DB2845810C4DE0727A5D5Aa24146C086eE1A` | DEPRECATED |
| SPIRIT Token (SECRETv3) | `0xC280291AD69712e3dbD39965A90BAff1683D2De5` | DEPRECATED |
| RewardController | `0xdd27Ce16F1B59818c6A4C428F8BDD5d3BA652539` | DEPRECATED |
| StakingPool Beacon | `0xF66A9999ea07825232CeEa4F75711715934333D1` | DEPRECATED |
| SpiritFactory | `0x28F0BC53b52208c8286A4C663680C2eD99d18982` | DEPRECATED |
| SpiritVestingFactory | `0x511cE8Dd17dAa368bEBF7E21CC4E00E1a9510319` | DEPRECATED |

#### Base Sepolia (Chain ID: 84532)

| Contract | Address | Status |
|----------|---------|--------|
| Multisig | `0x3139DB2845810C4DE0727A5D5Aa24146C086eE1A` | DEPRECATED |
| SPIRIT Token (SECRETv3) | `0xc7e9de362C6eA2Cc03863ECe330622146Ff1c18B` | DEPRECATED |
| RewardController | `0x1390A073a765D0e0D21a382F4F6F0289b69BE33C` | DEPRECATED |
| StakingPool Beacon | `0x6A96aC9BAF36F8e8b6237eb402d07451217C7540` | DEPRECATED |
| SpiritFactory | `0x879d67000C938142F472fB8f2ee0b6601E2cE3C6` | DEPRECATED |
| SpiritVestingFactory | `0x94bea63d6eC10AF980bf8C7aEFeE04665D355AFe` | DEPRECATED |

### 3.3 External Dependencies (KEEP)

These addresses are canonical external contracts that remain unchanged:

#### Base Mainnet External Contracts

| Protocol | Contract | Address |
|----------|----------|---------|
| Superfluid | SuperTokenFactory | `0xe20B9a38E0c96F61d1bA6b42a61512D56Fea1Eb3` |
| Superfluid | VestingSchedulerV3 | `0x6Bf35A170056eDf9aEba159dce4a640cfCef9312` |
| Uniswap V4 | PoolManager | `0x498581fF718922c3f8e6A244956aF099B2652b2b` |
| Uniswap V4 | PositionManager | `0x7C5f5A4bBd8fD63184577525326123B519429bDc` |
| Uniswap | Permit2 | `0x000000000022D473030F116dDEE9F6B43aC78BA3` |
| Airstream | AirstreamFactory | `0xAB82062c4A9E4DF736238bcfA9fea15eb763bf69` |

---

## 4. Contract Ownership Transfer

### 4.1 Ownership Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    OWNERSHIP ARCHITECTURE                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   ADMIN MULTISIG                         │   │
│  │                   (Safe on Base)                         │   │
│  │                                                          │   │
│  │  Signers: Seth, Gene, Fred (2-of-3)                     │   │
│  └────────────────────────┬────────────────────────────────┘   │
│                           │                                     │
│         ┌─────────────────┼─────────────────┐                  │
│         │                 │                 │                  │
│         ▼                 ▼                 ▼                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐    │
│  │SpiritFactory│  │RewardCtrl   │  │StakingPool Beacon   │    │
│  │DEFAULT_ADMIN│  │DEFAULT_ADMIN│  │     owner           │    │
│  └─────────────┘  │DISTRIBUTOR  │  └─────────────────────┘    │
│                   └─────────────┘                               │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   TREASURY MULTISIG                      │   │
│  │                (Same as Admin or Separate)               │   │
│  └────────────────────────┬────────────────────────────────┘   │
│                           │                                     │
│                           ▼                                     │
│                   ┌─────────────────┐                          │
│                   │SpiritVesting    │                          │
│                   │   Factory       │                          │
│                   │  (treasury)     │                          │
│                   └─────────────────┘                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Role Assignments

| Contract | Role | Holder | Purpose |
|----------|------|--------|---------|
| SpiritFactory | DEFAULT_ADMIN_ROLE | Admin Multisig | Create agents, terminate airstreams |
| RewardController | DEFAULT_ADMIN_ROLE | Admin Multisig | Upgrade contract |
| RewardController | FACTORY_ROLE | SpiritFactory | Register staking pools |
| RewardController | DISTRIBUTOR_ROLE | Admin or Bot | Distribute rewards |
| StakingPool Beacon | owner | Admin Multisig | Upgrade staking implementation |
| SpiritVestingFactory | treasury | Treasury Multisig | Create/cancel vesting |

### 4.3 Post-Deployment Role Transfer

After deployment, the deployer must transfer roles:

```bash
# 1. Deployer revokes own admin from RewardController (automatic)
# This happens in SpiritDeployer.deployAll()

# 2. Verify roles transferred correctly
cast call $REWARD_CONTROLLER "hasRole(bytes32,address)" \
    0x00 $ADMIN_MULTISIG --rpc-url $BASE_RPC_URL
# Should return: true

cast call $REWARD_CONTROLLER "hasRole(bytes32,address)" \
    0x00 $DEPLOYER --rpc-url $BASE_RPC_URL
# Should return: false

# 3. Verify beacon ownership
cast call $STAKING_POOL_BEACON "owner()" --rpc-url $BASE_RPC_URL
# Should return: $ADMIN_MULTISIG

# 4. Verify vesting factory treasury
cast call $VESTING_FACTORY "treasury()" --rpc-url $BASE_RPC_URL
# Should return: $TREASURY_MULTISIG
```

---

## 5. Migration Checklist

### 5.1 Pre-Migration

- [ ] Audit report received and reviewed
- [ ] All audit issues addressed in code
- [ ] Production multisig created on Base
- [ ] Multisig signers confirmed (Seth, Gene, Fred)
- [ ] Treasury wallet address confirmed
- [ ] Distributor address confirmed
- [ ] NetworkConfig.sol updated with production addresses
- [ ] Initial price calculations completed
- [ ] Token name/symbol finalized (SPIRIT)

### 5.2 Deployment

- [ ] Dry run on local fork successful
- [ ] Gas estimates within budget
- [ ] Deployment transaction broadcast
- [ ] All contracts deployed successfully
- [ ] Contract verification on BaseScan complete

### 5.3 Post-Deployment Verification

- [ ] SPIRIT token supply = 1,000,000,000
- [ ] Treasury balance = 750,000,000 SPIRIT
- [ ] SPIRIT/ETH LP position = 250,000,000 SPIRIT
- [ ] LP position owned by treasury
- [ ] Admin multisig has DEFAULT_ADMIN_ROLE on SpiritFactory
- [ ] Admin multisig has DEFAULT_ADMIN_ROLE on RewardController
- [ ] SpiritFactory has FACTORY_ROLE on RewardController
- [ ] Distributor has DISTRIBUTOR_ROLE on RewardController
- [ ] Deployer has NO admin roles remaining
- [ ] Beacon owner is admin multisig
- [ ] VestingFactory treasury is correct

### 5.4 First Agent Token

- [ ] Merkle tree generated
- [ ] Artist address confirmed
- [ ] Agent address confirmed
- [ ] createChild() transaction successful
- [ ] Child token supply = 1,000,000,000
- [ ] Artist stake = 250,000,000 (52-week lock)
- [ ] Agent stake = 250,000,000 (52-week lock)
- [ ] LP position = 250,000,000 CHILD
- [ ] Airstream = 250,000,000 CHILD
- [ ] StakingPool registered in RewardController

### 5.5 Operational Readiness

- [ ] Reward distribution tested
- [ ] Staking flow tested (stake/increase/unstake)
- [ ] Vesting creation tested
- [ ] UI integration complete
- [ ] Monitoring alerts configured
- [ ] Documentation published

---

## 6. Deprecated Infrastructure

### 6.1 What Gets Deprecated

All testnet deployments should be considered deprecated:

| Category | Items | Action |
|----------|-------|--------|
| Ethereum Sepolia contracts | 6 contracts | Do not reference |
| Base Sepolia contracts | 6 contracts | Do not reference |
| Testnet tokens (SECRETv3) | 2 tokens | No value |
| Testnet LP positions | Any created | No value |
| Testnet stakes | Any created | No rewards |

### 6.2 Old Repository References

| Repository | Status | Notes |
|------------|--------|-------|
| `0xPilou/spirit-contracts` | Upstream | Source of audited code |
| `spirit-protocol/spirit-contracts-core` | Production | Fork for deployment |

### 6.3 Documentation Cleanup

After migration, update all documentation to:

- [ ] Remove testnet addresses from user-facing docs
- [ ] Update contract addresses to mainnet
- [ ] Update RPC URLs to Base mainnet
- [ ] Update block explorer links to BaseScan
- [ ] Archive testnet deployment logs

---

## 7. Post-Migration Verification

### 7.1 Functional Tests

Run these tests after mainnet deployment:

```bash
# 1. Token Supply Check
SPIRIT_TOKEN=0x...  # Fill in after deployment
cast call $SPIRIT_TOKEN "totalSupply()" --rpc-url https://mainnet.base.org
# Expected: 1000000000000000000000000000

# 2. Treasury Balance
TREASURY=0x...
cast call $SPIRIT_TOKEN "balanceOf(address)" $TREASURY --rpc-url https://mainnet.base.org
# Expected: 750000000000000000000000000

# 3. Role Verification
REWARD_CONTROLLER=0x...
ADMIN_MULTISIG=0x...
cast call $REWARD_CONTROLLER "hasRole(bytes32,address)" \
    $(cast keccak "DEFAULT_ADMIN_ROLE") $ADMIN_MULTISIG \
    --rpc-url https://mainnet.base.org
# Expected: true

# 4. Factory Role
SPIRIT_FACTORY=0x...
cast call $REWARD_CONTROLLER "hasRole(bytes32,address)" \
    $(cast keccak "FACTORY_ROLE") $SPIRIT_FACTORY \
    --rpc-url https://mainnet.base.org
# Expected: true

# 5. Beacon Ownership
STAKING_BEACON=0x...
cast call $STAKING_BEACON "owner()" --rpc-url https://mainnet.base.org
# Expected: $ADMIN_MULTISIG
```

### 7.2 Integration Tests

| Test | Method | Expected Result |
|------|--------|-----------------|
| Create agent token | Call `createChild()` from multisig | Child token + staking pool deployed |
| Stake tokens | User calls `stake()` | Units assigned, CHILD transferred |
| Distribute rewards | Call `distributeRewards()` | SPIRIT flows to stakers |
| Claim airstream | User claims with merkle proof | CHILD tokens streaming |
| Create vesting | Treasury calls `createSpiritVestingContract()` | Vesting schedule active |

### 7.3 Monitoring Setup

Configure monitoring for:

| Event | Contract | Alert Level |
|-------|----------|-------------|
| ChildTokenCreated | SpiritFactory | Info |
| Staked | StakingPool (any) | Info |
| Unstaked | StakingPool (any) | Info |
| VestingDeleted | SpiritVesting (any) | Warning |
| RoleGranted | RewardController | Critical |
| RoleRevoked | RewardController | Critical |
| Upgraded | Any proxy | Critical |

### 7.4 Emergency Procedures

If issues are discovered post-deployment:

1. **Pause rewards**: `terminateDistribution()` on RewardController
2. **Stop airdrop**: `terminateAirstream()` on SpiritFactory
3. **Cancel vesting**: `cancelVesting()` on individual SpiritVesting contracts
4. **Upgrade contracts**: Via multisig using `upgradeTo()` (requires new audited implementation)

---

## Appendix A: Address Summary

### Production (Base Mainnet - Chain ID 8453)

```bash
# Core Protocol (TBD after deployment)
export SPIRIT_TOKEN=
export REWARD_CONTROLLER=
export STAKING_POOL_BEACON=
export SPIRIT_FACTORY=
export SPIRIT_VESTING_FACTORY=

# Governance (TBD)
export ADMIN_MULTISIG=
export TREASURY_MULTISIG=
export DISTRIBUTOR=

# External (Fixed)
export SUPER_TOKEN_FACTORY=0xe20B9a38E0c96F61d1bA6b42a61512D56Fea1Eb3
export VESTING_SCHEDULER=0x6Bf35A170056eDf9aEba159dce4a640cfCef9312
export POOL_MANAGER=0x498581fF718922c3f8e6A244956aF099B2652b2b
export POSITION_MANAGER=0x7C5f5A4bBd8fD63184577525326123B519429bDc
export PERMIT2=0x000000000022D473030F116dDEE9F6B43aC78BA3
export AIRSTREAM_FACTORY=0xAB82062c4A9E4DF736238bcfA9fea15eb763bf69
```

### Deprecated (Do Not Use)

```bash
# Ethereum Sepolia - DEPRECATED
# Base Sepolia - DEPRECATED
```

---

## Appendix B: Migration Timeline

| Date | Milestone | Owner |
|------|-----------|-------|
| Nov 28, 2025 | Audit complete | 0xSimao |
| Dec 9, 2025 | Documentation complete | Claude |
| TBD | Multisig deployed | Seth/Gene/Fred |
| TBD | NetworkConfig updated | Henry |
| TBD | Mainnet deployment | Deployer |
| TBD | Contract verification | Deployer |
| TBD | Role transfer verified | Team |
| TBD | First agent created | Team |
| TBD | Public launch | Team |

---

## Appendix C: Contact Information

| Role | Name | Contact |
|------|------|---------|
| Contract Author | Henry (0xPilou) | GitHub |
| Auditor | 0xSimao | GitHub |
| Protocol Lead | Seth | TBD |
| Technical Lead | Gene | TBD |
| Operations | Fred | TBD |

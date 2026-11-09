> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Earn Vaults

> Learn how to build with Earn

## Overview

Integrating Kamino's Earn vaults lets users supply tokens to curated lending strategies on Solana. Deposits are routed to lending markets according to the vault configuration, and interest from borrowers becomes yield for depositors. On deposit, users receive share tokens representing their position. If the vault has a farm attached, shares are automatically staked in the farm and are not visible in the user's wallet. If the vault has no farm, shares remain in the user's wallet.

## Key Components of Earn Integration

> **Vault Operations**
>
> Deposit, withdraw, and track user positions in the Lend program.

> **Yield Tracking**
>
> Read APY and performance from the public API or on-chain accounts, present recent and longer windows.

## Ways to Fetch Data

> **Public API**
>
> Simplest source for vault lists, APY, TVL, status.

> **SDK**
>
> Helpers to deposit, withdraw, and read user positions.

### Deposit

**TypeScript**

```typescript theme={null}
import { createSolanaRpc, address } from '@solana/kit';
import { KaminoManager, KaminoVault, getMedianSlotDurationInMsFromLastEpochs } from '@kamino-finance/klend-sdk';
import { Decimal } from 'decimal.js';

const rpc = createSolanaRpc('https://api.mainnet-beta.solana.com');
const slotDuration = await getMedianSlotDurationInMsFromLastEpochs();
const manager = new KaminoManager(rpc, slotDuration);
const vault = new KaminoVault(rpc, address('HDsayqAsDWy3QvANGqh2yNraqcD8Fnjgh73Mhb3WRS5E'), slotDuration);

const vaultState = await vault.getState();
const vaultReservesMap = await manager.loadVaultReserves(vaultState);
const farmState = await manager.loadVaultFarmState(vaultState);

// Deposit 100 USDC
const { depositIxs, stakeInFarmIfNeededIxs } = await vault.depositIxs(
  user,  // TransactionSigner (multisig cannot sign directly)
  new Decimal(100.0),  // amount in tokens
  vaultReservesMap,
  farmState,
  null
);

console.log('Deposit Instructions:', [...depositIxs, ...stakeInFarmIfNeededIxs]);
```

[View Code](https://github.com/Kamino-Finance/klend-sdk/blob/master/examples/kvault-tutorial/earn-vaults-04-user-deposit-example/index.ts)

**Rust**

```rust expandable theme={null}
use kvault_interface::{
    from_account_data, helpers, pda, state::VaultState, ReserveInfo, VaultInfo, KVAULT_PROGRAM_ID,
};
use solana_client::rpc_client::RpcClient;
use solana_pubkey::Pubkey;
use spl_associated_token_account::get_associated_token_address;

let rpc = RpcClient::new("https://api.mainnet-beta.solana.com".to_string());
let vault_pubkey: Pubkey = "HDsayqAsDWy3QvANGqh2yNraqcD8Fnjgh73Mhb3WRS5E".parse().unwrap();

// Load the vault + its active reserves (their lending markets are needed to refresh klend on-chain)
let vault_data = rpc.get_account(&vault_pubkey).unwrap();
let vault_state = from_account_data::<VaultState>(&vault_data.data).unwrap();
let mut reserve_infos = Vec::new();
for reserve in VaultInfo::active_reserve_addresses(vault_state) {
    let acc = rpc.get_account(&reserve).unwrap();
    reserve_infos.push(ReserveInfo::from_account_data(reserve, &acc.data).unwrap());
}
let vault = VaultInfo::from_account_data(vault_pubkey, &vault_data.data, &reserve_infos).unwrap();

// Derive the user's token + shares ATAs
let user_token_ata = get_associated_token_address(&owner, &vault.token_mint);
let (shares_mint, _) = pda::shares_mint(&KVAULT_PROGRAM_ID, &vault_pubkey);
let user_shares_ata = get_associated_token_address(&owner, &shares_mint);

// Build a deposit instruction for 1 USDC — PDAs + remaining accounts are derived for you
let deposit_ix =
    helpers::deposit::deposit(&vault, owner, user_token_ata, user_shares_ata, 1_000_000);
```

> [!NOTE]
>
> For the full deposit example, including transaction sending and confirmation, check out [Deposit Operations](https://kamino.com/docs/build/developers/earn/operations/deposit.md).

### Withdraw

**TypeScript**

```typescript theme={null}
import { createSolanaRpc, address } from '@solana/kit';
import {
  KaminoManager,
  KaminoVault,
  getCurrentLedgerInstant,
  getMedianSlotDurationInMsFromLastEpochs,
} from '@kamino-finance/klend-sdk';
import { Decimal } from 'decimal.js';

const rpc = createSolanaRpc('https://api.mainnet-beta.solana.com');
const slotDuration = await getMedianSlotDurationInMsFromLastEpochs();
const manager = new KaminoManager(rpc, slotDuration);
const vault = new KaminoVault(rpc, address('HDsayqAsDWy3QvANGqh2yNraqcD8Fnjgh73Mhb3WRS5E'), slotDuration);

const vaultState = await vault.getState();
const vaultReservesMap = await manager.loadVaultReserves(vaultState);
const farmState = await manager.loadVaultFarmState(vaultState);

// Withdraw 1.5 shares
const { unstakeFromFarmIfNeededIxs, withdrawIxs, postWithdrawIxs } = await vault.withdrawIxs(
  user,  // TransactionSigner (multisig cannot sign directly)
  new Decimal(1.5),  // shares to withdraw
  await getCurrentLedgerInstant(rpc),
  vaultReservesMap,
  farmState,
  null
);

console.log('Withdraw Instructions:', [...unstakeFromFarmIfNeededIxs, ...withdrawIxs, ...postWithdrawIxs]);
```

[View Code](https://github.com/Kamino-Finance/klend-sdk/blob/master/examples/kvault-tutorial/earn-vaults-05-user-withdraw-example/index.ts)

**Rust**

```rust expandable theme={null}
use kvault_interface::{
    from_account_data, helpers, pda, state::VaultState, ReserveInfo, VaultInfo, KVAULT_PROGRAM_ID,
};
use solana_client::rpc_client::RpcClient;
use solana_pubkey::Pubkey;
use spl_associated_token_account::get_associated_token_address;

let rpc = RpcClient::new("https://api.mainnet-beta.solana.com".to_string());
let vault_pubkey: Pubkey = "HDsayqAsDWy3QvANGqh2yNraqcD8Fnjgh73Mhb3WRS5E".parse().unwrap();
let reserve_pubkey: Pubkey = "D6q6wuQSrifJKZYpR1M8R4YawnLDtDsMmWM1NbBmgJ59".parse().unwrap();

// Load the vault, the disinvest-target reserve, and every active reserve
let vault_data = rpc.get_account(&vault_pubkey).unwrap();
let reserve_data = rpc.get_account(&reserve_pubkey).unwrap();
let reserve = ReserveInfo::from_account_data(reserve_pubkey, &reserve_data.data).unwrap();
let vault_state = from_account_data::<VaultState>(&vault_data.data).unwrap();
let mut reserve_infos = Vec::new();
for r in VaultInfo::active_reserve_addresses(vault_state) {
    let acc = rpc.get_account(&r).unwrap();
    reserve_infos.push(ReserveInfo::from_account_data(r, &acc.data).unwrap());
}
let vault = VaultInfo::from_account_data(vault_pubkey, &vault_data.data, &reserve_infos).unwrap();

let user_token_ata = get_associated_token_address(&owner, &vault.token_mint);
let (shares_mint, _) = pda::shares_mint(&KVAULT_PROGRAM_ID, &vault_pubkey);
let user_shares_ata = get_associated_token_address(&owner, &shares_mint);

// Burn 1.5 shares (raw units) — disinvests from the reserve if available liquidity is low
let withdraw_ix =
    helpers::withdraw::withdraw(&vault, owner, user_token_ata, user_shares_ata, &reserve, 1_500_000);
```

> [!NOTE]
>
> For the full withdraw example, including transaction sending and confirmation, check out [Withdraw Operations](https://kamino.com/docs/build/developers/earn/operations/withdraw.md).

## Key Data Structures

**TypeScript**

##### VaultState

```typescript theme={null}
class VaultState {
  tokenMint: Address
  tokenVault: Address
  sharesMint: Address
  tokenAvailable: BN
  sharesIssued: BN
  performanceFeeBps: BN
  managementFeeBps: BN
  vaultAllocationStrategy: Array<VaultAllocation>
  unallocatedTokensCap: BN
  unallocatedWeight: BN
  minDepositAmount: BN
  withdrawalPenaltyLamports: BN
  withdrawalPenaltyBps: BN
  cumulativeEarnedInterestSf: BN
  cumulativeMgmtFeesSf: BN
  cumulativePerfFeesSf: BN
  name: Array<number>
  vaultFarm: Address
  creationTimestamp: BN
  allowAllocationsInWhitelistedReservesOnly: Boolean
  allowInvestInWhitelistedReservesOnly: Boolean
}
```

[View Full TypeScript VaultState](https://github.com/Kamino-Finance/klend-sdk/blob/636ccc98fd3aacfb49ed5d9d5f74ba527a9c75f9/src/%40codegen/kvault/accounts/VaultState.ts#L96)

**Fields**

| Field | Type | Description |
| - | - | - |
| `tokenMint` | `Address` | SPL token mint address that this vault accepts |
| `tokenVault` | `Address` | Vault's token account holding deposited assets |
| `sharesMint` | `Address` | Mint address for vault share tokens |
| `tokenAvailable` | `BN` | Amount of tokens available in the vault (lamports) |
| `sharesIssued` | `BN` | Total number of vault shares issued to depositors (lamports) |
| `performanceFeeBps` | `BN` | Performance fee in basis points (100 = 1%) |
| `managementFeeBps` | `BN` | Management fee in basis points |
| `vaultAllocationStrategy` | `Array<VaultAllocation>` | Array of allocation strategies across reserves |
| `unallocatedTokensCap` | `BN` | Maximum unallocated token amount (lamports) |
| `unallocatedWeight` | `BN` | Relative weight for unallocated funds |
| `minDepositAmount` | `BN` | Minimum deposit amount per transaction (lamports) |
| `withdrawalPenaltyLamports` | `BN` | Absolute withdrawal penalty |
| `withdrawalPenaltyBps` | `BN` | Percentage withdrawal penalty |
| `cumulativeEarnedInterestSf` | `BN` | Cumulative earned interest (scaled fraction) |
| `cumulativeMgmtFeesSf` | `BN` | Cumulative management fees (scaled fraction) |
| `cumulativePerfFeesSf` | `BN` | Cumulative performance fees (scaled fraction) |
| `name` | `Array<number>` | Vault name as byte array |
| `vaultFarm` | `Address` | Associated farm address for rewards |
| `creationTimestamp` | `BN` | Unix timestamp of vault creation |
| `allowAllocationsInWhitelistedReservesOnly` | `Boolean` | Restrict allocations to verified reserves |
| `allowInvestInWhitelistedReservesOnly` | `Boolean` | Restrict investments to verified reserves |

**VaultAllocation Structure**

\
&#x20;VaultAllocation

```typescript theme={null}
class VaultAllocation {
  reserve: Address
  ctokenVault: Address
  targetAllocationWeight: BN
  tokenAllocationCap: BN
  ctokenAllocation: BN
  reserveType: number
  priority: number
  lastInvestSlot: BN
  tokenTargetAllocationSf: BN
}
```

[View Full TypeScript VaultAllocation](https://github.com/Kamino-Finance/klend-sdk/blob/636ccc98fd3aacfb49ed5d9d5f74ba527a9c75f9/src/%40codegen/kvault/types/VaultAllocation.ts#L35)

| Field | Type | Description |
| - | - | - |
| `reserve` | `Address` | Lending reserve address where funds are allocated |
| `ctokenVault` | `Address` | Vault's cToken account for this reserve |
| `targetAllocationWeight` | `BN` | Relative integer weight for this allocation |
| `tokenAllocationCap` | `BN` | Maximum tokens that can be allocated to this reserve |
| `ctokenAllocation` | `BN` | Current amount of cTokens held in this allocation |
| `reserveType` | `number` | `standard` or `conditional` (as number); Allocation behavior (see Reserve Types) |
| `priority` | `number` | Priority ordering for conditional investments (see Reserve Types) |
| `lastInvestSlot` | `BN` | Last slot when funds were invested in this reserve |
| `tokenTargetAllocationSf` | `BN` | Target allocation amount (scaled fraction) |

**JSON**

##### VaultState

```json theme={null}
{
  "tokenMint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  "tokenVault": "...",
  "sharesMint": "...",
  "tokenAvailable": "1000000000000",
  "sharesIssued": "950000000000",
  "performanceFeeBps": "1500",
  "managementFeeBps": "200",
  "vaultAllocationStrategy": [],
  "unallocatedTokensCap": "0",
  "unallocatedWeight": "0",
  "minDepositAmount": "0",
  "withdrawalPenaltyLamports": "0",
  "withdrawalPenaltyBps": "0",
  "cumulativeEarnedInterestSf": "0",
  "cumulativeMgmtFeesSf": "0",
  "cumulativePerfFeesSf": "0",
  "name": [99, 108, 105, 102, 102, 111, 114, 100],
  "vaultFarm": "...",
  "creationTimestamp": "1234567890",
  "allowAllocationsInWhitelistedReservesOnly": false,
  "allowInvestInWhitelistedReservesOnly": false
}
```

[View Full VaultStateJSON](https://github.com/Kamino-Finance/klend-sdk/blob/636ccc98fd3aacfb49ed5d9d5f74ba527a9c75f9/src/%40codegen/kvault/accounts/VaultState.ts#L57C1-L94C2)

**Fields**

| Field | Type | Description |
| - | - | - |
| `tokenMint` | `string` | SPL token mint address that this vault accepts |
| `tokenVault` | `string` | Vault's token account holding deposited assets |
| `sharesMint` | `string` | Mint address for vault share tokens |
| `tokenAvailable` | `string` | Amount of tokens available in the vault |
| `sharesIssued` | `string` | Total number of vault shares issued to depositors |
| `performanceFeeBps` | `string` | Performance fee in basis points (100 = 1%) |
| `managementFeeBps` | `string` | Management fee in basis points |
| `vaultAllocationStrategy` | `array` | Array of allocation strategies across reserves |
| `unallocatedTokensCap` | `string` | Maximum unallocated token amount (lamports) |
| `unallocatedWeight` | `string` | Relative weight for unallocated funds |
| `minDepositAmount` | `string` | Minimum deposit amount per transaction (lamports) |
| `withdrawalPenaltyLamports` | `string` | Absolute withdrawal penalty |
| `withdrawalPenaltyBps` | `string` | Percentage withdrawal penalty |
| `cumulativeEarnedInterestSf` | `string` | Cumulative earned interest (scaled fraction) |
| `cumulativeMgmtFeesSf` | `string` | Cumulative management fees (scaled fraction) |
| `cumulativePerfFeesSf` | `string` | Cumulative performance fees (scaled fraction) |
| `name` | `array` | Vault name as byte array |
| `vaultFarm` | `string` | Associated farm address for rewards |
| `creationTimestamp` | `string` | Unix timestamp of vault creation |
| `allowAllocationsInWhitelistedReservesOnly` | `boolean` | Restrict allocations to verified reserves |
| `allowInvestInWhitelistedReservesOnly` | `boolean` | Restrict investments to verified reserves |

**VaultAllocation Structure**

\
&#x20;VaultAllocationJSON

```json theme={null}
{
  "reserve": "...",
  "ctokenVault": "...",
  "targetAllocationWeight": "100",
  "tokenAllocationCap": "1000000000",
  "ctokenAllocation": "500000000",
  "reserveType": 0,
  "priority": 0,
  "lastInvestSlot": "123456789",
  "tokenTargetAllocationSf": "0"
}
```

[View Full VaultAllocationJSON](https://github.com/Kamino-Finance/klend-sdk/blob/636ccc98fd3aacfb49ed5d9d5f74ba527a9c75f9/src/%40codegen/kvault/types/VaultAllocation.ts#L21C1-L33C2)

| Field | Type | Description |
| - | - | - |
| `reserve` | `string` | Lending reserve address where funds are allocated |
| `ctokenVault` | `string` | Vault's cToken account for this reserve |
| `targetAllocationWeight` | `string` | Relative integer weight for this allocation |
| `tokenAllocationCap` | `string` | Maximum tokens that can be allocated to this reserve |
| `ctokenAllocation` | `string` | Current amount of cTokens held in this allocation |
| `reserveType` | `number` | `0` = standard, `1` = conditional; allocation behavior (see Reserve Types) |
| `priority` | `number` | Priority ordering for conditional investments (see Reserve Types) |
| `lastInvestSlot` | `string` | Last slot when funds were invested in this reserve |
| `tokenTargetAllocationSf` | `string` | Target allocation amount (scaled fraction) |

**Rust**

##### VaultState

```rust theme={null}
pub struct VaultState {
  pub token_mint: Pubkey
  pub token_vault: Pubkey
  pub shares_mint: Pubkey
  pub token_available: u64
  pub shares_issued: u64
  pub performance_fee_bps: u64
  pub management_fee_bps: u64
  pub vault_allocation_strategy: [VaultAllocation; MAX_RESERVES]
  pub unallocated_tokens_cap: u64
  pub unallocated_weight: u64
  pub min_deposit_amount: u64
  pub withdrawal_penalty_lamports: u64
  pub withdrawal_penalty_bps: u64
  pub cumulative_earned_interest_sf: u128
  pub cumulative_mgmt_fees_sf: u128
  pub cumulative_perf_fees_sf: u128
  pub name: [u8; 40]
  pub vault_farm: Pubkey
  pub creation_timestamp: u64
  pub allow_allocations_in_whitelisted_reserves_only: bool
  pub allow_invest_in_whitelisted_reserves_only: bool
}
```

[View Full Rust VaultState](https://github.com/Kamino-Finance/kvault/blob/0321f6287d236b8286495ff7b7a410fcb93f0599/programs/kvault/src/state.rs#L17)

**Fields**

| Field | Type | Description |
| - | - | - |
| `token_mint` | `Pubkey` | SPL token mint address that this vault accepts |
| `token_vault` | `Pubkey` | Vault's token account holding deposited assets |
| `shares_mint` | `Pubkey` | Mint address for vault share tokens |
| `token_available` | `u64` | Amount of tokens available in the vault |
| `shares_issued` | `u64` | Total number of vault shares issued to depositors |
| `performance_fee_bps` | `u64` | Performance fee in basis points (100 = 1%) |
| `management_fee_bps` | `u64` | Management fee in basis points |
| `vault_allocation_strategy` | `[VaultAllocation; MAX_RESERVES]` | Fixed array of allocation strategies across reserves (MAX\_RESERVES = 25) |
| `unallocated_tokens_cap` | `u64` | Maximum unallocated token amount (lamports) |
| `unallocated_weight` | `u64` | Relative weight for unallocated funds |
| `min_deposit_amount` | `u64` | Minimum deposit amount per transaction (lamports) |
| `withdrawal_penalty_lamports` | `u64` | Absolute withdrawal penalty |
| `withdrawal_penalty_bps` | `u64` | Percentage withdrawal penalty |
| `cumulative_earned_interest_sf` | `u128` | Cumulative earned interest (scaled fraction) |
| `cumulative_mgmt_fees_sf` | `u128` | Cumulative management fees (scaled fraction) |
| `cumulative_perf_fees_sf` | `u128` | Cumulative performance fees (scaled fraction) |
| `name` | `[u8; 40]` | Vault name as byte array |
| `vault_farm` | `Pubkey` | Associated farm address for rewards |
| `creation_timestamp` | `u64` | Unix timestamp of vault creation |
| `allow_allocations_in_whitelisted_reserves_only` | `bool` | Restrict allocations to verified reserves |
| `allow_invest_in_whitelisted_reserves_only` | `bool` | Restrict investments to verified reserves |

**VaultAllocation Structure**

\
&#x20;VaultAllocation

```rust theme={null}
pub struct VaultAllocation {
  pub reserve: Pubkey
  pub ctoken_vault: Pubkey
  pub target_allocation_weight: u64
  pub token_allocation_cap: u64
  pub ctoken_vault_bump: u64
  pub reserve_type: u8
  pub allocation_priority: u8
  pub ctoken_allocation: u64
  pub last_invest_slot: u64
  pub token_target_allocation_sf: u128
}
```

[View Full Rust VaultAllocation](https://github.com/Kamino-Finance/kvault/blob/0321f6287d236b8286495ff7b7a410fcb93f0599/programs/kvault/src/state.rs#L425)

| Field | Type | Description |
| - | - | - |
| `reserve` | `Pubkey` | Lending reserve address where funds are allocated |
| `ctoken_vault` | `Pubkey` | Vault's cToken account for this reserve |
| `target_allocation_weight` | `u64` | Relative integer weight for this allocation |
| `token_allocation_cap` | `u64` | Maximum tokens that can be allocated to this reserve |
| `ctoken_vault_bump` | `u64` | PDA bump seed for the cToken vault |
| `reserve_type` | `u8` | `standard` or `conditional` (as number); Allocation behavior (see Reserve Types) |
| `allocation_priority` | `u8` | Priority ordering for conditional investments (see Reserve Types) |
| `ctoken_allocation` | `u64` | Current amount of cTokens held in this allocation |
| `last_invest_slot` | `u64` | Last slot when funds were invested in this reserve |
| `token_target_allocation_sf` | `u128` | Target allocation amount (scaled fraction) |

## Relevant Links

> **[Fetch Vaults Data via the API](https://api-docs.kamino.com/)**
>
> Access vault metrics and performance data through REST endpoints.

> **[Smart contract repository](https://github.com/Kamino-Finance/klend)**
>
> Explore the on-chain program source code and documentation.

> **[NPM SDK package](https://www.npmjs.com/package/@kamino-finance/klend-sdk)**
>
> Install the TypeScript SDK to integrate vault operations.

> **[Rust Interface Crate](https://crates.io/crates/kvault-interface)**
>
> Lightweight instruction builder for Rust bots and on-chain CPI.

> **[More Earn tutorials](https://kamino.com/docs/build/tutorials/earn/index.md)**
>
> Step-by-step guides for building with Kamino Earn vaults.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
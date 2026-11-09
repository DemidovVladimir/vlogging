> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Borrow & Lend

> Learn how to build with Borrow

## Overview

Build lending applications on Solana using the Kamino TypeScript SDK, the Rust interface crate, or the REST API. This guide covers everything from basic setup to advanced transaction building for deposit, borrow, repay, and withdraw operations.

## Key Components of Borrow Integration

> **Lending Operations**
>
> Deposit collateral, borrow assets, repay debt, and withdraw - complete
> lending lifecycle management.

> **Loan Management**
>
> LTV ratios, health factors, obligation status and position monitoring for
> safe lending.

> **Market Analytics**
>
> APY tracking, utilization rates, reserve metrics from API and on-chain data.

## Integration Options

> **Public API**
>
> Access market data, borrow rates, reserve liquidity, and obligation status via REST endpoints. Language-agnostic.

> **TypeScript SDK**
>
> On-chain reads and transaction building for deposit, borrow, repay, and withdraw. TS/JS only.

> **Rust Interface Crate**
>
> Lightweight instruction builder for Rust bots and on-chain CPI.

### Deposit

**TypeScript**

```typescript theme={null}
import { createSolanaRpc, address, createNoopSigner } from '@solana/kit';
import {
  KaminoMarket,
  KaminoAction,
  VanillaObligation,
  PROGRAM_ID,
  getCurrentLedgerInstant,
  getMedianSlotDurationInMsFromLastEpochs,
} from '@kamino-finance/klend-sdk';
import BN from 'bn.js';

const rpc = createSolanaRpc('https://api.mainnet-beta.solana.com');
const marketPubkey = address('7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF');
const solMint = address('So11111111111111111111111111111111111111112');
const owner = createNoopSigner(address('EZC9wzVCvihCsCHEMGADYdsRhcpdRYWzSCZAVegSCfqY'));

const market = await KaminoMarket.load(rpc, marketPubkey, await getMedianSlotDurationInMsFromLastEpochs());
const solReserve = market!.getExistingFloatRateReserveByMint(solMint);

const depositAction = await KaminoAction.buildDepositTxns({
  kaminoMarket: market!,
  amount: new BN(10_000_000),
  reserveAddress: solReserve.address,
  owner,
  obligation: new VanillaObligation(PROGRAM_ID),
  useV2Ixs: true,
  scopeRefreshConfig: undefined,
  currentLedgerInstant: await getCurrentLedgerInstant(rpc),
});

console.log(KaminoAction.actionToIxLabels(depositAction));
```

[View Code](https://github.com/Kamino-Finance/klend-sdk/blob/master/examples/kvault-tutorial/earn-vaults-04-user-deposit-example/index.ts)

**Rust**

```rust theme={null}
use klend_interface::helpers;
use klend_interface::ReserveInfo;
use klend_interface::pda;
use klend_interface::KLEND_PROGRAM_ID;
use solana_client::rpc_client::RpcClient;
use solana_pubkey::Pubkey;
use solana_sdk::signer::keypair::read_keypair_file;
use solana_sdk::signer::Signer;
use solana_sdk::transaction::Transaction;
use solana_sdk::message::Message;
use spl_associated_token_account::get_associated_token_address;
use std::str::FromStr;

let rpc_client = RpcClient::new("https://api.mainnet-beta.solana.com");
let signer = read_keypair_file("/path/to/your/keypair.json")
    .expect("Failed to read keypair file");
let owner = signer.pubkey();

// Fetch reserve data from the chain
let reserve_pubkey = Pubkey::from_str("D6q6wuQSrifJKZYpR1M8R4YawnLDtDsMmWM1NbBmgJ59").unwrap();
let reserve_data = rpc_client.get_account(&reserve_pubkey)?;
let reserve = ReserveInfo::from_account_data(reserve_pubkey, &reserve_data.data)?;

// Derive user token accounts
let user_source_liquidity = get_associated_token_address(&owner, &reserve.liquidity_mint);
let (collateral_mint, _) = pda::reserve_collateral_mint(&KLEND_PROGRAM_ID, &reserve_pubkey);
let user_destination_collateral = get_associated_token_address(&owner, &collateral_mint);

// Build deposit instructions (includes refresh_reserve automatically)
let instructions = helpers::deposit::deposit(
    owner,
    &reserve,
    user_source_liquidity,
    user_destination_collateral,
    1_000_000, // 1 USDC (6 decimals)
);

// Build and send
let message = Message::new(&instructions, Some(&owner));
let recent_blockhash = rpc_client.get_latest_blockhash()?;
let tx = Transaction::new(&[&signer], message, recent_blockhash);
let signature = rpc_client.send_and_confirm_transaction(&tx)?;
println!("Deposit successful! Signature: {signature}");
```

> [!NOTE]
>
> For the full deposit example, including transaction sending and confirmation, check out [Deposit Operations](https://kamino.com/docs/build/developers/borrow/operations/deposit.md).

### Withdraw

**TypeScript**

```typescript theme={null}
import { createSolanaRpc, address, createNoopSigner } from '@solana/kit';
import {
  KaminoMarket,
  KaminoAction,
  VanillaObligation,
  PROGRAM_ID,
  getCurrentLedgerInstant,
  getMedianSlotDurationInMsFromLastEpochs,
} from '@kamino-finance/klend-sdk';
import BN from 'bn.js';

const rpc = createSolanaRpc('https://api.mainnet-beta.solana.com');
const marketPubkey = address('7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF');
const solMint = address('So11111111111111111111111111111111111111112');
const owner = createNoopSigner(address('EZC9wzVCvihCsCHEMGADYdsRhcpdRYWzSCZAVegSCfqY'));

const market = await KaminoMarket.load(rpc, marketPubkey, await getMedianSlotDurationInMsFromLastEpochs());
const solReserve = market!.getExistingFloatRateReserveByMint(solMint);
const obligation = await market!.getObligationByWallet(owner.address, new VanillaObligation(PROGRAM_ID));

if (!obligation) {
  console.log('No obligation found for', owner.address);
}

const withdrawAction = await KaminoAction.buildWithdrawTxns({
  kaminoMarket: market!,
  amount: new BN(5_000_000),
  reserveAddress: solReserve.address,
  owner,
  obligation: obligation!,
  useV2Ixs: true,
  scopeRefreshConfig: undefined,
  currentLedgerInstant: await getCurrentLedgerInstant(rpc),
});

console.log(KaminoAction.actionToIxLabels(withdrawAction));
```

[View Code](https://github.com/Kamino-Finance/klend-sdk/blob/master/examples/kvault-tutorial/earn-vaults-05-user-withdraw-example/index.ts)

**Rust**

```rust theme={null}
use klend_interface::ObligationContext;
use klend_interface::pda;
use klend_interface::KLEND_PROGRAM_ID;
use solana_client::rpc_client::RpcClient;
use solana_pubkey::Pubkey;
use solana_sdk::signer::keypair::read_keypair_file;
use solana_sdk::signer::Signer;
use solana_sdk::transaction::Transaction;
use solana_sdk::message::Message;
use spl_associated_token_account::get_associated_token_address;
use std::str::FromStr;

let rpc_client = RpcClient::new("https://api.mainnet-beta.solana.com");
let signer = read_keypair_file("/path/to/your/keypair.json")
    .expect("Failed to read keypair file");
let owner = signer.pubkey();

let lending_market = Pubkey::from_str("7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF").unwrap();
let reserve_pubkey = Pubkey::from_str("D6q6wuQSrifJKZYpR1M8R4YawnLDtDsMmWM1NbBmgJ59").unwrap();

// Derive and fetch the obligation
let (obligation_pubkey, _) = pda::obligation(
    &KLEND_PROGRAM_ID, 0, 0, &owner, &lending_market,
    &Pubkey::default(), &Pubkey::default(),
);
let obligation_data = rpc_client.get_account(&obligation_pubkey)?;

// Fetch all reserves referenced by the obligation
let reserve_addrs = ObligationContext::reserve_addresses_for_obligation(&obligation_data.data)?;
let reserve_accounts = rpc_client.get_multiple_accounts(&reserve_addrs)?;
let reserves: Vec<(Pubkey, &[u8])> = reserve_addrs.iter()
    .zip(reserve_accounts.iter())
    .filter_map(|(addr, acc)| acc.as_ref().map(|a| (*addr, a.data.as_slice())))
    .collect();
let ctx = ObligationContext::from_account_data(
    obligation_pubkey, &obligation_data.data, &reserves
)?;

// Derive user token account for the withdrawal token (e.g. USDC)
let liquidity_mint = Pubkey::from_str("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v").unwrap();
let user_dest_liquidity = get_associated_token_address(&owner, &liquidity_mint);

// Build withdraw instructions (includes refresh_reserves + refresh_obligation)
let instructions = ctx.withdraw(
    owner,
    &reserve_pubkey,
    user_dest_liquidity,
    1_000_000, // 1 USDC (6 decimals)
)?;

// Build and send
let message = Message::new(&instructions, Some(&owner));
let recent_blockhash = rpc_client.get_latest_blockhash()?;
let tx = Transaction::new(&[&signer], message, recent_blockhash);
let signature = rpc_client.send_and_confirm_transaction(&tx)?;
println!("Withdrawal successful! Signature: {signature}");
```

> [!NOTE]
>
> For the full withdraw example, including transaction sending and confirmation,
> check out [Withdraw Operations](https://kamino.com/docs/build/developers/borrow/operations/withdraw.md).

## Key Data Structures

**TypeScript**

##### Obligation

```typescript theme={null}
class Obligation {
	tag: BN;
	lastUpdate: types.LastUpdate;
	lendingMarket: Address;
	owner: Address;
	deposits: Array<types.ObligationCollateral>;
	lowestReserveDepositLiquidationLtv: BN;
	depositedValueSf: BN;
	borrows: Array<types.ObligationLiquidity>;
	borrowFactorAdjustedDebtValueSf: BN;
	borrowedAssetsMarketValueSf: BN;
	allowedBorrowValueSf: BN;
	unhealthyBorrowValueSf: BN;
	paddingDeprecatedAssetTiers: Array<number>;
	elevationGroup: number;
	numOfObsoleteDepositReserves: number;
	hasDebt: number;
	referrer: Address;
	borrowingDisabled: number;
	autodeleverageTargetLtvPct: number;
	lowestReserveDepositMaxLtvPct: number;
	numOfObsoleteBorrowReserves: number;
	ownershipTransferState: number;
	reserved: Array<number>;
	highestBorrowFactorPct: BN;
	autodeleverageMarginCallStartedTimestamp: BN;
	obligationOrders: Array<types.ObligationOrder>;
	headBorrowOrder: types.BorrowOrder;
	pendingOwner: Address;
	tailBorrowOrders: Array<types.BorrowOrder>;
}
```

&#x20;

[View Full TypeScript Obligation](https://github.com/Kamino-Finance/klend-sdk/blob/80f29fcda3ac954b400ceb3000999def487cff5c/src/%40codegen/klend/accounts/Obligation.ts#L145)

**Fields**

| Field | Type | Description |
| - | - | - |
| `tag` | `BN` | Version of the struct |
| `lastUpdate` | `types.LastUpdate` | Last update to collateral, liquidity, or their market values |
| `lendingMarket` | `Address` | Lending market address |
| `owner` | `Address` | Owner authority which can borrow liquidity |
| `deposits` | `Array<types.ObligationCollateral>` | Deposited collateral for the obligation, unique by deposit reserve address |
| `lowestReserveDepositLiquidationLtv` | `BN` | Worst LTV for the collaterals backing the loan, represented as a percentage |
| `depositedValueSf` | `BN` | Market value of deposits (scaled fraction) |
| `borrows` | `Array<types.ObligationLiquidity>` | Borrowed liquidity for the obligation, unique by borrow reserve address |
| `borrowFactorAdjustedDebtValueSf` | `BN` | Risk adjusted market value of borrows/debt (scaled fraction) |
| `borrowedAssetsMarketValueSf` | `BN` | Market value of borrows - used for max\_liquidatable\_borrowed\_amount (scaled fraction) |
| `allowedBorrowValueSf` | `BN` | The maximum borrow value at the weighted average loan to value ratio (scaled fraction) |
| `unhealthyBorrowValueSf` | `BN` | The dangerous borrow value at the weighted average liquidation threshold (scaled fraction) |
| `paddingDeprecatedAssetTiers` | `Array<number>` | Unused; replaced the deposit and borrow asset tiers |
| `elevationGroup` | `number` | The elevation group id the obligation opted into |
| `numOfObsoleteDepositReserves` | `number` | The number of obsolete reserves the obligation has a deposit in |
| `hasDebt` | `number` | Marked = 1 if borrows array is not empty, 0 = borrows empty |
| `referrer` | `Address` | Wallet address of the referrer |
| `borrowingDisabled` | `number` | Marked = 1 if borrowing disabled, 0 = borrowing enabled |
| `autodeleverageTargetLtvPct` | `number` | A target LTV set by the risk council when marking this obligation for deleveraging |
| `lowestReserveDepositMaxLtvPct` | `number` | The lowest max LTV found amongst the collateral deposits |
| `numOfObsoleteBorrowReserves` | `number` | The number of obsolete reserves the obligation has a borrow in |
| `ownershipTransferState` | `number` | Whether an ownership transfer to `pendingOwner` is in progress |
| `reserved` | `Array<number>` | Reserved space for future use |
| `highestBorrowFactorPct` | `BN` | The highest borrow factor percentage across all borrows |
| `autodeleverageMarginCallStartedTimestamp` | `BN` | Timestamp when risk council marked this obligation for deleveraging (zero if not applicable) |
| `obligationOrders` | `Array<types.ObligationOrder>` | Owner-defined, liquidator-executed orders (e.g., stop-loss, take-profit) |
| `headBorrowOrder` | `types.BorrowOrder` | The obligation's first fixed-rate borrow order |
| `pendingOwner` | `Address` | New owner of a pending ownership transfer |
| `tailBorrowOrders` | `Array<types.BorrowOrder>` | The obligation's other fixed-rate borrow orders |

**JSON**

##### Obligation

```json theme={null}
{
  "tag": "0",
  "lastUpdate": {},
  "lendingMarket": "...",
  "owner": "...",
  "deposits": [],
  "lowestReserveDepositLiquidationLtv": "0",
  "depositedValueSf": "0",
  "borrows": [],
  "borrowFactorAdjustedDebtValueSf": "0",
  "borrowedAssetsMarketValueSf": "0",
  "allowedBorrowValueSf": "0",
  "unhealthyBorrowValueSf": "0",
  "depositsAssetTiers": [],
  "borrowsAssetTiers": [],
  "elevationGroup": 0,
  "numOfObsoleteDepositReserves": 0,
  "hasDebt": 0,
  "referrer": "...",
  "borrowingDisabled": 0,
  "autodeleverageTargetLtvPct": 0,
  "lowestReserveDepositMaxLtvPct": 0,
  "numOfObsoleteBorrowReserves": 0,
  "reserved": [],
  "highestBorrowFactorPct": "0",
  "autodeleverageMarginCallStartedTimestamp": "0",
  "orders": [],
  "padding3": []
}
```

[View Full JSON Obligation](https://github.com/Kamino-Finance/klend-sdk/blob/80f29fcda3ac954b400ceb3000999def487cff5c/src/%40codegen/klend/accounts/Obligation.ts#L81)

**Fields**

| Field | Type | Description |
| - | - | - |
| `tag` | `string` | Version of the struct |
| `lastUpdate` | `object` | Last update to collateral, liquidity, or their market values |
| `lendingMarket` | `string` | Lending market address |
| `owner` | `string` | Owner authority which can borrow liquidity |
| `deposits` | `array` | Deposited collateral for the obligation, unique by deposit reserve address |
| `lowestReserveDepositLiquidationLtv` | `string` | Worst LTV for the collaterals backing the loan, represented as a percentage |
| `depositedValueSf` | `string` | Market value of deposits (scaled fraction) |
| `borrows` | `array` | Borrowed liquidity for the obligation, unique by borrow reserve address |
| `borrowFactorAdjustedDebtValueSf` | `string` | Risk adjusted market value of borrows/debt (scaled fraction) |
| `borrowedAssetsMarketValueSf` | `string` | Market value of borrows - used for max\_liquidatable\_borrowed\_amount (scaled fraction) |
| `allowedBorrowValueSf` | `string` | The maximum borrow value at the weighted average loan to value ratio (scaled fraction) |
| `unhealthyBorrowValueSf` | `string` | The dangerous borrow value at the weighted average liquidation threshold (scaled fraction) |
| `depositsAssetTiers` | `array` | The asset tier of the deposits |
| `borrowsAssetTiers` | `array` | The asset tier of the borrows |
| `elevationGroup` | `number` | The elevation group id the obligation opted into |
| `numOfObsoleteDepositReserves` | `number` | The number of obsolete reserves the obligation has a deposit in |
| `hasDebt` | `number` | Marked = 1 if borrows array is not empty, 0 = borrows empty |
| `referrer` | `string` | Wallet address of the referrer |
| `borrowingDisabled` | `number` | Marked = 1 if borrowing disabled, 0 = borrowing enabled |
| `autodeleverageTargetLtvPct` | `number` | A target LTV set by the risk council when marking this obligation for deleveraging |
| `lowestReserveDepositMaxLtvPct` | `number` | The lowest max LTV found amongst the collateral deposits |
| `numOfObsoleteBorrowReserves` | `number` | The number of obsolete reserves the obligation has a borrow in |
| `reserved` | `array` | Reserved space for future use |
| `highestBorrowFactorPct` | `string` | The highest borrow factor percentage across all borrows |
| `autodeleverageMarginCallStartedTimestamp` | `string` | Timestamp when risk council marked this obligation for deleveraging (zero if not applicable) |
| `orders` | `array` | Owner-defined, liquidator-executed orders (e.g., stop-loss, take-profit) |

**Rust**

##### Obligation

```rust theme={null}
pub struct Obligation {
    pub tag: u64,
    pub last_update: LastUpdate,
    pub lending_market: Pubkey,
    pub owner: Pubkey,
    pub deposits: [ObligationCollateral; 8],
    pub lowest_reserve_deposit_liquidation_ltv: u64,
    pub deposited_value_sf: PodU128,
    pub borrows: [ObligationLiquidity; 5],
    pub borrow_factor_adjusted_debt_value_sf: PodU128,
    pub borrowed_assets_market_value_sf: PodU128,
    pub allowed_borrow_value_sf: PodU128,
    pub unhealthy_borrow_value_sf: PodU128,
    pub padding_deprecated_asset_tiers: [u8; 13],
    pub elevation_group: u8,
    pub num_of_obsolete_deposit_reserves: u8,
    pub has_debt: u8,
    pub referrer: Pubkey,
    pub borrowing_disabled: u8,
    pub autodeleverage_target_ltv_pct: u8,
    pub lowest_reserve_deposit_max_ltv_pct: u8,
    pub num_of_obsolete_borrow_reserves: u8,
    pub ownership_transfer_state: u8,
    pub reserved: [u8; 3],
    pub highest_borrow_factor_pct: u64,
    pub autodeleverage_margin_call_started_timestamp: u64,
    pub obligation_orders: [ObligationOrder; 2],
    pub borrow_order: BorrowOrder,
    pub pending_owner: Pubkey,
    pub padding_3: [u64; 69],
}
```

&#x20;

[View Full Rust Obligation](https://github.com/Kamino-Finance/klend/blob/5b37d7522aa070fad87f2fcf30bdf2e19d9e607a/programs/klend/src/state/obligation.rs#L23)

**Fields**

| Field | Type | Description |
| - | - | - |
| `tag` | `u64` | Version of the struct |
| `last_update` | `LastUpdate` | Last update to collateral, liquidity, or their market values |
| `lending_market` | `Pubkey` | Lending market address |
| `owner` | `Pubkey` | Owner authority which can borrow liquidity |
| `deposits` | `[ObligationCollateral; 8]` | Deposited collateral for the obligation, unique by deposit reserve address |
| `lowest_reserve_deposit_liquidation_ltv` | `u64` | Worst LTV for the collaterals backing the loan, represented as a percentage |
| `deposited_value_sf` | `PodU128` | Market value of deposits (scaled fraction) |
| `borrows` | `[ObligationLiquidity; 5]` | Borrowed liquidity for the obligation, unique by borrow reserve address |
| `borrow_factor_adjusted_debt_value_sf` | `PodU128` | Risk adjusted market value of borrows/debt (scaled fraction) |
| `borrowed_assets_market_value_sf` | `PodU128` | Market value of borrows (scaled fraction) |
| `allowed_borrow_value_sf` | `PodU128` | The maximum borrow value at the weighted average loan to value ratio (scaled fraction) |
| `unhealthy_borrow_value_sf` | `PodU128` | The dangerous borrow value at the weighted average liquidation threshold (scaled fraction) |
| `padding_deprecated_asset_tiers` | `[u8; 13]` | Unused; replaced the deposit and borrow asset tiers |
| `elevation_group` | `u8` | The elevation group id the obligation opted into |
| `num_of_obsolete_deposit_reserves` | `u8` | The number of obsolete reserves the obligation has a deposit in |
| `has_debt` | `u8` | 1 if the borrows array is not empty, 0 if empty |
| `referrer` | `Pubkey` | Wallet address of the referrer |
| `borrowing_disabled` | `u8` | 1 if borrowing is disabled, 0 if enabled |
| `autodeleverage_target_ltv_pct` | `u8` | A target LTV set by the risk council when marking this obligation for deleveraging |
| `lowest_reserve_deposit_max_ltv_pct` | `u8` | The lowest max LTV found amongst the collateral deposits |
| `num_of_obsolete_borrow_reserves` | `u8` | The number of obsolete reserves the obligation has a borrow in |
| `ownership_transfer_state` | `u8` | Whether an ownership transfer to `pending_owner` is in progress |
| `reserved` | `[u8; 3]` | Reserved space for future use |
| `highest_borrow_factor_pct` | `u64` | The highest borrow factor percentage across all borrows |
| `autodeleverage_margin_call_started_timestamp` | `u64` | Timestamp when risk council marked this obligation for deleveraging (zero if not applicable) |
| `obligation_orders` | `[ObligationOrder; 2]` | Owner-defined, liquidator-executed orders (e.g., stop-loss, take-profit) |
| `borrow_order` | `BorrowOrder` | The obligation's fixed-rate borrow order |
| `pending_owner` | `Pubkey` | New owner of a pending ownership transfer |
| `padding_3` | `[u64; 69]` | Reserved space for future use |

## Relevant Links

> **[Fetch Market Data via the API](https://api-docs.kamino.com/)**
>
> Access market metrics and performance data through REST endpoints.

> **[Smart contract repository](https://github.com/Kamino-Finance/klend)**
>
> Explore the on-chain program source code and documentation.

> **[NPM SDK package](https://www.npmjs.com/package/@kamino-finance/klend-sdk)**
>
> Install the TypeScript SDK to integrate borrowing and lending operations.

> **[Rust Interface Crate](https://crates.io/crates/klend-interface)**
>
> Lightweight Rust instruction builder for Kamino Lending operations.

> **[More Borrow tutorials](https://kamino.com/docs/build/tutorials/borrow/index.md)**
>
> Step-by-step guides for building with Kamino lending markets.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
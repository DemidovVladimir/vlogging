> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Build a Liquidation Bot with KSwap

> Build a bot that monitors obligations, identifies profitable pairs, swaps into debt tokens via KSwap, and executes liquidations

Liquidations on Kamino are permissionless. Any wallet can liquidate an unhealthy obligation and earn a bonus. Bots continuously monitor all obligations and execute when one crosses its health limit.

## Scanning for Unhealthy Positions

The first step is loading every obligation in a market and checking which ones have breached their health limit.

**TypeScript**

**Step 1**

### Import Dependencies

```typescript theme={null}
import { createSolanaRpc, createSolanaRpcSubscriptions, address } from '@solana/kit';
import {
  KaminoMarket,
  KaminoObligation,
  getCurrentLedgerInstant,
  getMedianSlotDurationInMsFromLastEpochs,
} from '@kamino-finance/klend-sdk';
import { parseKeypairFile } from '@kamino-finance/klend-sdk/dist/utils/signer.js';
```

**Step 2**

### Set Up RPC and Load Market

```typescript theme={null}
const KEYPAIR_FILE = '/path/to/your/keypair.json';
const liquidator = await parseKeypairFile(KEYPAIR_FILE);

const rpc = createSolanaRpc('https://your-private-rpc.example.com');
const rpcSubscriptions = createSolanaRpcSubscriptions('wss://your-private-rpc.example.com');
const marketPubkey = address('7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF'); // SOL/BTC Market

const market = await KaminoMarket.load(rpc, marketPubkey, await getMedianSlotDurationInMsFromLastEpochs());
```

> [!WARNING]
>
> Scanning reads every obligation in the market. Public RPC endpoints reject it, so use a private RPC. On the SOL/BTC Market it reads over 100,000 obligations and takes about five minutes.

> [!NOTE]
>
> Kamino operates multiple markets (SOL/BTC, JLP, Altcoins, Prime). A production bot should scan all of them. See [Markets](https://kamino.com/docs/products/borrow/markets.md) for the full list.

**Step 3**

### Scan Obligations in Batches

An obligation is liquidatable when its LTV reaches its liquidation LTV. The scan also tracks the obligation closest to liquidation.

```typescript theme={null}
const healthRatio = (obligation: KaminoObligation) => obligation.loanToValue().div(obligation.liquidationLtv());

const liquidatable: KaminoObligation[] = [];
let closest: KaminoObligation | undefined;
let scanned = 0;

for await (const batch of market!.batchGetAllObligationsForMarket(await getCurrentLedgerInstant(rpc))) {
  scanned += batch.length;
  const withDebt = batch.filter(
    (obligation) => obligation.refreshedStats.userTotalBorrow.gt(0) && obligation.liquidationLtv().gt(0)
  );
  liquidatable.push(...withDebt.filter((obligation) => healthRatio(obligation).gte(1)));
  closest = withDebt.reduce((a, b) => (healthRatio(b).gt(healthRatio(a!)) ? b : a), closest ?? withDebt[0]);
}

console.log(`Scanned ${scanned} obligations, ${liquidatable.length} liquidatable`);
```

> [!NOTE]
>
> `loanToValue()` and `liquidationLtv()` compute both at current prices over all deposits, the way the program checks. Don't use the obligation's stored values such as `getUnhealthyBorrowValue()`: they're from its last on-chain refresh and can mark a healthy obligation as liquidatable.

**Rust**

**Step 1**

### Add Dependencies

```toml theme={null}
[dependencies]
klend-interface = { version = "0.6.0", features = ["solana-account"] }
solana-pubkey = "2.1"
solana-instruction = "2.1"
solana-sdk = "~2.3"
solana-client = "~2.3"
solana-account = "2.1"
solana-account-decoder-client-types = "~2.3"
spl-token = "7"
spl-associated-token-account = "6"
reqwest = { version = "~0.12", features = ["blocking", "json"] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
bincode = "1"
base64 = "0.22"
```

> [!NOTE]
>
> `klend-interface` is a lightweight Rust instruction builder that creates `Vec<Instruction>` with required refresh instructions prepended automatically.

**Step 2**

### Set Up RPC Client

```rust theme={null}
use solana_client::rpc_client::RpcClient;
use solana_pubkey::Pubkey;
use std::str::FromStr;

let rpc_client = RpcClient::new("YOUR_RPC_URL");
let market = Pubkey::from_str("7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF")?;
```

> [!WARNING]
>
> Scanning obligations requires `getProgramAccounts`, which returns thousands of accounts per market. The public Solana RPC will reject these calls. Use a private RPC provider (Helius, Triton, QuickNode, etc.).

**Step 3**

### Fetch All Obligations

Fetch every obligation in the market using `get_program_accounts` with filters for the discriminator, lending market, and account size.

```rust theme={null}
use klend_interface::{
    state::{Obligation, SplDiscriminate},
    KLEND_PROGRAM_ID,
};
use solana_account::ReadableAccount;
use solana_account_decoder_client_types::UiAccountEncoding;
use solana_client::{
    rpc_config::{RpcAccountInfoConfig, RpcProgramAccountsConfig},
    rpc_filter::{Memcmp, RpcFilterType},
};

const OBLIGATION_ACCOUNT_SIZE: u64 = 8 + std::mem::size_of::<Obligation>() as u64;

let filters = vec![
    RpcFilterType::Memcmp(Memcmp::new_raw_bytes(
        0,
        Obligation::SPL_DISCRIMINATOR_SLICE.to_vec(),
    )),
    RpcFilterType::Memcmp(Memcmp::new_raw_bytes(32, market.to_bytes().to_vec())),
    RpcFilterType::DataSize(OBLIGATION_ACCOUNT_SIZE),
];

let config = RpcProgramAccountsConfig {
    filters: Some(filters),
    account_config: RpcAccountInfoConfig {
        encoding: Some(UiAccountEncoding::Base64Zstd),
        ..Default::default()
    },
    ..Default::default()
};

let accounts = rpc_client.get_program_accounts_with_config(&KLEND_PROGRAM_ID, config)?;
```

> [!WARNING]
>
> Obligation accounts exceed the 128-byte limit for base58 responses. Use `Base64Zstd` encoding or the RPC will silently return zero results.

**Step 4**

### Filter to Liquidatable Positions

Parse each obligation and check `is_liquidatable()`, which returns true when borrow-factor-adjusted debt exceeds the unhealthy borrow value.

```rust theme={null}
use klend_interface::Fraction;

let mut liquidatable = Vec::new();

for (pubkey, account) in &accounts {
    let obligation = klend_interface::from_account_data::<Obligation>(account.data())?;

    if obligation.has_debt == 0 {
        continue;
    }

    if obligation.is_liquidatable() {
        let debt: f64 = Fraction::from_bits(
            obligation.borrowed_assets_market_value()
        ).to_num();

        println!("Liquidatable: {pubkey} — debt: ${debt:.2}");
        liquidatable.push((*pubkey, obligation));
    }
}

println!("Initial candidates (stale prices): {}", liquidatable.len());
```

**Step 5**

### Verify with Fresh Prices

On-chain obligation values are only updated when `RefreshObligation` is called. Fetch fresh oracle prices from the Scope REST API and re-verify each candidate to avoid wasting transaction fees on false positives.

```rust theme={null}
use klend_interface::state::{Reserve, from_account_data};
use serde::Deserialize;
use std::collections::{HashMap, HashSet};

#[derive(Deserialize)]
struct OraclePrice {
    mint: String,
    price: String,
}

// Collect all reserve pubkeys from candidates
let reserve_pubkeys: Vec<Pubkey> = liquidatable
    .iter()
    .flat_map(|(_, obl)| {
        obl.deposits.iter().map(|d| d.deposit_reserve)
            .chain(obl.borrows.iter().map(|b| b.borrow_reserve))
            .filter(|pk| *pk != Pubkey::default())
    })
    .collect::<HashSet<_>>()
    .into_iter()
    .collect();

// Fetch reserves to map mints to prices and get borrow factors
let reserve_accounts = rpc_client.get_multiple_accounts(&reserve_pubkeys)?;
let reserve_map: HashMap<Pubkey, Reserve> = reserve_pubkeys
    .iter()
    .zip(reserve_accounts.iter())
    .filter_map(|(pk, acc)| {
        acc.as_ref().and_then(|a| {
            from_account_data::<Reserve>(&a.data).ok().map(|r| (*pk, *r))
        })
    })
    .collect();

// Fetch fresh prices from the Scope REST API
let fresh_prices: HashMap<String, f64> = reqwest::blocking::get(
    "https://api.kamino.finance/oracles/prices",
)
    .ok()
    .and_then(|r| r.json::<Vec<OraclePrice>>().ok())
    .map(|prices| prices.into_iter()
        .filter_map(|p| p.price.parse::<f64>().ok().map(|v| (p.mint, v)))
        .collect())
    .unwrap_or_default();

let mut verified = Vec::new();

for (pubkey, obligation) in &liquidatable {
    // Re-price deposits
    let mut fresh_deposited = 0.0f64;
    let mut fresh_unhealthy = 0.0f64;
    for deposit in &obligation.deposits {
        if deposit.deposit_reserve == Pubkey::default() { continue; }
        let reserve = match reserve_map.get(&deposit.deposit_reserve) {
            Some(r) => r,
            None => continue,
        };
        let mint = reserve.liquidity.mint_pubkey;
        let stale_price: f64 = Fraction::from_bits(
            u128::from(reserve.liquidity.market_price_sf)
        ).to_num();
        let price = fresh_prices.get(&mint.to_string()).copied().unwrap_or(stale_price);
        let amount: f64 = Fraction::from_bits(deposit.deposited_amount.into()).to_num();
        let value = amount / 10f64.powi(reserve.liquidity.mint_decimals as i32) * price;
        fresh_deposited += value;
        fresh_unhealthy += value * reserve.liquidation_threshold_pct() as f64 / 100.0;
    }

    // Re-price borrows
    let mut fresh_adjusted_debt = 0.0f64;
    for borrow in &obligation.borrows {
        if borrow.borrow_reserve == Pubkey::default() { continue; }
        let reserve = match reserve_map.get(&borrow.borrow_reserve) {
            Some(r) => r,
            None => continue,
        };
        let mint = reserve.liquidity.mint_pubkey;
        let stale_price: f64 = Fraction::from_bits(
            u128::from(reserve.liquidity.market_price_sf)
        ).to_num();
        let price = fresh_prices.get(&mint.to_string()).copied().unwrap_or(stale_price);
        let amount: f64 = Fraction::from_bits(borrow.borrowed_amount()).to_num();
        let value = amount / 10f64.powi(reserve.liquidity.mint_decimals as i32) * price;
        fresh_adjusted_debt += value * reserve.borrow_factor_pct() as f64 / 100.0;
    }

    // Still liquidatable at fresh prices?
    if fresh_adjusted_debt > fresh_unhealthy {
        verified.push((*pubkey, *obligation));
    }
}

println!("Verified {} out of {} candidates with fresh prices", verified.len(), liquidatable.len());
```

## Picking the Most Profitable Pair

An obligation can have multiple collateral deposits and multiple borrows. The liquidator must choose one debt token to repay and one collateral token to seize. The program enforces priority rules: target the lowest-threshold collateral and the highest-borrow-factor debt first.

**TypeScript**

**Step 1**

### Choose the Obligation

Liquidations are rare. When the scan finds none, print the closest obligation and stop before swapping anything.

```typescript theme={null}
if (liquidatable.length === 0) {
  console.log('Closest to liquidation:', closest?.obligationAddress, `health ratio ${closest && healthRatio(closest).toFixed(4)}`);
  process.exit(0);
}

const obligation = liquidatable[0];
```

**Step 2**

### Select the Target Pair

Seize the riskiest collateral (lowest liquidation threshold) and repay the most heavily weighted debt (highest borrow factor).

```typescript theme={null}
const [collateral] = obligation
  .getDeposits()
  .map((position) => market!.getReserveByAddress(position.reserveAddress)!)
  .filter((reserve) => reserve.state.config.loanToValuePct > 0)
  .sort((a, b) => a.state.config.liquidationThresholdPct - b.state.config.liquidationThresholdPct);

const [debtPosition] = obligation
  .getBorrows()
  .sort(
    (a, b) =>
      Number(market!.getReserveByAddress(b.reserveAddress)!.state.config.borrowFactorPct) -
      Number(market!.getReserveByAddress(a.reserveAddress)!.state.config.borrowFactorPct)
  );
const debtReserve = market!.getReserveByAddress(debtPosition.reserveAddress)!;
```

**Rust**

**Step 1**

### Fetch Reserve Data

Collect all unique reserve pubkeys from the obligation's deposits and borrows, then fetch and parse them in one RPC call.

```rust theme={null}
use klend_interface::state::{Reserve, from_account_data};
use std::collections::HashSet;

let active_deposits: Vec<_> = obligation
    .deposits
    .iter()
    .filter(|d| d.deposit_reserve != Pubkey::default())
    .collect();

let active_borrows: Vec<_> = obligation
    .borrows
    .iter()
    .filter(|b| b.borrow_reserve != Pubkey::default())
    .collect();

let reserve_pubkeys: Vec<Pubkey> = active_deposits
    .iter()
    .map(|d| d.deposit_reserve)
    .chain(active_borrows.iter().map(|b| b.borrow_reserve))
    .collect::<HashSet<_>>()
    .into_iter()
    .collect();

let reserve_accounts = rpc_client.get_multiple_accounts(&reserve_pubkeys)?;

let parsed_reserves: Vec<(Pubkey, Reserve)> = reserve_pubkeys
    .iter()
    .zip(reserve_accounts.iter())
    .filter_map(|(pk, acc_opt)| {
        let acc = acc_opt.as_ref()?;
        let reserve = from_account_data::<Reserve>(&acc.data).ok()?;
        Some((*pk, *reserve))
    })
    .collect();
```

**Step 2**

### Sort by Priority

Sort deposits by `liquidation_threshold_pct` ascending (weakest collateral first) and borrows by `borrow_factor_pct` descending (riskiest debt first).

```rust theme={null}
let mut deposit_pairs: Vec<(Pubkey, &Reserve)> = active_deposits
    .iter()
    .filter_map(|d| {
        parsed_reserves
            .iter()
            .find(|(pk, _)| *pk == d.deposit_reserve)
            .map(|(pk, r)| (*pk, r))
    })
    .collect();

deposit_pairs.sort_by_key(|(_, r)| r.liquidation_threshold_pct());

let mut borrow_pairs: Vec<(Pubkey, &Reserve)> = active_borrows
    .iter()
    .filter_map(|b| {
        parsed_reserves
            .iter()
            .find(|(pk, _)| *pk == b.borrow_reserve)
            .map(|(pk, r)| (*pk, r))
    })
    .collect();

borrow_pairs.sort_by(|(_, a), (_, b)| b.borrow_factor_pct().cmp(&a.borrow_factor_pct()));
```

**Step 3**

### Select the Target Pair

The first entry in each sorted list is the priority target. Collateral reserves with `loan_to_value_pct == 0` are deposit-only and cannot be seized.

```rust theme={null}
let withdraw_pair = deposit_pairs
    .iter()
    .find(|(_, r)| r.loan_to_value_pct() > 0);

let repay_pair = borrow_pairs.first();

match (withdraw_pair, repay_pair) {
    (Some((coll_pk, coll_reserve)), Some((debt_pk, debt_reserve))) => {
        println!("Seize collateral: {coll_pk} (mint: {})", coll_reserve.liquidity.mint_pubkey);
        println!("Repay debt: {debt_pk} (mint: {})", debt_reserve.liquidity.mint_pubkey);
    }
    _ => println!("No valid liquidation pair found"),
}
```

## Executing the Liquidation

Once an unhealthy obligation and target pair have been identified, build and send the liquidation transaction.

**TypeScript**

**Step 1**

### Import Transaction Utilities

```typescript theme={null}
import {
  pipe,
  createTransactionMessage,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  appendTransactionMessageInstructions,
  compressTransactionMessageUsingAddressLookupTables,
  signTransactionMessageWithSigners,
  assertIsTransactionWithinSizeLimit,
  sendAndConfirmTransactionFactory,
  getSignatureFromTransaction,
  type Address,
  type Instruction,
} from '@solana/kit';
import { fetchAllAddressLookupTable } from '@solana-program/address-lookup-table';
import { KaminoAction } from '@kamino-finance/klend-sdk';
import { KswapSdk, loadRouterContext } from '@kamino-finance/kswap-sdk';
import BN from 'bn.js';
import Decimal from 'decimal.js';
```

**Step 2**

### Calculate Repay Amount

One liquidation can repay up to the market's close factor share of the debt.

```typescript theme={null}
const SLIPPAGE_BPS = 50;
const MAX_COMPUTE_UNITS = 1_400_000;
const slippage = new Decimal(SLIPPAGE_BPS).div(10_000);

const repayLamports = debtPosition.amount.mul(market!.state.liquidationMaxDebtCloseFactorPct).div(100).floor();
const repayUsd = repayLamports.div(debtReserve.getMintFactor()).mul(debtReserve.getOracleMarketPrice());

console.log(`Liquidating ${obligation.obligationAddress}: repay ${repayUsd.toFixed(2)} USD of ${debtReserve.getTokenSymbol()}`);
```

**Step 3**

### Size the SOL Swap

Price the repay in SOL with the market's own oracle prices, plus slippage, and check the wallet holds it.

```typescript theme={null}
const solMint = address('So11111111111111111111111111111111111111112');
const solReserve = market!.getExistingFloatRateReserveByMint(solMint);

const solLamports = repayUsd
  .div(solReserve.getOracleMarketPrice())
  .mul(solReserve.getMintFactor())
  .mul(slippage.plus(1))
  .ceil();

const { value: balance } = await rpc.getBalance(liquidator.address).send();
if (solLamports.gt(balance.toString())) {
  console.log(`Not enough SOL: need ${solLamports.div(solReserve.getMintFactor())} SOL for the swap`);
  process.exit(0);
}
```

**Step 4**

### Define a Send Helper

```typescript theme={null}
const sendAndConfirm = sendAndConfirmTransactionFactory({ rpc, rpcSubscriptions });

async function send(instructions: Instruction[], lookupTableAddresses: Record<Address, Address[]>) {
  const { value: latestBlockhash } = await rpc.getLatestBlockhash({ commitment: 'finalized' }).send();
  const signedTransaction = await signTransactionMessageWithSigners(
    pipe(
      createTransactionMessage({ version: 0 }),
      (tx) => setTransactionMessageFeePayerSigner(liquidator, tx),
      (tx) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
      (tx) => appendTransactionMessageInstructions(instructions, tx),
      (tx) => compressTransactionMessageUsingAddressLookupTables(tx, lookupTableAddresses)
    )
  );
  assertIsTransactionWithinSizeLimit(signedTransaction);
  await sendAndConfirm(signedTransaction, { commitment: 'confirmed', skipPreflight: true });
  return getSignatureFromTransaction(signedTransaction);
}
```

**Step 5**

### Swap SOL into the Debt Token via KSwap

```typescript theme={null}
const kswap = new KswapSdk('https://api.kamino.finance/kswap', rpc, rpcSubscriptions);

const { routes } = await kswap.getAllRoutes(
  {
    executor: liquidator.address,
    tokenIn: solMint,
    tokenOut: debtPosition.mintAddress,
    amount: new BN(solLamports.toFixed(0)),
    maxSlippageBps: SLIPPAGE_BPS,
    swapType: 'exactIn',
    wrapAndUnwrapSol: true,
  },
  await loadRouterContext(rpc, solMint, debtPosition.mintAddress)
);
if (routes.length === 0) {
  console.log('No KSwap route found for SOL ->', debtPosition.mintAddress);
}

const [swapRoute] = routes.sort((a, b) => b.amountsExactIn!.amountOut.cmp(a.amountsExactIn!.amountOut));
const swapIxs = swapRoute.instructions!;

const swapSignature = await send(
  [...swapIxs.createInAtaIxs, ...swapIxs.wrapSolIxs, ...swapIxs.swapIxs, ...swapIxs.unwrapSolIxs, ...swapIxs.createOutAtaIxs],
  Object.fromEntries((swapRoute.lookupTableAccounts ?? []).map((lut) => [lut.address, lut.data.addresses]))
);
console.log('Swapped SOL into the debt token:', swapSignature);
```

> [!NOTE]
>
> Use `@kamino-finance/kswap-sdk` 2.9.0, the last version on `@solana/kit` 2. The swap is exact-in so every KSwap router is available: exact-out routes currently come only from Jupiter-based routers.

**Step 6**

### Calculate Minimum Collateral

The minimum collateral to accept assumes the smallest liquidation bonus, takes off the protocol's liquidation fee, and allows for slippage.

```typescript theme={null}
const collateralConfig = collateral.state.config;

const minCollateralLamports = repayUsd
  .mul(new Decimal(collateralConfig.minLiquidationBonusBps).div(10_000).plus(1))
  .mul(new Decimal(1).minus(new Decimal(collateralConfig.protocolLiquidationFeePct).div(100)))
  .mul(new Decimal(1).minus(slippage))
  .div(collateral.getOracleMarketPrice())
  .mul(collateral.getMintFactor())
  .floor();
```

**Step 7**

### Build the Liquidation Instructions

```typescript theme={null}
const liquidateAction = await KaminoAction.buildLiquidateTxns({
  kaminoMarket: market!,
  amount: new BN(repayLamports.toFixed(0)),
  minCollateralReceiveAmount: new BN(minCollateralLamports.toFixed(0)),
  repayReserveAddress: debtReserve.address,
  withdrawReserveAddress: collateral.address,
  liquidator,
  obligationOwner: obligation.state.owner,
  obligation,
  useV2Ixs: true,
  extraComputeBudget: MAX_COMPUTE_UNITS,
  initUserMetadata: { skipInitialization: true, skipLutCreation: true },
  currentLedgerInstant: await getCurrentLedgerInstant(rpc),
});

const liquidateIxs = KaminoAction.actionToIxs(liquidateAction);
```

**Step 8**

### Fetch Lookup Tables and Send

```typescript theme={null}
const addresses = [
  ...new Set(liquidateIxs.flatMap((ix) => [ix.programAddress, ...(ix.accounts ?? []).map((account) => account.address)])),
];

const lutResponse = await fetch('https://api.kamino.finance/luts/find-minimal', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ addresses }),
});
if (!lutResponse.ok) {
  console.log(`Lookup table request failed: ${lutResponse.status} ${lutResponse.statusText}`);
}

const { lutAddresses } = await lutResponse.json();
const lookupTables = await fetchAllAddressLookupTable(rpc, lutAddresses.map((lut: string) => address(lut)));

const liquidationSignature = await send(
  liquidateIxs,
  Object.fromEntries(lookupTables.map((lut) => [lut.address, lut.data.addresses]))
);
console.log('Liquidation executed:', liquidationSignature);
```

> [!TIP]
>
> The debt is repaid and the collateral, including the liquidation bonus, is in the liquidator's wallet.

**Rust**

**Step 1**

### Fetch Obligation and Reserves

Use `ObligationContext` to discover all reserves referenced by the obligation, then fetch them in one RPC call.

```rust theme={null}
use klend_interface::{
    helpers::refresh,
    instructions::liquidate::{
        liquidate_obligation_and_redeem_reserve_collateral_v2,
        LiquidateObligationAndRedeemReserveCollateralV2Accounts,
    },
    pda,
    state::{LendingMarket, Obligation, Reserve, from_account_data},
    Fraction, ObligationContext, ObligationInfo, ReserveInfo, KLEND_PROGRAM_ID,
};
use solana_instruction::AccountMeta;
use solana_sdk::signer::{keypair::read_keypair_file, Signer};

let signer = read_keypair_file("/path/to/liquidator-keypair.json")
    .expect("Failed to read keypair file");
let owner = signer.pubkey();

let obligation_account = rpc_client.get_account(&obligation_pubkey)?;
let obligation = from_account_data::<Obligation>(&obligation_account.data)?;

let reserve_addrs = ObligationContext::reserve_addresses_for_obligation(
    &obligation_account.data,
)?;
let reserve_accounts = rpc_client.get_multiple_accounts(&reserve_addrs)?;

let parsed_reserves: Vec<(Pubkey, Reserve)> = reserve_addrs
    .iter()
    .zip(reserve_accounts.iter())
    .filter_map(|(pk, acc)| {
        acc.as_ref().and_then(|a| {
            from_account_data::<Reserve>(&a.data).ok().map(|r| (*pk, *r))
        })
    })
    .collect();

let repay_reserve = parsed_reserves.iter()
    .find(|(pk, _)| *pk == repay_reserve_pubkey)
    .map(|(_, r)| r)
    .expect("Repay reserve not found");

let withdraw_reserve = parsed_reserves.iter()
    .find(|(pk, _)| *pk == withdraw_reserve_pubkey)
    .map(|(_, r)| r)
    .expect("Withdraw reserve not found");
```

**Step 2**

### Calculate Repay Amount

Fetch the `LendingMarket` account to read the close factor, then calculate the maximum repayable amount from the borrow position.

```rust theme={null}
let borrow_position = obligation.borrows.iter()
    .find(|b| b.borrow_reserve == repay_reserve_pubkey)
    .expect("Borrow position not found");

let borrowed_amount: u64 = Fraction::from_bits(
    borrow_position.borrowed_amount()
).to_num();

let market_account = rpc_client.get_account(&obligation.lending_market)?;
let lending_market = from_account_data::<LendingMarket>(&market_account.data)?;

let close_factor = lending_market.liquidation_max_debt_close_factor_pct;
let repay_amount = (borrowed_amount as f64 * close_factor as f64 / 100.0) as u64;
```

**Step 3**

### Swap into Debt Token via KSwap

If the liquidator does not hold the debt token, swap into it using the KSwap REST API before liquidating.

```rust theme={null}
use serde::Deserialize;
use solana_sdk::transaction::VersionedTransaction;

#[derive(Deserialize)]
struct KswapResponse { data: KswapData }

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct KswapData {
    transaction: String,
    expected_amount_out: String,
    min_amount_out: String,
}

let liquidator_debt_ata =
    spl_associated_token_account::get_associated_token_address_with_program_id(
        &owner,
        &repay_reserve.liquidity.mint_pubkey,
        &repay_reserve.liquidity.token_program,
    );

use spl_token::state::Account as TokenAccount;
use solana_sdk::program_pack::Pack;

let wallet_balance = rpc_client.get_account(&liquidator_debt_ata)
    .ok()
    .and_then(|a| TokenAccount::unpack(&a.data).ok())
    .map(|acct| acct.amount)
    .unwrap_or(0);

if wallet_balance < repay_amount {
    let wsol = Pubkey::from_str("So11111111111111111111111111111111111111112")?;

    // Calculate how much SOL to swap based on debt USD value
    let debt_price: f64 = Fraction::from_bits(
        u128::from(repay_reserve.liquidity.market_price_sf)
    ).to_num();
    let repay_usd = repay_amount as f64
        / 10f64.powi(repay_reserve.liquidity.mint_decimals as i32) * debt_price;
    let sol_price = parsed_reserves.iter()
        .find(|(_, r)| r.liquidity.mint_pubkey == wsol)
        .map(|(_, r)| Fraction::from_bits(
            u128::from(r.liquidity.market_price_sf)
        ).to_num::<f64>())
        .unwrap_or(100.0);
    let sol_balance = rpc_client.get_balance(&owner)?;
    let swap_amount = (repay_usd / sol_price * 1e9) as u64;
    let swap_amount = swap_amount.min(sol_balance.saturating_sub(5_000_000));

    let client = reqwest::blocking::Client::new();
    let resp = client
        .get("https://api.kamino.finance/kswap/swap/")
        .query(&[
            ("tokenIn", wsol.to_string()),
            ("tokenOut", repay_reserve.liquidity.mint_pubkey.to_string()),
            ("amountIn", swap_amount.to_string()),
            ("maxSlippageBps", "50".to_string()),
            ("wallet", owner.to_string()),
            ("wrapAndUnwrapSol", "true".to_string()),
        ])
        .send()?;

    if !resp.status().is_success() {
        let status = resp.status();
        let body = resp.text().unwrap_or_default();
        return Err(format!("KSwap API error {status}: {body}").into());
    }

    let kswap: KswapResponse = resp.json()?;

    // Decode, re-sign, and send the swap transaction
    use base64::Engine;
    let tx_bytes = base64::engine::general_purpose::STANDARD
        .decode(&kswap.data.transaction)?;
    let swap_tx: VersionedTransaction = bincode::deserialize(&tx_bytes)?;
    let blockhash = rpc_client.get_latest_blockhash()?;
    let mut msg = swap_tx.message;
    msg.set_recent_blockhash(blockhash);
    let signed = VersionedTransaction::try_new(msg, &[&signer])?;
    rpc_client.send_and_confirm_transaction_with_spinner(&signed)?;
}
```

**Step 4**

### Derive Token Accounts

Derive ATAs using the actual token programs from the reserve data. The collateral cToken mint address is read directly from the `Reserve` struct.

```rust theme={null}
let user_source_liquidity =
    spl_associated_token_account::get_associated_token_address_with_program_id(
        &owner,
        &repay_reserve.liquidity.mint_pubkey,
        &repay_reserve.liquidity.token_program,
    );

let ctoken_mint = withdraw_reserve.collateral.mint_pubkey;
let ctoken_program = rpc_client.get_account(&ctoken_mint)
    .map(|a| a.owner)
    .unwrap_or(spl_token::ID);

let user_destination_collateral =
    spl_associated_token_account::get_associated_token_address_with_program_id(
        &owner, &ctoken_mint, &ctoken_program,
    );

let user_destination_liquidity =
    spl_associated_token_account::get_associated_token_address_with_program_id(
        &owner,
        &withdraw_reserve.liquidity.mint_pubkey,
        &withdraw_reserve.liquidity.token_program,
    );
```

**Step 5**

### Create Token Accounts

Create the associated token accounts if they do not already exist. Uses `create_associated_token_account_idempotent` which is a no-op if the account is already initialized.

```rust theme={null}
let ata_ixs = vec![
    spl_associated_token_account::instruction::create_associated_token_account_idempotent(
        &owner, &owner, &repay_reserve.liquidity.mint_pubkey, &repay_reserve.liquidity.token_program,
    ),
    spl_associated_token_account::instruction::create_associated_token_account_idempotent(
        &owner, &owner, &ctoken_mint, &ctoken_program,
    ),
    spl_associated_token_account::instruction::create_associated_token_account_idempotent(
        &owner, &owner, &withdraw_reserve.liquidity.mint_pubkey, &withdraw_reserve.liquidity.token_program,
    ),
];

let blockhash = rpc_client.get_latest_blockhash()?;
let ata_tx = Transaction::new(&[&signer], Message::new(&ata_ixs, Some(&owner)), blockhash);
rpc_client.send_and_confirm_transaction(&ata_tx)?;
```

**Step 6**

### Build Liquidation Instructions

Build refresh instructions for each reserve and the obligation, then the liquidation instruction using actual addresses from the `Reserve` struct.

```rust theme={null}
use solana_sdk::transaction::Transaction;
use solana_sdk::message::Message;

let (lma, _) = pda::lending_market_authority(
    &KLEND_PROGRAM_ID, &repay_reserve.lending_market,
);

let obligation_info = ObligationInfo::from_obligation(
    obligation_pubkey, obligation,
);

let all_reserve_infos: Vec<ReserveInfo> = parsed_reserves.iter()
    .map(|(pk, r)| ReserveInfo::from_reserve(*pk, r))
    .collect();

// Refresh reserves and obligation
let mut instructions = Vec::new();
for info in &all_reserve_infos {
    if obligation_info.deposit_reserves.contains(&info.address)
        || obligation_info.borrow_reserves.contains(&info.address)
    {
        instructions.push(refresh::refresh_reserve(info));
    }
}
instructions.push(refresh::refresh_obligation(
    &repay_reserve.lending_market, &obligation_info,
));

// Remaining accounts: deposit reserves + borrow reserves
let mut remaining: Vec<AccountMeta> = Vec::new();
for r in &obligation_info.deposit_reserves {
    remaining.push(AccountMeta::new(*r, false));
}
for r in &obligation_info.borrow_reserves {
    remaining.push(AccountMeta::new(*r, false));
}

// Calculate slippage protection to guard against sandwich attacks.
// Without this, a malicious validator could reorder transactions
// to extract the full liquidation bonus.
const MIN_RECEIVED_SLIPPAGE_BPS: u16 = 200; // 2%

let collateral_price: f64 = Fraction::from_bits(
    u128::from(withdraw_reserve.liquidity.market_price_sf)
).to_num();
let collateral_decimals = withdraw_reserve.liquidity.mint_decimals;
let bonus_bps = withdraw_reserve.config.min_liquidation_bonus_bps as f64;
let protocol_fee_pct = withdraw_reserve.config.protocol_liquidation_fee_pct as f64;

let debt_price: f64 = Fraction::from_bits(
    u128::from(repay_reserve.liquidity.market_price_sf)
).to_num();
let repay_usd = repay_amount as f64
    / 10f64.powi(repay_reserve.liquidity.mint_decimals as i32) * debt_price;

let min_received = if collateral_price > 0.0 {
    let collateral_value = repay_usd * (1.0 + bonus_bps / 10_000.0);
    let after_fee = collateral_value * (1.0 - protocol_fee_pct / 100.0);
    let expected_tokens = after_fee / collateral_price
        * 10f64.powi(collateral_decimals as i32);
    let with_slippage = expected_tokens
        * (10_000.0 - MIN_RECEIVED_SLIPPAGE_BPS as f64) / 10_000.0;
    (with_slippage as u64).max(1)
} else {
    1
};

// Liquidation instruction with actual reserve struct addresses
instructions.push(liquidate_obligation_and_redeem_reserve_collateral_v2(
    LiquidateObligationAndRedeemReserveCollateralV2Accounts {
        liquidator: owner,
        obligation: obligation_pubkey,
        lending_market: repay_reserve.lending_market,
        lending_market_authority: lma,
        repay_reserve: repay_reserve_pubkey,
        repay_reserve_liquidity_mint: repay_reserve.liquidity.mint_pubkey,
        repay_reserve_liquidity_supply: repay_reserve.liquidity.supply_vault,
        withdraw_reserve: withdraw_reserve_pubkey,
        withdraw_reserve_liquidity_mint: withdraw_reserve.liquidity.mint_pubkey,
        withdraw_reserve_collateral_mint: withdraw_reserve.collateral.mint_pubkey,
        withdraw_reserve_collateral_supply: withdraw_reserve.collateral.supply_vault,
        withdraw_reserve_liquidity_supply: withdraw_reserve.liquidity.supply_vault,
        withdraw_reserve_liquidity_fee_receiver: withdraw_reserve.liquidity.fee_vault,
        user_source_liquidity,
        user_destination_collateral,
        user_destination_liquidity,
        repay_liquidity_token_program: repay_reserve.liquidity.token_program,
        withdraw_liquidity_token_program: withdraw_reserve.liquidity.token_program,
        collateral_obligation_farm_user_state: None,
        collateral_reserve_farm_state: None,
        debt_obligation_farm_user_state: None,
        debt_reserve_farm_state: None,
    },
    repay_amount,
    min_received,
    0, // max_allowed_ltv_override_percent (must be 0 on mainnet)
    remaining,
));
```

> [!WARNING]
>
> The `helpers::liquidate::liquidate()` helper uses `ReservePdas::derive()` which does not match reserves created by older program versions. Use the actual addresses from the `Reserve` struct as shown above.

**Step 7**

### Simulate and Send

```rust theme={null}
let recent_blockhash = rpc_client.get_latest_blockhash()?;
let message = Message::new(&instructions, Some(&owner));
let tx = Transaction::new(&[&signer], message, recent_blockhash);

// Simulate first
let sim = rpc_client.simulate_transaction(&tx)?;
if let Some(err) = sim.value.err {
    println!("Simulation failed: {err}");
    return Ok(());
}

// Send with fresh blockhash
let fresh_blockhash = rpc_client.get_latest_blockhash()?;
let fresh_msg = Message::new(&instructions, Some(&owner));
let fresh_tx = Transaction::new(&[&signer], fresh_msg, fresh_blockhash);
let signature = rpc_client.send_and_confirm_transaction(&fresh_tx)?;
println!("Liquidation executed: {signature}");
```


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
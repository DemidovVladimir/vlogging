> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Market

## Reading Market Data

Retrieve market metrics, reserve information, and TVL data using the Kamino SDK and API.

> [!NOTE]
>
> Historical market data is only available via the API.

**Step 1**

### Get Market Info

Retrieves real-time market-wide metrics including total deposits and borrows TVL across all reserves.

> [!NOTE]
>
> Using the SDK requires a private RPC connection or the public rate-limited
> [RPC endpoint](https://api.mainnet-beta.solana.com).

**TypeScript**

```typescript icon="typescript" getMarketInfo theme={null}
import { createSolanaRpc, address } from "@solana/kit";
import { KaminoMarket, getMedianSlotDurationInMsFromLastEpochs } from "@kamino-finance/klend-sdk";

const rpc = createSolanaRpc("https://api.mainnet-beta.solana.com");
const marketPubkey = address("7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF");

const market = await KaminoMarket.load(rpc, marketPubkey, await getMedianSlotDurationInMsFromLastEpochs());

console.log({
  totalDepositsUsd: market!.getTotalDepositTVL().toFixed(2),
  totalBorrowsUsd: market!.getTotalBorrowTVL().toFixed(2),
});
```

&#x20;

View Code

**Step 2**

### Get Reserve Info

Queries detailed information for all reserves in the market including deposit/borrow TVL, APY rates, and utilization ratios.

**TypeScript**

```typescript icon="typescript" getReserveInfo theme={null}
import { createSolanaRpc, address } from "@solana/kit";
import {
  KaminoMarket,
  getCurrentLedgerInstant,
  getMedianSlotDurationInMsFromLastEpochs,
} from "@kamino-finance/klend-sdk";

const rpc = createSolanaRpc("https://api.mainnet-beta.solana.com");
const marketPubkey = address("7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF");

const market = await KaminoMarket.load(rpc, marketPubkey, await getMedianSlotDurationInMsFromLastEpochs());
const ledgerInstant = await getCurrentLedgerInstant(rpc);

const reserves = market!.getReserves().map((reserve) => ({
  symbol: reserve.getTokenSymbol(),
  kind: reserve.getKind().toString(),
  supplyAPY: `${(reserve.totalSupplyAPY(ledgerInstant) * 100).toFixed(2)}%`,
  borrowAPY: `${(reserve.totalBorrowAPY(ledgerInstant) * 100).toFixed(2)}%`,
  utilization: `${(reserve.calculateUtilizationRatio() * 100).toFixed(2)}%`,
  depositTvlUsd: reserve.getDepositTvl().toFixed(2),
  borrowTvlUsd: reserve.getBorrowTvl().toFixed(2),
}));

console.table(reserves);
```

> [!NOTE]
>
> A token can have several reserves: one variable-rate reserve plus fixed-rate ones, so each row shows its kind. Fixed-rate APYs depend on the slot duration passed to `KaminoMarket.load`. A hard-coded value such as 400 ms shows them at about half their real rate, because mainnet slots are closer to 210 ms.

&#x20;

View Code

**Rust**

```rust expandable title="get_market_and_reserves.rs" theme={null}
use klend_interface::state::{LendingMarket, Reserve};
use klend_interface::{from_account_data, Fraction, KLEND_PROGRAM_ID};
use solana_account::ReadableAccount;
use solana_account_decoder_client_types::UiAccountEncoding;
use solana_client::rpc_client::RpcClient;
use solana_client::rpc_config::{RpcAccountInfoConfig, RpcProgramAccountsConfig};
use solana_client::rpc_filter::{Memcmp, RpcFilterType};
use solana_pubkey::Pubkey;
use std::str::FromStr;

let rpc_client = RpcClient::new("https://api.mainnet-beta.solana.com");
let market_pubkey = Pubkey::from_str("7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF")?;

let market_account = rpc_client.get_account(&market_pubkey)?;
let market = from_account_data::<LendingMarket>(&market_account.data)?;
println!("Market authority: {}", market.lending_market_owner);

let filters = vec![
    RpcFilterType::Memcmp(Memcmp::new_raw_bytes(32, market_pubkey.to_bytes().to_vec())),
    RpcFilterType::DataSize((8 + std::mem::size_of::<Reserve>()) as u64),
];
let accounts = rpc_client.get_program_accounts_with_config(
    &KLEND_PROGRAM_ID,
    RpcProgramAccountsConfig {
        filters: Some(filters),
        account_config: RpcAccountInfoConfig {
            encoding: Some(UiAccountEncoding::Base64Zstd),
            ..Default::default()
        },
        ..Default::default()
    },
)?;

for (pubkey, account) in &accounts {
    let reserve = from_account_data::<Reserve>(account.data())?;
    let borrowed: f64 = Fraction::from_bits(u128::from(reserve.liquidity.borrowed_amount_sf)).to_num();
    let price: f64 = Fraction::from_bits(u128::from(reserve.liquidity.market_price_sf)).to_num();

    println!("Reserve: {pubkey}");
    println!("  Available liquidity: {}", reserve.liquidity.total_available_amount);
    println!("  Borrowed amount: {borrowed:.6}");
    println!("  Market price: {price:.6}");
    println!("  Mint decimals: {}", reserve.liquidity.mint_decimals);
    println!("  LTV: {}%", reserve.config.loan_to_value_pct);
    println!("  Deposit limit: {}", reserve.config.deposit_limit);
    println!("  Borrow limit: {}", reserve.config.borrow_limit);
}
```

[View Code](https://github.com/Kamino-Finance/klend/blob/master/libs/klend-interface/examples/market_data.rs)

**Step 3**

### Get Historical Reserve APY

Fetch historical supply APY and borrow APY data for a specific reserve over time.

```typescript icon="typescript" getHistoricalReserveAPY theme={null}
const API_BASE_URL = "https://api.kamino.finance";
const marketPubkey = "7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF";
const reservePubkey = "d4A2prbA2whesmvHaL88BH6Ewn5N4bTSU2Ze8P6Bc4Q";

const params = new URLSearchParams({
  start: "2026-10-15T00:00:00.000Z",
  end: "2026-10-22T00:00:00.000Z",
  frequency: "day",
});

const res = await fetch(
  `${API_BASE_URL}/kamino-market/${marketPubkey}/reserves/${reservePubkey}/metrics/history?${params}`
);
if (!res.ok) {
  console.log(`Request failed: ${res.status} ${res.statusText}`);
}

const { history } = await res.json();

console.table(
  history.map((item) => ({
    date: item.timestamp.slice(0, 10),
    symbol: item.metrics.symbol,
    supplyAPY: `${(item.metrics.supplyInterestAPY * 100).toFixed(2)}%`,
    borrowAPY: `${(item.metrics.borrowInterestAPY * 100).toFixed(2)}%`,
    depositTvlUsd: Number(item.metrics.depositTvl).toFixed(2),
    borrowTvlUsd: Number(item.metrics.borrowTvl).toFixed(2),
  }))
);
```

&#x20;

View Code

## Additional Resources

> **[API Examples](https://api-docs.kamino.com/)**

> **[SDK Examples](https://github.com/Kamino-Finance/klend-sdk/tree/master/examples)**


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
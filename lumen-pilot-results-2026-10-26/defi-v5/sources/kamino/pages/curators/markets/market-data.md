> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Read Market Data

> Query market state, reserve metrics, historical data, and rewards via API and SDK

Market state is readable through three channels: the REST API (best for dashboards and monitoring), the TypeScript SDK (best for integrations that compute derived values on-chain), and direct Solana RPC reads (for the lowest-level access). Most curators use the API for monitoring and the SDK for any integration that needs to react to market state.

## Channels at a glance

| Channel | Best for | Endpoint / package |
| - | - | - |
| REST API | Dashboards, alerts, integrations that need historical data | `https://api.kamino.finance` |
| TypeScript SDK | Apps computing live APYs, building transactions, reacting to state | `@kamino-finance/klend-sdk` |
| Direct RPC | Lowest-latency access, minimal dependencies | Solana RPC + the program's account decoders |

## List all markets

```typescript SDK theme={null}
// SDK loads individual markets by address; the API is the place to enumerate
const response = await fetch('https://api.kamino.finance/v2/kamino-market');
const markets = await response.json();
```

```bash curl theme={null}
curl https://api.kamino.finance/v2/kamino-market
```

Returns the full set of klend markets the API knows about, with addresses and basic metadata.

## Market-wide TVL and totals

```typescript SDK theme={null}
import { createSolanaRpc, address } from '@solana/kit';
import { KaminoMarket, getMedianSlotDurationInMsFromLastEpochs } from '@kamino-finance/klend-sdk';

const rpc = createSolanaRpc('https://api.mainnet-beta.solana.com');
const slotDuration = await getMedianSlotDurationInMsFromLastEpochs();
const market = await KaminoMarket.load(rpc, address('<MARKET_ADDRESS>'), slotDuration);

console.log({
  depositTVL: market!.getTotalDepositTVL().toString(),
  borrowTVL:  market!.getTotalBorrowTVL().toString(),
});
```

```bash curl theme={null}
curl https://api.kamino.finance/kamino-market/<MARKET_ADDRESS>/reserves/metrics
```

## Per-reserve metrics

```typescript SDK theme={null}
import { createSolanaRpc, address } from '@solana/kit';
import { KaminoMarket, getMedianSlotDurationInMsFromLastEpochs } from '@kamino-finance/klend-sdk';

const rpc = createSolanaRpc('https://api.mainnet-beta.solana.com');
const slotDuration = await getMedianSlotDurationInMsFromLastEpochs();
const market = await KaminoMarket.load(rpc, address('<MARKET_ADDRESS>'), slotDuration);
const slot = await rpc.getSlot().send();

for (const reserve of market!.getReserves()) {
  console.log(`Reserve ${reserve.symbol}:`);
  console.log(`  Deposit TVL:   ${reserve.getDepositTvl().toFixed(2)}`);
  console.log(`  Borrow TVL:    ${reserve.getBorrowTvl().toFixed(2)}`);
  console.log(`  Borrow APY:    ${reserve.totalBorrowAPY(slot)}%`);
  console.log(`  Supply APY:    ${reserve.totalSupplyAPY(slot)}%`);
  console.log(`  Utilization:   ${reserve.calculateUtilizationRatio()}%`);
}
```

```typescript API theme={null}
const response = await fetch(
  'https://api.kamino.finance/kamino-market/<MARKET_ADDRESS>/reserves/metrics'
);
const { reserves } = await response.json();

reserves.forEach((reserve: any) => {
  console.log({
    address:    reserve.reserve,
    symbol:     reserve.symbol,
    depositTvl: reserve.metrics.depositTvl,
    borrowTvl:  reserve.metrics.borrowTvl,
    supplyAPY:  reserve.metrics.supplyInterestAPY,
    borrowAPY:  reserve.metrics.borrowInterestAPY,
  });
});
```

```bash curl theme={null}
curl https://api.kamino.finance/kamino-market/<MARKET_ADDRESS>/reserves/metrics
```

## Historical reserve metrics

Historical time-series data is API-only. The SDK reads live state; the API serves historical series.

```typescript API theme={null}
const marketPubkey = '<MARKET_ADDRESS>';
const reservePubkey = '<RESERVE_ADDRESS>';

const url = `https://api.kamino.finance/kamino-market/${marketPubkey}/reserves/${reservePubkey}/metrics/history`;

const response = await fetch(url);
const { history } = await response.json();

for (const item of history) {
  console.log({
    timestamp:        item.timestamp,
    symbol:           item.metrics.symbol,
    supplyInterestAPY: item.metrics.supplyInterestAPY,
    borrowInterestAPY: item.metrics.borrowInterestAPY,
    depositTvl:       item.metrics.depositTvl,
    borrowTvl:        item.metrics.borrowTvl,
  });
}
```

```bash curl theme={null}
curl "https://api.kamino.finance/kamino-market/<MARKET_ADDRESS>/reserves/<RESERVE_ADDRESS>/metrics/history"
```

## Rewards data

The Kamino API exposes reward data such as active campaigns and per-user claimable amounts for klend reserves.

### All active reward programs

```typescript API theme={null}
const response = await fetch('https://api.kamino.finance/klend/rewards');
const rewards = await response.json();
console.log('Active KLend rewards:', rewards);
```

```bash curl theme={null}
curl https://api.kamino.finance/klend/rewards
```

### A user's claimable rewards across all reserves

```typescript API theme={null}
const userPubkey = '<USER_WALLET_ADDRESS>';
const response = await fetch(
  `https://api.kamino.finance/klend/users/${userPubkey}/rewards`
);
const rewards = await response.json();
console.log('User rewards:', rewards);
```

```bash curl theme={null}
curl https://api.kamino.finance/klend/users/<USER_WALLET_ADDRESS>/rewards
```

### Live farm state from the SDK

For real-time emission rates and on-chain farm balances, read the KFarms `FarmState` directly:

```typescript theme={null}
import { createSolanaRpc, address } from '@solana/kit';
import { KaminoMarket, getMedianSlotDurationInMsFromLastEpochs } from '@kamino-finance/klend-sdk';
import { FarmState } from '@kamino-finance/farms-sdk';

const rpc = createSolanaRpc('https://api.mainnet-beta.solana.com');
const slotDuration = await getMedianSlotDurationInMsFromLastEpochs();
const market = await KaminoMarket.load(rpc, address('<MARKET_ADDRESS>'), slotDuration);

for (const reserve of market!.getReserves()) {
  const collFarm = reserve.getCollateralFarmAddress();
  const debtFarm = reserve.getDebtFarmAddress();

  if (collFarm) {
    const farmState = await FarmState.fetch(rpc, collFarm);
    console.log(`${reserve.symbol} collateral farm:`, farmState);
  }
  if (debtFarm) {
    const farmState = await FarmState.fetch(rpc, debtFarm);
    console.log(`${reserve.symbol} debt farm:`, farmState);
  }
}
```

For the full APY calculation walkthrough, see [Calculate reserve reward APY](https://kamino.com/docs/build/tutorials/borrow/calculate-reserve-reward-apy.md).

## What the SDK exposes per reserve

`reserve` instances loaded via `market.getReserves()` provide the following getters:

| Method | Returns |
| - | - |
| `reserve.symbol` | Token symbol |
| `reserve.address` | Reserve account pubkey |
| `reserve.getDepositTvl()` | Total USD value deposited |
| `reserve.getBorrowTvl()` | Total USD value borrowed |
| `reserve.totalBorrowAPY(slot)` | Combined borrow APY (curve + host fixed) |
| `reserve.totalSupplyAPY(slot)` | Supply-side APY paid to depositors |
| `reserve.calculateUtilizationRatio()` | Borrowed / deposited, as a fraction |
| `reserve.getCollateralFarmAddress()` | Farm address for the collateral side, or `null` |
| `reserve.getDebtFarmAddress()` | Farm address for the debt side, or `null` |
| `reserve.config` | The on-chain `ReserveConfig` (every editable parameter) |

## Direct RPC reads

For the lowest-level access (minimal dependencies, fastest reads, no SDK abstraction), fetch the on-chain accounts directly via Solana RPC and decode them with the program's IDL or struct definitions.

The relevant accounts:

| Account | What it holds |
| - | - |
| `LendingMarket` | Market-level config + flags |
| `Reserve` | Per-reserve config + live state (liquidity, collateral, withdraw queue) |
| `Obligation` | Per-user position (deposits + borrows) |
| `FarmState` | KFarms reward state for a collateral or debt farm |

See [Programmatic integration](https://kamino.com/docs/curators/markets/programmatic-integration.md) for routing to the SDK and API documentation that covers each surface in depth.

## Reference

> **[Full API Reference](https://kamino.com/docs/build/api-reference/introduction.md)**
>
> OpenAPI-rendered reference for every endpoint

> **[SDK examples](https://github.com/Kamino-Finance/klend-sdk/tree/master/examples)**
>
> Working code examples in the klend-sdk repo

> **[Programmatic integration](https://kamino.com/docs/curators/markets/programmatic-integration.md)**
>
> Where to go for SDK / API / RPC integration docs

> **[Farms & rewards](https://kamino.com/docs/curators/markets/farms-and-rewards.md)**
>
> Curator-side farm management


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
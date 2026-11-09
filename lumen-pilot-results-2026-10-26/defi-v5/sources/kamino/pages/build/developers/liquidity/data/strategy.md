> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Strategy

## Reading Strategy Data

Retrieve strategy metadata, share price, TVL, APY, and aggregate metrics using the Kamino SDK and API.

> [!NOTE]
>
> Historical strategy data is only available via the API. For the TypeScript shapes used by the methods below — both arguments and return values — see [Strategy Types](#strategy-types).

### Get All Strategies

Fetches all live strategies from the API. Returns an array of strategy objects with addresses and pool metadata.

```typescript icon="typescript" getAllStrategies theme={null}
const url = 'https://api.kamino.finance/strategies?env=mainnet-beta&status=LIVE';
const res = await fetch(url);
if (!res.ok) {
  throw new Error(`Request failed: ${res.status} ${res.statusText}`);
}
const strategies = await res.json();

console.log({
  address: strategies[0].address,
  pool: strategies[0].pool,
  tokenA: strategies[0].tokenA,
  tokenB: strategies[0].tokenB,
});
```

[View Code](https://github.com/Kamino-Finance/kliquidity-sdk/tree/master/examples)

### Get Strategies with Filters

Filter strategies by type, status, community, or owner using the SDK. These filtering options aren't exposed by the public API.

```typescript icon="typescript" getStrategiesWithFilters theme={null}
import { createSolanaRpc } from '@solana/kit';
import { Kamino, StrategiesFilters } from '@kamino-finance/kliquidity-sdk';

const RPC_ENDPOINT = 'https://api.mainnet-beta.solana.com';

const rpc = createSolanaRpc(RPC_ENDPOINT);
const kamino = new Kamino('mainnet-beta', rpc);

const filters: StrategiesFilters = {
  strategyCreationStatus: 'LIVE',
  strategyType: 'NON_PEGGED',
};

const results = await kamino.getAllStrategiesWithFilters(filters);

console.log(`Filters:`, filters);
console.log(`Matched strategies: ${results.length}`);
console.log('First 10:');
for (const { address, strategy } of results.slice(0, 10)) {
  console.log({
    address: address.toString(),
    tokenAMint: strategy.tokenAMint.toString(),
    tokenBMint: strategy.tokenBMint.toString(),
    sharesMint: strategy.sharesMint.toString(),
  });
}
```

[View Code](https://github.com/Kamino-Finance/kliquidity-sdk/tree/master/examples)

### Get Strategy Metrics

Returns real-time strategy metrics including share price, TVL, and APY for a specific strategy.

```typescript icon="typescript" getStrategyMetrics theme={null}
const strategyPubkey = '2H4xebnp2M9JYgPPfUw58uUQahWF8f1YTNxwwtmdqVYV'; // strategy address

const url = `https://api.kamino.finance/strategies/${strategyPubkey}/metrics?env=mainnet-beta`;
const res = await fetch(url);
if (!res.ok) {
  throw new Error(`Request failed: ${res.status} ${res.statusText}`);
}
const metrics = await res.json();

console.log({
  sharePrice: metrics.sharePrice,
  totalValueLocked: metrics.totalValueLocked,
  apy: metrics.apy,
});
```

[View Code](https://github.com/Kamino-Finance/kliquidity-sdk/tree/master/examples)

### Get Strategy Info

Live on-chain read of a strategy's share price and underlying balances.

```typescript icon="typescript" getStrategyInfo theme={null}
import { createSolanaRpc, address } from '@solana/kit';
import { Kamino } from '@kamino-finance/kliquidity-sdk';

const RPC_ENDPOINT = 'https://api.mainnet-beta.solana.com';
const STRATEGY = address('CEz5keL9hBCUbtVbmcwenthRMwmZLupxJ6YtYAgzp4ex'); // strategy address

const rpc = createSolanaRpc(RPC_ENDPOINT);
const kamino = new Kamino('mainnet-beta', rpc);

const shareData = await kamino.getStrategyShareData(STRATEGY);
const { price, balance } = shareData;
const { computedHoldings, tokenAAmounts, tokenBAmounts, prices } = balance;

console.log('Strategy:', STRATEGY);
console.log('Share price (USD):', price.toString());
console.log('Total holdings (USD):', computedHoldings.totalSum.toString());
console.log('Available token A:', computedHoldings.available.a.toString());
console.log('Available token B:', computedHoldings.available.b.toString());
console.log('Invested token A:', computedHoldings.invested.a.toString());
console.log('Invested token B:', computedHoldings.invested.b.toString());
console.log('Raw token A amount:', tokenAAmounts.toString());
console.log('Raw token B amount:', tokenBAmounts.toString());
console.log('Token A price (USD):', prices.aPrice?.toString() ?? 'n/a');
console.log('Token B price (USD):', prices.bPrice?.toString() ?? 'n/a');
```

[View Code](https://github.com/Kamino-Finance/kliquidity-sdk/tree/master/examples)

### Get Strategy Historical Metrics

Time-series data for charting strategy share price, TVL, fees, and APY.

```typescript icon="typescript" getStrategyHistoricalMetrics theme={null}
const strategyPubkey = '2H4xebnp2M9JYgPPfUw58uUQahWF8f1YTNxwwtmdqVYV'; // strategy address

const API_BASE_URL = 'https://api.kamino.finance';

const params = new URLSearchParams({
  start: '2024-01-01T00:00:00.000Z',
  end: '2025-01-01T00:00:00.000Z',
}).toString();

const url = `${API_BASE_URL}/v2/strategies/${strategyPubkey}/history?${params}`;
const res = await fetch(url);
if (!res.ok) {
  throw new Error(`Request failed: ${res.status} ${res.statusText}`);
}
const history = await res.json();

for (const item of history) {
  console.log({
    timestamp: item.timestamp,
    sharePrice: item.sharePrice,
    tvl: item.tvl,
    apy: item.apy,
  });
}
```

[View Code](https://github.com/Kamino-Finance/kliquidity-sdk/tree/master/examples)

### Get Total TVL

Returns aggregate total value locked across all live strategies.

```typescript icon="typescript" getTotalTvl theme={null}
const url = 'https://api.kamino.finance/strategies/tvl?env=mainnet-beta';
const res = await fetch(url);
if (!res.ok) {
  throw new Error(`Request failed: ${res.status} ${res.statusText}`);
}
const data = await res.json();

console.log({ totalTvl: data });
```

[View Code](https://github.com/Kamino-Finance/kliquidity-sdk/tree/master/examples)

### Get Strategy Fees and Rewards

Returns fees and rewards earned across all strategies over a chosen time period (`24h`, `7d`, or `30d`).

```typescript icon="typescript" getStrategyFeesAndRewards theme={null}
const url = 'https://api.kamino.finance/strategies/fees-and-rewards?env=mainnet-beta&period=24h';
const res = await fetch(url);
if (!res.ok) {
  throw new Error(`Request failed: ${res.status} ${res.statusText}`);
}
const data = await res.json();

console.log(data);
```

[View Code](https://github.com/Kamino-Finance/kliquidity-sdk/tree/master/examples)

## Strategy Types

TypeScript shapes used by the Kliquidity SDK for strategy reads — both arguments (e.g. `StrategiesFilters`) and return values.

**StrategyWithAddress**

On-chain strategy account paired with its address.

```typescript theme={null}
type StrategyWithAddress = {
  address: Address;
  strategy: WhirlpoolStrategy;
};
```

**StrategyBalances**

Raw token amounts and computed position values.

```typescript theme={null}
type StrategyBalances = {
  computedHoldings: Holdings;
  prices: PriceData;
  tokenAAmounts: Decimal;
  tokenBAmounts: Decimal;
};
```

**PriceData**

Pool price, range bounds, and rebalance triggers.

```typescript theme={null}
type PriceData = {
  aPrice: Decimal | null;
  bPrice: Decimal | null;
  poolPrice: Decimal;
  lowerPrice: Decimal;
  upperPrice: Decimal;
};
```

**StrategyPrices**

Oracle and TWAP prices for strategy tokens and rewards.

```typescript theme={null}
type StrategyPrices = { /* ... */ };
```

**StrategiesFilters**

Query parameters for filtering strategies by type, status, and ownership.

```typescript theme={null}
type StrategiesFilters = { /* ... */ };
```

## Additional Resources

> **[API Examples](https://api-docs.kamino.com/)**

> **[SDK Examples](https://github.com/Kamino-Finance/kliquidity-sdk/tree/master/examples)**


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
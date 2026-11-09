> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Prices

> Read Scope oracle prices on-chain via the SDK or off-chain via REST

## Reading Scope Prices

Scope serves prices two ways. On-chain, the `OraclePrices` account holds a fixed 512-slot array of dated prices and the SDK reads it directly. Off-chain, the Kamino REST endpoint serves the same prices pre-aggregated and keyed by mint, with no RPC or SDK required.

### Read All Prices

**TypeScript**

Direct on-chain read of every populated slot in a feed.

```typescript theme={null}
import { createSolanaRpc } from '@solana/kit';
import { Scope, SCOPE_MAINNET_HUBBLE_FEED } from '@kamino-finance/scope-sdk';
import Decimal from 'decimal.js';

const RPC_ENDPOINT = 'https://api.mainnet-beta.solana.com';

const rpc = createSolanaRpc(RPC_ENDPOINT);
const scope = new Scope('mainnet-beta', rpc);

const oraclePrices = await scope.getSingleOraclePrices({
  config: SCOPE_MAINNET_HUBBLE_FEED.configuration,
});

// Fixed-size array; a slot is unset when its price value is 0.
const populated = oraclePrices.prices
  .map((p, index) => ({ index, p }))
  .filter(({ p }) => p.price.value.toString() !== '0');

console.log(`Feed ${SCOPE_MAINNET_HUBBLE_FEED.oraclePrices}: ${populated.length} populated of ${oraclePrices.prices.length}`);

populated.slice(0, 10).forEach(({ index, p }) => {
  const price = new Decimal(p.price.value.toString()).div(new Decimal(10).pow(Number(p.price.exp)));
  const updated = new Date(Number(p.unixTimestamp) * 1000).toISOString();
  console.log(`  [${index}] ${price.toString()} (updated ${updated})`);
});
```

[View Code](https://github.com/Kamino-Finance/scope-sdk)

A price is `value / 10^exp`; freshness comes from `lastUpdatedSlot` and `unixTimestamp` on the same dated price. `getSingleOraclePrices` accepts the feed by its configuration account, its `OraclePrices` pubkey, or its PDA seed.

**API**

The same prices, pre-aggregated and keyed by mint. No RPC required.

```typescript theme={null}
const API = 'https://api.kamino.finance/oracles/prices?source=scope';

type ScopePrice = { mint: string; name: string; price: string; timestamp: string; maxAgeInSeconds: string };
const rows: ScopePrice[] = await (await fetch(API)).json();

console.log(`Scope prices: ${rows.length}`);
rows.slice(0, 10).forEach((r) => console.log(`  ${r.name}: ${r.price} (${r.mint})`));
```

### Get a Single Token Price

**TypeScript**

A token's USD price is resolved by a "scope chain": up to 4 slot indices, padded with `65535`. One index means a direct price; several means a derived price (for example TOKEN/SOL then SOL/USD).

```typescript theme={null}
import { createSolanaRpc } from '@solana/kit';
import { Scope, SCOPE_MAINNET_HUBBLE_FEED } from '@kamino-finance/scope-sdk';

const RPC_ENDPOINT = 'https://api.mainnet-beta.solana.com';
const CHAIN = [0, 65535, 65535, 65535]; // SOL/USD, slot 0, single-hop

const rpc = createSolanaRpc(RPC_ENDPOINT);
const scope = new Scope('mainnet-beta', rpc);

const oraclePrices = await scope.getSingleOraclePrices({
  config: SCOPE_MAINNET_HUBBLE_FEED.configuration,
});
if (!Scope.isScopeChainValid(CHAIN)) console.log('Chain is not valid:', CHAIN);

const { price, timestamp } = await scope.getPriceFromChain(CHAIN, oraclePrices);
const ageSec = Math.floor(Date.now() / 1000) - timestamp.toNumber();

console.log(`Price: ${price.toString()}`);
console.log(`Updated: ${new Date(timestamp.toNumber() * 1000).toISOString()} (${ageSec}s ago)`);
```

[View Code](https://github.com/Kamino-Finance/scope-sdk)

The calling program supplies the scope chain. A klend reserve, for example, stores it on its token config; Scope just resolves it against the feed's price list. Sentinel slots (`65535`) are skipped.

**API**

Filter the price list by mint. No scope chain to walk.

```typescript theme={null}
const SOL_MINT = 'So11111111111111111111111111111111111111112';
const API = 'https://api.kamino.finance/prices?source=scope';

type Price = { usdPrice: string; token: string; mint: string };
const rows: Price[] = await (await fetch(API)).json();

const sol = rows.find((r) => r.mint === SOL_MINT);
if (!sol) console.log('Mint not found in price list:', SOL_MINT);

console.log(`${sol?.token}: $${sol?.usdPrice}`);
```

### Get Token Price History

Past prices for a single token, keyed by mint or symbol. API only, with no on-chain equivalent: the `OraclePrices` account holds only the current value per slot, so history is served off-chain.

```typescript theme={null}
const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
const API = `https://api.kamino.finance/prices/history?token=${USDC_MINT}&frequency=day&start=2026-06-01T00:00:00Z&end=2026-06-10T00:00:00Z`;

// Each point is a [usdPrice, unixSeconds] pair, ordered oldest to newest.
type PricePoint = [price: string, timestamp: number];
const points: PricePoint[] = await (await fetch(API)).json();

console.log(`History points: ${points.length}`);
points.slice(0, 5).forEach(([price, ts]) =>
  console.log(`  ${new Date(ts * 1000).toISOString()}: $${price}`),
);
```

`frequency` is `minute`, `hour`, or `day`; omit `start`/`end` and the endpoint returns a default recent window (about the last day) at the chosen frequency. See the [Get token price history](https://kamino.com/docs/build/api-reference/oracle/token-prices-history.md) reference for the full parameter list.

## Types

**ScopeDatedPrice**

Returned by `getPriceFromChain`. A resolved price plus its freshness.

```typescript theme={null}
type ScopeDatedPrice = {
  price: Decimal;
  timestamp: BN;
};
```

**OraclePrices**

The on-chain account holding 512 dated prices.

```typescript theme={null}
type OraclePrices = {
  prices: DatedPrice[]; // length 512
};

type DatedPrice = {
  price: { value: BN; exp: BN };
  lastUpdatedSlot: BN;
  unixTimestamp: BN;
};
```

## Additional Resources

> **[API Examples](https://api-docs.kamino.com/)**

> **[SDK Repository](https://github.com/Kamino-Finance/scope-sdk)**


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
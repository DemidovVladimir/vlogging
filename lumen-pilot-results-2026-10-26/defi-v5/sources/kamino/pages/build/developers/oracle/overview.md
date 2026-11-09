> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Oracle

> Build with Scope, Kamino's on-chain oracle aggregator: read prices, inspect feed wiring, and refresh price slots

## Overview

Scope is Kamino's oracle aggregation framework for on-chain pricing. The Scope TypeScript SDK and REST endpoints provide direct access to price data, feed configuration, and refresh instructions. In leverage and flash-loan flows, price refreshes are commonly included before execution so reserves and strategies read the latest market data.

> [!NOTE]
>
> A Scope feed is a fixed-size account: each `OraclePrices` account holds 512 slots, and a token's USD price is resolved through a "scope chain" of up to 4 slot indices (padded with the sentinel `65535`). For the configuration side, read [Configure oracles](https://kamino.com/docs/curators/markets/configuring-oracles.md) and [Scope oracle types](https://kamino.com/docs/curators/markets/scope-oracle-types.md).

## Key Components of Oracle Integration

> **Prices**
>
> Read every populated slot in a feed, or resolve a single token via its scope chain.

> **Feed Internals**
>
> Inspect a feed's configuration, per-hop chain metadata, and per-slot oracle mappings.

> **Refresh**
>
> Build the permissionless refresh instruction that pushes fresh prices on-chain.

## Integration Options

> **Scope TypeScript SDK**
>
> On-chain reads against the Scope program plus the refresh-instruction builder. TypeScript only.

> **REST API**
>
> Off-chain aggregated Scope prices keyed by mint. Language-agnostic, no RPC required.

### Read all prices

**TypeScript**

```typescript theme={null}
import { createSolanaRpc } from '@solana/kit';
import { Scope, SCOPE_MAINNET_HUBBLE_FEED } from '@kamino-finance/scope-sdk';
import Decimal from 'decimal.js';

const rpc = createSolanaRpc('https://api.mainnet-beta.solana.com');
const scope = new Scope('mainnet-beta', rpc);

const oraclePrices = await scope.getSingleOraclePrices({
  config: SCOPE_MAINNET_HUBBLE_FEED.configuration,
});

const populated = oraclePrices.prices
  .map((p, index) => ({ index, p }))
  .filter(({ p }) => p.price.value.toString() !== '0');

console.log(`${populated.length} populated of ${oraclePrices.prices.length} slots`);
populated.slice(0, 5).forEach(({ index, p }) => {
  const price = new Decimal(p.price.value.toString()).div(new Decimal(10).pow(Number(p.price.exp)));
  console.log(`  [${index}] ${price.toString()}`);
});
```

[View Code](https://github.com/Kamino-Finance/scope-sdk)

### Get a single token price

**TypeScript**

```typescript theme={null}
import { createSolanaRpc } from '@solana/kit';
import { Scope, SCOPE_MAINNET_HUBBLE_FEED } from '@kamino-finance/scope-sdk';

const rpc = createSolanaRpc('https://api.mainnet-beta.solana.com');
const scope = new Scope('mainnet-beta', rpc);

// SOL/USD lives at slot 0 of the Hubble feed. Single-hop chain padded with 65535.
const CHAIN = [0, 65535, 65535, 65535];

const oraclePrices = await scope.getSingleOraclePrices({
  config: SCOPE_MAINNET_HUBBLE_FEED.configuration,
});

const { price, timestamp } = await scope.getPriceFromChain(CHAIN, oraclePrices);
console.log(`Price: ${price.toString()} (updated ${new Date(timestamp.toNumber() * 1000).toISOString()})`);
```

[View Code](https://github.com/Kamino-Finance/scope-sdk)

## What's Covered

> **[Prices](https://kamino.com/docs/build/developers/oracle/data/prices.md)**
>
> Read every populated slot in a feed, or resolve a single token via its scope chain. SDK plus REST.

> **[Feed Internals](https://kamino.com/docs/build/developers/oracle/data/feeds.md)**
>
> Feed configuration, per-hop chain metadata, and per-slot oracle mappings.

> **[Refresh Prices](https://kamino.com/docs/build/developers/oracle/operations/refresh.md)**
>
> Build and send the permissionless refresh instruction for one or more slots.

## Relevant Links

> **[NPM SDK package](https://www.npmjs.com/package/@kamino-finance/scope-sdk)**
>
> Install the Scope TypeScript SDK to read feeds and build refresh instructions.

> **[Scope SDK repository](https://github.com/Kamino-Finance/scope-sdk)**
>
> TypeScript SDK source and example scripts.

> **[Oracle Architecture](https://kamino.com/docs/security/oracles)**
>
> Scope, price protection, and manipulation resistance explained.

> **[Scope Oracle Types](https://kamino.com/docs/curators/markets/scope-oracle-types.md)**
>
> Specialized Scope oracle entry types for fixed-income, multi-source, pegged, and LST assets.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
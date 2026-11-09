> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Liquidity

> Learn how to build with Kamino's automated concentrated liquidity vaults

## Overview

Kamino Liquidity provides access to automated concentrated liquidity strategies on Solana via a TypeScript SDK and public API. A strategy manages a CLMM position for a token pair within a defined price range, handling rebalancing, fee compounding, and reward collection. Depositors receive [kTokens](https://kamino.com/docs/products/liquidity/concepts.md#ktokens), which represent a proportional share of the strategy and are redeemable for the underlying assets based on the current share price.

> [!NOTE]
>
> Providing liquidity carries impermanent loss risk — see [Liquidity Concepts](https://kamino.com/docs/products/liquidity/concepts.md) for the full explanation before integrating.

## Key Components of Liquidity Integration

> **Strategy Operations**
>
> Two-sided and single-sided deposits, partial and full withdrawals, with ATA management and lookup-table resolution handled by the SDK.

> **Position Tracking**
>
> User share holdings, USD valuation, pending fees and rewards, PnL, and transaction history.

> **Strategy Analytics**
>
> Share price, TVL, APR/APY, price range, and historical metrics for charts and dashboards.

## Integration Options

> **Public API**
>
> Read-only access to strategy metrics, historical performance, user PnL, fees and rewards, and transaction history. Language-agnostic REST endpoints.

> **TypeScript SDK**
>
> On-chain reads and transaction building for deposits, withdrawals, and position tracking. TS/JS only.

### Deposit

**TypeScript**

```typescript theme={null}
import { createSolanaRpc, address } from '@solana/kit';
import { Kamino } from '@kamino-finance/kliquidity-sdk';
import Decimal from 'decimal.js';

const rpc = createSolanaRpc('https://api.mainnet-beta.solana.com');
const kamino = new Kamino('mainnet-beta', rpc);

const STRATEGY = address('CEz5keL9hBCUbtVbmcwenthRMwmZLupxJ6YtYAgzp4ex');
const strategyState = (await kamino.getStrategiesWithAddresses([STRATEGY]))[0];

// Single-sided deposit: 2 USDC with 100 bps slippage. The SDK swaps half
// the input into the other side via Jupiter v6 before depositing.
const { instructions, lookupTablesAddresses } =
  await kamino.singleSidedDepositTokenB(
    { address: STRATEGY, strategy: strategyState.strategy },
    new Decimal(2.0),
    signer, // TransactionSigner
    new Decimal(100),
  );

console.log('Deposit Instructions:', instructions);
```

[View Code](https://github.com/Kamino-Finance/kliquidity-sdk/tree/master/examples)

> [!NOTE]
>
> For the full deposit flow including lookup-table resolution and transaction confirmation, see [Deposit Operations](https://kamino.com/docs/build/developers/liquidity/operations/deposit.md).

### Withdraw

**TypeScript**

```typescript theme={null}
import { createSolanaRpc, address } from '@solana/kit';
import { Kamino } from '@kamino-finance/kliquidity-sdk';

const rpc = createSolanaRpc('https://api.mainnet-beta.solana.com');
const kamino = new Kamino('mainnet-beta', rpc);

const STRATEGY = address('CEz5keL9hBCUbtVbmcwenthRMwmZLupxJ6YtYAgzp4ex');
const strategy = await kamino.getStrategyByAddress(STRATEGY);
const strategyWithAddress = { strategy: strategy!, address: STRATEGY };

// Burn all shares and receive Token A + Token B back to the user's ATAs.
const bundle = await kamino.withdrawAllShares(
  strategyWithAddress,
  signer, // TransactionSigner
);

console.log('Withdraw Instructions:', bundle?.withdrawIx);
```

[View Code](https://github.com/Kamino-Finance/kliquidity-sdk/tree/master/examples)

> [!NOTE]
>
> For the full withdraw flow including ATA setup, lookup-table resolution, and transaction confirmation, see [Withdraw Operations](https://kamino.com/docs/build/developers/liquidity/operations/withdraw.md).

## What's Covered

> **[Strategy Data](https://kamino.com/docs/build/developers/liquidity/data/strategy.md)**
>
> List strategies, read share price, TVL, APR/APY, price range, and token balances.

> **[User Position Data](https://kamino.com/docs/build/developers/liquidity/data/user-position.md)**
>
> Fetch user positions, USD valuation, pending fees and rewards, and PnL.

> **[Deposit](https://kamino.com/docs/build/developers/liquidity/operations/deposit.md)**
>
> Two-sided deposits and single-sided deposits via auto-swap.

> **[Withdraw](https://kamino.com/docs/build/developers/liquidity/operations/withdraw.md)**
>
> Withdraw a specific share amount or close the full position.

## Relevant Links

> **[Fetch Data via the API](https://api-docs.kamino.com/)**
>
> Access strategy metrics and performance data through REST endpoints.

> **[Kliquidity SDK repository](https://github.com/Kamino-Finance/kliquidity-sdk)**
>
> Explore the SDK source, on-chain program docs, and example scripts.

> **[NPM SDK package](https://www.npmjs.com/package/@kamino-finance/kliquidity-sdk)**
>
> Install the TypeScript SDK to integrate liquidity operations.

> **[Liquidity Concepts](https://kamino.com/docs/products/liquidity/concepts.md)**
>
> AMMs, concentrated liquidity, impermanent loss, and kTokens explained.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
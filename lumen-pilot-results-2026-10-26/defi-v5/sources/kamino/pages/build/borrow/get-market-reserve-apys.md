> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Get Market Reserve APYs

> Fetch Kamino market reserve borrow and supply APY data using the API or SDK

## Borrow & Supply APY Calculation

A reserve is a single asset lending pool within a market. All deposits of an asset enter the same reserve, and all borrowing draws from that pool.

Variable rates are driven by utilization, the fraction of deposits currently borrowed:

```
Utilization = Borrowed / Total Deposited
```

As utilization increases, borrow rates rise. As utilization decreases, borrow rates fall.

Supply APY is derived from borrower interest and depends on both the borrow rate and utilization:

```
Supply APY ≈ Borrow Rate × Utilization × (1 − Protocol Spread)
```

Not all deposited capital is borrowed at any given time, so supply APY is always lower than the borrow rate. Higher utilization means more of the pool is earning interest, which increases lender yield.

Reserves are isolated pools. The same asset in different markets has different borrowers, collateral, and risk profiles, and therefore different rates.

**API**

**Step 1**

### Fetch All Markets

Retrieve the list of all lending markets on Kamino.

```typescript theme={null}
const API_BASE_URL = 'https://api.kamino.finance';
const response = await fetch(`${API_BASE_URL}/v2/kamino-market`);
const markets = await response.json();
```

> [!NOTE]
>
> The `/v2/kamino-market` endpoint returns all lending markets including SOL/BTC Market, JLP Market, Altcoins Market, and Prime Market.

**Step 2**

### Get Reserve APYs for Each Market

For each market, fetch the APY metrics for all reserves (USDC, SOL, wETH, etc.).

```typescript theme={null}
const allMarketReserves = await Promise.all(
  markets.map(async (market) => {
    const response = await fetch(
      `${API_BASE_URL}/kamino-market/${market.lendingMarket}/reserves/metrics`
    );
    const reserves = await response.json();
    return { market, reserves };
  })
);

allMarketReserves.forEach(({ market, reserves }) => {
  console.log(`\n${market.name}:`);

  reserves.forEach((reserve) => {
    console.log(`\n${reserve.liquidityToken}:`);
    console.log(`  Supply APY: ${(reserve.supplyApy * 100).toFixed(2)}%`);
    console.log(`  Borrow APY: ${(reserve.borrowApy * 100).toFixed(2)}%`);
    console.log(`  Total Deposits: $${Number(reserve.totalSupplyUsd).toFixed(2)}`);
    console.log(`  Total Borrowed: $${Number(reserve.totalBorrowUsd).toFixed(2)}`);
  });
});
```

> [!NOTE]
>
> The `/kamino-market/{pubkey}/reserves/metrics` endpoint returns comprehensive metrics for each reserve including APYs, total deposits, and borrows.

**SDK**

**Step 1**

### Import Dependencies

Import the required packages for Solana RPC communication and Kamino SDK.

```typescript theme={null}
import { createSolanaRpc, address } from '@solana/kit';
import {
  KaminoMarket,
  getCurrentLedgerInstant,
  getMedianSlotDurationInMsFromLastEpochs,
} from '@kamino-finance/klend-sdk';
```

**Step 2**

### Load a Market

Load a lending market with the measured slot duration.

```typescript theme={null}
const rpc = createSolanaRpc('https://api.mainnet-beta.solana.com');
const marketAddress = address('7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF');

const market = await KaminoMarket.load(rpc, marketAddress, await getMedianSlotDurationInMsFromLastEpochs());
```

> [!NOTE]
>
> Fixed-rate APYs depend on the slot duration passed to `KaminoMarket.load`. A hard-coded value such as 400 ms shows them at about half their real rate, because mainnet slots are closer to 210 ms.

**Step 3**

### Get the Ledger Instant

APYs are calculated at a ledger instant: the current slot and block time.

```typescript theme={null}
const ledgerInstant = await getCurrentLedgerInstant(rpc);
```

**Step 4**

### Calculate APYs for Each Reserve

Calculate the supply and borrow APY of every reserve in the market.

```typescript theme={null}
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
> A token can have several reserves: one variable-rate reserve plus fixed-rate ones, so each row shows its kind.

> [!TIP]
>
> You've successfully calculated borrow and supply APYs across all reserves using the Kamino SDK.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
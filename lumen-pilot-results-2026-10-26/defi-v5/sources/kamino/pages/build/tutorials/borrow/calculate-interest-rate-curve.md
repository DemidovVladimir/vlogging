> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Interest Rate Curve

> Calculate how borrow and supply APY change based on pool utilization

> [!NOTE]
>
> The interest rate curve shows how borrow and supply APY change as pool utilization increases from 0% to 100%, where utilization represents the share of supplied liquidity that is borrowed.

## Calculate Interest Rate Curve

Generate curve points showing APY at different utilization levels.

**Step 1**

### Import Dependencies

```typescript theme={null}
import { createSolanaRpc, address } from '@solana/kit';
import {
  KaminoMarket,
  ONE_HUNDRED_PCT_IN_BPS,
  getBorrowRate,
  calculateAPYFromAPR,
  getCurrentLedgerInstant,
  getMedianSlotDurationInMsFromLastEpochs,
} from '@kamino-finance/klend-sdk';
```

**Step 2**

### Configure Market and Reserve

```typescript theme={null}
const marketPubkey = address('7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF'); // SOL/BTC Market
const reserveAddress = address('ESCkPWKHmgNE7Msf77n9yzqJd5kQVWWGy3o5Mgxhvavp'); // USDG
const CHART_POINTS = 21;
```

> [!NOTE]
>
> `CHART_POINTS` sets the chart resolution: 21 points is 0% to 100% utilization in 5% steps. The curve's own points are always included, so its kinks aren't skipped.

**Step 3**

### Load Market and Reserve

```typescript theme={null}
const rpc = createSolanaRpc('https://api.mainnet-beta.solana.com');
const market = await KaminoMarket.load(rpc, marketPubkey, await getMedianSlotDurationInMsFromLastEpochs());
const reserve = market!.getReserveByAddress(reserveAddress);

if (!reserve) {
  console.log('Reserve not found:', reserveAddress);
}
```

**Step 4**

### Extract Borrow Curve Points

The curve is a list of (utilization, borrow rate) points in basis points, joined by straight lines. Its rates are APRs. The on-chain list has a fixed length, so repeated points at 100% are padding and are dropped.

```typescript theme={null}
const curve: [number, number][] = reserve!.state.config.borrowRateCurve.points
  .filter((point, index, points) => index === 0 || point.utilizationRateBps !== points[index - 1].utilizationRateBps)
  .map((point) => [point.utilizationRateBps / ONE_HUNDRED_PCT_IN_BPS, point.borrowRateBps / ONE_HUNDRED_PCT_IN_BPS]);

console.log('Curve points (utilization, borrow APR):', curve);
```

> [!NOTE]
>
> The [reserve metrics history](https://kamino.com/docs/build/api-reference/borrow/market-data/market-reserve-metrics-history.md) endpoint returns the same configured curve as `borrowCurve`, without an RPC.

**Step 5**

### Read the Rate Parameters

```typescript theme={null}
const rateFactor = reserve!.rateAdjustmentFactor();
const hostRate = reserve!.getFixedHostInterestRate().toNumber() * rateFactor;
const supplyShare = 1 - reserve!.state.config.protocolTakeRatePct / 100;
```

> [!NOTE]
>
> Borrowers pay the curve rate plus the reserve's fixed host interest. Suppliers earn the curve rate on the borrowed share of the reserve, minus the protocol take rate.

**Step 6**

### Generate Curve Points

Calculate the borrow and supply APY at each utilization.

```typescript theme={null}
const utilizations = [
  ...new Set([...Array.from({ length: CHART_POINTS }, (_, i) => i / (CHART_POINTS - 1)), ...curve.map(([u]) => u)]),
].sort((a, b) => a - b);

const curvePoints = utilizations.map((utilization) => {
  const borrowRate = getBorrowRate(utilization, curve) * rateFactor;
  return {
    utilization: `${(utilization * 100).toFixed(0)}%`,
    borrowAPY: `${(calculateAPYFromAPR(borrowRate + hostRate) * 100).toFixed(2)}%`,
    supplyAPY: `${(calculateAPYFromAPR(utilization * borrowRate * supplyShare) * 100).toFixed(2)}%`,
  };
});

console.table(curvePoints);
```

> [!NOTE]
>
> `getBorrowRate` reads the borrow rate at any utilization from the curve. `calculateAPYFromAPR` compounds an APR into an APY.

**Step 7**

### Compare with Current Rates

```typescript theme={null}
const ledgerInstant = await getCurrentLedgerInstant(rpc);

console.log({
  symbol: reserve!.getTokenSymbol(),
  utilization: `${(reserve!.calculateUtilizationRatio() * 100).toFixed(2)}%`,
  borrowAPY: `${(reserve!.totalBorrowAPY(ledgerInstant) * 100).toFixed(2)}%`,
  supplyAPY: `${(reserve!.totalSupplyAPY(ledgerInstant) * 100).toFixed(2)}%`,
});
```

> [!TIP]
>
> The table shows the borrow and supply APY across the curve, and the current rates show where the reserve sits on it. Plot the table with any charting library.

## Understanding the Results

The curve shows how rates change with utilization:

* **Below the kink**: rates rise slowly. For USDG the kink is at 95% utilization.
* **Above the kink**: rates rise sharply to pull in deposits and push borrowers to repay.
* **Supply APY**: always below borrow APY, because suppliers earn only on the borrowed share of the reserve, minus the protocol take rate.

### Example Output

USDG on the SOL/BTC Market, October 2026 (rows trimmed):

```text theme={null}
Curve points (utilization, borrow APR): [ [ 0, 0 ], [ 0.95, 0.0551 ], [ 1, 0.3634 ] ]

utilization  borrowAPY  supplyAPY
0%           0.50%      0.00%
25%          1.97%      0.33%
50%          3.46%      1.31%
75%          4.97%      2.98%
90%          5.89%      4.32%
95%          6.19%      4.82%
100%         44.54%     38.69%

{ symbol: 'USDG', utilization: '90.61%', borrowAPY: '5.92%', supplyAPY: '4.38%' }
```


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
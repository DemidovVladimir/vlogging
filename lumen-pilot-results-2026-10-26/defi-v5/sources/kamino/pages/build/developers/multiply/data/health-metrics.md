> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Monitor Position Health

> Monitor LTV, leverage, and liquidation risk of multiply positions

When a Multiply position is opened, Kamino's on-chain program immediately begins tracking and updating position health metrics. These metrics update with every transaction that affects the position and recalculate based on current collateral prices and debt accrual.

The protocol stores six core metrics that describe position size, leverage level, borrowing capacity, and liquidation risk.

### Position Health Metrics

| Metric | Description |
| - | - |
| **Total Deposit** | The total USD value of all collateral deposited into the position |
| **Total Borrow** | The total USD value of debt owed on the position |
| **Net Value** | Equity in the position. Calculated as Total Deposit - Total Borrow. Represents the value that would be received if all debt were repaid and collateral withdrawn |
| **Leverage** | Capital amplification multiplier. 1x = no leverage (collateral only), 2x = borrowed amount equals deposit, 3x = borrowed twice the deposit amount |
| **Borrow Limit** | Maximum borrowing capacity before approaching liquidation threshold. Total Borrow must remain below this value |
| **Liquidation LTV** | The loan-to-value percentage at which the position becomes eligible for liquidation. Varies by asset pair and eMode settings |

Leverage amplifies both gains and losses. When Current LTV approaches Liquidation LTV, the position risks partial liquidation. When borrow rates exceed collateral yield, Net APY turns negative and debt grows faster than earnings.

Regular monitoring enables integrations to alert users when conditions warrant position adjustment—whether through debt repayment, leverage reduction, or position closure.

***

## Get Position Health Metrics

**SDK**

**Step 1**

### Import Dependencies

Import the required packages for Solana RPC communication and Kamino SDK operations.

```typescript theme={null}
import { createSolanaRpc, address } from '@solana/kit';
import {
  KaminoMarket,
  ObligationTypeTag,
  getCurrentLedgerInstant,
  getMedianSlotDurationInMsFromLastEpochs,
} from '@kamino-finance/klend-sdk';
```

**Step 2**

### Load Market and Initialize RPC

Initialize the RPC connection and load the xStocks market.

```typescript theme={null}
const rpc = createSolanaRpc('https://api.mainnet-beta.solana.com');
const marketPubkey = address('5wJeMrUYECGq41fxRESKALVcHnNX26TAWy4W98yULsua'); // xStocks Market
const walletAddress = address('EZC9wzVCvihCsCHEMGADYdsRhcpdRYWzSCZAVegSCfqY');

const market = await KaminoMarket.load(rpc, marketPubkey, await getMedianSlotDurationInMsFromLastEpochs());
```

**Step 3**

### Fetch Multiply Obligations

Retrieve all multiply obligations for the wallet address using the obligation type filter.

```typescript theme={null}
const obligations = await market!.getUserObligationsByTag(
  ObligationTypeTag.Multiply,
  walletAddress,
  await getCurrentLedgerInstant(rpc)
);

if (obligations.length === 0) {
  console.log('No multiply obligations found.');
}
```

> [!NOTE]
>
> `getUserObligationsByTag` filters obligations by type. For example, use `ObligationTypeTag.Multiply` to retrieve only multiply positions.

**ObligationTypeTag Values:**

| Type | Value & Description |
| - | - |
| `ObligationTypeTag.Vanilla` | 0: Cross-collateral mode positions |
| `ObligationTypeTag.Multiply` | 1: Leveraged positions created via Multiply |
| `ObligationTypeTag.Lending` | 2: Lending-only positions |
| `ObligationTypeTag.Leverage` | 3: Legacy leverage positions |
| `ObligationTypeTag.MultiplyFixedRate` | 4: Multiply positions tied to specific reserves, used when a token has a fixed-rate reserve |
| `ObligationTypeTag.LendingFixedRate` | 5: Lending-only positions tied to a specific reserve |
| `ObligationTypeTag.LeverageFixedRate` | 6: Leverage positions tied to specific reserves |

**Step 4**

### Read Position Health Metrics

Access the position health statistics from each obligation's `refreshedStats`.

```typescript theme={null}
console.table(
  obligations.map((obligation) => {
    const stats = obligation.refreshedStats;
    return {
      obligation: obligation.obligationAddress,
      depositsUsd: stats.userTotalDeposit.toFixed(2),
      borrowsUsd: stats.userTotalBorrow.toFixed(2),
      netValueUsd: stats.netAccountValue.toFixed(2),
      leverage: `${stats.leverage.toFixed(2)}x`,
      borrowLimitUsd: stats.borrowLimit.toFixed(2),
      ltv: `${stats.loanToValue.mul(100).toFixed(2)}%`,
      liquidationLtv: `${stats.liquidationLtv.mul(100).toFixed(2)}%`,
    };
  })
);
```

> [!TIP]
>
> You now have access to all position health metrics including leverage, borrowing capacity, and liquidation thresholds.

**API**

```typescript theme={null}
const walletAddress = 'your-wallet-address-here';
const marketAddress = '5wJeMrUYECGq41fxRESKALVcHnNX26TAWy4W98yULsua'; // xStocks Market

const response = await fetch(
  `https://api.kamino.finance/kamino-market/${marketAddress}/users/${walletAddress}/obligations`
);

const data = await response.json();

if (data.length === 0) {
  console.log('No obligations found.');
}

data.forEach((obligation) => {
  console.log(`\nObligation Address: ${obligation.obligationAddress}`);
  console.log(`Type: ${obligation.humanTag}`);

  const stats = obligation.refreshedStats;
  console.log(`Stats:`);
  console.log(`  Total Deposit: $${parseFloat(stats.userTotalDeposit).toFixed(2)}`);
  console.log(`  Total Borrow: $${parseFloat(stats.userTotalBorrow).toFixed(2)}`);
  console.log(`  Net Value: $${(parseFloat(stats.userTotalDeposit) - parseFloat(stats.userTotalBorrow)).toFixed(2)}`);
  console.log(`  Leverage: ${parseFloat(stats.leverage).toFixed(2)}x`);
  console.log(`  Borrow Limit: $${parseFloat(stats.borrowLimit).toFixed(2)}`);
  console.log(`  Liquidation LTV: ${(parseFloat(stats.liquidationLtv) * 100).toFixed(2)}%`);
});
```

***

## Liquidation LTV by Asset Pair

| Mode | Asset Pair | Liquidation LTV | Max Leverage |
| - | - | - | - |
| **Standard** | SOL / USDC | 75% | 4x |
| **Standard** | TSLAx / USDC | 65% | \~2.9x |
| **eMode (Main)** | mSOL, bSOL, JupSOL / SOL | \~87% | \~7.7x |
| **eMode (Jito)** | JitoSOL / SOL | 90% | 10x |
| **No eMode** | JLP / USDC | 67% | \~3.2x |

> [!NOTE]
>
> For detailed leverage calculations and eMode mechanics, see [LTV and Leverage Concepts](https://kamino.com/docs/build/developers/multiply/data/concepts).


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
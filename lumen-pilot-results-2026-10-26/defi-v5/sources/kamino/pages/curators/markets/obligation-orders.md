> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Obligation Orders

> Price-triggered self-deleverage for borrower positions

Obligation orders are user-set, price-triggered instructions that automatically deleverage a position when a condition is met. They're the on-chain equivalent of a stop-loss: a borrower creates an order saying "if my LTV crosses 75%, repay 30% of my debt by liquidating part of my collateral." Permissionless executors can then submit transactions that trigger the order when the condition becomes true.

This is a tool for sophisticated borrowers (institutions, leveraged vault strategies) who want guaranteed self-deleverage rules separate from the protocol's standard liquidation flow.

## Market-level enablement

| Field | What it does |
| - | - |
| `obligation_order_creation_enabled` | If `1`, borrowers can create new orders on their obligations |
| `obligation_order_execution_enabled` | If `1`, executors can fill orders when conditions are met |
| `price_triggered_liquidation_disabled` | If `1`, blocks all price-triggered liquidations market-wide (incident response) |

## Reserve-level fee

| Field | What it does |
| - | - |
| `protocol_order_execution_fee_pct` | Percent (0–100) of order-execution proceeds routed to the protocol fee account |

**SDK**

## Enable obligation orders via SDK

Curator-side: flip the market flags. User-side: build a price-based order via SDK helpers and submit `setObligationOrder`.

### Curator: enable on the market

```typescript theme={null}
import {
  KaminoManager,
  DEFAULT_RECENT_SLOT_DURATION_MS,
  PROGRAM_ID,
  MarketWithAddress,
} from '@kamino-finance/klend-sdk';
import { LendingMarket } from '@kamino-finance/klend-sdk/dist/@codegen/klend/accounts';
import { address } from '@solana/kit';

const kaminoManager = new KaminoManager(rpc, DEFAULT_RECENT_SLOT_DURATION_MS, PROGRAM_ID);

const marketState = await LendingMarket.fetch(rpc, marketAddress);
if (!marketState) throw new Error('Market not found');
const marketWithAddress: MarketWithAddress = { address: marketAddress, state: marketState };

const newLendingMarket = { ...marketState };
newLendingMarket.obligationOrderCreationEnabled = 1;
newLendingMarket.obligationOrderExecutionEnabled = 1;
newLendingMarket.priceTriggeredLiquidationDisabled = 0;

const ixs = kaminoManager.updateLendingMarketIxs(adminSigner, marketWithAddress, newLendingMarket);
// submit each ix in order
```

### Curator: set the per-reserve execution fee

Update `protocolOrderExecutionFeePct` in the reserve config (range 0–100):

```typescript theme={null}
import { Reserve } from '@kamino-finance/klend-sdk/dist/@codegen/klend/accounts';

const reserve = await Reserve.fetch(rpc, reserveAddress);
if (!reserve) throw new Error('Reserve not found');

const newConfig = { ...reserve.config };
newConfig.protocolOrderExecutionFeePct = 1;  // 1% of execution proceeds

const updateIxs = await kaminoManager.updateReserveIxs(adminSigner, marketWithAddress, reserveAddress, newConfig);
// submit each chunk in order
```

### Borrower: set a stop-loss order

The SDK provides high-level helpers `createPriceBasedOrder` and `readPriceBasedOrder`, plus `KaminoAction.buildSetObligationOrderIxn` to wrap the on-chain instruction.

```typescript theme={null}
import {
  KaminoAction,
  KaminoMarket,
  KaminoObligation,
  createPriceBasedOrder,
  readPriceBasedOrder,
  OrderType,
  OrderActionType,
  PriceBasedOrderTriggerType,
  getMedianSlotDurationInMsFromLastEpochs,
} from '@kamino-finance/klend-sdk';
import Decimal from 'decimal.js';

const slotDuration = await getMedianSlotDurationInMsFromLastEpochs();
const kaminoMarket = await KaminoMarket.load(rpc, address('<MARKET_ADDRESS>'), slotDuration);
const kaminoObligation = await KaminoObligation.load(kaminoMarket, address('<OBLIGATION_ADDRESS>'));

const context = {
  kaminoMarket,
  kaminoObligation,
  stablecoins: ['USDC'],
};

// Inspect the current stop-loss
const currentStopLoss = readPriceBasedOrder(context, OrderType.StopLoss);
console.log(currentStopLoss);

// Set a new stop-loss: when collateral price drops below $125, repay all USDC debt
const newStopLoss = createPriceBasedOrder(context, OrderType.StopLoss, {
  trigger: {
    type: PriceBasedOrderTriggerType.LongStopLoss,
    whenCollateralPriceBelow: new Decimal(125),
  },
  action: {
    type: OrderActionType.FullRepay,
  },
  executionBonusBpsRange: [50, 200],   // 0.5% - 2% bonus to executor
});

const ix = KaminoAction.buildSetObligationOrderIxn(
  borrowerSigner,
  kaminoMarket,
  kaminoObligation,
  newStopLoss,
);
// Sign and submit
```

A complete working example is at [klend-sdk/examples/klend-examples/example\_obligation\_order.ts](https://github.com/Kamino-Finance/klend-sdk/blob/master/examples/klend-examples/example_obligation_order.ts).

**API**

> [!NOTE]
>
> **Configuring obligation orders is not available via the REST API.** The market-level flags and reserve-level fees are admin operations available through the **SDK** or **Kamino CLI**. User-facing order creation happens via SDK or app integrations.

To configure obligation orders, use the **SDK** or **Kamino CLI** tabs.

**Kamino CLI**

## Enable obligation orders via CLI

```bash theme={null}
# 1. Download
yarn kamino-manager download-lending-market-config \
  --lending-market <MARKET_ADDRESS>

# 2. Edit ./configs/<MARKET>/market-<MARKET>.json — set:
#    "obligation_order_creation_enabled": 1
#    "obligation_order_execution_enabled": 1
#    "price_triggered_liquidation_disabled": 0

# 3. Inspect & apply
yarn kamino-manager update-lending-market-from-config \
  --lending-market <MARKET_ADDRESS> \
  --lending-market-config-path ./configs/<MARKET>/market-<MARKET>.json \
  --mode multisig \
  --multisig <SQUADS_MULTISIG_PUBKEY>
```

For the per-reserve `protocol_order_execution_fee_pct`, edit the reserve config and apply via `update-reserve-config`.

User-side order creation is not exposed through the kamino-manager CLI; borrowers create orders via the Kamino webapp or via SDK-built transactions.

## Order conditions

An order specifies a `ConditionType` and a threshold:

| ConditionType | When it fires |
| - | - |
| `Never (0)` | Never. Disabled placeholder |
| `UserLtvAbove (1)` | Borrower's LTV exceeds the threshold |
| `UserLtvBelow (2)` | Borrower's LTV drops below the threshold |
| `DebtCollPriceRatioAbove (3)` | Debt asset's price relative to collateral exceeds the threshold |
| `DebtCollPriceRatioBelow (4)` | Same ratio drops below the threshold |
| `Always (5)` | Always fires (manual-trigger orders) |
| `LiquidationLtvCloserThan (6)` | Borrower's LTV is closer to the liquidation threshold than the configured distance |

The most useful conditions for self-deleverage are `UserLtvAbove` and `LiquidationLtvCloserThan`. The price-ratio conditions are useful for protecting against specific pair movements.

## Order opportunities (the action)

| OpportunityType | What it does |
| - | - |
| `DeleverageSingleDebtAmount (0)` | Repay a specified amount of a single debt position by liquidating collateral |
| `DeleverageAllDebt (1)` | Repay all debt on the obligation (or all debt against a specified collateral) |

`DeleverageSingleDebtAmount` is the granular case — pay down a chunk of debt, leave the rest. `DeleverageAllDebt` is the full unwind.

## The execution flow

The borrower calls `set-obligation-order` from their wallet, supplying a condition type, threshold, opportunity type, amount, and any reserve references the order needs. The order is stored on the obligation account and is now visible to executors.

Execution is permissionless. Anyone can run a monitor that watches the program for orders whose condition is currently met; the standard pattern is an executor bot that scans active orders and submits `fill-obligation-order` against any that are fillable, referencing the obligation, the collateral reserve, the debt reserve, and the amount.

When the bot's call lands, the program performs the deleverage in a single instruction: it liquidates the specified amount of collateral, repays the corresponding debt, pays the standard liquidation bonus to the executor, and routes `protocol_order_execution_fee_pct` of the proceeds to the protocol fee account. The order is cleared (or partially filled, if the action was specified as an amount and the bot only filled a portion).

## Why a curator enables this

Standard liquidation only fires when a borrower's LTV crosses the per-reserve `liquidationThresholdPct`. That's the safety floor. Obligation orders let a borrower set a *softer* trigger above that floor — a stop-loss that fires before the position becomes liquidatable, on terms the borrower controls.

An institutional borrower running a 10× yield loop on SOL/mSOL might set:

* Order 1: `UserLtvAbove 70%` → `DeleverageSingleDebtAmount 20% of position` (gradual deleveraging as risk rises)
* Order 2: `UserLtvAbove 78%` → `DeleverageAllDebt` (full exit before liquidation threshold at 80%)

When SOL price drops, Order 1 fires first, paring the position back. If that's not enough and prices keep falling, Order 2 fires before the protocol's liquidation kicks in — saving the borrower the wider liquidation bonus.

## Common conditions for self-deleverage

| Strategy | Condition | Threshold | Action |
| - | - | - | - |
| Soft stop-loss on an LST loop | `UserLtvAbove` | 5–10pp below liquidation threshold | `DeleverageSingleDebtAmount` covering \~20% |
| Hard exit on rapid drop | `LiquidationLtvCloserThan` | 2pp distance | `DeleverageAllDebt` |
| Pair-specific protection | `DebtCollPriceRatioAbove` | Asset-specific | `DeleverageSingleDebtAmount` |
| Manual cancel-on-call | `Always` | — | `DeleverageSingleDebtAmount` (only fires on executor call) |

## Pausing during an incident

The market-level kill switch is `price_triggered_liquidation_disabled`. Setting it to `1` blocks all price-triggered actions, including obligation order fills, while leaving non-price flows (manual repay, manual deposit, etc.) operational.

Useful for: oracle outage, suspicious price movement, before a planned migration. Reset to `0` once the incident is resolved.

## Reference

* [Market config reference](https://kamino.com/docs/curators/markets/market-config-reference.md) — `obligation_order_*_enabled`, `price_triggered_liquidation_disabled`
* [Reserve config reference](https://kamino.com/docs/curators/markets/reserve-parameters.md) — `protocol_order_execution_fee_pct`
* [Liquidations](https://kamino.com/docs/curators/markets/liquidations.md) — the protocol-managed equivalent
* [Auto-deleverage](https://kamino.com/docs/curators/markets/auto-deleverage.md) — protocol-managed margin-call mechanism
* [klend-sdk obligation order example](https://github.com/Kamino-Finance/klend-sdk/blob/master/examples/klend-examples/example_obligation_order.ts)


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
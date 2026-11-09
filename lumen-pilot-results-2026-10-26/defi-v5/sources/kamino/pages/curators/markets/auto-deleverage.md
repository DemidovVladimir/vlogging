> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Auto-Deleverage

> Margin-call grace window with a ramped liquidation bonus over time

Auto-deleverage is a softer alternative to immediate liquidation. When a position crosses an unhealthy threshold, the curator (or an off-chain bot) marks it for deleveraging: the borrower receives a grace period to self-deleverage, and only after the grace period elapses does liquidation become available — at a ramped bonus that grows over time.

This is a niche feature most curators leave disabled. Standard [Liquidations](https://kamino.com/docs/curators/markets/liquidations.md) (immediate, threshold-triggered) are sufficient for most markets. Enable auto-deleverage when you specifically want a borrower-friendly margin-call window before liquidations open up.

## When this is useful

| Curator profile | Recommendation |
| - | - |
| Public market with retail borrowers | Optional. The grace period is borrower-friendly but adds operational complexity |
| Institutional / fixed-term market | Skip. Institutional borrowers prefer immediate, predictable liquidation behavior |
| Stable-only / eMode-heavy market | Skip. Correlated-asset liquidations are small and fast |
| Newly-listed volatile asset | Optional. If enabled, use a shorter `margin_call_period` (e.g., 4 hours) |

## Market-level enablement

| Field | What it does |
| - | - |
| `autodeleverage_enabled` | Master switch. `1` enables auto-deleverage on the market |
| `individual_autodeleverage_margin_call_period_secs` | Default grace period (seconds) between when a position is margin-called and when liquidation opens up. `86400` = 24 hours |
| `insolvency_risk_unhealthy_ltv_pct` | LTV at which a position is considered to be in insolvency risk territory and may be marked for auto-deleverage. Default `100` |

## Reserve-level config

| Field | What it does |
| - | - |
| `autodeleverage_enabled` | Per-reserve enablement. Both market and reserve must be `1` for auto-deleverage to apply to positions involving this reserve |
| `deleveraging_margin_call_period_secs` | Per-reserve override for the margin-call period. `0` falls back to the market-level value |
| `deleveraging_threshold_decrease_bps_per_day` | The position's effective liquidation threshold drops by this many bps per day after margin call. Allows liquidators in over time |
| `deleveraging_bonus_increase_bps_per_day` | Liquidator bonus rises by this many bps per day after margin call. Compounds the incentive over time |
| `min_deleveraging_bonus_bps` | Floor on the deleveraging-specific bonus |

**SDK**

## Configure auto-deleverage via SDK

Auto-deleverage is enabled through standard market and reserve config updates.

### Enable on the market

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
newLendingMarket.autodeleverageEnabled = 1;
newLendingMarket.individualAutodeleverageMarginCallPeriodSecs = 86_400n;  // 24 hours
newLendingMarket.insolvencyRiskUnhealthyLtvPct = 100;

const ixs = kaminoManager.updateLendingMarketIxs(adminSigner, marketWithAddress, newLendingMarket);
// submit each ix in order
```

### Enable on a reserve

```typescript theme={null}
import { Reserve } from '@kamino-finance/klend-sdk/dist/@codegen/klend/accounts';

const reserve = await Reserve.fetch(rpc, reserveAddress);
if (!reserve) throw new Error('Reserve not found');

const newConfig = { ...reserve.config };
newConfig.autodeleverageEnabled = 1;
newConfig.deleveragingMarginCallPeriodSecs = 0n;          // 0 = use market default
newConfig.deleveragingThresholdDecreaseBpsPerDay = 24n;    // 0.24% per day
newConfig.deleveragingBonusIncreaseBpsPerDay = 100n;       // 1% per day
newConfig.minDeleveragingBonusBps = 0;

const updateIxs = await kaminoManager.updateReserveIxs(
  adminSigner,
  marketWithAddress,
  reserveAddress,
  newConfig,
);
// submit each chunk in order
```

### Marking a position for deleveraging

The `markObligationForDeleveraging` instruction is exposed via the SDK codegen. An off-chain monitor (or any wallet) can submit it once a position breaches `insolvency_risk_unhealthy_ltv_pct`.

```typescript theme={null}
import { markObligationForDeleveraging } from '@kamino-finance/klend-sdk/dist/@codegen/klend/instructions';
import { PROGRAM_ID } from '@kamino-finance/klend-sdk';

// Build args and accounts per the instruction's signature, then:
const ix = markObligationForDeleveraging(args, accounts, PROGRAM_ID);
// Sign with the marker's wallet and submit
```

For full args / accounts shapes, see `klend-sdk/src/@codegen/klend/instructions/markObligationForDeleveraging.ts`.

**API**

> [!NOTE]
>
> **Configuring auto-deleverage is not available via the REST API.** The flags live on `LendingMarket` and `ReserveConfig` and are flipped through the **SDK** or **Kamino CLI**. The `markObligationForDeleveraging` instruction is a permissionless on-chain call; off-chain monitors typically submit it directly.

To monitor positions that have entered or are eligible for the auto-deleverage state, query the on-chain obligation accounts directly. See [Read market data](https://kamino.com/docs/curators/markets/market-data.md).

**Kamino CLI**

## Configure auto-deleverage via CLI

Both the market-level and reserve-level fields are part of the standard config schemas. Apply via `update-lending-market-from-config` and `update-reserve-config`.

### Market-level

```bash theme={null}
yarn kamino-manager download-lending-market-config \
  --lending-market <MARKET_ADDRESS>

# Edit ./configs/<MARKET>/market-<MARKET>.json — set:
#   "autodeleverage_enabled": 1
#   "individual_autodeleverage_margin_call_period_secs": 86400
#   "insolvency_risk_unhealthy_ltv_pct": 100

yarn kamino-manager update-lending-market-from-config \
  --lending-market <MARKET_ADDRESS> \
  --lending-market-config-path ./configs/<MARKET>/market-<MARKET>.json \
  --mode multisig \
  --multisig <SQUADS_MULTISIG_PUBKEY>
```

### Reserve-level

```bash theme={null}
yarn kamino-manager download-reserve-config \
  --reserve <RESERVE_ADDRESS> \
  --output ./configs/<RESERVE>.json

# Edit ./configs/<RESERVE>.json — set:
#   "autodeleverage_enabled": 1
#   "deleveraging_margin_call_period_secs": 0
#   "deleveraging_threshold_decrease_bps_per_day": 24
#   "deleveraging_bonus_increase_bps_per_day": 100
#   "min_deleveraging_bonus_bps": 0

yarn kamino-manager update-reserve-config \
  --reserve <RESERVE_ADDRESS> \
  --reserve-config-path ./configs/<RESERVE>.json \
  --mode multisig \
  --multisig <SQUADS_MULTISIG_PUBKEY>
```

## The lifecycle

When a position's LTV crosses `insolvency_risk_unhealthy_ltv_pct`, an off-chain monitor (anyone, typically a bot) calls `mark-obligation-for-deleveraging`. The position is now margin-called and the program records a timestamp. Standard liquidation is gated by the auto-deleverage state from this point forward.

For `deleveraging_margin_call_period_secs` (or the market default if the reserve doesn't override), the borrower has a grace window to repay or add collateral. Once grace ends, the deleveraging state begins to ramp: the effective liquidation threshold drops by `deleveraging_threshold_decrease_bps_per_day` and the liquidator bonus rises by `deleveraging_bonus_increase_bps_per_day`. Each elapsed day makes the position progressively easier to liquidate and progressively more profitable to clear, until a liquidator finally executes.

## Tuning the ramp

Two reserve-level fields shape how aggressively the deleveraging state ramps after grace ends.

| Field | Higher value means |
| - | - |
| `deleveraging_threshold_decrease_bps_per_day` | Liquidation threshold drops faster, opening up the position to liquidators sooner |
| `deleveraging_bonus_increase_bps_per_day` | Liquidator bonus grows faster, paying executors more for clearing the position |

Reference settings:

| Risk profile | threshold\_decrease | bonus\_increase | margin\_call\_period |
| - | - | - | - |
| Borrower-friendly | 12 bps/day | 50 bps/day | 48 hours |
| Standard | 24 bps/day | 100 bps/day | 24 hours |
| Aggressive (volatile asset) | 50 bps/day | 200 bps/day | 4 hours |

## Off-chain infrastructure

Auto-deleverage is useful in proportion to the off-chain monitoring around it. A typical setup:

* **Position monitor**: an off-chain service watches `insolvency_risk_unhealthy_ltv_pct` breaches and submits `mark-obligation-for-deleveraging`
* **Borrower notification**: when a position is marked, notify the borrower (email / push / wallet message) so they can react inside the grace window
* **Liquidator coordination**: standard liquidator infrastructure picks up margin-called positions once the grace window expires

For curator markets, you either rely on Kamino's existing infrastructure (for whitelisted markets) or run your own.

## Reference

* [Liquidations](https://kamino.com/docs/curators/markets/liquidations.md) — base liquidation mechanics
* [Reserve config reference](https://kamino.com/docs/curators/markets/reserve-parameters.md) — `autodeleverage_enabled`, `deleveraging_*` fields
* [Market config reference](https://kamino.com/docs/curators/markets/market-config-reference.md) — `autodeleverage_enabled`, `individual_autodeleverage_margin_call_period_secs`, `insolvency_risk_unhealthy_ltv_pct`


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
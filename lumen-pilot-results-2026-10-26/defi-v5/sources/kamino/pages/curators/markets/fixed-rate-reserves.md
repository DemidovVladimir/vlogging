> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Fixed Rate Reserves

> Reserves with a host fixed rate, debt maturity, rollover windows, and early-repay penalties

A fixed rate reserve locks borrowers into a predictable rate for a defined duration. The reserve's `borrow_rate_curve` is configured as a flat curve at the target rate, so borrowers pay the same rate regardless of utilization. At maturity, the borrower must repay, roll over, or face liquidation.

Each (rate, term) combination lives on its own reserve. A market that offers, say, 4%/30-day, 5%/60-day, and 6%/90-day USDC borrows would have three USDC fixed rate reserves — one per (rate, term) pair — each with its own debt maturity.

## Reserve-level configuration

The fixed-rate mechanics are controlled by these `ReserveConfig` fields:

| Field | What it does |
| - | - |
| `debt_term_seconds` | Duration of the fixed term, in seconds. `0` = open-term reserve. Setting any positive value makes every borrow on this reserve a fixed-term borrow |
| `debt_maturity_timestamp` | Optional absolute Unix timestamp when *all* debt on this reserve matures simultaneously. `0` = each borrow rolls forward `debt_term_seconds` from origination |
| `host_fixed_interest_rate_bps` | Optional additional spread (bps) layered on top of the flat borrow rate curve, accruing 100% to the protocol. Default `0` |
| `early_repay_remaining_interest_pct` | Penalty for repaying during the first term, expressed as percent (0–100) of the *remaining* interest to maturity. After rollover, no penalty applies |

## Market-level rollover settings

| Field | What it does |
| - | - |
| `fixed_term_rollover_window_duration_seconds` | Window before maturity allowing fixed→fixed rollover. `0` disables |
| `open_term_rollover_window_duration_seconds` | Window before maturity allowing fixed→open rollover. `0` disables |
| `obligation_borrow_migration_to_fixed_execution_enabled` | If `1`, allows open→fixed migration anytime |
| `obligation_borrow_rollover_configuration_enabled` | If `1`, allows borrowers to pre-configure rollover behavior |
| `min_partial_rollover_value` | Minimum size for a partial rollover. `0` requires full rollovers only |
| `term_based_full_liquidation_duration_secs` | Time after maturity before full (close-factor-bypassing) liquidation is available |
| `mature_reserve_debt_liquidation_enabled` | Master switch for mature-debt liquidation flow |
| `obligation_borrow_debt_term_liquidation_enabled` | Per-feature switch for the term-based liquidation path |

**SDK**

## Configure a fixed rate reserve via SDK

Reserve-level fields are set via `kaminoManager.updateReserveIxs` (or at creation via `addAssetToMarketIxs`). Market-level rollover and liquidation flags are set via `updateLendingMarketIxs`.

### Reserve config

```typescript theme={null}
import {
  KaminoManager,
  DEFAULT_RECENT_SLOT_DURATION_MS,
  PROGRAM_ID,
  MarketWithAddress,
} from '@kamino-finance/klend-sdk';
import { LendingMarket, Reserve } from '@kamino-finance/klend-sdk/dist/@codegen/klend/accounts';
import { address } from '@solana/kit';

// ... rpc setup, adminSigner ...

const kaminoManager = new KaminoManager(rpc, DEFAULT_RECENT_SLOT_DURATION_MS, PROGRAM_ID);

const marketState = await LendingMarket.fetch(rpc, marketAddress);
if (!marketState) throw new Error('Market not found');
const marketWithAddress: MarketWithAddress = { address: marketAddress, state: marketState };

const reserve = await Reserve.fetch(rpc, reserveAddress);
if (!reserve) throw new Error('Reserve not found');

const newConfig = { ...reserve.config };
newConfig.debtTermSeconds = 2_592_000n;            // 30 days
newConfig.debtMaturityTimestamp = 0n;              // 0 = per-borrow rolling term
newConfig.hostFixedInterestRateBps = 500;          // 5%
newConfig.earlyRepayRemainingInterestPct = 50;     // 50% penalty on remaining interest

const updateIxs = await kaminoManager.updateReserveIxs(
  adminSigner,
  marketWithAddress,
  reserveAddress,
  newConfig,
);
// submit each chunk in order
```

### Market-level rollover and liquidation flags

```typescript theme={null}
const newLendingMarket = { ...marketState };
newLendingMarket.fixedTermRolloverWindowDurationSeconds = 172_800n;     // 48 hours
newLendingMarket.openTermRolloverWindowDurationSeconds = 0n;
newLendingMarket.obligationBorrowMigrationToFixedExecutionEnabled = 0;
newLendingMarket.obligationBorrowRolloverConfigurationEnabled = 1;
newLendingMarket.minPartialRolloverValue = 100_000n;
newLendingMarket.termBasedFullLiquidationDurationSecs = 86_400n;        // 24h after maturity
newLendingMarket.matureReserveDebtLiquidationEnabled = 1;
newLendingMarket.obligationBorrowDebtTermLiquidationEnabled = 1;

const ixs = kaminoManager.updateLendingMarketIxs(adminSigner, marketWithAddress, newLendingMarket);
// submit each ix in order
```

### User-side rollover

The user-facing rollover instruction (`rolloverFixedTermBorrow`) is part of the on-chain klend program. The current public klend-sdk does not yet expose a dedicated TypeScript helper for it; until it ships, end-user apps integrate the rollover via the Kamino webapp or by building the instruction manually from the program IDL.

**API**

> [!NOTE]
>
> **Configuring fixed-rate parameters is not available via the REST API.** The fields live on `ReserveConfig` and `LendingMarket` and are set through the **SDK** or **Kamino CLI**.

To configure fixed rate reserves and rollover behavior, use the **SDK** or **Kamino CLI** tabs.

For reading reserve maturity and debt term state, see [Read market data](https://kamino.com/docs/curators/markets/market-data.md).

**Kamino CLI**

## Configure a fixed rate reserve via CLI

Fixed-rate parameters are part of the standard reserve config JSON. Apply via `update-reserve-config`.

### Reserve config

```bash theme={null}
yarn kamino-manager download-reserve-config \
  --reserve <RESERVE_ADDRESS> \
  --output ./configs/<RESERVE>.json
```

Edit the JSON:

```jsonc theme={null}
{
  "debt_term_seconds": 2592000,
  "debt_maturity_timestamp": 0,
  "host_fixed_interest_rate_bps": 500,
  "early_repay_remaining_interest_pct": 50
}
```

Apply:

```bash theme={null}
yarn kamino-manager update-reserve-config \
  --reserve <RESERVE_ADDRESS> \
  --reserve-config-path ./configs/<RESERVE>.json \
  --mode multisig \
  --multisig <SQUADS_MULTISIG_PUBKEY>
```

### Market-level rollover and liquidation flags

```bash theme={null}
yarn kamino-manager download-lending-market-config \
  --lending-market <MARKET_ADDRESS>
```

Edit `./configs/<MARKET>/market-<MARKET>.json`:

```jsonc theme={null}
{
  "fixed_term_rollover_window_duration_seconds": 172800,
  "open_term_rollover_window_duration_seconds": 0,
  "obligation_borrow_migration_to_fixed_execution_enabled": 0,
  "obligation_borrow_rollover_configuration_enabled": 1,
  "min_partial_rollover_value": "100000",
  "term_based_full_liquidation_duration_secs": 86400,
  "mature_reserve_debt_liquidation_enabled": 1,
  "obligation_borrow_debt_term_liquidation_enabled": 1
}
```

Apply via `update-lending-market-from-config`.

## Open-term vs. fixed-rate

| Mode | Configuration |
| - | - |
| Open-term (default) | `debt_term_seconds = 0`, `debt_maturity_timestamp = 0`, `host_fixed_interest_rate_bps = 0` |
| Per-borrow rolling fixed term | `debt_term_seconds > 0`, `debt_maturity_timestamp = 0`. Every borrow matures `debt_term_seconds` after origination |
| Cohort fixed term | `debt_term_seconds > 0`, `debt_maturity_timestamp > 0`. All debt matures at the absolute timestamp |

Mixing fixed and open on the same reserve isn't supported. To run both, deploy two reserves for the same mint.

## How interest accrues

Total borrow rate = `borrow_rate_curve value at current utilization` + `host_fixed_interest_rate_bps`.

For a fixed-rate reserve, the `borrow_rate_curve` is configured as a **flat curve** (both endpoints set to the same rate), so the base rate is constant regardless of utilization. With `host_fixed_interest_rate_bps` at its default of `0`, the borrower pays exactly the flat curve rate. Set a non-zero `host_fixed_interest_rate_bps` only when you intentionally want a protocol-side spread on top of the lender-facing rate. See [Reserve Configuration](https://kamino.com/docs/curators/markets/fixed-rates/reserve-configuration.md#what-pins-a-fixed-rate-reserve) for full details on configuring the flat curve.

## Maturity and what happens at it

When a borrow reaches its `debt_maturity_timestamp` (per-borrow or cohort):

| Outcome | Trigger |
| - | - |
| Repay in full | The borrower repays. The position closes |
| Roll over | The borrower rolls into a new fixed term — same reserve, different reserve, or migrates to open-term. Subject to market-level rollover flags |
| Liquidation as mature debt | If `mature_reserve_debt_liquidation_enabled = 1` and `obligation_borrow_debt_term_liquidation_enabled = 1`, mature debt becomes liquidatable |
| Forced full liquidation | After `term_based_full_liquidation_duration_secs` past maturity, the position is eligible for full (close-factor-bypassing) liquidation |

## The rollover modes

| Mode | Source | Destination | Constraints |
| - | - | - | - |
| Fixed → Fixed | A fixed rate reserve | Another (or same) fixed rate reserve | Allowed only inside `fixed_term_rollover_window_duration_seconds` of original maturity |
| Fixed → Open | A fixed rate reserve | An open-term reserve for the same mint | Allowed only inside `open_term_rollover_window_duration_seconds` of original maturity |
| Open → Fixed | An open-term reserve | A fixed rate reserve for the same mint | Allowed any time, gated by `obligation_borrow_migration_to_fixed_execution_enabled` |

Rollover preserves the principal but resets accrual: the new term starts fresh. Penalties from the prior term do not carry over.

## Early-repay penalty

The early-repay penalty applies during the **first term only**. Once a loan rolls over into a subsequent term, the borrower can repay at any time without penalty.

```
penalty = early_repay_remaining_interest_pct% × (interest that would have accrued from now to maturity)
```

| `early_repay_remaining_interest_pct` | Effect |
| - | - |
| `0` | No penalty. Borrowers can repay any time at no extra cost |
| `50` | 50% of remaining interest is owed at repay during the first term. Mild discouragement of early exit |
| `100` | Full first term's interest is locked in. The borrower owes the same regardless of repay time |

> [!NOTE]
>
> If the borrower borrows additional principal on an already-active fixed-term position, the borrow timestamp is reset for the entire position. Effectively, the new top-up creates a new fixed term covering the combined balance. After a rollover, the penalty no longer applies.

## Curator workflow: launching a fixed rate reserve

**1. Decide the (rate, term) matrix**

Pick the durations and rates you want to offer (e.g., 30/60/90 days at 4%/5%/6%). Each combination is a separate reserve.

**2. Configure each reserve**

Set `debt_term_seconds`, `host_fixed_interest_rate_bps`, `early_repay_remaining_interest_pct`. Choose risk parameters (LTV, threshold, IR curve) appropriate for the duration.

**3. Set market-level rollover windows**

Decide the rollover window — how far before maturity borrowers can roll. Common settings: 24–72 hours.

**4. Enable mature-debt liquidation**

Set `mature_reserve_debt_liquidation_enabled = 1` and `obligation_borrow_debt_term_liquidation_enabled = 1`. Choose `term_based_full_liquidation_duration_secs` (typically 12–48 hours after maturity).

**5. Test on staging**

Take a fixed-term borrow on staging, fast-forward time using a test scenario, exercise rollover, exercise repay, exercise mature-debt liquidation. Confirm the lifecycle works before mainnet.

## Common errors

| Error | Cause |
| - | - |
| `BorrowRolloverExecutionDisabled` | Market-level rollover window is `0`. Set `fixed_term_rollover_window_duration_seconds` (or `open_term_rollover_window_duration_seconds`) to a positive value |
| `RolloverWindowNotOpen` | Borrower tried to roll outside the configured window before maturity |
| `MatureDebtLiquidationDisabled` | The position is mature but liquidation flags are off. Either enable the liquidation flags or repay |
| Sub-\$2 obligations stuck near maturity | A known edge case where dust positions interact poorly with the close-factor cap. Set `min_full_liquidation_value_threshold` low enough that mature dust positions can be fully liquidated |

## Reference

* [Reserve config reference](https://kamino.com/docs/curators/markets/reserve-parameters.md) — fixed-rate reserve fields
* [Market config reference](https://kamino.com/docs/curators/markets/market-config-reference.md) — rollover and term-liquidation flags
* [Borrow orders](https://kamino.com/docs/curators/markets/borrow-orders.md) — peer-to-peer matching for fixed-rate liquidity
* [Liquidations](https://kamino.com/docs/curators/markets/liquidations.md) — base liquidation mechanics


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Emergency Controls

> Pause borrowing, halt liquidations, freeze the market, and socialize unrecoverable loss

When something goes wrong, such as a bad oracle, suspicious activity, or an incident, the curator has a graduated set of switches to limit damage while a fix is prepared. This page covers each switch, when to use it, and what's still possible after it's flipped.

The emergency switches range from softest (pause new borrows) to hardest (freeze the market permanently). Each is a single flag flip on `LendingMarket` or `ReserveConfig`, applied via the standard config-update flow.

## The graduated controls

| Severity | Control | Effect | Reversible |
| - | - | - | - |
| Low | `borrow_disabled` (market) | New borrows revert. Existing borrows, deposits, withdrawals, repayments continue | Yes |
| Low-mid | `utilizationLimitBlockBorrowingAbovePct` (reserve) | Borrows above utilization threshold revert | Yes |
| Mid | `block_price_usage: 1` (reserve `tokenInfo`) | Any operation needing this reserve's price reverts. Market continues; affected reserve is offline | Yes |
| Mid | `emergency_mode: 1` (reserve `ReserveConfig`) | Per-reserve emergency mode. Reserve operations are halted; other reserves unaffected | Yes |
| Mid-high | `price_triggered_liquidation_disabled: 1` (market) | All price-triggered liquidations market-wide are blocked. Standard non-price flows continue | Yes |
| High | `emergency_mode: 1` (market) | Market-wide emergency mode. Operations are restricted across all reserves | Yes |
| Highest | `immutable: 1` (market) | All curator-side updates are permanently disabled. The market is frozen at its current state | **No** |

**SDK**

## Flip emergency flags via SDK

All emergency controls are single-field updates on `LendingMarket` or `ReserveConfig`. Use the standard market or reserve update flow.

### Market-level flags

```typescript theme={null}
import { KaminoManager, DEFAULT_RECENT_SLOT_DURATION_MS, PROGRAM_ID, MarketWithAddress } from '@kamino-finance/klend-sdk';
import { LendingMarket } from '@kamino-finance/klend-sdk/dist/@codegen/klend/accounts';
import { address } from '@solana/kit';

const marketState = await LendingMarket.fetch(rpc, marketAddress);
if (!marketState) throw new Error('Market not found');
const marketWithAddress: MarketWithAddress = { address: marketAddress, state: marketState };

const newLendingMarket = { ...marketState };

// Examples — pick the flag that matches the situation:
newLendingMarket.borrowDisabled = 1;                          // pause new borrows
newLendingMarket.priceTriggeredLiquidationDisabled = 1;       // pause price-triggered liquidations
newLendingMarket.emergencyMode = 1;                            // market-wide emergency
newLendingMarket.emergencyCouncil = address('<EMERGENCY_PUBKEY>');
// newLendingMarket.immutable = 1;                              // **IRREVERSIBLE** — only set when winding down

const ixs = kaminoManager.updateLendingMarketIxs(adminSigner, marketWithAddress, newLendingMarket);
// submit each ix in order
```

### Reserve-level flags

```typescript theme={null}
import { Reserve } from '@kamino-finance/klend-sdk/dist/@codegen/klend/accounts';

const reserve = await Reserve.fetch(rpc, reserveAddress);
if (!reserve) throw new Error('Reserve not found');

const newConfig = { ...reserve.config };

// Examples — pick the flag that matches the situation:
newConfig.emergencyMode = 1;                                   // halt this reserve
newConfig.tokenInfo = { ...newConfig.tokenInfo, blockPriceUsage: 1 };  // refuse any price-using op
newConfig.utilizationLimitBlockBorrowingAbovePct = 80;          // block borrows above 80% utilization

const ixs = await kaminoManager.updateReserveIxs(
  adminSigner,
  marketWithAddress,
  reserveAddress,
  newConfig,
);
// submit each chunk in order
```

To re-enable, set the flag back to `0` (or `0` on the relevant numeric field) and re-apply.

**API**

> [!NOTE]
>
> **Emergency controls are not available via the REST API.** They are admin-level config flips on `LendingMarket` and `ReserveConfig`, applied through the **SDK** or **Kamino CLI**.

To flip an emergency flag, use the **SDK** or **Kamino CLI** tabs.

To monitor live state during an incident, query the on-chain accounts directly or use the [API reference](https://kamino.com/docs/build/api-reference/introduction.md).

**Kamino CLI**

## Flip emergency flags via CLI

Emergency flags are single-field changes inside a market or reserve config JSON. Apply via the standard `update-lending-market-from-config` (market-level) or `update-reserve-config` (reserve-level) flow.

### Market-level flag flips

```bash theme={null}
# 1. Download
yarn kamino-manager download-lending-market-config \
  --lending-market <MARKET_ADDRESS>

# 2. Edit ./configs/<MARKET>/market-<MARKET>.json — flip the flag:
#    "borrow_disabled": 1
#    or "emergency_mode": 1
#    or "price_triggered_liquidation_disabled": 1
#    or "immutable": 1     (IRREVERSIBLE)

# 3. Inspect
yarn kamino-manager update-lending-market-from-config \
  --lending-market <MARKET_ADDRESS> \
  --lending-market-config-path ./configs/<MARKET>/market-<MARKET>.json \
  --mode inspect

# 4. Execute or propose
yarn kamino-manager update-lending-market-from-config \
  --lending-market <MARKET_ADDRESS> \
  --lending-market-config-path ./configs/<MARKET>/market-<MARKET>.json \
  --mode multisig \
  --multisig <SQUADS_MULTISIG_PUBKEY>
```

### Reserve-level flag flips

```bash theme={null}
yarn kamino-manager download-reserve-config \
  --reserve <RESERVE_ADDRESS> \
  --output ./configs/<RESERVE>.json

# Edit — flip "emergency_mode": 1 or set tokenInfo.blockPriceUsage: 1

yarn kamino-manager update-reserve-config \
  --reserve <RESERVE_ADDRESS> \
  --reserve-config-path ./configs/<RESERVE>.json \
  --mode multisig \
  --multisig <SQUADS_MULTISIG_PUBKEY>
```

## What each control does

### Soft pause: stop new borrows

`borrow_disabled: 1` on the market. The minimal-disruption switch. Existing positions continue accruing interest. Repayments, deposits, withdrawals work. New borrows revert with `BorrowingDisabled`.

Use when: you've noticed something off and want to limit new exposure while you investigate.

### Reserve-level utilization brake

`utilizationLimitBlockBorrowingAbovePct: 80` on the reserve. A softer alternative to `borrow_disabled` for situations where you want to throttle borrowing only when the reserve is highly utilized. Borrows that would push utilization above the configured percentage revert; borrows at lower utilization continue.

`0` disables.

### Reserve-level disable: block price usage

`tokenInfo.blockPriceUsage: 1` on the reserve. The reserve's price feed is treated as unusable. Every operation that needs to read the price reverts. The reserve is effectively offline; the rest of the market continues normally.

Use when: a specific reserve's oracle is misbehaving and you want to halt that reserve while replacing the oracle config.

### Reserve-level emergency mode

`emergency_mode: 1` on the reserve. Stricter than `blockPriceUsage`. Halts the reserve at the program level — operations targeting the reserve revert.

### Pause price-triggered liquidations

`price_triggered_liquidation_disabled: 1` on the market. Blocks every liquidation triggered by oracle price movement, including obligation orders that fire on price conditions. Standard liquidations driven by manual triggers (e.g., obligation orders with `Always` condition) still work.

Use when: an oracle is misbehaving market-wide and you want to prevent cascading liquidations on bad prices.

### Market-wide emergency mode

`emergency_mode: 1` on the market. The strongest reversible switch. Restricts most operations market-wide. Use only when the market needs to be brought to a near-complete stop.

Pair with `emergency_council` to delegate emergency-only powers to a fast multisig.

### Permanent freeze: immutable

`immutable: 1` on the market. Once flipped to `1`, the program rejects every owner-initiated config change. Existing positions continue with current parameters; no flag, threshold, cap, or oracle can be modified by anyone.

Use when:

* The market is being archived
* You're providing a trust-minimization commitment to depositors
* A migration to a new market is complete and you want the old market frozen

> [!WARNING]
>
> `immutable: 1` is irreversible. The program has no path to undo it. Confirm twice on a multisig review before signing.

## Socialize loss (last-resort)

If a position becomes truly unrecoverable — debt exceeds collateral, even the bad-debt liquidation bonus can't make liquidators whole — the curator can call `socialize-loss` to spread the loss across the affected reserve's depositors.

The mechanics:

1. The `lending_market_owner` (or `emergency_council` if configured) calls `socialize-loss` for the affected obligation.
2. The unrecoverable debt is written off.
3. Each depositor's claim on the reserve is reduced proportionally to their share of total deposits.

This is depositor-affecting and irreversible. Use only when:

* The position is genuinely unrecoverable
* Standard liquidation paths (including bad-debt liquidation) have been exhausted
* The reserve has a credible plan for handling the impact (curator-funded backfill, treasury, etc.)

## Configuring the emergency council

`emergency_council: <MULTISIG_PUBKEY>` on the market. Setting an `emergency_council` distinct from the main `lending_market_owner` lets you keep ordinary operations on a slow timelocked multisig while keeping incident response on a fast one.

Recommended setup:

| Authority | Multisig | Timelock | Powers |
| - | - | - | - |
| `lending_market_owner` | 3-of-5 multisig | 12 hours | Standard config updates, parameter changes |
| `emergency_council` | 2-of-3 multisig | 0 or 1 hour | Emergency mode, socialize-loss, fast pauses |

## Operational playbook

A rough decision tree for incident response:

| Situation | First action |
| - | - |
| Suspicious borrow activity | `borrow_disabled: 1` |
| One reserve's oracle looks wrong | That reserve's `blockPriceUsage: 1` |
| Multiple oracles misbehaving | `price_triggered_liquidation_disabled: 1` |
| Smart-contract level issue or partner-asset issue | `emergency_mode: 1` (market-wide) |
| Position underwater past liquidator economics | First: confirm liquidators have tried. Then: `socialize-loss` |
| Winding down a deprecated market | Eventually: `immutable: 1` |

Always fix the root cause before re-enabling. Pausing then immediately unpausing without addressing the issue achieves nothing.

## Reference

* [Market config reference](https://kamino.com/docs/curators/markets/market-config-reference.md) — every emergency-related field
* [Reserve config reference](https://kamino.com/docs/curators/markets/reserve-parameters.md) — `emergency_mode`, `blockPriceUsage`
* [Updating reserves](https://kamino.com/docs/curators/markets/reserve-management.md) — the standard reserve update flow
* [Liquidations](https://kamino.com/docs/curators/markets/liquidations.md) — bad debt and liquidator economics


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
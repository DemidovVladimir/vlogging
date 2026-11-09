> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Reserve Configuration

> Anatomy of a fixed-rate reserve and how to create one

A fixed-rate reserve uses the same primitives as a floating reserve plus four config fields that pin the rate and impose a term. This page covers what those fields mean and the workflow for creating a reserve.

## What pins a fixed-rate reserve

| Field | Type | Meaning |
| - | - | - |
| `borrow_rate_curve` | piecewise-linear curve | For a fixed-rate reserve, configured as a **flat curve** at the target rate. Borrowers pay this rate regardless of utilization. |
| `host_fixed_interest_rate_bps` | u16 | Optional **additional** spread layered on top of the curve, charged to the borrower and accruing 100% to the protocol (not lenders). Default `0`. |
| `debt_term_seconds` | u64 | Per-borrow term. The borrower's loan matures at `last_borrowed_at_timestamp + debt_term_seconds`. `0` = open-term (the reserve behaves as floating). |
| `debt_maturity_timestamp` | u64 | Reserve-wide sunset timestamp. After this, no new borrows are accepted and existing borrows become liquidatable. `0` = no sunset. |
| `early_repay_remaining_interest_pct` | u8 (0–100) | Penalty for repaying inside the first term. Penalty = projected interest for the remaining term × this percentage. Accrues to protocol fees on the debt reserve. |

`debt_term_seconds` and `debt_maturity_timestamp` are independent. Set neither (effectively a floating reserve), one, or both. Use `debt_term_seconds` to express *every borrow gets a 3-month clock starting at borrow time*. Use `debt_maturity_timestamp` to express *this whole reserve sunsets on January 1*. The two compose: a reserve with both constraints requires every borrow to fit inside the remaining time until reserve maturity.

> [!NOTE]
>
> **The borrower's effective rate is the `borrow_rate_curve` value at current utilization plus `host_fixed_interest_rate_bps`.** For most fixed-rate reserves you want a flat `borrow_rate_curve` at the desired rate and `host_fixed_interest_rate_bps = 0`. Set a non-zero `host_fixed_interest_rate_bps` only when you intentionally want a protocol-side spread on top of the lender-facing rate.

## Creating a fixed-rate reserve

A fixed-rate reserve is created the same way as a floating one — the difference is in the config you supply.

**Kamino CLI**

**1. Add the reserve to your market**

```bash theme={null}
yarn kamino-manager add-asset-to-market \
  --market <MARKET_ADDRESS> \
  --token-mint <DEBT_TOKEN_MINT> \
  --mode execute
```

This creates a new reserve account against the specified mint. Multiple reserves for the same mint can coexist in a market — each one is its own independent pool with its own config.

**2. Download the default reserve config**

```bash theme={null}
yarn kamino-manager download-reserve-config \
  --market <MARKET_ADDRESS> \
  --reserve <RESERVE_ADDRESS> \
  --output ./configs/fixed_rate_reserve_config.json \
  --mode inspect
```

**3. Edit the config for fixed-rate behaviour**

In the JSON, set:

* `borrowRateCurve.points` — flat curve at the target rate. Both endpoints set to the same `borrowRateBps`. See pattern below.
* `debtTermSeconds` — term in seconds (e.g. `7776000` for 90 days, `2592000` for 30 days).
* `debtMaturityTimestamp` — only if you want the entire reserve to sunset on a specific date; otherwise leave at `0`.
* `earlyRepayRemainingInterestPct` — typical values are 10–25% (the first-term-only penalty).
* `hostFixedInterestRateBps` — usually `0`. Only set if you want a protocol-side spread.

**Example flat curve at 5.5%:**

```json theme={null}
"borrowRateCurve": {
  "points": [
    { "utilizationRateBps": 0,     "borrowRateBps": 550 },
    { "utilizationRateBps": 10000, "borrowRateBps": 550 }
  ]
}
```

The remaining points in the curve array should be padded to the same final value (the SDK and CLI handle padding automatically when you start from a flat curve).

**4. Set risk parameters**

Standard reserve risk params still apply — set them appropriate to the collateral, not to the term:

* `loanToValuePct`, `liquidationThresholdPct` — the same curve as the floating-rate reserve for the same debt token typically applies. Term doesn't change credit risk; collateral does.
* `minLiquidationBonusBps`, `maxLiquidationBonusBps`, `deleveragingBonusIncreaseBpsPerDay` — these matter especially for fixed-rate because protocol-enforced liquidation (term/maturity breach) ramps the bonus from min to max linearly per day. Set values that produce a meaningful incentive curve for liquidators.

See [Reserve Parameters](https://kamino.com/docs/curators/markets/reserve-parameters.md) for the full parameter reference.

**5. Preview and apply**

```bash theme={null}
yarn kamino-manager update-reserve-config \
  --market <MARKET_ADDRESS> \
  --reserve <RESERVE_ADDRESS> \
  --reserve-config ./configs/fixed_rate_reserve_config.json \
  --mode inspect
```

Then re-run with `--mode execute` (or `--mode multisig` to produce a Squads payload).

> [!WARNING]
>
> Reserve config changes typically have a lock time (\~4 hours) before they take effect on-chain. Plan parameter changes ahead of testing windows; the change won't be live immediately even after the multisig executes.

**SDK**

> [!NOTE]
>
> **Reserve creation and configuration are not available via the TypeScript SDK.** Use the Kamino CLI for these admin operations. The SDK supports reading reserve data and building borrower-facing transactions.

For reading FR-specific reserve fields:

```typescript theme={null}
import { KaminoReserve, Reserve } from '@kamino-finance/klend-sdk';

const reserve = await KaminoReserve.fetch(rpc, reserveAddress);
const kind = reserve.getKind();

if (kind.isFixedRate()) {
  console.log({
    borrowRateBps: kind.borrowRateBps,
    debtTermSeconds: kind.debtTermSeconds.toString(),
    fixedHostRate: reserve.getFixedHostInterestRate().toString(),
  });
}
```

For market-level discovery:

```typescript theme={null}
import { KaminoMarket } from '@kamino-finance/klend-sdk';

const market = await KaminoMarket.load(rpc, marketAddress);

// All reserves for a debt token, split by rate model:
const allUsdcReserves = market.getReservesByMint(usdcMint);
const floatingUsdcReserves = market.getFloatReservesByMint(usdcMint);
const fixedUsdcReserves = market.getFixedReservesByMint(usdcMint);
```

**API**

> [!NOTE]
>
> **Reserve creation and configuration are not available via the REST API.** Use the Kamino CLI. The API supports reading reserve metrics and historical data.

To read raw reserve account data including FR-specific fields:

```bash theme={null}
GET /kamino-market/reserves/account-data
```

Returns base64-encoded reserve accounts. Decode using the SDK's `Reserve` codegen to access `hostFixedInterestRateBps`, `debtTermSeconds`, `debtMaturityTimestamp`, and `earlyRepayRemainingInterestPct`. The standard metrics endpoint `GET /kamino-market/{pubkey}/reserves/metrics` does not currently surface these fields.

## What's next

> **[Market Settings](https://kamino.com/docs/curators/markets/fixed-rates/market-settings.md)**
>
> Enable the market-level features that fixed-rate reserves depend on.

> **[Lifecycle Operations](https://kamino.com/docs/curators/markets/fixed-rates/lifecycle-operations.md)**
>
> Update or sunset an existing fixed-rate reserve.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
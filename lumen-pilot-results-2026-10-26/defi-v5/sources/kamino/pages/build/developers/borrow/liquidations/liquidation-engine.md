> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# The Liquidation Engine

> How Kamino's liquidation engine limits collateral loss for borrowers while maintaining liquidator incentives

> [!NOTE]
>
> Liquidations are a key safeguard in a lending protocol. They protect depositor funds by reducing a borrower's debt before the collateral is no longer enough to cover it.

On Kamino, a position can be liquidated once it crosses its health limit. A liquidator repays part of the borrower's debt and receives collateral worth slightly more than the amount repaid. This difference is the liquidation bonus.

Kamino's liquidation engine is designed to:

* Protect depositors from bad debt
* Reduce unnecessary losses for borrowers
* Reward liquidators for acting when a position becomes risky

***

## How Position Health Is Calculated

> [!NOTE]
>
> Every borrower in a Kamino market has a single on-chain account called an **Obligation**. It holds up to eight collateral deposits and five borrows, and health is calculated across all of them together.

Before checking whether a position can be liquidated, Kamino refreshes the Obligation using the latest oracle prices and accrued interest. It then calculates the total value of the position's collateral and debt.

### Collateral Value

For each deposit, Kamino calculates its current market value and adds it to three running totals:

**deposited\_value**

Total market value of the collateral.

```text theme={null}
deposited_value += market_value
```

**allowed\_borrow\_value**

Maximum debt the collateral can support when opening or increasing a borrow.

```text theme={null}
allowed_borrow_value += market_value × loanToValuePct / 100
```

**unhealthy\_borrow\_value**

Debt limit at which the position becomes eligible for liquidation.

```text theme={null}
unhealthy_borrow_value += market_value × liquidationThresholdPct / 100
```

For example, \$100 of collateral with a 75% LTV can support up to \$75 of borrowing. If its health limit is 80%, the position becomes eligible for liquidation when its risk-adjusted debt reaches \$80.

The difference between the two limits creates a safety buffer. New borrowing stops at 75%, while liquidation begins at 80%.

### Debt Value

For each borrow, Kamino calculates the outstanding debt, including accrued interest, using the latest oracle price. It adds the result to two running totals:

**borrowed\_assets\_market\_value**

The actual value of the outstanding debt.

```text theme={null}
borrowed_assets_market_value += market_value
```

**borrow\_factor\_adjusted\_debt\_value**

The risk-adjusted value used to measure position health and determine when liquidation begins.

```text theme={null}
borrow_factor_adjusted_debt_value += market_value × borrowFactorPct / 100
```

The `borrowFactorPct` is always 100% or higher.

For example, at 150%, every \$1 borrowed counts as \$1.50 when measuring position health. The borrower still owes \$1, but Kamino treats it as \$1.50 of debt when assessing liquidation risk.

### Liquidation Eligibility

Kamino compares two values to determine whether a position can be liquidated.

**Current LTV**

Measures the position's risk-adjusted debt against its total collateral value.

```text theme={null}
Current LTV = borrow_factor_adjusted_debt_value / deposited_value
```

Borrow factors increase the value assigned to riskier debt. Current LTV may therefore be higher than the position's actual debt-to-collateral ratio.

**Health limit**

The maximum Current LTV the position can support before liquidation begins.

```text theme={null}
Health limit = unhealthy_borrow_value / deposited_value
```

Each collateral asset has its own health limit. When a position contains multiple collateral assets, Kamino calculates a blended health limit based on the value of each deposit. The gap between Current LTV and this limit is the position's safety buffer. The wider the gap, the further the position is from liquidation.

A position becomes eligible for liquidation when:

```text theme={null}
Current LTV >= Health limit
```

This is equivalent to:

```text theme={null}
borrow_factor_adjusted_debt_value >= unhealthy_borrow_value
```

### Actual LTV and the Bonus Cap

Actual LTV compares the amount owed with the position's total collateral value, without applying borrow factors.

```text theme={null}
Actual LTV = borrowed_assets_market_value / deposited_value
```

The two debt values answer different questions. Risk-adjusted debt determines **when** liquidation begins, allowing Kamino to account for the risk of the borrowed asset and liquidate vulnerable positions before they approach insolvency.

Actual debt determines **how much bonus can safely be paid**, because the bonus is paid from collateral and cannot exceed the collateral value remaining above the position's actual debt. This prevents the liquidation itself from pushing the position into bad debt.

## Liquidation Rounds

Once a position crosses its health limit, Kamino does not liquidate the entire debt at once. The `liquidationMaxDebtCloseFactorPct` parameter caps each liquidation round to a percentage of the position's outstanding debt. If the position remains unhealthy, another liquidation round can follow.

This limits how much collateral can be seized in a single transaction, helping mildly unhealthy positions return to health without unnecessary collateral loss. The cap increases to 100% only when a position approaches insolvency.

> **liquidationMaxDebtCloseFactorPct**
>
> Sets the maximum share of outstanding debt that can be repaid in one liquidation round. The value varies by market.

> **insolvencyRiskUnhealthyLtvPct**
>
> When LTV exceeds 95%, the close factor jumps to 100%. The position is close enough to bad debt that full liquidation in a single transaction is necessary.

> [!NOTE]
>
> The close factor is configured per market and applied to each obligation. Query `GET /kamino-market/{marketPubkey}/users/{userPubkey}/obligations` to see the effective `closeFactor` for an obligation.

### A Measured Path Back to Health

Consider a position with \$10,000 in collateral and \$8,100 in risk-adjusted debt. With an 80% health limit, liquidation begins at \$8,000. The position is therefore only \$100 beyond the threshold, yet a conventional 50% close factor would allow a liquidator to repay \$4,050 and seize approximately \$4,250 in collateral, including the liquidation bonus. A minor shortfall could result in the loss of a substantial share of the borrower's position.

Kamino's close factor takes a more measured approach. The first liquidation round is limited to a fraction of the debt, with a proportionate amount of collateral seized. This is often enough to return a mildly unhealthy position to safety without removing significantly more collateral than the correction requires.

For more severe positions, the close factor does not prevent liquidation; it divides the process into rounds. If the position remains unhealthy after the first repayment, another round can follow. Debt and collateral are reduced progressively until the position recovers or is fully resolved.

This approach favors borrower protection over single-transaction efficiency. Some positions may require several liquidations, but the smaller rounds mean collateral loss is more proportionate and the market has more time to absorb the liquidated assets.

### Edge Cases: Large Liquidations and Dust Positions

A single transaction clearing too much value can distort the market or be influenced by transaction ordering. A position too small to liquidate profitably can sit in the protocol indefinitely.

> **maxLiquidatableDebtMarketValueAtOnce**
>
> No single liquidation can exceed \$500,000 in value, limiting market impact from large forced sales.

> **minFullLiquidationValueThreshold**
>
> Below \$2 in debt, the close factor is bypassed and the full borrow must be cleared.

### Liquidation Priority

| Parameter | Priority rule |
| - | - |
| `liquidationThresholdPct` | The deposit with the lowest liquidation threshold is seized first. Removing the weakest collateral improves the weighted threshold of the remaining position. |
| `borrowFactorPct` | The borrow with the highest borrow factor is repaid first. Reducing the most heavily risk-adjusted debt produces the largest improvement in position health. |
| `minValueSkipLiquidationLtvChecks` | Below this collateral value, priority checks are skipped so small liquidations remain economical. |

Kamino prioritizes the collateral and debt that contribute most to liquidation risk. Removing collateral with the lowest liquidation threshold can improve the weighted threshold of the remaining position, while repaying debt with the highest borrow factor produces the largest reduction in risk-adjusted LTV.

The Obligation stores these values as `lowest_reserve_deposit_liquidation_ltv` and `highest_borrow_factor_pct`, allowing the rules to be enforced efficiently onchain. Minimum value checks keep these constraints from making small liquidations uneconomical.

Reserves with `loanToValuePct` set to zero cannot be seized. These reserves are deposit-only and are not intended to support borrowing.

### Dynamic Liquidation Bonus

Liquidators repay debt using their own tokens and receive collateral worth more than the amount repaid. Unlike a static bonus that pays the same percentage regardless of severity, Kamino's bonus scales with how far a position has breached its threshold. Positions closer to insolvency offer a larger reward, directing liquidator attention to the debt that poses the greatest risk to the protocol.

Each reserve configures three bonus parameters:

| Parameter | Description |
| - | - |
| `minLiquidationBonusBps` | Floor bonus. The minimum reward, even for a position barely past its threshold. |
| `maxLiquidationBonusBps` | Ceiling bonus. The maximum reward regardless of severity. |
| `badDebtLiquidationBonusBps` | Near-insolvency bonus. Applied when LTV reaches 99% or higher. |

### How the Bonus Is Calculated

The bonus is calculated in three operations.

**1. Floor: guarantee a minimum reward**

The bonus starts as the greater of the configured floor or how far the position has crossed its LTV limit. This ensures even a barely-unhealthy position offers enough incentive for a liquidator to act.

```text theme={null}
bonus = max(minLiquidationBonusBps, loanToValue() - loanToValuePct)
```

**2. Cap: limit the maximum reward**

The bonus is capped by the reserve's configured maximum. For elevation group positions, `elevationGroup.maxLiquidationBonusBps` applies as an additional ceiling.

```text theme={null}
bonus = min(bonus, maxLiquidationBonusBps)
```

**3. Solvency cap: prevent the liquidation from creating bad debt**

The bonus cannot exceed the gap between actual debt and collateral value. If a position's actual LTV is 98%, only 2% of collateral headroom remains, so the bonus is capped at 2% regardless of what the reserve allows. This guarantees the liquidation itself never pushes the position closer to insolvency.

```text theme={null}
bonus = min(bonus, 1.0 - noBfLoanToValue())
```

### Keeping the Bonus Within Collateral Limits

The bonus is paid from collateral. If the bonus exceeded the remaining collateral headroom, a liquidation could remove more collateral value than the debt it repays and leave the position worse off.

Consider a position at 98% LTV with a reserve that normally permits a 10% bonus. Only 2% of collateral value remains above the debt, so the solvency cap overrides the reserve config and forces the bonus down to 2%. Without this cap, the liquidator would seize more collateral than the debt they repaid, pushing the position into bad debt.

The solvency cap uses LTV because a borrow factor is a risk adjustment rather than an actual liability. Real collateral headroom is determined by actual debt.

### Near-Insolvency Behavior

When LTV reaches 99% or more, the engine enters a special liquidation regime:

* The close factor increases to 100%, allowing the full position to be cleared.
* The bonus switches to `badDebtLiquidationBonusBps`, typically around 1%.
* The solvency cap continues to apply.

At 99.5% LTV, for example, the maximum possible bonus is 0.5%. The available incentive approaches zero as the position moves closer to actual insolvency, which makes early execution increasingly important.

If LTV exceeds 100%, the position has entered bad debt. The protocol's final recovery mechanism is `socialize_loss`, which distributes the shortfall across depositors in the affected reserve. This mechanism has never been triggered on Kamino.

### Protocol Fee

A reserve can allocate part of the liquidation bonus to the protocol through `protocolLiquidationFeePct`:

```text theme={null}
protocol_fee = ceil(bonus_amount * protocolLiquidationFeePct / 100)
```

The fee is deducted from the bonus rather than added to the collateral removed from the position.

If the liquidation bonus is \$100 and the protocol fee is 50%, the protocol receives \$50 and the liquidator receives \$50. The total bonus charged to the position remains \$100.

Some markets set the protocol fee to zero during volatile conditions so the full bonus remains available to liquidators.

***

## Summary

Kamino's liquidation engine reflects a deliberate balance between borrower protection, liquidator incentives, and protocol solvency.

**1. Borrower protection over liquidator convenience**

The close factor limits how much debt can be repaid in a single liquidation round. Mildly unhealthy positions can therefore return to health without surrendering a disproportionate share of their collateral. At the same time, the dynamic bonus offers only a modest reward near the health limit, where the risk is still limited.

**2. Safety constraints over liquidator flexibility**

The solvency cap prevents the liquidation bonus from pushing a position further toward insolvency. Collateral and debt priority rules are also enforced by the program rather than left to liquidator discretion. These constraints narrow the available liquidation paths while preserving the protocol's safety conditions.

**3. Incentives that rise with risk**

The dynamic bonus increases as a position deteriorates. Positions approaching insolvency become more profitable to liquidate, directing capital and attention toward the debt that presents the greatest risk without requiring centralized coordination.

**4. Progressive liquidation over a single forced sale**

Kamino resolves unhealthy positions through smaller liquidation rounds rather than one large intervention. A mildly unhealthy position may recover after a single round, while a more severe position can be reduced progressively. This keeps each correction more proportionate and limits the market impact of the collateral sold.

***

## Liquidation Parameter Reference

Fields governing liquidation across the three on-chain data structures.

### LendingMarket

**TypeScript**

```typescript theme={null}
interface LendingMarket {
  liquidationMaxDebtCloseFactorPct: number;           // e.g. 10
  insolvencyRiskUnhealthyLtvPct: number;              // default 95
  maxLiquidatableDebtMarketValueAtOnce: BN;           // default 500,000
  minFullLiquidationValueThreshold: BN;               // default 2
  minValueSkipLiquidationLtvChecks: BN;
  minValueSkipLiquidationBfChecks: BN;
  priceTriggeredLiquidationDisabled: number;           // default 0
  autodeleverageEnabled: number;
  individualAutodeleverageMarginCallPeriodSecs: BN;
  matureReserveDebtLiquidationEnabled: number;
  obligationBorrowDebtTermLiquidationEnabled: number;
  obligationOrderExecutionEnabled: number;
}
```

**Rust**

```rust theme={null}
pub struct LendingMarket {
    pub liquidation_max_debt_close_factor_pct: u8,           // e.g. 10
    pub insolvency_risk_unhealthy_ltv_pct: u8,               // default 95
    pub max_liquidatable_debt_market_value_at_once: u64,     // default 500,000
    pub min_full_liquidation_value_threshold: u64,            // default 2
    pub min_value_skip_liquidation_ltv_checks: u64,
    pub min_value_skip_liquidation_bf_checks: u64,
    pub price_triggered_liquidation_disabled: u8,             // default 0
    pub autodeleverage_enabled: u8,
    pub individual_autodeleverage_margin_call_period_secs: u64,
    pub mature_reserve_debt_liquidation_enabled: u8,
    pub obligation_borrow_debt_term_liquidation_enabled: u8,
    pub obligation_order_execution_enabled: u8,
}
```

**Field descriptions**

| Field | Description |
| - | - |
| `liquidationMaxDebtCloseFactorPct` | Maximum percentage of total debt repayable in one liquidation |
| `insolvencyRiskUnhealthyLtvPct` | LTV above which the close factor becomes 100% |
| `maxLiquidatableDebtMarketValueAtOnce` | Maximum USD value liquidated by one instruction |
| `minFullLiquidationValueThreshold` | USD value below which full liquidation is required |
| `minValueSkipLiquidationLtvChecks` | Collateral value below which LTV priority checks are skipped |
| `minValueSkipLiquidationBfChecks` | Borrow value below which borrow factor priority checks are skipped |
| `priceTriggeredLiquidationDisabled` | Disables price-triggered liquidations |
| `autodeleverageEnabled` | Enables auto-deleverage at the market level |
| `individualAutodeleverageMarginCallPeriodSecs` | Grace period for individual auto-deleverage |
| `matureReserveDebtLiquidationEnabled` | Enables liquidation of mature fixed-term debt |
| `obligationBorrowDebtTermLiquidationEnabled` | Enables liquidation after a borrow term expires |
| `obligationOrderExecutionEnabled` | Enables stop-loss and take-profit execution |

### ReserveConfig

**TypeScript**

```typescript theme={null}
interface ReserveConfig {
  loanToValuePct: number;
  liquidationThresholdPct: number;
  minLiquidationBonusBps: number;
  maxLiquidationBonusBps: number;
  badDebtLiquidationBonusBps: number;
  protocolLiquidationFeePct: number;
  borrowFactorPct: BN;
  autodeleverageEnabled: number;
  minDeleveragingBonusBps: number;
  deleveragingMarginCallPeriodSecs: BN;
  deleveragingThresholdDecreaseBpsPerDay: BN;
  deleveragingBonusIncreaseBpsPerDay: BN;
  debtMaturityTimestamp: BN;
  debtTermSeconds: BN;
}
```

**Rust**

```rust theme={null}
pub struct ReserveConfig {
    pub loan_to_value_pct: u8,
    pub liquidation_threshold_pct: u8,
    pub min_liquidation_bonus_bps: u16,
    pub max_liquidation_bonus_bps: u16,
    pub bad_debt_liquidation_bonus_bps: u16,
    pub protocol_liquidation_fee_pct: u8,
    pub borrow_factor_pct: u64,
    pub autodeleverage_enabled: u8,
    pub min_deleveraging_bonus_bps: u16,
    pub deleveraging_margin_call_period_secs: u64,
    pub deleveraging_threshold_decrease_bps_per_day: u64,
    pub deleveraging_bonus_increase_bps_per_day: u64,
    pub debt_maturity_timestamp: u64,
    pub debt_term_seconds: u64,
}
```

**Field descriptions**

| Field | Description |
| - | - |
| `loanToValuePct` | Maximum LTV for new borrows; zero disables use as borrowable collateral |
| `liquidationThresholdPct` | LTV at which an obligation becomes liquidatable |
| `minLiquidationBonusBps` | Minimum liquidator bonus in basis points |
| `maxLiquidationBonusBps` | Maximum liquidator bonus in basis points |
| `badDebtLiquidationBonusBps` | Bonus applied near or at bad debt |
| `protocolLiquidationFeePct` | Protocol share of the bonus, from 0 to 100 |
| `borrowFactorPct` | Risk multiplier applied to borrows, minimum 100 |
| `autodeleverageEnabled` | Allows the reserve to participate in market-wide auto-deleverage |
| `minDeleveragingBonusBps` | Starting bonus for deleverage liquidations |
| `deleveragingMarginCallPeriodSecs` | Grace period before market-wide deleveraging |
| `deleveragingThresholdDecreaseBpsPerDay` | Daily reduction in liquidation threshold during deleveraging |
| `deleveragingBonusIncreaseBpsPerDay` | Daily increase in deleveraging bonus |
| `debtMaturityTimestamp` | Time at which all borrows from the reserve become liquidatable |
| `debtTermSeconds` | Per-borrow term after which the debt becomes liquidatable |

### ElevationGroup

**TypeScript**

```typescript theme={null}
interface ElevationGroup {
  ltvPct: number;
  liquidationThresholdPct: number;
  maxLiquidationBonusBps: number;
  debtReserve: Address;
  maxReservesAsCollateral: number;
}
```

**Rust**

```rust theme={null}
pub struct ElevationGroup {
    pub ltv_pct: u8,
    pub liquidation_threshold_pct: u8,
    pub max_liquidation_bonus_bps: u16,
    pub debt_reserve: Pubkey,
    pub max_reserves_as_collateral: u8,
}
```

**Field descriptions**

| Field | Description |
| - | - |
| `ltvPct` | Overrides reserve `loanToValuePct` for obligations in the group |
| `liquidationThresholdPct` | Overrides reserve `liquidationThresholdPct` |
| `maxLiquidationBonusBps` | Maximum liquidation bonus for obligations in the group |
| `debtReserve` | Single debt reserve permitted in the group |
| `maxReservesAsCollateral` | Maximum number of collateral reserves permitted |


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
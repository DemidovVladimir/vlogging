> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Auto-Deleverage

> Kamino's novel mechanism for orderly unwinding of risky positions before bad debt materializes

Lenders are the most important participants in the Kamino Lend protocol. Every aspect of the risk engine is designed to ensure lenders get their tokens back. Auto-deleveraging is a protocol-level mechanism — introduced by Kamino Lend contributors — that can facilitate an orderly, protocol-wide unwinding of any asset whose continued presence is deemed to pose a risk to lenders according to the risk framework.

## Why Auto-Deleverage Exists

Auto-deleverage addresses two distinct categories of risk to lenders. The first is positions that cannot be safely liquidated through normal channels. The second is assets whose continued presence in the protocol creates ongoing risk to lenders, independent of any specific liquidation event. Both situations can lead to bad debt if left unaddressed, so the protocol needs a defined mechanism to handle them.

### Liquidity Collapse

Consider a scenario where an asset listed as collateral on Kamino experiences a sudden collapse in market liquidity. There are \$50M of loans backed by this collateral, but the market can only absorb \$5M of sell pressure without catastrophic price impact. If those loans become liquidatable, liquidators cannot execute profitably — the price impact of selling the collateral exceeds the liquidation bonus. The result: bad debt, socialized among lenders.

Auto-deleverage addresses this by facilitating an orderly unwinding of the asset *before* bad debt materializes. The protocol proactively reduces exposure to the risky asset while market conditions still allow liquidations to execute cleanly, well ahead of the point at which liquidator failure would force losses onto lenders.

This category was the original motivation, in response to historical DeFi incidents:

* **Aave CRV incident:** A whale accumulated a massive CRV-collateralized position. When CRV liquidity dried up, the position could not be liquidated without cascading the price further. The protocol eventually incurred bad debt.
* **Solend whale incident:** A single large position threatened protocol solvency due to insufficient market liquidity to absorb a potential liquidation.

In both cases, a pre-specified protocol mechanism with clear rules and timelines would have allowed for orderly action under crisis conditions.

### Asset Risk Deterioration

Auto-deleverage also gives Kamino a defined way to wind down exposure to assets whose risk profile has materially deteriorated. This covers situations such as a token whose underlying contracts have been compromised, a stablecoin that loses its backing, an asset that becomes vulnerable to oracle manipulation, or a token whose issuer has introduced changes that make continued listing imprudent.

In these cases the protocol may not face an immediate liquidity shortfall, but ongoing exposure still creates real risk to lenders. The same auto-deleverage mechanism applies, including the 72-hour margin call window for borrowers to act on their own terms before any forced action begins.

Auto-deleverage serves a single goal in either category: keeping the protocol solvent and ensuring lenders get their tokens back. Every design choice in the mechanism flows from that goal — the 72-hour grace period with no penalty, the LTV-based eligibility ordering, and the penalty cap at the position's lowest liquidation penalty all exist to make the unwinding orderly and minimally disruptive for borrowers.

## Scope of Authority

> [!NOTE]
>
> Kamino reserves the right to initiate auto-deleverage against any asset whose continued presence in the protocol is judged to pose a material risk to lenders or to overall protocol solvency. This authority applies regardless of the source of the risk, including market liquidity, asset quality, oracle integrity, smart contract integrity, regulatory exposure, and any other factor identified by the Risk Council or the [KRAF dashboard](https://kamino.com/docs/risk/kraf-dashboard.md).

The 72-hour margin call window described below is the default timeline for any deleverage event, and the penalty schedule is calibrated to make voluntary action during that window the lowest-cost path for borrowers. The Risk Council retains the discretion to compress or waive this window where prompt action is required to address excessive risk to lenders — see [The 72-Hour Margin Call](#the-72-hour-margin-call) below for further detail.

## How It Works

### Triggering

Auto-deleverage is triggered by the Risk Council through a multisig vote. When the [KRAF dashboard](https://kamino.com/docs/risk/kraf-dashboard.md) indicates that a cap change is prudent for a specific asset — due to liquidity deterioration, volatility spikes, or other risk signals — the Risk Council can initiate the deleverage process.

The mechanism can also be automated in the future by taking into account various on-chain signals within the protocol.

### The 72-Hour Margin Call

Once the multisig vote passes, all affected users are notified of the deleverage event and given a **72-hour margin call period** to take action. During this window:

* No penalty is applied
* Users can voluntarily reduce their exposure (repay debt, withdraw collateral, restructure positions)
* If enough borrowers act voluntarily and bring exposure below the new caps, the process ends without any forced deleveraging

This margin call period is a critical design choice: it gives borrowers the opportunity to manage their own risk first, before the protocol intervenes.

> [!WARNING]
>
> The 72-hour window is the default timeline for any deleverage event. The Risk Council retains the authority to compress or waive this window when conditions warrant prompt action against excessive risk to lenders. This covers situations such as the removal of assets whose continued listing has become unsafe (for example, assets that have been deprecated or whose risk profile has materially shifted), responses to fast-moving threats to solvency, and any condition where the standard notice period would itself amplify harm or delay necessary risk mitigation.

### What Happens After the Margin Call

A new, reduced cap is set for the target asset. The difference between the current amount and the new cap is the amount that will be auto-deleveraged.

Users subject to deleveraging see a proportional reduction in the target asset, along with corresponding tokens in their position. Deleveraging generally results in a healthier (lower) LTV ratio for the affected position.

**Lenders are never affected by auto-deleveraging — only borrowers.**

## Collateral Deleverage

Collateral deleveraging is triggered when there is too much of an asset backing loans as collateral than can be successfully liquidated. The market liquidity for the collateral token has deteriorated to the point where liquidation would incur losses.

**Example:** Token A deposit caps are lowered from \$100M to \$80M. 20% of Token A collateral must leave the system. All users with Token A supplied as collateral are notified. If a user is deleveraged:

1. Some or all of their Token A collateral is sold on the market
2. The proceeds repay their debt proportionally
3. A deleverage penalty is paid to the liquidator who executes the deleverage

Supply deleverage for an asset often coincides with borrow deleverage on the same asset, since the triggers — typically an abrupt loss of market liquidity — affect both supply and borrow viability.

## Debt Deleverage

Debt deleveraging is the reverse scenario. If there is too much debt in a specific token and prices were to rise, liquidators would need to buy the debt token off the market to close positions — but if the market buy would incur slippage exceeding the debt amount, liquidation is unviable.

**Example:** Token B borrow caps are lowered from \$100M to \$80M. 20% of Token B debt must leave the system. When a user is deleveraged:

1. A portion of their collateral is sold
2. The proceeds are used to repay their Token B debt
3. This continues until the total Token B debt across the protocol reaches the new cap

The penalty structure is designed to incentivize borrowers to take early action — ideally during the 72-hour margin call period when no penalty applies.

## Deleverage Penalty

Deleveraged loans incur a minimum liquidation penalty of **50 basis points (0.5%)**. The penalty is calculated as a percentage of the deleverage amount.

**Example:** If the penalty is 0.5% and the deleverage amount is 20% of the user's position:

```
Penalty impact = 0.2 × 0.005 = 0.001 = 0.1%
```

Instead of losing exactly 20% of their collateral, the user loses 20.1%.

### Penalty Escalation

The penalty continually increases until either:

* The **maximum penalty threshold** is reached, or
* The **target asset deleverage cap** is achieved (all excess exposure has been unwound)

The rate of increase is a function of the user's LTV and the time elapsed since deleveraging was initiated:

```
penalty = min_penalty + (current_ltv × days_since_initiation)
```

**Worked example:**

| Parameter | Value |
| - | - |
| Minimum penalty | 50 bps (0.5%) |
| Current LTV | 80% |
| Days since initiation | 3.4 days |

```
penalty = 0.005 + (0.80 × 3.4) = 2.725%
```

### Penalty Cap

The maximum penalty is capped at the **lowest liquidation penalty** of the assets in the user's position.

For example, if a position contains SOL, USDC, and WETH with liquidation penalties of 6%, 8%, and 10% respectively, the deleverage penalty is capped at 6%. This ensures the penalty never exceeds what a standard liquidation would cost.

## Who Gets Deleveraged?

Once auto-deleveraging begins, a position is eligible for deleverage if:

1. It **contains the target asset**, AND
2. It has a **current LTV that exceeds the deleverage liquidation LTV**

When deleveraging begins, the target asset's liquidation LTV is adopted as the initial `deleverage_liquidation_LTV`. Deleveraging starts with the highest-LTV positions and works downward.

### LTV Threshold Decrease

Over time, the `deleverage_liquidation_LTV` decreases automatically, expanding the pool of eligible positions:

```
deleverage_ltv = liquidation_ltv − (0.0001 × slots_since_initiation / slots_per_bps)
```

**Example** (at 1 bps per hour = 7,200 slots per bps):

```
deleverage_ltv = 0.80 − (0.0001 × 345,600 / 7,200) = 79.52%
```

This declining threshold creates urgency: users whose LTV is currently safe will eventually become eligible for deleveraging if they do not act. The mechanism encourages borrowers to voluntarily reduce their LTV — ideally during the 72-hour margin call — rather than waiting to be deleveraged at an escalating penalty.

## Key Design Properties

* **Lenders are never affected.** Only borrower positions are deleveraged.
* **Orderly, not chaotic.** Unlike a mass liquidation event, auto-deleverage proceeds methodically from highest-risk positions to lowest, with escalating incentives for voluntary action.
* **Not routine.** Auto-deleverage is a last-resort mechanism for situations where standard liquidation cannot function. It has not been activated to date — Kamino's [track record](https://kamino.com/docs/risk.md#battle-tested-track-record) shows \$0 bad debt across all market events without needing this mechanism.
* **Preventive, not reactive.** The mechanism intervenes before bad debt materializes, not after. The goal is to never reach the point where liquidation failure occurs.

> [!NOTE]
>
> Some of the parameters referenced above, such as the minimum liquidation penalty and the margin call duration, are indicative defaults and are configurable per market. Curators and the Risk Council can set different values where the market's risk profile or asset composition calls for it.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Liquidations

> How Kamino Borrow monitors position health and executes liquidations

> [!WARNING]
>
> Once a position crosses Liquidation LTV, liquidation can occur at any time. There is no grace period — liquidation bots operate continuously.

## What triggers liquidation

A position becomes eligible for liquidation when Current LTV exceeds Liquidation LTV. [LTV](https://kamino.com/docs/products/borrow/concepts.md#ltv--the-three-values) is calculated using risk-adjusted debt values:

```
Current LTV = risk-adjusted debt value / collateral value
```

Risk-adjustment applies [Borrow Factors](https://kamino.com/docs/products/borrow/concepts.md#borrow-factors) to each debt asset, which can compress the effective safety margin for positions holding higher-risk borrowed assets. See [Borrowing](https://kamino.com/docs/products/borrow/borrowing.md) for how Borrow Factors work. Positions do not liquidate the moment they are opened — they only become eligible when asset price movements push the LTV above the liquidation threshold after origination.

## Partial liquidations

Kamino does not liquidate entire positions in a single event. Each liquidation can close a maximum of **20%** of the position's debt. If the position remains above Liquidation LTV after the first round, another round can be applied. This iterative structure protects borrowers who briefly breach the threshold: a small overshoot results in a proportionally small liquidation, not full position closure. A borrower who adds collateral or repays debt between rounds can stop the process entirely.

If a position's LTV exceeds the market's insolvency-risk threshold (typically **95%**), the close factor increases to 100%, allowing full liquidation in a single event. This prevents positions from sliding into bad debt (where debt exceeds collateral value) when partial liquidations would be too slow.

## Dynamic liquidation bonus

Liquidators are compensated with a bonus paid in collateral. The bonus is **dynamic**: it scales with how far the position's LTV has breached the Liquidation LTV threshold.

The bonus moves through four phases as a position deteriorates:

| LTV region | Bonus behavior |
| - | - |
| At Liquidation LTV | Starts at the **minimum bonus** configured for the reserve |
| Above Liquidation LTV + min bonus | Scales upward: bonus equals the distance between current LTV and Liquidation LTV |
| At Liquidation LTV + max bonus | Capped at the **maximum bonus** configured for the reserve |
| Approaching 100% LTV | **Solvency cap**: bonus decreases so that it never exceeds the remaining distance to 100% LTV, because a bonus larger than that gap would worsen the position's health |

### Worked example

For a reserve with a 2% minimum bonus, 8% maximum bonus, and 75% Liquidation LTV:

| Current LTV | Bonus | Reason |
| - | - | - |
| 75% | 2% | At liquidation threshold, min bonus applies |
| 77% | 2% | Distance (2%) equals min, floor still holds |
| 80% | 5% | Distance (5%) exceeds min, bonus scales with breach |
| 83% | 8% | Distance (8%) hits max cap |
| 88% | 8% | Held at max |
| 92% | 8% | Solvency cap begins: only 8% remains to 100%, bonus equals the cap |
| 96% | 4% | Solvency cap overrides: only 4% remains to 100% |
| 99% | 1% | Near bad debt, bonus minimized to protect solvency |

![Dynamic liquidation bonus curve](https://mintcdn.com/kamino-3d73a151/nSj-oZqZbrFVVVcD/images/products/borrow/dynamic-liquidation-bonus-curve.webp?fit=max\&auto=format\&n=nSj-oZqZbrFVVVcD\&q=85\&s=6a6366b8d22e7f34cb89f1a95e9062a4)

The solvency cap is what prevents liquidations from pushing a position deeper into trouble. A position at 96% LTV cannot absorb an 8% bonus without exceeding 100% LTV, so the protocol forces the bonus down to what the position can sustain.

This structure serves both sides. Borrowers who are promptly liquidated near the threshold lose less collateral (a small bonus). Liquidators facing deeper breaches earn larger bonuses but take on more execution risk. Near insolvency, the protocol prioritizes recovering the position over rewarding the liquidator.

## Who can liquidate

Liquidations on Kamino Borrow are permissionless. Any actor can call the liquidation instruction on an unhealthy position and earn the bonus. In practice, automated bots monitor all open positions continuously and execute the moment a position crosses the liquidation threshold. The minimum bonus is sufficient compensation for immediate action.

## Auto-deleveraging (last resort)

In extreme scenarios where standard liquidations fail to resolve unhealthy positions — such as severe market volatility or insufficient liquidator activity — Kamino has an auto-deleveraging mechanism that can proportionally reduce the largest leveraged positions in the system. This is a last-resort safety measure designed to protect the solvency of the lending pools when normal market incentives are insufficient. It has not been triggered in Kamino's operational history.

## Avoiding liquidation

The primary levers for managing liquidation risk are:

* **Maintain a buffer** — Keep Current LTV well below Liquidation LTV. A tight buffer leaves no margin for collateral price drops or rising debt from accruing interest.
* **Monitor collateral value** — A decline in collateral price directly increases Current LTV, moving the position toward the liquidation threshold without any borrower action.
* **Monitor borrow rates** — Variable rates mean your debt balance grows faster when rates rise. Sustained high utilization in a pool increases debt continuously, compressing your buffer.
* **Add collateral or repay debt** — Either action reduces Current LTV. Repaying debt is typically more capital-efficient when you are close to the threshold.
* **Use Repay with Collateral** — Allows you to deleverage atomically by converting deposited collateral into the debt asset and repaying in a single transaction, without needing to source the repayment token externally. See [Borrowing](https://kamino.com/docs/products/borrow/borrowing.md).


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
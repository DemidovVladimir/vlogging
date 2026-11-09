> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Market Risk Overview

> How token volatility, liquidity, and price dynamics determine whether liquidations can execute profitably

Market risk in a lending protocol comes down to one question: **can liquidators profitably liquidate unhealthy loans when required?**

When a borrower's position becomes unhealthy — their loan-to-value ratio exceeds the liquidation threshold — a liquidator must step in. The liquidator acquires the debt token, provides it to the protocol, receives the collateral token at a small discount (the liquidation bonus), and then sells the collateral on the open market. For this process to work, the collateral must be liquid enough to sell without excessive price impact, and the liquidation must complete before the position deteriorates further.

If liquidators cannot execute profitably — because the collateral is too illiquid, the price is moving too fast, or the price impact of selling exceeds the liquidation bonus — the position becomes bad debt. Bad debt is socialized among lenders in the affected reserve.

Market risk analysis determines how likely this failure mode is for each listed asset.

## The Two Axes of Market Risk

### Asset Volatility

[Volatility](https://kamino.com/docs/risk/market-risk/volatility.md) measures how fast and how far an asset's price can move. High volatility means a position can go from healthy to deeply underwater quickly — potentially faster than liquidators can respond.

Volatility directly determines how much buffer is needed between the Max LTV (the maximum borrowing limit) and the Liquidation LTV (the threshold at which liquidation is triggered). For a volatile asset, the gap must be wider — there needs to be enough room for the collateral to decline in value without the position crossing into bad debt territory before liquidators can execute.

### Asset Liquidity

[Liquidity](https://kamino.com/docs/risk/market-risk/liquidity.md) measures whether the collateral can actually be sold at a reasonable price. An asset might have moderate volatility, but if there is no market depth — if selling \$500K of collateral would cause a 15% price impact — then liquidators cannot execute profitably for large positions.

Liquidity determines the upper bound on position sizes that can be safely liquidated. This directly informs supply caps, borrow caps, and E-Mode caps for each asset.

## The Seven Metrics

Market risk is quantified through seven metrics, each analyzed using hourly price data across short-term, medium-term, and long-term windows. Cryptocurrency markets are highly dynamic — a metric that was acceptable last month may be inadequate today.

| Metric | What It Measures | Where It's Covered |
| - | - | - |
| **Volatility** | How fast and far prices move (Parkinson's measure) | [Volatility Analysis](https://kamino.com/docs/risk/market-risk/volatility.md) |
| **Token Liquidity** | Overall ability to convert large positions to cash | [Liquidity & Price Impact](https://kamino.com/docs/risk/market-risk/liquidity.md) |
| **Trading Volumes** | Market activity and ease of execution | [Liquidity & Price Impact](https://kamino.com/docs/risk/market-risk/liquidity.md) |
| **Price Impact** | Cost of executing swaps at various sizes | [Liquidity & Price Impact](https://kamino.com/docs/risk/market-risk/liquidity.md) |
| **Price Resilience** | Market recovery speed after large trades | [Liquidity & Price Impact](https://kamino.com/docs/risk/market-risk/liquidity.md) |
| **Market Capitalization** | Overall market size and token emission dynamics | [Correlations & Systemic Risk](https://kamino.com/docs/risk/market-risk/correlations.md) |
| **Token Correlation** | Relationship with other listed assets | [Correlations & Systemic Risk](https://kamino.com/docs/risk/market-risk/correlations.md) |

## How Liquidation Works — From a Risk Perspective

Understanding market risk requires understanding the mechanics of liquidation:

1. **Detection:** A liquidator bot monitors all active positions on the protocol. When a position's LTV exceeds the liquidation threshold, it becomes eligible for liquidation.

2. **Execution:** The liquidator submits a transaction that repays some or all of the borrower's debt. In return, the liquidator receives the borrower's collateral at a discount (the liquidation bonus — typically 3-10% depending on the asset).

3. **Collateral sale:** The liquidator sells the received collateral on the open market (typically through DEX aggregators like Jupiter). The profit is the liquidation bonus minus transaction costs and price impact.

4. **Flash loan option:** Liquidators can use flash loans to execute without holding capital — borrow the debt token, liquidate, receive collateral, sell collateral, repay the flash loan, pocket the difference. This makes liquidation capital-efficient and competitive.

The risk failure mode is step 3: if the price impact of selling the collateral exceeds the liquidation bonus, the liquidation is unprofitable. No rational liquidator will execute it. The position continues to deteriorate, and if the collateral value drops below the debt value, bad debt results.

## Dynamic Calibration

Cryptocurrency markets change rapidly. An asset that was highly liquid last quarter may have lost significant market depth. A token that was stable may have entered a volatile regime. Market risk analysis is not a one-time onboarding exercise — it runs continuously.

The Risk Council reviews market risk metrics at regular intervals and after significant market events. When conditions change materially, parameters are adjusted:

* **Volatility spike:** Max LTV may be lowered to create a wider liquidation buffer
* **Liquidity decline:** Supply and borrow caps may be reduced to limit position sizes that would be difficult to liquidate
* **Volume collapse:** Isolation mode may be imposed on assets that previously qualified for cross-margin
* **Correlation shift:** E-Mode caps may be adjusted if the relationship between pegged assets changes

All market risk metrics are available in real-time on the [KRAF Dashboard](https://kamino.com/docs/risk/kraf-dashboard.md), which provides price impact analysis, volatility measurements, and stress testing scenarios for every listed asset.

## How Market Risk Informs Parameters

The market risk assessment directly determines several protocol parameters:

| Parameter | What Market Risk Determines |
| - | - |
| **Max LTV** | Wider volatility → lower Max LTV (more buffer before liquidation) |
| **Liquidation LTV** | The threshold at which liquidation is triggered — must be set high enough that liquidators can execute profitably given the asset's volatility and liquidity |
| **Borrow Factor** | Less liquid / more volatile assets receive higher borrow factors, requiring more collateral per unit of debt |
| **Supply Cap** | Maximum protocol exposure, bounded by how much collateral could be liquidated without excessive price impact |
| **Borrow Cap** | Maximum outstanding debt, bounded by debt token liquidity |
| **E-Mode Cap** | Per-pair limits that account for the specific liquidity and correlation dynamics of each collateral/debt pairing |
| **Liquidation Bonus** | Must exceed expected price impact at the cap-implied maximum position size, otherwise liquidations become unprofitable |

These parameters are interconnected. Changing one often requires adjusting others to maintain a consistent risk posture. The risk framework considers them holistically rather than in isolation.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
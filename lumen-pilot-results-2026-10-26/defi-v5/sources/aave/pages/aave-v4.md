# Aave v4

Aave v4 uses a **Hub & Spoke model** for liquidity management: the Liquidity Hub consolidates protocol-wide liquidity and accounting, while Spokes implement modular borrowing with isolated risk.

> [!NOTE]
> This evolves Aave v3’s market-per-pool design into a unified Hub & Spoke
> model, allowing governance to introduce new features or markets without
> migrating liquidity.

## Liquidity Hubs

The Liquidity Hub (Hub) is the central liquidity source in Aave v4. It maintains oversight of Spokes, granting each a **credit line for borrowing** and a **debit line for supplying**. The Hub enforces **system‑wide accounting** and caps how much liquidity Spokes can draw or add.

- Centralizes liquidity and accounting
- Issues per‑spoke credit/debit limits
- Enforces system‑wide constraints
- Provides emergency stop controls

## Hub Assets

Hub assets are the **ERC‑20 tokens** registered in the Liquidity Hub. They form the shared liquidity that Spokes borrow from and supply to, enabling efficient reuse across Spokes.

## Spokes

Spokes are modules that manage specific supply and borrowing use cases, asset types, or risk profiles. Users interact directly with Spokes, which route liquidity to and from the Hub.

- Local controls (e.g., risk parameters, oracle interactions, emergency stops)
- Independent accounting per spoke
- Modular: add/remove spokes without affecting others

## Reserves

Reserves define how a Hub asset is supplied and borrowed within a specific Spoke. Each reserve has its own **risk settings**—while the Hub controls how much liquidity can flow to and from the reserve through credit and debit lines.

## Interest Rates

Borrow and supply rates are determined by a utilization curve. Utilization measures how much of an asset’s liquidity is currently borrowed, expressed as `borrowed / total liquidity`.

Below an optimal usage ratio, the borrow rate increases gradually; above it, the rate increases more sharply. The supply rate is derived from borrower interest after protocol fees and reflects supply and demand for that asset.

The curve is defined by a base rate, slopes below and above the optimal usage ratio, and the optimal usage ratio itself, configured per hub asset.

**User Risk Premium** represents an additional interest charge applied to a user's borrowing cost based on the quality of their collateral. It is a percentage surcharge on top of the shared borrow rate for that asset, weighted by the collateral needed to cover the debt, and recalculated as the position changes.

## User Positions

A user position is the **combined view** of what a user has supplied and borrowed within a Spoke. Positions are tracked per reserve internally, and surface as an aggregate view of a user’s activity on that Spoke.

- **User Supplies**: the **assets a user deposits** into a Hub through the Spoke. They **accrue interest** over time and expand the Hub’s available liquidity.
- **User Borrows**: the **assets a user draws** from a Hub through the Spoke. They create a **debt balance** that accrues interest until it is **repaid**.

**Health Factor** reflects position solvency and indicates how close a position is to liquidation. Calculated as eligible collateral value / debt value. Must stay above 1 to avoid liquidation. Increases when debt is repaid or collateral value rises. Decreases as interest accrues, collateral value decreases, or new debt is taken.

## Liquidations

Positions become eligible for liquidation when their health factor drops below 1.0. Aave v4 introduces a redesigned liquidation engine that improves capital efficiency and fairness compared to v3.

**Target Health Factor**: Instead of a fixed close factor, liquidators repay only enough debt to restore the position to a **Target Health Factor set at the Spoke level**. This prevents over-liquidation.

**Variable Liquidation Bonus**: The bonus paid to liquidators scales with the position's health factor. Lower health factors offer higher bonuses, creating a Dutch-auction style incentive that prioritizes the riskiest positions.

**Dust Prevention**: If the remaining debt or collateral after liquidation would fall below $1,000 USD, the liquidator must fully clear that position, preventing small leftover balances from accumulating.

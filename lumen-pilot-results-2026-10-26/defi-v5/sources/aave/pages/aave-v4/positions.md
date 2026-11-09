# User Positions

Learn how to manage user positions on Aave v4.

---

A User Position represents the complete financial state of a user within a specific Spoke, tracking **User Supplies** and **User Borrows** alongside key risk metrics such as **Health Factor** and **Risk Premium**.

Unlike v3, where user positions were per-market, v4 positions are per-Spoke, allowing users to manage different strategies and risk profiles independently.

> [!NOTE]
> In the Aave Protocol, a _User Account_—often referred to simply as a _User_—is
> a single Ethereum address that has interacted with the protocol, either as an
> Externally Owned Account (EOA) or a smart contract.

## User Supplies

User Supplies represent assets that a user has deposited into a spoke's Reserve. Each supply position:

- **Accrues yield** automatically through share-based accounting that appreciates over time
- **May be enabled as collateral** (if the reserve supports it) to provide borrowing power based on the asset's **Loan-to-Value (LTV)** ratio
- **Affects the Risk Premium** when enabled as collateral — riskier collateral assets increase the overall risk profile of the position
- **Can be withdrawn** at any time, provided the position's Health Factor remains above 1.0

> [!NOTE]
> The above applies to standard Hub and Spoke behavior. Tailored implementations
> may vary.

## User Borrows

User Borrows represent assets that a user has borrowed from a spoke's Reserve. Each borrow position:

- **Accumulates interest** based on the asset's borrow rate, increasing debt over time
- **Requires collateral backing** according to **liquidation thresholds** specific to each borrowed asset
- **Impacts the Health Factor** as part of the total debt value
- **Can be repaid** partially or fully at any time to reduce debt and free up collateral

> [!NOTE]
> The above applies to standard Hub and Spoke behavior. Tailored implementations
> may vary.

## Health Factor

The **Health Factor** is the core safety metric that determines a user position's liquidation risk. It measures the stability of a user position:

The health factor value determines the position's safety status:

- **Above 1.0**: The position is safe from liquidation
- **Below 1.0**: The position becomes eligible for liquidation — liquidators repay only enough debt to restore the position to a healthy state
- **Changes dynamically** as asset prices fluctuate and interest accrues on both supplies and borrows
- **Can be improved** by supplying more collateral or repaying part of the borrowed amount
- **Determines available actions** — new borrows or collateral withdrawals are blocked if they would reduce the Health Factor below 1.0

**Example:**

If a user supplies $10,000 in ETH as collateral with an 80% Collateral Factor and borrows $6,000 in GHO, the health factor would be 1.333.

## User Risk Premium

User Risk Premium represents the **additional interest charge** applied to borrowing based on the quality of a user’s collateral. It determines how much extra a user pays on top of the base borrow rate for any borrowed asset within a Spoke.

- **Based on Collateral Risk** — a percentage value from 0% (highest quality) to 1000% (maximum risk) that reflects how risky an asset is when used as collateral
- **Weighted by collateral amounts** — calculated using only the collateral needed to cover total debt, starting with the safest assets
- **Updated dynamically** — recalculated when users withdraw, borrow, or through ad-hoc refresh.
- **Lower is better** — users with safer collateral pay lower interest rates

For example, a 0% User Risk Premium means paying only the base rate, while 50% means paying 50% more (7.5% total if base rate is 5%).

## Cross-Spoke Strategies

v4’s modular design enables sophisticated position management across multiple Spokes.

### Spoke Isolation

Each Spoke maintains **independent risk parameters** and liquidation logic. This means:

- Positions in different Spokes do not affect each other’s Health Factors
- A user can hold conservative positions in one Spoke and aggressive positions in another

### Multi-Hub Access

Advanced Spokes can access **multiple Hubs**, enabling strategies such as:

- Collateralizing assets from one Hub to borrow from another
- Accessing different yield opportunities across Hub configurations
- Optimizing liquidity and rates across the entire protocol

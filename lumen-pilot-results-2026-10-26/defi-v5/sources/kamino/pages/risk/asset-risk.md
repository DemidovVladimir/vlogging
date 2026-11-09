> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Assessment Framework

> The 5-dimension asset risk assessment used for token onboarding and ongoing risk review

Before any token can be listed on Kamino — whether as collateral, as a borrowable asset, or both — it undergoes a structured risk assessment across five dimensions. This framework is used at the onboarding stage and applied on an ongoing basis as market conditions evolve.

The purpose is straightforward: determine how much risk each asset introduces to the protocol, and set parameters accordingly.

## The Five Risk Dimensions

Each dimension evaluates a distinct axis of risk. Together, they provide a comprehensive picture of whether an asset can be safely integrated into the lending protocol.

| Dimension | Core Question | Detail |
| - | - | - |
| [Oracle Pricing Risk](https://kamino.com/docs/risk/asset-risk/oracle-pricing.md) | How reliable is the price feed? | Number and quality of oracle sources, uptime, staleness |
| [Smart Contract Risk](https://kamino.com/docs/risk/asset-risk/smart-contract.md) | How robust is the token's underlying code? | Audit history, maturity, battle-testing, bug bounty |
| [Depeg Risk](https://kamino.com/docs/risk/asset-risk/depeg.md) | Could this pegged asset lose its peg? | Reserve backing, smart contract exposure, historical stability |
| [Counterparty Risk](https://kamino.com/docs/risk/asset-risk/counterparty.md) | Who controls this token and how much trust is required? | Governance decentralization, holder concentration, entity track record |
| [Market Risk](https://kamino.com/docs/risk/market-risk) | Can liquidations execute profitably? | Volatility, liquidity, price impact, trading volumes |

## Asset Tiering

The assessment maps directly to how each asset can be used on the protocol. Every token is classified into one of three tiers:

### General Asset

The token passes all five dimensions at acceptable thresholds. It can be used as collateral and borrowed in cross-margin mode, with standard LTV limits. Most major tokens (SOL, USDC, USDT, JitoSOL) fall into this tier.

### Isolated Collateral

The token has elevated risk in one or more dimensions — perhaps limited oracle coverage, a newer smart contract without extensive battle-testing, or thin market liquidity. It can be used as collateral, but only in isolated mode: the user's position with this collateral is ring-fenced from their other positions. This prevents a problem with a high-risk collateral token from cascading into other positions.

### Isolated Debt

The token has elevated borrowing risk — perhaps high volatility, limited liquidity for liquidators, or a new and unproven market. It can be borrowed, but only in isolated mode with strict caps.

## Parameter Derivation

The assessment directly determines two key protocol parameters for each asset:

### Collateral Max LTV

The maximum loan-to-value ratio allowed when using this token as collateral. A token assessed as low-risk across all dimensions might receive a Max LTV of 80–85%. A higher-risk token might receive 50–65%, or be restricted to isolated mode entirely.

Max LTV is calibrated conservatively — it must leave enough margin for the collateral value to decline before reaching the liquidation threshold, accounting for the asset's measured volatility and the time needed for liquidators to execute.

### Borrow Factor

A risk weight applied to the debt side. A Borrow Factor above 1.0 means the protocol treats the debt as riskier than its face value — effectively requiring more collateral to borrow that asset. Volatile or illiquid tokens receive higher Borrow Factors, while stablecoins and well-established tokens receive factors close to 1.0.

## Ongoing Reassessment

Onboarding is not a one-time gate. The framework is applied continuously:

* **Market-driven reassessment:** If an asset's liquidity drops significantly, its volatility spikes, or its oracle coverage narrows, the risk profile changes. Parameters are adjusted accordingly — LTV limits may be lowered, caps may be reduced, or the asset may be moved to isolated mode.
* **Event-driven reassessment:** A smart contract exploit on a listed token's underlying protocol, a governance incident, or a depeg event triggers immediate review and potential parameter changes.
* **Periodic review:** The Risk Council reviews all listed assets periodically, incorporating the latest [KRAF dashboard](https://kamino.com/docs/risk/kraf-dashboard.md) data, monthly risk reports, and market conditions.

The goal is to ensure that the parameters governing each asset always reflect its current risk profile, not its risk profile at the time of onboarding.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
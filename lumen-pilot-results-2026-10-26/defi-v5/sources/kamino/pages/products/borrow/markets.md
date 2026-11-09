> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Markets

> Kamino Borrow's market structure — isolated environments, position modes, and elevation groups

## Market isolation

Each Kamino Borrow [market](https://kamino.com/docs/products/borrow/concepts.md#what-is-a-market) is a self-contained environment with its own accepted collateral assets, borrowable assets, risk parameters, and liquidity. Collateral deposited in one market cannot be used to borrow from another, and the markets do not share liquidity or risk exposure. This isolation limits contagion — a liquidation cascade or parameter change in the JLP Market has no effect on positions in the SOL/BTC Market.

## Available markets

> **SOL/BTC Market**
>
> The primary market supporting Solana's core assets: SOL, wETH, tBTC, USDC, USDT, and liquid staking tokens including JitoSOL, mSOL, and bSOL. The deepest liquidity and the broadest asset selection across all Kamino markets.

> **JLP Market**
>
> Optimised for JLP (Jupiter Liquidity Provider tokens) as collateral. Enables JLP holders to borrow against their LP position without unwinding it.

> **Altcoins Market**
>
> Supports higher-volatility assets with correspondingly tighter risk parameters and lower LTV ratios. Designed for assets that do not qualify for the SOL/BTC Market's parameters.

> **Prime Market**
>
> Institutional-grade market with custom risk configurations. Designed for larger positions and counterparties with specific requirements.

## Cross Mode

Cross Mode is the default position mode. A single Cross Mode position can hold multiple collateral assets and multiple debt assets at the same time. Position health — your [LTV](https://kamino.com/docs/products/borrow/concepts.md#ltv--the-three-values) — is calculated across all assets in the position together, so the combined collateral value is weighed against the combined debt. This cross-collateralization means that strong performance in one asset can offset weakness in another, but it also means that the health of every debt in the position is tied to the performance of all collateral. Cross Mode applies more conservative LTV parameters than Isolated Mode because the risk interactions between multiple assets are more complex.

## Elevation Groups (eMode)

Assets within the same category can be configured as an [elevation group](https://kamino.com/docs/products/borrow/concepts.md#emode--elevation-mode), allowing significantly higher LTV ratios between them. The rationale is correlation: if collateral and debt are closely correlated assets — for example, JitoSOL as collateral and SOL as debt — the two values tend to move together, which substantially reduces the risk that a price move will push the position into liquidation. A JitoSOL/SOL position can therefore safely operate at much higher LTV than a JitoSOL/USDC position. Elevation Groups are the mechanism that powers Kamino's Multiply product, enabling capital-efficient leveraged exposure to correlated asset pairs.

> [!NOTE]
>
> Similar to Isolated Mode, Elevation Groups are only supported in the SOL/BTC Market for select stablecoin and Multiply pairs.

→ See [Concepts](https://kamino.com/docs/products/borrow/concepts.md#emode--elevation-mode) for the full eMode rate and leverage table.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
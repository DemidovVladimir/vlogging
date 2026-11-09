> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Correlations & Systemic Risk

> How token relationships, market capitalization, and systemic exposure are evaluated

Individual asset risk analysis — volatility, liquidity, price impact — treats each token in isolation. But in a lending protocol with dozens of listed assets, the portfolio matters. Correlations between tokens determine whether a market downturn triggers isolated liquidations or a protocol-wide cascade.

## Token Correlation

When Kamino onboards a new token, the risk framework evaluates its relationship with tokens already listed on the protocol. This matters because correlated assets amplify systemic exposure.

### The SOL LST Example

Consider a lending protocol that lists SOL, JitoSOL, mSOL, and bSOL as collateral. Each LST's price is fundamentally tied to SOL — they all represent staked SOL plus accumulated rewards. If SOL drops 20%, all four assets decline simultaneously. The effective collateral exposure to SOL across the protocol is not just the SOL deposits — it is the sum of SOL, JitoSOL, mSOL, and bSOL deposits.

This means:

* **Liquidation demand compounds.** A SOL crash triggers liquidations across all four assets simultaneously, requiring the market to absorb significantly more selling pressure than any single-asset analysis would suggest.
* **Idiosyncratic risks stack.** Each LST introduces its own smart contract risk, depeg risk, and liquidity characteristics — on top of the shared SOL price risk.
* **Liquidity is shared.** Liquidating JitoSOL and mSOL simultaneously competes for the same underlying SOL liquidity. The cumulative price impact may be far worse than liquidating either alone.

### Empirical Validation — February 2026

The [February 2026 stress event](https://kamino.com/docs/risk.md#february-2026-stress-event--case-study) provided real-world data on correlation dynamics:

* **99.6% of liquidations** came from uncorrelated positions (e.g., SOL collateral / USDC debt) — where the collateral and debt prices moved in opposite directions (or debt was stable while collateral dropped).
* **Correlated positions** (e.g., JitoSOL collateral / SOL debt) were barely affected — because both collateral and debt moved together, the LTV ratio remained stable.

This validates two design decisions:

1. [LST stake-rate oracles](https://kamino.com/docs/security/oracles/lst-oracles.md) effectively eliminate market-noise liquidations for correlated pairs
2. E-Mode for correlated pairs (higher LTV for JitoSOL/SOL) is well-calibrated — the Feb 2026 event did not produce bad debt in these positions

### Correlation Monitoring

The framework continuously tracks:

* **Price correlation matrices** across all listed assets — rolling 30-day and 90-day windows
* **Stress correlation** — correlations tend to increase during market downturns (assets that appear uncorrelated during calm markets become correlated during crashes). The framework uses stress-period correlations, not calm-period correlations, for conservative parameter setting.
* **New listing impact** — before onboarding a new asset, the analysis models how the protocol's effective exposure changes if the new asset's correlation with existing assets approaches 1.0 during stress

## Market Capitalization

Market capitalization provides context for interpreting other risk metrics. A token with \$10B market cap and adequate current liquidity is structurally different from a token with \$50M market cap and the same current liquidity — the larger token has deeper potential buyer interest, more diverse holder base, and more market-making infrastructure.

### Circulating vs. Fully Diluted

The framework emphasizes **circulating market capitalization** over fully diluted valuation (FDV). A token with \$100M circulating cap and \$5B FDV has 98% of its supply still locked — future unlocks will create selling pressure that current liquidity metrics do not reflect.

### Token Emissions and Unlocks

Large upcoming token unlocks directly affect liquidity risk:

* **Sell pressure:** Newly unlocked tokens may be sold by early investors or team members, depressing the price and potentially triggering liquidations
* **Dilution:** Increased circulating supply reduces the effective market cap per token, all else equal
* **Uncertainty:** The market often prices in unlock events in advance, increasing volatility as the date approaches

The risk framework considers unlock schedules when setting parameters. A token with a cliff unlock of 20% of circulating supply in the next quarter faces elevated volatility risk that current Parkinson's readings may not yet reflect.

### Low-Cap Considerations

Tokens with small market capitalization present specific challenges:

* **Liquidity fragility.** A \$30M market cap token may have adequate DEX liquidity today, but that liquidity can evaporate quickly if sentiment shifts. Large-cap tokens have deeper, more resilient liquidity.
* **Whale influence.** A single large holder of a low-cap token can move the price significantly. This creates manipulation risk that is difficult to capture through standard volatility measures.
* **Limited trading history.** Newer, smaller tokens have less price history for volatility analysis, making parameter calibration less reliable.

Low-cap tokens typically receive more conservative parameters — lower Max LTV, lower supply caps, and potential isolation mode — reflecting these structural vulnerabilities.

## Systemic Risk Considerations

Systemic risk emerges when the protocol's aggregate exposure to correlated assets exceeds what the market can absorb during a stress event.

### Concentration Analysis

The framework tracks how much of the protocol's total collateral and debt is concentrated in correlated asset groups:

* **SOL-correlated assets** (SOL + all LSTs): What is the total protocol exposure? If SOL drops 30%, how much collateral is at risk simultaneously?
* **Stablecoin concentration:** If one stablecoin represents 60% of all debt, a depeg event on that stablecoin affects 60% of all loans
* **Single-market concentration:** How much TVL is in each Kamino market? A single market with outsized exposure is a concentration risk

### Broad Downturn vs. Idiosyncratic Event

The framework models two stress scenarios:

1. **Broad market downturn:** All crypto assets decline simultaneously (as in Feb 2026). In this scenario, correlations approach 1.0 — nearly everything drops together. The total liquidation demand is the sum across all assets.

2. **Idiosyncratic event:** A single asset experiences a shock (smart contract exploit, depeg, governance failure) while the rest of the market is unaffected. In this scenario, damage is concentrated but exposure is limited to that asset's caps and isolation constraints.

Parameter setting must account for both scenarios. Supply caps limit idiosyncratic damage; systemic risk limits (total exposure across correlated groups) limit broad-downturn damage.

### How Caps Control Systemic Risk

* **[E-Mode caps](https://kamino.com/docs/risk/safeguards/e-mode-caps.md):** Limit exposure per collateral/debt pairing — preventing outsized positions in any single correlated pair
* **Supply caps:** Limit total deposits of each asset — bounding the maximum collateral at risk from any single asset
* **[Daily caps](https://kamino.com/docs/risk/safeguards/daily-caps.md):** Limit how quickly exposure can build — preventing rapid accumulation of correlated risk
* **Market-level caps:** Each Kamino market has its own exposure limits, preventing systemic concentration in a single market

Together, these mechanisms ensure that the protocol's total exposure to any correlated group remains within what the market can absorb during a stress event — as validated by the [\$0 bad debt track record](https://kamino.com/docs/risk.md#battle-tested-track-record) across five documented stress events.

The [KRAF Dashboard](https://kamino.com/docs/risk/kraf-dashboard.md) provides price shock analysis that models the impact of correlated downturns at various severity levels (-10%, -20%, -30%, -40%, -60%) across the entire protocol.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
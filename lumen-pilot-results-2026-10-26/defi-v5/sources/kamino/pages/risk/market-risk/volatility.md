> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Volatility Analysis

> How Kamino measures token volatility using Parkinson's measure and how it informs LTV calibration

Volatility is the rate at which an asset's price changes over time. In a lending protocol, volatility directly determines the risk of a healthy loan becoming liquidatable — and how quickly that transition can happen.

A loan at 75% LTV with SOL collateral and USDC debt will be liquidated if the SOL price drops enough to push the LTV above the liquidation threshold (e.g., 85%). How likely is that 10% move? How quickly could it happen? These questions are answered by volatility analysis.

## Why Volatility Matters for LTV Calibration

The gap between a token's Max LTV and its Liquidation LTV is the safety buffer. This buffer must be wide enough to account for how far the collateral price can drop — and how fast — before liquidators execute. If the buffer is too narrow, prices can gap through the liquidation threshold, leaving positions deeply underwater before liquidators can act.

Consider two tokens:

* **Token A** has annualized volatility of 40%. On an average day, its price moves 2-3%. A 10% safety buffer provides several days of runway before liquidation.
* **Token B** has annualized volatility of 150%. On a volatile day, its price can move 10-15%. A 10% safety buffer could be consumed in hours.

Token B requires a wider safety buffer — which means a lower Max LTV. Setting the same LTV parameters for both tokens would expose lenders to unacceptable risk on Token B.

## Parkinson's Volatility Measure

Kamino uses **Parkinson's Volatility** rather than simple close-to-close volatility. Standard volatility measures — like the standard deviation of daily returns — only capture the price at two points (open and close). If a token's price drops 20% intraday and then recovers, standard volatility might show a calm day. But that 20% intraday drop could have triggered liquidations.

Parkinson's measure captures the **intra-period range** — the highest and lowest prices within each time window:

```
σ = √( (1/4N·ln2) · Σᵢ [ln(Hᵢ/Lᵢ)]² )
```

Where:

* `Hᵢ` = highest price in period `i`
* `Lᵢ` = lowest price in period `i`
* `N` = number of periods
* `ln` = natural logarithm

By using the high-low range rather than open-close returns, Parkinson's measure captures volatility that intraday-recovering price movements would otherwise hide. This is particularly important for cryptocurrency markets, which are:

* **24/7:** No market close means there are no overnight gaps. Parkinson's measure works especially well when there are no gaps between periods, because the high-low range fully captures the price action.
* **Flash-crash prone:** Brief but severe price dislocations occur regularly on crypto markets. These are invisible to close-to-close measures but captured by Parkinson's.
* **Liquidation-relevant:** What matters for liquidation risk is the maximum intraday drawdown, not whether the price recovered by close. Parkinson's measures exactly this.

## Calculation Methodology

Volatility is calculated using **hourly price data** across multiple time windows:

| Window | Purpose |
| - | - |
| **Short-term** (7 days) | Captures current market regime — is the asset in a volatile or calm period? |
| **Medium-term** (30 days) | Smooths out short-term noise while still reflecting recent conditions |
| **Long-term** (90+ days) | Establishes the baseline volatility regime for the asset |

All three windows are considered together. A token might show low short-term volatility during a calm market, but its long-term window reveals periodic spikes. LTV calibration must account for the spikes, not just the calm.

## Monitoring and Response

Volatility is not static — it clusters. Calm periods are followed by volatile periods, and volatile periods tend to persist. When volatility shifts, protocol parameters must respond:

### Gradual Volatility Increase

If an asset's rolling volatility increases over days or weeks — perhaps due to shifting market sentiment, approaching token unlocks, or increased speculation — the Risk Council may proactively lower Max LTV or reduce supply caps before the volatility manifests as liquidation events.

### Sudden Volatility Spike

Abrupt onset of extreme volatility — such as the February 2026 event when SOL dropped 18% in 48 hours — tests whether existing parameters were set conservatively enough. In that event, Kamino's LTV parameters held: 55,649 liquidations executed profitably with [\$0 bad debt](https://kamino.com/docs/risk.md#battle-tested-track-record).

Post-spike, the Risk Council reviews whether the event was within expected parameters or whether recalibration is needed.

### Volatility Compression

When an asset's volatility compresses over an extended period, there may be room to increase Max LTV — giving borrowers more capital efficiency. This is done cautiously, with the understanding that low-volatility periods often precede high-volatility events.

## Volatility Across Asset Classes

Different asset classes on Kamino exhibit structurally different volatility profiles:

| Asset Class | Typical Volatility Profile | LTV Implication |
| - | - | - |
| **USD Stablecoins** (USDC, USDT) | Very low (\~1-2% annualized) | Highest LTV, E-Mode eligible for stablecoin pairs |
| **SOL** | Moderate-high (60-100% annualized) | Standard LTV (70-80%), primary collateral asset |
| **SOL LSTs** (JitoSOL, mSOL) | Low relative to SOL (stake-rate priced) | E-Mode eligible for SOL pairs, higher LTV |
| **ETH, BTC** | Moderate (50-80% annualized) | Standard LTV, similar to SOL |
| **Newer tokens** | High (100-200%+ annualized) | Lower LTV, potential isolation mode |

Note that LST volatility is measured relative to SOL when priced via [stake-rate oracles](https://kamino.com/docs/security/oracles/lst-oracles.md) — the stake rate increases monotonically, so LST/SOL volatility is near zero. This enables E-Mode with higher LTV for LST/SOL positions.

## Relationship to Other Market Risk Metrics

Volatility analysis does not operate in isolation. A token could have moderate volatility but extremely thin liquidity — meaning that even moderate price moves make liquidation difficult because selling the collateral causes massive price impact. Conversely, a token could be highly volatile but deeply liquid — meaning liquidators can execute quickly at reasonable cost even during price swings.

The [Liquidity & Price Impact](https://kamino.com/docs/risk/market-risk/liquidity.md) analysis is the complementary dimension: volatility tells you how fast prices can move; liquidity tells you whether liquidators can execute when they do.

The [KRAF Dashboard](https://kamino.com/docs/risk/kraf-dashboard.md) provides real-time Parkinson's volatility time series for all listed assets, enabling continuous monitoring and comparison across tokens and time periods.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
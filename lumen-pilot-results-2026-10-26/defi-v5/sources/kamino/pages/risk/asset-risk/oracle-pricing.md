> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Oracle Pricing Risk

> How oracle quality and reliability are evaluated as part of the asset risk framework

Oracle pricing risk is the risk that the price feed used for a given asset on Kamino is inaccurate, stale, or manipulable. Since every lending decision — collateral valuation, liquidation triggering, interest rate calculation — depends on oracle prices, the quality of the price feed is foundational to protocol safety.

An asset with a single, low-frequency price feed from one provider carries fundamentally more oracle risk than an asset with multiple high-frequency feeds from independent providers. The oracle pricing risk assessment quantifies this difference and maps it directly to protocol parameters.

## Multi-Price Oracle System

Kamino's most significant oracle architecture upgrade — the **Multi-Price Oracle System** — represents a fundamental shift in how the protocol sources and validates price data. Rather than selecting a single "best" price from one provider at any moment, the system aggregates pricing from all available high-quality oracle sources and continuously cross-validates them against each other in real time.

> **No Single Point of Failure**
>
> Complete elimination of dependence on any individual data provider

> **Dynamic Price Selection**
>
> Automatically selects the freshest valid price across all providers at the moment of each transaction

> **Self-Healing**
>
> Automatic fallback during provider downtime or price deviation — no manual intervention required

The system was double-audited by **Certora** and **Offside Labs** before deployment.

### Chainlink Data Streams

A key component of the Multi-Price Oracle System is the integration of **Chainlink Data Streams** — a pull-based, low-latency data delivery model from the industry's most established oracle network.

Unlike traditional push-based oracle feeds that update on fixed heartbeat intervals (and may be stale between heartbeats), Chainlink Data Streams deliver high-frequency market data that can be requested on-demand. This means the protocol can access the freshest available price at the exact moment it needs it — during liquidation checks, collateral valuations, and position adjustments.

Chainlink serves as Kamino's primary oracle provider for Real World Asset (RWA) data, delivering the high uptime and reliability required for continuous 24/7 operations.

Before deployment, Chainlink Data Streams underwent extensive testing in Kamino's mainnet testing environment for multiple weeks, running against existing price feeds. The testing demonstrated consistently strong results in both accuracy and latency, providing confidence for full production integration.

> [!NOTE]
>
> For a detailed look at how Scope aggregates and validates prices from all providers including Chainlink Data Streams, see [Scope Aggregator](https://kamino.com/docs/security/oracles).

## Evaluation Dimensions

### Number of Price Sources

Independent, cross-validated price feeds reduce oracle risk: if one feed goes stale, deviates, or is manipulated, the other continues to provide an accurate price and Scope flags the divergence. Kamino's [Scope oracle aggregator](https://kamino.com/docs/security/oracles) cross-validates Chainlink and Pyth Pro, but coverage varies by asset.

Major assets like SOL and USDC are covered by both Chainlink and Pyth Pro, with deep liquidity and full cross-validation. A newer or less liquid token may be supported by only one feed, or by feeds with thinner underlying liquidity. Less coverage means less cross-validation and higher oracle pricing risk.

### Types of Price Sources

Not all oracle feeds are equal. The assessment distinguishes between:

* **Decentralized oracle networks** (Chainlink, Pyth Pro): many independent data providers aggregate prices, making manipulation extremely difficult. These are the highest-quality feeds.
* **Derived on-chain prices** (AMM-derived, LST exchange rates): computed from on-chain data. Generally reliable, but can be affected by on-chain liquidity dynamics.
* **Centralized feeds**: prices from a single provider or a small number of sources. Higher trust assumptions, higher risk.

An asset priced exclusively through centralized feeds receives a lower oracle quality score than one priced through multiple decentralized networks.

### Uptime and Freshness

Oracle feeds must update frequently enough that the price used by the protocol reflects current market conditions. A stale price — one that hasn't updated for minutes during a volatile market — can cause the protocol to value collateral at an outdated price, delaying necessary liquidations.

The assessment evaluates:

* **Update frequency:** Both Chainlink Data Streams and Pyth Pro are pull-based, delivering sub-second prices on demand rather than on fixed heartbeat intervals.
* **Historical uptime:** Has the feed experienced outages? How long were they? What was the market impact?
* **Staleness thresholds:** Scope enforces staleness checks — if a feed hasn't updated within a configured interval, it's flagged and alternatives are used.

### Historical Accuracy

The assessment reviews whether the oracle has historically reported prices that align with actual market conditions. Persistent deviation between oracle-reported prices and verifiable market prices indicates feed quality issues.

Cross-provider deviation is particularly informative: if Provider A consistently reports prices 0.5% different from Providers B and C, that pattern indicates a systematic issue with Provider A's data sources or aggregation methodology.

## How Kamino Mitigates Oracle Pricing Risk

Beyond the assessment, Kamino's oracle infrastructure applies several layers of protection to every price feed:

### Heuristic Validation Rules

Scope applies pre-validation rules before accepting any price update. These rules check for obvious anomalies — prices that are orders of magnitude different from the previous update, negative prices, or updates that arrive out of sequence.

### TWAP and EWMA Smoothing

[Time Weighted Average Price and Exponentially Weighted Moving Average](https://kamino.com/docs/security/oracles/price-protection.md) smoothing filters out short-term manipulation. Even if a single price update is manipulated (e.g., via a flash loan), the smoothed price barely moves because the manipulated datapoint is diluted across the time window.

### Price Bands for Pegged Assets

Stable and pegged assets have [price bands](https://kamino.com/docs/security/oracles/price-protection.md#price-bands) — if the reported price falls outside the expected range (e.g., USDC outside ±1% of \$1.00), it is rejected outright. This prevents flash crash exploits and feed malfunctions from affecting protocol operations.

### Multi-Provider Cross-Referencing

Scope cross-references Chainlink and Pyth Pro for each asset. If one provider reports a price that deviates significantly from the other, the anomalous feed is deprioritized and the protocol uses the validated price.

## How Oracle Risk Maps to Parameters

Assets with higher oracle pricing risk receive more conservative protocol parameters:

| Oracle Quality | Typical Parameters |
| - | - |
| **High** (both Chainlink and Pyth Pro, sub-second freshness, deep liquidity) | Higher Max LTV, lower borrow factor, general asset eligibility |
| **Medium** (single premium feed, or thinner underlying liquidity) | Moderate Max LTV, moderate borrow factor |
| **Low** (derived or centralized feed only, limited history) | Lower Max LTV, higher borrow factor, potential isolation mode |

An asset that cannot achieve acceptable oracle quality — for example, a token with no reliable oracle feed — cannot be listed on Kamino at all, regardless of how it scores on other dimensions.

## Ongoing Monitoring

Oracle quality is not static. Providers add and remove feeds, update frequencies change, and new providers enter the market. The risk framework continuously monitors:

* Provider availability per asset (are all expected feeds active?)
* Feed freshness (are updates arriving on schedule?)
* Cross-provider deviation (are providers in agreement?)
* Staleness events (how often do feeds go stale, and for how long?)

Changes in oracle quality trigger reassessment. If a provider drops support for a token's feed, reducing the number of independent sources, the asset's oracle risk score increases and parameters may be tightened accordingly.

The [KRAF Dashboard](https://kamino.com/docs/risk/kraf-dashboard.md) provides real-time visibility into oracle health metrics for all listed assets.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Liquidity & Price Impact

> How token liquidity, trading volumes, price impact, and price resilience determine liquidation feasibility

Liquidity is the single most critical metric for protocol solvency. A token can pass every other risk dimension — reliable oracles, audited smart contracts, decentralized governance, stable peg — but if it cannot be sold in meaningful size without crashing the price, liquidations will fail and bad debt will result.

This page covers four tightly related aspects of market liquidity: overall token liquidity, trading volumes, price impact analysis, and price resilience.

## Token Liquidity

Token liquidity measures the ability to convert large positions into cash (or another asset) at a reasonable price. For a lending protocol, "reasonable" means that the price impact of selling liquidated collateral does not exceed the liquidation bonus — otherwise, liquidators lose money and stop participating.

### Sources of Liquidity

Liquidity for a given token can come from multiple sources:

* **Native Solana DEX liquidity.** AMM pools (Orca, Raydium, Meteora) and order books (Phoenix, OpenBook) on Solana. This is the most directly accessible liquidity for on-chain liquidations.
* **Cross-chain liquidity.** For tokens that exist on multiple chains (e.g., ETH, USDC), liquidity on Ethereum or other chains can be accessed via bridges or cross-chain solvers. This is slower and more complex but expands the available depth.
* **Centralized exchange liquidity.** CEXes often have the deepest order books. Sophisticated liquidators can route through CEXes — sell collateral on a CEX and settle on-chain. This adds latency but access to significantly more depth.

The risk framework considers all three sources, with the heaviest weight on native Solana liquidity — because it is the most accessible and fastest during stress events when speed matters most.

### What Makes Liquidity Fragile

Liquidity can evaporate precisely when it is needed most. During market stress:

* AMM liquidity providers withdraw to avoid impermanent loss
* Order book market makers widen spreads or pull orders
* DEX pool rebalancing creates directional pressure

A token that shows adequate liquidity during calm markets may have dramatically reduced liquidity during a crash — exactly when liquidations are most needed. The risk framework accounts for this by stress-testing liquidity at elevated volatility levels, not just current conditions.

## Trading Volumes

Trading volume measures overall market activity. High volumes indicate:

* **Substantial liquidity:** Active markets have many participants willing to buy and sell
* **Narrow bid-ask spreads:** Competition among market makers tightens spreads, reducing execution costs
* **Reduced slippage:** More depth at each price level means less price impact per trade
* **Continuous trading:** The asset can be traded at any time without waiting for counterparties

Volumes are analyzed using hourly data across multiple time windows. The framework adjusts for **wash trading** — inflated volume figures from entities trading with themselves to create the appearance of activity. Raw volume numbers in cryptocurrency markets are notoriously unreliable; the assessment applies heuristic filters to identify and discount wash trading patterns.

Low or declining volumes are a leading indicator of liquidity deterioration. A token whose volumes have dropped 80% over the past month may no longer support the liquidation sizes implied by its current supply cap — triggering a parameter review.

## Price Impact Analysis

Price impact is the core quantitative measure of liquidation feasibility: how much does the price move when you sell a given amount of an asset?

### How It's Measured

The framework measures price impact using **on-chain data** — actual swap execution costs through Jupiter (Solana's leading DEX aggregator). For each listed asset, the analysis captures:

| Trade Size | What It Tells You |
| - | - |
| **\$10K** | Retail-scale. Should have negligible impact for any listed asset. |
| **\$100K** | Moderate position. Impact should be under 1% for most assets. |
| **\$500K** | Large position. Impact varies significantly by asset — from 0.1% for SOL to potentially 5%+ for thin tokens. |
| **\$1M+** | Institutional-scale. Only the most liquid assets can absorb this in a single transaction. |

### Single-Transaction vs. Optimal Execution

Two execution models are analyzed:

1. **Single-transaction execution:** Constrained by Solana's compute unit limit per transaction. This represents the worst case — a liquidator must sell the entire position in one shot. Price impact is highest.

2. **Multi-transaction optimal execution:** The collateral is sold across multiple transactions, potentially using multiple routes and DEX venues. This is more realistic for large liquidations — sophisticated liquidators split orders to minimize impact. Models draw from optimal execution literature (Almgren-Chriss framework) to estimate the achievable improvement over single-transaction execution.

The gap between single-transaction and optimal-execution impact directly informs how conservative the parameters need to be. If optimal execution only marginally improves on single-transaction impact, the asset's liquidity is thin across all execution strategies.

### Liquidation Bonus Threshold

Price impact must be compared against the liquidation bonus. If selling \$500K of collateral causes 4% price impact, but the liquidation bonus is only 3%, the liquidation is unprofitable at that size. This directly implies that position sizes above a certain threshold cannot be safely liquidated — and that supply caps must be set accordingly.

## Price Resilience

Price resilience measures how quickly the market recovers after a large trade. Two dimensions are analyzed:

### Recovery Speed

After a large sell order pushes the price down, how quickly does it return to pre-trade levels? Fast recovery indicates robust market-making infrastructure — limit orders are replenished, arbitrageurs close the gap, and new liquidity flows in. Slow recovery suggests the market absorbed a lasting shock.

This matters for cascading liquidations. During a market downturn, multiple positions may become liquidatable simultaneously. If the first liquidation pushes the price down and the market does not recover before the next liquidation, the cumulative impact compounds — each subsequent liquidation executes at a worse price.

### Cumulative Impact

The framework analyzes the cumulative impact of multiple large trades in sequence. If three \$200K sells each cause 1% impact individually but the cumulative impact of all three is 5% (rather than 3%), the market is exhibiting poor resilience — each trade is deepening the impact rather than being absorbed.

### Order Book Replenishment

For assets traded on limit order books (Phoenix, OpenBook), the framework measures how quickly the order book refills after a large market order sweeps through price levels. LOBs tend to be more reactive than AMMs — market makers can replenish orders within seconds — but this depends on the specific asset and market conditions.

### Almgren-Chriss Framework

Price resilience analysis draws on the Almgren-Chriss optimal execution model, which formalizes the tradeoff between execution speed and price impact. The model considers:

* **Temporary impact:** The immediate price displacement caused by a trade, which partially recovers
* **Permanent impact:** The lasting price change, reflecting genuine information content
* **Volatility risk:** The risk that the price moves unfavorably while splitting a large order across time

This framework provides a principled way to estimate the cost of liquidating large positions over realistic time horizons, rather than assuming instantaneous execution.

## How Liquidity Metrics Map to Parameters

| Metric | Parameter Affected |
| - | - |
| **Price impact at cap-implied max position size** | Supply and borrow caps — must be set so that max position is liquidatable without exceeding the liquidation bonus |
| **Trading volumes** | General asset eligibility — assets with insufficient volumes may be restricted to isolation mode |
| **Price resilience** | E-Mode caps — for pairs where cascading liquidations are possible, resilience determines how much total exposure is safe |
| **Cross-chain liquidity** | Borrow factor — assets with deep cross-chain liquidity but thin on-chain liquidity receive moderate borrow factors (liquidators can route off-chain, but at higher cost) |

All liquidity metrics are available in real-time on the [KRAF Dashboard](https://kamino.com/docs/risk/kraf-dashboard.md), which provides percentage price impact charts for buy and sell swaps at various USD sizes for every listed asset.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
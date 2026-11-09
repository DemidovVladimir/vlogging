> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Swap

> How Kamino Swap routes trades across 15+ venues based on your specified parameters

Kamino Swap is a meta-aggregator that queries multiple routing engines in parallel and returns the highest output quote across all integrated routing engines for any token pair. It charges no platform fees. The same routing layer powers swaps across the full Kamino product suite — Multiply leverage, Repay with Collateral, and single-asset deposits on Lending Vaults.

> **[Limit Orders](https://kamino.com/docs/products/swap/limit-orders.md)**
>
> Standing orders that execute when the market reaches your price, with zero slippage and zero fees.

## How routing works

When a swap is initiated, Kamino queries 15+ routing engines concurrently. Each returns a quote and a ready-to-execute transaction. Kamino compares all quotes and selects the highest output. Integrations include: Jupiter/Metis, DFlow, OKX, Settler (0x), LI.FI, OpenOcean, Titan, Kinetic, Raydium, Hashflow, Cabana Wave (Spur), and others. Route selection varies by pair and size — DFlow, Jupiter/Metis, and OKX handle the majority of volume, but any router can win when it returns a higher output quote.

## Active Simulation

Standard DEX interfaces display optimistic quotes that don't account for real-time on-chain conditions. Kamino's Active Simulation Mechanism (ASM) runs the transaction through an on-chain simulation before presenting the quote, verifying the actual output rather than relying on the routing engine's estimate.

Active simulation runs in three phases:

* **Refresh simulation** — instant accuracy check when quotes are first fetched
* **Mid-quote simulation** — after 2.5 seconds, outdated routes are filtered out
* **On-swap simulation** — final verification at the moment of execution

This produces a `simulatedAmountOut` rather than an optimistic `quotedAmountOut`. Measured over 370,000+ transactions, ASM achieves 99.944% mean accuracy between expected and actual output. Active Simulation can be toggled on or off on the swap interface.

## Price impact vs. slippage

These two terms affect your output in different ways and are commonly confused.

**Price impact** is the effect your trade has on the market price. When you buy a large quantity of a token, you consume liquidity from pools at progressively worse rates — the larger the trade relative to available liquidity, the higher the impact. Price impact is calculated before execution and displayed as a percentage. Kamino shows a warning at ≥1% and an error at ≥5%.

**Slippage** is the difference between the quoted price and the actual execution price, caused by market movement between the moment you receive your quote and the moment your transaction lands. It is unpredictable. Max slippage tolerance is a safety net: if the price moves beyond your configured tolerance before the transaction executes, the transaction reverts.

Setting slippage too low causes more transaction failures in volatile markets. Setting it too high means accepting potentially worse prices. The minimum output shown on the swap interface accounts for both — it is the quoted output after price impact minus the max slippage tolerance.

> [!NOTE]
>
> **Worked example: Swap 10,000 USDC → SOL at \~\$150/SOL**
>
> * **Price impact: 0.5%** — your trade moves the pool, giving you \~66.33 SOL instead of 66.67
> * **Max slippage: 50 bps (0.5%)** — protects against further price movement during execution
> * **Minimum output: \~66.00 SOL** — if execution would return less than this, the transaction reverts

## No platform fees

Kamino Swap charges no platform fees. Costs are limited to on-chain transaction fees (SOL gas) and any spread embedded in the route by the underlying DEXes or aggregators — these are third-party costs outside Kamino's control and are not charged by Kamino. For comparison: Jupiter's "Ultra" mode charges 0.1% on most pairs — Kamino charges zero.

## Integration across Kamino

Kamino Swap is also the execution layer for:

* **Multiply** — all flash loan swaps for opening, adjusting, and closing leveraged positions
* **Repay with Collateral** — collateral → debt asset conversion on Kamino Lend
* **Lending Vaults** — single-asset deposits/withdrawals (converts to the required pair)

***

## Disclaimer

Use of Kamino Swap is subject to Kamino's Terms and Conditions and geo-blocking policy, which restrict access for users in the United States, the United Kingdom, and other restricted jurisdictions. By accessing or using Kamino Swap, you confirm that you are not located in a restricted jurisdiction and that your use complies with all laws and regulations applicable to you. Kamino Swap is a non-custodial interface that prepares and broadcasts transactions based solely on the parameters you set. Kamino does not place orders on your behalf, exercise any discretion over your transactions, or hold your assets at any point. This documentation does not constitute financial, investment, legal, or tax advice.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
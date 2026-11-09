> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Benchmark Rate

> An objective DeFi baseline for measuring stablecoin vault performance

The Benchmark Rate is a deposit-weighted average of USD stablecoin lending yields across the largest DeFi protocols. It provides an objective reference point for evaluating whether a stablecoin vault is generating genuine outperformance or simply tracking a market-wide rate environment.

In traditional finance, government bond yields serve as a baseline for comparing dollar-denominated products. DeFi has no equivalent — there is no single risk-free rate. The Benchmark Rate fills this gap by aggregating real supply rates from the most established stablecoin lending venues.

## What it tracks

The benchmark pulls real-time supply rates from three protocols covering approximately \$14B in supplied stablecoin liquidity:

| Protocol | Tracked supply | Assets |
| - | - | - |
| Aave v3 | \~\$11.5B | USDC, USDT, DAI, USDS |
| Maker Savings Rates (sDAI / sUSDS) | \~\$2.2B | DAI, USDS |
| Morpho | \~\$600M | USDC, USDT, DAI, USDS |

**Protocol inclusion criteria:**

* Over \$1B in total stablecoin deposits
* Live for over 1 year
* Over \$100M in stablecoin deposits specifically

**Stablecoin inclusion criteria:** Only those exceeding \$2B in circulating supply — currently USDC, USDT, DAI, and USDS.

## How it's calculated

The rate is a deposit-weighted average — larger pools carry more weight than smaller pools. This means the benchmark reflects where the majority of stablecoin capital actually sits, rather than giving equal weight to shallow or illiquid venues.

Kamino's own Earn Vaults are intentionally excluded from the benchmark calculation. Including them would introduce circularity — comparing a vault's performance against a benchmark that contains that same vault's yields. The exclusion preserves the benchmark's value as an independent reference point.

## How to use it

The Benchmark Rate is displayed on every stablecoin vault in Kamino Earn. When a vault's yield exceeds the benchmark, the spread represents genuine outperformance relative to what passive stablecoin lending earns across the largest DeFi venues. When the yield is below the benchmark, the vault is underperforming that baseline.

The benchmark is one input into vault evaluation — not the only one. Yield composition (base interest vs. emissions), reserve concentration, and collateral quality all matter when [comparing yields across vaults](https://kamino.com/docs/products/lending-vaults/concepts.md#comparing-yields-across-vaults). The benchmark adds a single quantitative reference to that analysis.

> [!NOTE]
>
> The Benchmark Rate methodology was developed in partnership with [Allez Labs](https://allez.xyz). Full methodology details and historical data are available on their platform.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Strategies

> SOL LSTs, JLP, stablecoins, RWAs, and tokenized stocks — Multiply strategy types and their mechanics

Multiply supports four distinct strategy categories, each with different yield sources, leverage limits, and risk profiles. The right strategy depends on your yield target, risk tolerance, and market view.

## SOL LST strategies

> [!NOTE]
>
> [SOL LST](https://kamino.com/docs/products/multiply/concepts.md#liquid-staking-tokens-lsts) strategies are the only Multiply strategies where SOL price movements have zero impact on position health. Both collateral and debt are denominated in SOL — the position gains or loses based entirely on the spread between staking yield and borrow rate. See [The SOL-denominated advantage](https://kamino.com/docs/products/multiply/concepts.md#the-sol-denominated-advantage-lst-looping) for the full explanation.

**Collateral assets:** JitoSOL, mSOL, bSOL, JupSOL, dfdvSOL, adraSOL\
**Debt asset:** SOL\
**Yield source:** Liquid staking rewards (Solana Proof-of-Stake yield)

Because both sides of the position are denominated in SOL, SOL price volatility does not affect the LTV ratio or liquidation risk. You hold an LST against SOL debt — if SOL falls 50%, both your collateral value and your debt value fall by the same amount.

| Market | Assets | Max Leverage | Notes |
| - | - | - | - |
| Jito Market | JitoSOL | 10x | Isolated market, 90% LTV eMode, SOL IR cap |
| SOL/BTC Market | mSOL, bSOL, JupSOL, dfdvSOL, adraSOL | 7.5x | eMode elevation groups |

Zero liquidations have occurred on SOL LST Multiply positions as of March 2026. See [How It Works](https://kamino.com/docs/products/multiply/how-it-works.md) for stake-rate oracle details.

**Primary risk:** Sustained high SOL borrow rates exceeding LST staking yield. When `Borrow Rate > Staking Yield`, [Net APY](https://kamino.com/docs/products/multiply/concepts.md#net-apy--the-fundamental-equation) turns negative and debt grows relative to collateral. This is the only meaningful risk vector for these strategies under normal conditions.

***

## JLP strategies

**Collateral:** [JLP](https://kamino.com/docs/products/multiply/concepts.md#jlp--what-it-is-and-why-the-risk-profile-differs) (Jupiter Liquidity Provider token)\

**Debt asset:** USDC, PYUSD, or USDG\
**Yield source:** Trading fees from Jupiter perpetuals platform\
**Max leverage:** \~3.2x (JLP Market, 67% LTV, Liquidation LTV 80%)

JLP is a basket token holding SOL, ETH, BTC, USDC, and USDT — approximately 65% crypto-native assets and 35% stablecoins. Leverage amplifies both the fee yield and the directional exposure to crypto prices. Unlike SOL LST strategies, JLP Multiply carries direct market risk: if JLP falls in USD terms, the position approaches liquidation.

> [!WARNING]
>
> JLP Multiply positions were among those liquidated in both the April 2025 and February 2026 market corrections. JLP is not price-pegged — treat this as a leveraged crypto position that also earns trading fees, not a yield-only strategy.

The \~35% stablecoin component provides partial downside buffer. [eMode](https://kamino.com/docs/products/multiply/concepts.md#emode-in-multiply) is not applied — JLP does not qualify as a correlated asset against USDC debt.

**Available vaults:** JLP/USDC, JLP/PYUSD, JLP/USDG

***

## Stablecoin and RWA strategies

These strategies loop a yield-bearing stablecoin or real-world asset token against stablecoin debt. The goal is leveraged yield with minimal directional exposure to crypto prices.

| Strategy | Yield Source | Approx Base APY | Max Leverage |
| - | - | - | - |
| [SyrupUSDC](https://kamino.com/docs/products/multiply/concepts.md#rwa-tokens--real-world-yield-on-leverage) / USDC | Maple Finance institutional credit | \~5–6% | 4–5x |
| [PRIME](https://kamino.com/docs/products/multiply/concepts.md#rwa-tokens--real-world-yield-on-leverage) / PYUSD | US home equity loans (Figure Finance) | \~8% | 8.3x |
| [ONyc](https://kamino.com/docs/products/multiply/concepts.md#rwa-tokens--real-world-yield-on-leverage) | Reinsurance-backed yield (OnRe) | \~16% | Varies |

> [!NOTE]
>
> RWA strategies carry risks that are absent from crypto-native strategies: counterparty risk, default risk on the underlying loan pool, and redemption liquidity constraints. The collateral may not be liquidatable as rapidly as on-chain assets in a stress scenario.

Borrow rate risk applies here as with all Multiply strategies — if the cost to borrow USDC exceeds the RWA yield, the net position is negative-carry. These strategies are not immune to liquidation if borrow rates spike sharply.

***

## xStocks strategies

**Collateral:** Tokenized stocks (xStocks)\
**Debt asset:** USDC\
**Available assets:** APPLx, GOOGLx, HOODx, MSTRx, NVDAx, QQQx, SPYx, TSLAx\
**Max leverage:** Up to 3.7x

xStocks Multiply provides leveraged exposure to tokenized equity prices settled on-chain. This is a purely directional strategy — if the underlying stock price falls, the position can be liquidated. There is no yield-bearing component offsetting the borrow cost; the entire thesis is price appreciation of the underlying equity.

> [!WARNING]
>
> xStocks strategies carry equity market risk amplified by leverage, plus USDC borrow rate risk as an ongoing cost. These positions are not appropriate if you are seeking yield — they are a leveraged long on individual equities or indices.

***

## Stable loops

Stablecoin-to-stablecoin looping strategies pair a yield-bearing stablecoin as collateral against a standard stablecoin as debt. When both sides are pegged to USD, leverage multiplies the yield spread with minimal directional price risk.

**Example:** CASH/PYUSD — up to 10x leverage on the spread between CASH yield and PYUSD borrow rate.

> [!TIP]
>
> Stable loops offer the highest available leverage multiples on Multiply precisely because the correlated collateral and debt eliminate price liquidation risk. The primary and often only risk is borrow rate volatility compressing or inverting the yield spread.

***

## Strategy comparison

| Strategy | SOL Price Risk | Market Liquidation Risk | Primary Risk | Max Leverage |
| - | - | - | - | - |
| SOL LST | None | None | Borrow rate | 10x |
| JLP | High | Yes | Price + borrow rate | \~3.2x |
| Stablecoin / RWA | Low | Low | Borrow rate + RWA default | 8.3x |
| xStocks | High (equity) | Yes | Price + borrow rate | 3.7x |
| Stable loops | None | None | Borrow rate spread | 10x |


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
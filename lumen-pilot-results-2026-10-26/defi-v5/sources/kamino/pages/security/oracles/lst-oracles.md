> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# LST Oracles

> How Kamino prices liquid staking tokens using stake rates instead of market prices

Liquid staking tokens (LSTs) like JitoSOL, mSOL, and bSOL represent staked SOL plus accumulated staking rewards. Their theoretical value increases monotonically relative to SOL as staking yields accrue each epoch. But their *market* price — the price at which they trade on DEXes — can deviate from this theoretical value due to temporary supply/demand imbalances.

Kamino uses a fundamentally different approach to pricing LSTs than most lending protocols.

## The Problem with Market-Price LST Oracles

The amount of LSTs deposited across Solana DeFi far outweighs the liquidity available in DEX pools. This creates a structural vulnerability: even moderate selling pressure on an LST can cause a temporary market depeg — where the LST trades below its theoretical value.

If a lending protocol uses market price to value LST collateral, a temporary depeg would reduce the collateral value of every LST position on the protocol. Positions that were healthy moments before could suddenly breach their liquidation threshold — not because of any real loss of value, but because of a transient liquidity event in a DEX pool.

For products like [Multiply](https://kamino.com/docs/products/multiply.md), where users leverage LSTs against SOL, a market-price oracle would mean that every LST depeg — however brief — triggers unnecessary liquidations. This creates a cascade: liquidations produce more selling pressure, deepening the depeg, triggering more liquidations.

## Kamino's Approach: Stake-Rate Pricing

Instead of using market price, Kamino prices LSTs using the **stake rate** — the ratio of SOL staked in the LST's validator pool to the total LST tokens minted:

```
LST Price = SOL_staked / LST_minted
```

Each Solana epoch (\~2 days), the amount of SOL in the staking pool increases due to:

1. **Proof of Stake emissions** — validators earn SOL rewards for securing the network
2. **Transaction fees** — a portion of network transaction fees flows to validators

Meanwhile, the number of LST tokens minted remains stable relative to the SOL increase. The result: the stake rate increases monotonically each epoch, and so does the LST price on Kamino.

## What This Protects Against

**Market depeg events.** If JitoSOL temporarily trades at 0.95 SOL on a DEX due to a large sell order, Kamino continues to value it at its stake rate (e.g., 1.02 SOL). Positions are not affected. No liquidations are triggered. The temporary market dislocation is irrelevant to the protocol.

This protection is especially important for Multiply positions, where users hold leveraged LST/SOL exposure. Without stake-rate pricing, these positions would be perpetually vulnerable to market noise.

## What This Does NOT Protect Against

**Smart contract exploits on the LST platform.** If the staking vault underlying an LST suffers a smart contract exploit and SOL is drained, the stake rate would reflect the loss (fewer SOL staked per LST minted). In this scenario, positions on Kamino would correctly be at risk, and liquidations would proceed normally.

Stake-rate pricing removes *market noise* risk but does not remove *fundamental* risk. If an LST's backing is genuinely impaired, the oracle will reflect it.

## The Arbitrage Assumption

This approach assumes that market arbitrageurs will restore the market price to align with the theoretical stake-rate price. When an LST trades below its theoretical value, arbitrageurs can buy the discounted LST, unstake it for SOL at the stake rate, and profit from the difference. This arbitrage mechanism provides the economic incentive to close any depeg.

**Risk:** If arbitrage fails to occur and an LST depeg is sustained — for example, due to a staking pool smart contract issue that prevents unstaking — the protocol may be carrying collateral valued higher than the market is willing to pay. In this scenario, the protocol is at risk of bad debt. If bad debt materializes, losses are socialized among lenders in the affected market.

This risk is mitigated by:

* Supply caps on individual LSTs (limiting total protocol exposure)
* The [Asset Risk Framework](https://kamino.com/docs/risk/asset-risk) evaluating each LST's smart contract risk before onboarding
* Continuous monitoring of stake pool health and unstaking delays

## Supported LSTs

All liquid staking tokens on Kamino use stake-rate pricing, including JitoSOL, mSOL, bSOL, and others. The stake rate is read directly from each LST's on-chain stake pool account — there is no off-chain dependency or oracle delay in the pricing.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
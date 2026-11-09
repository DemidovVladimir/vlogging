> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Concepts

> AMMs, concentrated liquidity, impermanent loss, and how Kamino's vault strategies manage LP positions

## Traditional AMMs and the capital efficiency problem

An automated market maker (AMM) is a liquidity pool where price is determined by the ratio of two tokens. The constant product formula:

```
x × y = k
```

Where `x` and `y` are the token balances and `k` is a constant. Price at any moment is `y / x`. When a trader buys token X, they add Y and remove X, changing the ratio and moving the price.

**The capital inefficiency problem:** The constant product formula distributes capital uniformly across ALL possible prices — from 0 to infinity. At any given moment, only a small fraction of that capital is near the current market price and actually useful for trades. A \$10M pool might have only \$200k of capital earning fees at any given time. The remaining \$9.8M is deployed at prices the market may never reach.

***

## Concentrated liquidity

Concentrated Liquidity Market Makers (CLMMs) let LPs choose a specific price range for their capital. Instead of spreading across all prices, capital is deployed only where trades actually happen — the range where the current market price sits.

**When price is within your range:**

* Your capital earns trading fees proportional to your share of total in-range liquidity
* Capital is split between both tokens according to the pool's current ratio

**When price is outside your range:**

* Your position earns zero fees
* Your capital is 100% in whichever asset the price moved toward (fully converted at the range boundary)

This makes capital exponentially more efficient: a \$1M concentrated position can provide the same depth as a \$10M+ traditional AMM position when positioned correctly.

Kamino's Liquidity Vaults use Raydium CLMM as the underlying DEX.

***

## Price ranges and "in range"

The LP specifies a lower bound and upper bound (e.g., 100–200 SOL/USDC). The position behaves differently depending on where the market price sits:

| Market price | Position status | Fee income |
| - | - | - |
| Within the range | In range | Earns fees proportional to share of in-range liquidity |
| Below lower bound | Out of range | Zero fees; position is 100% in the quote token |
| Above upper bound | Out of range | Zero fees; position is 100% in the base token |

**Tighter range = higher capital efficiency when in-range.** A narrower range means a larger share of the active liquidity (earning more fees per dollar) but exits range more often, requiring more rebalances.

***

## Impermanent loss

Impermanent loss (IL) is the difference in value between holding two assets vs. providing them as liquidity in an AMM.

**Why it happens:** As market price moves, the AMM automatically rebalances the position — always selling the appreciating asset and buying the depreciating one. The LP ends up holding less of the asset that went up and more of the one that went down compared to simply holding.

**In CLMMs, IL is amplified.** Because capital is concentrated, each unit of price movement rebalances more capital than a traditional AMM would. The amplification is proportional to the concentration factor — the same reason concentrated liquidity earns more fees per dollar also means it incurs more IL per dollar of price movement.

**"Impermanent" vs. realized:** IL is impermanent while the price might return to entry. It becomes realized (permanent) when you withdraw. At that point, it's simply the performance difference between LP vs. hold.

**The trade-off:** IL is the cost of earning trading fees. If fee income over the period exceeds IL, the LP position is net profitable relative to holding. If fees don't cover IL — common in low-volume, high-volatility pairs — the LP would have been better off holding.

> [!WARNING]
>
> Impermanent loss is not a fee or a transaction cost — it is a structural consequence of providing liquidity. It affects all LP positions and can be significant in concentrated liquidity positions with narrow ranges during periods of high volatility. Always evaluate expected fee income against expected IL for your target price range before entering a position.

***

## Trading fees

Every swap through a pool pays a fee (e.g., 0.01%, 0.05%, 0.3% depending on pool tier). This fee is split among all LPs who have active liquidity at the price of the swap — in-range positions only.

**What makes fees higher for your position:**

* High trading volume through the pool
* A narrow price range (larger share of active in-range liquidity per dollar)

**What makes fees lower:**

* Low trading volume
* Wide price range (smaller share of active liquidity)
* Price outside your range (zero fees)

Kamino auto-compounds all earned fees: rather than distributing fee tokens separately, fees are reinvested back into the LP position, increasing the kToken exchange rate over time.

***

## The range width trade-off

Every liquidity position involves a trade-off between capital efficiency and range stability:

**Narrow range:**

* Higher capital efficiency → earns more fees per dollar when in-range
* Exits range more frequently → requires more rebalancing
* Each rebalancing event incurs swap costs (slippage + fees on the rebalance transaction)

**Wide range:**

* Lower capital efficiency → earns fewer fees per dollar
* Stays in range longer → fewer rebalancing events → lower rebalance costs
* Less sensitive to short-term price moves

Neither extreme is optimal. The best width depends on the pair's volatility, the pool's fee tier, and expected trading volume.

Kamino's vault strategies automate this trade-off: the vault manager chooses and adjusts ranges based on current volatility and fee data, targeting the combination that maximizes net return (fees minus rebalance costs minus IL).

***

## kTokens

When you deposit into a Kamino Liquidity Vault, you receive kTokens as a receipt. kTokens represent your proportional share of the vault's total LP position.

The kToken exchange rate appreciates as trading fees compound into the vault — similar to how Lending Vault share prices rise as interest accrues.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Price Protection

> TWAP, EWMA, and price band mechanisms that defend against oracle manipulation

Even with a multi-provider oracle system, individual price feeds can be temporarily manipulated — through flash loans, large market orders, or liquidity pool manipulation. Kamino deploys three complementary protection mechanisms that make oracle exploitation prohibitively expensive.

## TWAP — Time Weighted Average Price

A Time Weighted Average Price smooths the price of an asset over a configurable time window. Instead of using the instantaneous spot price, the protocol uses the average price observed over the interval.

**Why this matters for security:** Flash loan attacks work by manipulating a price within a single transaction. Because a TWAP reflects the average price over minutes or hours, a single-transaction manipulation has negligible effect on the weighted average. The attacker would need to sustain the manipulated price for the entire TWAP interval — requiring significant capital held at risk for an extended period.

For example, if TWAP is configured with a 30-minute window and an attacker manipulates the price for one block (\~400ms), the manipulated price accounts for less than 0.02% of the weighted average. To meaningfully influence the TWAP, the attacker would need to sustain the manipulation continuously for a substantial portion of the window — at which point the capital costs make the attack economically irrational.

## EWMA — Exponentially Weighted Moving Average

An Exponentially Weighted Moving Average gives more weight to recent prices while still incorporating historical data. This makes it more responsive to genuine market movements than a simple TWAP, while still smoothing out short-term manipulation.

**Why both TWAP and EWMA?** They are complementary:

* **TWAP** is more resistant to sustained manipulation (each time period has equal weight)
* **EWMA** is more responsive to legitimate price changes (recent prices matter more)

Using both allows the protocol to balance between responsiveness and manipulation resistance. Rapid genuine price movements are reflected more quickly through EWMA, while manipulation attempts are filtered by TWAP.

## Price Bands

Each stable or soft-pegged asset on Kamino has a **price band** — a range within which the smart contract expects the price to fall. If a reported price falls outside this band, it is rejected outright.

**How it works for USD stablecoins:** A token like USDC might have a price band of ±1% from \$1.00. If the oracle reports a USDC price below \$0.99 or above \$1.01, the price is rejected and the protocol falls back to the previous valid price or an alternative provider.

**How it works for SOL-pegged assets:** For tokens pegged to SOL (like liquid staking tokens in non-stake-rate mode), price bands are expressed relative to the SOL price rather than a fixed dollar amount.

**What this prevents:**

* **Flash crash exploits:** An attacker who temporarily crashes a stablecoin price on a DEX cannot use that manipulated price to trigger improper liquidations on Kamino — the price would be outside the band and rejected.
* **Oracle feed corruption:** If an oracle feed malfunctions and reports an obviously incorrect price, the band prevents it from affecting protocol operations.

## How the Mechanisms Interact

These three mechanisms form a layered defense:

1. **Price bands** are the first filter — they catch obvious outliers and reject them immediately. This is a coarse but fast check.
2. **TWAP smoothing** absorbs short-term manipulation by averaging over time. Even if a manipulated price passes the band check (e.g., a 0.8% deviation on a stablecoin), the TWAP dilutes its impact.
3. **EWMA smoothing** provides an additional smoothing layer that is more responsive to genuine market movements but still resistant to single-block manipulation.
4. **Multi-provider consensus** (from [Scope](https://kamino.com/docs/security/oracles)) provides an independent validation layer — if one provider reports a price that deviates significantly from others, Scope flags the discrepancy.

The result: exploiting Kamino's oracle system requires simultaneously manipulating the price across multiple independent oracle providers, sustaining the manipulation for the full TWAP interval, staying within the price band to avoid rejection, and doing all of this profitably after accounting for the capital required. No oracle exploit has ever been successfully executed against Kamino.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
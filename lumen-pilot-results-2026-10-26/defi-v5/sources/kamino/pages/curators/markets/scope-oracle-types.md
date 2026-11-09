> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Scope Oracle Types

> Specialized Scope oracle entry types for fixed-income, multi-source, pegged, and LST assets

Beyond a plain price feed, Scope supports specialized oracle entry types that each compute a price in a specific way for a class of asset. You select one as the source of a reserve's Scope chain when wiring the oracle, covered in [Configure oracles](https://kamino.com/docs/curators/markets/configuring-oracles.md).

> [!NOTE]
>
> These types are configured on the Scope side and referenced by their index in a reserve's `priceChain`. Coordinate with the Kamino team to add a Scope entry for your asset.

| Type | What it computes | Use for |
| - | - | - |
| `DiscountToMaturity` | Fair value of a discounted instrument that redeems at par on a known date | Zero-coupon bonds, T-bills, PT-tokens, vesting tranches |
| `MostRecentOf` | Freshest price across up to 4 sources, with staleness and divergence guards | Multi-provider resilience |
| `CappedFloored` | A source price clamped to a ceiling, a floor, or both | Pegged and regulated stablecoins |
| `CappedMostRecentOf` | `MostRecentOf` with an upper bound applied | Multi-source pegged assets |
| `SplStake` | An SPL Stake Pool's redemption rate | LST reference pricing |

## DiscountToMaturity

Models a fixed-income instrument that trades at a discount and redeems at par on a known date.

You configure an annual discount rate (in basis points) and a maturity timestamp. The oracle computes the current fair value by applying that discount linearly over the remaining time, so the price starts below 1.0 and climbs smoothly to exactly 1.0 at maturity, regardless of market noise.

**When to use it.** Any token that represents a claim on a fixed future redemption: zero-coupon bonds, treasury bills, PT-tokens, vesting tranches, or structured credit instruments where the terminal value is known but the current fair value depends on time elapsed.

## MostRecentOf

Aggregates up to 4 price sources and returns the price from whichever was updated most recently, subject to two safety guards.

**Staleness.** All sources must have been updated within a configurable time window. If any single source goes stale, the oracle fails rather than silently serving an old price. This is intentional, because the divergence check below only makes sense when all sources are live.

**Divergence.** The spread between the highest and lowest price across all sources must stay within a configurable tolerance. If the sources disagree beyond that threshold, the oracle fails rather than picking one arbitrarily.

**When to use it.** When you want resilience across multiple data providers (for example Chainlink plus Pyth Pro) without trusting any single one. The "most recent wins" rule keeps latency low in normal conditions, while the divergence check acts as a circuit breaker the moment the feeds disagree, protecting against a compromised or malfunctioning provider silently manipulating the result.

## CappedFloored

Wraps any source oracle and bounds its price. The cap and floor are themselves oracle entries, so each can be dynamic (for example derived from a protocol invariant) or a hardcoded constant.

### 1. Capped

Prevents the source price from exceeding a configured ceiling.

**When to use it.** Stablecoins and pegged assets where the price should never be accepted above peg, even if a market feed briefly reports it there. Also useful for any token with a hard protocol-level redemption ceiling: using a live oracle for the cap means the ceiling tracks protocol state automatically rather than requiring manual updates.

### 2. Floored

The mirror of Capped: prevents the source price from falling below a configured floor.

**When to use it.** Regulated stablecoins that should not take temporary depegs into account.

> [!NOTE]
>
> Cap and floor can be combined on the same source entry, giving a bounded range. The price is accepted only if it falls between the floor and the ceiling, and is clamped to whichever bound it crosses.

## CappedMostRecentOf

Combines `MostRecentOf` and `Capped` in a single oracle: it selects the freshest price from multiple sources (with the same divergence and staleness checks), then applies an upper bound.

**When to use it.** Whenever you want the resilience of multiple providers but also need a hard ceiling. For example, using several market feeds for a pegged asset while ensuring the result can never exceed peg, even during a brief depeg in a single feed.

## SplStake

Reads an SPL Stake Pool account directly and returns the pool's current redemption rate: how many SOL you would receive per staked pool token if you unstaked today.

Because the stake rate is only updated once per epoch (roughly every 2 to 3 days), this oracle is intentionally designated as a reference price, not a primary valuation source. It does not reflect real-time market dynamics, does not account for unstaking fees, and ignores that secondary-market prices are typically lower than the theoretical stake rate.

**When to use it.** LSTs, where the stake rate provides a slow-moving, manipulation-resistant floor that the market price is compared against.

## Feature: Reference Price Check

A per-oracle safety mechanism that validates incoming price updates against a separately designated reference price.

When configured, every time an oracle entry is refreshed the new price is compared to its reference. If the two diverge by more than a configurable tolerance (default 5%), the update is either blocked or the transaction reverts, depending on how the caller has configured the strictness.

**Why this matters.** A reference price is typically a constant that can be updated regularly (for RWAs) or a slow-moving, hard-to-manipulate value such as a long TWAP or a NAV, paired with a faster market feed. The check creates a circuit breaker: the market feed is accepted in normal conditions, but the moment it moves too far from the reference, indicating a potential oracle attack, flash loan manipulation, or feed failure, the update is rejected until the discrepancy resolves.

## Reference

* [Configure oracles](https://kamino.com/docs/curators/markets/configuring-oracles.md): wire a reserve to a Scope feed
* [Oracle architecture overview](https://kamino.com/docs/security/oracles): Scope, price protection, and manipulation resistance


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
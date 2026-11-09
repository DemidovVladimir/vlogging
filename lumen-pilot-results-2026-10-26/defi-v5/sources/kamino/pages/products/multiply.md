> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Multiply

> Leveraged yield strategies — amplify staking, LP, and RWA returns in a single transaction

Multiply automates the leveraged yield [looping](https://kamino.com/docs/products/multiply/concepts.md#looping--how-leverage-is-built) process — supply, borrow, swap, re-supply — into a single atomic transaction using [flash loans](https://kamino.com/docs/products/multiply/concepts.md#flash-loans). What previously required 10+ manual steps and multiple transactions executes in one click, opening a fully leveraged position against Kamino's lending markets. Multiply amplifies returns from SOL liquid staking tokens, JLP, stablecoins, real-world assets, and tokenized equities, with over \$1B deployed and zero bad debt history across more than three years of operation.

> [!NOTE]
>
> A **flash loan** is an uncollateralized borrow that must be repaid within the same transaction block — if repayment fails, the entire transaction reverts. **Looping** is the strategy of repeatedly depositing a yield-bearing asset, borrowing against it, and reinvesting to build a leveraged position. Multiply executes both atomically so you only see the net result. See [Concepts](https://kamino.com/docs/products/multiply/concepts.md) for a full explanation.

> **[How It Works](https://kamino.com/docs/products/multiply/how-it-works.md)**
>
> Flash loans, eMode, and the looping mechanics that power Multiply

> **[Strategies](https://kamino.com/docs/products/multiply/strategies.md)**
>
> SOL LSTs, JLP, stablecoins, RWAs, and xStocks

> **[Risks](https://kamino.com/docs/products/multiply/risks.md)**
>
> Understanding liquidation, borrow rate, and strategy-specific risks before opening a position

## Overview

Manual looping to amplify yield on a staking token requires borrowing, swapping, re-depositing, and borrowing again — repeating this cycle across multiple transactions, each with its own slippage exposure and execution risk. Multiply collapses this into one atomic transaction. Either the entire position opens at the target leverage, or nothing executes.

**[Net APY](https://kamino.com/docs/products/multiply/concepts.md#net-apy--the-fundamental-equation) is determined by the spread between collateral yield and borrow rate, amplified by leverage:**

```
Net APY = (Collateral Asset Yield × Leverage) − (Borrow Rate × (Leverage − 1))
```

A positive spread amplified by higher leverage produces outsized returns. A negative spread — where borrow rates exceed collateral yield — produces losses at the same amplification. Monitoring the spread is the primary ongoing responsibility of a Multiply user.

**Three features differentiate Multiply from manual looping:**

* **[eMode](https://kamino.com/docs/products/multiply/concepts.md#emode-in-multiply)** — Kamino Lend's Elevation Mode groups correlated asset pairs (e.g., JitoSOL/SOL) under elevated LTV ratios, enabling up to 10x leverage that would be impossible against uncorrelated collateral. This is what makes high-leverage LST strategies viable.
* **[Stake-rate oracle](https://kamino.com/docs/products/multiply/concepts.md#stake-rate-oracle-protection)** — SOL LST positions are priced using the stake pool exchange rate, not the market price. Temporary LST market depegs do not affect LTV calculations, eliminating a major source of unfair liquidations.
* **Zero bad debt history** — No SOL LST Multiply position has ever been liquidated. The liquidation penalty is approximately 0.1%, among the lowest in DeFi.

The flash loan fee is 0.001% per transaction. This applies when opening, adjusting, or closing a position.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
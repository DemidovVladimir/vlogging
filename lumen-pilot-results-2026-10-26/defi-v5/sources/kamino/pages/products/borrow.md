> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Borrow

> Kamino's peer-to-pool lending market on Solana

Kamino Borrow is a [peer-to-pool](https://kamino.com/docs/products/borrow/concepts.md#the-peer-to-pool-model) lending market on Solana. Lenders deposit assets into shared liquidity pools to earn yield; borrowers draw [overcollateralized](https://kamino.com/docs/products/borrow/concepts.md#overcollateralized-lending) loans against their collateral. The protocol handles rate discovery, position health tracking, and liquidations automatically — no counterparty matching required. Kamino Borrow also powers [Multiply](https://kamino.com/docs/products/multiply.md), which uses the lending market's underlying mechanics to construct leveraged yield positions in a single transaction.

> [!NOTE]
>
> **Overcollateralized** means every loan is backed by more collateral value than the loan itself is worth. There is no credit history, no identity check, and no legal recourse — the collateral is the only guarantee. This is what makes anonymous, permissionless lending possible. [Learn more](https://kamino.com/docs/products/borrow/concepts.md#overcollateralized-lending)

> [!NOTE]
>
> **Peer-to-pool** means depositors contribute to a shared pool and borrowers draw from it — no specific lender is matched to a specific borrower. The protocol intermediates automatically, enabling instant borrowing without waiting for a counterparty. [Learn more](https://kamino.com/docs/products/borrow/concepts.md#the-peer-to-pool-model)

> **[Supplying](https://kamino.com/docs/products/borrow/supplying.md)**
>
> How deposits enter liquidity pools, how kTokens work, and how supply yield is earned.

> **[Borrowing](https://kamino.com/docs/products/borrow/borrowing.md)**
>
> Collateral requirements, borrow limits, interest accrual, and how debt positions are managed.

> **[Fixed Rates](https://kamino.com/docs/products/borrow/fixed-rates.md)**
>
> Fixed-rate borrowing — rate certainty, term structure, conditional liquidity, and the on-chain yield curve.

> **[Borrow Orders](https://kamino.com/docs/products/borrow/borrow-orders.md)**
>
> Standing borrow orders that fill automatically as matching liquidity becomes available.

> **[Markets](https://kamino.com/docs/products/borrow/markets.md)**
>
> The structure of Kamino's lending markets, reserve configurations, and eMode.

> **[Liquidations](https://kamino.com/docs/products/borrow/liquidations.md)**
>
> How position health is measured, when liquidations trigger, and how the penalty system works.

> **[Concepts](https://kamino.com/docs/products/borrow/concepts.md)**
>
> The foundational ideas behind Kamino Borrow — reserves, markets, LTV, rate models, and more.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
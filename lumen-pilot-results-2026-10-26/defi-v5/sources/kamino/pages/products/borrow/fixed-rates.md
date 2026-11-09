> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Fixed Rates

> Fixed-rate borrowing on Kamino — rate certainty, term structure, and price discovery

Fixed Rates introduces predictable borrowing costs to Kamino by letting borrowers lock in a rate for a defined term — 1 month, 3 months, 6 months, or longer — without exposure to utilization-driven rate swings. A 5.5% 3-month loan charges 5.5% through the end of its term regardless of what the variable rate market does. For lenders and liquidity vaults, Fixed Rates introduces [Conditional Liquidity](https://kamino.com/docs/products/borrow/concepts.md#conditional-liquidity--the-key-innovation): capital stays deployed and earning in variable reserves until a fixed-rate borrow match is found, eliminating the opportunity cost of pre-positioning. The system generates DeFi's first on-chain [yield curve](https://kamino.com/docs/products/borrow/concepts.md#the-yield-curve-and-term-premium) — a live, market-priced term structure visible across all active fixed-rate reserves.

> [!NOTE]
>
> **Before you open a fixed-rate position, know how it ends:**
>
> * It carries a fixed rate and a single fixed end date.
> * It rolls over into a new term automatically by default (auto-rollover).
> * If it reaches the end date without rolling over and you do not close it, Auto-repay unwinds the position gradually.
> * You can close the position at any time before the end date.

## The rate grid

Each market maintains multiple [reserves](https://kamino.com/docs/products/borrow/concepts.md#what-is-a-reserve) per debt token. Instead of a single USDC reserve, the market exposes a full [rate grid](https://kamino.com/docs/products/borrow/concepts.md#the-rate-grid): one variable reserve plus one reserve per rate-and-duration combination currently offered. Each reserve is independent — it has its own liquidity, its own utilization, and its own borrowers. A position in the `USDC 5.5% 3m` reserve has no interaction with the `USDC 6.0% 6m` reserve.

Example rate grid for USDC debt in a single market:

| Rate | 1 month | 3 months | 6 months | 12 months |
| - | - | - | - | - |
| 5.0% | USDC 5.0% 1m | USDC 5.0% 3m | — | — |
| 5.5% | — | USDC 5.5% 3m | USDC 5.5% 6m | — |
| 6.0% | — | USDC 6.0% 3m | USDC 6.0% 6m | USDC 6.0% 12m |
| 7.0% | — | — | USDC 7.0% 6m | USDC 7.0% 12m |

Not every cell is populated. Curators and governance determine which reserves exist; liquidity is not guaranteed across all combinations. Reserves with no active lenders have no borrowing capacity regardless of demand.

Reserve isolation matters for risk. A large repayment or withdrawal in `USDC 6.0% 6m` does not affect liquidity in adjacent reserves. Borrowers and lenders interact only within their specific reserve.

## Conditional Liquidity

Liquidity vaults face an inherent problem when offering fixed-rate lending: capital sitting in a fixed-rate reserve earns nothing until a borrower arrives. Conditional Liquidity solves this by letting vaults signal capacity on fixed-rate reserves without moving capital.

Capital remains in variable-rate reserves, earning the live variable yield. The vault posts a conditional signal on one or more fixed-rate reserves, declaring that it can fill up to a specified amount at that rate and duration. When a matching [Borrow Order](https://kamino.com/docs/products/borrow/borrow-orders.md) is submitted, the protocol atomically:

1. Pulls the required amount from the vault's variable-rate position
2. Deposits it into the target fixed-rate reserve
3. Delivers it to the borrower

No capital sits idle waiting for a match. Between signal and fill, the vault earns variable-rate yield. A single pool of capital can be conditionally signaled across multiple reserves simultaneously — if the `USDC 5.5% 3m` reserve fills first, the signal on `USDC 6.0% 6m` is satisfied from the same capital pool, first match wins.

> [!NOTE]
>
> Conditional Liquidity is a vault-level feature. Retail lenders depositing directly into a reserve do not post conditional signals — they provide committed liquidity to that specific reserve immediately.

## Borrow Orders

Borrowers access fixed-rate reserves through the Borrow Orders system. A Borrow Order specifies the desired debt token, rate ceiling, term, and amount. The protocol matches the order against available conditional and committed liquidity across the rate grid and fills at the best available rate up to the borrower's ceiling. See [Borrow Orders](https://kamino.com/docs/products/borrow/borrow-orders.md) for the full mechanics of order submission, partial fills, and matching logic.

## Early repayment

You can repay a fixed-rate loan at any time before the term ends, without waiting for the full term. During the **first term only**, an Early Repay Penalty may apply. The penalty compensates lenders who committed capital for the agreed duration. After a rollover into a subsequent term, there is no Early Repay Penalty.

The penalty is calculated based on the minimum interest that would have accrued had the loan run longer.

> [!NOTE]
>
> The Early Repay Penalty applies during the first term only. Once a loan rolls over into a new term, you can exit at any time without penalty.

## Rollover

A fixed-term position moves through three phases:

| Phase | Duration | What happens |
| - | - | - |
| **Active term** | The loan term (1, 3, 6, or 12 months) | Borrowing at your fixed rate. You can close at any time; an Early Repay Penalty applies during the first term. |
| **Rollover window** | Configured per market | Kamino attempts to roll the position into a new fixed-rate term at the same rate. If no fixed-rate liquidity is available, the protocol can fall back to the variable-rate reserve for the same asset (if configured). You can repay, or wait for rollover to process automatically. If neither path succeeds and you have not repaid, Auto-repay begins at the end date. |
| **Auto-repay** | Configured per market | The debt is gradually repaid using your collateral, subject to fees. |

Fixed-rate loans have a term with a defined end date, equal to `loan_start + term_duration`. New loans are created with auto-rollover on by default, and the protocol rolls the loan over into a new fixed-rate term at the end date. The new term runs in the same reserve, at the same rate the borrower already has. Auto-rollover can be turned off later from the position.

Rollover happens during a Rollover window that opens before the end date; its length is configured per market. When the reserve has liquidity, rollover completes shortly after the window opens. When there is no liquidity to roll into, the loan does not roll over, and there is no pending or in-progress state.

### How auto-rollover works

During the Rollover window, if the reserve has available liquidity and no withdrawal tickets are queued, the loan extends for another full term at the same rate. If the fixed-rate rollover does not succeed and the market has an open-term rollover window configured, the protocol attempts a **variable-rate fallback**: the position migrates into the variable-rate reserve for the same asset in the same market. If neither path succeeds, the loan does not roll over and reaches its end date.

Queued withdrawal tickets are the most common reason rollover is blocked: lenders requesting capital back take priority over loan extensions. See [Withdrawal Queue](#withdrawal-queue) below and [Concepts](https://kamino.com/docs/products/borrow/concepts.md#rollover-and-the-withdrawal-queue) for details.

When auto-rollover is on but there is no liquidity to roll into (fixed or variable), you have two options:

* **Wait** until the end of the term in case liquidity is seeded at the last moment, or
* **Close the position** before the end date to avoid Auto-repay.

### Auto-repay

A fixed-rate position that reaches its end date without rolling over is not closed in a single liquidation. Auto-repay begins at the end date and gradually repays the debt using your collateral, subject to fees, over a window configured per market, in small increments.

The Auto-repay cost ramps with time. It starts small immediately after the end date and increases across the window, so a position closed early in the window settles at a lower cost than one left to run to the end of the window. Acting promptly is materially cheaper than waiting, and closing before the end date avoids Auto-repay entirely.

> [!WARNING]
>
> Taking no action at the end date is only safe when there is liquidity for the loan to roll over. In tight liquidity conditions, a loan that cannot roll over begins Auto-repay at the end date, so confirm the state of the relevant reserves ahead of the end date and close the position if it cannot roll over.

## Withdrawal Queue

Fixed-rate reserves lock lender capital for the duration of the term — lenders cannot withdraw on demand mid-term. To exit a position before borrowers repay, lenders submit a withdrawal ticket specifying the amount they want returned. Tickets enter a per-reserve FIFO queue.

Queued tickets are filled as capital re-enters the reserve through borrower repayments and liquidations. A queued ticket also **blocks rollover for all borrowers in that reserve**, which means borrowers at maturity are forced to repay rather than extend. This is by design: lenders who have signaled intent to exit cannot be re-committed to a new term without their consent. Because the rollover block forces repayment at the next maturity wave, capital returns at the latest by the end of the reserve's term.

Borrowers planning to roll should check whether any withdrawal tickets are queued before the term ends.

> [!NOTE]
>
> Withdrawal ticket status is visible on-chain. If a reserve has queued tickets approaching your term end, plan for repayment rather than assuming rollover will succeed.

## The emerging yield curve

The rate grid is more than a product feature — it is DeFi's first live term structure for lending rates. Each populated cell represents a market-clearing price for capital at a specific duration. The difference in rate between a 3-month reserve and a 6-month reserve for the same token is the [term premium](https://kamino.com/docs/products/borrow/concepts.md#the-yield-curve-and-term-premium): the additional yield lenders require to lock capital for longer.

This structure enables real price discovery for duration risk. When demand for 6-month USDC borrowing rises, rates in 6-month reserves rise relative to 3-month reserves, signaling to the market that longer-term capital is scarce. Vaults can observe the spread across the grid and allocate conditional liquidity to the cells offering the best risk-adjusted yield for their duration tolerance.

For borrowers managing treasury exposure or structured positions, the yield curve provides a reference: you can see exactly what the market charges across all available terms before committing, and choose the duration that best matches your liability profile. Variable-rate borrowing remains available via the standard reserve for positions where term certainty is not required — see [Borrowing](https://kamino.com/docs/products/borrow/borrowing.md) for how variable-rate positions work.

> [!TIP]
>
> Fixed Rates integrates fully with [Multiply](https://kamino.com/docs/products/multiply.md). You can lock your borrow cost for the entire term of a leveraged position — turning a carry trade with variable rate risk into a predictable spread for a defined duration.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
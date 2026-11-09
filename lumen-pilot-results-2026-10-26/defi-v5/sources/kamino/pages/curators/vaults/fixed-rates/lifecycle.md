> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Lifecycle

> What your vault's capital experiences from fill through term, rollover, repayment, post-maturity liquidation, and exits via the withdrawal queue

This page traces what happens to your vault's capital from the moment a fill occurs through the loan's full term and every exit path — repayment, rollover, post-maturity liquidation, and your own queued exits. Everything below is from the **lender's perspective**.

## Before the fill — the signalled state

If you've placed a **Conditional allocation**, your capital exists as configuration on the vault. No capital has moved. Your floating allocations continue to earn variable yield. Any number of borrow demand events could match your signal — only one will, whichever lands first.

If you've placed a **Standard allocation**, your capital sits in the fixed-rate reserve immediately. It earns nothing until a borrower takes it (the rate × utilization formula gives zero at zero utilization), but it's visibly available for direct borrows.

## The fill

When a borrower takes liquidity from a fixed-rate reserve where your allocation is sourced:

* **Standard allocation path.** The borrower borrows directly against your committed liquidity. The reserve's `borrowed_amount` increases, your share of the reserve's outstanding debt grows. No tokens move at the vault level — your kTokens already represented your share of the reserve.

* **Conditional allocation path.** The crank performs three steps in a single atomic transaction: withdraws capital from an eligible source reserve (priority-respecting), deposits it into the fixed-rate reserve, executes the borrow. If any step fails, the whole transaction reverts — the vault is never left in an inconsistent state.

After a Conditional fill, automatic rebalancing (\~15 minutes) redistributes remaining floating capital to maintain target weights. The vault now holds a fixed-rate position equal to the filled amount; the floating allocations sit at slightly reduced levels until the next rebalance settles things.

## The active term

Once filled, your capital is committed to the fixed-rate reserve for the loan's term. Fixed-rate reserves run at high utilization when matched with active borrow demand — at 100% utilization, lenders earn the borrow rate net of the protocol take rate for the locked duration.

The term is set per borrow at fill time, anchored to the borrower's `last_borrowed_at_timestamp`. If the reserve's `debt_term_seconds` is 90 days, that borrower's individual maturity is 90 days from the slot of their fill — not from when the reserve was created or from when other borrowers took liquidity.

This means a single fixed-rate reserve typically holds several borrows at different stages of their terms, all maturing at different points. From your vault's perspective you hold fractional exposure to all of them, weighted by how much you sourced each fill.

Kamino's allocations UI shows current vs. target allocation separately. Your current allocation is your actual position, which may diverge from target while fixed-rate positions are locked.

## Maturity outcomes

Each borrow inside the reserve has its own maturity. As each one approaches the end of its term, one of several things happens.

### Rollover (pre-expiration)

Rollover runs inside a **pre-expiration window** configured at the market level — typically a few hours or a day before the loan's term end. A keeper bot ("Rollaz" internally) sweeps positions in their rollover windows and attempts to roll them.

| Outcome | Trigger | Vault impact |
| - | - | - |
| **Same-reserve rollover** | Liquidity available; no withdrawal tickets queued; market rollover window is open | Term clock resets. **No tokens move.** Your position stays locked in the same reserve for another full term at the same rate. |
| **Different fixed reserve** | Keeper finds a matching reserve at a different rate or duration; window is open | Loan migrates atomically. Tokens transfer between reserve vaults. Your capital stays with the original reserve unless your allocation also covers the new one. |
| **Open-term fallback** | `open_term_rollover_window_duration_seconds` configured; borrower opted in (`open_term_allowed = true`); no fixed-rate match available | Position migrates to the floating-rate reserve (same mint). Your capital stays with the original FR reserve. |

> [!NOTE]
>
> **Rollover requires a pre-expiration window.** If `fixed_term_rollover_window_duration_seconds` is `0` on the market, rollover is disabled entirely and every borrower must repay at maturity. Rollover cannot be attempted after expiration — past the term end there's no rollover path, only liquidation.

> [!WARNING]
>
> **Rollover is not supported inside elevation groups.** Borrowers using elevation modes (eMode) on the market cannot have their fixed-term positions rolled over. Factor this into your sizing if your fixed-rate allocations sit in elevation-enabled markets — those positions will require manual repayment at maturity.

### Repayment (any time)

A borrower can repay at any point before maturity, with two cases:

* **Repay during the first term, before accruing the minimum required interest.** An early-repay penalty applies — the projected interest for the remainder of the term, scaled by the reserve's `early_repay_remaining_interest_pct`. The penalty accrues entirely to **protocol fees on the debt reserve**, not to lenders. Your vault's lender yield is unaffected by the penalty mechanism itself.
* **Repay after the minimum interest threshold, or after rollover.** No penalty. Borrower pays principal + accrued interest.

Either way, repayment returns capital to the reserve. If your vault has a withdrawal ticket queued in that reserve, the repayment feeds the queue (FIFO). Otherwise it sits in the reserve as available liquidity for the next borrow or the next rebalance.

### Default — protocol-enforced liquidation

If a borrower takes no action and the term elapses, the position becomes liquidatable **regardless of collateral health**. Kamino treats an expired fixed-term loan as a protocol-level breach, not a price-driven one.

Liquidation enters a **linear ramp** configured per market via `term_based_full_liquidation_duration_secs`:

* The liquidatable fraction grows from 0% (at term end) to 100% (at `term-end + duration`).
* Liquidators claim a **deleveraging bonus** that starts at the reserve's `min_deleveraging_bonus_bps` and increases `deleveraging_bonus_increase_bps_per_day` per day, capped at `max_liquidation_bonus_bps`.
* Protocol-enforced liquidation **bypasses the reserve's deposit withdrawal caps** and explicitly consumes from the withdrawal-queue pool — so from your vault's perspective, term-breach liquidation proceeds feed queued tickets.

The same mechanism applies if the reserve itself hits its `debt_maturity_timestamp` (a reserve-wide sunset configured by the market manager) — but with no ramp; all borrows on that reserve become fully liquidatable immediately when the maturity elapses (assuming the market has `mature_reserve_debt_liquidation_enabled = true`).

## Exiting via the withdrawal queue

For ordinary floating-rate allocations, exits are usually instant: you decrease the weight, the rebalancer redeems cTokens against available reserve liquidity, capital lands back in the vault. For fixed-rate allocations, the queue is **the** exit. A Standard allocation to a high-utilization fixed-rate reserve can't be redeemed instantly because capital is committed to active borrows for the term. To exit, the vault submits a **withdrawal ticket** and waits for repayments, new deposits, or liquidations to feed liquidity to the head of the queue.

The queue is a vault-wide primitive — see [Concepts → Liquidity & withdrawals](https://kamino.com/docs/curators/vaults/concepts/liquidity-and-withdrawals.md) for FIFO mechanics, ticket lifecycle, SDK surface, REST endpoints, and the WQP bot. The FR-specific behavior follows.

### The rollover-blocking rule

The single most important FR-specific behaviour: **a queued ticket on a reserve blocks every borrower in that reserve from rolling over.** Borrowers at maturity must repay; they cannot extend their term.

This is the design rule expressed in concrete terms — lender exit takes precedence over borrower stay-in. The protocol enforces it on every rollover attempt.

Operationally, this turns the queue into a **forcing function**:

* A ticket submitted mid-term doesn't return capital immediately.
* But it guarantees capital returns at the *next maturity wave*, because affected borrowers are forced to repay.
* The reserve's queue state therefore drives the timing of borrower repayments, not just lender redemptions.

If you know you want out of a fixed-rate position by a specific date, queue ahead. The ticket sits cheaply (cancellable for free) and locks in your priority for the next cohort of repayments.

### Two flows for FR exits

**Vault-side disinvestment.** When you decrease or remove a Standard allocation to a high-utilization FR reserve, the rebalancer can't redeem capital instantly. The vault submits a withdrawal ticket against the reserve. As liquidity returns, the ticket fills and cTokens land back in the vault, where the rebalancer redeploys them per current target weights.

Important constraint: **the vault `invest` operation does not auto-queue.** If you change a weight on an FR reserve, the rebalancer attempts a normal disinvestment and stops if there's no available liquidity. To actually exit, you trigger the queue path explicitly.

**Depositor redemption with FR exposure.** When a depositor redeems vault shares from a vault with active FR allocations, the SDK orchestrator (`withdrawRedeemAndEnqueueIxs`) handles a multi-leg flow: pull whatever instant liquidity exists → redeem-in-kind for the remainder → enqueue tickets against each underlying FR reserve. This is the path Private Credit V2 uses end-to-end.

### Queue depth as a strategic signal

Queue depth tells you about *competing exit demand* on a reserve. Three patterns:

* **Deep queue, low utilization.** Tickets are queued but the reserve has available liquidity — the WQP bot is processing in real time. Healthy. Your ticket would fill quickly.
* **Deep queue, high utilization.** Tickets are queued and the reserve is fully utilized. New borrowers can't enter (lenders exiting take priority); existing borrowers can't roll. The reserve is in an unwinding phase. Adding a new allocation here means going to the back of the line.
* **No queue, high utilization.** Reserve is at full work and lenders are sticking around. New borrow demand competes with existing borrowers for repayment cycles. Conditional capacity here can fill at attractive rates.

Read queue depth alongside utilization and unfilled borrow-order demand to understand where each reserve actually sits in its cycle.

### FR-relevant SDK methods

The full SDK surface is in [Concepts → Liquidity & withdrawals](https://kamino.com/docs/curators/vaults/concepts/liquidity-and-withdrawals.md). The methods you'll reach for in an FR-active vault:

* **`withdrawRedeemAndEnqueueIxs`** — orchestrator for depositor redemptions; sends withdraw + redeem-in-kind + enqueue legs in sequence. Supports `skipWithdrawLeg` for the dust case where the instant leg would revert.
* **`KaminoReserve.getAllWithdrawTickets()`** — returns all tickets for a reserve across owners. Use to compute queue depth and ordinality for "queued before you" UX.
* **`getReserveAllocationAvailableLiquidityToWithdraw`** — per-reserve available liquidity capped by reserve availability. Decides whether a redemption needs the queue path.
* **`getMaxInstantWithdrawableAmount`** — total instant-redemption capacity across the vault's allocations.

## How interest accrues

For a fixed-rate reserve at 100% utilization, lender yield is `borrow_rate × (1 − protocol_take_rate)` for the locked term. Interest compounds per slot using the reserve's cumulative borrow rate index. From the vault's POV, your kToken exchange rate appreciates over time as accumulated interest grows the reserve's total assets — same accounting as floating reserves, no special handling.

## What's next

> **[Strategy](https://kamino.com/docs/curators/vaults/fixed-rates/strategy.md)**
>
> Postures, sizing, monitoring, and a worked example.

> **[Liquidity & withdrawals](https://kamino.com/docs/curators/vaults/concepts/liquidity-and-withdrawals.md)**
>
> The full queue primitive (FIFO mechanics, SDK surface, REST endpoints).


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
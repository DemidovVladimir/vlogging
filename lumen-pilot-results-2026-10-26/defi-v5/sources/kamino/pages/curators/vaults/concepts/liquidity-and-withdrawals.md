> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Liquidity & withdrawals

> The unallocated buffer, instant withdrawals, and the withdrawal queue — how depositor exits actually work

A vault depositor can request a withdrawal at any time. Whether that withdrawal completes immediately or has to wait depends on where the vault's capital is and how it can be unwound. This page is the model — the buffer that absorbs normal withdrawals, the rules that govern instant exits, and the **withdrawal queue** primitive that handles everything else.

## The three liquidity layers

When a depositor redeems shares, the vault tries to satisfy the request from three sources, in order:

1. **Unallocated buffer** — capital sitting idle in the vault, immediately available.
2. **Standard allocations** — capital deployed into reserves that have free liquidity (i.e. not all borrowed). The vault can pull what's available.
3. **The withdrawal queue** — for any portion that can't be served instantly. This is the exit path for capital locked in fixed-rate reserves or fully-utilized reserves.

If layers 1 + 2 cover the redemption in full, the depositor exits in a single transaction. If they don't, the vault redeems the available portion immediately and queues the rest.

## The unallocated buffer

The buffer is the simplest layer: capital that's intentionally not deployed. The vault holds it as the deposit token, available for any withdrawal request. The size is governed by two parameters:

| Parameter | Effect |
| - | - |
| `UnallocatedWeight` | Relative weight for unallocated funds; participates in the total weight calculation alongside reserve allocations |
| `UnallocatedTokensCap` | Hard cap on the buffer regardless of weight |

A typical vault holds 5–10% of total assets in the buffer. Higher buffer means more depositors exit instantly, but more capital sits unproductive. Lower buffer means more capital earning yield, but more redemptions queue.

You set `UnallocatedWeight` and `UnallocatedTokensCap` as part of allocations — see [Concepts → Allocations](https://kamino.com/docs/curators/vaults/concepts/allocations.md#unallocated-funds-the-liquidity-buffer) for the model and [Configure allocations](https://kamino.com/docs/curators/vaults/guides/configure-allocations.md) for the workflow.

## Instant withdrawals

When the vault can satisfy the redemption from buffer + reserve liquidity, the user gets the deposit token in one transaction. The vault:

1. Burns the redeeming shares from the user.
2. Pulls from the unallocated buffer first.
3. If still short, redeems cTokens from Standard allocations against reserves with free liquidity.
4. Charges the configured withdrawal penalty (returns to vault).
5. Sends the deposit tokens to the user.

A few constraints govern whether step 3 succeeds:

* **Reserve utilization.** The vault can only pull from a reserve to the extent the reserve has uncommitted capital. A 100% utilized reserve has nothing to redeem.
* **Withdrawal penalty floor.** If the available portion is below the configured `WithdrawalPenaltyLamports`, the withdraw leg reverts. The fix in this case is to skip the instant leg entirely and enqueue the full amount (the SDK exposes `skipWithdrawLeg` for this). The penalty itself is set at vault creation — see [Create a vault](https://kamino.com/docs/curators/vaults/guides/create-a-vault.md) and [Yield & fees → The withdrawal penalty](https://kamino.com/docs/curators/vaults/concepts/yield-and-fees.md#the-withdrawal-penalty).
* **Conditional allocations don't help here.** Capital "in" a Conditional allocation is actually still in the underlying floating reserve — so it counts toward instant capacity. But once a Conditional allocation has been *filled* (committed to a fixed-rate reserve), that capital is locked for the loan term.

## The withdrawal queue

When part or all of a redemption can't be served instantly, the remainder enters the **withdrawal queue**. The queue is a per-reserve FIFO that fills automatically as capital re-enters the reserve.

This is a fundamental Kamino primitive. It's used for vault depositor redemptions (the [Private Credit V2 redemption flow](https://kamino.com/docs/products/institutional-yield.md) is built on it) and for curator-side exits from fixed-rate reserve allocations. Both consume the same machinery.

### How it works

Each reserve maintains its own FIFO queue. When a withdrawal can't be served instantly:

1. The vault calls `enqueue_to_withdraw` on the relevant reserve, submitting a **withdrawal ticket** with a sequence number.
2. The ticket waits at its position in the queue.
3. As liquidity returns to the reserve (from any source — see below), the head ticket fills first. If the available liquidity covers the head ticket fully, the queue advances. If it's a partial fill, the head ticket stays at position 0 with the remainder.
4. When the user's ticket fully fills, the deposit tokens are delivered to their destination token account.

The queue is **strict FIFO**. The head ticket is determined by the reserve's `next_withdrawable_ticket_sequence_number`, enforced by the on-chain PDA seed. You cannot skip ahead.

### What feeds the queue

Three on-chain events return liquidity to a reserve:

| Source | Trigger |
| - | - |
| **Borrower repayments** | Any repay — early (with penalty if applicable), at maturity, or via a rollover that lands in a different reserve |
| **New deposits** | Standard-allocation deposits from another vault, retail supply if the reserve allows it, or rebalance settlements |
| **Liquidations** | Both regular collateral-health liquidations and protocol-enforced liquidations (term-breach, maturity-breach for fixed-rate reserves) |

When any of these lands, a permissionless **WQP bot** (Withdraw Queue Progress) calls `withdraw_queued_liquidity` against the head ticket. Anyone can run their own bot; in practice Kamino's runs reliably.

### What the queue takes precedence over

The design rule is: **lender exit takes precedence over borrower stay-in or new entry.** Concretely:

* A queued ticket **blocks rollover** for every borrower in that reserve. Borrowers at maturity must repay; they cannot extend.
* Tickets are filled before any new borrow-order fill takes liquidity.
* Tickets are filled before any regular borrow draws available capital.
* Tickets are filled before fee accrual claims would settle.

This is why a queued ticket mid-term is a *forcing function*: it doesn't return capital immediately, but it guarantees capital returns at the next maturity wave.

### Lifecycle of a ticket

```
[ submit ]                         enqueue_to_withdraw
   ↓
[ queued ]                         waiting for liquidity, sequence_number assigned
   ↓
[ partial fill ] (optional)        withdraw_queued_liquidity, head only
   ↓
[ fully filled ] OR [ cancelled ]  withdraw_queued_liquidity (final) | cancel_withdraw_ticket
```

Operational rules:

* **No notice period.** Tickets take effect immediately. Queue when you decide to.
* **Cancellation is free.** Tickets can be cancelled any time before they fully fill. Speculative queue submissions cost nothing if you change your mind.
* **Recovery for invalid tickets.** If a ticket's destination token account becomes invalid mid-queue (frozen, delegated, wrong mint), the protocol marks the ticket invalid and the head advances past it. The owner calls `recover_invalid_ticket_collateral` to retrieve their cTokens.

## Two integration paths

Vaults expose the queue through two distinct flows. Both are available in the SDK.

### Vault depositor redemption (`withdrawRedeemAndEnqueueIxs`)

The orchestrator helper for end users redeeming vault shares. Sends up to three sequential transactions:

1. **Withdraw** — pull whatever instant liquidity exists (buffer + redeemable reserve liquidity) and send to the user.
2. **Redeem-in-kind** — exchange the user's remaining shares for cTokens of the underlying reserves, proportional to vault exposure.
3. **Enqueue** — submit those cTokens as withdrawal tickets against each reserve.

The user gets a partial fill now and a queued position for the rest. As tickets fill, the deposit token lands in their destination account.

This is the path Private Credit V2 uses — its vaults are typically near 100% utilized, so almost every redemption goes through the queue.

### Curator-side disinvestment

A curator wanting to **reduce or remove** a Standard allocation to a high-utilization reserve (especially a fixed-rate reserve) faces the same constraint: the capital is locked. The vault submits a withdrawal ticket against the reserve. As liquidity returns, the ticket fills and the cTokens land back in the vault, where the rebalancer redeploys them per current target weights.

To trigger a disinvestment from a high-utilization reserve, lower the allocation's weight or cap via [Configure allocations](https://kamino.com/docs/curators/vaults/guides/configure-allocations.md). For the FR-specific view of the same flow, see [Fixed Rates → Lifecycle → Exiting via the withdrawal queue](https://kamino.com/docs/curators/vaults/fixed-rates/lifecycle.md#exiting-via-the-withdrawal-queue).

## Strategic implications

The queue isn't just an exit mechanism — once you understand its dynamics, it's a position-management lever:

* **Queue depth as a demand signal.** A reserve with deep queued tickets is one where any returning liquidity is already spoken for. Adding new allocation there means going to the back of the line.
* **Queue early as a forcing function.** If you know you want out by a given date, queue ahead. The ticket sits cheaply (cancellable for free) and locks in priority for the next repayment cycle.
* **Cancel and resubmit are free.** Manage your queue position responsively.
* **Available liquidity ≠ borrowable liquidity.** A reserve's nominal `available_liquidity` is gross; what's actually available for a *new* borrow is `available_liquidity − queued_amount`. Both numbers matter.

## Required market flags

The queue is gated by three market-level flags. A market needs all three set for the full lifecycle:

| Flag | Required for |
| - | - |
| `withdraw_ticket_issuance_enabled` | Submitting tickets via `enqueue_to_withdraw` |
| `withdraw_ticket_redemption_enabled` | Filling tickets via `withdraw_queued_liquidity` |
| `withdraw_ticket_cancellation_enabled` | Cancelling tickets |

Plus `min_withdraw_queued_liquidity_value` (default `2`), the anti-dust floor for new tickets and partial-fill remainders. These are set by market managers — see [Markets → Fixed Rates → Market Settings](https://kamino.com/docs/curators/markets/fixed-rates/market-settings.md).

## Edge cases worth knowing

* **Dust progress stalls.** If a head ticket's remainder falls below `min_withdraw_queued_liquidity_value`, the WQP bot won't fill it. The ticket stays head-of-queue until enough new liquidity arrives to clear the threshold in one shot.
* **Same-tx open-and-close prevention.** A ticket opened and closed in the same transaction is detected and rejected. This protects the [allocation priority system](https://kamino.com/docs/curators/vaults/concepts/allocations.md#priority) from being exploited.
* **Vault-owned tickets need callback support.** When a vault submits a ticket against a reserve, the on-chain `progress_callback_type` is set so vault accounting stays in sync as the ticket fills. Older kvault versions don't support this; ensure your vault is on a recent release.
* **The vault `invest` operation does not auto-queue.** If you decrease a Standard allocation's weight on a fully-utilised reserve, the rebalancer won't automatically submit a withdrawal ticket — you trigger it explicitly.

## What's next

> **[Allocations](https://kamino.com/docs/curators/vaults/concepts/allocations.md)**
>
> The allocation primitive, including the unallocated buffer.

> **[Configure allocations](https://kamino.com/docs/curators/vaults/guides/configure-allocations.md)**
>
> Operational walkthrough — adjust the unallocated buffer, increase/decrease allocations to trigger queued exits.

> **[Fixed Rates → Lifecycle](https://kamino.com/docs/curators/vaults/fixed-rates/lifecycle.md)**
>
> The FR-specific operational treatment of exits, including the rollover-blocking rule and queue-as-strategy.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
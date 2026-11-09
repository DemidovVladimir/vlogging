> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Allocations

> Standard vs. Conditional allocation applied to fixed-rate reserves — the FR-specific application of the allocation primitive

The two allocation types — Standard and Conditional — are the same primitive used everywhere in a vault. This page covers their **application to fixed-rate reserves**: which to choose, how Conditional fills behave, the priority pattern in the FR context, and the FR-specific bits of the setup workflow. For the underlying primitive (weight system, caps, the priority rule, sync mechanics), read [Concepts → Allocations](https://kamino.com/docs/curators/vaults/concepts/allocations.md) first.

## Both types work for FR reserves

It's worth being explicit: **both allocation types are valid for fixed-rate reserves.** The choice is about capital efficiency vs. visibility, not technical compatibility.

| Approach | Behavior | When to use |
| - | - | - |
| **Standard** | Capital is committed into the FR reserve immediately | You want visible committed liquidity, you're seeding a new FR reserve, or you're confident demand will arrive quickly |
| **Conditional** | Capital stays in floating-rate reserves earning variable yield; deployed atomically when borrow demand arrives | The capital-efficient default for most FR exposure |
| **Both on the same reserve** | Standard base layer + Conditional capacity behind it | You want a visible commitment plus latent capacity |

## Why Conditional is the default for FR

Two problems with putting vault capital directly into a fixed-rate reserve:

1. **Opportunity cost.** Capital sitting in a fixed-rate reserve with no active borrow earns nothing. A direct 20% allocation to `USDC 5.5% 3M` with no borrowers is 20% of the vault earning zero until a borrower arrives.
2. **Liquidity fragmentation.** Splitting capital across many fixed-rate reserves directly makes each pool shallow. Large borrowers can't find depth at any single rate × duration cell.

Conditional allocation solves both. The same pool of floating capital is signalled across multiple FR reserves — whichever fills first wins, and only that portion moves. While waiting, every dollar earns floating yield.

## How Conditional fills respond to demand

A Conditional allocation is the vault-side mechanism that converts floating capital into FR reserve liquidity at the moment demand requires it.

1. You set a Conditional allocation on a fixed-rate reserve with an **allocation cap** (e.g. 10M on `USDC 5% 3M`).
2. No capital moves at configuration time. The 10M stays in your Standard floating allocations.
3. **Demand arrives** — either a direct borrow against the FR reserve or a borrow order matching its terms.
4. The vault crank atomically withdraws capital from an eligible floating source, deposits it into the FR reserve, and the borrow executes — all in one transaction.
5. Regular rebalancing (\~15 min auto, or manual via `invest-all-reserves`) redistributes remaining floating capital back to target weights.

The trigger is *demand for fixed-rate liquidity*, not a specific borrow type. A direct borrow that finds the reserve underfunded triggers a Conditional fill the same way a borrow order does. See [Concepts → How borrowers take fixed-rate liquidity](https://kamino.com/docs/curators/vaults/fixed-rates/concepts.md#how-borrowers-take-fixed-rate-liquidity) for both demand paths.

> [!NOTE]
>
> **The same pool of capital can signal across multiple fixed-rate reserves at once.** You can set Conditional allocations on `USDC 5.0% 3M`, `USDC 5.5% 3M`, and `USDC 6.0% 6M` all drawing from the same underlying floating capital. Whichever fills first wins; remaining signals stay active against whatever floating capital remains.

## Fill race between vaults

Multiple vaults can place Conditional allocations on the same fixed-rate reserve. When demand arrives and more than one vault is eligible to satisfy it, **there is no size or time priority between vaults** — whichever vault's fill transaction lands first wins. In practice this is a race between crank bots. Operational levers: bot latency, priority fees, RPC quality, instruction construction efficiency.

Same logic applies between Standard allocations on the same reserve and Conditional capacity behind them: a borrower sees the visible Standard liquidity first, and only triggers a Conditional fill when the visible liquidity is insufficient.

## Priority in the FR context

Priority is the [allocation primitive](https://kamino.com/docs/curators/vaults/concepts/allocations.md#priority) that controls which Standard allocations are eligible as source reserves for Conditional fills. In the FR context, you use it to protect specific floating allocations from being drawn down opportunistically by FR fills.

**The rule (from Concepts):** funds flow into a Conditional allocation only from Standard allocations whose priority is **less than or equal to** the Conditional reserve's priority. Higher number = more protected.

**FR-specific worked example:**

| Allocation | Type | Priority | Eligible source for the Conditional fill? |
| - | - | - | - |
| SOL/BTC Market USDC (float) | Standard | 0 | Yes (0 ≤ Conditional's 0) |
| JLP Market USDC (float) | Standard | 0 | Yes |
| Altcoin Market USDC (float) | Standard | 2 | No (2 > Conditional's 0) |
| SOL/BTC Market USDC 5% 3M | Conditional | 0 | — (destination) |

Use cases for raising priority on a Standard allocation in an FR-active vault:

* A floating allocation in a market where you've committed to a minimum capital level (e.g. for ecosystem reasons or regulatory disclosure).
* A deep strategic position you don't want opportunistically drawn down.
* An allocation in a market where the collateral profile is materially riskier than the rest of your vault.

> [!WARNING]
>
> Priority also mitigates a specific manipulation vector: an attacker can in principle open and close a [withdrawal ticket](https://kamino.com/docs/curators/vaults/concepts/liquidity-and-withdrawals.md#the-withdrawal-queue) in the same transaction on a Conditional reserve to trigger source-reserve draw-down without real borrower demand. Setting priority above the Conditional reserve's priority on any source you want protected closes this.

## Setup

For the focused step-by-step walkthrough — UI, SDK, and CLI — see [Configure fixed-rate allocations](https://kamino.com/docs/curators/vaults/guides/configure-fixed-rate-allocations.md). It covers the FR-specific parameter choices (Conditional toggle, cap-as-binding-limit, priority for source protection) and includes runnable SDK and CLI examples.

The general allocation workflow that handles floating reserves and the unallocated buffer is at [Configure allocations](https://kamino.com/docs/curators/vaults/guides/configure-allocations.md).

## A few FR-specific gotchas

* **Conditional liquidity is a config, not an order.** You can't "cancel" a signal — lower the cap or remove the allocation.
* **Default priority = 0 for everything.** Conditional allocations don't protect Standard sources by default; opt in explicitly.
* **Weight is silently ignored on Conditional.** Setting a weight has no effect; only the cap matters.
* **Reserve config changes have a \~4-hour lock.** If a market manager changes the reserve's rate or term, the change isn't live for \~4 hours. Relevant when you're watching a reserve's config shift.

## What's next

> **[Configure fixed-rate allocations](https://kamino.com/docs/curators/vaults/guides/configure-fixed-rate-allocations.md)**
>
> The focused step-by-step walkthrough for adding an FR allocation.

> **[Lifecycle](https://kamino.com/docs/curators/vaults/fixed-rates/lifecycle.md)**
>
> What happens after a fill — through term, rollover, repayment, exits via the queue.

> **[Configure allocations](https://kamino.com/docs/curators/vaults/guides/configure-allocations.md)**
>
> The general allocation workflow (floating reserves and the unallocated buffer).

> **[Allocations (primitive)](https://kamino.com/docs/curators/vaults/concepts/allocations.md)**
>
> Weights, caps, sync, the priority rule.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Allocations

> How vault capital is distributed across reserves — Standard vs. Conditional, weights, caps, priority, and the rebalancing model

The allocation strategy is the single most important configuration on a vault. It tells the vault how much capital to deploy into each reserve and under what conditions. This page covers the model. For step-by-step setup, see [Configure allocations](https://kamino.com/docs/curators/vaults/guides/configure-allocations.md).

## What an allocation is

An allocation is a configuration entry on the vault that names one reserve and specifies how the vault should treat it. Each allocation has four parameters:

| Parameter | Type | Role |
| - | - | - |
| `target_allocation_weight` | Integer | Relative share of vault capital, used by Standard allocations |
| `allocation_cap` | Token amount | Hard ceiling on tokens deployed into this reserve |
| `reserve_type` | `Standard` \| `Conditional` | Allocation behavior — covered below |
| `priority` | Integer | Controls source-reserve eligibility for Conditional fills |

A vault holds multiple allocations. Together they define the target distribution.

## Standard vs. Conditional

The allocation type governs *when* the vault deploys capital into the reserve.

### Standard

Capital is deployed into the reserve immediately and continuously, sized by weight (subject to cap). This is the default behavior — it matches how lending vaults have always worked. Use Standard for floating-rate reserves where you want capital actively earning the moment it lands.

### Conditional

Capital is **not** deployed at configuration time. The allocation is a *signal* — a declaration that the vault is willing to deploy up to the cap into this reserve when there's borrow demand for it. The capital stays in the vault's other Standard allocations earning yield until a borrower needs it. When demand arrives, the vault atomically pulls from a Standard allocation, deposits into the target reserve, and the borrow executes — all in one transaction.

Use Conditional for fixed-rate reserves where you want to offer capacity without committing capital that might sit idle. The full FR treatment is in [Fixed Rates → Allocations](https://kamino.com/docs/curators/vaults/fixed-rates/allocations.md).

### Comparison

| Aspect | Standard | Conditional |
| - | - | - |
| Behavior | Capital deployed per weight, immediately | Capital signalled, deployed atomically when demand arrives |
| Weight handling | Weight determines share | Weight ignored; only cap matters |
| Liquidity in the reserve | Visible immediately | Invisible until a fill triggers |
| Opportunity cost | Earns whatever the reserve yields (zero if no borrower) | Zero — capital earns floating yield until matched |
| Best for | Floating-rate reserves | Fixed-rate reserves |
| Default priority | Normal | Higher priority (on-demand fill) |

You can mix both on the same reserve — a Standard base layer of visible liquidity with Conditional capacity behind it.

## The weight system

Standard allocations use **relative integer weights**, not percentages. A reserve's share of vault capital is its weight divided by the total weight of all Standard allocations plus the unallocated weight.

```
reserve allocation % = (reserve_weight / total_weight) × 100
total_weight = sum(standard_allocation_weights) + unallocated_weight
```

**Example:**

| Reserve | Weight | Share |
| - | - | - |
| SOL/BTC Market USDC | 500 | 50% |
| JLP Market USDC | 300 | 30% |
| Altcoin Market USDC | 200 | 20% |
| **Total** | **1,000** | **100%** |

Weights are integer-only; they are meaningful only relative to each other. Weights of `100/300/600` and `1/3/6` give identical distributions.

Conditional allocations have weights but **the weight is ignored**. The cap is the binding limit.

## The allocation cap

The cap is a hard ceiling on the amount of tokens the vault will deploy into a single reserve, independent of weight. If the weight implies more than the cap, allocation stops at the cap and excess flows to other allocations per their weights.

**Example:**

* Reserve weight: 500 (50% of total weight 1,000)
* Vault size: 1M USDC
* Cap: 200K USDC
* **Result:** 200K allocated. The remaining 300K (the weight-implied excess) redistributes across the other allocations.

Use caps for risk control — bound exposure to any single reserve or market.

For Conditional allocations, the cap is the **only** binding limit (since weight is ignored).

To set or change weight and cap on any allocation, see [Configure allocations](https://kamino.com/docs/curators/vaults/guides/configure-allocations.md).

## Priority

Priority controls which Standard allocations are eligible as source reserves when a Conditional fill executes.

**The rule:** capital flows into a Conditional allocation only from Standard allocations whose priority is **less than or equal to** the Conditional reserve's priority.

Higher priority number = more protected. All allocations default to priority `0`. To carve out a Standard allocation that should never be drawn down by Conditional fills, give it a priority above the Conditional allocation's priority.

**Example:**

| Allocation | Type | Priority | Eligible as source for the Conditional fill? |
| - | - | - | - |
| SOL/BTC Market USDC | Standard | 0 | Yes (0 ≤ Conditional's 0) |
| JLP Market USDC | Standard | 0 | Yes |
| Altcoin Market USDC | Standard | 2 | No (2 > Conditional's 0) |
| SOL/BTC Market USDC 5% 3M | Conditional | 0 | — (this is the destination) |

The Altcoin allocation is protected. The Main and JLP allocations are eligible sources. Set priority on any allocation via [Configure allocations](https://kamino.com/docs/curators/vaults/guides/configure-allocations.md).

> [!WARNING]
>
> **Why priority exists.** Conditional reserves can in principle be manipulated — an attacker can open and close a withdrawal ticket in the same transaction to trigger source-reserve draw-down without any real borrower demand. Priority is the mitigation. Set priority above the Conditional reserve's priority on any source you want protected from this vector.

## Unallocated funds (the liquidity buffer)

Not every dollar in the vault should be deployed into reserves. The vault holds an **unallocated buffer** — capital that sits idle, available to service withdrawals without triggering reserve rebalancing.

| Parameter | Type | Description |
| - | - | - |
| `UnallocatedWeight` | Integer | Relative weight for unallocated funds; participates in total weight |
| `UnallocatedTokensCap` | Token amount | Hard cap on the unallocated amount |

**Example:**

* Total vault: 10M USDC
* `UnallocatedWeight`: 80 (8% of total weight 1,000)
* `UnallocatedTokensCap`: 2M USDC
* **Result:** Target 800K unallocated. If vault grows and 8% would exceed 2M, capped at 2M.

The buffer trades yield for instant liquidity. A higher buffer means depositors can withdraw without queuing; a lower buffer means more capital is earning. Adjust the buffer at [Configure allocations](https://kamino.com/docs/curators/vaults/guides/configure-allocations.md); see [Liquidity & withdrawals](https://kamino.com/docs/curators/vaults/concepts/liquidity-and-withdrawals.md) for how the buffer interacts with the withdrawal queue.

## Sync and rebalance

Allocations are **targets**, not absolute state. The actual allocation drifts from target as deposits land, withdrawals leave, interest accrues, and Conditional fills move capital. A **sync** brings the vault back into alignment.

* **Permissionless.** Anyone can call sync; it's not a privileged operation.
* **Automatic.** A bot runs sync every \~15 minutes across all vaults.
* **Manual.** You can trigger sync immediately when needed (e.g. just after changing allocations) — see [Configure allocations → Sync after changes](https://kamino.com/docs/curators/vaults/guides/configure-allocations.md#sync-after-changes).
* **Best-effort.** Sync may not reach the exact target distribution if the source reserve has insufficient available liquidity to deallocate from.
* **Capped invest.** `invest_with_max_amount` is an `invest` variant: weights and allocation caps still determine whether funds move into or out of the reserve, but the caller can cap the amount moved toward that target. This allows partial fund movement in the target direction when the full rebalance amount is not currently available.

Sync is also what executes Conditional fills when borrow demand arrives — though those fills also happen atomically inside the borrowing transaction, not just on the sync cadence.

## What an allocation can't do

A few constraints worth knowing:

* The deposit token is set at vault creation and is immutable. You can only allocate to reserves that match this token.
* Removing an allocation doesn't necessarily move the capital out immediately — if the underlying reserve is illiquid, the deallocation queues through the withdrawal queue.
* You can't allocate to a reserve that isn't whitelisted if [Whitelisted Reserves](https://kamino.com/docs/curators/vaults/concepts/risk-primitives.md) is enabled.

## What's next

> **[Configure allocations](https://kamino.com/docs/curators/vaults/guides/configure-allocations.md)**
>
> Add, edit, and remove reserve allocations via UI, SDK, or CLI.

> **[Liquidity & withdrawals](https://kamino.com/docs/curators/vaults/concepts/liquidity-and-withdrawals.md)**
>
> The buffer, instant withdrawals, and the queue.

> **[Fixed Rates → Allocations](https://kamino.com/docs/curators/vaults/fixed-rates/allocations.md)**
>
> The FR-specific application of Conditional allocation.

> **[Parameters](https://kamino.com/docs/curators/reference/parameters.md)**
>
> Full parameter reference.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
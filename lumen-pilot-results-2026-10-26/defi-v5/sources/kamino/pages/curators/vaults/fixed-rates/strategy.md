> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Strategy

> Allocation postures, sizing framework, monitoring cadence, and a worked vault example

This page is for curators who've internalised the mechanics ([Concepts](https://kamino.com/docs/curators/vaults/fixed-rates/concepts.md), [Allocations](https://kamino.com/docs/curators/vaults/fixed-rates/allocations.md), [Lifecycle](https://kamino.com/docs/curators/vaults/fixed-rates/lifecycle.md)) and want a framework for deploying capital.

## Reading demand on the rate grid

Demand for fixed-rate liquidity shows up in two places, and you should watch both.

**Reserve activity** is the realised half: how much capital is being borrowed against each fixed-rate reserve, what the utilization is, and how quickly capital is turning over. Active reserves with healthy utilization tell you where the market is clearing. Watch for reserves that fill quickly after each fill — that's a signal capacity is undersupplied.

**Unfilled borrow orders** are the latent half: borrowers expressing standing intent at specific rate × duration cells without matching reserve liquidity to fill them yet. A persistent 40M of unfilled order demand at `5.5% / 6M` is a clear signal — adding capacity (Conditional or Standard) lets your vault be the source that fills them.

Use both together: reserve activity shows what's working today, the order book shows what the market wants tomorrow. For the data sources behind both signals, see [Data & API](https://kamino.com/docs/curators/data/vault-data.md) and [Allocation data](https://kamino.com/docs/curators/data/allocation-data.md).

## Allocation postures

### Conservative posture

* 80–90% in Standard floating allocations across diversified markets
* 1–2 Conditional allocations on well-understood fixed-rate reserves
* Tight caps — 5–10% of vault per fixed-rate reserve
* Review weekly; adjust caps as demand shifts

Best for: stable depositor base, low tolerance for exit friction, vaults optimising for consistency over yield.

### Yield-optimising posture

* Conditional placements across multiple rate × duration cells
* Larger caps — 20–30% of vault in aggregate across fixed-rate reserves
* Active daily monitoring of the borrow-order book and reserve activity
* Strategic priority use to protect key floating sources
* Bot infrastructure to win fill races against competing vaults

Best for: sophisticated allocators, active depositor base that understands duration exposure, vaults where yield leadership is the mandate.

## Sizing framework — the maturity mismatch budget

Your depositors can demand liquidity at any time. Your fixed-rate positions can be locked for weeks to months. Work out your budget:

1. **Buffer.** Unallocated + deep floating capital sufficient to service normal withdrawal flow.
2. **Fixed-rate ceiling.** Maximum fraction of vault that can be in fixed-rate exposure at any time.
3. **Queue runway.** Worst-case exit time through the [withdrawal queue](https://kamino.com/docs/curators/vaults/fixed-rates/lifecycle.md#exiting-via-the-withdrawal-queue) given each reserve's repayment patterns.

A common starting split: 5–10% unallocated buffer, 70–85% Standard floating, 10–25% Conditional across fixed-rate reserves. Adjust based on observed depositor flow.

## Selection heuristics

* **Target the tails of the grid.** Longer-duration reserves command higher term premium. If your depositor profile tolerates the duration, the marginal yield is there.
* **Follow unfilled demand.** Large, persistently unfilled borrow orders at a specific rate × duration are a direct signal to add capacity.
* **Mind reserve concentration.** Multiple Conditional allocations at different cells all drawing from the same floating capital is capital-efficient — you're not fragmenting depth.
* **Protect strategic sources.** Any floating allocation you want preserved as a minimum should be priority-elevated.
* **Mix Standard and Conditional thoughtfully.** Use Standard to bootstrap visible liquidity in reserves where you want to anchor; use Conditional for the rest of your fixed-rate exposure to keep capital efficient.
* **Use the withdrawal queue as a forcing function.** A queued ticket blocks rollovers in the reserve, so capital is guaranteed to return at the next maturity wave. See [Lifecycle → Exiting via the withdrawal queue](https://kamino.com/docs/curators/vaults/fixed-rates/lifecycle.md#exiting-via-the-withdrawal-queue).

## Monitoring cadence

| Cadence | What to watch |
| - | - |
| Per crank cycle (\~15 min) | Allocation state matches target |
| Daily | Unfilled demand on the order book; utilization on FR reserves you're positioned in; active fills |
| Weekly | Maturity dates on held positions; queue depth; competing vault activity |
| Per fill | Was the fill expected? Did the right source reserve drain? Any unexpected re-entry? |

## Worked example — diversified USDC vault

A \$100M USDC vault running a mixed floating + fixed-rate strategy, blending Standard and Conditional allocations:

| Allocation | Type | Weight | Cap | Priority |
| - | - | - | - | - |
| SOL/BTC Market USDC (float) | Standard | 500 | No cap | 0 |
| JLP Market USDC (float) | Standard | 300 | \$30M | 0 |
| Altcoin Market USDC (float) | Standard | 200 | \$15M | 2 |
| SOL/BTC Market USDC 5% 3M | Standard | 100 | \$5M | 0 |
| SOL/BTC Market USDC 5% 3M | Conditional | — | \$15M | 0 |
| SOL/BTC Market USDC 5.5% 3M | Conditional | — | \$15M | 0 |
| SOL/BTC Market USDC 6% 6M | Conditional | — | \$10M | 0 |

**What this vault does:**

* Standard floating weights distribute the bulk of capital 5/3/2 across Main, JLP, and Altcoin markets — respecting the caps on JLP and Altcoin.
* The `5% 3M` reserve has both a \$5M Standard allocation (visible, immediately available for direct borrows) and a \$15M Conditional allocation (latent capacity that activates on bigger demand). Total potential exposure: \$20M.
* The `5.5% 3M` and `6% 6M` reserves are pure Conditional — visible capacity only when demand actually arrives.
* The three Conditional allocations together signal up to \$40M of fixed-rate capacity, all drawing from the same underlying floating capital. Whichever fills first wins.
* Altcoin Market floating allocation (priority 2) is **protected** from Conditional fills.
* SOL/BTC Market and JLP Market floating allocations (priority 0) are eligible sources for Conditional fills.

**A \$15M direct borrow lands on SOL/BTC Market `5% 3M`:**

1. Borrower's transaction sees \$5M of visible Standard liquidity in the reserve, plus \$15M of Conditional capacity behind it. Total available: \$20M.
2. The borrow takes the \$5M Standard liquidity first, then triggers a Conditional fill for the remaining \$10M, atomically pulled from SOL/BTC Market floating.
3. After the rebalance settles (\~15 min), the vault's actual allocations adjust toward target weights given the now-locked \$15M position.

**If the borrower repays at maturity:**

The \$15M returns to the `5% 3M` reserve. If there's a queued withdrawal ticket against that reserve, it fills first. Otherwise the regular rebalance pulls capital back into the Standard weights.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
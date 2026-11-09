> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Borrow Orders

> Standing borrow orders that fill automatically as liquidity becomes available

Borrow Orders are standing requests to borrow a specified asset that fill automatically as liquidity enters the market. In supply-constrained pools, borrow demand regularly exceeds available supply — without automation, users must either monitor availability continuously or run bots to capture liquidity the moment it appears. A Borrow Order removes that requirement: you specify the asset, amount, and expiry, and the protocol fills the order automatically whenever matching supply is available. Interest does not accrue on unfilled portions — it begins only when each portion fills.

## How orders fill

Orders fill as liquidity becomes available in the target market. A single order can fill incrementally across multiple transactions — a \$300,000 order might fill in \$50,000 chunks as separate deposits enter the pool. Each filled portion begins accruing interest immediately and the borrowed funds are sent directly to your wallet at the time of fill. The unfilled remainder stays open until it fills, expires, or you cancel it.

Fill ordering is random. There is no priority by order size, submission time, or any other factor — the first transaction to execute the fill wins. This means large orders receive no advantage, and older orders have no queue position.

> [!NOTE]
>
> Interest starts accruing on each filled portion at the slot it fills. An unfilled order has zero interest cost regardless of how long it has been open.

## Post-fill LTV

Post-fill [LTV](https://kamino.com/docs/products/borrow/concepts.md#ltv--the-three-values) is the governing constraint for all Borrow Order operations. It is calculated as:

```
Post-fill LTV = (Active borrow + Total open order amount) / Collateral value
```

The system treats all open orders as if they will fill simultaneously. A **5% buffer** is enforced: post-fill LTV cannot exceed `Max LTV − 5%`. This determines how much additional borrowing capacity you have available for new orders:

```
Maximum new order capacity = Max LTV − 5% − Current LTV
```

The buffer exists because if post-fill LTV were at Max LTV and collateral prices dropped, any fills executing at that moment would make the position immediately liquidatable. The 5% margin provides a safety window between the worst-case fill scenario and the liquidation threshold.

Post-fill LTV is distinct from the Current LTV shown in your position overview:

| Metric | What it includes | Used for |
| - | - | - |
| Current LTV | Active borrow ÷ collateral value | Liquidation health, position display |
| Post-fill LTV | (Active borrow + all open orders) ÷ collateral value | Order capacity, collateral withdrawal limits |

Current LTV is not affected by open orders. Only filled borrows contribute to it.

**Collateral withdrawals are also gated by post-fill LTV.** You cannot withdraw collateral if doing so would push post-fill LTV above `Max LTV − 5%`. The restriction is evaluated against the worst case — all open orders filling after the withdrawal. See [Borrowing](https://kamino.com/docs/products/borrow/borrowing.md) for a full explanation of LTV ratios.

> [!WARNING]
>
> Collateral withdrawals are blocked if the withdrawal would push post-fill LTV above Max LTV minus 5%, even if your current active borrow leaves substantial headroom.

## Collateral price drops

If the value of your collateral falls, open orders are not automatically reduced or cancelled — they remain at their original amount. However, the system will not execute a fill that would breach the post-fill LTV limit. If a fill would push post-fill LTV above `Max LTV − 5%`, the order simply does not fill until conditions change.

If collateral value recovers or you add more collateral, the order becomes fillable again at its original amount — no action is required on your part.

## Order management

You can have **one open Borrow Order per debt asset per obligation**. Partial fills, amount adjustments, and expiry adjustments cover all management needs without requiring multiple concurrent orders.

| Action | Behavior |
| - | - |
| Cancel order | Removes the unfilled portion. Any filled portions remain as active borrows. No fees. |
| Adjust amount | Increase or decrease the unfilled order amount, subject to post-fill LTV constraints. |
| Adjust expiry | Change the expiry date on an open order. |

On expiry, the unfilled portion is removed automatically. Any portions that filled before expiry remain as active borrows and continue accruing interest normally. There are no fees or penalties for expired orders.

## Fixed-rate borrow orders

Borrow Orders are also the mechanism for requesting fixed-rate loans. In the fixed-rate context, an order includes a target rate and term alongside the borrow amount. When [Conditional Liquidity](https://kamino.com/docs/products/borrow/concepts.md#conditional-liquidity--the-key-innovation) exists at matching terms, the fill is atomic. When no matching liquidity exists, the order remains open as visible demand that vault managers can observe and fill. This means a fixed-rate borrow order functions both as an execution instruction and as a price signal to the supply side of the market. See [Fixed Rates](https://kamino.com/docs/products/borrow/fixed-rates.md) for mechanics and rate negotiation details.

→ See [Concepts](https://kamino.com/docs/products/borrow/concepts.md#borrow-orders) for a full explanation of how fixed-rate Borrow Orders work, including partial fills, random fill order, and the relationship with Conditional Liquidity.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
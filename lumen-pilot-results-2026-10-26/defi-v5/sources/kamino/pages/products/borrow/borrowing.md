> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Borrowing

> How borrowing works on Kamino — collateral, LTV, interest, and repayment

## Overcollateralized model

All positions on Kamino Borrow are [overcollateralized](https://kamino.com/docs/products/borrow/concepts.md#overcollateralized-lending). You cannot borrow more than your collateral is worth, and there are no unsecured loans. The protocol continuously monitors the ratio of your debt to your collateral value, and positions that breach [liquidation thresholds](https://kamino.com/docs/products/borrow/concepts.md#liquidation-mechanics) become eligible for liquidation. This model means every dollar of borrowing is backed by more than a dollar of collateral at all times.

## LTV ratios

Three [LTV](https://kamino.com/docs/products/borrow/concepts.md#ltv--the-three-values) ratios govern every position:

* **Current LTV** — Your actual debt-to-collateral ratio at any moment. This is used to assess position health and determine how close you are to liquidation.
* **Max LTV** — The maximum LTV at which you can open or add to a borrow position. Acts as a buffer between normal operation and the liquidation threshold.
* **Liquidation LTV** — The threshold at which your position becomes eligible for liquidation. Always higher than Max LTV, providing a window between the borrowing ceiling and forced liquidation.

For example, SOL collateral might have Max LTV = 75% and Liquidation LTV = 80%. You can borrow up to 75% of your SOL value, but your position isn't liquidatable until the ratio reaches 80%.

## Borrow Factors

[Borrow Factors](https://kamino.com/docs/products/borrow/concepts.md#borrow-factors) adjust your effective borrowing capacity based on the risk profile of the asset you are borrowing. Stable, liquid assets like USDC carry a Borrow Factor of 1 — no adjustment applied. Higher-risk assets carry Borrow Factors above 1, which reduce the capacity you can borrow against a given amount of collateral.

The formula governing borrow capacity is:

```
Borrow Capacity = (Collateral Value × Max LTV) / Borrow Factor
```

With \$100 of SOL collateral and Max LTV of 80%:

| Debt Asset | Borrow Factor | Available to Borrow |
| - | - | - |
| USDC | 1 | \$80 |
| BONK | 2 | \$40 |

Borrow Factors also affect the effective Liquidation LTV for a position. Positions holding higher-BF debt assets will be liquidatable at a lower actual debt value than the headline Liquidation LTV suggests — the Borrow Factor compresses the safety margin from both sides.

## Interest

Interest accrues continuously on all outstanding debt. Rates are variable and determined by the [utilization](https://kamino.com/docs/products/borrow/concepts.md#how-variable-rates-work) of the lending pool — as more of a pool's liquidity is borrowed, the rate rises. Your debt balance grows over time, which means the health of your position can deteriorate even if collateral prices remain flat.

> [!WARNING]
>
> Interest rates are variable. If borrow rates rise significantly or collateral value falls, your position will move toward liquidation without any action on your part. Monitor your positions regularly and maintain a buffer below Max LTV.

For a full explanation of how rates are calculated, see [Fees & Interest Rates](https://kamino.com/docs/products/borrow/fees.md).

## Repay with Collateral

Kamino lets you repay debt using your deposited collateral directly, without needing to source the repayment token externally. The protocol uses Kamino Swap to convert a portion of your collateral into the debt asset and repays the loan in a single atomic transaction. This is useful for deleveraging a position when you do not hold the borrowed asset elsewhere — you can reduce exposure and improve position health without needing to move funds in from outside.

## Multiple assets

In Cross Mode, a single position can hold multiple collateral assets and multiple debt assets simultaneously. Position health is assessed across all assets combined, meaning your combined collateral value is measured against your combined debt. This allows more flexible capital use, but also means that a decline in any single collateral asset affects the health of the whole position. See [Markets](https://kamino.com/docs/products/borrow/markets.md) for a full explanation of Cross Mode vs. Isolated Mode.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
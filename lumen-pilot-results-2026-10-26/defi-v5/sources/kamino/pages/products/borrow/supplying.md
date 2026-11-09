> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Supplying

> How supplying assets into Kamino Borrow works

## Pool mechanics

When you supply an asset, it enters a shared liquidity pool alongside all other lenders of that asset. Borrowers draw from this pool and pay interest on their outstanding debt. As a lender, you earn a proportional share of that interest — your share of the pool determines your share of the yield. There is no lender-borrower matching; the pool itself intermediates.

## kTokens

On deposit you receive kTokens — for example, kUSDC or kSOL — that represent your claim on the pool. These are standard fungible tokens and can be transferred or used as collateral for other positions within Kamino. When you withdraw, you redeem your kTokens for the underlying asset plus all interest that has accrued since deposit.

> [!NOTE]
>
> The exchange rate between kTokens and the underlying asset increases monotonically over time. As borrowers pay interest into the pool, each kToken becomes redeemable for a larger amount of the underlying asset. Your kToken balance does not change — your yield is entirely expressed through the appreciating exchange rate.

## How your yield is calculated

Supply APY is a function of two variables: the borrow rate and the [utilization](https://kamino.com/docs/products/borrow/concepts.md#how-variable-rates-work) ratio.

```
Supply APY ≈ Borrow Rate × Utilization
```

If borrowers are paying 8% and the pool is 70% utilised, lenders earn approximately 5.6%. The remaining 30% of capital is idle and earns nothing, which dilutes the aggregate return. This is why high-utilization pools offer better supply yields — a greater fraction of the deposited capital is actively deployed earning interest.

## Utilization

[Utilization](https://kamino.com/docs/products/borrow/concepts.md#how-variable-rates-work) is the ratio of borrowed assets to total deposited assets in a reserve. It is the primary input to Kamino's interest rate model. When utilization is high, borrow rates rise — this simultaneously discourages new borrowing and attracts new supply, pushing utilization back down. When utilization is low, borrow rates fall — this stimulates borrowing and may prompt lenders to redeploy capital elsewhere. The [interest rate curves](https://kamino.com/docs/products/borrow/concepts.md#the-interest-rate-curve-and-the-kink) are parameterised to keep each reserve operating within a target utilization band, balancing competitive supply yields against adequate withdrawal liquidity.

## What Supply APY includes and excludes

The Supply APY figure reflects only interest paid by borrowers and passed through to lenders. It does not include KMNO emissions, external token incentives, or farm reward programs. Where such programs exist for a given reserve, they are displayed separately and stack on top of the base supply APY.

## Withdrawal liquidity

You can withdraw at any time as long as the pool has available liquidity — that is, not all deposited assets are currently borrowed. Kamino's interest rate curves are designed to prevent full utilization from persisting: as utilization approaches 100%, rates escalate sharply, creating strong economic pressure for borrowers to repay and new lenders to deposit before the pool is exhausted. In practice this means a buffer of idle capital is maintained in all healthy reserves, and withdrawals are available under normal conditions.

→ See [Concepts](https://kamino.com/docs/products/borrow/concepts.md#the-interest-rate-curve-and-the-kink) for a full explanation of how the interest rate curve and kink work.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
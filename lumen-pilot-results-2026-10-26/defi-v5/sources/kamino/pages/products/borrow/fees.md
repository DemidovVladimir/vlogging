> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Fees & Interest Rates

> How interest rates are determined on Kamino Borrow — utilization curves, spreads, and liquidation penalties

## How interest rates work

Kamino uses [utilization](https://kamino.com/docs/products/borrow/concepts.md#how-variable-rates-work)-based [interest rate curves](https://kamino.com/docs/products/borrow/concepts.md#the-interest-rate-curve-and-the-kink). Utilization is the ratio of borrowed assets to total deposited assets in a reserve — if a pool holds \$1,000 and \$700 is borrowed, utilization is 70%. As utilization rises, the borrow rate rises with it: low utilization means cheap borrowing, which attracts demand; high utilization means expensive borrowing, which pressures borrowers to repay and attracts new lenders. The curves are parameterised so that each reserve self-corrects toward a target utilization band. As utilization approaches 100%, rates escalate sharply to prevent full pool depletion and ensure lenders retain the ability to withdraw.

## Lender yield vs. borrow rate

Lenders do not earn the full borrow rate. The supply APY is:

```
Supply APY ≈ Borrow Rate × Utilization
```

If borrowers pay 8% and utilization is 70%, lenders earn approximately 5.6%. The idle 30% of capital earns nothing and dilutes the aggregate return. This spread between borrow rate and supply APY is the structural cost of instant liquidity — by maintaining a buffer of undeployed capital, the pool guarantees lenders can exit at any time without waiting for borrowers to repay.

## Interest rate spreads

The protocol retains a portion of interest paid by borrowers. This spread is taken from the borrow rate before it is passed through to lenders, and it varies by market and asset.

| Asset(s) | Market | Protocol Spread |
| - | - | - |
| SOL | SOL/BTC Market | 11% |
| USDC | SOL/BTC Market | 15% |
| USDT | SOL/BTC Market | 15% |
| mSOL, JitoSOL, bSOL | SOL/BTC Market | 15% |
| wETH | SOL/BTC Market | 15% |
| tBTC | SOL/BTC Market | 15% |
| USDC | JLP Market | 20% |
| USDC | Altcoins Market | 20% |

> [!NOTE]
>
> Spreads are expressed as a percentage of interest paid by borrowers — not as a percentage of principal. A 15% spread on a 10% borrow rate means lenders receive 8.5%, not 10%.

## Liquidation Bonus

When a position is liquidated, the liquidator receives a bonus paid in collateral on top of the amount needed to repay the debt. The bonus is dynamic and scales with how far the position's LTV has breached its Liquidation LTV threshold:

* **At the threshold**: the bonus equals the per-reserve minimum (e.g., 2% for a major asset).
* **Deeper breach**: the bonus scales upward, matching the distance between current LTV and Liquidation LTV, up to the per-reserve maximum.
* **Near 100% LTV**: a solvency cap reduces the bonus so that liquidation does not push the position further toward insolvency.

Each liquidation can close up to **20%** of the position's debt. If LTV exceeds the market's insolvency-risk threshold (typically 95%), the entire position can be liquidated at once.

For the borrower, prompt liquidation is the better outcome: a position resolved just past the threshold incurs only the minimum bonus. A position that deteriorates further faces larger bonuses and, near the insolvency-risk threshold, full liquidation. See [Liquidations](https://kamino.com/docs/products/borrow/liquidations.md) for the full mechanics and a worked example.

## No other fees

There are no deposit fees, withdrawal fees, or origination fees on Kamino Borrow. The only costs to borrowers are interest on outstanding debt and, if applicable, liquidation penalties on unhealthy positions.

> [!TIP]
>
> Fixed Rates offers an alternative to utilization-based rates. For borrowers who need rate certainty, see [Fixed Rates](https://kamino.com/docs/products/borrow/fixed-rates.md).

→ See [Concepts](https://kamino.com/docs/products/borrow/concepts.md#the-interest-rate-curve-and-the-kink) for a deeper explanation of the rate curve, the kink, and how utilization governs lender yield.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Tips for Avoiding Liquidation

> How leverage, borrow rates, and collateral affect liquidation risk, and how to stay clear of it.

Multiply simplifies leveraged strategies, but leverage cuts both ways. Keep these points in mind to manage liquidation risk.

## Leverage amplifies losses, not just gains

Multiply amplifies downside as well as upside. If the strategy performs poorly, losses can be larger and happen faster than in an unleveraged position.

## Watch your borrow rate

Every Multiply position carries variable-rate debt. If borrow demand rises and rates climb, profitability can fall or turn negative. For some strategies, this is the main risk.

## Keep your LTV below the liquidation threshold

If your position's LTV rises above its liquidation threshold, part of the position is liquidated until it returns to a healthier LTV. How much room you have depends on the strategy type:

* **LST, RWA, and stablecoin strategies**: collateral is generally pegged or closely linked to the debt token, so liquidation risk mainly comes from elevated borrow rates over time (closer to a carry trade).
* **Directional strategies** (e.g. JLP, xStocks): collateral is not pegged to the debt token, so risk comes from both rising borrow costs and the collateral price falling (closer to a leveraged long).

## Know your strategy type

Not all Multiply positions behave the same way. Some are mainly exposed to borrow rate spread, others also to the collateral's price movement. Understand which type you are using before opening a position.

For the full mechanics behind Multiply, including leverage structures, eMode, Net APY, and liquidation behavior, see the [Kamino Multiply docs](https://kamino.com/docs/products/multiply.md).


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
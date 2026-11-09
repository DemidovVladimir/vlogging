# Reserve

A **reserve** is an instance of a token within an Aave [liquidity
pool](./liquidity-pool). Each reserve is governed by a set of parameters that
manage risk and optimise liquidity. These parameters can vary across different
markets, even for the same underlying token, allowing Aave to adapt to various
network and pool conditions.

## Key Reserve Parameters

1. **Loan-to-Value (LTV)**: The maximum amount that can be borrowed relative to the collateral’s value. For example, a 75% LTV allows borrowing 75% of the collateral’s value. An asset with an LTV of 0% cannot be enabled as collateral.
2. **Liquidation Threshold**: Defines the point at which a position becomes at risk of liquidation. If the threshold is exceeded, the position could be liquidated to repay the borrower's debt.
3. **Borrowing Enabled**: Determines whether liquidity of a reserve can be borrowed.
4. **Caps**: Supply and Borrow caps limit the total amount of a token that can be supplied and borrowed from a reserve. These caps are crucial for maintaining liquidity and preventing overexposure during volatile market conditions​.
5. **Interest Rate Model**: Interest rates in Aave adjust dynamically based on the utilisation of the liquidity pool. As more liquidity is borrowed, interest rates rise to reflect the reduced availability of assets, creating conditions that enough liquidity remains for withdrawals and liquidations. The rates are controlled by parameters that set the base rate and slopes for utilisation​.

## Dynamic Parameters and Governance

The parameters for each reserve are not fixed; they vary between markets and can change over time as Aave Governance monitors market conditions and adjusts settings accordingly. For example, the same underlying token, such as ETH, might have different LTVs or interest rates in Ethereum versus Polygon markets. These adjustments are made to optimise liquidity and risk management for each market. Governance proposals allow the community to vote on changes, such as raising borrow caps or adjusting LTVs, enabling reserves to remain aligned with current market dynamics.

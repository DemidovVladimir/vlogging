# Liquidity Pool

A **liquidity pool** is an Aave market instance that
enables users to participate as suppliers or borrowers. Governance-approved
parameters, such as reserve configurations and collateralization thresholds,
define each pool. Suppliers provide liquidity into the pool that borrowers can
access through overcollateralised positions. In return, suppliers earn interest,
while borrowers can obtain liquidity against their collateral, all facilitated
through decentralised smart contracts.

Aave liquidity pools operate on a blockchain network governed by decisions that define the chain and reserve parameters. Parameter decisions must balance liquidity demands for various actions with risk management. The use of smart contracts validate parameters, executing the actions of borrowing, repaying, and liquidation processes seamlessly without intermediaries. This decentralised approach enhances the transparency, efficiency, and security of financial interactions within the pool.

The core actions that can be taken on the liquidity pool are:

## Supply

Supplying tokens to the Aave Protocol allows users to earn interest on their digital assets and utilise supplied tokens as collateral. When tokens are supplied, they are transferred to the Aave liquidity pool, a system of smart contracts that facilitates overcollateralised borrowing of tokens. In Aave, supplied tokens automatically accrue interest based on the current market supply rate. As the balance of supplied tokens increases, interest is accrued dynamically, reflecting the current rate allocated to suppliers.

Interest rates for supplied tokens are determined by the borrow utilisation rate, which measures the proportion of assets currently borrowed against the total supplied in the pool, and by governance parameters that can be adjusted through community decisions. These parameters, including collateralisation requirements and interest rates for suppliers and borrowers, are influenced by onchain inputs such as token balances, oracle prices, and the borrow utilisation ratio. As liquidity is supplied, borrowed, repaid, or withdrawn from the pool, the interest rates are updated accordingly.

## Withdraw

Aave Protocol allows suppliers to withdraw their supplied tokens, including accrued interest, as long as there is sufficient unborrowed liquidity in the reserve. The withdrawal amount is limited by the available underlying assets, and that the user’s ability to maintain a sufficient collateral ratio for their borrow position. Periphery contracts with features such as withdraw and switch, allow users to redeem their supplied liquidity in a different token, providing more options for efficient asset management.

When withdrawing with an active borrow position, it’s crucial to maintain a healthy collateralisation ratio to avoid liquidation. Reducing collateral can lower the health factor, increasing the risk of liquidation. To remain safe, after the withdrawal, the account must stay above the liquidation threshold parameters. Therefore, withdrawals require careful management and consideration of the overall borrow positions to avoid liquidation.

## Borrow

Borrowing tokens from the Aave Protocol allows users to access liquidity by using their supplied tokens as collateral, unlocking capital without selling their assets. However, borrowers face liquidation risk if the value of their collateral falls below the required threshold. Interest rates are determined dynamically, influenced by protocol factors and governance decisions, and can change over time based on community input. Interest accrues based on the utilisation rate, which reflects the percentage of supplied liquidity that is borrowed. Higher utilisation rates lead to higher interest rates, adjusting with demand. Each reserve has specific parameters designed to incentivize both borrowers and suppliers.

To maintain a healthy ratio and avoid liquidation risk, borrowers should actively monitor their collateralization level, keeping their health factor in check, to assure their borrow positions remain overcollateralised even as market conditions change or interest accrues.

## Repay

Repaying borrowed tokens in the Aave Protocol is an important step for managing borrow positions. Borrowers can repay using the same tokens they borrowed, or repay with aTokens (collateral tokens) of the same underlying token. In addition, there are [periphery contracts](https://github.com/aave-dao/aave-v3-origin) available that simplify the process by allowing repayment with other tokens, such as other collateral assets, without the need to manually convert them beforehand. This flexibility makes it easier for borrowers to manage and close their positions when needed.

Repayment increases the collateralisation ratio, ensuring adequate collateralization and preventing liquidation. By boosting the collateral relative to what is borrowed, repayment prevents assets from being liquidated and allows borrowers to safely withdraw part of their collateral.

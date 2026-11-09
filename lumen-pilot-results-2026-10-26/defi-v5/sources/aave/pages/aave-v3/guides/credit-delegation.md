# Credit Delegation

Credit delegation allows a supplier to contribute liquidity to the Aave protocol to earn interest, and delegate borrowing power (i.e. their credit) to other users. The enforcement of the borrow position and its terms are agreed upon between the supplier and borrowers, which can be either offchain via legal agreements or onchain via smart contracts.

This enables:

- The supplier (aka delegator) to earn extra yield on top of the yield they already earn from the protocol.
- The borrowers (aka delegatees) to access uncollateralized liquidity.

Borrow by _delegatee_ must be consistent with _delegator_ eMode category.
For eg. if a delegator eMode category is `STABLECOINS`, then

- Delegator can only borrow `STABLECOINS` eMode category asset.
- In case _delegator_ approve credit to _delegatee_ for non `STABLECOINS`category (for eg. weth), then borrow would revert.

The _delegatee_ cannot abuse credit approval to liquidate _delegator_ i.e. if the borrow puts _delegator's_ position in HF < `HEALTH_FACTOR_LIQUIDATION_THRESHOLD`, then borrow will fail.

## Approving the delegation

The `approveDelegation` or `delegationWithSig` function on the [`VariableDebtToken`](./smart-contracts/tokenization#variabledebttoken) contract must be called by the supplier (delegator), approving the borrower (delegatee) a certain amount.

This is done for each debt token that needs to be delegated.

The delegator does not need to already have supplied funds in the protocol to `approveDelegation`. However, **before** the delegatee executes `borrow`, there must be sufficient collateral supplied by delegator in the protocol.

## Borrowing the credit

The borrower (delegatee) calls the `borrow` function on the [`Pool`](./smart-contracts/pool), using the supplier's (delegator's) address in final parameter `onBehalfOf`.

The borrower's available credit is reduced by the borrowed amount.

## Repaying the credit

Anyone can repay the borrow position _OnBehalf_ of the user, by calling one of the following [`Pool`](./smart-contracts/pool) functions - `repay` or `repayWithPermit`. The supplier (aka creditor) can also use the `repayWithATokens` function to repay a borrow position with their _aTokens_ of the underlying asset in the same pool.

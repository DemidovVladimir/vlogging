# Aave Logic

Reference for the `aave-logic` Move package. The supply, borrow, repay and liquidation entry points.

## Supply Functions

### supply

```move
public entry fun supply(
    account: &signer,
    asset: address,
    amount: u256,
    on_behalf_of: address,
    referral_code: u16
)
```

Supplies a certain amount of an asset into the protocol, minting the same amount of corresponding aTokens and transferring them to the `on_behalf_of` address. For example, if a user supplies 100 USDC and `on_behalf_of` address is the same as the signer's address, they will get 100 aUSDC in return.

The `referral_code` is emitted in the `Supply` event and can be used for third-party referral integrations. To activate the referral feature and obtain a unique referral code, integrators need to submit a proposal to Aave Governance.

When supplying, the Pool contract must have allowance to spend funds on behalf of the signer for at least the amount for the asset being supplied.

Referral supply is currently inactive, you can pass 0 as `referral_code`. This program may be activated in the future through an Aave governance proposal.

**Input Parameters:**

| Name          | Type    | Description                                                                                                                                                                                                                                                                                                                       |
| ------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| account       | &signer | The signer account of the caller                                                                                                                                                                                                                                                                                                  |
| asset         | address | The address of the underlying asset being supplied to the pool                                                                                                                                                                                                                                                                    |
| amount        | u256    | The amount of asset to be supplied                                                                                                                                                                                                                                                                                                |
| on_behalf_of  | address | The address that will receive the corresponding aTokens. This is the only address that will be able to withdraw the asset from the pool. This will be the same as the signer's address if the user wants to receive aTokens into their own wallet, or use a different address if the beneficiary of aTokens is a different wallet |
| referral_code | u16     | Referral supply is currently inactive, you can pass 0. This code is used to register the integrator originating the operation, for potential rewards. 0 if the action is executed directly by the user, without any middle-men                                                                                                    |

## Borrow Functions

### borrow

```move=
public entry fun borrow(
    account: &signer,
    asset: address,
    amount: u256,
    interest_rate_mode: u8,
    referral_code: u16,
    on_behalf_of: address
)
```

Allows users to borrow a specific amount of the underlying asset, provided that the borrower already supplied enough collateral.

Borrowers can borrow at a variable rate, represented by `interest_rate_mode` value of 2.

The `referral_code` is emitted in the Borrow event and can be used for third-party referral integrations. To activate the referral feature and obtain a unique referral code, integrators need to submit a proposal to Aave Governance.

Referral program is currently inactive, you can pass 0 as referral_code. This program may be activated in the future through an Aave governance proposal.

**Input Parameters:**

| Name               | Type    | Description                                                                                                                                                                                                                     |
| ------------------ | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| account            | &signer | The signer account of the caller                                                                                                                                                                                                |
| asset              | address | The address of the underlying asset to borrow                                                                                                                                                                                   |
| amount             | u256    | The amount to be borrowed                                                                                                                                                                                                       |
| interest_rate_mode | u8      | The interest rate mode at which the user wants to borrow: 2 for Variable                                                                                                                                                        |
| referral_code      | u16     | Referral program is currently inactive, you can pass 0. This code is used to register the integrator originating the operation, for potential rewards. 0 if the action is executed directly by the user, without any middle-men |
| on_behalf_of       | address | The address of the user who will receive the debt. Should be the address of the borrower itself calling the function                                                                                                            |

## Repay Functions

### repay

```move=
public entry fun repay(
    account: &signer,
    asset: address,
    amount: u256,
    interest_rate_mode: u8,
    on_behalf_of: address
)
```

Repays a borrowed amount on a specific reserve, burning the equivalent debt tokens. For example, if a user repays 100 USDC, 100 variable/stable debt tokens will be burned and the underlying will be transferred from the user to the aToken contract.

The amount parameter can be set to math_utils::u256_max() to repay the entire debt.

**Input Parameters:**

| Name               | Type    | Description                                                                                                                                                                                                                                   |
| ------------------ | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| account            | &signer | The signer account of the caller                                                                                                                                                                                                              |
| asset              | address | The address of the borrowed underlying asset previously borrowed                                                                                                                                                                              |
| amount             | u256    | The amount to repay. Can be math_utils::u256_max() to repay the whole debt                                                                                                                                                                    |
| interest_rate_mode | u8      | The interest rate mode at which the user wants to repay: 2 for Variable                                                                                                                                                                       |
| on_behalf_of       | address | The address of the user who will get their debt reduced/removed. Should be the address of the borrower itself if they are repaying their own debt, or the address of the credit delegator if they are repaying a debt on behalf of a borrower |

### repay_with_a_tokens

```move=
public entry fun repay_with_a_tokens(
    account: &signer,
    asset: address,
    amount: u256,
    interest_rate_mode: u8
)
```

Repays a borrowed amount on a specific reserve using the reserve aTokens, burning the equivalent debt tokens. For example, if a user repays 100 USDC using aUSDC, 100 variable/stable debt tokens will be burned and 100 aUSDC will be burned.

The amount parameter can be set to math_utils::u256_max() to repay the entire debt.

**Input Parameters:**

| Name               | Type    | Description                                                                |
| ------------------ | ------- | -------------------------------------------------------------------------- |
| account            | &signer | The signer account of the caller                                           |
| asset              | address | The address of the borrowed underlying asset previously borrowed           |
| amount             | u256    | The amount to repay. Can be math_utils::u256_max() to repay the whole debt |
| interest_rate_mode | u8      | The interest rate mode at which the user wants to repay: 2 for Variable    |

## Withdraw Functions

### withdraw

```move=
public entry fun withdraw(
    account: &signer,
    asset: address,
    amount: u256,
    to: address
)
```

Withdraws an amount of underlying asset from the reserve, burning the equivalent aTokens owned by account. For example, if a user withdraws 100 USDC, 100 aUSDC will be burned and 100 USDC will be transferred to the specified to address.

The amount parameter can be set to math_utils::u256_max() to withdraw the entire balance.

**Input Parameters:**

| Name    | Type    | Description                                                                              |
| ------- | ------- | ---------------------------------------------------------------------------------------- |
| account | &signer | The signer account of the caller                                                         |
| asset   | address | The address of the underlying asset to withdraw                                          |
| amount  | u256    | The amount to be withdrawn. Can be math_utils::u256_max() to withdraw the entire balance |
| to      | address | The address that will receive the underlying asset                                       |

## Collateral Management Functions

### set_user_use_reserve_as_collateral

```move=
public entry fun set_user_use_reserve_as_collateral(
    account: &signer,
    asset: address,
    use_as_collateral: bool
)
```

Allows users to enable or disable a specific supplied asset as collateral. Assets used as collateral can be liquidated if the user's health factor drops below 1.0.

**Input Parameters:**

| Name              | Type    | Description                                                            |
| ----------------- | ------- | ---------------------------------------------------------------------- |
| account           | &signer | The signer account of the caller                                       |
| asset             | address | The address of the underlying asset supplied                           |
| use_as_collateral | bool    | true if the user wants to use the asset as collateral, false otherwise |

## E-Mode Functions

### set_user_emode

```move=
public entry fun set_user_emode(
    account: &signer,
    category_id: u8
)
```

Allows users to switch between different efficiency modes (E-modes). E-mode allows users to get higher borrowing power on a set of assets that have correlated prices.

For example, if a user is in the "Stablecoins" E-mode category, they can borrow more stablecoins against their stablecoin collateral than they would be able to in regular mode.

**Input Parameters:**

| Name        | Type    | Description                                              |
| ----------- | ------- | -------------------------------------------------------- |
| account     | &signer | The signer account of the caller                         |
| category_id | u8      | The id of the category to switch to. 0 to disable E-mode |

## Isolation Mode

Isolation mode is a risk management feature in the Aave protocol that limits borrowing power for assets that might pose higher risk to the protocol.

### Overview

When a user supplies an asset marked as "isolated collateral" (via reserve configuration), they enter isolation mode. In isolation mode:

1. Users can only borrow assets up to a specific debt ceiling.
2. Users can only borrow stablecoins and other assets explicitly allowed for isolated collateral.
3. Users cannot supply other assets as collateral while in isolation mode.

This feature protects the protocol by limiting the maximum debt that can be borrowed against riskier assets, reducing potential systemic risk.

### Relationship with E-Mode

While E-Mode increases borrowing power for correlated assets, Isolation Mode does the opposite - it restricts borrowing power for higher-risk assets. These features serve different purposes:

- **E-Mode**: Optimizes capital efficiency for correlated assets (like stablecoins).
- **Isolation Mode**: Limits protocol exposure to riskier assets.

Users cannot be in both modes simultaneously. If a user has an isolated asset as collateral, they cannot enter E-Mode until they either disable the isolated asset as collateral or withdraw it completely.

## Flash Loan Functions

### flash_loan_simple

```move=
public fun flash_loan_simple(
    initiator: &signer,
    receiver_address: address,
    asset: address,
    amount: u256,
    referral_code: u16
)
```

Allows smart contracts to access the liquidity of the pool within one transaction, as long as the amount taken plus a fee is returned.
This is a simpler version of the flash loan function that only allows borrowing a single asset.

**Input Parameters:**

| Name             | Type    | Description                                                                                                                                                         |
| ---------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| initiator        | &signer | The signer account of the flash loan initiator                                                                                                                      |
| receiver_address | address | The address of the contract receiving the funds                                                                                                                     |
| asset            | address | The address of the asset being flash-borrowed                                                                                                                       |
| amount           | u256    | The amount of the asset being flash-borrowed                                                                                                                        |
| referral_code    | u16     | The code used to register the integrator originating the operation, for potential rewards. 0 if the action is executed directly by the user, without any middle-man |

### flash_loan

```move=
public fun flash_loan(
    initiator: &signer,
    receiver_address: address,
    assets: vector<address>,
    amounts: vector<u256>,
    interest_rate_modes: vector<u8>,
    on_behalf_of: address,
    referral_code: u16
)
```

**Input Parameters:**

| Name                | Type              | Description                                                                                                                                                                                                                                                |
| ------------------- | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| initiator           | &signer           | The signer account of the flash loan initiator                                                                                                                                                                                                             |
| receiver_address    | address           | The address of the contract receiving the funds                                                                                                                                                                                                            |
| assets              | vector\<address\> | The addresses of the assets being flash-borrowed                                                                                                                                                                                                           |
| amounts             | vector\<u256\>    | The amounts of the assets being flash-borrowed                                                                                                                                                                                                             |
| interest_rate_modes | vector\<u8\>      | Types of the debt to open if the flash loan is not returned: 0 -> Don't open any debt, just revert if funds can't be transferred from the receiver, 2 -> Open debt at variable rate for the value of the amount flash-borrowed to the on_behalf_of address |
| on_behalf_of        | address           | The address that will receive the debt in the case of using interest_rate_modes 2, on_behalf_of should be the account address                                                                                                                              |
| referral_code       | u16               | The code used to register the integrator originating the operation, for potential rewards. 0 if the action is executed directly by the user, without any middle-man                                                                                        |

## Liquidation Functions

### liquidation_call

```move=
public entry fun liquidation_call(
    account: &signer,
    collateral_asset: address,
    debt_asset: address,
    user: address,
    debt_to_cover: u256,
    receive_a_token: bool
)
```

Allows liquidators to liquidate positions with a health factor below 1.0. The liquidator repays a portion of the debt and receives a portion of the collateral in return, plus a liquidation bonus.

**Input Parameters:**

| Name             | Type    | Description                                                                                         |
| ---------------- | ------- | --------------------------------------------------------------------------------------------------- |
| account          | &signer | The signer account of the liquidator                                                                |
| collateral_asset | address | The address of the collateral asset to receive                                                      |
| debt_asset       | address | The address of the debt asset to be repaid                                                          |
| user             | address | The address of the borrower                                                                         |
| debt_to_cover    | u256    | The amount of debt to cover. Can be math_utils::u256_max() to liquidate the maximum possible amount |
| receive_a_token  | bool    | true if the liquidator wants to receive aTokens instead of the underlying asset                     |

# aave-pool-token-logic

## Transfer Functions

### transfer

```move=
public entry fun transfer(
    sender: &signer,
    recipient: address,
    amount: u256,
    a_token_address: address
)
```

Transfers aTokens from the user to the recipient. This function allows users to transfer their aTokens directly to another address.

#### Input Parameters:

| Name            | Type    | Description                           |
| --------------- | ------- | ------------------------------------- |
| sender          | &signer | The account signer of the caller      |
| recipient       | address | The recipient of the aTokens          |
| amount          | u256    | The amount of aTokens to transfer     |
| a_token_address | address | The address of the aToken to transfer |

## Admin Functions

### set_incentives_controller

```move=
public entry fun set_incentives_controller(
    admin: &signer,
    underlying_asset: address,
    incentives_controller: Option<address>
)
```

Sets an incentives controller for both the aToken and variable debt token of a given underlying asset.

**Input Parameters:**

| Name                  | Type              | Description                              |
| --------------------- | ----------------- | ---------------------------------------- |
| admin                 | &signer           | The signer account of the admin          |
| underlying_asset      | address           | The address of the underlying asset      |
| incentives_controller | Option\<address\> | The address of the incentives controller |

### mint_to_treasury

```move=
public entry fun mint_to_treasury(
    assets: vector<address>
)
```

Mints the assets accrued through the reserve factor to the treasury in the form of aTokens.

#### Input Parameters:

| Name   | Type              | Description                                                     |
| ------ | ----------------- | --------------------------------------------------------------- |
| assets | vector\<address\> | The list of reserves for which the minting needs to be executed |

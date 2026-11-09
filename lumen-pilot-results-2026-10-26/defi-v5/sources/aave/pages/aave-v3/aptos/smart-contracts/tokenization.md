# Tokenization

Reference for the `aave-tokens` Move package.

This documentation covers the tokenization modules in the Aave protocol implementation on Aptos. Similar to Aave on EVM chains, the Aptos implementation uses specialized tokens to represent user positions in the protocol.

## a_token_factory Module

The `a_token_factory` module manages the creation and operations of aTokens, which represent user supply positions in the Aave protocol. aTokens are interest-bearing tokens that automatically accrue interest to their holders.

### Write Methods

#### create_token

```move=
public(friend) fun create_token(
    signer: &signer,
    name: String,
    symbol: String,
    decimals: u8,
    icon_uri: String,
    project_uri: String,
    incentives_controller: Option<address>,
    underlying_asset: address,
    treasury: address
): address
```

Creates a new aToken for a specific underlying asset.

**Input Parameters:**

| Name                  | Type              | Description                                              |
| --------------------- | ----------------- | -------------------------------------------------------- |
| signer                | &signer           | The signer of the caller                                 |
| name                  | String            | The name of the aToken                                   |
| symbol                | String            | The symbol of the aToken                                 |
| decimals              | u8                | The decimals of the aToken                               |
| icon_uri              | String            | The icon URI of the aToken                               |
| project_uri           | String            | The project URI of the aToken                            |
| incentives_controller | Option\<address\> | The address of the incentives controller for this aToken |
| underlying_asset      | address           | The address of the underlying asset                      |
| treasury              | address           | The address of the treasury                              |

**Return Values:**

| Type    | Description                       |
| ------- | --------------------------------- |
| address | The address of the created aToken |

**Emits:**

- `Initialized` event with details about the created aToken

#### mint

```move=
public(friend) fun mint(
    caller: address,
    on_behalf_of: address,
    amount: u256,
    index: u256,
    metadata_address: address
): bool
```

Mints aTokens to a user.

**Input Parameters:**

| Name             | Type    | Description                                      |
| ---------------- | ------- | ------------------------------------------------ |
| caller           | address | The address performing the mint                  |
| on_behalf_of     | address | The address that will receive the minted aTokens |
| amount           | u256    | The amount of tokens getting minted              |
| index            | u256    | The next liquidity index of the reserve          |
| metadata_address | address | The address of the aToken                        |

**Return Values:**

| Type | Description                                    |
| ---- | ---------------------------------------------- |
| bool | true if the previous balance of the user was 0 |

#### burn

```move=
public(friend) fun burn(
    from: address,
    receiver_of_underlying: address,
    amount: u256,
    index: u256,
    metadata_address: address
)
```

Burns aTokens from a user and sends the equivalent amount of underlying to the receiver.

In some instances, a mint event could be emitted from a burn transaction if the amount to burn is less than the interest that the user accrued.

#### mint_to_treasury

```move=
public(friend) fun mint_to_treasury(
    amount: u256,
    index: u256,
    metadata_address: address
)
```

Mints aTokens to the reserve treasury.

**Input Parameters:**

| Name             | Type    | Description                             |
| ---------------- | ------- | --------------------------------------- |
| amount           | u256    | The amount of tokens getting minted     |
| index            | u256    | The next liquidity index of the reserve |
| metadata_address | address | The address of the aToken               |

#### transfer_on_liquidation

```move=
public(friend) fun transfer_on_liquidation(
    from: address,
    to: address,
    amount: u256,
    index: u256,
    metadata_address: address
)
```

Transfers aTokens in the event of a borrow being liquidated, in case the liquidator reclaims the aToken.

**Input Parameters:**

| Name             | Type    | Description                                                  |
| ---------------- | ------- | ------------------------------------------------------------ |
| from             | address | The address getting liquidated, current owner of the aTokens |
| to               | address | The recipient of aTokens                                     |
| amount           | u256    | The amount of tokens getting transferred                     |
| index            | u256    | The next liquidity index of the reserve                      |
| metadata_address | address | The address of the aToken                                    |

**Emits:**

- Balance transfer event with the scaled amount and index

#### handle_repayment

```move=
public fun handle_repayment(
    _user: address,
    _on_behalf_of: address,
    _amount: u256,
    _metadata_address: address
)
```

Handles the underlying received by the aToken after the transfer has been completed.

The default implementation is empty as with standard tokens, nothing needs to be done after the transfer is concluded. However, in the future there may be aTokens that allow for example to stake the underlying to receive LM rewards. In that case, `handle_repayment()` would perform the staking of the underlying asset.

**Input Parameters:**

| Name               | Type    | Description                                         |
| ------------------ | ------- | --------------------------------------------------- |
| \_user             | address | The user executing the repayment                    |
| \_on_behalf_of     | address | The address for which the borrow position is repaid |
| \_amount           | u256    | The amount getting repaid                           |
| \_metadata_address | address | The address of the aToken                           |

#### drop_token

```move=
public(friend) fun drop_token(metadata_address: address)
```

Drops the aToken associated data.

**Input Parameters:**

| Name             | Type    | Description                        |
| ---------------- | ------- | ---------------------------------- |
| metadata_address | address | The address of the metadata object |

### View Methods

#### get_underlying_asset_address

```move=
public fun get_underlying_asset_address(
    metadata_address: address
): address
```

Returns the address of the underlying asset of this aToken.

**Input Parameters:**

| Name             | Type    | Description               |
| ---------------- | ------- | ------------------------- |
| metadata_address | address | The address of the aToken |

**Return Values:**

| Type    | Description                         |
| ------- | ----------------------------------- |
| address | The address of the underlying asset |

#### get_previous_index

```move=
public fun get_previous_index(
    user: address,
    metadata_address: address
): u256
```

Returns the last index interest was accrued to the user's balance.

**Input Parameters:**

| Name             | Type    | Description               |
| ---------------- | ------- | ------------------------- |
| user             | address | The address of the user   |
| metadata_address | address | The address of the aToken |

**Return Values:**

| Type | Description                                                                 |
| ---- | --------------------------------------------------------------------------- |
| u256 | The last index interest was accrued to the user's balance, expressed in ray |

#### get_scaled_user_balance_and_supply

```move=
public fun get_scaled_user_balance_and_supply(
    owner: address,
    metadata_address: address
): (u256, u256)
```

Returns the scaled balance of the user and the scaled total supply.

**Input Parameters:**

| Name             | Type    | Description               |
| ---------------- | ------- | ------------------------- |
| owner            | address | The address of the user   |
| metadata_address | address | The address of the aToken |

**Return Values:**

| Type | Description                    |
| ---- | ------------------------------ |
| u256 | The scaled balance of the user |
| u256 | The scaled total supply        |

#### scaled_balance_of

```move=
public fun scaled_balance_of(
    owner: address,
    metadata_address: address
): u256
```

Returns the scaled balance of the user.

The scaled balance is the sum of all the updated stored balance divided by the reserve's liquidity index at the moment of the update.

**Input Parameters:**

| Name             | Type    | Description               |
| ---------------- | ------- | ------------------------- |
| owner            | address | The address of the user   |
| metadata_address | address | The address of the aToken |

**Return Values:**

| Type | Description                    |
| ---- | ------------------------------ |
| u256 | The scaled balance of the user |

#### scaled_total_supply

```move=
public fun scaled_total_supply(
    metadata_address: address
): u256
```

Returns the scaled total supply of the aToken.

The scaled total supply is the sum of all scaled balances of the users.

**Input Parameters:**

| Name             | Type    | Description               |
| ---------------- | ------- | ------------------------- |
| metadata_address | address | The address of the aToken |

**Return Values:**

| Type | Description             |
| ---- | ----------------------- |
| u256 | The scaled total supply |

#### decimals

```move=
public fun decimals(metadata_address: address): u8
```

Returns the decimals of the aToken.

**Input Parameters:**

| Name             | Type    | Description               |
| ---------------- | ------- | ------------------------- |
| metadata_address | address | The address of the aToken |

**Return Values:**

| Type | Description                |
| ---- | -------------------------- |
| u8   | The decimals of the aToken |

## Variable Debt Token Factory

The `variable_debt_token_factory` module manages the creation and operations of variable debt tokens in the Aave protocol on Aptos. Variable debt tokens represent user borrowing positions with a variable interest rate.

### Write Methods

#### create_token

```move=
public(friend) fun create_token(
    signer: &signer,
    name: String,
    symbol: String,
    decimals: u8,
    icon_uri: String,
    project_uri: String,
    incentives_controller: Option<address>,
    underlying_asset: address
): address
```

Creates a new variable debt token for a specific underlying asset.

**Input Parameters:**

| Name                  | Type              | Description                                                  |
| --------------------- | ----------------- | ------------------------------------------------------------ |
| signer                | &signer           | The signer of the caller                                     |
| name                  | String            | The name of the variable debt token                          |
| symbol                | String            | The symbol of the variable debt token                        |
| decimals              | u8                | The decimals of the variable debt token                      |
| icon_uri              | String            | The icon URI of the variable debt token                      |
| project_uri           | String            | The project URI of the variable debt token                   |
| incentives_controller | Option\<address\> | The address of the incentives controller for this debt token |
| underlying_asset      | address           | The address of the underlying asset                          |

**Return Values:**

| Type    | Description                           |
| ------- | ------------------------------------- |
| address | The address of the created debt token |

**Emits:**

- `Initialized` event with details about the created variable debt token

#### mint

```move=
public(friend) fun mint(
    caller: address,
    on_behalf_of: address,
    amount: u256,
    index: u256,
    metadata_address: address
): bool
```

Mints debt tokens to the `on_behalf_of` address.

**Input Parameters:**

| Name             | Type    | Description                                                                                                                      |
| ---------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------- |
| caller           | address | The address receiving the borrowed underlying, being the delegatee in case of credit delegate, or same as on_behalf_of otherwise |
| on_behalf_of     | address | The address receiving the debt tokens                                                                                            |
| amount           | u256    | The amount of debt being minted                                                                                                  |
| index            | u256    | The variable debt index of the reserve                                                                                           |
| metadata_address | address | The address of the variable debt token                                                                                           |

**Return Values:**

| Type | Description                                                                |
| ---- | -------------------------------------------------------------------------- |
| bool | Whether this is the first time we mint the variable debt token to the user |

**Emits:**

- `Transfer` event from zero address to recipient

- `Mint` event with details about the mint operation

#### burn

```move=
public(friend) fun burn(
    from: address,
    amount: u256,
    index: u256,
    metadata_address: address
)
```

Burns debt tokens from a user.

**Input Parameters:**

| Name             | Type    | Description                                           |
| ---------------- | ------- | ----------------------------------------------------- |
| from             | address | The address from which the debt tokens will be burned |
| amount           | u256    | The amount of debt tokens that will be burned         |
| index            | u256    | The variable debt index of the reserve                |
| metadata_address | address | The address of the variable debt token                |

**Emits:**

- `Transfer` event to zero address
- `Burn` event with details about the burn operation
- If the balance increase is greater than the amount, also emits `Transfer` and `Mint` events

#### drop_token

```move=
public(friend) fun drop_token(metadata_address: address)
```

Drops the variable debt token associated data.

**Input Parameters:**

| Name             | Type    | Description                        |
| ---------------- | ------- | ---------------------------------- |
| metadata_address | address | The address of the metadata object |

### View Methods

#### get_underlying_asset_address

```move=
public fun get_underlying_asset_address(
    metadata_address: address
): address
```

Returns the address of the underlying asset of this variable debt token.

**Input Parameters:**

| Name             | Type    | Description                            |
| ---------------- | ------- | -------------------------------------- |
| metadata_address | address | The address of the variable debt token |

**Return Values:**

| Type    | Description                         |
| ------- | ----------------------------------- |
| address | The address of the underlying asset |

#### get_previous_index

```move=
public fun get_previous_index(
    user: address,
    metadata_address: address
): u256
```

Returns the last index interest was accrued to the user's balance.

**Input Parameters:**

| Name             | Type    | Description                            |
| ---------------- | ------- | -------------------------------------- |
| user             | address | The address of the user                |
| metadata_address | address | The address of the variable debt token |

**Return Values:**

| Type | Description                                                                 |
| ---- | --------------------------------------------------------------------------- |
| u256 | The last index interest was accrued to the user's balance, expressed in ray |

#### get_scaled_user_balance_and_supply

```move=
public fun get_scaled_user_balance_and_supply(
    owner: address,
    metadata_address: address
): (u256, u256)
```

Returns the scaled balance of the user and the scaled total supply.

**Input Parameters:**

| Name             | Type    | Description                            |
| ---------------- | ------- | -------------------------------------- |
| owner            | address | The address of the user                |
| metadata_address | address | The address of the variable debt token |

**Return Values:**

| Type | Description                    |
| ---- | ------------------------------ |
| u256 | The scaled balance of the user |
| u256 | The scaled total supply        |

#### scaled_balance_of

```move=
public fun scaled_balance_of(
    owner: address,
    metadata_address: address
): u256
```

Returns the scaled balance of the user.

The scaled balance is the sum of all the updated stored balance divided by the reserve's variable debt index at the moment of the update.

**Input Parameters:**

| Name             | Type    | Description                            |
| ---------------- | ------- | -------------------------------------- |
| owner            | address | The address of the user                |
| metadata_address | address | The address of the variable debt token |

**Return Values:**

| Type | Description                    |
| ---- | ------------------------------ |
| u256 | The scaled balance of the user |

#### scaled_total_supply

```move=
public fun scaled_total_supply(
    metadata_address: address
): u256
```

Returns the scaled total supply of the variable debt token.

The scaled total supply is the sum of all scaled balances of the users with debt.

**Input Parameters:**

| Name             | Type    | Description                            |
| ---------------- | ------- | -------------------------------------- |
| metadata_address | address | The address of the variable debt token |

**Return Values:**

| Type | Description             |
| ---- | ----------------------- |
| u256 | The scaled total supply |

#### name

```move=
public fun name(metadata_address: address): String
```

Returns the name of the variable debt token.

**Input Parameters:**

| Name             | Type    | Description                            |
| ---------------- | ------- | -------------------------------------- |
| metadata_address | address | The address of the variable debt token |

**Return Values:**

| Type   | Description                         |
| ------ | ----------------------------------- |
| String | The name of the variable debt token |

#### symbol

```move=
public fun symbol(metadata_address: address): String
```

Returns the symbol of the variable debt token.

**Input Parameters:**

| Name             | Type    | Description                            |
| ---------------- | ------- | -------------------------------------- |
| metadata_address | address | The address of the variable debt token |

**Return Values:**

| Type   | Description                           |
| ------ | ------------------------------------- |
| String | The symbol of the variable debt token |

#### decimals

```move=
public fun decimals(metadata_address: address): u8
```

Returns the decimals of the variable debt token.

**Input Parameters:**

| Name             | Type    | Description                            |
| ---------------- | ------- | -------------------------------------- |
| metadata_address | address | The address of the variable debt token |

**Return Values:**

| Type | Description                             |
| ---- | --------------------------------------- |
| u8   | The decimals of the variable debt token |

## Comparison with Ethereum Implementation

The variable debt token implementation in Aptos follows similar principles to the Ethereum implementation but is adapted to the Move language and Aptos blockchain architecture:

1. **Object-based Model**: Instead of ERC20 contracts, Aptos uses an object-based model for fungible assets.

2. **Scaled Balances**: Like in Ethereum, the variable debt tokens use scaled balances to track user debt positions, which automatically accrue interest over time.

3. **Index-based Interest Accrual**: Interest accrual is handled through index-based calculations, similar to the Ethereum implementation.

4. **No Transfers**: Variable debt tokens cannot be transferred between users, as they represent a specific user's debt position.

The variable debt tokens in Aave on Aptos serve the same purpose as in the Ethereum implementation: they represent a user's variable-rate debt position in the protocol and automatically accrue interest over time based on the variable interest rate of the corresponding reserve.

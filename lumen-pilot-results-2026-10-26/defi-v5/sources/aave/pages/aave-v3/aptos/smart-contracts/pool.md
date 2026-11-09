# Pool

Reference for the `aave-pool` Move package.

## Overview

The `pool` module maintains the state of reserves, user configurations, and protocol-wide settings. It doesn't directly expose public entry functions for users to interact with. Instead, it provides view functions and friend-accessible functions that other modules use to implement protocol features like `supplying`, `borrowing`, `repaying`, and `liquidations`.

## Key View Functions

### get_reserve_data

```move=
#[view]
public fun get_reserve_data(asset: address): Object<ReserveData>
```

Returns the state and configuration of a specific reserve. This includes information such as `liquidity index`, `borrow rates`, `token addresses`, and `other reserve-specific parameters`.

**Input Parameters:**

| Name  | Type    | Description                                        |
| ----- | ------- | -------------------------------------------------- |
| asset | address | The address of the underlying asset of the reserve |

### get_user_configuration

```move=
#[view]
public fun get_user_configuration(user: address): UserConfigurationMap
```

Returns the configuration of a user across all reserves, indicating which assets they are using as collateral and which they have borrowed.

**Input Parameters:**

| Name | Type    | Description      |
| ---- | ------- | ---------------- |
| user | address | The user address |

### get_reserve_normalized_income

```move
#[view]
public fun get_reserve_normalized_income(asset: address): u256
```

Returns the ongoing normalized income for the reserve. A value of 1e27 means there is no income. As time passes, the yield is accrued.

**Input Parameters:**

| Name  | Type    | Description                                        |
| ----- | ------- | -------------------------------------------------- |
| asset | address | The address of the underlying asset of the reserve |

### get_reserve_normalized_variable_debt

```move=
#[view]
public fun get_reserve_normalized_variable_debt(asset: address): u256
```

Returns the normalized variable debt per unit of asset. A value of 1e27 means there is no debt. As time passes, the debt is accrued.

**Input Parameters:**

| Name  | Type    | Description                                        |
| ----- | ------- | -------------------------------------------------- |
| asset | address | The address of the underlying asset of the reserve |

### get_user_account_data

```move=
#[view]
public fun get_user_account_data(
    user: address
): (u256, u256, u256, u256, u256, u256)
```

Returns the user account data across all reserves, including `total collateral`, `total debt`, `available borrows`, `liquidation threshold`, `LTV`, and `health factor`.

**Input Parameters:**

| Name | Type    | Description             |
| ---- | ------- | ----------------------- |
| user | address | The address of the user |

**Return Values:**

| Position | Type | Description                        |
| -------- | ---- | ---------------------------------- |
| 0        | u256 | Total collateral in base currency  |
| 1        | u256 | Total debt in base currency        |
| 2        | u256 | Available borrows in base currency |
| 3        | u256 | Current liquidation threshold      |
| 4        | u256 | Loan to value ratio                |
| 5        | u256 | Health factor                      |

### get_reserve_configuration

```move=
#[view]
public fun get_reserve_configuration(asset: address): &ReserveConfigurationMap
```

Returns the configuration of a reserve, including parameters like `LTV`, `liquidation threshold`, `borrowing enabled flags`, etc.

**Input Parameters:**

| Name  | Type    | Description                                        |
| ----- | ------- | -------------------------------------------------- |
| asset | address | The address of the underlying asset of the reserve |

### get_reserves_list

```move=
#[view]
public fun get_reserves_list(): vector<address>
```

Returns the list of the underlying assets of all initialized reserves.

### get_user_emode

```move=
#[view]
public fun get_user_emode(user: address): u8
```

Returns the efficiency mode (eMode) category that the user is using. A value of 0 indicates the user is not in any eMode category.

**Input Parameters:**

| Name | Type    | Description             |
| ---- | ------- | ----------------------- |
| user | address | The address of the user |

### get_reserve_address_by_id

```move=
#[view]
public fun get_reserve_address_by_id(id: u256): address
```

Returns the address of the reserve corresponding to a given ID.

**Input Parameters:**

| Name | Type | Description                                |
| ---- | ---- | ------------------------------------------ |
| id   | u256 | The ID of the reserve in the reserves list |

## Protocol Configuration View Functions

```move=
#[view]
public fun get_flashloan_premium_total(): u128

#[view]
public fun get_flashloan_premium_to_protocol(): u128

#[view]
public fun max_number_reserves(): u16
```

These functions return various protocol-wide configuration parameters:

- The total flashloan premium percentage
- The portion of flashloan premium that goes to the protocol
- The maximum number of reserves supported by the pool

## Internal State Management

While not directly accessible to users, the `pool` module contains friend-accessible functions that other modules use to implement protocol features:

- **Reserve initialization and configuration**
- **Interest rate updates**
- **Liquidity and debt management**
- **Collateral management**
- **Health factor calculations**
- **E-Mode operations**
- **Isolation mode operations**
- **Flash loan handling**

## Key Differences from Solidity Implementation

The Move implementation differs from the Solidity version in several ways:

1. **Separation of Concerns**: The Move implementation separates data storage (in the `pool` module) from business logic (in modules like `supply_logic`, `borrow_logic`, etc.)

2. **No Direct User Entry Points**: Users interact with the protocol through other modules that have friend access to the `pool` module

3. **Resource-Oriented Design**: The Move implementation leverages Move's resource model for safer asset management

4. **Streamlined Interest Rate Strategy**: The interest rate calculation still follows the utilization-based approach where:

   - Interest rates increase as utilization increases

   - There are optimal utilization points and slope parameters

   - But the implementation only needs to track and update variable rate indices

5. **Native Token Integration**: The implementation is designed to work with Aptos's native token model

This architecture provides strong safety guarantees while maintaining the core functionality of the Aave protocol, adapted for the Move language and Aptos blockchain environment.

## Pool Data Provider View Functions

The `pool_data_provider` module in Aave's Move implementation serves as a utility contract to collect and pre-process information from the Pool. This module contains methods for querying token addresses, reserve data, and other protocol information, similar to the AaveProtocolDataProvider in the Solidity implementation.

### get_all_reserves_tokens

```move=
#[view]
public fun get_all_reserves_tokens(): vector<TokenData>
```

Returns a list of the existing reserves in the pool, pairs include the symbols and token addresses.

**Return Values:**

| Type                | Description                                          |
| ------------------- | ---------------------------------------------------- |
| vector\<TokenData\> | The list of reserves, pairs of symbols and addresses |

The TokenData struct is composed of the following fields:

| Name          | Type    | Description                                 |
| ------------- | ------- | ------------------------------------------- |
| symbol        | String  | The symbol of the underlying reserve asset  |
| token_address | address | The address of the underlying reserve asset |

### get_all_a_tokens

```move=
#[view]
public fun get_all_a_tokens(): vector<TokenData>
```

Returns a list of the existing ATokens in the pool, pairs include the symbols and token addresses.

**Return Values:**

| Type                | Description                                         |
| ------------------- | --------------------------------------------------- |
| vector\<TokenData\> | The list of ATokens, pairs of symbols and addresses |

The TokenData struct is composed of the following fields:

| Name          | Type    | Description                          |
| ------------- | ------- | ------------------------------------ |
| symbol        | String  | The symbol of aToken of the reserve  |
| token_address | address | The address of aToken of the reserve |

### get_all_var_tokens

```move=
#[view]
public fun get_all_var_tokens(): vector<TokenData>
```

Returns a list of the existing variable debt tokens in the pool, pairs include the symbols and token addresses.

**Return Values:**

| Type                | Description                                                    |
| ------------------- | -------------------------------------------------------------- |
| vector\<TokenData\> | The list of variableDebtTokens, pairs of symbols and addresses |

The TokenData struct is composed of the following fields:

| Name          | Type    | Description                                       |
| ------------- | ------- | ------------------------------------------------- |
| symbol        | String  | The symbol of variable debt token of the reserve  |
| token_address | address | The address of variable debt token of the reserve |

### get_reserve_configuration_data

```move=
#[view]
public fun get_reserve_configuration_data(
    asset: address
): (u256, u256, u256, u256, u256, bool, bool, bool, bool)
```

Returns the configuration data of the reserve. Not returning borrow and supply caps for compatibility, nor pause flag.

**Input Parameters:**

| Name  | Type    | Description                                        |
| ----- | ------- | -------------------------------------------------- |
| asset | address | The address of the underlying asset of the reserve |

**Return Values:**

| Position | Type | Description                                                 |
| -------- | ---- | ----------------------------------------------------------- |
| 0        | u256 | The number of decimals of the reserve                       |
| 1        | u256 | The ltv of the reserve                                      |
| 2        | u256 | The liquidation threshold of the reserve                    |
| 3        | u256 | The liquidation bonus of the reserve                        |
| 4        | u256 | The reserve factor of the reserve                           |
| 5        | bool | True if the usage as collateral is enabled, false otherwise |
| 6        | bool | True if borrowing is enabled, false otherwise               |
| 7        | bool | True if it is active, false otherwise                       |
| 8        | bool | True if it is frozen, false otherwise                       |

### get_reserve_data

```move=
#[view]
public fun get_reserve_data(
    asset: address
): (u256, u256, u256, u256, u256, u256, u256, u64)
```

Returns the state of the reserve.

**Input Parameters:**

| Name  | Type    | Description                                        |
| ----- | ------- | -------------------------------------------------- |
| asset | address | The address of the underlying asset of the reserve |

**Return Values:**

| Position | Type | Description                                                          |
| -------- | ---- | -------------------------------------------------------------------- |
| 0        | u256 | The scaled amount of tokens accrued to treasury that is to be minted |
| 1        | u256 | The total supply of the aToken                                       |
| 2        | u256 | The total variable debt of the reserve                               |
| 3        | u256 | The liquidity rate of the reserve                                    |
| 4        | u256 | The variable borrow rate of the reserve                              |
| 5        | u256 | The liquidity index of the reserve                                   |
| 6        | u256 | The variable borrow index of the reserve                             |
| 7        | u64  | The timestamp of the last update of the reserve                      |

### get_user_reserve_data

```move=
#[view]
public fun get_user_reserve_data(
    asset: address,
    user: address
): (u256, u256, u256, u256, bool)
```

Returns the user data in the reserve.

**Input Parameters:**

| Position | Type | Description                                                   |
| -------- | ---- | ------------------------------------------------------------- |
| 0        | u256 | The current aToken balance of the user                        |
| 1        | u256 | The current variable debt of the user                         |
| 2        | u256 | The scaled variable debt of the user                          |
| 3        | u256 | The liquidity rate of the reserve                             |
| 4        | bool | True if the user is using the asset as collateral, else false |

### get_reserve_tokens_addresses

```move=
#[view]
public fun get_reserve_tokens_addresses(
    asset: address
): (address, address)
```

Returns the addresses of the aToken and variableDebtToken of the reserve.

**Input Parameters:**

| Name  | Type    | Description                                        |
| ----- | ------- | -------------------------------------------------- |
| asset | address | The address of the underlying asset of the reserve |

**Return Values:**

| Position | Type    | Description                                  |
| -------- | ------- | -------------------------------------------- |
| 0        | address | The AToken address of the reserve            |
| 1        | address | The VariableDebtToken address of the reserve |

### get_reserve_caps

```move=
#[view]
public fun get_reserve_caps(
    asset: address
): (u256, u256)
```

Returns the caps parameters of the reserve.

**Input Parameters:**

| Name  | Type    | Description                                        |
| ----- | ------- | -------------------------------------------------- |
| asset | address | The address of the underlying asset of the reserve |

**Return Values:**

| Position | Type | Description                   |
| -------- | ---- | ----------------------------- |
| 0        | u256 | The borrow cap of the reserve |
| 1        | u256 | The supply cap of the reserve |

### get_siloed_borrowing

```move
#[view]
public fun get_siloed_borrowing(
    asset: address
): bool
```

Returns the siloed borrowing flag. It returns true if the asset is siloed for borrowing.

**Input Parameters:**

| Name  | Type    | Description                                        |
| ----- | ------- | -------------------------------------------------- |
| asset | address | The address of the underlying asset of the reserve |

**Return Values:**

| Type | Description                               |
| ---- | ----------------------------------------- |
| bool | True if the asset is siloed for borrowing |

### get_debt_ceiling

```move=
#[view]
public fun get_debt_ceiling(
    asset: address
): u256
```

Returns the debt ceiling of the reserve.

**Input Parameters:**

| Name  | Type    | Description                                        |
| ----- | ------- | -------------------------------------------------- |
| asset | address | The address of the underlying asset of the reserve |

**Return Values:**

| Type | Description                     |
| ---- | ------------------------------- |
| u256 | The debt ceiling of the reserve |

### get_liquidation_protocol_fee

```move=
#[view]
public fun get_liquidation_protocol_fee(
    asset: address
): u256
```

Returns the protocol fee on the liquidation bonus.

**Input Parameters:**

| Name  | Type    | Description                                        |
| ----- | ------- | -------------------------------------------------- |
| asset | address | The address of the underlying asset of the reserve |

**Return Values:**

| Type | Description                     |
| ---- | ------------------------------- |
| u256 | The protocol fee on liquidation |

### get_borrowable_in_isolation

```move=
#[view]
public fun get_borrowable_in_isolation(
    self: &ReserveConfigurationMap
): bool
```

Returns true if the asset can be borrowed in isolation mode.

**Input Parameters:**

| Name | Type                    | Description               |
| ---- | ----------------------- | ------------------------- |
| self | ReserveConfigurationMap | The reserve configuration |

**Return Values:**

| Type | Description                                                        |
| ---- | ------------------------------------------------------------------ |
| bool | True if the asset is borrowable in isolation mode, false otherwise |

### get_emode_category

```move=
#[view]
public fun get_emode_category(
    self: &ReserveConfigurationMap
): u256
```

Returns the eMode category of the asset.

**Input Parameters:**

| Name | Type                    | Description               |
| ---- | ----------------------- | ------------------------- |
| self | ReserveConfigurationMap | The reserve configuration |

**Return Values:**

| Type | Description           |
| ---- | --------------------- |
| u256 | The eMode category ID |

### get_user_emode

```move=
#[view]
public fun get_user_emode(
    user: address
): u8
```

Returns the eMode the user is using.

**Input Parameters:**

| Name | Type    | Description             |
| ---- | ------- | ----------------------- |
| user | address | The address of the user |

**Return Values:**

| Type | Description                                           |
| ---- | ----------------------------------------------------- |
| u8   | The eMode ID (0 means the user isn't using any eMode) |

### get_emode_category_data

```move=
#[view]
public fun get_emode_category_data(
    id: u8
): EModeCategory
```

Returns the E-Mode category configuration for the specified category ID.

**Input Parameters:**

| Name | Type | Description            |
| ---- | ---- | ---------------------- |
| id   | u8   | The ID of the category |

**Return Values:**

| Field Name            | Type   | Description                               |
| --------------------- | ------ | ----------------------------------------- |
| ltv                   | u16    | The loan-to-value of the category         |
| liquidation_threshold | u16    | The liquidation threshold of the category |
| liquidation_bonus     | u16    | The liquidation bonus of the category     |
| label                 | String | The label of the category                 |

### get_user_account_data

```move=
#[view]
public fun get_user_account_data(
    user: address
): (u256, u256, u256, u256, u256, u256)
```

Returns the user account data across all reserves.

**Input Parameters:**

| Name | Type    | Description             |
| ---- | ------- | ----------------------- |
| user | address | The address of the user |

**Return Values:**

| Position | Type | Description                        |
| -------- | ---- | ---------------------------------- |
| 0        | u256 | Total collateral in base currency  |
| 1        | u256 | Total debt in base currency        |
| 2        | u256 | Available borrows in base currency |
| 3        | u256 | Current liquidation threshold      |
| 4        | u256 | Loan to value ratio                |
| 5        | u256 | Health factor                      |

### get_flash_loan_enabled

```move
#[view]
public fun get_flash_loan_enabled(
    asset: address
): bool
```

Returns true if flash loans are enabled for the reserve.

**Input Parameters:**

| Name  | Type    | Description                                        |
| ----- | ------- | -------------------------------------------------- |
| asset | address | The address of the underlying asset of the reserve |

**Return Values:**

| Type | Description                                      |
| ---- | ------------------------------------------------ |
| bool | True if flash loans are enabled, false otherwise |

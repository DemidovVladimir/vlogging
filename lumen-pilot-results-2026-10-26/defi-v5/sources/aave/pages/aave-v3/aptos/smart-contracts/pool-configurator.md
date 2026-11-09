# Pool Configurator

Reference for the `aave-config` Move package. The asset listing and risk parameter methods.

## Only Asset Listing Or Pool Admins Methods

### init_reserves

```move=
public entry fun init_reserves(
    account: &signer,
    underlying_asset: vector<address>,
    treasury: vector<address>,
    a_token_name: vector<String>,
    a_token_symbol: vector<String>,
    variable_debt_token_name: vector<String>,
    variable_debt_token_symbol: vector<String>
)
```

Initializes multiple reserves using the arrays of initialization parameters as input. Only callable by accounts with the Asset Listing Admin or Pool Admin role.

**Input Parameters:**

| Name                       | Type              | Description                                           |
| -------------------------- | ----------------- | ----------------------------------------------------- |
| account                    | &signer           | The signer account of the caller                      |
| underlying_asset           | vector\<address\> | The addresses of the underlying assets                |
| treasury                   | vector\<address\> | The addresses of the aToken contract implementations  |
| a_token_name               | vector\<String\>  | The addresses of the variable debt token contracts    |
| a_token_symbol             | vector\<String\>  | The addresses of the interest rate strategy contracts |
| variable_debt_token_name   | vector\<String\>  | The names of the aTokens                              |
| variable_debt_token_symbol | vector\<String\>  | The symbols of the aTokens                            |

## Only Emergency Admin Methods

### set_pool_pause

```move=
public entry fun set_pool_pause(
    account: &signer, paused: bool, grace_period: u64
)
```

Pauses or unpauses all the protocol reserves. In the paused state all the protocol interactions are suspended. Only callable by accounts with the Emergency Admin or Pool Admin role.

**Input Parameters:**

| Name         | Type    | Description                                                                    |
| ------------ | ------- | ------------------------------------------------------------------------------ |
| account      | &signer | The signer account of the caller                                               |
| paused       | bool    | true if the protocol needs to be paused, otherwise false                       |
| grace_period | u64     | Count of seconds after unpause during which liquidations will not be available |

## Only Emergency Or Pool Admin Methods

### set_reserve_pause

```move=
public entry fun set_reserve_pause(
    account: &signer,
    asset: address,
    paused: bool,
    grace_period: u64
)
```

Pauses a reserve. A paused reserve does not allow any interaction (supply, borrow, repay, liquidate, atoken transfers). Only callable by accounts with the Emergency Admin or Pool Admin role.

**Input Parameters:**

| Name         | Type    | Description                                                                    |
| ------------ | ------- | ------------------------------------------------------------------------------ |
| account      | &signer | The signer account of the caller                                               |
| asset        | address | The address of the underlying asset of the reserve                             |
| paused       | bool    | true if pausing the reserve, false if unpausing the reserve                    |
| grace_period | u64     | Count of seconds after unpause during which liquidations will not be available |

## Only Pool Admin Methods

### drop_reserve

```move=
public entry fun drop_reserve(
    account: &signer,
    asset: address
)
```

Drops a reserve entirely. Only callable by accounts with the Pool Admin role.

**Input Parameters:**

| Name    | Type    | Description                        |
| ------- | ------- | ---------------------------------- |
| account | &signer | The signer account of the caller   |
| asset   | address | The address of the reserve to drop |

### set_reserve_active

```move=
public entry fun set_reserve_active(
    account: &signer,
    asset: address,
    active: bool
)
```

Activate or deactivate a reserve. Only callable by accounts with the Pool Admin role.

**Input Parameters:**

| Name    | Type    | Description                                             |
| ------- | ------- | ------------------------------------------------------- |
| account | &signer | The signer account of the caller                        |
| asset   | address | The address of the underlying asset of the reserve      |
| active  | bool    | true if the reserve needs to be active, false otherwise |

### update_flashloan_premium_total

```move=
public entry fun update_flashloan_premium_total(
    account: &signer,
    new_flashloan_premium_total: u128
)
```

Updates the total flash loan premium. The premium is calculated on the total amount borrowed, and is expressed in bps. Only callable by accounts with the Pool Admin role.

**Input Parameters:**

| Name                        | Type    | Description                      |
| --------------------------- | ------- | -------------------------------- |
| account                     | &signer | The signer account of the caller |
| new_flashloan_premium_total | u128    | The total flashloan premium      |

### update_flashloan_premium_to_protocol

```move=
public entry fun update_flashloan_premium_to_protocol(
    account: &signer,
    new_flashloan_premium_to_protocol: u128
)
```

Updates the flash loan premium collected by protocol reserves. The premium to protocol is calculated on the total flashloan premium, and is expressed in bps. Only callable by accounts with the Pool Admin role.

**Input Parameters:**

| Name                              | Type    | Description                                                     |
| --------------------------------- | ------- | --------------------------------------------------------------- |
| account                           | &signer | The signer account of the caller                                |
| new_flashloan_premium_to_protocol | u128    | The part of the flashloan premium sent to the protocol treasury |

## Only Risk Or Pool Admins Methods

### set_reserve_borrowing

```move=
public entry fun set_reserve_borrowing(
    account: &signer,
    asset: address,
    enabled: bool
)
```

Enables or disables borrowing on a reserve. Only callable by accounts with the Risk Admin or Pool Admin role.

**Input Parameters:**

| Name    | Type    | Description                                            |
| ------- | ------- | ------------------------------------------------------ |
| account | &signer | The signer account of the caller                       |
| asset   | address | The address of the underlying asset of the reserve     |
| enabled | bool    | true if borrowing needs to be enabled, false otherwise |

### set_reserve_flash_loaning

```move=
public entry fun set_reserve_flash_loaning(
    account: &signer,
    asset: address,
    enabled: bool
)
```

Enables or disables flash loans for a reserve. Only callable by accounts with the Risk Admin or Pool Admin role.

**Input Parameters:**

| Name    | Type    | Description                      |
| ------- | ------- | -------------------------------- |
| account | &signer | The signer account of the caller |
| asset   | address | Address of the reserve asset     |
| enabled | bool    | true to enable, false to disable |

### configure_reserve_as_collateral

```move=
public entry fun configure_reserve_as_collateral(
    account: &signer,
    asset: address,
    ltv: u256,
    liquidation_threshold: u256,
    liquidation_bonus: u256
)
```

Configures the reserve collateralization parameters. All the values are expressed in bps. A value of 10000 results in 100.00%. The liquidation_bonus is always above 100%. A value of 10500 means the liquidator will receive a 5% bonus. Only callable by accounts with the Risk Admin or Pool Admin role.

**Input Parameters:**

| Name                  | Type    | Description                                                                                        |
| --------------------- | ------- | -------------------------------------------------------------------------------------------------- |
| account               | &signer | The signer account of the caller                                                                   |
| asset                 | address | The address of the underlying asset of the reserve                                                 |
| ltv                   | u256    | The loan to value of the asset when used as collateral                                             |
| liquidation_threshold | u256    | The threshold at which loans using this asset as collateral will be considered undercollateralized |
| liquidation_bonus     | u256    | The bonus liquidators receive to liquidate this asset                                              |

### set_reserve_freeze

```move=
public entry fun set_reserve_freeze(
    account: &signer,
    asset: address,
    freeze: bool
)
```

Freeze or unfreeze a reserve. A frozen reserve doesn't allow any new supply or borrow but allows repayments, liquidations, rate rebalances and withdrawals. Only callable by accounts with the Risk Admin or Pool Admin role.

**Input Parameters:**

| Name    | Type    | Description                                             |
| ------- | ------- | ------------------------------------------------------- |
| account | &signer | The signer account of the caller                        |
| asset   | address | The address of the underlying asset of the reserve      |
| freeze  | bool    | true if the reserve needs to be frozen, false otherwise |

### set_borrowable_in_isolation

```move=
public entry fun set_borrowable_in_isolation(
    account: &signer,
    asset: address,
    borrowable: bool
)
```

Sets the borrowable in isolation flag for the reserve. When this flag is set to true, the asset will be borrowable against isolated collaterals and the borrowed amount will be accumulated in the isolated collateral's total debt exposure. Only callable by accounts with the Risk Admin or Pool Admin role.

**Input Parameters:**

| Name       | Type    | Description                                                          |
| ---------- | ------- | -------------------------------------------------------------------- |
| account    | &signer | The signer account of the caller                                     |
| asset      | address | The address of the underlying asset of the reserve                   |
| borrowable | bool    | true if the asset should be borrowable in isolation, false otherwise |

### set_reserve_factor

```move=
public entry fun set_reserve_factor(
    account: &signer,
    asset: address,
    new_reserve_factor: u256
)
```

Updates the reserve factor of a reserve. Only callable by accounts with the Risk Admin or Pool Admin role.

**Input Parameters:**

| Name               | Type    | Description                                        |
| ------------------ | ------- | -------------------------------------------------- |
| account            | &signer | The signer account of the caller                   |
| asset              | address | The address of the underlying asset of the reserve |
| new_reserve_factor | u256    | The new reserve factor of the reserve              |

### set_debt_ceiling

```move=
public entry fun set_debt_ceiling(
    account: &signer,
    asset: address,
    new_debt_ceiling: u256
)
```

Sets the debt ceiling for an asset. Only callable by accounts with the Risk Admin or Pool Admin role.

**Input Parameters:**

| Name             | Type    | Description                                        |
| ---------------- | ------- | -------------------------------------------------- |
| account          | &signer | The signer account of the caller                   |
| asset            | address | The address of the underlying asset of the reserve |
| new_debt_ceiling | u256    | The new debt ceiling                               |

### set_siloed_borrowing

```move=
public entry fun set_siloed_borrowing(
    account: &signer,
    asset: address,
    new_siloed: bool
)
```

Sets siloed borrowing for an asset. Only callable by accounts with the Risk Admin or Pool Admin role.

**Input Parameters:**

| Name       | Type    | Description                                                                         |
| ---------- | ------- | ----------------------------------------------------------------------------------- |
| account    | &signer | The signer account of the caller                                                    |
| asset      | address | The address of the underlying asset of the reserve                                  |
| new_siloed | bool    | The new siloed borrowing state - enable or disable siloed borrowing for the reserve |

### set_borrow_cap

```move=
public entry fun set_borrow_cap(
    account: &signer,
    asset: address,
    new_borrow_cap: u256
)
```

Updates the borrow cap of a reserve. Only callable by accounts with the Risk Admin or Pool Admin role.

**Input Parameters:**

| Name           | Type    | Description                                                                                         |
| -------------- | ------- | --------------------------------------------------------------------------------------------------- |
| account        | &signer | The signer account of the caller                                                                    |
| asset          | address | The address of the underlying asset of the reserve                                                  |
| new_borrow_cap | u256    | The new borrow cap of the reserve in whole tokens. A borrow cap of 0 signifies that there is no cap |

### set_supply_cap

```move=
public entry fun set_supply_cap(
    account: &signer,
    asset: address,
    new_supply_cap: u256
)
```

Updates the supply cap of a reserve. Only callable by accounts with the Risk Admin or Pool Admin role.

**Input Parameters:**

| Name           | Type    | Description                                                                                         |
| -------------- | ------- | --------------------------------------------------------------------------------------------------- |
| account        | &signer | The signer account of the caller                                                                    |
| asset          | address | The address of the underlying asset of the reserve                                                  |
| new_supply_cap | u256    | The new supply cap of the reserve in whole tokens. A supply cap of 0 signifies that there is no cap |

### disable_liquidation_grace_period

```move=
public entry fun disable_liquidation_grace_period(
    account: &signer,
    asset: address
)
```

Disables the liquidation grace period for a reserve. Only callable by accounts with the Emergency Admin or Pool Admin role.

**Input Parameters:**

| Name    | Type    | Description                      |
| ------- | ------- | -------------------------------- |
| account | &signer | The signer account of the caller |
| asset   | address | Address of the reserve asset     |

### set_liquidation_protocol_fee

```move=
public entry fun set_liquidation_protocol_fee(
    account: &signer,
    asset: address,
    new_fee: u256
)
```

Updates the liquidation protocol fee of reserve. Only callable by accounts with the Risk Admin or Pool Admin role.

**Input Parameters:**

| Name    | Type    | Description                                                       |
| ------- | ------- | ----------------------------------------------------------------- |
| account | &signer | The signer account of the caller                                  |
| asset   | address | The address of the underlying asset of the reserve                |
| new_fee | u256    | The new liquidation protocol fee of the reserve, expressed in bps |

### set_emode_category

```move=
public entry fun set_emode_category(
    account: &signer,
    category_id: u8,
    ltv: u16,
    liquidation_threshold: u16,
    liquidation_bonus: u16,
    label: String
)
```

Adds a new efficiency mode (eMode) category. Only callable by accounts with the Risk Admin or Pool Admin role.

**Input Parameters:**

| Name                  | Type    | Description                                                                                                                    |
| --------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------ |
| account               | &signer | The signer account of the caller                                                                                               |
| category_id           | u8      | The id of the category to be configured. category_id ≠ 0. NOTE: category 0 is reserved for the default category i.e. non-eMode |
| ltv                   | u16     | The loan to value for the associated eMode category. It must be less than or equal to the liquidationThreshold                 |
| liquidation_threshold | u16     | The liquidation threshold associated with the category                                                                         |
| liquidation_bonus     | u16     | The liquidation bonus associated with the category                                                                             |
| label                 | String  | A custom label identifying the category                                                                                        |

### set_asset_emode_category

```move=
public entry fun set_asset_emode_category(
    account: &signer,
    asset: address,
    new_category_id: u8
)
```

Sets the efficiency mode category for an asset. Only callable by accounts with the Risk Admin or Pool Admin role.

**Input Parameters:**

| Name            | Type    | Description                                        |
| --------------- | ------- | -------------------------------------------------- |
| account         | &signer | The signer account of the caller                   |
| asset           | address | The address of the underlying asset of the reserve |
| new_category_id | u8      | The new eMode category for the asset               |

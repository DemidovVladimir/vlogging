# Pool Configurator

The `PoolConfigurator` contract implements the configuration methods for the Aave Protocol. The 'write methods' below are grouped by permissioned system roles that are managed by [`ACLManager`](./acl-manager).

The source code is available on [GitHub](https://github.com/aave-dao/aave-v3-origin/blob/main/src/contracts/protocol/pool/PoolConfigurator.sol).

## Write Methods

## Only Asset Listing Or Pool Admins Methods

### initReserves

```solidity
function initReserves(ConfiguratorInputTypes.InitReserveInput[] calldata input) external override onlyAssetListingOrPoolAdmins
```

Initializes multiple reserves using the array of initialization parameters as input.

#### Input Parameters:

| Name  | Type                                        | Description                            |
| :---- | :------------------------------------------ | :------------------------------------- |
| input | `ConfiguratorInputTypes.InitReserveInput[]` | The array of initialization parameters |

The [ConfiguratorInputTypes.InitReserveInput[]](https://github.com/aave-dao/aave-v3-origin/blob/main/src/contracts/protocol/libraries/types/ConfiguratorInputTypes.sol) struct is composed of the following fields:

| Name                        | Type      | Description                                                         |
| :-------------------------- | :-------- | :------------------------------------------------------------------ |
| aTokenImpl                  | `address` | The address of the aToken contract implementation                   |
| variableDebtTokenImpl       | `address` | The address of the variable debt token contract                     |
| useVirtualBalance           | `bool`    | `true` if reserve is utilising virtual balance accounting           |
| interestRateStrategyAddress | `address` | The address of the interest rate strategy contract for this reserve |
| underlyingAsset             | `address` | The address of the underlying asset                                 |
| treasury                    | `address` | The address of the treasury                                         |
| incentivesController        | `address` | The address of the incentives controller for this aToken            |
| aTokenName                  | `string`  | The name of the aToken                                              |
| aTokenSymbol                | `string`  | The symbol of the aToken                                            |
| variableDebtTokenName       | `string`  | The name of the variable debt token                                 |
| variableDebtTokenSymbol     | `string`  | The symbol of the variable debt token                               |
| params                      | `bytes`   | A set of encoded parameters for additional initialization           |
| interestRateData            | `bytes`   | Encoded interest rate strategy data                                 |

## Only Emergency Admin Methods

### setPoolPause

```solidity
function setPoolPause(bool paused) external override onlyEmergencyOrPoolAdmin
```

Pauses or unpauses all the protocol reserves. In the paused state all the protocol interactions are suspended.

#### Input Parameters:

| Name   | Type   | Description                                                  |
| :----- | :----- | :----------------------------------------------------------- |
| paused | `bool` | `true` if the protocol needs to be paused, otherwise `false` |

## Only Emergency Or Pool Admin Methods

### setReservePause

```solidity
function setReservePause(address asset, bool paused) public override onlyEmergencyOrPoolAdmin
```

Pauses a reserve. A paused reserve does not allow any interaction (supply, borrow, repay, liquidate, atoken transfers).

#### Input Parameters:

| Name   | Type      | Description                                                     |
| :----- | :-------- | :-------------------------------------------------------------- |
| asset  | `address` | The address of the underlying asset of the reserve              |
| paused | `bool`    | `true` if pausing the reserve, `false` if unpausing the reserve |

## Only Pool Admin Methods

### dropReserve

```solidity
function dropReserve(address asset) external override onlyPoolAdmin
```

Drops a reserve entirely.

#### Input Parameters:

| Name  | Type      | Description                        |
| :---- | :-------- | :--------------------------------- |
| asset | `address` | The address of the reserve to drop |

### updateAToken

```solidity
function updateAToken(ConfiguratorInputTypes.UpdateATokenInput calldata input) external override onlyPoolAdmin
```

Updates the aToken implementation for the reserve. Takes the aToken update parameters as input.

#### Input Parameters:

| Name  | Type                                       | Description                  |
| :---- | :----------------------------------------- | :--------------------------- |
| input | `ConfiguratorInputTypes.UpdateATokenInput` | The aToken update parameters |

The [ConfiguratorInputTypes.UpdateATokenInput](https://github.com/aave-dao/aave-v3-origin/blob/main/src/contracts/protocol/libraries/types/ConfiguratorInputTypes.sol) struct is composed of the following fields:

| Name                 | Type      | Description                                               |
| :------------------- | :-------- | :-------------------------------------------------------- |
| asset                | `address` | The address of the underlying asset of the reserve        |
| treasury             | `address` | The address of the treasury                               |
| incentivesController | `address` | The address of the incentives controller for this aToken  |
| name                 | `string`  | The name of the aToken                                    |
| symbol               | `string`  | The symbol of the aToken                                  |
| implementation       | `address` | The new aToken implementation                             |
| params               | `bytes`   | A set of encoded parameters for additional initialization |

### updateVariableDebtToken

```solidity
function updateVariableDebtToken(ConfiguratorInputTypes.UpdateDebtTokenInput calldata input) external override onlyPoolAdmin
```

#### Input Parameters:

| Name  | Type                                          | Description                             |
| :---- | :-------------------------------------------- | :-------------------------------------- |
| input | `ConfiguratorInputTypes.UpdateDebtTokenInput` | The variableDebtToken update parameters |

The [ConfiguratorInputTypes.UpdateDebtTokenInput](https://github.com/aave-dao/aave-v3-origin/blob/main/src/contracts/protocol/libraries/types/ConfiguratorInputTypes.sol) struct is composed of the following fields:

| Name                 | Type      | Description                                                         |
| :------------------- | :-------- | :------------------------------------------------------------------ |
| asset                | `address` | The address of the underlying asset of the reserve                  |
| incentivesController | `address` | The address of the incentives controller for this variableDebtToken |
| name                 | `string`  | The name of the variableDebtToken                                   |
| symbol               | `string`  | The symbol of the variableDebtToken                                 |
| implementation       | `address` | The new variableDebtToken implementation                            |
| params               | `bytes`   | A set of encoded parameters for additional initialization           |

### setReserveActive

```solidity
function setReserveActive(address asset, bool active) external override onlyPoolAdmin
```

Activate or deactivate a reserve.

#### Input Parameters:

| Name   | Type      | Description                                                 |
| :----- | :-------- | :---------------------------------------------------------- |
| asset  | `address` | The address of the underlying asset of the reserve          |
| active | `bool`    | `true` if the reserve needs to be active, `false` otherwise |

### updateBridgeProtocolFee

```solidity
function updateBridgeProtocolFee(uint256 newBridgeProtocolFee) external override onlyPoolAdmin
```

Updates the bridge fee collected by the protocol reserves.

#### Input Parameters:

| Name                 | Type      | Description                                                         |
| :------------------- | :-------- | :------------------------------------------------------------------ |
| newBridgeProtocolFee | `uint256` | The part of the fee sent to the protocol treasury, expressed in bps |

### setReserveFlashLoaning

```solidity
function setReserveFlashLoaning(address asset, bool enabled) external override onlyRiskOrPoolAdmins
```

Enables or disables flash loans for a reserve.

#### Input Parameters:

| Name    | Type    | Description                      |
| :------ | :------ | :------------------------------- |
| asset   | address | Address of the reserve asset     |
| enabled | bool    | true to enable, false to disable |

### updateFlashloanPremiumTotal

```solidity
function updateFlashloanPremiumTotal(uint128 newFlashloanPremiumTotal) external override onlyPoolAdmin
```

Updates the total flash loan premium. The premium is calculated on the total amount borrowed, and is expressed in bps.

The total flash loan premium consists of two parts:

- A part is sent to aToken holders as extra balance, and
- A part is collected by the protocol reserves.

#### Input Parameters:

| Name                     | Type      | Description                 |
| :----------------------- | :-------- | :-------------------------- |
| newFlashloanPremiumTotal | `uint128` | The total flashloan premium |

### updateFlashloanPremiumToProtocol

```solidity
function updateFlashloanPremiumToProtocol(uint128 newFlashloanPremiumToProtocol) external override onlyPoolAdmin
```

Updates the flash loan premium collected by protocol reserves. The premium to protocol is calculated on the total flashloan premium, and is expressed in bps.

#### Input Parameters:

| Name                          | Type      | Description                                                     |
| :---------------------------- | :-------- | :-------------------------------------------------------------- |
| newFlashloanPremiumToProtocol | `uint128` | The part of the flashloan premium sent to the protocol treasury |

## Only Risk Or Pool Admins Methods

### setReserveBorrowing

```solidity
function setReserveBorrowing(address asset, bool enabled) external override onlyRiskOrPoolAdmins
```

#### Input Parameters:

| Name    | Type      | Description                                                |
| :------ | :-------- | :--------------------------------------------------------- |
| asset   | `address` | The address of the underlying asset of the reserve         |
| enabled | `bool`    | `true` if borrowing needs to be enabled, `false` otherwise |

### configureReserveAsCollateral

```solidity
function configureReserveAsCollateral(
    address asset,
    uint256 ltv,
    uint256 liquidationThreshold,
    uint256 liquidationBonus
) external override onlyRiskOrPoolAdmins
```

Configures the reserve collateralization parameters. All the values are expressed in bps. A value of 10000 results in 100.00%. The `liquidationBonus` is always above 100%. A value of 105% means the liquidator will receive a 5% bonus.

#### Input Parameters:

| Name                 | Type      | Description                                                                                        |
| :------------------- | :-------- | :------------------------------------------------------------------------------------------------- |
| asset                | `address` | The address of the underlying asset of the reserve                                                 |
| ltv                  | `uint256` | The loan to value of the asset when used as collateral                                             |
| liquidationThreshold | `uint256` | The threshold at which loans using this asset as collateral will be considered undercollateralized |
| liquidationBonus     | `uint256` | The bonus liquidators receive to liquidate this asset                                              |

### setReserveFreeze

```solidity
function setReserveFreeze(address asset, bool freeze) external override onlyRiskOrPoolAdmins
```

Freeze or unfreeze a reserve. A frozen reserve doesn't allow any new supply or borrow but allows repayments, liquidations, rate rebalances and withdrawals.

#### Input Parameters:

| Name   | Type      | Description                                                 |
| :----- | :-------- | :---------------------------------------------------------- |
| asset  | `address` | The address of the underlying asset of the reserve          |
| freeze | `bool`    | `true` if the reserve needs to be frozen, `false` otherwise |

### setBorrowableInIsolation

```solidity
function setBorrowableInIsolation(address asset, bool borrowable) external override onlyRiskOrPoolAdmins
```

Sets the borrowable in isolation flag for the reserve. When this flag is set to true, the asset will be borrowable against isolated collaterals and the borrowed amount will be accumulated in the isolated collateral's total debt exposure. Only assets of the same family (e.g. USD stablecoins) should be borrowable in isolation mode to keep consistency in the debt ceiling calculations.

#### Input Parameters:

| Name       | Type      | Description                                                              |
| :--------- | :-------- | :----------------------------------------------------------------------- |
| asset      | `address` | The address of the underlying asset of the reserve                       |
| borrowable | `bool`    | `true` if the asset should be borrowable in isolation, `false` otherwise |

### setReserveFactor

```solidity
function setReserveFactor(address asset, uint256 newReserveFactor) external override onlyRiskOrPoolAdmins
```

Updates the reserve factor of a reserve.

#### Input Parameters:

| Name             | Type      | Description                                        |
| :--------------- | :-------- | :------------------------------------------------- |
| asset            | `address` | The address of the underlying asset of the reserve |
| newReserveFactor | `uint256` | The new reserve factor of the reserve              |

### setDebtCeiling

```solidity
function setDebtCeiling(address asset, uint256 newDebtCeiling) external override onlyRiskOrPoolAdmins
```

Sets the debt ceiling for an asset.

#### Input Parameters:

| Name           | Type      | Description                                        |
| :------------- | :-------- | :------------------------------------------------- |
| asset          | `address` | The address of the underlying asset of the reserve |
| newDebtCeiling | `uint256` | The new debt ceiling                               |

### setSiloedBorrowing

```solidity
function setSiloedBorrowing(address asset, bool newSiloed) external override onlyRiskOrPoolAdmins
```

Sets siloed borrowing for an asset

#### Input Parameters:

| Name      | Type      | Description                                                                         |
| :-------- | :-------- | :---------------------------------------------------------------------------------- |
| asset     | `address` | The address of the underlying asset of the reserve                                  |
| newSiloed | `bool`    | The new siloed borrowing state - enable or disable siloed borrowing for the reserve |

### setBorrowCap

```solidity
function setBorrowCap(address asset, uint256 newBorrowCap) external override onlyRiskOrPoolAdmins
```

Updates the borrow cap of a reserve. Allows [`RISK_ADMIN`](./acl-manager#roles-risk-admin) and [`POOL_ADMIN`](./acl-manager#roles-pool-admin) to add/update cap on the total borrow that can be borrowed from the reserve. Once the borrow cap is reached, no more borrow positions for the given reserve asset can be initiated.

#### Input Parameters:

| Name         | Type      | Description                                                                                         |
| :----------- | :-------- | :-------------------------------------------------------------------------------------------------- |
| asset        | `address` | The address of the underlying asset of the reserve                                                  |
| newBorrowCap | `uint256` | The new borrow cap of the reserve in whole tokens. A borrow cap of 0 signifies that there is no cap |

### setSupplyCap

```solidity
function setSupplyCap(address asset, uint256 newSupplyCap) external override onlyRiskOrPoolAdmins
```

Updates the supply cap of a reserve. Allows [`RISK_ADMIN`](./acl-manager#roles-risk-admin) and [`POOL_ADMIN`](./acl-manager#roles-pool-admin) to add/update liquidity supply cap on the reserve. Once the supply cap is reached, no more liquidity for the given reserve asset can be supplied to the pool.

#### Input Parameters:

| Name         | Type      | Description                                                                                         |
| :----------- | :-------- | :-------------------------------------------------------------------------------------------------- |
| asset        | `address` | The address of the underlying asset of the reserve                                                  |
| newSupplyCap | `uint256` | The new supply cap of the reserve in whole tokens. A supply cap of 0 signifies that there is no cap |

### disableLiquidationGracePeriod

```solidity
function disableLiquidationGracePeriod(address asset) external override onlyEmergencyOrPoolAdmin
```

Disables the liquidation grace period for a reserve.

#### Input Parameters

| Name  | Type    | Description                  |
| :---- | :------ | :--------------------------- |
| asset | address | Address of the reserve asset |

### setLiquidationProtocolFee

```solidity
function setLiquidationProtocolFee(address asset, uint256 newFee) external override onlyRiskOrPoolAdmins
```

Updates the liquidation protocol fee of reserve.

#### Input Parameters:

| Name   | Type      | Description                                                       |
| :----- | :-------- | :---------------------------------------------------------------- |
| asset  | `address` | The address of the underlying asset of the reserve                |
| newFee | `uint256` | The new liquidation protocol fee of the reserve, expressed in bps |

### setEModeCategory

```solidity
function setEModeCategory(
    uint8 categoryId,
    uint16 ltv,
    uint16 liquidationThreshold,
    uint16 liquidationBonus,
    string calldata label
) external override onlyRiskOrPoolAdmins
```

Adds a new efficiency mode (eMode) category. Allows [`RISK_ADMIN`](./acl-manager#roles-risk-admin) and [`POOL_ADMIN`](./acl-manager#roles-pool-admin) to configure existing or add new `eModeCategory`

If zero is provided as oracle address, the default asset oracles will be used to compute the overall debt and overcollateralization of the users using this category. The new ltv and liquidation threshold must be greater than the base ltvs and liquidation thresholds of all assets within the eMode category.

#### Input Parameters:

| Name                 | Type     | Description                                                                                                                   |
| :------------------- | :------- | :---------------------------------------------------------------------------------------------------------------------------- |
| categoryId           | `uint8`  | The id of the category to be configured. categoryId ≠ 0. NOTE: category 0 is reserved for the default category i.e. non-eMode |
| ltv                  | `uint16` | The loan to value for the associated eMode category. It must be less than or equal to the liquidationThreshold                |
| liquidationThreshold | `uint16` | The liquidation threshold associated with the category                                                                        |
| liquidationBonus     | `uint16` | The liquidation bonus associated with the category                                                                            |
| label                | `string` | A custom label identifying the category                                                                                       |

### setAssetCollateralInEMode

```solidity
function setAssetCollateralInEMode(address asset, uint8 categoryId, bool allowed) external override onlyRiskOrPoolAdmins
```

Assign collateral status to an asset for a particular efficiency mode (eMode) category. Allows [`RISK_ADMIN`](./acl-manager#roles-risk-admin) and [`POOL_ADMIN`](./acl-manager#roles-pool-admin) to configure `eModeCategory` of an asset.

#### Input Parameters:

| Name       | Type      | Description                                                           |
| :--------- | :-------- | :-------------------------------------------------------------------- |
| asset      | `address` | The address of the underlying asset of the reserve                    |
| categoryId | `uint8`   | eMode category id to set asset collateral status for                  |
| allowed    | `bool`    | `true` if `asset` is enabled as collateral in designated `categoryId` |

### setAssetBorrowableInEMode

```solidity
function setAssetBorrowableInEMode(address asset, uint8 categoryId, bool borrowable) external override onlyRiskOrPoolAdmins
```

Configures if an asset can be borrowed in a specific eMode category.

#### Input Parameters:

| Name       | Type    | Description                      |
| :--------- | :------ | :------------------------------- |
| asset      | address | Address of the reserve asset     |
| categoryId | uint8   | eMode category ID                |
| borrowable | bool    | true to enable, false to disable |

### setUnbackedMintCap

```solidity
function setUnbackedMintCap(address asset, uint256 newUnbackedMintCap) external override onlyRiskOrPoolAdmins
```

Updates the unbacked mint cap of reserve.

#### Input Parameters:

| Name               | Type      | Description                                        |
| :----------------- | :-------- | :------------------------------------------------- |
| asset              | `address` | The address of the underlying asset of the reserve |
| newUnbackedMintCap | `uint256` | The new unbacked mint cap of the reserve           |

### setReserveInterestRateData

```solidity
function setReserveInterestRateData(address asset, bytes calldata rateData) external onlyRiskOrPoolAdmins
```

Sets custom interest rate parameters for a reserve.

#### Input Parameters:

| Name     | Type    | Description                      |
| :------- | :------ | :------------------------------- |
| asset    | address | Address of the reserve asset     |
| rateData | bytes   | Encodes rate strategy parameters |

### setReserveInterestRateStrategyAddress

```solidity
function setReserveInterestRateStrategyAddress(address asset, address rateStrategyAddress, bytes calldata rateData) external override onlyRiskOrPoolAdmins
```

Sets the interest rate strategy of a reserve.

#### Input Parameters:

| Name                | Type      | Description                                        |
| :------------------ | :-------- | :------------------------------------------------- |
| asset               | `address` | The address of the underlying asset of the reserve |
| rateStrategyAddress | `address` | The address of the interest strategy contract      |
| rateData            | `bytes`   | Encoded interst rate strategy data                 |

## Pure Methods

### getRevision

```solidity
function getRevision() internal pure virtual override returns (uint256)
```

Returns the revision number of the contract. Needs to be defined in the inherited class as a constant.

Returns `0x1`.

#### Return Values:

| Type      | Description         |
| :-------- | :------------------ |
| `uint256` | The revision number |

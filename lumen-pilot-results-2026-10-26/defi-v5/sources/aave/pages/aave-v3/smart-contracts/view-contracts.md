# View Contracts

The Aave Protocol has several view contracts to assist with querying onchain data.

## UiPoolDataProvider

Contract that returns an array of all reserve or user data for a particular market (for example, liquidity, token addresses, rate strategy), used by the [Aave Interface](https://github.com/aave/interface/) to display Markets and Dashboard data. Compatible with both V2 and v3 of the Aave Protocol.

The [Aave Utilities SDK](https://github.com/aave/aave-utilities) includes an interface to make calls to this contract, and functions to format the response for frontend use-cases.

The source code is available on [GitHub](https://github.com/aave-dao/aave-v3-origin/blob/main/src/contracts/helpers/UiPoolDataProviderV3.sol).

## View Methods

### getReservesList

```solidity
function getReservesList(IPoolAddressesProvider provider) public view override returns (address[] memory)
```

Returns the list of initialised reserves in the Pool associated with the given [`provider`](./pool-addresses-provider).

#### Input Parameters:

| Name     | Type                     | Description                                |
| :------- | :----------------------- | :----------------------------------------- |
| provider | `IPoolAddressesProvider` | The given provider for the associated pool |

#### Return Values:

| Type        | Description                                  |
| :---------- | :------------------------------------------- |
| `address[]` | The list of initialised reserves in the Pool |

### getReservesData

```solidity
function getReservesData(IPoolAddressesProvider provider) public view override returns (AggregatedReserveData[] memory, BaseCurrencyInfo memory)
```

Returns `BaseCurrencyInfo` of the Pool and `AggregatedReserveData[]` for all the initialised reserves in the Pool associated with the given [`provider`](./pool-addresses-provider).

#### Input Parameters:

| Name     | Type                     | Description                                |
| :------- | :----------------------- | :----------------------------------------- |
| provider | `IPoolAddressesProvider` | The given provider for the associated pool |

#### Return Values:

| Type                      | Description                   |
| :------------------------ | :---------------------------- |
| `BaseCurrencyInfo`        | The base currency information |
| `AggregatedReserveData[]` | The aggregated reserve data   |

The `BaseCurrencyInfo` struct is composed of the following fields:

| Name                              | Type      | Description                                       |
| :-------------------------------- | :-------- | :------------------------------------------------ |
| marketReferenceCurrencyUnit       | `uint256` | Reference aka base currency of the Aave market    |
| marketReferenceCurrencyPriceInUsd | `int256`  | Price of reference aka base currency in USD       |
| networkBaseTokenPriceInUsd        | `int256`  | Price of native token of the network/chain in USD |
| networkBaseTokenPriceDecimals     | `uint8`   | Decimals of native token of the network/chain     |

The `AggregatedReserveData` struct is composed of the following fields:

| Name                           | Type      | Description                                                                |
| :----------------------------- | :-------- | :------------------------------------------------------------------------- |
| underlyingAsset                | `address` | The address of the underlying asset of the reserve                         |
| name                           | `string`  | The name of the underlying reserve asset                                   |
| symbol                         | `string`  | The symbol of the underlying reserve asset                                 |
| decimals                       | `uint256` | The number of decimals of the reserve                                      |
| baseLTVasCollateral            | `uint256` | The ltv of the reserve                                                     |
| reserveLiquidationThreshold    | `uint256` | The liquidation threshold of the reserve                                   |
| reserveLiquidationBonus        | `uint256` | The liquidation bonus of the resurve                                       |
| reserveFactor                  | `uint256` | The reserve factor of the reserve                                          |
| usageAsCollateralEnabled       | `bool`    | `true` if the asset is enabled to be used as collateral, `false` otherwise |
| borrowingEnabled               | `bool`    | `true` if borrowing is enabled, `false` otherwise                          |
| isActive                       | `bool`    | `true` if reserve is active, `false` otherwise                             |
| isFrozen                       | `bool`    | `true` if reserve is frozen, `false` otherwise                             |
| BASE DATA                      |           |                                                                            |
| liquidityIndex                 | `uint128` | The liquidity index of the reserve                                         |
| variableBorrowIndex            | `uint128` | The variable borrow index of the reserve                                   |
| liquidityRate                  | `uint128` | The liquidity rate of the reserve                                          |
| variableBorrowRate             | `uint128` | The variable borrow rate of the reserve                                    |
| lastUpdateTimestamp            | `uint40`  | The timestamp of the last update of the reserve                            |
| aTokenAddress                  | `address` | The AToken address of the reserve                                          |
| variableDebtTokenAddress       | `address` | The VariableDebtToken address of the reserve                               |
| interestRateStrategyAddress    | `address` | The address of the Interest Rate strategy                                  |
|                                |           |                                                                            |
| availableLiquidity             | `uint256` | The liquidity available                                                    |
| totalScaledVariableDebt        | `uint256` | The total scaled variable debt                                             |
| priceInMarketReferenceCurrency | `uint256` | Price of reference aka base currency of Aave market                        |
| priceOracle                    | `address` | The address of the price oracle used by the associated market              |
| variableRateSlope1             | `uint256` | The variable rate slope                                                    |
| variableRateSlope2             | `uint256` | The variable rate slope                                                    |
| baseVariableBorrowRate         | `uint256` | The base variable borrow rate, expressed in ray                            |
| optimalUsageRatio              | `uint256` | The optimal usage ratio                                                    |
|                                |           |                                                                            |
| v3 ONLY                        |           |                                                                            |
| isPaused                       | `bool`    | `true` if the pool is paused, `false` otherwise                            |
| isSiloedBorrowing              | `bool`    | `true` if the asset is siloed for borrowing                                |
| accruedToTreasury              | `uint128` | The amount of tokens accrued to treasury that is to be minted              |
| unbacked                       | `uint128` | The amount of unbacked aTokens of the reserve                              |
| isolationModeTotalDebt         | `uint128` | The outstanding debt borrowed against this asset in isolation mode         |
| flashLoanEnabled               | `bool`    | `true` is asset is available to borrow in flash loan transaction           |
|                                |           |                                                                            |
| debtCeiling                    | `uint256` | The debt ceiling of the reserve                                            |
| debtCeilingDecimals            | `uint256` | The debt ceiling decimals                                                  |
| eModeCategoryId                | `uint8`   | The eMode id of the reserve                                                |
| borrowCap                      | `uint256` | The borrow cap of the reserve                                              |
| supplyCap                      | `uint256` | The supply cap of the reserve                                              |
| borrowableInIsolation          | `bool`    | `true` is asset available to borrow against isolated collateral assets     |
| v3.1                           |           |                                                                            |
| virtualAccActive               | `bool`    | `true` if virtual accounting is enabled for a reserve                      |
| virtualUnderlyingBalance       | `uint128` | Balance of reserve if virtual accounting is used                           |

### getUserReservesData

```solidity
function getUserReservesData(IPoolAddressesProvider provider, address user) external view override returns (UserReserveData[] memory, uint8)
```

Returns `UserReserveData[]` for all user reserves in the Pool associated with the given [`provider`](./pool-addresses-provider).

#### Input Parameters:

| Name     | Type                     | Description                                |
| :------- | :----------------------- | :----------------------------------------- |
| provider | `IPoolAddressesProvider` | The given provider for the associated pool |
| user     | `address`                | The address of the user                    |

### UserReserveData

| Type                | Description           |
| :------------------ | :-------------------- |
| `UserReserveData[]` | The user reserve data |

The [UserReserveData](https://github.com/aave-dao/aave-v3-origin/blob/main/src/contracts/helpers/interfaces/IUiPoolDataProviderV3.sol) struct is composed of the following fields:

| Name                           | Type      | Description                                                                                  |
| :----------------------------- | :-------- | :------------------------------------------------------------------------------------------- |
| underlyingAsset                | `address` | The address of the underlying asset supplied/borrowed                                        |
| scaledATokenBalance            | `uint256` | The scaled balance of the aToken. scaledBalance = balance/liquidityIndex                     |
| usageAsCollateralEnabledOnUser | `bool`    | `true` if the supplied asset is enabled to be used as collateral, `false` otherwise          |
| scaledVariableDebt             | `uint256` | The scaled balance of borrow position: (current balance = scaled balance \* liquidity index) |

### getEModes

Returns an array of all available E-mode categories in the Pool associated with the [provider](./pool-addresses-provider).

```solidity
function getEModes(IPoolAddressesProvider provider) external view returns (Emode[] memory)
```

#### Input Parameters:

| Name     | Type                   | Description                                                                     |
| :------- | :--------------------- | :------------------------------------------------------------------------------ |
| provider | IPoolAddressesProvider | The PoolAddressesProvider for the associated Pool to fetch EMode categories for |

#### Return Parameters:

| Name       | Type    | Description                               |
| :--------- | :------ | :---------------------------------------- |
| categories | Emode[] | The list of E-Modes available in the pool |

#### Emode

The Emode struct is composed of the following fields:

| Name  | Type                    | Description                         |
| :---- | :---------------------- | :---------------------------------- |
| id    | uint8                   | The unique identifier of the E-Mode |
| eMode | DataTypes.EModeCategory | The E-Mode configuration details    |

#### DataTypes.EModeCategory

The EModeCategory struct is composed of the following fields:
| Name | Type | Description |
| :----------------------------- | :-------- | :---------------------------------------------------------------------------------- |
| ltv | uint16 | Loan-to-Value ratio for the E-Mode category
| liquidationThreshold | uint16 | The threshold at which liquidation is triggered
| liquidationBonus | uint16 | The bonus applied during liquidation
| collateralBitmap | uint128 | Bitmap representing eligible collateral for this E-Mode
| label | string | The label describing the E-Mode category
| borrowableBitmap | uint128 | Bitmap representing borrowable assets for this E-Mode

## WalletBalanceProvider

Fetches tokens balances for all underlying tokens of Aave reserves for one user address.

> [!NOTE]
> This contract is not used within the Aave Protocol. It is an accessory
> contract used to reduce the number of calls towards the blockchain from the
> Aave backend.

> [!NOTE]
> For getting ETH (native chain token) balance use `MOCK_ETH_ADDRESS =
> 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE`.

The source code is available on [GitHub](https://github.com/aave-dao/aave-v3-origin/blob/main/src/contracts/helpers/WalletBalanceProvider.sol).

## View Methods

### balanceOf

```solidity
function balanceOf(address user, address token) public view returns (uint256)
```

Checks the token balance of a wallet in a token contract. Returns the balance of the token for `user` (ETH included with `MOCK_ETH_ADDRESS`).

#### Input Parameters:

| Name  | Type      | Description              |
| :---- | :-------- | :----------------------- |
| user  | `address` | The address of the user  |
| token | `address` | The address of the token |

#### Return Values:

| Type      | Description                                                             |
| :-------- | :---------------------------------------------------------------------- |
| `uint256` | The balance of the token for user. Returns 0 for a non-contract address |

### batchBalanceOf

```solidity
function batchBalanceOf(address[] calldata users, address[] calldata tokens) external view returns (uint256[] memory)
```

Returns balances for a list of `users` and `tokens` (ETH included with `MOCK_ETH_ADDRESS`).

#### Input Parameters:

| Name   | Type        | Description        |
| :----- | :---------- | :----------------- |
| users  | `address[]` | The list of users  |
| tokens | `address[]` | The list of tokens |

#### Return Values:

| Type        | Description                      |
| :---------- | :------------------------------- |
| `uint256[]` | A list of balances for each user |

### getUserWalletBalances

```solidity
function getUserWalletBalances(address provider, address user) external view returns (address[] memory, uint256[] memory)
```

Provides balances of user wallet for all reserves available on the pool.

#### Input Parameters:

| Name     | Type      | Description                 |
| :------- | :-------- | :-------------------------- |
| provider | `address` | The address of the provider |
| user     | `address` | The address of the user     |

#### Return Values:

| Type        | Description                      |
| :---------- | :------------------------------- |
| `address[]` | A list of user wallets           |
| `uint256[]` | A list of balances for each user |

# UiIncentiveDataProviderV3

Contract that returns an array of all reserve incentives or user claimable rewards within a particular market, used by the [Aave Labs Interface](https://github.com/aave/interface/) to display incentives data. Compatible with both V2 and v3 of the Aave Protocol.

The [Aave Utilities SDK](https://github.com/aave/aave-utilities) includes an interface to make calls to this contract, and functions to format the response for frontend use-cases.

The source code is available on [GitHub](https://github.com/aave-dao/aave-v3-origin/blob/main/src/contracts/helpers/UiIncentiveDataProviderV3.sol).

## View Methods

#### getFullReservesIncentiveData

```solidity
function getFullReservesIncentiveData(IPoolAddressesProvider provider, address user)
    external
    view
    override
    returns (AggregatedReserveIncentiveData[] memory, UserReserveIncentiveData[] memory)
```

Returns both `AggregatedReserveIncentiveData[]` and `UserReserveIncentiveData[]` for the given `user` for the pool associated with the given [`provider`](./pool-addresses-provider).

#### Input Parameters:

| Name     | Type                     | Description                                |
| :------- | :----------------------- | :----------------------------------------- |
| provider | `IPoolAddressesProvider` | The given provider for the associated pool |
| user     | `address`                | The address of the user                    |

#### Return Values:

| Type                               | Description                           |
| :--------------------------------- | :------------------------------------ |
| `AggregatedReserveIncentiveData[]` | The aggregated reserve incentive data |
| `UserReserveIncentiveData[]`       | The user reserve incentive data       |

The `AggregatedReserveIncentiveData` struct is composed of the following fields:

| Name            | Type            | Description                                                                                              |
| :-------------- | :-------------- | :------------------------------------------------------------------------------------------------------- |
| underlyingAsset | `address`       | Address of the asset supplied/borrowed in Pool                                                           |
| aIncentiveData  | `IncentiveData` | Details of rewards distributed for supplying to Aave Pool i.e. rewards for aToken holders                |
| vIncentiveData  | `IncentiveData` | Details of rewards distributed for variable debt borrowed from Aave Pool i.e. rewards for vToken holders |

The `UserReserveIncentiveData` struct is composed of the following fields:

| Name                     | Type                | Description                                                                                            |
| :----------------------- | :------------------ | :----------------------------------------------------------------------------------------------------- |
| underlyingAsset          | `address`           | Address of the asset supplied/borrowed in Pool                                                         |
| aTokenIncentivesUserData | `UserIncentiveData` | Details of user rewards received for supplying to Aave Pool i.e. rewards for aToken                    |
| vTokenIncentivesUserData | `UserIncentiveData` | Details of user rewards received for borrowing at variable rate from Aave Pool i.e. rewards for vToken |

#### getReservesIncentivesData

```solidity
function getReservesIncentivesData(IPoolAddressesProvider provider) external view override returns (AggregatedReserveIncentiveData[] memory)
```

Returns `AggregatedReserveIncentiveData[]` for the pool associated with the given [`provider`](./pool-addresses-provider).

#### Input Parameters:

| Name     | Type                     | Description                                |
| :------- | :----------------------- | :----------------------------------------- |
| provider | `IPoolAddressesProvider` | The given provider for the associated pool |

#### Return Values:

| Type                               | Description                           |
| :--------------------------------- | :------------------------------------ |
| `AggregatedReserveIncentiveData[]` | The aggregated reserve incentive data |

The `AggregatedReserveIncentiveData` struct is composed of the following fields:

| Name            | Type            | Description                                                                                              |
| :-------------- | :-------------- | :------------------------------------------------------------------------------------------------------- |
| underlyingAsset | `address`       | Address of the asset supplied/borrowed in Pool                                                           |
| aIncentiveData  | `IncentiveData` | Details of rewards distributed for supplying to Aave Pool i.e. rewards for aToken holders                |
| vIncentiveData  | `IncentiveData` | Details of rewards distributed for variable debt borrowed from Aave Pool i.e. rewards for vToken holders |

#### getUserReservesIncentivesData

```solidity
function getUserReservesIncentivesData(IPoolAddressesProvider provider, address user) external view override returns (UserReserveIncentiveData[] memory)
```

Returns the `UserReserveIncentiveData[]` for the given `user` for the pool associated with the given [`provider`](./pool-addresses-provider).

#### Input Parameters:

| Name     | Type                     | Description                                |
| :------- | :----------------------- | :----------------------------------------- |
| provider | `IPoolAddressesProvider` | The given provider for the associated pool |

#### Return Values:

| Type                         | Description                     |
| :--------------------------- | :------------------------------ |
| `UserReserveIncentiveData[]` | The user reserve incentive data |

The `UserReserveIncentiveData` struct is composed of the following fields:

| Name                     | Type                | Description                                                                                            |
| :----------------------- | :------------------ | :----------------------------------------------------------------------------------------------------- |
| underlyingAsset          | `address`           | Address of the asset supplied/borrowed in Pool                                                         |
| aTokenIncentivesUserData | `UserIncentiveData` | Details of user rewards received for supplying to Aave Pool i.e. rewards for aToken                    |
| vTokenIncentivesUserData | `UserIncentiveData` | Details of user rewards received for borrowing at variable rate from Aave Pool i.e. rewards for vToken |

## AaveProtocolDataProvider

The `AaveProtocolDataProvider` is a peripheral contract to collect and pre-process information from the [`Pool`](./pool). This contract contains methods for querying token addresses, reserve parameters, and user account information. The methods of the `PoolDataProvider` are more granular than the `UiPoolDataProvider`, which queries data for reserve tokens or user balances simultaneously.

The source code is available on [GitHub](https://github.com/aave-dao/aave-v3-origin/blob/main/src/contracts/helpers/AaveProtocolDataProvider.sol).

## View Methods

### getAllReservesTokens

```solidity
function getAllReservesTokens() external view returns (TokenData[] memory)
```

Returns a list of the existing reserves in the pool, pairs include the `symbol` and `tokenAddress`. Handles `MKR` and `ETH` in a different way since they do not have standard symbol functions.

#### Return Values:

| Type          | Description                                          |
| :------------ | :--------------------------------------------------- |
| `TokenData[]` | The list of reserves, pairs of symbols and addresses |

The `TokenData` struct is composed of the following fields:

| Name         | Type      | Description                                 |
| :----------- | :-------- | :------------------------------------------ |
| symbol       | `string`  | The symbol of the underlying reserve asset  |
| tokenAddress | `address` | The address of the underlying reserve asset |

### getAllATokens

```solidity
function getAllATokens() external view returns (TokenData[] memory)
```

Returns a list of the existing ATokens in the pool, pairs include the `symbol` and `tokenAddress`.

#### Return Values:

| Type          | Description                                         |
| :------------ | :-------------------------------------------------- |
| `TokenData[]` | The list of ATokens, pairs of symbols and addresses |

The `TokenData` struct is composed of the following fields:

| Name         | Type      | Description                          |
| :----------- | :-------- | :----------------------------------- |
| symbol       | `string`  | The symbol of aToken of the reserve  |
| tokenAddress | `address` | The address of aToken of the reserve |

### getReserveConfigurationData

```solidity
function getReserveConfigurationData(address asset) external view returns (
    uint256 decimals,
    uint256 ltv,
    uint256 liquidationThreshold,
    uint256 liquidationBonus,
    uint256 reserveFactor,
    bool usageAsCollateralEnabled,
    bool borrowingEnabled,
    bool stableBorrowRateEnabled,
    bool isActive,
    bool isFrozen
)
```

Returns the configuration data of the reserve as described below. Does not return borrow and supply caps, nor pause flag for compatibility.

#### Input Parameters:

| Name  | Type      | Description                                        |
| :---- | :-------- | :------------------------------------------------- |
| asset | `address` | The address of the underlying asset of the reserve |

#### Return Values:

| Name                     | Type      | Description                                                     |
| :----------------------- | :-------- | :-------------------------------------------------------------- |
| decimals                 | `uint256` | The number of decimals of the reserve                           |
| ltv                      | `uint256` | The ltv of the reserve                                          |
| liquidationThreshold     | `uint256` | The liquidation threshold of the reserve                        |
| liquidationBonus         | `uint256` | The liquidation bonus of the reserve                            |
| reserveFactor            | `uint256` | The reserve factor of the reserve                               |
| usageAsCollateralEnabled | `bool`    | `true` if the usage as collateral is enabled, `false` otherwise |
| borrowingEnabled         | `bool`    | `true` if borrowing is enabled, `false` otherwise               |
| stableBorrowRateEnabled  | `bool`    | Always `false` (deprecated)                                     |
| isActive                 | `bool`    | `true` if reserve is active, `false` otherwise                  |
| isFrozen                 | `bool`    | `true` if reserve is frozen, `false` otherwise                  |

### getReserveCaps

```solidity
function getReserveCaps(address asset) external view returns (uint256 borrowCap, uint256 supplyCap)
```

Returns the caps parameters of the reserve.

#### Input Parameters:

| Name  | Type      | Description                                        |
| :---- | :-------- | :------------------------------------------------- |
| asset | `address` | The address of the underlying asset of the reserve |

### Return Values:

| Name      | Type      | Description                   |
| :-------- | :-------- | :---------------------------- |
| borrowCap | `uint256` | The borrow cap of the reserve |
| supplyCap | `uint256` | The supply cap of the reserve |

### getPaused

```solidity
function getPaused(address asset) external view returns (bool isPaused)
```

Returns true if the pool `isPaused`.

#### Input Parameters:

| Name  | Type      | Description                                        |
| :---- | :-------- | :------------------------------------------------- |
| asset | `address` | The address of the underlying asset of the reserve |

#### Return Values:

| Name     | Type   | Description                                     |
| :------- | :----- | :---------------------------------------------- |
| isPaused | `bool` | `true` if the pool is paused, `false` otherwise |

### getSiloedBorrowing

```solidity
function getSiloedBorrowing(address asset) external view override returns (bool)
```

Returns the siloed borrowing flag. It returns true if the `asset` is [siloed for borrowing](../aave-v3/overview#aave-v3-key-features-siloed-borrowing).

#### Input Parameters:

| Name  | Type      | Description                                        |
| :---- | :-------- | :------------------------------------------------- |
| asset | `address` | The address of the underlying asset of the reserve |

#### Return Values:

| Type   | Description                                 |
| :----- | :------------------------------------------ |
| `bool` | `true` if the asset is siloed for borrowing |

### getLiquidationProtocolFee

```solidity
function getLiquidationProtocolFee(address asset) external view override returns (uint256)
```

Returns the protocol fee on the liquidation bonus.

#### Input Parameters:

| Name  | Type      | Description                                        |
| :---- | :-------- | :------------------------------------------------- |
| asset | `address` | The address of the underlying asset of the reserve |

#### Return Values:

| Type      | Description                     |
| :-------- | :------------------------------ |
| `uint256` | The protocol fee on liquidation |

### getUnbackedMintCap

```solidity
function getUnbackedMintCap(address asset) external view override returns (uint256)
```

Returns the unbacked mint cap of the reserve.

#### Input Parameters:

| Name  | Type      | Description                                        |
| :---- | :-------- | :------------------------------------------------- |
| asset | `address` | The address of the underlying asset of the reserve |

#### Return Values:

| Type      | Description                          |
| :-------- | :----------------------------------- |
| `uint256` | The unbacked mint cap of the reserve |

### getDebtCeiling

```solidity
function getDebtCeiling(address asset) external view override returns (uint256)
```

Returns the debt ceiling of the reserve.

#### Input Parameters:

| Name  | Type      | Description                                        |
| :---- | :-------- | :------------------------------------------------- |
| asset | `address` | The address of the underlying asset of the reserve |

#### Return Values:

| Type      | Description                     |
| :-------- | :------------------------------ |
| `uint256` | The debt ceiling of the reserve |

### getReserveData

```solidity
function getReserveData(address asset) external view override returns (
    uint256 unbacked,
    uint256 accruedToTreasuryScaled,
    uint256 totalAToken,
    uint256 totalStableDebt,
    uint256 totalVariableDebt,
    uint256 liquidityRate,
    uint256 variableBorrowRate,
    uint256 stableBorrowRate,
    uint256 averageStableBorrowRate,
    uint256 liquidityIndex,
    uint256 variableBorrowIndex,
    uint40 lastUpdateTimestamp
)
```

Returns the reserve data.

#### Input Parameters:

| Name  | Type      | Description                                        |
| :---- | :-------- | :------------------------------------------------- |
| asset | `address` | The address of the underlying asset of the reserve |

#### Return Values:

| Name                    | Type      | Description                                                          |
| :---------------------- | :-------- | :------------------------------------------------------------------- |
| unbacked                | `uint256` | The amount of unbacked aTokens of the reserve                        |
| accruedToTreasuryScaled | `uint256` | The scaled amount of tokens accrued to treasury that is to be minted |
| totalAToken             | `uint256` | The total supply of the aToken                                       |
| totalStableDebt         | `uint256` | The total stable debt of the reserve (deprecated)                    |
| totalVariableDebt       | `uint256` | The total variable debt of the reserve                               |
| liquidityRate           | `uint256` | The liquidity rate of the reserve                                    |
| variableBorrowRate      | `uint256` | The variable borrow rate of the reserve                              |
| stableBorrowRate        | `uint256` | The stable borrow rate of the reserve (deprecated)                   |
| averageStableBorrowRate | `uint256` | The average stable borrow rate of the reserve (deprecated)           |
| liquidityIndex          | `uint256` | The liquidity index of the reserve                                   |
| variableBorrowIndex     | `uint256` | The variable borrow index of the reserve                             |
| lastUpdateTimestamp     | `uint40`  | The timestamp of the last update of the reserve                      |

### getATokenTotalSupply

```solidity
function getATokenTotalSupply(address asset) external view override returns (uint256)
```

Returns the total supply of aTokens for a given `asset`.

#### Input Parameters:

| Name  | Type      | Description                                        |
| :---- | :-------- | :------------------------------------------------- |
| asset | `address` | The address of the underlying asset of the reserve |

#### Return Values:

| Type      | Description                    |
| :-------- | :----------------------------- |
| `uint256` | The total supply of the aToken |

### getTotalDebt

```solidity
function getTotalDebt(address asset) external view override returns (uint256)
```

Returns the total debt for a given `asset`.

#### Input Parameters:

| Name  | Type      | Description                                        |
| :---- | :-------- | :------------------------------------------------- |
| asset | `address` | The address of the underlying asset of the reserve |

#### Return Values:

| Type      | Description                    |
| :-------- | :----------------------------- |
| `uint256` | The total borrows for an asset |

### getUserReserveData

```solidity
function getUserReserveData(address asset, address user) external view returns (
    uint256 currentATokenBalance,
    uint256 currentStableDebt,
    uint256 currentVariableDebt,
    uint256 principalStableDebt,
    uint256 scaledVariableDebt,
    uint256 stableBorrowRate,
    uint256 liquidityRate,
    uint40 stableRateLastUpdated,
    bool usageAsCollateralEnabled
)
```

Returns the following `user` reserve data.

#### Input Parameters:

| Name  | Type      | Description                                        |
| :---- | :-------- | :------------------------------------------------- |
| asset | `address` | The address of the underlying asset of the reserve |
| user  | `address` | The address of the user                            |

#### Return Values:

| Name                     | Type      | Description                                                           |
| :----------------------- | :-------- | :-------------------------------------------------------------------- |
| currentATokenBalance     | `uint256` | The current AToken balance of the user                                |
| currentStableDebt        | `uint256` | The current stable debt of the user (deprecated)                      |
| currentVariableDebt      | `uint256` | The current variable debt of the user                                 |
| principalStableDebt      | `uint256` | The principal stable debt of the user (deprecated)                    |
| scaledVariableDebt       | `uint256` | The scaled variable debt of the user                                  |
| stableBorrowRate         | `uint256` | The stable borrow rate of the user (deprecated)                       |
| liquidityRate            | `uint256` | The liquidity rate of the reserve                                     |
| stableRateLastUpdated    | `uint40`  | The timestamp of the last update of the user stable rate (deprecated) |
| usageAsCollateralEnabled | `bool`    | `true` if the user is using the asset as collateral, else `false`     |

### getReserveTokensAddresses

```solidity
function getReserveTokensAddresses(address asset) external view override returns (
    address aTokenAddress,
    address stableDebtTokenAddress,
    address variableDebtTokenAddress
)
```

Returns the addresses of the `aToken`, `stableDebtToken` and `variableDebtToken` of the reserve.

#### Input Parameters:

| Name  | Type      | Description                                        |
| :---- | :-------- | :------------------------------------------------- |
| asset | `address` | The address of the underlying asset of the reserve |

#### Return Values:

| Name                     | Type      | Description                                             |
| :----------------------- | :-------- | :------------------------------------------------------ |
| aTokenAddress            | `address` | The AToken address of the reserve                       |
| stableDebtTokenAddress   | `address` | The StableDebtToken address of the reserve (deprecated) |
| variableDebtTokenAddress | `address` | The VariableDebtToken address of the reserve            |

### getInterestRateStrategyAddress

```solidity
function getInterestRateStrategyAddress(address asset) external view override returns (address irStrategyAddress)
```

Returns the address of the Interest Rate strategy.

#### Input Parameters:

| Name  | Type      | Description                                        |
| :---- | :-------- | :------------------------------------------------- |
| asset | `address` | The address of the underlying asset of the reserve |

#### Return Values:

| Name              | Type      | Description                               |
| :---------------- | :-------- | :---------------------------------------- |
| irStrategyAddress | `address` | The address of the Interest Rate strategy |

### getReserveDeficit

```solidity
function getReserveDeficit(address asset) external view override returns (uint256)
```

#### Input Parameters:

| Name  | Type      | Description                                        |
| :---- | :-------- | :------------------------------------------------- |
| asset | `address` | The address of the underlying asset of the reserve |

#### Return Values:

| Type      | Description                                                       |
| :-------- | :---------------------------------------------------------------- |
| `uint256` | Current reserve deficit from undercollateralized borrow positions |

## Pure Methods

#### getDebtCeilingDecimals

```solidity
function getDebtCeilingDecimals() external pure override returns (uint256)
```

Returns the debt ceiling decimals.

#### Return Values:

| Type      | Description               |
| --------- | ------------------------- |
| `uint256` | The debt ceiling decimals |

## LiquidationDataProvider

This contract is a utility for fetching and pre-processing liquidation-related parameters for a given user. It aggregates data from the underlying Pool and Price Oracle to determine a user’s position, collateral, borrow details, and liquidation limits according to the protocol parameters.

The source code is available on [GitHub](https://github.com/aave-dao/aave-v3-origin/blob/1f4df52c1be2633b720b3638a299d74b3d5dcbb7/src/contracts/helpers/LiquidationDataProvider.sol).

## View Methods

### getUserPositionFullInfo

```solidity
getUserPositionFullInfo(address user) public view override returns (UserPositionFullInfo memory)
```

Returns aggregated position information for a user including total collateral, total debt, available borrows, current liquidation threshold, loan-to-value (LTV), and health factor. All values are denominated in the base currency.

#### Input Parameters:

| Name | Type      | Description                                       |
| :--- | :-------- | :------------------------------------------------ |
| user | `address` | The address of the user whose position is queried |

#### Return Values:

| Name                 | Type     | Description                                     |
| :------------------- | :------- | :---------------------------------------------- |
| UserPositionFullInfo | `struct` | The aggregated position information of the user |

The `UserPositionFullInfo` struct is composed of the following fields:

| Name                           | Type      | Description                          |
| :----------------------------- | :-------- | :----------------------------------- |
| totalCollateralInBaseCurrency  | `uint256` | Total collateral in base currency    |
| totalDebtInBaseCurrency        | `uint256` | Total debt in base currency          |
| availableBorrowsInBaseCurrency | `uint256` | Available borrows in base currency   |
| currentLiquidationThreshold    | `uint256` | Current liquidation threshold        |
| ltv                            | `uint256` | Loan-to-value ratio                  |
| healthFactor                   | `uint256` | Health factor of the user’s position |

### getCollateralFullInfo

```solidity
getCollateralFullInfo(address user, address collateralAsset) external view override returns (CollateralFullInfo memory)
```

Returns detailed information regarding a user’s collateral for a given asset. The returned struct includes the asset’s unit (based on decimals), its current price (via the Price Oracle), the associated aToken address, the raw collateral balance, and its equivalent value in the base currency.

#### Input Parameters:

| Name            | Type      | Description                                                  |
| :-------------- | :-------- | :----------------------------------------------------------- |
| user            | `address` | The address of the user                                      |
| collateralAsset | `address` | The address of the collateral asset to fetch information for |

#### Return Values:

| Name               | Type     | Description                                             |
| :----------------- | :------- | :------------------------------------------------------ |
| CollateralFullInfo | `struct` | Detailed collateral information for the specified asset |

The `CollateralFullInfo` struct is composed of the following fields:

| Name                            | Type      | Description                                         |
| :------------------------------ | :-------- | :-------------------------------------------------- |
| assetUnit                       | `uint256` | The unit value of the asset (10^decimals)           |
| price                           | `uint256` | Current price of the asset from the Price Oracle    |
| aToken                          | `address` | Address of the aToken associated with the asset     |
| collateralBalance               | `uint256` | The raw collateral balance of the user              |
| collateralBalanceInBaseCurrency | `uint256` | Collateral balance denominated in the base currency |

### getDebtFullInfo

```solidity
getDebtFullInfo(address user, address debtAsset) external view override returns (DebtFullInfo memory)
```

Returns detailed information regarding a user’s debt for a given asset. The returned struct includes the asset’s unit, current price, the associated variable debt token address, the debt balance, and its equivalent value in the base currency.

#### Input Parameters:

| Name      | Type      | Description                                            |
| :-------- | :-------- | :----------------------------------------------------- |
| user      | `address` | The address of the user                                |
| debtAsset | `address` | The address of the debt asset to fetch information for |

#### Return Values:

| Name         | Type     | Description                                       |
| :----------- | :------- | :------------------------------------------------ |
| DebtFullInfo | `struct` | Detailed debt information for the specified asset |

The `DebtFullInfo` struct is composed of the following fields:

| Name                      | Type      | Description                                                  |
| :------------------------ | :-------- | :----------------------------------------------------------- |
| assetUnit                 | `uint256` | The unit value of the asset (10^decimals)                    |
| price                     | `uint256` | Current price of the asset from the Price Oracle             |
| variableDebtToken         | `address` | Address of the variable debt token associated with the asset |
| debtBalance               | `uint256` | The raw debt balance of the user                             |
| debtBalanceInBaseCurrency | `uint256` | Debt balance denominated in the base currency                |

### getLiquidationInfo (without custom debt amount)

```solidity
getLiquidationInfo(address user, address collateralAsset, address debtAsset) public view override returns (LiquidationInfo memory)
```

A convenience function that returns liquidation parameters for a user using the maximum possible debt liquidation amount. Internally, it calls the overloaded version with debtLiquidationAmount set to the maximum (type(uint256).max).

#### Input Parameters:

| Name            | Type      | Description                         |
| :-------------- | :-------- | :---------------------------------- |
| user            | `address` | The address of the user             |
| collateralAsset | `address` | The address of the collateral asset |
| debtAsset       | `address` | The address of the debt asset       |

#### Return Values:

| Name            | Type     | Description                                                        |
| :-------------- | :------- | :----------------------------------------------------------------- |
| LiquidationInfo | `struct` | Detailed liquidation information for the specified user and assets |

The `LiquidationInfo` struct is composed of the following fields:

| Name                          | Type      | Description                                                            |
| :---------------------------- | :-------- | :--------------------------------------------------------------------- |
| userInfo                      | `struct`  | Aggregated position details of the user (`UserPositionFullInfo` above) |
| collateralInfo                | `struct`  | Detailed collateral information (`CollateralFullInfo` above)           |
| debtInfo                      | `struct`  | Detailed debt information (`DebtFullInfo` above)                       |
| maxCollateralToLiquidate      | `uint256` | Maximum collateral that can be liquidated                              |
| maxDebtToLiquidate            | `uint256` | Maximum debt that can be liquidated                                    |
| liquidationProtocolFee        | `uint256` | Protocol fee applied on the liquidation bonus                          |
| amountToPassToLiquidationCall | `uint256` | Adjusted debt amount for the liquidation call                          |

### getLiquidationInfo (with custom debt liquidation amount)

```solidity
getLiquidationInfo(address user, address collateralAsset, address debtAsset, uint256 debtLiquidationAmount) public view override returns (LiquidationInfo memory)
```

Returns comprehensive liquidation parameters for a user given a specific collateral asset and debt asset, considering a custom maximum debt liquidation amount. The function aggregates the user’s position, collateral and debt details, checks if liquidation conditions are met, and computes the optimal amounts for liquidation—including any applicable protocol fees.

#### Input Parameters:

| Name                  | Type      | Description                                                                            |
| :-------------------- | :-------- | :------------------------------------------------------------------------------------- |
| user                  | `address` | The address of the user                                                                |
| collateralAsset       | `address` | The address of the collateral asset to be liquidated                                   |
| debtAsset             | `address` | The address of the debt asset to be repaid                                             |
| debtLiquidationAmount | `uint256` | The maximum debt amount that can be liquidated (if lower than the user’s debt balance) |

#### Return Values:

| Name            | Type     | Description                                                        |
| :-------------- | :------- | :----------------------------------------------------------------- |
| LiquidationInfo | `struct` | Detailed liquidation information for the specified user and assets |

The `LiquidationInfo` struct is composed of the following fields:

| Name                          | Type      | Description                                                            |
| :---------------------------- | :-------- | :--------------------------------------------------------------------- |
| userInfo                      | `struct`  | Aggregated position details of the user (`UserPositionFullInfo` above) |
| collateralInfo                | `struct`  | Detailed collateral information (`CollateralFullInfo` above)           |
| debtInfo                      | `struct`  | Detailed debt information (`DebtFullInfo` above)                       |
| maxCollateralToLiquidate      | `uint256` | Maximum collateral that can be liquidated                              |
| maxDebtToLiquidate            | `uint256` | Maximum debt that can be liquidated                                    |
| liquidationProtocolFee        | `uint256` | Protocol fee applied on the liquidation bonus                          |
| amountToPassToLiquidationCall | `uint256` | Adjusted debt amount for the liquidation call                          |

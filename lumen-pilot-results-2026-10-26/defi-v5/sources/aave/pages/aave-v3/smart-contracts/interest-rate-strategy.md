# Interest Rate Strategy

Implements the calculation of the interest rates depending on the reserve state. The model of interest rate is based on two slopes, one before the `OPTIMAL_USAGE_RATIO` point of usage and another from that point to 100%.

> [!NOTE]
> An instance of this same contract can't be used across different Aave markets
> due to the caching of the [PoolAddressesProvider](./pool-addresses-provider).

The source code is available on [GitHub](https://github.com/aave-dao/aave-v3-origin/blob/main/src/contracts/misc/DefaultReserveInterestRateStrategyV2.sol).

## View Methods

### getVariableRateSlope1

```solidity
function getVariableRateSlope1(address reserve) external view returns (uint256)
```

Returns the variable rate slope below the optimal usage ratio for the specified reserve. This is the variable rate when the usage ratio is between 0 and `OPTIMAL_USAGE_RATIO`.

#### Input Parameters:

| Name    | Type      | Description                |
| :------ | :-------- | :------------------------- |
| reserve | `address` | The address of the reserve |

#### Return Values:

| Type      | Description             |
| :-------- | :---------------------- |
| `uint256` | The variable rate slope |

### getVariableRateSlope2

```solidity
function getVariableRateSlope2(address reserve) external view returns (uint256)
```

Returns the variable rate slope above the optimal usage ratio for the specified reserve. This is the variable rate when the usage ratio is greater than `OPTIMAL_USAGE_RATIO`.

#### Input Parameters:

| Name    | Type      | Description                |
| :------ | :-------- | :------------------------- |
| reserve | `address` | The address of the reserve |

#### Return Values:

| Type      | Description             |
| :-------- | :---------------------- |
| `uint256` | The variable rate slope |

### getBaseVariableBorrowRate

```solidity
function getBaseVariableBorrowRate(address reserve) external view override returns (uint256)
```

Returns the base variable borrow rate for the specified reserve.

#### Input Parameters:

| Name    | Type      | Description                |
| :------ | :-------- | :------------------------- |
| reserve | `address` | The address of the reserve |

#### Return Values:

| Type      | Description                                     |
| :-------- | :---------------------------------------------- |
| `uint256` | The base variable borrow rate, expressed in ray |

### getMaxVariableBorrowRate

```solidity
function getMaxVariableBorrowRate(address reserve) external view override returns (uint256)
```

Returns the maximum variable borrow rate for the specified reserve.

#### Input Parameters:

| Name    | Type      | Description                |
| :------ | :-------- | :------------------------- |
| reserve | `address` | The address of the reserve |

#### Return Values:

| Type      | Description                                        |
| :-------- | :------------------------------------------------- |
| `uint256` | The maximum variable borrow rate, expressed in ray |

### calculateInterestRates

```solidity
function calculateInterestRates(
    DataTypes.CalculateInterestRatesParams memory params
) external view override returns (uint256, uint256)
```

Calculates the interest rates depending on the reserve's state and configurations. This function returns only two values: the liquidity rate and the variable borrow rate.

#### Input Parameters:

| Name   | Type                                     | Description                                       |
| :----- | :--------------------------------------- | :------------------------------------------------ |
| params | `DataTypes.CalculateInterestRatesParams` | The parameters needed to calculate interest rates |

The `DataTypes.CalculateInterestRatesParams` struct is composed of the following fields:

| Name                     | Type      | Description                                                                 |
| :----------------------- | :-------- | :-------------------------------------------------------------------------- |
| unbacked                 | `uint256` | The amount of unbacked tokens                                               |
| liquidityAdded           | `uint256` | The liquidity added during the operation                                    |
| liquidityTaken           | `uint256` | The liquidity taken during the operation                                    |
| totalDebt                | `uint256` | The total borrowed from the reserve                                         |
| reserveFactor            | `uint256` | The reserve portion of the interest that goes to the treasury of the market |
| reserve                  | `address` | The address of the reserve                                                  |
| usingVirtualBalance      | `bool`    | Flag to indicate if the virtual balance is being used                       |
| virtualUnderlyingBalance | `uint256` | The virtual balance of underlying asset used for mintable assets            |

#### Return Values:

| Name               | Type      | Description                                |
| :----------------- | :-------- | :----------------------------------------- |
| liquidityRate      | `uint256` | The liquidity rate, expressed in ray       |
| variableBorrowRate | `uint256` | The variable borrow rate, expressed in ray |

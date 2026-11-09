# Incentives

The [`UiIncentiveDataProvider`](./view-contracts) provides methods to query all active incentive emissions, and claimable user incentives for a particular Aave market.

# RewardsController

`RewardsController` is the main rewards contract where the user interacts to claim the rewards of their positions. It is an abstract contract template to build Distributors contracts for ERC20 rewards to protocol participants. `RewardsController` inherits from [`RewardsDistributor`](https://github.com/aave-dao/aave-v3-origin/blob/main/src/contracts/rewards/RewardsDistributor.sol) to handle the distribution of rewards. The users of the incentivized ERC20 assets will accrue value if they hold their tokens in possession without the need for staking or blocking the assets inside a contract.

The users can claim all the rewards or an individual reward per transaction, with a variety of functions that allow more granularity at claim.

> [!NOTE]
> At every transfer, the asset must call the `handleAction` method to account
> for the user's rewards.

The source code is available on [GitHub](https://github.com/aave-dao/aave-v3-origin/blob/main/src/contracts/rewards/RewardsController.sol).

## Write Methods

### initialize

```solidity
function initialize(address) external initializer
```

Initialize `RewardsController` instance.

#### Input Parameters:

| Type      | Description                                                                         |
| :-------- | :---------------------------------------------------------------------------------- |
| `address` | Unused but required due to being initialized by `PoolAddressProvider._updateImpl()` |

### configureAssets

```solidity
function configureAssets(RewardsDataTypes.RewardsConfigInput[] memory config) external override onlyEmissionManager
```

Configure assets to incentivize with an emission of rewards per second until the end of distribution.

#### Input Parameters:

| Name   | Type                                    | Description                                             |
| :----- | :-------------------------------------- | :------------------------------------------------------ |
| config | `RewardsDataTypes.RewardsConfigInput[]` | The emission per second following rewards unit decimals |

The [RewardsDataTypes.RewardsConfigInput](https://github.com/aave-dao/aave-v3-origin/blob/main/src/contracts/rewards/libraries/RewardsDataTypes.sol) struct is composed of the following fields:

| Name              | Type                  | Description                                                                                                                                                   |
| :---------------- | :-------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| emissionPerSecond | `uint88`              | The emission per second following rewards unit decimals                                                                                                       |
| totalSupply       | `uint256`             | The total supply of the asset to incentivize                                                                                                                  |
| distributionEnd   | `uint32`              | The end of the distribution of the incentives for an asset                                                                                                    |
| asset             | `address`             | The asset address to incentivize                                                                                                                              |
| reward            | `address`             | The reward token address                                                                                                                                      |
| transferStrategy  | `ITransferStrategy`   | The TransferStrategy address with the install hook and claim logic                                                                                            |
| rewardOracle      | `IEACAggregatorProxy` | The Price Oracle of a reward to visualize the incentives at the UI frontend. Must follow Chainlink Aggregator IEACAggregatorProxy interface to be compatible. |

### setTransferStrategy

```solidity
function setTransferStrategy(address reward, ITransferStrategyBase transferStrategy) external onlyEmissionManager
```

Sets a TransferStrategy logic contract that determines the logic of the rewards transfer.

#### Input Parameters:

| Name             | Type      | Description                                        |
| :--------------- | :-------- | :------------------------------------------------- |
| reward           | `address` | The address of the reward token                    |
| transferStrategy | `address` | The address of the TransferStrategy logic contract |

### setRewardOracle

```solidity
function setRewardOracle(address reward, IEACAggregatorProxy rewardOracle) external onlyEmissionManager
```

Sets an Aave Oracle contract to enforce rewards with a source of value.

At the moment of reward configuration, the Incentives Controller performs a check to see if the reward asset oracle is compatible with IEACAggregator proxy. This check is enforced for integrators to show incentives at the current Aave UI without needing to set up an external price registry.

#### Input Parameters:

| Name         | Type                  | Description                                                                    |
| :----------- | :-------------------- | :----------------------------------------------------------------------------- |
| reward       | `address`             | The address of the reward to set the price aggregator                          |
| rewardOracle | `IEACAggregatorProxy` | The address of price aggregator that follows the IEACAggregatorProxy interface |

### handleAction

```solidity
function handleAction(address user, uint256 totalSupply, uint256 userBalance) external override
```

Called by the corresponding asset on transfer hook to update the rewards distribution of a user.

#### Input Parameters:

| Name        | Type      | Description                   |
| :---------- | :-------- | :---------------------------- |
| user        | `address` | The address of the user       |
| totalSupply | `uint256` | The user balance of the asset |
| userBalance | `uint256` | The total supply of the asset |

### claimRewards

```solidity
function claimRewards(
    address[] calldata assets,
    uint256 amount,
    address to,
    address reward
) external override returns (uint256)
```

Claims reward for a user to the desired address, on all the assets of the pool, accumulating the pending rewards. Rewards are received by the `to` address.

#### Input Parameters:

| Name   | Type        | Description                                                                                                    |
| :----- | :---------- | :------------------------------------------------------------------------------------------------------------- |
| assets | `address[]` | The list of assets to check eligible distributions before claiming rewards. Pass a/s/vToken addresses          |
| amount | `uint256`   | The amount of rewards to claim, expressed in wei. Pass `MAX_UINT` to claim the entire unclaimed reward balance |
| to     | `address`   | The address that will be receiving the rewards                                                                 |
| reward | `address`   | The address of the reward token (e.g., stkAAVE)                                                                |

#### Return Values:

| Type      | Description                                           |
| :-------- | :---------------------------------------------------- |
| `uint256` | The amount of rewards claimed for one specific reward |

> [!NOTE]
> The `msg.sender` must be an authorized claimer set using the `setClaimer()`
> method, via a Governance Vote.

### claimRewardsOnBehalf

```solidity
function claimRewardsOnBehalf(
    address[] calldata assets,
    uint256 amount,
    address user,
    address to,
    address reward
) external override onlyAuthorizedClaimers(msg.sender, user) returns (uint256)
```

Claims rewards for a user on behalf, on all the assets of the pool, accumulating the pending rewards of the assets passed by the first argument. The caller must be whitelisted via the `allowClaimOnBehalf` function by the EmissionManager role held by Aave Governance. Rewards are received by the `to` address.

#### Input Parameters:

| Name   | Type        | Description                                                                                                    |
| :----- | :---------- | :------------------------------------------------------------------------------------------------------------- |
| assets | `address[]` | The list of assets to check eligible distributions before claiming rewards. Pass a/s/vToken addresses          |
| amount | `uint256`   | The amount of rewards to claim, expressed in wei. Pass `MAX_UINT` to claim the entire unclaimed reward balance |
| user   | `address`   | The address to check and claim rewards                                                                         |
| to     | `address`   | The address that will be receiving the rewards                                                                 |
| reward | `address`   | The address of the reward token being claimed (e.g., stkAAVE)                                                  |

#### Return Values:

| Type      | Description                   |
| :-------- | :---------------------------- |
| `uint256` | The amount of rewards claimed |

### claimRewardsToSelf

```solidity
function claimRewardsToSelf(address[] calldata assets, uint256 amount, address reward) external override returns (uint256)
```

Claims reward for `msg.sender`, on all the assets of the pool, accumulating the pending rewards passed by the first input parameter. Rewards are received by `msg.sender`.

#### Input Parameters:

| Name   | Type        | Description                                                                                                    |
| :----- | :---------- | :------------------------------------------------------------------------------------------------------------- |
| assets | `address[]` | The list of assets to check eligible distributions before claiming rewards. Pass a/s/vToken addresses          |
| amount | `uint256`   | The amount of rewards to claim, expressed in wei. Pass `MAX_UINT` to claim the entire unclaimed reward balance |
| reward | `address`   | The address of the reward token                                                                                |

#### Return Values:

| Type      | Description                                           |
| :-------- | :---------------------------------------------------- |
| `uint256` | The amount of rewards claimed for one specific reward |

### claimAllRewards

```solidity
function claimAllRewards(address[] calldata assets, address to) external override returns (address[] memory rewardsList, uint256[] memory claimedAmounts)
```

Claims all rewards for a user to the desired address, on all the assets of the pool, accumulating the pending rewards passed by the first input parameter. Rewards are received by the `to` address.

#### Input Parameters:

| Name   | Type        | Description                                                                                                        |
| :----- | :---------- | :----------------------------------------------------------------------------------------------------------------- |
| assets | `address[]` | The list of assets to check eligible distributions before claiming rewards (aToken or variableDebtToken addresses) |
| to     | `address`   | The address that will be receiving the rewards                                                                     |

#### Return Values:

| Name           | Type        | Description                                                                                     |
| :------------- | :---------- | :---------------------------------------------------------------------------------------------- |
| rewardsList    | `address[]` | The list of addresses of the reward tokens                                                      |
| claimedAmounts | `uint256[]` | The list that contains the claimed amount per reward, following the same order as `rewardsList` |

### claimAllRewardsOnBehalf

```solidity
function claimAllRewardsOnBehalf(
    address[] calldata assets,
    address user,
    address to
) external override onlyAuthorizedClaimers(msg.sender, user) returns (address[] memory rewardsList, uint256[] memory claimedAmounts)
```

Claims all rewards for a user on behalf, on all the assets of the pool, accumulating the pending rewards passed by the first input parameter. The caller must be whitelisted via the `allowClaimOnBehalf` function by the EmissionManager role held by Aave Governance. Rewards are received by the `to` address.

#### Input Parameters:

| Name   | Type        | Description                                                                                           |
| :----- | :---------- | :---------------------------------------------------------------------------------------------------- |
| assets | `address[]` | The list of assets to check eligible distributions before claiming rewards. Pass a/s/vToken addresses |
| user   | `address`   | The address to check and claim rewards                                                                |
| to     | `address`   | The address that will be receiving the rewards                                                        |

#### Return Values:

| Name           | Type        | Description                                                                                     |
| :------------- | :---------- | :---------------------------------------------------------------------------------------------- |
| rewardsList    | `address[]` | The list of addresses of the reward tokens                                                      |
| claimedAmounts | `uint256[]` | The list that contains the claimed amount per reward, following the same order as `rewardsList` |

### claimAllRewardsToSelf

```solidity
function claimAllRewardsToSelf(address[] calldata assets) external override returns (address[] memory rewardsList, uint256[] memory claimedAmounts)
```

Claims all rewards accrued by `msg.sender`, on all assets of the pool, accumulating the pending rewards by the first input parameter. Rewards are received by `msg.sender`.

#### Input Parameters:

| Name   | Type        | Description                                                                                           |
| :----- | :---------- | :---------------------------------------------------------------------------------------------------- |
| assets | `address[]` | The list of assets to check eligible distributions before claiming rewards. Pass a/s/vToken addresses |

#### Return Values:

| Name           | Type        | Description                                                                                     |
| :------------- | :---------- | :---------------------------------------------------------------------------------------------- |
| rewardsList    | `address[]` | The list of addresses of the reward tokens                                                      |
| claimedAmounts | `uint256[]` | The list that contains the claimed amount per reward, following the same order as `rewardsList` |

### setClaimer

```solidity
function setClaimer(address user, address caller) external override onlyEmissionManager
```

Whitelists an address to claim rewards on behalf of another address. Can only be called by the `EmissionManager`.

#### Input Parameters:

| Name   | Type      | Description                |
| :----- | :-------- | :------------------------- |
| user   | `address` | The address of the user    |
| caller | `address` | The address of the claimer |

## View Methods

### getClaimer

```solidity
function getClaimer(address user) external view override returns (address)
```

Returns the whitelisted claimer for a certain address. It returns the 0x0 address if it is not set.

#### Input Parameters:

| Name | Type      | Description             |
| :--- | :-------- | :---------------------- |
| user | `address` | The address of the user |

#### Return Values:

| Type      | Description         |
| :-------- | :------------------ |
| `address` | The claimer address |

### getRewardOracle

```solidity
function getRewardOracle(address reward) external view override returns (address)
```

Get the price aggregator oracle address.

| Name   | Type      | Description                     |
| :----- | :-------- | :------------------------------ |
| reward | `address` | The address of the reward token |

#### Return Values:

| Type      | Description                      |
| :-------- | :------------------------------- |
| `address` | The address of the reward oracle |

### getTransferStrategy

```solidity
function getTransferStrategy(address reward) external view override returns (address)
```

Returns the Transfer Strategy implementation contract address being used for a reward address.

| Name   | Type      | Description               |
| :----- | :-------- | :------------------------ |
| reward | `address` | The address of the reward |

#### Return Values:

| Type      | Description                                  |
| :-------- | :------------------------------------------- |
| `address` | The address of the TransferStrategy contract |

## Pure Methods

```solidity
function getRevision() internal pure override returns (uint256)
```

Returns the revision of the implementation contract.

#### Return Values:

| Type      | Description                  |
| :-------- | :--------------------------- |
| `uint256` | The current revision version |

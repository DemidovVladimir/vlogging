# AaveOracle

Contract to get asset prices and manage price sources.

The source code is available on [GitHub](https://github.com/aave-dao/aave-v3-origin/blob/main/src/contracts/misc/AaveOracle.sol).

> [!NOTE]
> This contract is owned by the Aave Governance.

## Write Methods

### setAssetSources

```solidity
function setAssetSources(address[] calldata assets, address[] calldata sources) external override onlyAssetListingOrPoolAdmins
```

Sets the price `sources` for given list of `assets`.

> [!NOTE]
> This method can only be called by a `POOL_ADMIN` or `ASSET_LISTING_ADMIN`.
> Please look at the [`ACLManager`](./acl-manager) contract for further details
> on system roles.

#### Input Parameters:

| Name    | Type        | Description                                                                                |
| :------ | :---------- | :----------------------------------------------------------------------------------------- |
| assets  | `address[]` | The addresses of the assets for which source is being set                                  |
| sources | `address[]` | The address of the source of each asset. Length of assets and sources array should be same |

### setFallbackOracle

```solidity
function setFallbackOracle(address fallbackOracle) external override onlyAssetListingOrPoolAdmins
```

Sets/updates the `fallbackOracle`.

> [!NOTE]
> This method can only be called by a `POOL_ADMIN` or `ASSET_LISTING_ADMIN`.
> Please look at the [`ACLManager`](./acl-manager) contract for further details
> on system roles.

#### Input Parameters:

| Name           | Type      | Description                        |
| :------------- | :-------- | :--------------------------------- |
| fallbackOracle | `address` | The address of the fallback oracle |

## View Methods

### getAssetPrice

```solidity
function getAssetPrice(address asset) public view override returns (uint256)
```

Returns the price of the supported `asset` in [`BASE_CURRENCY`](https://github.com/aave-dao/aave-v3-origin/blob/main/src/contracts/interfaces/IPriceOracleGetter.sol) of the Aave Market in wei.

#### Input Parameters:

| Name  | Type      | Description              |
| :---- | :-------- | :----------------------- |
| asset | `address` | The address of the asset |

#### Return Values:

| Type      | Description                                                         |
| :-------- | :------------------------------------------------------------------ |
| `uint256` | The price of the asset in `BASE_CURRENCY` of the Aave market in wei |

### getAssetsPrices

```solidity
function getAssetsPrices(address[] calldata assets) external view override returns (uint256[] memory)
```

Returns a list of prices from a list of the supported `assets` addresses in [`BASE_CURRENCY`](https://github.com/aave-dao/aave-v3-origin/blob/main/src/contracts/interfaces/IPriceOracleGetter.sol) of the Aave Market. All prices are in wei.

#### Input Parameters:

| Name   | Type        | Description                                                   |
| :----- | :---------- | :------------------------------------------------------------ |
| assets | `address[]` | The list of assets addresses for which price is being queried |

#### Return Values:

| Type        | Description                                                                 |
| :---------- | :-------------------------------------------------------------------------- |
| `uint256[]` | The prices of the given assets in `BASE_CURRENCY` of the Aave market in wei |

### getSourceOfAsset

```solidity
function getSourceOfAsset(address asset) external view override returns (address)
```

Returns the address of the price source for an `asset` address.

#### Input Parameters:

| Name  | Type      | Description              |
| :---- | :-------- | :----------------------- |
| asset | `address` | The address of the asset |

#### Return Values:

| Type      | Description               |
| :-------- | :------------------------ |
| `address` | The address of the source |

### getFallbackOracle

```solidity
function getFallbackOracle() external view returns (address)
```

Returns the `address` of the fallback oracle.

#### Return Values:

| Type      | Description                        |
| :-------- | :--------------------------------- |
| `address` | The address of the fallback oracle |

# PriceOracleSentinel

The `PriceOracleSentinel` contract validates if the operations are allowed depending on the `PriceOracle` health.

This feature introduces a grace period for liquidations and disables borrowing under specific circumstances.

This feature has been specifically designed for L2s to handle eventual downtime of the sequencer (but can be extended to handle other cases, even on L1s, in the future).

Once the `PriceOracle` gets up after an outage or downtime, users can make their positions healthy during a grace period. The `PriceOracle` is considered healthy once its completely up and the grace period has passed.

The source code is available on [GitHub](https://github.com/aave-dao/aave-v3-origin/blob/main/src/contracts/misc/PriceOracleSentinel.sol).

## Write Methods

### setSequencerOracle

```solidity
function setSequencerOracle(address newSequencerOracle) external onlyPoolAdmin
```

Updates the address of the sequencer oracle.

> [!WARNING]
> This method can only be called by PoolAdmin.

This method can only be called by the _Role Admin_, specified by _Aave Governance_, responsible for managing the [`POOL_ADMIN`](aclmanager#pool_admin) role.

#### Input Parameters:

| Name               | Type      | Description                                       |
| :----------------- | :-------- | :------------------------------------------------ |
| newSequencerOracle | `address` | The address of the new Sequencer Oracle to be set |

### setGracePeriod

```solidity
function setGracePeriod(uint256 newGracePeriod) public onlyRiskOrPoolAdmins
```

Updates the duration of the grace period.

> [!WARNING]
> Can only be called by PoolAdmin or RiskAdmin.

#### Input Parameters:

| Name           | Type      | Description                                 |
| :------------- | :-------- | :------------------------------------------ |
| newGracePeriod | `uint256` | The duration of new grace period in seconds |

## View Methods

### isBorrowAllowed

```solidity
function isBorrowAllowed() external view override returns (bool)
```

Returns true if the `borrow` operation is allowed. The operation is not allowed when `PriceOracle` is down or the grace period has not passed.

#### Return Values:

| Type   | Description                                                                                                                |
| :----- | :------------------------------------------------------------------------------------------------------------------------- |
| `bool` | Returns `true` if the `borrow` operation is allowed (the PriceOracle is up and grace period has passed), `false` otherwise |

### isLiquidationAllowed

```solidity
function isLiquidationAllowed() external view override returns (bool)
```

Returns true if the `liquidation` operation is allowed. The operation is not allowed when `PriceOracle` is down or the grace period has not passed.

#### Return Values:

| Type   | Description                                                                                                                   |
| :----- | :---------------------------------------------------------------------------------------------------------------------------- |
| `bool` | Returns `true` if the `liquidation` operation is allowed (the PriceOracle is up and grace period has passed), false otherwise |

### getSequencerOracle

```solidity
function getSequencerOracle() external view returns (address)
```

Returns the SequencerOracle.

#### Return Values:

| Type      | Description                                  |
| :-------- | :------------------------------------------- |
| `address` | The address of the sequencer oracle contract |

### getGracePeriod

```solidity
function getGracePeriod() external view returns (uint256)
```

Returns the grace period.

#### Return Values:

| Type      | Description                                 |
| :-------- | :------------------------------------------ |
| `uint256` | The duration of the grace period in seconds |

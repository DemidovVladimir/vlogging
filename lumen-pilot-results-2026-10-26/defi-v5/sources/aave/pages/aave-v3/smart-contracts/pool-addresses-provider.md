# PoolAddressesProvider

The `PoolAddressesProvider` contract is the main registry of addresses that are part of, or connected to the Protocol, including permissioned roles. It acts as a factory of proxies and is the admin of those, and therefore has the right to change its implementations.

The addresses provider manages various protocol modules and has the ability to update pointers (e.g. update the [`ACLManager`](./acl-manager) contract) or update the implementation of proxy contracts (e.g. update the [`Pool`](./pool) implementation).

It specifies the initial holder of the [`DEFAULT_ADMIN_ROLE`](./acl-manager), it is immutable, and the address will never change.

> [!NOTE]
> Whenever the [`Pool`](./pool) contract is needed, we recommended you fetch the
> correct address from this `PoolAddressesProvider` smart contract.

The source code is available on [GitHub](https://github.com/aave-dao/aave-v3-origin/blob/main/src/contracts/protocol/configuration/PoolAddressesProvider.sol).

> [!NOTE]
> This contract is owned by the [Aave Governance](https://governance.aave.com/).

## Write Methods

### setMarketId

```solidity
function setMarketId(string memory newMarketId) external override onlyOwner
```

Updates the identifier of the Aave market by associating an id with a specific `PoolAddressesProvider`. This can be used to create an on-chain registry of pool addresses providers to identify and validate multiple Aave markets.

#### Input Parameters:

| Name        | Type     | Description              |
| :---------- | :------- | :----------------------- |
| newMarketId | `string` | The new id of the market |

### setAddress

```solidity
function setAddress(bytes32 id, address newAddress) external override onlyOwner
```

Sets the address of the protocol contract stored at the given `id`, replacing the address saved in the addresses map.

For example, `utils.keccak256(utils.toUtf8Bytes("INCENTIVES_CONTROLLER"))`, is set to the address of `INCENTIVES_CONTROLLER`.

> [!WARNING]
> Use this function carefully, as it will do a hard replacement of the current
> address in the addresses map.

#### Input Parameters:

| Name       | Type      | Description                                                |
| :--------- | :-------- | :--------------------------------------------------------- |
| id         | `bytes32` | `keccak256` hash of UTF8Bytes string representing contract |
| newAddress | `address` | The new address to be set corresponding to the id          |

### setAddressAsProxy

```solidity
function setAddressAsProxy(bytes32 id, address newImplementationAddress) external override onlyOwner
```

Updates the implementation address of a proxy contract with a specified `id`.

If there is no proxy registered, it will instantiate one and set the implementation as the `newImplementationAddress`.

> [!WARNING]
> Use this function carefully, only for ids that do not have an explicit setter
> function in order to avoid unexpected consequences.

#### Input Parameters:

| Name                     | Type      | Description                                                           |
| :----------------------- | :-------- | :-------------------------------------------------------------------- |
| id                       | `bytes32` | The id of the proxy contract                                          |
| newImplementationAddress | `address` | The address of new implementation contract corresponding to the proxy |

### setPoolImpl

```solidity
function setPoolImpl(address newPoolImpl) external override onlyOwner
```

Updates the implementation of the [`Pool`](./pool) contract, or creates a proxy.

#### Input Parameters:

| Name        | Type      | Description                                       |
| :---------- | :-------- | :------------------------------------------------ |
| newPoolImpl | `address` | The address of new `Pool` implementation contract |

### setPoolConfiguratorImpl

```solidity
function setPoolConfiguratorImpl(address newPoolConfiguratorImpl) external override onlyOwner
```

Updates the implementation of the [`PoolConfigurator`](./pool-configurator) contract, or creates a proxy.

#### Input Parameters:

| Name                    | Type      | Description                                                 |
| :---------------------- | :-------- | :---------------------------------------------------------- |
| newPoolConfiguratorImpl | `address` | The address of new PoolConfigurator implementation contract |

### setPriceOracle

```solidity
function setPriceOracle(address newPriceOracle) external override onlyOwner
```

Updates the address of the price oracle.

#### Input Parameters:

| Name           | Type      | Description                     |
| :------------- | :-------- | :------------------------------ |
| newPriceOracle | `address` | The address of new price oracle |

### setACLManager

```solidity
function setACLManager(address newAclManager) external override onlyOwner
```

Updates the address of the Access Control List Manager.

#### Input Parameters:

| Name          | Type      | Description                       |
| :------------ | :-------- | :-------------------------------- |
| newAclManager | `address` | The address of the new ACLManager |

### setACLAdmin

```solidity
function setACLAdmin(address newAclAdmin) external override onlyOwner
```

Updates the address of the Access Control List Admin.

#### Input Parameters:

| Name        | Type      | Description                 |
| :---------- | :-------- | :-------------------------- |
| newAclAdmin | `address` | The address of new ACLAdmin |

### setPriceOracleSentinel

```solidity
function setPriceOracleSentinel(address newPriceOracleSentinel) external override onlyOwner
```

Updates the address of the price oracle sentinel.

#### Input Parameters:

| Name                   | Type      | Description                            |
| :--------------------- | :-------- | :------------------------------------- |
| newPriceOracleSentinel | `address` | The address of new PriceOracleSentinel |

### setPoolDataProvider

```solidity
function setPoolDataProvider(address newDataProvider) external override onlyOwner
```

Updates the address of the data provider.

#### Input Parameters:

| Name            | Type      | Description                     |
| :-------------- | :-------- | :------------------------------ |
| newDataProvider | `address` | The address of new DataProvider |

## View Methods

### getMarketId

```solidity
function getMarketId() external view override returns (string memory)
```

Returns the market id of the associated Aave market.

#### Return Values:

| Type     | Description                              |
| :------- | :--------------------------------------- |
| `string` | A string representation of the market id |

### getAddress

```solidity
function getAddress(bytes32 id) public view override returns (address)
```

Returns the address of protocol contract stored at the given id. The returned address might be an EOA or a contract, which may be proxied. It will return ZERO if there is no registered address with the given id.

#### Input Parameters:

| Name | Type      | Description                                                 |
| :--- | :-------- | :---------------------------------------------------------- |
| id   | `bytes32` | The id. For example, the Protocol Data Provider uses id 0x1 |

#### Return Values:

| Type      | Description                               |
| :-------- | :---------------------------------------- |
| `address` | The address associated with the id passed |

#### Example:

```tsx
// Get address of incentive controller
import { utils } from "@ethers/lib/utils";

const id = utils.keccak256(utils.toUtf8Bytes("INCENTIVES_CONTROLLER"));
const address = poolAddressProvider.getAddress(id);
```

### getPool

```solidity
function getPool() external view override returns (address)
```

Returns the address of the latest Pool proxy contract.

#### Return Values:

| Type      | Description                              |
| :-------- | :--------------------------------------- |
| `address` | The address of the associated Pool proxy |

### getPoolConfigurator

```solidity
function getPoolConfigurator() external view override returns (address)
```

Returns the address of the PoolConfigurator proxy. Used for configuration methods, like init reserves or update token implementation etc, of the market.

#### Return Values:

| Type      | Description                        |
| :-------- | :--------------------------------- |
| `address` | The PoolConfigurator proxy address |

### getPriceOracle

```solidity
function getPriceOracle() external view override returns (address)
```

Returns the address of the Price Oracle used by the market.

#### Return Values:

| Type      | Description                                                   |
| :-------- | :------------------------------------------------------------ |
| `address` | The address of the price oracle used by the associated market |

### getACLManager

```solidity
function getACLManager() external view override returns (address)
```

Returns the address of the Access Control List Manager (ACLManager) that manages the system role of the market.

#### Return Values:

| Type      | Description                                                                             |
| :-------- | :-------------------------------------------------------------------------------------- |
| `address` | The address of the ACLManger contract managing the system role of the associated market |

### getACLAdmin

```solidity
function getACLAdmin() external view override returns (address)
```

Returns the address of the Access Control List Admin (ACLAdmin) of the market which holds the `DEFAULT_ADMIN_ROLE` in ACLManager.

#### Return Values:

| Type      | Description                                                           |
| :-------- | :-------------------------------------------------------------------- |
| `address` | The address of the Access Control List admin of the associated market |

### getPriceOracleSentinel

```solidity
function getPriceOracleSentinel() external view override returns (address)
```

Returns the address of the price oracle sentinel.

#### Return Values:

| Type      | Description                                                     |
| :-------- | :-------------------------------------------------------------- |
| `address` | The address of the PriceOracleSentinel of the associated market |

### getPoolDataProvider

```solidity
function getPoolDataProvider() external view override returns (address)
```

Returns the address of latest pool data provider.

#### Return Values:

| Type      | Description                                                    |
| :-------- | :------------------------------------------------------------- |
| `address` | The address of the pool data provider of the associated market |

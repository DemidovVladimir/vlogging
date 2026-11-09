# ACLManager

The Access Control List Manager (`ACLManager`) is the main registry of system roles and permissions.

The Aave Protocol implements an access control list to segregate powers and/or benefits that can be allocated to different entities on the protocol. The `ACL_MANAGER` contract is managed by the [`PoolAddressesProvider`](./pool-addresses-provider) contract.

`ACLManager` keeps track of the individual roles and its holders, and allows a _Role Admin_ to manage roles. _Role Admin_ is itself a role that is managed by the `DEFAULT_ADMIN_ROLE`.

The `DEFAULT_ADMIN_ROLE` is held by the [`ACL_ADMIN`](#roles-acl-admin), and should be initialized in the [`PoolAddressesProvider`](./pool-addresses-provider) beforehand.

The source code is available on [GitHub](https://github.com/aave-dao/aave-v3-origin/blob/main/src/contracts/protocol/configuration/ACLManager.sol).

## Roles

Below we outline the responsibilities/powers of the roles and the specific methods that are only accessible to the holders of these roles.

The [`FLASH_BORROWER`](#roles-flash-borrower) and [`BRIDGE`](#roles-bridge) roles have few direct responsibilities and can primarily access specific features of the protocol, while `ADMIN` roles have the power and responsibility to handle risk or configuration parameters.

### FLASH_BORROWER

Holders of this role will have the premium on flash loans waived (this does not include the simple flash loan).

#### Methods Accessible:

**[`Pool`](./pool)**:

- [`flashLoan()`](./pool#write-methods-flashloan)

### ASSET_LISTING_ADMIN

Holders of this role can:

- Update asset oracle sources and the fallback oracle.
- Add new assets to the Aave market.

#### Methods Accessible:

**[`AaveOracle`](./oracles)**:

- [`setAssetSources()`](./oracles#write-methods-setassetsources)
- [`setFallbackOracle()`](./oracles#write-methods-setfallbackoracle)

**[`PoolConfigurator`](./pool-configurator)**:

- [`initReserves()`](./pool-configurator#only-asset-listing-or-pool-admins-methods-initreserves)

### RISK_ADMIN

Holders of this role can:

- Update the grace period of Oracle Sentinels.
- Update reserve parameters such as reserve factor, caps, E-Mode category, borrowing enabled, freeze/unfreeze, LTV, liquidation threshold, liquidation bonus (cannot pause/unpause or activate/deactivate a reserve).
- Create new and update existing E-Mode categories (not category 0).
- Update unbacked mint cap and liquidation protocol fee.

#### Methods Accessible:

**[`PoolConfigurator`](./pool-configurator)**:

- [`setReserveBorrowing()`](./pool-configurator#only-risk-or-pool-admins-methods-setreserveborrowing)
- [`configureReserveAsCollateral()`](./pool-configurator#only-risk-or-pool-admins-methods-configurereserveascollateral)
- [`setReserveFreeze()`](./pool-configurator#only-risk-or-pool-admins-methods-setreservefreeze)
- [`setBorrowableInIsolation()`](./pool-configurator#only-risk-or-pool-admins-methods-setborrowableinisolation)
- [`setReserveFactor()`](./pool-configurator#only-risk-or-pool-admins-methods-setreservefactor)
- [`setDebtCeiling()`](./pool-configurator#only-risk-or-pool-admins-methods-setdebtceiling)
- [`setSiloedBorrowing()`](./pool-configurator#only-risk-or-pool-admins-methods-setsiloedborrowing)
- [`setBorrowCap()`](./pool-configurator#only-risk-or-pool-admins-methods-setborrowcap)
- [`setSupplyCap()`](./pool-configurator#only-risk-or-pool-admins-methods-setsupplycap)
- [`setLiquidationProtocolFee()`](./pool-configurator#only-risk-or-pool-admins-methods-setliquidationprotocolfee)
- [`setEModeCategory()`](./pool-configurator#only-risk-or-pool-admins-methods-setemodecategory)
- [`setAssetCollateralInEMode()`](./pool-configurator#only-risk-or-pool-admins-methods-setassetcollateralinemode)
- [`setUnbackedMintCap()`](./pool-configurator#only-risk-or-pool-admins-methods-setunbackedmintcap)
- [`setReserveInterestRateStrategyAddress()`](./pool-configurator#only-risk-or-pool-admins-methods-setreserveinterestratestrategyaddress)
- [`setReserveInterestRateData()`](./pool-configurator#only-risk-or-pool-admins-methods-setreserveinterestratedata)
- [`disableLiquidationGracePeriod()`](./pool-configurator#only-risk-or-pool-admins-methods-disableliquidationgraceperiod)
- [`setReserveFlashLoaning()`](./pool-configurator#only-risk-or-pool-admins-methods-setreserveflashloaning)

**[`PriceOracleSentinel`](./oracles)**:

- `setGracePeriod()`

### ACL_ADMIN

Holders of this role manage the role admins in the `ACLManager`. The `DEFAULT_ADMIN_ROLE` is held by the `ACL_ADMIN`, and should be initialized in the `PoolAddressesProvider` beforehand.

#### Methods Accessible:

**[`ACLManager`](./acl-manager)**:

- [`setRoleAdmin()`](#write-methods-setroleadmin)
- [`addPoolAdmin()`](#write-methods-addpooladmin)
- [`removePoolAdmin()`](#write-methods-removepooladmin)
- [`addEmergencyAdmin()`](#write-methods-addemergencyadmin)
- [`removeEmergencyAdmin()`](#write-methods-removeemergencyadmin)
- [`addRiskAdmin()`](#write-methods-addriskadmin)
- [`removeRiskAdmin()`](#write-methods-removeriskadmin)
- [`addFlashBorrower()`](#write-methods-addflashborrower)
- [`removeFlashBorrower()`](#write-methods-removeflashborrower)
- [`addBridge()`](#write-methods-addbridge)
- [`removeBridge()`](#write-methods-removebridge)
- [`addAssetListingAdmin()`](#write-methods-addassetlistingadmin)
- [`removeAssetListingAdmin()`](#write-methods-removeassetlistingadmin)

### EMERGENCY_ADMIN

Holders of this role can pause and unpause the pool or an individual reserve.

#### Methods Accessible:

**[`PoolConfigurator`](./pool-configurator)**:

- [`setReservePause()`](./pool-configurator#only-emergency-or-pool-admin-methods-setreservepause)
- [`setPoolPause()`](./pool-configurator#only-emergency-admin-methods-setpoolpause)
- [`setReserveActive()`](./pool-configurator#only-pool-admin-methods-setreserveactive)
- [`setReserveFreeze()`](./pool-configurator#only-emergency-or-pool-admin-methods-setreservefreeze)

### POOL_ADMIN

Holders of this role can update token implementations, drop, (un)pause and (de)activate reserves, update premiums along with everything the [`ASSET_LISTING_ADMIN`](#asset_listing_admin) and [`RISK_ADMIN`](#risk_admin) can do.

All deployers have resigned their [`POOL_ADMIN`](#roles-pool-admin) roles. All instances of the [`POOL_ADMIN`](#roles-pool-admin) role, across all v3 networks, are now governed by the [Guardians multisig] or by the [Governance Bridge executors](https://github.com/aave/governance-crosschain-bridges).

#### Methods Accessible:

All methods accessible to `ASSET_LISTING_ADMIN`.

All methods accessible to `RISK_ADMIN`.

**[`AToken`](./tokenization)**:

- [`rescueTokens()`](./tokenization)

**[`Pool`](./pool)**:

- [`rescueTokens()`](./pool#rescuetokens)

**[`IncentivizedERC20`](./tokenization)**:

- [`setIncentivesController()`](./tokenization)

**[`PoolConfigurator`](./pool-configurator)**:

- [`dropReserve()`](./pool-configurator#only-pool-admin-methods-dropreserve)
- [`updateAToken()`](./pool-configurator#only-pool-admin-methods-updateatoken)
- [`updateVariableDebtToken()`](./pool-configurator#only-pool-admin-methods-updatevariabledebttoken)
- [`setReserveActive()`](./pool-configurator#only-pool-admin-methods-setreserveactive)
- [`updateBridgeProtocolFee()`](./pool-configurator#only-pool-admin-methods-updatebridgeprotocolfee)
- [`updateFlashloanPremiumTotal()`](./pool-configurator#only-pool-admin-methods-updateflashloanpremiumtotal)
- [`updateFlashloanPremiumToProtocol()`](./pool-configurator#only-pool-admin-methods-updateflashloanpremiumtoprotocol)
- [`setAssetBorrowableInEMode()`](./pool-configurator#only-risk-or-pool-admins-methods-setassetborrowableinemode)
- [`setReserveInterestRateData()`](./pool-configurator#only-risk-or-pool-admins-methods-setreserveinterestratedata)
- [`setReserveInterestRateStrategyAddress()`](./pool-configurator#only-risk-or-pool-admins-methods-setreserveinterestratestrategyaddress)

**[`PriceOracleSentinel`](./oracles)**:

- [`setSequencerOracle()`](./oracles#write-methods-setsequenceroracle)

## Write Methods

### setRoleAdmin

```solidity
function setRoleAdmin(bytes32 role, bytes32 adminRole) external override onlyRole(DEFAULT_ADMIN_ROLE)
```

Sets the `role` as admin of a specific role. By default, the `adminRole` for all roles is [`DEFAULT_ADMIN_ROLE`](#roles-acl-admin).

> [!WARNING]
> This method can only be called by an address with
> [`DEFAULT_ADMIN_ROLE`](#roles-acl-admin).

#### Input Parameters:

| Name      | Type      | Description                                                                                                                                                                         |
| :-------- | :-------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| role      | `bytes32` | The role to be managed by the admin role - keccak256 hash of one of the following: `POOL_ADMIN`, `EMERGENCY_ADMIN`, `RISK_ADMIN`, `FLASH_BORROWER`, `BRIDGE`, `ASSET_LISTING_ADMIN` |
| adminRole | `bytes32` | The admin role. 0x00 is reserved for the `DEFAULT_ADMIN_ROLE`                                                                                                                       |

### addPoolAdmin

```solidity
function addPoolAdmin(address admin) external override
```

Adds a new `admin` as _Pool Admin_. The address is added to the list of members with the [`POOL_ADMIN`](#roles-pool-admin) role. Holders of this role can update token implementations, drop, (un)pause and (de)activate reserves, update premiums and do everything the [`ASSET_LISTING_ADMIN`](#roles-asset-listing-admin) and [`RISK_ADMIN`](#roles-risk-admin) can do.

> [!WARNING]
> This method can only be called by the _Role Admin_, specified by _Aave
> Governance_, responsible for managing the [`POOL_ADMIN`](#roles-pool-admin)
> role.

#### Input Parameters:

| Name  | Type      | Description                                             |
| :---- | :-------- | :------------------------------------------------------ |
| admin | `address` | The address which will be granted the `POOL_ADMIN` role |

### removePoolAdmin

```solidity
function removePoolAdmin(address admin) external override
```

Removes an `admin` as _Pool Admin_. The given address is removed from the list of members with the [`POOL_ADMIN`](#roles-pool-admin) role.

> [!WARNING]
> This method can only be called by the _Role Admin_, specified by _Aave
> Governance_, responsible for managing the [`POOL_ADMIN`](#roles-pool-admin)
> role.

#### Input Parameters:

| Name  | Type      | Description                                                             |
| :---- | :-------- | :---------------------------------------------------------------------- |
| admin | `address` | The address for which the `POOL_ADMIN` role permissions will be removed |

### addEmergencyAdmin

```solidity
function addEmergencyAdmin(address admin) external override
```

Adds a new `admin` as an _Emergency Admin_. The address is added to the list of members with the [`EMERGENCY_ADMIN`](#roles-emergency-admin) role. Holders of this role can pause and unpause the pool or an individual reserve.

> [!WARNING]
> This method can only be called by the _Role Admin_, specified by _Aave
> Governance_, responsible for managing the
> [`EMERGENCY_ADMIN`](#roles-emergency-admin) role.

#### Input Parameters:

| Name  | Type      | Description                                                  |
| :---- | :-------- | :----------------------------------------------------------- |
| admin | `address` | The address which will be granted the `EMERGENCY_ADMIN` role |

### removeEmergencyAdmin

```solidity
function removeEmergencyAdmin(address admin) external override
```

Removes an `admin` as _Emergency Admin_. The given address is removed from the list of members with the [`EMERGENCY_ADMIN`](#roles-emergency-admin) role.

> [!WARNING]
> This method can only be called by the _Role Admin_, specified by _Aave
> Governance_, responsible for managing the
> [`EMERGENCY_ADMIN`](#roles-emergency-admin) role.

#### Input Parameters:

| Name  | Type      | Description                                                                  |
| :---- | :-------- | :--------------------------------------------------------------------------- |
| admin | `address` | The address for which the `EMERGENCY_ADMIN` role permissions will be removed |

### addRiskAdmin

```solidity
function addRiskAdmin(address admin) external override
```

Adds a new `admin` as a _Risk Admin_. The address is added to the list of members with the [`RISK_ADMIN`](#roles-risk-admin) role. Holders of this role can update grace period of Oracle Sentinels, reserve params, unbacked mint cap, liquidation fee and eMode categories.

#### Input Parameters:

| Name  | Type      | Description                                             |
| :---- | :-------- | :------------------------------------------------------ |
| admin | `address` | The address which will be granted the `RISK_ADMIN` role |

### removeRiskAdmin

```solidity
function removeRiskAdmin(address admin) external override
```

Removes an `admin` as _Risk Admin_. The given address is removed from the list of members with the [`RISK_ADMIN`](#roles-risk-admin) role.

#### Input Parameters:

| Name  | Type      | Description                                                             |
| :---- | :-------- | :---------------------------------------------------------------------- |
| admin | `address` | The address for which the `RISK_ADMIN` role permissions will be removed |

### addFlashBorrower

```solidity
function addFlashBorrower(address borrower) external override
```

Adds a new `borrower` address as _Flash Borrower_. The address is added to the list of members with the [`FLASH_BORROWER`](#roles-flash-borrower) role. Holders of this role do not pay premium for flash loan (does not apply to `flashLoanSimple`).

#### Input Parameters:

| Name     | Type      | Description                                                 |
| :------- | :-------- | :---------------------------------------------------------- |
| borrower | `address` | The address which will be granted the `FLASH_BORROWER` role |

### removeFlashBorrower

```solidity
function removeFlashBorrower(address borrower) external override
```

Removes an admin as _Flash Borrower_. The given `borrower` address is removed from the list of members with the [`FLASH_BORROWER`](#roles-flash-borrower) role.

#### Input Parameters:

| Name     | Type      | Description                                                                 |
| :------- | :-------- | :-------------------------------------------------------------------------- |
| borrower | `address` | The address for which the `FLASH_BORROWER` role permissions will be removed |

### addAssetListingAdmin

```solidity
function addAssetListingAdmin(address admin) external override
```

Adds a new `admin` as _Asset Listing Admin_. The address is added to the list of members with the [`ASSET_LISTING_ADMIN`](#roles-asset-listing-admin) role. Holder of this role can update oracles and add new assets to the Aave market.

#### Input Parameters:

| Name  | Type      | Description                                                  |
| :---- | :-------- | :----------------------------------------------------------- |
| admin | `address` | The address which will be granted `ASSET_LISTING_ADMIN` role |

### removeAssetListingAdmin

```solidity
function removeAssetListingAdmin(address admin) external override
```

Removes an `admin` as _Asset Listing Admin_. The given address is removed from the list of members with the [`ASSET_LISTING_ADMIN`](#roles-asset-listing-admin) role.

#### Input Parameters:

| Name  | Type      | Description                                                                  |
| :---- | :-------- | :--------------------------------------------------------------------------- |
| admin | `address` | The address for which `ASSET_LISTING_ADMIN` role permissions will be removed |

## View Methods

### isPoolAdmin

```solidity
function isPoolAdmin(address admin) external view override returns (bool)
```

Returns `true` if the address has the [`POOL_ADMIN`](#roles-pool-admin) role, `false` otherwise.

#### Input Parameters:

| Name  | Type      | Description          |
| :---- | :-------- | :------------------- |
| admin | `address` | The address to check |

#### Return Values:

| Type   | Description                                                    |
| :----- | :------------------------------------------------------------- |
| `bool` | `true` if the given address is `POOL_ADMIN`, `false` otherwise |

### isEmergencyAdmin

```solidity
function isEmergencyAdmin(address admin) external view override returns (bool)
```

Returns `true` if the address has the [`EMERGENCY_ADMIN`](#roles-emergency-admin) role, `false` otherwise.

#### Input Parameters:

| Name  | Type      | Description          |
| :---- | :-------- | :------------------- |
| admin | `address` | The address to check |

#### Return Values:

| Type   | Description                                                         |
| :----- | :------------------------------------------------------------------ |
| `bool` | `true` if the given address is `EMERGENCY_ADMIN`, `false` otherwise |

### isRiskAdmin

```solidity
function isRiskAdmin(address admin) external view override returns (bool)
```

Returns `true` if the address has the [`RISK_ADMIN`](#roles-risk-admin) role, `false` otherwise.

#### Input Parameters:

| Name  | Type      | Description          |
| :---- | :-------- | :------------------- |
| admin | `address` | The address to check |

#### Return Values:

| Type   | Description                                                    |
| :----- | :------------------------------------------------------------- |
| `bool` | `true` if the given address is `RISK_ADMIN`, `false` otherwise |

### isFlashBorrower

```solidity
function isFlashBorrower(address borrower) external view override returns (bool)
```

Returns `true` if the address has the [`FLASH_BORROWER`](#roles-flash-borrower) role, `false` otherwise.

#### Input Parameters:

| Name     | Type      | Description          |
| :------- | :-------- | :------------------- |
| borrower | `address` | The address to check |

#### Return Values:

| Type   | Description                                                        |
| :----- | :----------------------------------------------------------------- |
| `bool` | `true` if the given address is `FLASH_BORROWER`, `false` otherwise |

### isBridge

```solidity
function isBridge(address bridge) external view override returns (bool)
```

Returns `true` if the address has [`BRIDGE`](#roles-bridge) role, `false` otherwise.

#### Input Parameters:

| Name   | Type      | Description          |
| :----- | :-------- | :------------------- |
| bridge | `address` | The address to check |

#### Return Values:

| Type   | Description                                                |
| :----- | :--------------------------------------------------------- |
| `bool` | `true` if the given address is `BRIDGE`, `false` otherwise |

### isAssetListingAdmin

```solidity
function isAssetListingAdmin(address admin) external view override returns (bool)
```

Returns `true` if the address has the [`ASSET_LISTING_ADMIN`](#roles-asset-listing-admin) role, `false` otherwise.

#### Input Parameters:

| Name  | Type      | Description          |
| :---- | :-------- | :------------------- |
| admin | `address` | The address to check |

#### Return Values:

| Type   | Description                                                             |
| :----- | :---------------------------------------------------------------------- |
| `bool` | `true` if the given address is `ASSET_LISTING_ADMIN`, `false` otherwise |

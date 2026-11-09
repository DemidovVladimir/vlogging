# L2Pool

The main transaction cost on L2 comes from calldata. To minimize this cost, Aave v3 uses a different contract on L2 networks that allows calldata of Pool methods to be compressed.

`L2Pool` is the contract for the L2 optimized user facing methods of the protocol that takes byte encoded input arguments. It exposes the liquidity management methods that can be invoked using either Solidity or Web3 libraries. The `L2Pool` contract is a calldata optimized extension of the Pool contract allowing users to pass compact calldata representation to reduce transaction costs on L2 rollups.

> [!NOTE]
> Pool methods not exposed in `L2Pool.sol` (such as flashLoan, setUserEMode
> etc.) are the same on L2 as on other versions of protocol. Refer to
> [Pool](./pool) docs for the rest of the methods.

> [!NOTE]
> Since there are a limited set of supported assets that are already given an
> individual id, we use the 16 bit asset id in the encoded arguments instead of
> 160 bit asset address.

The source code is available on [GitHub](https://github.com/aave-dao/aave-v3-origin/blob/main/src/contracts/protocol/pool/L2Pool.sol).

Threre is an additional [L2Encoder](https://github.com/aave-dao/aave-v3-origin/blob/main/src/contracts/helpers/L2Encoder.sol) helper contract with view methods to encode transaction params for compressed methods.

## Methods

### supply

```solidity
function supply(bytes32 args) external override
```

Calldata efficient wrapper of the supply function on behalf of the caller. Supplies asset into the protocol, minting the same amount of corresponding aTokens, and transferring them to `msg.sender`.

> [!NOTE]
> You can use data returned from `encodeSupplyParams()` method in
> [`L2Encoder`](https://github.com/aave-dao/aave-v3-origin/blob/main/src/contracts/helpers/L2Encoder.sol)
> helper contract to pass to this method.

#### Input Parameters:

| Name | Type      | Description                                                                                                                                                                                                                                                                                                                                                               |
| :--- | :-------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| args | `bytes32` | Arguments for the supply function packed in one bytes32<br/>bit 0-15: `uint16` assetId - the index of the asset in the reservesList<br/>bit 16-143: `uint128` shortenedAmount - cast to 256 bits at decode time, if `type(uint128).max` the value will be expanded to `type(uint256).max`<br/>bit 144-159: `uint16` referralCode - used for 3rd party integrations |

### supplyWithPermit

```solidity
function supplyWithPermit(bytes32 args, bytes32 r, bytes32 s) external override
```

Calldata efficient wrapper of the supplyWithPermit function on behalf of the caller. Supply with transfer approval of supplied asset via permit function. This method removes the need for separate approval transaction before supplying asset to the pool.

> [!NOTE]
> You can use data returned from `encodeSupplyWithPermitParams()` method in
> [`L2Encoder`](https://github.com/aave-dao/aave-v3-origin/blob/main/src/contracts/helpers/L2Encoder.sol)
> helper contract to pass to this method.

#### Input Parameters:

| Name | Type      | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| :--- | :-------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| args | `bytes32` | Arguments for the supply function packed in one bytes32<br/>bit 0-15: `uint16` assetId - the index of the asset in the reservesList<br/>bit 16-143: `uint128` shortenedAmount - cast to 256 bits at decode time, if `type(uint128).max` the value will be expanded to `type(uint256).max`<br/>bit 144-159: `uint16` referralCode - used for 3rd party integrations<br/>bit 160-191: `uint32` shortenedDeadline - shortened deadline from the original `uint256`<br/>bit 192-199: `uint8` permitV - the V parameter of ERC712 permit signature |
| r    | `bytes32` | The R parameter of ERC712 permit signature                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| s    | `bytes32` | The S parameter of ERC712 permit signature                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |

### withdraw

```solidity
function withdraw(bytes32 args) external override returns (uint256)
```

Calldata efficient wrapper of the withdraw function, withdrawing to the caller. Withdraws `amount` of the underlying `asset`, i.e. redeems the underlying token and burns the aTokens.

If the user has any existing debt backed by the underlying token, the maximum amount available to withdraw is the amount that will not leave the user with a health factor < 1 after the withdrawal.

> [!NOTE]
> You can use data returned from `encodeWithdrawParams()` method in
> [`L2Encoder`](https://github.com/aave-dao/aave-v3-origin/blob/main/src/contracts/helpers/L2Encoder.sol)
> helper contract to pass to this method.

#### Input Parameters:

| Name | Type      | Description                                                                                                                                                                                                                                                                                        |
| :--- | :-------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| args | `bytes32` | Arguments for the withdraw function packed in one bytes32<br/>bit 0-15: `uint16` assetId - the index of the asset in the reservesList<br/>bit 16-143: `uint128` shortenedAmount - cast to 256 bits at decode time, if `type(uint128).max` the value will be expanded to `type(uint256).max` |

#### Return Value:

| Name   | Type      | Description                                                                                                                                                                                                                                                             |
| :----- | :-------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| amount | `uint256` | The final amount of the underlying asset withdrawn, denominated in the base unit of the asset (e.g., wei for ETH, smallest unit for ERC-20 tokens). This is the amount actually transferred to the caller, accounting for constraints like liquidity and health factor. |

### borrow

```solidity
function borrow(bytes32 args) external override
```

Calldata efficient wrapper of the borrow function, borrowing on behalf of the caller. Borrows `amount` of `asset` with `interestRateMode`, sending the `amount` to `msg.sender`, with the debt being incurred by `onBehalfOf`.

> [!NOTE]
> You can use data returned from `encodeBorrowParams()` method in
> [`L2Encoder`](https://github.com/aave-dao/aave-v3-origin/blob/main/src/contracts/helpers/L2Encoder.sol)
> helper contract to pass to this method.

#### Input Parameters:

| Name | Type      | Description                                                                                                                                                                                                                                                                                                                                                                                                                      |
| :--- | :-------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| args | `bytes32` | Arguments for the borrow function packed in one bytes32<br/>bit 0-15: `uint16` assetId - the index of the asset in the reservesList<br/>bit 16-143: `uint128` shortenedAmount - cast to 256 bits at decode time, if `type(uint128).max` the value will be expanded to `type(uint256).max`<br/>bit 144 - 151: `uint8` shortenedInterestRateMode<br/>bit 152 - 167: `uint16` referralCode - used for 3rd party integrations |

### repay

```solidity
function repay(bytes32 args) external override returns (uint256)
```

Calldata efficient wrapper of the repay function, repaying on behalf of the caller. Repays debt of an `asset` for the given `interestRateMode`.

> [!NOTE]
> You can use data returned from `encodeRepayParams()` method in
> [`L2Encoder`](https://github.com/aave-dao/aave-v3-origin/blob/main/src/contracts/helpers/L2Encoder.sol)
> helper contract to pass to this method.

#### Input Parameters:

| Name | Type      | Description                                                                                                                                                                                                                                                                                                                                          |
| :--- | :-------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| args | `bytes32` | Arguments for the repay function packed in one bytes32<br/>bit 0-15: `uint16` assetId - the index of the asset in the reservesList<br/>bit 16-143: `uint128` shortenedAmount - cast to 256 bits at decode time, if `type(uint128).max` the value will be expanded to `type(uint256).max`<br/>bit 144 - 151: `uint8` shortenedInterestRateMode |

#### Return Values:

| Type      | Description             |
| :-------- | :---------------------- |
| `uint256` | The final amount repaid |

### repayWithPermit

```solidity
function repayWithPermit(bytes32 args, bytes32 r, bytes32 s) external override returns (uint256)
```

Calldata efficient wrapper of the repayWithPermit function, repaying on behalf of the caller. Repay with transfer approval of borrowed asset via permit function. This method removes the need for separate approval transaction before repaying asset to the pool.

> [!NOTE]
> You can use data returned from `encodeRepayWithPermitParams()` method in
> [`L2Encoder`](https://github.com/aave-dao/aave-v3-origin/blob/main/src/contracts/helpers/L2Encoder.sol)
> helper contract to pass to this method.​

#### Input Parameters:

| Name | Type      | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| :--- | :-------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| args | `bytes32` | Arguments for the repayWithPermit function packed in one bytes32<br/>bit 0-15: `uint16` assetId - the index of the asset in the reservesList<br/>bit 16-143: `uint128` shortenedAmount - cast to 256 bits at decode time, if `type(uint128).max` the value will be expanded to `type(uint256).max`<br/>bit 144 - 151: `uint8` shortenedInterestRateMode<br/>bit 152-183: `uint32` shortenedDeadline - shortened deadline from original `uint256`<br/>bit 184-191: `uint8` permitV - the V parameter of ERC712 permit signature |
| r    | `bytes32` | The R parameter of ERC712 permit signature                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| s    | `bytes32` | The S parameter of ERC712 permit signature                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |

#### Return Values:

| Type      | Description             |
| :-------- | :---------------------- |
| `uint256` | The final amount repaid |

### repayWithATokens

```solidity
function repayWithATokens(bytes32 args) external override returns (uint256)
```

Calldata efficient wrapper of the repayWithATokens function. Allows user to repay with aTokens of the underlying debt asset without any approvals, for example, Pay DAI debt using aDAI tokens.

> [!NOTE]
> You can use data data returned from `encodeRepayWithATokensParams()` method in
> [`L2Encoder`](https://github.com/aave-dao/aave-v3-origin/blob/main/src/contracts/helpers/L2Encoder.sol)
> helper contract to pass to this method.

#### Input Parameters:

| Name | Type      | Description                                                                                                                                                                                                                                                                                                                                                     |
| :--- | :-------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| args | `bytes32` | Arguments for the repayWithATokens function packed in one bytes32<br/>bit 0-15: `uint16` assetId - the index of the asset in the reservesList<br/>bit 16-143: `uint128` shortenedAmount - cast to 256 bits at decode time, if `type(uint128).max` the value will be expanded to `type(uint256).max`<br/>bit 144 - 151: `uint8` shortenedInterestRateMode |

#### Return Values:

| Type      | Description             |
| :-------- | :---------------------- |
| `uint256` | The final amount repaid |

### setUserUseReserveAsCollateral

```solidity
function setUserUseReserveAsCollateral(bytes32 args) external override
```

Calldata efficient wrapper of the setUserUseReserveAsCollateral function. Sets the asset of `msg.sender` to be used as collateral or not.

> [!NOTE]
> You can use data returned from `encodeSetUserUseReserveAsCollateral()` method
> in
> [`L2Encoder`](https://github.com/aave-dao/aave-v3-origin/blob/main/src/contracts/helpers/L2Encoder.sol)
> helper contract to pass to this method.​

#### Input Parameters:

| Name | Type      | Description                                                                                                                                                                                                                             |
| :--- | :-------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| args | `bytes32` | Arguments for the setUserUseReserveAsCollateral function packed in one bytes32<br/>bit 0-15: `uint16` assetId - the index of the asset in the reservesList<br/>bit 16: 0 => enable useAsCollateral, 1 => disable useAsCollateral |

### liquidationCall

```solidity
function liquidationCall(bytes32 args1, bytes32 args2) external override
```

Calldata efficient wrapper of the liquidationCall function. Liquidate positions with a health factor below 1.

> [!NOTE]
> You can use data returned from `encodeLiquidationCall()` method in
> [`L2Encoder`](https://github.com/aave-dao/aave-v3-origin/blob/main/src/contracts/helpers/L2Encoder.sol)
> helper contract to pass to this method.​

#### Input Parameters:

| Name  | Type      | Description                                                                                                                                                                                                                                                                                                                     |
| :---- | :-------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| args1 | `bytes32` | Part of the arguments for the liquidationCall function packed in one bytes32<br/>bit 0-15: `uint16` collateralAssetId - the index of the collateral asset in the reservesList<br/>bit 16-31: `uint16` debtAssetId - the index of the debt asset in the reservesList<br/>bit 32-191: address of the user being liquidated |
| args2 | `bytes32` | Part of the arguments for the liquidationCall function packed in one bytes32<br/>bit 0-127: `uint128` shortenedDebtToCover is cast to 256 bits at decode time, if `type(uint128).max` the value will be expanded to `type(uint256).max`<br/>bit 128: receiveAToken - 0 => receive aToken, 1 => receive underlying asset  |

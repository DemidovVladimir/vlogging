# Wrapped Token Gateway

The Aave Protocol operates exclusively with ERC-20 [reserve](../concepts/reserve) tokens. To accommodate network gas tokens, the `WrappedTokenGateway` (previously called `WETHGateway`) is a helper contract that enables gas tokens (ETH, POL, etc.) to be wrapped or unwrapped to perform Aave Pool methods:

- Supply
- Borrow
- Repay
- Withdraw

The smart contract source code is available on [GitHub](https://github.com/aave-dao/aave-v3-origin/blob/main/src/contracts/helpers/WrappedTokenGatewayV3.sol).

## Write Methods

### depositETH

```solidity
function depositETH(
    address,
    address onBehalfOf,
    uint16 referralCode
) external payable override
```

Wraps and supplies gas tokens to the Aave Protocol. A corresponding amount of the wrapped aTokens are minted to the `onBehalfOf` address.

> [!NOTE]
> The amount of network gas tokens to be supplied is specified in the
> `msg.value` field of the transaction.

#### Input Parameters:

| Name         | Type      | Description                                                                           |
| :----------- | :-------- | :------------------------------------------------------------------------------------ |
| onBehalfOf   | `address` | The address of the user who will receive the aTokens representing the supplied tokens |
| referralCode | `uint16`  | Inactive, can pass `0` as placeholder                                                 |

### withdrawETH

```solidity
function withdrawETH(
    address,
    uint256 amount,
    address to
) external override
```

Withdraws `amount` of the supplied wrapped gas token, unwraps it and transfers to the `to` address. If the `amount` is `uint(-1)`, the entire balance is withdrawn.

> [!NOTE]
> The WrappedTokenGateway contract must have an approved token allowance to
> spend aWETH on behalf of the user, example:
> `IERC20(aWETHAddress).approve(wrappedTokenGatewayAddress, amount)`

#### Input Parameters:

| Name   | Type      | Description                                         |
| :----- | :-------- | :-------------------------------------------------- |
| amount | `uint256` | amount of aWETH to withdraw and receive native ETH  |
| to     | `address` | The address of the user who will receive native ETH |

### repayETH

```solidity
function repayETH(
    address,
    uint256 amount,
    uint256 rateMode,
    address onBehalfOf
) external payable override
```

Repays a borrow position of `onBehalfOf`'s address for the specified amount (or for the whole amount, if `amount` of `uint256(-1)` is passed).

> [!NOTE]
> The amount of network gas token to be repaid must also be specified in the
> `msg.value` field of the transaction.

#### Input Parameters:

| Name       | Type      | Description                                                                 |
| :--------- | :-------- | :-------------------------------------------------------------------------- |
| amount     | `uint256` | The amount to repay, or `uint256(-1)` if the user wants to repay everything |
| rateMode   | `uint256` | Should always be passed a value of `2` (variable rate mode)                 |
| onBehalfOf | `address` | The address for which `msg.sender` is repaying                              |

### borrowETH

```solidity
function borrowETH(
    address,
    uint256 amount,
    uint256 interestRateMode,
    uint16 referralCode
) external override
```

Borrows `amount` of unwrapped network gas tokens to `msg.sender`.

> [!NOTE]
> The WrappedTokenGateway contract must have an approved [credit
> delegation](../credit-delegation) to borrow WETH (or corresponding wrapped gas
> token of the network) on behalf of the the caller, example:
> `IVariableDebtToken(wethAddress).approveDelegation(wrappedTokenGatewayAddress,
> amount)`

#### Input Parameters:

| Name             | Type      | Description                                                                  |
| :--------------- | :-------- | :--------------------------------------------------------------------------- |
| amount           | `uint256` | The amount of ETH to borrow                                                  |
| interestRateMode | `uint256` | Should always be passed a value of `2` (variable rate mode)                  |
| referralCode     | `uint16`  | Integrators are assigned a referral code and can potentially receive rewards |

### withdrawETHWithPermit

```solidity
function withdrawETHWithPermit(
    address,
    uint256 amount,
    address to,
    uint256 deadline,
    uint8 permitV,
    bytes32 permitR,
    bytes32 permitS
) external override
```

Withdraws `amount` of the supplied wrapped gas token, unwraps it and transfers to the `to` address. If the `amount` is `uint(-1)`, the entire balance is withdrawn.

#### Input Parameters:

| Name     | Type      | Description                                            |
| :------- | :-------- | :----------------------------------------------------- |
| amount   | `uint256` | The amount of aWETH to withdraw and receive native ETH |
| to       | `address` | The address of the user who will receive native ETH    |
| deadline | `uint256` | Timestamp of signature expiration                      |
| permitV  | `uint8`   | V parameter of ERC712 permit sig                       |
| permitR  | `bytes32` | R parameter of ERC712 permit sig                       |
| permitS  | `bytes32` | S parameter of ERC712 permit sig                       |

## View Methods

### getWETHAddress

```solidity
function getWETHAddress() external view returns (address)
```

Get WETH address used by WrappedTokenGatewayV3.

#### Return Values:

| Type      | Description                                    |
| :-------- | :--------------------------------------------- |
| `address` | The WETH address used by WrappedTokenGatewayV3 |

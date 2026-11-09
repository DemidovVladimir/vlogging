# Swap Features

The [Aave Labs interface](https://app.aave.com) integrates multiple features integrating token swaps detailed below.

## Swap Tokens

The _Swap Tokens_ feature enables users to swap between tokens using [ParaSwap](https://app.paraswap.io) or [CoW Protocol](https://swap.cow.fi/) as the swap provider, depending on network availability. Tokens traded using CoW Protocol will incur a fee depending on the token pair and swap type:

- **Debt Swaps**: 0 bps fee across all pairs.
- **All other swap operations**: a discounted fee of 15 bps is applied to swaps between correlated assets (e.g. ETH/wstETH); for all other swaps a fee of 25 bps is applied.

The list of correlated assets is reviewed and updated periodically:

- **Stablecoin asset group**: USDC, USDT, DAI, GHO, EURC, USDbC, USDe, USDS, sUSDe, RLUSD, PYUSD, LUSD, sDAI, crvUSD, USD₮0, USDC.e, EURe, xDAI, wxDAI
- **ETH correlated asset group**: weETH, ETH, WETH, wstETH, cbETH, ezETH, wrsETH, osETH, rETH, ETHx
- **BTC correlated asset group**: cbBTC, WBTC, LBTC, tBTC, eBTC

## Swap Adapter Contracts

The swap adapter contracts integrate Aave's Flash Loans and the [ParaSwap](https://app.paraswap.io) DEX aggregator to facilitate advanced actions such as repaying borrow positions using collateral, swapping collateral assets, swapping borrow positions, and withdrawing and swapping assets. They allow users to perform complex operations in a single transaction, leveraging the liquidity of the Aave protocol and the atomic swapping capabilities of decentralized exchanges.

The table below outlines swap feature availability across v3 markets on the [Aave Labs interface](https://app.aave.com):

| Market           | Token Swap                 | Repay With Collateral      | Collateral Swap            | Debt Swap                  | Withdraw & Swap            |
| ---------------- | -------------------------- | -------------------------- | -------------------------- | -------------------------- | -------------------------- |
| Ethereum Core    | <TickCircleGrayIcon /> | <TickCircleGrayIcon /> | <TickCircleGrayIcon /> | <TickCircleGrayIcon /> | <TickCircleGrayIcon /> |
| Ethereum Prime   | <TickCircleGrayIcon /> | <TickCircleGrayIcon /> | <TickCircleGrayIcon /> | <TickCircleGrayIcon /> | <TickCircleGrayIcon /> |
| Ethereum EtherFi | <TickCircleGrayIcon /> | <TickCircleGrayIcon /> | <TickCircleGrayIcon /> | <TickCircleGrayIcon /> | <TickCircleGrayIcon /> |
| Arbitrum         | <TickCircleGrayIcon /> | <TickCircleGrayIcon /> | <TickCircleGrayIcon /> | <TickCircleGrayIcon /> | <TickCircleGrayIcon /> |
| Avalanche        | <TickCircleGrayIcon /> | <TickCircleGrayIcon /> | <TickCircleGrayIcon /> | <TickCircleGrayIcon /> | <TickCircleGrayIcon /> |
| Base             | <TickCircleGrayIcon /> | <TickCircleGrayIcon /> | <TickCircleGrayIcon /> | <TickCircleGrayIcon /> | <TickCircleGrayIcon /> |
| BNB              | <TickCircleGrayIcon /> | <TickCircleGrayIcon /> | <TickCircleGrayIcon /> | <TickCircleGrayIcon /> | <TickCircleGrayIcon /> |
| Optimism         | <TickCircleGrayIcon /> | <TickCircleGrayIcon /> | <TickCircleGrayIcon /> | <TickCircleGrayIcon /> | <TickCircleGrayIcon /> |
| Polygon          | <TickCircleGrayIcon /> | <TickCircleGrayIcon /> | <TickCircleGrayIcon /> | <TickCircleGrayIcon /> | <TickCircleGrayIcon /> |
| Gnosis           | <TickCircleGrayIcon /> | <TickCircleGrayIcon /> | <TickCircleGrayIcon /> | <TickCircleGrayIcon /> | <TickCircleGrayIcon /> |
| Sonic            | <TickCircleGrayIcon /> | <TickCircleGrayIcon /> | <TickCircleGrayIcon /> | <TickCircleGrayIcon /> | <TickCircleGrayIcon /> |
| Metis            | <CloseIcon />          | <CloseIcon />          | <CloseIcon />          | <CloseIcon />          | <CloseIcon />          |
| Scroll           | <CloseIcon />          | <CloseIcon />          | <CloseIcon />          | <CloseIcon />          | <CloseIcon />          |
| ZKsync           | <CloseIcon />          | <CloseIcon />          | <CloseIcon />          | <CloseIcon />          | <CloseIcon />          |
| Celo             | <CloseIcon />          | <CloseIcon />          | <CloseIcon />          | <CloseIcon />          | <CloseIcon />          |
| Soneium          | <CloseIcon />          | <CloseIcon />          | <CloseIcon />          | <CloseIcon />          | <CloseIcon />          |
| Linea            | <CloseIcon />          | <CloseIcon />          | <CloseIcon />          | <CloseIcon />          | <CloseIcon />          |
| Plasma           | <CloseIcon />          | <CloseIcon />          | <CloseIcon />          | <CloseIcon />          | <CloseIcon />          |
| Ink              | <CloseIcon />          | <CloseIcon />          | <CloseIcon />          | <CloseIcon />          | <CloseIcon />          |

## Repay With Collateral

The `ParaSwapRepayAdapter` contract enables users to repay their borrow positions on Aave using their supplied collateral directly, without the need to unwind their positions or provide additional liquidity. It leverages Aave's Flash Loans and the ParaSwap DEX aggregator to swap the user's collateral for the borrowed asset and repay the borrow position in a single atomic transaction.

By using this adapter, users can efficiently manage their positions and reduce their borrow positions using their existing collateral, saving on transaction costs and avoiding manual steps.

The source code is available on [GitHub](https://github.com/aave-dao/aave-v3-origin/blob/main/src/contracts/extensions/paraswap-adapters/ParaSwapRepayAdapter.sol).

Reference Integration: [useCollateralRepaySwap.tsx](https://github.com/aave/interface/blob/main/src/hooks/paraswap/useCollateralRepaySwap.tsx)

### Write Methods

#### executeOperation

```solidity
function executeOperation(
    address asset,
    uint256 amount,
    uint256 premium,
    address initiator,
    bytes calldata params
) external override nonReentrant returns (bool)
```

Uses the received funds from the flash loan to repay a borrow position on the protocol on behalf of the user. Then, pulls the collateral from the user and swaps it to the debt asset to repay the flash loan.

The user should give this contract allowance to pull the aTokens in order to withdraw the underlying asset, swap it, and repay the flash loan.

Supports only one asset on the flash loan.

The `params` parameter should be the ABI-encoded values of the following:

- `IERC20Detailed debtAsset` — The address of the borrow position asset
- `uint256 debtRepayAmount` — The amount of the borrow position to be repaid
- `uint256 buyAllBalanceOffset` — Offset in the ParaSwap calldata if swapping all balance
- `uint256 rateMode` — The rate mode of the borrow position to be repaid
- `bytes paraswapData` — Data for the ParaSwap Adapter
- `PermitSignature permitSignature` — Struct containing the permit signature, set to zeroes if not used

##### Input Parameters:

| Name      | Type    | Description                                                       |
| --------- | ------- | ----------------------------------------------------------------- |
| asset     | address | The address of the flash-borrowed asset                           |
| amount    | uint256 | The amount of the flash-borrowed asset                            |
| premium   | uint256 | The fee of the flash-borrowed asset                               |
| initiator | address | The address of the flash loan initiator                           |
| params    | bytes   | The byte-encoded parameters passed when initiating the flash loan |

##### Return Values:

| Type | Description                                                      |
| ---- | ---------------------------------------------------------------- |
| bool | True if the execution of the operation succeeds, false otherwise |

#### swapAndRepay

```solidity
function swapAndRepay(
    IERC20Detailed collateralAsset,
    IERC20Detailed debtAsset,
    uint256 collateralAmount,
    uint256 debtRepayAmount,
    uint256 debtRateMode,
    uint256 buyAllBalanceOffset,
    bytes calldata paraswapData,
    PermitSignature calldata permitSignature
) external nonReentrant
```

Swaps the user's collateral for the debt asset and then repays the borrow position on the protocol on behalf of the user without using flash loans. This method can be used when the temporary transfer of the collateral asset to this contract does not affect the user's position.

The user should give this contract allowance to pull the aTokens in order to withdraw the underlying asset.

##### Input Parameters:

| Name                | Type            | Description                                                                         |
| ------------------- | --------------- | ----------------------------------------------------------------------------------- |
| collateralAsset     | IERC20Detailed  | The address of the collateral asset to be swapped                                   |
| debtAsset           | IERC20Detailed  | The address of the debt asset                                                       |
| collateralAmount    | uint256         | The maximum amount of the collateral to be swapped                                  |
| debtRepayAmount     | uint256         | The amount of the borrow position to be repaid, or maximum amount when repaying all |
| debtRateMode        | uint256         | The rate mode of the borrow position to be repaid                                   |
| buyAllBalanceOffset | uint256         | Offset in the ParaSwap calldata if swapping all balance, otherwise 0                |
| paraswapData        | bytes           | Data for the ParaSwap Adapter                                                       |
| permitSignature     | PermitSignature | Struct containing the permit signature, set to zeroes if not used                   |

#### PermitSignature Struct

```solidity
struct PermitSignature {
    uint256 deadline;
    uint8 v;
    bytes32 r;
    bytes32 s;
}
```

##### Members:

| Name     | Type    | Description                                     |
| -------- | ------- | ----------------------------------------------- |
| deadline | uint256 | The deadline timestamp for the permit signature |
| v        | uint8   | The V parameter of the ECDSA signature          |
| r        | bytes32 | The R parameter of the ECDSA signature          |
| s        | bytes32 | The S parameter of the ECDSA signature          |

---

## Collateral Swap

The `ParaSwapLiquiditySwapAdapter` contract allows users to swap their supplied collateral from one asset to another in a single transaction using Aave's Flash Loans and the ParaSwap DEX aggregator.

This adapter enables users to rebalance their collateral positions without needing to withdraw and re-supply assets manually. By leveraging flash loans, the user can swap their existing collateral to a new asset and supply it back into the Aave protocol in a single transaction.

The source code is available on [GitHub](https://github.com/aave-dao/aave-v3-origin/blob/main/src/contracts/extensions/paraswap-adapters/ParaSwapLiquiditySwapAdapter.sol).

Reference Integration: [useCollateralSwap.tsx](https://github.com/aave/interface/blob/main/src/hooks/paraswap/useCollateralSwap.tsx)

### Write Methods

#### executeOperation

```solidity
function executeOperation(
    address asset,
    uint256 amount,
    uint256 premium,
    address initiator,
    bytes calldata params
) external override nonReentrant returns (bool)
```

Swaps the received amount from the flash loan into the specified asset. The received funds from the swap are then supplied into the protocol on behalf of the user.

The user should give this contract allowance to pull the aTokens in order to withdraw the underlying asset and repay the flash loan.

The `params` parameter should be the ABI-encoded values of the following:

- `IERC20Detailed assetToSwapTo` — The address of the underlying asset to be swapped to and supplied
- `uint256 minAmountToReceive` — The minimum amount to be received from the swap
- `uint256 swapAllBalanceOffset` — Offset in the Augustus calldata if swapping all balance, otherwise 0
- `bytes swapCalldata` — Calldata for ParaSwap's Augustus Swapper contract
- `IParaSwapAugustus augustus` — Address of ParaSwap's Augustus Swapper contract
- `PermitSignature permitParams` — Struct containing the permit signature, set to zeroes if not used

##### Input Parameters:

| Name      | Type    | Description                                                       |
| --------- | ------- | ----------------------------------------------------------------- |
| asset     | address | The address of the flash-borrowed asset                           |
| amount    | uint256 | The amount of the flash-borrowed asset                            |
| premium   | uint256 | The fee of the flash-borrowed asset                               |
| initiator | address | The address of the flash loan initiator                           |
| params    | bytes   | The byte-encoded parameters passed when initiating the flash loan |

##### Return Values:

| Type | Description                                                      |
| ---- | ---------------------------------------------------------------- |
| bool | True if the execution of the operation succeeds, false otherwise |

#### swapAndDeposit

```solidity
function swapAndDeposit(
    IERC20Detailed assetToSwapFrom,
    IERC20Detailed assetToSwapTo,
    uint256 amountToSwap,
    uint256 minAmountToReceive,
    uint256 swapAllBalanceOffset,
    bytes calldata swapCalldata,
    IParaSwapAugustus augustus,
    PermitSignature calldata permitParams
) external nonReentrant
```

Swaps an amount of an asset to another and supplies the new asset amount on behalf of the user without using a flash loan. This method can be used when the temporary transfer of the collateral asset to this contract does not affect the user's position.

The user should give this contract allowance to pull the aTokens in order to withdraw the underlying asset and perform the swap.

##### Input Parameters:

| Name                 | Type              | Description                                                       |
| -------------------- | ----------------- | ----------------------------------------------------------------- |
| assetToSwapFrom      | IERC20Detailed    | The address of the underlying asset to be swapped from            |
| assetToSwapTo        | IERC20Detailed    | The address of the underlying asset to be swapped to and supplied |
| amountToSwap         | uint256           | Amount to be swapped, or maximum amount when swapping all balance |
| minAmountToReceive   | uint256           | Minimum amount to be received from the swap                       |
| swapAllBalanceOffset | uint256           | Offset in Augustus calldata if swapping all balance, otherwise 0  |
| swapCalldata         | bytes             | Calldata for ParaSwap's Augustus Swapper contract                 |
| augustus             | IParaSwapAugustus | Address of ParaSwap's Augustus Swapper contract                   |
| permitParams         | PermitSignature   | Struct containing the permit signature, set to zeroes if not used |

---

## Borrow Position Swap

The `ParaSwapDebtSwapAdapter` contracts allow users to swap their borrow positions from one asset to another. They leverage Aave's Flash Loans and the ParaSwap DEX aggregator to perform the swap in a single atomic transaction.

There are two versions of the adapter:

- **ParaSwapDebtSwapAdapterV3**: The standard version that supports swapping any borrow position asset.

  - Source Code: [GitHub](https://github.com/aave/aave-debt-swap/blob/main/src/contracts/ParaSwapDebtSwapAdapterV3.sol)
  - Reference Integration: [useDebtSwitch.tsx](https://github.com/aave/interface/blob/main/src/hooks/paraswap/useDebtSwitch.tsx)

- **ParaSwapDebtSwapAdapterV3GHO**: A specialized version that supports GHO, where GHO can be flash minted via the ERC-3156 interface.

  - Source Code: [GitHub](https://github.com/aave/aave-debt-swap/blob/main/src/contracts/ParaSwapDebtSwapAdapterV3GHO.sol)
  - Reference Integration: [useDebtSwitch.tsx](https://github.com/aave/interface/blob/main/src/hooks/paraswap/useDebtSwitch.tsx)

### ParaSwapDebtSwapAdapterV3

The `ParaSwapDebtSwapAdapterV3` contract allows users to swap their borrow positions from one asset to another, enabling borrow position refinancing on the Aave protocol.

This adapter leverages Aave's Flash Loans and the ParaSwap DEX aggregator to perform the borrow position swap in a single transaction.

#### Write Methods

##### executeOperation

```solidity
function executeOperation(
    address[] calldata assets,
    uint256[] calldata amounts,
    uint256[] calldata,
    address initiator,
    bytes calldata params
) external returns (bool)
```

Performs the borrow position swap operation using the received funds from the flash loan.

Performs the swap and repay operation using the borrowed funds from the flash loan, and then re-borrows the new borrow position asset to maintain the overall borrow position.

The `params` parameter should be the ABI-encoded values required for the operation, such as:

- The addresses of the borrow position assets involved
- The rate modes of the borrow positions
- ParaSwap swap data
- Any necessary permit signatures

##### Input Parameters:

| Name      | Type      | Description                                                       |
| --------- | --------- | ----------------------------------------------------------------- |
| assets    | address[] | The addresses of the assets being borrowed in the flash loan      |
| amounts   | uint256[] | The amounts of the assets being borrowed                          |
| premiums  | uint256[] | The fees for the flash loans                                      |
| initiator | address   | The address of the flash loan initiator                           |
| params    | bytes     | Arbitrary data containing the parameters needed for the operation |

##### Return Values:

| Type | Description                                                      |
| ---- | ---------------------------------------------------------------- |
| bool | True if the execution of the operation succeeds, false otherwise |

### ParaSwapDebtSwapAdapterV3GHO

The `ParaSwapDebtSwapAdapterV3GHO` contract is a specialized version of the borrow position swap adapter that supports GHO, allowing users to swap their borrow positions involving GHO. It utilizes the ERC-3156 flash mint interface for GHO.

Performs the swap and repay operation using the borrowed funds from the flash loan, and then re-borrows the borrow position asset to maintain the overall borrow position.

#### Write Methods

##### onFlashLoan

```solidity
function onFlashLoan(
    address initiator,
    address token,
    uint256 amount,
    uint256 fee,
    bytes calldata data
) external override returns (bytes32)
```

This is the ERC-3156 Flash Loan callback function that gets called when the contract receives a flash loan (in this case, flash mint) from the GHO Flash Minter.

##### Input Parameters:

| Name      | Type    | Description                                                       |
| --------- | ------- | ----------------------------------------------------------------- |
| initiator | address | The initiator of the flash loan                                   |
| token     | address | The address of the token being borrowed                           |
| amount    | uint256 | The amount of tokens being borrowed                               |
| fee       | uint256 | The fee for the flash loan                                        |
| data      | bytes   | Arbitrary data containing the parameters needed for the operation |

##### Return Values:

| Type    | Description                                                         |
| ------- | ------------------------------------------------------------------- |
| bytes32 | The keccak256 hash of the string 'ERC3156FlashBorrower.onFlashLoan' |

---

## Withdraw & Swap

The `ParaSwapWithdrawSwapAdapter` contract allows users to withdraw their supplied assets from Aave and swap them to another asset in a single transaction using the ParaSwap DEX aggregator.

This adapter enables users to efficiently exit positions and swap their assets without having to perform multiple transactions, reducing gas costs and simplifying the user experience.

The source code is available on [GitHub](https://github.com/aave-dao/aave-v3-origin/blob/main/src/contracts/extensions/paraswap-adapters/ParaSwapWithdrawSwapAdapter.sol).

Reference Integration: [WithdrawAndSwitchActions.tsx](https://github.com/aave/interface/blob/main/src/components/transactions/Withdraw/WithdrawAndSwitchActions.tsx)

### Write Methods

#### withdrawAndSwap

```solidity
function withdrawAndSwap(
    IERC20Detailed assetToSwapFrom,
    IERC20Detailed assetToSwapTo,
    uint256 amountToSwap,
    uint256 minAmountToReceive,
    uint256 swapAllBalanceOffset,
    bytes calldata swapCalldata,
    IParaSwapAugustus augustus,
    PermitSignature calldata permitParams
) external nonReentrant
```

Swaps an amount of an asset to another after a withdrawal and transfers the new asset to the user. The user should give this contract allowance to pull the aTokens in order to withdraw the underlying asset and perform the swap.

##### Input Parameters:

| Name                 | Type              | Description                                                       |
| -------------------- | ----------------- | ----------------------------------------------------------------- |
| assetToSwapFrom      | IERC20Detailed    | The address of the underlying asset to be swapped from            |
| assetToSwapTo        | IERC20Detailed    | The address of the underlying asset to be swapped to              |
| amountToSwap         | uint256           | Amount to be swapped, or maximum amount when swapping all balance |
| minAmountToReceive   | uint256           | Minimum amount to be received from the swap                       |
| swapAllBalanceOffset | uint256           | Offset in Augustus calldata if swapping all balance, otherwise 0  |
| swapCalldata         | bytes             | Calldata for ParaSwap's Augustus Swapper contract                 |
| augustus             | IParaSwapAugustus | Address of ParaSwap's Augustus Swapper contract                   |
| permitParams         | PermitSignature   | Struct containing the permit signature, set to zeroes if not used |

#### executeOperation

Note that in this contract, the `executeOperation` method is overridden but simply reverts with `NOT_SUPPORTED`, so it's not intended to be used.

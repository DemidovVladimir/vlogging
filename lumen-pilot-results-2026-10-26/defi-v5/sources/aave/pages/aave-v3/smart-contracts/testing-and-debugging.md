# Testing & Debugging

This guide provides comprehensive instructions on how to test and debug Aave protocol integrations.

## Testing

There are two primary methods for testing the Aave protocol: using a **testnet** or creating **fork networks**.

### Testnet

The Aave protocol is available for testing on the Sepolia testnet. You can access the Sepolia v3 testnet market by visiting [app.aave.com](https://app.aave.com) and enabling testnet mode in the top right corner.

To get started:

1. Visit the test market on [app.aave.com](https://app.aave.com).
2. Use the **Faucet** tab to acquire test tokens available in the market.
3. Supply these tokens to the protocol.
4. Perform operations such as borrowing, repaying, and withdrawing to test different functionalities.

### Fork Networks

A fork network replicates the state of a blockchain, allowing you to interact with it in a sandbox environment. This is especially useful for testing scenarios that depend on contracts and states existing on the mainnet.

#### Creating a Fork Network

Several tools can help you create a fork network:

- **[Tenderly](https://docs.tenderly.co/simulations-and-forks/forks)**: Debugging toolkit with fork networks, simulations, and online dashboard.
- **[Foundry](https://book.getfoundry.sh/forge/fork-testing)**: Smart contract development framework.
- **[Hardhat](https://hardhat.org/hardhat-network/docs/guides/forking-other-networks)**: Smart contract development framework.

To acquire tokens on a fork network, you can impersonate an address that holds the desired tokens (holders can be found using block explorers) and transfer them to your address.

#### Connecting the Fork Network to the UI

The [app.aave.com](https://app.aave.com) interface can be configured to connect to a fork network. By setting specific variables via the browser console, you can enable this functionality. Refer to [this guide](https://github.com/aave/interface/blob/main/CONTRIBUTING.md#running-against-a-chain-fork) for detailed instructions.

## Debugging

When interacting with the Aave protocol, you may encounter smart contract errors. This section helps you understand how to interpret error codes, use debugging tools, and resolve common issues.

### Error Codes

The Aave protocol uses specific error codes to indicate why a transaction failed. Understanding these codes is essential for debugging. The error codes for each Aave protocol version are defined in their respective `Errors.sol` files:

- **Aave v3 Error Codes**: [Errors.sol](https://github.com/aave-dao/aave-v3-origin/blob/main/src/contracts/protocol/libraries/helpers/Errors.sol)
- **Aave V2 Error Codes**: [Errors.sol](https://github.com/aave/protocol-v2/blob/master/contracts/protocol/libraries/helpers/Errors.sol)

### Debugging Tools

To effectively debug transactions, you can use tools like **Tenderly**, **Hardhat**, and **Foundry**. These tools allow you to simulate transactions, inspect state changes, and step through execution to identify issues.

#### Tenderly

Tenderly allows you to simulate transactions and debug them step-by-step. By inputting the transaction details (`to`, `from`, `data`, and `value`), you can simulate the call and identify the cause of any revert, including error codes and stack traces.

#### Hardhat

Hardhat provides a local Ethereum environment for testing and debugging. It offers features like console logs in Solidity, detailed stack traces, and the ability to fork mainnet state for testing.

#### Foundry

Foundry is a fast, portable, and modular toolkit for Ethereum application development. It includes tools like Forge for testing and debugging smart contracts, allowing you to simulate and debug transactions effectively.

#### Understanding "Gas Estimation Failed"

The "Gas estimation failed" error is a generic message indicating that the transaction would fail if executed. To diagnose this issue:

1. Use the transaction's `to`, `from`, `data`, and `value` fields.
2. Simulate the transaction using one of the debugging tools mentioned above.
3. Identify the specific error code or exception causing the failure.
4. Examine the stack trace to pinpoint the issue.

### Common Errors

#### Aave v3 Pool

When interacting with the Aave v3 Pool, you may encounter issues related to token approvals, insufficient collateral, or reaching protocol limits.

##### ERC-20 Token Approval for Supply and Repay

Before supplying or repaying tokens, ensure that you have granted the Aave `Pool` contract an allowance to transfer tokens. This is performed by calling the `approve` function on the ERC-20 token contract to authorize the `Pool` as the `spender`.

##### Insufficient Collateral

If you're unable to borrow assets, it may be due to insufficient collateral or not meeting the required Loan-to-Value (LTV) ratios. Ensure that you have supplied enough collateral and that it satisfies the protocol's requirements.

##### Borrow Cap Reached

Sometimes, you may not be able to borrow a specific asset because the borrow cap has been reached. In this case, you may need to wait for borrowers to repay or supply more liquidity to the pool.

For more detailed explanations of potential revert cases, refer to this [DeFi Integration Guide](https://github.com/Walodja1987/DeFi-Integration-Guide/blob/main/AaveV3.1.md).

##### Loan To Value = 0%

When an Aave [reserve](../concepts/reserve) has a Loan To Value (LTV) parameter configured to 0%, commonly referred to as **LTV0**, it impacts reserve interactions in several ways:

- **Borrowing power**: Any existing collateral of this asset will no longer contribute to borrowing power.
- **Collateral status**: The asset can no longer be enabled as collateral.
- **Transfers**: If received via transfer, the asset will not be automatically enabled as collateral.
- **Withdrawals**: Assets with LTV0 must be disabled as collateral (using `Pool.setUserUseReserveAsCollateral` or by fully withdrawing the supplied balance) before other assets can be withdrawn.

#### WrappedTokenGateway

When interacting with Ether (ETH) in the Aave protocol, the `WrappedTokenGateway` is used to wrap ETH into WETH and vice versa. Common issues may include not sending ETH with the transaction when required or using incorrect functions for depositing or withdrawing ETH.

For detailed usage and potential revert causes, refer to the [WrappedTokenGateway documentation](./smart-contracts/wrapped-token-gateway).

# Smart Contracts

The source code of the Aave v3 Protocol contracts is available on [GitHub](https://github.com/aave-dao/aave-v3-origin). Contract addresses can be imported as Solidity or JavaScript package with the [Aave
Address Book](https://github.com/aave-dao/aave-address-book).

The core contracts fall into the following categories in the GitHub repository:

- Pool
- Configuration
- Logic
- Tokenization
- Helpers
- Misc

## Pool

### Pool

The [`Pool`](./smart-contracts/pool) is the main entry point into the Aave Protocol. Most user interactions with the Aave Protocol occur via the `Pool` contract. `Pool` is owned by the `PoolAddressesProvider` of the specific market. All admin functions are callable by the `PoolConfigurator` contract, which is defined in `PoolAddressesProvider`.

### L2Pool

The [`L2Pool`](./smart-contracts/l2-pool) is a modification of the `Pool` contract for L2 rollups, with gas-optimized user methods that takes byte encoded input arguments. It is a calldata optimized extension of the Pool contract allowing users to pass compact calldata representations to reduce transaction costs on rollups.

### PoolConfigurator

The [`PoolConfigurator`](./smart-contracts/pool-configurator) provides configuration methods for the `Pool` contract. The write methods of this contract can only be called by addresses with corresponding permissioned system roles that are managed by `ACLManager`.

## Configuration

### ACLManager

The [`ACLManager`](./smart-contracts/acl-manager) contract is the main registry of system roles and permissions.

### PoolAddressesProvider

The [`PoolAddressesProvider`](./smart-contracts/pool-addresses-provider) is a registry of various components of the protocol, including the `ACLManager` and `Pool` contracts, and has the ability to update pointers or update the implementation of proxy contracts.

## Logic

[Libraries](https://github.com/aave-dao/aave-v3-origin/blob/main/src/contracts/protocol/libraries/logic/) that implement the base logic for various actions and functions.

## Tokenization

### AToken

[`ATokens`](./smart-contracts/tokenization) are yield-generating tokens that are minted and burnt upon supply and withdraw of assets to Aave Pool.

### VariableDebtToken

[`VariableDebtTokens`](./smart-contracts/tokenization) are non-transferable interest accruing tokens representing variable borrow rate positions.

## Helpers

### L2Encoder

The [`L2Encoder`](https://github.com/aave-dao/aave-v3-origin/blob/main/src/contracts/helpers/L2Encoder.sol) is a helper contract to encode calldata that is passed to the `L2Pool`. It is used to optimize calldata size in `L2Pool` for transaction cost reduction. It is only intended to help generate calldata for users/frontends.

### AaveProtocolDataProvider

The [`AaveProtocolDataProvider`](./smart-contracts/view-contracts) is a peripheral contract to collect and pre-process information from the `Pool`.

## Misc

### AaveOracle

The [`AaveOracle`](./smart-contracts/oracles) is the registry of reserve oracle to get asset prices and manage price sources.

### DefaultReserveInterestRateStrategy

The [`DefaultReserveInterestRateStrategy`](./smart-contracts/interest-rate-strategy) implements the calculation of the interest rates depending on the reserve state. This contract holds the information needed to calculate and update the yield relating to specific liquidity pools.

### PriceOracleSentinel

The [`PriceOracleSentinel`](./smart-contracts/oracles) validates if operations are allowed depending on the `PriceOracle` health. Once the `PriceOracle` gets up after an outage or downtime, users can make their positions healthy during a grace period.

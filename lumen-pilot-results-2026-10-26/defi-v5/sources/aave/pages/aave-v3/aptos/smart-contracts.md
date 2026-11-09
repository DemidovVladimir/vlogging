# Smart Contracts

Aave v3.3 on Aptos is architected using a modular design that leverages Move's strengths. Each module encapsulates distinct functionality—from access control and configuration to data management and token operations—enabling isolated updates, robust permissioning, and scalable, secure protocol logic.

**Note:** There are two notable differences versus EVM Solidity:

- **Credit Delegation:** Not supported in Move, in part due to low EVM usage and the lack of a native `approve` feature in Aptos Fungible Asset Standard.
- **a_token Balance Management:** Users must connect to the Aave contract for reading the correct a_token balance and initiating transfers; these actions cannot be performed directly from the wallet.

## Modules

### @aave-pool

Main pool implementation that coordinates reserve management and user interactions. Includes configurator modules for protocol admins to adjust parameters and data providers for external queries.

### @aave-acl

Access Control List Manager that serves as the main registry of system roles and permissions. Implements role-based access control for various admin functions across the Aave protocol.

### @aave-config

Configuration module that defines error codes and implements bitmap logic for reserve and user configurations. Provides utilities for managing protocol parameters like LTV ratios, liquidation thresholds, and borrowing limits.

### @aave-oracle

Price oracle implementation that fetches and validates asset prices for the Aave protocol. Includes price cap adapters for stablecoins and sentinel functionality to handle oracle outages.

### @aave-tokens

Token factory modules for creating and managing aTokens and variable debt tokens. Handles token minting, burning, and transfer operations with proper scaling based on interest accrual.

### @aave-data

Data storage module that maintains protocol configuration values and token naming conventions. Stores interest rate strategies, e-mode configurations, and other protocol parameters for both mainnet and testnet.

### @aave-logic

Core business logic modules implementing liquidity pool operations like borrowing, supplying, and liquidations. Contains specialized logic for features like flash loans, e-mode, and isolation mode.

### @aave-periphery

Auxiliary modules that extend core functionality with features like rewards, emissions, and UI data providers. Includes a collector module for protocol fees, ecosystem reserve management, and coin migration utilities.

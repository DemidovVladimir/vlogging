# Aave v3 on Aptos

This is the official Aptos version of the Aave v3 Protocol. Access the [Aave Protocol on Aptos](https://aptos.aave.com/).

The Aptos Move codebase represents a faithful implementation of the Aave v3.3 protocol on the Aptos blockchain using the Move language. While maintaining the core financial logic and security properties of the original Solidity implementation, this port leverages Aptos's unique architectural features to enhance performance, security, and composability.

**High-Level Summary:**

- **Modular Design:** Organized into specialized modules with `friend` functions enforcing controlled inter-module access (no inheritance).
- **Resource-Oriented Programming:** Assets are treated as linear resources to prevent accidental copying or loss.
- **Native Token Support:** Integrates Aptos’s native fungible asset standard.
- **Enhanced Security:** Static dispatch and explicit access control help mitigate reentrancy and circular dependency vulnerabilities.
- **Safety & Verification:** Strong type enforcement and formal verification (Move Prover) support robust protocol correctness.

## Core Features

- **Full Liquidity Protocol Implementation:** Complete supply and borrow functionality, including variable interest rates, liquidations, collateral management, and risk parameters.
- **E-Mode:** Efficiency mode for correlated assets that allows higher borrowing power.
- **Isolation Mode:** Risk containment for new assets with customizable debt ceilings.
- **Fungible Asset Integration:** Native support for Aptos's fungible asset standard, Aptos's version of ERC-20.
- **Price Oracles:** Integration with external price feeds for accurate asset valuations.
- **Flexible Interest Rate Strategy:** Adaptable interest rate models based on utilization.

## Aptos Move Implementation Approach

The implementation follows the logic of the Aave v3.3 Solidity codebase on a 1:1 basis, while adapting to Move’s unique paradigms:

- **Object Model vs. Contract Model**
- **Resource-Oriented Design:** Instead of Solidity contracts, the implementation uses Move's resource model to store protocol state.
- **Object-Centric Architecture:** Leverages Aptos's object model for reserve data and token management, providing stronger ownership guarantees.
- **Resource Groups:** Utilizes resource groups to organize related data structures efficiently.

## Key Architectural Differences

- **Module Structure:**
  - Functionality is divided into specialized modules (`pool_logic`, `generic_logic`, `liquidation_logic`, etc.) rather than monolithic contracts.
  - `friend` functions provide controlled access between modules for specific functions, enabling a permission-based composition model.
  - Move has no inheritance, forcing explicit composition patterns instead of the hierarchical inheritance common in Solidity.
- **Token Implementation:**
  - Uses Aptos's Fungible Asset standard instead of ERC-20.
  - Implements a `token_base` module that abstracts common token functionality.
  - Provides a `coin_migrator` to bridge between Aptos Coin and Fungible Asset standards.
- **State Management:**
  - Leverages Move's ability to pass references to resources, enabling more efficient state updates.
  - Uses `SmartTables` for mapping-like functionality with better gas efficiency.
- **Type Safety:**
  - Takes advantage of Move's strong type system to prevent runtime errors common in Solidity.
  - Uses generics where appropriate to enhance code reusability.
- **Object References:**
  - Reserve data is stored as objects with explicit access controls, improving security.
  - Capabilities are used to control privileged operations instead of address-based access control.

## Move Language Security Features

- **Resource-Oriented Programming:**
  - Resources in Move cannot be copied or implicitly discarded, only moved between storage locations.
  - This ensures assets like tokens maintain conservation properties by design.
- **No Reentrancy Vulnerabilities:**
  - Move's execution model prevents circular dependencies and function callbacks.
  - Static dispatch instead of dynamic dispatch eliminates reentrancy attacks common in Solidity.
- **Linear Type System:**
  - Resources are linear types that must be consumed exactly once, preventing double-spending.
  - Compiler enforces resource handling rules, making many runtime checks unnecessary.
- **Formal Verification:**
  - Built-in Move Prover enables mathematical verification of code correctness.
  - Specifications can be written alongside code to prove safety properties.
- **Explicit Access Control:**
  - Capabilities pattern enforces permission-based access to sensitive operations.
  - Friend functions provide controlled access between modules without full inheritance.
- **Predictable Gas Model:**
  - More deterministic execution costs due to static dispatch and simpler VM design.
  - Reduced gas surprises compared to Solidity's dynamic dispatch model.
- **Global Storage Structure:**
  - Account-centric storage model with clear ownership semantics.
  - Resources stored directly in accounts rather than in contract storage.
- **Ability-Based Type System:**
  - Types have explicit abilities (`copy`, `drop`, `store`, `key`) that control how values can be used.
  - Prevents common errors like unintended copying of sensitive data.

## Notable Implementation Details

- **Precise Math:** Implements ray math (27 decimal places) and wad math (18 decimal places) for high-precision financial calculations.
- **Interest Rate Accrual:** Uses the same compound interest model with liquidity and borrow indices for efficient interest tracking.
- **Configuration Data:** Uses dedicated resource structures for storing protocol configuration.
- **Event Emission:** Maps Solidity events to Move events for protocol monitoring and analytics.

The protocol maintains the same economic and security properties as the original Aave v3.3 protocol while embracing the strengths of the Aptos blockchain and Move language, providing a robust and efficient DeFi liquidity protocol for the Aptos ecosystem.

## Next Steps

- [Smart Contracts](/aave-v3/aptos/smart-contracts) — the module-by-module reference for the Move implementation.
- [Integrations](/aave-v3/aptos/integrations) — the APIs and SDKs for interacting with Aave on Aptos.

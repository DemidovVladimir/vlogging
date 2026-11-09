# Access Control

Reference for the `aave-acl` Move package.

## Overview

The ACL Manager implements a role-based access control system where different addresses can be assigned specific roles that grant them permissions to perform certain actions within the Aave protocol. Each role has an admin role that controls who can grant or revoke that role.

## Roles

The module defines several key roles that align with the Ethereum implementation:

- **DEFAULT_ADMIN_ROLE:** The highest-level administrative role.

- **POOL_ADMIN_ROLE:** Can update token implementations, manage reserves, and more.

- **EMERGENCY_ADMIN_ROLE:** Can pause/unpause the pool or individual reserves.

- **RISK_ADMIN_ROLE:** Can update reserve parameters and risk settings.

- **FLASH_BORROWER_ROLE:** Has premium on flash loans waived.

- **ASSET_LISTING_ADMIN_ROLE:** Can update oracle sources and add new assets.

- **FUNDS_ADMIN_ROLE:** Manages funds-related operations.

- **EMISSION_ADMIN_ROLE:** Manages emission-related settings.

- **ADMIN_CONTROLLED_ECOSYSTEM_RESERVE_FUNDS_ADMIN_ROLE:** Manages ecosystem reserve funds.

- **REWARDS_CONTROLLER_ADMIN_ROLE:** Manages reward controllers.

## Core Functions

### Role Management Functions

#### default_admin_role

```move=
#[view]
public fun default_admin_role(): String
```

Returns the identifier for the default admin role, which has the highest level of permissions in the system.

#### get_role_admin

```move=
#[view]
public fun get_role_admin(role: String): String
```

Returns the admin role that controls a specific role. By default, all roles are controlled by the `DEFAULT_ADMIN_ROLE`.

#### set_role_admin

```move=
public fun set_role_admin(admin: &signer, role: String, admin_role: String)
```

Sets a new admin role for a specific role. Only addresses with the `DEFAULT_ADMIN_ROLE` can call this function.

#### has_role

```move=
#[view]
public fun has_role(role: String, user: address): bool
```

Checks if an address has a specific role.

#### grant_role

```move=
public fun grant_role(admin: &signer, role: String, user: address)
```

Grants a role to an address. Can only be called by an address that has the admin role for the role being granted.

#### renounce_role

```move=
public entry fun renounce_role(admin: &signer, role: String, user: address)
```

Allows an address to renounce a role it has been granted. The caller must be the same as the address renouncing the role.

#### revoke_role

```move
public fun revoke_role(admin: &signer, role: String, user: address)
```

Revokes a role from an address. Can only be called by an address that has the admin role for the role being revoked.

### Role-Specific Management Functions

#### Pool Admin Functions

```move=
public entry fun add_pool_admin(admin: &signer, user: address)

public entry fun remove_pool_admin(admin: &signer, user: address)

#[view]
public fun is_pool_admin(admin: address): bool
```

These functions add, remove, and check if an address has the POOL_ADMIN_ROLE. Pool admins can update token implementations, manage reserves, and perform other high-level administrative actions.

#### Emergency Admin Functions

```move=
public entry fun add_emergency_admin(admin: &signer, user: address)

public entry fun remove_emergency_admin(admin: &signer, user: address)

#[view]
public fun is_emergency_admin(admin: address): bool
```

These functions manage the `EMERGENCY_ADMIN_ROLE`, which allows addresses to pause and unpause the pool or individual reserves in emergency situations.

#### Risk Admin Functions

```move
public entry fun add_risk_admin(admin: &signer, user: address)

public entry fun remove_risk_admin(admin: &signer, user: address)

#[view]
public fun is_risk_admin(admin: address): bool
```

These functions manage the `RISK_ADMIN_ROLE`, which allows addresses to update reserve parameters, grace periods, and other risk-related settings.

#### Flash Borrower Functions

```move=
public entry fun add_flash_borrower(admin: &signer, borrower: address)

public entry fun remove_flash_borrower(admin: &signer, borrower: address)

#[view]
public fun is_flash_borrower(borrower: address): bool
```

These functions manage the `FLASH_BORROWER_ROLE`, which allows addresses to have the premium on flash loans waived.

#### Asset Listing Admin Functions

```move
public entry fun add_asset_listing_admin(admin: &signer, user: address)

public entry fun remove_asset_listing_admin(admin: &signer, user: address)

#[view]
public fun is_asset_listing_admin(admin: address): bool
```

These functions manage the `ASSET_LISTING_ADMIN_ROLE`, which allows addresses to update oracle sources and add new assets to the Aave market.

#### Additional Admin Roles

The module also includes functions for managing several other specialized roles:

- **Funds Admin:** Manages funds-related operations
- **Emission Admin:** Manages emission-related settings
- **Admin Controlled Ecosystem Reserve Funds Admin:** Manages ecosystem reserve funds
- **Rewards Controller Admin:** Manages reward controllers

### Role Identifier Getter Functions

```move=
#[view]
public fun get_pool_admin_role(): String

#[view]
public fun get_emergency_admin_role(): String

#[view]
public fun get_risk_admin_role(): String

#[view]
public fun get_flash_borrower_role(): String

#[view]
public fun get_asset_listing_admin_role(): String

#[view]
public fun get_funds_admin_role(): String

#[view]
public fun get_emission_admin_role(): String

#[view]
public fun get_admin_controlled_ecosystem_reserve_funds_admin_role(): String

#[view]
public fun get_rewards_controller_admin_role(): String
```

These functions are useful for getting the standardized string identifiers for each role when interacting with the ACL Manager.

## Events

The module emits events for key role management actions:

- `RoleAdminChanged`: Emitted when a role's admin role is changed.
- `RoleGranted`: Emitted when a role is granted to an address.
- `RoleRevoked`: Emitted when a role is revoked from an address.

These events allow for tracking changes to the access control system over time.

## Summary

The Aave ACL Manager module provides a comprehensive role-based access control system for the Aave protocol on Aptos. It closely mirrors the functionality of the Ethereum implementation while leveraging Aptos's Move language features for enhanced safety and expressiveness.

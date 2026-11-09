# Incentives

Reference for the `aave-incentives` Move package.

This documentation covers the Aave periphery modules for the Aptos Move implementation, focusing on incentives and related functionality.

## Incentives

The incentives system in Aave allows for distributing rewards to users who supply or borrow assets in the protocol. The system is managed through several key modules that work together to configure, track, and distribute rewards.

## RewardsController

The `rewards_controller` module is the main component for managing incentives in the Aave protocol. It handles the distribution of rewards to protocol participants who hold incentivized assets (aTokens or variableDebtTokens).

Users accrue rewards automatically when they hold these tokens without needing to stake or lock their assets. The rewards can be claimed through various functions that provide flexibility in how rewards are collected.

### Key Structures

```move=
struct RewardsConfigInput has store, drop {
    emission_per_second: u128,
    total_supply: u256,
    distribution_end: u32,
    asset: address,
    reward: address,
    pull_rewards_transfer_strategy: Object<PullRewardsTransferStrategy>
}
```

This structure defines the configuration for a reward emission, including:

- `emission_per_second`: The rate at which rewards are distributed

- `total_supply`: The total supply of the asset being incentivized

- `distribution_end`: When the reward distribution ends

- `asset`: The address of the asset being incentivized (aToken or variableDebtToken)

- `reward`: The address of the reward token

- `pull_rewards_transfer_strategy`: The strategy for transferring rewards

### Write Methods

#### configure_assets

```move=
public(friend) fun configure_assets(
    config_inputs: vector<RewardsConfigInput>,
    rewards_controller_address: address
)
```

Configures assets to incentivize with an emission of rewards per second until the end of distribution.

#### set_pull_rewards_transfer_strategy

```move=
public(friend) fun set_pull_rewards_transfer_strategy(
    reward: address,
    strategy: Object<PullRewardsTransferStrategy>,
    rewards_controller_address: address
)
```

Sets a transfer strategy for a specific reward token that determines how rewards are transferred to users.

#### handle_action

```move=
// This function is called when users perform actions like supply, withdraw,
// transfer, etc. to update reward calculations
public(friend) fun handle_action(
    asset: address,
    user: address,
    total_supply: u256,
    user_balance: u256,
    rewards_controller_address: address
)
```

Called when a user performs an action that affects their balance of an incentivized asset, updating the rewards distribution accordingly.

#### claim_rewards

```move=
// Internal implementation for claiming rewards
fun claim_rewards_internal(
    assets: vector<address>,
    amount: u256,
    claimer: address,
    user: address,
    to: address,
    reward: address,
    rewards_controller_address: address
): u256
```

Claims rewards for a user on specific assets, with the rewards sent to a designated address.

#### claim_all_rewards

```move=
// Internal implementation for claiming all rewards
fun claim_all_rewards_internal(
    assets: vector<address>,
    claimer: address,
    user: address,
    to: address,
    rewards_controller_address: address
): (vector<address>, vector<u256>)
```

Claims all available rewards for a user across specified assets, returning the list of reward tokens and amounts claimed.

### View Methods

#### get_pull_rewards_transfer_strategy

```move=
public fun get_pull_rewards_transfer_strategy(
    reward: address,
    rewards_controller_address: address
): Option<Object<PullRewardsTransferStrategy>>
```

#### get_rewards_data

```move=
public fun get_rewards_data(
    asset: address,
    reward: address,
    rewards_controller_address: address
): (u256, u256, u256, u256)
```

Returns reward data for a specific asset and reward token, including emission rates and distribution end time.

#### get_user_asset_index

```move=
// Used to get the user's index for a specific asset and reward
public fun get_user_asset_index(
    user: address,
    asset: address,
    reward: address,
    rewards_controller_address: address
): u256
```

Returns the user's index for a specific asset and reward, used for calculating accrued rewards.

#### get_user_accrued_rewards

```move=
// Used to get the user's accrued rewards for a specific reward token
public fun get_user_accrued_rewards(
    user: address,
    reward: address,
    rewards_controller_address: address
): u256
```

Returns the amount of rewards accrued by a user for a specific reward token.

## EmissionManager

The `emission_manager` module manages the configuration of reward emissions and acts as an administrative layer above the `rewards_controller`.

### Key Functions

#### configure_assets

```move=
public entry fun configure_assets(
    account: &signer,
    emissions_per_second: vector<u128>,
    total_supplies: vector<u256>,
    distribution_ends: vector<u32>,
    assets: vector<address>,
    rewards: vector<address>,
    pull_rewards_transfer_strategies: vector<Object<PullRewardsTransferStrategy>>
)
```

Configures assets for incentives, creating reward configurations and passing them to the rewards controller.

#### set_pull_rewards_transfer_strategy

```move
public entry fun set_pull_rewards_transfer_strategy(
    caller: &signer,
    reward: address,
    pull_rewards_transfer_strategy: Object<PullRewardsTransferStrategy>
)
```

Sets the transfer strategy for a specific reward token.

#### set_distribution_end

```move
public entry fun set_distribution_end(
    caller: &signer,
    asset: address,
    reward: address,
    new_distribution_end: u32
)
```

Updates the end time for a reward distribution on a specific asset.

#### set_emission_admin

```move
// Sets the admin for a specific reward token
public entry fun set_emission_admin(
    account: &signer,
    reward: address,
    new_admin: address
)
```

Sets the address that has permission to configure emissions for a specific reward token.

### View Methods

#### get_rewards_controller

```move=
public fun get_rewards_controller(): address
```

Returns the address of the rewards controller.

#### get_emission_admin

```move=
public fun get_emission_admin(reward: address): address
```

Returns the admin address for a specific reward token.

## TransferStrategy

The `transfer_strategy` module defines how rewards are transferred to users when they claim them.

### PullRewardsTransferStrategy

```move=
struct PullRewardsTransferStrategy has key {
    rewards_admin: address,
    incentives_controller: address,
    rewards_vault: SignerCapability
}
```

This strategy pulls rewards from a vault resource account to the recipient address.

### Key Functions

#### pull_rewards_transfer_strategy_perform_transfer

```move=
public(friend) fun pull_rewards_transfer_strategy_perform_transfer(
    incentives_controller: address,
    to: address,
    reward: address,
    amount: u256,
    strategy: Object<PullRewardsTransferStrategy>
): bool
```

Transfers rewards from the vault to the recipient.

### View Methods

#### pull_rewards_transfer_strategy_get_incentives_controller

```move=
public fun pull_rewards_transfer_strategy_get_incentives_controller(
    strategy: Object<PullRewardsTransferStrategy>
): address
```

Returns the incentives controller address associated with the strategy.

#### pull_rewards_transfer_strategy_get_rewards_admin

```move=
public fun pull_rewards_transfer_strategy_get_rewards_admin(
    strategy: Object<PullRewardsTransferStrategy>
): address
```

Returns the rewards admin address for the strategy.

#### pull_rewards_transfer_strategy_get_rewards_vault

```move=
public fun pull_rewards_transfer_strategy_get_rewards_vault(
    strategy: Object<PullRewardsTransferStrategy>
): address
```

Returns the address of the rewards vault.

## UI Incentive Data Provider

The `ui_incentive_data_provider_v3` module provides view functions to query incentive data for UI display.

### Key Structures

```move=
struct AggregatedReserveIncentiveData has store, drop {
    underlying_asset: address,
    a_incentive_data: IncentiveData,
    v_incentive_data: IncentiveData
}

struct IncentiveData has store, drop {
    token_address: address,
    incentive_controller_address: address,
    rewards_token_information: vector<RewardInfo>
}

struct RewardInfo has store, drop {
    reward_token_symbol: String,
    reward_token_address: address,
    emission_per_second: u256,
    // Additional fields...
}
```

### View Methods

#### get_reserves_incentives_data

```move
public fun get_reserves_incentives_data(): vector<AggregatedReserveIncentiveData>
```

Returns incentive data for all reserves in the protocol, including information about reward tokens, emission rates, and other parameters.

#### get_user_reserves_incentives_data

```move
public fun get_user_reserves_incentives_data(user: address): vector<UserReserveIncentiveData>
```

Returns incentive data specific to a user, including their accrued rewards and other user-specific incentive information.

## Collector

The `collector` module manages the collection and distribution of protocol fees.

### Key Functions

#### deposit

```move=
public fun deposit(sender: &signer, fa: FungibleAsset)
```

Deposits fungible assets into the collector.

#### withdraw

```move=
public fun withdraw(
    sender: &signer,
    asset_metadata: Object<Metadata>,
    receiver: address,
    amount: u64
)
```

Withdraws assets from the collector to a specified receiver.

### View Methods

#### get_collected_fees

```move
public fun get_collected_fees(asset_metadata: Object<Metadata>): u64
```

Returns the amount of fees collected for a specific asset.

## CoinMigrator

The `coin_migrator` module provides functionality to convert between Coin and FungibleAsset representations.

### View Methods

#### get_fa_address

```move
public fun get_fa_address<CoinType>(): address
```

Returns the address of the fungible asset associated with a specific coin type.

#### get_fa_balance

```move
fun get_fa_balance<CoinType>(owner: address): u64
```

Returns the fungible asset balance for a specific coin type and owner.

## UI Pool Data Provider

The `ui_pool_data_provider_v3` module provides view functions to query pool data for UI display.

### View Methods

#### get_reserves_list

```move=
public fun get_reserves_list(): vector<address>
```

Returns the list of all reserves in the protocol.

#### get_reserves_data

```move=
public fun get_reserves_data(): (vector<AggregatedReserveData>, BaseCurrencyInfo)
```

Returns detailed data about all reserves in the protocol, including configuration, rates, and other parameters.

#### get_user_reserves_data

```move=
public fun get_user_reserves_data(user: address): (vector<UserReserveData>, u8)
```

Returns data about a user's positions in the protocol, including balances and configuration.

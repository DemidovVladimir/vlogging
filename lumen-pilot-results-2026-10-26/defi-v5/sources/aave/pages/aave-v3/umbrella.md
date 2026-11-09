# Umbrella

Aave Umbrella is a modular, onchain risk management system that automates bad debt coverage for Aave v3 pools. Umbrella introduces a more capital-efficient and automated way to protect the protocol without requiring governance intervention.

Umbrella allows users to stake two types of assets: aTokens (supplied tokens such as aUSDC, aUSDT, and aWETH) and GHO (Aave's native stablecoin). By staking these protocol assets, users actively contribute to risk management while earning rewards.

Umbrella enhances the reslience of the Aave Protocol by replacing the existing Safety Module with an automated staking system. If a deficit occurs in a given asset, Umbrella enables the corresponding staked assets to be burned and offset the bad debt, removing the need for governance decisions or manual intervention. This creates a more efficient, responsive, and predictable safety mechanism for the protocol and its users.

Umbrella can be interacted with using the [Aave Labs Interface](https://app.aave.com).

## Key Benefits

**Automated Coverage**: Eliminates reliance on governance for bad debt resolution by responding directly to measurable, onchain deficit data.

**aToken Staking**: Allows users to stake aTokens they already hold within Aave, continuing to earn underlying yield while participating in risk management.

**Increased Efficiency**: aTokens are the most capital-efficient assets to cover deficits. For example, burning aUSDT directly covers USDT bad debt without requiring market sales.

**Enhanced Security**: Creates a more resilient protocol by tying coverage directly to the borrow assets through an automated mechanisms.

## Rewards and Safety Incentives

With Umbrella, users who stake their aTokens continue earning yield on their supplied assets while gaining additional rewards for helping secure the protocol. For aToken staking (USDC, USDT, WETH), you earn dual yield streams. The underlying aToken yield continues accruing automatically in your staked position, while additional Safety Incentives compensate you for assuming slashing risk.

For GHO staking, you earn Safety Incentives directly since GHO doesn't generate underlying yield like aTokens. These rewards can be paid in various tokens like AAVE, GHO, or USDC, depending on governance configuration. Unlike automatic aToken yield, Safety Incentives must be actively claimed through blockchain transactions.

The rewards system uses a mathematically modeled Emission Curve that targets optimal staking levels. The system defines a target amount of staked assets and allocates maximum rewards when total staking reaches exactly that target. When total staked assets are below the target, rewards are proportionally higher to attract participation. When staking exceeds the target, rewards decrease slightly to discourage over-staking.

This creates a natural balancing mechanism that prevents extreme APY fluctuations. As a general rule, the maximum APY when minimal assets are staked is double the APY at target liquidity, but the curve avoids misleading triple-digit scenarios that disappear with increased participation.

## Slashing Risk and Deficit Protection

In return for earning rewards, stakers accept the possibility of slashing if a deficit arises on the specific pool and asset they have staked. Staking risk is isolated to the specific asset and network where the aTokens are staked. For example, staking aUSDC helps cover bad debt in USDC only.

The system includes crucial deficit offset mechanisms that provide first-loss protection. For example, USDT staking has a 100,000 USDT offset, meaning the Aave DAO covers the first 100,000 USDT of bad debt before any staker assets are affected. While the protocol design allows for slashing up to the full staked amount in extreme scenarios, the offset mechanisms significantly reduce the likelihood of any slashing for typical deficit scenarios.

To put this in perspective, during the first month of Aave v3.3 operation, approximately $400 in total deficit accumulated across all pools, against nearly $9.5 billion in outstanding borrows. This represents roughly 0.000004% of outstanding borrowings.

## Network Coverage and Initial Activation

Initial activation starts with Ethereum and will expand to other networks, focusing on high-borrow demand assets like USDC, USDT, WETH, and GHO. Activation parameters, including reward rates and target liquidity levels, are set by the Aave DAO, with ongoing management delegated to the Aave Finance Committee.

Each Umbrella deployment protects only the specific asset and network where it's staked, providing precise risk isolation. The system maintains a 20-day cooldown period and 2-day withdrawal window, consistent with the previous Safety Module.

## Transition from the Legacy Safety Module

Umbrella will gradually replace the legacy Safety Module. Current participants have different migration paths depending on their staked assets.

**stkAAVE and stkABPT** will remain active during the transition, with slashing disabled once Umbrella reaches sufficient scale. No immediate action is required for these positions.

**Staked GHO (stkGHO)** is being transitioned to the new savings GHO (sGHO) — a native ERC-4626 vault that earns a fixed APR via an on-chain yield index with no cooldown period, no slashing risk, and no rehypothecation. Users should withdraw GHO from the legacy stkGHO contract and deposit into the new sGHO vault. See the [sGHO guide](/ecosystem/gho/sgho) for integration details. For higher rewards with slashing risk, users can instead migrate to Umbrella stkGHO by activating cooldown on legacy stkGHO, unstaking their GHO, then staking in the new Umbrella system.

This empowers suppliers who aren't borrowing to participate in risk management while earning rewards, creating broader participation in protocol security and aligning incentives with protocol health.

See the [Umbrella FAQ](https://aave.com/faq#umbrella) for more common questions.

## Architecture

Umbrella is built from three main contract types:

- **UmbrellaCore:** Orchestrates deficit monitoring, slashing, and asset coverage for each Aave v3 pool.
- **StakeToken:** ERC4626 Vault per asset and network that handles staking, cooldown, slashing, and integrates with the rewards controller.
- **RewardsController:** Manages multi-token rewards, emission curves, and user reward accounting.
- **UmbrellaBatchHelper**: Periphery contract enabling multiple actions to be batched into a single transaction.

## Staking

To participate, users deposit supported assets (wrapped aTokens or GHO) into the appropriate StakeToken contract. This action mints shares representing their position. The StakeToken uses an exchange rate that starts at 1:1 and only decreases if slashing occurs.

Staking can be performed with a standard ERC20 `approve` and `deposit`, or with EIP-2612 permit signature using `depositWithPermit`. Users may also set a cooldown operator to manage their cooldowns.

```solidity
IERC20 underlying = IERC20(stakeToken.asset());
underlying.approve(address(stakeToken), amount);
stakeToken.deposit(amount, msg.sender);
```

## Unstaking

To withdraw, users must first activate a cooldown by calling `cooldown()`. The cooldown period is 20 days (configurable by governance), followed by a 2-day unstake window. During cooldown, rewards continue to accrue and funds remain slashable. Only one cooldown record is allowed per user at a time. If a user transfers shares after activating cooldown, the amount available for withdrawal is reduced. Depositing more after cooldown does not affect the cooldowned amount.

After the cooldown period, users can withdraw within the unstake window using `redeem` or `withdraw`. If the window is missed, the cooldown must be restarted. Withdrawals are always subject to the current exchange rate, which may have changed due to slashing.

```solidity
stakeToken.cooldown();
// ...wait for cooldown period...
stakeToken.redeem(shares, msg.sender, msg.sender);
```

## Slashing

Slashing is triggered automatically by UmbrellaCore when a deficit in the corresponding Aave pool exceeds the configured offset. Slashing reduces total assets in the StakeToken, lowering the value of all shares. The contract enforces a minimum assets floor to prevent full depletion. Only UmbrellaCore (the owner) can call `slash`, and slashed assets are sent to the Aave Collector for deficit coverage.

```solidity
function slash(uint256 amount) external onlyOwner;
```

## Rewards

Rewards are managed by the RewardsController, which supports up to 8 reward tokens per StakeToken. Emission rates are governed by a piecewise linear curve, targeting optimal liquidity. Below the target liquidity, rewards are boosted to attract stakers; at target, emission is maximized; above target, emission tapers off to discourage over-staking. Governance sets up new assets and rewards, while a Rewards Admin can adjust emission rates and distribution end times.

Users can claim all available rewards for their assets at any time, or authorize a claimer to do so on their behalf.

```solidity
rewardsController.claimAllRewards([address(stakeToken)], msg.sender);
```

To claim a specific reward:

```solidity
rewardsController.claimRewards(
    [address(stakeToken)],
    amount,
    msg.sender,
    rewardToken
);
```

To set a claimer:

```solidity
rewardsController.setClaimer(user, claimer);
```

## Deployed Contracts

| Name                                           | Address                                                                                                               |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| **UMBRELLA**                                   | [0xD400fc38ED4732893174325693a63C30ee3881a8](https://etherscan.io/address/0xD400fc38ED4732893174325693a63C30ee3881a8) |
| **UMBRELLA_IMPL**                              | [0x929e21D24D3f2A529621AdC248D227012B72646d](https://etherscan.io/address/0x929e21D24D3f2A529621AdC248D227012B72646d) |
| **UMBRELLA_STAKE_TOKEN_IMPL**                  | [0x75e8aC0c063B6966E2A9954adEdf39BdE9370197](https://etherscan.io/address/0x75e8aC0c063B6966E2A9954adEdf39BdE9370197) |
| **UMBRELLA_REWARDS_CONTROLLER**                | [0x4655Ce3D625a63d30bA704087E52B4C31E38188B](https://etherscan.io/address/0x4655Ce3D625a63d30bA704087E52B4C31E38188B) |
| **UMBRELLA_REWARDS_CONTROLLER_IMPL**           | [0x85C3371044e49782DbE3dC23de1D77a078aFb5d0](https://etherscan.io/address/0x85C3371044e49782DbE3dC23de1D77a078aFb5d0) |
| **PERMISSIONED_PAYLOADS_CONTROLLER**           | [0xF86F77F7531B3374274E3f725E0A81D60bC4bB67](https://etherscan.io/address/0xF86F77F7531B3374274E3f725E0A81D60bC4bB67) |
| **PERMISSIONED_PAYLOADS_CONTROLLER_EXECUTOR**  | [0x2759de67aD133C747C9f41d56F1b8A343cE679a1](https://etherscan.io/address/0x2759de67aD133C747C9f41d56F1b8A343cE679a1) |
| **UMBRELLA_BATCH_HELPER**                      | [0xCe6Ced23118EDEb23054E06118a702797b13fc2F](https://etherscan.io/address/0xCe6Ced23118EDEb23054E06118a702797b13fc2F) |
| **UMBRELLA_CONFIG_ENGINE**                     | [0x3f3EfAeba02bbA78BA7E89Dc6Ec503C8fe5fd5a4](https://etherscan.io/address/0x3f3EfAeba02bbA78BA7E89Dc6Ec503C8fe5fd5a4) |
| **DATA_AGGREGATION_HELPER**                    | [0xcc8FD820B1b9C5EBACA8615927f2fFc1f74B9dB3](https://etherscan.io/address/0xcc8FD820B1b9C5EBACA8615927f2fFc1f74B9dB3) |
| **DEFICIT_OFFSET_CLINIC_STEWARD**              | [0x6c1DC85f2aE71C3DAcd6E44Bb57DEeF61b540a5A](https://etherscan.io/address/0x6c1DC85f2aE71C3DAcd6E44Bb57DEeF61b540a5A) |
| **AAVE**                                       | [0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9](https://etherscan.io/address/0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9) |
| **AAVE_ORACLE**                                | [0x547a514d5e3769680Ce22B2361c10Ea13619e8a9](https://etherscan.io/address/0x547a514d5e3769680Ce22B2361c10Ea13619e8a9) |
| **STK_AAVE**                                   | [0x4da27a545c0c5B758a6BA100e3a049001de870f5](https://etherscan.io/address/0x4da27a545c0c5B758a6BA100e3a049001de870f5) |
| **GHO**                                        | [0x40D16FC0246aD3160Ccc09B8D0D3A2cD28aE6C2f](https://etherscan.io/address/0x40D16FC0246aD3160Ccc09B8D0D3A2cD28aE6C2f) |
| **GHO_ORACLE**                                 | [0x3f12643d3f6f874d39c2a4c9f2cd6f2dbac877fc](https://etherscan.io/address/0x3f12643d3f6f874d39c2a4c9f2cd6f2dbac877fc) |
| **STK_GHO**                                    | [0x1a88Df1cFe15Af22B3c4c783D4e6F7F9e0C1885d](https://etherscan.io/address/0x1a88Df1cFe15Af22B3c4c783D4e6F7F9e0C1885d) |
| **STK_AAVE_WSTETH_BALANCER_POOL_V2**           | [0x9eDA81C21C273a82BE9Bbc19B6A6182212068101](https://etherscan.io/address/0x9eDA81C21C273a82BE9Bbc19B6A6182212068101) |
| **STK_AAVE_WSTETH_BALANCER_POOL_V2_ORACLE**    | [0xADf86b537eF08591c2777E144322E8b0Ca7E82a7](https://etherscan.io/address/0xADf86b537eF08591c2777E144322E8b0Ca7E82a7) |
| **STK_AAVE_WSTETH_BALANCER_POOL_V2_MIGRATOR**  | [0xecD4bd3121F9FD604ffaC631bF6d41ec12f1fafb](https://etherscan.io/address/0xecD4bd3121F9FD604ffaC631bF6d41ec12f1fafb) |
| **STK_AAVE_ETH_BALANCER_POOL_V1** (deprecated) | [0xa1116930326D21fB917d5A27F1E9943A9595fb47](https://etherscan.io/address/0xa1116930326D21fB917d5A27F1E9943A9595fb47) |
| **STK_AAVE_ETH_BALANCER_POOL_V1** (deprecated) | [0x209Ad99bd808221293d03827B86cC544bcA0023b](https://etherscan.io/address/0x209Ad99bd808221293d03827B86cC544bcA0023b) |

## Resources

- [Smart Contracts](https://github.com/aave-dao/aave-umbrella)
- [Frontend Implemenation](https://github.com/aave-dao/aave-umbrella-ui)

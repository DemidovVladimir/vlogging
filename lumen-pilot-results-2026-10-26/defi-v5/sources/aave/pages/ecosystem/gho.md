# GHO

GHO (pronounced "go") is a decentralised, over-collateralised stablecoin that is fully backed, transparent, and native to the Aave Protocol. Designed to maintain a value pegged to the U.S. dollar, GHO is minted by users on demand, subject to mint cap limitations set by Aave's governance. Its stability is maintained through market efficiencies and over-collateralisation mechanisms inherent in the Aave Protocol.

GHO is an ERC-20 token deployed on Ethereum that operates through a facilitator model. Facilitators are contracts approved by Aave Governance with the ability to mint and burn GHO, each subject to a governance-defined mint cap. This model allows for flexibility in expanding GHO's functionality while maintaining decentralized control over the supply.

## GHO Token

The GHO Token contract includes specific roles for managing facilitators and their minting capacities:

- **`FACILITATOR_MANAGER_ROLE`**: This role is responsible for adding and removing facilitators.
- **`BUCKET_MANAGER_ROLE`**: This role is responsible for setting the `bucketCapacity` for existing facilitators.

Each facilitator is represented by a `Facilitator` struct, which contains:

- **`label`**: A string identifier for the facilitator.
- **`bucketCapacity`**: The maximum amount of GHO a facilitator can mint.
- **`bucketLevel`**: The current amount of GHO minted by the facilitator.

### transfer

The simplest method for transferring ERC-20 tokens is `transfer` which can be used to send tokens to any address without a prior token approval. The limitation of transfer is that it must be executed directly by the token holder, so it cannot be used within a smart contract function call to retrieve funds from a user (EOA).

### transferFrom

To transfer tokens within a smart contract function, `transferFrom` is the method that is used. The `transferFrom` function requires the sender to have approved the `spender` address for at least the transfer `amount`. There are two methods which can be used to perform the approval:

### approve

The standard ERC-20 `approve` requires an on-chain transaction from the token holder to a approve a specified `spender` and `amount`.

### permit

EIP-2612 `permit` is a type of token approval which requires two components:

- A signed approval message from the token holder which encodes: owner, spender, amount, nonce, deadline, DOMAIN_SEPARATOR
- An on-chain `permit` transaction which can be executed from any address

The advantages to using `permit` in place of `approve` are that the gas cost of the transaction can be paid for by an address other than the token owner, and can reduce the number of transactions by batching the `permit` call with another action, an example of this is [supplyWithPermit](https://github.com/aave-dao/aave-v3-origin/blob/ec33f4fcc5546710c0faca5208af1775c761ac9c/src/contracts/protocol/pool/Pool.sol#L154) from Aave Protocol v3.

## Facilitators

Facilitators are contract addresses approved by Aave Governance with the `FACILITATOR_MANAGER_ROLE` and `BUCKET_MANAGER_ROLE`, giving them the ability to mint and burn GHO tokens. Each facilitator operates under a specific `bucketCapacity`, controlling the maximum amount of GHO they can generate. Facilitators play a crucial role in maintaining GHO's stability and integrating it across various platforms and use cases.

### GHO Token Functions for Facilitators

Facilitators interact with the GHO token using the following functions:

- **`mint(address account, uint256 amount)`**: Allows a facilitator to mint `amount` of GHO tokens to the `account`. The `amount` must be greater than 0, and the new `bucketLevel` (current `bucketLevel` + `amount`) must not exceed the facilitator's `bucketCapacity`. This function updates the facilitator's `bucketLevel`.
- **`burn(uint256 amount)`**: Allows a facilitator to burn `amount` of GHO tokens from their own balance. The `amount` must be greater than 0, and the facilitator's `bucketLevel` is decreased by the burned `amount`.

### Facilitator Management Functions

The GHO token contract also provides functions for managing facilitators:

- **`addFacilitator(address facilitatorAddress, string calldata facilitatorLabel, uint128 bucketCapacity)`**: Callable by an address with the `FACILITATOR_MANAGER_ROLE`, this function adds a new facilitator with a specified `label` and `bucketCapacity`. A facilitator cannot be added if it already exists or if the label is empty.
- **`removeFacilitator(address facilitatorAddress)`**: Callable by an address with the `FACILITATOR_MANAGER_ROLE`, this function removes an existing facilitator. A facilitator can only be removed if its `bucketLevel` is 0.
- **`setFacilitatorBucketCapacity(address facilitator, uint128 newCapacity)`**: Callable by an address with the `BUCKET_MANAGER_ROLE`, this function updates the `bucketCapacity` of an existing facilitator.

### Facilitator Query Functions

Information about facilitators can be retrieved using:

- **`getFacilitatorsList()`**: Returns a list of all registered facilitator addresses.
- **`getFacilitator(address facilitator)`**: Returns the `Facilitator` struct details (label, bucketCapacity, bucketLevel) for a given `facilitator` address.
- **`getFacilitatorBucket(address facilitator)`**: Returns the `bucketCapacity` and `bucketLevel` of a specific facilitator.

### Aave v3 Ethereum Market

The Aave v3 Ethereum Market serves as a primary facilitator for GHO. Users can mint GHO by supplying approved collateral assets into the Aave Protocol and borrowing GHO against them. This process follows standard over-collateralisation practices, ensuring the protocol's security and the stablecoin's reliability.

Interacting with GHO via the Aave Pool Facilitator is very similar to interacting with a typical Aave reserve asset with two key differences:

- GHO is minted, not supplied, therefore interest rate and available liquidity calculations are based on custom interest rate strategy and facilitator caps respectively

Below are the technical guides for all GHO actions along with their contract references.

#### Minting

Minting occurs through the `borrow` function of the Aave v3 Ethereum market. To mint GHO, the process is nearly identical to borrowing any other reserve. To mint, an address must have sufficient collateral which is performed by approving and then calling `supply` on the Aave Pool with an eligible collateral asset. Once an address has sufficient collateral, it is able to borrow up to a maximum collateral factor determined by its collateral asset composition.

Since GHO is created and not borrowed from suppliers, GHO is not subject to restrictions on available liquidity, and instead, the Facilitator cap and collateralization requirements define the limits to which GHO can be minted as calculated below.

`availableFacilitatorCap = ghoReserveData.aaveFacilitatorButcketMaxCapacity - ghoReserveData.aaveFacilitatorBucketLevel`

See [core functions](./smart-contracts/pool) for more information on integrating Aave `borrow` functionality.

#### Repay

GHO is repaid just like any other asset, by approving the Pool contract to spend GHO tokens (by approval transaction or signed permit and repayWithPermit).

See [core functions](./smart-contracts/pool) for more information on integrating Aave `repay` functionality.

### Liquidation

When an address has a GHO borrow position, they are eligible to be liquidated under the same conditions as any other collateralized address. If the health factor of a GHO borrow falls below one, which occurs when the sum of borrow value exceeds the weighted average of liquidation thresholds of collateral assets, then any address is eligible to make a liquidationCall on the Pool contract.

The liquidationCall repays up to 100% of the GHO borrow position in exchange for an equivalent USD valuation of the collateral plus a liquidation bonus.

### Flash Mint

Since GHO is not borrowed like a typical Aave reserve, a separate Facilitator is used in place to replicate the flashloan functionality of the Aave Pool.

The FlashMinter Facilitator has a separate minting cap from the Aave Pool. Since all FlashMint transactions are returned in a single transaction, no GHO is ever minted against this Facilitator and the cap is applied to each transaction.

FlashMint is useful for a variety of applications such as liquidations, debt switches, and peg arbitrage. The `GhoFlashMinter` smart contract implements the following functions:

```solidity
function maxFlashLoan(address token) external view override returns (uint256)
```

```solidity
function getFee() external view override returns (uint256)
```

```solidity
function flashLoan(
    IERC3156FlashBorrower receiver,
    address token,
    uint256 amount,
    bytes calldata data
) external override returns (bool)
```

See the developers [flash loan guide](../aave-v3/guides/flash-loans) for more information on developing flash loan integrations.

### Stability Module

A Peg Stability Module (PSM) is a contract that enables the conversion of two tokens at a predetermined ratio. The GHO Stability Module (GSM) leverages the benefits of existing PSM models while innovating upon them in several ways to help further maintain GHO’s peg. The GSM is designed to facilitate conversions between GHO and governance-approved tokens, underpinned by a suite of features designed for flexible operations and risk management.

#### GSMRegistry

The GSMRegistry is a smart contract that stores a list of all GSM instances. This contract is owned by the Aave Governance Short Executor.

#### GSM

Each token pairing in the stability module has a GSM or GSM4626 contract instance that acts as the GHO facilitator and entry-point for buy and sell functionality.

The GSM4626 contract is a special instance of the GSM that supports ERC-4626 tokenized vault shares as the exogenous token.

The parameters and periphery contracts that dictate module operations are detailed below:

#### Price Strategy

The GSM introduces a flexible Price Strategy framework, enabling the module to adapt its pricing mechanism based on market conditions or strategic objectives. This system supports both fixed and dynamic pricing strategies, allowing for adjustments in response to real-time market data or predetermined conditions. The initial implementation focuses on a fixed 1:1 pricing strategy for simplicity and stability, with provisions for future adaptation to dynamic strategies as dictated by DAO governance.

#### Fee Strategy

Each GSM instance has a FeeStrategy contract that determines a percentage fee for buy and sell conversions that is allocated to the Aave DAO treasury.

#### Exposure Cap

The exposure cap is a parameter determined by Aave DAO Governance that sets the maximum amount of an exogenous token the stability module can hold.

#### Conversion Freezes and Oracle Price Bounds

In case the price of the exogenous token deviates from a determined ratio, the freeze role can be utilized by the Aave DAO or assigned to an entity (autonomous agents or contracts) to respond and halt conversions.

An implementation of the freeze role is the OracleSwapFreezer contract. This contract utilizes Chainlink oracles and price bounds determined by Aave Governence to freeze/unfreeze based on oracle conditions.

#### Last Resort Liquidations

In case of a rapid increase in risk in an exogenous token, the GSM features Last Resort Liquidations to liquidate the exogenous token. This contract role allows in the worst-case scenarios for the DAO to pause GSM functionality and liquidate the underlying balance of exogenous tokens.

### Cross-Chain

All GHO tokens are originated on Ethereum mainnet. GHO is made available to access on other networks using an infrastructure of cross-chain messaging.

The Chainlink CCIP protocol has been approved by Aave Governance as the messaging bridge to facilitate the transfer of GHO between networks.

GHO is transferred by between networks by initiating a lock (Ethereum mainnet) or burn (other networks) action on the source network, and a release (Ethereum mainnet) or mint (other networks) action occurs on the destination chain after the cross-chain message has been validated.

The `GHOCCIPTokenPoolEthereum` contract facilitates the locking and burning of GHO on Ethereum and other chains, enabling GHO's presence across multiple DeFi ecosystems.

**GHO Token Deployments**:

- [Ethereum Mainnet](https://etherscan.io/address/0x40D16FC0246aD3160Ccc09B8D0D3A2cD28aE6C2f)
- [Arbitrum](https://arbiscan.io/address/0x7dfF72693f6A4149b17e7C6314655f6A9F7c8B33)
- [Base](https://basescan.org/address/0x6Bb7a212910682DCFdbd5BCBb3e28FB4E8da10Ee)
- [Avalanche](https://snowtrace.io/address/0xfc421aD3C883Bf9E7C4f42dE845C4e4405799e73)
- [Gnosis](https://gnosisscan.io/address/0xfc421aD3C883Bf9E7C4f42dE845C4e4405799e73)
- [Mantle](https://mantlescan.xyz/address/0xfc421aD3C883Bf9E7C4f42dE845C4e4405799e73)
- [Monad](https://monadscan.com/address/0xfc421aD3C883Bf9E7C4f42dE845C4e4405799e73)
- [Plasma](https://plasmascan.to/address/0xb77E872A68C62CfC0dFb02C067Ecc3DA23B4bbf3)
- [XLayer](https://www.oklink.com/xlayer/address/0xDe6539018B095353A40753Dc54C91C68c9487D4E)

**GHO CCIP Subgraph**:

- [CCIP Ethereum Subgraph](https://thegraph.com/explorer/subgraphs/E11p8T4Ff1DHZbwSUC527hkUb5innVMdTuP6A2s1xtm1?view=Query&chain=arbitrum-one)
- [CCIP Arbitrum Subgraph](https://thegraph.com/explorer/subgraphs/GPpZfiGoDChLsiWoMG5fxXdRNEYrsVDrKJ39moGcbz6i?view=Query&chain=arbitrum-one)
- [CCIP Base Subgraph](https://thegraph.com/explorer/subgraphs/7WRSEgg43s2CqpymK2wkHrhQjn4v5fEnufonwRkkokbM?view=Query&chain=arbitrum-one)
- [CCIP Avalanche Subgraph](https://thegraph.com/explorer/subgraphs/7WRSEgg43s2CqpymK2wkHrhQjn4v5fEnufonwRkkokbM?view=Query&chain=arbitrum-one)
- [CCIP Gnosis Subgraph](https://thegraph.com/explorer/subgraphs/CFjU1G9iUtFDqEBTzSePRiPjghjUzQeFX5C67DGSK2Ao?view=Query&chain=arbitrum-one)

## GHO Liquidity Committee

The GHO Liquidity Committee (GLC) was created in October 2023 to focus solely on the liquidity of the GHO stablecoin. The committee was formed through a [governance proposal](https://governance-v2.aave.com/governance/proposal/343/) and consisted of a small team. After a successful initial 3-month period, it was [integrated](https://governance-v2.aave.com/governance/proposal/407/) into the Aave Liquidity Committee (ALC).

The ALC's main responsibilities regarding GHO include:

- Providing analytics and modelling of the liquidity strategy
- Liaising with teams that support the protocols hosting GHO liquidity
- Leading and coordinating the committee's weekly activities
- Providing critical feedback and helping refine the strategy
- Verifying and signing transactions

The ALC's performance measures and liquidity targets for GHO can be found on the [GHO Analytics platform](https://aave.tokenlogic.xyz/liquidity-committee) provided by TokenLogic.

More information regarding the role of the GHO Liquidity Committee can be found in [Aave's Governance forum](https://governance.aave.com/t/temp-check-treasury-management-create-and-fund-gho-liquidity-committee/14800).

## GHO Stewards

GHO Stewards is an additional entity created in April 2024 to more flexibly manage GHO market parameters, enabling GHO to be scaled per prevailing market conditions. The source code for GHO Steward contracts can be found on [GitHub](https://github.com/aave/gho-core/tree/main/src/contracts/misc).

The GHO Stewards determine if and how much to adjust the following, subject to pre-defined and Governance accepted thresholds:

- GHO Borrow Cap
- GHO Borrow Rate
- GSM Exposure Cap
- GSM Bucket Capacity
- GSM Price Strategy
- GSM Fee Strategy
- GSM Price Range (Freeze, Unfreeze)

With many liquidity pools being created and rewards distributed across them, it is important that the DAO can swiftly increase the GHO Borrow Cap to mitigate GHO trading above $1. The GHO Stewards can swiftly increase the GHO Borrow Cap to mitigate GHO trading above the peg. The GHO Stewards can increase the GHO Borrow Cap to a threshold of 50M units to a total borrow cap of 100M.

The Borrow Rate must be adjusted gradually to enable the ecosystem to expand safely. If the trailing 30-day average price of GHO stays outside a $0.995 - $1.005 price range, the GHO Stewards are able to adjust the Borrow Rate no more than 500bps per 2-day period, up to a maximum 25% APR.

GHO Stewards consist of members from Growth (ACI), Risk (ChaosLabs), and Finance (TokenLogic + karpatkey) Service Providers and utilise a 3 of 4 multi-sig.

## Deployed Contracts

### Ethereum Mainnet

| Contract                  | Address                                                                                                               |
| :------------------------ | :-------------------------------------------------------------------------------------------------------------------- |
| GhoToken                  | [0x40D16FC0246aD3160Ccc09B8D0D3A2cD28aE6C2f](https://etherscan.io/address/0x40D16FC0246aD3160Ccc09B8D0D3A2cD28aE6C2f) |
| GhoCCIPTokenPoolEthereum  | [0x06179f7C1be40863405f374E7f5F8806c728660A](https://etherscan.io/address/0x06179f7C1be40863405f374E7f5F8806c728660A) |
| GhoFlashMinter            | [0xb639D208Bcf0589D54FaC24E655C79EC529762B8](https://etherscan.io/address/0xb639D208Bcf0589D54FaC24E655C79EC529762B8) |
| GhoLiquidityComittee      | [0xA1c93D2687f7014Aaf588c764E3Ce80aF016229b](https://etherscan.io/address/0xA1c93D2687f7014Aaf588c764E3Ce80aF016229b) |
| GhoGsmSteward             | [0xD1E856a947CdF56b4f000ee29d34F5808E0A6848](https://etherscan.io/address/0xD1E856a947CdF56b4f000ee29d34F5808E0A6848) |
| GSMRegistry               | [0x167527DB01325408696326e3580cd8e55D99Dc1A](https://etherscan.io/address/0x167527DB01325408696326e3580cd8e55D99Dc1A) |
| GSMUSDC                   | [0x3A3868898305f04beC7FEa77BecFf04C13444112](https://etherscan.io/address/0x3A3868898305f04beC7FEa77BecFf04C13444112) |
| GSMUSDT                   | [0x882285E62656b9623AF136Ce3078c6BdCc33F5E3](https://etherscan.io/address/0x882285E62656b9623AF136Ce3078c6BdCc33F5E3) |
| GSMUSDCFixedFeeStrategy   | [0xE5025A7c15a44283A0616567181587eE6A646D64](https://etherscan.io/address/0xE5025A7c15a44283A0616567181587eE6A646D64) |
| GSMUSDTFixedFeeStrategy   | [0xA4346AEa575fCf5777D32F419E5850E5c68B2329](https://etherscan.io/address/0xA4346AEa575fCf5777D32F419E5850E5c68B2329) |
| GSMUSDCFixedPriceStrategy | [0x00e89F4022FD13AD56e321D50612Eec598eF3b72](https://etherscan.io/address/0x00e89F4022FD13AD56e321D50612Eec598eF3b72) |
| GSMUSDTFixedPriceStrategy | [0x20Be7090711995336A13e24B9EA9e05ac2cdd8C0](https://etherscan.io/address/0x20Be7090711995336A13e24B9EA9e05ac2cdd8C0) |
| GSMUSDCOracleSwapFreezer  | [0x6e51936e0ED4256f9dA4794B536B619c88Ff0047](https://etherscan.io/address/0x6e51936e0ED4256f9dA4794B536B619c88Ff0047) |
| GSMUSDTOracleSwapFreezer  | [0x733AB16005c39d07FD3D9d1A350AA6768D10125b](https://etherscan.io/address/0x733AB16005c39d07FD3D9d1A350AA6768D10125b) |
| GHO_AAVE_CORE_STEWARD     | [0x98217A06721Ebf727f2C8d9aD7718ec28b7aAe34](https://etherscan.io/address/0x98217A06721Ebf727f2C8d9aD7718ec28b7aAe34) |
| GHO_BUCKET_STEWARD        | [0x46Aa1063e5265b43663E81329333B47c517A5409](https://etherscan.io/address/0x46Aa1063e5265b43663E81329333B47c517A5409) |
| GHO_CCIP_STEWARD          | [0xC5BcC58BE6172769ca1a78B8A45752E3C5059c39](https://etherscan.io/address/0xC5BcC58BE6172769ca1a78B8A45752E3C5059c39) |
| RISK_COUNCIL              | [0x8513e6F37dBc52De87b166980Fa3F50639694B60](https://etherscan.io/address/0x8513e6F37dBc52De87b166980Fa3F50639694B60) |

### Arbitrum

| Contract           | Address                                                                                                              |
| :----------------- | :------------------------------------------------------------------------------------------------------------------- |
| GHOToken           | [0x7dfF72693f6A4149b17e7C6314655f6A9F7c8B33](https://arbiscan.io/address/0x7dfF72693f6A4149b17e7C6314655f6A9F7c8B33) |
| GHOCCIPTokenPool   | [0xB94Ab28c6869466a46a42abA834ca2B3cECCA5eB](https://arbiscan.io/address/0xB94Ab28c6869466a46a42abA834ca2B3cECCA5eB) |
| GHOCCIPBridge      | [0x812fBcd390A3C6c01C65B767413Dea6f6e24FDD0](https://arbiscan.io/address/0x812fBcd390A3C6c01C65B767413Dea6f6e24FDD0) |
| GHOAaveCoreSteward | [0xd2D586f849620ef042FE3aF52eAa10e9b78bf7De](https://arbiscan.io/address/0xd2D586f849620ef042FE3aF52eAa10e9b78bf7De) |
| GHOBucketSteward   | [0xa9afaE6A53E90f9E4CE0717162DF5Bc3d9aBe7B2](https://arbiscan.io/address/0xa9afaE6A53E90f9E4CE0717162DF5Bc3d9aBe7B2) |
| GHOCCIPSteward     | [0xCd5ab470AaC5c13e1063ee700503f3346b7C90Db](https://arbiscan.io/address/0xCd5ab470AaC5c13e1063ee700503f3346b7C90Db) |
| GHOGsmSteward      | [0x4DFfA29C526b5CFB419e14E3111516Fbf929797D](https://arbiscan.io/address/0x4DFfA29C526b5CFB419e14E3111516Fbf929797D) |
| GHOReserve         | [0xC912D64F9F649897dC0244da3835869d410d053e](https://arbiscan.io/address/0xC912D64F9F649897dC0244da3835869d410d053e) |
| GSMUSDC            | [0x53E0cE250d06043414070100458546AaF4e284eD](https://arbiscan.io/address/0x53E0cE250d06043414070100458546AaF4e284eD) |
| GSMUSDCFeeStrategy | [0x2169Bf2084bDb881587b3Cf6B24011E6AA091FdE](https://arbiscan.io/address/0x2169Bf2084bDb881587b3Cf6B24011E6AA091FdE) |
| GSMUSDCOracleSwapFreezer | [0xC5aF63c233eA19cB191b36D16C1e25cDA08409E7](https://arbiscan.io/address/0xC5aF63c233eA19cB191b36D16C1e25cDA08409E7) |
| RiskCouncil        | [0x8513e6F37dBc52De87b166980Fa3F50639694B60](https://arbiscan.io/address/0x8513e6F37dBc52De87b166980Fa3F50639694B60) |

### Base

| Contract           | Address                                                                                                               |
| :----------------- | :-------------------------------------------------------------------------------------------------------------------- |
| GHOToken           | [0x6Bb7a212910682DCFdbd5BCBb3e28FB4E8da10Ee](https://basescan.org/address/0x6Bb7a212910682DCFdbd5BCBb3e28FB4E8da10Ee) |
| GHOCCIPTokenPool   | [0x98217A06721Ebf727f2C8d9aD7718ec28b7aAe34](https://basescan.org/address/0x98217A06721Ebf727f2C8d9aD7718ec28b7aAe34) |
| GHOAaveCoreSteward | [0xC5BcC58BE6172769ca1a78B8A45752E3C5059c39](https://basescan.org/address/0xC5BcC58BE6172769ca1a78B8A45752E3C5059c39) |
| GHOBucketSteward   | [0x3c47237479e7569653eF9beC4a7Cd2ee3F78b396](https://basescan.org/address/0x3c47237479e7569653eF9beC4a7Cd2ee3F78b396) |
| GHOCCIPSteward     | [0xB94Ab28c6869466a46a42abA834ca2B3cECCA5eB](https://basescan.org/address/0xB94Ab28c6869466a46a42abA834ca2B3cECCA5eB) |

### Mantle

| Contract           | Address                                                                                                                 |
| :----------------- | :---------------------------------------------------------------------------------------------------------------------- |
| GHOToken           | [0xfc421aD3C883Bf9E7C4f42dE845C4e4405799e73](https://mantlescan.xyz/address/0xfc421aD3C883Bf9E7C4f42dE845C4e4405799e73) |
| GHOCCIPTokenPool   | [0xDe6539018B095353A40753Dc54C91C68c9487D4E](https://mantlescan.xyz/address/0xDe6539018B095353A40753Dc54C91C68c9487D4E) |
| GHOAaveCoreSteward | [0xA5Ba213867E175A182a5dd6A9193C6158738105A](https://mantlescan.xyz/address/0xA5Ba213867E175A182a5dd6A9193C6158738105A) |
| GHOBucketSteward   | [0x2Ce400703dAcc37b7edFA99D228b8E70a4d3831B](https://mantlescan.xyz/address/0x2Ce400703dAcc37b7edFA99D228b8E70a4d3831B) |
| GHOCCIPSteward     | [0x20fd5f3FCac8883a3A0A2bBcD658A2d2c6EFa6B6](https://mantlescan.xyz/address/0x20fd5f3FCac8883a3A0A2bBcD658A2d2c6EFa6B6) |

### Avalanche

| Contract           | Address                                                                                                                |
| :----------------- | :------------------------------------------------------------------------------------------------------------------- |
| GHOToken           | [0xfc421aD3C883Bf9E7C4f42dE845C4e4405799e73](https://snowscan.xyz/address/0xfc421aD3C883Bf9E7C4f42dE845C4e4405799e73) |
| GHOCCIPTokenPool   | [0xDe6539018B095353A40753Dc54C91C68c9487D4E](https://snowscan.xyz/address/0xDe6539018B095353A40753Dc54C91C68c9487D4E) |
| GHOAaveCoreSteward | [0xA5Ba213867E175A182a5dd6A9193C6158738105A](https://snowscan.xyz/address/0xA5Ba213867E175A182a5dd6A9193C6158738105A) |
| GHOBucketSteward   | [0x2Ce400703dAcc37b7edFA99D228b8E70a4d3831B](https://snowscan.xyz/address/0x2Ce400703dAcc37b7edFA99D228b8E70a4d3831B) |
| GHOCCIPSteward     | [0x20fd5f3FCac8883a3A0A2bBcD658A2d2c6EFa6B6](https://snowscan.xyz/address/0x20fd5f3FCac8883a3A0A2bBcD658A2d2c6EFa6B6) |
| RiskCouncil        | [0x8513e6F37dBc52De87b166980Fa3F50639694B60](https://snowscan.xyz/address/0x8513e6F37dBc52De87b166980Fa3F50639694B60) |

### Gnosis

| Contract           | Address                                                                                                                    |
| :----------------- | :-------------------------------------------------------------------------------------------------------------------- |
| GHOToken           | [0xfc421aD3C883Bf9E7C4f42dE845C4e4405799e73](https://gnosisscan.io/address/0xfc421aD3C883Bf9E7C4f42dE845C4e4405799e73) |
| GHOCCIPTokenPool   | [0xDe6539018B095353A40753Dc54C91C68c9487D4E](https://gnosisscan.io/address/0xDe6539018B095353A40753Dc54C91C68c9487D4E) |
| GHOOracle          | [0x360d8aa8F6b09B7BC57aF34db2Eb84dD87bf4d12](https://gnosisscan.io/address/0x360d8aa8F6b09B7BC57aF34db2Eb84dD87bf4d12) |
| GHOAaveCoreSteward | [0x6e637e1E48025E51315d50ab96d5b3be1971A715](https://gnosisscan.io/address/0x6e637e1E48025E51315d50ab96d5b3be1971A715) |
| GHOBucketSteward   | [0x6Bb7a212910682DCFdbd5BCBb3e28FB4E8da10Ee](https://gnosisscan.io/address/0x6Bb7a212910682DCFdbd5BCBb3e28FB4E8da10Ee) |
| GHOCCIPSteward     | [0x06179f7C1be40863405f374E7f5F8806c728660A](https://gnosisscan.io/address/0x06179f7C1be40863405f374E7f5F8806c728660A) |
| RiskCouncil        | [0x8513e6F37dBc52De87b166980Fa3F50639694B60](https://gnosisscan.io/address/0x8513e6F37dBc52De87b166980Fa3F50639694B60) |

### Monad

| Contract           | Address                                                                                                                |
| :----------------- | :---------------------------------------------------------------------------------------------------------------- |
| GHOToken           | [0xfc421aD3C883Bf9E7C4f42dE845C4e4405799e73](https://monadscan.com/address/0xfc421aD3C883Bf9E7C4f42dE845C4e4405799e73) |
| GHOCCIPTokenPool   | [0xA5AE05b71c3F170E12E7620Fdf7679721aec1EC8](https://monadscan.com/address/0xA5AE05b71c3F170E12E7620Fdf7679721aec1EC8) |
| GHOAaveCoreSteward | [0xA5Ba213867E175A182a5dd6A9193C6158738105A](https://monadscan.com/address/0xA5Ba213867E175A182a5dd6A9193C6158738105A) |
| GHOBucketSteward   | [0xDe6539018B095353A40753Dc54C91C68c9487D4E](https://monadscan.com/address/0xDe6539018B095353A40753Dc54C91C68c9487D4E) |
| GHOCCIPSteward     | [0x360d8aa8F6b09B7BC57aF34db2Eb84dD87bf4d12](https://monadscan.com/address/0x360d8aa8F6b09B7BC57aF34db2Eb84dD87bf4d12) |
| RiskCouncil        | [0x8513e6F37dBc52De87b166980Fa3F50639694B60](https://monadscan.com/address/0x8513e6F37dBc52De87b166980Fa3F50639694B60) |

### Plasma

| Contract                | Address                                                                                                                |
| :----------------------- | :--------------------------------------------------------------------------------------------------------------- |
| GHOToken                 | [0xb77E872A68C62CfC0dFb02C067Ecc3DA23B4bbf3](https://plasmascan.to/address/0xb77E872A68C62CfC0dFb02C067Ecc3DA23B4bbf3) |
| GHOCCIPTokenPool         | [0x360d8aa8F6b09B7BC57aF34db2Eb84dD87bf4d12](https://plasmascan.to/address/0x360d8aa8F6b09B7BC57aF34db2Eb84dD87bf4d12) |
| GHOOracle                | [0xb0e1c7830aA781362f79225559Aa068E6bDaF1d1](https://plasmascan.to/address/0xb0e1c7830aA781362f79225559Aa068E6bDaF1d1) |
| GHOBucketSteward         | [0x2Ce400703dAcc37b7edFA99D228b8E70a4d3831B](https://plasmascan.to/address/0x2Ce400703dAcc37b7edFA99D228b8E70a4d3831B) |
| GHOCCIPSteward           | [0x20fd5f3FCac8883a3A0A2bBcD658A2d2c6EFa6B6](https://plasmascan.to/address/0x20fd5f3FCac8883a3A0A2bBcD658A2d2c6EFa6B6) |
| GHOGsmSteward            | [0x86992b2E2385E478dd2eeBfaE06369636e0a64E8](https://plasmascan.to/address/0x86992b2E2385E478dd2eeBfaE06369636e0a64E8) |
| GHOAaveCoreSteward       | [0xA5Ba213867E175A182a5dd6A9193C6158738105A](https://plasmascan.to/address/0xA5Ba213867E175A182a5dd6A9193C6158738105A) |
| GHOReserve               | [0x6aC541605b0317dE076C9FeC2842902c844dEa74](https://plasmascan.to/address/0x6aC541605b0317dE076C9FeC2842902c844dEa74) |
| GSMUSDT                  | [0xd06114F714beCD6f373e5cE94E07278eF46eBF37](https://plasmascan.to/address/0xd06114F714beCD6f373e5cE94E07278eF46eBF37) |
| GSMUSDTFeeStrategy       | [0xD70BE7e6111EA563226cb8e53B1F195Da4E566E2](https://plasmascan.to/address/0xD70BE7e6111EA563226cb8e53B1F195Da4E566E2) |
| GSMUSDTOracleSwapFreezer | [0xa9afaE6A53E90f9E4CE0717162DF5Bc3d9aBe7B2](https://plasmascan.to/address/0xa9afaE6A53E90f9E4CE0717162DF5Bc3d9aBe7B2) |
| RiskCouncil              | [0x8513e6F37dBc52De87b166980Fa3F50639694B60](https://plasmascan.to/address/0x8513e6F37dBc52De87b166980Fa3F50639694B60) |

### XLayer

| Contract           | Address                                                                                                                                |
| :----------------- | :-------------------------------------------------------------------------------------------------------------------------------- |
| GHOToken           | [0xDe6539018B095353A40753Dc54C91C68c9487D4E](https://www.oklink.com/xlayer/address/0xDe6539018B095353A40753Dc54C91C68c9487D4E) |
| GHOCCIPTokenPool   | [0xA5Ba213867E175A182a5dd6A9193C6158738105A](https://www.oklink.com/xlayer/address/0xA5Ba213867E175A182a5dd6A9193C6158738105A) |
| GHOBucketSteward   | [0x20fd5f3FCac8883a3A0A2bBcD658A2d2c6EFa6B6](https://www.oklink.com/xlayer/address/0x20fd5f3FCac8883a3A0A2bBcD658A2d2c6EFa6B6) |
| GHOAaveCoreSteward | [0x6e637e1E48025E51315d50ab96d5b3be1971A715](https://www.oklink.com/xlayer/address/0x6e637e1E48025E51315d50ab96d5b3be1971A715) |
| GHOCCIPSteward     | [0xFAdC082665577b533e62A7B0E067f884cA5C5E8F](https://www.oklink.com/xlayer/address/0xFAdC082665577b533e62A7B0E067f884cA5C5E8F) |
| RiskCouncil        | [0x8513e6F37dBc52De87b166980Fa3F50639694B60](https://www.oklink.com/xlayer/address/0x8513e6F37dBc52De87b166980Fa3F50639694B60) |

### Sepolia (Testnet)

| Contract                 | Address                                                                                                                       |
| :----------------------- | :---------------------------------------------------------------------------------------------------------------------------- |
| GhoToken                 | [0xc4bF5CbDaBE595361438F8c6a187bDc330539c60](https://sepolia.etherscan.io/address/0xc4bF5CbDaBE595361438F8c6a187bDc330539c60) |
| GhoATokenImpl            | [0xD4BDb51fB96996CA24a5C49E7b57f94a1850Fa30](https://sepolia.etherscan.io/address/0xD4BDb51fB96996CA24a5C49E7b57f94a1850Fa30) |
| GhoDiscountRateStrategy  | [0x19cdecE64EDE475ba0EB114ff4E319d64Ef8ECCf](https://sepolia.etherscan.io/address/0x19cdecE64EDE475ba0EB114ff4E319d64Ef8ECCf) |
| GhoInterestRateStrategy  | [0x521247B4d0a51E71DE580dA2cBF99EB40a44b3Bf](https://sepolia.etherscan.io/address/0x521247B4d0a51E71DE580dA2cBF99EB40a44b3Bf) |
| GhoOracle                | [0x00f7fecFAEbEd9499e1f3f9d04E755a21E5fc47C](https://sepolia.etherscan.io/address/0x00f7fecFAEbEd9499e1f3f9d04E755a21E5fc47C) |
| GhoStableDebtTokenImpl   | [0x2aa7819F2e88aF4cfF8FD0869ABdB97E336101Ee](https://sepolia.etherscan.io/address/0x2aa7819F2e88aF4cfF8FD0869ABdB97E336101Ee) |
| GhoVariableDebtTokenImpl | [0xd4FEA5bD40cE7d0f7b269678541fF0a95FCb4b68](https://sepolia.etherscan.io/address/0xd4FEA5bD40cE7d0f7b269678541fF0a95FCb4b68) |
| GhoFlashMinter           | [0xB5d0ef1548D9C70d3E7a96cA67A2d7EbC5b1173E](https://sepolia.etherscan.io/address/0xB5d0ef1548D9C70d3E7a96cA67A2d7EbC5b1173E) |
| UiGhoDataProvider        | [0x69B9843A16a6E9933125EBD97659BA3CCbE2Ef8A](https://sepolia.etherscan.io/address/0x69B9843A16a6E9933125EBD97659BA3CCbE2Ef8A) |

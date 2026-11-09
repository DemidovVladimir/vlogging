> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Curators

> Create and manage lending vaults and markets on Kamino

## Overview

Kamino Curators create and manage lending infrastructure on Solana. Curators can deploy **lending vaults** that route depositor capital across reserves, or create **lending markets** that enable peer-to-pool borrowing and lending for specific asset ecosystems.

**Vaults** accept a single deposit token, distribute capital across reserves according to your allocation weights and caps, and issue share tokens to depositors. You control allocation strategy, fee structure, risk parameters, and rewards distribution — all managed through [kamino.com/curators/vaults](https://kamino.com/curators/vaults).

**Markets** are isolated lending environments with their own reserves, risk parameters, and oracle configurations. Market curators configure reserve parameters (LTV, liquidation thresholds, interest rate curves), manage oracle feeds, and set market-wide settings via the Kamino CLI.

## What You Can Do

### Vaults

> **[Create vaults](https://kamino.com/docs/curators/vaults/guides/create-a-vault.md)**
>
> Deploy vaults with custom fee structures, deposit parameters, and security settings.

> **[Configure allocations](https://kamino.com/docs/curators/vaults/guides/configure-allocations.md)**
>
> Distribute capital across lending reserves using relative weights, caps, and Conditional allocation logic.

> **[Configure farms](https://kamino.com/docs/curators/vaults/guides/configure-farms.md)**
>
> Attach the Vault Farm, Insurance Pool farm, and Autocompound Farm for reward distribution.

> **[Set up the Insurance Pool](https://kamino.com/docs/curators/vaults/guides/set-up-insurance-pool.md)**
>
> Configure the loss backstop and trigger the Kamino match.

### Markets

> **[Create Markets](https://kamino.com/docs/curators/markets/creating-a-market.md)**
>
> Deploy isolated lending markets with custom risk parameters and reserve configurations.

> **[Manage Reserves](https://kamino.com/docs/curators/markets/reserve-management.md)**
>
> Add reserves, configure LTV ratios, liquidation thresholds, and interest rate curves.

> **[Configure Market Rewards](https://kamino.com/docs/curators/markets/farms-and-rewards.md)**
>
> Set up collateral and debt farms to distribute rewards to depositors and borrowers.

> **[Market Settings](https://kamino.com/docs/curators/markets/market-settings.md)**
>
> Manage market-wide parameters, oracle configurations, and ownership via CLI.

## Getting Started

### For Vaults

**1. Create a Vault**

Configure your vault's deposit token, receipt token, fees, and advanced parameters on [kamino.com/curators/vaults](https://kamino.com/curators/vaults). See [Create a vault](https://kamino.com/docs/curators/vaults/guides/create-a-vault.md).

**2. Complete post-creation setup**

Configure allocations, set up the Insurance Pool, enable Whitelisted Reserves, attach farms, and transfer admin to a multisig. See the [Vaults overview](https://kamino.com/docs/curators/vaults.md) for the full guide list.

**3. Manage Ongoing Operations**

Adjust allocations, update fees, manage rewards, and sync vault state as needed.

### For Markets

**1. Create a Market**

Deploy a new lending market using the Kamino CLI. See [Creating a Market](https://kamino.com/docs/curators/markets/creating-a-market.md).

**2. Add Reserves**

Configure and add token reserves with LTV ratios, rate curves, and oracle feeds. See [Adding Reserves](https://kamino.com/docs/curators/markets/adding-reserves.md).

**3. Transfer to Multisig**

Transfer market ownership to a Squads multisig before going live. All subsequent operations use multisig mode.

## Reference

> **[Vault Parameters](https://kamino.com/docs/curators/reference/parameters.md)**
>
> Complete reference for all vault, allocation, and farm parameters.

> **[Vault Glossary](https://kamino.com/docs/curators/reference/glossary.md)**
>
> Definitions for key vault terms.

> **[Reserve Parameters](https://kamino.com/docs/curators/markets/reserve-parameters.md)**
>
> Complete reference for all reserve configuration parameters.

> **[Market Glossary](https://kamino.com/docs/curators/markets/glossary.md)**
>
> Definitions for key market and lending terms.

> [!NOTE]
>
> All vault operations are managed via [kamino.com/curators/vaults](https://kamino.com/curators/vaults) and executed through [Squads](https://squads.so) multisig. Market operations use the Kamino CLI with multisig mode after initial setup.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
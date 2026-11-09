> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Vaults

> B2B lending infrastructure on Kamino — deploy a vault, allocate capital across reserves, and manage exposure

A Kamino Vault is a programmable lending product. You deploy it for a single deposit token, route capital across Kamino lending reserves, and issue share tokens to depositors. As the curator, you control allocation strategy, fees, risk parameters, and rewards — all on-chain, transparent, and depositor-facing.

This section is the operational reference for curators running vaults. If you're new to the model, start with [Concepts](https://kamino.com/docs/curators/vaults/concepts/how-vaults-work.md). If you have a workflow in mind, jump to [Guides](#guides).

## Start here

> **[How vaults work](https://kamino.com/docs/curators/vaults/concepts/how-vaults-work.md)**
>
> The vault primitive: share tokens, allocation, depositor flow, and the curator's role.

> **[Create a vault](https://kamino.com/docs/curators/vaults/guides/create-a-vault.md)**
>
> Deploy your first vault, configure fees, and complete post-creation setup.

## Concepts

Read once to understand the system.

> **[Allocations](https://kamino.com/docs/curators/vaults/concepts/allocations.md)**
>
> How capital is distributed across reserves — Standard vs. Conditional, weights, caps, and priority.

> **[Liquidity & withdrawals](https://kamino.com/docs/curators/vaults/concepts/liquidity-and-withdrawals.md)**
>
> Unallocated buffer, instant vs. queued exits, and the withdrawal queue primitive.

> **[Yield & fees](https://kamino.com/docs/curators/vaults/concepts/yield-and-fees.md)**
>
> APY model, performance and AUM fees, withdrawal penalty, crank fee, and farm rewards.

> **[Roles & ownership](https://kamino.com/docs/curators/vaults/concepts/roles-and-ownership.md)**
>
> Admin types, the multisig model, and how Squads-based execution works.

> **[Risk primitives](https://kamino.com/docs/curators/vaults/concepts/risk-primitives.md)**
>
> The Insurance Pool and Whitelisted Reserves — the two protections you offer depositors.

> **[Permissioned vaults](https://kamino.com/docs/curators/vaults/concepts/permissioned-vaults.md)**
>
> Gate vault deposits behind a per-user allowlist. KYC, accredited-investor, and counterparty-gated configurations.

> **[Fixed Rates](https://kamino.com/docs/curators/vaults/fixed-rates.md)**
>
> Allocating into fixed-rate reserves: the rate grid, term premium, and the curator's strategy surface.

## Guides

Task-oriented walkthroughs in the order you typically run them.

### Setup

> **[Create a vault](https://kamino.com/docs/curators/vaults/guides/create-a-vault.md)**
>
> Deploy the vault and set fees, mins, and penalties. Optionally enable Whitelisted Reserves at creation (UI/SDK).

> **[Transfer admin to multisig](https://kamino.com/docs/curators/vaults/guides/transfer-admin.md)**
>
> Move your vault to Squads multisig control before any subsequent state-changing operations.

> **[Configure allocations](https://kamino.com/docs/curators/vaults/guides/configure-allocations.md)**
>
> Add, edit, and remove reserve allocations.

> **[Configure fixed-rate allocations](https://kamino.com/docs/curators/vaults/guides/configure-fixed-rate-allocations.md)**
>
> The FR-specific allocation walkthrough — Standard, Conditional, priority. Skip if you have no FR exposure.

> **[Enable Whitelisted Reserves](https://kamino.com/docs/curators/vaults/guides/enable-whitelisted-reserves.md)**
>
> Restrict your vault to protocol-verified reserves. Required for UI listing.

> **[Set up the Insurance Pool](https://kamino.com/docs/curators/vaults/guides/set-up-insurance-pool.md)**
>
> Lock skin-in-the-game capital, trigger the Kamino match, configure emergency-withdrawal multisig.

> **[Enable permissioning](https://kamino.com/docs/curators/vaults/guides/enable-permissioning.md)**
>
> Switch the vault into permissioned mode and manage the depositor allowlist via kperm.

### Operate

> **[Collect fees](https://kamino.com/docs/curators/vaults/guides/collect-fees.md)**
>
> Withdraw pending fees, give up fees, and update fee rates.

### Reference / fallback

> **[Configure farms](https://kamino.com/docs/curators/vaults/guides/configure-farms.md)**
>
> Post-creation farm setup. Skip if your vault was created via SDK or UI — farms are typically created automatically there.

## Data & API

> **[Vault data](https://kamino.com/docs/curators/data/vault-data.md)**
>
> Query vault state, metrics, and historical performance.

> **[Allocation data](https://kamino.com/docs/curators/data/allocation-data.md)**
>
> Read current allocations and historical allocation changes.

> **[Depositor data](https://kamino.com/docs/curators/data/depositor-data.md)**
>
> Query depositor positions and shares.

> **[Rewards data](https://kamino.com/docs/curators/data/rewards-data.md)**
>
> Query farm reward programs and incentive data.

## Reference

> **[Parameters](https://kamino.com/docs/curators/reference/parameters.md)**
>
> Complete parameter reference for vaults, allocations, and farms.

> **[Glossary](https://kamino.com/docs/curators/reference/glossary.md)**
>
> One-line definitions for every term used in this section.

> [!NOTE]
>
> All vault operations are managed via [kamino.com/curators/vaults](https://kamino.com/curators/vaults) and executed through [Squads](https://squads.so) multisig once the vault is in production. Programmatic operations are available via the [TypeScript SDK](https://github.com/Kamino-Finance/klend-sdk) and the [Kamino CLI](https://kamino.com/docs/build/cli/installation-setup.md).


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# CLI Command Index

> Quick lookup of every market-related kamino-manager CLI command

A flat reference of every `kamino-manager` command that touches a market or its reserves. Each row links to the workflow page that uses it. For full flag detail on any command, see the [Market Operations CLI page](https://kamino.com/docs/build/cli/market-operations.md).

For installation and `.env` setup, see [CLI installation & setup](https://kamino.com/docs/build/cli/installation-setup.md).

## Market lifecycle

| Command | Purpose | Workflow page |
| - | - | - |
| `create-market` | Initialize a new `LendingMarket` account | [Create a market](https://kamino.com/docs/curators/markets/creating-a-market.md) |
| `update-lending-market-name` | Rename the market | [Market settings](https://kamino.com/docs/curators/markets/market-settings.md) |
| `update-lending-market-from-config` | Apply a full market config update from JSON | [Market settings](https://kamino.com/docs/curators/markets/market-settings.md) |
| `update-lending-market-owner` | Promote `lending_market_owner_cached` to active owner | [Transfer to multisig](https://kamino.com/docs/curators/markets/transfer-to-multisig.md) |
| `download-lending-market-config` | Export the current market config to JSON | [Market settings](https://kamino.com/docs/curators/markets/market-settings.md) |
| `download-lending-market-config-and-all-reserves-configs` | Export market + all reserves in one call | [Market settings](https://kamino.com/docs/curators/markets/market-settings.md) |
| `get-market-or-vault-admin-info` | Query admin metadata (owner, cached owner, council) | [Market settings](https://kamino.com/docs/curators/markets/market-settings.md) |

## Reserve lifecycle

| Command | Purpose | Workflow page |
| - | - | - |
| `add-asset-to-market` | Add a new reserve to the market with a config | [Add reserves](https://kamino.com/docs/curators/markets/adding-reserves.md) |
| `update-reserve-config` | Apply a full reserve config update from JSON | [Updating reserves](https://kamino.com/docs/curators/markets/reserve-management.md) |
| `update-reserve-config-debt-cap` | Focused update of just the borrow cap | [Updating reserves](https://kamino.com/docs/curators/markets/reserve-management.md) |
| `download-reserve-config` | Export the current reserve config to JSON | [Updating reserves](https://kamino.com/docs/curators/markets/reserve-management.md) |
| `simulate-reserve-apy` | Compute live supply and borrow APY for a reserve | [Read market data](https://kamino.com/docs/curators/markets/market-data.md) |

## Oracles

| Command | Purpose | Workflow page |
| - | - | - |
| `get-oracle-mappings` | List Scope oracle addresses for known mints | [Configure oracles](https://kamino.com/docs/curators/markets/configuring-oracles.md) |

## Farms

Farm initialization happens through the KFarms tooling and is bundled into `add-asset-to-market` for the initial setup. Read-side queries:

| Command | Purpose | Workflow page |
| - | - | - |
| `get-reserve-farms-apy` | Reward APY for a reserve's collateral and debt farms | [Farms & rewards](https://kamino.com/docs/curators/markets/farms-and-rewards.md) |

For farm initialization, funding, and emission configuration, use the KFarms CLI and SDK.

## Execution modes

Every command supports four `--mode` values:

| Mode | What it does |
| - | - |
| `inspect` | Prints a Solana Explorer URL where you can simulate the transaction |
| `simulate` | Runs simulation server-side and prints the result |
| `execute` | Signs with the admin keypair and lands the transaction |
| `multisig` | Outputs a base58-encoded transaction for submission to a Squads proposal |

Multisig mode requires `--multisig <SQUADS_PUBKEY>` to identify the multisig the proposal targets.

## Network selection

| Flag | Target |
| - | - |
| (none) | Mainnet (default) |
| `--staging` | Staging program on Solana mainnet |
| `--devnet` | Solana devnet |

## Vault commands

The kamino-manager CLI also exposes a large set of vault-related commands (e.g., `create-vault`, `update-vault-config`, `update-vault-reserve-allocation`, etc.). These are documented under [Create a vault](https://kamino.com/docs/curators/vaults/guides/create-a-vault.md) and the [Vault Operations CLI page](https://kamino.com/docs/build/cli/vault-operations.md).

## Reference

* [Market Operations CLI](https://kamino.com/docs/build/cli/market-operations.md) — full flag detail for every command
* [CLI installation & setup](https://kamino.com/docs/build/cli/installation-setup.md) — `.env`, keypair, RPC
* [Updating reserves](https://kamino.com/docs/curators/markets/reserve-management.md) — the standard workflow
* [Market settings](https://kamino.com/docs/curators/markets/market-settings.md) — market-level workflow


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
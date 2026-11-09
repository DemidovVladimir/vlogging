> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Market Operations

> kamino-manager CLI command reference for market and reserve operations

A flat reference of every `kamino-manager` command that touches a Kamino lending market or reserve. For workflow guidance — when to use each command, what to set, why — see the [Curator Markets](https://kamino.com/docs/curators/markets.md) tab.

> [!NOTE]
>
> Before running any command, complete the [Installation & Setup](https://kamino.com/docs/build/cli/installation-setup.md) guide. The CLI requires `ADMIN`, `RPC`, `KLEND_PROGRAM_ID_MAINNET`, and `KLEND_PROGRAM_ID_STAGING` in `.env`.

## Conventions

### Execution modes

Every command supports `--mode <value>`:

| Mode | What it does |
| - | - |
| `inspect` | Prints a Solana Explorer URL where you can simulate the transaction in your browser |
| `simulate` | Runs simulation server-side and prints the result |
| `execute` | Signs with the admin keypair and lands the transaction |
| `multisig` | Outputs a base58-encoded transaction for submission to a Squads proposal |

Multisig mode requires `--multisig <SQUADS_PUBKEY>` to identify the multisig.

### Network selection

| Flag | Target | Program ID env var |
| - | - | - |
| (none) | Mainnet | `KLEND_PROGRAM_ID_MAINNET` |
| `--staging` | Staging program on Solana mainnet | `KLEND_PROGRAM_ID_STAGING` |
| `--devnet` | Solana devnet | (Devnet program ID resolved from env) |

## Market lifecycle

### `create-market`

Initialize a new `LendingMarket` account.

```bash theme={null}
yarn kamino-manager create-market --mode execute
```

| Flag | Required | Description |
| - | - | - |
| `--mode` | Yes | `inspect` / `simulate` / `execute` / `multisig` |
| `--multisig` | If `--mode multisig` | Pubkey of the multisig that will own the market |
| `--staging` / `--devnet` | No | Network selection |

### `update-lending-market-from-config`

Apply a full market config update from a JSON file.

```bash theme={null}
yarn kamino-manager update-lending-market-from-config \
  --lending-market <MARKET_ADDRESS> \
  --lending-market-config-path ./configs/<MARKET>/market-<MARKET>.json \
  --mode execute
```

| Flag | Required | Description |
| - | - | - |
| `--lending-market` | Yes | Market address |
| `--lending-market-config-path` | Yes | Path to the JSON config file |
| `--mode` | Yes | Execution mode |

### `update-lending-market-name`

Focused command to rename a market.

```bash theme={null}
yarn kamino-manager update-lending-market-name \
  --lending-market <MARKET_ADDRESS> \
  --new-name "My Market" \
  --mode execute
```

| Flag | Required |
| - | - |
| `--lending-market` | Yes |
| `--new-name` | Yes |
| `--mode` | Yes |

### `update-lending-market-owner`

Promote `lending_market_owner_cached` to active owner. Final step of the two-step ownership transfer.

```bash theme={null}
yarn kamino-manager update-lending-market-owner \
  --lending-market <MARKET_ADDRESS> \
  --mode multisig \
  --multisig <NEW_OWNER_MULTISIG>
```

| Flag | Required |
| - | - |
| `--lending-market` | Yes |
| `--mode` | Yes |
| `--multisig` | If `--mode multisig` |

### `download-lending-market-config`

Export the current market config to a JSON file (read-only).

```bash theme={null}
yarn kamino-manager download-lending-market-config \
  --lending-market <MARKET_ADDRESS>
```

Saves to `./configs/<MARKET_ADDRESS>/market-<MARKET_ADDRESS>.json`.

### `download-lending-market-config-and-all-reserves-configs`

Download the market config plus every reserve's config in a single call.

```bash theme={null}
yarn kamino-manager download-lending-market-config-and-all-reserves-configs \
  --lending-market <MARKET_ADDRESS>
```

### `get-market-or-vault-admin-info`

Query admin metadata (owner, cached owner, emergency council).

```bash theme={null}
yarn kamino-manager get-market-or-vault-admin-info \
  --address <MARKET_ADDRESS>
```

## Reserve lifecycle

### `add-asset-to-market`

Add a new reserve to a market with an initial config.

```bash theme={null}
yarn kamino-manager add-asset-to-market \
  --market <MARKET_ADDRESS> \
  --mint <TOKEN_MINT> \
  --mint-program-id TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA \
  --reserve-config-path ./configs/my_reserve_config.json \
  --mode execute
```

| Flag | Required | Description |
| - | - | - |
| `--market` | Yes | Market address |
| `--mint` | Yes | Token mint address |
| `--mint-program-id` | Yes | `TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA` for SPL Token, `TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb` for Token-2022 |
| `--reserve-config-path` | Yes | Path to the reserve config JSON |
| `--mode` | Yes | Execution mode |

### `update-reserve-config`

Apply a full reserve config update from a JSON file.

```bash theme={null}
yarn kamino-manager update-reserve-config \
  --reserve <RESERVE_ADDRESS> \
  --reserve-config-path ./configs/<RESERVE>.json \
  --mode execute
```

| Flag | Required |
| - | - |
| `--reserve` | Yes |
| `--reserve-config-path` | Yes |
| `--mode` | Yes |

### `update-reserve-config-debt-cap`

Focused update of just the borrow cap. Faster to review than a full config update.

```bash theme={null}
yarn kamino-manager update-reserve-config-debt-cap \
  --reserve <RESERVE_ADDRESS> \
  --mode multisig \
  --multisig <SQUADS_PUBKEY>
```

| Flag | Required |
| - | - |
| `--reserve` | Yes |
| `--mode` | Yes |
| `--multisig` | If `--mode multisig` |

### `download-reserve-config`

Export the current reserve config to a JSON file.

```bash theme={null}
yarn kamino-manager download-reserve-config \
  --reserve <RESERVE_ADDRESS> \
  --output ./configs/<RESERVE_ADDRESS>.json
```

| Flag | Required |
| - | - |
| `--reserve` | Yes |
| `--output` | No (defaults to a path under `./configs/`) |

### `simulate-reserve-apy`

Compute the live supply and borrow APY for a reserve from on-chain state.

```bash theme={null}
yarn kamino-manager simulate-reserve-apy \
  --reserve <RESERVE_ADDRESS>
```

## Oracles

### `get-oracle-mappings`

List Scope, Pyth, and Switchboard oracle addresses for known mints.

```bash theme={null}
yarn kamino-manager get-oracle-mappings
```

Use the output to populate `tokenInfo.scopeConfiguration.priceFeed`, `tokenInfo.pythConfiguration.price`, or `tokenInfo.switchboardConfiguration.priceAggregator` in a reserve config.

## Farms

### `get-reserve-farms-apy`

Reward APY for a reserve's collateral and debt farms.

```bash theme={null}
yarn kamino-manager get-reserve-farms-apy \
  --reserve <RESERVE_ADDRESS>
```

For farm initialization, funding, and emission configuration, use the [KFarms tooling](https://github.com/Kamino-Finance/kfarms).

## Reserve config schema

The reserve config JSON schema is documented at [Reserve config reference](https://kamino.com/docs/curators/markets/reserve-parameters.md). A starter file ships with klend-sdk:

[ klend-sdk/configs/reserve\_config\_example.json](https://github.com/Kamino-Finance/klend-sdk/blob/master/configs/reserve_config_example.json)

Some fields in older example files (`assetTier`, `multiplierSideBoost`, `multiplierTagBoost`) are deprecated and ignored by the program. The canonical schema is in the reference page above.

## Market config schema

The market config JSON schema is documented at [Market config reference](https://kamino.com/docs/curators/markets/market-config-reference.md).

## Workflow guides

These pages walk through the curator workflow that uses the commands above:

> **[Create a market](https://kamino.com/docs/curators/markets/creating-a-market.md)**
>
> `create-market`

> **[Add reserves](https://kamino.com/docs/curators/markets/adding-reserves.md)**
>
> `add-asset-to-market`

> **[Configure oracles](https://kamino.com/docs/curators/markets/configuring-oracles.md)**
>
> `get-oracle-mappings`, `tokenInfo` setup

> **[Transfer to multisig](https://kamino.com/docs/curators/markets/transfer-to-multisig.md)**
>
> `update-lending-market-from-config`, `update-lending-market-owner`

> **[Updating reserves](https://kamino.com/docs/curators/markets/reserve-management.md)**
>
> `update-reserve-config`, `update-reserve-config-debt-cap`

> **[Market settings](https://kamino.com/docs/curators/markets/market-settings.md)**
>
> `update-lending-market-from-config`, `update-lending-market-name`

## Next

> **[Vault Operations](https://kamino.com/docs/build/cli/vault-operations.md)**
>
> Create and manage Kamino vaults

> **[Installation & Setup](https://kamino.com/docs/build/cli/installation-setup.md)**
>
> Review installation and configuration


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Vault Operations

> Create and manage Kamino vaults

Use the Kamino Manager CLI to create vaults, manage reserve allocations, and configure vault parameters.

> [!NOTE]
>
> Before starting, complete the [Installation & Setup](https://kamino.com/docs/build/cli/installation-setup.md) guide. Commands require a .env file with ADMIN (path to vault owner keypair) and RPC configured.

## Understanding CLI Modes

All Kamino Manager commands support different execution modes to test and verify operations before committing them:

* **inspect** - Preview the transaction without executing it
* **simulate** - Test the transaction simulation on-chain
* **execute** - Execute the transaction immediately
* **multisig** - Generate a multisig proposal for the operation

> [!NOTE]
>
> It's recommended to always start with `inspect` or `simulate` mode to verify transactions before running with `execute`.

## Network Selection

By default, all commands run against **mainnet** and no additional flag is needed. To target a different network, pass one of the following flags:

* `--staging` — Use the staging program ID
* `--devnet` — Use the devnet program ID

```bash theme={null}
# Mainnet (default, no flag needed)
yarn kamino-manager create-vault --mint <TOKEN_MINT> --mode execute

# Staging
yarn kamino-manager create-vault --mint <TOKEN_MINT> --mode execute --staging

# Devnet
yarn kamino-manager create-vault --mint <TOKEN_MINT> --mode execute --devnet
```

> [!NOTE]
>
> The corresponding program IDs (`KVAULT_PROGRAM_ID_MAINNET`, `KVAULT_PROGRAM_ID_STAGING`, `KVAULT_PROGRAM_ID_DEVNET`) must be configured in your `.env` file. See the [Installation & Setup](https://kamino.com/docs/build/cli/installation-setup.md) guide.

## Create a New Vault

Create a new Kamino vault to manage automated liquidity strategies.

**1. Create Vault**

Run the create vault command with the desired liquidity token mint.

```bash theme={null}
yarn kamino-manager create-vault --mint <TOKEN_MINT> --mode execute
```

> [!NOTE]
>
> For testing purposes, add the `--staging` flag to use the staging program ID or `--devnet` to use the devnet program ID. These flags are applicable to all CLI commands.

**2. Save Vault Address**

After creation, save the vault address from the command output. This address is required for all subsequent vault operations.

## Manage Reserve Allocations

Configure how vault assets are distributed across different lending reserves.

### Add or Update Reserve Allocation

Add a new reserve to the vault or update an existing reserve's allocation parameters.

```bash theme={null}
yarn kamino-manager update-vault-reserve-allocation \
  --vault <VAULT_ADDRESS> \
  --reserve <RESERVE_ADDRESS> \
  --allocation-weight <WEIGHT> \
  --allocation-cap <CAP> \
  --mode simulate
```

**Parameters:**

* `allocation-weight` - The allocation weight for this reserve; only relevant in relation to other reserve weights (proportional). If Reserve A has weight 100,000 and Reserve B has weight 50,000, Reserve A gets 2/3 of vault assets and Reserve B gets 1/3
* `allocation-cap` - The allocation cap in decimal (not lamports) for this reserve

**Example:** Adding PRIME market allocation

```bash theme={null}
yarn kamino-manager update-vault-reserve-allocation \
  --vault 67dqmR76uAbjX6e81A1ganKv3ou31WUMEdeWJkwVfeXy \
  --reserve 9GJ9GBRwCp4pHmWrQ43L5xpc9Vykg7jnfwcFGN8FoHYu \
  --allocation-weight 100000 \
  --allocation-cap 18446744073709.551615 \
  --mode simulate
```

> [!NOTE]
>
> First run with `--mode simulate` to verify the operation works as expected, then use `--mode execute` to send the transaction.

### Remove Reserve Allocation

Remove a reserve from the vault's allocation strategy.

```bash theme={null}
yarn kamino-manager remove-vault-allocation \
  --vault <VAULT_ADDRESS> \
  --reserve <RESERVE_ADDRESS> \
  --mode simulate
```

**Example:** Removing USDC reserve from fartcoin market

```bash theme={null}
yarn kamino-manager remove-vault-allocation \
  --vault 67dqmR76uAbjX6e81A1ganKv3ou31WUMEdeWJkwVfeXy \
  --reserve F22tnLsbv66vEU2GZRc7coaqZsr8UcBbyp9V2kqWAiWK \
  --mode simulate
```

## Vault Ownership Management

> [!NOTE]
>
> Transfer vault ownership to a different admin account. For production vaults, we recommend transferring ownership to a [Squads](https://squads.xyz/multisig) multisig with hardware wallet support.

**1. Set Pending Admin**

Update the vault's pending admin to the new owner address.

```bash theme={null}
yarn kamino-manager update-vault-pending-admin \
  --vault <VAULT_ADDRESS> \
  --new-admin <NEW_ADMIN_PUBKEY> \
  --mode execute
```

**Parameters:**

* `vault` - The vault address to change the pending admin for
* `new-admin` - The new admin pubkey to set as pending admin (typically a multisig address)

**2. Accept Ownership**

The new admin must accept ownership to complete the transfer.

```bash theme={null}
yarn kamino-manager accept-ownership \
  --vault <VAULT_ADDRESS> \
  --mode execute
```

> [!NOTE]
>
> This command must be run with the new admin's keypair in the ADMIN field of the .env file.

## Fee Management

Configure and manage vault performance and management fees.

### Performance Fees

Set the performance fee taken on generated yield.

```bash theme={null}
yarn kamino-manager update-vault-perf-fee \
  --vault <VAULT_ADDRESS> \
  --fee-bps <FEE_BPS> \
  --mode execute
```

The fee is specified in basis points (1 bps = 0.01%).

### Management Fees

Set the yearly management fee for vault operations.

```bash theme={null}
yarn kamino-manager update-vault-mgmt-fee \
  --vault <VAULT_ADDRESS> \
  --fee-bps <FEE_BPS> \
  --mode execute
```

### Withdraw Pending Fees

Withdraw accumulated fees from the vault.

```bash theme={null}
yarn kamino-manager withdraw-pending-fees \
  --vault <VAULT_ADDRESS> \
  --mode execute
```

### Relinquish Fees

The vault manager can give up pending fees (partial or full), which will be distributed to vault token holders. This is useful when pending fees grow larger than the total vault value, allowing the manager to restore the vault to a healthy state.

```bash theme={null}
yarn kamino-manager give-up-pending-fees \
  --vault <VAULT_ADDRESS> \
  --max-amount-to-give-up <TOKEN_AMOUNT> \
  --mode execute
```

**Parameters:**

* `vault` - The vault address to give up fees for
* `max-amount-to-give-up` - The amount in tokens to be given up from the pending fees

## Advanced Operations

### Multisig Management

For multisig-controlled vaults, use the `--mode multisig` flag to generate Base58-encoded transactions for proposal submission.

```bash theme={null}
yarn kamino-manager update-vault-reserve-allocation \
  --vault <VAULT_ADDRESS> \
  --reserve <RESERVE_ADDRESS> \
  --allocation-weight <WEIGHT> \
  --allocation-cap <CAP> \
  --mode multisig \
  --multisig <MULTISIG_PUBKEY>
```

> [!NOTE]
>
> We recommend using [Squads](https://squads.xyz/multisig) with a hardware wallet for multisig management. The generated transaction can be submitted as a multisig proposal through Squads.

## Next Steps

> **[Market Operations](https://kamino.com/docs/build/cli/market-operations.md)**
>
> Create and manage lending markets and reserves

> **[Installation & Setup](https://kamino.com/docs/build/cli/installation-setup.md)**
>
> Review installation and configuration


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
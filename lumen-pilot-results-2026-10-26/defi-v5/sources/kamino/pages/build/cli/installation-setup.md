> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Install and Setup the Kamino CLI

> Get started with the Kamino Manager CLI

The Kamino Manager CLI is a command-line tool for creating and managing Kamino lending markets, reserves, and vaults.

## Prerequisites

Before installing the Kamino Manager CLI:

> [!NOTE]
>
> Node.js, Yarn package manager, and Solana CLI tools are required to run the Kamino Manager CLI.

## Installation

Follow these steps to install and configure the Kamino Manager CLI:

**1. Install Node.js and Yarn**

Install Node.js from [nodejs.org](https://nodejs.org/), then install Yarn package manager.

```bash theme={null}
npm install -g yarn
```

**2. Install Solana CLI**

Install the Solana CLI tools to create and manage keypairs.

```bash theme={null}
sh -c "$(curl -sSfL https://release.solana.com/v1.18.18/install)"
```

> [!WARNING]
>
> After installation, restart the terminal to ensure the Solana CLI is available in PATH.

**3. Clone and Setup Kamino Manager**

Clone the Kamino SDK repository and install dependencies.

```bash theme={null}
git clone git@github.com:Kamino-Finance/klend-sdk.git
cd klend-sdk
yarn
```

This will install all necessary dependencies for the Kamino Manager CLI.

## Configuration

After installation, configure the Kamino Manager CLI with a wallet and RPC endpoint.

**1. Create Admin Keypair**

Create a new keypair that will serve as the admin account for managing markets and vaults.

```bash theme={null}
solana-keygen new -o admin.json
```

> [!WARNING]
>
> Store the keypair file securely and never share it. This keypair will need SOL for transaction fees.

> [!NOTE]
>
> Existing keypairs can be used instead of creating a new one. Specify the path to the existing keypair file in the configuration.

**2. Configure Environment Variables**

Create a `.env` file in the `klend-sdk` directory and configure the following variables:

```bash theme={null}
# Path to admin keypair file
ADMIN=./admin.json

# Solana RPC endpoint
RPC=https://api.mainnet-beta.solana.com

# Program IDs
KLEND_PROGRAM_ID_MAINNET="KLend2g3cP87fffoy8q1mQqGKjrxjC8boSyAYavgmjD"
KVAULT_PROGRAM_ID_MAINNET="KvauGMspG5k6rtzrqqn7WNn3oZdyKqLKwK2XWQ8FLjd"
KLEND_PROGRAM_ID_STAGING="SLendK7ySfcEzyaFqy93gDnD3RtrpXJcnRwb6zFHJSh"
KVAULT_PROGRAM_ID_STAGING="stKvQfwRsQiKnLtMNVLHKS3exFJmZFsgfzBPWHECUYK"
KVAULT_PROGRAM_ID_DEVNET="devkRngFnfp4gBc5a3LsadgbQKdPo8MSZ4prFiNSVmY"
```

> [!NOTE]
>
> For production use, it's recommended to use a private RPC endpoint from providers like [Helius](https://www.helius.dev). Public RPCs are rate-limited and may cause transaction failures.

**3. Fund Your Admin Account**

Transfer SOL to the admin account to pay for transaction fees. Get the admin account address:

```bash theme={null}
solana-keygen pubkey admin.json
```

Transfer SOL to this address from another wallet or acquire it from an exchange.

## Verify Installation

Run a simple command to verify everything is set up correctly:

```bash theme={null}
yarn run kamino-manager --help
```

The help output should display available commands for managing markets and vaults.

## Next Steps

The Kamino Manager CLI is now installed and ready for managing markets and vaults:

> **[Market Operations](https://kamino.com/docs/build/cli/market-operations.md)**
>
> Create and manage lending markets and reserves

> **[Vault Operations](https://kamino.com/docs/build/cli/vault-operations.md)**
>
> Create and manage Kamino vaults


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
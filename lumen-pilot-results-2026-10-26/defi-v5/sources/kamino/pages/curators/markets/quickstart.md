> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Quickstart

> Stand up a working market on staging in ~10 minutes

This walkthrough takes you from zero to a working market with one reserve on Kamino's staging environment. Staging runs the klend program on Solana mainnet under a separate program ID, so prices, oracles, and conditions match production while the market itself stays isolated from prod.

> [!NOTE]
>
> **Want a fully isolated sandbox instead?** Replace every `--staging` flag below with `--devnet` to run against Solana devnet. Devnet is good for learning the CLI without any mainnet exposure; staging is the right target if you intend to graduate the same configuration to mainnet.

## Prerequisites

| Requirement | Why |
| - | - |
| Node.js + Yarn | The CLI is a TypeScript app shipped with `klend-sdk` |
| Solana CLI (`solana-keygen`) | To create and inspect the admin keypair |
| A funded Solana wallet | To pay transaction fees and seed the first deposit |
| A Solana RPC endpoint | Public RPC works for staging; private RPC strongly recommended |

If you're missing any of these, follow the [CLI installation & setup](https://kamino.com/docs/build/cli/installation-setup.md) page first.

## 1. Clone and configure

```bash theme={null}
git clone git@github.com:Kamino-Finance/klend-sdk.git
cd klend-sdk
yarn
```

Create a `.env` file in the project root:

```bash theme={null}
ADMIN=./admin.json
RPC=https://api.mainnet-beta.solana.com
KLEND_PROGRAM_ID_MAINNET="KLend2g3cP87fffoy8q1mQqGKjrxjC8boSyAYavgmjD"
KLEND_PROGRAM_ID_STAGING="SLendK7ySfcEzyaFqy93gDnD3RtrpXJcnRwb6zFHJSh"
KVAULT_PROGRAM_ID_MAINNET="KvauGMspG5k6rtzrqqn7WNn3oZdyKqLKwK2XWQ8FLjd"
KVAULT_PROGRAM_ID_STAGING="stKvQfwRsQiKnLtMNVLHKS3exFJmZFsgfzBPWHECUYK"
KVAULT_PROGRAM_ID_DEVNET="devkRngFnfp4gBc5a3LsadgbQKdPo8MSZ4prFiNSVmY"
```

Generate or point to an admin keypair:

```bash theme={null}
solana-keygen new -o admin.json
solana-keygen pubkey admin.json   # send a small amount of SOL to this address
```

## 2. Create the market

```bash theme={null}
yarn kamino-manager create-market --staging --mode execute
```

The CLI returns a market address in its output. Save it; every subsequent command takes it as `--lending-market` or `--market`.

```bash theme={null}
export MARKET=<paste_market_address_here>
```

> [!TIP]
>
> Always start a new operation with `--mode inspect` (prints a simulator URL) or `--mode simulate` (runs the simulation and prints the result). Switch to `--mode execute` once the dry run looks correct.

## 3. Add a reserve

The repo includes `configs/reserve_config_example.json` as a starting point. For staging, USDC is a sensible first reserve.

```bash theme={null}
yarn kamino-manager add-asset-to-market \
  --market $MARKET \
  --mint EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v \
  --mint-program-id TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA \
  --reserve-config-path ./configs/reserve_config_example.json \
  --staging \
  --mode execute
```

> [!WARNING]
>
> The example reserve config is a starting template. Before mainnet, replace it with a config tuned for the asset, oracle, and risk profile you actually want. See [Risk parameters](https://kamino.com/docs/curators/markets/risk-parameters.md) and [Reserve config reference](https://kamino.com/docs/curators/markets/reserve-parameters.md).

Repeat the command with a different `--mint` for each additional reserve.

## 4. Verify the market state

Download the full market and reserve config to confirm everything is wired up:

```bash theme={null}
yarn kamino-manager download-lending-market-config-and-all-reserves-configs \
  --lending-market $MARKET \
  --staging
```

The CLI writes the configs to `./configs/{MARKET_ADDRESS}/`. Open them and check:

* Market `lending_market_owner` is your admin pubkey
* Each reserve has `status: 0` (Active)
* Each reserve has a populated `tokenInfo.scopeConfiguration.priceFeed`
* `depositLimit` and `borrowLimit` are non-zero where you want activity

## 5. Test a deposit

Open the staging webapp scoped to your market:

```
https://app.kamino.finance/?STAGING_PROGRAM&market=<MARKET_ADDRESS>
```

Connect a wallet that holds the asset, deposit, and confirm the position appears. If you don't see the market, double-check the staging program flag and that the reserve `status` is `0`.

## What you have now

A working market with one reserve, owned by your hot wallet, running against staging. The on-chain accounts are real; the program is real; the oracles are real. The only thing missing for production is multisig ownership.

## Next steps for going to production

**1. Tune risk parameters**

Replace the example config with values appropriate for the asset and your risk thesis. → [Risk parameters](https://kamino.com/docs/curators/markets/risk-parameters.md)

**2. Configure oracles**

Pick the right oracle source, set TWAP guards, configure staleness. → [Configure oracles](https://kamino.com/docs/curators/markets/configuring-oracles.md)

**3. Enable any optional features**

Withdrawal queue, fixed rate reserves, borrow orders, eMode, permissioning — opt in per feature. → [Withdrawal queue](https://kamino.com/docs/curators/markets/withdrawal-queue.md)

**4. Set up a Squads multisig**

Production markets must be owned by a multisig. → [Transfer to multisig](https://kamino.com/docs/curators/markets/transfer-to-multisig.md)

**5. Re-run on mainnet**

Drop the `--staging` flag and re-run the create + add-reserve flow. The mainnet program ID `KLend2g3cP87fffoy8q1mQqGKjrxjC8boSyAYavgmjD` is the default.

## Common errors at this stage

| Error | Cause |
| - | - |
| `RPC rate limit / transaction failed` | Use a private RPC (Helius, Triton, etc.). Public mainnet RPC is rate-limited. |
| `InvalidOracleConfig` | The reserve's `tokenInfo` doesn't match a real oracle account. Run `get-oracle-mappings` to find the correct addresses. |
| `Reserve init failed: account already exists` | Re-running `add-asset-to-market` with the same mint. Each mint can have only one reserve per market. |
| `Insufficient funds for transaction fee` | The admin wallet is empty. Send a small amount of SOL. |

For a wider catalog of errors, see [Troubleshooting](https://kamino.com/docs/curators/markets/troubleshooting).


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
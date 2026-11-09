> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Configure fixed-rate allocations

> Add and manage allocations into fixed-rate reserves — UI, SDK, and CLI walkthroughs with FR-specific parameter choices

This guide is the focused walkthrough for adding a vault allocation into a fixed-rate reserve. The general allocation primitives (weights, caps, sync, the Standard vs. Conditional choice) live in [Concepts → Allocations](https://kamino.com/docs/curators/vaults/concepts/allocations.md) and [Configure allocations](https://kamino.com/docs/curators/vaults/guides/configure-allocations.md); the FR-specific application of those primitives is in [Fixed Rates → Allocations](https://kamino.com/docs/curators/vaults/fixed-rates/allocations.md). This page assumes you've read those and are ready to act.

## Before you start

You'll need:

* An existing vault for the deposit token of the FR reserve (e.g. a USDC vault to allocate into a `USDC 5.5% 3M` reserve).
* The address of the fixed-rate reserve. Find it via the Manage UI's reserve picker, or via [Markets → Fixed Rates](https://kamino.com/docs/curators/markets/fixed-rates.md) for the market manager who created it.
* A decision on Standard vs. Conditional (see below).
* For SDK or CLI: your admin keypair file path.

## Decide on Standard vs. Conditional

Both work for FR reserves. The choice is about capital efficiency vs. visibility, not technical compatibility.

| Pick | When |
| - | - |
| **Conditional** | Default for most FR exposure. Capital stays in floating reserves earning variable yield until borrow demand triggers an atomic deployment into the FR reserve. |
| **Standard** | When you want capital visibly committed and immediately available for direct borrows — typically for seeding a new FR reserve or anchoring a strategic position. |
| **Both on the same reserve** | A Standard base layer of visible liquidity plus Conditional capacity behind it. |

For the full reasoning, see [Fixed Rates → Allocations → Why Conditional is the default for FR](https://kamino.com/docs/curators/vaults/fixed-rates/allocations.md#why-conditional-is-the-default-for-fr).

## Parameter cheat sheet

Four parameter choices change for FR reserves vs. floating ones:

| Parameter | Conditional | Standard |
| - | - | - |
| `allocation-type` | `Conditional` | `Standard` |
| `allocation-weight` | `0` (weight is ignored) | Relative integer like any other Standard allocation |
| `allocation-cap` | The **binding limit** — maximum the vault will deploy if matched | Hard ceiling on top of weight |
| `priority` | `0` (default) — only set if you want this Conditional fill to draw from higher-priority sources | `0` (default) — raise to protect this Standard allocation from being drawn down by Conditional fills on other FR reserves |

For the priority rule and worked examples, see [Concepts → Allocations → Priority](https://kamino.com/docs/curators/vaults/concepts/allocations.md#priority).

## Walkthrough

**UI**

**1. Open the Allocations tab**

Navigate to your vault on `kamino.com/curators/vaults` and open the **Allocations** tab.

**2. Click Add Reserve**

Opens the allocation configuration form.

**3. Select the market**

Pick the market that hosts the fixed-rate reserve (e.g. SOL/BTC Market).

**4. Select the fixed-rate reserve**

The reserve picker lists floating and fixed-rate reserves side by side. Fixed-rate reserves are tagged with their rate, term, and reserve type — for example `USDC 5.5% 3M`. Pick the cell of the rate grid you're targeting.

**5. Toggle Conditional Allocation**

On for Conditional (capital stays in floating until matched). Off for Standard (capital deploys immediately).

**6. Set the cap**

The maximum tokens the vault is willing to deploy into this reserve. For Conditional, this is the binding limit. For Standard, a hard ceiling.

**7. Set weight (Standard only)**

Skip for Conditional — the field is ignored. For Standard, set the relative weight against your other Standard allocations.

**8. Set priority**

Default `0`. Only adjust if you're using priority to protect specific source reserves (see Parameter cheat sheet above).

**9. Submit**

Sign with your admin wallet, or generate a Squads proposal if the vault is multisig-controlled.

**SDK**

```typescript theme={null}
import {
  createSolanaRpc,
  createSolanaRpcSubscriptions,
  address,
  pipe,
  createTransactionMessage,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  appendTransactionMessageInstructions,
  signTransactionMessageWithSigners,
  sendAndConfirmTransactionFactory,
} from '@solana/kit';
import {
  KaminoManager,
  KaminoVault,
  Reserve,
  ReserveAllocationConfig,
  ReserveType,
  getMedianSlotDurationInMsFromLastEpochs,
} from '@kamino-finance/klend-sdk';
import { parseKeypairFile } from '@kamino-finance/klend-sdk/dist/utils/signer.js';
import { Decimal } from 'decimal.js';

const adminSigner = await parseKeypairFile('/path/to/your/keypair.json');
const rpc = createSolanaRpc('https://api.mainnet-beta.solana.com');
const rpcSubscriptions = createSolanaRpcSubscriptions('wss://api.mainnet-beta.solana.com');
const slotDuration = await getMedianSlotDurationInMsFromLastEpochs();
const kaminoManager = new KaminoManager(rpc, slotDuration);

const vault = new KaminoVault(rpc, address('<VAULT_ADDRESS>'));
const fixedRateReserveAddress = address('<FIXED_RATE_RESERVE_ADDRESS>');

const reserveState = await Reserve.fetch(rpc, fixedRateReserveAddress);
const reserveWithAddress = { address: fixedRateReserveAddress, state: reserveState! };

// Conditional — default for FR
const conditionalConfig = new ReserveAllocationConfig(
  reserveWithAddress,
  0,                              // weight ignored for Conditional
  new Decimal('10000000'),        // cap — binding limit (10M tokens)
  new ReserveType.Conditional(),
  0,                              // priority
);

// OR — Standard, when you want visible committed liquidity
const standardConfig = new ReserveAllocationConfig(
  reserveWithAddress,
  100,                            // weight relative to other Standard allocations
  new Decimal('5000000'),         // cap — hard ceiling on top of weight
  new ReserveType.Standard(),
  0,                              // priority
);

const { updateReserveAllocationIx } =
  await kaminoManager.updateVaultReserveAllocationIxs(vault, conditionalConfig, adminSigner);

const { value: blockhash } = await rpc.getLatestBlockhash({ commitment: 'finalized' }).send();
const signed = await signTransactionMessageWithSigners(
  pipe(
    createTransactionMessage({ version: 0 }),
    tx => setTransactionMessageFeePayerSigner(adminSigner, tx),
    tx => setTransactionMessageLifetimeUsingBlockhash(blockhash, tx),
    tx => appendTransactionMessageInstructions([updateReserveAllocationIx], tx),
  ),
);
await sendAndConfirmTransactionFactory({ rpc, rpcSubscriptions })(signed, {
  commitment: 'confirmed',
  skipPreflight: true,
});
```

The same `updateVaultReserveAllocationIxs` method handles both **adding a new reserve** and **updating an existing one** — the SDK detects the difference. To **mix Standard + Conditional on the same reserve**, call the method twice with the two configs.

**CLI**

> [!NOTE]
>
> Complete the [CLI installation guide](https://kamino.com/docs/build/cli/installation-setup.md) first. Commands require `.env` with `ADMIN` and `RPC` configured.

**Conditional allocation** (recommended default for FR):

```bash theme={null}
yarn kamino-manager update-vault-reserve-allocation \
  --vault <VAULT_ADDRESS> \
  --reserve <FIXED_RATE_RESERVE_ADDRESS> \
  --allocation-weight 0 \
  --allocation-cap 10000000 \
  --allocation-type Conditional \
  --priority 0 \
  --mode simulate
```

**Standard allocation** (for visible committed liquidity):

```bash theme={null}
yarn kamino-manager update-vault-reserve-allocation \
  --vault <VAULT_ADDRESS> \
  --reserve <FIXED_RATE_RESERVE_ADDRESS> \
  --allocation-weight 100 \
  --allocation-cap 5000000 \
  --allocation-type Standard \
  --priority 0 \
  --mode simulate
```

Always run `--mode simulate` first to inspect the resulting state. Then re-run with `--mode execute`, or `--mode multisig --multisig <MULTISIG_PUBKEY>` to emit a Base58 payload for [Squads](https://squads.so).

**Mixing Standard + Conditional on the same reserve**: run the command twice with the two `--allocation-type` values. The vault will hold both allocations against the same reserve.

## Verify

After submission lands:

* **UI.** The new allocation appears in the Allocations tab with the reserve name, type tag (Standard / Conditional), cap, weight, and priority.
* **SDK.** `vault.getVaultAllocations()` returns a map that includes the new reserve. See [Configure allocations → Read current allocations](https://kamino.com/docs/curators/vaults/guides/configure-allocations.md#read-current-allocations).
* **API.** `GET /kvaults/vaults/{pubkey}` includes the allocation strategy. See [Allocation data](https://kamino.com/docs/curators/data/allocation-data.md).

A Conditional allocation won't show capital deployed into the FR reserve until borrow demand triggers a fill — that's expected. The vault's actual position lives in your Standard floating allocations until then.

## After it lands

* **Watch for fills.** If the FR reserve attracts demand, your Conditional cap may be drawn down to satisfy it. The fill is atomic — see [Lifecycle → The fill](https://kamino.com/docs/curators/vaults/fixed-rates/lifecycle.md#the-fill).
* **Adjust caps responsively.** Raise to expose more capital, lower to commit less. Conditional caps can be dropped to `0` to disable the signal entirely.
* **Plan exits ahead of maturity.** Once a Conditional fill lands and is committed to a borrow, exits go through the [withdrawal queue](https://kamino.com/docs/curators/vaults/concepts/liquidity-and-withdrawals.md#the-withdrawal-queue). Queue early if you want predictable exit timing — see [Lifecycle → Exiting via the withdrawal queue](https://kamino.com/docs/curators/vaults/fixed-rates/lifecycle.md#exiting-via-the-withdrawal-queue).

## What's next

> **[Fixed Rates → Allocations](https://kamino.com/docs/curators/vaults/fixed-rates/allocations.md)**
>
> The FR-specific application of Standard vs. Conditional with priority worked examples.

> **[Fixed Rates → Lifecycle](https://kamino.com/docs/curators/vaults/fixed-rates/lifecycle.md)**
>
> What your capital experiences from fill through term, rollover, and queued exits.

> **[Fixed Rates → Strategy](https://kamino.com/docs/curators/vaults/fixed-rates/strategy.md)**
>
> Postures, sizing, monitoring, and a worked \$100M vault example.

> **[Configure allocations](https://kamino.com/docs/curators/vaults/guides/configure-allocations.md)**
>
> The general allocation workflow (floating reserves and the unallocated buffer).


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
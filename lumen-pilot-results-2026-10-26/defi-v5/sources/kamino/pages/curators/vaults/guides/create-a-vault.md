> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Create a vault

> Deploy a new Kamino vault — UI walkthrough plus SDK and CLI alternatives, with a complete post-creation checklist

This guide walks through deploying a new vault and completing the post-creation steps that make it production-ready. The conceptual background is in [How vaults work](https://kamino.com/docs/curators/vaults/concepts/how-vaults-work.md); this page is purely operational.

<video aria-label="Kamino curators vault landing page" poster="/docs/images/curators/vaults/curators-vault-landing-light-poster.jpg" autoPlay loop muted playsInline>
  <source src="https://mintcdn.com/kamino-3d73a151/haghBe_kakXD8Wdp/videos/curators/vaults/curators-vault-landing-light.mp4?fit=max&auto=format&n=haghBe_kakXD8Wdp&q=85&s=ebbdaa734f040ad57b481025c4cc9ea9" type="video/mp4" />

  ![Kamino curators vault landing page](https://mintcdn.com/kamino-3d73a151/MXDfwKWrBd8H1KRf/images/curators/vaults/curators-vault-landing-light-poster.jpg?fit=max\&auto=format\&n=MXDfwKWrBd8H1KRf\&q=85\&s=055d175020acd5a30c82dde9a69613a2)
</video>

## Before you start

You'll need:

* A funded wallet with at least 1,000 lamports of the deposit token (used as the bootstrapping deposit at creation).
* The mint address of the deposit token (e.g. `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v` for USDC).
* Decisions on: vault name, receipt-token ticker suffix, fee structure, operational parameters.

For SDK or CLI use, also have your admin keypair file path ready.

## Choose your interface

**UI**

## Create via kamino.com/curators/vaults

**1. Configure required parameters**

Set the vault name, deposit token, receipt token name and ticker suffix.

![Create Vault modal](https://mintcdn.com/kamino-3d73a151/0BZCvX0581phKD7f/images/curators/vaults/create-vault-step-1.webp?fit=max\&auto=format\&n=0BZCvX0581phKD7f\&q=85\&s=160fba860dab87c752958165822a0e1d)

| Parameter | Notes |
| - | - |
| Vault Name | Max 40 characters; editable post-creation |
| Deposit Token | Immutable; determines available reserves for allocation |
| Receipt Token Ticker | Format `kv[SYMBOL]-[SUFFIX]`; the prefix is immutable, the suffix is editable post-creation |
| Receipt Token Name | Format `kVault [SUFFIX] [NAME]`; max 32 chars total |

**2. Set fees**

Configure performance fee and AUM fee. Both default to 0% and are editable post-creation. See [Yield & fees](https://kamino.com/docs/curators/vaults/concepts/yield-and-fees.md#manager-fees) for the model.

![Fees Settings section](https://mintcdn.com/kamino-3d73a151/0BZCvX0581phKD7f/images/curators/vaults/create-vault-step-2.webp?fit=max\&auto=format\&n=0BZCvX0581phKD7f\&q=85\&s=c3e6c4af5586025afe6a54a77fb3d423)

**3. Configure operational parameters (optional)**

Set minimum deposit/withdraw/invest amounts, invest delay, withdrawal penalty, and crank fund fee. All are editable post-creation; the defaults are sensible. See the [parameter reference](https://kamino.com/docs/curators/reference/parameters.md) for definitions.

![Advanced Settings section](https://mintcdn.com/kamino-3d73a151/0BZCvX0581phKD7f/images/curators/vaults/create-vault-step-3.webp?fit=max\&auto=format\&n=0BZCvX0581phKD7f\&q=85\&s=f06a1870b16e09147bdcd3e1d1c23852)

**4. Approved Reserves Only (optional)**

The Create New Vault modal includes an **Approved Reserves Only** toggle. Enabling it activates both Whitelisted Reserves flags as part of the creation transaction — your vault ships with the smart-contract-level allocation restriction in place. **This is irreversible.** See [Concepts → Risk primitives](https://kamino.com/docs/curators/vaults/concepts/risk-primitives.md#whitelisted-reserves) before flipping it. If you don't enable it here, you can do so later via [Enable Whitelisted Reserves](https://kamino.com/docs/curators/vaults/guides/enable-whitelisted-reserves.md).

**5. Submit the creation transaction**

Sign with the wallet that holds the bootstrapping deposit. The vault address is displayed after the transaction lands.

**6. Complete post-creation setup**

Continue to the [post-creation checklist](#post-creation-checklist) below.

**SDK**

## Create via TypeScript SDK

> [!NOTE]
>
> The full vault creation flow including farm setup runs in three transactions. Use a private RPC endpoint for production — public RPCs are rate-limited.

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
  KaminoVaultConfig,
  getMedianSlotDurationInMsFromLastEpochs,
} from '@kamino-finance/klend-sdk';
import { parseKeypairFile } from '@kamino-finance/klend-sdk/dist/utils/signer.js';
import { TOKEN_PROGRAM_ADDRESS } from '@solana-program/token';
import { Decimal } from 'decimal.js';

const adminSigner = await parseKeypairFile('/path/to/your/keypair.json');
const rpc = createSolanaRpc('https://api.mainnet-beta.solana.com');
const rpcSubscriptions = createSolanaRpcSubscriptions('wss://api.mainnet-beta.solana.com');

const slotDuration = await getMedianSlotDurationInMsFromLastEpochs();
const kaminoManager = new KaminoManager(rpc, slotDuration);

// 1. Configure the vault
const vaultConfig = new KaminoVaultConfig({
  admin: adminSigner,
  tokenMint: address('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'), // USDC
  tokenMintProgramId: TOKEN_PROGRAM_ADDRESS,
  performanceFeeRatePercentage: new Decimal(15.0),
  managementFeeRatePercentage: new Decimal(2.0),
  name: 'MyVault',
  vaultTokenSymbol: 'USDC',
  vaultTokenName: 'MyVaultToken',
  // Operational params — defaults shown
  minDepositAmount: 1000,
  minWithdrawAmount: 10,
  withdrawalPenaltyBps: 1,
  withdrawalPenaltyLamports: 1,
  crankFundFeePerReserve: 1,
});

// 2. Generate creation instructions
const { vault: vaultSigner, initVaultIxs: instructions } =
  await kaminoManager.createVaultIxs(vaultConfig);

// 3. Helper to build, sign, and send a transaction
async function send(ixs) {
  const { value: blockhash } = await rpc.getLatestBlockhash({ commitment: 'finalized' }).send();
  const signed = await signTransactionMessageWithSigners(
    pipe(
      createTransactionMessage({ version: 0 }),
      tx => setTransactionMessageFeePayerSigner(adminSigner, tx),
      tx => setTransactionMessageLifetimeUsingBlockhash(blockhash, tx),
      tx => appendTransactionMessageInstructions(ixs, tx),
    ),
  );
  await sendAndConfirmTransactionFactory({ rpc, rpcSubscriptions })(signed, {
    commitment: 'confirmed',
    skipPreflight: true,
  });
}

// 4. Tx 1 — create the vault and register farms
await send([
  ...instructions.createAtaIfNeededIxs,
  ...instructions.initVaultIxs,
  instructions.createLUTIx,
  instructions.initSharesMetadataIx,
  ...instructions.setFarmToVaultIxs,
]);
console.log('Vault created:', vaultSigner.address);

// 4b. (Optional) Enable Whitelisted Reserves as part of the create flow.
// This is irreversible — see Concepts → Risk primitives before doing it.
//
// const allocIx = await kaminoManager.updateVaultAllowAllocationsInWhitelistedReservesOnlyIxs(
//   new KaminoVault(rpc, vaultSigner.address),
//   true,
// );
// const investIx = await kaminoManager.updateVaultAllowInvestInWhitelistedReservesOnlyIxs(
//   new KaminoVault(rpc, vaultSigner.address),
//   true,
// );
// await send([allocIx, investIx]);

// 5. Tx 2 — create and configure farms (Vault Farm + Insurance Pool farm)
for (const farm of instructions.createVaultFarms) {
  await send(farm.setupFarmIxs);
  await send(farm.updateFarmIxs);
}

// 6. Tx 3 — populate the lookup table (optional, optimizes future tx sizes)
await new Promise(r => setTimeout(r, 2000)); // wait for state to settle
await send(instructions.populateLUTIxs);
```

**What `createVaultIxs` produces:**

* `initVaultIxs` — vault account creation + initial config
* `createLUTIx` + `initSharesMetadataIx` — lookup table and receipt-token metadata
* `setFarmToVaultIxs` — registers the Vault Farm and Insurance Pool farm addresses on the vault
* `createVaultFarms` — array of farm setup instructions, run sequentially
* `populateLUTIxs` — populates the lookup table

The Autocompound Farm is configurable post-creation via the UI; SDK support is on the way.

Continue to the [post-creation checklist](#post-creation-checklist).

**CLI**

## Create via Kamino CLI

> [!NOTE]
>
> Complete the [CLI installation guide](https://kamino.com/docs/build/cli/installation-setup.md) first. Commands require a `.env` file with `ADMIN` (path to vault owner keypair) and `RPC` configured.

The CLI's `create-vault` command creates a vault with default settings. Use the SDK or UI for advanced configuration during creation.

```bash theme={null}
yarn kamino-manager create-vault \
  --mint <TOKEN_MINT> \
  --mode execute
```

Replace `<TOKEN_MINT>` with the deposit token mint (e.g. `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v` for USDC). Save the vault address from the output — you'll need it for every subsequent command.

> [!WARNING]
>
> For testing, add `--staging` to use the staging program ID. Never use `--staging` against mainnet vaults.

> [!NOTE]
>
> **Whitelisted Reserves cannot be enabled via the CLI's `create-vault` command.** If you want this protection (recommended for production), enable it as a post-creation step using the SDK or UI — see [Enable Whitelisted Reserves](https://kamino.com/docs/curators/vaults/guides/enable-whitelisted-reserves.md).

Continue to the [post-creation checklist](#post-creation-checklist).

## Post-creation checklist

After the vault is created, complete these steps before it's production-ready. Run them in order.

**1. Transfer admin to multisig**

Move vault admin to a Squads multisig **first**, before any subsequent state-changing operations. Once transferred, every operation below flows through Squads as a proposal — which is the production model. See [Transfer admin to multisig](https://kamino.com/docs/curators/vaults/guides/transfer-admin.md).

**2. Configure allocations**

Without allocations, the vault has nowhere to deploy capital. Add at least one reserve. See [Configure allocations](https://kamino.com/docs/curators/vaults/guides/configure-allocations.md).

**3. Configure fixed-rate allocations (if applicable)**

If your strategy includes fixed-rate exposure, add allocations into specific FR reserves. See [Configure fixed-rate allocations](https://kamino.com/docs/curators/vaults/guides/configure-fixed-rate-allocations.md). Skip if your vault is floating-only.

**4. Enable Whitelisted Reserves**

Smart-contract-level constraint preventing allocation to unverified reserves. Required for Kamino UI listing. Skip if you already enabled it in the creation flow above. See [Enable Whitelisted Reserves](https://kamino.com/docs/curators/vaults/guides/enable-whitelisted-reserves.md).

**5. Set up the Insurance Pool**

Lock your skin-in-the-game capital and trigger Kamino's match (up to \$250K). Required for Kamino UI listing. See [Set up the Insurance Pool](https://kamino.com/docs/curators/vaults/guides/set-up-insurance-pool.md).

**6. Verify farms (only if your create path missed them)**

The Vault Farm and Insurance Pool farm are normally created during initialization on the SDK and UI paths. If you used the CLI or otherwise skipped farm creation, see [Configure farms](https://kamino.com/docs/curators/vaults/guides/configure-farms.md).

## What's next

> **[Configure allocations](https://kamino.com/docs/curators/vaults/guides/configure-allocations.md)**
>
> Set how the vault distributes capital across reserves.

> **[Parameters reference](https://kamino.com/docs/curators/reference/parameters.md)**
>
> Complete reference for every vault parameter.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
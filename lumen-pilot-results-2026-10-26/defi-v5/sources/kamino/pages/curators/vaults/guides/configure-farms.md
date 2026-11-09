> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Configure farms

> Post-creation farm setup — only needed if your vault was created without farms

> [!NOTE]
>
> **This is a post-creation fallback guide, not a primary setup task.** When you create a vault via the SDK (`createVaultIxs`) or the UI, the Vault Farm and Insurance Pool farm are created automatically as part of the creation flow — see [Create a vault](https://kamino.com/docs/curators/vaults/guides/create-a-vault.md). You only need this guide if you created your vault via the CLI (which doesn't currently support farm creation) or otherwise skipped farm setup during init. The Autocompound Farm is the exception — it's always configured separately, currently UI-only.

Every vault supports three farms. This guide walks through creating and attaching each one post-creation. For the model — what each farm does and how rewards interact with vault accounting — read [Yield & fees → Farm rewards](https://kamino.com/docs/curators/vaults/concepts/yield-and-fees.md#farm-rewards).

## The three farms

| Farm | Role | SDK support |
| - | - | - |
| **Vault Farm** | Distributes any reward token to depositors (kToken holders). One per vault. | Available |
| **Insurance Pool farm** (`FirstLossCapitalFarm`) | Holds your locked capital that absorbs losses before depositors. See [Set up the Insurance Pool](https://kamino.com/docs/curators/vaults/guides/set-up-insurance-pool.md) for the full setup. | Available |
| **Autocompound Farm** | Distributes rewards in the vault's deposit token, automatically compounding into vault positions. | UI only — SDK support coming |

If you create a vault via the SDK using `createVaultIxs`, the Vault Farm and Insurance Pool farm are created automatically. If you used the UI or CLI, you'll need to create them post-hoc.

> [!WARNING]
>
> Farm creation is irreversible. The farm public key becomes immutable after creation, and farm authority transfers to the protocol.

## Create farms post-vault-creation

If your vault was created without farms (UI or CLI path), use the SDK to create them.

**SDK**

The Vault Farm and Insurance Pool farm follow the same three-transaction pattern: setup → update → register on the vault.

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
  getMedianSlotDurationInMsFromLastEpochs,
} from '@kamino-finance/klend-sdk';
import { parseKeypairFile } from '@kamino-finance/klend-sdk/dist/utils/signer.js';

const adminSigner = await parseKeypairFile('/path/to/your/keypair.json');
const rpc = createSolanaRpc('https://api.mainnet-beta.solana.com');
const rpcSubscriptions = createSolanaRpcSubscriptions('wss://api.mainnet-beta.solana.com');
const slotDuration = await getMedianSlotDurationInMsFromLastEpochs();
const kaminoManager = new KaminoManager(rpc, slotDuration);

const vault = new KaminoVault(rpc, address('<VAULT_ADDRESS>'));

// Helper for build/sign/send
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

// Create farm account and configure farm-side settings
const { farm, setupFarmIxs, updateFarmIxs } =
  await kaminoManager.createVaultFarmIxs(adminSigner, vault);

await send(setupFarmIxs);  // creates the farm account
await send(updateFarmIxs); // configures farm-side settings

// Register the farm on the vault
// — for the Vault Farm:
const { updateVaultConfigIx } = await kaminoManager.updateVaultFarmIxs(vault, farm.address);
// — OR for the Insurance Pool farm:
// const { updateVaultConfigIx } =
//   await kaminoManager.updateVaultFirstLossCapitalFarmIxs(vault, farm.address);

await send([updateVaultConfigIx]);
console.log('Farm attached:', farm.address);
```

### Vault Farm

After registration, you fund the farm with the reward token. Depositors claim proportional to their kToken holdings over the reward period. The farm has a **cooldown period** that prevents instant deposit-claim-withdraw cycling — set this when configuring reward distribution.

### Insurance Pool farm

After registration, configure the deposit token and lockup period (the lockup is a fixed 30 days for normal withdrawals — see [Set up the Insurance Pool](https://kamino.com/docs/curators/vaults/guides/set-up-insurance-pool.md) for the full setup including the 2-of-2 emergency withdrawal flow).

### Autocompound Farm

Configure the Autocompound Farm via the UI for now; SDK support is on the way.

**UI**

The UI walks through farm creation step-by-step. Open your vault's farms / rewards section on `manage.kamino.com` and follow the prompts. The Autocompound Farm is configured via the same surface.

**CLI**

> [!NOTE]
>
> Farm creation and management is not currently available via the Kamino CLI. Use the SDK or UI.

## Read incentive data

The vault overview includes farm incentive data across all three farms.

```typescript theme={null}
import { createSolanaRpc, address } from '@solana/kit';
import { KaminoManager, KaminoVault } from '@kamino-finance/klend-sdk';
import { Decimal } from 'decimal.js';

const rpc = createSolanaRpc('https://api.mainnet-beta.solana.com');
const vault = new KaminoVault(rpc, address('<VAULT_ADDRESS>'));
const kaminoManager = new KaminoManager(rpc);

const overview = await kaminoManager.getVaultOverview(vault, new Decimal(1.0));

console.log('Vault farm:', overview.vaultFarmIncentives);
console.log('Reserve farms:', overview.reservesFarmsIncentives);
console.log('Delegated farms:', overview.delegatedFarmIncentives);
```

## What's next

> **[Yield & fees](https://kamino.com/docs/curators/vaults/concepts/yield-and-fees.md)**
>
> The yield and fee model, including how farms compose with interest yield.

> **[Set up the Insurance Pool](https://kamino.com/docs/curators/vaults/guides/set-up-insurance-pool.md)**
>
> The full Insurance Pool setup, including emergency withdrawal configuration.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
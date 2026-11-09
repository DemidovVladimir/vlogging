> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Collect fees

> Withdraw pending performance and AUM fees, give fees back to depositors, and update fee rates

Performance and AUM fees accrue continuously in the vault's deposit token, but they are **not auto-collected** — you have to claim them. This guide covers the four operations: withdraw, give up, update performance rate, update AUM rate. For the model behind each fee, see [Yield & fees](https://kamino.com/docs/curators/vaults/concepts/yield-and-fees.md#manager-fees).

## Withdraw pending fees

Move accrued fees from the vault to the admin wallet. Both performance and AUM fees are claimed in a single call.

**UI**

1. Open your vault on `kamino.com/curators/vaults`.
2. Open the **Settings** tab and find the **Pending Fees** section. The current accrued amount is displayed in the deposit token.
3. Click **Withdraw Fees**.
4. Sign with your admin wallet, or generate a Squads proposal if the vault is multisig-controlled.

The fees land in the admin wallet's associated token account for the deposit token.

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
  getMedianSlotDurationInMsFromLastEpochs,
} from '@kamino-finance/klend-sdk';
import { parseKeypairFile } from '@kamino-finance/klend-sdk/dist/utils/signer.js';

const adminSigner = await parseKeypairFile('/path/to/your/keypair.json');
const rpc = createSolanaRpc('https://api.mainnet-beta.solana.com');
const rpcSubscriptions = createSolanaRpcSubscriptions('wss://api.mainnet-beta.solana.com');
const slotDuration = await getMedianSlotDurationInMsFromLastEpochs();
const manager = new KaminoManager(rpc, slotDuration);

const vault = new KaminoVault(rpc, address('<VAULT_ADDRESS>'));
const instructions = await manager.withdrawPendingFeesIxs(vault);

// Build and send the transaction with the standard @solana/kit pipe
const { value: blockhash } = await rpc.getLatestBlockhash({ commitment: 'finalized' }).send();
const signed = await signTransactionMessageWithSigners(
  pipe(
    createTransactionMessage({ version: 0 }),
    tx => setTransactionMessageFeePayerSigner(adminSigner, tx),
    tx => setTransactionMessageLifetimeUsingBlockhash(blockhash, tx),
    tx => appendTransactionMessageInstructions(instructions, tx),
  ),
);
await sendAndConfirmTransactionFactory({ rpc, rpcSubscriptions })(signed, {
  commitment: 'confirmed',
  skipPreflight: true,
});
```

**CLI**

```bash theme={null}
yarn kamino-manager withdraw-pending-fees \
  --vault <VAULT_ADDRESS> \
  --mode execute
```

For multisig-controlled vaults, append `--mode multisig --multisig <MULTISIG_PUBKEY>` to emit a Base58-encoded payload for [Squads](https://squads.so).

## Give up pending fees

Return accrued fees to depositors. Useful when accrued fees have grown disproportionately to vault size, when you want to retroactively adjust your effective fee rate, or as a goodwill gesture after a difficult period.

**UI**

The Settings tab includes a **Give Up Fees** action alongside **Withdraw Fees**. You specify the amount to return; it goes back to the vault and benefits remaining depositors via increased share price.

**SDK**

```typescript theme={null}
import { Decimal } from 'decimal.js';

const giveUpIx = await manager.giveUpPendingFeesIx(
  vault,
  new Decimal(1000000), // amount in the deposit token to give up
  adminSigner,
);

// Build and send: [giveUpIx]
```

**CLI**

```bash theme={null}
yarn kamino-manager give-up-pending-fees \
  --vault <VAULT_ADDRESS> \
  --max-amount-to-give-up <TOKEN_AMOUNT> \
  --mode execute
```

`--max-amount-to-give-up` is in tokens (not lamports). Pass the full pending-fee amount to give back everything; pass a smaller value to give back only part.

## Update performance fee

Change the percentage of vault profits taken as the performance fee. Editable any time post-creation.

**UI**

Settings → Fees → edit the **Performance Fee** value (in basis points, 1 bp = 0.01%). Submit.

**SDK**

```typescript theme={null}
const { updateVaultConfigIx } = await manager.updateVaultPerfFeeIxs(
  vault,
  500, // new fee in basis points (here, 5%)
  adminSigner,
);
// Build and send: [updateVaultConfigIx]
```

**CLI**

```bash theme={null}
yarn kamino-manager update-vault-perf-fee \
  --vault <VAULT_ADDRESS> \
  --fee-bps <FEE_BPS> \
  --mode execute
```

Example: `--fee-bps 1500` sets a 15% performance fee.

## Update AUM (management) fee

Change the annualized percentage charged on total vault assets. Editable any time post-creation.

**UI**

Settings → Fees → edit the **AUM Fee** value (in basis points). Submit.

**SDK**

```typescript theme={null}
const { updateVaultConfigIx } = await manager.updateVaultMgmtFeeIxs(
  vault,
  200, // new fee in basis points (here, 2%)
  adminSigner,
);
// Build and send: [updateVaultConfigIx]
```

**CLI**

```bash theme={null}
yarn kamino-manager update-vault-mgmt-fee \
  --vault <VAULT_ADDRESS> \
  --fee-bps <FEE_BPS> \
  --mode execute
```

## Operational notes

* **Both fees claim together.** `withdraw-pending-fees` collects accrued performance and AUM fees in a single transaction. There's no separate withdraw for each.
* **Fee changes apply forward.** Updating a fee rate doesn't retroactively change accrued fees — it changes the rate at which new fees accrue.
* **Multisig flow.** Production vaults run under [Squads](https://kamino.com/docs/curators/vaults/concepts/roles-and-ownership.md#the-squads-multisig-model). Every fee operation produces a proposal that members approve and execute. SquadsX automates the proposal step from `kamino.com/curators/vaults`; the CLI's `--mode multisig` emits a Base58 payload to import into Squads manually.
* **Withdrawal penalties are not curator revenue.** They're a security mechanism returned to the vault — see [Yield & fees → The withdrawal penalty](https://kamino.com/docs/curators/vaults/concepts/yield-and-fees.md#the-withdrawal-penalty). You can't withdraw or change them through this guide.

## What's next

> **[Yield & fees](https://kamino.com/docs/curators/vaults/concepts/yield-and-fees.md)**
>
> The full fee model, including withdrawal penalties and farm rewards.

> **[Roles & ownership](https://kamino.com/docs/curators/vaults/concepts/roles-and-ownership.md)**
>
> Multisig flow that governs every fee operation in production.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
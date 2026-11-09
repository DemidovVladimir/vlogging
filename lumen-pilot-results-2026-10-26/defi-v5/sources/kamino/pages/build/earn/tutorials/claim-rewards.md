> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Claim Rewards

> Claim all rewards earned from Kamino vaults

## Claiming Rewards

Retrieve and claim all pending rewards from a vault position.

**Step 1**

### Import Dependencies

Import the required packages for Solana RPC communication, Kamino SDK operations, and Kit transaction building.

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
  compressTransactionMessageUsingAddressLookupTables,
  signTransactionMessageWithSigners,
  assertIsTransactionWithinSizeLimit,
  sendAndConfirmTransactionFactory,
  getSignatureFromTransaction,
  type Address,
} from '@solana/kit';
import { fetchAllAddressLookupTable } from '@solana-program/address-lookup-table';
import {
  KaminoManager,
  KaminoVault,
  getCurrentLedgerInstant,
  getMedianSlotDurationInMsFromLastEpochs,
} from '@kamino-finance/klend-sdk';
import { parseKeypairFile } from '@kamino-finance/klend-sdk/dist/utils/signer.js';
```

**Step 2**

### Load Signer and Initialize RPC

Load your keypair from a file and initialize RPC connections.

```typescript theme={null}
const KEYPAIR_FILE = '/path/to/your/keypair.json';
const signer = await parseKeypairFile(KEYPAIR_FILE);

const rpc = createSolanaRpc('https://api.mainnet-beta.solana.com');
const rpcSubscriptions = createSolanaRpcSubscriptions('wss://api.mainnet-beta.solana.com');
```

> [!NOTE]
>
> Replace `/path/to/your/keypair.json` with the actual path to your keypair file. `parseKeypairFile` loads an existing keypair from a JSON file. The `rpcSubscriptions` enables real-time transaction confirmation.

**Step 3**

### Load the Vault

Initialize the vault and load its state and reserves once. Both the rewards check and the claim instructions use them.

```typescript theme={null}
const slotDuration = await getMedianSlotDurationInMsFromLastEpochs();
const manager = new KaminoManager(rpc, slotDuration);
const vault = new KaminoVault(
  rpc,
  address('A2wsxhA7pF4B2UKVfXocb6TAAP9ipfPJam6oMKgDE5BK'),
  slotDuration
);

const vaultState = await vault.getState();
const vaultReservesMap = await manager.loadVaultReserves(vaultState);
const ledgerInstant = await getCurrentLedgerInstant(rpc);
```

**Step 4**

### Check Pending Rewards

List the rewards your position has earned, per reward token.

```typescript theme={null}
const pending = await manager.getAllPendingRewardsForUserInVault(
  signer.address,
  vault,
  vaultReservesMap,
  ledgerInstant
);

for (const [rewardMint, amount] of pending.totalPendingRewards) {
  if (amount.isZero()) continue;
  console.log(`Pending ${amount.toString()} lamports of reward token ${rewardMint}`);
}
```

> [!NOTE]
>
> A position earns rewards from the vault's farm, the vault's delegated farm, and the farms of the reserves the vault allocates to. Amounts are in lamports, so divide by `10^decimals` of the reward token. Unused reward slots return `0` and are skipped.

**Step 5**

### Generate Claim Rewards Instructions

Build the instructions that claim every pending reward in one transaction.

```typescript theme={null}
const instructions = await manager.getClaimAllRewardsForVaultIxs(
  signer,
  vault,
  vaultReservesMap,
  ledgerInstant
);

if (!instructions.length) {
  console.log('No rewards to claim');
}
```

**Step 6**

### Load the Vault's Lookup Table

Fetch the vault's address lookup table to keep the transaction small.

```typescript theme={null}
const lookupTables = await fetchAllAddressLookupTable(rpc, [vaultState.vaultLookupTable]);
const lutsByAddress: Record<Address, Address[]> = {};
for (const lut of lookupTables) lutsByAddress[lut.address] = lut.data.addresses;
```

**Step 7**

### Build and Sign Transaction

Use Kit's functional pipe pattern to build, compress, and sign the transaction with a fresh blockhash.

```typescript theme={null}
const { value: latestBlockhash } = await rpc.getLatestBlockhash({ commitment: 'finalized' }).send();

const transactionMessage = pipe(
  createTransactionMessage({ version: 0 }),
  (tx) => setTransactionMessageFeePayerSigner(signer, tx),
  (tx) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
  (tx) => appendTransactionMessageInstructions(instructions, tx),
  (tx) => compressTransactionMessageUsingAddressLookupTables(tx, lutsByAddress)
);

const signedTransaction = await signTransactionMessageWithSigners(transactionMessage);
assertIsTransactionWithinSizeLimit(signedTransaction);
```

**Step 8**

### Send and Confirm Transaction

Send the claim transaction and wait for confirmation.

```typescript theme={null}
const signature = getSignatureFromTransaction(signedTransaction);

await sendAndConfirmTransactionFactory({ rpc, rpcSubscriptions })(signedTransaction, {
  commitment: 'confirmed',
  skipPreflight: true,
});

console.log('Claim rewards successful! Signature:', signature);
```

> [!TIP]
>
> Once the claim transaction is confirmed, the reward tokens are sent to your wallet.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
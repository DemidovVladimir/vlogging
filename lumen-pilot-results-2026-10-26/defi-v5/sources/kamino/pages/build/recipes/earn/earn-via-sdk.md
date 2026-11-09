> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Earn Deposit with the SDK

> Deposit to vaults using TypeScript SDK

## Deposit to Earn Vault

Deposit assets to start earning yield.

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
import { Decimal } from 'decimal.js';
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

Initialize the vault and load its state, reserves, and farm state once. The deposit instructions need all three.

```typescript theme={null}
const slotDuration = await getMedianSlotDurationInMsFromLastEpochs();
const manager = new KaminoManager(rpc, slotDuration);
const vault = new KaminoVault(
  rpc,
  address('HDsayqAsDWy3QvANGqh2yNraqcD8Fnjgh73Mhb3WRS5E'), // USDC vault
  slotDuration
);

const vaultState = await vault.getState();
const vaultReservesMap = await manager.loadVaultReserves(vaultState);
const farmState = await manager.loadVaultFarmState(vaultState);
```

**Step 4**

### Set Slippage Protection

Estimate the shares the deposit will mint, minus a slippage tolerance. The deposit reverts if fewer shares would be minted.

```typescript theme={null}
const depositAmount = new Decimal(1.0); // 1 USDC
const minSharesOut = manager.estimateSharesFromTokens(
  vaultState,
  depositAmount,
  await getCurrentLedgerInstant(rpc),
  vaultReservesMap,
  10 // 0.1% slippage
);
```

> [!NOTE]
>
> The deposit amount is in tokens (`1.0` is 1 USDC), not lamports.

**Step 5**

### Build Deposit Instructions

Generate the deposit instructions, plus the instructions that stake the new shares in the vault's farm.

```typescript theme={null}
const bundle = await vault.depositIxs(
  signer,
  depositAmount,
  vaultReservesMap,
  farmState,
  null, // first-loss capital farm
  undefined, // payer
  undefined, // memo
  minSharesOut
);
const instructions = [...bundle.depositIxs, ...bundle.stakeInFarmIfNeededIxs];
```

> [!NOTE]
>
> If the vault has a rewards farm, `stakeInFarmIfNeededIxs` stakes the minted shares in it so the position earns farm rewards. Shares staked here are unstaked automatically when you withdraw.

**Step 6**

### Load the Vault's Lookup Table

Fetch the vault's address lookup table to keep the transaction small.

```typescript theme={null}
const lookupTables = await fetchAllAddressLookupTable(rpc, [vaultState.vaultLookupTable]);
const lutsByAddress: Record<Address, Address[]> = {};
for (const lut of lookupTables) lutsByAddress[lut.address] = lut.data.addresses;
```

> [!NOTE]
>
> Every vault has its own lookup table. Compressing with it cuts the deposit from about 1,021 to 528 bytes, well under Solana's 1,232-byte transaction limit.

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

Send the deposit transaction and wait for confirmation.

```typescript theme={null}
const signature = getSignatureFromTransaction(signedTransaction);

await sendAndConfirmTransactionFactory({ rpc, rpcSubscriptions })(signedTransaction, {
  commitment: 'confirmed',
  skipPreflight: true,
});

console.log('Deposit successful! Signature:', signature);
```

> [!TIP]
>
> Once the deposit transaction is confirmed, your assets are deposited into the vault and you start earning yield. Vault shares are minted to represent your position.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
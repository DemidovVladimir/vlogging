> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Claim User Rewards

> Claim all pending rewards from lending farm positions

> [!NOTE]
>
> **Delegated vs Non-Delegated Farms**
>
> Different farm types use different delegation patterns. For the correct delegatees for your specific farm, check the user farm state returned by `getAllFarmsForUser` in the "Calculate Claimable User Rewards" tutorial.

## Claim User Rewards

Claim all pending rewards from a user's farm position.

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
  signTransactionMessageWithSigners,
  sendAndConfirmTransactionFactory,
  getSignatureFromTransaction,
} from '@solana/kit';
import { KaminoMarket, parseKeypairFile, VanillaObligation, PROGRAM_ID } from '@kamino-finance/klend-sdk';
import { Farms } from '@kamino-finance/farms-sdk';
```

**Step 2**

### Load Signer and Initialize RPC

Load your keypair from a file and initialize RPC connections.

```typescript theme={null}
// Configuration - UPDATE THESE VALUES
const KEYPAIR_FILE = '/path/to/your/keypair.json';

// Load keypair from file
const signer = await parseKeypairFile(KEYPAIR_FILE);

// Initialize RPC and RPC Subscriptions
const rpc = createSolanaRpc('https://api.mainnet-beta.solana.com');
const rpcSubscriptions = createSolanaRpcSubscriptions('wss://api.mainnet-beta.solana.com');
```

**Step 3**

### Load Market and Get Obligation

Load the Kamino market and get the user's obligation address.

```typescript theme={null}
const marketPubkey = address('7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF');
const market = await KaminoMarket.load(rpc, marketPubkey, 400);

// Get obligation address for delegatees array
const kaminoObligation = await market!.getObligationByWallet(signer.address, new VanillaObligation(PROGRAM_ID));
if (!kaminoObligation) {
  console.log('No obligation found');
}

console.log('Obligation:', kaminoObligation?.obligationAddress.toString());
```

**Step 4**

### Build Claim Instructions

Use the Farms SDK to build claim instructions for all rewards on the farm.

```typescript theme={null}
// Build claim instructions using farms-sdk
const farm = new Farms(rpc);
const claimIxs = await farm.claimForUserForFarmAllRewardsIx(
  signer, // payer
  signer.address, // user (wallet address = owner)
  address('Gsoc83qRQ5X1LfGGbPqU2FdxZnveqbkP2vMXq6BcmtMk'), // farm
  true, // isDelegated = true for lending farms
  [signer.address, kaminoObligation!.obligationAddress] // delegatees array
);
```

> [!WARNING]
>
> The `delegatees` array values depend on your specific farm position. To find the correct delegatee addresses for your farm, use the "Calculate Claimable User Rewards" tutorial - it shows the actual delegatee in the user farm state.

**Step 5**

### Build and Sign Transaction

Use Kit's functional pipe pattern to build and sign the transaction with a fresh blockhash.

```typescript theme={null}
const { value: latestBlockhash } = await rpc.getLatestBlockhash({ commitment: 'finalized' }).send();
const claimTx = pipe(
  createTransactionMessage({ version: 0 }),
  (tx) => setTransactionMessageFeePayerSigner(signer, tx),
  (tx) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
  (tx) => appendTransactionMessageInstructions(claimIxs, tx)
);
const claimSigned = await signTransactionMessageWithSigners(claimTx);
const claimSignature = getSignatureFromTransaction(claimSigned);
```

**Step 6**

### Send and Confirm Transaction

Send the transaction to the network and wait for confirmation.

```typescript theme={null}
await sendAndConfirmTransactionFactory({ rpc, rpcSubscriptions })(claimSigned, {
  commitment: 'confirmed',
  skipPreflight: true,
});

console.log(`Claim farm rewards successful! Signature: ${claimSignature}`);
```

> [!TIP]
>
> The rewards have been claimed and transferred to your wallet. You can verify the transaction using the signature on a Solana explorer.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
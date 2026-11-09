> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Earn Withdraw with the API

> The API generates the unsigned transaction, and the client signs it securely

## Earn Withdraw with API

**Step 1**

### Import Dependencies

Import the required packages for Solana RPC communication, transaction handling, and Kamino SDK utilities.

```typescript theme={null}
import {
  createSolanaRpc,
  createSolanaRpcSubscriptions,
  pipe,
  getTransactionDecoder,
  getCompiledTransactionMessageDecoder,
  decompileTransactionMessageFetchingLookupTables,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  addSignersToTransactionMessage,
  signTransactionMessageWithSigners,
  sendAndConfirmTransactionFactory,
  getSignatureFromTransaction,
} from '@solana/kit';
import { parseKeypairFile } from '@kamino-finance/klend-sdk/dist/utils/signer.js';
```

**Step 2**

### Configure and Initialize

Set up the configuration and initialize RPC connections.

```typescript theme={null}
const KEYPAIR_FILE = '/path/to/your/keypair.json';
const API_BASE_URL = 'https://api.kamino.finance';

const signer = await parseKeypairFile(KEYPAIR_FILE);
const rpc = createSolanaRpc('https://api.mainnet-beta.solana.com');
const rpcSubscriptions = createSolanaRpcSubscriptions('wss://api.mainnet-beta.solana.com');
```

**Step 3**

### Call Kamino API

Make a POST request to the Kamino API to build the withdrawal transaction.

```typescript theme={null}
const response = await fetch(`${API_BASE_URL}/ktx/kvault/withdraw`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    wallet: signer.address,
    kvault: 'HDsayqAsDWy3QvANGqh2yNraqcD8Fnjgh73Mhb3WRS5E',
    amount: '1.0',
  }),
});

if (!response.ok) {
  const error = await response.json();
  console.log('API error:', error.message);
}

const { transaction: encodedTransaction } = await response.json();
```

> [!NOTE]
>
> The API returns a pre-built transaction encoded in base64 format. This transaction includes Address Lookup Tables (ALTs) for efficiency.

**Step 4**

### Decode Transaction

Decode the base64-encoded transaction and extract the message bytes.

```typescript theme={null}
const txBuffer = Buffer.from(encodedTransaction, 'base64');
const txMessageBytes = getTransactionDecoder().decode(txBuffer).messageBytes;

const compiledMessage = getCompiledTransactionMessageDecoder().decode(txMessageBytes);
```

**Step 5**

### Resolve Address Lookup Tables

Fetch and resolve the Address Lookup Tables from the blockchain.

```typescript theme={null}
const { value: latestBlockhash } = await rpc.getLatestBlockhash({ commitment: 'finalized' }).send();

const signedTransaction = await pipe(
  await decompileTransactionMessageFetchingLookupTables(compiledMessage, rpc),
  (tx) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
  (tx) => setTransactionMessageFeePayerSigner(signer, tx),
  (tx) => addSignersToTransactionMessage([signer], tx),
  (tx) => signTransactionMessageWithSigners(tx)
);
```

> [!NOTE]
>
> `decompileTransactionMessageFetchingLookupTables` fetches the lookup table data from the blockchain and resolves all address references. This is required for transactions that use ALTs.

> [!NOTE]
>
> A fresh blockhash is fetched and set to ensure the transaction remains valid.

**Step 6**

### Send and Confirm Transaction

Submit the signed transaction to the Solana network.

```typescript theme={null}
const signature = getSignatureFromTransaction(signedTransaction);

console.log(`Sending transaction with signature: ${signature}`);

await sendAndConfirmTransactionFactory({ rpc, rpcSubscriptions })(signedTransaction, {
  commitment: 'confirmed',
  skipPreflight: true,
});

console.log('Withdrawal successful! Signature:', signature);
```

> [!TIP]
>
> Your withdrawal is complete! The API built the transaction, you signed it locally (keeping your keys secure), and it was successfully submitted to the network.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
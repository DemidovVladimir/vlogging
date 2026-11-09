> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Borrow with the API

> The API generates the unsigned transaction, and the client signs it securely

Borrow assets from a Kamino reserve using the API. The API builds the transaction, and you sign it locally keeping your keys secure.

## Borrow via the API

**Step 1**

### Import Dependencies

Import the required packages for Solana RPC communication, transaction handling, and Kamino SDK utilities.

```typescript theme={null}
import {
  createSolanaRpc,
  createSolanaRpcSubscriptions,
  getTransactionDecoder,
  getCompiledTransactionMessageDecoder,
  decompileTransactionMessageFetchingLookupTables,
  pipe,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  addSignersToTransactionMessage,
  signTransactionMessageWithSigners,
  sendAndConfirmTransactionFactory,
  getSignatureFromTransaction,
} from '@solana/kit';
import { parseKeypairFile } from '@kamino-finance/klend-sdk/dist/utils/signer';
```

**Step 2**

### Configure and Initialize

Set up the configuration and initialize RPC connections.

```typescript theme={null}
const KEYPAIR_FILE = '/path/to/your/keypair.json';
const API_BASE_URL = 'https://api.kamino.finance';
const RPC_ENDPOINT = 'https://api.mainnet-beta.solana.com';
const WS_ENDPOINT = 'wss://api.mainnet-beta.solana.com';

const MAIN_MARKET = '7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF';
const SOL_RESERVE = 'd4A2prbA2whesmvHaL88BH6Ewn5N4bTSU2Ze8P6Bc4Q';

const signer = await parseKeypairFile(KEYPAIR_FILE);
const rpc = createSolanaRpc(RPC_ENDPOINT);
const rpcSubscriptions = createSolanaRpcSubscriptions(WS_ENDPOINT);
```

**Step 3**

### Call the Kamino API

Make a POST request to the Kamino API to build the borrow transaction.

```typescript theme={null}
const res = await fetch(`${API_BASE_URL}/ktx/klend/borrow`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    wallet: signer.address,
    market: MAIN_MARKET,
    reserve: SOL_RESERVE,
    amount: '0.02',
  }),
});

const data = await res.json();

if (!res.ok) {
  console.error('Response error:', data);
}

const encodedTransaction = data.transaction;
```

> [!NOTE]
>
> The API returns a pre-built transaction encoded in base64 format ready for signing.

**Step 4**

### Decode Transaction

Decode the base64-encoded transaction and extract the message bytes.

```typescript theme={null}
const txBuffer = Buffer.from(encodedTransaction, 'base64');
const txMessageBytes = getTransactionDecoder().decode(txBuffer).messageBytes;
const compiledMessage = getCompiledTransactionMessageDecoder().decode(txMessageBytes);
```

**Step 5**

### Resolve Address Lookup Tables and Sign

Fetch the latest blockhash, decompile the transaction to resolve Address Lookup Tables, and sign.

```typescript theme={null}
const { value: latestBlockhash } = await rpc.getLatestBlockhash({
  commitment: 'finalized'
}).send();

const signedTransaction = await pipe(
  await decompileTransactionMessageFetchingLookupTables(compiledMessage, rpc),
  tx => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
  tx => setTransactionMessageFeePayerSigner(signer, tx),
  tx => addSignersToTransactionMessage([signer], tx),
  tx => signTransactionMessageWithSigners(tx)
);
const signature = getSignatureFromTransaction(signedTransaction);
```

> [!NOTE]
>
> `decompileTransactionMessageFetchingLookupTables` fetches the lookup table data from the blockchain and resolves all address references. This is required for transactions that use ALTs.

**Step 6**

### Send and Confirm Transaction

Submit the signed transaction to the Solana network.

```typescript theme={null}
const sendAndConfirm = sendAndConfirmTransactionFactory({
  rpc,
  rpcSubscriptions,
});

await sendAndConfirm(signedTransaction, {
  commitment: 'confirmed',
  skipPreflight: false,
});

console.log('Borrow successful! Signature:', signature);
```

> [!TIP]
>
> Your borrow is complete! The API built the transaction, you signed it locally (keeping your keys secure), and it was successfully submitted to the network.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
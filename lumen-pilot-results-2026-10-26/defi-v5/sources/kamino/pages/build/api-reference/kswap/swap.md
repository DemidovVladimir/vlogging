> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Swap

> Get the best route and a pre-built transaction for swapping between two tokens on Solana via Kamino's swap aggregator. The response includes the serialized transaction, expected output amount, minimum output after slippage, and which router was selected.

Get the best route and transaction for swapping between two tokens on Solana via Kamino's swap aggregator.

## Example

**Step 1**

### Import Dependencies

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
  isTransactionWithinSizeLimit,
} from '@solana/kit';
import { parseKeypairFile } from '@kamino-finance/klend-sdk/dist/utils/signer';
```

**Step 2**

### Configure and Initialize

```typescript theme={null}
const KEYPAIR_FILE = '/path/to/your/keypair.json';
const API_BASE_URL = 'https://api.kamino.finance';
const RPC_ENDPOINT = 'https://api.mainnet-beta.solana.com';
const WS_ENDPOINT = 'wss://api.mainnet-beta.solana.com';

const signer = await parseKeypairFile(KEYPAIR_FILE);
const rpc = createSolanaRpc(RPC_ENDPOINT);
const rpcSubscriptions = createSolanaRpcSubscriptions(WS_ENDPOINT);
```

**Step 3**

### Fetch Swap Transaction

Call the KSwap API to get the best route and a pre-built transaction. This example swaps 1 SOL to USDC with 50bps max slippage.

```typescript theme={null}
const SOL = 'So11111111111111111111111111111111111111112';
const USDC = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

const params = new URLSearchParams({
  tokenIn: SOL,
  tokenOut: USDC,
  amountIn: '1000000000', // 1 SOL in lamports
  maxSlippageBps: '50',
  wallet: signer.address,
});

const res = await fetch(`${API_BASE_URL}/kswap/swap/?${params}`);
const { data } = await res.json();

console.log(`Router: ${data.routerType}, Expected out: ${data.expectedAmountOut}`);

const encodedTransaction = data.transaction;
```

**Step 4**

### Decode, Sign, and Send

Decode the base64 transaction, sign it locally, and submit to the network.

```typescript theme={null}
const txBuffer = Buffer.from(encodedTransaction, 'base64');
const txMessageBytes = getTransactionDecoder().decode(txBuffer).messageBytes;
const compiledMessage = getCompiledTransactionMessageDecoder().decode(txMessageBytes);

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

if (!isTransactionWithinSizeLimit(signedTransaction)) {
  throw new Error('Transaction exceeds size limit');
}

const signature = getSignatureFromTransaction(signedTransaction);

await sendAndConfirmTransactionFactory({ rpc, rpcSubscriptions })(signedTransaction, {
  commitment: 'confirmed',
  skipPreflight: true,
});

console.log('Swap successful! Signature:', signature);
```


## OpenAPI

````yaml kswap-api.json GET /kswap/swap/
openapi: 3.0.3
info:
  title: Kswap API
  description: Kamino swap aggregation API
  version: 1.0.0
servers:
  - url: https://api.kamino.finance
security: []
paths:
  /kswap/swap/:
    get:
      summary: Swap
      description: >-
        Get the best route and a pre-built transaction for swapping between two
        tokens on Solana via Kamino's swap aggregator. The response includes the
        serialized transaction, expected output amount, minimum output after
        slippage, and which router was selected.
      operationId: Swap
      parameters:
        - schema:
            type: string
          in: query
          name: tokenIn
          required: true
        - schema:
            type: string
          in: query
          name: tokenOut
          required: true
        - schema:
            type: string
          in: query
          name: amountIn
          required: true
        - schema:
            type: number
          in: query
          name: maxSlippageBps
          required: true
        - schema:
            type: string
          in: query
          name: wallet
          required: true
        - schema:
            type: boolean
            default: true
          in: query
          name: includeSetupIxs
          required: false
        - schema:
            type: boolean
            default: true
          in: query
          name: wrapAndUnwrapSol
          required: false
      responses:
        '200':
          description: Default Response
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: object
                    properties:
                      transaction:
                        type: string
                      expectedAmountOut:
                        type: string
                      minAmountOut:
                        type: string
                      routerType:
                        type: string
                        enum:
                          - metis
                          - dflow
                          - okx
                    required:
                      - transaction
                      - expectedAmountOut
                      - minAmountOut
                      - routerType
                  traceId:
                    type: string
                required:
                  - data

````

This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Refresh Prices

> Build and send the permissionless Scope refresh instruction for one or more price slots

## Refresh Prices

Scope prices are pushed on-chain by permissionless "crank" transactions: anyone can sign and send a refresh, no admin authority required. The Scope SDK builds one instruction that refreshes the specified token slots for a feed. This is the instruction Multiply and flash-loan flows bundle in front of a leverage operation so reserves read fresh prices.

**Step 1**

### Import Dependencies

Import the Scope SDK plus the Solana Kit transaction-building helpers and a keypair loader.

```typescript theme={null}
import {
    createSolanaRpc,
    createSolanaRpcSubscriptions,
    pipe,
    createTransactionMessage,
    setTransactionMessageFeePayerSigner,
    setTransactionMessageLifetimeUsingBlockhash,
    appendTransactionMessageInstructions,
    signTransactionMessageWithSigners,
    getSignatureFromTransaction,
    assertIsTransactionWithinSizeLimit,
    sendAndConfirmTransactionFactory,
    assertIsTransactionWithBlockhashLifetime,
} from "@solana/kit";
import { parseKeypairFile } from "@kamino-finance/klend-sdk/dist/utils/signer";
import { Scope, SCOPE_MAINNET_HUBBLE_FEED } from "@kamino-finance/scope-sdk";
```

**Step 2**

### Configure Constants and Initialize Scope

Set the keypair path, RPC endpoints, and the slot indices to refresh.

```typescript theme={null}
const KEYPAIR_FILE = "/path/to/your/keypair.json";
const RPC_ENDPOINT = "https://api.mainnet-beta.solana.com";
const WS_ENDPOINT = "wss://api.mainnet-beta.solana.com";

// Slot indices to refresh on the Hubble feed: SOL/USD EMA, daoSOL stake rate, MPLX/SOL TWAP.
const TOKENS = [52, 10, 41];

const signer = await parseKeypairFile(KEYPAIR_FILE);
const rpc = createSolanaRpc(RPC_ENDPOINT);
const rpcSubscriptions = createSolanaRpcSubscriptions(WS_ENDPOINT);
const scope = new Scope("mainnet-beta", rpc);
```

**Step 3**

### Build the Refresh Instruction

`refreshPriceListIx` returns one instruction that refreshes the listed slots, or `null` if there is nothing to refresh. Slots whose prices are pushed by the oracle provider, such as the Pyth Lazer feeds in slots 0, 1, and 2, can't be refreshed with this instruction and are skipped. If every listed slot is skipped, the result is `null`.

```typescript theme={null}
const ix = await scope.refreshPriceListIx(
    { config: SCOPE_MAINNET_HUBBLE_FEED.configuration },
    TOKENS,
);
if (!ix) console.log(`Nothing to refresh for tokens [${TOKENS}]`);

console.log(`Built refresh ix: program ${ix?.programAddress}, ${ix?.accounts?.length ?? 0} accounts`);
```

> [!NOTE]
>
> The refresh is permissionless: any wallet can pay fees and send it. The Scope program writes the new dated prices to the feed's `OraclePrices` account.

**Step 4**

### Build, Sign, and Send Transaction

Compose the v0 transaction, sign, verify it fits the size limit, then send and confirm.

```typescript theme={null}
const { value: blockhash } = await rpc
    .getLatestBlockhash({ commitment: "finalized" })
    .send();

const transactionMessage = pipe(
    createTransactionMessage({ version: 0 }),
    (m) => setTransactionMessageFeePayerSigner(signer, m),
    (m) => setTransactionMessageLifetimeUsingBlockhash(blockhash, m),
    (m) => appendTransactionMessageInstructions([ix!], m),
);

const signedTransaction = await signTransactionMessageWithSigners(transactionMessage);
assertIsTransactionWithinSizeLimit(signedTransaction);
assertIsTransactionWithBlockhashLifetime(signedTransaction);
const signature = getSignatureFromTransaction(signedTransaction);

await sendAndConfirmTransactionFactory({ rpc, rpcSubscriptions })(signedTransaction, {
    commitment: "confirmed",
    skipPreflight: true,
});

console.log("Refresh successful! Signature:", signature);
```

> [!TIP]
>
> The refresh is complete. The targeted slots now have fresh prices and timestamps on-chain.

#### Full Code Example

```typescript expandable theme={null}
import {
    createSolanaRpc,
    createSolanaRpcSubscriptions,
    pipe,
    createTransactionMessage,
    setTransactionMessageFeePayerSigner,
    setTransactionMessageLifetimeUsingBlockhash,
    appendTransactionMessageInstructions,
    signTransactionMessageWithSigners,
    getSignatureFromTransaction,
    assertIsTransactionWithinSizeLimit,
    sendAndConfirmTransactionFactory,
    assertIsTransactionWithBlockhashLifetime,
} from "@solana/kit";
import { parseKeypairFile } from "@kamino-finance/klend-sdk/dist/utils/signer";
import { Scope, SCOPE_MAINNET_HUBBLE_FEED } from "@kamino-finance/scope-sdk";

const KEYPAIR_FILE = "/path/to/your/keypair.json";
const RPC_ENDPOINT = "https://api.mainnet-beta.solana.com";
const WS_ENDPOINT = "wss://api.mainnet-beta.solana.com";

const TOKENS = [52, 10, 41];

const signer = await parseKeypairFile(KEYPAIR_FILE);
const rpc = createSolanaRpc(RPC_ENDPOINT);
const rpcSubscriptions = createSolanaRpcSubscriptions(WS_ENDPOINT);
const scope = new Scope("mainnet-beta", rpc);

const ix = await scope.refreshPriceListIx(
    { config: SCOPE_MAINNET_HUBBLE_FEED.configuration },
    TOKENS,
);
if (!ix) console.log(`Nothing to refresh for tokens [${TOKENS}]`);

const { value: blockhash } = await rpc
    .getLatestBlockhash({ commitment: "finalized" })
    .send();

const transactionMessage = pipe(
    createTransactionMessage({ version: 0 }),
    (m) => setTransactionMessageFeePayerSigner(signer, m),
    (m) => setTransactionMessageLifetimeUsingBlockhash(blockhash, m),
    (m) => appendTransactionMessageInstructions([ix!], m),
);

const signedTransaction = await signTransactionMessageWithSigners(transactionMessage);
assertIsTransactionWithinSizeLimit(signedTransaction);
assertIsTransactionWithBlockhashLifetime(signedTransaction);
const signature = getSignatureFromTransaction(signedTransaction);

await sendAndConfirmTransactionFactory({ rpc, rpcSubscriptions })(signedTransaction, {
    commitment: "confirmed",
    skipPreflight: true,
});

console.log("Refresh successful! Signature:", signature);
```


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
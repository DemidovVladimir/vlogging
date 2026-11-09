> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Harvest

> Claim all pending rewards from a Kamino farm

## Harvest

Claim every pending reward token accrued on a farm to your wallet in one call.

> [!NOTE]
>
> `claimForUserForFarmAllRewardsIx` walks every reward slot, skips any still under its claim cooldown, and returns one harvest instruction per claimable reward, plus an idempotent ATA-create instruction if the reward token account is missing. It reads on-chain Scope prices itself, so there is nothing to refresh. If the returned array is empty, nothing is past its cooldown to claim.

**Step 1**

### Import Dependencies

Import the packages for Solana RPC communication, Kit transaction building, the keypair loader, and the Farms SDK.

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
    getSignatureFromTransaction,
    assertIsTransactionWithinSizeLimit,
    sendAndConfirmTransactionFactory,
    assertIsTransactionWithBlockhashLifetime,
} from "@solana/kit";
import { parseKeypairFile } from "@kamino-finance/klend-sdk/dist/utils/signer";
import { Farms } from "@kamino-finance/farms-sdk";
```

**Step 2**

### Configure Constants and Initialize

Set the keypair path, RPC endpoints, and target farm. Load the signer and initialize the farms client.

```typescript theme={null}
const KEYPAIR_FILE = "/path/to/your/keypair.json";
const RPC_ENDPOINT = "https://api.mainnet-beta.solana.com";
const WS_ENDPOINT = "wss://api.mainnet-beta.solana.com";

const FARM = address("DXGwU8Ah7v6TBcc9ZjVmFxiLCMPgrxnsj4ZF7F8sWFxi"); // non-delegated farm

const signer = await parseKeypairFile(KEYPAIR_FILE);
const rpc = createSolanaRpc(RPC_ENDPOINT);
const rpcSubscriptions = createSolanaRpcSubscriptions(WS_ENDPOINT);
const farms = new Farms(rpc);
```

**Step 3**

### Build Harvest Instructions

Build one harvest instruction per claimable reward. The payer signs and pays fees; the rewards land in the user's wallet.

```typescript theme={null}
const instructions = await farms.claimForUserForFarmAllRewardsIx(
    signer,         // payer
    signer.address, // user (owner of the position)
    FARM,
    false,          // isDelegated
);
if (instructions.length === 0) console.log("Nothing to claim for", signer.address);
```

> [!NOTE]
>
> Pass `isDelegated: false` for a non-delegated farm. For a delegated klend or kvault farm, pass `true` and the obligation as a delegatee in the optional `delegatees` argument. See [Claim user rewards](https://kamino.com/docs/build/developers/borrow/rewards/claim-user-rewards.md) for the delegated case.

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
    (m) => appendTransactionMessageInstructions(instructions, m),
);

const signedTransaction = await signTransactionMessageWithSigners(transactionMessage);
assertIsTransactionWithinSizeLimit(signedTransaction);
assertIsTransactionWithBlockhashLifetime(signedTransaction);
const signature = getSignatureFromTransaction(signedTransaction);

await sendAndConfirmTransactionFactory({ rpc, rpcSubscriptions })(signedTransaction, {
    commitment: "confirmed",
    skipPreflight: true,
});

console.log("Claim successful! Signature:", signature);
```

> [!TIP]
>
> The harvest is complete. Every reward token past its claim cooldown has been transferred to your wallet.

#### Full Code Example

```typescript expandable theme={null}
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
    getSignatureFromTransaction,
    assertIsTransactionWithinSizeLimit,
    sendAndConfirmTransactionFactory,
    assertIsTransactionWithBlockhashLifetime,
} from "@solana/kit";
import { parseKeypairFile } from "@kamino-finance/klend-sdk/dist/utils/signer";
import { Farms } from "@kamino-finance/farms-sdk";

const KEYPAIR_FILE = "/path/to/your/keypair.json";
const RPC_ENDPOINT = "https://api.mainnet-beta.solana.com";
const WS_ENDPOINT = "wss://api.mainnet-beta.solana.com";

const FARM = address("DXGwU8Ah7v6TBcc9ZjVmFxiLCMPgrxnsj4ZF7F8sWFxi");

const signer = await parseKeypairFile(KEYPAIR_FILE);
const rpc = createSolanaRpc(RPC_ENDPOINT);
const rpcSubscriptions = createSolanaRpcSubscriptions(WS_ENDPOINT);
const farms = new Farms(rpc);

const instructions = await farms.claimForUserForFarmAllRewardsIx(
    signer,
    signer.address,
    FARM,
    false,
);
if (instructions.length === 0) console.log("Nothing to claim for", signer.address);

const { value: blockhash } = await rpc
    .getLatestBlockhash({ commitment: "finalized" })
    .send();

const transactionMessage = pipe(
    createTransactionMessage({ version: 0 }),
    (m) => setTransactionMessageFeePayerSigner(signer, m),
    (m) => setTransactionMessageLifetimeUsingBlockhash(blockhash, m),
    (m) => appendTransactionMessageInstructions(instructions, m),
);

const signedTransaction = await signTransactionMessageWithSigners(transactionMessage);
assertIsTransactionWithinSizeLimit(signedTransaction);
assertIsTransactionWithBlockhashLifetime(signedTransaction);
const signature = getSignatureFromTransaction(signedTransaction);

await sendAndConfirmTransactionFactory({ rpc, rpcSubscriptions })(signedTransaction, {
    commitment: "confirmed",
    skipPreflight: true,
});

console.log("Claim successful! Signature:", signature);
```


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
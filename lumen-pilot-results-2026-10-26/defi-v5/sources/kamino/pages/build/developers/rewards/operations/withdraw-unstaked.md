> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Withdraw

> Withdraw unstaked tokens from a Kamino farm to your wallet

## Withdraw

The second half of unwinding a position. After you [unstake](https://kamino.com/docs/build/developers/rewards/operations/unstake.md) and the farm's withdrawal cooldown elapses, the stake sits as pending withdrawal. This moves those tokens out of the farm vault back to your token account.

> [!NOTE]
>
> This flow requires a non-delegated farm, since the instruction needs the stake token mint. No Scope prices or refresh are needed here, because it moves already-unstaked tokens and does not touch reward accounting. The instruction only succeeds on-chain once the withdrawal cooldown has elapsed; if there is nothing past cooldown, it fails.

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

Set the keypair path, RPC endpoints, target farm, and stake token mint. Load the signer and initialize the farms client.

```typescript theme={null}
const KEYPAIR_FILE = "/path/to/your/keypair.json";
const RPC_ENDPOINT = "https://api.mainnet-beta.solana.com";
const WS_ENDPOINT = "wss://api.mainnet-beta.solana.com";

const FARM = address("DXGwU8Ah7v6TBcc9ZjVmFxiLCMPgrxnsj4ZF7F8sWFxi"); // non-delegated farm
const STAKE_MINT = address("AYUjc3a3QQUiLE6jP7V29UMeUZGADdtiVxhSjoLcqYwr"); // the farm's stake token

const signer = await parseKeypairFile(KEYPAIR_FILE);
const rpc = createSolanaRpc(RPC_ENDPOINT);
const rpcSubscriptions = createSolanaRpcSubscriptions(WS_ENDPOINT);
const farms = new Farms(rpc);
```

**Step 3**

### Build Withdraw Instruction

Resolve the user-state key, then build the withdraw-unstaked instruction. The third argument is the farm address.

```typescript theme={null}
const { key: userState } = await farms.getUserStateKeyForUndelegatedFarm(
    signer.address,
    FARM,
);

const instructions = [
    await farms.withdrawUnstakedDepositIx(signer, userState, FARM, STAKE_MINT),
];
```

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

console.log("Withdraw-unstaked successful! Signature:", signature);
```

> [!TIP]
>
> The withdrawal is complete. Your unstaked tokens have been transferred back to your wallet.

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
const STAKE_MINT = address("AYUjc3a3QQUiLE6jP7V29UMeUZGADdtiVxhSjoLcqYwr");

const signer = await parseKeypairFile(KEYPAIR_FILE);
const rpc = createSolanaRpc(RPC_ENDPOINT);
const rpcSubscriptions = createSolanaRpcSubscriptions(WS_ENDPOINT);
const farms = new Farms(rpc);

const { key: userState } = await farms.getUserStateKeyForUndelegatedFarm(
    signer.address,
    FARM,
);

const instructions = [
    await farms.withdrawUnstakedDepositIx(signer, userState, FARM, STAKE_MINT),
];

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

console.log("Withdraw-unstaked successful! Signature:", signature);
```


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
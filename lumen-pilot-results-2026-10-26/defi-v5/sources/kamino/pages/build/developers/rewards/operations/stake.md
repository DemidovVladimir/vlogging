> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Stake

> Stake share tokens into a Kamino farm

## Stake

Stake a farm's share token to start earning rewards. Refresh the farm (and the user, if a position already exists) so reward accounting is current, then stake.

> [!NOTE]
>
> This flow requires a non-delegated farm. `stakeIx` needs a `stakeTokenMint`, which delegated farms (klend reserve and kvault farms) do not have. The wallet needs SOL for fees plus the farm's stake token to stake.

**Step 1**

### Import Dependencies

Import the packages for Solana RPC communication, Kit transaction building, the Farms SDK, and the keypair loader.

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
import { Farms, fetchFarmState } from "@kamino-finance/farms-sdk";
import { getScopePricesFromFarm } from "@kamino-finance/farms-sdk/dist/utils/option";
import Decimal from "decimal.js";
```

**Step 2**

### Configure Constants and Initialize

Set the keypair path, RPC endpoints, target farm, stake token mint, and amount. Load the signer and initialize the farms client.

```typescript theme={null}
const KEYPAIR_FILE = "/path/to/your/keypair.json";
const RPC_ENDPOINT = "https://api.mainnet-beta.solana.com";
const WS_ENDPOINT = "wss://api.mainnet-beta.solana.com";

const FARM = address("9wSacmF3KBr4HmgncxXeBhDdw4Shi2X9ETAFzWJS6pG6"); // non-delegated farm
const STAKE_MINT = address("3EmfhZ3KUaYdwKZ9CwfGoKRqQqUV1MhSCVL5Ch7szX7e"); // the farm's stake token
const STAKE_AMOUNT = new Decimal(0.02); // amount of shares to stake

const signer = await parseKeypairFile(KEYPAIR_FILE);
const rpc = createSolanaRpc(RPC_ENDPOINT);
const rpcSubscriptions = createSolanaRpcSubscriptions(WS_ENDPOINT);
const farms = new Farms(rpc);
```

**Step 3**

### Load Farm State

Fetch the farm account, read its Scope prices for the refresh instructions, and convert the stake amount to raw token units.

```typescript theme={null}
const { data: farmState } = await fetchFarmState(rpc, FARM);

const scopePrices = getScopePricesFromFarm(farmState);
const decimals = Number(farmState.token.decimals);
const amountLamports = STAKE_AMOUNT.mul(new Decimal(10).pow(decimals));
```

> [!NOTE]
>
> `stakeIx` takes the raw lamport amount (the share amount times 10^decimals). The on-chain program scales it up internally.

**Step 4**

### Build Stake Instructions

Check whether the wallet already has a user-state account, then assemble the instruction list: create the user state if needed, refresh, and stake.

```typescript theme={null}
const existing = await farms
    .getUserStateKeyForUndelegatedFarm(signer.address, FARM)
    .catch(() => null);

const instructions = [
    ...(existing ? [] : [await farms.createNewUserIx(signer, FARM)]),
    await farms.refreshFarmIx(FARM, scopePrices),
    ...(existing ? [await farms.refreshUserIx(existing.key, FARM, scopePrices)] : []),
    await farms.stakeIx(signer, FARM, amountLamports, STAKE_MINT, scopePrices),
];
```

> [!NOTE]
>
> The Farms SDK exposes bare instruction builders that do not bundle a refresh, unlike klend. Prepend `refreshFarmIx` (and `refreshUserIx` for an existing position) so reward accounting is current before you stake. A first-time staker has no user-state account yet, so `createNewUserIx` creates it in the same transaction.

**Step 5**

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

console.log("Stake successful! Signature:", signature);
```

> [!TIP]
>
> The stake is complete. Your shares are staked, and rewards accrue once any deposit warmup period elapses.

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
import { Farms, fetchFarmState } from "@kamino-finance/farms-sdk";
import { getScopePricesFromFarm } from "@kamino-finance/farms-sdk/dist/utils/option";
import Decimal from "decimal.js";

const KEYPAIR_FILE = "/path/to/your/keypair.json";
const RPC_ENDPOINT = "https://api.mainnet-beta.solana.com";
const WS_ENDPOINT = "wss://api.mainnet-beta.solana.com";

const FARM = address("9wSacmF3KBr4HmgncxXeBhDdw4Shi2X9ETAFzWJS6pG6");
const STAKE_MINT = address("3EmfhZ3KUaYdwKZ9CwfGoKRqQqUV1MhSCVL5Ch7szX7e");
const STAKE_AMOUNT = new Decimal(0.02);

const signer = await parseKeypairFile(KEYPAIR_FILE);
const rpc = createSolanaRpc(RPC_ENDPOINT);
const rpcSubscriptions = createSolanaRpcSubscriptions(WS_ENDPOINT);
const farms = new Farms(rpc);

const { data: farmState } = await fetchFarmState(rpc, FARM);

const scopePrices = getScopePricesFromFarm(farmState);
const decimals = Number(farmState.token.decimals);
const amountLamports = STAKE_AMOUNT.mul(new Decimal(10).pow(decimals));

const existing = await farms
    .getUserStateKeyForUndelegatedFarm(signer.address, FARM)
    .catch(() => null);

const instructions = [
    ...(existing ? [] : [await farms.createNewUserIx(signer, FARM)]),
    await farms.refreshFarmIx(FARM, scopePrices),
    ...(existing ? [await farms.refreshUserIx(existing.key, FARM, scopePrices)] : []),
    await farms.stakeIx(signer, FARM, amountLamports, STAKE_MINT, scopePrices),
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

console.log("Stake successful! Signature:", signature);
```


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
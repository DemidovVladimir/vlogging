> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Unstake

> Unstake share tokens from a Kamino farm

## Unstake

Unstaking moves stake from active into pending withdrawal and starts the farm's withdrawal cooldown. After the cooldown elapses, call [Withdraw](https://kamino.com/docs/build/developers/rewards/operations/withdraw-unstaked.md) to move the tokens back to your wallet. Refresh first, then unstake.

> [!NOTE]
>
> This flow requires an existing position on a non-delegated farm. The wallet needs SOL for fees.

**Step 1**

### Import Dependencies

Import the packages for Solana RPC communication, Kit transaction building, and the Farms SDK. `UserState` and `WAD` are used to scale the unstake amount.

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
import { Farms, fetchFarmState, fetchUserState } from "@kamino-finance/farms-sdk";
import { getScopePricesFromFarm } from "@kamino-finance/farms-sdk/dist/utils/option";
import { WAD } from "@kamino-finance/farms-sdk/dist/utils/utils";
import Decimal from "decimal.js";
```

**Step 2**

### Configure Constants and Initialize

Set the keypair path, RPC endpoints, target farm, and amount. Load the signer and initialize the farms client.

```typescript theme={null}
const KEYPAIR_FILE = "/path/to/your/keypair.json";
const RPC_ENDPOINT = "https://api.mainnet-beta.solana.com";
const WS_ENDPOINT = "wss://api.mainnet-beta.solana.com";

const FARM = address("9wSacmF3KBr4HmgncxXeBhDdw4Shi2X9ETAFzWJS6pG6"); // non-delegated farm
const UNSTAKE_AMOUNT = new Decimal(0.02); // amount of shares to unstake

const signer = await parseKeypairFile(KEYPAIR_FILE);
const rpc = createSolanaRpc(RPC_ENDPOINT);
const rpcSubscriptions = createSolanaRpcSubscriptions(WS_ENDPOINT);
const farms = new Farms(rpc);
```

**Step 3**

### Load State and Scale the Amount

Fetch the farm and the user state, then convert the unstake amount to WAD-scaled shares and clamp it to the on-chain active stake.

```typescript theme={null}
const { data: farmState } = await fetchFarmState(rpc, FARM);

const existing = await farms
    .getUserStateKeyForUndelegatedFarm(signer.address, FARM)
    .catch(() => null);
if (!existing) console.log("No position on this farm to unstake.");

const scopePrices = getScopePricesFromFarm(farmState);
const decimals = Number(farmState.token.decimals);

const { data: userState } = await fetchUserState(rpc, existing!.key);
const activeStakeScaled = new Decimal(userState.activeStakeScaled.toString());
const requestedScaled = UNSTAKE_AMOUNT.mul(new Decimal(10).pow(decimals)).mul(WAD);
const amountScaled = Decimal.min(requestedScaled, activeStakeScaled);
```

> [!NOTE]
>
> `unstakeIx` takes WAD-scaled shares, not raw lamports like `stakeIx`. Scale with `UNSTAKE_AMOUNT * 10^decimals * WAD`, then clamp to `userState.activeStakeScaled` so you never request more than is staked. The clamp also handles dust and an "unstake all" request.

**Step 4**

### Build Unstake Instructions

Refresh the farm and user so reward accounting is current, then unstake.

```typescript theme={null}
const instructions = [
    await farms.refreshFarmIx(FARM, scopePrices),
    await farms.refreshUserIx(existing!.key, FARM, scopePrices),
    await farms.unstakeIx(signer, FARM, amountScaled, scopePrices),
];
```

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

console.log("Unstake successful! Signature:", signature);
```

> [!TIP]
>
> The unstake is complete. Your stake is now pending withdrawal and cooling down. Once the farm's withdrawal cooldown elapses, withdraw it back to your wallet.

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
import { Farms, fetchFarmState, fetchUserState } from "@kamino-finance/farms-sdk";
import { getScopePricesFromFarm } from "@kamino-finance/farms-sdk/dist/utils/option";
import { WAD } from "@kamino-finance/farms-sdk/dist/utils/utils";
import Decimal from "decimal.js";

const KEYPAIR_FILE = "/path/to/your/keypair.json";
const RPC_ENDPOINT = "https://api.mainnet-beta.solana.com";
const WS_ENDPOINT = "wss://api.mainnet-beta.solana.com";

const FARM = address("9wSacmF3KBr4HmgncxXeBhDdw4Shi2X9ETAFzWJS6pG6");
const UNSTAKE_AMOUNT = new Decimal(0.02);

const signer = await parseKeypairFile(KEYPAIR_FILE);
const rpc = createSolanaRpc(RPC_ENDPOINT);
const rpcSubscriptions = createSolanaRpcSubscriptions(WS_ENDPOINT);
const farms = new Farms(rpc);

const { data: farmState } = await fetchFarmState(rpc, FARM);

const existing = await farms
    .getUserStateKeyForUndelegatedFarm(signer.address, FARM)
    .catch(() => null);
if (!existing) console.log("No position on this farm to unstake.");

const scopePrices = getScopePricesFromFarm(farmState);
const decimals = Number(farmState.token.decimals);

const { data: userState } = await fetchUserState(rpc, existing!.key);
const activeStakeScaled = new Decimal(userState.activeStakeScaled.toString());
const requestedScaled = UNSTAKE_AMOUNT.mul(new Decimal(10).pow(decimals)).mul(WAD);
const amountScaled = Decimal.min(requestedScaled, activeStakeScaled);

const instructions = [
    await farms.refreshFarmIx(FARM, scopePrices),
    await farms.refreshUserIx(existing!.key, FARM, scopePrices),
    await farms.unstakeIx(signer, FARM, amountScaled, scopePrices),
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

console.log("Unstake successful! Signature:", signature);
```


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
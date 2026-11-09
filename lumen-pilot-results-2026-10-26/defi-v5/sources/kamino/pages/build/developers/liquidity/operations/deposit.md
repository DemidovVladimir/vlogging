> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Deposit

> Deposit into a Kamino liquidity strategy

## Single-Sided Deposit

Deposit a single token. The SDK swaps half of the input into the other side and handles the wSOL ATA wrap/close internally, so the caller only provides the input amount and slippage tolerance.

**Step 1**

### Import Dependencies

Import the required packages for Solana RPC communication, Kamino SDK operations, address lookup table fetching, and Kit transaction building.

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
    compressTransactionMessageUsingAddressLookupTables,
    assertIsTransactionWithinSizeLimit,
} from "@solana/kit";
import type { Address } from "@solana/kit";
import { Kamino } from "@kamino-finance/kliquidity-sdk";
import { parseKeypairFile } from "@kamino-finance/klend-sdk/dist/utils/signer";
import { fetchAllAddressLookupTable } from "@solana-program/address-lookup-table";
import Decimal from "decimal.js";
```

**Step 2**

### Configure Constants and Initialize Kamino

Set the keypair path, RPC endpoints, target strategy, deposit amount, and slippage. Load the signer and initialize the Kamino client.

```typescript theme={null}
const KEYPAIR_FILE = "/path/to/your/keypair.json";
const RPC_ENDPOINT = "https://api.mainnet-beta.solana.com";
const WS_ENDPOINT = "wss://api.mainnet-beta.solana.com";

const STRATEGY = address("CEz5keL9hBCUbtVbmcwenthRMwmZLupxJ6YtYAgzp4ex"); // strategy address
const usdcAmount = new Decimal(2.0);
const slippageBps = new Decimal(100);

const signer = await parseKeypairFile(KEYPAIR_FILE);
const rpc = createSolanaRpc(RPC_ENDPOINT);
const rpcSubscriptions = createSolanaRpcSubscriptions(WS_ENDPOINT);
const kamino = new Kamino("mainnet-beta", rpc);
```

**Step 3**

### Load Strategy State

Fetch the on-chain strategy account so the SDK has current state to build instructions against.

```typescript theme={null}
const strategyState = (await kamino.getStrategiesWithAddresses([STRATEGY]))[0];
if (!strategyState) {
    console.log("Strategy not found:", STRATEGY);
    process.exit(1);
}
```

**Step 4**

### Build Single-Sided Deposit Instructions

Call `singleSidedDepositTokenB` to deposit USDC only. The SDK swaps half the input into SOL using its built-in swap router and handles the wSOL ATA wrap/close internally.

```typescript theme={null}
const { instructions, lookupTablesAddresses } =
    await kamino.singleSidedDepositTokenB(
        { address: STRATEGY, strategy: strategyState.strategy },
        usdcAmount,
        signer,
        slippageBps,
    );
```

**Step 5**

### Resolve Address Lookup Tables

Collect every account referenced by the deposit instructions, fetch the minimal LUT set from the Kamino API, dedupe with the swap-router LUTs returned by the SDK, then load each LUT account.

> [!NOTE]
>
> The strategy's own LUT is intentionally excluded — for this strategy it contains stale entries that resolve into the deposit instruction's `token_infos` slot. The swap-router LUTs from the SDK plus the minimal LUT set from Kamino's API are sufficient.

```typescript theme={null}
const allAddresses = new Set<string>();
for (const ix of instructions) {
    allAddresses.add(ix.programAddress.toString());
    for (const acc of ix.accounts ?? []) allAddresses.add(acc.address.toString());
}

const lutResp = await fetch("https://api.kamino.finance/luts/find-minimal", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ addresses: Array.from(allAddresses) }),
});
if (!lutResp.ok) {
    console.log(
        "luts/find-minimal failed:",
        lutResp.status,
        await lutResp.text(),
    );
    process.exit(1);
}
const { lutAddresses: minimalLutAddresses } = (await lutResp.json()) as {
    lutAddresses: string[];
};

const dedupedLutAddresses = Array.from(
    new Set(
        [
            ...lookupTablesAddresses,
            ...minimalLutAddresses.map((a) => address(a)),
        ].map((a) => a.toString()),
    ),
).map((a) => address(a));

const lutAccounts = await fetchAllAddressLookupTable(rpc, dedupedLutAddresses);
const lutsByAddress: Record<Address, Address[]> = {};
for (const acc of lutAccounts) {
    lutsByAddress[acc.address] = acc.data.addresses;
}
```

**Step 6**

### Build, Sign, and Send Transaction

Compose the v0 transaction with LUT compression, sign, verify it fits the size limit, then send and confirm.

```typescript theme={null}
const { value: latestBlockhash } = await rpc
    .getLatestBlockhash({ commitment: "finalized" })
    .send();

const transactionMessage = pipe(
    createTransactionMessage({ version: 0 }),
    (tx) => setTransactionMessageFeePayerSigner(signer, tx),
    (tx) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
    (tx) => appendTransactionMessageInstructions(instructions, tx),
    (tx) => compressTransactionMessageUsingAddressLookupTables(tx, lutsByAddress),
);

const signedTransaction =
    await signTransactionMessageWithSigners(transactionMessage);
assertIsTransactionWithinSizeLimit(signedTransaction);
const signature = getSignatureFromTransaction(signedTransaction);

await sendAndConfirmTransactionFactory({ rpc, rpcSubscriptions })(
    signedTransaction,
    {
        commitment: "confirmed",
        skipPreflight: true,
    },
);

console.log(
    "Strategy single-sided USDC deposit successful! Signature:",
    signature,
);
```

> [!TIP]
>
> The deposit is complete. Your USDC has been swapped and deposited into the strategy.

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
    sendAndConfirmTransactionFactory,
    getSignatureFromTransaction,
    compressTransactionMessageUsingAddressLookupTables,
    assertIsTransactionWithinSizeLimit,
} from "@solana/kit";
import type { Address } from "@solana/kit";
import { Kamino } from "@kamino-finance/kliquidity-sdk";
import { parseKeypairFile } from "@kamino-finance/klend-sdk/dist/utils/signer";
import { fetchAllAddressLookupTable } from "@solana-program/address-lookup-table";
import Decimal from "decimal.js";

const KEYPAIR_FILE = "/path/to/your/keypair.json";
const RPC_ENDPOINT = "https://api.mainnet-beta.solana.com";
const WS_ENDPOINT = "wss://api.mainnet-beta.solana.com";

const STRATEGY = address("CEz5keL9hBCUbtVbmcwenthRMwmZLupxJ6YtYAgzp4ex");
const usdcAmount = new Decimal(2.0);
const slippageBps = new Decimal(100);

const signer = await parseKeypairFile(KEYPAIR_FILE);
const rpc = createSolanaRpc(RPC_ENDPOINT);
const rpcSubscriptions = createSolanaRpcSubscriptions(WS_ENDPOINT);
const kamino = new Kamino("mainnet-beta", rpc);

const strategyState = (await kamino.getStrategiesWithAddresses([STRATEGY]))[0];
if (!strategyState) {
    console.log("Strategy not found:", STRATEGY);
    process.exit(1);
}

const { instructions, lookupTablesAddresses } =
    await kamino.singleSidedDepositTokenB(
        { address: STRATEGY, strategy: strategyState.strategy },
        usdcAmount,
        signer,
        slippageBps,
    );

const allAddresses = new Set<string>();
for (const ix of instructions) {
    allAddresses.add(ix.programAddress.toString());
    for (const acc of ix.accounts ?? []) allAddresses.add(acc.address.toString());
}

const lutResp = await fetch("https://api.kamino.finance/luts/find-minimal", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ addresses: Array.from(allAddresses) }),
});
if (!lutResp.ok) {
    console.log(
        "luts/find-minimal failed:",
        lutResp.status,
        await lutResp.text(),
    );
    process.exit(1);
}
const { lutAddresses: minimalLutAddresses } = (await lutResp.json()) as {
    lutAddresses: string[];
};

const dedupedLutAddresses = Array.from(
    new Set(
        [
            ...lookupTablesAddresses,
            ...minimalLutAddresses.map((a) => address(a)),
        ].map((a) => a.toString()),
    ),
).map((a) => address(a));

const lutAccounts = await fetchAllAddressLookupTable(rpc, dedupedLutAddresses);
const lutsByAddress: Record<Address, Address[]> = {};
for (const acc of lutAccounts) {
    lutsByAddress[acc.address] = acc.data.addresses;
}

const { value: latestBlockhash } = await rpc
    .getLatestBlockhash({ commitment: "finalized" })
    .send();

const transactionMessage = pipe(
    createTransactionMessage({ version: 0 }),
    (tx) => setTransactionMessageFeePayerSigner(signer, tx),
    (tx) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
    (tx) => appendTransactionMessageInstructions(instructions, tx),
    (tx) => compressTransactionMessageUsingAddressLookupTables(tx, lutsByAddress),
);

const signedTransaction =
    await signTransactionMessageWithSigners(transactionMessage);
assertIsTransactionWithinSizeLimit(signedTransaction);
const signature = getSignatureFromTransaction(signedTransaction);

await sendAndConfirmTransactionFactory({ rpc, rpcSubscriptions })(
    signedTransaction,
    {
        commitment: "confirmed",
        skipPreflight: true,
    },
);

console.log(
    "Strategy single-sided USDC deposit successful! Signature:",
    signature,
);
```

## Two-Sided Deposit

Provide both Token A and Token B amounts directly. `kamino.deposit()` consumes whichever side hits the strategy's current ratio first; any surplus on the unmatched side stays in the user's ATA after the deposit runs.

> [!NOTE]
>
> `kamino.deposit()` returns a single instruction with no auto-swap and no native-SOL handling. The caller is responsible for ATA setup and wrapping SOL into wSOL before the deposit runs.

**Step 1**

### Import Dependencies

Import the standard Kamino + Kit packages, plus the system and token program helpers needed to wrap native SOL and close the wSOL ATA.

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
    compressTransactionMessageUsingAddressLookupTables,
    assertIsTransactionWithinSizeLimit,
} from "@solana/kit";
import type { Address } from "@solana/kit";
import {
    Kamino,
    createComputeUnitLimitIx,
    getAssociatedTokenAddressAndAccount,
} from "@kamino-finance/kliquidity-sdk";
import { parseKeypairFile } from "@kamino-finance/klend-sdk/dist/utils/signer";
import { fetchAllAddressLookupTable } from "@solana-program/address-lookup-table";
import { getTransferSolInstruction } from "@solana-program/system";
import {
    getSyncNativeInstruction,
    getCloseAccountInstruction,
} from "@solana-program/token";
import Decimal from "decimal.js";
```

**Step 2**

### Configure Constants and Initialize Kamino

Set the keypair path, RPC endpoints, target strategy, and per-side deposit amounts. Load the signer and initialize the Kamino client.

```typescript theme={null}
const KEYPAIR_FILE = "/path/to/your/keypair.json";
const RPC_ENDPOINT = "https://api.mainnet-beta.solana.com";
const WS_ENDPOINT = "wss://api.mainnet-beta.solana.com";

const STRATEGY = address("5EfeGn1h7m6Rx9mGEmamDoxMtdhRmUh2N9fYRiDQqteS");

const solAmount = new Decimal(0.05);
const usdcAmount = new Decimal(1.0);

const signer = await parseKeypairFile(KEYPAIR_FILE);
const rpc = createSolanaRpc(RPC_ENDPOINT);
const rpcSubscriptions = createSolanaRpcSubscriptions(WS_ENDPOINT);
const kamino = new Kamino("mainnet-beta", rpc);
```

> [!NOTE]
>
> This example uses a SOL/USDC strategy where Token A is wSOL and Token B is USDC. Pick a strategy from the live list (`status=LIVE` on the Kamino API) that is currently in-range — the closer the pool price is to the middle of the band, the more of both inputs the deposit consumes.

**Step 3**

### Load Strategy State

Fetch the on-chain strategy account so the SDK has current state to build instructions against.

```typescript theme={null}
const strategyState = (await kamino.getStrategiesWithAddresses([STRATEGY]))[0];
if (!strategyState) {
    console.log("Strategy not found:", STRATEGY);
    process.exit(1);
}
const strategyWithAddress = {
    strategy: strategyState.strategy,
    address: STRATEGY,
};
```

**Step 4**

### Resolve User Token Accounts

Compute the user's associated token accounts for shares, Token A, and Token B. Build creation instructions for any that don't already exist.

```typescript theme={null}
const [sharesAta, sharesMintData] = await getAssociatedTokenAddressAndAccount(
    rpc,
    strategyState.strategy.sharesMint,
    signer.address,
);
const [tokenAAta, tokenAData] = await getAssociatedTokenAddressAndAccount(
    rpc,
    strategyState.strategy.tokenAMint,
    signer.address,
);
const [tokenBAta, tokenBData] = await getAssociatedTokenAddressAndAccount(
    rpc,
    strategyState.strategy.tokenBMint,
    signer.address,
);

const ataIxs =
    await kamino.getCreateAssociatedTokenAccountInstructionsIfNotExist(
        signer,
        strategyWithAddress,
        tokenAData,
        tokenAAta,
        tokenBData,
        tokenBAta,
        sharesMintData,
        sharesAta,
    );
```

**Step 5**

### Wrap Native SOL

Transfer lamports into the wSOL ATA, then `syncNative` so the SPL token program reflects the new balance. wSOL has 9 decimals.

```typescript theme={null}
const solLamports = BigInt(solAmount.mul(1_000_000_000).ceil().toString());
const wrapIxs = [
    getTransferSolInstruction({
        source: signer,
        destination: tokenAAta,
        amount: solLamports,
    }),
    getSyncNativeInstruction({ account: tokenAAta }),
];
```

> [!NOTE]
>
> The lamport amount is rounded up so the wrapped balance never under-funds the deposit by a lamport. Any surplus is recovered when the wSOL ATA is closed at the end of the transaction.

**Step 6**

### Build Two-Sided Deposit Instructions

Build the deposit instruction and the wSOL ATA close instruction, then assemble the final instruction list.

```typescript theme={null}
const depositIx = await kamino.deposit(
    strategyWithAddress,
    solAmount,
    usdcAmount,
    signer,
);

const closeWsolIx = getCloseAccountInstruction({
    account: tokenAAta,
    destination: signer.address,
    owner: signer,
});

const instructions = [
    createComputeUnitLimitIx(1_400_000),
    ...ataIxs,
    ...wrapIxs,
    depositIx,
    closeWsolIx,
];
```

> [!NOTE]
>
> Closing the wSOL ATA at the end recovers the rounding-up surplus and the ATA rent.

**Step 7**

### Resolve Address Lookup Tables

Collect every account referenced by the deposit instructions, fetch the minimal LUT set from the Kamino API, then load each LUT account.

> [!NOTE]
>
> The strategy's own LUT is intentionally excluded — for this strategy it contains stale entries that cause `AccountOwnedByWrongProgram`. The minimal LUT set from Kamino's API is sufficient.

```typescript theme={null}
const allAddresses = new Set<string>();
for (const ix of instructions) {
    allAddresses.add(ix.programAddress.toString());
    for (const acc of ix.accounts ?? []) allAddresses.add(acc.address.toString());
}

const lutResp = await fetch("https://api.kamino.finance/luts/find-minimal", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ addresses: Array.from(allAddresses) }),
});
if (!lutResp.ok) {
    console.log(
        "luts/find-minimal failed:",
        lutResp.status,
        await lutResp.text(),
    );
    process.exit(1);
}
const { lutAddresses: minimalLutAddresses } = (await lutResp.json()) as {
    lutAddresses: string[];
};

const dedupedLutAddresses = Array.from(new Set(minimalLutAddresses)).map((a) =>
    address(a),
);

const lutAccounts = await fetchAllAddressLookupTable(rpc, dedupedLutAddresses);
const lutsByAddress: Record<Address, Address[]> = {};
for (const acc of lutAccounts) {
    lutsByAddress[acc.address] = acc.data.addresses;
}
```

**Step 8**

### Build, Sign, and Send Transaction

Compose the v0 transaction with LUT compression, sign, verify it fits the size limit, then send and confirm.

```typescript theme={null}
const { value: latestBlockhash } = await rpc
    .getLatestBlockhash({ commitment: "finalized" })
    .send();

const transactionMessage = pipe(
    createTransactionMessage({ version: 0 }),
    (tx) => setTransactionMessageFeePayerSigner(signer, tx),
    (tx) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
    (tx) => appendTransactionMessageInstructions(instructions, tx),
    (tx) => compressTransactionMessageUsingAddressLookupTables(tx, lutsByAddress),
);

const signedTransaction =
    await signTransactionMessageWithSigners(transactionMessage);
assertIsTransactionWithinSizeLimit(signedTransaction);
const signature = getSignatureFromTransaction(signedTransaction);

await sendAndConfirmTransactionFactory({ rpc, rpcSubscriptions })(
    signedTransaction,
    {
        commitment: "confirmed",
        skipPreflight: true,
    },
);

console.log(
    "Strategy two-sided deposit successful! Signature:",
    signature,
);
```

> [!TIP]
>
> The two-sided deposit is complete. Both SOL and USDC have been deposited at the strategy's current ratio, with any surplus on the unmatched side returned to your wallet.

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
    sendAndConfirmTransactionFactory,
    getSignatureFromTransaction,
    compressTransactionMessageUsingAddressLookupTables,
    assertIsTransactionWithinSizeLimit,
} from "@solana/kit";
import type { Address } from "@solana/kit";
import {
    Kamino,
    createComputeUnitLimitIx,
    getAssociatedTokenAddressAndAccount,
} from "@kamino-finance/kliquidity-sdk";
import { parseKeypairFile } from "@kamino-finance/klend-sdk/dist/utils/signer";
import { fetchAllAddressLookupTable } from "@solana-program/address-lookup-table";
import { getTransferSolInstruction } from "@solana-program/system";
import {
    getSyncNativeInstruction,
    getCloseAccountInstruction,
} from "@solana-program/token";
import Decimal from "decimal.js";

const KEYPAIR_FILE = "/path/to/your/keypair.json";
const RPC_ENDPOINT = "https://api.mainnet-beta.solana.com";
const WS_ENDPOINT = "wss://api.mainnet-beta.solana.com";

const STRATEGY = address("5EfeGn1h7m6Rx9mGEmamDoxMtdhRmUh2N9fYRiDQqteS");

const solAmount = new Decimal(0.05);
const usdcAmount = new Decimal(1.0);

const signer = await parseKeypairFile(KEYPAIR_FILE);
const rpc = createSolanaRpc(RPC_ENDPOINT);
const rpcSubscriptions = createSolanaRpcSubscriptions(WS_ENDPOINT);
const kamino = new Kamino("mainnet-beta", rpc);

const strategyState = (await kamino.getStrategiesWithAddresses([STRATEGY]))[0];
if (!strategyState) {
    console.log("Strategy not found:", STRATEGY);
    process.exit(1);
}
const strategyWithAddress = {
    strategy: strategyState.strategy,
    address: STRATEGY,
};

const [sharesAta, sharesMintData] = await getAssociatedTokenAddressAndAccount(
    rpc,
    strategyState.strategy.sharesMint,
    signer.address,
);
const [tokenAAta, tokenAData] = await getAssociatedTokenAddressAndAccount(
    rpc,
    strategyState.strategy.tokenAMint,
    signer.address,
);
const [tokenBAta, tokenBData] = await getAssociatedTokenAddressAndAccount(
    rpc,
    strategyState.strategy.tokenBMint,
    signer.address,
);

const ataIxs =
    await kamino.getCreateAssociatedTokenAccountInstructionsIfNotExist(
        signer,
        strategyWithAddress,
        tokenAData,
        tokenAAta,
        tokenBData,
        tokenBAta,
        sharesMintData,
        sharesAta,
    );

const solLamports = BigInt(solAmount.mul(1_000_000_000).ceil().toString());
const wrapIxs = [
    getTransferSolInstruction({
        source: signer,
        destination: tokenAAta,
        amount: solLamports,
    }),
    getSyncNativeInstruction({ account: tokenAAta }),
];

const depositIx = await kamino.deposit(
    strategyWithAddress,
    solAmount,
    usdcAmount,
    signer,
);

const closeWsolIx = getCloseAccountInstruction({
    account: tokenAAta,
    destination: signer.address,
    owner: signer,
});

const instructions = [
    createComputeUnitLimitIx(1_400_000),
    ...ataIxs,
    ...wrapIxs,
    depositIx,
    closeWsolIx,
];

const allAddresses = new Set<string>();
for (const ix of instructions) {
    allAddresses.add(ix.programAddress.toString());
    for (const acc of ix.accounts ?? []) allAddresses.add(acc.address.toString());
}

const lutResp = await fetch("https://api.kamino.finance/luts/find-minimal", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ addresses: Array.from(allAddresses) }),
});
if (!lutResp.ok) {
    console.log(
        "luts/find-minimal failed:",
        lutResp.status,
        await lutResp.text(),
    );
    process.exit(1);
}
const { lutAddresses: minimalLutAddresses } = (await lutResp.json()) as {
    lutAddresses: string[];
};

const dedupedLutAddresses = Array.from(new Set(minimalLutAddresses)).map((a) =>
    address(a),
);

const lutAccounts = await fetchAllAddressLookupTable(rpc, dedupedLutAddresses);
const lutsByAddress: Record<Address, Address[]> = {};
for (const acc of lutAccounts) {
    lutsByAddress[acc.address] = acc.data.addresses;
}

const { value: latestBlockhash } = await rpc
    .getLatestBlockhash({ commitment: "finalized" })
    .send();

const transactionMessage = pipe(
    createTransactionMessage({ version: 0 }),
    (tx) => setTransactionMessageFeePayerSigner(signer, tx),
    (tx) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
    (tx) => appendTransactionMessageInstructions(instructions, tx),
    (tx) => compressTransactionMessageUsingAddressLookupTables(tx, lutsByAddress),
);

const signedTransaction =
    await signTransactionMessageWithSigners(transactionMessage);
assertIsTransactionWithinSizeLimit(signedTransaction);
const signature = getSignatureFromTransaction(signedTransaction);

await sendAndConfirmTransactionFactory({ rpc, rpcSubscriptions })(
    signedTransaction,
    {
        commitment: "confirmed",
        skipPreflight: true,
    },
);

console.log(
    "Strategy two-sided deposit successful! Signature:",
    signature,
);
```


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
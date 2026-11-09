> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Withdraw

> Withdraw all shares from a Kamino liquidity strategy

## Withdraw

Redeem a position to receive a proportional share of the underlying assets, including accrued fees and rewards.

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
import {
    Kamino,
    createComputeUnitLimitIx,
    getAssociatedTokenAddressAndAccount,
} from "@kamino-finance/kliquidity-sdk";
import { parseKeypairFile } from "@kamino-finance/klend-sdk/dist/utils/signer";
import { fetchAllAddressLookupTable } from "@solana-program/address-lookup-table";
```

**Step 2**

### Configure Constants and Initialize Kamino

Set the keypair path, RPC endpoints, and target strategy. Load the signer and initialize the Kamino client.

```typescript theme={null}
const KEYPAIR_FILE = "/path/to/your/keypair.json";
const RPC_ENDPOINT = "https://api.mainnet-beta.solana.com";
const WS_ENDPOINT = "wss://api.mainnet-beta.solana.com";

const STRATEGY = address("CEz5keL9hBCUbtVbmcwenthRMwmZLupxJ6YtYAgzp4ex"); // strategy address

const signer = await parseKeypairFile(KEYPAIR_FILE);
const rpc = createSolanaRpc(RPC_ENDPOINT);
const rpcSubscriptions = createSolanaRpcSubscriptions(WS_ENDPOINT);
const kamino = new Kamino("mainnet-beta", rpc);
```

**Step 3**

### Load Strategy State

Fetch the strategy account so the SDK has the current state and token mints.

```typescript theme={null}
const strategy = await kamino.getStrategyByAddress(STRATEGY);
if (!strategy) {
    console.log("Strategy not found:", STRATEGY);
    process.exit(1);
}
const strategyWithAddress = { strategy, address: STRATEGY };
```

**Step 4**

### Resolve User Token Accounts

Compute the user's associated token accounts for shares, Token A, and Token B. Build creation instructions for any that don't already exist.

```typescript theme={null}
const [sharesAta, sharesMintData] = await getAssociatedTokenAddressAndAccount(
    rpc,
    strategy.sharesMint,
    signer.address,
);
const [tokenAAta, tokenAData] = await getAssociatedTokenAddressAndAccount(
    rpc,
    strategy.tokenAMint,
    signer.address,
);
const [tokenBAta, tokenBData] = await getAssociatedTokenAddressAndAccount(
    rpc,
    strategy.tokenBMint,
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

### Build Withdraw All Shares Instructions

Call `withdrawAllShares` to build the withdraw bundle, then compose the full instruction list with a compute unit limit, ATA creations, prerequisites, the withdraw, and the optional shares ATA close.

```typescript theme={null}
const bundle = await kamino.withdrawAllShares(strategyWithAddress, signer);
if (!bundle) {
    console.log("No shares to withdraw");
    process.exit(0);
}

const instructions = [
    createComputeUnitLimitIx(1_400_000),
    ...ataIxs,
    ...bundle.prerequisiteIxs,
    bundle.withdrawIx,
    ...(bundle.closeSharesAtaIx ? [bundle.closeSharesAtaIx] : []),
];
```

**Step 6**

### Resolve Address Lookup Tables

Collect every account referenced by the withdraw instructions, fetch the minimal LUT set from the Kamino API, then load each LUT account.

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

**Step 7**

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

console.log("Strategy withdraw-all successful! Signature:", signature);
```

> [!TIP]
>
> The withdrawal is complete. Token A and Token B have been transferred to your ATAs.

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

const KEYPAIR_FILE = "/path/to/your/keypair.json";
const RPC_ENDPOINT = "https://api.mainnet-beta.solana.com";
const WS_ENDPOINT = "wss://api.mainnet-beta.solana.com";

const STRATEGY = address("CEz5keL9hBCUbtVbmcwenthRMwmZLupxJ6YtYAgzp4ex");

const signer = await parseKeypairFile(KEYPAIR_FILE);
const rpc = createSolanaRpc(RPC_ENDPOINT);
const rpcSubscriptions = createSolanaRpcSubscriptions(WS_ENDPOINT);
const kamino = new Kamino("mainnet-beta", rpc);

const strategy = await kamino.getStrategyByAddress(STRATEGY);
if (!strategy) {
    console.log("Strategy not found:", STRATEGY);
    process.exit(1);
}
const strategyWithAddress = { strategy, address: STRATEGY };

const [sharesAta, sharesMintData] = await getAssociatedTokenAddressAndAccount(
    rpc,
    strategy.sharesMint,
    signer.address,
);
const [tokenAAta, tokenAData] = await getAssociatedTokenAddressAndAccount(
    rpc,
    strategy.tokenAMint,
    signer.address,
);
const [tokenBAta, tokenBData] = await getAssociatedTokenAddressAndAccount(
    rpc,
    strategy.tokenBMint,
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

const bundle = await kamino.withdrawAllShares(strategyWithAddress, signer);
if (!bundle) {
    console.log("No shares to withdraw");
    process.exit(0);
}

const instructions = [
    createComputeUnitLimitIx(1_400_000),
    ...ataIxs,
    ...bundle.prerequisiteIxs,
    bundle.withdrawIx,
    ...(bundle.closeSharesAtaIx ? [bundle.closeSharesAtaIx] : []),
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

console.log("Strategy withdraw-all successful! Signature:", signature);
```


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
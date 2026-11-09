> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Repay and Withdraw

> Repay borrowed assets and withdraw your collateral

## Repay Debt

Repay borrowed assets to improve your position health.

**Step 1**

### Import Dependencies

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
  assertIsTransactionWithinSizeLimit,
  sendAndConfirmTransactionFactory,
  getSignatureFromTransaction,
} from '@solana/kit';
import {
  KaminoMarket,
  KaminoAction,
  VanillaObligation,
  PROGRAM_ID,
  getCurrentLedgerInstant,
  getMedianSlotDurationInMsFromLastEpochs,
} from '@kamino-finance/klend-sdk';
import { parseKeypairFile } from '@kamino-finance/klend-sdk/dist/utils/signer.js';
import BN from 'bn.js';
```

**Step 2**

### Load Market and Initialize RPC

```typescript theme={null}
const KEYPAIR_FILE = '/path/to/your/keypair.json';
const signer = await parseKeypairFile(KEYPAIR_FILE);

const rpc = createSolanaRpc('https://api.mainnet-beta.solana.com');
const rpcSubscriptions = createSolanaRpcSubscriptions('wss://api.mainnet-beta.solana.com');
const marketPubkey = address('7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF'); // SOL/BTC Market

const market = await KaminoMarket.load(rpc, marketPubkey, await getMedianSlotDurationInMsFromLastEpochs());
```

**Step 3**

### Load the Obligation

Load the wallet's borrow position so the SDK refreshes every reserve it uses.

```typescript theme={null}
const obligation = await market!.getObligationByWallet(signer.address, new VanillaObligation(PROGRAM_ID));

if (!obligation) {
  console.log('No borrow position found for', signer.address);
}
```

**Step 4**

### Build Repay Instructions

Repay part of the USDT loan from the USDT in the wallet.

```typescript theme={null}
const usdtMint = address('Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB');
const usdtReserve = market!.getExistingFloatRateReserveByMint(usdtMint);

const repayAction = await KaminoAction.buildRepayTxns({
  kaminoMarket: market!,
  amount: new BN(1_000_000),
  reserveAddress: usdtReserve.address,
  owner: signer,
  obligation: obligation!,
  useV2Ixs: true,
  scopeRefreshConfig: undefined,
  currentLedgerInstant: await getCurrentLedgerInstant(rpc),
});
```

> [!TIP]
>
> To repay the whole loan including accrued interest, pass `new BN(U64_MAX)` as the amount (`U64_MAX` is exported by the SDK). The program repays the exact debt, so no dust is left.

**Step 5**

### Build the Transaction

```typescript theme={null}
const { value: latestBlockhash } = await rpc.getLatestBlockhash({ commitment: 'finalized' }).send();

const transactionMessage = pipe(
  createTransactionMessage({ version: 0 }),
  (tx) => setTransactionMessageFeePayerSigner(signer, tx),
  (tx) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
  (tx) => appendTransactionMessageInstructions(KaminoAction.actionToIxs(repayAction), tx)
);
```

**Step 6**

### Sign and Send

```typescript theme={null}
const signedTransaction = await signTransactionMessageWithSigners(transactionMessage);
assertIsTransactionWithinSizeLimit(signedTransaction);

await sendAndConfirmTransactionFactory({ rpc, rpcSubscriptions })(signedTransaction, {
  commitment: 'confirmed',
  skipPreflight: true,
});

console.log('Repay successful! Signature:', getSignatureFromTransaction(signedTransaction));
```

> [!TIP]
>
> The debt in the borrow position is reduced.

## Withdraw Collateral

Withdraw collateral from your obligation.

**Step 1**

### Import Dependencies

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
  assertIsTransactionWithinSizeLimit,
  sendAndConfirmTransactionFactory,
  getSignatureFromTransaction,
} from '@solana/kit';
import {
  KaminoMarket,
  KaminoAction,
  VanillaObligation,
  PROGRAM_ID,
  getCurrentLedgerInstant,
  getMedianSlotDurationInMsFromLastEpochs,
} from '@kamino-finance/klend-sdk';
import { parseKeypairFile } from '@kamino-finance/klend-sdk/dist/utils/signer.js';
import BN from 'bn.js';
```

**Step 2**

### Load Market and Initialize RPC

```typescript theme={null}
const KEYPAIR_FILE = '/path/to/your/keypair.json';
const signer = await parseKeypairFile(KEYPAIR_FILE);

const rpc = createSolanaRpc('https://api.mainnet-beta.solana.com');
const rpcSubscriptions = createSolanaRpcSubscriptions('wss://api.mainnet-beta.solana.com');
const marketPubkey = address('7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF'); // SOL/BTC Market

const market = await KaminoMarket.load(rpc, marketPubkey, await getMedianSlotDurationInMsFromLastEpochs());
```

**Step 3**

### Load the Obligation

Load the wallet's borrow position so the SDK refreshes every reserve it uses.

```typescript theme={null}
const obligation = await market!.getObligationByWallet(signer.address, new VanillaObligation(PROGRAM_ID));

if (!obligation) {
  console.log('No borrow position found for', signer.address);
}
```

**Step 4**

### Build Withdraw Instructions

Withdraw USDC collateral from the borrow position.

```typescript theme={null}
const usdcMint = address('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
const usdcReserve = market!.getExistingFloatRateReserveByMint(usdcMint);

const withdrawAction = await KaminoAction.buildWithdrawTxns({
  kaminoMarket: market!,
  amount: new BN(1_000_000),
  reserveAddress: usdcReserve.address,
  owner: signer,
  obligation: obligation!,
  useV2Ixs: true,
  scopeRefreshConfig: undefined,
  currentLedgerInstant: await getCurrentLedgerInstant(rpc),
});
```

> [!TIP]
>
> With open borrows, the withdrawal must keep the position under its borrow limit. To withdraw all of a deposit, pass `new BN(U64_MAX)` as the amount.

**Step 5**

### Build the Transaction

```typescript theme={null}
const { value: latestBlockhash } = await rpc.getLatestBlockhash({ commitment: 'finalized' }).send();

const transactionMessage = pipe(
  createTransactionMessage({ version: 0 }),
  (tx) => setTransactionMessageFeePayerSigner(signer, tx),
  (tx) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
  (tx) => appendTransactionMessageInstructions(KaminoAction.actionToIxs(withdrawAction), tx)
);
```

**Step 6**

### Sign and Send

```typescript theme={null}
const signedTransaction = await signTransactionMessageWithSigners(transactionMessage);
assertIsTransactionWithinSizeLimit(signedTransaction);

await sendAndConfirmTransactionFactory({ rpc, rpcSubscriptions })(signedTransaction, {
  commitment: 'confirmed',
  skipPreflight: true,
});

console.log('Withdraw successful! Signature:', getSignatureFromTransaction(signedTransaction));
```

> [!TIP]
>
> The collateral is back in the wallet.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
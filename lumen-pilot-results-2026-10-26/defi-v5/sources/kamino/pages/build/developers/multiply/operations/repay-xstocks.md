> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Multiply Repay with xStocks

> Repay debt on leveraged xStocks positions to reduce leverage and lower liquidation risk

Repaying debt on a multiply position reduces your outstanding debt balance, lowers your LTV (Loan-to-Value) ratio, and improves position health. This example shows how to repay USDC debt on a TSLAx multiply position using the Klend SDK.

## Multiply Repay with xStocks

Repay debt on a TSLAx multiply position to reduce leverage and improve position health.

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
  MultiplyObligation,
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
const marketPubkey = address('5wJeMrUYECGq41fxRESKALVcHnNX26TAWy4W98yULsua'); // xStocks Market

const market = await KaminoMarket.load(rpc, marketPubkey, await getMedianSlotDurationInMsFromLastEpochs());
```

**Step 3**

### Load the Multiply Obligation

A Multiply position is its own obligation, addressed by the collateral and debt mints.

```typescript theme={null}
const collMint = address('XsDoVfqeBukxuZHWhdvWHBhgEHjGNst4MLodqsJHzoB'); // TSLAx
const debtMint = address('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'); // USDC

const obligation = await market!.getObligationByWallet(signer.address, new MultiplyObligation(collMint, debtMint, PROGRAM_ID));

if (!obligation) {
  console.log('No Multiply position found for', signer.address);
}
```

**Step 4**

### Build Repay Instructions

Repay USDC debt on the Multiply position from the USDC in the wallet.

```typescript theme={null}
const debtReserve = market!.getExistingFloatRateReserveByMint(debtMint);

const repayAction = await KaminoAction.buildRepayTxns({
  kaminoMarket: market!,
  amount: new BN(5_000_000),
  reserveAddress: debtReserve.address,
  owner: signer,
  obligation: obligation!,
  useV2Ixs: true,
  scopeRefreshConfig: undefined,
  currentLedgerInstant: await getCurrentLedgerInstant(rpc),
});
```

> [!TIP]
>
> To repay all the debt, pass `new BN(U64_MAX)` as the amount (`U64_MAX` is exported by the SDK); the wallet needs the full debt in USDC. To repay by selling collateral instead, use [Repay with Collateral](https://kamino.com/docs/build/developers/multiply/operations/repay-collateral.md).

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

console.log('Multiply repay successful! Signature:', getSignatureFromTransaction(signedTransaction));
```

> [!TIP]
>
> The USDC debt is reduced, lowering the position's LTV and leverage.

### Borrow and Multiply SDK Methods

| Method | Operation | When to Use |
| - | - | - |
| `getDepositWithLeverageIxs` | Open position or add collateral | Creating or adding to a leveraged position |
| `buildRepayTxns` | Repay with wallet funds | Reducing debt using USDC, SOL, etc. from wallet |
| `buildWithdrawTxns` | Withdraw collateral | Withdrawing collateral while the position stays under its borrow limit |
| `getWithdrawWithLeverageIxs` | Shrink the position and withdraw | Take value out while keeping the position's LTV; leverage stays the same |
| `getRepayWithCollIxs` | Repay debt with collateral | Sell collateral to repay debt without withdrawing (value stays in position) |

> [!NOTE]
>
> **Multiply operations** use `MultiplyObligation`. **Vanilla operations** use `VanillaObligation`. The obligation type determines which PDA is derived for your position.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Redeem cTokens

> Redeem cTokens to receive the underlying asset plus earned interest

> [!NOTE]
>
> Redeem cTokens (collateral tokens) to receive the underlying asset plus any accrued interest. This process burns your cTokens and returns the deposited assets along with earned yield.

## Redeeming cTokens

Burn cTokens to withdraw your deposit and interest from Kamino lending reserves.

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
  getAssociatedTokenAddress,
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

### Get the Wallet's cToken Balance

The redeem amount is in cTokens, not USDC. Read the wallet's cToken balance to redeem all of it.

```typescript theme={null}
const usdcMint = address('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
const usdcReserve = market!.getExistingFloatRateReserveByMint(usdcMint);

const cTokenAccount = await getAssociatedTokenAddress(usdcReserve.getCTokenMint(), signer.address);
const { value: cTokenBalance } = await rpc.getTokenAccountBalance(cTokenAccount).send();

console.log('cTokens to redeem:', cTokenBalance.uiAmountString);
```

**Step 4**

### Build Redeem Reserve Collateral Instructions

Redeem the cTokens for USDC.

```typescript theme={null}
const redeemAction = await KaminoAction.buildRedeemReserveCollateralTxns({
  kaminoMarket: market!,
  amount: new BN(cTokenBalance.amount),
  reserveAddress: usdcReserve.address,
  owner: signer,
  obligation: new VanillaObligation(PROGRAM_ID),
  scopeRefreshConfig: undefined,
  currentLedgerInstant: await getCurrentLedgerInstant(rpc),
});
```

**Step 5**

### Build the Transaction

```typescript theme={null}
const { value: latestBlockhash } = await rpc.getLatestBlockhash({ commitment: 'finalized' }).send();

const transactionMessage = pipe(
  createTransactionMessage({ version: 0 }),
  (tx) => setTransactionMessageFeePayerSigner(signer, tx),
  (tx) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
  (tx) => appendTransactionMessageInstructions(KaminoAction.actionToIxs(redeemAction), tx)
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

console.log('cTokens redeemed! Signature:', getSignatureFromTransaction(signedTransaction));
```

> [!TIP]
>
> Once the transaction is confirmed, the cTokens are burned and the USDC, including the interest earned, is in your wallet.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Mint cTokens

> Mint cTokens by depositing liquidity into Kamino lending reserves

> [!NOTE]
>
> Mint cTokens (collateral tokens) by depositing assets into Kamino lending reserves. cTokens represent your deposit and accrue interest over time, which can be redeemed later for the underlying asset plus earned interest.

## Minting cTokens

Deposit reserve liquidity to receive cTokens in your wallet.

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

### Build Deposit Reserve Liquidity Instructions

Supply USDC to the reserve and receive its cTokens.

```typescript theme={null}
const usdcMint = address('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
const usdcReserve = market!.getExistingFloatRateReserveByMint(usdcMint);

const mintAction = await KaminoAction.buildDepositReserveLiquidityTxns({
  kaminoMarket: market!,
  amount: new BN(1_000_000),
  reserveAddress: usdcReserve.address,
  owner: signer,
  obligation: new VanillaObligation(PROGRAM_ID),
  scopeRefreshConfig: undefined,
  currentLedgerInstant: await getCurrentLedgerInstant(rpc),
});

console.log('cToken mint:', usdcReserve.getCTokenMint());
```

> [!NOTE]
>
> This doesn't open a borrow position, so the `obligation` prop is required by the type but unused. `reserve.getCollateralExchangeRate()` returns the current cTokens per token.

**Step 4**

### Build the Transaction

```typescript theme={null}
const { value: latestBlockhash } = await rpc.getLatestBlockhash({ commitment: 'finalized' }).send();

const transactionMessage = pipe(
  createTransactionMessage({ version: 0 }),
  (tx) => setTransactionMessageFeePayerSigner(signer, tx),
  (tx) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
  (tx) => appendTransactionMessageInstructions(KaminoAction.actionToIxs(mintAction), tx)
);
```

**Step 5**

### Sign and Send

```typescript theme={null}
const signedTransaction = await signTransactionMessageWithSigners(transactionMessage);
assertIsTransactionWithinSizeLimit(signedTransaction);

await sendAndConfirmTransactionFactory({ rpc, rpcSubscriptions })(signedTransaction, {
  commitment: 'confirmed',
  skipPreflight: true,
});

console.log('cTokens minted! Signature:', getSignatureFromTransaction(signedTransaction));
```

> [!TIP]
>
> Once the transaction is confirmed, the cTokens are in your wallet. They grow in value as borrowers pay interest, and can be redeemed for USDC plus the interest earned.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
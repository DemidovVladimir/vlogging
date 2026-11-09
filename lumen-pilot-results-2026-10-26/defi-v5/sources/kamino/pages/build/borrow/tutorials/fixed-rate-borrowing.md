> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Fixed-Rate Borrowing

> Deposit collateral and place a fixed-term borrow order to borrow at a fixed rate

Borrow at a fixed rate for a fixed term by depositing collateral and placing a borrow order in one transaction. Vaults fill the order from fixed-rate reserves, and the borrowed tokens go straight to your wallet.

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
  compressTransactionMessageUsingAddressLookupTables,
  signTransactionMessageWithSigners,
  assertIsTransactionWithinSizeLimit,
  sendAndConfirmTransactionFactory,
  getSignatureFromTransaction,
} from '@solana/kit';
import { fetchAllAddressLookupTable } from '@solana-program/address-lookup-table';
import {
  KaminoMarket,
  KaminoAction,
  KaminoBorrowOrder,
  VanillaObligation,
  PROGRAM_ID,
  SECONDS_PER_DAY,
  getAssociatedTokenAddress,
  getCurrentLedgerInstant,
  getMedianSlotDurationInMsFromLastEpochs,
} from '@kamino-finance/klend-sdk';
import { parseKeypairFile } from '@kamino-finance/klend-sdk/dist/utils/signer.js';
import BN from 'bn.js';
```

**Step 2**

### Load Signer and Initialize Market

```typescript theme={null}
const KEYPAIR_FILE = '/path/to/your/keypair.json';
const signer = await parseKeypairFile(KEYPAIR_FILE);

const rpc = createSolanaRpc('https://api.mainnet-beta.solana.com');
const rpcSubscriptions = createSolanaRpcSubscriptions('wss://api.mainnet-beta.solana.com');
const marketPubkey = address('7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF'); // SOL/BTC Market

const market = await KaminoMarket.load(rpc, marketPubkey, await getMedianSlotDurationInMsFromLastEpochs());
const currentLedgerInstant = await getCurrentLedgerInstant(rpc);
```

**Step 3**

### Create the Borrow Order

Define the loan: the token to borrow, the amount, the minimum term, how long the order stays open, and the highest rate you accept.

```typescript theme={null}
const solMint = address('So11111111111111111111111111111111111111112');
const usdcMint = address('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');

const borrowOrder = KaminoBorrowOrder.createFixedTermBorrowOrder({
  debtMint: usdcMint,
  amount: new BN(5_000_000),
  destination: await getAssociatedTokenAddress(usdcMint, signer.address),
  termSeconds: new BN(30 * SECONDS_PER_DAY),
  expirySeconds: new BN(SECONDS_PER_DAY),
  maxRateBps: 500,
  enableAutoRolloverOnFilledBorrows: true,
  currentLedgerInstant,
});
```

> [!NOTE]
>
> `maxRateBps` caps the reserve's configured rate, not the APY. Fixed-rate reserves accrue interest per slot and mainnet slots are faster than the 500 ms the program assumes, so the APY a borrower pays is higher than the configured rate. `totalBorrowAPYFixedRate()` on the reserve returns it. `enableAutoRolloverOnFilledBorrows` rolls the loan into a new term at the end of the current one when liquidity allows.

> [!WARNING]
>
> Each market sets a minimum order value (\$2 on the SOL/BTC Market); smaller orders are rejected with `BorrowOrderValueTooSmall`. Open orders count toward your LTV as if they were filled, and must stay at least 5% below max LTV.

**Step 4**

### Build Deposit and Order Instructions

Deposit SOL as collateral and place the order in the same transaction.

```typescript theme={null}
const solReserve = market!.getExistingFloatRateReserveByMint(solMint);

const borrowOrderAction = await KaminoAction.buildDepositAndSetBorrowOrderTxns({
  kaminoMarket: market!,
  amount: new BN(200_000_000),
  reserveAddress: solReserve.address,
  owner: signer,
  obligation: new VanillaObligation(PROGRAM_ID),
  borrowOrder,
  orderIdx: 0,
  useV2Ixs: true,
  scopeRefreshConfig: undefined,
  initUserMetadata: { skipInitialization: false, skipLutCreation: true },
  currentLedgerInstant,
});

const instructions = KaminoAction.actionToIxs(borrowOrderAction);
```

> [!NOTE]
>
> An obligation holds up to three borrow orders; `orderIdx` picks the slot to write. Fixed-rate borrowing uses the same `VanillaObligation` as variable-rate borrowing.

**Step 5**

### Fetch Lookup Tables

```typescript theme={null}
const addresses = [
  ...new Set(instructions.flatMap((ix) => [ix.programAddress, ...(ix.accounts ?? []).map((account) => account.address)])),
];

const lutResponse = await fetch('https://api.kamino.finance/luts/find-minimal', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ addresses }),
});
if (!lutResponse.ok) {
  console.log(`Lookup table request failed: ${lutResponse.status} ${lutResponse.statusText}`);
}

const { lutAddresses } = await lutResponse.json();
const lookupTables = await fetchAllAddressLookupTable(rpc, lutAddresses.map((lut: string) => address(lut)));
const lookupTableAddresses = Object.fromEntries(lookupTables.map((lut) => [lut.address, lut.data.addresses]));
```

**Step 6**

### Build the Transaction

```typescript theme={null}
const { value: latestBlockhash } = await rpc.getLatestBlockhash({ commitment: 'finalized' }).send();

const transactionMessage = pipe(
  createTransactionMessage({ version: 0 }),
  (tx) => setTransactionMessageFeePayerSigner(signer, tx),
  (tx) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
  (tx) => appendTransactionMessageInstructions(instructions, tx),
  (tx) => compressTransactionMessageUsingAddressLookupTables(tx, lookupTableAddresses)
);
```

**Step 7**

### Sign and Send

```typescript theme={null}
const signedTransaction = await signTransactionMessageWithSigners(transactionMessage);
assertIsTransactionWithinSizeLimit(signedTransaction);

await sendAndConfirmTransactionFactory({ rpc, rpcSubscriptions })(signedTransaction, {
  commitment: 'confirmed',
  skipPreflight: true,
});

console.log('Borrow order placed! Signature:', getSignatureFromTransaction(signedTransaction));
```

> [!TIP]
>
> Once confirmed, your SOL is deposited and the borrow order is open. It fills automatically, in one or more parts, while it's open. Interest starts on each part when it fills, and the USDC goes straight to your wallet.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
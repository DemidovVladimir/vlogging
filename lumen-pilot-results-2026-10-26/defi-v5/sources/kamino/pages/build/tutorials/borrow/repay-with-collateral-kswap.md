> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Repay with Collateral using KSwap

> Reduce debt by converting collateral using flash loans in a single atomic transaction

Repay with collateral reduces debt in a single atomic transaction by converting collateral into the debt token without requiring additional funds. The protocol flash borrows the debt token, repays the debt, withdraws the freed collateral, swaps it to the debt token via KSwap, and repays the flash loan, all in one transaction.

## Repay with Collateral using KSwap

Reduce debt in a single transaction by converting collateral using a flash loan and KSwap.

**Step 1**

### Import Dependencies

```typescript theme={null}
import {
  createSolanaRpc,
  createSolanaRpcSubscriptions,
  address,
  none,
  pipe,
  createTransactionMessage,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  appendTransactionMessageInstructions,
  compressTransactionMessageUsingAddressLookupTables,
  isTransactionMessageWithinSizeLimit,
  signTransactionMessageWithSigners,
  assertIsTransactionWithinSizeLimit,
  sendAndConfirmTransactionFactory,
  getSignatureFromTransaction,
  type Address,
  type Instruction,
} from '@solana/kit';
import { fetchAllAddressLookupTable } from '@solana-program/address-lookup-table';
import {
  KaminoMarket,
  MultiplyObligation,
  PROGRAM_ID,
  getRepayWithCollIxs,
  getScopeRefreshIxForObligationAndReserves,
  getComputeBudgetAndPriorityFeeIxs,
  getCurrentLedgerInstant,
  getMedianSlotDurationInMsFromLastEpochs,
  type SwapInputs,
} from '@kamino-finance/klend-sdk';
import { parseKeypairFile } from '@kamino-finance/klend-sdk/dist/utils/signer.js';
import { KswapSdk, loadRouterContext, type RouteOutput } from '@kamino-finance/kswap-sdk';
import { Scope } from '@kamino-finance/scope-sdk';
import BN from 'bn.js';
import Decimal from 'decimal.js';
```

> [!NOTE]
>
> Use `@kamino-finance/kswap-sdk` 2.9.0. It's the last version on `@solana/kit` 2, which `@kamino-finance/klend-sdk` 13 uses; 3.x moved to kit 8.

**Step 2**

### Load Configuration and Initialize SDKs

```typescript theme={null}
const KEYPAIR_FILE = '/path/to/your/keypair.json';
const signer = await parseKeypairFile(KEYPAIR_FILE);

const rpc = createSolanaRpc('https://api.mainnet-beta.solana.com');
const rpcSubscriptions = createSolanaRpcSubscriptions('wss://api.mainnet-beta.solana.com');
const marketPubkey = address('5wJeMrUYECGq41fxRESKALVcHnNX26TAWy4W98yULsua'); // xStocks Market
const collMint = address('XsDoVfqeBukxuZHWhdvWHBhgEHjGNst4MLodqsJHzoB'); // TSLAx
const debtMint = address('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'); // USDC
const REPAY_AMOUNT = new Decimal(5);
const SLIPPAGE_BPS = 50;
const MAX_COMPUTE_UNITS = 1_400_000;

const market = await KaminoMarket.load(rpc, marketPubkey, await getMedianSlotDurationInMsFromLastEpochs());
const collReserve = market!.getExistingFloatRateReserveByMint(collMint);
const debtReserve = market!.getExistingFloatRateReserveByMint(debtMint);
const kswap = new KswapSdk('https://api.kamino.finance/kswap', rpc, rpcSubscriptions);
const scope = new Scope('mainnet-beta', rpc);
```

**Step 3**

### Load the Multiply Obligation

A Multiply position is its own obligation, addressed by the collateral and debt mints.

```typescript theme={null}
const obligationAddress = await new MultiplyObligation(collMint, debtMint, PROGRAM_ID).toPda(marketPubkey, signer.address);
const obligation = await market!.getObligationByAddress(obligationAddress);

if (!obligation) {
  console.log('No Multiply position found for', signer.address);
}
```

**Step 4**

### Get Scope Price Refresh Instructions

```typescript theme={null}
const scopeRefreshIx = await getScopeRefreshIxForObligationAndReserves(
  market!,
  collReserve,
  debtReserve,
  obligation!,
  { scope, scopeConfigurations: await scope.getAllConfigurations() }
);
```

**Step 5**

### Define the Swap Helpers

The SDK asks for swaps through two callbacks: a quoter that prices the swap and a swapper that returns its instructions. Both use every KSwap route, sorted by output.

```typescript theme={null}
async function getRoutes(inputs: SwapInputs) {
  const { routes } = await kswap.getAllRoutes(
    {
      executor: signer.address,
      tokenIn: inputs.inputMint,
      tokenOut: inputs.outputMint,
      amount: new BN(inputs.inputAmountLamports.floor().toString()),
      maxSlippageBps: SLIPPAGE_BPS,
      swapType: 'exactIn',
      wrapAndUnwrapSol: false,
    },
    await loadRouterContext(rpc, inputs.inputMint, inputs.outputMint)
  );
  if (routes.length === 0) {
    console.log('No KSwap route found for', inputs.inputMint, '->', inputs.outputMint);
  }
  return routes.sort((a, b) => b.amountsExactIn!.amountOut.cmp(a.amountsExactIn!.amountOut));
}

function midPrice(route: RouteOutput) {
  const amounts = route.amountsExactIn!;
  const amountIn = new Decimal(amounts.amountIn.toString()).div(new Decimal(10).pow(route.inputTokenDecimals!));
  const amountOut = new Decimal(amounts.amountOut.toString()).div(new Decimal(10).pow(route.outputTokenDecimals!));
  return amountOut.div(amountIn);
}

const quoter = async (inputs: SwapInputs) => {
  const [bestRoute] = await getRoutes(inputs);
  return { priceAInB: midPrice(bestRoute), quoteResponse: bestRoute };
};

const swapper = async (inputs: SwapInputs) =>
  (await getRoutes(inputs)).map((route) => {
    const routeIxs = route.instructions!;
    return {
      preActionIxs: [],
      swapIxs: [
        ...routeIxs.createInAtaIxs,
        ...routeIxs.wrapSolIxs,
        ...routeIxs.swapIxs,
        ...routeIxs.unwrapSolIxs,
        ...routeIxs.createOutAtaIxs,
      ],
      lookupTables: route.lookupTableAccounts ?? [],
      quote: { priceAInB: midPrice(route), quoteResponse: route },
    };
  });
```

> [!WARNING]
>
> `priceAInB` must be the mid price (`amountOut / amountIn`, each in token units), before slippage. The SDK applies `slippagePct` itself, so a guaranteed or minimum-out price counts slippage twice and sizes the position wrong. `getBestRoute` currently returns no routes, so use `getAllRoutes`, which in kswap-sdk 2.9.0 takes the router context as a second argument.

**Step 6**

### Build the Repay Routes

The SDK builds one candidate transaction per swap route: flash borrow, repay the debt, withdraw TSLAx, swap it to USDC, repay the flash loan.

```typescript theme={null}
const routes = await getRepayWithCollIxs<RouteOutput>({
  owner: signer,
  kaminoMarket: market!,
  debtReserveAddress: debtReserve.address,
  collReserveAddress: collReserve.address,
  obligation: obligation!,
  referrer: none(),
  currentLedgerInstant: await getCurrentLedgerInstant(rpc),
  repayAmount: REPAY_AMOUNT,
  isClosingPosition: false,
  slippagePct: new Decimal(SLIPPAGE_BPS / 100),
  scopeRefreshIx,
  budgetAndPriorityFeeIxs: getComputeBudgetAndPriorityFeeIxs(MAX_COMPUTE_UNITS),
  quoter,
  swapper,
  useV2Ixs: true,
});
```

> [!NOTE]
>
> `slippagePct` also sizes the flash loan, so the worst-case swap fill still covers the repay. To repay all the debt and close the position, set `isClosingPosition` to `true`.

**Step 7**

### Fetch Lookup Tables

Fetch Kamino's lookup tables for each candidate transaction, one request per candidate.

```typescript theme={null}
async function getKaminoLookupTables(instructions: Instruction[]) {
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
  return fetchAllAddressLookupTable(rpc, lutAddresses.map((lut: string) => address(lut)));
}
```

> [!NOTE]
>
> `/luts/find-minimal` takes one transaction's worth of addresses (between 64 and 128), so a single request for all candidates is rejected.

**Step 8**

### Pick the Route That Fits

Compress each candidate with its route's lookup tables and Kamino's, then take the best-output one that fits in a transaction.

```typescript theme={null}
const { value: latestBlockhash } = await rpc.getLatestBlockhash({ commitment: 'finalized' }).send();

const candidates = await Promise.all(
  routes.map(async (route) => {
    const lookupTables = [...route.lookupTables, ...(await getKaminoLookupTables(route.ixs))];
    const lookupTableAddresses: Record<Address, Address[]> = Object.fromEntries(
      lookupTables.map((lut) => [lut.address, lut.data.addresses])
    );
    return pipe(
      createTransactionMessage({ version: 0 }),
      (tx) => setTransactionMessageFeePayerSigner(signer, tx),
      (tx) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
      (tx) => appendTransactionMessageInstructions(route.ixs, tx),
      (tx) => compressTransactionMessageUsingAddressLookupTables(tx, lookupTableAddresses)
    );
  })
);

const transactionMessage = candidates.find((candidate) => isTransactionMessageWithinSizeLimit(candidate));
if (!transactionMessage) {
  console.log(`None of the ${candidates.length} swap routes fit in one transaction`);
}
```

> [!NOTE]
>
> The best-output route often has too many accounts to fit, even compressed: in testing only one or two of five to ten routes did. The slippage setting covers the gap between the best route's quote and the one sent.

**Step 9**

### Sign and Send

```typescript theme={null}
const signedTransaction = await signTransactionMessageWithSigners(transactionMessage!);
assertIsTransactionWithinSizeLimit(signedTransaction);

await sendAndConfirmTransactionFactory({ rpc, rpcSubscriptions })(signedTransaction, {
  commitment: 'confirmed',
  skipPreflight: true,
});

console.log('Repay with collateral successful! Signature:', getSignatureFromTransaction(signedTransaction));
```

> [!TIP]
>
> The debt is reduced by selling TSLAx collateral, with no USDC needed in the wallet.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
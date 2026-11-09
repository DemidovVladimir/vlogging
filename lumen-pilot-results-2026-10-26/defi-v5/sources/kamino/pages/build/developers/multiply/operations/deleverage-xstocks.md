> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Multiply Deleverage with xStocks

> Reduce leverage on xStocks positions by selling collateral to repay debt atomically

Deleveraging takes value out of a multiply position in a single atomic transaction: it sells TSLAx collateral through KSwap, repays part of the USDC debt with a flash loan, and sends the rest to the wallet, with no external funds needed. The position shrinks but keeps its LTV, so its leverage stays the same. To lower leverage, repay debt with [Repay](https://kamino.com/docs/build/developers/multiply/operations/repay-xstocks.md) or [Repay with Collateral](https://kamino.com/docs/build/developers/multiply/operations/repay-collateral.md).

> [!NOTE]
>
> Multiply positions use `MultiplyObligation` which derives a unique PDA (Program Derived Address) based on your wallet, market, collateral token (TSLAx), and debt token (USDC). Each collateral/debt pair creates a separate obligation address, allowing you to have multiple multiply positions simultaneously.

## Deleverage Multiply Position with xStocks

Reduce leverage on a TSLAx multiply position by selling collateral to repay USDC debt.

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
  getWithdrawWithLeverageIxs,
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
const WITHDRAW_AMOUNT = new Decimal(3);
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

### Read the Position

`deposited` and `borrowed` are the position's current amounts in token units.

```typescript theme={null}
const deposited = obligation!.getDepositAmountByReserve(collReserve);
const borrowed = obligation!.getBorrowAmountByReserve(debtReserve);

console.log(`Current position: ${deposited} TSLAx deposited, ${borrowed} USDC borrowed`);
```

**Step 5**

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

**Step 6**

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

**Step 7**

### Build the Withdraw Routes

The SDK builds one candidate transaction per swap route: flash borrow, repay part of the debt, withdraw TSLAx, swap it to USDC, repay the flash loan, and send the rest to the wallet.

```typescript theme={null}
const routes = await getWithdrawWithLeverageIxs<RouteOutput>({
  owner: signer,
  kaminoMarket: market!,
  debtReserveAddress: debtReserve.address,
  collReserveAddress: collReserve.address,
  obligation: obligation!,
  deposited,
  borrowed,
  referrer: none(),
  currentLedgerInstant: await getCurrentLedgerInstant(rpc),
  withdrawAmount: WITHDRAW_AMOUNT,
  priceCollToDebt: collReserve.getOracleMarketPrice().div(debtReserve.getOracleMarketPrice()),
  slippagePct: new Decimal(SLIPPAGE_BPS / 100),
  isClosingPosition: false,
  selectedTokenMint: debtMint,
  userSolBalanceLamports: Number((await rpc.getBalance(signer.address).send()).value),
  scopeRefreshIx,
  budgetAndPriorityFeeIxs: getComputeBudgetAndPriorityFeeIxs(MAX_COMPUTE_UNITS),
  quoteBufferBps: new Decimal(0),
  quoter,
  swapper,
  useV2Ixs: true,
});
```

> [!NOTE]
>
> `withdrawAmount` is in the selected token (USDC here). To close the whole position, set `isClosingPosition` to `true`.

**Step 8**

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

**Step 9**

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

**Step 10**

### Sign and Send

```typescript theme={null}
const signedTransaction = await signTransactionMessageWithSigners(transactionMessage!);
assertIsTransactionWithinSizeLimit(signedTransaction);

await sendAndConfirmTransactionFactory({ rpc, rpcSubscriptions })(signedTransaction, {
  commitment: 'confirmed',
  skipPreflight: true,
});

console.log('Deleverage successful! Signature:', getSignatureFromTransaction(signedTransaction));
```

> [!TIP]
>
> The position is smaller and the USDC is in the wallet. The position keeps its LTV, so its leverage is unchanged.

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
> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Multiply Deposit with xStocks

> Leverage your position by borrowing and swapping to deposit more collateral

A multiply deposit creates a leveraged collateral position in a single, atomic transaction by combining an initial deposit with temporary liquidity.

When a multiply deposit is initiated, the protocol first temporarily borrows the debt token (for example, USDC) through a flash loan. The borrowed amount is swapped into the collateral token (for example, TSLAx) using KSwap (Kamino's token swap SDK). The resulting collateral is then deposited into Kamino Lend. With the collateral in place, the position borrows the debt token against it, and the borrowed amount is used to repay the flash loan before the transaction completes. The result is a leveraged position with increased exposure to the collateral token and an outstanding debt balance.

## Multiply Deposit with xStocks

Create a leveraged position in a single atomic transaction using Klend's multiply feature and KSwap multi-route swap optimization.

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
  ObligationTypeTag,
  PROGRAM_ID,
  getDepositWithLeverageIxs,
  getScopeRefreshIxForObligationAndReserves,
  getComputeBudgetAndPriorityFeeIxs,
  getUserLutAddressAndSetupIxs,
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
const DEPOSIT_AMOUNT = new Decimal(10);
const TARGET_LEVERAGE = new Decimal(2);
const SLIPPAGE_BPS = 50;
const MAX_COMPUTE_UNITS = 1_400_000;

const market = await KaminoMarket.load(rpc, marketPubkey, await getMedianSlotDurationInMsFromLastEpochs());
const collReserve = market!.getExistingFloatRateReserveByMint(collMint);
const debtReserve = market!.getExistingFloatRateReserveByMint(debtMint);
const kswap = new KswapSdk('https://api.kamino.finance/kswap', rpc, rpcSubscriptions);
const scope = new Scope('mainnet-beta', rpc);
```

**Step 3**

### Set Up a New Wallet

The leverage functions expect the wallet's Kamino user metadata to exist. A wallet that has never used Kamino sends one setup transaction first.

```typescript theme={null}
const sendAndConfirm = sendAndConfirmTransactionFactory({ rpc, rpcSubscriptions });
const [, userMetadata] = await market!.getUserMetadata(signer.address);

if (!userMetadata) {
  const [, setupInstructions] = await getUserLutAddressAndSetupIxs(market!, signer, none(), false);
  const { value: setupBlockhash } = await rpc.getLatestBlockhash({ commitment: 'finalized' }).send();
  const setupTransaction = await signTransactionMessageWithSigners(
    pipe(
      createTransactionMessage({ version: 0 }),
      (tx) => setTransactionMessageFeePayerSigner(signer, tx),
      (tx) => setTransactionMessageLifetimeUsingBlockhash(setupBlockhash, tx),
      (tx) => appendTransactionMessageInstructions(setupInstructions.flat(), tx)
    )
  );
  await sendAndConfirm(setupTransaction, { commitment: 'confirmed', skipPreflight: true });
}
```

**Step 4**

### Load the Multiply Obligation

A Multiply position is its own obligation, addressed by the collateral and debt mints. It's `null` until the first deposit creates it.

```typescript theme={null}
const obligationAddress = await new MultiplyObligation(collMint, debtMint, PROGRAM_ID).toPda(marketPubkey, signer.address);
const obligation = await market!.getObligationByAddress(obligationAddress);
```

**Step 5**

### Get Scope Price Refresh Instructions

```typescript theme={null}
const scopeRefreshIx = await getScopeRefreshIxForObligationAndReserves(
  market!,
  collReserve,
  debtReserve,
  obligation ?? undefined,
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

### Build the Leverage Routes

The SDK builds one candidate transaction per swap route: flash borrow USDC, swap it to TSLAx, deposit, borrow USDC, repay the flash loan.

```typescript theme={null}
const routes = await getDepositWithLeverageIxs<RouteOutput>({
  owner: signer,
  kaminoMarket: market!,
  debtReserveAddress: debtReserve.address,
  collReserveAddress: collReserve.address,
  depositAmount: DEPOSIT_AMOUNT,
  priceDebtToColl: debtReserve.getOracleMarketPrice().div(collReserve.getOracleMarketPrice()),
  slippagePct: new Decimal(SLIPPAGE_BPS / 100),
  obligation,
  referrer: none(),
  currentLedgerInstant: await getCurrentLedgerInstant(rpc),
  targetLeverage: TARGET_LEVERAGE,
  selectedTokenMint: debtMint,
  obligationTypeTagOverride: ObligationTypeTag.Multiply,
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
> `selectedTokenMint` is the token you deposit: the debt token (USDC) here, or the collateral token. `quoteBufferBps` inflates only the amount used for the quote; 0 quotes the exact swap amount and leaves price moves to the slippage setting.

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

console.log('Multiply deposit successful! Signature:', getSignatureFromTransaction(signedTransaction));
```

> [!TIP]
>
> The 2x TSLAx position is open: TSLAx collateral with a USDC debt, created in one transaction.

## Transaction Flow

> **View Transaction Flow Diagram**
>
> ```mermaid theme={null}
> graph TD
>     A[Load Market & SDKs] --> B[Set Up New Wallet]
>     B --> C[Load Multiply Obligation]
>     C --> D[Refresh Scope Prices]
>     D --> E[Build One Candidate per Swap Route]
>     E --> F[Compress with Lookup Tables]
>     F --> G[Pick Best Route That Fits]
>     G --> J[Sign & Send Transaction]
>
>     J --> K{Transaction Success?}
>     K -->|Yes| L[Leveraged Position Created]
>     K -->|No| M[Transaction Reverts]
> ```

## Asset Flow

> **2x Leveraged TSLAx Position: Step-by-Step**
>
> **1. Initial State**
>
> * Wallet: 10 USDC
> * Position: None
>
> **2. Flash Borrow**
>
> * Flash loan: 10 USDC (temporary)
> * Available: 20 USDC total
>
> **3. Swap & Deposit**
>
> * Swap 20 USDC to TSLAx via KSwap
> * Deposit TSLAx as collateral
>
> **4. Borrow & Repay**
>
> * Borrow 10 USDC against collateral
> * Repay 10 USDC flash loan
>
> **5. Final Position**
>
> * Collateral: TSLAx (\$20 value)
> * Debt: 10 USDC
> * Net Equity: 10 USDC
> * Leverage: 2x

## Key Concepts

> **Flash Loans**
>
> Flash loans are uncollateralized loans that must be borrowed and repaid within the same transaction. They enable:
>
> * **Zero upfront capital**: Borrow large amounts without collateral
> * **Atomic execution**: All operations succeed or fail together
> * **Leverage creation**: Bootstrap leveraged positions in one transaction
> * **Risk-free**: Transaction reverts if flash loan cannot be repaid

> **Multiply Obligation Type**
>
> The `MultiplyObligation` is a specialized obligation type that:
>
> * **Defines position type**: Multiply vs Leverage vs Vanilla
> * **Derives unique address**: Via PDA using collateral/debt mints
> * **Supports multiple positions**: Create different obligations with same tokens using ID parameter
> * **Creates new obligation**: When none exists (indicated by `obligation: null`)

> **KSwap Multi-Route Optimization**
>
> KSwap provides optimal swap execution through:
>
> * **Multi-DEX routing**: Tests routes across Jupiter, OKX, dFlow, and other DEX aggregators
> * **Route choice**: Sorted by output; the best-output route that fits in one transaction is sent
> * **Slippage protection**: Each route enforces a minimum output within the slippage setting
> * **Automatic ATA creation**: Handles token account creation and SOL wrapping/unwrapping

### Borrow and Multiply SDK Methods

| Method | Operation | When to Use |
| - | - | - |
| `getDepositWithLeverageIxs` | Open position or add collateral | Creating or adding to a leveraged position |
| `buildRepayTxns` | Repay with wallet funds | Reducing debt using USDC, SOL, etc. from wallet |
| `buildWithdrawTxns` | Withdraw collateral | Withdrawing collateral after debt is repaid |
| `getWithdrawWithLeverageIxs` | Shrink the position and withdraw | Take value out while keeping the position's LTV; leverage stays the same |
| `getRepayWithCollIxs` | Repay debt with collateral | Sell collateral to repay debt without withdrawing (value stays in position) |

> [!NOTE]
>
> **Multiply operations** use `MultiplyObligation`. **Vanilla operations** use `VanillaObligation`. The obligation type determines which PDA is derived for your position.

## Related Resources

> **[Deposit and Borrow](https://kamino.com/docs/build/tutorials/borrow/deposit-and-borrow.md)**
>
> Learn basic deposit and borrow operations

> **[Market Data](https://kamino.com/docs/build/developers/borrow/data/market-data.md)**
>
> Read market metrics and reserve data

> **[KSwap SDK](https://www.npmjs.com/package/@kamino-finance/kswap-sdk)**
>
> Multi-DEX swap routing SDK

> **[Scope SDK](https://github.com/Kamino-Finance/scope-sdk)**
>
> Oracle price aggregation SDK


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
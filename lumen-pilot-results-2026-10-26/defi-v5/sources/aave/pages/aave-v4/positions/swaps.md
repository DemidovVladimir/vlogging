# Position Swaps

Learn how to modify your Aave v4 positions using integrated swap operations.

---

Position swaps combine swap functionality with User Position operations, letting you:

- [Swap Supply Asset](#swap-supply-asset) — Convert a supplied position to a different token
- [Swap Borrow Asset](#swap-borrow-asset) — Convert borrowed debt to a different token
- [Repay with Supply](#repay-with-supply) — Use any supplied position to pay down debt directly
- [Withdraw and Swap](#withdraw-and-swap) — Withdraw assets and receive a different token

This feature leverages [CoW Protocol](https://cow.fi/) for swap execution. Position swaps are gasless—users sign an intent and solvers handle execution. This eliminates gas costs while providing [MEV protection](https://ethereum.org/en/developers/docs/mev/) and optimal execution through batch auctions.

> [!TIP]
> Review the [Fees](../tools/swaps#fees) section to understand swap costs.

## Swap Supply Asset

Swapping supply assets combines withdraw, swap, and re-supply into one gasless step.

Common scenarios:

| Scenario                   | Description                                                                                                                      |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Liquidation Risk Reduction | User wants to swap volatile collateral to stable assets to reduce liquidation risk                                               |
| Better Rates               | User wants to switch supply position to a reserve with better rates (regardless of being used as collateral or not)              |
| Replenish Collateral       | User wants to use a non-collateral supply to replenish a collateral position to gain more borrowing power at the same risk level |
| Better Risk Premium        | User wants to consolidate collateral to a less risky asset (lower Collateral Risk) to reduce the risk premium on borrows         |

Swapping supply assets can be broken down into the following steps:

1. Identify the supply position to swap from
2. Choose the target reserve to swap onto
3. Choose between market order and limit order
4. Execute the swap operation

### Supply Position

Identify the supply position among the user's [supply positions](./fetch#user-supplies) where `reserve.canSwapFrom: true`.

```tsx title="UserSupplyItem"
const supplyPosition: UserSupplyItem = {
  id: "aGVsbG8",
  reserve: {
    id: "SGVsbG8h",
    canSwapFrom: true,
    chain: {
      chainId: 1,
      name: "Ethereum",
    },
    spoke: {
      id: "aGVsbG8",
      // …
    },
    // …
  },
  isCollateral: true,
  balance: {
    amount: {
      value: BigDecimal(5000.0),
      exchange: {
        value: BigDecimal(5000.0),
        // …
      },
      // …
    },
    // …
  },
  withdrawable: {
    amount: {
      value: BigDecimal(0.03),
      exchange: {
        value: BigDecimal(100.0),
        // …
      },
      // …
    },
    // …
  },
  // …
};
```

> [!NOTE]
> The `reserve.canSwapFrom` flag confirms that the correponding reserve isn't
> paused and flash loans are enabled on it.

### Target Reserve

Choose the target [reserve](../liquidity/reserves#listing-available-reserves) where `canSupply: true`. The target reserve must be on the **same spoke** as the source supply position.

> [!NOTE]
> Like with typical supply operations, the `canSupply` flag confirms that the
> reserve is active: it isn't frozen, it isn't paused, and the supply cap has
> not been reached.

```tsx title="Target Reserve"
const targetReserve: Reserve = {
  id: "V29ybGQh",
  canSupply: true,
  canUseAsCollateral: true,
  spoke: {
    id: "aGVsbG8",
    // …
  },
  asset: {
    underlying: {
      address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
      info: {
        name: "USD Coin",
        symbol: "USDC",
        decimals: 6,
        // …
      },
      // …
    },
    // …
  },
  summary: {
    supplyApy: {
      normalized: BigDecimal(4.5), // 4.5% APY
      // …
    },
    // …
  },
  userState: {
    suppliable: {
      exchange: {
        value: BigDecimal(1245.67),
        name: "USD",
        symbol: "$",
        // …
      },
      // …
    },
  },
  // …
};
```

Consider the following factors when selecting a target reserve:

- **Token**: Check `asset.underlying` for the token of the new supply position
- **Collateral**: Verify `canUseAsCollateral` if collateral is needed
- **Capacity**: Review `userState.suppliable` for sufficient supply capacity
- **Rate**: Compare `summary.supplyApy` for favorable APY

### Market or Limit Order

You decide whether to use a market order or a limit order.

<tabgroup>
<tab label="Market Order">

Market orders execute at current rates.

```ts title="TypeScript"
const request: SupplySwapQuoteRequest = {
  market: {
    sellPosition: supplyPosition.id,
    buyReserve: targetReserve.id,
    enableCollateral:
      supplyPosition.isCollateral && targetReserve.canUseAsCollateral,
    amount: bigDecimal(0.03),
    user: evmAddress("0x123…"),
    // selectedSlippage: bigDecimal(1), // Optional: override suggested slippage
  },
};
```

```json title="GraphQL Variables"
{
  "request": {
    "market": {
      "sellPosition": "aGVsbG8",
      "buyReserve": "V29ybGQh",
      "enableCollateral": true,
      "amount": "0.03",
      "user": "0x123…"
    }
  }
}
```

The request takes the following parameters:

- `sellPosition` — The current supply position to swap from
- `buyReserve` — The target reserve to swap to
- `enableCollateral` — Whether to enable the new position as collateral
- `amount` — The amount of the current position to swap
- `user` — The user's address
- `selectedSlippage` — Optional slippage tolerance to use instead of the suggested slippage

</tab>
<tab label="Limit Order">

Limit orders execute when your price condition is met.

```ts title="TypeScript"
const request: SupplySwapQuoteRequest = {
  limit: {
    currentPosition: supplyPosition.id,
    currentAmount: bigDecimal(0.03),
    newReserve: targetReserve.id,
    newAmount: bigDecimal(105), // Desired amount to receive
    enableCollateral:
      supplyPosition.isCollateral && targetReserve.canUseAsCollateral,
    user: evmAddress("0x123…"),
    kind: SupplySwapKind.Current,
    // deadline: new Date("2025-12-31T23:59:59Z"), // Optional: custom expiry
  },
};
```

```json title="GraphQL Variables"
{
  "request": {
    "limit": {
      "currentPosition": "aGVsbG8",
      "currentAmount": "0.03",
      "newReserve": "V29ybGQh",
      "newAmount": "105",
      "enableCollateral": true,
      "user": "0x123…",
      "kind": "CURRENT"
    }
  }
}
```

The request takes the following parameters:

- `currentPosition` — The current supply position to swap from
- `currentAmount` — The amount of the current position to swap
- `newReserve` — The target reserve to swap to
- `newAmount` — The desired amount to receive in the new position
- `enableCollateral` — Whether to enable the new position as collateral
- `user` — The user's address
- `kind` — Current (default) or New, determines which amount is honored
- `deadline` — Optional deadline as DateTime; if not provided, uses default expiry

With both amounts specified, the `kind` parameter determines which amount takes priority:

| Kind    | User specifies…                                           | What happens with the order                                                          |
| ------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Current | The exact **current** amount and a minimum **new** amount | Order fulfilled when new position price allows desired exchange within current limit |
| New     | The exact **new** amount and a maximum **current** usage  | Order fulfilled when current position price allows achieving the desired new amount  |

</tab>
</tabgroup>
The `enableCollateral` flag controls the destination supply’s collateral status: `true` enables it as collateral; `false` keeps the existing status (or non-collateral for a new position). The examples assume the target reserve allows collateral and mirror the source’s collateral state; adjust to fit your scenario.

### Execute the Swap

<tabgroup>
<tab label="React">

To execute a supply swap with AaveKit React, follow these steps.

#### Get a Quote

First, use the `useSupplySwapQuote` hook (or the imperative `useSupplySwapQuoteAction` variant) to get pricing information for the swap.

```tsx title="Loading State"
import { type SupplySwapQuoteRequest, useSupplySwapQuote } from "@aave/react";

function SwapQuote({ request }: { request: SupplySwapQuoteRequest }) {
  const { data, loading, error } = useSupplySwapQuote(request);

  if (loading) return Loading…;

  if (error) {
    if (error.name === "ValidationError") {
      switch (error.cause.__typename) {
        case "InsufficientLiquidityError":
          return Not enough liquidity for this swap;
      }
    }
    return {error.message};
  }

  // data: SwapQuote
  return (
    <div>
      You will receive: {data.finalBuy.amount.value.toDisplayString()}
      Partner fee: {data.costs.partnerFee.amount.value.toDisplayString()}
      Slippage: {data.suggestedSlippage.normalized}%
    </div>
  );
}
```

```tsx title="React Suspense"
import { type SupplySwapQuoteRequest, useSupplySwapQuote } from "@aave/react";

function SwapQuote({ request }: { request: SupplySwapQuoteRequest }) {
  const { data } = useSupplySwapQuote({
    ...request,
    suspense: true,
  });

  // data: SwapQuote
  return (
    <div>
      You will receive: {data.finalBuy.amount.value.toDisplayString()}
      Partner fee: {data.costs.partnerFee.amount.value.toDisplayString()}
      Slippage: {data.suggestedSlippage.normalized}%
    </div>
  );
}
```

```tsx title="Imperative Read"
import {
  type SupplySwapQuoteRequest,
  useSupplySwapQuoteAction,
} from "@aave/react";

const [getQuote, { called, data, error, loading }] = useSupplySwapQuoteAction();

const handler = async (request: SupplySwapQuoteRequest) => {
  const result = await getQuote(request);

  if (result.isOk()) {
    // result.value: SwapQuote
    console.log(result.value);
  } else {
    console.error(result.error);
  }
};
```

You can specify a different currency to return fiat amounts in.

```ts title="useSupplySwapQuote"
import { Currency } from "@aave/react";

const { data, error, loading } = useSupplySwapQuote({
  ...request,
  currency: Currency.Eur,
});
```

```ts title="useSupplySwapQuoteAction"
import { Currency } from "@aave/react";

const [getQuote, { called, data, error, loading }] = useSupplySwapQuoteAction({
  currency: Currency.Eur,
});
```

#### Preview the Impact

Then, use the `usePreview` hook (or the imperative `usePreviewAction` variant) to preview the impact of the swap operation on the user's position.

```tsx title="Loading State"
import { type SwapQuote, usePreview } from "@aave/react";

function SwapPreview({ quote }: { quote: SwapQuote }) {
  const { data, error, loading } = usePreview({
    action: {
      supplySwap: {
        fromQuote: {
          quoteId: quote.quoteId,
        },
      },
    },
  });

  if (loading) return <div>Loading…</div>;
  if (error) return <div>Error: {error.message}</div>;

  // data: PreviewUserPosition
  return (
    <div>
      <h3>Health Factor:</h3>
      From: {data.healthFactor.current?.value.toFixed(2) ?? "N/A"}
      To: {data.healthFactor.after?.value.toFixed(2) ?? "N/A"}

      <h3>User Risk Premium:</h3>
      From: {data.riskPremium.current.normalized.toFixed(2)}%
      To: {data.riskPremium.after.normalized.toFixed(2)}%

      <h3>Net APY:</h3>
      From: {data.netApy.current.normalized.toFixed(2)}%
      To: {data.netApy.after.normalized.toFixed(2)}%

      <h3>Net Collateral:</h3>
      From: {data.netCollateral.current.value.toDisplayString(2)}
      To: {data.netCollateral.after.value.toDisplayString(2)}

      <h3>Max Borrowing Power:</h3>
      From: {data.maxBorrowingPower.current.value.toDisplayString(2)}
      To: {data.maxBorrowingPower.after.value.toDisplayString(2)}
    </div>
  );
}
```

```tsx title="React Suspense"
import { type SwapQuote, usePreview } from "@aave/react";

function SwapPreview({ quote }: { quote: SwapQuote }) {
  const { data, error, loading } = usePreview({
    action: {
      supplySwap: {
        fromQuote: {
          quoteId: quote.quoteId,
        },
      },
    },
    suspense: true,
  });

  // data: PreviewUserPosition
  return (
    <div>
      <h3>Health Factor:</h3>
      From: {data.healthFactor.current?.value.toFixed(2) ?? "N/A"}
      To: {data.healthFactor.after?.value.toFixed(2) ?? "N/A"}

      <h3>User Risk Premium:</h3>
      From: {data.riskPremium.current.normalized.toFixed(2)}%
      To: {data.riskPremium.after.normalized.toFixed(2)}%

      <h3>Net APY:</h3>
      From: {data.netApy.current.normalized.toFixed(2)}%
      To: {data.netApy.after.normalized.toFixed(2)}%

      <h3>Net Collateral:</h3>
      From: {data.netCollateral.current.value.toDisplayString(2)}
      To: {data.netCollateral.after.value.toDisplayString(2)}

      <h3>Max Borrowing Power:</h3>
      From: {data.maxBorrowingPower.current.value.toDisplayString(2)}
      To: {data.maxBorrowingPower.after.value.toDisplayString(2)}
    </div>
  );
}
```

```tsx title="Imperative Read"
import { type SwapQuote, usePreviewAction } from "@aave/react";

// …

const [preview, { called, data, error, loading }] = usePreviewAction();

const handler = async (quote: SwapQuote) => {
  const result = await preview({
    action: {
      supplySwap: {
        fromQuote: {
          quoteId: quote.quoteId,
        },
      },
    },
  });

  if (result.isOk()) {
    console.log(result.value); // PreviewUserPosition
  } else {
    console.error(result.error);
  }
};
```

The `PreviewUserPosition` shows the impact of the swap operation by comparing current and after states, with the table below outlining key fields and how to interpret them.

#### Configure Wallet Integration

Then, instantiate the `useSignTypedData` hook for the [wallet library of your choice](../getting-started/react#integrations).

```tsx title="Viem"
import { useWalletClient } from "wagmi";
import { useSignTypedData } from "@aave/react/viem";

// …

const { data: wallet } = useWalletClient();
const [signTypedData] = useSignTypedData(wallet);
```

#### Define the Swap Flow

Then, use the `useSupplySwap` hook to handle the operation.

```tsx title="Basic Usage"
import { useSupplySwap } from "@aave/react";

const [swapSupply, { loading, error }] = useSupplySwap((plan) => {
  switch (plan.__typename) {
    case "PositionSwapAdapterContractApproval":
    case "PositionSwapPositionManagerApproval":
      return signTypedData(plan.bySignature);

    case "SwapByIntent":
      return signTypedData(plan.data);
  }
});
```

```tsx title="Update Component State"
import { useSupplySwap } from "@aave/react";

const [status, setStatus] = useState("");

const [swapSupply, { loading, error }] = useSupplySwap((plan) => {
  switch (plan.__typename) {
    case "PositionSwapAdapterContractApproval":
      setStatus("Sign the swap adapter approval in your wallet");
      return signTypedData(plan.bySignature);

    case "PositionSwapPositionManagerApproval":
      setStatus("Sign the swap position manager approval in your wallet");
      return signTypedData(plan.bySignature);

    case "SwapByIntent":
      setStatus("Sign the swap intent in your wallet");
      return signTypedData(plan.data);
  }
});
```

```tsx title="Cancel Flow"
import { useSupplySwap } from "@aave/react";

const [swapSupply, { loading, error }] = useSupplySwap((plan) => {
  if (window.confirm("Are you sure you want to continue?") === false) {
    return cancel("User cancelled the operation");
  }

  switch (plan.__typename) {
    case "PositionSwapAdapterContractApproval":
    case "PositionSwapPositionManagerApproval":
      return signTypedData(plan.bySignature);

    case "SwapByIntent":
      return signTypedData(plan.data);
  }
});
```

The operation involves up to 3 signatures:

- **Swap adapter contract approval**: A one-time-use contract that encapsulates the swap logic. This signature ensures the contract is used only once for this specific swap operation.
- **Swap position manager approval**: Authorizes a dedicated [Position Manager](./managers) to operate on the user's position.
- **Swap intent**: The actual swap order containing swap parameters and the adapter contract and position manager approval signatures.

#### Execute the Operation

Then, execute the swap for the given quote.

```tsx title="Execute"
const execute = async (quote: SwapQuote) => {
  const result = await swapSupply({
    fromQuote: {
      quoteId: quote.quoteId,
    },
  });

  if (result.isErr()) {
    console.error(result.error);
    return;
  }

  console.log("Swap order placed:", result.value);
};
```

#### Handle the Result

Finally, handle the result.

```tsx title="Handle Result"
if (result.isErr()) {
  switch (result.error.name) {
    case "CancelError":
      return;

    case "SigningError":
      console.error(`Failed to sign: ${result.error.message}`);
      break;

    case "TimeoutError":
      console.error(`Timed out: ${result.error.message}`);
      break;

    case "TransactionError":
      console.error(`Failed: ${result.error.message}`);
      break;

    case "ValidationError":
      switch (result.error.cause.__typename) {
        case "InsufficientBalanceError":
          console.error(
            "Insufficient balance:",
            `required: ${result.error.cause.required.value.toDisplayString(2)}`,
            `available: ${result.error.cause.available.value.toDisplayString(2)}`,
          );
          break;
        case "InsufficientLiquidityError":
          console.error(`Insufficient liquidity: ${result.error.cause.reason}`);
          break;
      }
      break;

    case "UnexpectedError":
      console.error(result.error.message);
      break;
  }
} else {
  console.log("Swap order placed:", result.value);
}
```

That's it—you placed your first supply swap order. Keep track of its status in the [Monitor Swap Status](../tools/swaps#monitor-swap-status) section.

</tab>
<tab label="TypeScript">

To execute a supply swap with AaveKit TypeScript, follow these steps.

#### Get a Quote

First, use the `supplySwapQuote` action to get pricing information for the swap.

```ts title="Get Quote"
import { supplySwapQuote } from "@aave/client/actions";

import { client } from "./client";

// …

const result = await supplySwapQuote(client, request);

if (result.isErr()) {
  console.error(result.error);
  return;
}

// result.value.quote: SwapQuote
```

```ts title="client.ts"
import { AaveClient } from "@aave/client";

export const client = AaveClient.create();
```

You can specify a different currency to return fiat amounts in.

```ts title="Custom Currency"
import { Currency } from "@aave/client";

// …

const result = await supplySwapQuote(client, request, {
  currency: Currency.Eur,
});
```

#### Preview the Impact

Optionally, use the `preview` action to preview the impact of a supply swap operation on the user's position.

```ts title="Preview Swap"
import { preview } from "@aave/client/actions";
import { client } from "./client";

// …

const result = await supplySwapQuote(client, request).andThen(
  ({ approvals, quote }) =>
    preview(client, {
      action: {
        supplySwap: {
          fromQuote: {
            quoteId: quote.quoteId,
          },
        },
      },
    }),
);

if (result.isErr()) {
  console.error(result.error);
  return;
}

// result.value: PreviewUserPosition
```

The `PreviewUserPosition` shows the impact of the swap operation by comparing current and after states, with the table below outlining key fields and how to interpret them.

#### Sign Approvals

Then, use `signTypedDataWith` for the [wallet library of your choice](../getting-started/typescript#sign-typed-data) to sign the swap approvals and the `preparePositionSwap` action to prepare the swap.

```ts title="Prepare Swap"
import { preparePositionSwap } from "@aave/client/actions";

import { signApprovals } from "./signApprovals";

// …

const result = await supplySwapQuote(client, request)
  .andThen(signApprovals)
  .andThen((request) => preparePositionSwap(client, request));

if (result.isErr()) {
  console.error(result.error);
  return;
}

//
```

```ts title="signApprovals.ts"
import {
  type ResultAsync,
  type PreparePositionSwapRequest,
  type SupplySwapQuoteResult,
  type SigningError,
  okAsync,
} from "@aave/client";
import { signTypedDataWith } from "@aave/client/viem";

import { wallet } from "./wallet";

export async function signApprovals({
  approvals,
  quote,
}: SupplySwapQuoteResult): ResultAsync<
  PreparePositionSwapRequest,
  SigningError
> {
  let request: PreparePositionSwapRequest = {
    quoteId: data.quote.quoteId,
    adapterContractSignature: null,
    positionManagerSignature: null,
  };

  for (const approval of data.approvals) {
    const result = await signTypedDataWith(wallet, approval.bySignature);
    if (result.isErr()) return result;

    if (approval.__typename === "PositionSwapAdapterContractApproval") {
      request.adapterContractSignature = result.value;
    } else {
      request.positionManagerSignature = result.value;
    }
  }

  return okAsync(request);
}
```

```ts title="wallet.ts"
import { createWalletClient, http, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { mainnet } from "viem/chains";

export const wallet = createWalletClient({
  account: privateKeyToAccount(process.env.PRIVATE_KEY as Hex),
  chain: mainnet,
  transport: http(),
});
```

#### Execute the Swap

Then, sign the swap order typed data and execute the swap.

```tsx title="Execute Swap"
import { preparePositionSwap } from "@aave/client/actions";
import { signTypedData } from "@aave/client/viem";

import { signApprovals } from "./signApprovals";

import { wallet } from "./wallet";

const result = await supplySwapQuote(client, request)
  .andThen(signApprovals)
  .andThen((request) => preparePositionSwap(client, request))
  .andThen(({ newQuoteId, data }) =>
    signTypedData(wallet, data).andThen((signature) =>
      swap(client, { intent: { quoteId: newQuoteId, signature } }),
    ),
  );

// …
```

```ts title="wallet.ts"
import { createWalletClient, http, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { mainnet } from "viem/chains";

export const wallet = createWalletClient({
  account: privateKeyToAccount(process.env.PRIVATE_KEY as Hex),
  chain: mainnet,
  transport: http(),
});
```

#### Handle the Result

Finally, handle the result.

```tsx title="Handle Result"
// …

if (result.isErr()) {
  console.error(result.error);
  return;
}

if (result.value.__typename === "SwapReceipt") {
  console.log("Swap order placed:", result.value.id);
  return;
}

console.error("Unsupported result:", result.value.__typename);
```

That's it—you placed your first supply swap order. Keep track of its status in the [Monitor Swap Status](../tools/swaps#monitor-swap-status) section.

</tab>
<tab label="GraphQL">

To execute a supply swap with AaveKit GraphQL, follow these steps.

#### Get a Quote

Use the `supplySwapQuote` query to get pricing information for the swap.

```graphql title="Query"
query ($request: SupplySwapQuoteRequest!, $currency: Currency!) {
  supplySwapQuote(request: $request) {
    __typename
    ... on PositionSwapByIntentApprovalsRequired {
      quote {
        ...SwapQuote
      }
      approvals {
        ...PositionSwapApproval
      }
    }
    ... on InsufficientLiquidityError {
      reason
    }
  }
}
```

```graphql title="PositionSwapApproval"
fragment PositionSwapApproval on PositionSwapApproval {
  __typename
  ... on PositionSwapAdapterContractApproval {
    bySignature {
      ...SwapTypedData
    }
  }
  ... on PositionSwapPositionManagerApproval {
    byTransaction {
      ...TransactionRequest
    }
    bySignature {
      ...SwapTypedData
    }
  }
}
```

The response can be either:

- `PositionSwapByIntentApprovalsRequired`: The quote was successful, but the user needs to sign approvals before executing the swap.
- `InsufficientLiquidityError`: There's not enough liquidity for the requested swap amount.

The `PositionSwapByIntentApprovalsRequired` contains the `SwapQuote` with pricing details and the `PositionSwapApproval` list of required approvals to sign before executing the swap.

#### Preview the Impact (Optional)

Use the `preview` query with the `quoteId` from the previous step to preview the impact on the user's position:

```graphql title="Query"
query ($request: PreviewRequest!, $currency: Currency = USD) {
  preview(request: $request) {
    __typename
    id
    healthFactor {
      ...HealthFactorResult
    }
    netApy {
      ...PercentNumberVariation
    }
    riskPremium {
      ...PercentNumberVariation
    }
    netCollateral(currency: $currency) {
      ...ExchangeAmountVariation
    }
    netBalance(currency: $currency) {
      ...ExchangeAmountVariation
    }
    projectedEarnings(period: ANNUAL) {
      ...ExchangeAmountVariation
    }
    maxBorrowingPower {
      ...ExchangeAmountVariation
    }
    remainingBorrowingPower {
      ...ExchangeAmountVariation
    }
    otherConditions {
      ...UserPositionConditionVariation
    }
  }
}
```

Pass the `quoteId` in the `supplySwap.fromQuote` field:

```json title="Variables"
{
  "request": {
    "action": {
      "supplySwap": {
        "fromQuote": {
          "quoteId": "<quote-id-from-step-1>"
        }
      }
    }
  },
  "currency": "USD"
}
```

The `PreviewUserPosition` shows the impact of the swap operation by comparing current and after states, with the table below outlining key fields and how to interpret them.

#### Sign Approvals

Before proceeding, handle the required approvals from the quote response:

- **`PositionSwapAdapterContractApproval`**: Sign the `bySignature` typed data to authorize the swap adapter contract.
- **`PositionSwapPositionManagerApproval`**: Either send the `byTransaction` request or sign the `bySignature` typed data to authorize the position manager.

#### Prepare the Swap

Then, use the `preparePositionSwap` query to prepare the swap order with the quote ID and signed approvals.

```graphql title="Query"
query ($request: PreparePositionSwapRequest!) {
  preparePositionSwap(request: $request) {
    __typename
    ... on PrepareSwapOrder {
      newQuoteId
      data {
        ...SwapTypedData
      }
    }
    ... on InsufficientBalanceError {
      required {
        ...DecimalNumber
      }
      available {
        ...DecimalNumber
      }
    }
  }
}
```

```graphql title="SwapTypedData"
fragment SwapTypedData on SwapTypedData {
  __typename
  domain {
    name
    version
    chainId
    verifyingContract
  }
  types
  primaryType
  message
}
```

With the `quoteId` from the last quote response and the signed approvals, construct the request as follows:

```json title="Both Approvals by Signature"
{
  "request": {
    "quoteId": "<quote-id-from-step-1>",
    "adapterContractSignature": "0x…",
    "positionManagerSignature": "0x…"
  }
}
```

```json title="Position Manager Approval by Transaction"
{
  "request": {
    "quoteId": "<quote-id-from-step-1>",
    "adapterContractSignature": "0x…"
  }
}
```

```json title="No Approvals Needed"
{
  "request": {
    "quoteId": "<quote-id-from-step-1>"
  }
}
```

If the response is a `PrepareSwapOrder`, sign the `data` typed data and proceed to execute the swap. If it's an `InsufficientBalanceError`, inform the user about the insufficient balance.

#### Execute the Swap

Then, use the `swap` mutation to execute the swap order with the new quote ID and the signed intent from the previous step.

```graphql title="Mutation"
mutation ($request: SwapRequest!) {
  swap(request: $request) {
    __typename
    ... on SwapReceipt {
      id
      createdAt
    }
    ... on SwapTransactionRequest {
      transaction {
        ...TransactionRequest
      }
      orderReceipt {
        id
        createdAt
      }
    }
    ... on InsufficientBalanceError {
      required {
        ...DecimalNumber
      }
      available {
        ...DecimalNumber
      }
    }
  }
}
```

```graphql title="TransactionRequest"
fragment TransactionRequest on TransactionRequest {
  to
  from
  data
  value
  chainId
  operations
}
```

```json title="Variables"
{
  "request": {
    "intent": {
      "quoteId": "<new-quote-id-from-step-4>",
      "signature": "0x…"
    }
  }
}
```

> [!NOTE]
> Use the `newQuoteId` from the `preparePositionSwap` response.

#### Handle the Result

Finally, process the response based on the `__typename`:

- **`SwapReceipt`**: The swap order was placed successfully. Use the `id` to track its status.
- **`SwapTransactionRequest`**: Send the `transaction` request, then track the order using the `orderReceipt.id`.
- **`InsufficientBalanceError`**: Inform the user about the insufficient balance.

Track the swap order status using the [Monitor Swap Status](../tools/swaps#monitor-swap-status) section.

</tab>
</tabgroup>
## Swap Borrow Asset

Swapping borrow assets combines repay, swap, and re-borrow into one gasless step.

Common scenarios:

| Scenario              | Description                                                                                               |
| --------------------- | --------------------------------------------------------------------------------------------------------- |
| Rate Optimization     | User wants to switch debt from a high-interest token to a lower-interest one (e.g., USDC → GHO)           |
| Risk Management       | User wants to match their debt currency to their income or collateral to reduce currency exposure         |
| Liquidation Avoidance | User wants to swap volatile debt (e.g., ETH-denominated) to stable debt (e.g., USDC) to avoid liquidation |

Swapping borrow assets can be broken down into the following steps:

1. Identify the borrow position to swap from
2. Choose the target reserve to swap onto
3. Choose between market order and limit order
4. Execute the swap operation

### Borrow Position

Identify the borrow position among the user's [borrow positions](./fetch#user-borrows-fetching-user-borrows) where `reserve.canSwapFrom: true`.

```tsx title="UserBorrowItem"
const borrowPosition: UserBorrowItem = {
  id: "Ym9ycm93",
  reserve: {
    id: "SGVsbG8h",
    canSwapFrom: true,
    chain: {
      chainId: 1,
      name: "Ethereum",
    },
    spoke: {
      id: "aGVsbG8",
      // …
    },
    // …
  },
  debt: {
    amount: {
      value: BigDecimal(1000.0),
      exchange: {
        value: BigDecimal(1000.0),
        // …
      },
      // …
    },
    // …
  },
  principal: {
    amount: {
      value: BigDecimal(950.0),
      // …
    },
    // …
  },
  interest: {
    amount: {
      value: BigDecimal(50.0),
      // …
    },
    // …
  },
  // …
};
```

> [!NOTE]
> The `reserve.canSwapFrom` flag confirms that the corresponding reserve isn't
> paused and flash loans, required to perform the swap, are enabled.

### Target Reserve

Choose the target [reserve](../liquidity/reserves#listing-available-reserves) where `canBorrow: true`. The target reserve must be on the **same spoke** as the source borrow position.

> [!NOTE]
> Like with typical borrow operations, the `canBorrow` flag confirms that the
> reserve is active: it isn't frozen, it isn't paused, and the borrow cap has
> not been reached.

```tsx title="Target Reserve"
const targetReserve: Reserve = {
  id: "V29ybGQh",
  canBorrow: true,
  spoke: {
    id: "aGVsbG8",
    // …
  },
  asset: {
    underlying: {
      address: "0x40d16fc0246ad3160ccc09b8d0d3a2cd28ae6c2f",
      info: {
        name: "GHO",
        symbol: "GHO",
        decimals: 18,
        // …
      },
      // …
    },
    // …
  },
  summary: {
    borrowApy: {
      normalized: BigDecimal(2.5), // 2.5% APY
      // …
    },
    // …
  },
  userState: {
    borrowable: {
      exchange: {
        value: BigDecimal(5000.0),
        name: "USD",
        symbol: "$",
        // …
      },
      // …
    },
  },
  // …
};
```

Consider the following factors when selecting a target reserve:

- **Token**: Check `asset.underlying` for the token of the new debt position
- **Capacity**: Review `userState.borrowable` for sufficient borrow capacity
- **Rate**: Compare `summary.borrowApy` for favorable borrowing rates

### Market or Limit Order

You decide whether to use a market order or a limit order.

<tabgroup>
<tab label="Market Order">

Market orders execute at current rates.

```ts title="TypeScript"
const request: BorrowSwapQuoteRequest = {
  market: {
    debtPosition: borrowPosition.id,
    buyReserve: targetReserve.id,
    amount: bigDecimal(1000),
    user: evmAddress("0x123…"),
    // selectedSlippage: bigDecimal(1), // Optional: override suggested slippage
  },
};
```

```json title="GraphQL Variables"
{
  "request": {
    "market": {
      "debtPosition": "Ym9ycm93",
      "buyReserve": "V29ybGQh",
      "amount": "1000",
      "user": "0x123…"
    }
  }
}
```

The request takes the following parameters:

- `debtPosition` — The current borrow position to swap from
- `buyReserve` — The target reserve to swap to
- `amount` — The amount of the current debt to swap
- `user` — The user's address
- `selectedSlippage` — Optional slippage tolerance to use instead of the suggested slippage

</tab>
<tab label="Limit Order">

Limit orders execute when your price condition is met.

```ts title="TypeScript"
const request: BorrowSwapQuoteRequest = {
  limit: {
    currentPosition: borrowPosition.id,
    currentAmount: bigDecimal(1000),
    newReserve: targetReserve.id,
    newAmount: bigDecimal(1050), // Desired amount of new debt
    user: evmAddress("0x123…"),
    kind: BorrowSwapKind.Current,
    // deadline: new Date("2025-12-31T23:59:59Z"), // Optional: custom expiry
  },
};
```

```json title="GraphQL Variables"
{
  "request": {
    "limit": {
      "currentPosition": "Ym9ycm93",
      "currentAmount": "1000",
      "newReserve": "V29ybGQh",
      "newAmount": "1050",
      "user": "0x123…",
      "kind": "CURRENT"
    }
  }
}
```

The request takes the following parameters:

- `currentPosition` — The current borrow position to swap from
- `currentAmount` — The amount of the current debt to repay
- `newReserve` — The target reserve to swap to
- `newAmount` — The desired amount of new debt to take on
- `user` — The user's address
- `kind` — Current (default) or New, determines which amount is honored
- `deadline` — Optional deadline as DateTime; if not provided, uses default expiry

With both amounts specified, the `kind` parameter determines which amount takes priority:

| Kind    | User specifies…                                              | What happens with the order                                                          |
| ------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| Current | The exact **current** debt and a minimum **new** debt amount | Order fulfilled when new debt price allows desired exchange within current limit     |
| New     | The exact **new** debt amount and a maximum **current** debt | Order fulfilled when current debt price allows achieving the desired new debt amount |

</tab>
</tabgroup>
### Execute the Swap

<tabgroup>
<tab label="React">

To execute a borrow swap with AaveKit React, follow these steps.

#### Get a Quote

First, use the `useBorrowSwapQuote` hook (or the imperative `useBorrowSwapQuoteAction` variant) to get pricing information for the swap.

```tsx title="Loading State"
import { type BorrowSwapQuoteRequest, useBorrowSwapQuote } from "@aave/react";

function SwapQuote({ request }: { request: BorrowSwapQuoteRequest }) {
  const { data, loading, error } = useBorrowSwapQuote(request);

  if (loading) return Loading…;

  if (error) {
    if (error.name === "ValidationError") {
      switch (error.cause.__typename) {
        case "InsufficientLiquidityError":
          return Not enough liquidity for this swap;
      }
    }
    return {error.message};
  }

  // data: SwapQuote
  return (
    <div>
      New debt amount: {data.finalBuy.amount.value.toDisplayString()}
      Partner fee: {data.costs.partnerFee.amount.value.toDisplayString()}
      Slippage: {data.suggestedSlippage.normalized}%
    </div>
  );
}
```

```tsx title="React Suspense"
import { type BorrowSwapQuoteRequest, useBorrowSwapQuote } from "@aave/react";

function SwapQuote({ request }: { request: BorrowSwapQuoteRequest }) {
  const { data } = useBorrowSwapQuote({
    ...request,
    suspense: true,
  });

  // data: SwapQuote
  return (
    <div>
      New debt amount: {data.finalBuy.amount.value.toDisplayString()}
      Partner fee: {data.costs.partnerFee.amount.value.toDisplayString()}
      Slippage: {data.suggestedSlippage.normalized}%
    </div>
  );
}
```

```tsx title="Imperative Read"
import {
  type BorrowSwapQuoteRequest,
  useBorrowSwapQuoteAction,
} from "@aave/react";

const [getQuote, { called, data, error, loading }] = useBorrowSwapQuoteAction();

const handler = async (request: BorrowSwapQuoteRequest) => {
  const result = await getQuote(request);

  if (result.isOk()) {
    // result.value: SwapQuote
    console.log(result.value);
  } else {
    console.error(result.error);
  }
};
```

You can specify a different currency to return fiat amounts in.

```ts title="useBorrowSwapQuote"
import { Currency } from "@aave/react";

const { data, error, loading } = useBorrowSwapQuote({
  ...request,
  currency: Currency.Eur,
});
```

```ts title="useBorrowSwapQuoteAction"
import { Currency } from "@aave/react";

const [getQuote, { called, data, error, loading }] = useBorrowSwapQuoteAction({
  currency: Currency.Eur,
});
```

#### Preview the Impact

Then, use the `usePreview` hook (or the imperative `usePreviewAction` variant) to preview the impact of the swap operation on the user's position.

```tsx title="Loading State"
import { type SwapQuote, usePreview } from "@aave/react";

function SwapPreview({ quote }: { quote: SwapQuote }) {
  const { data, error, loading } = usePreview({
    action: {
      borrowSwap: {
        fromQuote: {
          quoteId: quote.quoteId,
        },
      },
    },
  });

  if (loading) return <div>Loading…</div>;
  if (error) return <div>Error: {error.message}</div>;

  // data: PreviewUserPosition
  return (
    <div>
      <h3>Health Factor:</h3>
      From: {data.healthFactor.current?.value.toFixed(2) ?? "N/A"}
      To: {data.healthFactor.after?.value.toFixed(2) ?? "N/A"}

      <h3>User Risk Premium:</h3>
      From: {data.riskPremium.current.normalized.toFixed(2)}%
      To: {data.riskPremium.after.normalized.toFixed(2)}%

      <h3>Net APY:</h3>
      From: {data.netApy.current.normalized.toFixed(2)}%
      To: {data.netApy.after.normalized.toFixed(2)}%

      <h3>Net Collateral:</h3>
      From: {data.netCollateral.current.value.toDisplayString(2)}
      To: {data.netCollateral.after.value.toDisplayString(2)}

      <h3>Max Borrowing Power:</h3>
      From: {data.maxBorrowingPower.current.value.toDisplayString(2)}
      To: {data.maxBorrowingPower.after.value.toDisplayString(2)}
    </div>
  );
}
```

```tsx title="React Suspense"
import { type SwapQuote, usePreview } from "@aave/react";

function SwapPreview({ quote }: { quote: SwapQuote }) {
  const { data, error, loading } = usePreview({
    action: {
      borrowSwap: {
        fromQuote: {
          quoteId: quote.quoteId,
        },
      },
    },
    suspense: true,
  });

  // data: PreviewUserPosition
  return (
    <div>
      <h3>Health Factor:</h3>
      From: {data.healthFactor.current?.value.toFixed(2) ?? "N/A"}
      To: {data.healthFactor.after?.value.toFixed(2) ?? "N/A"}

      <h3>User Risk Premium:</h3>
      From: {data.riskPremium.current.normalized.toFixed(2)}%
      To: {data.riskPremium.after.normalized.toFixed(2)}%

      <h3>Net APY:</h3>
      From: {data.netApy.current.normalized.toFixed(2)}%
      To: {data.netApy.after.normalized.toFixed(2)}%

      <h3>Net Collateral:</h3>
      From: {data.netCollateral.current.value.toDisplayString(2)}
      To: {data.netCollateral.after.value.toDisplayString(2)}

      <h3>Max Borrowing Power:</h3>
      From: {data.maxBorrowingPower.current.value.toDisplayString(2)}
      To: {data.maxBorrowingPower.after.value.toDisplayString(2)}
    </div>
  );
}
```

```tsx title="Imperative Read"
import { type SwapQuote, usePreviewAction } from "@aave/react";

// …

const [preview, { called, data, error, loading }] = usePreviewAction();

const handler = async (quote: SwapQuote) => {
  const result = await preview({
    action: {
      borrowSwap: {
        fromQuote: {
          quoteId: quote.quoteId,
        },
      },
    },
  });

  if (result.isOk()) {
    console.log(result.value); // PreviewUserPosition
  } else {
    console.error(result.error);
  }
};
```

The `PreviewUserPosition` shows the impact of the swap operation by comparing current and after states, with the table below outlining key fields and how to interpret them.

#### Configure Wallet Integration

Then, instantiate the `useSignTypedData` hook for the [wallet library of your choice](../getting-started/react#integrations).

```tsx title="Viem"
import { useWalletClient } from "wagmi";
import { useSignTypedData } from "@aave/react/viem";
// …

const { data: wallet } = useWalletClient();
const [signTypedData] = useSignTypedData(wallet);
```

#### Define the Swap Flow

Then, use the `useBorrowSwap` hook to handle the operation.

```tsx title="Basic Usage"
import { useBorrowSwap } from "@aave/react";

const [swapBorrow, { loading, error }] = useBorrowSwap((plan) => {
  switch (plan.__typename) {
    case "PositionSwapAdapterContractApproval":
    case "PositionSwapPositionManagerApproval":
      return signTypedData(plan.bySignature);

    case "SwapByIntent":
      return signTypedData(plan.data);
  }
});
```

```tsx title="Update Component State"
import { useBorrowSwap } from "@aave/react";

const [status, setStatus] = useState("");

const [swapBorrow, { loading, error }] = useBorrowSwap((plan) => {
  switch (plan.__typename) {
    case "PositionSwapAdapterContractApproval":
      setStatus("Sign the swap adapter approval in your wallet");
      return signTypedData(plan.bySignature);

    case "PositionSwapPositionManagerApproval":
      setStatus("Sign the swap position manager approval in your wallet");
      return signTypedData(plan.bySignature);

    case "SwapByIntent":
      setStatus("Sign the swap intent in your wallet");
      return signTypedData(plan.data);
  }
});
```

```tsx title="Cancel Flow"
import { useBorrowSwap } from "@aave/react";

const [swapBorrow, { loading, error }] = useBorrowSwap((plan) => {
  if (window.confirm("Are you sure you want to continue?") === false) {
    return cancel("User cancelled the operation");
  }

  switch (plan.__typename) {
    case "PositionSwapAdapterContractApproval":
    case "PositionSwapPositionManagerApproval":
      return signTypedData(plan.bySignature);

    case "SwapByIntent":
      return signTypedData(plan.data);
  }
});
```

The operation involves up to 3 signatures:

- **Swap adapter contract approval**: A one-time-use contract that encapsulates the swap logic. This signature ensures the contract is used only once for this specific swap operation.
- **Swap position manager approval**: Authorizes a dedicated [Position Manager](./managers) to operate on the user's position.
- **Swap intent**: The actual swap order containing swap parameters and the adapter contract and position manager approval signatures.

#### Execute the Operation

Then, execute the swap for the given quote.

```tsx title="Execute"
const execute = async (quote: SwapQuote) => {
  const result = await swapBorrow({
    fromQuote: {
      quoteId: quote.quoteId,
    },
  });

  if (result.isErr()) {
    console.error(result.error);
    return;
  }

  console.log("Swap order placed:", result.value);
};
```

#### Handle the Result

Finally, handle the result.

```tsx title="Handle Result"
if (result.isErr()) {
  switch (result.error.name) {
    case "CancelError":
      return;

    case "SigningError":
      console.error(`Failed to sign: ${result.error.message}`);
      break;

    case "TimeoutError":
      console.error(`Timed out: ${result.error.message}`);
      break;

    case "TransactionError":
      console.error(`Failed: ${result.error.message}`);
      break;

    case "ValidationError":
      switch (result.error.cause.__typename) {
        case "InsufficientBalanceError":
          console.error(
            "Insufficient balance:",
            `required: ${result.error.cause.required.value.toDisplayString(2)}`,
            `available: ${result.error.cause.available.value.toDisplayString(2)}`,
          );
          break;
        case "InsufficientLiquidityError":
          console.error(`Insufficient liquidity: ${result.error.cause.reason}`);
          break;
      }
      break;

    case "UnexpectedError":
      console.error(result.error.message);
      break;
  }
} else {
  console.log("Swap order placed:", result.value);
}
```

That's it—you placed your first borrow swap order. Keep track of its status in the [Monitor Swap Status](../tools/swaps#monitor-swap-status) section.

</tab>
<tab label="TypeScript">

To execute a borrow swap with AaveKit TypeScript, follow these steps.

#### Get a Quote

First, use the `borrowSwapQuote` action to get pricing information for the swap.

```ts title="Get Quote"
import { borrowSwapQuote } from "@aave/client/actions";

import { client } from "./client";

// …

const result = await borrowSwapQuote(client, request);

if (result.isErr()) {
  console.error(result.error);
  return;
}

// result.value.quote: SwapQuote
```

```ts title="client.ts"
import { AaveClient } from "@aave/client";

export const client = AaveClient.create();
```

You can specify a different currency to return fiat amounts in.

```ts title="Custom Currency"
import { Currency } from "@aave/client";

// …

const result = await borrowSwapQuote(client, request, {
  currency: Currency.Eur,
});
```

#### Preview the Impact

Optionally, use the `preview` action to preview the impact of a borrow swap operation on the user's position.

```ts title="Preview Swap"
import { preview } from "@aave/client/actions";
import { client } from "./client";

// …

const result = await borrowSwapQuote(client, request).andThen(
  ({ approvals, quote }) =>
    preview(client, {
      action: {
        borrowSwap: {
          fromQuote: {
            quoteId: quote.quoteId,
          },
        },
      },
    }),
);

if (result.isErr()) {
  console.error(result.error);
  return;
}

// result.value: PreviewUserPosition
```

The `PreviewUserPosition` shows the impact of the swap operation by comparing current and after states, with the table below outlining key fields and how to interpret them.

#### Sign Approvals

Then, use `signTypedDataWith` for the [wallet library of your choice](../getting-started/typescript#sign-typed-data) to sign the swap approvals and the `preparePositionSwap` action to prepare the swap.

```ts title="Prepare Swap"
import { preparePositionSwap } from "@aave/client/actions";

import { signApprovals } from "./signApprovals";

// …

const result = await borrowSwapQuote(client, request)
  .andThen(signApprovals)
  .andThen((request) => preparePositionSwap(client, request));

if (result.isErr()) {
  console.error(result.error);
  return;
}

//
```

```ts title="signApprovals.ts"
import {
  type ResultAsync,
  type PreparePositionSwapRequest,
  type BorrowSwapQuoteResult,
  type SigningError,
  okAsync,
} from "@aave/client";
import { signTypedDataWith } from "@aave/client/viem";

import { wallet } from "./wallet";

export async function signApprovals({
  approvals,
  quote,
}: BorrowSwapQuoteResult): ResultAsync<
  PreparePositionSwapRequest,
  SigningError
> {
  let request: PreparePositionSwapRequest = {
    quoteId: data.quote.quoteId,
    adapterContractSignature: null,
    positionManagerSignature: null,
  };

  for (const approval of data.approvals) {
    const result = await signTypedDataWith(wallet, approval.bySignature);
    if (result.isErr()) return result;

    if (approval.__typename === "PositionSwapAdapterContractApproval") {
      request.adapterContractSignature = result.value;
    } else {
      request.positionManagerSignature = result.value;
    }
  }

  return okAsync(request);
}
```

```ts title="wallet.ts"
import { createWalletClient, http, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { mainnet } from "viem/chains";

export const wallet = createWalletClient({
  account: privateKeyToAccount(process.env.PRIVATE_KEY as Hex),
  chain: mainnet,
  transport: http(),
});
```

#### Execute the Swap

Then, sign the swap order typed data and execute the swap.

```tsx title="Execute Swap"
import { preparePositionSwap } from "@aave/client/actions";
import { signTypedData } from "@aave/client/viem";

import { signApprovals } from "./signApprovals";

import { wallet } from "./wallet";

const result = await borrowSwapQuote(client, request)
  .andThen(signApprovals)
  .andThen((request) => preparePositionSwap(client, request))
  .andThen(({ newQuoteId, data }) =>
    signTypedData(wallet, data).andThen((signature) =>
      swap(client, { intent: { quoteId: newQuoteId, signature } }),
    ),
  );

// …
```

```ts title="wallet.ts"
import { createWalletClient, http, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { mainnet } from "viem/chains";

export const wallet = createWalletClient({
  account: privateKeyToAccount(process.env.PRIVATE_KEY as Hex),
  chain: mainnet,
  transport: http(),
});
```

#### Handle the Result

Finally, handle the result.

```tsx title="Handle Result"
// …

if (result.isErr()) {
  console.error(result.error);
  return;
}

if (result.value.__typename === "SwapReceipt") {
  console.log("Swap order placed:", result.value.id);
  return;
}

console.error("Unsupported result:", result.value.__typename);
```

That's it—you placed your first borrow swap order. Keep track of its status in the [Monitor Swap Status](../tools/swaps#monitor-swap-status) section.

</tab>
<tab label="GraphQL">

To execute a borrow swap with AaveKit GraphQL, follow these steps.

#### Get a Quote

Use the `borrowSwapQuote` query to get pricing information for the swap.

```graphql title="Query"
query ($request: BorrowSwapQuoteRequest!, $currency: Currency!) {
  borrowSwapQuote(request: $request) {
    __typename
    ... on PositionSwapByIntentApprovalsRequired {
      quote {
        ...SwapQuote
      }
      approvals {
        ...PositionSwapApproval
      }
    }
    ... on InsufficientLiquidityError {
      reason
    }
  }
}
```

```graphql title="PositionSwapApproval"
fragment PositionSwapApproval on PositionSwapApproval {
  __typename
  ... on PositionSwapAdapterContractApproval {
    bySignature {
      ...SwapTypedData
    }
  }
  ... on PositionSwapPositionManagerApproval {
    byTransaction {
      ...TransactionRequest
    }
    bySignature {
      ...SwapTypedData
    }
  }
}
```

The response can be either:

- `PositionSwapByIntentApprovalsRequired`: The quote was successful, but the user needs to sign approvals before executing the swap.
- `InsufficientLiquidityError`: There's not enough liquidity for the requested swap amount.

The `PositionSwapByIntentApprovalsRequired` contains the `SwapQuote` with pricing details and the `PositionSwapApproval` list of required approvals to sign before executing the swap.

#### Preview the Impact (Optional)

Use the `preview` query with the `quoteId` from the previous step to preview the impact on the user's position:

```graphql title="Query"
query ($request: PreviewRequest!, $currency: Currency = USD) {
  preview(request: $request) {
    __typename
    id
    healthFactor {
      ...HealthFactorResult
    }
    netApy {
      ...PercentNumberVariation
    }
    riskPremium {
      ...PercentNumberVariation
    }
    netCollateral(currency: $currency) {
      ...ExchangeAmountVariation
    }
    netBalance(currency: $currency) {
      ...ExchangeAmountVariation
    }
    projectedEarnings(period: ANNUAL) {
      ...ExchangeAmountVariation
    }
    maxBorrowingPower {
      ...ExchangeAmountVariation
    }
    remainingBorrowingPower {
      ...ExchangeAmountVariation
    }
    otherConditions {
      ...UserPositionConditionVariation
    }
  }
}
```

Pass the `quoteId` in the `borrowSwap.fromQuote` field:

```json title="Variables"
{
  "request": {
    "action": {
      "borrowSwap": {
        "fromQuote": {
          "quoteId": "<quote-id-from-step-1>"
        }
      }
    }
  },
  "currency": "USD"
}
```

The `PreviewUserPosition` shows the impact of the swap operation by comparing current and after states, with the table below outlining key fields and how to interpret them.

#### Sign Approvals

Before proceeding, handle the required approvals from the quote response:

- **`PositionSwapAdapterContractApproval`**: Sign the `bySignature` typed data to authorize the swap adapter contract.
- **`PositionSwapPositionManagerApproval`**: Either send the `byTransaction` request or sign the `bySignature` typed data to authorize the position manager.

#### Prepare the Swap

Then, use the `preparePositionSwap` query to prepare the swap order with the quote ID and signed approvals.

```graphql title="Query"
query ($request: PreparePositionSwapRequest!) {
  preparePositionSwap(request: $request) {
    __typename
    ... on PrepareSwapOrder {
      newQuoteId
      data {
        ...SwapTypedData
      }
    }
    ... on InsufficientBalanceError {
      required {
        ...DecimalNumber
      }
      available {
        ...DecimalNumber
      }
    }
  }
}
```

```graphql title="SwapTypedData"
fragment SwapTypedData on SwapTypedData {
  __typename
  domain {
    name
    version
    chainId
    verifyingContract
  }
  types
  primaryType
  message
}
```

With the `quoteId` from the last quote response and the signed approvals, construct the request as follows:

```json title="Both Approvals by Signature"
{
  "request": {
    "quoteId": "<quote-id-from-step-1>",
    "adapterContractSignature": "0x…",
    "positionManagerSignature": "0x…"
  }
}
```

```json title="Position Manager Approval by Transaction"
{
  "request": {
    "quoteId": "<quote-id-from-step-1>",
    "adapterContractSignature": "0x…"
  }
}
```

```json title="No Approvals Needed"
{
  "request": {
    "quoteId": "<quote-id-from-step-1>"
  }
}
```

If the response is a `PrepareSwapOrder`, sign the `data` typed data and proceed to execute the swap. If it's an `InsufficientBalanceError`, inform the user about the insufficient balance.

#### Execute the Swap

Then, use the `swap` mutation to execute the swap order with the new quote ID and the signed intent from the previous step.

```graphql title="Mutation"
mutation ($request: SwapRequest!) {
  swap(request: $request) {
    __typename
    ... on SwapReceipt {
      id
      createdAt
    }
    ... on SwapTransactionRequest {
      transaction {
        ...TransactionRequest
      }
      orderReceipt {
        id
        createdAt
      }
    }
    ... on InsufficientBalanceError {
      required {
        ...DecimalNumber
      }
      available {
        ...DecimalNumber
      }
    }
  }
}
```

```graphql title="TransactionRequest"
fragment TransactionRequest on TransactionRequest {
  to
  from
  data
  value
  chainId
  operations
}
```

```json title="Variables"
{
  "request": {
    "intent": {
      "quoteId": "<new-quote-id-from-step-4>",
      "signature": "0x…"
    }
  }
}
```

> [!WARNING]
> Use the `newQuoteId` from the `preparePositionSwap` response.

#### Handle the Result

Finally, process the response based on the `__typename`:

- **`SwapReceipt`**: The swap order was placed successfully. Use the `id` to track its status.
- **`SwapTransactionRequest`**: Send the `transaction` request, then track the order using the `orderReceipt.id`.
- **`InsufficientBalanceError`**: Inform the user about the insufficient balance.

Track the swap order status using the [Monitor Swap Status](../tools/swaps#monitor-swap-status) section.

</tab>
</tabgroup>
## Repay with Supply

Repay with supply combines withdraw, swap, and repay into one gasless step.

Common scenarios:

| Scenario             | Description                                                                                                  |
| -------------------- | ------------------------------------------------------------------------------------------------------------ |
| Avoid Liquidation    | User wants to improve [Health Factor](../positions#health-factor) by repaying debt using their supply        |
| Rebalance Positions  | User wants to consolidate stablecoin exposure by using idle supply to pay off debt in a different stablecoin |
| Reduce Debt Exposure | User wants to reduce debt load by converting non-collateral supply into debt repayment                       |

> [!WARNING]
> Repaying with a supply position reduces your supplied balance. If the asset is
> used as collateral, ensure your remaining position maintains a healthy state.

Repay with supply can be broken down into the following steps:

1. Identify the supply position to use for repayment
2. Identify the borrow position to repay
3. Choose between market order and limit order
4. Execute the swap operation

### Supply Position

Identify the supply position among the user's [supply positions](./fetch#user-supplies-fetching-user-supplies) where `reserve.canSwapFrom: true`.

```tsx title="UserSupplyItem"
const supplyPosition: UserSupplyItem = {
  id: "c3VwcGx5",
  reserve: {
    id: "SGVsbG8h",
    canSwapFrom: true,
    chain: {
      chainId: 1,
      name: "Ethereum",
    },
    spoke: {
      id: "aGVsbG8",
      // …
    },
    // …
  },
  isCollateral: true,
  balance: {
    amount: {
      value: BigDecimal(5000.0),
      exchange: {
        value: BigDecimal(5000.0),
        // …
      },
      // …
    },
    // …
  },
  principal: {
    amount: {
      value: BigDecimal(4800.0),
      // …
    },
    // …
  },
  interest: {
    amount: {
      value: BigDecimal(200.0),
      // …
    },
    // …
  },
  // …
};
```

> [!NOTE]
> The `reserve.canSwapFrom` flag confirms that the corresponding reserve isn't
> paused and flash loans, required to perform the swap, are enabled.

### Borrow Position

Identify the borrow position among the user's [borrow positions](./fetch#user-borrows-fetching-user-borrows) to repay.

```tsx title="UserBorrowItem"
const borrowPosition: UserBorrowItem = {
  id: "Ym9ycm93",
  reserve: {
    id: "V29ybGQh",
    spoke: {
      id: "aGVsbG8",
      // …
    },
    // …
  },
  debt: {
    amount: {
      value: BigDecimal(1000.0),
      exchange: {
        value: BigDecimal(1000.0),
        // …
      },
      // …
    },
    // …
  },
  principal: {
    amount: {
      value: BigDecimal(950.0),
      // …
    },
    // …
  },
  interest: {
    amount: {
      value: BigDecimal(50.0),
      // …
    },
    // …
  },
  // …
};
```

> [!NOTE]
> The supply and borrow positions must be on the **same spoke**. The supply
> position's reserve is what gets swapped and used to repay the debt.

### Market or Limit Order

You decide whether to use a market order or a limit order.

<tabgroup>
<tab label="Market Order">

Market orders execute at current rates.

```ts title="TypeScript"
const request: RepayWithSupplyQuoteRequest = {
  market: {
    debtPosition: borrowPosition.id,
    repayWithReserve: supplyPosition.reserve.id,
    amount: bigDecimal(1000),
    user: evmAddress("0x123…"),
    // kind: RepayWithSupplyKind.Repay, // Optional: specify repay or supply priority
    // selectedSlippage: bigDecimal(1), // Optional: override suggested slippage
  },
};
```

```json title="GraphQL Variables"
{
  "request": {
    "market": {
      "debtPosition": "Ym9ycm93",
      "repayWithReserve": "SGVsbG8h",
      "amount": "1000",
      "user": "0x123…",
      "kind": "REPAY" // Optional: "REPAY" or "SUPPLY"
    }
  }
}
```

The request takes the following parameters:

- `debtPosition` — The borrow position with debt to repay
- `repayWithReserve` — The reserve of the supply position to use for repayment
- `amount` — The swap amount, interpreted based on `kind`
- `user` — The user's address
- `kind` — Repay (default) or Supply, determines how `amount` is interpreted
- `selectedSlippage` — Optional slippage tolerance to use instead of the suggested slippage

Since only one amount is provided, the `kind` parameter determines how it's interpreted:

| Kind            | User inputs…                 | System calculates…                  |
| --------------- | ---------------------------- | ----------------------------------- |
| Repay (default) | The debt amount to **repay** | The supply amount needed            |
| Supply          | The supply amount to **use** | The debt amount that will be repaid |

</tab>
<tab label="Limit Order">

Limit orders execute when your price condition is met.

```ts title="TypeScript"
const request: RepayWithSupplyQuoteRequest = {
  limit: {
    repayPosition: borrowPosition.id,
    repayAmount: bigDecimal(1000),
    supplyPosition: supplyPosition.id,
    supplyAmount: bigDecimal(1050), // Amount of supply to use
    user: evmAddress("0x123…"),
    kind: RepayWithSupplyKind.Repay,
    // deadline: new Date("2025-12-31T23:59:59Z"), // Optional: custom expiry
  },
};
```

```json title="GraphQL Variables"
{
  "request": {
    "limit": {
      "repayPosition": "Ym9ycm93",
      "repayAmount": "1000",
      "supplyPosition": "c3VwcGx5",
      "supplyAmount": "1050",
      "user": "0x123…",
      "kind": "REPAY"
    }
  }
}
```

The request takes the following parameters:

- `repayPosition` — The borrow position with debt to repay
- `repayAmount` — The amount of debt to repay
- `supplyPosition` — The supply position to use for repayment
- `supplyAmount` — The amount of supply to use
- `user` — The user's address
- `kind` — Repay (default) or Supply, determines which amount is honored
- `deadline` — Optional deadline as DateTime; if not provided, uses default expiry

With both amounts specified, the `kind` parameter determines which amount takes priority:

| Kind   | User specifies…                                            | What happens with the order                                                      |
| ------ | ---------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Repay  | The exact **repay** amount and a maximum **supply** usage  | Order fulfilled when supply price allows full debt repayment within supply limit |
| Supply | The exact **supply** to use and a minimum **repay** amount | Order fulfilled when enough debt can be repaid using the specified supply amount |

</tab>
</tabgroup>
### Execute the Swap

<tabgroup>
<tab label="React">

To execute a repay with supply swap with AaveKit React, follow these steps.

#### Get a Quote

First, use the `useRepayWithSupplyQuote` hook (or the imperative `useRepayWithSupplyQuoteAction` variant) to get pricing information for the swap.

```tsx title="Loading State"
import {
  type RepayWithSupplyQuoteRequest,
  useRepayWithSupplyQuote,
} from "@aave/react";

function SwapQuote({ request }: { request: RepayWithSupplyQuoteRequest }) {
  const { data, loading, error } = useRepayWithSupplyQuote(request);

  if (loading) return Loading…;

  if (error) {
    if (error.name === "ValidationError") {
      switch (error.cause.__typename) {
        case "InsufficientLiquidityError":
          return Not enough liquidity for this swap;
      }
    }
    return {error.message};
  }

  // data: SwapQuote
  return (
    <div>
      Repay amount: {data.finalBuy.amount.value.toDisplayString()}
      Partner fee: {data.costs.partnerFee.amount.value.toDisplayString()}
      Slippage: {data.suggestedSlippage.normalized}%
    </div>
  );
}
```

```tsx title="React Suspense"
import {
  type RepayWithSupplyQuoteRequest,
  useRepayWithSupplyQuote,
} from "@aave/react";

function SwapQuote({ request }: { request: RepayWithSupplyQuoteRequest }) {
  const { data } = useRepayWithSupplyQuote({
    ...request,
    suspense: true,
  });

  // data: SwapQuote
  return (
    <div>
      Repay amount: {data.finalBuy.amount.value.toDisplayString()}
      Partner fee: {data.costs.partnerFee.amount.value.toDisplayString()}
      Slippage: {data.suggestedSlippage.normalized}%
    </div>
  );
}
```

```tsx title="Imperative Read"
import {
  type RepayWithSupplyQuoteRequest,
  useRepayWithSupplyQuoteAction,
} from "@aave/react";

const [getQuote, { called, data, error, loading }] =
  useRepayWithSupplyQuoteAction();

const handler = async (request: RepayWithSupplyQuoteRequest) => {
  const result = await getQuote(request);

  if (result.isOk()) {
    // result.value: SwapQuote
    console.log(result.value);
  } else {
    console.error(result.error);
  }
};
```

You can specify a different currency to return fiat amounts in.

```ts title="useRepayWithSupplyQuote"
import { Currency } from "@aave/react";

const { data, error, loading } = useRepayWithSupplyQuote({
  ...request,
  currency: Currency.Eur,
});
```

```ts title="useRepayWithSupplyQuoteAction"
import { Currency } from "@aave/react";

const [getQuote, { called, data, error, loading }] =
  useRepayWithSupplyQuoteAction({
    currency: Currency.Eur,
  });
```

#### Preview the Impact

Then, use the `usePreview` hook (or the imperative `usePreviewAction` variant) to preview the impact of the swap operation on the user's position.

```tsx title="Loading State"
import { type SwapQuote, usePreview } from "@aave/react";

function SwapPreview({ quote }: { quote: SwapQuote }) {
  const { data, error, loading } = usePreview({
    action: {
      repayWithSupply: {
        fromQuote: {
          quoteId: quote.quoteId,
        },
      },
    },
  });

  if (loading) return <div>Loading…</div>;
  if (error) return <div>Error: {error.message}</div>;

  // data: PreviewUserPosition
  return (
    <div>
      <h3>Health Factor:</h3>
      From: {data.healthFactor.current?.value.toFixed(2) ?? "N/A"}
      To: {data.healthFactor.after?.value.toFixed(2) ?? "N/A"}

      <h3>User Risk Premium:</h3>
      From: {data.riskPremium.current.normalized.toFixed(2)}%
      To: {data.riskPremium.after.normalized.toFixed(2)}%

      <h3>Net APY:</h3>
      From: {data.netApy.current.normalized.toFixed(2)}%
      To: {data.netApy.after.normalized.toFixed(2)}%

      <h3>Net Collateral:</h3>
      From: {data.netCollateral.current.value.toDisplayString(2)}
      To: {data.netCollateral.after.value.toDisplayString(2)}

      <h3>Max Borrowing Power:</h3>
      From: {data.maxBorrowingPower.current.value.toDisplayString(2)}
      To: {data.maxBorrowingPower.after.value.toDisplayString(2)}
    </div>
  );
}
```

```tsx title="React Suspense"
import { type SwapQuote, usePreview } from "@aave/react";

function SwapPreview({ quote }: { quote: SwapQuote }) {
  const { data, error, loading } = usePreview({
    action: {
      repayWithSupply: {
        fromQuote: {
          quoteId: quote.quoteId,
        },
      },
    },
    suspense: true,
  });

  // data: PreviewUserPosition
  return (
    <div>
      <h3>Health Factor:</h3>
      From: {data.healthFactor.current?.value.toFixed(2) ?? "N/A"}
      To: {data.healthFactor.after?.value.toFixed(2) ?? "N/A"}

      <h3>User Risk Premium:</h3>
      From: {data.riskPremium.current.normalized.toFixed(2)}%
      To: {data.riskPremium.after.normalized.toFixed(2)}%

      <h3>Net APY:</h3>
      From: {data.netApy.current.normalized.toFixed(2)}%
      To: {data.netApy.after.normalized.toFixed(2)}%

      <h3>Net Collateral:</h3>
      From: {data.netCollateral.current.value.toDisplayString(2)}
      To: {data.netCollateral.after.value.toDisplayString(2)}

      <h3>Max Borrowing Power:</h3>
      From: {data.maxBorrowingPower.current.value.toDisplayString(2)}
      To: {data.maxBorrowingPower.after.value.toDisplayString(2)}
    </div>
  );
}
```

```tsx title="Imperative Read"
import { type SwapQuote, usePreviewAction } from "@aave/react";

// …

const [preview, { called, data, error, loading }] = usePreviewAction();

const handler = async (quote: SwapQuote) => {
  const result = await preview({
    action: {
      repayWithSupply: {
        fromQuote: {
          quoteId: quote.quoteId,
        },
      },
    },
  });

  if (result.isOk()) {
    console.log(result.value); // PreviewUserPosition
  } else {
    console.error(result.error);
  }
};
```

The `PreviewUserPosition` shows the impact of the swap operation by comparing current and after states, with the table below outlining key fields and how to interpret them.

#### Configure Wallet Integration

Then, instantiate the `useSignTypedData` hook for the [wallet library of your choice](../getting-started/react#integrations).

```tsx title="Viem"
import { useWalletClient } from "wagmi";
import { useSignTypedData } from "@aave/react/viem";
// …

const { data: wallet } = useWalletClient();
const [signTypedData] = useSignTypedData(wallet);
```

#### Define the Swap Flow

Then, use the `useRepayWithSupply` hook to handle the operation.

```tsx title="Basic Usage"
import { useRepayWithSupply } from "@aave/react";

const [repayWithSupply, { loading, error }] = useRepayWithSupply((plan) => {
  switch (plan.__typename) {
    case "PositionSwapAdapterContractApproval":
    case "PositionSwapPositionManagerApproval":
      return signTypedData(plan.bySignature);

    case "SwapByIntent":
      return signTypedData(plan.data);
  }
});
```

```tsx title="Update Component State"
import { useRepayWithSupply } from "@aave/react";

const [status, setStatus] = useState("");

const [repayWithSupply, { loading, error }] = useRepayWithSupply((plan) => {
  switch (plan.__typename) {
    case "PositionSwapAdapterContractApproval":
      setStatus("Sign the swap adapter approval in your wallet");
      return signTypedData(plan.bySignature);

    case "PositionSwapPositionManagerApproval":
      setStatus("Sign the swap position manager approval in your wallet");
      return signTypedData(plan.bySignature);

    case "SwapByIntent":
      setStatus("Sign the swap intent in your wallet");
      return signTypedData(plan.data);
  }
});
```

```tsx title="Cancel Flow"
import { useRepayWithSupply } from "@aave/react";

const [repayWithSupply, { loading, error }] = useRepayWithSupply((plan) => {
  if (window.confirm("Are you sure you want to continue?") === false) {
    return cancel("User cancelled the operation");
  }

  switch (plan.__typename) {
    case "PositionSwapAdapterContractApproval":
    case "PositionSwapPositionManagerApproval":
      return signTypedData(plan.bySignature);

    case "SwapByIntent":
      return signTypedData(plan.data);
  }
});
```

The operation involves up to 3 signatures:

- **Swap adapter contract approval**: A one-time-use contract that encapsulates the swap logic. This signature ensures the contract is used only once for this specific swap operation.
- **Swap position manager approval**: Authorizes a dedicated [Position Manager](./managers) to operate on the user's position.
- **Swap intent**: The actual swap order containing swap parameters and the adapter contract and position manager approval signatures.

#### Execute the Operation

Then, execute the swap for the given quote.

```tsx title="Execute"
const execute = async (quote: SwapQuote) => {
  const result = await repayWithSupply({
    fromQuote: {
      quoteId: quote.quoteId,
    },
  });

  if (result.isErr()) {
    console.error(result.error);
    return;
  }

  console.log("Swap order placed:", result.value);
};
```

#### Handle the Result

Finally, handle the result.

```tsx title="Handle Result"
if (result.isErr()) {
  switch (result.error.name) {
    case "CancelError":
      return;

    case "SigningError":
      console.error(`Failed to sign: ${result.error.message}`);
      break;

    case "TimeoutError":
      console.error(`Timed out: ${result.error.message}`);
      break;

    case "TransactionError":
      console.error(`Failed: ${result.error.message}`);
      break;

    case "ValidationError":
      switch (result.error.cause.__typename) {
        case "InsufficientBalanceError":
          console.error(
            "Insufficient balance:",
            `required: ${result.error.cause.required.value.toDisplayString(2)}`,
            `available: ${result.error.cause.available.value.toDisplayString(2)}`,
          );
          break;
        case "InsufficientLiquidityError":
          console.error(`Insufficient liquidity: ${result.error.cause.reason}`);
          break;
      }
      break;

    case "UnexpectedError":
      console.error(result.error.message);
      break;
  }
} else {
  console.log("Swap order placed:", result.value);
}
```

That's it—you placed your first repay with supply order. Keep track of its status in the [Monitor Swap Status](../tools/swaps#monitor-swap-status) section.

</tab>
<tab label="TypeScript">

To execute a repay with supply swap with AaveKit TypeScript, follow these steps.

#### Get a Quote

First, use the `repayWithSupplyQuote` action to get pricing information for the swap.

```ts title="Get Quote"
import { repayWithSupplyQuote } from "@aave/client/actions";

import { client } from "./client";

// …

const result = await repayWithSupplyQuote(client, request);

if (result.isErr()) {
  console.error(result.error);
  return;
}

// result.value.quote: SwapQuote
```

```ts title="client.ts"
import { AaveClient } from "@aave/client";

export const client = AaveClient.create();
```

You can specify a different currency to return fiat amounts in.

```ts title="Custom Currency"
import { Currency } from "@aave/client";

// …

const result = await repayWithSupplyQuote(client, request, {
  currency: Currency.Eur,
});
```

#### Preview the Impact

Optionally, use the `preview` action to preview the impact of a repay with supply operation on the user's position.

```ts title="Preview Swap"
import { preview } from "@aave/client/actions";
import { client } from "./client";

// …

const result = await repayWithSupplyQuote(client, request).andThen(
  ({ approvals, quote }) =>
    preview(client, {
      action: {
        repayWithSupply: {
          fromQuote: {
            quoteId: quote.quoteId,
          },
        },
      },
    }),
);

if (result.isErr()) {
  console.error(result.error);
  return;
}

// result.value: PreviewUserPosition
```

The `PreviewUserPosition` shows the impact of the swap operation by comparing current and after states, with the table below outlining key fields and how to interpret them.

#### Sign Approvals

Then, use `signTypedDataWith` for the [wallet library of your choice](../getting-started/typescript#sign-typed-data) to sign the swap approvals and the `preparePositionSwap` action to prepare the swap.

```ts title="Prepare Swap"
import { preparePositionSwap } from "@aave/client/actions";

import { signApprovals } from "./signApprovals";

// …

const result = await repayWithSupplyQuote(client, request)
  .andThen(signApprovals)
  .andThen((request) => preparePositionSwap(client, request));

if (result.isErr()) {
  console.error(result.error);
  return;
}

//
```

```ts title="signApprovals.ts"
import {
  type ResultAsync,
  type PreparePositionSwapRequest,
  type RepayWithSupplyQuoteResult,
  type SigningError,
  okAsync,
} from "@aave/client";
import { signTypedDataWith } from "@aave/client/viem";

import { wallet } from "./wallet";

export async function signApprovals({
  approvals,
  quote,
}: RepayWithSupplyQuoteResult): ResultAsync<
  PreparePositionSwapRequest,
  SigningError
> {
  let request: PreparePositionSwapRequest = {
    quoteId: quote.quoteId,
    adapterContractSignature: null,
    positionManagerSignature: null,
  };

  for (const approval of approvals) {
    const result = await signTypedDataWith(wallet, approval.bySignature);
    if (result.isErr()) return result;

    if (approval.__typename === "PositionSwapAdapterContractApproval") {
      request.adapterContractSignature = result.value;
    } else {
      request.positionManagerSignature = result.value;
    }
  }

  return okAsync(request);
}
```

```ts title="wallet.ts"
import { createWalletClient, http, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { mainnet } from "viem/chains";

export const wallet = createWalletClient({
  account: privateKeyToAccount(process.env.PRIVATE_KEY as Hex),
  chain: mainnet,
  transport: http(),
});
```

#### Execute the Swap

Then, sign the swap order typed data and execute the swap.

```tsx title="Execute Swap"
import { preparePositionSwap, swap } from "@aave/client/actions";
import { signTypedData } from "@aave/client/viem";

import { signApprovals } from "./signApprovals";

import { wallet } from "./wallet";

const result = await repayWithSupplyQuote(client, request)
  .andThen(signApprovals)
  .andThen((request) => preparePositionSwap(client, request))
  .andThen(({ newQuoteId, data }) =>
    signTypedData(wallet, data).andThen((signature) =>
      swap(client, { intent: { quoteId: newQuoteId, signature } }),
    ),
  );

// …
```

```ts title="wallet.ts"
import { createWalletClient, http, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { mainnet } from "viem/chains";

export const wallet = createWalletClient({
  account: privateKeyToAccount(process.env.PRIVATE_KEY as Hex),
  chain: mainnet,
  transport: http(),
});
```

#### Handle the Result

Finally, handle the result.

```tsx title="Handle Result"
// …

if (result.isErr()) {
  console.error(result.error);
  return;
}

if (result.value.__typename === "SwapReceipt") {
  console.log("Swap order placed:", result.value.id);
  return;
}

console.error("Unsupported result:", result.value.__typename);
```

That's it—you placed your first repay with supply order. Keep track of its status in the [Monitor Swap Status](../tools/swaps#monitor-swap-status) section.

</tab>
<tab label="GraphQL">

To execute a repay with supply swap with AaveKit GraphQL, follow these steps.

#### Get a Quote

Use the `repayWithSupplyQuote` query to get pricing information for the swap.

```graphql title="Query"
query ($request: RepayWithSupplyQuoteRequest!, $currency: Currency!) {
  repayWithSupplyQuote(request: $request) {
    __typename
    ... on PositionSwapByIntentApprovalsRequired {
      quote {
        ...SwapQuote
      }
      approvals {
        ...PositionSwapApproval
      }
    }
    ... on InsufficientLiquidityError {
      reason
    }
  }
}
```

```graphql title="PositionSwapApproval"
fragment PositionSwapApproval on PositionSwapApproval {
  __typename
  ... on PositionSwapAdapterContractApproval {
    bySignature {
      ...SwapTypedData
    }
  }
  ... on PositionSwapPositionManagerApproval {
    byTransaction {
      ...TransactionRequest
    }
    bySignature {
      ...SwapTypedData
    }
  }
}
```

The response can be either:

- `PositionSwapByIntentApprovalsRequired`: The quote was successful, but the user needs to sign approvals before executing the swap.
- `InsufficientLiquidityError`: There's not enough liquidity for the requested swap amount.

The `PositionSwapByIntentApprovalsRequired` contains the `SwapQuote` with pricing details and the `PositionSwapApproval` list of required approvals to sign before executing the swap.

#### Preview the Impact (Optional)

Use the `preview` query with the `quoteId` from the previous step to preview the impact on the user's position:

```graphql title="Query"
query ($request: PreviewRequest!, $currency: Currency = USD) {
  preview(request: $request) {
    __typename
    id
    healthFactor {
      ...HealthFactorResult
    }
    netApy {
      ...PercentNumberVariation
    }
    riskPremium {
      ...PercentNumberVariation
    }
    netCollateral(currency: $currency) {
      ...ExchangeAmountVariation
    }
    netBalance(currency: $currency) {
      ...ExchangeAmountVariation
    }
    projectedEarnings(period: ANNUAL) {
      ...ExchangeAmountVariation
    }
    maxBorrowingPower {
      ...ExchangeAmountVariation
    }
    remainingBorrowingPower {
      ...ExchangeAmountVariation
    }
    otherConditions {
      ...UserPositionConditionVariation
    }
  }
}
```

Pass the `quoteId` in the `repayWithSupply.fromQuote` field:

```json title="Variables"
{
  "request": {
    "action": {
      "repayWithSupply": {
        "fromQuote": {
          "quoteId": "<quote-id-from-step-1>"
        }
      }
    }
  },
  "currency": "USD"
}
```

The `PreviewUserPosition` shows the impact of the swap operation by comparing current and after states, with the table below outlining key fields and how to interpret them.

#### Sign Approvals

Before proceeding, handle the required approvals from the quote response:

- **`PositionSwapAdapterContractApproval`**: Sign the `bySignature` typed data to authorize the swap adapter contract.
- **`PositionSwapPositionManagerApproval`**: Either send the `byTransaction` request or sign the `bySignature` typed data to authorize the position manager.

#### Prepare the Swap

Then, use the `preparePositionSwap` query to prepare the swap order with the quote ID and signed approvals.

```graphql title="Query"
query ($request: PreparePositionSwapRequest!) {
  preparePositionSwap(request: $request) {
    __typename
    ... on PrepareSwapOrder {
      newQuoteId
      data {
        ...SwapTypedData
      }
    }
    ... on InsufficientBalanceError {
      required {
        ...DecimalNumber
      }
      available {
        ...DecimalNumber
      }
    }
  }
}
```

```graphql title="SwapTypedData"
fragment SwapTypedData on SwapTypedData {
  __typename
  domain {
    name
    version
    chainId
    verifyingContract
  }
  types
  primaryType
  message
}
```

With the `quoteId` from the last quote response and the signed approvals, construct the request as follows:

```json title="Both Approvals by Signature"
{
  "request": {
    "quoteId": "<quote-id-from-step-1>",
    "adapterContractSignature": "0x…",
    "positionManagerSignature": "0x…"
  }
}
```

```json title="Position Manager Approval by Transaction"
{
  "request": {
    "quoteId": "<quote-id-from-step-1>",
    "adapterContractSignature": "0x…"
  }
}
```

```json title="No Approvals Needed"
{
  "request": {
    "quoteId": "<quote-id-from-step-1>"
  }
}
```

If the response is a `PrepareSwapOrder`, sign the `data` typed data and proceed to execute the swap. If it's an `InsufficientBalanceError`, inform the user about the insufficient balance.

#### Execute the Swap

Then, use the `swap` mutation to execute the swap order with the new quote ID and the signed intent from the previous step.

```graphql title="Mutation"
mutation ($request: SwapRequest!) {
  swap(request: $request) {
    __typename
    ... on SwapReceipt {
      id
      createdAt
    }
    ... on SwapTransactionRequest {
      transaction {
        ...TransactionRequest
      }
      orderReceipt {
        id
        createdAt
      }
    }
    ... on InsufficientBalanceError {
      required {
        ...DecimalNumber
      }
      available {
        ...DecimalNumber
      }
    }
  }
}
```

```graphql title="TransactionRequest"
fragment TransactionRequest on TransactionRequest {
  to
  from
  data
  value
  chainId
  operations
}
```

```json title="Variables"
{
  "request": {
    "intent": {
      "quoteId": "<new-quote-id-from-step-4>",
      "signature": "0x…"
    }
  }
}
```

> [!WARNING]
> Use the `newQuoteId` from the `preparePositionSwap` response.

#### Handle the Result

Finally, process the response based on the `__typename`:

- **`SwapReceipt`**: The swap order was placed successfully. Use the `id` to track its status.
- **`SwapTransactionRequest`**: Send the `transaction` request, then track the order using the `orderReceipt.id`.
- **`InsufficientBalanceError`**: Inform the user about the insufficient balance.

Track the swap order status using the [Monitor Swap Status](../tools/swaps#monitor-swap-status) section.

</tab>
</tabgroup>
## Withdraw and Swap

Withdraw assets from your supply position and receive them as a different token in one operation.

Common scenarios:

| Scenario     | Example                                        |
| ------------ | ---------------------------------------------- |
| Take Profits | Withdraw WETH supply and receive USDC directly |

> [!NOTE]
> This feature is coming soon. Documentation will be available upon release.

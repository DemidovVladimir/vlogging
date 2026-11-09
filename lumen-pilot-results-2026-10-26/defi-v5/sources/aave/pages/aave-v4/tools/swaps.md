# Swap Features

Learn how to perform and monitor swap operations with AaveKit.

---

Alongside the [Position Swaps](../positions/swaps) feature, AaveKit provides the following tools for swapping:

- **[Swap Tokens](#swap-tokens):** exchange tokens instantly at market price or set conditions with a limit order.
- **[Monitor Swap Status](#monitor-swap-status):** track the status of a swap.
- **[User Swaps](#user-swaps):** list and filter user swaps.
- **[Cancel a Swap](#cancel-a-swap):** cancel a swap in progress.

Swaps are implemented using a modular provider architecture. Currently, [CoW Protocol](https://cow.fi/) is the swap provider, offering MEV protection and optimal execution through batch auctions.

> [!TIP]
> Review the [fees](#fees) section to understand the swap costs.

## Swap Tokens

Token swaps can be executed in two ways:

- **Intent-based**: The swap is signed off-chain and submitted as an intent, which is then executed by a solver. This is the preferred method as it is gasless for users.
- **Transaction-based**: The swap is executed directly on-chain via a transaction. This method is used when intent-based execution is not available.

> [!NOTE]
> Native token swaps are always transaction-based since users must send funds
> directly.

Swapping tokens involves the following steps:

1. Select the token to swap from
2. Select the token to swap to
3. Choose between market order and limit order
4. Execute the swap operation

### Source Token

Fetch user token balances that can be swapped. This allows you to display only tokens the user owns that are swappable, making source token selection easier.

<tabgroup>
<tab label="React">

Use the `useUserBalances` hook with the `swappable` filter to list user tokens that can be swapped.

```tsx title="Loading State"
import type { UserBalancesRequest, TokenAmount } from "@aave/react";
import { useUserBalances } from "@aave/react";

function SwapFromToken({
  request,
  onSelect,
}: {
  request: UserBalancesRequest;
  onSelect: (amount: TokenAmount) => void;
}) {
  const { data, loading, error } = useUserBalances(request);

  return (
    <select
      disabled={loading || error}
      onChange={(e) => {
        const balance = data.find((b) => b.id === e.target.value);
        if (balance) onSelect(balance.balances[0]);
      }}
    >
      {data.map((balance) => (
        <option key={balance.id} value={balance.id}>
          {balance.info.symbol} ({balance.totalAmount.value.toDisplayString(2)})
        </option>
      ))}
    </select>
  );
}
```

```tsx title="React Suspense"
import {
  type UserBalancesRequest,
  type TokenAmount,
  useUserBalances,
} from "@aave/react";

function SwapFromToken({
  request,
  onSelect,
}: {
  request: UserBalancesRequest;
  onSelect: (amount: TokenAmount) => void;
}) {
  const { data } = useUserBalances({
    ...request,
    suspense: true,
  });

  if (data.length === 0) return No swappable tokens found;

  return (
    <select
      onChange={(e) => {
        const balance = data.find((b) => b.id === e.target.value);
        if (balance) onSelect(balance.balances[0]);
      }}
    >
      {data.map((balance) => (
        <option key={balance.id} value={balance.id}>
          {balance.info.symbol} ({balance.totalAmount.value.toDisplayString(2)})
        </option>
      ))}
    </select>
  );
}
```

You can query for swappable token balances as follows:

```tsx title="By Chain IDs"
import { evmAddress, chainId, OrderDirection } from "@aave/react";

const request: UserBalancesRequest = {
  user: evmAddress("0x456…"),
  filter: {
    swappable: {
      chainIds: [chainId(1)],
    },
  },
  orderBy: { balance: OrderDirection.Desc },
};
```

```tsx title="Include Zero Balances"
import { evmAddress, chainId, OrderDirection } from "@aave/react";

const request: UserBalancesRequest = {
  user: evmAddress("0x456…"),
  filter: {
    swappable: {
      chainIds: [chainId(1)],
    },
  },
  orderBy: { balance: OrderDirection.Desc },
  includeZeroBalances: true,
};
```

</tab>

<tab label="TypeScript">

Use the `userBalances` action with the `swappable` filter to list user tokens that can be swapped.

```ts title="By Chain IDs"
import { userBalances } from "@aave/client/actions";
import { evmAddress, chainId, OrderDirection } from "@aave/client";

import { client } from "./client";

const result = await userBalances(client, {
  user: evmAddress("0x456…"),
  filter: {
    swappable: {
      chainIds: [chainId(1)],
    },
  },
  orderBy: { balance: OrderDirection.Desc },
});

if (result.isErr()) {
  console.error(result.error);
} else {
  // result.value: UserBalance[]
  result.value.forEach((balance) => {
    console.log(
      `${balance.info.symbol}: ${balance.totalAmount.value.toDisplayString(2)}`,
    );
  });
}
```

```ts title="client.ts"
import { AaveClient } from "@aave/client";

export const client = AaveClient.create();
```

</tab>

<tab label="GraphQL">

Use the `userBalances` query with the `swappable` filter to list user tokens that can be swapped.

```graphql title="Query"
query ($request: UserBalancesRequest!) {
  userBalances(request: $request) {
    info {
      __typename
      ... on Erc20Token {
        symbol
        name
        address
        chainId
      }
      ... on NativeToken {
        symbol
        name
        chainId
      }
    }
    balances {
      ...TokenAmount
    }
    totalAmount {
      value
    }
  }
}
```

```graphql title="TokenAmount"
fragment TokenAmount on TokenAmount {
  __typename

  ... on Erc20Amount {
    amount {
      value
    }
    token {
      address
      chainId
    }
  }
  ... on NativeAmount {
    amount {
      value
    }
    token {
      chainId
    }
  }
}
```

Use the `filter.swappable` field to filter by swappable tokens.

```json title="By Chain IDs"
{
  "request": {
    "user": "0x456…",
    "filter": {
      "swappable": {
        "chainIds": [1]
      }
    },
    "orderBy": {
      "balance": "DESC"
    }
  }
}
```

```json title="Include Zero Balances"
{
  "request": {
    "user": "0x456…",
    "filter": {
      "swappable": {
        "chainIds": [1]
      }
    },
    "orderBy": {
      "balance": "DESC"
    },
    "includeZeroBalances": true
  }
}
```

</tab>

</tabgroup>
> [!TIP]
> For more details on filtering and sorting user balances, see the [User
> Balances](./balances#fetching-user-balances) documentation.

### Destination Token

Once you've selected a source token, fetch the tokens you can swap TO. This ensures you only display valid swap destinations for the selected source token.

<tabgroup>
<tab label="React">

Use `useSwappableTokens` to list destination tokens based on your selected source token.

```tsx title="Loading State"
import type { SwappableTokensRequest, Token } from "@aave/react";
import { useSwappableTokens } from "@aave/react";

function SwapToToken({
  request,
  onSelect,
}: {
  request: SwappableTokensRequest;
  onSelect: (token: Token) => void;
}) {
  const { data, loading, error } = useSwappableTokens(request);

  return (
    <>
      <select
        disabled={loading}
        onChange={(e) => {
          const token = data.find((t) => t.info.address === e.target.value);
          if (token) onSelect(token);
        }}
      >
        {data.map((token) => (
          <option key={token.info.address} value={token.info.address}>
            {token.info.symbol} ({token.info.name})
          </option>
        ))}
      </select>
      {error && {error.message}}
    </>
  );
}
```

```tsx title="React Suspense"
import type { SwappableTokensRequest, Token } from "@aave/react";
import { useSwappableTokens } from "@aave/react";

function SwapToToken({
  request,
  onSelect,
}: {
  request: SwappableTokensRequest;
  onSelect: (token: Token) => void;
}) {
  const { data } = useSwappableTokens({
    ...request,
    suspense: true,
  });

  return (
    <select
      disabled={data.length === 0}
      onChange={(e) => {
        const token = data.find((t) => t.info.address === e.target.value);
        if (token) onSelect(token);
      }}
    >
      {data.map((token) => (
        <option key={token.info.address} value={token.info.address}>
          {token.info.symbol} ({token.info.name})
        </option>
      ))}
    </select>
  );
}
```

You can query for a list of swappable tokens as follows:

```tsx title="By Chain IDs"
const request: SwappableTokensRequest = {
  query: {
    chainIds: [chainId(1)],
  },
};
```

```tsx title="For Selected Source Token"
const request: SwappableTokensRequest = {
  query: {
    from: {
      erc20: evmAddress("0xA0b86a33E6…"),
      chainId: chainId(1),
    },
  },
};
```

```tsx title="By Specific Tokens"
const request: SwappableTokensRequest = {
  query: {
    tokens: [
      { address: evmAddress("0xA0b86a33E6…"), chainId: chainId(1) },
      { address: evmAddress("0x6B175474E…"), chainId: chainId(1) },
    ],
  },
};
```

</tab>

<tab label="TypeScript">

Use `swappableTokens` to list destination tokens based on your selected source token.

```ts title="By Chain IDs"
import { chainId } from "@aave/client";
import { swappableTokens } from "@aave/client/actions";

import { client } from "./client";

const result = await swappableTokens(client, {
  query: { chainIds: [chainId(1)] },
});

if (result.isErr()) {
  console.error(result.error);
} else {
  // result.value: Token[]
  result.value.forEach((token) => {
    console.log(`Token: ${token.info.symbol} (${token.info.name})`);
  });
}
```

```ts title="For Selected Source Token"
import { chainId } from "@aave/client";
import { swappableTokens } from "@aave/client/actions";

import { client } from "./client";

const result = await swappableTokens(client, {
  query: {
    from: {
      erc20: { address: evmAddress("0xA0b86a33E6…"), chainId: chainId(1) },
    },
  },
});

if (result.isErr()) {
  console.error(result.error);
} else {
  // result.value: Token[]
  result.value.forEach((token) => {
    console.log(`Token: ${token.info.symbol} (${token.info.name})`);
  });
}
```

```ts title="By Specific Tokens"
import { chainId, evmAddress } from "@aave/client";
import { swappableTokens } from "@aave/client/actions";

import { client } from "./client";

const result = await swappableTokens(client, {
  query: {
    tokens: [
      { address: evmAddress("0xA0b86a33E6…"), chainId: chainId(1) },
      { address: evmAddress("0x6B175474E…"), chainId: chainId(1) },
    ],
  },
});

if (result.isErr()) {
  console.error(result.error);
} else {
  // result.value: Token[]
  result.value.forEach((token) => {
    console.log(`Token: ${token.info.symbol} (${token.info.name})`);
  });
}
```

```ts title="client.ts"
import { AaveClient } from "@aave/client";

export const client = AaveClient.create();
```

</tab>

<tab label="GraphQL">

Use the `swappableTokens` query to list destination tokens based on your selected source token.

```graphql
query ($request: SwappableTokensRequest!) {
  swappableTokens(request: $request) {
    __typename
    ... on Erc20Token {
      ...Erc20Token
    }
    ... on NativeToken {
      ...NativeToken
    }
  }
}
```

Use the `query` field to select destination tokens by different criteria.

```json title="By Chain IDs"
{
  "request": {
    "query": {
      "chainIds": [1]
    }
  }
}
```

```json title="For Selected Source Token"
{
  "request": {
    "query": {
      "from": {
        "erc20": { "address": "0xA0b86a33E6…", "chainId": 1 }
      }
    }
  }
}
```

```json title="By Specific Tokens"
{
  "request": {
    "query": {
      "tokens": [
        { "address": "0xA0b86a33E6…", "chainId": 1 },
        { "address": "0x6B175474E…", "chainId": 1 }
      ]
    }
  }
}
```

</tab>

</tabgroup>
### Market or Limit Order

Once you've identified the tokens to swap, the next step is choosing an order type. Market orders execute immediately at the current rate, while limit orders wait until your specified price conditions are met.

<tabgroup>
<tab label="Market">

To place a market order, specify the token pair, amount, and swap direction.

```ts title="TypeScript"
const request: TokenSwapQuoteRequest = {
  market: {
    chainId: chainId(1),
    buy: { erc20: evmAddress("0xA0b86a33E6…") },
    sell: { erc20: evmAddress("0x6B175474E…") },
    amount: bigDecimal("1000"),
    kind: TokenSwapKind.Buy,
    user: evmAddress("0x742d35cc…"), // Your address
    receiver: evmAddress("0x742d35cc…"), // In case the receiver is different from the user
    selectedSlippage: bigDecimal("2"), // 2%
  },
};
```

```json title="GraphQL Variables"
{
  "request": {
    "market": {
      "chainId": 1,
      "buy": { "erc20": "0xA0b86a33E6…" },
      "sell": { "erc20": "0x6B175474E…" },
      "amount": "1000",
      "kind": "BUY",
      "user": "0x742d35cc…", // Your address
      "receiver": "0x742d35cc…", // In case the receiver is different from the user
      "selectedSlippage": "2" // 2%
    }
  }
}
```

The request takes the following parameters:

- `chainId` — The target chain
- `sell` — The token to sell (`native` or `erc20`)
- `buy` — The token to receive (`native` or `erc20`)
- `amount` — The swap amount, interpreted based on `kind`
- `kind` — Sell (default) or Buy, determines how `amount` is interpreted
- `user` — The sender address
- `receiver` — The recipient address (defaults to `user`)
- `selectedSlippage` — Optional slippage tolerance to use instead of the suggested slippage

Since only one amount is provided, the swap kind determines what gets calculated:

| Swap Kind | User inputs…                                                 | System calculates…                               |
| --------- | ------------------------------------------------------------ | ------------------------------------------------ |
| Sell      | How much of the token to **sell** and which token to **buy** | The amount of the buy token you'll receive       |
| Buy       | How much of the token to **buy** and which token to **sell** | The amount of the sell token you need to provide |

Depending on the token pair, swaps can be performed in different ways:

```ts title="Erc20 → Erc20"
const request: TokenSwapQuoteRequest = {
  market: {
    chainId: chainId(1),
    buy: { erc20: evmAddress("0xA0b86a33E6…") },
    sell: { erc20: evmAddress("0x6B175474E…") },
    amount: bigDecimal("1000"),
    user: evmAddress("0x742d35cc…"), // Your address
  },
};
```

```ts title="Native → Erc20"
const request: TokenSwapQuoteRequest = {
  market: {
    chainId: chainId(1),
    sell: { native: true },
    buy: { erc20: evmAddress("0x6B175474E…") },
    amount: bigDecimal("1000"),
    user: evmAddress("0x742d35cc…"), // Your address
  },
};
```

```ts title="Erc20 → Native"
const request: TokenSwapQuoteRequest = {
  market: {
    chainId: chainId(1),
    sell: { erc20: evmAddress("0x6B175474E…") },
    buy: { native: true },
    amount: bigDecimal("1000"),
    user: evmAddress("0x742d35cc…"), // Your address
  },
};
```

</tab>
<tab label="Limit">

To place a limit order, specify exact amounts for both the sell and buy tokens.

```ts title="TypeScript"
const request: TokenSwapQuoteRequest = {
  limit: {
    chainId: chainId(1),
    sell: {
      erc20: {
        address: evmAddress("0x6B175474E…"),
        value: bigDecimal("1000"),
      },
    },
    buy: {
      erc20: {
        address: evmAddress("0xA0b86a33E6…"),
        value: bigDecimal("1000"),
      },
    },
    user: evmAddress("0x742d35cc…"),
    receiver: evmAddress("0x742d35cc…"),
    // kind: TokenSwapKind.Buy, default is TokenSwapKind.Sell
    // previousQuoteId: quote.quoteId, if available
  },
};
```

```json title="GraphQL Variables"
{
  "request": {
    "limit": {
      "chainId": 1,
      "sell": {
        "erc20": {
          "address": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
          "value": "1000000000000000000"
        }
      },
      "buy": {
        "erc20": {
          "address": "0xA0b86a33E6417e6C7b4…",
          "value": "1000"
        }
      },
      "user": "0x742d35cc…",
      "receiver": "0x742d35cc…",
      "kind": "BUY"
    }
  }
}
```

The request takes the following parameters:

- `chainId` — The target chain
- `sell` — The token and amount to sell
- `buy` — The token and amount to receive
- `user` — The sender address
- `receiver` — The recipient address (defaults to `user`)
- `kind` — Sell (default) or Buy, determines which amount is honored
- `previousQuoteId` — Optional quote ID from a prior market order
- `deadline` — Optional deadline as DateTime; if not provided, uses default expiry

With both amounts specified, the swap kind determines which amount takes priority:

| Swap Kind | User specifies…                                        | What happens with the order                                                                                         |
| --------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| Sell      | The exact **sell** amount and a minimum **buy** amount | The order is fulfilled when the buy price is large enough to accommodate the user's ask and the swap costs          |
| Buy       | The exact **buy** amount and a maximum **sell** amount | The order is fulfilled when the sell price is small enough to accommodate the user's desired buy and the swap costs |

Depending on the token pair, limit orders can be configured in different ways:

```ts title="Erc20 → Erc20"
const request: TokenSwapQuoteRequest = {
  limit: {
    chainId: chainId(1),
    sell: {
      erc20: {
        address: evmAddress("0x6B175474E…"),
        value: bigDecimal("1000"),
      },
    },
    buy: {
      erc20: {
        address: evmAddress("0xA0b86a33E6…"),
        value: bigDecimal("950"),
      },
    },
    user: evmAddress("0x742d35cc…"),
  },
};
```

```ts title="Erc20 → Native"
const request: TokenSwapQuoteRequest = {
  limit: {
    chainId: chainId(1),
    sell: {
      erc20: {
        address: evmAddress("0xA0b86a33E6…"),
        value: bigDecimal("3000"),
      },
    },
    buy: {
      native: bigDecimal("1"),
    },
    user: evmAddress("0x742d35cc…"),
  },
};
```

> [!WARNING]
> Limit orders from native tokens are currently not supported via CoW Protocol
> to avoid holding user funds.

</tab>
</tabgroup>
### Execute Swaps

<tabgroup>
<tab label="React">

To execute the swap operation with AaveKit React, follow these steps.

#### Get Swap Quote

First, use the `useTokenSwapQuote` hook (or the imperative `useTokenSwapQuoteAction` variant) to get a swap quote.

```tsx title="Loading State"
import { type TokenSwapQuoteRequest, useTokenSwapQuote } from "@aave/react";

function DisplayQuote({ request }: { request: TokenSwapQuoteRequest }) {
  const { data, loading, error } = useTokenSwapQuote(request);

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

  return (
    <div>
      <h3>Swap Quote</h3>
      <h4>{data.quoteId}</h4>
      Suggested slippage: {data.suggestedSlippage}
      Costs: {data.costs}
    </div>
  );
}
```

```tsx title="React Suspense"
import { type TokenSwapQuoteRequest, useTokenSwapQuote } from "@aave/react";

function DisplayQuote({ request }: { request: TokenSwapQuoteRequest }) {
  const { data } = useTokenSwapQuote({
    ...request,
    suspense: true,
  });

  if (!data) return No quote found;

  return (
    <div>
      <h3>Swap Quote</h3>
      <h4>{data.quoteId}</h4>
      Suggested slippage: {data.suggestedSlippage}
      Costs: {data.costs}
    </div>
  );
}
```

```tsx title="Imperative Read"
import {
  type TokenSwapQuoteRequest,
  useTokenSwapQuoteAction,
} from "@aave/react";

// …

const [getQuote, { called, data, error, loading }] = useTokenSwapQuoteAction();

const handler = async (request: TokenSwapQuoteRequest) => {
  const result = await getQuote(request);

  if (result.isOk()) {
    console.log(result.value); // SwapQuote
  } else {
    console.error(result.error);
  }
};
```

> [!WARNING]
> The `useTokenSwapQuoteAction` hook does **not** watch for updates. Use it when
> you need on-demand, fresh data (e.g., in an event handler).

You can specify a different currency to return fiat amounts in.

```tsx title="Declarative Read"
import { Currency } from "@aave/react";

const { data, error, loading } = useTokenSwapQuote({
  ...request,
  currency: Currency.Eur,
});
```

```tsx title="Imperative Read"
import { Currency } from "@aave/react";

const [getQuote, { called, data, error, loading }] = useTokenSwapQuoteAction({
  currency: Currency.Eur,
});
```

> [!TIP]
> For limit orders, consider fetching a market quote first to get current `buy`
> and `sell` values. Use these as a baseline to repeat the swap quote with a
> limit order request.

#### Configure Wallet Integration

Then, instantiate the hooks for the [wallet library of your choice](../getting-started/react#integrations):

- `useSendTransaction` — used to send ERC-20 approval and swap transactions when needed
- `useSignTypedData` — used to sign ERC-20 permits and swap order typed data

```tsx title="Viem"
import { useWalletClient } from "wagmi";
import { useSendTransaction, useSignTypedData } from "@aave/react/viem";

// …

const { data: wallet } = useWalletClient();
const [sendTransaction] = useSendTransaction(wallet);
const [signTypedData] = useSignTypedData(wallet);
```

#### Define the Swap Flow

Then, use the `useTokenSwap` hook to handle the operation.

```tsx title="Basic Usage"
import { useTokenSwap } from "@aave/react";

// …

const [swap, { loading, error }] = useTokenSwap((plan) => {
  switch (plan.__typename) {
    case "Erc20Approval":
      if (plan.bySignature) {
        return signTypedData(plan.bySignature);
      }
      return sendTransaction(plan.byTransaction);

    case "SwapTransactionRequest":
      return sendTransaction(plan.transaction);

    case "SwapTypedData":
      return signTypedData(plan);
  }
});
```

```tsx title="Update Component State"
import { useTokenSwap } from "@aave/react";

// …

const [status, setStatus] = useState("");

const [swap, { loading, error }] = useTokenSwap((plan) => {
  switch (plan.__typename) {
    case "Erc20Approval":
      setStatus("Please approve the token in your wallet");
      if (plan.bySignature) {
        return signTypedData(plan.bySignature).andTee(() =>
          setStatus("Signing permit…"),
        );
      }
      return sendTransaction(plan.byTransaction).andTee(() =>
        setStatus("Approving…"),
      );

    case "SwapTransactionRequest":
      setStatus("Please sign the Swap transaction in your wallet");
      return sendTransaction(plan.transaction).andTee(() =>
        setStatus("Swapping…"),
      );

    case "SwapTypedData":
      setStatus("Please sign the Swap Quote in your wallet");
      return signTypedData(plan).andTee(() => setStatus("Signing…"));
  }
});
```

```tsx title="Cancel Flow"
import { useTokenSwap } from "@aave/react";

// …

const [swap, { loading, error }] = useTokenSwap((plan, { cancel }) => {
  if (window.confirm("Are you sure you want to continue?") === false) {
    return cancel("User cancelled the operation");
  }

  switch (plan.__typename) {
    case "Erc20Approval":
      if (plan.bySignature) {
        return signTypedData(plan.bySignature);
      }
      return sendTransaction(plan.byTransaction);

    case "SwapTransactionRequest":
      return sendTransaction(plan.transaction);

    case "SwapTypedData":
      return signTypedData(plan);
  }
});
```

#### Execute the Swap Operation

Then, execute the swap. The approach differs based on order type: market orders execute immediately at current prices, while limit orders let you set specific price conditions.

<tabgroup>
<tab label="Market Order">

For market orders, call `swap` with the `quoteId` from the last market order quote.

```tsx title="Basic Usage"
const execute = async (quote: SwapQuote) => {
  const result = await swap({
    fromQuote: {
      quoteId: quote.quoteId,
    },
  });

  if (result.isErr()) {
    console.error(result.error);
    return;
  }

  // result.value: SwapReceipt
  console.log("Swap order placed:", result.value);
};
```

</tab>
<tab label="Limit Order">

For limit orders, call `swap` with a `limit` request that includes the `previousQuoteId` from the last swap quote.

```tsx title="Execute Limit Order Request"
const execute = async ({ limit }: TokenSwapQuoteRequest) => {
  const result = await swap({
    limit: {
      ...limit,
      previousQuoteId: quote.quoteId, // from prior market order quote
    },
  });

  if (result.isErr()) {
    console.error(result.error);
    return;
  }

  // result.value: SwapReceipt
  console.log("Swap order placed:", result.value);
};
```

</tab>
</tabgroup>
#### Handle the Result

Finally, handle the result.

```tsx title="Handle Result"
if (result.isErr()) {
  switch (result.error.name) {
    case "CancelError":
      // The user cancelled the operation
      return;

    case "SigningError":
      console.error(`Failed to sign: ${result.error.message}`);
      break;

    case "TimeoutError":
      console.error(`Transaction timed out: ${result.error.message}`);
      break;

    case "TransactionError":
      console.error(`Transaction failed: ${result.error.message}`);
      break;

    case "ValidationError":
      switch (result.error.cause.__typename) {
        case "InsufficientBalanceError":
          console.error(
            `Insufficient balance: ${result.error.cause.required.value.toDisplayString(2)} required.`,
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
  return;
}
// result.value: SwapReceipt
console.log("Swap order placed:", result.value);
```

That's it—you placed your first swap order. Keep track of its status in the [Monitor Swap Status](#monitor-swap-status) section.

</tab>

<tab label="TypeScript">

To execute the swap operation with AaveKit TypeScript, follow these steps.

#### Get Quote

First, use the `tokenSwapQuote` action to get pricing information for the swap.

```ts title="Get Quote"
import { tokenSwapQuote } from "@aave/client/actions";

import { client } from "./client";

// …

const result = await tokenSwapQuote(client, request);

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

const result = await tokenSwapQuote(client, request, {
  currency: Currency.Eur,
});
```

#### Handle Approvals

Then, using helpers from the [wallet library of your choice](../getting-started/typescript#integrations), use `signERC20PermitWith` and `sendWith` to handle ERC-20 approvals, and `prepareTokenSwap` with `signTypedDataWith` to sign intent-based swap orders.

```ts title="Handle Approvals"
import { okAsync } from "@aave/client";

import { handleApprovals } from "./handleApprovals";

// …

const result = await tokenSwapQuote(client, request) //
  .andThen(handleApprovals);
```

```ts title="handleApprovals.ts"
import { type TokenSwapQuoteResult, okAsync } from "@aave/client";
import { signTypedDataWith, sendWith } from "@aave/client/viem";

import { wallet } from "./wallet";
import { signSwapOrder } from "./signSwapOrder";

// …

export function handleApprovals(result: TokenSwapQuoteResult) {
  switch (result.__typename) {
    case "SwapByTransaction":
      return okAsync({
        transaction: { quoteId: result.quote.quoteId },
      });

    case "SwapByTransactionWithApprovalRequired":
      return result.approvals
        .reduce(
          (acc, approval) =>
            acc.andThen(() => sendWith(wallet, approval.byTransaction)),
          okAsync(undefined as void),
        )
        .andThen(() =>
          okAsync({
            transaction: { quoteId: result.quote.quoteId },
          }),
        );

    case "SwapByIntent":
      return signSwapOrder({ quoteId: result.quote.quoteId });

    case "SwapByIntentWithApprovalRequired":
      // Permit-based approval (only available for single approval)
      if (result.approvals.length === 1 && result.approvals[0].bySignature) {
        const approval = result.approvals[0];
        return signTypedDataWith(wallet, approval.bySignature)
          .map((signature) => ({
            deadline: approval.bySignature.message.deadline,
            value: signature,
          }))
          .andThen((permitSig) =>
            signSwapOrder({ quoteId: result.quote.quoteId, permitSig }),
          );
      }

      // Transaction-based approval (handles multiple approvals for USDT-like tokens)
      return result.approvals
        .reduce(
          (acc, approval) =>
            acc.andThen(() => sendWith(wallet, approval.byTransaction)),
          okAsync(undefined as void),
        )
        .andThen(() => signSwapOrder({ quoteId: result.quote.quoteId }));

    case "InsufficientLiquidityError":
      throw new Error(`Insufficient liquidity: ${result.reason}`);
  }
}
```

```ts title="signSwapOrder.ts"
import type { PrepareTokenSwapRequest } from "@aave/client";
import { prepareTokenSwap } from "@aave/client/actions";
import { signTypedDataWith } from "@aave/client/viem";

import { client } from "./client";
import { wallet } from "./wallet";

export function signSwapOrder(request: PrepareTokenSwapRequest) {
  return prepareTokenSwap(client, request)
    .andThen(({ newQuoteId, data }) => signTypedDataWith(wallet, data))
    .map((signature) => ({
      intent: { quoteId: newQuoteId, signature },
    }));
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

> [!NOTE]
> For tokens like [USDT on Ethereum
> Mainnet](https://etherscan.io/token/0xdac17f958d2ee523a2206206994597c13d831ec7)
> that require an allowance reset, the SDK automatically handles multiple
> approvals. The `sendWith` helper processes all required approval transactions
> in sequence before the main swap operation: once with a reset to 0, then once
> with the new allowance value.

#### Execute the Swap

Then, use the `swap` action to execute the swap. For transaction-based swaps, use the `sendWith` helper to submit the transaction.

```ts title="Execute Swap"
import { swap } from "@aave/client/actions";
import { sendWith } from "@aave/client/viem";

import { handleApprovals } from "./handleApprovals";
import { wallet } from "./wallet";

const result = await tokenSwapQuote(client, request)
  .andThen(handleApprovals)
  .andThen((request) => swap(client, request))
  .andThen((plan) => {
    switch (plan.__typename) {
      case "SwapReceipt":
        return okAsync(plan);

      case "SwapTransactionRequest":
        return sendWith(wallet, plan.transaction).map(() => plan.orderReceipt);
    }
  });

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

```ts title="Handle Result"
// …

if (result.isErr()) {
  switch (result.error.name) {
    case "CancelError":
      console.error("Operation cancelled by user wallet");
      break;

    case "SigningError":
      console.error("Signing failed:", result.error.message);
      break;

    case "TransactionError":
      console.error("Transaction failed:", result.error.message);
      break;

    case "ValidationError":
      switch (result.error.cause.__typename) {
        case "InsufficientBalanceError":
          console.error(
            `Insufficient balance: ${result.error.cause.required.value.toDisplayString(2)} required.`,
          );
          break;
        case "InsufficientLiquidityError":
          console.error(`Insufficient liquidity: ${result.error.cause.reason}`);
          break;
      }
      break;

    case "UnexpectedError":
      console.error("Unexpected error:", result.error.message);
      break;
  }
  return;
}

if (result.value.__typename === "SwapReceipt") {
  console.log("Swap order placed:", result.value.id);
  return;
}

console.error("Unsupported result:", result.value.__typename);
```

That's it—you placed your first swap order. Keep track of its status in the [Monitor Swap Status](#monitor-swap-status) section.

</tab>

<tab label="GraphQL">

To execute the swap operation with the AaveKit API, follow these steps.

#### Get a Swap Quote

First, use the `tokenSwapQuote` query to get a swap quote.

  
```graphql title="Query"
query ($request: TokenSwapQuoteRequest!, $currency: Currency = USD) {
  tokenSwapQuote(request: $request) {
    __typename
    ... on SwapByIntent {
      ...SwapByIntent
    }
    ... on SwapByIntentWithApprovalRequired {
      ...SwapByIntentWithApprovalRequired
    }
    ... on SwapByTransaction {
      ...SwapByTransaction
    }
    ... on SwapByTransactionWithApprovalRequired {
      ...SwapByTransactionWithApprovalRequired
    }
  }
}
```

```graphql title="SwapByIntent"
fragment SwapByIntent on SwapByIntent {
  __typename
  quote {
    ...SwapQuote
  }
  data {
    ...SwapTypedData
  }
}
```

```graphql title="SwapByIntentWithApprovalRequired"
fragment SwapByIntentWithApprovalRequired on SwapByIntentWithApprovalRequired {
  __typename
  approvals {
    ...Erc20Approval
  }
  quote {
    ...SwapQuote
  }
}
```

```graphql title="SwapByTransaction"
fragment SwapByTransaction on SwapByTransaction {
  __typename
  quote {
    ...SwapQuote
  }
}
```

```graphql title="SwapByTransactionWithApprovalRequired"
fragment SwapByTransactionWithApprovalRequired on SwapByTransactionWithApprovalRequired {
  __typename
  quote {
    ...SwapQuote
  }
  approvals {
    ...Erc20Approval
  }
}
```

```graphql title="SwapQuote"
fragment SwapQuote on SwapQuote {
  __typename
  accuracy
  quoteId
  suggestedSlippage {
    ...PercentNumber
  }
  buy {
    ...TokenAmount
  }
  sell {
    ...TokenAmount
  }
  costs {
    __typename
    networkCosts {
      ...TokenAmount
    }
    partnerFee {
      ...TokenAmount
    }
    flashloanFee {
      ...TokenAmount
    }
    providerFee {
      ...TokenAmount
    }
  }
  finalBuy {
    ...TokenAmount
  }
  finalSell {
    ...TokenAmount
  }
}
```

You can also specify a different currency to return fiat amounts:

```json title="Custom Currency"
{
  "request": {
    "market": {
      "chainId": 1,
      "buy": { "erc20": "0xA0b86a33E6…" },
      "sell": { "native": true },
      "amount": "1000",
      "kind": "SELL",
      "user": "0x742d35cc…"
    }
  },
  "currency": "EUR"
}
```

When requesting a swap quote, focus on three details: the token pair, the amount, and the swap direction (buy or sell). Since only one amount is provided, the direction determines which token that amount refers to:

| Swap Kind | User inputs…                                                 | System calculates…                               |
| --------- | ------------------------------------------------------------ | ------------------------------------------------ |
| Sell      | How much of the token to **sell** and which token to **buy** | The amount of the buy token you'll receive       |
| Buy       | How much of the token to **buy** and which token to **sell** | The amount of the sell token you need to provide |

Depending on the token pair, swaps can be performed in different ways:

```json title="Erc20 → Erc20"
{
  "request": {
    "market": {
      "chainId": 1,
      "buy": { "erc20": "0xA0b86a33E6…" },
      "sell": { "erc20": "0x6B175474E…" },
      "amount": "1000",
      "kind": "SELL", // SELL, BUY (see table above)
      "user": "0x742d35cc…"
    }
  }
}
```

```json title="Native → Erc20"
{
  "request": {
    "market": {
      "chainId": 1,
      "sell": { "native": true },
      "buy": { "erc20": "0xA0b86a33E6…" },
      "amount": "1000",
      "kind": "BUY", // SELL, BUY (see table above)
      "user": "0x742d35cc…"
    }
  }
}
```

```json title="Erc20 → Native"
{
  "request": {
    "market": {
      "chainId": 1,
      "sell": { "erc20": "0xA0b86a33E6…" },
      "buy": { "native": true },
      "amount": "1000",
      "kind": "SELL", // SELL, BUY (see table above)
      "user": "0x742d35cc…"
    }
  }
}
```

#### Handle Swap Quote Response

Depending on the `TokenSwapQuoteResult` type, you'll need to follow different actions:

| Response Type                             | Action                                                                                                            |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **SwapByIntent**                          | No need to sign anything—just pass the quoteId to the `prepareTokenSwap` query.                                   |
| **SwapByIntentWithApprovalRequired**      | Send the approval request using the account specified in `user`, then sign the typed data with that same account. |
| **SwapByTransaction**                     | Keep a note of the `quoteId`.                                                                                     |
| **SwapByTransactionWithApprovalRequired** | Send each transaction from `approvals` in sequence, then keep a note of the `quoteId`.                            |
| **InsufficientLiquidityError**            | Not enough liquidity available for this swap. Display the error to the user or suggest a smaller amount.          |

Below are examples illustrating the response for each response type.

```json title="SwapByIntent"
{
  "data": {
    "prepareTokenSwap": {
      "__typename": "SwapByIntent",
      "quote": {
        "quoteId": "Qx8…"
        // …
      },
      "data": {
        // …
      }
    }
  }
}
```

```json title="SwapByIntentWithApprovalRequired"
{
  "data": {
    "prepareTokenSwap": {
      "__typename": "SwapByIntentWithApprovalRequired",
      "approvals": [
        {
          // …
        }
      ],
      "quote": {
        "quoteId": "Qx8…"
        // …
      },
      "data": {
        // …
      }
    }
  }
}
```

```json title="SwapByTransaction"
{
  "data": {
    "prepareTokenSwap": {
      "__typename": "SwapByTransaction",
      "quote": {
        "quoteId": "Qx8…"
        // …
      }
    }
  }
}
```

```json title="SwapByTransactionWithApprovalRequired"
{
  "data": {
    "prepareTokenSwap": {
      "__typename": "SwapByTransactionWithApprovalRequired",
      "approvals": [
        {
          // …
        }
      ],
      "quote": {
        "quoteId": "Qx8…"
        // …
      }
    }
  }
}
```

```json title="InsufficientLiquidityError"
{
  "data": {
    "prepareTokenSwap": {
      "__typename": "InsufficientLiquidityError",
      "reason": "Not enough liquidity available for this swap amount"
    }
  }
}
```

#### Prepare the Swap

Then, use the `prepareTokenSwap` query to prepare the swap.

```graphql title="Query"
query ($request: PrepareTokenSwapRequest!) {
  prepareTokenSwap(request: $request) {
    __typename
    ... on SwapByIntent {
      ...SwapByIntent
    }
    ... on InsufficientBalanceError {
      ...InsufficientBalanceError
    }
  }
}
```

```graphql title="SwapByIntent"
fragment SwapByIntent on SwapByIntent {
  __typename
  quote {
    ...SwapQuote
  }
  data {
    ...SwapByIntentTypedData
  }
}
```

```graphql title="SwapTypedData"
fragment SwapTypedData on SwapTypedData {
  __typename
  types
  primaryType
  domain {
    ...DomainData
  }
  message
}
```

Define `PrepareTokenSwapRequest` taking the `quoteId` from the previous step and signature when needed.

```json title="QuoteId"
{
  "request": {
    "quoteId": "<quote.quoteId>"
  }
}
```

```json title="QuoteId and Signature"
{
  "request": {
    "quoteId": "<quote.quoteId>",
    "permitSig": "<signature>"
  }
}
```

#### Handle Prepare Swap Response

Depending on the `PrepareTokenSwapResult` type, you'll need to follow different actions:

| Response Type                | Action                                                                  |
| ---------------------------- | ----------------------------------------------------------------------- |
| **SwapByIntent**             | Sign the typed data with the account performing the swap.               |
| **InsufficientBalanceError** | Notify the user that their balance is insufficient to perform the swap. |

Below are examples illustrating the response for each response type.

```json title="SwapByIntent"
{
  "data": {
    "prepareTokenSwap": {
      "__typename": "SwapByIntent",
      "quote": {
        "quoteId": "Qx8…"
        // …
      },
      "data": {
        // …
      }
    }
  }
}
```

```json title="Error"
{
  "data": {
    "prepareTokenSwap": {
      "__typename": "InsufficientBalanceError",
      "required": {
        "value": "150.000000",
        "decimals": 6
      },
      "available": {
        "value": "75.500000",
        "decimals": 6
      }
    }
  }
}
```

#### Execute the Swap

Then, execute the swap using the `swap` mutation.

```graphql title="Mutation"
mutation ($request: SwapRequest!) {
  swap(request: $request) {
    __typename
    ... on SwapTransactionRequest {
      ...SwapTransactionRequest
    }
    ... on SwapReceipt {
      ...SwapReceipt
    }
    ... on InsufficientBalanceError {
      ...InsufficientBalanceError
    }
  }
}
```

```graphql title="SwapTransactionRequest"
fragment SwapTransactionRequest on SwapTransactionRequest {
  __typename
  transaction {
    ...TransactionRequest
  }
  orderReceipt {
    ...SwapReceipt
  }
}
```

```graphql title="SwapReceipt"
fragment SwapReceipt on SwapReceipt {
  __typename
  id
  createdAt
}
```

The `SwapRequest` object gets the inputs from the previously executed `prepareTokenSwap` query in case of "SwapByIntent" and the `quoteId` in case of "SwapByTransaction" or "SwapByTransactionWithApprovalRequired" from `tokenSwapQuote` query.

```json title="Swap Intent"
{
  "request": {
    "intent": {
      "quoteId": "<prepareTokenSwap.quote.quoteId>",
      "signature": "0x456…"
    }
  }
}
```

```json title="Swap Transaction"
{
  "request": {
    "transaction": {
      "quoteId": "<prepareTokenSwap.quote.quoteId>"
    }
  }
}
```

#### Handle Execute Swap Response

Depending on the `SwapExecutionPlan` type, you'll need to follow different actions:

| Response Type                | Action                                                                  |
| ---------------------------- | ----------------------------------------------------------------------- |
| **SwapTransactionRequest**   | Send the transaction with the account performing the swap.              |
| **SwapReceipt**              | The swap order has been placed.                                         |
| **InsufficientBalanceError** | Notify the user that their balance is insufficient to perform the swap. |

Below are examples illustrating the response for each response type.

```json title="SwapTransactionRequest"
{
  "data": {
    "swap": {
      "__typename": "SwapTransactionRequest",
      "transaction": {
        // …
      },
      "orderReceipt": {
        "__typename": "SwapReceipt",
        "id": "Qx8…",
        "createdAt": "2021-01-01T00:00:00Z"
      }
    }
  }
}
```

```json title="SwapReceipt"
{
  "data": {
    "swap": {
      "__typename": "SwapReceipt",
      "id": "Qx8…",
      "createdAt": "2021-01-01T00:00:00Z"
    }
  }
}
```

```json title="Error"
{
  "data": {
    "swap": {
      "__typename": "InsufficientBalanceError",
      "required": {
        "value": "150.000000",
        "decimals": 6
      },
      "available": {
        "value": "75.500000",
        "decimals": 6
      }
    }
  }
}
```

</tab>

</tabgroup>
## Monitor Swap Status

Once the swap is executed, a `SwapReceipt` object is returned with an `id` field. Use this `id` to track the swap status.
For more details, see the [Execute Swaps](#execute-swaps) section.

<tabgroup>
<tab label="React">

Use the `useSwapStatus` hook to monitor the status of a swap in real-time.

```tsx title="Loading State"
import { useSwapStatus } from "@aave/react";

function MonitorSwap({ swapReceipt }: { swapReceipt: SwapReceipt }) {
  const { data, loading, error } = useSwapStatus({
    id: swapReceipt.id,
  });

  if (loading) return Monitoring swap…;

  if (error) return Error: {error.message};

  switch (data.__typename) {
    case "SwapOpen":
      return Swap is open, waiting for execution…;

    case "SwapPendingSignature":
      return Waiting for signature…;

    case "SwapFulfilled":
      return (
        <div>
          Swap completed successfully!
          <a href={data.explorerUrl}>View transaction</a>
        </div>
      );

    case "SwapCancelled":
      return Swap was cancelled at {data.cancelledAt};

    case "SwapExpired":
      return Swap expired at {data.expiredAt};
  }
}
```

```tsx title="React Suspense"
import { useSwapStatus } from "@aave/react";

function MonitorSwap({ swapReceipt }: { swapReceipt: SwapReceipt }) {
  const { data } = useSwapStatus({
    id: swapReceipt.id,
    suspense: true,
  });

  switch (data.__typename) {
    case "SwapOpen":
      return Swap is open, waiting for execution…;

    case "SwapPendingSignature":
      return Waiting for signature…;

    case "SwapFulfilled":
      return (
        <div>
          Swap completed successfully!
          <a href={data.explorerUrl}>View transaction</a>
        </div>
      );

    case "SwapCancelled":
      return Swap was cancelled at {data.cancelledAt};

    case "SwapExpired":
      return Swap expired at {data.expiredAt};
  }
}
```

The hook automatically polls for status updates until the swap reaches a terminal state: fulfilled, cancelled, or expired.

</tab>

<tab label="TypeScript">

Use the `swapStatus` action to check the current status of a swap, or `waitForSwapOutcome` to poll until it reaches a terminal state.

```ts title="Check Status"
import { swapStatus } from "@aave/client/actions";

import { client } from "./client";

const result = await swapStatus(client, { id: swapReceipt.id });

if (result.isErr()) {
  console.error(result.error);
} else {
  switch (result.value.__typename) {
    case "SwapOpen":
      console.log("Swap is open, waiting for execution…");
      break;
    case "SwapPendingSignature":
      console.log("Waiting for signature…");
      break;
    case "SwapFulfilled":
      console.log("Swap completed:", result.value.txHash);
      break;
    case "SwapCancelled":
      console.log("Swap was cancelled:", result.value.cancelledAt);
      break;
    case "SwapExpired":
      console.log("Swap expired:", result.value.expiredAt);
      break;
  }
}
```

```ts title="Poll Until Terminal State"
import { waitForSwapOutcome } from "@aave/client/actions";

import { client } from "./client";

const result = await waitForSwapOutcome(client)(swapReceipt);

// result.value: SwapFulfilled | SwapCancelled | SwapExpired
```

```ts title="client.ts"
import { AaveClient } from "@aave/client";

export const client = AaveClient.create();
```

</tab>

<tab label="GraphQL">

Use the `swapStatus` query to track the swap status.

```graphql title="Query"
query {
  swapStatus(request: { id: "<swapReceipt.id>" }) {
    __typename
    ... on SwapOpen {
      ...SwapOpen
    }
    ... on SwapPendingSignature {
      ...SwapPendingSignature
    }
    ... on SwapCancelled {
      ...SwapCancelled
    }
    ... on SwapExpired {
      ...SwapExpired
    }
    ... on SwapFulfilled {
      ...SwapFulfilled
    }
  }
}
```

The `SwapStatus` object can be one of the following:

```graphql title="SwapOpen"
fragment SwapOpen on SwapOpen {
  __typename
  swapId
  createdAt
  deadline
  explorerUrl
  operation {
    ...SwapOperation
  }
}
```

```graphql title="SwapPendingSignature"
fragment SwapPendingSignature on SwapPendingSignature {
  __typename
  swapId
  createdAt
  deadline
  explorerUrl
  operation {
    ...SwapOperation
  }
}
```

```graphql title="SwapCancelled"
fragment SwapCancelled on SwapCancelled {
  __typename
  swapId
  createdAt
  cancelledAt
  explorerUrl
  operation {
    ...SwapOperation
  }
}
```

```graphql title="SwapExpired"
fragment SwapExpired on SwapExpired {
  __typename
  swapId
  createdAt
  expiredAt
  explorerUrl
  operation {
    ...SwapOperation
  }
}
```

```graphql title="SwapFulfilled"
fragment SwapFulfilled on SwapFulfilled {
  __typename
  swapId
  txHash
  createdAt
  fulfilledAt
  explorerUrl
  refundTxHash
  operation {
    ...SwapOperation
  }
}
```

```graphql title="SwapOperation"
fragment SwapOperation on SwapOperation {
  __typename
  ... on TokenSwap {
    sell {
      ...TokenAmount
    }
    buy {
      ...TokenAmount
    }
    kind
    orderClass
  }
  ... on SupplySwap {
    sell {
      ...PositionAmount
    }
    buy {
      ...PositionAmount
    }
    kind
    orderClass
  }
  ... on BorrowSwap {
    sell {
      ...PositionAmount
    }
    buy {
      ...PositionAmount
    }
    kind
    orderClass
  }
  ... on RepayWithSupply {
    repay {
      ...PositionAmount
    }
    supply {
      ...PositionAmount
    }
    kind
    orderClass
  }
  ... on WithdrawSwap {
    withdraw {
      ...PositionAmount
    }
    buy {
      ...TokenAmount
    }
    kind
    orderClass
  }
}
```

</tab>

</tabgroup>
## User Swaps

List and filter user swaps with built-in pagination support.

<tabgroup>
<tab label="React">

Use the `useUserSwaps` hook to list user swaps.

```tsx title="Loading State"
import { useUserSwaps, evmAddress, chainId } from "@aave/react";

function ListUserSwaps({ request }: { request: UserSwapsRequest }) {
  const { data, loading, error } = useUserSwaps(request);

  if (loading) return <div>Loading…</div>;

  if (error) return <div>Error: {error.message}</div>;

  // data.items: Array<SwapStatus>
  return (
    <div>
      <h3>User Swaps</h3>
      {data.items.map((swapStatus) => (
        <div key={swapStatus.createdAt}>
          <p>
            Status - {swapStatus.__typename} - {swapStatus.explorerUrl}
          </p>
        </div>
      ))}
    </div>
  );
}
```

```tsx title="React Suspense"
import { useUserSwaps, evmAddress, chainId, SwapStatus } from "@aave/react";

function ListUserSwaps({ request }: { request: UserSwapsRequest }) {
  const { data } = useUserSwaps({
    ...request,
    suspense: true,
  });

  if (!data) return <div>No swaps found</div>;

  return (
    <div>
      <h3>User Swaps</h3>
      {data.items.map((swapStatus) => (
        <div key={swapStatus.createdAt}>
          <p>
            Status - {swapStatus.__typename} - {swapStatus.explorerUrl}
          </p>
        </div>
      ))}
    </div>
  );
}
```

The hook automatically polls for status updates until all listed swaps reach a terminal state: fulfilled, cancelled, or expired.

You can filter swaps as follows:

```tsx title="By Chain ID"
import { evmAddress, chainId } from "@aave/react";

const request: UserSwapsRequest = {
  user: evmAddress("0x742d35cc…"),
  chainId: chainId(1),
};
```

```tsx title="By Status"
import { evmAddress, chainId, SwapStatus } from "@aave/react";

const request: UserSwapsRequest = {
  user: evmAddress("0x742d35cc…"),
  chainId: chainId(1),
  filterBy: [SwapStatus.FULFILLED, SwapStatus.CANCELLED],
};
```

</tab>

<tab label="TypeScript">

Use the `userSwaps` action to list user swaps.

```ts title="Basic Usage"
import { chainId, evmAddress } from "@aave/client";
import { userSwaps } from "@aave/client/actions";

import { client } from "./client";

const result = await userSwaps(client, {
  chainId: chainId(1),
  user: evmAddress("0x742d35cc…"),
});

if (result.isErr()) {
  console.error(result.error);
}
```

```ts title="Filter by Status"
import { chainId, evmAddress, SwapStatus } from "@aave/client";
import { userSwaps } from "@aave/client/actions";

import { client } from "./client";

const result = await userSwaps(client, {
  chainId: chainId(1),
  user: evmAddress("0x742d35cc…"),
  filterBy: [SwapStatus.FULFILLED],
});

if (result.isErr()) {
  console.error(result.error);
}
```

```ts title="client.ts"
import { AaveClient } from "@aave/client";

export const client = AaveClient.create();
```

</tab>

<tab label="GraphQL">

Use the `userSwaps` query to list user swaps.

```graphql title="Query"
query ($request: UserSwapsRequest!) {
  userSwaps(request: $request) {
    __typename
    items {
      ...SwapStatus
    }
    pageInfo {
      next
      prev
    }
  }
}
```

```graphql title="SwapStatus"
fragment SwapStatus on SwapStatus {
  __typename
  ... on SwapOpen {
    ...SwapOpen
  }
  ... on SwapPendingSignature {
    ...SwapPendingSignature
  }
  ... on SwapCancelled {
    ...SwapCancelled
  }
  ... on SwapExpired {
    ...SwapExpired
  }
  ... on SwapFulfilled {
    ...SwapFulfilled
  }
}
```

The `SwapStatus` object can be one of the following:

```graphql title="SwapOpen"
fragment SwapOpen on SwapOpen {
  __typename
  swapId
  createdAt
  deadline
  explorerUrl
  operation {
    ...SwapOperation
  }
}
```

```graphql title="SwapPendingSignature"
fragment SwapPendingSignature on SwapPendingSignature {
  __typename
  swapId
  createdAt
  deadline
  explorerUrl
  operation {
    ...SwapOperation
  }
}
```

```graphql title="SwapCancelled"
fragment SwapCancelled on SwapCancelled {
  __typename
  swapId
  createdAt
  cancelledAt
  explorerUrl
  operation {
    ...SwapOperation
  }
}
```

```graphql title="SwapExpired"
fragment SwapExpired on SwapExpired {
  __typename
  swapId
  createdAt
  expiredAt
  explorerUrl
  operation {
    ...SwapOperation
  }
}
```

```graphql title="SwapFulfilled"
fragment SwapFulfilled on SwapFulfilled {
  __typename
  swapId
  txHash
  createdAt
  fulfilledAt
  explorerUrl
  refundTxHash
  operation {
    ...SwapOperation
  }
}
```

```graphql title="SwapOperation"
fragment SwapOperation on SwapOperation {
  __typename
  ... on TokenSwap {
    sell {
      ...TokenAmount
    }
    buy {
      ...TokenAmount
    }
    kind
    orderClass
  }
  ... on SupplySwap {
    sell {
      ...PositionAmount
    }
    buy {
      ...PositionAmount
    }
    kind
    orderClass
  }
  ... on BorrowSwap {
    sell {
      ...PositionAmount
    }
    buy {
      ...PositionAmount
    }
    kind
    orderClass
  }
  ... on RepayWithSupply {
    repay {
      ...PositionAmount
    }
    supply {
      ...PositionAmount
    }
    kind
    orderClass
  }
  ... on WithdrawSwap {
    withdraw {
      ...PositionAmount
    }
    buy {
      ...TokenAmount
    }
    kind
    orderClass
  }
}
```

The `UserSwapsRequest` object should be defined as follows:

```json title="Basic Request"
{
  "request": {
    "chainId": 1,
    "user": "0x742d35cc…"
  }
}
```

```json title="Request with Status Filter"
{
  "request": {
    "chainId": 1,
    "user": "0x742d35cc…",
    "filterBy": ["FULFILLED"]
  }
}
```

</tab>

</tabgroup>
## Cancel a Swap

Before cancelling, identify the swap by its status.

> [!NOTE]
> Only swaps with status `Open` can be cancelled.

```ts title="User Swaps"
const swapsItems: SwapStatus[] = [
  {
    __typename: "SwapOpen",
    swapId: "adb123…",
    // …
  },
  {
    __typename: "SwapPendingSignature",
    // …
  },
  {
    __typename: "SwapCancelled",
    // …
  },
  {
    __typename: "SwapExpired",
    // …
  },
  {
    __typename: "SwapFulfilled",
    // …
  },
];
```

After identifying the swap, follow the steps below to cancel it with AaveKit.

<tabgroup>
<tab label="React">

To cancel a swap with AaveKit React:

### Configure Wallet Integration

First, instantiate the `useSendTransaction` and `useSignTypedData` hooks for the [wallet library of your choice](../getting-started/react#integrations).

```tsx title="Viem"
import { useWalletClient } from "wagmi";
import { useSendTransaction, useSignTypedData } from "@aave/react/viem";

// …

const { data: wallet } = useWalletClient();
const [sendTransaction] = useSendTransaction(wallet);
const [signTypedData, signing] = useSignTypedData(wallet);
```

### Define the Cancel Flow

Then, use the `useCancelSwap` hook to prepare the cancel swap operation.

```tsx title="Basic Usage"
import { useCancelSwap } from "@aave/react";

const [cancelSwap, { loading, error }] = useCancelSwap(
  (plan: CancelSwapTypedData | TransactionRequest) => {
    switch (plan.__typename) {
      case "TransactionRequest":
        return sendTransaction(plan);

      case "CancelSwapTypedData":
        return signTypedData(plan);
    }
  },
);
```

```tsx title="Update Component State"
import { useCancelSwap } from "@aave/react";

const [status, setStatus] = useState("");

const [cancelSwap, { loading, error }] = useCancelSwap(
  (plan: CancelSwapTypedData | TransactionRequest) => {
    switch (plan.__typename) {
      case "TransactionRequest":
        setStatus("Please send the Cancel Swap transaction in your wallet");
        return sendTransaction(plan).andTee(() => setStatus("Cancelling…"));

      case "CancelSwapTypedData":
        setStatus("Please sign the Cancel Swap data in your wallet");
        return signTypedData(plan).andTee(() => setStatus("Cancelling…"));
    }
  },
);
```

```tsx title="Cancel Flow"
import { useCancelSwap } from "@aave/react";

const [cancelSwap, { loading, error }] = useCancelSwap((plan, { cancel }) => {
  if (window.confirm("Are you sure you want to cancel the swap?") === false) {
    return cancel("User cancelled the operation");
  }

  switch (plan.__typename) {
    case "TransactionRequest":
      return sendTransaction(plan);

    case "CancelSwapTypedData":
      return signTypedData(plan);
  }
});
```

### Execute the Cancel Swap Operation

Then, execute the cancel swap operation.

```tsx title="Cancel Swap"
const execute = async () => {
  const result = await cancelSwap({
    id: swapReceipt.id,
  });
};
```

### Handle the Result

Finally, handle the result.

```tsx title="Handle Result"
if (result.isErr()) {
  switch (result.error.name) {
    case "CancelError":
      // The user cancelled the operation
      return;

    case "SigningError":
      console.error(`Failed to sign the transaction: ${result.error.message}`);
      break;

    case "TimeoutError":
      console.error(`Transaction timed out: ${result.error.message}`);
      break;

    case "TransactionError":
      console.error(`Transaction failed: ${result.error.message}`);
      break;

    case "UnexpectedError":
      console.error(result.error.message);
      break;
  }
  return;
}

// result.value: SwapCancelledResult
console.log("Swap cancelled:", result.value.cancelledAt);
```

That's it—you cancelled your first swap. Keep track of its status in the [Monitor Swap Status](#monitor-swap-status) section.

</tab>

<tab label="TypeScript">

To cancel a swap with AaveKit TypeScript:

### Prepare Cancel Swap

First, prepare the cancel execution plan with `prepareSwapCancel`.

```ts title="Prepare Cancel Swap"
import { prepareSwapCancel } from "@aave/client/actions";

import { client } from "./client";

const result = await prepareSwapCancel(client, {
  id: swapReceipt.id,
});
```

```ts title="client.ts"
import { AaveClient } from "@aave/client";

export const client = AaveClient.create();
```

And, use `signTypedDataWith` for the [wallet library of your choice](../getting-started/typescript#integrations) to sign typed data in the plan.

```ts title="Sign Cancel Swap"
import { prepareSwapCancel, cancelSwap } from "@aave/client/actions";
import { signTypedDataWith } from "@aave/client/viem";

import { client } from "./client";
import { wallet } from "./wallet";

const result = await prepareSwapCancel(client, {
  // …
}).andThen(signTypedDataWith(wallet));

if (result.isErr()) {
  console.error(result.error);
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

### Execute Cancel Swap

Then, execute the cancel with the `cancelSwap` action.

```ts title="Execute Cancel Swap"
import { prepareSwapCancel, cancelSwap } from "@aave/client/actions";
import { signTypedDataWith } from "@aave/client/viem";

import { client } from "./client";
import { wallet } from "./wallet";

const result = await prepareSwapCancel(client, {
  // …
})
  .andThen(signTypedDataWith(wallet))
  .andThen((signature) => {
    return cancelSwap(client, {
      intent: {
        id: swapReceipt.id,
        signature: signature,
      },
    });
  });
```

And, use `sendWith` for the [wallet library of your choice](../getting-started/typescript#integrations) to send transactions in the plan.

```ts title="Send Transaction"
import { prepareSwapCancel, cancelSwap } from "@aave/client/actions";
import { signTypedDataWith, sendWith } from "@aave/client/viem";

import { client } from "./client";
import { wallet } from "./wallet";

const result = await prepareSwapCancel(client, {
  // …
})
  .andThen(signTypedDataWith(wallet))
  .andThen((signature) => {
    return cancelSwap(client, {
      intent: {
        id: swapReceipt.id,
        signature: signature,
      },
    }).andThen((plan) => {
      switch (plan.__typename) {
        case "TransactionRequest":
          return sendWith(wallet, plan.transaction).map(() => ({
            success: true,
          }));

        case "SwapCancelled":
          return okAsync(plan);
      }
    });
  });
```

### Handle the Result

Finally, handle the result.

```ts title="Handle Result"
if (result.isErr()) {
  switch (result.error.name) {
    case "SigningError":
      console.error(`Failed to sign the transaction: ${result.error.message}`);
      break;

    case "TimeoutError":
      console.error(`Transaction timed out: ${result.error.message}`);
      break;

    case "TransactionError":
      console.error(`Transaction failed: ${result.error.message}`);
      break;

    case "UnexpectedError":
      console.error(result.error.message);
      break;
  }
}

// result.value: SwapCancelledResult
console.log("Swap cancelled:", result.value.cancelledAt);
```

That's it—you cancelled your first swap. Keep track of its status in the [Monitor Swap Status](#monitor-swap-status) section.

</tab>

<tab label="GraphQL">

To cancel a swap with the AaveKit API:

### Prepare Cancel Swap

First, use the `prepareSwapCancel` query to prepare the cancel.

```graphql title="Query"
query {
  prepareSwapCancel(request: { id: "<swapReceipt.id>" }) {
    __typename
    data {
      ...SwapTypedData
    }
  }
}
```

```graphql title="SwapTypedData"
fragment SwapTypedData on SwapTypedData {
  __typename
  types
  primaryType
  domain {
    ...DomainData
  }
  message
}
```

And sign the typed data response `PrepareSwapCancelResult` with the account that executed the swap.

```json title="PrepareSwapCancelResult"
{
  "data": {
    "prepareSwapCancel": {
      "__typename": "PrepareSwapCancelResult",
      "data": {
        // …
      }
    }
  }
}
```

### Execute Cancel Swap

Then, use the `cancelSwap` query to execute the cancel.

```graphql title="Query"
query ($request: CancelSwapRequest!) {
  cancelSwap(request: $request) {
    __typename
    ... on TransactionRequest {
      ...TransactionRequest
    }
    ... on SwapCancelled {
      ...SwapCancelled
    }
  }
}
```

```graphql title="SwapCancelled"
fragment SwapCancelled on SwapCancelled {
  __typename
  createdAt
  cancelledAt
  explorerUrl
}
```

The `CancelSwapRequest` object gets the signed typed data from the `prepareSwapCancel` query.

```json title="Cancel Swap Intent"
{
  "request": {
    "intent": {
      "id": "<swapReceipt.id>",
      "signature": "0x456…"
    }
  }
}
```

```json title="Cancel Swap Transaction"
{
  "request": {
    "transaction": "<swapReceipt.id>"
  }
}
```

### Handle Cancel Swap Response

Depending on the `CancelSwapResult` type, you'll need to follow different actions:

| Response Type          | Action                                                                                   |
| ---------------------- | ---------------------------------------------------------------------------------------- |
| **TransactionRequest** | Send the transaction with the wallet associated with the account that executed the swap. |
| **SwapCancelled**      | Swap was cancelled successfully.                                                         |

Below are examples illustrating the response for each response type.

```json title="TransactionRequest"
{
  "data": {
    "cancelSwap": {
      "__typename": "TransactionRequest",
      "transaction": {
        // …
      }
    }
  }
}
```

```json title="SwapCancelled"
{
  "data": {
    "cancelSwap": {
      "__typename": "SwapCancelled",
      "createdAt": "2021-01-01T00:00:00Z",
      "cancelledAt": "2021-01-01T00:00:00Z",
      "explorerUrl": "https://etherscan.io/tx/123…"
    }
  }
}
```

</tab>
</tabgroup>
## Fees

Swaps include a network fee, partner fee, provider fee, and in the case of [Position Swaps](../positions/swaps) a flash loan fee.

### Network Fee

The network fee covers gas costs for executing the swap transaction on-chain. This fee varies based on current network congestion and is paid in the chain's native token (e.g., ETH on Ethereum).

### Partner Fee

Aave Labs applies a fee to swaps done through the Aave Labs API. The fee depends on the [swap operation](../positions/swaps) and token pair:

- **Borrow Swap**: 0% fee across all pairs.
- **All other swap operations**: a discounted fee of **0.15%** is applied to swaps between correlated assets (e.g., ETH/wstETH), while **0.25%** is applied to all other pairs.

> [!TIP]
> Correlated assets are tokens that maintain a stable price relationship,
> typically pegged to the same underlying asset or index. Swaps between
> correlated assets receive a discounted fee because they carry lower price
> risk.

The following asset groups are considered correlated (list reviewed and updated periodically):

- **Stablecoins**: USDC, USDT, DAI, GHO, EURC, USDbC, USDe, USDS, sUSDe, RLUSD, PYUSD, LUSD, sDAI, crvUSD, USD₮0, USDC.e, EURe, xDAI, wxDAI
- **ETH correlated**: weETH, ETH, WETH, wstETH, cbETH, ezETH, wrsETH, osETH, rETH, ETHx
- **BTC correlated**: cbBTC, WBTC, LBTC, tBTC, eBTC

### Provider Fee

CoW Protocol charges a fee for swap execution: **0.02%** for most pairs, reduced to **0.003%** for tokens in their [Reduced Fee Tokens](https://forum.cow.fi/t/cip-74-retrospective-aligning-rewards-with-revenue/3358) list (a dynamic registry of major stablecoins and RWAs based on price volatility). The fee is included in the swap quote.

### Flash Loan Fee

Some of the [Position Swaps](../positions/swaps) require flash loans to execute atomically. When applicable, a flash loan fee of **0.05%** of the flash-loaned amount is charged. This fee is collected by the protocol treasury and controlled by the DAO through governance.

Flash loan fees apply to operations that require borrowing assets temporarily (e.g., Swap Borrow Asset). Operations that use existing positions (e.g., Withdraw and Swap) typically do not incur flash loan fees.

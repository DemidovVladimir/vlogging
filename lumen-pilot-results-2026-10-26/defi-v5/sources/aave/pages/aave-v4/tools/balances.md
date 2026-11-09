# User Balances

Learn how to monitor user balances for tokens supported by Aave v4.

---

User balances provide a comprehensive view of a user's token holdings across different chains, aggregated by token type with supply and borrow APY information.

## User Balance Data Structure

User balance data provides information about a user's token holdings, including:

- Globally unique identifier: for each balance entry
- Token identification: name, symbol, icon, decimals
- Balance amounts: individual balances per network, total amounts
- Yield information: highest and lowest supply/borrow APY for each token
- Collateral factors: highest and lowest collateral factors for each token
- Fiat valuations: converted amounts in selected currency

<tabgroup>
<tab label="TypeScript">

The following TypeScript interfaces illustrate the core UserBalance type:

```ts title="UserBalance"
interface UserBalance {
  __typename: "UserBalance";
  id: UserBalanceId;
  info: TokenInfo;
  balances: TokenAmount[];
  totalAmount: DecimalNumber;
  exchange: ExchangeAmount;
  highestSupplyApy: PercentNumber;
  highestBorrowApy: PercentNumber;
  lowestSupplyApy: PercentNumber;
  lowestBorrowApy: PercentNumber;
  highestCollateralFactor: PercentNumber | null;
  lowestCollateralFactor: PercentNumber | null;
}
```

```ts title="TokenInfo"
interface TokenInfo {
  __typename: "TokenInfo";
  id: TokenInfoId;
  name: string;
  symbol: string;
  icon: string;
  decimals: number;
  categories: TokenCategory[];
}
```

```ts title="TokenAmount"
type TokenAmount = Erc20Amount | NativeAmount;

interface Erc20Amount {
  __typename: "Erc20Amount";
  token: Erc20Token;
  amount: DecimalNumber;
  exchange: ExchangeAmount;
  exchangeRate: DecimalNumber;
}

interface NativeAmount {
  __typename: "NativeAmount";
  token: NativeToken;
  amount: DecimalNumber;
  exchange: ExchangeAmount;
  exchangeRate: DecimalNumber;
}
```

```ts title="ExchangeAmount"
interface ExchangeAmount {
  __typename: "ExchangeAmount";
  value: BigDecimal;
  name: string;
  symbol: string;
  icon: string;
  decimals: number;
}
```

</tab>
<tab label="GraphQL">

The following GraphQL fragments illustrate the core UserBalance type:

```graphql title="UserBalance"
fragment UserBalance on UserBalance {
  __typename
  id
  info {
    ...TokenInfo
  }
  balances {
    ...TokenAmount
  }
  totalAmount {
    ...DecimalNumber
  }
  exchange(currency: $currency) {
    ...ExchangeAmount
  }
  highestSupplyApy: supplyApy(metric: HIGHEST) {
    ...PercentNumber
  }
  highestBorrowApy: borrowApy(metric: HIGHEST) {
    ...PercentNumber
  }
  lowestSupplyApy: supplyApy(metric: LOWEST) {
    ...PercentNumber
  }
  lowestBorrowApy: borrowApy(metric: LOWEST) {
    ...PercentNumber
  }
  highestCollateralFactor: collateralFactor(metric: HIGHEST) {
    ...PercentNumber
  }
  lowestCollateralFactor: collateralFactor(metric: LOWEST) {
    ...PercentNumber
  }
}
```

```graphql title="TokenInfo"
fragment TokenInfo on TokenInfo {
  __typename
  id
  name
  symbol
  icon
  decimals
  categories
}
```

```graphql title="TokenAmount"
fragment TokenAmount on TokenAmount {
  __typename
  ... on Erc20Amount {
    token {
      ...Erc20Token
    }
    amount {
      ...DecimalNumber
    }
    exchange(currency: $currency) {
      ...ExchangeAmount
    }
    exchangeRate(currency: $currency) {
      ...DecimalNumber
    }
  }
  ... on NativeAmount {
    token {
      ...NativeToken
    }
    amount {
      ...DecimalNumber
    }
    exchange(currency: $currency) {
      ...ExchangeAmount
    }
    exchangeRate(currency: $currency) {
      ...DecimalNumber
    }
  }
}
```

```graphql title="ExchangeAmount"
fragment ExchangeAmount on ExchangeAmount {
  __typename
  value
  name
  symbol
  icon
  decimals
}
```

</tab>
</tabgroup>
## Fetching User Balances

<tabgroup>
<tab label="React">

Use the `useUserBalances` hook to fetch user token balances.

```tsx title="Loading State"
import { type UserBalancesRequest, useUserBalances } from "@aave/react";

function UserBalancesList({ request }: { request: UserBalancesRequest }) {
  const { data, loading, error } = useUserBalances(request);

  if (loading) return <div>Loading…</div>;

  if (error) return <div>Error: {error.message}</div>;

  // data: UserBalance[]
  return (
    <div>
      {data.map((balance) => (
        <div key={balance.id}>
          <h2>{balance.info.name}</h2>
          <p>
            <strong>Total:</strong>
            {balance.totalAmount.value.toDisplayString(2)}
            {balance.info.symbol}
            <small>
              {balance.exchange.symbol}
              {balance.exchange.value.toDisplayString(2)}
            </small>
          </p>
          <p>
            <strong>Supply APY:</strong>
            {balance.highestSupplyApy.normalized.toFixed(2)}%
          </p>
        </div>
      ))}
    </div>
  );
}
```

```tsx title="React Suspense"
import { type UserBalancesRequest, useUserBalances } from "@aave/react";

function UserBalancesList({ request }: { request: UserBalancesRequest }) {
  const { data } = useUserBalances({
    ...request,
    suspense: true,
  });

  // data: UserBalance[]
  return (
    <div>
      {data.map((balance) => (
        <div key={balance.id}>
          <h2>{balance.info.name}</h2>
          <p>
            <strong>Total:</strong>
            {balance.totalAmount.value.toDisplayString(2)}
            {balance.info.symbol}
            <small>
              {balance.exchange.symbol}
              {balance.exchange.value.toDisplayString(2)}
            </small>
          </p>
          <p>
            <strong>Supply APY:</strong>
            {balance.highestSupplyApy.normalized.toFixed(2)}%
          </p>
        </div>
      ))}
    </div>
  );
}
```

See below some examples of how to use the hook.

```tsx title="Filter by Chains"
import { evmAddress, chainId } from "@aave/react";

const request: UserBalancesRequest = {
  user: evmAddress("0x456…"),
  filter: {
    chains: {
      chainIds: [chainId(1)],
    },
  },
};
```

```tsx title="Filter by Hub"
import { evmAddress, chainId } from "@aave/react";

// By hub ID
const request: UserBalancesRequest = {
  user: evmAddress("0x456…"),
  filter: {
    hubId: {
      hubId: hub.id, // hub: Hub
    },
  },
};

// By hub address and chain ID
const request: UserBalancesRequest = {
  user: evmAddress("0x456…"),
  filter: {
    hub: {
      address: evmAddress("0x123…"),
      chainId: chainId(1),
    },
  },
};
```

```tsx title="Filter by Spoke"
import { evmAddress, chainId } from "@aave/react";

const request: UserBalancesRequest = {
  user: evmAddress("0x456…"),
  filter: {
    spoke: {
      address: evmAddress("0x123…"),
      chainId: chainId(1),
    },
  },
};
```

```tsx title="Filter by User Position"
import { evmAddress } from "@aave/react";

const request: UserBalancesRequest = {
  user: evmAddress("0x456…"),
  filter: {
    userPosition: {
      userPositionId: position.id,
    },
  },
};
```

```tsx title="Filter by Tokens"
import { evmAddress, chainId } from "@aave/react";

const request: UserBalancesRequest = {
  user: evmAddress("0x456…"),
  filter: {
    tokens: {
      chainTokens: [
        { chainId: chainId(1), token: { erc20: evmAddress("0xA0b8…") } },
        { chainId: chainId(1), token: { native: true } },
      ],
    },
  },
};
```

Sort balances by name or balance value.

```tsx title="By Balance"
import { evmAddress, OrderDirection } from "@aave/react";

const request: UserBalancesRequest = {
  user: evmAddress("0x456…"),
  filter: {
    // your filter criteria
  },
  orderBy: { balance: OrderDirection.Desc },
};
```

```tsx title="By Name"
import { evmAddress, OrderDirection } from "@aave/react";

const request: UserBalancesRequest = {
  user: evmAddress("0x456…"),
  filter: {
    // your filter criteria
  },
  orderBy: { name: OrderDirection.Asc },
};
```

Include tokens with zero balances in the results.

```tsx title="Include Zero Balances"
const request: UserBalancesRequest = {
  user: evmAddress("0x456…"),
  filter: {
    // your filter criteria
  },
  includeZeroBalances: true,
};
```

Specify a different currency for displaying fiat amounts.

```tsx title="Custom Currency"
import { evmAddress, Currency } from "@aave/react";

// …

const { data, loading, error } = useUserBalances({
  user: evmAddress("0x456…"),
  filter: {
    // your filter criteria
  },
  currency: Currency.Eur,
});
```

</tab>
<tab label="TypeScript">

Use the `userBalances` action to fetch balances filtered by chains, hubs, or spokes.

```ts title="Filter by Chains"
import { userBalances } from "@aave/client/actions";
import { evmAddress, chainId } from "@aave/client";
import { client } from "./client";

const result = await userBalances(client, {
  user: evmAddress("0x456…"),
  filter: {
    chains: {
      chainIds: [chainId(1)],
    },
  },
});

if (result.isOk()) {
  console.log("User balances:", result.value);
  // result.value: UserBalance[]
} else {
  console.error("Error:", result.error);
}
```

```ts title="Filter by Hub"
import { userBalances } from "@aave/client/actions";
import { evmAddress, chainId } from "@aave/client";
import { client } from "./client";

// By hub ID
const result = await userBalances(client, {
  user: evmAddress("0x456…"),
  filter: {
    hubId: {
      hubId: hub.id, // hub: Hub
    },
  },
});

if (result.isOk()) {
  console.log("User balances:", result.value);
  // result.value: UserBalance[]
} else {
  console.error("Error:", result.error);
}

// By hub address and chain ID
const result = await userBalances(client, {
  user: evmAddress("0x456…"),
  filter: {
    hub: {
      address: evmAddress("0x123…"),
      chainId: chainId(1),
    },
  },
});
```

```ts title="Filter by Spoke"
import { userBalances } from "@aave/client/actions";
import { evmAddress, chainId } from "@aave/client";
import { client } from "./client";

const result = await userBalances(client, {
  user: evmAddress("0x456…"),
  filter: {
    spoke: {
      address: evmAddress("0x123…"),
      chainId: chainId(1),
    },
  },
});

if (result.isOk()) {
  console.log("User balances:", result.value);
  // result.value: UserBalance[]
} else {
  console.error("Error:", result.error);
}
```

```ts title="Filter by User Position"
import { userBalances } from "@aave/client/actions";
import { evmAddress, type UserPosition } from "@aave/client";
import { client } from "./client";

// const position: UserPosition = …

const result = await userBalances(client, {
  user: evmAddress("0x456…"),
  filter: {
    userPosition: {
      userPositionId: position.id,
    },
  },
});

if (result.isOk()) {
  console.log("User balances:", result.value);
  // result.value: UserBalance[]
} else {
  console.error("Error:", result.error);
}
```

```ts title="Filter by Tokens"
import { userBalances } from "@aave/client/actions";
import { evmAddress, chainId } from "@aave/client";
import { client } from "./client";

const result = await userBalances(client, {
  user: evmAddress("0x456…"),
  filter: {
    tokens: {
      chainTokens: [
        { chainId: chainId(1), token: { erc20: evmAddress("0xA0b8…") } },
        { chainId: chainId(1), token: { native: true } },
      ],
    },
  },
});

if (result.isOk()) {
  console.log("User balances:", result.value);
  // result.value: UserBalance[]
} else {
  console.error("Error:", result.error);
}
```

```ts title="client.ts"
import { AaveClient } from "@aave/client";

export const client = AaveClient.create();
```

Sort balances by name or balance value.

```ts title="By Balance"
import { userBalances } from "@aave/client/actions";
import { evmAddress, chainId, OrderDirection } from "@aave/client";
import { client } from "./client";

const result = await userBalances(client, {
  user: evmAddress("0x456…"),
  filter: {
    // your filter criteria
  },
  orderBy: { balance: OrderDirection.Desc },
});
```

```ts title="By Name"
import { userBalances } from "@aave/client/actions";
import { evmAddress, chainId, OrderDirection } from "@aave/client";
import { client } from "./client";

const result = await userBalances(client, {
  user: evmAddress("0x456…"),
  filter: {
    // your filter criteria
  },
  orderBy: { name: OrderDirection.Asc },
});
```

Include tokens with zero balances in the results.

```ts title="Include Zero Balances"
const result = await userBalances(client, {
  user: evmAddress("0x456…"),
  filter: {
    chains: { chainIds: [chainId(1)] },
  },
  includeZeroBalances: true,
});
```

Specify a different currency for displaying fiat amounts.

```ts title="Custom Currency"
import { userBalances } from "@aave/client/actions";
import { evmAddress, chainId, Currency } from "@aave/client";
import { client } from "./client";

const result = await userBalances(
  client,
  {
    user: evmAddress("0x456…"),
    filter: {
      chains: { chainIds: [chainId(1)] },
    },
  },
  {
    currency: Currency.Eur,
  }
);
```

</tab>
<tab label="GraphQL">

Use the `userBalances` query to fetch user token balances.

```graphql title="Query"
query ($request: UserBalancesRequest!, $currency: Currency! = USD) {
  userBalances(request: $request) {
    info {
      ...TokenInfo
    }
    balances {
      ...TokenAmount
    }
    totalAmount {
      ...DecimalNumber
    }
    exchange(currency: $currency) {
      ...ExchangeAmount
    }
    highestSupplyApy: supplyApy(metric: HIGHEST) {
      ...PercentNumber
    }
    highestBorrowApy: borrowApy(metric: HIGHEST) {
      ...PercentNumber
    }
    lowestSupplyApy: supplyApy(metric: LOWEST) {
      ...PercentNumber
    }
    lowestBorrowApy: borrowApy(metric: LOWEST) {
      ...PercentNumber
    }
    highestCollateralFactor: collateralFactor(metric: HIGHEST) {
      ...PercentNumber
    }
    lowestCollateralFactor: collateralFactor(metric: LOWEST) {
      ...PercentNumber
    }
  }
}
```

```graphql title="TokenAmount"
fragment TokenAmount on TokenAmount {
  __typename

  ... on Erc20Amount {
    amount {
      ...DecimalNumber
    }
    exchange(currency: $currency) {
      ...ExchangeAmount
    }
    exchangeRate(currency: $currency) {
      ...DecimalNumber
    }
    token {
      ...Erc20Token
    }
  }
  ... on NativeAmount {
    amount {
      ...DecimalNumber
    }
    exchange(currency: $currency) {
      ...ExchangeAmount
    }
    exchangeRate(currency: $currency) {
      ...DecimalNumber
    }
    token {
      ...NativeToken
    }
  }
}
```

Specify the `user` address and filter balances by chains, hubs, or spokes using the `filter` field.

```json title="By Chains"
{
  "request": {
    "user": "0x456…",
    "filter": {
      "chains": {
        "chainIds": [1]
      }
    }
  }
}
```

```json title="By Hub"
// By hub ID
{
  "request": {
    "user": "0x456…",
    "filter": {
      "hubId": {
        "hubId": "SGVsbG8h"
      }
    }
  }
}

// By hub address and chain ID
{
  "request": {
    "user": "0x456…",
    "filter": {
      "hub": {
        "address": "0x123…",
        "chainId": 1
      }
    }
  }
}
```

```json title="By Spoke"
{
  "request": {
    "user": "0x456…",
    "filter": {
      "spoke": {
        "address": "0x123…",
        "chainId": 1
      }
    }
  }
}
```

```json title="By User Position"
{
  "request": {
    "user": "0x456…",
    "filter": {
      "userPosition": {
        "userPositionId": "SGVsbG8h"
      }
    }
  }
}
```

```json title="By Tokens"
{
  "request": {
    "user": "0x456…",
    "filter": {
      "tokens": {
        "chainTokens": [
          {
            "chainId": 1,
            "token": {
              "erc20": "0xA0b8…"
            }
          },
          {
            "chainId": 1,
            "token": {
              "native": true
            }
          }
        ]
      }
    }
  }
}
```

Sort balances by name or balance value using the `orderBy` field.

```json title="By Balance"
{
  "request": {
    "user": "0x456…",
    "filter": {
      // your filter criteria
    },
    "orderBy": { "balance": "DESC" }
  }
}
```

```json title="By Name"
{
  "request": {
    "user": "0x456…",
    "filter": {
      // your filter criteria
    },
    "orderBy": { "name": "ASC" }
  }
}
```

Include tokens with zero balances in the results.

```json title="Include Zero Balances"
{
  "request": {
    "user": "0x456…",
    "filter": {
      // your filter criteria
    },
    "includeZeroBalances": true
  }
}
```

Specify a different currency for displaying fiat amounts using the `currency` argument.

```json title="Custom Currency"
{
  "request": {
    "user": "0x456…",
    "filter": {
      // your filter criteria
    }
  },
  "currency": "EUR"
}
```

</tab>
</tabgroup>

# User Activities

Learn how to fetch users’ activity records across Aave v4.

---

View detailed activity history covering supplies, borrows, repayments, withdrawals, liquidations, and swaps, with built-in pagination support.

## Activity Data Structure

Activity data provides detailed information about all user activities, including:

- Transaction details: timestamp, transaction hash, chain, amount
- Activity types: core operations (supply, borrow, withdraw, repay), liquidations, position settings, and swaps
- User performing the activity
- Type-specific details like reserve, spoke, and amounts

<tabgroup>
<tab label="TypeScript">

The following TypeScript interfaces illustrate the core activity types:

```ts title="ActivityItem"
type ActivityItem =
  | BorrowActivity
  | SupplyActivity
  | WithdrawActivity
  | RepayActivity
  | LiquidatedActivity
  | UsingAsCollateralActivity
  | UpdatedDynamicConfigActivity
  | UpdatedRiskPremiumActivity
  | TokenSwapActivity
  | SupplySwapActivity
  | BorrowSwapActivity
  | RepayWithSupplyActivity
  | WithdrawSwapActivity;
```

```ts title="BorrowActivity"
interface BorrowActivity {
  __typename: "BorrowActivity";
  id: string;
  user: EvmAddress;
  timestamp: Date;
  txHash: TxHash;
  spoke: Spoke;
  reserve: ReserveInfo;
  borrowed: Erc20Amount;
  chain: Chain;
}

interface BorrowSwapActivity {
  __typename: "BorrowSwapActivity";
  id: string;
  user: EvmAddress;
  timestamp: Date;
  txHash: TxHash | null;
  chain: Chain;
  sell: PositionAmount;
  buy: PositionAmount;
  explorerUrl: string;
  orderClass: SwapOrderClass;
  kind: BorrowSwapKind;
  status: SwapActivityStatus;
}
```

```ts title="SupplyActivity"
interface SupplyActivity {
  __typename: "SupplyActivity";
  id: string;
  user: EvmAddress;
  timestamp: Date;
  txHash: TxHash;
  spoke: Spoke;
  reserve: ReserveInfo;
  supplied: Erc20Amount;
  chain: Chain;
}

interface SupplySwapActivity {
  __typename: "SupplySwapActivity";
  id: string;
  user: EvmAddress;
  timestamp: Date;
  txHash: TxHash | null;
  chain: Chain;
  sell: PositionAmount;
  buy: PositionAmount;
  explorerUrl: string;
  orderClass: SwapOrderClass;
  kind: SupplySwapKind;
  status: SwapActivityStatus;
}
```

```ts title="WithdrawActivity"
interface WithdrawActivity {
  __typename: "WithdrawActivity";
  id: string;
  user: EvmAddress;
  timestamp: Date;
  txHash: TxHash;
  spoke: Spoke;
  reserve: ReserveInfo;
  withdrawn: Erc20Amount;
  chain: Chain;
}

interface WithdrawSwapActivity {
  __typename: "WithdrawSwapActivity";
  id: string;
  user: EvmAddress;
  timestamp: Date;
  txHash: TxHash | null;
  chain: Chain;
  withdraw: PositionAmount;
  buy: TokenAmount;
  explorerUrl: string;
  orderClass: SwapOrderClass;
  kind: WithdrawSwapKind;
  status: SwapActivityStatus;
}
```

```ts title="RepayActivity"
interface RepayActivity {
  __typename: "RepayActivity";
  id: string;
  user: EvmAddress;
  timestamp: Date;
  txHash: TxHash;
  spoke: Spoke;
  reserve: ReserveInfo;
  repaid: Erc20Amount;
  chain: Chain;
}

interface RepayWithSupplyActivity {
  __typename: "RepayWithSupplyActivity";
  id: string;
  user: EvmAddress;
  timestamp: Date;
  txHash: TxHash | null;
  chain: Chain;
  repay: PositionAmount;
  supply: PositionAmount;
  explorerUrl: string;
  orderClass: SwapOrderClass;
  kind: RepayWithSupplyKind;
  status: SwapActivityStatus;
}
```

```ts title="Others"
interface LiquidatedActivity {
  __typename: "LiquidatedActivity";
  id: string;
  user: EvmAddress;
  timestamp: Date;
  txHash: TxHash;
  spoke: Spoke;
  collateralReserve: ReserveInfo;
  collateral: Erc20Amount;
  liquidatorReceived: Erc20Amount;
  liquidationFee: Erc20Amount;
  debtReserve: ReserveInfo;
  debt: Erc20Amount;
  liquidator: EvmAddress;
  liquidationHealthFactor: HealthFactor;
  chain: Chain;
}

interface UsingAsCollateralActivity {
  __typename: "UsingAsCollateralActivity";
  id: string;
  user: EvmAddress;
  timestamp: Date;
  txHash: TxHash;
  spoke: Spoke;
  reserve: ReserveInfo;
  enabledAsCollateral: boolean;
  chain: Chain;
}

interface UpdatedDynamicConfigActivity {
  __typename: "UpdatedDynamicConfigActivity";
  id: string;
  user: EvmAddress;
  timestamp: Date;
  txHash: TxHash;
  spoke: Spoke;
  reserve: ReserveInfo;
  collateralFactor: PercentNumberChangeSnapshot;
  maxLiquidationBonus: PercentNumberChangeSnapshot;
  liquidationFee: PercentNumberChangeSnapshot;
  chain: Chain;
}

interface UpdatedRiskPremiumActivity {
  __typename: "UpdatedRiskPremiumActivity";
  id: string;
  user: EvmAddress;
  timestamp: Date;
  txHash: TxHash;
  spoke: Spoke;
  premium: PercentNumberChangeSnapshot;
  chain: Chain;
}

interface TokenSwapActivity {
  __typename: "TokenSwapActivity";
  id: string;
  user: EvmAddress;
  timestamp: Date;
  txHash: TxHash | null;
  chain: Chain;
  sell: TokenAmount;
  buy: TokenAmount;
  explorerUrl: string;
  orderClass: SwapOrderClass;
  kind: TokenSwapKind;
  status: SwapActivityStatus;
}

interface PercentNumberChangeSnapshot {
  before: PercentNumber;
  after: PercentNumber;
}
```

</tab>
<tab label="GraphQL">

The following GraphQL fragments illustrate the core activity types:

```graphql title="ActivityItem"
fragment ActivityItem on ActivityItem {
  __typename
  ... on BorrowActivity {
    ...BorrowActivity
  }
  ... on SupplyActivity {
    ...SupplyActivity
  }
  ... on WithdrawActivity {
    ...WithdrawActivity
  }
  ... on RepayActivity {
    ...RepayActivity
  }
  ... on LiquidatedActivity {
    ...LiquidatedActivity
  }
  ... on UsingAsCollateralActivity {
    ...UsingAsCollateralActivity
  }
  ... on UpdatedDynamicConfigActivity {
    ...UpdatedDynamicConfigActivity
  }
  ... on UpdatedRiskPremiumActivity {
    ...UpdatedRiskPremiumActivity
  }
  ... on TokenSwapActivity {
    ...TokenSwapActivity
  }
  ... on SupplySwapActivity {
    ...SupplySwapActivity
  }
  ... on BorrowSwapActivity {
    ...BorrowSwapActivity
  }
  ... on RepayWithSupplyActivity {
    ...RepayWithSupplyActivity
  }
  ... on WithdrawSwapActivity {
    ...WithdrawSwapActivity
  }
}
```

```graphql title="BorrowActivity"
fragment BorrowActivity on BorrowActivity {
  __typename
  id
  user
  timestamp
  txHash
  spoke {
    ...Spoke
  }
  reserve {
    ...ReserveInfo
  }
  borrowed {
    ...Erc20Amount
  }
  chain {
    ...Chain
  }
}

fragment BorrowSwapActivity on BorrowSwapActivity {
  __typename
  id
  user
  timestamp
  txHash
  chain {
    ...Chain
  }
  sell {
    ...PositionAmount
  }
  buy {
    ...PositionAmount
  }
  explorerUrl
  orderClass
  kind
  status
}
```

```graphql title="SupplyActivity"
fragment SupplyActivity on SupplyActivity {
  __typename
  id
  user
  timestamp
  txHash
  spoke {
    ...Spoke
  }
  reserve {
    ...ReserveInfo
  }
  supplied {
    ...Erc20Amount
  }
  chain {
    ...Chain
  }
}

fragment SupplySwapActivity on SupplySwapActivity {
  __typename
  id
  user
  timestamp
  txHash
  chain {
    ...Chain
  }
  sell {
    ...PositionAmount
  }
  buy {
    ...PositionAmount
  }
  explorerUrl
  orderClass
  kind
  status
}
```

```graphql title="WithdrawActivity"
fragment WithdrawActivity on WithdrawActivity {
  __typename
  id
  user
  timestamp
  txHash
  spoke {
    ...Spoke
  }
  reserve {
    ...ReserveInfo
  }
  withdrawn {
    ...Erc20Amount
  }
  chain {
    ...Chain
  }
}

fragment WithdrawSwapActivity on WithdrawSwapActivity {
  __typename
  id
  user
  timestamp
  txHash
  chain {
    ...Chain
  }
  withdraw {
    ...PositionAmount
  }
  buy {
    ...TokenAmount
  }
  explorerUrl
  orderClass
  kind
  status
}
```

```graphql title="RepayActivity"
fragment RepayActivity on RepayActivity {
  __typename
  id
  user
  timestamp
  txHash
  spoke {
    ...Spoke
  }
  reserve {
    ...ReserveInfo
  }
  repaid {
    ...Erc20Amount
  }
  chain {
    ...Chain
  }
}

fragment RepayWithSupplyActivity on RepayWithSupplyActivity {
  __typename
  id
  user
  timestamp
  txHash
  chain {
    ...Chain
  }
  repay {
    ...PositionAmount
  }
  supply {
    ...PositionAmount
  }
  explorerUrl
  orderClass
  kind
  status
}
```

```graphql title="Others"
fragment LiquidatedActivity on LiquidatedActivity {
  __typename
  id
  user
  timestamp
  txHash
  spoke {
    ...Spoke
  }
  collateralReserve {
    ...ReserveInfo
  }
  collateral {
    ...Erc20Amount
  }
  liquidatorReceived {
    ...Erc20Amount
  }
  liquidationFee {
    ...Erc20Amount
  }
  debtReserve {
    ...ReserveInfo
  }
  debt {
    ...Erc20Amount
  }
  liquidator
  liquidationHealthFactor
  chain {
    ...Chain
  }
}

fragment UsingAsCollateralActivity on UsingAsCollateralActivity {
  __typename
  id
  user
  timestamp
  txHash
  spoke {
    ...Spoke
  }
  reserve {
    ...ReserveInfo
  }
  enabledAsCollateral
  chain {
    ...Chain
  }
}

fragment TokenSwapActivity on TokenSwapActivity {
  __typename
  id
  user
  timestamp
  txHash
  chain {
    ...Chain
  }
  sell {
    ...TokenAmount
  }
  buy {
    ...TokenAmount
  }
  explorerUrl
  orderClass
  kind
  status
}
```

</tab>
</tabgroup>
## Fetching User Activities

Fetch users' activities with filtering and pagination.

<tabgroup>
<tab label="React">

Use the `useActivities` hook to fetch paginated activities for a user.

```tsx title="Loading State"
import { type ActivitiesRequest, useActivities } from "@aave/react";

function ActivitiesList({ request }: { request: ActivitiesRequest }) {
  const { data, loading, error } = useActivities(request);

  if (loading) return <div>Loading…</div>;

  if (error) return <div>Error: {error.message}</div>;

  // data: PaginatedActivitiesResult
  return (
    <div>
      {data.items.map((activity) => (
        <div key={activity.id}>
          <h4>{activity.__typename}</h4>
          Time: {activity.timestamp.toLocaleString()}
          Tx: {activity.txHash}
        </div>
      ))}
    </div>
  );
}
```

```tsx title="React Suspense"
import { type ActivitiesRequest, useActivities } from "@aave/react";

function ActivitiesList({ request }: { request: ActivitiesRequest }) {
  const { data } = useActivities({
    ...request,
    suspense: true,
  });

  // data: PaginatedActivitiesResult
  return (
    <div>
      {data.items.map((activity) => (
        <div key={activity.id}>
          <h4>{activity.__typename}</h4>
          Time: {activity.timestamp.toLocaleString()}
          Tx: {activity.txHash}
        </div>
      ))}
    </div>
  );
}
```

See below some examples of how to use the hook.

```tsx title="Query by Chains"
import { evmAddress, chainId } from "@aave/react";

const request: ActivitiesRequest = {
  query: {
    chainIds: [chainId(1)],
  },
  user: evmAddress("0x456…"),
};
```

```tsx title="Query by Spoke"
import { evmAddress, chainId } from "@aave/react";

const request: ActivitiesRequest = {
  query: {
    spoke: {
      address: evmAddress("0x123…"),
      chainId: chainId(1),
    },
  },
  user: evmAddress("0x456…"),
};
```

```tsx title="Query by Transaction"
import { evmAddress, chainId, txHash } from "@aave/react";

const request: ActivitiesRequest = {
  query: {
    txHash: {
      txHash: txHash("0xabc123…"),
      chainId: chainId(1),
    },
  },
  user: evmAddress("0x456…"),
};
```

```tsx title="Query by User Position"
import { evmAddress } from "@aave/react";

const request: ActivitiesRequest = {
  query: {
    userPositionId: position.id, // position: UserPosition
  },
  user: evmAddress("0x456…"),
};
```

Filter by specific activity types.

```tsx title="Core Activities"
import { evmAddress, ActivityType } from "@aave/react";

const request: ActivitiesRequest = {
  query: {
    // your query criteria
  },
  user: evmAddress("0x456…"),
  types: [
    ActivityType.Borrow,
    ActivityType.Supply,
    ActivityType.Repay,
    ActivityType.Withdraw,
  ],
};
```

```tsx title="Swap Activities"
import { evmAddress, ActivityType } from "@aave/react";

const request: ActivitiesRequest = {
  query: {
    // your query criteria
  },
  user: evmAddress("0x456…"),
  types: [
    ActivityType.TokenToTokenSwap,
    ActivityType.SupplySwap,
    ActivityType.BorrowSwap,
    ActivityType.RepayWithSupply,
    ActivityType.WithdrawSwap,
  ],
};
```

Finally, you can specify a different time window or currency for the data.

```tsx title="Custom Time Window"
import { evmAddress, TimeWindow } from "@aave/react";

const { data, loading, error } = useActivities({
  query: {
    // your query criteria
  },
  user: evmAddress("0x456…"),
  timeWindow: TimeWindow.LastWeek,
});
```

```tsx title="Custom Currency"
import { evmAddress, Currency } from "@aave/react";

const { data, loading, error } = useActivities({
  query: {
    // your query criteria
  },
  user: evmAddress("0x456…"),
  currency: Currency.Eur,
});
```

</tab>
<tab label="TypeScript">

Use the `activities` action to fetch paginated activities for a user.

```ts title="Query by Chains"
import { activities } from "@aave/client/actions";
import { evmAddress, chainId } from "@aave/client";
import { client } from "./client";

const result = await activities(client, {
  query: {
    chainIds: [chainId(1)],
  },
  user: evmAddress("0x456…"),
});

if (result.isOk()) {
  console.log("Activities:", result.value);
  // result.value: PaginatedActivitiesResult
} else {
  console.error("Error:", result.error);
}
```

```ts title="Query by Spoke"
import { activities } from "@aave/client/actions";
import { evmAddress, chainId } from "@aave/client";
import { client } from "./client";

const result = await activities(client, {
  query: {
    spoke: {
      address: evmAddress("0x123…"),
      chainId: chainId(1),
    },
  },
  user: evmAddress("0x456…"),
});

if (result.isOk()) {
  console.log("Activities:", result.value);
  // result.value: PaginatedActivitiesResult
} else {
  console.error("Error:", result.error);
}
```

```ts title="Query by Transaction"
import { activities } from "@aave/client/actions";
import { evmAddress, chainId, txHash } from "@aave/client";
import { client } from "./client";

const result = await activities(client, {
  query: {
    txHash: {
      txHash: txHash("0xabc123…"),
      chainId: chainId(1),
    },
  },
  user: evmAddress("0x456…"),
});

if (result.isOk()) {
  // result.value: PaginatedActivitiesResult
  console.log("Activities:", result.value);
} else {
  console.error("Error:", result.error);
}
```

```ts title="Query by User Position"
import { activities } from "@aave/client/actions";
import { evmAddress } from "@aave/client";
import { client } from "./client";

const result = await activities(client, {
  query: {
    userPositionId: position.id, // position: UserPosition
  },
  user: evmAddress("0x456…"),
});

if (result.isOk()) {
  console.log("Activities:", result.value);
  // result.value: PaginatedActivitiesResult
} else {
  console.error("Error:", result.error);
}
```

```ts title="client.ts"
import { AaveClient } from "@aave/client";

export const client = AaveClient.create();
```

Filter by specific activity types.

```ts title="Core Activities"
import { activities } from "@aave/client/actions";
import { evmAddress, ActivityType } from "@aave/client";
import { client } from "./client";

const result = await activities(client, {
  query: {
    // your query criteria
  },
  user: evmAddress("0x456…"),
  types: [
    ActivityType.Borrow,
    ActivityType.Supply,
    ActivityType.Repay,
    ActivityType.Withdraw,
  ],
});
```

```ts title="Swap Activities"
import { activities } from "@aave/client/actions";
import { evmAddress, ActivityType } from "@aave/client";
import { client } from "./client";

const result = await activities(client, {
  query: {
    // your query criteria
  },
  user: evmAddress("0x456…"),
  types: [
    ActivityType.TokenToTokenSwap,
    ActivityType.SupplySwap,
    ActivityType.BorrowSwap,
    ActivityType.RepayWithSupply,
    ActivityType.WithdrawSwap,
  ],
});
```

Specify a different currency for displaying fiat amounts.

```ts title="Custom Currency"
import { activities } from "@aave/client/actions";
import { evmAddress, Currency } from "@aave/client";
import { client } from "./client";

const result = await activities(
  client,
  {
    query: {
      // your query criteria
    },
    user: evmAddress("0x456…"),
  },
  {
    currency: Currency.Eur,
  },
);
```

</tab>
<tab label="GraphQL">

Use the `activities` query to fetch paginated activity history for a user.

```graphql title="Query"
query ($request: ActivitiesRequest!, $currency: Currency! = USD) {
  activities(request: $request) {
    items {
      ... on BorrowActivity {
        ...BorrowActivity
      }
      ... on SupplyActivity {
        ...SupplyActivity
      }
      ... on WithdrawActivity {
        ...WithdrawActivity
      }
      ... on RepayActivity {
        ...RepayActivity
      }
      ... on LiquidatedActivity {
        ...LiquidatedActivity
      }
      ... on UsingAsCollateralActivity {
        ...UsingAsCollateralActivity
      }
      ... on UpdatedDynamicConfigActivity {
        ...UpdatedDynamicConfigActivity
      }
      ... on UpdatedRiskPremiumActivity {
        ...UpdatedRiskPremiumActivity
      }
      ... on TokenSwapActivity {
        ...TokenSwapActivity
      }
      ... on SupplySwapActivity {
        ...SupplySwapActivity
      }
      ... on BorrowSwapActivity {
        ...BorrowSwapActivity
      }
      ... on RepayWithSupplyActivity {
        ...RepayWithSupplyActivity
      }
      ... on WithdrawSwapActivity {
        ...WithdrawSwapActivity
      }
    }
    pageInfo {
      next
      prev
    }
  }
}
```

```graphql title="BorrowActivity"
fragment BorrowActivity on BorrowActivity {
  id
  user
  timestamp
  txHash
  spoke {
    ...Spoke
  }
  reserve {
    ...ReserveInfo
  }
  borrowed {
    ...Erc20Amount
  }
  chain {
    ...Chain
  }
}
```

```graphql title="SupplyActivity"
fragment SupplyActivity on SupplyActivity {
  id
  user
  timestamp
  txHash
  spoke {
    ...Spoke
  }
  reserve {
    ...ReserveInfo
  }
  supplied {
    ...Erc20Amount
  }
  chain {
    ...Chain
  }
}
```

```graphql title="WithdrawActivity"
fragment WithdrawActivity on WithdrawActivity {
  id
  user
  timestamp
  txHash
  spoke {
    ...Spoke
  }
  reserve {
    ...ReserveInfo
  }
  withdrawn {
    ...Erc20Amount
  }
  chain {
    ...Chain
  }
}
```

```graphql title="RepayActivity"
fragment RepayActivity on RepayActivity {
  id
  user
  timestamp
  txHash
  spoke {
    ...Spoke
  }
  reserve {
    ...ReserveInfo
  }
  repaid {
    ...Erc20Amount
  }
  chain {
    ...Chain
  }
}
```

```graphql title="Others"
fragment LiquidatedActivity on LiquidatedActivity {
  id
  user
  timestamp
  txHash
  spoke {
    ...Spoke
  }
  collateral {
    ...Erc20Amount
  }
  liquidatorReceived {
    ...Erc20Amount
  }
  liquidationFee {
    ...Erc20Amount
  }
  collateralReserve {
    ...ReserveInfo
  }
  debt {
    ...Erc20Amount
  }
  debtReserve {
    ...ReserveInfo
  }
  liquidator
  liquidationHealthFactor
  chain {
    ...Chain
  }
}

fragment UsingAsCollateralActivity on UsingAsCollateralActivity {
  __typename
  id
  user
  timestamp
  txHash
  spoke {
    ...Spoke
  }
  reserve {
    ...ReserveInfo
  }
  enabledAsCollateral
  chain {
    ...Chain
  }
}

fragment UpdatedDynamicConfigActivity on UpdatedDynamicConfigActivity {
  __typename
  id
  user
  timestamp
  txHash
  spoke {
    ...Spoke
  }
  reserve {
    ...ReserveInfo
  }
  collateralFactor {
    ...PercentNumberChangeSnapshot
  }
  maxLiquidationBonus {
    ...PercentNumberChangeSnapshot
  }
  liquidationFee {
    ...PercentNumberChangeSnapshot
  }
  chain {
    ...Chain
  }
}

fragment UpdatedRiskPremiumActivity on UpdatedRiskPremiumActivity {
  __typename
  id
  user
  timestamp
  txHash
  spoke {
    ...Spoke
  }
  premium {
    ...PercentNumberChangeSnapshot
  }
  chain {
    ...Chain
  }
}

fragment PercentNumberChangeSnapshot on PercentNumberChangeSnapshot {
  before {
    ...PercentNumber
  }
  after {
    ...PercentNumber
  }
}
```

See below some examples of how to use the query.

```json title="Query by Chains"
{
  "request": {
    "query": {
      "chainIds": [1]
    },
    "user": "0x456…"
  }
}
```

```json title="Query by Spoke"
{
  "request": {
    "query": {
      "spoke": {
        "address": "0x123…",
        "chainId": 1
      }
    },
    "user": "0x456…"
  }
}
```

```json title="Query by Transaction"
{
  "request": {
    "query": {
      "txHash": {
        "txHash": "0xabc123…",
        "chainId": 1
      }
    },
    "user": "0x456…"
  }
}
```

```json title="Query by User Position"
{
  "request": {
    "query": {
      "userPositionId": "SGVsbG8h"
    },
    "user": "0x456…"
  }
}
```

Filter by specific activity types using the `types` field.

```json title="Core Activities"
{
  "request": {
    "query": {
      // your query criteria
    },
    "user": "0x456…",
    "types": ["BORROW", "SUPPLY", "REPAY", "WITHDRAW"]
  }
}
```

```json title="Swap Activities"
{
  "request": {
    "query": {
      // your query criteria
    },
    "user": "0x456…",
    "types": [
      "TOKEN_TO_TOKEN_SWAP",
      "SUPPLY_SWAP",
      "BORROW_SWAP",
      "REPAY_WITH_SUPPLY",
      "WITHDRAW_SWAP"
    ]
  }
}
```

Specify a different currency for displaying fiat amounts using the `currency` argument.

```json title="Custom Currency"
{
  "request": {
    "query": {
      // your query criteria
    },
    "user": "0x456…"
  },
  "currency": "EUR"
}
```

</tab>
</tabgroup>
## Handle Pagination

Navigate through large activity history sets using cursor-based pagination.

<tabgroup>
<tab label="React">

Use the pagination information from the response to implement next/previous navigation.

```tsx title="Basic Pagination"
import {
  useActivities,
  evmAddress,
  chainId,
  PageSize,
  type Cursor,
} from "@aave/react";
import { useState } from "react";

function PaginatedActivities() {
  const [cursor, setCursor] = useState<Cursor | null>();

  const { data, loading, error } = useActivities({
    query: { chainIds: [chainId(1)] },
    user: evmAddress("0x456…"),
    pageSize: PageSize.Ten,
    cursor,
  });

  if (loading) return <div>Loading…</div>;

  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h3>Transaction History</h3>
      {data.items.map((activity) => (
        <div key={activity.id}>
          <p>
            {activity.__typename}: {activity.txHash}
          </p>
        </div>
      ))}

      <div>
        <button
          onClick={() => setCursor(data.pageInfo.prev)}
          disabled={!data.pageInfo.prev}
        >
          Previous
        </button>
        <button
          onClick={() => setCursor(data.pageInfo.next)}
          disabled={!data.pageInfo.next}
        >
          Next
        </button>
      </div>
    </div>
  );
}
```

</tab>
<tab label="TypeScript">

Use the `pageInfo` field to implement cursor-based pagination. Navigate back and forward using the `prev` and `next` cursors.

```ts title="Fetch All Activities"
import { activities } from "@aave/client/actions";
import { evmAddress, chainId, PageSize } from "@aave/client";
import { client } from "./client";

let cursor: string | undefined;
const all = [];

while (true) {
  const res = await activities(client, {
    query: { chainIds: [chainId(1)] },
    user: evmAddress("0x456…"),
    pageSize: PageSize.Ten,
    cursor,
  });

  if (!res.isOk()) throw res.error;

  const { items, pageInfo } = res.value;
  all.push(...items);

  cursor = pageInfo.next ?? null;
  if (!cursor) break;
}

console.log("Activities:", all);
```

</tab>
<tab label="GraphQL">

Use the `pageInfo` field to implement cursor-based pagination. Navigate back and forward using the `prev` and `next` cursors.

```json title="Get Initial Page"
{
  "request": {
    "query": {
      // your query criteria
    },
    "user": "0x456…",
    "pageSize": "TEN"
  }
}
```

Example response structure with pagination information.

```json title="Response with Pagination"
{
  "data": {
    "activities": {
      "items": […],
      "pageInfo": {
        "prev": "abc123…",
        "next": "xyz789…"
      }
    }
  }
}
```

Navigate to subsequent or previous pages using respectively the `next` or `prev` cursors from `pageInfo`.

```json title="Fetch Next Page"
{
  "request": {
    "query": {
      // your query criteria
    },
    "user": "0x456…",
    "pageSize": "TEN",
    "cursor": "xyz789…"
  }
}
```

</tab>
</tabgroup>
## Network Fees

Fetch the network fee (gas cost) and its historical fiat value for a specific activity transaction.

> [!WARNING]
> This experimental AaveKit React hook currently works only with Viem or Wagmi
> integrations. Support for additional wallet libraries may be added later.

Use the `useNetworkFee` hook to fetch the network fee for an activity by fetching the transaction receipt and converting the gas cost to both native and fiat amounts.

```tsx title="Viem"
import { type ActivityItem, Currency } from "@aave/react";
import { useNetworkFee } from "@aave/react/viem";

function ActivityFee({ activity }: { activity: ActivityItem }) {
  const {
    data: fee,
    loading,
    error,
  } = useNetworkFee({
    query: { activity },
    currency: Currency.Eur,
  });

  if (loading) return Loading fee…;
  if (error) return Error: {error.message};

  return (
    <p>
      Network Fee: {fee.amount.value.toDisplayString(2)} {fee.token.info.symbol}
      <span>
        ≈{fee.exchange.symbol}
        {fee.exchange.value.toDisplayString(2)}
      </span>
    </p>
  );
}
```

Like other declarative hooks, the `useNetworkFee` hook can be used in React Suspense mode and implements pausable mode.

```tsx title="Suspense Mode"
const { data: fee } = useNetworkFee({
  query: { activity },
  currency: Currency.Eur,
  suspense: true,
});
```

```tsx title="Pausable Mode"
function ActivityFee({
  activity,
}: {
  activity: ActivityItem | null | undefined;
}) {
  const { data: fee, paused } = useNetworkFee({
    query: {
      activity,
    },
    pause: !activity,
  });

  // …
}
```

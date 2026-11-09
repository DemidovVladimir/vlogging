# Reserves

Learn how to discover and access reserves in Aave v4 spokes.

---

## Reserve Data Structure

Reserve data provides comprehensive information about each asset's lending and borrowing conditions, including:

- Identification: IDs, spoke, chain
- Underlying token information
- Supply information: APY, liquidity, caps, collateral configuration
- Borrow information: APY, available liquidity, utilization rates, caps
- Reserve configuration: collateral factor, liquidation bonus, liquidation fee, collateral risk
- Reserve status: frozen, paused
- User incentives: extra APY and borrow discounts (see [Incentive Programs](./incentives))
- User-specific state: balances, borrowable amounts, collateral usage (when user is specified in request)

<tabgroup>
<tab label="TypeScript">

The following TypeScript interfaces illustrate the core Reserve type:

```ts title="Reserve"
interface Reserve {
  __typename: "Reserve";
  id: ReserveId;
  onChainId: OnChainReserveId;
  chain: Chain;
  spoke: Spoke;
  asset: HubAsset;
  summary: ReserveSummary;
  settings: ReserveSettings;
  status: ReserveStatus;
  canBorrow: boolean;
  canSupply: boolean;
  canUseAsCollateral: boolean;
  canSwapFrom: boolean;
  userState: ReserveUserState | null;
}
```

```ts title="ReserveSummary"
interface ReserveSummary {
  __typename: "ReserveSummary";
  supplied: Erc20Amount;
  borrowed: Erc20Amount;
  supplyApy: PercentNumber;
  borrowApy: PercentNumber;
  rewards: Reward[];
}
```

```ts title="ReserveSettings"
interface ReserveSettings {
  __typename: "ReserveSettings";
  collateralFactor: PercentNumber;
  maxLiquidationBonus: PercentNumber;
  liquidationFee: PercentNumber;
  collateralRisk: PercentNumber;
  borrowable: boolean;
  collateral: boolean;
  suppliable: boolean;
  receiveSharesEnabled: boolean;
  latestDynamicConfigKey: DynamicConfigKey;
  borrowCap: Erc20Amount;
  supplyCap: Erc20Amount;
}
```

```ts title="ReserveStatus"
interface ReserveStatus {
  __typename: "ReserveStatus";
  frozen: boolean;
  paused: boolean;
  active: boolean;
}
```

```ts title="ReserveUserState"
interface ReserveUserState {
  __typename: "ReserveUserState";
  balance: Erc20Amount;
  suppliable: Erc20Amount;
  borrowable: Erc20Amount;
  borrowApy: PercentNumber;
  collateralFactor: PercentNumber;
  maxLiquidationBonus: PercentNumber;
  liquidationFee: PercentNumber;
  dynamicConfigKey: DynamicConfigKey;
}
```

</tab>
<tab label="GraphQL">

The following GraphQL fragments illustrate the core Reserve type:

```graphql title="Reserve"
fragment Reserve on Reserve {
  __typename
  id
  onChainId
  spoke {
    ...Spoke
  }
  chain {
    ...Chain
  }
  summary {
    ...ReserveSummary
  }
  settings {
    ...ReserveSettings
  }
  status {
    ...ReserveStatus
  }
  canBorrow
  canSupply
  canUseAsCollateral
  canSwapFrom
  userState {
    ...ReserveUserState
  }
  asset {
    ...HubAsset
  }
}
```

```graphql title="ReserveSummary"
fragment ReserveSummary on ReserveSummary {
  __typename
  supplied {
    ...Erc20Amount
  }
  borrowed {
    ...Erc20Amount
  }
  supplyApy {
    ...PercentNumber
  }
  borrowApy {
    ...PercentNumber
  }
  rewards {
    ...Reward
  }
}
```

```graphql title="ReserveSettings"
fragment ReserveSettings on ReserveSettings {
  __typename
  collateralFactor {
    ...PercentNumber
  }
  maxLiquidationBonus {
    ...PercentNumber
  }
  liquidationFee {
    ...PercentNumber
  }
  collateralRisk {
    ...PercentNumber
  }
  borrowable
  collateral
  suppliable
  receiveSharesEnabled
  latestDynamicConfigKey
  borrowCap {
    ...Erc20Amount
  }
  supplyCap {
    ...Erc20Amount
  }
}
```

```graphql title="ReserveStatus"
fragment ReserveStatus on ReserveStatus {
  __typename
  frozen
  paused
  active
}
```

```graphql title="ReserveUserState"
fragment ReserveUserState on ReserveUserState {
  __typename
  balance {
    ...Erc20Amount
  }
  suppliable {
    ...Erc20Amount
  }
  borrowable {
    ...Erc20Amount
  }
  borrowApy {
    ...PercentNumber
  }
  collateralFactor {
    ...PercentNumber
  }
  maxLiquidationBonus {
    ...PercentNumber
  }
  liquidationFee {
    ...PercentNumber
  }
  dynamicConfigKey
}
```

</tab>
<tab label="Solidity">

Reserves live inside the spoke contract and are exposed through the `ISpoke` interface. Each reserve stores links back to its hub asset plus configuration flags that control supply, borrow, and collateral behaviour. Dynamic parameters such as collateral factor or liquidation bonus are kept in dedicated structs.

```solidity title="Reserve Struct"
struct Reserve {
  address underlying;
  IHubBase hub;
  uint16 assetId;
  uint8 decimals;
  uint24 dynamicConfigKey;
  uint24 collateralRisk;
  ReserveFlags flags;
}
```

```solidity title="ReserveConfig Struct"
struct ReserveConfig {
  uint24 collateralRisk;
  bool paused;
  bool frozen;
  bool borrowable;
  bool liquidatable;
  bool receiveSharesEnabled;
}
```

```solidity title="DynamicReserveConfig Struct"
struct DynamicReserveConfig {
  uint16 collateralFactor;
  uint32 maxLiquidationBonus;
  uint16 liquidationFee;
}
```

</tab>
</tabgroup>
## Listing Available Reserves

Discover all available reserves given some criteria.

<tabgroup>
<tab label="React">

Use the `useReserves` hook (or the imperative `useReservesAction` variant) to fetch a list of reserves.

```tsx title="Loading State"
import { type ReservesRequest, useReserves } from "@aave/react";

function ReservesList({ request }: { request: ReservesRequest }) {
  const { data, loading, error } = useReserves(request);

  if (loading) return <div>Loading…</div>;

  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {data.map((reserve) => (
        <div key={reserve.id}>
          <h3>{reserve.asset.underlying.info.name}</h3>
          Spoke: {reserve.spoke.name}
        </div>
      ))}
    </div>
  );
}
```

```tsx title="React Suspense"
import { type ReservesRequest, useReserves } from "@aave/react";

function ReservesList({ request }: { request: ReservesRequest }) {
  const { data } = useReserves({
    ...request,
    suspense: true,
  });

  return (
    <div>
      {data.map((reserve) => (
        <div key={reserve.id}>
          <h3>{reserve.asset.underlying.info.name}</h3>
          Spoke: {reserve.spoke.name}
        </div>
      ))}
    </div>
  );
}
```

```tsx title="Imperative Read"
import { type ReservesRequest, useReservesAction } from "@aave/react";

// …

const [fetch, { called, data, error, loading }] = useReservesAction();

const handler = async (request: ReservesRequest) => {
  const result = await fetch(request);

  if (result.isOk()) {
    console.log(result.value); // Reserve[]
  } else {
    console.error(result.error);
  }
};
```

> [!WARNING]
> The `useReservesAction` hook does **not** watch for updates. Use it when you
> need on-demand, fresh data (e.g., in an event handler).

You can query reserves as follows.

```tsx title="By Chains"
import { chainId } from "@aave/react";

const request: ReservesRequest = {
  query: {
    chainIds: [chainId(1)],
  },
};
```

```tsx title="By Tokens"
import { evmAddress, chainId } from "@aave/react";

// By a list of tokens on their chain
const request: ReservesRequest = {
  query: {
    tokens: [
      {
        address: evmAddress("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"), // USDC
        chainId: chainId(1),
      },
      {
        address: evmAddress("0x40D16FC0246aD3160Ccc09B8D0D3A2cD28aE6C2f"), // GHO
        chainId: chainId(1),
      },
    ],
  },
};

// By a token on a Spoke
const request: ReservesRequest = {
  query: {
    spokeToken: {
      spoke: spoke.id, // spoke: Spoke
      token: evmAddress("0x123…"),
    },
  },
};

// By a token on a Hub
const request: ReservesRequest = {
  query: {
    hubToken: {
      chainId: chainId(1),
      hub: evmAddress("0x456…"),
      token: evmAddress("0x123…"),
    },
  },
};
```

```tsx title="By Hub"
import { evmAddress, chainId } from "@aave/react";

// By a hub ID
const request: ReservesRequest = {
  query: {
    hubId: hub.id, // hub: Hub
  },
};

// By a hub address and chain ID
const request: ReservesRequest = {
  query: {
    hub: {
      chainId: chainId(1),
      address: evmAddress("0x456…"),
    },
  },
};
```

```tsx title="By Spoke"
import { evmAddress, chainId } from "@aave/react";

// By a spoke ID
const request: ReservesRequest = {
  query: {
    spokeId: spoke.id, // spoke: Spoke
  },
};

// By a spoke address and chain ID
const request: ReservesRequest = {
  query: {
    spoke: {
      address: evmAddress("0x123..."),
      chainId: chainId(1),
    },
  },
};
```

```tsx title="By User Position"
const request: ReservesRequest = {
  query: {
    userPositionId: position.id, // position: UserPosition
  },
};
```

```tsx title="By Categories"
import { TokenCategory, chainId } from "@aave/react";

const request: ReservesRequest = {
  query: {
    chainTokenCategories: [
      {
        chainId: chainId(1),
        categories: [TokenCategory.Stablecoin, TokenCategory.EthCorrelated],
      },
    ],
  },
};
```

```tsx title="By Token Across Chains"
import { chainId } from "@aave/react";

// By canonical token info ID, across every chain
const request: ReservesRequest = {
  query: {
    tokenInfo: tokenInfo.id, // tokenInfo: TokenInfo
  },
};

// By raw symbol, optionally restricted to chains
const request: ReservesRequest = {
  query: {
    symbolChainIds: {
      symbol: "USDC",
      chainIds: [chainId(1), chainId(43114)], // optional; omit to match all chains
    },
  },
};
```

Filter reserves by supply, borrow, or collateral.

```tsx title="Supply Reserves"
import { ReservesRequestFilter } from "@aave/react";

// …

const request: ReservesRequest = {
  query: {
    // your query criteria
  },
  filter: ReservesRequestFilter.Supply,
};
```

```tsx title="Collateral Reserves"
import { ReservesRequestFilter } from "@aave/react";

// …

const request: ReservesRequest = {
  query: {
    // your query criteria
  },
  filter: ReservesRequestFilter.Collateral,
};
```

```tsx title="Borrow Reserves"
import { ReservesRequestFilter } from "@aave/react";

// …

const request: ReservesRequest = {
  query: {
    // your query criteria
  },
  filter: ReservesRequestFilter.Borrow,
};
```

Add a user address to return `ReserveUserState` for each reserve.

```tsx title="Reserves User State"
import { evmAddress } from "@aave/react";

// …

const request: ReservesRequest = {
  query: {
    // your query criteria
  },
  user: evmAddress("0x456…"),
};
```

Sort reserves by asset name, user balance, APYs, collateral factor, or available amounts.

```tsx title="Asset Name"
import { OrderDirection } from "@aave/react";

// …

const request: ReservesRequest = {
  query: {
    // your query criteria
  },
  orderBy: { assetName: OrderDirection.Asc },
};
```

```tsx title="User Balance"
import { evmAddress, OrderDirection } from "@aave/react";

// …

const request: ReservesRequest = {
  query: {
    // your query criteria
  },
  orderBy: { userBalance: OrderDirection.Asc },
  user: evmAddress("0x456…"),
};
```

```tsx title="APYs"
import { evmAddress, OrderDirection } from "@aave/react";

// …

const request: ReservesRequest = {
  query: {
    // your query criteria
  },
  filter: ReservesRequestFilter.Supply,
  orderBy: { supplyApy: OrderDirection.Desc },
};

// OR

const request: ReservesRequest = {
  query: {
    // your query criteria
  },
  filter: ReservesRequestFilter.Borrow,
  orderBy: { borrowApy: OrderDirection.Asc },
};
```

```tsx title="Collateral Factor"
import { evmAddress, OrderDirection } from "@aave/react";

// …

const request: ReservesRequest = {
  query: {
    // your query criteria
  },
  orderBy: { collateralFactor: OrderDirection.Desc },
};
```

```tsx title="Available Amounts"
import { evmAddress, OrderDirection } from "@aave/react";

// …

const request: ReservesRequest = {
  query: {
    // your query criteria
  },
  filter: ReservesRequestFilter.Supply,
  orderBy: { supplyAvailable: OrderDirection.Desc },
};

// OR

const request: ReservesRequest = {
  query: {
    // your query criteria
  },
  filter: ReservesRequestFilter.Borrow,
  orderBy: { borrowAvailable: OrderDirection.Desc },
};
```

Specify a different currency to return fiat amounts in.

```tsx title="Declarative Read"
import { Currency } from "@aave/react";

// …

const { data, error, loading } = useReserves({
  query: {
    // your query criteria
  },
  currency: Currency.Eur,
});
```

```tsx title="Imperative Read"
import { Currency } from "@aave/react";

const [fetch, { called, data, error, loading }] = useReservesAction({
  currency: Currency.Eur,
});
```

</tab>
<tab label="TypeScript">

Use the `reserves` action to fetch reserves based on various criteria.

```ts title="By Chains"
import { reserves } from "@aave/client/actions";
import { chainId } from "@aave/client";

import { client } from "./client";

const result = await reserves(client, {
  query: {
    chainIds: [chainId(1)],
  },
});

if (result.isOk()) {
  console.log(result.value); // result.value: Reserve[]
} else {
  console.error(result.error);
}
```

```ts title="By Tokens"
import { reserves } from "@aave/client/actions";
import { chainId, evmAddress } from "@aave/client";

import { client } from "./client";

// By a list of tokens on their chain
const result = await reserves(client, {
  query: {
    tokens: [
      {
        address: evmAddress("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"), // USDC
        chainId: chainId(1),
      },
      {
        address: evmAddress("0x40D16FC0246aD3160Ccc09B8D0D3A2cD28aE6C2f"), // GHO
        chainId: chainId(1),
      },
    ],
  },
});

// By a token on a Spoke
const result = await reserves(client, {
  query: {
    spokeToken: {
      spoke: spoke.id, // spoke: Spoke
      token: evmAddress("0x123…"),
    },
  },
});

// By a token on a Hub
const result = await reserves(client, {
  query: {
    hubToken: {
      chainId: chainId(1),
      hub: evmAddress("0x456…"),
      token: evmAddress("0x123…"),
    },
  },
});
```

```ts title="By Hub"
import { reserves } from "@aave/client/actions";
import { chainId, evmAddress } from "@aave/client";

import { client } from "./client";

// By a hub ID
const result = await reserves(client, {
  query: {
    hubId: hub.id, // hub: Hub
  },
});

// By a hub address and chain ID
const result = await reserves(client, {
  query: {
    hub: {
      chainId: chainId(1),
      address: evmAddress("0x456…"),
    },
  },
});
```

```ts title="By Spoke"
import { reserves } from "@aave/client/actions";
import { chainId, evmAddress } from "@aave/client";

import { client } from "./client";

// By a spoke ID
const result = await reserves(client, {
  query: {
    spokeId: spoke.id, // spoke: Spoke
  },
});

// By a spoke address and chain ID
const result = await reserves(client, {
  query: {
    spoke: {
      address: evmAddress("0x123..."),
      chainId: chainId(1),
    },
  },
});
```

```ts title="By User Position"
import { reserves } from "@aave/client/actions";

import { client } from "./client";

const result = await reserves(client, {
  query: {
    userPositionId: position.id, // position: UserPosition
  },
});
```

```ts title="By Categories"
import { reserves } from "@aave/client/actions";
import { TokenCategory, chainId } from "@aave/client";
import { client } from "./client";

const result = await reserves(client, {
  query: {
    chainTokenCategories: [
      {
        chainId: chainId(1),
        categories: [TokenCategory.Stablecoin, TokenCategory.EthCorrelated],
      },
    ],
  },
});
```

```ts title="By Token Across Chains"
import { reserves } from "@aave/client/actions";
import { chainId } from "@aave/client";
import { client } from "./client";

// By canonical token info ID, across every chain
const result = await reserves(client, {
  query: {
    tokenInfo: tokenInfo.id, // tokenInfo: TokenInfo
  },
});

// By raw symbol, optionally restricted to chains
const result = await reserves(client, {
  query: {
    symbolChainIds: {
      symbol: "USDC",
      chainIds: [chainId(1), chainId(43114)], // optional; omit to match all chains
    },
  },
});
```

```ts title="client.ts"
import { AaveClient } from "@aave/client";

export const client = AaveClient.create();
```

Filter reserves by supply, borrow, or collateral.

```ts title="Supply Reserves"
import { reserves } from "@aave/client/actions";
import { chainId, evmAddress } from "@aave/client";
import { ReservesRequestFilter } from "@aave/graphql";

import { client } from "./client";

const result = await reserves(client, {
  query: {
    // your query criteria
  },
  filter: ReservesRequestFilter.Supply,
});
```

```ts title="Collateral Reserves"
import { reserves } from "@aave/client/actions";
import { chainId, evmAddress } from "@aave/client";
import { ReservesRequestFilter } from "@aave/graphql";

import { client } from "./client";

const result = await reserves(client, {
  query: {
    // your query criteria
  },
  filter: ReservesRequestFilter.Collateral,
});
```

```ts title="Borrow Reserves"
import { reserves } from "@aave/client/actions";
import { chainId, evmAddress } from "@aave/client";
import { ReservesRequestFilter } from "@aave/graphql";

import { client } from "./client";

const result = await reserves(client, {
  query: {
    // your query criteria
  },
  filter: ReservesRequestFilter.Borrow,
});
```

Add a user address to return `ReserveUserState` for each reserve.

```ts title="Reserves User State"
import { reserves } from "@aave/client/actions";
import { chainId, evmAddress } from "@aave/client";

import { client } from "./client";

const result = await reserves(client, {
  query: {
    // your query criteria
  },
  user: evmAddress("0x456…"),
});
```

Sort reserves by asset name, user balance, APYs, collateral factor, or available amounts.

```ts title="Asset Name"
import { reserves } from "@aave/client/actions";
import { chainId, evmAddress, OrderDirection } from "@aave/client";

import { client } from "./client";

const result = await reserves(client, {
  query: {
    // your query criteria
  },
  orderBy: { assetName: OrderDirection.Asc },
});
```

```ts title="User Balance"
import { reserves, OrderDirection } from "@aave/client/actions";
import { chainId, evmAddress } from "@aave/client";

import { client } from "./client";

const result = await reserves(client, {
  query: {
    // your query criteria
  },
  orderBy: { userBalance: OrderDirection.Asc },
  user: evmAddress("0x456…"),
});
```

```ts title="APYs"
import { reserves, OrderDirection } from "@aave/client/actions";
import { chainId, evmAddress } from "@aave/client";

import { client } from "./client";

const result = await reserves(client, {
  query: {
    // your query criteria
  },
  filter: ReservesRequestFilter.Supply,
  orderBy: { supplyApy: OrderDirection.Desc },
});

// OR

const result = await reserves(client, {
  query: {
    // your query criteria
  },
  filter: ReservesRequestFilter.Borrow,
  orderBy: { borrowApy: OrderDirection.Asc },
});
```

```ts title="Collateral Factor"
import { reserves, OrderDirection } from "@aave/client/actions";
import { chainId, evmAddress } from "@aave/client";

import { client } from "./client";

const result = await reserves(client, {
  query: {
    // your query criteria
  },
  orderBy: { collateralFactor: OrderDirection.Desc },
});
```

```ts title="Available Amounts"
import { reserves, OrderDirection } from "@aave/client/actions";
import { chainId, evmAddress } from "@aave/client";

import { client } from "./client";

const result = await reserves(client, {
  query: {
    // your query criteria
  },
  filter: ReservesRequestFilter.Supply,
  orderBy: { supplyAvailable: OrderDirection.Desc },
});

// OR

const result = await reserves(client, {
  query: {
    // your query criteria
  },
  filter: ReservesRequestFilter.Borrow,
  orderBy: { borrowAvailable: OrderDirection.Desc },
});
```

Specify a different currency to return fiat amounts in.

```ts title="Custom Currency"
import { Currency } from "@aave/client";

import { client } from "./client";

const result = await reserves(
  client,
  {
    // your request
  },
  {
    currency: Currency.Eur,
  },
);
```

</tab>
<tab label="GraphQL">

Use the `reserves` query to fetch reserves with flexible criteria.

```graphql
query ($request: ReservesRequest!) {
  value: reserves(request: $request) {
    ...Reserve
  }
}
```

Use the `query` field to select reserves by different criteria.

```json title="By Chains"
{
  "request": {
    "query": {
      "chainIds": [1]
    }
  }
}
```

```json title="By Tokens"
// By a list of tokens on their chain
{
  "request": {
    "query": {
      "tokens": [
        {
          "address": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          "chainId": 1
        },
        {
          "address": "0x40D16FC0246aD3160Ccc09B8D0D3A2cD28aE6C2f",
          "chainId": 1
        }
      ]
    }
  }
}

// By a token on a Spoke
{
  "request": {
    "query": {
      "spokeToken": {
        "spoke": "SGVsbG8h",
        "token": "0x123…"
      }
    }
  }
}

// By a token on a Hub
{
  "request": {
    "query": {
      "hubToken": {
        "chainId": 1,
        "hub": "0x456…",
        "token": "0x123…"
      }
    }
  }
}
```

```json title="By Hub"
// By a hub ID
{
  "request": {
    "query": {
      "hubId": "SGVsbG8h"
    }
  }
}

// By a hub address and chain ID
{
  "request": {
    "query": {
      "hub": {
        "chainId": 1,
        "address": "0x456…"
      }
    }
  }
}
```

```json title="By Spoke"
// By a spoke ID
{
  "request": {
    "query": {
      "spokeId": "SGVsbG8h"
    }
  }
}

// By a spoke address and chain ID
{
  "request": {
    "query": {
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
    "query": {
      "userPositionId": "SGVsbG8h"
    }
  }
}
```

```json title="By Categories"
{
  "request": {
    "query": {
      "chainTokenCategories": [
        {
          "chainId": 1,
          "categories": ["STABLECOIN", "ETH_CORRELATED"]
        }
      ]
    }
  }
}
```

```json title="By Token Across Chains"
// By canonical token info ID, across every chain
{
  "request": {
    "query": {
      "tokenInfo": "SGVsbG8h"
    }
  }
}

// By raw symbol, optionally restricted to chains
{
  "request": {
    "query": {
      "symbolChainIds": {
        "symbol": "USDC",
        "chainIds": [1, 43114]
      }
    }
  }
}
```

Filter reserves by supply, borrow, or collateral.

```json title="Supply Reserves"
{
  "request": {
    "query": {
      "spoke": {
        "address": "0x123…",
        "chainId": 1
      }
    },
    "filter": "SUPPLY"
  }
}
```

```json title="Collateral Reserves"
{
  "request": {
    "query": {
      "spoke": {
        "address": "0x123…",
        "chainId": 1
      }
    },
    "filter": "COLLATERAL"
  }
}
```

```json title="Borrow Reserves"
{
  "request": {
    "query": {
      "spoke": {
        "address": "0x123…",
        "chainId": 1
      }
    },
    "filter": "BORROW"
  }
}
```

Add a user address to return `ReserveUserState` for each reserve.

```json title="With User"
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

Sort reserves by asset name, user balance, APYs, collateral factor, or available amounts.

```json title="AssetName"
{
  "request": {
    "query": {
      "spoke": {
        "address": "0x123…",
        "chainId": 1
      }
    },
    "orderBy": { "assetName": "ASC" }
  }
}
```

```json title="User Balance"
{
  "request": {
    "query": {
      "spoke": {
        "address": "0x123…",
        "chainId": 1
      }
    },
    "user": "0x456…",
    "orderBy": { "userBalance": "DESC" }
  }
}
```

```json title="Supply APY"
{
  "request": {
    "query": {
      "spoke": {
        "address": "0x123…",
        "chainId": 1
      }
    },
    "filter": "SUPPLY",
    "orderBy": { "supplyApy": "DESC" }
  }
}
```

```json title="Borrow APY"
{
  "request": {
    "query": {
      "spoke": {
        "address": "0x123…",
        "chainId": 1
      }
    },
    "filter": "BORROW",
    "orderBy": { "borrowApy": "ASC" }
  }
}
```

```json title="Collateral Factor"
{
  "request": {
    "query": {
      "spoke": {
        "address": "0x123…",
        "chainId": 1
      }
    },
    "orderBy": { "collateralFactor": "DESC" }
  }
}
```

```json title="Available Amounts"
{
  "request": {
    "query": {
      "spoke": {
        "address": "0x123…",
        "chainId": 1
      }
    },
    "filter": "SUPPLY",
    "orderBy": { "supplyAvailable": "DESC" }
    // OR
    // "filter": "BORROW",
    // "orderBy": { "borrowAvailable": "DESC" }
  }
}
```

</tab>
<tab label="Solidity">

Reserves within a spoke are assigned sequential `reserveId` values. To retrieve all reserves within a spoke, first obtain the total reserve count and then loop through each `reserveId`.

```solidity title="Get All Spoke Reserves"
import { ISpoke } from "aave-v4/src/spoke/interfaces/ISpoke.sol";

function getSpokeReserves(
  address spokeAddress
) external view returns (ISpoke.Reserve[] memory) {
  ISpoke spoke = ISpoke(spokeAddress);
  uint256 reserveCount = spoke.getReserveCount();

  ISpoke.Reserve[] memory reserves = new ISpoke.Reserve[](reserveCount);

  for (uint256 reserveId = 0; reserveId < reserveCount; reserveId++) {
    reserves[reserveId] = spoke.getReserve(reserveId);
  }

  return reserves;
}
```

</tab>
</tabgroup>
## Fetching a Single Reserve

Get detailed information about a specific reserve.

<tabgroup>
<tab label="React">

Use the `useReserve` hook to fetch a specific reserve.

```tsx title="Loading State"
import { type ReserveRequest, useReserve } from "@aave/react";

function ReserveDetails({ request }: { request: ReserveRequest }) {
  const { data, loading, error } = useReserve(request);

  if (loading) return Loading reserve...;

  if (error) return Error: {error.message};

  if (!data) return Reserve not found;

  return (
    <div>
      <h2>Reserve ID: {data.id}</h2>
      Supply APY: {data.summary.supplyApy.normalized.toFixed(2)}%
      Borrow APY: {data.summary.borrowApy.normalized.toFixed(2)}%
    </div>
  );
}
```

```tsx title="React Suspense"
import { type ReserveRequest, useReserve } from "@aave/react";

function ReserveDetails({ request }: { request: ReserveRequest }) {
  const { data } = useReserve({
    ...request,
    suspense: true,
  });

  if (!data) return Reserve not found;

  return (
    <div>
      <h2>Reserve ID: {data.id}</h2>
      Supply APY: {data.summary.supplyApy.normalized.toFixed(2)}%
      Borrow APY: {data.summary.borrowApy.normalized.toFixed(2)}%
    </div>
  );
}
```

See below for examples of `ReserveRequest` objects.

```tsx title="By OnChain ID"
import { chainId, evmAddress, type OnChainReserveId } from "@aave/react";

const request: ReserveRequest = {
  query: {
    reserveInput: {
      chainId: chainId(1),
      spoke: evmAddress("0x123…"),
      onChainId: "1" as OnChainReserveId,
    },
  },
};
```

```tsx title="By Reserve ID"
import { ReserveId } from "@aave/react";

const request: ReserveRequest = {
  query: {
    reserveId: "SGVsbG8h" as ReserveId,
  },
};
```

Include user-specific state for the reserve.

```tsx title="With User State"
import { evmAddress } from "@aave/react";

const request: ReserveRequest = {
  query: {
    // your query criteria
  },
  user: evmAddress("0x456…"),
};
```

Finally, you can specify a different time window or currency for the data.

```tsx title="Custom Time Window"
import { TimeWindow } from "@aave/react";

const { data, loading, error } = useReserve({
  query: {
    // your query criteria
  },
  timeWindow: TimeWindow.LastWeek,
});
```

```tsx title="Custom Currency"
import { Currency } from "@aave/react";

const { data, loading, error } = useReserve({
  query: {
    // your query criteria
  },
  currency: Currency.Eur,
});
```

</tab>
<tab label="TypeScript">

Use the `reserve` action to fetch a specific reserve.

```ts title="By OnChain ID"
import { reserve } from "@aave/client/actions";
import { chainId, evmAddress, type OnChainReserveId } from "@aave/client";
import { client } from "./client";

const result = await reserve(client, {
  query: {
    reserveInput: {
      chainId: chainId(1),
      spoke: evmAddress("0x123…"),
      onChainId: "1" as OnChainReserveId,
    },
  },
});

if (result.isOk()) {
  console.log(result.value); // Reserve | null - null if not found
} else {
  console.error(result.error);
}
```

```ts title="By Reserve ID"
import { type ReserveId, reserve } from "@aave/client/actions";

import { client } from "./client";

// const id: ReserveId = "SGVsbG8h";

const result = await reserve(client, {
  query: { reserveId: id },
});
```

```ts title="With User State"
import { reserve } from "@aave/client/actions";
import { evmAddress } from "@aave/client";
import { client } from "./client";

const result = await reserve(client, {
  query: {
    // your query criteria
  },
  user: evmAddress("0x456…"),
});
```

</tab>

<tab label="GraphQL">

Use the `reserve` query to fetch a specific reserve.

```graphql
query ($request: ReserveRequest!) {
  value: reserve(request: $request) {
    ...Reserve
  }
}
```

See below for some examples of request objects.

```json title="By OnChain ID"
{
  "request": {
    "query": {
      "reserveInput": {
        "chainId": 1,
        "spoke": "0x123…",
        "onChainId": "1"
      }
    }
  }
}
```

```json title="By Reserve ID"
{
  "request": {
    "query": {
      "reserveId": "SGVsbG8h"
    }
  }
}
```

```json title="With User State"
{
  "request": {
    "query": {
      // your query criteria
    },
    "user": "0x456…"
  }
}
```

</tab>
</tabgroup>
## Borrow APY History

Fetch historical borrow APY data for a specific reserve. By default, Merkl rewards are included in the returned rates; pass `includeRewards: false` for protocol base rates only.

<tabgroup>
<tab label="React">

Use the `useBorrowApyHistory` hook to fetch borrow APY history over time.

```tsx title="Loading State"
import { type BorrowApyHistoryRequest, useBorrowApyHistory } from "@aave/react";

function BorrowApy({ request }: { request: BorrowApyHistoryRequest }) {
  const { data, loading, error } = useBorrowApyHistory(request);

  if (loading) return <div>Loading…</div>;

  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {data.map((sample) => (
        <div key={sample.date.toString()}>
          <p>
            <small>{sample.date.toLocaleDateString()}</small>
            {sample.avgRate.normalized.toFixed(2)}%
          </p>
        </div>
      ))}
    </div>
  );
}
```

```tsx title="React Suspense"
import { type BorrowApyHistoryRequest, useBorrowApyHistory } from "@aave/react";

function BorrowApy({ request }: { request: BorrowApyHistoryRequest }) {
  const { data } = useBorrowApyHistory({
    ...request,
    suspense: true,
  });

  return (
    <div>
      {data.map((sample) => (
        <div key={sample.date.toString()}>
          <p>
            <small>{sample.date.toLocaleDateString()}</small>
            {sample.avgRate.normalized.toFixed(2)}%
          </p>
        </div>
      ))}
    </div>
  );
}
```

See below for examples of `BorrowApyHistoryRequest` objects.

```tsx title="By Reserve ID"
import { TimeWindow } from "@aave/react";

const request: BorrowApyHistoryRequest = {
  reserve: reserve.id,
  window: TimeWindow.LastDay,
};
```

```tsx title="Custom Time Window"
import { TimeWindow } from "@aave/react";

const request: BorrowApyHistoryRequest = {
  reserve: reserve.id,
  window: TimeWindow.LastWeek,
};
```

```tsx title="Protocol Rates Only"
const request: BorrowApyHistoryRequest = {
  reserve: reserve.id,
  includeRewards: false, // exclude Merkl rewards from the rates
};
```

</tab>
<tab label="TypeScript">

Use the `borrowApyHistory` action to fetch historical borrow APY data.

```ts title="By Reserve ID"
import { borrowApyHistory } from "@aave/client/actions";
import { TimeWindow } from "@aave/client";
import { client } from "./client";

const result = await borrowApyHistory(client, {
  reserve: reserve.id,
  window: TimeWindow.LastDay,
});

if (result.isOk()) {
  console.log(result.value); // ApySample[]
} else {
  console.error(result.error);
}
```

```ts title="Custom Time Window"
import { borrowApyHistory } from "@aave/client/actions";
import { TimeWindow } from "@aave/client";
import { client } from "./client";

const result = await borrowApyHistory(client, {
  reserve: reserve.id,
  window: TimeWindow.LastWeek,
});
```

```ts title="Protocol Rates Only"
import { borrowApyHistory } from "@aave/client/actions";
import { client } from "./client";

const result = await borrowApyHistory(client, {
  reserve: reserve.id,
  includeRewards: false, // exclude Merkl rewards from the rates
});
```

</tab>
<tab label="GraphQL">

Use the `borrowApyHistory` query to fetch historical borrow APY data.

```graphql
query ($request: BorrowApyHistoryRequest!) {
  borrowApyHistory(request: $request) {
    date
    avgRate {
      onChainValue
      decimals
      value
      normalized
    }
  }
}
```

```json title="By Reserve ID"
{
  "request": {
    "reserve": "SGVsbG8h",
    "window": "LAST_DAY"
  }
}
```

```json title="Custom Time Window"
{
  "request": {
    "reserve": "SGVsbG8h",
    "window": "LAST_WEEK"
  }
}
```

```json title="Protocol Rates Only"
{
  "request": {
    "reserve": "SGVsbG8h",
    "includeRewards": false
  }
}
```

</tab>
</tabgroup>
## Supply APY History

Fetch historical supply APY data for a specific reserve. By default, Merkl rewards are included in the returned rates; pass `includeRewards: false` for protocol base rates only.

<tabgroup>
<tab label="React">

Use the `useSupplyApyHistory` hook to fetch supply APY history over time.

```tsx title="Loading State"
import { type SupplyApyHistoryRequest, useSupplyApyHistory } from "@aave/react";

function SupplyApy({ request }: { request: SupplyApyHistoryRequest }) {
  const { data, loading, error } = useSupplyApyHistory(request);

  if (loading) return <div>Loading…</div>;

  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {data.map((sample) => (
        <div key={sample.date.toString()}>
          <p>
            <small>{sample.date.toLocaleDateString()}</small>
            {sample.avgRate.normalized.toFixed(2)}%
          </p>
        </div>
      ))}
    </div>
  );
}
```

```tsx title="React Suspense"
import { type SupplyApyHistoryRequest, useSupplyApyHistory } from "@aave/react";

function SupplyApy({ request }: { request: SupplyApyHistoryRequest }) {
  const { data } = useSupplyApyHistory({
    ...request,
    suspense: true,
  });

  return (
    <div>
      {data.map((sample) => (
        <div key={sample.date.toString()}>
          <p>
            <small>{sample.date.toLocaleDateString()}</small>
            {sample.avgRate.normalized.toFixed(2)}%
          </p>
        </div>
      ))}
    </div>
  );
}
```

See below for examples of `SupplyApyHistoryRequest` objects.

```tsx title="By Reserve ID"
import { TimeWindow } from "@aave/react";

const request: SupplyApyHistoryRequest = {
  reserve: reserve.id,
  window: TimeWindow.LastDay,
};
```

```tsx title="Custom Time Window"
import { TimeWindow } from "@aave/react";

const request: SupplyApyHistoryRequest = {
  reserve: reserve.id,
  window: TimeWindow.LastWeek,
};
```

```tsx title="Protocol Rates Only"
const request: SupplyApyHistoryRequest = {
  reserve: reserve.id,
  includeRewards: false, // exclude Merkl rewards from the rates
};
```

</tab>
<tab label="TypeScript">

Use the `supplyApyHistory` action to fetch historical supply APY data.

```ts title="By Reserve ID"
import { supplyApyHistory } from "@aave/client/actions";
import { TimeWindow } from "@aave/client";
import { client } from "./client";

const result = await supplyApyHistory(client, {
  reserve: reserve.id,
  window: TimeWindow.LastDay,
});

if (result.isOk()) {
  console.log(result.value); // ApySample[]
} else {
  console.error(result.error);
}
```

```ts title="Custom Time Window"
import { supplyApyHistory } from "@aave/client/actions";
import { TimeWindow } from "@aave/client";
import { client } from "./client";

const result = await supplyApyHistory(client, {
  reserve: reserve.id,
  window: TimeWindow.LastWeek,
});
```

```ts title="Protocol Rates Only"
import { supplyApyHistory } from "@aave/client/actions";
import { client } from "./client";

const result = await supplyApyHistory(client, {
  reserve: reserve.id,
  includeRewards: false, // exclude Merkl rewards from the rates
});
```

</tab>
<tab label="GraphQL">

Use the `supplyApyHistory` query to fetch historical supply APY data.

```graphql
query ($request: SupplyApyHistoryRequest!) {
  supplyApyHistory(request: $request) {
    date
    avgRate {
      onChainValue
      decimals
      value
      normalized
    }
  }
}
```

```json title="By Reserve ID"
{
  "request": {
    "reserve": "SGVsbG8h",
    "window": "LAST_DAY"
  }
}
```

```json title="Custom Time Window"
{
  "request": {
    "reserve": "SGVsbG8h",
    "window": "LAST_WEEK"
  }
}
```

```json title="Protocol Rates Only"
{
  "request": {
    "reserve": "SGVsbG8h",
    "includeRewards": false
  }
}
```

</tab>
</tabgroup>
## Reserve Holders

Fetch a paginated list of the top holders for a specific reserve, filtered by suppliers or borrowers.

<tabgroup>
<tab label="React">

Use the `useReserveHolders` hook to fetch reserve holders for a specific reserve.

```tsx title="Loading State"
import { ReserveHoldersFilter, useReserveHolders } from "@aave/react";

function ReserveHoldersList({ reserveId }: { reserveId: string }) {
  const { data, loading, error } = useReserveHolders({
    reserve: { reserveId },
    filter: ReserveHoldersFilter.Supplied,
  });

  if (loading) return <div>Loading…</div>;

  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {data.items.map((holder) => (
        <div key={holder.address}>
          {holder.address}
          <p>
            {holder.amount.amount.value.toFixed(4)} 
            {holder.amount.token.info.symbol}
          </p>
          {holder.weight.normalized.toFixed(4)}%
        </div>
      ))}
    </div>
  );
}
```

```tsx title="React Suspense"
import { ReserveHoldersFilter, useReserveHolders } from "@aave/react";

function ReserveHoldersList({ reserveId }: { reserveId: string }) {
  const { data } = useReserveHolders({
    reserve: { reserveId },
    filter: ReserveHoldersFilter.Supplied,
    suspense: true,
  });

  return (
    <div>
      {data.items.map((holder) => (
        <div key={holder.address}>
          {holder.address}
          <p>
            {holder.amount.amount.value.toFixed(4)} 
            {holder.amount.token.info.symbol}
          </p>
        </div>
      ))}
    </div>
  );
}
```

Filter by `ReserveHoldersFilter.Supplied` (default) or `ReserveHoldersFilter.Borrowed`.

```tsx title="Supplied Holders"
import { ReserveHoldersFilter, useReserveHolders } from "@aave/react";

const { data } = useReserveHolders({
  reserve: { reserveId: reserve.id },
  filter: ReserveHoldersFilter.Supplied,
});
```

```tsx title="Borrowed Holders"
import { ReserveHoldersFilter, useReserveHolders } from "@aave/react";

const { data } = useReserveHolders({
  reserve: { reserveId: reserve.id },
  filter: ReserveHoldersFilter.Borrowed,
});
```

</tab>
<tab label="TypeScript">

Use the `reserveHolders` action to fetch top holders for a reserve.

```ts title="Supplied Holders"
import { ReserveHoldersFilter, reserveId } from "@aave/client";
import { reserveHolders } from "@aave/client/actions";
import { client } from "./client";

const result = await reserveHolders(client, {
  reserve: { reserveId: reserveId("SGVsbG8h") },
  filter: ReserveHoldersFilter.Supplied,
});

if (result.isOk()) {
  console.log(result.value.items); // ReserveHolder[]
} else {
  console.error(result.error);
}
```

```ts title="Borrowed Holders"
import { ReserveHoldersFilter, reserveId } from "@aave/client";
import { reserveHolders } from "@aave/client/actions";
import { client } from "./client";

const result = await reserveHolders(client, {
  reserve: { reserveId: reserveId("SGVsbG8h") },
  filter: ReserveHoldersFilter.Borrowed,
});
```

</tab>
<tab label="GraphQL">

Use the `reserveHolders` query to fetch paginated holders for a reserve.

```graphql
query ($request: PaginatedReserveHoldersRequest!) {
  reserveHolders(request: $request) {
    items {
      address
      amount {
        ...Erc20Amount
      }
      weight {
        ...PercentNumber
      }
    }
    pageInfo {
      next
      prev
    }
  }
}
```

The following variables can be provided to the query.

```json title="Supplied Holders"
{
  "request": {
    "reserve": { "reserveId": "SGVsbG8h" },
    "filter": "SUPPLIED"
  }
}
```

```json title="Borrowed Holders"
{
  "request": {
    "reserve": { "reserveId": "SGVsbG8h" },
    "filter": "BORROWED"
  }
}
```

</tab>
</tabgroup>

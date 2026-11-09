# Liquidity Hubs

Learn how to discover and access liquidity hubs in Aave v4.

---

## Hub Structure

Hub data provide an aggregate view of a liquidity hub, including:

- Identification: id, name, chain, address
- Aggregated details: totalSupplied, totalBorrowed
- System caps: totalSupplyCap, totalBorrowCap

<tabgroup>
<tab label="TypeScript">

The following TypeScript interfaces illustrate the core Hub type:

```ts title="Hub"
interface Hub {
  __typename: "Hub";
  id: HubId;
  address: EvmAddress;
  chain: Chain;
  name: string;
  summary: HubSummary;
}
```

```ts title="HubSummary"
interface HubSummary {
  __typename: "HubSummary";
  totalBorrowed: ExchangeAmountWithChange;
  totalBorrowCap: ExchangeAmount;
  totalSupplied: ExchangeAmountWithChange;
  totalSupplyCap: ExchangeAmount;
  utilizationRate: PercentNumber;
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

```ts title="ExchangeAmountWithChange"
interface ExchangeAmountWithChange {
  __typename: "ExchangeAmountWithChange";
  current: ExchangeAmount;
  change: PercentNumber;
}
```

```ts title="PercentNumber"
interface PercentNumber {
  __typename: "PercentNumber";
  onChainValue: bigint;
  decimals: number;
  value: BigDecimal;
  normalized: BigDecimal;
}
```

```ts title="Chain"
interface Chain {
  __typename: "Chain";
  chainId: ChainId;
  name: string;
  icon: string;
  rpcUrl: string;
  explorerUrl: string;
  isTestnet: boolean;
  nativeWrappedToken: EvmAddress;
  nativeInfo: TokenInfo;
  nativeGateway: EvmAddress;
  signatureGateway: EvmAddress;
}

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

</tab>
<tab label="GraphQL">

The following GraphQL fragments illustrate the core Hub type:

```graphql title="Hub"
fragment Hub on Hub {
  __typename
  id
  address
  chain {
    ...Chain
  }
  name
  summary {
    ...HubSummary
  }
}
```

```graphql title="HubSummary"
fragment HubSummary on HubSummary {
  __typename
  totalBorrowed {
    ...ExchangeAmountWithChange
  }
  totalBorrowCap {
    ...ExchangeAmount
  }
  totalSupplied {
    ...ExchangeAmountWithChange
  }
  totalSupplyCap {
    ...ExchangeAmount
  }
  utilizationRate {
    ...PercentNumber
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

```graphql title="ExchangeAmountWithChange"
fragment ExchangeAmountWithChange on ExchangeAmountWithChange {
  __typename
  current {
    ...ExchangeAmount
  }
  change {
    ...PercentNumber
  }
}
```

```graphql title="PercentNumber"
fragment PercentNumber on PercentNumber {
  __typename
  onChainValue
  decimals
  value
  normalized
}
```

```graphql title="Chain"
fragment Chain on Chain {
  __typename
  chainId
  name
  icon
  rpcUrl
  explorerUrl
  isTestnet
  nativeWrappedToken
  nativeInfo {
    ...TokenInfo
  }
  nativeGateway
  signatureGateway
}

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

</tab>
<tab label="Solidity">

At the smart contract level, hubs are represented by deployed contracts implementing the `IHub` interface, managed by the governance.

Unlike the SDK, there is no single onchain struct containing hub metadata (name, address) nor aggregate summary information (e.g., total liquidity) as these are maintained offchain.

Hubs manage two key relationships: **Assets** and **Spokes**. For more information about hub assets, see the [Hub Assets](#hub-assets) section below. For details on spoke-hub relationships and spoke data structures, see the [Spoke Data Structure](/aave-v4/liquidity/spokes#spoke-data-structure) section.

```solidity title="IHub Interface"
interface IHub {
  function getAssetCount() external view returns (uint256);
  function getAsset(uint256 assetId) external view returns (Asset memory);
  function getAssetConfig(uint256 assetId) external view returns (AssetConfig memory);
  function getSpokeCount(uint256 assetId) external view returns (uint256);
  function getSpokeAddress(uint256 assetId, uint256 index) external view returns (address);
  function getSpoke(uint256 assetId, address spoke) external view returns (SpokeData memory);
  function getSpokeConfig(uint256 assetId, address spoke) external view returns (SpokeConfig memory);
  function isSpokeListed(uint256 assetId, address spoke) external view returns (bool);
}
```

</tab>
</tabgroup>
## Listing Available Hubs

Discover all available Aave Liquidity Hubs across supported networks.

<tabgroup>
<tab label="React">

Use the `useHubs` hook to fetch a list of liquidity hubs.

```tsx title="Loading State"
import { type HubsRequest, useHubs } from "@aave/react";

function HubsList({ request }: { request: HubsRequest }) {
  const { data, loading, error } = useHubs(request);

  if (loading) return <div>Loading…</div>;

  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {data.map((hub) => (
        <div key={hub.id}>
          <h3>{hub.name}</h3>
          Chain: {hub.chain.name}
        </div>
      ))}
    </div>
  );
}
```

```tsx title="React Suspense"
import { type HubsRequest, useHubs } from "@aave/react";

function HubsList({ request }: { request: HubsRequest }) {
  const { data } = useHubs({
    ...request,
    suspense: true,
  });

  return (
    <div>
      {data.map((hub) => (
        <div key={hub.id}>
          <h3>{hub.name}</h3>
          Chain: {hub.chain.name}
        </div>
      ))}
    </div>
  );
}
```

```tsx title="Imperative Read"
import { type HubsRequest, useHubsAction } from "@aave/react";

// …

const [fetch, { called, data, error, loading }] = useHubsAction();

const handler = async (request: HubsRequest) => {
  const result = await fetch(request);

  if (result.isOk()) {
    console.log(result.value); // Hub[]
  } else {
    console.error(result.error);
  }
};
```

> [!WARNING]
> The `useHubsAction` hook does **not** watch for updates. Use it when you need
> on-demand, fresh data (e.g., in an event handler).

See below for examples of `HubsRequest` objects.

```tsx title="By Chains"
import { chainId } from "@aave/react";

const request: HubsRequest = {
  query: {
    chainIds: [chainId(1)],
  },
};
```

```tsx title="By Tokens"
import { evmAddress, chainId } from "@aave/react";

const request: HubsRequest = {
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
```

```tsx title="By Asset IDs"
import { assetId } from "@aave/react";

const request: HubsRequest = {
  query: {
    assetIds: [usdc.id, gho.id],
  },
};
```

And you can specify a different currency for the data.

```tsx title="Custom Currency"
import { chainId, Currency } from "@aave/react";

const { data, error, loading } = useHubs({
  query: {
    // your query criteria
  },
  currency: Currency.Eur,
});
```

</tab>

<tab label="TypeScript">

Use the `hubs` action to fetch a list of liquidity hubs.

```ts title="By Chains"
import { chainId } from "@aave/client";
import { hubs } from "@aave/client/actions";

import { client } from "./client";

const result = await hubs(client, {
  query: {
    chainIds: [chainId(1)],
  },
});

if (result.isErr()) {
  console.error(result.error);
} else {
  // result.value: Hub[]
  console.log(result.value);
}
```

```ts title="By Tokens"
import { chainId, evmAddress } from "@aave/client";
import { hubs } from "@aave/client/actions";

import { client } from "./client";

const result = await hubs(client, {
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
```

```ts title="By Asset IDs"
import { assetId } from "@aave/client";
import { hubs } from "@aave/client/actions";

import { client } from "./client";

const result = await hubs(client, {
  query: {
    assetIds: [usdc.id, gho.id],
  },
});
```

```ts title="Custom Currency"
import { chainId, Currency } from "@aave/client";
import { hubs } from "@aave/client/actions";

import { client } from "./client";

const result = await hubs(client, {
  query: {
    chainIds: [chainId(1)],
  },
  currency: Currency.Eur,
});
```

```ts title="client.ts"
import { AaveClient } from "@aave/client";

export const client = AaveClient.create();
```

</tab>

<tab label="GraphQL">

Use the `hubs` query to fetch available liquidity hubs across different chains.

```graphql title="Query"
query ($request: HubsRequest!) {
  hubs(request: $request) {
    id
    address
    chain {
      ...Chain
    }
    name
    summary {
      ...HubSummary
    }
  }
}
```

Below is some examples of a `HubsRequest` object.

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
```

```json title="By Asset IDs"
{
  "request": {
    "query": {
      "assetIds": ["SGVsbG8h", "V29ybGQh"]
    }
  }
}
```

```graphql title="Custom Currency"
query ($request: HubsRequest!) {
  hubs(request: $request) {
    id
    address
    chain {
      ...Chain
    }
    name
    summary(currency: EUR) {
      ...HubSummary
    }
  }
}
```

</tab>
<tab label="Solidity">

Hubs are deployed and managed by governance. The following hubs are deployed on Ethereum mainnet:

### Deployed Hubs

| Name      | Address                                      |
| --------- | -------------------------------------------- |
| Core Hub  | `0xCca852Bc40e560adC3b1Cc58CA5b55638ce826c9` |
| Plus Hub  | `0x06002e9c4412CB7814a791eA3666D905871E536A` |
| Prime Hub | `0x943827DCA022D0F354a8a8c332dA1e5Eb9f9F931` |

Once a hub address is known, access its assets and spokes using the methods documented in the [Hub Structure](#hub-structure) section above.

</tab>
</tabgroup>
## Fetching a Single Hub

Get detailed information about a specific liquidity hub.

<tabgroup>
<tab label="React">

Use the `useHub` hook to fetch a specific hub.

```tsx title="Loading State"
import { type HubRequest, useHub } from "@aave/react";

function HubDetails({ request }: { request: HubRequest }) {
  const { data, loading, error } = useHub(request);

  if (loading) return <div>Loading…</div>;

  if (error) return <div>Error: {error.message}</div>;

  if (!data) return <div>Hub not found</div>;

  return (
    <div>
      <h2>{data.name}</h2>
      Address: {data.address}
      Chain: {data.chain.name}
    </div>
  );
}
```

```tsx title="React Suspense"
import { type HubRequest, useHub } from "@aave/react";

function HubDetails({ request }: { request: HubRequest }) {
  const { data } = useHub({
    ...request,
    suspense: true,
  });

  if (!data) return <div>Hub not found</div>;

  return (
    <div>
      <h2>{data.name}</h2>
      Address: {data.address}
      Chain: {data.chain.name}
    </div>
  );
}
```

See below for examples of `HubRequest` objects.

```tsx title="By Hub ID"
import { hubId } from "@aave/react";

const request: HubRequest = {
  query: {
    hubId: hubId(params.id), // HubId - typically from URL params
  },
};
```

```tsx title="By Hub Details"
import { chainId, evmAddress } from "@aave/react";

const request: HubRequest = {
  query: {
    hubInput: {
      address: evmAddress("0x123…"),
      chainId: chainId(1),
    },
  },
};
```

Finally, you can specify a different time window or currency for the data.

```tsx title="Custom Time Window"
import { TimeWindow } from "@aave/react";

const { data, loading, error } = useHub({
  query: {
    // your query criteria
  },
  timeWindow: TimeWindow.LastWeek,
});
```

```tsx title="Custom Currency"
import { Currency } from "@aave/react";

const { data, loading, error } = useHub({
  query: {
    // your query criteria
  },
  currency: Currency.Eur,
});
```

</tab>

<tab label="TypeScript">

Use the `hub` action to fetch a specific hub.

```ts title="By Hub ID"
import { hub } from "@aave/client/actions";

import { client } from "./client";

// const hubId: HubId = "SGVsbG8h";

const result = await hub(client, {
  query: {
    hubId,
  },
});

if (result.isOk()) {
  console.log(result.value); // Hub | null - null if not found
} else {
  console.error(result.error);
}
```

```ts title="By Hub Details"
import { chainId, evmAddress } from "@aave/client";
import { hub } from "@aave/client/actions";

import { client } from "./client";

const result = await hub(client, {
  query: {
    hubInput: {
      address: evmAddress("0x123…"),
      chainId: chainId(1),
    },
  },
});
```

```ts title="Custom Currency"
import { type HubId, Currency } from "@aave/client";
import { hub } from "@aave/client/actions";

import { client } from "./client";

const result = await hub(client, {
  query: {
    // your query criteria
  },
  currency: Currency.Eur,
});
```

```ts title="client.ts"
import { AaveClient } from "@aave/client";

export const client = AaveClient.create();
```

</tab>

<tab label="GraphQL">

Use the `hub` query to fetch a specific hub by ID or address and chain.

```graphql title="By Hub ID"
query {
  hub(request: { query: { hubId: "SGVsbG8h" } }) {
    id
    address
    chain {
      ...Chain
    }
    name
    summary {
      ...HubSummary
    }
  }
}
```

```graphql title="By Hub Details"
query {
  hub(request: { query: { hubInput: { address: "0x123…", chainId: 1 } } }) {
    id
    address
    chain {
      ...Chain
    }
    name
    summary {
      ...HubSummary
    }
  }
}
```

```graphql title="Custom Currency"
query {
  hub(request: { query: { hubId: "SGVsbG8h" } }) {
    id
    address
    chain {
      ...Chain
    }
    name
    summary(currency: EUR) {
      ...HubSummary
    }
  }
}
```

</tab>
</tabgroup>
## Hub Summary History

Fetch historical summary data for a specific hub over a specified time window.

<tabgroup>
<tab label="React">

Use the `useHubSummaryHistory` hook to fetch historical summary data for a hub.

```tsx title="Loading State"
import {
  type HubSummaryHistoryRequest,
  useHubSummaryHistory,
} from "@aave/react";

function HubHistory({ request }: { request: HubSummaryHistoryRequest }) {
  const { data, loading, error } = useHubSummaryHistory(request);

  if (loading) return <div>Loading…</div>;

  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h2>Hub History</h2>
      {data.map((item) => (
        <div key={item.date.toString()}>
          Date: {item.date.toLocaleDateString()}
          <p>
            Deposits: {item.deposits.symbol}
            {item.deposits.value.toDisplayString(2)}
          </p>
          <p>
            Borrows: {item.borrows.symbol}
            {item.borrows.value.toDisplayString(2)}
          </p>
          Utilization: {item.utilizationRate.normalized.toFixed(2)}%
        </div>
      ))}
    </div>
  );
}
```

```tsx title="React Suspense"
import {
  type HubSummaryHistoryRequest,
  useHubSummaryHistory,
} from "@aave/react";

function HubHistory({ request }: { request: HubSummaryHistoryRequest }) {
  const { data } = useHubSummaryHistory({
    ...request,
    suspense: true,
  });

  return (
    <div>
      <h2>Hub History</h2>
      {data.map((item) => (
        <div key={item.date.toString()}>
          Date: {item.date.toLocaleDateString()}
          <p>
            Deposits: {item.deposits.symbol}
            {item.deposits.value.toDisplayString(2)}
          </p>
          <p>
            Borrows: {item.borrows.symbol}
            {item.borrows.value.toDisplayString(2)}
          </p>
        </div>
      ))}
    </div>
  );
}
```

See below for examples of `HubSummaryHistoryRequest` objects.

```tsx title="By Hub ID"
import { hubId, TimeWindow } from "@aave/react";

const request: HubSummaryHistoryRequest = {
  query: { hubId: hubId(params.id) },
  window: TimeWindow.LastWeek,
};
```

```tsx title="By Hub Details"
import { chainId, evmAddress, TimeWindow } from "@aave/react";

const request: HubSummaryHistoryRequest = {
  query: {
    hubInput: {
      address: evmAddress("0x123…"),
      chainId: chainId(1),
    },
  },
  window: TimeWindow.LastWeek,
};
```

Specify the time window for the historical data.

```tsx title="Last Day"
import { hubId, TimeWindow } from "@aave/react";

const request: HubSummaryHistoryRequest = {
  query: { hubId: hubId(params.id) },
  window: TimeWindow.LastDay,
};
```

```tsx title="Last Week"
import { hubId, TimeWindow } from "@aave/react";

const request: HubSummaryHistoryRequest = {
  query: { hubId: hubId(params.id) },
  window: TimeWindow.LastWeek,
};
```

```tsx title="Last Month"
import { hubId, TimeWindow } from "@aave/react";

const request: HubSummaryHistoryRequest = {
  query: { hubId: hubId(params.id) },
  window: TimeWindow.LastMonth,
};
```

And you can specify a different currency for the data.

```tsx title="Custom Currency"
import { Currency, hubId, TimeWindow } from "@aave/react";

const { data, error, loading } = useHubSummaryHistory({
  query: { hubId: hubId(params.id) },
  window: TimeWindow.LastWeek,
  currency: Currency.Eur,
});
```

</tab>
<tab label="TypeScript">

Use the `hubSummaryHistory` action to fetch historical summary data for a hub.

```ts title="By Hub ID"
import { hubSummaryHistory } from "@aave/client/actions";
import { hubId, TimeWindow } from "@aave/client";
import { client } from "./client";

const result = await hubSummaryHistory(client, {
  query: { hubId: hubId(id) },
  window: TimeWindow.LastWeek,
});

if (result.isOk()) {
  console.log(result.value); // HubSummarySample[]
} else {
  console.error(result.error);
}
```

```ts title="By Hub Details"
import { hubSummaryHistory } from "@aave/client/actions";
import { chainId, evmAddress, TimeWindow } from "@aave/client";
import { client } from "./client";

const result = await hubSummaryHistory(client, {
  query: {
    hubInput: {
      address: evmAddress("0x123…"),
      chainId: chainId(1),
    },
  },
  window: TimeWindow.LastWeek,
});
```

Specify the time window for the historical data.

```ts title="Last Day"
import { hubSummaryHistory } from "@aave/client/actions";
import { hubId, TimeWindow } from "@aave/client";
import { client } from "./client";

const result = await hubSummaryHistory(client, {
  query: { hubId: hubId(id) },
  window: TimeWindow.LastDay,
});
```

```ts title="Last Week"
import { hubSummaryHistory } from "@aave/client/actions";
import { hubId, TimeWindow } from "@aave/client";
import { client } from "./client";

const result = await hubSummaryHistory(client, {
  query: { hubId: hubId(id) },
  window: TimeWindow.LastWeek,
});
```

```ts title="Last Month"
import { hubSummaryHistory } from "@aave/client/actions";
import { hubId, TimeWindow } from "@aave/client";
import { client } from "./client";

const result = await hubSummaryHistory(client, {
  query: { hubId: hubId(id) },
  window: TimeWindow.LastMonth,
});
```

And you can specify a different currency for the data.

```ts title="Custom Currency"
import { hubSummaryHistory } from "@aave/client/actions";
import { hubId, TimeWindow, Currency } from "@aave/client";
import { client } from "./client";

const result = await hubSummaryHistory(client, {
  query: { hubId: hubId(id) },
  window: TimeWindow.LastWeek,
  currency: Currency.Eur,
});
```

</tab>
<tab label="GraphQL">

Use the `hubSummaryHistory` query to fetch historical summary data for a hub.

```graphql title="Query"
query ($request: HubSummaryHistoryRequest!) {
  hubSummaryHistory(request: $request) {
    date
    deposits {
      ...ExchangeAmount
    }
    borrows {
      ...ExchangeAmount
    }
    availableLiquidity {
      ...ExchangeAmount
    }
    utilizationRate {
      ...PercentNumber
    }
  }
}
```

Use the `query` and `window` fields to specify the hub and time period.

```json title="By Hub ID"
{
  "request": {
    "query": { "hubId": "SGVsbG8h" },
    "window": "LAST_WEEK"
  }
}
```

```json title="By Hub Details"
{
  "request": {
    "query": {
      "hubInput": { "address": "0x123…", "chainId": 1 }
    },
    "window": "LAST_WEEK"
  }
}
```

Specify the time window for the historical data.

```json title="Last Day"
{
  "request": {
    "query": { "hubId": "SGVsbG8h" },
    "window": "LAST_DAY"
  }
}
```

```json title="Last Week"
{
  "request": {
    "query": { "hubId": "SGVsbG8h" },
    "window": "LAST_WEEK"
  }
}
```

```json title="Last Month"
{
  "request": {
    "query": { "hubId": "SGVsbG8h" },
    "window": "LAST_MONTH"
  }
}
```

And you can specify a different currency for the data.

```json title="Custom Currency"
{
  "request": {
    "query": { "hubId": "SGVsbG8h" },
    "window": "LAST_WEEK",
    "currency": "EUR"
  }
}
```

</tab>
</tabgroup>
---

## Hub Spoke Configs

Fetch per-asset configuration for a specific `(hub, spoke)` pair, including supply caps, borrow caps, operational status, and the risk premium threshold.

<tabgroup>
<tab label="TypeScript">

```ts title="HubSpokeConfig"
interface HubSpokeConfig {
  __typename: "HubSpokeConfig";
  hub: Hub;
  spoke: Spoke;
  asset: HubAsset;
  supplyCap: Erc20Amount;
  borrowCap: Erc20Amount;
  active: boolean;
  halted: boolean;
  riskPremiumThreshold: PercentNumber;
}
```

Use the `hubSpokeConfigs` action to fetch all asset configs shared by a hub and spoke.

```ts title="Hub Spoke Configs"
import { hubSpokeConfigs } from "@aave/client/actions";

const result = await hubSpokeConfigs(client, { hubId, spokeId });

if (result.isOk()) {
  console.log(result.value); // HubSpokeConfig[]
} else {
  console.error(result.error);
}
```

</tab>
<tab label="React">

Use the `useHubSpokeConfigs` hook to fetch all asset configs shared by a hub and spoke.

```tsx title="Loading State"
import { useHubSpokeConfigs } from "@aave/react";

const { data, loading, error } = useHubSpokeConfigs({ hubId, spokeId });
```

```tsx title="React Suspense"
const { data } = useHubSpokeConfigs({
  suspense: true,
  hubId,
  spokeId,
});
```

</tab>
<tab label="GraphQL">

Use the `hubSpokeConfigs` query to inspect all shared asset routes between a hub and a spoke.

```graphql title="HubSpokeConfigs"
query {
  hubSpokeConfigs(request: { hubId: "SGVsbG8h", spokeId: "SGVsbG8h" }) {
    hub {
      name
    }
    spoke {
      name
    }
    asset {
      underlying {
        symbol
      }
    }
    supplyCap {
      value
    }
    borrowCap {
      value
    }
    active
    halted
    riskPremiumThreshold {
      value
    }
  }
}
```

</tab>
</tabgroup>
---

## Hub Assets

Hub assets are the **ERC-20 tokens** held by a given hub.

### Hub Asset Structure

Hub Asset data provides detailed information about each asset available on a liquidity hub, including:

- Identification: id, onchainAssetId, underlying token details
- Hub reference: the hub where this asset is available
- Summary metrics: supplied/borrowed amounts, APY rates, utilization
- Reserve coverage: total connected reserves and active reserves
- Settings: fee receiver, liquidity fees, strategies
- User state: user's balance (when user is specified in request)

<tabgroup>
<tab label="TypeScript">

```ts title="HubAsset"
interface HubAsset {
  __typename: "HubAsset";
  id: HubAssetId;
  onchainAssetId: OnChainHubAssetId;
  hub: Hub;
  underlying: Erc20Token;
  summary: HubAssetSummary;
  settings: HubAssetSettings;
  userState: HubAssetUserState | null;
}
```

```ts title="HubAssetSummary"
interface HubAssetSummary {
  __typename: "HubAssetSummary";
  supplied: Erc20Amount;
  borrowed: Erc20Amount;
  availableLiquidity: Erc20Amount;
  supplyApy: PercentNumber;
  borrowApy: PercentNumber;
  netApy: PercentNumber;
  utilizationRate: PercentNumber;
  reservesCount: number;
  activeReservesCount: number;
}
```

```ts title="HubAssetSettings"
interface HubAssetSettings {
  __typename: "HubAssetSettings";
  feeReceiver: EvmAddress;
  liquidityFee: PercentNumber;
  irStrategy: EvmAddress;
  reinvestmentController: EvmAddress | null;
  optimalUtilizationRate: PercentNumber;
  baseBorrowRate: PercentNumber;
  slopeBelowOptimal: PercentNumber;
  slopeAboveOptimal: PercentNumber;
}
```

```ts title="HubAssetUserState"
interface HubAssetUserState {
  __typename: "HubAssetUserState";
  balance: Erc20Amount;
}
```

</tab>
<tab label="GraphQL">

```graphql title="HubAsset"
fragment HubAsset on HubAsset {
  __typename
  id
  onchainAssetId
  hub {
    ...Hub
  }
  underlying {
    ...Erc20Token
  }
  summary {
    ...HubAssetSummary
  }
  settings {
    ...HubAssetSettings
  }
  userState {
    ...HubAssetUserState
  }
}
```

```graphql title="HubAssetSummary"
fragment HubAssetSummary on HubAssetSummary {
  __typename
  supplied {
    ...Erc20Amount
  }
  borrowed {
    ...Erc20Amount
  }
  availableLiquidity {
    ...Erc20Amount
  }
  supplyApy {
    ...PercentNumber
  }
  borrowApy {
    ...PercentNumber
  }
  netApy {
    ...PercentNumber
  }
  utilizationRate {
    ...PercentNumber
  }
  reservesCount
  activeReservesCount
}
```

```graphql title="HubAssetSettings"
fragment HubAssetSettings on HubAssetSettings {
  __typename
  feeReceiver
  liquidityFee {
    ...PercentNumber
  }
  irStrategy
  reinvestmentController
  optimalUtilizationRate {
    ...PercentNumber
  }
  baseBorrowRate {
    ...PercentNumber
  }
  slopeBelowOptimal {
    ...PercentNumber
  }
  slopeAboveOptimal {
    ...PercentNumber
  }
}
```

```graphql title="HubAssetUserState"
fragment HubAssetUserState on HubAssetUserState {
  __typename
  balance {
    ...Erc20Amount
  }
}
```

</tab>
<tab label="Solidity">

```solidity title="Asset Struct"
struct Asset {
  uint120 liquidity;
  uint120 realizedFees;
  uint8 decimals;
  uint120 addedShares;
  uint120 swept;
  int200 premiumOffsetRay;
  uint120 drawnShares;
  uint120 premiumShares;
  uint16 liquidityFee;
  uint120 drawnIndex;
  uint96 drawnRate;
  uint40 lastUpdateTimestamp;
  address underlying;
  address irStrategy;
  address reinvestmentController;
  address feeReceiver;
  uint200 deficitRay;
}
```

```solidity title="AssetConfig Struct"
struct AssetConfig {
  address feeReceiver;
  uint16 liquidityFee;
  address irStrategy;
  address reinvestmentController;
}
```

</tab>
</tabgroup>
### Listing Hub Assets

Discover all available assets on an hub, including their liquidity metrics, APY rates, and user-specific data.

<tabgroup>
<tab label="React">

Use the `useHubAssets` hook to fetch assets for a specific hub.

```tsx title="Loading State"
import { type HubAssetsRequest, useHubAssets } from "@aave/react";

function HubAssetsList({ request }: { request: HubAssetsRequest }) {
  const { data, loading, error } = useHubAssets(request);

  if (loading) return <div>Loading…</div>;

  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {data.map((asset) => (
        <div key={asset.id}>
          <h3>{asset.underlying.info.name}</h3>
          Hub: {asset.hub.name}
        </div>
      ))}
    </div>
  );
}
```

```tsx title="React Suspense"
import { type HubAssetsRequest, useHubAssets } from "@aave/react";

function HubAssetsList({ request }: { request: HubAssetsRequest }) {
  const { data } = useHubAssets({
    ...request,
    suspense: true,
  });

  return (
    <div>
      {data.map((asset) => (
        <div key={asset.id}>
          <h3>{asset.underlying.info.name}</h3>
          Hub: {asset.hub.name}
        </div>
      ))}
    </div>
  );
}
```

See below for examples of `HubAssetsRequest` objects.

```tsx title="By Hub ID"
const request: HubAssetsRequest = {
  query: {
    hubId: hub.id, // hub.id: HubId from component props or previous query
  },
};
```

```tsx title="By Hub Details"
import { chainId, evmAddress } from "@aave/react";

const request: HubAssetsRequest = {
  query: {
    hubInput: {
      address: evmAddress("0x123…"),
      chainId: chainId(1),
    },
  },
};
```

And you can add a user address to return `HubAssetUserState` for each asset.

```tsx title="Hub Asset User State"
import { evmAddress } from "@aave/react";

const equest: HubAssetsRequest = {
  query: {
    // your query criteria
  },
  user: evmAddress("0x456…"),
};
```

Finally, you can specify a different currency for the data.

```tsx title="Custom Currency"
import { Currency } from "@aave/react";

// …

const { data, loading, error } = useHubAssets({
  query: {
    // your query criteria
  },
  currency: Currency.Eur,
});
```

</tab>
<tab label="TypeScript">

Use the `hubAssets` action to fetch assets for a specific hub.

```ts title="By Hub ID"
import { type HubId } from "@aave/client";
import { hubAssets } from "@aave/client/actions";

import { client } from "./client";

// const hubId: HubId = "SGVsbG8h"; // from a previous query

const result = await hubAssets(client, {
  query: {
    hubId,
  },
});

if (result.isOk()) {
  console.log(result.value); // HubAsset[]
} else {
  console.error(result.error);
}
```

```ts title="By Hub Details"
import { chainId, evmAddress } from "@aave/client";
import { hubAssets } from "@aave/client/actions";

import { client } from "./client";

const result = await hubAssets(client, {
  query: {
    hubInput: {
      address: evmAddress("0x123…"),
      chainId: chainId(1),
    },
  },
});
```

```ts title="Custom Currency"
import { Currency } from "@aave/client";
import { hubAssets } from "@aave/client/actions";

import { client } from "./client";

const result = await hubAssets(
  client,
  {
    query: {
      // your query criteria
    },
  },
  {
    currency: Currency.Eur,
  },
);
```

```ts title="client.ts"
import { AaveClient } from "@aave/client";

export const client = AaveClient.create();
```

Add a user address to return `HubAssetUserState` for each asset.

```ts title="Hub Asset User State"
import { evmAddress } from "@aave/client";
import { hubAssets } from "@aave/client/actions";

import { client } from "./client";

const result = await hubAssets(client, {
  query: {
    // your query criteria
  },
  user: evmAddress("0x456…"),
});
```

</tab>

<tab label="GraphQL">

Use the `hubAssets` query to fetch assets for a specific hub.

```graphql title="By Hub ID"
query {
  hubAssets(request: { query: { hubId: "SGVsbG8h" } }) {
    id
    onchainAssetId
    hub {
      ...Hub
    }
    underlying {
      ...Erc20Token
    }
    summary {
      ...HubAssetSummary
    }
    settings {
      ...HubAssetSettings
    }
    userState {
      ...HubAssetUserState
    }
  }
}
```

```graphql title="By Hub Details"
query {
  hubAssets(
    request: { query: { hubInput: { address: "0x123…", chainId: 1 } } }
  ) {
    id
    onchainAssetId
    hub {
      ...Hub
    }
    underlying {
      ...Erc20Token
    }
    summary {
      ...HubAssetSummary
    }
    settings {
      ...HubAssetSettings
    }
    userState {
      ...HubAssetUserState
    }
  }
}
```

```graphql title="Custom Currency"
query {
  hubAssets(request: { query: { hubId: "SGVsbG8h" } }) {
    id
    onchainAssetId
    hub {
      ...Hub
    }
    underlying {
      ...Erc20Token
    }
    summary(currency: EUR) {
      ...HubAssetSummary
    }
  }
}
```

```graphql title="User State"
query {
  hubAssets(request: { query: { hubId: "SGVsbG8h" }, user: "0x456…" }) {
    assetId
    hub {
      ...Hub
    }
    underlying {
      ...Erc20Token
    }
    summary {
      ...HubAssetSummary
    }
    userState {
      ...HubAssetUserState
    }
  }
}
```

</tab>
<tab label="Solidity">

Assets within the hub are assigned sequential `assetId` values starting from 0. For reference, here's a complete function to retrieve all hub assets:

```solidity title="Get All Hub Assets"
import { IHub } from "aave-v4/src/hub/interfaces/IHub.sol";

function getHubAssets(
  address hubAddress
) external view returns (IHub.Asset[] memory) {
  IHub hub = IHub(hubAddress);
  uint256 assetCount = hub.getAssetCount();

  IHub.Asset[] memory assets = new IHub.Asset[](assetCount);

  for (uint256 assetId = 0; assetId < assetCount; assetId++) {
    assets[assetId] = hub.getAsset(assetId);
  }

  return assets;
}
```

</tab>
</tabgroup>
### Interest Rate Model

The interest rate model describes how supply and borrow rates change across the utilization range for a specific hub asset. Each data point includes the utilization rate, the corresponding borrow and supply rates, and the liquidity distance from the current state.

<tabgroup>
<tab label="TypeScript">

```ts title="HubAssetInterestRateModelPoint"
interface HubAssetInterestRateModelPoint {
  __typename: "HubAssetInterestRateModelPoint";
  utilizationRate: PercentNumber;
  borrowRate: PercentNumber;
  supplyRate: PercentNumber;
  liquidityDistance: Erc20Amount;
}
```

</tab>
<tab label="GraphQL">

```graphql title="HubAssetInterestRateModelPoint"
fragment HubAssetInterestRateModelPoint on HubAssetInterestRateModelPoint {
  __typename
  utilizationRate {
    ...PercentNumber
  }
  borrowRate {
    ...PercentNumber
  }
  supplyRate {
    ...PercentNumber
  }
  liquidityDistance {
    ...Erc20Amount
  }
}
```

</tab>
</tabgroup>
Fetch the full interest rate curve for a specific hub asset.

<tabgroup>
<tab label="React">

Use the `useHubAssetInterestRateModel` hook to fetch the interest rate curve for a hub asset.

```tsx title="Loading State"
import { useHubAssetInterestRateModel } from "@aave/react";

function InterestRateModel({ hubAssetId }: { hubAssetId: HubAssetId }) {
  const { data, loading, error } = useHubAssetInterestRateModel({
    query: { hubAssetId },
  });

  if (loading) return Loading…;

  if (error) return Error: {error.message};

  return (
    <div>
      {data?.map((point, i) => (
        <div key={i}>
          <span>Utilization: {point.utilizationRate.value}</span>
          <span>Borrow Rate: {point.borrowRate.value}</span>
          <span>Supply Rate: {point.supplyRate.value}</span>
        </div>
      ))}
    </div>
  );
}
```

```tsx title="React Suspense"
import { useHubAssetInterestRateModel } from "@aave/react";

function InterestRateModel({ hubAssetId }: { hubAssetId: HubAssetId }) {
  const { data } = useHubAssetInterestRateModel({
    suspense: true,
    query: { hubAssetId },
  });

  return (
    <div>
      {data.map((point, i) => (
        <div key={i}>
          <span>Utilization: {point.utilizationRate.value}</span>
          <span>Borrow Rate: {point.borrowRate.value}</span>
          <span>Supply Rate: {point.supplyRate.value}</span>
        </div>
      ))}
    </div>
  );
}
```

</tab>
<tab label="TypeScript">

Use the `hubAssetInterestRateModel` action to fetch the interest rate curve.

```ts title="By Hub Asset ID"
import { type HubAssetId } from "@aave/client";
import { hubAssetInterestRateModel } from "@aave/client/actions";

import { client } from "./client";

// const hubAssetId: HubAssetId = "…"; // from a previous query

const result = await hubAssetInterestRateModel(client, {
  query: { hubAssetId },
});

if (result.isOk()) {
  for (const point of result.value) {
    console.log(
      point.utilizationRate.value,
      point.borrowRate.value,
      point.supplyRate.value,
    );
  }
} else {
  console.error(result.error);
}
```

```ts title="client.ts"
import { AaveClient } from "@aave/client";

export const client = AaveClient.create();
```

</tab>

<tab label="GraphQL">

Use the `hubAssetInterestRateModel` query to fetch the interest rate curve.

```graphql title="By Hub Asset ID"
query {
  hubAssetInterestRateModel(request: { query: { hubAssetId: "…" } }) {
    points {
      utilizationRate {
        ...PercentNumber
      }
      borrowRate {
        ...PercentNumber
      }
      supplyRate {
        ...PercentNumber
      }
      liquidityDistance {
        ...Erc20Amount
      }
    }
  }
}
```

</tab>
</tabgroup>

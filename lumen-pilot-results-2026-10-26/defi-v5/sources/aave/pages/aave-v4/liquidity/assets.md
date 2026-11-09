# Assets

Learn how to query and monitor asset information across Aave v4.

---

Assets represent ERC20 tokens that can be supplied, borrowed, or traded within the Aave protocol.

## Asset Data Structure

Asset data provides comprehensive information about a specific token in the protocol, including:

- Token identification: id, address, symbol, name, decimals
- Aggregate metrics: total supplied, total borrowed, caps, and available amounts
- Reserve coverage: total number of reserves and how many are active
- Current price: exchange valuation for a specific currency

<tabgroup>
<tab label="TypeScript">

The following TypeScript interfaces illustrate the core Asset types:

```ts title="Asset"
interface Asset {
  __typename: "Asset";
  id: AssetId;
  token: Erc20Token;
  summary: AssetSummary;
  price: ExchangeAmountWithChange;
}
```

```ts title="AssetSummary"
interface AssetSummary {
  __typename: "AssetSummary";
  totalSupplyCap: AssetAmountWithChange;
  totalSupplied: AssetAmountWithChange;
  totalSuppliable: AssetAmountWithChange;
  totalBorrowCap: AssetAmountWithChange;
  totalBorrowed: AssetAmountWithChange;
  totalBorrowable: AssetAmountWithChange;
  reservesCount: number;
  activeReservesCount: number;
  averageSupplyApy: PercentNumber;
  averageBorrowApy: PercentNumber;
}
```

```ts title="Erc20Token"
interface Erc20Token {
  __typename: "Erc20Token";
  chainId: ChainId;
  address: EvmAddress;
  name: string;
  symbol: string;
  decimals: number;
}
```

```ts title="Others"
interface DecimalNumberWithChange {
  __typename: "DecimalNumberWithChange";
  current: DecimalNumber;
  change: PercentNumber;
}

interface ExchangeAmountWithChange {
  __typename: "ExchangeAmountWithChange";
  current: ExchangeAmount;
  change: PercentNumber;
}

interface AssetAmountWithChange {
  __typename: "AssetAmountWithChange";
  amount: DecimalNumberWithChange;
  exchange: ExchangeAmountWithChange;
}
```

</tab>
<tab label="GraphQL">

The following GraphQL fragments illustrate the core Asset types:

```graphql title="Asset"
fragment Asset on Asset {
  __typename
  id
  token {
    ...Erc20Token
  }
  summary {
    ...AssetSummary
  }
  price {
    ...ExchangeAmountWithChange
  }
}
```

```graphql title="AssetSummary"
fragment AssetSummary on AssetSummary {
  __typename
  totalSupplyCap {
    ...AssetAmountWithChange
  }
  totalSupplied {
    ...AssetAmountWithChange
  }
  totalSuppliable {
    ...AssetAmountWithChange
  }
  totalBorrowCap {
    ...AssetAmountWithChange
  }
  totalBorrowed {
    ...AssetAmountWithChange
  }
  totalBorrowable {
    ...AssetAmountWithChange
  }
  reservesCount
  activeReservesCount
  averageSupplyApy: supplyApy(metric: AVERAGE) {
    ...PercentNumber
  }
  averageBorrowApy: borrowApy(metric: AVERAGE) {
    ...PercentNumber
  }
}
```

```graphql title="Erc20Token"
fragment Erc20Token on Erc20Token {
  __typename
  chainId
  address
  name
  symbol
  decimals
}
```

```graphql title="Others"
fragment AssetAmountWithChange on AssetAmountWithChange {
  __typename
  amount {
    ...DecimalNumberWithChange
  }
  exchange(currency: $currency) {
    ...ExchangeAmountWithChange
  }
}

fragment DecimalNumberWithChange on DecimalNumberWithChange {
  __typename
  current {
    ...DecimalNumber
  }
  change {
    ...PercentNumber
  }
}

fragment ExchangeAmountWithChange on ExchangeAmountWithChange {
  __typename
  current {
    ...ExchangeAmount
  }
  change(window: $timeWindow) {
    ...PercentNumber
  }
}
```

</tab>
</tabgroup>
## Fetching Asset Information

Query detailed information about a specific asset.

<tabgroup>
<tab label="React">

Use the `useAsset` hook to fetch asset information.

```tsx title="Loading State"
import { type AssetRequest, useAsset } from "@aave/react";

function AssetDetails({ request }: { request: AssetRequest }) {
  const { data, loading, error } = useAsset(request);

  if (loading) return <div>Loading…</div>;

  if (error) return <div>Error: {error.message}</div>;

  if (!data) return <div>Asset not found</div>;

  return (
    <div>
      <h3>{data.token.name}</h3>
      Chain: {data.token.chain.name}
    </div>
  );
}
```

```tsx title="React Suspense"
import { type AssetRequest, useAsset } from "@aave/react";

function AssetDetails({ request }: { request: AssetRequest }) {
  const { data } = useAsset({
    ...request,
    suspense: true,
  });

  if (!data) return <div>Asset not found</div>;

  return (
    <div>
      <h3>{data.token.name}</h3>
      Chain ID: {data.token.chainId}
    </div>
  );
}
```

See below for examples of `AssetRequest` objects.

```tsx title="By Token Details"
import { chainId, evmAddress } from "@aave/react";

const request: AssetRequest = {
  query: {
    token: {
      address: evmAddress("0x123…"),
      chainId: chainId(1),
    },
  },
};
```

```tsx title="By Asset ID"
import { assetId } from "@aave/react";

const request: AssetRequest = {
  query: {
    assetId: assetId(params.id), // AssetId - typically from URL params
  },
};
```

Finally, you can specify a different time window or currency for the data.

```ts title="Custom Time Window"
import { TimeWindow } from "@aave/react";

// …

const { data, loading, error } = useAsset({
  query: {
    // your query criteria
  },
  timeWindow: TimeWindow.LastWeek,
});
```

```tsx title="Custom Currency"
import { Currency } from "@aave/react";

// …

const { data, loading, error } = useAsset({
  query: {
    // your query criteria
  },
  currency: Currency.Eur,
});
```

</tab>
<tab label="TypeScript">

Use the `asset` action to fetch asset information.

```ts title="By Token Details"
import { chainId, evmAddress } from "@aave/client";
import { asset } from "@aave/client/actions";

import { client } from "./client";

const result = await asset(client, {
  query: {
    token: {
      address: evmAddress("0x123…"),
      chainId: chainId(1),
    },
  },
});

if (result.isOk()) {
  console.log(result.value); // Asset | null - null if not found
} else {
  console.error(result.error);
}
```

```ts title="By Asset ID"
import { type AssetId } from "@aave/client";
import { asset } from "@aave/client/actions";

import { client } from "./client";

// const assetId: AssetId = "SGVsbG8h";

const result = await asset(client, {
  query: {
    assetId,
  },
});
```

```ts title="Custom Currency"
import { Currency } from "@aave/client";
import { asset } from "@aave/client/actions";

import { client } from "./client";

const result = await asset(
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

</tab>
<tab label="GraphQL">

Use the `asset` query to fetch asset information.

```graphql title="Query"
query (
  $request: AssetRequest!
  $currency: Currency! = USD
  $timeWindow: TimeWindow! = LAST_DAY
) {
  value: asset(request: $request) {
    id
    token {
      ...Erc20Token
    }
    summary {
      ...AssetSummary
    }
    price(currency: $currency) {
      ...ExchangeAmountWithChange
    }
  }
}
```

```graphql title="AssetSummary"
fragment AssetSummary on AssetSummary {
  __typename
  totalSupplyCap {
    ...AssetAmountWithChange
  }
  totalSupplied {
    ...AssetAmountWithChange
  }
  totalSuppliable {
    ...AssetAmountWithChange
  }
  totalBorrowCap {
    ...AssetAmountWithChange
  }
  totalBorrowed {
    ...AssetAmountWithChange
  }
  totalBorrowable {
    ...AssetAmountWithChange
  }
  averageSupplyApy: supplyApy(metric: AVERAGE) {
    ...PercentNumber
  }
  averageBorrowApy: borrowApy(metric: AVERAGE) {
    ...PercentNumber
  }
}
```

```graphql title="Erc20Token"
fragment Erc20Token on Erc20Token {
  __typename
  chainId
  address
  name
  symbol
  decimals
}
```

```graphql title="Others"
fragment AssetAmountWithChange on AssetAmountWithChange {
  __typename
  amount {
    ...DecimalNumberWithChange
  }
  exchange(currency: $currency) {
    ...ExchangeAmountWithChange
  }
}

fragment DecimalNumberWithChange on DecimalNumberWithChange {
  __typename
  current {
    ...DecimalNumber
  }
  change(window: $timeWindow) {
    ...PercentNumber
  }
}

fragment ExchangeAmountWithChange on ExchangeAmountWithChange {
  __typename
  current {
    ...ExchangeAmount
  }
  change(window: $timeWindow) {
    ...PercentNumber
  }
}

fragment ExchangeAmount on ExchangeAmount {
  __typename
  value
  name
  symbol
  icon
  decimals
}
```

Specify the asset ID or token address and chain ID.

```json title="By Token Details"
{
  "request": {
    "query": {
      "token": {
        "address": "0x6B175474E89094C44Da98b954EedeAC495271d0F",
        "chainId": 1
      }
    }
  }
}
```

```json title="By Asset ID"
{
  "request": {
    "query": {
      "assetId": "SGVsbG8h"
    }
  }
}
```

```json title="Custom Currency"
{
  "request": {
    "query": {
      // your query criteria
    }
  },
  "currency": "EUR"
}
```

</tab>
</tabgroup>
## Multichain Asset

A multichain asset aggregates a single token across every chain where it is listed as a hub asset. Tokens are grouped by their **canonical symbol**—the case-insensitive, alias-resolved symbol that identifies the same asset across chains—so you can show protocol-wide totals and APY ranges without querying each chain separately.

### Data Structure

A multichain asset exposes the per-chain [`Asset`](#asset-data-structure) list alongside an aggregated summary.

<tabgroup>
<tab label="TypeScript">

The following TypeScript interfaces illustrate the core multichain asset types:

```ts title="MultichainAsset"
interface MultichainAsset {
  __typename: "MultichainAsset";
  assets: Asset[];
  summary: MultichainAssetSummary;
}
```

```ts title="MultichainAssetSummary"
interface MultichainAssetSummary {
  __typename: "MultichainAssetSummary";
  totalSupplied: ExchangeAmount;
  totalBorrowed: ExchangeAmount;
  totalSupplyCap: ExchangeAmount;
  totalBorrowCap: ExchangeAmount;
  totalAvailableLiquidity: ExchangeAmount;
  utilizationRate: PercentNumber;
  highestSupplyApy: PercentNumber;
  lowestSupplyApy: PercentNumber;
  averageSupplyApy: PercentNumber;
  highestBorrowApy: PercentNumber;
  lowestBorrowApy: PercentNumber;
  averageBorrowApy: PercentNumber;
  chainCount: number;
  reservesCount: number;
  activeReservesCount: number;
}
```

</tab>
<tab label="GraphQL">

The following GraphQL fragments illustrate the core multichain asset types:

```graphql title="MultichainAsset"
fragment MultichainAsset on MultichainAsset {
  __typename
  assets {
    ...Asset
  }
  summary {
    ...MultichainAssetSummary
  }
}
```

```graphql title="MultichainAssetSummary"
fragment MultichainAssetSummary on MultichainAssetSummary {
  __typename
  totalSupplied {
    ...ExchangeAmount
  }
  totalBorrowed {
    ...ExchangeAmount
  }
  totalSupplyCap {
    ...ExchangeAmount
  }
  totalBorrowCap {
    ...ExchangeAmount
  }
  totalAvailableLiquidity {
    ...ExchangeAmount
  }
  utilizationRate {
    ...PercentNumber
  }
  highestSupplyApy {
    ...PercentNumber
  }
  lowestSupplyApy {
    ...PercentNumber
  }
  averageSupplyApy {
    ...PercentNumber
  }
  highestBorrowApy {
    ...PercentNumber
  }
  lowestBorrowApy {
    ...PercentNumber
  }
  averageBorrowApy {
    ...PercentNumber
  }
  chainCount
  reservesCount
  activeReservesCount
}
```

</tab>
</tabgroup>
### Fetching a Multichain Asset

Select the token with exactly one of `symbol` or `tokenInfo`. Omit `chainIds` to aggregate across all chains, or pass a list to restrict the result.

<tabgroup>
<tab label="React">

Use the `useMultichainAsset` hook to fetch an asset aggregated across chains.

```tsx title="Loading State"
import { useMultichainAsset } from "@aave/react";

function MultichainAssetSummary() {
  const { data, loading, error } = useMultichainAsset({
    query: { symbol: "USDC" },
  });

  if (loading) return <div>Loading…</div>;

  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      Deployed on {data.summary.chainCount} chains
      <p>
        Total supplied: {data.summary.totalSupplied.value.toDisplayString(2)} 
        {data.summary.totalSupplied.symbol}
      </p>
    </div>
  );
}
```

```tsx title="React Suspense"
import { useMultichainAsset } from "@aave/react";

function MultichainAssetSummary() {
  const { data } = useMultichainAsset({
    query: { symbol: "USDC" },
    suspense: true,
  });

  return Deployed on {data.summary.chainCount} chains;
}
```

See below for examples of `MultichainAssetRequest` objects.

```tsx title="By Symbol"
const request: MultichainAssetRequest = {
  query: {
    symbol: "USDC",
  },
};
```

```tsx title="By Token Info ID"
const request: MultichainAssetRequest = {
  query: {
    tokenInfo: tokenInfo.id, // tokenInfo: TokenInfo
  },
};
```

```tsx title="Restrict to Chains"
import { chainId } from "@aave/react";

const request: MultichainAssetRequest = {
  query: {
    symbol: "USDC",
  },
  chainIds: [chainId(1), chainId(43114)],
};
```

By default, Merkl rewards are included in the APY range. Pass `includeRewards: false` for protocol base rates only.

```tsx title="Protocol APYs Only"
const request: MultichainAssetRequest = {
  query: { symbol: "USDC" },
  includeRewards: false,
};
```

</tab>
<tab label="TypeScript">

Use the `multichainAsset` action to fetch an asset aggregated across chains.

```ts title="By Symbol"
import { multichainAsset } from "@aave/client/actions";

import { client } from "./client";

const result = await multichainAsset(client, {
  query: { symbol: "USDC" },
});

if (result.isOk()) {
  console.log(result.value); // MultichainAsset
} else {
  console.error(result.error);
}
```

```ts title="Restrict to Chains"
import { chainId } from "@aave/client";
import { multichainAsset } from "@aave/client/actions";

import { client } from "./client";

const result = await multichainAsset(client, {
  query: { symbol: "USDC" },
  chainIds: [chainId(1), chainId(43114)],
});
```

</tab>
<tab label="GraphQL">

Use the `multichainAsset` query to fetch an asset aggregated across chains.

```graphql title="Query"
query ($request: MultichainAssetRequest!, $currency: Currency! = USD) {
  value: multichainAsset(request: $request) {
    ...MultichainAsset
  }
}
```

Provide exactly one of `symbol` or `tokenInfo` in `query`, and optionally restrict the result with `chainIds`.

```json title="By Symbol"
{
  "request": {
    "query": {
      "symbol": "USDC"
    }
  }
}
```

```json title="Restrict to Chains"
{
  "request": {
    "query": {
      "symbol": "USDC"
    },
    "chainIds": [1, 43114]
  }
}
```

</tab>
</tabgroup>
## Asset Price History

Asset price history data provides time-series price information for an asset.

<tabgroup>
<tab label="React">

Use the `useAssetPriceHistory` hook to fetch historical price data.

```tsx title="Loading State"
import {
  type AssetPriceHistoryRequest,
  useAssetPriceHistory,
} from "@aave/react";

function AssetPrice({ request }: { request: AssetPriceHistoryRequest }) {
  const { data, loading, error } = useAssetPriceHistory(request);

  if (loading) return <div>Loading…</div>;

  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {data.map((sample) => (
        <div key={sample.date.toString()}>
          <p>
            <small>{sample.date.toLocaleDateString()}</small>$
            {sample.price.toFixed(2)}
          </p>
        </div>
      ))}
    </div>
  );
}
```

```tsx title="React Suspense"
import {
  type AssetPriceHistoryRequest,
  useAssetPriceHistory,
} from "@aave/react";

function AssetPrice({ request }: { request: AssetPriceHistoryRequest }) {
  const { data } = useAssetPriceHistory({
    ...request,
    suspense: true,
  });

  return (
    <div>
      {data.map((sample) => (
        <div key={sample.date.toString()}>
          <p>
            <small>{sample.date.toLocaleDateString()}</small>$
            {sample.price.toFixed(2)}
          </p>
        </div>
      ))}
    </div>
  );
}
```

See below for examples of `AssetPriceHistoryRequest` objects.

```tsx title="By Asset ID"
const request: AssetPriceHistoryRequest = {
  query: {
    assetId: asset.id,
  },
};
```

```tsx title="By Token Details"
import { chainId, evmAddress } from "@aave/react";

const request: AssetPriceHistoryRequest = {
  query: {
    token: {
      address: evmAddress("0x123…"),
      chainId: chainId(1),
    },
  },
};
```

Finally, you can specify a different currency or time window for the data.

```tsx title="Custom Currency"
import { Currency } from "@aave/react";

const { data, error, loading } = useAssetPriceHistory({
  query: {
    // your query criteria
  },
  currency: Currency.Eur,
});
```

```tsx title="Custom Time Window"
import { TimeWindow } from "@aave/react";

const { data, error, loading } = useAssetPriceHistory({
  query: {
    // your query criteria
  },
  window: TimeWindow.LastMonth,
});
```

</tab>
<tab label="TypeScript">

Use the `assetPriceHistory` action to fetch historical price data.

```ts title="By Asset ID"
import { Currency, TimeWindow } from "@aave/client";
import { assetPriceHistory } from "@aave/client/actions";

import { client } from "./client";

const result = await assetPriceHistory(client, {
  query: {
    assetId: asset.id,
  },
  currency: Currency.Usd,
  window: TimeWindow.LastWeek,
});
```

```ts title="By Token Details"
import { chainId, evmAddress, Currency, TimeWindow } from "@aave/client";
import { assetPriceHistory } from "@aave/client/actions";

import { client } from "./client";

const result = await assetPriceHistory(client, {
  query: {
    token: {
      address: evmAddress("0x123…"),
      chainId: chainId(1),
    },
  },
  currency: Currency.Usd,
  window: TimeWindow.LastWeek,
});
```

</tab>
<tab label="GraphQL">

Use the `assetPriceHistory` query to fetch historical price data.

```graphql title="Query"
query ($request: AssetPriceHistoryRequest!) {
  value: assetPriceHistory(request: $request) {
    date
    price
  }
}
```

Specify the asset ID or token, currency, and time window.

```json title="By Asset ID"
{
  "request": {
    "query": {
      "assetId": "SGVsbG8h"
    },
    "currency": "USD",
    "window": "LAST_WEEK"
  }
}
```

```json title="By Token Details"
{
  "request": {
    "query": {
      "token": {
        "address": "0x6B175474E89094C44Da98b954EedeAC495271d0F",
        "chainId": 1
      }
    },
    "currency": "USD",
    "window": "LAST_WEEK"
  }
}
```

</tab>
</tabgroup>
## Asset Supply History

Asset supply history data provides time-series total supply information for an asset.

<tabgroup>
<tab label="React">

Use the `useAssetSupplyHistory` hook to fetch historical supply data.

```tsx title="Loading State"
import {
  type AssetSupplyHistoryRequest,
  useAssetSupplyHistory,
} from "@aave/react";

function AssetSupply({ request }: { request: AssetSupplyHistoryRequest }) {
  const { data, loading, error } = useAssetSupplyHistory(request);

  if (loading) return <div>Loading…</div>;

  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {data.map((sample) => (
        <div key={sample.date.toString()}>
          <p>
            <small>{sample.date.toLocaleDateString()}</small>
            {sample.amount.value.toDisplayString(2)} {sample.amount.symbol}
          </p>
        </div>
      ))}
    </div>
  );
}
```

```tsx title="React Suspense"
import {
  type AssetSupplyHistoryRequest,
  useAssetSupplyHistory,
} from "@aave/react";

function AssetSupply({ request }: { request: AssetSupplyHistoryRequest }) {
  const { data } = useAssetSupplyHistory({
    ...request,
    suspense: true,
  });

  return (
    <div>
      {data.map((sample) => (
        <div key={sample.date.toString()}>
          <p>
            <small>{sample.date.toLocaleDateString()}</small>
            {sample.amount.value.toDisplayString(2)} {sample.amount.symbol}
          </p>
        </div>
      ))}
    </div>
  );
}
```

See below for examples of `AssetSupplyHistoryRequest` objects.

```tsx title="By Asset ID"
const request: AssetSupplyHistoryRequest = {
  query: {
    assetId: asset.id,
  },
};
```

```tsx title="By Token Details"
import { chainId, evmAddress } from "@aave/react";

const request: AssetSupplyHistoryRequest = {
  query: {
    token: {
      address: evmAddress("0x123…"),
      chainId: chainId(1),
    },
  },
};
```

Finally, you can specify a different time window for the data.

```tsx title="Custom Time Window"
import { TimeWindow } from "@aave/react";

const { data, error, loading } = useAssetSupplyHistory({
  query: {
    // your query criteria
  },
  window: TimeWindow.LastMonth,
});
```

</tab>
<tab label="TypeScript">

Use the `assetSupplyHistory` action to fetch historical supply data.

```ts title="By Asset ID"
import { TimeWindow } from "@aave/client";
import { assetSupplyHistory } from "@aave/client/actions";

import { client } from "./client";

const result = await assetSupplyHistory(client, {
  query: {
    assetId: asset.id,
  },
  window: TimeWindow.LastWeek,
});
```

```ts title="By Token Details"
import { chainId, evmAddress, TimeWindow } from "@aave/client";
import { assetSupplyHistory } from "@aave/client/actions";

import { client } from "./client";

const result = await assetSupplyHistory(client, {
  query: {
    token: {
      address: evmAddress("0x123…"),
      chainId: chainId(1),
    },
  },
  window: TimeWindow.LastWeek,
});
```

</tab>
<tab label="GraphQL">

Use the `assetSupplyHistory` query to fetch historical supply data.

```graphql title="Query"
query ($request: AssetSupplyHistoryRequest!) {
  value: assetSupplyHistory(request: $request) {
    date
    amount {
      ...DecimalNumber
    }
    highestApy {
      ...PercentNumber
    }
    lowestApy {
      ...PercentNumber
    }
    averageApy {
      ...PercentNumber
    }
    breakdown {
      ...AssetSampleBreakdown
    }
  }
}
```

```graphql title="AssetSampleBreakdown"
fragment AssetSampleBreakdown on AssetSampleBreakdown {
  __typename
  amount {
    ...DecimalNumber
  }
  apy {
    ...PercentNumber
  }
  hub {
    ...Hub
  }
}
```

```graphql title="Hub"
fragment Hub on Hub {
  __typename
  id
  address
  chain {
    ...Chain
  }
  name
}
```

Specify the asset ID or token and time window.

```json title="By Asset ID"
{
  "request": {
    "query": {
      "assetId": "SGVsbG8h"
    },
    "window": "LAST_WEEK"
  }
}
```

```json title="By Token Details"
{
  "request": {
    "query": {
      "token": {
        "address": "0x6B175474E89094C44Da98b954EedeAC495271d0F",
        "chainId": 1
      }
    },
    "window": "LAST_WEEK"
  }
}
```

</tab>
</tabgroup>
## Asset Borrow History

Asset borrow history data provides time-series total borrow information for an asset.

<tabgroup>
<tab label="React">

Use the `useAssetBorrowHistory` hook to fetch historical borrow data.

```tsx title="Loading State"
import {
  type AssetBorrowHistoryRequest,
  useAssetBorrowHistory,
} from "@aave/react";

function AssetBorrow({ request }: { request: AssetBorrowHistoryRequest }) {
  const { data, loading, error } = useAssetBorrowHistory(request);

  if (loading) return <div>Loading…</div>;

  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {data.map((sample) => (
        <div key={sample.date.toString()}>
          <p>
            <small>{sample.date.toLocaleDateString()}</small>
            {sample.amount.value.toDisplayString(2)} {sample.amount.symbol}
          </p>
        </div>
      ))}
    </div>
  );
}
```

```tsx title="React Suspense"
import {
  type AssetBorrowHistoryRequest,
  useAssetBorrowHistory,
} from "@aave/react";

function AssetBorrow({ request }: { request: AssetBorrowHistoryRequest }) {
  const { data } = useAssetBorrowHistory({
    ...request,
    suspense: true,
  });

  return (
    <div>
      {data.map((sample) => (
        <div key={sample.date.toString()}>
          <p>
            <small>{sample.date.toLocaleDateString()}</small>
            {sample.amount.value.toDisplayString(2)} {sample.amount.symbol}
          </p>
        </div>
      ))}
    </div>
  );
}
```

See below for examples of `AssetBorrowHistoryRequest` objects.

```tsx title="By Asset ID"
const request: AssetBorrowHistoryRequest = {
  query: {
    assetId: asset.id,
  },
};
```

```tsx title="By Token Details"
import { chainId, evmAddress } from "@aave/react";

const request: AssetBorrowHistoryRequest = {
  query: {
    token: {
      address: evmAddress("0x123…"),
      chainId: chainId(1),
    },
  },
};
```

Finally, you can specify a different time window for the data.

```tsx title="Custom Time Window"
import { TimeWindow } from "@aave/react";

const { data, error, loading } = useAssetBorrowHistory({
  query: {
    // your query criteria
  },
  window: TimeWindow.LastMonth,
});
```

</tab>
<tab label="TypeScript">

Use the `assetBorrowHistory` action to fetch historical borrow data.

```ts title="By Asset ID"
import { TimeWindow } from "@aave/client";
import { assetBorrowHistory } from "@aave/client/actions";

import { client } from "./client";

const result = await assetBorrowHistory(client, {
  query: {
    assetId: asset.id,
  },
  window: TimeWindow.LastWeek,
});
```

```ts title="By Token Details"
import { chainId, evmAddress, TimeWindow } from "@aave/client";
import { assetBorrowHistory } from "@aave/client/actions";

import { client } from "./client";

const result = await assetBorrowHistory(client, {
  query: {
    token: {
      address: evmAddress("0x123…"),
      chainId: chainId(1),
    },
  },
  window: TimeWindow.LastWeek,
});
```

</tab>
<tab label="GraphQL">

Use the `assetBorrowHistory` query to fetch historical borrow data.

```graphql title="Query"
query ($request: AssetBorrowHistoryRequest!) {
  value: assetBorrowHistory(request: $request) {
    date
    amount {
      ...DecimalNumber
    }
    highestApy {
      ...PercentNumber
    }
    lowestApy {
      ...PercentNumber
    }
    averageApy {
      ...PercentNumber
    }
    breakdown {
      ...AssetSampleBreakdown
    }
  }
}
```

```graphql title="AssetSampleBreakdown"
fragment AssetSampleBreakdown on AssetSampleBreakdown {
  __typename
  amount {
    ...DecimalNumber
  }
  apy {
    ...PercentNumber
  }
  hub {
    ...Hub
  }
}
```

```graphql title="Hub"
fragment Hub on Hub {
  __typename
  id
  address
  chain {
    ...Chain
  }
  name
}
```

Specify the asset ID or token and time window.

```json title="By Asset ID"
{
  "request": {
    "query": {
      "assetId": "SGVsbG8h"
    },
    "window": "LAST_WEEK"
  }
}
```

```json title="By Token Details"
{
  "request": {
    "query": {
      "token": {
        "address": "0x6B175474E89094C44Da98b954EedeAC495271d0F",
        "chainId": 1
      }
    },
    "window": "LAST_WEEK"
  }
}
```

</tab>
</tabgroup>
## Protocol History

Fetch protocol-wide historical data (deposits, borrows). Pass `chainIds` to scope the history to specific chains, or omit it to aggregate across all of them.

<tabgroup>
<tab label="React">

Use the `useProtocolHistory` hook to fetch protocol-wide historical data.

```tsx title="Loading State"
import { type ProtocolHistoryRequest, useProtocolHistory } from "@aave/react";

function ProtocolHistory({ request }: { request: ProtocolHistoryRequest }) {
  const { data, loading, error } = useProtocolHistory(request);

  if (loading) return <div>Loading…</div>;

  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {data.map((sample) => (
        <p key={sample.date.toString()}>
          <small>{sample.date.toLocaleDateString()}</small>
          <span>
            <strong>Deposits</strong>
            {sample.deposits.symbol}
            {sample.deposits.value.toDisplayString(2)}
          </span>
          <span>
            <strong>Borrows</strong>
            {sample.borrows.symbol}
            {sample.borrows.value.toDisplayString(2)}
          </span>
        </p>
      ))}
    </div>
  );
}
```

```tsx title="React Suspense"
import { type ProtocolHistoryRequest, useProtocolHistory } from "@aave/react";

function ProtocolHistory({ request }: { request: ProtocolHistoryRequest }) {
  const { data } = useProtocolHistory({
    ...request,
    suspense: true,
  });

  return (
    <div>
      {data.map((sample) => (
        <p key={sample.date.toString()}>
          <small>{sample.date.toLocaleDateString()}</small>
          <span>
            <strong>Deposits</strong>
            {sample.deposits.symbol}
            {sample.deposits.value.toDisplayString(2)}
          </span>
          <span>
            <strong>Borrows</strong>
            {sample.borrows.symbol}
            {sample.borrows.value.toDisplayString(2)}
          </span>
        </p>
      ))}
    </div>
  );
}
```

</tab>
<tab label="TypeScript">

Use the `protocolHistory` action to fetch protocol-wide historical data.

```ts title="Protocol History"
import { chainId, Currency, TimeWindow } from "@aave/client";
import { protocolHistory } from "@aave/client/actions";

import { client } from "./client";

const result = await protocolHistory(client, {
  currency: Currency.Usd,
  window: TimeWindow.LastWeek,
  chainIds: [chainId(1), chainId(43114)],
});

if (result.isOk()) {
  console.log(result.value); // ProtocolHistorySample[]
} else {
  console.error(result.error);
}
```

</tab>
<tab label="GraphQL">

Use the `protocolHistory` query to fetch protocol-wide historical data.

```graphql title="Query"
query ($request: ProtocolHistoryRequest!) {
  value: protocolHistory(request: $request) {
    date
    deposits {
      ...ExchangeAmount
    }
    borrows {
      ...ExchangeAmount
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

Specify currency and time window.

```json title="Protocol History Request"
{
  "request": {
    "currency": "USD",
    "window": "LAST_WEEK",
    "chainIds": [1, 43114]
  }
}
```

</tab>
</tabgroup>

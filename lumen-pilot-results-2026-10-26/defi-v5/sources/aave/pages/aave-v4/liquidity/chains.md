# Chains

Learn how to discover supported blockchain networks in Aave v4.

---

## Chain Structure

Chain data provides information about blockchain networks supported by Aave v4, including:

- Identification: name, chain ID, icon URL
- Configuration: explorer URL, whether it is a testnet
- Native token details: wrapped token address and metadata

<tabgroup>
<tab label="TypeScript">

The following TypeScript interface illustrates the core Chain type:

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
```

```ts title="TokenInfo"
interface TokenInfo {
  __typename: "TokenInfo";
  id: TokenInfoId;
  name: string;
  symbol: string;
  // Case-folded, alias-resolved symbol grouping this token
  // with the same asset on other chains.
  canonicalSymbol: string;
  icon: string;
  decimals: number;
  categories: TokenCategory[];
}
```

```ts title="TokenCategory"
enum TokenCategory {
  Stablecoin = "STABLECOIN",
  EthCorrelated = "ETH_CORRELATED",
}
```

</tab>
<tab label="GraphQL">

The following GraphQL fragments illustrate the core Chain type:

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
```

```graphql title="TokenInfo"
fragment TokenInfo on TokenInfo {
  __typename
  id
  name
  symbol
  canonicalSymbol
  icon
  decimals
  categories
}
```

</tab>
</tabgroup>
## Listing Supported Chains

Discover all blockchain networks supported by Aave v4.

<tabgroup>
<tab label="React">

Use the `useChains` hook to fetch a list of supported chains.

```tsx title="Loading State"
import { type ChainsRequest, useChains } from "@aave/react";

function ChainsList({ request }: { request: ChainsRequest }) {
  const { data, loading, error } = useChains(request);

  if (loading) return <div>Loading…</div>;

  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {data.map((chain) => (
        <div key={chain.chainId}>
          <h3>{chain.name}</h3>
          Chain ID: {chain.chainId}
        </div>
      ))}
    </div>
  );
}
```

```tsx title="React Suspense"
import { type ChainsRequest, useChains } from "@aave/react";

function ChainsList({ request }: { request: ChainsRequest }) {
  const { data } = useChains({
    ...request,
    suspense: true,
  });

  return (
    <div>
      {data.map((chain) => (
        <div key={chain.chainId}>
          <h3>{chain.name}</h3>
          Chain ID: {chain.chainId}
        </div>
      ))}
    </div>
  );
}
```

See below for examples of `ChainsRequest` objects.

```tsx title="By Filter"
import { ChainsFilter } from "@aave/react";

const request: ChainsRequest = {
  query: { filter: ChainsFilter.ALL },
};
```

```tsx title="By Chain IDs"
import { chainId } from "@aave/react";

const request: ChainsRequest = {
  query: { chainIds: [chainId(1), chainId(137)] },
};
```

Where `ChainsFilter` is one of:

- `ChainsFilter.ALL` - All chains
- `ChainsFilter.MAINNET_ONLY` - Mainnets only
- `ChainsFilter.TESTNET_ONLY` - Testnets only

</tab>

<tab label="TypeScript">

Use the `chains` action to fetch a list of supported chains.

```ts title="By Filter"
import { ChainsFilter } from "@aave/client";
import { chains } from "@aave/client/actions";

import { client } from "./client";

const result = await chains(client, {
  query: { filter: ChainsFilter.ALL },
});

if (result.isOk()) {
  console.log(result.value); // Chain[]
} else {
  console.error(result.error);
}
```

```ts title="By Chain IDs"
import { chainId } from "@aave/client";
import { chains } from "@aave/client/actions";

import { client } from "./client";

const result = await chains(client, {
  query: { chainIds: [chainId(1), chainId(137)] },
});

if (result.isOk()) {
  console.log(result.value); // Chain[]
} else {
  console.error(result.error);
}
```

```ts title="client.ts"
import { AaveClient } from "@aave/client";

export const client = AaveClient.create();
```

Where `ChainsFilter` is one of:

- `ChainsFilter.ALL` - All chains
- `ChainsFilter.MAINNET_ONLY` - Mainnets only
- `ChainsFilter.TESTNET_ONLY` - Testnets only

</tab>

<tab label="GraphQL">

Use the `chains` query to fetch supported blockchain networks.

```graphql title="Query"
query ($request: ChainsRequest!) {
  chains(request: $request) {
    chainId
    name
    icon
    explorerUrl
    isTestnet
    nativeWrappedToken
    nativeInfo {
      name
      symbol
      icon
      decimals
    }
    nativeGateway
    signatureGateway
  }
}
```

Below are examples of query variables.

```json title="By Filter"
{
  "request": {
    "query": {
      "filter": "ALL" // or "MAINNET_ONLY" or "TESTNET_ONLY"
    }
  }
}
```

```json title="By Chain IDs"
{
  "request": {
    "query": {
      "chainIds": [1, 137]
    }
  }
}
```

</tab>
</tabgroup>
## Fetching a Single Chain

Get detailed information about a specific blockchain network by its chain ID.

<tabgroup>
<tab label="React">

Use the `useChain` hook to fetch a specific chain.

```tsx title="Loading State"
import { type ChainRequest, useChain } from "@aave/react";

function ChainDetails({ request }: { request: ChainRequest }) {
  const { data, loading, error } = useChain(request);

  if (loading) return <div>Loading…</div>;

  if (error) return <div>Error: {error.message}</div>;

  if (!data) return <div>Chain not found</div>;

  return (
    <div>
      <h3>{data.name}</h3>
      Chain ID: {data.chainId}
    </div>
  );
}
```

```tsx title="React Suspense"
import { type ChainRequest, useChain } from "@aave/react";

function ChainDetails({ request }: { request: ChainRequest }) {
  const { data } = useChain({
    ...request,
    suspense: true,
  });

  if (!data) return <div>Chain not found</div>;

  return (
    <div>
      <h3>{data.name}</h3>
      Chain ID: {data.chainId}
    </div>
  );
}
```

See below for an example of a `ChainRequest` object.

```tsx title="Example"
import { chainId } from "@aave/react";

const request: ChainRequest = {
  chainId: chainId(1),
};
```

</tab>

<tab label="TypeScript">

Use the `chain` action to fetch a specific chain.

```ts title="Example"
import { chainId } from "@aave/client";
import { chain } from "@aave/client/actions";

import { client } from "./client";

const result = await chain(client, {
  chainId: chainId(1),
});
```

</tab>

<tab label="GraphQL">

Use the `chain` query to fetch a specific blockchain network.

```graphql title="Query"
query ($request: ChainRequest!) {
  chain(request: $request) {
    chainId
    name
    icon
    explorerUrl
    isTestnet
    nativeWrappedToken
    nativeInfo {
      name
      symbol
      icon
      decimals
    }
    nativeGateway
    signatureGateway
  }
}
```

Below is an example of query variables:

```json title="Variables"
{
  "request": {
    "chainId": 1
  }
}
```

</tab>
</tabgroup>

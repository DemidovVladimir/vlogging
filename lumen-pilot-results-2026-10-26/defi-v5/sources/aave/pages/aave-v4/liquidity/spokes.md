# Spokes

Learn how to discover available spokes in Aave v4.

---

## Spoke Data Structure

Spoke data provide information about individual borrowing modules, including:

- Identification: id, name, address, chain
- Configuration: active status and module settings
- Liquidation parameters: target health factor, max-bonus threshold, and bonus factor (`liquidationConfig`)
- Summary metrics: supplied, borrowed, cap usage, connected hubs, and connected assets

<tabgroup>
<tab label="TypeScript">

The following TypeScript interfaces illustrate the core Spoke type:

```ts title="Spoke"
interface Spoke {
  __typename: "Spoke";
  id: SpokeId;
  name: string;
  address: EvmAddress;
  chain: Chain;
  liquidationConfig: SpokeLiquidationConfig | null;
  summary: SpokeSummary;
  connectedHubs: SpokeConnectedHub[];
}
```

```ts title="SpokeLiquidationConfig"
interface SpokeLiquidationConfig {
  __typename: "SpokeLiquidationConfig";
  targetHealthFactor: BigDecimal;
  healthFactorForMaxBonus: BigDecimal;
  liquidationBonusFactor: PercentNumber;
}
```

```ts title="SpokeSummary"
interface SpokeSummary {
  __typename: "SpokeSummary";
  totalBorrowed: ExchangeAmount;
  totalBorrowCap: ExchangeAmount;
  totalSupplied: ExchangeAmount;
  totalSupplyCap: ExchangeAmount;
  uniqueAssets: number;
  connectedHubs: number;
}
```

```ts title="SpokeConnectedHub"
interface SpokeConnectedHub {
  __typename: "SpokeConnectedHub";
  hub: Hub;
  summary: SpokeConnectedHubSummary;
}
```

```ts title="SpokeConnectedHubSummary"
interface SpokeConnectedHubSummary {
  __typename: "SpokeConnectedHubSummary";
  totalBorrowed: ExchangeAmount;
  totalSupplied: ExchangeAmount;
  creditLine: ExchangeAmount;
  creditUsed: PercentNumber;
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

</tab>
<tab label="GraphQL">

The following GraphQL fragments illustrate the core Spoke type:

```graphql title="Spoke"
fragment Spoke on Spoke {
  __typename
  id
  name
  address
  chain {
    ...Chain
  }
  liquidationConfig {
    ...SpokeLiquidationConfig
  }
  summary(currency: $currency) {
    ...SpokeSummary
  }
  connectedHubs(currency: $currency) {
    ...SpokeConnectedHub
  }
}
```

```graphql title="SpokeLiquidationConfig"
fragment SpokeLiquidationConfig on SpokeLiquidationConfig {
  __typename
  targetHealthFactor
  healthFactorForMaxBonus
  liquidationBonusFactor {
    ...PercentNumber
  }
}
```

```graphql title="SpokeSummary"
fragment SpokeSummary on SpokeSummary {
  __typename
  totalBorrowed {
    ...ExchangeAmount
  }
  totalBorrowCap {
    ...ExchangeAmount
  }
  totalSupplied {
    ...ExchangeAmount
  }
  totalSupplyCap {
    ...ExchangeAmount
  }
  uniqueAssets
  connectedHubs
}
```

```graphql title="SpokeConnectedHub"
fragment SpokeConnectedHub on SpokeConnectedHub {
  __typename
  hub {
    ...Hub
  }
  summary {
    ...SpokeConnectedHubSummary
  }
}
```

```graphql title="SpokeConnectedHubSummary"
fragment SpokeConnectedHubSummary on SpokeConnectedHubSummary {
  __typename
  totalBorrowed {
    ...ExchangeAmount
  }
  totalSupplied {
    ...ExchangeAmount
  }
  creditLine {
    ...ExchangeAmount
  }
  creditUsed {
    ...PercentNumber
  }
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

</tab>
<tab label="Solidity">

At the smart contract level, spokes are deployed contracts implementing the `ISpoke` interface, managed by the governance.

The relationship between spokes and hubs is tracked onchain within the hub contract. Each spoke can connect to multiple hub assets, maintaining separate `SpokeData` state for each asset.

Spoke updates can be monitored through this event:

```solidity title="Spoke Events"
event AddSpoke(uint256 indexed assetId, address indexed spoke);
```

The following structs illustrate the spoke data:

```solidity title="SpokeData Struct"
struct SpokeData {
  uint120 drawnShares;
  uint120 premiumShares;
  int200 premiumOffsetRay;
  uint120 addedShares;
  uint40 addCap;
  uint40 drawCap;
  uint24 riskPremiumThreshold;
  bool active;
  bool paused;
  uint200 deficitRay;
}
```

```solidity title="SpokeConfig Struct"
struct SpokeConfig {
  uint40 addCap;
  uint40 drawCap;
  uint24 riskPremiumThreshold;
  bool active;
  bool paused;
}
```

</tab>
</tabgroup>
## Listing Available Spokes

Discover all available Aave Spokes across supported networks.

<tabgroup>
<tab label="React">

Use the `useSpokes` hook to fetch a list of available spokes.

```tsx title="Loading State"
import { type SpokesRequest, useSpokes } from "@aave/react";

function SpokesList({ request }: { request: SpokesRequest }) {
  const { data, loading, error } = useSpokes(request);

  if (loading) return <div>Loading…</div>;

  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {data.map((spoke) => (
        <div key={spoke.id}>
          <h3>{spoke.name}</h3>
          Chain: {spoke.chain.name}
        </div>
      ))}
    </div>
  );
}
```

```tsx title="React Suspense"
import { type SpokesRequest, useSpokes } from "@aave/react";

function SpokesList({ request }: { request: SpokesRequest }) {
  const { data } = useSpokes({
    ...request,
    suspense: true,
  });

  return (
    <div>
      {data.map((spoke) => (
        <div key={spoke.id}>
          <h3>{spoke.name}</h3>
          Chain: {spoke.chain.name}
        </div>
      ))}
    </div>
  );
}
```

See below for examples of `SpokesRequest` objects.

```tsx title="By Chains"
import { chainId } from "@aave/react";

const request: SpokesRequest = {
  query: {
    chainIds: [chainId(1)],
  },
};
```

```tsx title="By Hub ID"
const request: SpokesRequest = {
  query: {
    hubId: hub.id,
  },
};
```

```tsx title="By Hub Details"
import { chainId, evmAddress } from "@aave/react";

const request: SpokesRequest = {
  query: {
    hub: {
      address: evmAddress("0x123…"),
      chainId: chainId(1),
    },
  },
};
```

</tab>

<tab label="TypeScript">

Use the `spokes` action to fetch a list of available spokes.

```ts title="By Chains"
import { chainId } from "@aave/client";
import { spokes } from "@aave/client/actions";

import { client } from "./client";

const result = await spokes(client, {
  query: {
    chainIds: [chainId(1)],
  },
});

if (result.isErr()) {
  console.error(result.error);
} else {
  // result.value: Spoke[]
  console.log(result.value);
}
```

```ts title="By Hub ID"
import { spokes } from "@aave/client/actions";

import { client } from "./client";

// const hubId: HubId = "SGVsbG8h";

const result = await spokes(client, {
  query: {
    hubId,
  },
});
```

```ts title="By Hub Details"
import { chainId, evmAddress } from "@aave/client";
import { spokes } from "@aave/client/actions";

import { client } from "./client";

const result = await spokes(client, {
  query: {
    hub: {
      address: evmAddress("0x123…"),
      chainId: chainId(1),
    },
  },
});
```

</tab>

<tab label="GraphQL">

Use the `spokes` query to fetch a list of available spokes.

```graphql title="By Chains"
query {
  spokes(request: { query: { chainIds: [1] } }) {
    id
    name
    address
    chain {
      ...Chain
    }
  }
}
```

```graphql title="By Hub ID"
query {
  spokes(request: { query: { hubId: "SGVsbG8h" } }) {
    id
    name
    address
    chain {
      ...Chain
    }
  }
}
```

```graphql title="By Hub Details"
query {
  spokes(request: { query: { hub: { address: "0x123…", chainId: 1 } } }) {
    id
    name
    address
    chain {
      ...Chain
    }
  }
}
```

</tab>

<tab label="Solidity">

Spokes are deployed and managed by governance. The following spokes are deployed on Ethereum mainnet:

### Deployed Spokes

| Name                    | Address                                      |
| ----------------------- | -------------------------------------------- |
| Main Spoke              | `0x94e7A5dCbE816e498b89aB752661904E2F56c485` |
| Bluechip Spoke          | `0x973a023A77420ba610f06b3858aD991Df6d85A08` |
| Ethena Correlated Spoke | `0x58131E79531caB1d52301228d1f7b842F26B9649` |
| Ethena Ecosystem Spoke  | `0xba1B3D55D249692b669A164024A838309B7508AF` |
| EtherFi eSpoke          | `0xbF10BDfE177dE0336aFD7fcCF80A904E15386219` |
| Forex Spoke             | `0xD8B93635b8C6d0fF98CbE90b5988E3F2d1Cd9da1` |
| Gold Spoke              | `0x65407b940966954b23dfA3caA5C0702bB42984DC` |
| Kelp eSpoke             | `0x3131FE68C4722e726fe6B2819ED68e514395B9a4` |
| Lido eSpoke             | `0xe1900480ac69f0B296841Cd01cC37546d92F35Cd` |
| Lombard BTC Spoke       | `0x7EC68b5695e803e98a21a9A05d744F28b0a7753D` |
| Treasury Spoke          | `0xB9B0b8616f6Bf6841972a52058132BE08d723155` |

Spokes connected to a specific hub can be discovered through the hub's spoke events and methods. See the [Hub Structure](/aave-v4/liquidity/hubs#hub-structure) section for details on querying spoke relationships.

</tab>
</tabgroup>
## Fetching a Single Spoke

Fetch a specific spoke by its address and chain ID.

<tabgroup>
<tab label="React">

Use the `useSpoke` hook to fetch a specific spoke.

```tsx title="Loading State"
import { type SpokeRequest, useSpoke } from "@aave/react";

function SpokeDetails({ request }: { request: SpokeRequest }) {
  const { data, loading, error } = useSpoke(request);

  if (loading) return <div>Loading…</div>;

  if (error) return <div>Error: {error.message}</div>;

  if (!data) return <div>Spoke not found</div>;

  return (
    <div>
      <h3>{data.name}</h3>
      Chain: {data.chain.name}
    </div>
  );
}
```

```tsx title="React Suspense"
import { type SpokeRequest, useSpoke } from "@aave/react";

function SpokeDetails({ request }: { request: SpokeRequest }) {
  const { data } = useSpoke({
    ...request,
    suspense: true,
  });

  if (!data) return <div>Spoke not found</div>;

  return (
    <div>
      <h3>{data.name}</h3>
      Chain: {data.chain.name}
    </div>
  );
}
```

See below for examples of `SpokeRequest` objects.

```tsx title="By Spoke ID"
import { spokeId } from "@aave/react";

const request: SpokeRequest = {
  query: {
    spokeId: spokeId(params.id), // SpokeId - typically from URL params
  },
};
```

```tsx title="By Spoke Details"
import { chainId, evmAddress } from "@aave/react";

const request: SpokeRequest = {
  query: {
    spoke: {
      address: evmAddress("0x123…"),
      chainId: chainId(1),
    },
  },
};
```

</tab>

<tab label="TypeScript">

Use the `spoke` action to fetch a specific spoke.

```ts title="By Spoke ID"
import { spoke } from "@aave/client/actions";

import { client } from "./client";

// const spokeId: SpokeId = "SGVsbG8h";

const result = await spoke(client, {
  query: {
    spokeId,
  },
});

if (result.isOk()) {
  console.log(result.value); // Spoke | null - null if not found
} else {
  console.error(result.error);
}
```

```ts title="By Spoke Details"
import { chainId, evmAddress } from "@aave/client";
import { spoke } from "@aave/client/actions";

import { client } from "./client";

const result = await spoke(client, {
  query: {
    spoke: {
      address: evmAddress("0x123…"),
      chainId: chainId(1),
    },
  },
});
```

</tab>

<tab label="GraphQL">

Use the `spoke` query to fetch a specific spoke.

```graphql title="By Spoke ID"
query {
  spoke(request: { query: { spokeId: "SGVsbG8h" } }) {
    id
    name
    address
    chain {
      ...Chain
    }
  }
}
```

```graphql title="By Spoke Details"
query {
  spoke(request: { query: { spoke: { address: "0x123…", chainId: 1 } } }) {
    id
    name
    address
    chain {
      ...Chain
    }
  }
}
```

</tab>
</tabgroup>
## Spoke Summary History

Fetch historical deposits and borrows for a specific spoke over a chosen time window.

<tabgroup>
<tab label="React">

Use the `useSpokeSummaryHistory` hook to fetch spoke-level history.

```tsx title="Loading State"
import { Currency, TimeWindow, useSpokeSummaryHistory } from "@aave/react";

const { data, loading, error } = useSpokeSummaryHistory({
  query: { spokeId },
  currency: Currency.Usd,
  window: TimeWindow.LastWeek,
});
```

```tsx title="React Suspense"
import { Currency, TimeWindow, useSpokeSummaryHistory } from "@aave/react";

const { data } = useSpokeSummaryHistory({
  query: { spokeId },
  currency: Currency.Usd,
  window: TimeWindow.LastWeek,
  suspense: true,
});
```

</tab>
<tab label="TypeScript">

Use the `spokeSummaryHistory` action to fetch the same series imperatively.

```ts title="Spoke Summary History"
import { Currency, TimeWindow } from "@aave/client";
import { spokeSummaryHistory } from "@aave/client/actions";

const result = await spokeSummaryHistory(client, {
  query: { spokeId },
  currency: Currency.Usd,
  window: TimeWindow.LastWeek,
});

if (result.isOk()) {
  console.log(result.value); // SpokeSummarySample[]
} else {
  console.error(result.error);
}
```

</tab>
<tab label="GraphQL">

Use the `spokeSummaryHistory` query to retrieve deposits and borrows over time.

```graphql title="SpokeSummaryHistory"
query {
  spokeSummaryHistory(
    request: {
      query: { spokeId: "SGVsbG8h" }
      currency: USD
      window: LAST_WEEK
    }
  ) {
    date
    deposits {
      value
    }
    borrows {
      value
    }
  }
}
```

</tab>
</tabgroup>

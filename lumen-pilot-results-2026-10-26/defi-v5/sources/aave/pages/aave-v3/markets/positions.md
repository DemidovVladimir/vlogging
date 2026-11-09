# User Positions

Monitor user positions and account health across Aave markets.

## User Positions

Track user supplied and borrowed assets across Aave markets.

<tabgroup>
<tab label="React">

Use the `useUserSupplies` and `useUserBorrows` hooks to fetch user supplied and borrowed assets.

```ts title="Loading State"
const { data, loading, error } = useUserSupplies({
  markets: MarketInput[],
  user: EvmAddress,
});

const { data, loading, error } = useUserBorrows({
  markets: MarketInput[],
  user: EvmAddress,
});
```

```ts title="React Suspense"
const { data } = useUserSupplies({
  markets: MarketInput[],
  user: EvmAddress,
  suspense: true,
});

const { data } = useUserBorrows({
  markets: MarketInput[],
  user: EvmAddress,
  suspense: true,
});
```

Fetch user positions across one or more markets.

```tsx title="useUserSupplies"
import { useUserSupplies, evmAddress } from "@aave/react";
import { markets } from "./markets";

// …

const user = evmAddress("0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234");

const { data, error, loading } = useUserSupplies({
  markets,
  user,
});

if (error) {
  return Error: {error.message};
}

if (loading) {
  return Loading positions...;
}

// data: MarketUserReserveSupplyPosition[]
```

```tsx title="useUserBorrows"
import { useUserBorrows, evmAddress } from "@aave/react";
import { markets } from "./markets";

// …

const user = evmAddress("0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234");

const { data, error, loading } = useUserBorrows({
  markets,
  user,
});

if (error) {
  return Error: {error.message};
}

if (loading) {
  return Loading positions...;
}

// data: MarketUserReserveBorrowPosition[]
```

```ts title="markets.ts"
import { evmAddress, chainId } from "@aave/react";

export const markets = [
  {
    address: evmAddress("0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2"),
    chainId: chainId(1),
  },
];
```

</tab>
<tab label="TypeScript">

Use the `userSupplies` and `userBorrows` actions to fetch user positions.

```ts title="userSupplies.ts"
import { userSupplies } from "@aave/client/actions";
import { evmAddress } from "@aave/client";
import { client } from "./client";
import { markets } from "./markets";

const user = evmAddress("0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234");

const result = await userSupplies(client, {
  markets,
  user,
});

if (result.isErr()) {
  console.error("Supplies error:", result.error);
} else {
  // result.value: MarketUserReserveSupplyPosition[]
  console.log(result.value);
}
```

```ts title="userBorrows.ts"
import { userBorrows } from "@aave/client/actions";
import { evmAddress } from "@aave/client";
import { client } from "./client";
import { markets } from "./markets";

const user = evmAddress("0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234");

const result = await userBorrows(client, {
  markets,
  user,
});

if (result.isErr()) {
  console.error("Borrows error:", result.error);
} else {
  // result.value: MarketUserReserveBorrowPosition[]
  console.log(result.value);
}
```

```ts title="markets.ts"
import { evmAddress, chainId } from "@aave/client";

export const markets = [
  {
    address: evmAddress("0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2"),
    chainId: chainId(1),
  },
];
```

```ts title="client.ts"
import { AaveClient } from "@aave/client";

export const client = AaveClient.create();
```

</tab>

<tab label="GraphQL">

Use the `userSupplies` and `userBorrows` queries to fetch user positions across markets.

```graphql title="UserSupplies"
query {
  userSupplies(
    request: {
      markets: [
        { address: "0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2", chainId: 1 }
      ]
      user: "0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234"
    }
  ) {
    market {
      name
      chain {
        chainId
      }
    }
    currency {
      symbol
      name
    }
    balance {
      amount {
        value
      }
      usd
    }
    apy {
      raw
      decimals
      value
      formatted
    }
    isCollateral
    canBeCollateral
  }
}
```

```graphql title="UserBorrows"
query {
  userBorrows(
    request: {
      markets: [
        { address: "0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2", chainId: 1 }
      ]
      user: "0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234"
    }
  ) {
    market {
      name
      chain {
        chainId
      }
    }
    currency {
      symbol
      name
    }
    debt {
      amount {
        value
      }
      usd
    }
    apy {
      raw
      decimals
      value
      formatted
    }
  }
}
```

```json title="Response"
{
  "data": {
    "userSupplies": [
      {
        "market": {
          "name": "Aave v3 Ethereum",
          "chain": {
            "chainId": 1
          }
        },
        "currency": {
          "symbol": "USDC",
          "name": "USD Coin"
        },
        "balance": {
          "amount": {
            "value": "1000.0"
          },
          "usd": "1000.0"
        },
        "apy": {
          "raw": "45000000000000000000000000",
          "decimals": 27,
          "value": "0.045",
          "formatted": "4.5"
        },
        "isCollateral": true,
        "canBeCollateral": true
      }
    ]
  }
}
```

</tab>
</tabgroup>
## Account Health

Monitor user account health and risk metrics across Aave positions.

> [!NOTE]
> The health factor is calculated only when a user has at least one active
> borrow position. If the user has no positions or only supply positions, the
> health factor will be null.

<tabgroup>
<tab label="React">

Use the `useUserMarketState` hook to fetch user account health and market state.

```ts title="Loading State"
const { data, loading, error } = useUserMarketState({
  market: EvmAddress,
  user: EvmAddress,
  chainId: ChainId,
});
```

```ts title="React Suspense"
const { data } = useUserMarketState({
  market: EvmAddress,
  user: EvmAddress,
  chainId: ChainId,
  suspense: true,
});
```

Monitor account health for a specific market.

```tsx title="User Market State"
import { useUserMarketState, evmAddress, chainId } from "@aave/react";

// …

const { data, loading, error } = useUserMarketState({
  market: evmAddress("0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2"),
  user: evmAddress("0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234"),
  chainId: chainId(1),
});

if (loading) {
  return Loading account health...;
}

if (error) {
  return Error: {error.message};
}

return (
  <div>
    Health Factor: {data.healthFactor}
    Net Worth: {data.netWorth}
    eMode Enabled: {data.eModeEnabled}
  </div>
);
```

</tab>
<tab label="TypeScript">

Use the `userMarketState` action to fetch user account health and market state.

```ts title="userMarketState"
import { evmAddress, chainId } from "@aave/client";
import { userMarketState } from "@aave/client/actions";

import { client } from "./client";

const result = await userMarketState(client, {
  market: evmAddress("0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2"),
  user: evmAddress("0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234"),
  chainId: chainId(1),
});

if (result.isErr()) {
  console.error(result.error);
} else {
  // result.value: MarketUserState
  console.log("Health Factor:", result.value.healthFactor);
  console.log("Net Worth:", result.value.netWorth);
  console.log("eMode Enabled:", result.value.eModeEnabled);
}
```

```ts title="client.ts"
import { AaveClient } from "@aave/client";

export const client = AaveClient.create();
```

</tab>
<tab label="GraphQL">

Use the `userMarketState` query to fetch user account health and market state.

```graphql title="Query"
query {
  userMarketState(
    request: {
      market: "0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2"
      user: "0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234"
      chainId: 1
    }
  ) {
    netWorth
    netAPY {
      raw
      decimals
      value
      formatted
    }
    healthFactor
    eModeEnabled
    totalCollateralBase
    totalDebtBase
    availableBorrowsBase
    currentLiquidationThreshold {
      raw
      decimals
      value
      formatted
    }
    ltv {
      raw
      decimals
      value
      formatted
    }
    isInIsolationMode
  }
}
```

```json title="Response"
{
  "data": {
    "userMarketState": {
      "netWorth": "5000.0",
      "netAPY": {
        "raw": "25000000000000000000000000",
        "decimals": 27,
        "value": "0.025",
        "formatted": "2.5"
      },
      "healthFactor": "2.5",
      "eModeEnabled": false,
      "totalCollateralBase": "6000.0",
      "totalDebtBase": "2000.0",
      "availableBorrowsBase": "1500.0",
      "currentLiquidationThreshold": {
        "raw": "850000000000000000000000000",
        "decimals": 27,
        "value": "0.85",
        "formatted": "85.0"
      },
      "ltv": {
        "raw": "750000000000000000000000000",
        "decimals": 27,
        "value": "0.75",
        "formatted": "75.0"
      },
      "isInIsolationMode": false
    }
  }
}
```

</tab>
</tabgroup>

# Exchange Rates

Learn how to fetch exchange rates between tokens and supported currencies on Aave v4.

---

Exchange rates in Aave are provided by [Oracles](../../ecosystem/oracle) using Chainlink price feeds.

AaveKit provides current conversion rates between ERC-20 tokens, native tokens, and supported currencies: USD, EUR, and GBP. For smart-contract integrations, query USD reserve prices directly from the spoke oracle.

<tabgroup>
<tab label="React">

Use the `useExchangeRate` hook for live exchange rates with automatic polling every 10 seconds, or the imperative `useExchangeRateAction` hook for on-demand exchange rates.

```tsx title="Loading State"
import { type ExchangeRateRequest, useExchangeRate } from "@aave/react";

function ExchangeRate({ request }: { request: ExchangeRateRequest }) {
  const { data, loading, error } = useExchangeRate(request);

  if (loading) return <div>Loading…</div>;

  if (error) return <div>Error: {error.message}</div>;

  // data: ExchangeAmount
  return (
    <span>
      {data.symbol}
      {data.value.toFixed(2)}
    </span>
  );
}
```

```tsx title="React Suspense"
import { type ExchangeRateRequest, useExchangeRate } from "@aave/react";

function ExchangeRate({ request }: { request: ExchangeRateRequest }) {
  const { data } = useExchangeRate({
    ...request,
    suspense: true,
  });

  // data: ExchangeAmount
  return (
    <span>
      {data.symbol}
      {data.value.toFixed(2)}
    </span>
  );
}
```

```tsx title="Imperative Read"
import { type ExchangeRateRequest, useExchangeRateAction } from "@aave/react";

// …

const [fetch, { called, data, error, loading }] = useExchangeRateAction();

const handler = async (request: ExchangeRateRequest) => {
  const result = await fetch(request);

  if (result.isOk()) {
    console.log(result.value); // ExchangeAmount
  } else {
    console.error(result.error);
  }
};
```

See below some examples of request objects.

```tsx title="ERC-20 Token"
import { evmAddress, chainId, Currency } from "@aave/react";

const request: ExchangeRateRequest = {
  from: {
    erc20: {
      chainId: chainId(1),
      address: evmAddress("0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"),
    },
  },
  to: Currency.Usd,
};
```

```tsx title="Native Token"
import { chainId, Currency } from "@aave/react";

const request: ExchangeRateRequest = {
  from: {
    native: chainId(1),
  },
  to: Currency.Usd,
});
```

```tsx title="Fiat Currency"
import { Currency } from "@aave/react";

const request: ExchangeRateRequest = {
  from: {
    fiat: Currency.Eur,
  },
  to: Currency.Usd,
};
```

</tab>
<tab label="TypeScript">

Use the `exchangeRate` action to fetch conversion rates.

```ts title="ERC-20 Token"
import { exchangeRate } from "@aave/client/actions";
import { evmAddress, chainId, Currency } from "@aave/client";
import { client } from "./client";

const result = await exchangeRate(client, {
  from: {
    erc20: {
      chainId: chainId(1),
      address: evmAddress("0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"),
    },
  },
  to: Currency.Usd,
});

if (result.isOk()) {
  // result.value: ExchangeAmount
  console.log("Exchange rate:", result.value);
} else {
  console.error("Error:", result.error);
}
```

```ts title="Native Token"
import { exchangeRate } from "@aave/client/actions";
import { chainId, Currency } from "@aave/client";
import { client } from "./client";

const result = await exchangeRate(client, {
  from: {
    native: chainId(1),
  },
  to: Currency.Usd,
});

if (result.isOk()) {
  // result.value: ExchangeAmount
  console.log("Exchange rate:", result.value);
} else {
  console.error("Error:", result.error);
}
```

```ts title="Fiat Currency"
import { exchangeRate } from "@aave/client/actions";
import { Currency } from "@aave/client";
import { client } from "./client";

const result = await exchangeRate(client, {
  from: {
    fiat: Currency.Eur,
  },
  to: Currency.Usd,
});

if (result.isOk()) {
  // result.value: ExchangeAmount
  console.log("Exchange rate:", result.value);
} else {
  console.error("Error:", result.error);
}
```

```ts title="client.ts"
import { AaveClient } from "@aave/client";

export const client = AaveClient.create();
```

</tab>
<tab label="GraphQL">

Use the `exchangeRate` query to fetch conversion rates.

```graphql
query ExchangeRate($request: ExchangeRateRequest!) {
  exchangeRate(request: $request) {
    value
    name
    symbol
  }
}
```

See below some examples of how to use the query.

```json title="ERC-20 Token"
{
  "request": {
    "from": {
      "erc20": {
        "chainId": 1,
        "address": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
      }
    },
    "to": "USD"
  }
}
```

```json title="Native Token"
{
  "request": {
    "from": {
      "native": 1
    },
    "to": "USD"
  }
}
```

```json title="Fiat Currency"
{
  "request": {
    "from": {
      "fiat": "EUR"
    },
    "to": "USD"
  }
}
```

</tab>
<tab label="Solidity">

With the spoke address:

```solidity title="Spoke Address"
address spokeAddress = 0x123…;
```

Get the oracle address from the spoke and query the price.

```solidity title="Single Reserve Price"
import { ISpoke } from "aave-v4/src/spoke/interfaces/ISpoke.sol";
import { IAaveOracle } from "aave-v4/src/spoke/interfaces/IAaveOracle.sol";

address oracleAddress = ISpoke(spokeAddress).ORACLE();
IAaveOracle oracle = IAaveOracle(oracleAddress);

uint256 price = oracle.getReservePrice(reserveId);
```

```solidity title="Batch Reserve Prices"
import { ISpoke } from "aave-v4/src/spoke/interfaces/ISpoke.sol";
import { IAaveOracle } from "aave-v4/src/spoke/interfaces/IAaveOracle.sol";

address oracleAddress = ISpoke(spokeAddress).ORACLE();
IAaveOracle oracle = IAaveOracle(oracleAddress);

uint256[] memory reserveIds = new uint256[](2);
reserveIds[0] = 1;
reserveIds[1] = 2;

uint256[] memory prices = oracle.getReservesPrices(reserveIds);
```

</tab>
</tabgroup>

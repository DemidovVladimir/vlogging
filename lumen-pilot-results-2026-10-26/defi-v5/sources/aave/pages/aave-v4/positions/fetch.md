# User Positions

Learn how to fetch and monitor user positions on Aave v4.

---

Each user position captures a user’s activity within a Spoke, simplifying health and performance tracking.

## User Positions

### Data Structure

User position data provides comprehensive information about a user's lending and borrowing activity on a specific spoke, including:

- Identification: id, user, spoke, creation timestamp
- Position balances: supplied amounts, collateral amounts, debt amounts, net balances
- Yield information: supply APY, borrow APY, net APY, net interests
- Risk metrics: health factor, user risk premium breakdown, liquidation price, maximum and remaining borrowing power
- Performance data: net balance percentage changes over time

<tabgroup>
<tab label="TypeScript">

The following TypeScript interfaces illustrate the core UserPosition type:

```ts title="UserPosition"
interface UserPosition {
  __typename: "UserPosition";
  id: UserPositionId;
  user: EvmAddress;
  createdAt: Date;
  spoke: Spoke;
  totalSupplied: ExchangeAmountWithChange;
  totalCollateral: ExchangeAmountWithChange;
  totalDebt: ExchangeAmountWithChange;
  netBalance: ExchangeAmountWithChange;
  netCollateral: ExchangeAmountWithChange;
  netApy: PercentNumber;
  netSupplyApy: PercentNumberWithChange;
  netBorrowApy: PercentNumberWithChange;
  netAccruedInterest: ExchangeAmount;
  healthFactor: HealthFactorWithChange;
  riskPremium: UserPositionRiskPremium | null;
  liquidationPrice: ExchangeAmount | null;
  maxBorrowingPower: ExchangeAmount;
  remainingBorrowingPower: ExchangeAmount;
  canUpdateDynamicConfig: boolean;
  netBalancePercentChange: PercentNumber;
  averageCollateralFactor: PercentNumber;
}
```

```ts title="UserPositionRiskPremium"
interface UserPositionRiskPremium {
  __typename: "UserPositionRiskPremium";
  current: PercentNumber;
  latest: PercentNumber;
  breakdown: UserRiskPremiumBreakdownItem[];
}

interface UserRiskPremiumBreakdownItem {
  __typename: "UserRiskPremiumBreakdownItem";
  token: Erc20Token;
  currentRiskPremiumWeight: PercentNumber;
  latestRiskPremiumWeight: PercentNumber;
  collateral: PercentNumber;
}
```

```ts title="HealthFactorWithChange"
interface HealthFactorWithChange {
  __typename: "HealthFactorWithChange";
  current: BigDecimal | null;
  change: PercentNumber;
}
```

```ts title="Others"
interface ExchangeAmountWithChange {
  __typename: "ExchangeAmountWithChange";
  current: ExchangeAmount;
  change: PercentNumber;
}

interface ExchangeAmount {
  __typename: "ExchangeAmount";
  value: BigDecimal;
  name: string;
  symbol: string;
  icon: string;
  decimals: number;
}

interface PercentNumberWithChange {
  __typename: "PercentNumberWithChange";
  current: PercentNumber;
  change: PercentNumber;
}
```

</tab>
<tab label="GraphQL">

The following GraphQL fragments illustrate the core UserPosition type:

```graphql title="UserPosition"
fragment UserPosition on UserPosition {
  __typename
  id
  user
  createdAt
  spoke {
    ...Spoke
  }
  totalSupplied {
    ...ExchangeAmountWithChange
  }
  totalCollateral {
    ...ExchangeAmountWithChange
  }
  totalDebt {
    ...ExchangeAmountWithChange
  }
  netBalance {
    ...ExchangeAmountWithChange
  }
  netCollateral {
    ...ExchangeAmountWithChange
  }
  netAccruedInterest {
    ...ExchangeAmount
  }
  netApy {
    ...PercentNumber
  }
  netSupplyApy {
    ...PercentNumberWithChange
  }
  netBorrowApy {
    ...PercentNumberWithChange
  }
  healthFactor {
    ...HealthFactorWithChange
  }
  riskPremium {
    ...UserPositionRiskPremium
  }
  liquidationPrice {
    ...ExchangeAmount
  }
  maxBorrowingPower {
    ...ExchangeAmount
  }
  remainingBorrowingPower {
    ...ExchangeAmount
  }
  canUpdateDynamicConfig
  netBalancePercentChange {
    ...PercentNumber
  }
  averageCollateralFactor {
    ...PercentNumber
  }
}
```

```graphql title="UserPositionRiskPremium"
fragment UserPositionRiskPremium on UserPositionRiskPremium {
  __typename
  current {
    ...PercentNumber
  }
  latest {
    ...PercentNumber
  }
  breakdown {
    ...UserRiskPremiumBreakdownItem
  }
}

fragment UserRiskPremiumBreakdownItem on UserRiskPremiumBreakdownItem {
  __typename
  token {
    ...Erc20Token
  }
  currentRiskPremiumWeight {
    ...PercentNumber
  }
  latestRiskPremiumWeight {
    ...PercentNumber
  }
  collateral {
    ...PercentNumber
  }
}
```

```graphql title="HealthFactorWithChange"
fragment HealthFactorWithChange on HealthFactorWithChange {
  __typename
  current
  change {
    ...PercentNumber
  }
}
```

```graphql title="Others"
fragment ExchangeAmountWithChange on ExchangeAmountWithChange {
  __typename
  current {
    ...ExchangeAmount
  }
  change {
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

fragment PercentNumberWithChange on PercentNumberWithChange {
  __typename
  current {
    ...PercentNumber
  }
  change {
    ...PercentNumber
  }
}
```

</tab>
<tab label="Solidity">

A user's position lives inside the spoke contract. The `ISpoke` interface exposes the user's share balances and risk metrics.

```solidity title="UserPosition Struct"
struct UserPosition {
  uint120 drawnShares;
  uint120 premiumShares;
  int200 premiumOffsetRay;
  uint120 suppliedShares;
  uint24 dynamicConfigKey;
}
```

```solidity title="UserAccountData Struct"
struct UserAccountData {
  uint256 riskPremium;
  uint256 avgCollateralFactor;
  uint256 healthFactor;
  uint256 totalCollateralValue;
  uint256 totalDebtValue;
  uint256 activeCollateralCount;
  uint256 borrowedCount;
}
```

</tab>
</tabgroup>
See the [Spoke Data Structure](../liquidity/spokes#spoke-data-structure) for more details.

### Listing User Positions

Fetch all user positions with filtering and ordering options.

<tabgroup>
<tab label="React">

Use the `useUserPositions` hook to fetch positions for a given user address.

```tsx title="Loading State"
import { type UserPositionsRequest, useUserPositions } from "@aave/react";

function UserPositionsList({ request }: { request: UserPositionsRequest }) {
  const { data, loading, error } = useUserPositions(request);

  if (loading) return <div>Loading…</div>;

  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {data.map((position) => (
        <div key={position.id}>
          <h3>Position on {position.spoke.name}</h3>
          Chain: {position.spoke.chain.name}
        </div>
      ))}
    </div>
  );
}
```

```tsx title="React Suspense"
import { type UserPositionsRequest, useUserPositions } from "@aave/react";

function UserPositionsList({ request }: { request: UserPositionsRequest }) {
  const { data } = useUserPositions({
    ...request,
    suspense: true,
  });

  return (
    <div>
      {data.map((position) => (
        <div key={position.id}>
          <h3>Position on {position.spoke.name}</h3>
          Chain: {position.spoke.chain.name}
        </div>
      ))}
    </div>
  );
}
```

You can filter positions by the following criteria:

```tsx title="By Chains"
import { evmAddress, chainId } from "@aave/react";

const request: UserPositionsRequest = {
  user: evmAddress("0x456…"),
  filter: {
    chainIds: [chainId(1)],
  },
};
```

```tsx title="By Tokens"
import { evmAddress, chainId } from "@aave/react";

const request: UserPositionsRequest = {
  user: evmAddress("0x456…"),
  filter: {
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

And you can sort positions as follows:

```tsx title="By Balance"
import { OrderDirection } from "@aave/react";

const request: UserPositionsRequest = {
  user: evmAddress("0x456…"),
  filter: {
    // your filter criteria
  },
  orderBy: { balance: OrderDirection.Asc },
};
```

```tsx title="By Net APY"
import { OrderDirection } from "@aave/react";

const request: UserPositionsRequest = {
  user: evmAddress("0x456…"),
  filter: {
    // your filter criteria
  },
  orderBy: { netApy: OrderDirection.Asc },
};
```

```tsx title="By Health Factor"
import { OrderDirection } from "@aave/react";

const request: UserPositionsRequest = {
  user: evmAddress("0x456…"),
  filter: {
    // your filter criteria
  },
  orderBy: { healthFactor: OrderDirection.Asc },
};
```

```tsx title="By Net Collateral"
import { OrderDirection } from "@aave/react";

const request: UserPositionsRequest = {
  user: evmAddress("0x456…"),
  filter: {
    // your filter criteria
  },
  orderBy: { netCollateral: OrderDirection.Asc },
};
```

```tsx title="By Creation Date"
import { OrderDirection } from "@aave/react";

const request: UserPositionsRequest = {
  user: evmAddress("0x456…"),
  filter: {
    // your filter criteria
  },
  orderBy: { created: OrderDirection.Asc },
};
```

Finally, you can specify a different time window or currency for the data.

```tsx title="Custom Time Window"
import { evmAddress, chainId, TimeWindow } from "@aave/react";

const { data, error, loading } = useUserPositions({
  user: evmAddress("0x456…"),
  filter: {
    // your filter criteria
  },
  timeWindow: TimeWindow.LastWeek,
});
```

```tsx title="Custom Currency"
import { evmAddress, chainId, Currency } from "@aave/react";

const { data, error, loading } = useUserPositions({
  user: evmAddress("0x456…"),
  filter: {
    // your filter criteria
  },
  currency: Currency.Eur,
});
```

</tab>
<tab label="TypeScript">

Use the `userPositions` action to fetch positions for a given user address

```ts title="By Chains"
import { userPositions } from "@aave/client/actions";
import { evmAddress, chainId } from "@aave/client";
import { client } from "./client";

const result = await userPositions(client, {
  user: evmAddress("0x456…"),
  filter: { chainIds: [chainId(1)] },
});

if (result.isOk()) {
  console.log(result.value); // UserPosition[]
} else {
  console.error(result.error);
}
```

```ts title="By Tokens"
import { userPositions } from "@aave/client/actions";
import { evmAddress, chainId } from "@aave/client";
import { client } from "./client";

const result = await userPositions(client, {
  user: evmAddress("0x456…"),
  filter: {
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

And you can sort positions as follows:

```ts title="By Balance"
import { userPositions } from "@aave/client/actions";
import { evmAddress, chainId, OrderDirection } from "@aave/client";
import { client } from "./client";

const result = await userPositions(client, {
  user: evmAddress("0x456…"),
  filter: { chainIds: [chainId(1)] },
  orderBy: { balance: OrderDirection.Asc },
});
```

```ts title="By Net APY"
import { userPositions } from "@aave/client/actions";
import { evmAddress, chainId, OrderDirection } from "@aave/client";
import { client } from "./client";

const result = await userPositions(client, {
  user: evmAddress("0x456…"),
  filter: { chainIds: [chainId(1)] },
  orderBy: { netApy: OrderDirection.Asc },
});
```

```ts title="By Health Factor"
import { userPositions } from "@aave/client/actions";
import { evmAddress, chainId, OrderDirection } from "@aave/client";
import { client } from "./client";

const result = await userPositions(client, {
  user: evmAddress("0x456…"),
  filter: { chainIds: [chainId(1)] },
  orderBy: { healthFactor: OrderDirection.Asc },
});
```

```ts title="By Net Collateral"
import { userPositions } from "@aave/client/actions";
import { evmAddress, chainId, OrderDirection } from "@aave/client";
import { client } from "./client";

const result = await userPositions(client, {
  user: evmAddress("0x456…"),
  filter: { chainIds: [chainId(1)] },
  orderBy: { netCollateral: OrderDirection.Asc },
});
```

```ts title="By Creation Date"
import { userPositions } from "@aave/client/actions";
import { evmAddress, chainId, OrderDirection } from "@aave/client";
import { client } from "./client";

const result = await userPositions(client, {
  user: evmAddress("0x456…"),
  filter: { chainIds: [chainId(1)] },
  orderBy: { created: OrderDirection.Asc },
});
```

Finally, you can specify a different time window or currency for the data.

```ts title="Custom Time Window"
import { userPositions } from "@aave/client/actions";
import { evmAddress, chainId, TimeWindow } from "@aave/client";
import { client } from "./client";

const result = await userPositions(
  client,
  {
    user: evmAddress("0x456…"),
    filter: { chainIds: [chainId(1)] },
  },
  {
    timeWindow: TimeWindow.LastWeek,
  }
);
```

```ts title="Custom Currency"
import { userPositions } from "@aave/client/actions";
import { evmAddress, chainId, Currency } from "@aave/client";
import { client } from "./client";

const result = await userPositions(
  client,
  {
    user: evmAddress("0x456…"),
    filter: { chainIds: [chainId(1)] },
  },
  {
    currency: Currency.Eur,
  }
);
```

</tab>
<tab label="GraphQL">

Use the `userPositions` query to fetch positions for a given user address.

```graphql title="Query"
query (
  $request: UserPositionsRequest!
  $currency: Currency! = USD
  $window: TimeWindow! = LAST_DAY
) {
  userPositions(request: $request) {
    id
    user
    createdAt
    spoke {
      ...Spoke
    }
    totalSupplied(currency: $currency) {
      ...ExchangeAmountWithChange
    }
    totalCollateral(currency: $currency) {
      ...ExchangeAmountWithChange
    }
    totalDebt(currency: $currency) {
      ...ExchangeAmountWithChange
    }
    netBalance(currency: $currency) {
      ...ExchangeAmountWithChange
    }
    netCollateral(currency: $currency) {
      ...ExchangeAmountWithChange
    }
    netApy {
      ...PercentNumber
    }
    netSupplyApy {
      ...PercentNumberWithChange
    }
    netBorrowApy {
      ...PercentNumberWithChange
    }
    healthFactor {
      ...HealthFactorWithChange
    }
    riskPremium {
      ...UserPositionRiskPremium
    }
    liquidationPrice(currency: $currency) {
      ...ExchangeAmount
    }
    maxBorrowingPower(currency: $currency) {
      ...ExchangeAmount
    }
    remainingBorrowingPower(currency: $currency) {
      ...ExchangeAmount
    }
    canUpdateDynamicConfig
    netBalancePercentChange(window: $window) {
      ...PercentNumber
    }
    averageCollateralFactor {
      ...PercentNumber
    }
  }
}
```

```graphql title="HealthFactorWithChange"
fragment HealthFactorWithChange on HealthFactorWithChange {
  __typename
  current
  change(window: $window) {
    ...PercentNumber
  }
}
```

```graphql title="ExchangeAmountWithChange"
fragment ExchangeAmountWithChange on ExchangeAmountWithChange {
  __typename
  current {
    ...ExchangeAmount
  }
  change(window: $window) {
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

```graphql title="PercentNumberWithChange"
fragment PercentNumberWithChange on PercentNumberWithChange {
  __typename
  current {
    ...PercentNumber
  }
  change(window: $window) {
    ...PercentNumber
  }
}
```

You can filter positions by the following criteria:

```json title="By Chains"
{
  "request": {
    "user": "0x456…",
    "filter": {
      "chainIds": [1]
    }
  }
}
```

```json title="By Tokens"
{
  "request": {
    "user": "0x456…",
    "filter": {
      "tokens": [
        {
          "address": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC
          "chainId": 1
        },
        {
          "address": "0x40D16FC0246aD3160Ccc09B8D0D3A2cD28aE6C2f", // GHO
          "chainId": 1
        }
      ]
    }
  }
}
```

And you can sort positions as follows:

```json title="By Balance"
{
  "request": {
    "user": "0x456…",
    "filter": { "chainIds": [1] },
    "orderBy": { "balance": "ASC" }
  }
}
```

```json title="By Net APY"
{
  "request": {
    "user": "0x456…",
    "filter": { "chainIds": [1] },
    "orderBy": { "netApy": "ASC" }
  }
}
```

```json title="By Health Factor"
{
  "request": {
    "user": "0x456…",
    "filter": { "chainIds": [1] },
    "orderBy": { "healthFactor": "ASC" }
  }
}
```

```json title="By Net Collateral"
{
  "request": {
    "user": "0x456…",
    "filter": { "chainIds": [1] },
    "orderBy": { "netCollateral": "ASC" }
  }
}
```

```json title="By Creation Date"
{
  "request": {
    "user": "0x456…",
    "filter": { "chainIds": [1] },
    "orderBy": { "created": "ASC" }
  }
}
```

Finally, you can specify a different time window or currency for the data.

```json title="Custom Currency"
{
  "request": {
    "user": "0x456…",
    "filter": { "chainIds": [1] }
  },
  "currency": "EUR"
}
```

```json title="Custom Time Window"
{
  "request": {
    "user": "0x456…",
    "filter": { "chainIds": [1] }
  },
  "window": "LAST_WEEK"
}
```

</tab>
<tab label="Solidity">

To fetch user positions onchain, iterate through each reserve listed on the spoke and fetch the record for the target user.

```solidity title="Get User Positions"
import { ISpoke } from "aave-v4/src/spoke/interfaces/ISpoke.sol";

function getUserPositions(
  address spokeAddress,
  address user
) external view returns (ISpoke.UserPosition[] memory) {
  ISpoke spoke = ISpoke(spokeAddress);
  uint256 reserveCount = spoke.getReserveCount();

  ISpoke.UserPosition[] memory positions = new ISpoke.UserPosition[](reserveCount);

  for (uint256 reserveId = 0; reserveId < reserveCount; reserveId++) {
    positions[reserveId] = spoke.getUserPosition(reserveId, user);
  }

  return positions;
}
```

You can also pull aggregate risk metrics directly:

```solidity title="Get User Account Summary"
import { ISpoke } from "aave-v4/src/spoke/interfaces/ISpoke.sol";

function getUserAccountSummary(
  address spokeAddress,
  address user
) external view returns (ISpoke.UserAccountData memory) {
  ISpoke spoke = ISpoke(spokeAddress);
  return spoke.getUserAccountData(user);
}
```

</tab>
</tabgroup>
### Fetching a Single Position

Fetch a specific user position.

<tabgroup>
<tab label="React">

Use the `useUserPosition` hook to fetch a specific user position.

```tsx title="Loading State"
import { type UserPositionRequest, useUserPosition } from "@aave/react";

function UserPositionDetail({ request }: { request: UserPositionRequest }) {
  const { data, loading, error } = useUserPosition(request);

  if (loading) return <div>Loading…</div>;

  if (error) return <div>Error: {error.message}</div>;

  if (!data) return <div>Position not found</div>;

  return (
    <div>
      <h2>Position {data.id}</h2>
      Net Balance: {data.netBalance.amount.value.toDisplayString(2)}
      Health Factor: {data.healthFactor.value.toFixed(2)}
    </div>
  );
}
```

```tsx title="React Suspense"
import { type UserPositionRequest, useUserPosition } from "@aave/react";

function UserPositionDetail({ request }: { request: UserPositionRequest }) {
  const { data } = useUserPosition({
    ...request,
    suspense: true,
  });

  if (!data) return <div>Position not found</div>;

  return (
    <div>
      <h2>Position {data.id}</h2>
      Net Balance: {data.netBalance.amount.value.toDisplayString(2)}
      Health Factor: {data.healthFactor.value.toFixed(2)}
    </div>
  );
}
```

See below for examples of `UserPositionRequest` objects.

```tsx title="By Position ID"
import { userPositionId } from "@aave/react";

const request: UserPositionRequest = {
  id: userPositionId(params.id), // UserPositionId - typically from URL params
};
```

```tsx title="By User & Spoke"
import { evmAddress } from "@aave/react";

const request: UserPositionRequest = {
  userSpoke: {
    user: evmAddress("0x456…"),
    spoke: spoke.id,
  },
};
```

And you can specify a different time window or currency for the data.

```tsx title="Custom Time Window"
import { TimeWindow } from "@aave/react";

const { data, error, loading } = useUserPosition({
  // your query criteria
  timeWindow: TimeWindow.LastWeek,
});
```

```tsx title="Custom Currency"
import { Currency } from "@aave/react";

const { data, error, loading } = useUserPosition({
  // your query criteria
  currency: Currency.Eur,
});
```

</tab>
<tab label="TypeScript">

Use the `userPosition` action to fetch a specific user position.

```ts title="By User & Spoke"
import { userPosition } from "@aave/client/actions";
import { evmAddress } from "@aave/client";
import { client } from "./client";

const result = await userPosition(client, {
  userSpoke: {
    user: evmAddress("0x456…"),
    spoke: spoke.id,
  },
});

if (result.isOk()) {
  console.log(result.value); // UserPosition | null
} else {
  console.error(result.error);
}
```

```ts title="By Position ID"
import { userPosition } from "@aave/client/actions";
import type { UserPositionId } from "@aave/client";
import { client } from "./client";

// const id: UserPositionId = "SGVsbG8h";

const result = await userPosition(client, { id });
```

```ts title="Custom Time Window"
import { userPosition } from "@aave/client/actions";
import { TimeWindow } from "@aave/client";
import { client } from "./client";

const result = await userPosition(
  client,
  {
    // your query criteria
  },
  {
    timeWindow: TimeWindow.LastWeek,
  }
);
```

```ts title="Custom Currency"
import { userPosition } from "@aave/client/actions";
import { Currency } from "@aave/client";
import { client } from "./client";

const result = await userPosition(
  client,
  {
    // your query criteria
  },
  {
    currency: Currency.Eur,
  }
);
```

</tab>
<tab label="GraphQL">

Use the `userPosition` query to fetch a specific user position.

```graphql title="Query"
query (
  $request: UserPositionRequest!
  $currency: Currency! = USD
  $window: TimeWindow! = LAST_DAY
) {
  userPosition(request: $request) {
    id
    user
    createdAt
    spoke {
      ...Spoke
    }
    totalSupplied(currency: $currency) {
      ...ExchangeAmountWithChange
    }
    totalCollateral(currency: $currency) {
      ...ExchangeAmountWithChange
    }
    totalDebt(currency: $currency) {
      ...ExchangeAmountWithChange
    }
    netBalance(currency: $currency) {
      ...ExchangeAmountWithChange
    }
    netCollateral(currency: $currency) {
      ...ExchangeAmountWithChange
    }
    netApy {
      ...PercentNumber
    }
    netSupplyApy {
      ...PercentNumberWithChange
    }
    netBorrowApy {
      ...PercentNumberWithChange
    }
    healthFactor {
      ...HealthFactorWithChange
    }
    riskPremium {
      ...UserPositionRiskPremium
    }
    liquidationPrice(currency: $currency) {
      ...ExchangeAmount
    }
    maxBorrowingPower(currency: $currency) {
      ...ExchangeAmount
    }
    remainingBorrowingPower(currency: $currency) {
      ...ExchangeAmount
    }
    canUpdateDynamicConfig
    netBalancePercentChange(window: $window) {
      ...PercentNumber
    }
    averageCollateralFactor {
      ...PercentNumber
    }
  }
}
```

```graphql title="HealthFactorWithChange"
fragment HealthFactorWithChange on HealthFactorWithChange {
  __typename
  current
  change(window: $window) {
    ...PercentNumber
  }
}
```

```graphql title="ExchangeAmountWithChange"
fragment ExchangeAmountWithChange on ExchangeAmountWithChange {
  __typename
  current {
    ...ExchangeAmount
  }
  change(window: $window) {
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

```graphql title="PercentNumberWithChange"
fragment PercentNumberWithChange on PercentNumberWithChange {
  __typename
  current {
    ...PercentNumber
  }
  change(window: $window) {
    ...PercentNumber
  }
}
```

Query by user and spoke or by position ID using the `request` field.

```json title="By User & Spoke"
{
  "request": {
    "userSpoke": {
      "user": "0x456…",
      "spoke": "SGVsbG8h"
    }
  }
}
```

```json title="By Position ID"
{
  "request": {
    "id": "SGVsbG8h"
  }
}
```

```json title="Custom Currency"
{
  "request": {
    // your query criteria
  },
  "currency": "EUR"
}
```

```json title="Custom Time Window"
{
  "request": {
    // your query criteria
  },
  "window": "LAST_WEEK"
}
```

</tab>
<tab label="Solidity">

Positions are identified by the spoke’s `reserveId` and the user address onchain. To inspect a single position, call `getUserPosition` on the spoke with the reserve ID and user address.

```solidity title="Get Single User Position"
import { ISpoke } from "aave-v4/src/spoke/interfaces/ISpoke.sol";

function getUserPosition(
  address spokeAddress,
  uint256 reserveId,
  address user
) external view returns (
  ISpoke.UserPosition memory position,
  bool isBorrowing,
  bool usingAsCollateral
) {
  ISpoke spoke = ISpoke(spokeAddress);

  position = spoke.getUserPosition(reserveId, user);
  isBorrowing = spoke.isBorrowing(reserveId, user);
  usingAsCollateral = spoke.isUsingAsCollateral(reserveId, user);

  return (position, isBorrowing, usingAsCollateral);
}
```

</tab>
</tabgroup>
## User Supplies

### Data Structure

User supply data provides detailed information about individual user supplies within a spoke, including:

- Reserve details: token information, supply APY, lending limits
- Position amounts: current balance, principal, earned interest, and withdrawable amounts
- Collateral status: whether the supply is used as collateral
- Performance metrics: earned interest over time

<tabgroup>
<tab label="TypeScript">

The following TypeScript interfaces illustrate the UserSupplyItem type:

```ts title="UserSupplyItem"
interface UserSupplyItem {
  __typename: "UserSupplyItem";
  id: UserSupplyItemId;
  reserve: Reserve;
  principal: Erc20Amount;
  balance: Erc20Amount;
  withdrawable: Erc20Amount;
  interest: Erc20Amount;
  isCollateral: boolean;
}
```

</tab>
<tab label="GraphQL">

The following GraphQL fragments illustrate the UserSupplyItem type:

```graphql title="UserSupplyItem"
fragment UserSupplyItem on UserSupplyItem {
  __typename
  id
  reserve {
    ...Reserve
  }
  principal {
    ...Erc20Amount
  }
  balance {
    ...Erc20Amount
  }
  withdrawable {
    ...Erc20Amount
  }
  interest {
    ...Erc20Amount
  }
  isCollateral
}
```

</tab>
</tabgroup>
See the [Reserve Data Structure](../liquidity/reserves#reserve-data-structure) for more details.

### Fetching User Supplies

Fetch user supplies within a specific spoke.

<tabgroup>
<tab label="React">

Use the `useUserSupplies` hook to fetch user supplies for a user.

```tsx title="Loading State"
import { type UserSuppliesRequest, useUserSupplies } from "@aave/react";

function UserSuppliesList({ request }: { request: UserSuppliesRequest }) {
  const { data, loading, error } = useUserSupplies(request);

  if (loading) return <div>Loading…</div>;

  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {data.map((supply) => (
        <div key={supply.id}>
          <h3>{supply.reserve.asset.underlying.info.name}</h3>
          Amount: {supply.withdrawable.amount.value.toDisplayString(2)}
        </div>
      ))}
    </div>
  );
}
```

```tsx title="React Suspense"
import { type UserSuppliesRequest, useUserSupplies } from "@aave/react";

function UserSuppliesList({ request }: { request: UserSuppliesRequest }) {
  const { data } = useUserSupplies({
    ...request,
    suspense: true,
  });

  return (
    <div>
      {data.map((supply) => (
        <div key={supply.id}>
          <h3>{supply.reserve.asset.underlying.info.name}</h3>
          Amount: {supply.withdrawable.amount.value.toDisplayString(2)}
        </div>
      ))}
    </div>
  );
}
```

See below for examples of `UserSuppliesRequest` objects.

```tsx title="By Position ID"
const request: UserSuppliesRequest = {
  query: {
    userPositionId: position.id, // position: UserPosition
  },
};
```

```tsx title="By Spoke"
import { evmAddress } from "@aave/react";

const request: UserSuppliesRequest = {
  query: {
    userSpoke: {
      user: evmAddress("0x456…"),
      spoke: spoke.id, // spoke: Spoke
    },
  },
};
```

```tsx title="By Chain IDs"
import { evmAddress, chainId } from "@aave/react";

const request: UserSuppliesRequest = {
  query: {
    userChains: {
      user: evmAddress("0x456…"),
      chainIds: [chainId(1)],
    },
  },
};
```

```tsx title="By Hub"
import { evmAddress } from "@aave/react";

const request: UserSuppliesRequest = {
  query: {
    userHub: {
      user: evmAddress("0x456…"),
      hub: {
        id: hub.id, // hub: Hub
      },
    },
  },
};
```

```tsx title="By Symbol Across Chains"
import { chainId, evmAddress } from "@aave/react";

const request: UserSuppliesRequest = {
  query: {
    userSymbol: {
      user: evmAddress("0x456…"),
      symbol: "USDC",
      chainIds: [chainId(1), chainId(43114)], // optional; omit to match all chains
    },
  },
};
```

Sort user supplies by asset name, amount, or supply APY.

```tsx title="By Asset Name"
import { OrderDirection } from "@aave/react";

const request: UserSuppliesRequest = {
  query: {
    // your query criteria
  },
  orderBy: { assetName: OrderDirection.Asc },
};
```

```tsx title="By Amount"
import { OrderDirection } from "@aave/react";

const request: UserSuppliesRequest = {
  query: {
    // your query criteria
  },
  orderBy: { amount: OrderDirection.Desc },
};
```

```tsx title="By APY"
import { OrderDirection } from "@aave/react";

const request: UserSuppliesRequest = {
  query: {
    // your query criteria
  },
  orderBy: { apy: OrderDirection.Desc },
};
```

Include zero-value entries for all other supply reserves available on the same spoke, typically ordered by descending amount.

```tsx title="Include Zero Balances"
import { OrderDirection } from "@aave/react";

const request: UserSuppliesRequest = {
  query: {
    // your query criteria
  },
  includeZeroBalances: true,
  orderBy: { amount: OrderDirection.Desc },
};
```

Finally, you can specify a different time window or currency for the data.

```tsx title="Custom Time Window"
import { TimeWindow } from "@aave/react";

const { data, error, loading } = useUserSupplies({
  query: {
    // your query criteria
  },
  timeWindow: TimeWindow.LastWeek,
});
```

```tsx title="Custom Currency"
import { Currency } from "@aave/react";

const { data, error, loading } = useUserSupplies({
  query: {
    // your query criteria
  },
  currency: Currency.Eur,
});
```

</tab>
<tab label="TypeScript">

Use the `userSupplies` action to fetch user supplies for a user.

```ts title="By Position ID"
import { userSupplies } from "@aave/client/actions";
import type { UserPositionId } from "@aave/client";
import { client } from "./client";

const result = await userSupplies(client, {
  query: {
    userPositionId: position.id, // position: UserPosition
  },
});

if (result.isOk()) {
  console.log(result.value); // UserSupplyItem[]
} else {
  console.error(result.error);
}
```

```ts title="By Spoke"
import { userSupplies } from "@aave/client/actions";
import { evmAddress } from "@aave/client";
import { client } from "./client";

const result = await userSupplies(client, {
  query: {
    userSpoke: {
      user: evmAddress("0x456…"),
      spoke: spoke.id, // spoke: Spoke
    },
  },
});
```

```ts title="By Chain IDs"
import { userSupplies } from "@aave/client/actions";
import { chainId, evmAddress } from "@aave/client";
import { client } from "./client";

const result = await userSupplies(client, {
  query: {
    userChains: {
      user: evmAddress("0x456…"),
      chainIds: [chainId(1)],
    },
  },
});
```

```ts title="By Hub"
import { userSupplies } from "@aave/client/actions";
import { evmAddress } from "@aave/client";
import { client } from "./client";

const result = await userSupplies(client, {
  query: {
    userHub: {
      user: evmAddress("0x456…"),
      hub: {
        id: hub.id, // hub: Hub
      },
    },
  },
});
```

```ts title="By Symbol Across Chains"
import { userSupplies } from "@aave/client/actions";
import { chainId, evmAddress } from "@aave/client";
import { client } from "./client";

const result = await userSupplies(client, {
  query: {
    userSymbol: {
      user: evmAddress("0x456…"),
      symbol: "USDC",
      chainIds: [chainId(1), chainId(43114)], // optional; omit to match all chains
    },
  },
});
```

Sort user supplies by asset name, amount, or supply APY.

```ts title="By Asset Name"
import { userSupplies } from "@aave/client/actions";
import { OrderDirection } from "@aave/client";
import { client } from "./client";

const result = await userSupplies(client, {
  query: {
    // your query criteria
  },
  orderBy: { assetName: OrderDirection.Asc },
});
```

```ts title="By Amount"
import { userSupplies } from "@aave/client/actions";
import { OrderDirection } from "@aave/client";
import { client } from "./client";

const result = await userSupplies(client, {
  query: {
    // your query criteria
  },
  orderBy: { amount: OrderDirection.Desc },
});
```

```ts title="By APY"
import { userSupplies } from "@aave/client/actions";
import { OrderDirection } from "@aave/client";
import { client } from "./client";

const result = await userSupplies(client, {
  query: {
    // your query criteria
  },
  orderBy: { apy: OrderDirection.Desc },
});
```

Specify a different currency for displaying fiat amounts.

```ts title="Custom Currency"
import { userSupplies } from "@aave/client/actions";
import { Currency } from "@aave/client";
import { client } from "./client";

const result = await userSupplies(
  client,
  {
    query: {
      // your query criteria
    },
  },
  {
    currency: Currency.Eur,
  }
);
```

Include zero-value entries for all other supply reserves available on the same spoke, typically ordered by descending amount.

```ts title="Include Zero Balances"
import { userSupplies } from "@aave/client/actions";
import { OrderDirection } from "@aave/client";
import { client } from "./client";

const result = await userSupplies(client, {
  query: {
    // your query criteria
  },
  includeZeroBalances: true,
  orderBy: { amount: OrderDirection.Desc },
});
```

</tab>
<tab label="GraphQL">

Use the `userSupplies` query to fetch user supplies for a user.

```graphql title="Query"
query ($request: UserSuppliesRequest!, $currency: Currency! = USD) {
  userSupplies(request: $request) {
    id
    reserve {
      ...Reserve
    }
    amount {
      ...Erc20Amount
    }
    earned {
      ...Erc20Amount
    }
    isCollateral
  }
}
```

```graphql title="Erc20Amount"
fragment Erc20Amount on Erc20Amount {
  __typename
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
```

Use the `query` field to specify the fetch criteria.

```json title="By Position ID"
{
  "request": {
    "query": {
      "userPositionId": "SGVsbG8h"
    }
  }
}
```

```json title="By Spoke"
{
  "request": {
    "query": {
      "userSpoke": {
        "user": "0x456…",
        "spoke": "SGVsbG8h"
      }
    }
  }
}
```

```json title="By Chain IDs"
{
  "request": {
    "query": {
      "userChains": {
        "user": "0x456…",
        "chainIds": [1]
      }
    }
  }
}
```

```json title="By Hub"
{
  "request": {
    "query": {
      "userHub": {
        "user": "0x456…",
        "hub": {
          "id": "SGVsbG8h"
        }
      }
    }
  }
}
```

```json title="By Symbol Across Chains"
{
  "request": {
    "query": {
      "userSymbol": {
        "user": "0x456…",
        "symbol": "USDC",
        "chainIds": [1, 43114]
      }
    }
  }
}
```

Sort user supplies by asset name, amount, or supply APY.

```json title="By Asset Name"
{
  "request": {
    "query": {
      // your query criteria
    },
    "orderBy": { "assetName": "ASC" }
  }
}
```

```json title="By Amount"
{
  "request": {
    "query": {
      // your query criteria
    },
    "orderBy": { "amount": "DESC" }
  }
}
```

```json title="By APY"
{
  "request": {
    "query": {
      // your query criteria
    },
    "orderBy": { "apy": "DESC" }
  }
}
```

Finally, you can specify a different currency for displaying fiat amounts.

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

Include zero-value entries for all other supply reserves available on the same spoke, typically ordered by descending amount.

```json title="Include Zero Balances"
{
  "request": {
    "query": {
      // your query criteria
    },
    "includeZeroBalances": true,
    "orderBy": { "amount": "DESC" }
  }
}
```

</tab>
<tab label="Solidity">

Supply balances are exposed per reserve on the spoke. Loop through all reserves and inspect `suppliedShares` for the target user, converting them to asset amounts using the hub's exchange rate. Here's a complete example:

```solidity title="Get User Supplies"
import { ISpoke } from "aave-v4/src/spoke/interfaces/ISpoke.sol";
import { IHubBase } from "aave-v4/src/hub/interfaces/IHubBase.sol";

struct UserSupply {
  uint256 reserveId;
  address underlying;
  uint256 suppliedAmount;
  bool isCollateral;
}

function getUserSupplies(
  address spokeAddress,
  address user
) external view returns (UserSupply[] memory) {
  ISpoke spoke = ISpoke(spokeAddress);
  uint256 reserveCount = spoke.getReserveCount();

  UserSupply[] memory supplies = new UserSupply[](reserveCount);
  uint256 supplyCount = 0;

  for (uint256 reserveId = 0; reserveId < reserveCount; reserveId++) {
    ISpoke.UserPosition memory position = spoke.getUserPosition(reserveId, user);

    if (position.suppliedShares > 0) {
      ISpoke.Reserve memory reserve = spoke.getReserve(reserveId);
      IHubBase hub = IHubBase(address(reserve.hub));

      uint256 suppliedAmount = hub.previewAddByShares(reserve.assetId, position.suppliedShares);
      bool isCollateral = spoke.isUsingAsCollateral(reserveId, user);

      supplies[supplyCount] = UserSupply({
        reserveId: reserveId,
        underlying: reserve.underlying,
        suppliedAmount: suppliedAmount,
        isCollateral: isCollateral
      });

      supplyCount++;
    }
  }

  UserSupply[] memory result = new UserSupply[](supplyCount);
  for (uint256 i = 0; i < supplyCount; i++) {
    result[i] = supplies[i];
  }

  return result;
}
```

User positions store balances as shares. Use the hub's `previewAddByShares` to convert shares to the underlying asset amount, accounting for accrued interest.

</tab>
</tabgroup>
## User Borrows

### Data Structure

User borrow data provides detailed information about individual borrow positions within a spoke, including:

- Reserve details: token information, borrow APY, borrowing limits
- Position amounts: borrowed amounts, repaid amounts, and token details
- Debt tracking: outstanding debt and payment history
- Performance metrics: interest owed and payment progress

<tabgroup>
<tab label="TypeScript">

The following TypeScript interfaces illustrate the UserBorrowItem type:

```ts title="UserBorrowItem"
interface UserBorrowItem {
  __typename: "UserBorrowItem";
  id: UserBorrowItemId;
  reserve: Reserve;
  principal: Erc20Amount;
  debt: Erc20Amount;
  interest: Erc20Amount;
}
```

</tab>
<tab label="GraphQL">

The following GraphQL fragments illustrate the UserBorrowItem type:

```graphql title="UserBorrowItem"
fragment UserBorrowItem on UserBorrowItem {
  __typename
  id
  reserve {
    ...Reserve
  }
  principal {
    ...Erc20Amount
  }
  debt {
    ...Erc20Amount
  }
  interest {
    ...Erc20Amount
  }
}
```

</tab>
</tabgroup>
See the [Reserve Data Structure](../liquidity/reserves#reserve-data-structure) for more details.

### Fetching User Borrows

Fetch user borrows within a specific spoke.

<tabgroup>
<tab label="React">

Use the `useUserBorrows` hook to fetch borrow positions for a user.

```tsx title="Loading State"
import { type UserBorrowsRequest, useUserBorrows } from "@aave/react";

function UserBorrowsList({ request }: { request: UserBorrowsRequest }) {
  const { data, loading, error } = useUserBorrows(request);

  if (loading) return <div>Loading…</div>;

  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {data.map((borrow) => (
        <div key={borrow.id}>
          <h3>{borrow.reserve.asset.underlying.info.name}</h3>
          Amount: {borrow.debt.amount.value.toDisplayString(2)}
        </div>
      ))}
    </div>
  );
}
```

```tsx title="React Suspense"
import { type UserBorrowsRequest, useUserBorrows } from "@aave/react";

function UserBorrowsList({ request }: { request: UserBorrowsRequest }) {
  const { data } = useUserBorrows({
    ...request,
    suspense: true,
  });

  return (
    <div>
      {data.map((borrow) => (
        <div key={borrow.id}>
          <h3>{borrow.reserve.asset.underlying.info.name}</h3>
          Amount: {borrow.debt.amount.value.toDisplayString(2)}
        </div>
      ))}
    </div>
  );
}
```

See below for examples of `UserBorrowsRequest` objects.

```tsx title="By Position ID"
const request: UserBorrowsRequest = {
  query: {
    userPositionId: position.id, // position: UserPosition
  },
};
```

```tsx title="By Spoke"
import { evmAddress } from "@aave/react";

const request: UserBorrowsRequest = {
  query: {
    userSpoke: {
      user: evmAddress("0x456…"),
      spoke: spoke.id, // spoke: Spoke
    },
  },
};
```

```tsx title="By Chain IDs"
import { evmAddress, chainId } from "@aave/react";

const request: UserBorrowsRequest = {
  query: {
    userChains: {
      user: evmAddress("0x456…"),
      chainIds: [chainId(1)],
    },
  },
};
```

```tsx title="By Hub"
import { evmAddress, hubId } from "@aave/react";

const request: UserBorrowsRequest = {
  query: {
    userHub: {
      user: evmAddress("0x456…"),
      hub: {
        id: hub.id, // hub: Hub
      },
    },
  },
};
```

```tsx title="By Symbol Across Chains"
import { chainId, evmAddress } from "@aave/react";

const request: UserBorrowsRequest = {
  query: {
    userSymbol: {
      user: evmAddress("0x456…"),
      symbol: "USDC",
      chainIds: [chainId(1), chainId(43114)], // optional; omit to match all chains
    },
  },
};
```

Sort user borrows by asset name, amount, or borrow APY.

```tsx title="By Asset Name"
import { OrderDirection } from "@aave/react";

const request: UserBorrowsRequest = {
  query: {
    // your query criteria
  },
  orderBy: { assetName: OrderDirection.Asc },
};
```

```tsx title="By Amount"
import { OrderDirection } from "@aave/react";

const request: UserBorrowsRequest = {
  query: {
    // your query criteria
  },
  orderBy: { amount: OrderDirection.Desc },
};
```

```tsx title="By APY"
import { OrderDirection } from "@aave/react";

const request: UserBorrowsRequest = {
  query: {
    // your query criteria
  },
  orderBy: { apy: OrderDirection.Desc },
};
```

Finally, you can specify a different time window or currency for the data.

```tsx title="Custom Time Window"
import { TimeWindow } from "@aave/react";

const { data, error, loading } = useUserBorrows({
  query: {
    // your query criteria
  },
  timeWindow: TimeWindow.LastWeek,
});
```

```tsx title="Custom Currency"
import { Currency } from "@aave/react";

const { data, error, loading } = useUserBorrows({
  query: {
    // your query criteria
  },
  currency: Currency.Eur,
});
```

Include zero-value entries for all other borrow reserves available on the same spoke, typically ordered by descending amount.

```tsx title="Include Zero Balances"
import { OrderDirection } from "@aave/react";

const { data, error, loading } = useUserBorrows({
  query: {
    // your query criteria
  },
  includeZeroBalances: true,
  orderBy: { amount: OrderDirection.Desc },
});
```

</tab>
<tab label="TypeScript">

Use the `userBorrows` action to fetch borrow positions for a user.

```ts title="By Position ID"
import { userBorrows } from "@aave/client/actions";
import { client } from "./client";

const result = await userBorrows(client, {
  query: {
    userPositionId: position.id, // position: UserPosition
  },
});

if (result.isOk()) {
  console.log(result.value); // UserBorrowItem[]
} else {
  console.error(result.error);
}
```

```ts title="By Spoke"
import { userBorrows } from "@aave/client/actions";
import { evmAddress } from "@aave/client";
import { client } from "./client";

const result = await userBorrows(client, {
  query: {
    userSpoke: {
      user: evmAddress("0x456…"),
      spoke: spoke.id, // spoke: Spoke
    },
  },
});
```

```ts title="By Chain IDs"
import { userBorrows } from "@aave/client/actions";
import { chainId, evmAddress } from "@aave/client";
import { client } from "./client";

const result = await userBorrows(client, {
  query: {
    userChains: {
      user: evmAddress("0x456…"),
      chainIds: [chainId(1)],
    },
  },
});
```

```ts title="By Hub"
import { userBorrows } from "@aave/client/actions";
import { evmAddress, hubId } from "@aave/client";
import { client } from "./client";

const result = await userBorrows(client, {
  query: {
    userHub: {
      user: evmAddress("0x456…"),
      hub: {
        id: hub.id, // hub: Hub
      },
    },
  },
});
```

```ts title="By Symbol Across Chains"
import { userBorrows } from "@aave/client/actions";
import { chainId, evmAddress } from "@aave/client";
import { client } from "./client";

const result = await userBorrows(client, {
  query: {
    userSymbol: {
      user: evmAddress("0x456…"),
      symbol: "USDC",
      chainIds: [chainId(1), chainId(43114)], // optional; omit to match all chains
    },
  },
});
```

Sort user borrows by asset name, amount, or borrow APY.

```ts title="By Asset Name"
import { userBorrows } from "@aave/client/actions";
import { OrderDirection } from "@aave/client";
import { client } from "./client";

const result = await userBorrows(client, {
  query: {
    // your query criteria
  },
  orderBy: { assetName: OrderDirection.Asc },
});
```

```ts title="By Amount"
import { userBorrows } from "@aave/client/actions";
import { OrderDirection } from "@aave/client";
import { client } from "./client";

const result = await userBorrows(client, {
  query: {
    // your query criteria
  },
  orderBy: { amount: OrderDirection.Desc },
});
```

```ts title="By APY"
import { userBorrows } from "@aave/client/actions";
import { OrderDirection } from "@aave/client";
import { client } from "./client";

const result = await userBorrows(client, {
  query: {
    // your query criteria
  },
  orderBy: { apy: OrderDirection.Desc },
});
```

Specify a different currency for displaying fiat amounts.

```ts title="Custom Currency"
import { userBorrows } from "@aave/client/actions";
import { Currency } from "@aave/client";
import { client } from "./client";

const result = await userBorrows(
  client,
  {
    query: {
      // your query criteria
    },
  },
  {
    currency: Currency.Eur,
  }
);
```

Include zero-value entries for all other borrow reserves available on the same spoke, typically ordered by descending amount.

```ts title="Include Zero Balances"
import { userBorrows } from "@aave/client/actions";
import { OrderDirection } from "@aave/client";
import { client } from "./client";

const result = await userBorrows(client, {
  query: {
    // your query criteria
  },
  includeZeroBalances: true,
  orderBy: { amount: OrderDirection.Desc },
});
```

</tab>
<tab label="GraphQL">

Use the `userBorrows` query to fetch borrow positions for a user.

```graphql title="Query"
query ($request: UserBorrowsRequest!, $currency: Currency! = USD) {
  userBorrows(request: $request) {
    id
    reserve {
      ...Reserve
    }
    amount {
      ...Erc20Amount
    }
    paid {
      ...Erc20Amount
    }
  }
}
```

```graphql title="Erc20Amount"
fragment Erc20Amount on Erc20Amount {
  __typename
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
```

Use the `query` field to specify the fetch criteria.

```json title="By Position ID"
{
  "request": {
    "query": {
      "userPositionId": "SGVsbG8h"
    }
  }
}
```

```json title="By Spoke"
{
  "request": {
    "query": {
      "userSpoke": {
        "user": "0x456…",
        "spoke": "SGVsbG8h"
      }
    }
  }
}
```

```json title="By Chain IDs"
{
  "request": {
    "query": {
      "userChains": {
        "user": "0x456…",
        "chainIds": [1]
      }
    }
  }
}
```

```json title="By Hub"
{
  "request": {
    "query": {
      "userHub": {
        "user": "0x456…",
        "hub": {
          "id": "SGVsbG8h"
        }
      }
    }
  }
}
```

```json title="By Symbol Across Chains"
{
  "request": {
    "query": {
      "userSymbol": {
        "user": "0x456…",
        "symbol": "USDC",
        "chainIds": [1, 43114]
      }
    }
  }
}
```

Sort user borrows by asset name, amount, or borrow APY.

```json title="By Asset Name"
{
  "request": {
    "query": {
      // your query criteria
    },
    "orderBy": { "assetName": "ASC" }
  }
}
```

```json title="By Amount"
{
  "request": {
    "query": {
      // your query criteria
    },
    "orderBy": { "amount": "DESC" }
  }
}
```

```json title="By APY"
{
  "request": {
    "query": {
      // your query criteria
    },
    "orderBy": { "apy": "DESC" }
  }
}
```

Finally, you can specify a different currency for displaying fiat amounts.

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

Include zero-value entries for all other borrow reserves available on the same spoke, typically ordered by descending amount.

```json title="Include Zero Balances"
{
  "request": {
    "query": {
      // your query criteria
    },
    "includeZeroBalances": true,
    "orderBy": { "amount": "DESC" }
  }
}
```

</tab>
<tab label="Solidity">

Borrow balances are exposed per reserve on the spoke. Loop through all reserves and inspect `drawnShares` for the target user, converting them to asset amounts using the hub's exchange rate. Here's a complete example:

```solidity title="Get User Borrows"
import { ISpoke } from "aave-v4/src/spoke/interfaces/ISpoke.sol";
import { IHubBase } from "aave-v4/src/hub/interfaces/IHubBase.sol";

struct UserBorrow {
  uint256 reserveId;
  address underlying;
  uint256 borrowedAmount;
}

function getUserBorrows(
  address spokeAddress,
  address user
) external view returns (UserBorrow[] memory) {
  ISpoke spoke = ISpoke(spokeAddress);
  uint256 reserveCount = spoke.getReserveCount();

  UserBorrow[] memory borrows = new UserBorrow[](reserveCount);
  uint256 borrowCount = 0;

  for (uint256 reserveId = 0; reserveId < reserveCount; reserveId++) {
    ISpoke.UserPosition memory position = spoke.getUserPosition(reserveId, user);

    if (position.drawnShares > 0) {
      ISpoke.Reserve memory reserve = spoke.getReserve(reserveId);
      IHubBase hub = IHubBase(address(reserve.hub));

      uint256 borrowedAmount = hub.previewDrawByShares(reserve.assetId, position.drawnShares);

      borrows[borrowCount] = UserBorrow({
        reserveId: reserveId,
        underlying: reserve.underlying,
        borrowedAmount: borrowedAmount
      });

      borrowCount++;
    }
  }

  UserBorrow[] memory result = new UserBorrow[](borrowCount);
  for (uint256 i = 0; i < borrowCount; i++) {
    result[i] = borrows[i];
  }

  return result;
}
```

User positions store balances as shares. Use the hub's `previewDrawByShares` to convert shares to the underlying asset amount, accounting for accrued interest.

</tab>
</tabgroup>
## User Summary

### Data Structure

User summary data provides comprehensive information about a user's aggregated activity across all positions, including:

- Position count: total number of positions held by the user
- Portfolio totals: supplied amounts, collateral amounts, debt amounts, net balances
- Yield information: calculated net APY across all positions
- Risk metrics: lowest health factor across all positions
- Performance data: net fee earned over time

<tabgroup>
<tab label="TypeScript">

The following TypeScript interfaces illustrate the UserSummary type:

```ts title="UserSummary"
interface UserSummary {
  __typename: "UserSummary";
  totalPositions: number;
  netBalance: ExchangeAmountWithChange;
  totalCollateral: ExchangeAmount;
  totalSupplied: ExchangeAmount;
  totalDebt: ExchangeAmount;
  netApy: PercentNumber;
  netAccruedInterest: ExchangeAmount;
  lowestHealthFactor: BigDecimal | null;
}
```

```ts title="ExchangeAmountWithChange"
interface ExchangeAmountWithChange {
  __typename: "ExchangeAmountWithChange";
  current: ExchangeAmount;
  change: PercentNumber;
}
```

</tab>
<tab label="GraphQL">

The following GraphQL fragments illustrate the UserSummary type:

```graphql title="UserSummary"
fragment UserSummary on UserSummary {
  __typename
  totalPositions
  netBalance {
    ...ExchangeAmountWithChange
  }
  totalCollateral {
    ...ExchangeAmount
  }
  totalSupplied {
    ...ExchangeAmount
  }
  totalDebt {
    ...ExchangeAmount
  }
  netApy {
    ...PercentNumber
  }
  netAccruedInterest {
    ...ExchangeAmount
  }
  lowestHealthFactor
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

</tab>
</tabgroup>
### Fetching User Summary

Fetch a comprehensive financial summary for a user across all their positions.

<tabgroup>
<tab label="React">

Use the `useUserSummary` hook to fetch the financial summary for a user.

```tsx title="Loading State"
import { type UserSummaryRequest, useUserSummary } from "@aave/react";

function UserSummaryDisplay({ request }: { request: UserSummaryRequest }) {
  const { data, loading, error } = useUserSummary(request);

  if (loading) return <div>Loading…</div>;

  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h2>Financial Summary</h2>
      Total Positions: {data.totalPositions}
      <p>
        Net Balance: {data.netBalance.current.symbol}
        {data.netBalance.current.value.toDisplayString(2)}
      </p>
      <p>
        Total Supplied: {data.totalSupplied.symbol}
        {data.totalSupplied.value.toDisplayString(2)}
      </p>
      <p>
        Total Debt: {data.totalDebt.symbol}
        {data.totalDebt.value.toDisplayString(2)}
      </p>
      Net APY: {data.netApy.normalized.toFixed(2)}%
    </div>
  );
}
```

```tsx title="React Suspense"
import { type UserSummaryRequest, useUserSummary } from "@aave/react";

function UserSummaryDisplay({ request }: { request: UserSummaryRequest }) {
  const { data } = useUserSummary({
    ...request,
    suspense: true,
  });

  return (
    <div>
      <h2>Financial Summary</h2>
      Total Positions: {data.totalPositions}
      <p>
        Net Balance: {data.netBalance.current.symbol}
        {data.netBalance.current.value.toDisplayString(2)}
      </p>
      <p>
        Total Supplied: {data.totalSupplied.symbol}
        {data.totalSupplied.value.toDisplayString(2)}
      </p>
      <p>
        Total Debt: {data.totalDebt.symbol}
        {data.totalDebt.value.toDisplayString(2)}
      </p>
      Net APY: {data.netApy.normalized.toFixed(2)}%
    </div>
  );
}
```

See below for examples of `UserSummaryRequest` objects.

```tsx title="Basic Usage"
import { evmAddress } from "@aave/react";

const request: UserSummaryRequest = {
  user: evmAddress("0x456…"),
};
```

```tsx title="Filter by Spoke ID"
import { evmAddress } from "@aave/react";

const request: UserSummaryRequest = {
  user: evmAddress("0x456…"),
  filter: {
    spokeId: spoke.id,
  },
};
```

```tsx title="Filter by Chains"
import { evmAddress, chainId } from "@aave/react";

const request: UserSummaryRequest = {
  user: evmAddress("0x456…"),
  filter: {
    chainIds: [chainId(1)],
  },
};
```

```tsx title="Filter by Position ID"
import { evmAddress } from "@aave/react";

const request: UserSummaryRequest = {
  user: evmAddress("0x456…"),
  filter: {
    userPositionId: position.id,
  },
};
```

```tsx title="Filter by Spoke Details"
import { evmAddress, chainId } from "@aave/react";

const request: UserSummaryRequest = {
  user: evmAddress("0x456…"),
  filter: {
    spoke: {
      address: evmAddress("0x123…"),
      chainId: chainId(1),
    },
  },
};
```

And you can specify a different time window or currency for the data.

```tsx title="Custom Time Window"
import { TimeWindow } from "@aave/react";

const { data, error, loading } = useUserSummary({
  user: evmAddress("0x456…"),
  timeWindow: TimeWindow.LastWeek,
});
```

```tsx title="Custom Currency"
import { Currency, useUserSummary } from "@aave/react";

const { data, error, loading } = useUserSummary({
  user: evmAddress("0x456…"),
  currency: Currency.Eur,
});
```

</tab>
<tab label="TypeScript">

Use the `userSummary` action to fetch the financial summary for a user.

```ts title="Basic Usage"
import { userSummary } from "@aave/client/actions";
import { evmAddress } from "@aave/client";
import { client } from "./client";

const result = await userSummary(client, {
  user: evmAddress("0x456…"),
});

if (result.isOk()) {
  console.log(result.value); // UserSummary
} else {
  console.error(result.error);
}
```

```ts title="Filter by Spoke ID"
import { userSummary } from "@aave/client/actions";
import { evmAddress } from "@aave/client";
import { client } from "./client";

const result = await userSummary(client, {
  user: evmAddress("0x456…"),
  filter: {
    spokeId: spoke.id,
  },
});
```

```ts title="Filter by Chains"
import { userSummary } from "@aave/client/actions";
import { evmAddress, chainId } from "@aave/client";
import { client } from "./client";

const result = await userSummary(client, {
  user: evmAddress("0x456…"),
  filter: {
    chainIds: [chainId(1)],
  },
});
```

```ts title="Filter by Position ID"
import { userSummary } from "@aave/client/actions";
import { evmAddress } from "@aave/client";
import { client } from "./client";

const result = await userSummary(client, {
  user: evmAddress("0x456…"),
  filter: {
    userPositionId: position.id,
  },
});
```

```ts title="Filter by Spoke Details"
import { userSummary } from "@aave/client/actions";
import { evmAddress, chainId } from "@aave/client";
import { client } from "./client";

const result = await userSummary(client, {
  user: evmAddress("0x456…"),
  filter: {
    spoke: {
      address: evmAddress("0x123…"),
      chainId: chainId(1),
    },
  },
});
```

Specify a different time window to calculate net balance changes over different periods.

```ts title="Custom Time Window"
import { userSummary } from "@aave/client/actions";
import { TimeWindow } from "@aave/client";
import { client } from "./client";

const result = await userSummary(
  client,
  {
    user: evmAddress("0x456…"),
  },
  {
    timeWindow: TimeWindow.LastWeek,
  }
);
```

Specify a different currency for displaying fiat amounts.

```ts title="Custom Currency"
import { userSummary } from "@aave/client/actions";
import { Currency } from "@aave/client";
import { client } from "./client";

const result = await userSummary(
  client,
  {
    user: evmAddress("0x456…"),
  },
  {
    currency: Currency.Eur,
  }
);
```

</tab>
<tab label="GraphQL">

Use the `userSummary` query to fetch the financial summary for a user.

```graphql title="Query"
query (
  $request: UserSummaryRequest!
  $currency: Currency! = USD
  $window: TimeWindow! = LAST_DAY
) {
  userSummary(request: $request) {
    totalPositions
    netBalance(currency: $currency) {
      ...ExchangeAmountWithChange
    }
    totalCollateral {
      ...ExchangeAmount
    }
    totalSupplied {
      ...ExchangeAmount
    }
    totalDebt {
      ...ExchangeAmount
    }
    netApy {
      ...PercentNumber
    }
    netAccruedInterest {
      ...ExchangeAmount
    }
    lowestHealthFactor
  }
}
```

```graphql title="ExchangeAmountWithChange"
fragment ExchangeAmountWithChange on ExchangeAmountWithChange {
  __typename
  current {
    ...ExchangeAmount
  }
  change(window: $window) {
    ...PercentNumber
  }
}
```

Use the `user` field to specify the user.

```json title="Basic Request"
{
  "request": {
    "user": "0x456…"
  }
}
```

Filter the summary by specific spokes or chains using the `filter` field.

```json title="Filter by Spoke ID"
{
  "request": {
    "user": "0x456…",
    "filter": {
      "spokeId": "SGVsbG8h"
    }
  }
}
```

```json title="Filter by Chains"
{
  "request": {
    "user": "0x456…",
    "filter": {
      "chainIds": [1]
    }
  }
}
```

```json title="Filter by Position ID"
{
  "request": {
    "user": "0x456…",
    "filter": {
      "userPositionId": "SGVsbG8h"
    }
  }
}
```

```json title="Filter by Spoke Details"
{
  "request": {
    "user": "0x456…",
    "filter": {
      "spoke": { "address": "0x123…", "chainId": 1 }
    }
  }
}
```

Finally, you can specify different currencies and time windows using the `currency` and `window` fields.

```json title="Custom Currency"
{
  "request": {
    // your query criteria
  },
  "currency": "EUR"
}
```

```json title="Custom Time Window"
{
  "request": {
    // your query criteria
  },
  "window": "LAST_WEEK"
}
```

</tab>
</tabgroup>
## User Summary History

### Data Structure

User summary history data provides detailed information about a user's activity changes over time, including:

- Historical snapshots: portfolio state at different points in time
- Portfolio metrics: net balance, borrows, supplies at each snapshot
- Risk metrics: health factor changes over time

<tabgroup>
<tab label="TypeScript">

The following TypeScript interfaces illustrate the UserSummaryHistoryItem type:

```ts title="UserSummaryHistoryItem"
interface UserSummaryHistoryItem {
  __typename: "UserSummaryHistoryItem";
  netBalance: ExchangeAmount;
  borrows: ExchangeAmount;
  supplies: ExchangeAmount;
  healthFactor: BigDecimal | null;
  date: Date;
}
```

</tab>
<tab label="GraphQL">

The following GraphQL fragments illustrate the UserSummaryHistoryItem type:

```graphql title="UserSummaryHistoryItem"
fragment UserSummaryHistoryItem on UserSummaryHistoryItem {
  __typename
  netBalance {
    ...ExchangeAmount
  }
  borrows {
    ...ExchangeAmount
  }
  supplies {
    ...ExchangeAmount
  }
  healthFactor
  date
}
```

</tab>
</tabgroup>
### Fetching User Summary History

Fetch historical financial data for a user over a specified time window.

<tabgroup>
<tab label="React">

Use the `useUserSummaryHistory` hook to fetch historical financial data for a user.

```tsx title="Loading State"
import {
  type UserSummaryHistoryRequest,
  useUserSummaryHistory,
} from "@aave/react";

function UserSummaryHistory({
  request,
}: {
  request: UserSummaryHistoryRequest;
}) {
  const { data, loading, error } = useUserSummaryHistory(request);

  if (loading) return <div>Loading…</div>;

  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h2>Financial History</h2>
      {data.map((item) => (
        <div key={item.date.toString()}>
          Date: {item.date.toLocaleDateString()}
          <p>
            Net Balance: {item.netBalance.symbol}
            {item.netBalance.value.toDisplayString(2)}
          </p>
          <p>
            Supplies: {item.supplies.symbol}
            {item.supplies.value.toDisplayString(2)}
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

```tsx title="React Suspense"
import {
  type UserSummaryHistoryRequest,
  useUserSummaryHistory,
} from "@aave/react";

function UserSummaryHistory({
  request,
}: {
  request: UserSummaryHistoryRequest;
}) {
  const { data } = useUserSummaryHistory({
    ...request,
    suspense: true,
  });

  return (
    <div>
      <h2>Financial History</h2>
      {data.map((item) => (
        <div key={item.date.toString()}>
          Date: {item.date.toLocaleDateString()}
          <p>
            Net Balance: {item.netBalance.symbol}
            {item.netBalance.value.toDisplayString(2)}
          </p>
          <p>
            Supplies: {item.supplies.symbol}
            {item.supplies.value.toDisplayString(2)}
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

See below for examples of `UserSummaryHistoryRequest` objects.

```tsx title="Last Day"
import { evmAddress, TimeWindow } from "@aave/react";

const request: UserSummaryHistoryRequest = {
  user: evmAddress("0x456…"),
  window: TimeWindow.LastDay,
};
```

```tsx title="Last Week"
import { evmAddress, TimeWindow } from "@aave/react";

const request: UserSummaryHistoryRequest = {
  user: evmAddress("0x456…"),
  window: TimeWindow.LastWeek,
};
```

```tsx title="Last Month"
import { evmAddress, TimeWindow } from "@aave/react";

const request: UserSummaryHistoryRequest = {
  user: evmAddress("0x456…"),
  window: TimeWindow.LastMonth,
};
```

Filter the history by specific spokes or chains.

```tsx title="Filter by Spoke ID"
import { evmAddress, TimeWindow } from "@aave/react";

const request: UserSummaryHistoryRequest = {
  user: evmAddress("0x456…"),
  window: TimeWindow.LastWeek,
  filter: {
    spokeId: spoke.id,
  },
};
```

```tsx title="Filter by Chains"
import { evmAddress, chainId, TimeWindow } from "@aave/react";

const request: UserSummaryHistoryRequest = {
  user: evmAddress("0x456…"),
  window: TimeWindow.LastWeek,
  filter: {
    chainIds: [chainId(1)],
  },
};
```

```tsx title="Filter by Position ID"
import { evmAddress, TimeWindow } from "@aave/react";

const request: UserSummaryHistoryRequest = {
  user: evmAddress("0x456…"),
  window: TimeWindow.LastWeek,
  filter: {
    userPositionId: position.id,
  },
};
```

```tsx title="Filter by Spoke Details"
import { evmAddress, chainId, TimeWindow } from "@aave/react";

const request: UserSummaryHistoryRequest = {
  user: evmAddress("0x456…"),
  window: TimeWindow.LastWeek,
  filter: {
    spoke: {
      address: evmAddress("0x123…"),
      chainId: chainId(1),
    },
  },
};
```

Specify a different currency for displaying fiat amounts.

```tsx title="Custom Currency"
import { Currency, evmAddress, TimeWindow } from "@aave/react";

const { data, error, loading } = useUserSummaryHistory({
  user: evmAddress("0x456…"),
  window: TimeWindow.LastWeek,
  currency: Currency.Eur,
});
```

</tab>
<tab label="TypeScript">

Use the `userSummaryHistory` action to fetch historical financial data for a user.

```ts title="Last Day"
import { userSummaryHistory } from "@aave/client/actions";
import { evmAddress, TimeWindow } from "@aave/client";
import { client } from "./client";

const result = await userSummaryHistory(client, {
  user: evmAddress("0x456…"),
  window: TimeWindow.LastDay,
});

if (result.isOk()) {
  console.log(result.value); // UserSummaryHistoryItem[]
} else {
  console.error(result.error);
}
```

```ts title="Last Week"
import { userSummaryHistory } from "@aave/client/actions";
import { evmAddress, TimeWindow } from "@aave/client";
import { client } from "./client";

const result = await userSummaryHistory(client, {
  user: evmAddress("0x456…"),
  window: TimeWindow.LastWeek,
});
```

```ts title="Last Month"
import { userSummaryHistory } from "@aave/client/actions";
import { evmAddress, TimeWindow } from "@aave/client";
import { client } from "./client";

const result = await userSummaryHistory(client, {
  user: evmAddress("0x456…"),
  window: TimeWindow.LastMonth,
});
```

Filter the history by specific spokes or chains.

```ts title="Filter by Spoke ID"
import { userSummaryHistory } from "@aave/client/actions";
import { evmAddress, TimeWindow } from "@aave/client";
import { client } from "./client";

const result = await userSummaryHistory(client, {
  user: evmAddress("0x456…"),
  window: TimeWindow.LastWeek,
  filter: {
    spokeId: spoke.id,
  },
});
```

```ts title="Filter by Chains"
import { userSummaryHistory } from "@aave/client/actions";
import { evmAddress, chainId, TimeWindow } from "@aave/client";
import { client } from "./client";

const result = await userSummaryHistory(client, {
  user: evmAddress("0x456…"),
  window: TimeWindow.LastWeek,
  filter: {
    chainIds: [chainId(1)],
  },
});
```

```ts title="Filter by Position ID"
import { userSummaryHistory } from "@aave/client/actions";
import { evmAddress, TimeWindow } from "@aave/client";
import { client } from "./client";

const result = await userSummaryHistory(client, {
  user: evmAddress("0x456…"),
  window: TimeWindow.LastWeek,
  filter: {
    userPositionId: position.id,
  },
});
```

```ts title="Filter by Spoke Details"
import { userSummaryHistory } from "@aave/client/actions";
import { evmAddress, chainId, TimeWindow } from "@aave/client";
import { client } from "./client";

const result = await userSummaryHistory(client, {
  user: evmAddress("0x456…"),
  window: TimeWindow.LastWeek,
  filter: {
    spoke: {
      address: evmAddress("0x123…"),
      chainId: chainId(1),
    },
  },
});
```

Specify a different currency for displaying fiat amounts.

```ts title="Custom Currency"
import { userSummaryHistory } from "@aave/client/actions";
import { evmAddress, TimeWindow, Currency } from "@aave/client";
import { client } from "./client";

const result = await userSummaryHistory(
  client,
  {
    user: evmAddress("0x456…"),
    window: TimeWindow.LastWeek,
  },
  {
    currency: Currency.Eur,
  }
);
```

</tab>
<tab label="GraphQL">

Use the `userSummaryHistory` query to fetch historical financial data for a user.

```graphql title="Query"
query ($request: UserSummaryHistoryRequest!, $currency: Currency! = USD) {
  userSummaryHistory(request: $request) {
    netBalance(currency: $currency) {
      ...ExchangeAmount
    }
    borrows(currency: $currency) {
      ...ExchangeAmount
    }
    supplies(currency: $currency) {
      ...ExchangeAmount
    }
    healthFactor
    date
  }
}
```

Use the `user` and `window` fields to specify the user and time period.

```json title="Last Day"
{
  "request": {
    "user": "0x456…",
    "window": "LAST_DAY"
  }
}
```

```json title="Last Week"
{
  "request": {
    "user": "0x456…",
    "window": "LAST_WEEK"
  }
}
```

```json title="Last Month"
{
  "request": {
    "user": "0x456…",
    "window": "LAST_MONTH"
  }
}
```

Filter the history by specific spokes or chains using the `filter` field.

```json title="Filter by Spoke ID"
{
  "request": {
    "user": "0x456…",
    "window": "LAST_WEEK",
    "filter": {
      "spokeId": "SGVsbG8h"
    }
  }
}
```

```json title="Filter by Chains"
{
  "request": {
    "user": "0x456…",
    "window": "LAST_WEEK",
    "filter": {
      "chainIds": [1]
    }
  }
}
```

```json title="Filter by Position ID"
{
  "request": {
    "user": "0x456…",
    "window": "LAST_WEEK",
    "filter": {
      "userPositionId": "SGVsbG8h"
    }
  }
}
```

```json title="Filter by Spoke Details"
{
  "request": {
    "user": "0x456…",
    "window": "LAST_WEEK",
    "filter": {
      "spoke": { "address": "0x123…", "chainId": 1 }
    }
  }
}
```

Finally, you can specify a different currency for displaying fiat amounts.

```json title="Custom Currency"
{
  "request": {
    // your query criteria
  },
  "currency": "EUR"
}
```

</tab>
</tabgroup>

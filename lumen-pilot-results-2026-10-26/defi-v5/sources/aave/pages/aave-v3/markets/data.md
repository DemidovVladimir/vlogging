# Markets Data

Learn how to discover available markets and access detailed market information in Aave.

## Market Structure

Aave market data provides comprehensive information about lending pools across different chains, including:

- Market identification (name, chain, address)
- The reserves in the market
- Efficiency mode (eMode) categories and configurations
- Market metrics (total size, available liquidity)

When you provide a user account address, the data also includes user-specific information such as net worth, health factor, and current positions.

<tabgroup>
<tab label="TypeScript">

The following TypeScript interfaces illustrate the core Market type and its related types:

```ts title="Market"
interface Market {
  name: string;
  chain: Chain;
  address: EvmAddress;
  icon: string;
  totalMarketSize: BigDecimal;
  totalAvailableLiquidity: BigDecimal;
  eModeCategories: EmodeMarketCategory[];
  userState?: MarketUserState;
  borrowReserves: Reserve[];
  supplyReserves: Reserve[];
}
```

```ts title="EmodeMarketCategory"
interface EmodeMarketCategory {
  id: number;
  label: string;
  maxLTV: PercentValue;
  liquidationThreshold: PercentValue;
  liquidationPenalty: PercentValue;
}
```

```ts title="MarketUserState"
interface MarketUserState {
  netWorth: BigDecimal;
  netAPY: PercentValue;
  healthFactor: BigDecimal;
  eModeEnabled: boolean;
  totalCollateralBase: BigDecimal;
  totalDebtBase: BigDecimal;
  availableBorrowsBase: BigDecimal;
  currentLiquidationThreshold: PercentValue;
  ltv: PercentValue;
  isInIsolationMode: boolean;
}
```

```ts title="EmodeReserveInfo"
interface EmodeReserveInfo {
  categoryId: number;
  label: string;
  maxLTV: PercentValue;
  liquidationThreshold: PercentValue;
  liquidationPenalty: PercentValue;
}
```

</tab>
<tab label="GraphQL">

The following GraphQL fragments illustrate the core Market type and its related types:

```graphql title="Market"
fragment Market on Market {
  __typename
  name
  chain {
    ...Chain
  }
  address
  icon
  totalMarketSize
  totalAvailableLiquidity
  eModeCategories {
    ...EmodeMarketCategory
  }
  userState {
    ...MarketUserState
  }
  reserves {
    ...Reserve
  }
}
```

```graphql title="EmodeMarketCategory"
fragment EmodeMarketCategory on EmodeMarketCategory {
  __typename
  id
  label
  maxLTV {
    ...DecimalValue
  }
  liquidationThreshold {
    ...DecimalValue
  }
  liquidationPenalty {
    ...DecimalValue
  }
  reserves {
    ...EmodeMarketReserveInfo
  }
}

fragment EmodeMarketReserveInfo on EmodeMarketReserveInfo {
  __typename
  underlyingToken {
    ...Currency
  }
  canBeCollateral
  canBeBorrowed
}
```

```graphql title="MarketUserState"
fragment MarketUserState on MarketUserState {
  __typename
  netWorth
  netAPY {
    ...PercentValue
  }
  healthFactor
  eModeEnabled
  totalCollateralBase
  totalDebtBase
  availableBorrowsBase
  currentLiquidationThreshold {
    ...PercentValue
  }
  ltv {
    ...PercentValue
  }
  isInIsolationMode
}
```

```graphql title="MarketInfo"
fragment MarketInfo on MarketInfo {
  __typename
  name
  chain {
    ...Chain
  }
  icon
}
```

```graphql title="EmodeReserveInfo"
fragment EmodeReserveInfo on EmodeReserveInfo {
  __typename
  categoryId
  label
  maxLTV {
    ...PercentValue
  }
  liquidationThreshold {
    ...PercentValue
  }
  liquidationPenalty {
    ...PercentValue
  }
  canBeCollateral
  canBeBorrowed
}
```

```graphql title="Common"
fragment Chain on Chain {
  __typename
  name
  icon
  chainId
}

fragment DecimalValue on DecimalValue {
  __typename
  raw
  decimals
  value
}

fragment PercentValue on PercentValue {
  __typename
  raw
  decimals
  value
  formatted
}

fragment Currency on Currency {
  __typename
  address
  imageUrl
  name
  symbol
  decimals
  chainId
}

fragment NativeCurrency on NativeCurrency {
  __typename
  imageUrl
  name
  symbol
  decimals
  chainId
}

fragment TokenAmount on TokenAmount {
  __typename
  usdPerToken
  amount {
    ...DecimalValue
  }
  usd
}
```

</tab>
</tabgroup>
## Reserve Structure

Each reserve within an Aave market provides comprehensive lending and borrowing data for a specific asset, including:

- Token information (underlying, aToken, vToken addresses and metadata)
- Supply information (APY, liquidity, caps, collateral configuration)
- Borrow information (APY, available liquidity, utilization rates, caps)
- Reserve incentives (Merit programs, Aave governance rewards)
- Market mechanics (flash loans, permits, pause/freeze states)
- Efficiency mode (eMode) configurations for the asset
- Isolation mode settings (if applicable)
- User-specific state (balances, borrowable amounts, collateral usage)

When you provide a user account address, the reserve data also includes user-specific information such as current balances, borrowing capacity, and collateral status.

<tabgroup>
<tab label="TypeScript">

The following TypeScript interfaces illustrate the core Reserve type and its related types:

```ts title="Reserve"
interface Reserve {
  market: MarketInfo;
  underlyingToken: Currency;
  aToken: Currency;
  vToken: Currency;
  acceptsNative?: NativeCurrency;
  size: TokenAmount;
  usdExchangeRate: BigDecimal;
  usdOracleAddress: EvmAddress;
  isFrozen: boolean;
  isPaused: boolean;
  flashLoanEnabled: boolean;
  permitSupported: boolean;
  supplyInfo: ReserveSupplyInfo;
  borrowInfo?: ReserveBorrowInfo;
  isolationModeConfig?: ReserveIsolationModeConfig;
  eModeInfo: EmodeReserveInfo[];
  incentives: ReserveIncentive[];
  userState?: ReserveUserState;
}
```

```ts title="Borrow & Supply"
interface ReserveSupplyInfo {
  apy: PercentValue;
  total: DecimalValue;
  maxLTV: PercentValue;
  liquidationThreshold: PercentValue;
  liquidationBonus: PercentValue;
  canBeCollateral: boolean;
  supplyCap: TokenAmount;
  supplyCapReached: boolean;
}

interface ReserveBorrowInfo {
  apy: PercentValue;
  total: TokenAmount;
  borrowCap: TokenAmount;
  reserveFactor: PercentValue;
  availableLiquidity: TokenAmount;
  utilizationRate: PercentValue;
  variableRateSlope1: PercentValue;
  variableRateSlope2: PercentValue;
  optimalUsageRate: PercentValue;
  borrowingState: ReserveBorrowingState;
  borrowCapReached: boolean;
}
```

```ts title="Isolation Mode"
interface ReserveIsolationModeConfig {
  canBeCollateral: boolean;
  canBeBorrowed: boolean;
  debtCeiling: TokenAmount;
  debtCeilingDecimals: number;
  totalBorrows: TokenAmount;
}
```

```ts title="User State"
interface ReserveUserState {
  balance: TokenAmount;
  suppliable: TokenAmount;
  borrowable: TokenAmount;
  emode?: EmodeReserveInfo;
  canBeCollateral: boolean;
  canBeBorrowed: boolean;
  isInIsolationMode: boolean;
}
```

```ts title="Incentives"
type ReserveIncentive =
  | MeritSupplyIncentive
  | MeritBorrowIncentive
  | MeritBorrowAndSupplyIncentiveCondition
  | AaveSupplyIncentive
  | AaveBorrowIncentive;

interface MeritSupplyIncentive {
  __typename: "MeritSupplyIncentive";
  extraSupplyApr: PercentValue;
  claimLink: string;
}

interface MeritBorrowIncentive {
  __typename: "MeritBorrowIncentive";
  borrowAprDiscount: PercentValue;
  claimLink: string;
}

interface MeritBorrowAndSupplyIncentiveCondition {
  __typename: "MeritBorrowAndSupplyIncentiveCondition";
  extraApr: PercentValue;
  supplyToken: Currency;
  borrowToken: Currency;
  claimLink: string;
}

interface AaveSupplyIncentive {
  __typename: "AaveSupplyIncentive";
  extraSupplyApr: PercentValue;
  rewardTokenAddress: EvmAddress;
  rewardTokenSymbol: string;
}

interface AaveBorrowIncentive {
  __typename: "AaveBorrowIncentive";
  borrowAprDiscount: PercentValue;
  rewardTokenAddress: EvmAddress;
  rewardTokenSymbol: string;
}
```

> [!NOTE]
> See the [Incentive Programs](./incentives) page for more information on
> incentives.

</tab>
<tab label="GraphQL">

The following GraphQL fragments illustrate the core Reserve type and its related types:

```graphql title="Reserve"
fragment Reserve on Reserve {
  __typename
  market {
    ...MarketInfo
  }
  underlyingToken {
    ...Currency
  }
  aToken {
    ...Currency
  }
  vToken {
    ...Currency
  }
  acceptsNative {
    ...NativeCurrency
  }
  size {
    ...TokenAmount
  }
  usdExchangeRate
  usdOracleAddress
  isFrozen
  isPaused
  flashLoanEnabled
  permitSupported
  supplyInfo {
    ...ReserveSupplyInfo
  }
  borrowInfo {
    ...ReserveBorrowInfo
  }
  isolationModeConfig {
    ...ReserveIsolationModeConfig
  }
  eModeInfo {
    ...EmodeReserveInfo
  }
  incentives {
    ...ReserveIncentive
  }
  userState {
    ...ReserveUserState
  }
}
```

```graphql title="Borrow & Supply"
fragment ReserveSupplyInfo on ReserveSupplyInfo {
  __typename
  apy {
    ...PercentValue
  }
  total {
    ...DecimalValue
  }
  maxLTV {
    ...PercentValue
  }
  liquidationThreshold {
    ...PercentValue
  }
  liquidationBonus {
    ...PercentValue
  }
  canBeCollateral
  supplyCap {
    ...TokenAmount
  }
  supplyCapReached
}

fragment ReserveBorrowInfo on ReserveBorrowInfo {
  __typename
  apy {
    ...PercentValue
  }
  total {
    ...TokenAmount
  }
  borrowCap {
    ...TokenAmount
  }
  reserveFactor {
    ...PercentValue
  }
  availableLiquidity {
    ...TokenAmount
  }
  utilizationRate {
    ...PercentValue
  }
  variableRateSlope1 {
    ...PercentValue
  }
  variableRateSlope2 {
    ...PercentValue
  }
  optimalUsageRate {
    ...PercentValue
  }
  borrowingState
  borrowCapReached
}
```

```graphql title="Isolation Mode"
fragment ReserveIsolationModeConfig on ReserveIsolationModeConfig {
  __typename
  canBeCollateral
  canBeBorrowed
  debtCeiling {
    ...TokenAmount
  }
  debtCeilingDecimals
  totalBorrows {
    ...TokenAmount
  }
}
```

```graphql title="User State"
fragment ReserveUserState on ReserveUserState {
  __typename
  balance {
    ...TokenAmount
  }
  suppliable {
    ...TokenAmount
  }
  borrowable {
    ...TokenAmount
  }
  emode {
    ...EmodeReserveInfo
  }
  canBeCollateral
  canBeBorrowed
  isInIsolationMode
}
```

```graphql title="Incentives"
fragment ReserveIncentive on ReserveIncentive {
  __typename
  ... on MeritSupplyIncentive {
    ...MeritSupplyIncentive
  }
  ... on MeritBorrowIncentive {
    ...MeritBorrowIncentive
  }
  ... on MeritBorrowAndSupplyIncentiveCondition {
    ...MeritBorrowAndSupplyIncentiveCondition
  }
  ... on AaveSupplyIncentive {
    ...AaveSupplyIncentive
  }
  ... on AaveBorrowIncentive {
    ...AaveBorrowIncentive
  }
}

fragment MeritSupplyIncentive on MeritSupplyIncentive {
  __typename
  extraSupplyApr {
    ...PercentValue
  }
  claimLink
}

fragment MeritBorrowIncentive on MeritBorrowIncentive {
  __typename
  borrowAprDiscount {
    ...PercentValue
  }
  claimLink
}

fragment MeritBorrowAndSupplyIncentiveCondition on MeritBorrowAndSupplyIncentiveCondition {
  __typename
  extraApr {
    ...PercentValue
  }
  supplyToken {
    ...Currency
  }
  borrowToken {
    ...Currency
  }
  claimLink
}

fragment AaveSupplyIncentive on AaveSupplyIncentive {
  __typename
  extraSupplyApr {
    ...PercentValue
  }
  rewardTokenAddress
  rewardTokenSymbol
}

fragment AaveBorrowIncentive on AaveBorrowIncentive {
  __typename
  borrowAprDiscount {
    ...PercentValue
  }
  rewardTokenAddress
  rewardTokenSymbol
}
```

</tab>
</tabgroup>
## Listing Available Markets

Discover all available Aave markets across supported blockchain networks.

<tabgroup>
<tab label="React">

Use the `useAaveMarkets` hook to fetch a list of Aave markets.

```ts title="Loading State"
const { data, loading, error } = useAaveMarkets({
  chainIds: ChainId[],
  user: EvmAddress | undefined,
  borrowsOrderBy: MarketReservesRequestOrderBy | undefined,
  suppliesOrderBy: MarketReservesRequestOrderBy | undefined,
});
```

```ts title="React Suspense"
const { data } = useAaveMarkets({
  chainIds: ChainId[],
  user: EvmAddress | undefined,
  borrowsOrderBy: MarketReservesRequestOrderBy | undefined,
  suppliesOrderBy: MarketReservesRequestOrderBy | undefined,
  suspense: true,
});
```

Specify one or more chains to retrieve markets for.

```ts title="Ethereum Markets"
import { useAaveMarkets, chainId } from "@aave/react";

// …

const { data, loading, error } = useAaveMarkets({
  chainIds: [chainId(1)],
});

if (loading) {
  return Loading…;
}

if (error) {
  return {error.message};
}

// data: Market[]
```

Use a user address to include account-level data for each market and reserve.

```tsx title="With User State"
import { useAaveMarket, evmAddress, chainId } from "@aave/react";

const { data, loading, error } = useAaveMarket({
  chainId: chainId(1),
  user: evmAddress("0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234"),
});
```

</tab>

<tab label="TypeScript">

Use the `markets` action to fetch available markets across different chains.

```ts title="Ethereum Markets"
import { evmAddress, chainId } from "@aave/client";
import { markets } from "@aave/client/actions";

import { client } from "./client";

const result = markets(client, {
  chainIds: [chainId(1)],
});

if (result.isErr()) {
  console.error(result.error);
} else {
  // result.value: Market[]
  console.log(result.value);
}
```

```ts title="client.ts"
import { AaveClient } from "@aave/client";

export const client = AaveClient.create();
```

Use a user address to include account-level data for each market and reserve.

```ts title="With User State"
import { markets } from "@aave/client/actions";
import { evmAddress, chainId } from "@aave/client";

import { client } from "./client";

const result = markets(client, {
  chainIds: [chainId(1)],
  user: evmAddress("0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234"),
});
```

</tab>

<tab label="GraphQL">

Use the `markets` query to fetch available markets across different chains.

```graphql title="Query"
query {
  markets(
    request: {
      chainIds: [1]

      # Optional: include account-level data for each market and reserve
      # user: "0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234"
    }
  ) {
    name
    chain {
      name
      chainId
    }
    address
    icon
    totalMarketSize
    totalAvailableLiquidity
  }
}
```

```json title="Response"
{
  "data": {
    "markets": [
      {
        "name": "Aave v3 Ethereum",
        "chain": {
          "name": "Ethereum",
          "chainId": 1
        },
        "address": "0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2",
        "icon": "https://app.aave.com/icons/networks/ethereum.svg",
        "totalMarketSize": "12345678900.50",
        "totalAvailableLiquidity": "987654321.75"
      }
    ]
  }
}
```

  </tab>
</tabgroup>
## Single Market

Retrieve detailed information about a specific market including reserves and user state.

<tabgroup>
<tab label="React">

Use the `useAaveMarket` hook to fetch detailed information about a specific market.

```ts title="Loading State"
const { data, loading, error } = useAaveMarket({
  address: EvmAddress,
  chainId: ChainId,
  user: EvmAddress | undefined,
  borrowsOrderBy: MarketReservesRequestOrderBy | undefined,
  suppliesOrderBy: MarketReservesRequestOrderBy | undefined,
});
```

```ts title="React Suspense"
const { data } = useAaveMarket({
  address: EvmAddress,
  chainId: ChainId,
  user: EvmAddress | undefined,
  borrowsOrderBy: MarketReservesRequestOrderBy,
  suppliesOrderBy: MarketReservesRequestOrderBy,
  suspense: true,
});
```

Fetch a specific market by address and chain.

```tsx title="Ethereum Market"
import { useAaveMarket, evmAddress, chainId } from "@aave/react";

// …

const { data, loading, error } = useAaveMarket({
  address: evmAddress("0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2"),
  chainId: chainId(1),
});

if (loading) {
  return Loading market...;
}

if (error) {
  return Error: {error.message};
}

if (!data) {
  return Market not found;
}

// data: Market
```

Use a user address to include account-level data for the market and its reserves.

```tsx title="With User State"
import { useAaveMarket, evmAddress, chainId } from "@aave/react";

// …

const { data, loading, error } = useAaveMarket({
  address: evmAddress("0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2"),
  chainId: chainId(1),
  user: evmAddress("0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234"),
});
```

</tab>

<tab label="TypeScript">

Use the `market` action to fetch detailed information about a specific market.

```ts title="Ethereum Market"
import { market } from "@aave/client/actions";
import { evmAddress, chainId } from "@aave/client";

import { client } from "./client";

const result = await market(client, {
  address: evmAddress("0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2"),
  chainId: chainId(1),
  user: evmAddress("0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234"),
});

if (result.isErr()) {
  console.error(result.error);
} else {
  // result.value: Market | null
  console.log(result.value);
}
```

```ts title="client.ts"
import { AaveClient } from "@aave/client";

export const client = AaveClient.create();
```

Use a user address to include account-level data for the market and its reserves.

```ts title="With User State"
import { market } from "@aave/client/actions";
import { evmAddress, chainId } from "@aave/client";

import { client } from "./client";

const result = await market(client, {
  address: evmAddress("0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2"),
  chainId: chainId(1),
  user: evmAddress("0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234"),
});
```

</tab>
<tab label="GraphQL">

Use the `market` query to fetch detailed information about a specific market.

```graphql title="Query"
query {
  market(
    request: {
      address: "0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2"
      chainId: 1

      # Optional: include account-level data for the market and its reserves
      # user: "0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234"
    }
  ) {
    name
    chain {
      name
      chainId
    }
    address
    totalMarketSize
    totalAvailableLiquidity
    userState {
      netWorth
      healthFactor
      eModeEnabled
    }
    reserves {
      underlyingToken {
        symbol
        name
      }
      supplyInfo {
        apy {
          raw
          decimals
          value
          formatted
        }
        canBeCollateral
      }
      borrowInfo {
        apy {
          raw
          decimals
          value
          formatted
        }
      }
      incentives {
        __typename
        ... on MeritSupplyIncentive {
          extraSupplyApr {
            formatted
          }
          claimLink
        }
        ... on AaveSupplyIncentive {
          extraSupplyApr {
            formatted
          }
          rewardTokenSymbol
        }
      }
    }
  }
}
```

```json title="Response"
{
  "data": {
    "market": {
      "name": "Aave v3 Ethereum",
      "chain": {
        "name": "Ethereum",
        "chainId": 1
      },
      "address": "0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2",
      "totalMarketSize": "12345678900.50",
      "totalAvailableLiquidity": "987654321.75",
      "userState": {
        "netWorth": "5000.0",
        "healthFactor": "2.5",
        "eModeEnabled": false
      },
      "reserves": [
        {
          "underlyingToken": {
            "symbol": "USDC",
            "name": "USD Coin"
          },
          "supplyInfo": {
            "apy": {
              "raw": "45000000000000000000000000",
              "decimals": 27,
              "value": "0.045",
              "formatted": "4.5"
            },
            "canBeCollateral": true
          },
          "borrowInfo": {
            "apy": {
              "raw": "65000000000000000000000000",
              "decimals": 27,
              "value": "0.065",
              "formatted": "6.5"
            }
          }
        }
      ]
    }
  }
}
```

</tab>
</tabgroup>
## APY History

Retrieve historical APY data for reserves to analyze interest rate trends over time.

<tabgroup>
<tab label="React">

Use the `useBorrowAPYHistory` and `useSupplyAPYHistory` hooks to fetch historical APY data for specific reserves.

```ts title="Loading State"
const { data, loading, error } = useBorrowAPYHistory({
  chainId: ChainId,
  underlyingToken: EvmAddress,
  market: EvmAddress,
  window: TimeWindow,
});

const { data, loading, error } = useSupplyAPYHistory({
  chainId: ChainId,
  underlyingToken: EvmAddress,
  market: EvmAddress,
  window: TimeWindow,
});
```

```ts title="React Suspense"
const { data } = useBorrowAPYHistory({
  chainId: ChainId,
  underlyingToken: EvmAddress,
  market: EvmAddress,
  window: TimeWindow,
  suspense: true,
});

const { data } = useSupplyAPYHistory({
  chainId: ChainId,
  underlyingToken: EvmAddress,
  market: EvmAddress,
  window: TimeWindow,
  suspense: true,
});
```

Fetch borrow/supply APY history for a specific reserve over the last week.

```tsx title="Borrow APY History"
import {
  useBorrowAPYHistory,
  evmAddress,
  chainId,
  TimeWindow,
} from "@aave/react";

// …

const { data, loading, error } = useBorrowAPYHistory({
  chainId: chainId(1),
  underlyingToken: evmAddress("0xa0b86a33e6441c8c5f0bb9b7e5e1f8bbf5b78b5c"), // USDC
  market: evmAddress("0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2"),
  window: TimeWindow.LastWeek,
});

if (loading) {
  return Loading APY history...;
}

if (error) {
  return Error: {error.message};
}

// data: APYSample[]
```

```tsx title="Supply APY History"
import {
  useSupplyAPYHistory,
  evmAddress,
  chainId,
  TimeWindow,
} from "@aave/react";

// …

const { data, loading, error } = useSupplyAPYHistory({
  chainId: chainId(1),
  underlyingToken: evmAddress("0xa0b86a33e6441c8c5f0bb9b7e5e1f8bbf5b78b5c"), // USDC
  market: evmAddress("0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2"),
  window: TimeWindow.LastMonth,
});

if (loading) {
  return Loading APY history...;
}

if (error) {
  return Error: {error.message};
}

// data: APYSample[]
```

Available time windows include:

- `TimeWindow.LastDay`
- `TimeWindow.LastWeek`
- `TimeWindow.LastMonth`
- `TimeWindow.LastSixMonths`
- `TimeWindow.LastYear`

</tab>

<tab label="TypeScript">

Use the `borrowAPYHistory` and `supplyAPYHistory` actions to fetch historical APY data.

```ts title="Borrow APY History"
import { borrowAPYHistory } from "@aave/client/actions";
import { evmAddress, chainId, TimeWindow } from "@aave/client";

import { client } from "./client";

const result = await borrowAPYHistory(client, {
  chainId: chainId(1),
  underlyingToken: evmAddress("0xa0b86a33e6441c8c5f0bb9b7e5e1f8bbf5b78b5c"), // USDC
  market: evmAddress("0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2"),
  window: TimeWindow.LastWeek,
});

if (result.isErr()) {
  console.error(result.error);
} else {
  // result.value: APYSample[] | null
  result.value?.forEach((sample) => {
    console.log(`Date: ${sample.date}, APY: ${sample.avgRate.value}%`);
  });
}
```

```ts title="Supply APY History"
import { supplyAPYHistory } from "@aave/client/actions";
import { evmAddress, chainId, TimeWindow } from "@aave/client";

import { client } from "./client";

const result = await supplyAPYHistory(client, {
  chainId: chainId(1),
  underlyingToken: evmAddress("0xa0b86a33e6441c8c5f0bb9b7e5e1f8bbf5b78b5c"), // USDC
  market: evmAddress("0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2"),
  window: TimeWindow.LastMonth,
});

if (result.isErr()) {
  console.error(result.error);
} else {
  // result.value: APYSample[] | null
}
```

```ts title="client.ts"
import { AaveClient } from "@aave/client";

export const client = AaveClient.create();
```

The returned `APYSample` contains:

- `avgRate`: Average APY for the time period
- `date`: Timestamp for the data point

Available time windows include:

- `TimeWindow.LastDay`
- `TimeWindow.LastWeek`
- `TimeWindow.LastMonth`
- `TimeWindow.LastSixMonths`
- `TimeWindow.LastYear`

</tab>

<tab label="GraphQL">

Use the `borrowAPYHistory` and `supplyAPYHistory` queries to fetch historical APY data.

```graphql title="Borrow APY History Query"
query {
  history: borrowAPYHistory(
    request: {
      chainId: 1
      underlyingToken: "0xa0b86a33e6441c8c5f0bb9b7e5e1f8bbf5b78b5c"
      market: "0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2"
      window: LAST_WEEK
    }
  ) {
    avgRate {
      raw
      decimals
      value
    }
    date
  }
}
```

```graphql title="Supply APY History Query"
query {
  history: supplyAPYHistory(
    request: {
      chainId: 1
      underlyingToken: "0xa0b86a33e6441c8c5f0bb9b7e5e1f8bbf5b78b5c"
      market: "0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2"
      window: LAST_MONTH
    }
  ) {
    avgRate {
      raw
      decimals
      value
      formatted
    }
    date
  }
}
```

```json title="Response"
{
  "data": {
    "history": [
      {
        "avgRate": {
          "raw": "45000000000000000000000000",
          "decimals": 27,
          "value": "0.045",
          "formatted": "4.5"
        },
        "date": "2024-01-15T00:00:00Z"
      },
      {
        "avgRate": {
          "raw": "46000000000000000000000000",
          "decimals": 27,
          "value": "0.046",
          "formatted": "4.6"
        },
        "date": "2024-01-16T00:00:00Z"
      }
    ]
  }
}
```

Available time windows:

- `LAST_DAY`
- `LAST_WEEK`
- `LAST_MONTH`
- `LAST_SIX_MONTHS`
- `LAST_YEAR`

</tab>
</tabgroup>

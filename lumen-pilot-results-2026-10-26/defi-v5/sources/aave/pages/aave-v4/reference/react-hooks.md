# React Hooks

All public Aave v4 React SDK hooks.

---

## useChain

Declarative hook to fetch a specific chain by ID.

```tsx title="Loading State"
import { useChain } from "@aave/react";

const { data, loading, error } = useChain({
  pause,
  ...request,
});
```

```tsx title="React Suspense"
const { data } = useChain({
  pause,
  suspense: true,
  ...request,
});
```

**Arguments:**

- `request.chainId: ChainId` - Chain ID to query
- `pause?: boolean` - Pause the query (default: false)

**Returns:**

- `data: Chain | null | undefined` - Chain information or null if not found
- `loading: boolean` - Loading state
- `error: UnexpectedError | undefined` - Error fetching the chain

---

## useChainAction

Imperative hook to fetch chain data on demand. Does not watch for updated data; use it to retrieve data as part of a larger workflow.

```tsx
import { useChainAction } from "@aave/react";

const [execute, state] = useChainAction();

const result = await execute(request);
```

**Arguments:**

- `request.chainId: ChainId` - Chain ID

**Returns:**

- `state.loading: boolean` - Loading state
- `state.error: UnexpectedError | undefined` - Error fetching the chain
- `state.called: boolean` - Whether the hook has been called
- `state.data: Chain | null | undefined` - Chain data or null if not found
- `result: Result<Chain | null, UnexpectedError>` - Type-safe success or failure value:
  - `Ok<Chain | null>` - Chain data or null if not found
  - `Err<UnexpectedError>` - Error fetching the chain

---

## useChains

Declarative hook to fetch all supported chains.

```tsx title="Loading State"
import { useChains } from "@aave/react";
import { ChainsFilter } from "@aave/react";

const { data, loading, error } = useChains({
  query: { filter: ChainsFilter.ALL },
  pause,
});
```

```tsx title="React Suspense"
import { useChains } from "@aave/react";
import { ChainsFilter } from "@aave/react";

const { data } = useChains({
  query: { filter: ChainsFilter.ALL },
  pause,
  suspense: true,
});
```

**Arguments:**

- `request.query: ChainsRequestQuery` one of:
  - `filter: ChainsFilter` - Filter for chains (e.g., `ChainsFilter.ALL`)
  - `chainIds: [ChainId!]` - Fetch by chain IDs
- `pause?: boolean` - Pause the query (default: false)

**Returns:**

- `data: Chain[] | undefined` - Array of supported chains
- `loading: boolean` - Loading state
- `error: UnexpectedError | undefined` - Error fetching the chains

---

## useClaimRewards

Imperative transaction hook to claim rewards for a user on a specific chain.

```tsx
import { useClaimRewards } from "@aave/react";

const [execute, state] = useClaimRewards((transaction) =>
  sendTransaction(transaction),
);

const result = await execute(request);
```

**Arguments:**

- `request.ids: [RewardId!]` - Reward IDs to claim
- `request.user: EvmAddress` - User claiming the rewards
- `request.chainId: ChainId` - Chain to claim on

**Returns:**

- `state.loading: boolean` - Loading state
- `state.error: E | undefined` - Error executing the transaction
- `state.called: boolean` - Whether the hook has been called
- `state.data: TransactionReceipt | undefined` - Transaction receipt
- `result: Result<TransactionReceipt, E>` - Type-safe success or failure value:
  - `Ok<TransactionReceipt>` - Transaction receipt
  - `Err<E>` - Error executing the transaction

Where `E` is one of:

- `SendTransactionError`
- `CancelError`
- `TimeoutError`
- `TransactionError`

---

## useActivities

Declarative hook to fetch paginated list of user activities.

```tsx title="Loading State"
import { useActivities } from "@aave/react";

const { data, loading, error } = useActivities({
  pause,
  ...request,
});
```

```tsx title="React Suspense"
const { data } = useActivities({
  pause,
  suspense: true,
  ...request,
});
```

**Arguments:**

- `request.query: ActivitiesRequestQuery` one of:
  - `hub: HubInput` - Fetch by hub
  - `spoke: SpokeInput` - Fetch by spoke
  - `chainIds: [ChainId!]` - Fetch by chain IDs
  - `txHash: TxHashInput` - Fetch by transaction hash
- `request.user?: EvmAddress` - User address (optional)
- `request.currency?: Currency` - Currency for value conversions (default: USD)
- `pause?: boolean` - Pause the query (default: false)

**Returns:**

- `data?.items: ActivityItem[]` - List of activities
- `data?.pageInfo: PageInfo` - Pagination information
- `loading: boolean` - Loading state
- `error: UnexpectedError | undefined` - Error fetching the activities

---

## useActivitiesAction

Imperative hook to fetch paginated list of user activities.

```tsx
import { useActivitiesAction } from "@aave/react";

const [execute, state] = useActivitiesAction(options);

const result = await execute(request);
```

**Options:**

- `options.currency?: Currency` - Currency for value conversions (default: USD)

**Arguments:**

- `request.query: ActivitiesRequestQuery` one of:
  - `hub: HubInput` - Fetch by hub
  - `spoke: SpokeInput` - Fetch by spoke
  - `chainIds: [ChainId!]` - Fetch by chain IDs
  - `txHash: TxHashInput` - Fetch by transaction hash
- `request.user?: EvmAddress` - User address (optional)

**Returns:**

- `state.loading: boolean` - Loading state
- `state.error: UnexpectedError | undefined` - Error fetching the activities
- `state.called: boolean` - Whether the hook has been called
- `state.data: PaginatedActivitiesResult | undefined` - Paginated activities result
- `result: Result<PaginatedActivitiesResult, UnexpectedError>` - Type-safe success or failure value:
  - `Ok<PaginatedActivitiesResult>` - Paginated activities result
  - `Err<UnexpectedError>` - Error fetching the activities

---

## useAsset

Declarative hook to fetch information about a specific asset (ERC20 token).

```tsx title="Loading State"
import { useAsset } from "@aave/react";

const { data, loading, error } = useAsset({
  pause,
  ...request,
});
```

```tsx title="React Suspense"
const { data } = useAsset({
  pause,
  suspense: true,
  ...request,
});
```

**Arguments:**

- `request.query: AssetRequestQuery` one of:
  - `token: Erc20Input` - ERC-20 token
    - `address: EvmAddress` - Token contract address
    - `chainId: ChainId` - Chain ID where the token exists
  - `assetId: AssetId` - Asset ID
- `request.currency?: Currency` - Currency for value conversions (optional)
- `request.timeWindow?: TimeWindow` - Time window for historical data (optional)
- `pause?: boolean` - Pause the query (default: false)

**Returns:**

- `data: Asset | null | undefined` - Asset information or null if not found
- `loading: boolean` - Loading state
- `error: UnexpectedError | undefined` - Error fetching the asset

---

## useAssetBorrowHistory

Declarative hook to fetch historical borrow data for an asset.

```tsx title="Loading State"
import { useAssetBorrowHistory } from "@aave/react";

const { data, loading, error } = useAssetBorrowHistory({
  pause,
  ...request,
});
```

```tsx title="React Suspense"
const { data } = useAssetBorrowHistory({
  pause,
  suspense: true,
  ...request,
});
```

**Arguments:**

- `request.token.address: EvmAddress` - Asset contract address
- `request.token.chainId: ChainId` - Chain ID
- `request.window: TimeWindow` - Time window for historical data
- `pause?: boolean` - Pause the query (default: false)

**Returns:**

- `data: AssetBorrowSample[] | undefined` - Array of historical borrow data points
  - `data[].date: Date` - Sample date
  - `data[].amount: DecimalNumber` - Total borrowed amount
  - `data[].highestApy: PercentNumber` - Highest borrow APY across hubs
  - `data[].lowestApy: PercentNumber` - Lowest borrow APY across hubs
  - `data[].averageApy: PercentNumber` - Average borrow APY across all hubs
  - `data[].breakdown: AssetSampleBreakdown[]` - Per-hub APY breakdown
- `loading: boolean` - Loading state
- `error: UnexpectedError | undefined` - Error fetching the borrow history

---

## useAssetPriceHistory

Declarative hook to fetch historical price data for an asset.

```tsx title="Loading State"
import { useAssetPriceHistory } from "@aave/react";

const { data, loading, error } = useAssetPriceHistory({
  pause,
  ...request,
});
```

```tsx title="React Suspense"
const { data } = useAssetPriceHistory({
  pause,
  suspense: true,
  ...request,
});
```

**Arguments:**

- `request.token.address: EvmAddress` - Asset contract address
- `request.token.chainId: ChainId` - Chain ID
- `request.currency: Currency` - Currency for the data
- `request.window: TimeWindow` - Time window for historical data
- `pause?: boolean` - Pause the query (default: false)

**Returns:**

- `data: AssetPriceSample[] | undefined` - Array of historical price data points
- `loading: boolean` - Loading state
- `error: UnexpectedError | undefined` - Error fetching the price history

---

## useAssetSupplyHistory

Declarative hook to fetch historical supply data for an asset.

```tsx title="Loading State"
import { useAssetSupplyHistory } from "@aave/react";

const { data, loading, error } = useAssetSupplyHistory({
  pause,
  ...request,
});
```

```tsx title="React Suspense"
const { data } = useAssetSupplyHistory({
  pause,
  suspense: true,
  ...request,
});
```

**Arguments:**

- `request.token.address: EvmAddress` - Asset contract address
- `request.token.chainId: ChainId` - Chain ID
- `request.window: TimeWindow` - Time window for historical data
- `pause?: boolean` - Pause the query (default: false)

**Returns:**

- `data: AssetSupplySample[] | undefined` - Array of historical supply data points
  - `data[].date: Date` - Sample date
  - `data[].amount: DecimalNumber` - Total supplied amount
  - `data[].highestApy: PercentNumber` - Highest supply APY across hubs
  - `data[].lowestApy: PercentNumber` - Lowest supply APY across hubs
  - `data[].averageApy: PercentNumber` - Average supply APY across all hubs
  - `data[].breakdown: AssetSampleBreakdown[]` - Per-hub APY breakdown
- `loading: boolean` - Loading state
- `error: UnexpectedError | undefined` - Error fetching the supply history

---

## useProtocolHistory

Declarative hook to fetch protocol-wide historical data (deposits, borrows).

```tsx title="Loading State"
import { Currency, TimeWindow } from "@aave/react";
import { useProtocolHistory } from "@aave/react";

const { data, loading, error } = useProtocolHistory({
  currency: Currency.Usd,
  window: TimeWindow.LastWeek,
  pause,
});
```

```tsx title="React Suspense"
const { data } = useProtocolHistory({
  currency: Currency.Usd,
  window: TimeWindow.LastWeek,
  suspense: true,
  pause,
});
```

**Arguments:**

- `request.currency: Currency` - Currency for exchange amounts (default: USD)
- `request.window: TimeWindow` - Time window for historical data (default: LAST_DAY)
- `pause?: boolean` - Pause the query (default: false)

**Returns:**

- `data: ProtocolHistorySample[] | undefined` - Array of protocol history data points
- `loading: boolean` - Loading state
- `error: UnexpectedError | undefined` - Error fetching the protocol history

---

## useBorrow

Imperative transaction hook to borrow assets from the protocol.

```tsx
import { useBorrow } from "@aave/react";

const [execute, state] = useBorrow((plan) => {
  switch (plan.__typename) {
    case "TransactionRequest":
      return sendTransaction(plan);
    case "PreContractActionRequired":
      return sendTransaction(plan.transaction);
  }
});

const result = await execute(request);
```

**Arguments:**

- `request.chainId: ChainId` - Chain ID
- `request.reserve: EvmAddress` - Reserve address
- `request.amount: BigDecimal` - Amount to borrow
- `request.onBehalfOf?: EvmAddress` - Borrow on behalf of another address (optional)

**Returns:**

- `state.loading: boolean` - Loading state
- `state.error: E | undefined` - Error executing the transaction
- `state.called: boolean` - Whether the hook has been called
- `state.data: TransactionReceipt | undefined` - Transaction receipt
- `result: Result<TransactionReceipt, E>` - Type-safe success or failure value:
  - `Ok<TransactionReceipt>` - Transaction receipt
  - `Err<E>` - Error executing the transaction

Where `E` is one of:

- `SendTransactionError`
- `CancelError`
- `TimeoutError`
- `TransactionError`
- `ValidationError<InsufficientBalanceError>`

---

## useBorrowApyHistory

Declarative hook to fetch borrow APY history for a specific reserve over time.

```tsx title="Loading State"
import { useBorrowApyHistory } from "@aave/react";

const { data, loading, error } = useBorrowApyHistory({
  pause,
  ...request,
});
```

```tsx title="React Suspense"
const { data } = useBorrowApyHistory({
  pause,
  suspense: true,
  ...request,
});
```

**Arguments:**

- `request.spoke.address: EvmAddress` - Spoke contract address
- `request.spoke.chainId: ChainId` - Chain ID
- `request.reserve: ReserveId` - Reserve ID
- `request.window: TimeWindow` - Time window for historical data
- `pause?: boolean` - Pause the query (default: false)

**Returns:**

- `data: ApySample[] | undefined` - Array of historical APY data points
- `loading: boolean` - Loading state
- `error: UnexpectedError | undefined` - Error fetching the borrow APY history

---

## useSignTypedData

Imperative transaction hook to sign EIP-712 typed data for ERC-20 permits and swap intents.

This hook provides a unified interface for signing all types of typed data in the Aave SDK. It returns a raw signature that is automatically wrapped with deadline information by transaction hooks like `useSupply`, `useRepay`, and `useTokenSwap`.

```tsx title="Viem"
import { useSignTypedData } from "@aave/react/viem";
import { useWalletClient } from "wagmi";

const { data: walletClient } = useWalletClient();
const [execute, state] = useSignTypedData(walletClient);

const result = await execute(typedData);
```

```tsx title="Ethers"
import { useSignTypedData } from "@aave/react/ethers";
import { ethers } from "ethers";

const provider = new ethers.providers.Web3Provider(window.ethereum);
const [execute, state] = useSignTypedData(provider.getSigner());

const result = await execute(typedData);
```

```tsx title="Privy"
import { useSignTypedData } from "@aave/react/privy";

const [execute, state] = useSignTypedData();

const result = await execute(typedData);
```

```tsx title="thirdweb"
import { useSignTypedData } from "@aave/react/thirdweb";

const [execute, state] = useSignTypedData();

const result = await execute(typedData);
```

**Arguments:**

- `typedData: TypedData` - The EIP-712 typed data to sign.

**Returns:**

- `state.loading: boolean` - Loading state
- `state.error: SignTypedDataError | undefined` - Error signing the typed data
- `state.called: boolean` - Whether the hook has been called
- `state.data: Signature | undefined` - Raw signature (deadline wrapping is handled automatically by transaction hooks)
- `result: Result<Signature, SignTypedDataError>` - Type-safe success or failure value:
  - `Ok<Signature>` - Raw signature
  - `Err<SignTypedDataError>` - Error signing the typed data

---

## useExchangeRate

Declarative hook to fetch the current exchange rate between two currencies.

```tsx title="Loading State"
import { useExchangeRate } from "@aave/react";

const { data, loading, error } = useExchangeRate({
  pause,
  ...request,
});
```

```tsx title="React Suspense"
const { data } = useExchangeRate({
  pause,
  suspense: true,
  ...request,
});
```

**Arguments:**

- `request.from: AssetInput` - Source asset (erc20 or native)
- `request.to: Currency` - Target currency
- `pause?: boolean` - Pause the query (default: false)

**Returns:**

- `data: ExchangeAmount | undefined` - Exchange rate value
- `loading: boolean` - Loading state
- `error: UnexpectedError | undefined` - Error fetching the exchange rate

---

## useExchangeRateAction

Imperative hook to fetch exchange rate between two currencies.

```tsx
import { useExchangeRateAction } from "@aave/react";

const [execute, state] = useExchangeRateAction();

const result = await execute(request);
```

**Arguments:**

- `request.from: AssetInput` - Source asset (erc20 or native)
- `request.to: Currency` - Target currency
- `request.at?: Date` - Historical date (optional)

**Returns:**

- `state.loading: boolean` - Loading state
- `state.error: UnexpectedError | undefined` - Error fetching the exchange rate
- `state.called: boolean` - Whether the hook has been called
- `state.data: ExchangeAmount | undefined` - Exchange rate value
- `result: Result<ExchangeAmount, UnexpectedError>` - Type-safe success or failure value:
  - `Ok<ExchangeAmount>` - Exchange rate value
  - `Err<UnexpectedError>` - Error fetching the exchange rate

---

## useHub

Declarative hook to fetch a specific hub by address and chain ID.

```tsx title="Loading State"
import { useHub } from "@aave/react";

const { data, loading, error } = useHub({
  pause,
  ...request,
});
```

```tsx title="React Suspense"
const { data } = useHub({
  pause,
  suspense: true,
  ...request,
});
```

**Arguments:**

- `request.query: HubRequestQuery` one of:
  - `hubInput: HubInput` - Hub address and chain ID
    - `address: EvmAddress` - Hub contract address
    - `chainId: ChainId` - Chain ID where the hub exists
  - `hubId: HubId` - Hub ID
- `request.currency?: Currency` - Currency for value conversions (optional)
- `pause?: boolean` - Pause the query (default: false)

**Returns:**

- `data: Hub | null | undefined` - Hub information or null if not found
- `loading: boolean` - Loading state
- `error: UnexpectedError | undefined` - Error fetching the hub

---

## useHubAssets

Declarative hook to fetch hub assets for a specific chain and optional hub/user filtering.

```tsx title="Loading State"
import { useHubAssets } from "@aave/react";

const { data, loading, error } = useHubAssets({
  pause,
  ...request,
});
```

```tsx title="React Suspense"
const { data } = useHubAssets({
  pause,
  suspense: true,
  ...request,
});
```

**Arguments:**

- `request.query: HubAssetsRequestQuery` one of:
  - `hubInput: HubInput` - Hub address and chain ID
    - `address: EvmAddress` - Hub contract address
    - `chainId: ChainId` - Chain ID
  - `hubId: HubId` - Hub ID
- `request.user?: EvmAddress` - Filter by user address (optional)
- `request.orderBy?: HubAssetsRequestOrderBy` one of:
  - `assetName: OrderDirection` - Sort by asset name
  - `availableLiquidity: OrderDirection` - Sort by available liquidity
  - `supplyApy: OrderDirection` - Sort by supply APY
  - `borrowApy: OrderDirection` - Sort by borrow APY
- `request.currency?: Currency` - Currency for value conversions (optional)
- `pause?: boolean` - Pause the query (default: false)

**Returns:**

- `data: HubAsset[] | undefined` - Array of hub assets
- `loading: boolean` - Loading state
- `error: UnexpectedError | undefined` - Error fetching the hub assets

---

## useHubAssetInterestRateModel

Declarative hook to fetch the interest rate model curve for a specific hub asset.

```tsx title="Loading State"
import { useHubAssetInterestRateModel } from "@aave/react";

const { data, loading, error } = useHubAssetInterestRateModel({
  pause,
  ...request,
});
```

```tsx title="React Suspense"
const { data } = useHubAssetInterestRateModel({
  pause,
  suspense: true,
  ...request,
});
```

**Arguments:**

- `request.query: HubAssetInterestRateModelRequestQuery`:
  - `hubAssetId: HubAssetId` - Hub asset ID
- `request.currency?: Currency` - Currency for value conversions (optional)
- `pause?: boolean` - Pause the query (default: false)

**Returns:**

- `data: HubAssetInterestRateModelPoint[] | undefined` - Array of interest rate model data points
- `loading: boolean` - Loading state
- `error: UnexpectedError | undefined` - Error fetching the interest rate model

---

## useHubAssetInterestRateModelAction

Imperative hook to fetch interest rate model data for a hub asset.

```tsx
import { useHubAssetInterestRateModelAction } from "@aave/react";

const [execute, state] = useHubAssetInterestRateModelAction(options);

const result = await execute(request);
```

**Options:**

- `options.currency?: Currency` - Currency for value conversions (default: USD)

**Arguments:**

- `request.query: HubAssetInterestRateModelRequestQuery`:
  - `hubAssetId: HubAssetId` - Hub asset ID

**Returns:**

- `state.loading: boolean` - Loading state
- `state.error: UnexpectedError | undefined` - Error fetching the interest rate model
- `state.called: boolean` - Whether the hook has been called
- `state.data: HubAssetInterestRateModelPoint[] | undefined` - Array of interest rate model data points
- `result: Result<HubAssetInterestRateModelPoint[], UnexpectedError>` - Type-safe success or failure value:
  - `Ok<HubAssetInterestRateModelPoint[]>` - Array of interest rate model data points
  - `Err<UnexpectedError>` - Error fetching the interest rate model

---

## useHubSummaryHistory

Declarative hook to fetch historical summary data for a specific hub.

```tsx title="Loading State"
import { useHubSummaryHistory } from "@aave/react";

const { data, loading, error } = useHubSummaryHistory({
  pause,
  ...request,
});
```

```tsx title="React Suspense"
const { data } = useHubSummaryHistory({
  pause,
  suspense: true,
  ...request,
});
```

**Arguments:**

- `request.query: HubSummaryHistoryRequestQuery` one of:
  - `hubInput: HubInput` - Hub address and chain ID
    - `address: EvmAddress` - Hub contract address
    - `chainId: ChainId` - Chain ID where the hub exists
  - `hubId: HubId` - Hub ID
- `request.currency?: Currency` - Currency for value conversions (default: USD)
- `request.window?: TimeWindow` - Time window for historical data (default: LAST_DAY)
- `pause?: boolean` - Pause the query (default: false)

**Returns:**

- `data: HubSummarySample[] | undefined` - Array of historical hub summary data points
- `loading: boolean` - Loading state
- `error: UnexpectedError | undefined` - Error fetching the hub summary history

---

## useHubSpokeConfigs

Declarative hook to fetch per-asset configuration for a specific hub and spoke pair.

```tsx title="Loading State"
import { useHubSpokeConfigs } from "@aave/react";

const { data, loading, error } = useHubSpokeConfigs({
  pause,
  ...request,
});
```

```tsx title="React Suspense"
const { data } = useHubSpokeConfigs({
  pause,
  suspense: true,
  ...request,
});
```

**Arguments:**

- `request.hubId: HubId` - Hub ID
- `request.spokeId: SpokeId` - Spoke ID
- `request.currency?: Currency` - Currency for nested amount conversions (default: USD)
- `request.timeWindow?: TimeWindow` - Time window for nested change calculations (default: LAST_DAY)
- `pause?: boolean` - Pause the query (default: false)

**Returns:**

- `data: HubSpokeConfig[] | undefined` - Array of hub-spoke asset configurations
- `loading: boolean` - Loading state
- `error: UnexpectedError | undefined` - Error fetching the configs

---

## useHubs

Declarative hook to fetch all available hubs.

```tsx title="Loading State"
import { useHubs } from "@aave/react";

const { data, loading, error } = useHubs({
  pause,
  ...request,
});
```

```tsx title="React Suspense"
const { data } = useHubs({
  pause,
  suspense: true,
  ...request,
});
```

**Arguments:**

- `request.query: HubsRequestQuery` one of:
  - `tokens: [Erc20Input!]` - Filter by underlying tokens
    - `address: EvmAddress` - Token contract address
    - `chainId: ChainId` - Token chain ID
  - `chainIds: [ChainId!]` - Filter by chain IDs
- `request.orderBy?: HubsRequestOrderBy` one of:
  - `name: OrderDirection` - Sort by hub name
  - `totalBorrowed: OrderDirection` - Sort by total borrowed amount
  - `totalSupplied: OrderDirection` - Sort by total supplied amount
- `pause?: boolean` - Pause the query (default: false)

**Returns:**

- `data: Hub[] | undefined` - Array of hubs
- `loading: boolean` - Loading state
- `error: UnexpectedError | undefined` - Error fetching the hubs

---

## useHubsAction

Imperative hook to fetch hubs data.

```tsx
import { useHubsAction } from "@aave/react";

const [execute, state] = useHubsAction(options);

const result = await execute(request);
```

**Options:**

- `options.currency?: Currency` - Currency for value conversions (default: USD)

**Arguments:**

- `request.query: HubsRequestQuery` one of:
  - `tokens: [Erc20Input!]` - Filter by underlying tokens
    - `address: EvmAddress` - Token contract address
    - `chainId: ChainId` - Token chain ID
  - `chainIds: [ChainId!]` - Filter by chain IDs
- `request.orderBy?: HubsRequestOrderBy` one of:
  - `name: OrderDirection` - Sort by hub name
  - `totalBorrowed: OrderDirection` - Sort by total borrowed amount
  - `totalSupplied: OrderDirection` - Sort by total supplied amount

**Returns:**

- `state.loading: boolean` - Loading state
- `state.error: UnexpectedError | undefined` - Error fetching the hubs
- `state.called: boolean` - Whether the hook has been called
- `state.data: Hub[] | undefined` - Array of hubs
- `result: Result<Hub[], UnexpectedError>` - Type-safe success or failure value:
  - `Ok<Hub[]>` - Array of hubs
  - `Err<UnexpectedError>` - Error fetching the hubs

---

## useLiquidatePosition

Imperative transaction hook to liquidate an undercollateralized position.

```tsx
import { useLiquidatePosition } from "@aave/react";

const [execute, state] = useLiquidatePosition((plan) => {
  switch (plan.__typename) {
    case "TransactionRequest":
      return sendTransaction(plan);
    case "Erc20Approval":
      return sendTransaction(plan.byTransaction);
    case "PreContractActionRequired":
      return sendTransaction(plan.transaction);
  }
});

const result = await execute(request);
```

**Arguments:**

- `request.chainId: ChainId` - Chain ID
- `request.debtReserve: EvmAddress` - Debt reserve address
- `request.collateralReserve: EvmAddress` - Collateral reserve address
- `request.user: EvmAddress` - User address to liquidate
- `request.debtToCover: BigDecimal` - Amount of debt to cover

**Returns:**

- `state.loading: boolean` - Loading state
- `state.error: E | undefined` - Error executing the transaction
- `state.called: boolean` - Whether the hook has been called
- `state.data: TransactionReceipt | undefined` - Transaction receipt
- `result: Result<TransactionReceipt, E>` - Type-safe success or failure value:
  - `Ok<TransactionReceipt>` - Transaction receipt
  - `Err<E>` - Error executing the transaction

Where `E` is one of:

- `SendTransactionError`
- `CancelError`
- `TimeoutError`
- `TransactionError`
- `ValidationError<InsufficientBalanceError>`

---

## useMultichainAsset

Declarative hook to fetch information about an asset (ERC-20 token) aggregated across multiple chains, matched by its token info ID or symbol.

```tsx title="Loading State"
import { useMultichainAsset } from "@aave/react";

const { data, loading, error } = useMultichainAsset({
  pause,
  ...request,
});
```

```tsx title="React Suspense"
const { data } = useMultichainAsset({
  pause,
  suspense: true,
  ...request,
});
```

**Arguments:**

- `request.query: MultichainAssetRequestQuery` one of:
  - `tokenInfo: TokenInfoId` - Token info ID
  - `symbol: String` - Token symbol (e.g. `"USDC"`)
- `request.chainIds?: [ChainId!]` - Restrict aggregation to specific chains (optional)
- `request.includeRewards?: boolean` - Fold Merkl rewards into APY ranges (default: true)
- `currency?: Currency` - Currency for value conversions (default: USD)
- `timeWindow?: TimeWindow` - Time window for historical changes (default: LastDay)
- `pause?: boolean` - Pause the query (default: false)

**Returns:**

- `data: MultichainAsset | undefined` - Aggregated asset data (`assets` and `summary`)
- `loading: boolean` - Loading state
- `error: UnexpectedError | undefined` - Error fetching the asset

---

## useNetworkFee

Declarative hook to fetch the network fee for an activity (experimental).

```tsx title="Loading State"
import { useNetworkFee } from "@aave/react";

const { data, loading, error } = useNetworkFee({
  pause,
  ...request,
});
```

```tsx title="React Suspense"
const { data } = useNetworkFee({
  pause,
  suspense: true,
  ...request,
});
```

**Arguments:**

- `request.query: UseNetworkFeeRequestQuery` one of:
  - `activity: ActivityItem` - Calculate fee for past activity
  - `estimate: PreviewAction` - Estimate fee for preview action, one of:
    - `supply: SupplyRequest` - Supply action
    - `borrow: BorrowRequest` - Borrow action
    - `repay: RepayRequest` - Repay action
    - `withdraw: WithdrawRequest` - Withdraw action
    - `setUserSuppliesAsCollateral: SetUserSuppliesAsCollateralRequest` - Collateral changes
    - `updateUserPositionConditions: UpdateUserPositionConditionsRequest` - Position condition updates
- `request.currency?: Currency` - Currency for value conversions (optional)
- `pause?: boolean` - Pause the query (default: false)

**Returns:**

- `data: NativeAmount | undefined` - Network fee amount
- `loading: boolean` - Loading state
- `error: UnexpectedError | undefined` - Error fetching the network fee

---

## usePreview

Declarative hook to preview the outcome of a transaction before executing.

```tsx title="Loading State"
import { usePreview } from "@aave/react";

const { data, loading, error } = usePreview({
  pause,
  ...request,
});
```

```tsx title="React Suspense"
const { data } = usePreview({
  pause,
  suspense: true,
  ...request,
});
```

**Arguments:**

- `request.action: PreviewActionInput` one of:
  - `supply: SupplyRequest` - Preview a supply action
  - `borrow: BorrowRequest` - Preview a borrow action
  - `repay: RepayRequest` - Preview a repay action
  - `withdraw: WithdrawRequest` - Preview a withdraw action
  - `setUserSuppliesAsCollateral: SetUserSuppliesAsCollateralRequest` - Preview a collateral change
- `request.currency?: Currency` - Currency for value conversions (optional)
- `pause?: boolean` - Pause the query (default: false)

**Returns:**

- `data: PreviewUserPosition | undefined` - Preview of user position after the action
- `loading: boolean` - Loading state
- `error: UnexpectedError | undefined` - Error fetching the preview

---

## usePreviewAction

Imperative hook to preview the outcome of a transaction before executing.

```tsx
import { usePreviewAction } from "@aave/react";

const [execute, state] = usePreviewAction(options);

const result = await execute(request);
```

**Options:**

- `options.currency?: Currency` - Currency for value conversions (default: USD)

**Arguments:**

- `request.action: PreviewActionInput` one of:
  - `supply: SupplyRequest` - Preview a supply action
  - `borrow: BorrowRequest` - Preview a borrow action
  - `repay: RepayRequest` - Preview a repay action
  - `withdraw: WithdrawRequest` - Preview a withdraw action
  - `setUserSuppliesAsCollateral: SetUserSuppliesAsCollateralRequest` - Preview a collateral change

**Returns:**

- `state.loading: boolean` - Loading state
- `state.error: UnexpectedError | undefined` - Error fetching the preview
- `state.called: boolean` - Whether the hook has been called
- `state.data: PreviewUserPosition | undefined` - Preview of user position after the action
- `result: Result<PreviewUserPosition, UnexpectedError>` - Type-safe success or failure value:
  - `Ok<PreviewUserPosition>` - Preview of user position after the action
  - `Err<UnexpectedError>` - Error fetching the preview

---

## useRenounceSpokeUserPositionManager

Imperative transaction hook to renounce a position manager of a user for a specific spoke.

```tsx
import { useRenounceSpokeUserPositionManager } from "@aave/react";

const [execute, state] = useRenounceSpokeUserPositionManager((transaction) =>
  sendTransaction(transaction),
);

const result = await execute(request);
```

**Arguments:**

- `request.spoke: SpokeId` - Spoke ID
- `request.manager: EvmAddress` - Address to remove as a position manager
- `request.managing: EvmAddress` - Address that `manager` was managing

**Returns:**

- `state.loading: boolean` - Loading state
- `state.error: E | undefined` - Error executing the transaction
- `state.called: boolean` - Whether the hook has been called
- `state.data: TransactionReceipt | undefined` - Transaction receipt
- `result: Result<TransactionReceipt, E>` - Type-safe success or failure value:
  - `Ok<TransactionReceipt>` - Transaction receipt
  - `Err<E>` - Error executing the transaction

Where `E` is one of:

- `SendTransactionError`
- `CancelError`
- `TimeoutError`
- `TransactionError`

---

## useRepay

Imperative transaction hook to repay borrowed assets.

```tsx
import { useRepay } from "@aave/react";

const [execute, state] = useRepay((plan) => {
  switch (plan.__typename) {
    case "TransactionRequest":
      return sendTransaction(plan);
    case "Erc20Approval":
      return sendTransaction(plan.byTransaction);
    case "PreContractActionRequired":
      return sendTransaction(plan.transaction);
  }
});

const result = await execute(request);
```

**Arguments:**

- `request.chainId: ChainId` - Chain ID
- `request.reserve: EvmAddress` - Reserve address
- `request.amount: BigDecimal` - Amount to repay
- `request.onBehalfOf?: EvmAddress` - Repay on behalf of another address (optional)

**Returns:**

- `state.loading: boolean` - Loading state
- `state.error: E | undefined` - Error executing the transaction
- `state.called: boolean` - Whether the hook has been called
- `state.data: TransactionReceipt | undefined` - Transaction receipt
- `result: Result<TransactionReceipt, E>` - Type-safe success or failure value:
  - `Ok<TransactionReceipt>` - Transaction receipt
  - `Err<E>` - Error executing the transaction

Where `E` is one of:

- `SendTransactionError`
- `CancelError`
- `TimeoutError`
- `TransactionError`
- `ValidationError<InsufficientBalanceError>`

---

## useReserve

Declarative hook to fetch a specific reserve by reserve ID, spoke, and chain.

```tsx title="Loading State"
import { useReserve } from "@aave/react";

const { data, loading, error } = useReserve({
  pause,
  ...request,
});
```

```tsx title="React Suspense"
const { data } = useReserve({
  pause,
  suspense: true,
  ...request,
});
```

**Arguments:**

- `request.query: ReserveRequestQuery` one of:
  - `reserveId: ReserveId` - Reserve ID
  - `reserveInput: ReserveInput` - Reserve input
    - `chainId: ChainId` - Chain ID
    - `spoke: EvmAddress` - Spoke contract address
    - `onChainId: OnChainReserveId` - On-chain reserve ID
- `request.user?: EvmAddress` - User address for position-specific data (optional)
- `request.currency?: Currency` - Currency for value conversions (optional)
- `pause?: boolean` - Pause the query (default: false)

**Returns:**

- `data: Reserve | null | undefined` - Reserve information or null if not found
- `loading: boolean` - Loading state
- `error: UnexpectedError | undefined` - Error fetching the reserve

---

## useReserveAction

Imperative hook to fetch reserve data.

```tsx
import { useReserveAction } from "@aave/react";

const [execute, state] = useReserveAction(options);

const result = await execute(request);
```

**Options:**

- `options.currency?: Currency` - Currency for value conversions (default: USD)

**Arguments:**

- `request.reserve: ReserveId` - Reserve ID
- `request.user?: EvmAddress` - User address for position-specific data (optional)

**Returns:**

- `state.loading: boolean` - Loading state
- `state.error: UnexpectedError | undefined` - Error fetching the reserve
- `state.called: boolean` - Whether the hook has been called
- `state.data: Reserve | null | undefined` - Reserve data or null if not found
- `result: Result<Reserve | null, UnexpectedError>` - Type-safe success or failure value:
  - `Ok<Reserve | null>` - Reserve data or null if not found
  - `Err<UnexpectedError>` - Error fetching the reserve

---

## useReserves

Declarative hook to fetch reserves based on specified criteria.

```tsx title="Loading State"
import { useReserves } from "@aave/react";

const { data, loading, error } = useReserves({
  pause,
  ...request,
});
```

```tsx title="React Suspense"
const { data } = useReserves({
  pause,
  suspense: true,
  ...request,
});
```

**Arguments:**

- `request.query: ReservesRequestQuery` one of:
  - `spoke: SpokeInput` - Get reserves for a spoke
    - `address: EvmAddress` - Spoke contract address
    - `chainId: ChainId` - Chain ID
  - `spokeId: SpokeId` - Get reserves by spoke ID
  - `tokens: [Erc20Input!]` - Get reserves with underlying tokens
    - `address: EvmAddress` - Token contract address
    - `chainId: ChainId` - Token chain ID
  - `hubToken: HubTokenInput` - Get reserves on hub for underlying
    - `chainId: ChainId` - Chain ID
    - `hub: EvmAddress` - Hub contract address
    - `token: EvmAddress` - Token address
  - `chainIds: [ChainId!]` - Get reserves on chains
  - `spokeToken: SpokeTokenInput` - Get reserves for spoke for underlying
    - `spoke: SpokeId` - Spoke ID
    - `token: EvmAddress` - Token address
  - `hub: HubInput` - Get reserves on hub
  - `userPositionId: UserPositionId` - Get reserves by user position ID
  - `categories: TokenCategory[]` - Get reserves by token categories
    - `TokenCategory.Stablecoin` - Stablecoin category
    - `TokenCategory.EthCorrelated` - ETH-correlated category
- `request.filter?: ReservesRequestFilter` - Filter criteria (optional): `Supply`, `Borrow`, `Collateral`, or `All`
- `request.orderBy?: ReservesRequestOrderBy` one of:
  - `assetName: OrderDirection` - Sort by asset name
  - `userBalance: OrderDirection` - Sort by user balance
  - `supplyApy: OrderDirection` - Sort by supply APY
  - `supplyAvailable: OrderDirection` - Sort by available supply
  - `borrowApy: OrderDirection` - Sort by borrow APY
  - `borrowAvailable: OrderDirection` - Sort by available borrow
  - `collateralFactor: OrderDirection` - Sort by collateral factor
- `request.currency?: Currency` - Currency for value conversions (optional)
- `pause?: boolean` - Pause the query (default: false)

**Returns:**

- `data: Reserve[] | undefined` - Array of reserves
- `loading: boolean` - Loading state
- `error: UnexpectedError | undefined` - Error fetching reserves

---

## useReservesAction

Imperative hook to fetch reserves list.

```tsx
import { useReservesAction } from "@aave/react";

const [execute, state] = useReservesAction(options);

const result = await execute(request);
```

**Options:**

- `options.currency?: Currency` - Currency for value conversions (default: USD)

**Arguments:**

- `request.query: ReservesRequestQuery` one of:
  - `spoke: SpokeInput` - Get all reserves for a spoke
  - `tokens: [Erc20Input!]` - Get all reserves with underlying tokens
    - `address: EvmAddress` - Token contract address
    - `chainId: ChainId` - Token chain ID
  - `hubToken: HubTokenInput` - Get all reserves on a hub for an underlying
    - `chainId: ChainId` - Chain ID
    - `hub: EvmAddress` - Hub contract address
    - `token: EvmAddress` - Token address
  - `chainIds: [ChainId!]` - Get all reserves on a list of chains
  - `spokeToken: SpokeTokenInput` - Get all reserves for a spoke for an underlying
    - `spoke: SpokeId` - Spoke ID
    - `token: EvmAddress` - Token address
  - `hub: HubInput` - Get all tokens on a hub
  - `userPositionId: UserPositionId` - Get all reserves by user position ID
  - `categories: TokenCategory[]` - Get all reserves by token categories
    - `TokenCategory.Stablecoin` - Stablecoin category
    - `TokenCategory.EthCorrelated` - ETH-correlated category
- `request.filter?: ReservesRequestFilter` - Filter criteria (optional): `Supply`, `Borrow`, `Collateral`, or `All`

**Returns:**

- `state.loading: boolean` - Loading state
- `state.error: UnexpectedError | undefined` - Error fetching reserves
- `state.called: boolean` - Whether the hook has been called
- `state.data: Reserve[] | undefined` - Array of reserves
- `result: Result<Reserve[], UnexpectedError>` - Type-safe success or failure value:
  - `Ok<Reserve[]>` - Array of reserves
  - `Err<UnexpectedError>` - Error fetching reserves

---

## useReserveHolders

Declarative hook to fetch a paginated list of top holders for a specific reserve.

```tsx title="Loading State"
import { ReserveHoldersFilter, useReserveHolders } from "@aave/react";

const { data, loading, error } = useReserveHolders({
  reserve: { reserveId },
  filter: ReserveHoldersFilter.Supplied,
});
```

```tsx title="React Suspense"
import { ReserveHoldersFilter, useReserveHolders } from "@aave/react";

const { data } = useReserveHolders({
  reserve: { reserveId },
  filter: ReserveHoldersFilter.Supplied,
  suspense: true,
});
```

**Arguments:**

- `request.reserve: ReserveRequestQuery` one of:
  - `reserveId: ReserveId` - Reserve ID
- `request.filter?: ReserveHoldersFilter` - Filter by holder type (default: `Supplied`):
  - `ReserveHoldersFilter.Supplied` - Wallets that have supplied to this reserve
  - `ReserveHoldersFilter.Borrowed` - Wallets that have borrowed from this reserve
- `request.pageSize?: PageSize` - Number of results per page (default: `TEN`)
- `request.cursor?: Cursor` - Pagination cursor
- `pause?: boolean` - Pause the query (default: false)

**Returns:**

- `data: PaginatedReserveHoldersResult | undefined`
  - `data.items: ReserveHolder[]` - Array of holders
    - `address: EvmAddress` - Holder wallet address
    - `amount: Erc20Amount` - Amount supplied or borrowed
    - `weight: PercentNumber` - Percentage share of the total
  - `data.pageInfo: PaginatedResultInfo` - Pagination info with `next` and `prev` cursors
- `loading: boolean` - Loading state
- `error: UnexpectedError | undefined` - Error fetching holders

---

## useReserveHoldersAction

Imperative hook to fetch reserve holders on demand (e.g., for pagination).

```tsx
import { useReserveHoldersAction } from "@aave/react";

const [execute, state] = useReserveHoldersAction(options);

const result = await execute(request);
```

**Options:**

- `options.currency?: Currency` - Currency for value conversions (default: USD)

**Arguments:**

- `request.reserve: ReserveRequestQuery` - Reserve query (see `useReserveHolders`)
- `request.filter?: ReserveHoldersFilter` - Holder type filter
- `request.pageSize?: PageSize` - Page size
- `request.cursor?: Cursor` - Pagination cursor

**Returns:**

- `state.loading: boolean` - Loading state
- `state.error: UnexpectedError | undefined` - Error fetching holders
- `state.called: boolean` - Whether the hook has been called
- `state.data: PaginatedReserveHoldersResult | undefined` - Paginated result
- `result: Result<PaginatedReserveHoldersResult, UnexpectedError>` - Type-safe success or failure value:
  - `Ok<PaginatedReserveHoldersResult>` - Paginated holder data
  - `Err<UnexpectedError>` - Error fetching holders

---

## useSendTransaction

Send transactions through connected wallet.

```tsx title="Viem"
import { useSendTransaction } from "@aave/react/viem";
import { useWalletClient } from "wagmi";

const { data: walletClient } = useWalletClient();
const [sendTransaction, state] = useSendTransaction(walletClient);
```

```tsx title="Ethers"
import { useSendTransaction } from "@aave/react/ethers";
import { ethers } from "ethers";

const provider = new ethers.providers.Web3Provider(window.ethereum);
const [sendTransaction, state] = useSendTransaction(provider.getSigner());
```

```tsx title="Privy"
import { useSendTransaction } from "@aave/react/privy";

const [sendTransaction, state] = useSendTransaction();
```

```tsx title="thirdweb"
import { useSendTransaction } from "@aave/react/thirdweb";
import { createThirdwebClient } from "thirdweb";

const thirdwebClient = createThirdwebClient({
  clientId: "<YOUR_THIRDWEB_CLIENT_ID>",
});

const [sendTransaction, state] = useSendTransaction(thirdwebClient);
```

---

## useSetSpokeUserPositionManager

Imperative transaction hook to set a position manager for a spoke.

```tsx
import { useSetSpokeUserPositionManager } from "@aave/react";

const [execute, state] = useSetSpokeUserPositionManager((transaction) =>
  sendTransaction(transaction),
);

const result = await execute(request);
```

**Arguments:**

- `request.chainId: ChainId` - Chain ID
- `request.spoke: SpokeId` - Spoke ID
- `request.manager: EvmAddress` - Position manager address

**Returns:**

- `state.loading: boolean` - Loading state
- `state.error: E | undefined` - Error executing the transaction
- `state.called: boolean` - Whether the hook has been called
- `state.data: TransactionReceipt | undefined` - Transaction receipt
- `result: Result<TransactionReceipt, E>` - Type-safe success or failure value:
  - `Ok<TransactionReceipt>` - Transaction receipt
  - `Err<E>` - Error executing the transaction

Where `E` is one of:

- `SendTransactionError`
- `CancelError`
- `TimeoutError`
- `TransactionError`

---

## useSetUserSuppliesAsCollateral

Imperative transaction hook to enable or disable assets as collateral.

```tsx
import { useSetUserSuppliesAsCollateral } from "@aave/react";

const [execute, state] = useSetUserSuppliesAsCollateral((transaction) =>
  sendTransaction(transaction),
);

const result = await execute(request);
```

**Arguments:**

- `request.changes: UserSupplyAsCollateral[]` - Array of collateral changes
  - `changes[].reserve: ReserveId` - Reserve ID
  - `changes[].enableCollateral: boolean` - Enable or disable as collateral
- `request.sender: EvmAddress` - User's address

**Returns:**

- `state.loading: boolean` - Loading state
- `state.error: E | undefined` - Error executing the transaction
- `state.called: boolean` - Whether the hook has been called
- `state.data: TransactionReceipt | undefined` - Transaction receipt
- `result: Result<TransactionReceipt, E>` - Type-safe success or failure value:
  - `Ok<TransactionReceipt>` - Transaction receipt
  - `Err<Error>` - Error executing the transaction

Where `E` is one of:

- `SendTransactionError`
- `CancelError`
- `TimeoutError`
- `TransactionError`

---

## useSpoke

Declarative hook to fetch a specific spoke by address and chain ID.

```tsx title="Loading State"
import { useSpoke } from "@aave/react";

const { data, loading, error } = useSpoke({
  pause,
  ...request,
});
```

```tsx title="React Suspense"
const { data } = useSpoke({
  pause,
  suspense: true,
  ...request,
});
```

**Arguments:**

- `request.query.spoke.address: EvmAddress` - Spoke contract address
- `request.query.spoke.chainId: ChainId` - Chain ID
- `pause?: boolean` - Pause the query (default: false)

**Returns:**

- `data: Spoke | null | undefined` - Spoke information or null if not found
- `loading: boolean` - Loading state
- `error: UnexpectedError | undefined` - Error fetching the spoke

---

## useSpokePositionManagers

Declarative hook to fetch paginated list of position managers for a spoke.

```tsx title="Loading State"
import { useSpokePositionManagers } from "@aave/react";

const { data, loading, error } = useSpokePositionManagers({
  pause,
  ...request,
});
```

```tsx title="React Suspense"
const { data } = useSpokePositionManagers({
  pause,
  suspense: true,
  ...request,
});
```

**Arguments:**

- `request.spoke: SpokeInput` - Spoke address and chain ID
- `pause?: boolean` - Pause the query (default: false)

**Returns:**

- `data: PaginatedSpokePositionManagerResult | undefined` - Paginated list of position managers
- `loading: boolean` - Loading state
- `error: UnexpectedError | undefined` - Error fetching position managers

---

## useSpokeSummaryHistory

Declarative hook to fetch historical deposits and borrows for a specific spoke.

```tsx title="Loading State"
import { useSpokeSummaryHistory } from "@aave/react";

const { data, loading, error } = useSpokeSummaryHistory({
  pause,
  ...request,
});
```

```tsx title="React Suspense"
const { data } = useSpokeSummaryHistory({
  pause,
  suspense: true,
  ...request,
});
```

**Arguments:**

- `request.query: SpokeSummaryHistoryRequestQuery` one of:
  - `spokeInput: SpokeInput` - Spoke address and chain ID
  - `spokeId: SpokeId` - Spoke ID
- `request.currency?: Currency` - Currency for value conversions (default: USD)
- `request.window?: TimeWindow` - Time window for historical data (default: LAST_DAY)
- `pause?: boolean` - Pause the query (default: false)

**Returns:**

- `data: SpokeSummarySample[] | undefined` - Array of historical spoke summary data points
- `loading: boolean` - Loading state
- `error: UnexpectedError | undefined` - Error fetching the spoke summary history

---

## useSpokes

Declarative hook to fetch spokes based on specified criteria.

```tsx title="Loading State"
import { useSpokes } from "@aave/react";

const { data, loading, error } = useSpokes({
  pause,
  ...request,
});
```

```tsx title="React Suspense"
const { data } = useSpokes({
  pause,
  suspense: true,
  ...request,
});
```

**Arguments:**

- `request.chainIds?: ChainId[]` - Filter by specific chain IDs (optional)
- `pause?: boolean` - Pause the query (default: false)

**Returns:**

- `data: Spoke[] | undefined` - Array of spokes
- `loading: boolean` - Loading state
- `error: UnexpectedError | undefined` - Error fetching the spokes

---

## useSpokeUserPositionManagers

Declarative hook to fetch paginated list of user's position managers for a spoke.

```tsx title="Loading State"
import { useSpokeUserPositionManagers } from "@aave/react";

const { data, loading, error } = useSpokeUserPositionManagers({
  pause,
  ...request,
});
```

```tsx title="React Suspense"
const { data } = useSpokeUserPositionManagers({
  pause,
  suspense: true,
  ...request,
});
```

**Arguments:**

- `request.spoke: SpokeInput` - Spoke address and chain ID
- `request.user: EvmAddress` - User address
- `pause?: boolean` - Pause the query (default: false)

**Returns:**

- `data: PaginatedSpokeUserPositionManagerResult | undefined` - Paginated list of user's position managers
- `loading: boolean` - Loading state
- `error: UnexpectedError | undefined` - Error fetching user position managers

---

## useSwapStatus

Declarative hook to monitor the status of a swap operation in real-time.

```tsx title="Loading State"
import { useSwapStatus } from "@aave/react";

const { data, loading, error } = useSwapStatus({
  pause,
  ...request,
});
```

```tsx title="React Suspense"
const { data } = useSwapStatus({
  pause,
  suspense: true,
  ...request,
});
```

**Arguments:**

- `request.id: string` - Swap receipt ID from `SwapReceipt.id`
- `pause?: boolean` - Pause the query (default: false)

**Returns:**

- `data: SwapStatus | undefined` - Current swap status, one of:
  - `SwapOpen` - Swap is open and waiting for execution
  - `SwapPendingSignature` - Swap is waiting for user signature
  - `SwapFulfilled` - Swap completed successfully
  - `SwapCancelled` - Swap was cancelled
  - `SwapExpired` - Swap expired before execution
- `loading: boolean` - Loading state
- `error: UnexpectedError | undefined` - Error fetching the swap status

---

## useSupply

Imperative transaction hook to supply assets to the protocol.

```tsx
import { useSupply } from "@aave/react";

const [execute, state] = useSupply((plan) => {
  switch (plan.__typename) {
    case "TransactionRequest":
      return sendTransaction(plan);
    case "Erc20Approval":
      return sendTransaction(plan.byTransaction);
    case "PreContractActionRequired":
      return sendTransaction(plan.transaction);
  }
});

const result = await execute(request);
```

**Arguments:**

- `request.chainId: ChainId` - Chain ID
- `request.reserve: EvmAddress` - Reserve address
- `request.amount: BigDecimal` - Amount to supply
- `request.onBehalfOf?: EvmAddress` - Supply on behalf of another address (optional)

**Returns:**

- `state.loading: boolean` - Loading state
- `state.error: E | undefined` - Error executing the transaction
- `state.called: boolean` - Whether the hook has been called
- `state.data: TransactionReceipt | undefined` - Transaction receipt
- `result: Result<TransactionReceipt, E>` - Type-safe success or failure value:
  - `Ok<TransactionReceipt>` - Transaction receipt
  - `Err<E>` - Error executing the transaction

Where `E` is one of:

- `SendTransactionError`
- `CancelError`
- `TimeoutError`
- `TransactionError`
- `ValidationError<InsufficientBalanceError>`

---

## useSupplyApyHistory

Declarative hook to fetch supply APY history for a specific reserve over time.

```tsx title="Loading State"
import { useSupplyApyHistory } from "@aave/react";

const { data, loading, error } = useSupplyApyHistory({
  pause,
  ...request,
});
```

```tsx title="React Suspense"
const { data } = useSupplyApyHistory({
  pause,
  suspense: true,
  ...request,
});
```

**Arguments:**

- `request.spoke.address: EvmAddress` - Spoke contract address
- `request.spoke.chainId: ChainId` - Chain ID
- `request.reserve: ReserveId` - Reserve ID
- `request.window: TimeWindow` - Time window for historical data
- `pause?: boolean` - Pause the query (default: false)

**Returns:**

- `data: ApySample[] | undefined` - Array of historical APY data points
- `loading: boolean` - Loading state
- `error: UnexpectedError | undefined` - Error fetching the supply APY history

---

## useUpdateUserPositionConditions

Imperative transaction hook to update a user's position conditions (dynamic config and/or risk premium).

```tsx
import {
  useUpdateUserPositionConditions,
  UserPositionConditionsUpdate,
} from "@aave/react";

const [execute, state] = useUpdateUserPositionConditions((transaction) =>
  sendTransaction(transaction),
);

const result = await execute({
  userPositionId: userPosition.id,
  update: UserPositionConditionsUpdate.AllDynamicConfig,
});
```

**Arguments:**

- `request.userPositionId: UserPositionId` - User position identifier
- `request.update: UserPositionConditionsUpdate` - Type of update to perform:
  - `UserPositionConditionsUpdate.JustRiskPremium` - Update only the risk premium
  - `UserPositionConditionsUpdate.AllDynamicConfig` - Update all dynamic config (includes risk premium)

**Returns:**

- `state.loading: boolean` - Loading state
- `state.error: E | undefined` - Error executing the transaction
- `state.called: boolean` - Whether the hook has been called
- `state.data: TransactionReceipt | undefined` - Transaction receipt
- `result: Result<TransactionReceipt, E>` - Type-safe success or failure value:
  - `Ok<TransactionReceipt>` - Transaction receipt
  - `Err<E>` - Error executing the transaction

Where `E` is one of:

- `SendTransactionError`
- `CancelError`
- `TimeoutError`
- `TransactionError`
- `UnexpectedError`

---

## useUserBalances

Declarative hook to fetch user wallet balances across specified chains.

```tsx title="Loading State"
import { useUserBalances } from "@aave/react";

const { data, loading, error } = useUserBalances({
  pause,
  ...request,
});
```

```tsx title="React Suspense"
const { data } = useUserBalances({
  pause,
  suspense: true,
  ...request,
});
```

**Arguments:**

- `request.user: EvmAddress` - User address
- `request.filter: UserBalancesRequestFilter` one of:
  - `chains: UserBalancesByChains` - Balances on specified chains
    - `chainIds: ChainId[]` - Chain IDs to query
    - `byReservesType: ReservesRequestFilter` - Reserve type filter (default: ALL)
  - `hub: UserBalancesByHub` - Balances for hub assets
    - `address: EvmAddress` - Hub address
    - `chainId: ChainId` - Hub chain ID
    - `byReservesType: ReservesRequestFilter` - Reserve type filter (default: ALL)
  - `spoke: UserBalancesBySpoke` - Balances for spoke reserves
    - `address: EvmAddress` - Spoke address
    - `chainId: ChainId` - Spoke chain ID
    - `byReservesType: ReservesRequestFilter` - Reserve type filter (default: ALL)
  - `userPosition: UserBalancesByUserPosition` - Balances for user position
    - `userPositionId: UserPositionId` - User position ID
    - `byReservesType: ReservesRequestFilter` - Reserve type filter (default: ALL)
- `request.orderBy?: UserBalancesRequestOrderBy` one of:
  - `name: OrderDirection` - Sort by token name
  - `balance: OrderDirection` - Sort by balance
- `request.includeZeroBalances?: boolean` - Include zero balances (default: false)
- `request.currency?: Currency` - Currency for value conversions (optional)
- `pause?: boolean` - Pause the query (default: false)

**Returns:**

- `data: UserBalance[] | undefined` - Array of user wallet balances
- `loading: boolean` - Loading state
- `error: UnexpectedError | undefined` - Error fetching user balances

---

## useUserBalancesAction

Imperative hook to fetch user wallet balances.

```tsx
import { useUserBalancesAction } from "@aave/react";

const [execute, state] = useUserBalancesAction(options);

const result = await execute(request);
```

**Options:**

- `options.currency?: Currency` - Currency for value conversions (default: USD)

**Arguments:**

- `request.user: EvmAddress` - User address
- `request.filter: UserBalancesRequestFilter` one of:
  - `chains: UserBalancesByChains` - Balances on specified chains
    - `chainIds: ChainId[]` - Chain IDs to query
    - `byReservesType: ReservesRequestFilter` - Reserve type filter (default: ALL)
  - `hub: UserBalancesByHub` - Balances for hub assets
    - `address: EvmAddress` - Hub address
    - `chainId: ChainId` - Hub chain ID
    - `byReservesType: ReservesRequestFilter` - Reserve type filter (default: ALL)
  - `spoke: UserBalancesBySpoke` - Balances for spoke reserves
    - `address: EvmAddress` - Spoke address
    - `chainId: ChainId` - Spoke chain ID
    - `byReservesType: ReservesRequestFilter` - Reserve type filter (default: ALL)
  - `userPosition: UserBalancesByUserPosition` - Balances for user position
    - `userPositionId: UserPositionId` - User position ID
    - `byReservesType: ReservesRequestFilter` - Reserve type filter (default: ALL)
  - `tokens: UserBalancesByTokens` - Balances for specific tokens
    - `chainTokens: ChainTokenInput[]` - Array of chain-token pairs
      - `chainId: ChainId` - Chain ID
      - `token: TokenInput` one of:
        - `native: AlwaysTrue` - Native token
        - `erc20: EvmAddress` - ERC20 token address
    - `byReservesType?: ReservesRequestFilter` - Reserve type filter (default: ALL)
- `request.orderBy?: UserBalancesRequestOrderBy` one of:
  - `name: OrderDirection` - Sort by token name
  - `balance: OrderDirection` - Sort by balance
- `request.includeZeroBalances?: boolean` - Include zero balances (default: false)

**Returns:**

- `state.loading: boolean` - Loading state
- `state.error: UnexpectedError | undefined` - Error fetching user balances
- `state.called: boolean` - Whether the hook has been called
- `state.data: UserBalance[] | undefined` - Array of user wallet balances
- `result: Result<UserBalance[], UnexpectedError>` - Type-safe success or failure value:
  - `Ok<UserBalance[]>` - Array of user wallet balances
  - `Err<UnexpectedError>` - Error fetching user balances

---

## useUserBorrows

Declarative hook to fetch all user borrow positions.

```tsx title="Loading State"
import { useUserBorrows } from "@aave/react";

const { data, loading, error } = useUserBorrows({
  pause,
  ...request,
});
```

```tsx title="React Suspense"
const { data } = useUserBorrows({
  pause,
  suspense: true,
  ...request,
});
```

**Arguments:**

- `request.query: UserBorrowsRequestQuery` one of:
  - `userSpoke: UserSpokeInput` - Get borrows for user on spoke
    - `spoke: SpokeId` - Spoke ID
    - `user: EvmAddress` - User address
  - `userToken: UserToken` - Get borrows for user for token
    - `user: EvmAddress` - User address
    - `token: Erc20Input` - Token input
      - `address: EvmAddress` - Token contract address
      - `chainId: ChainId` - Token chain ID
  - `userPositionId: UserPositionId` - Get borrows for user position
  - `userChains: UserChains` - Get borrows for user across chains
    - `user: EvmAddress` - User address
    - `chainIds: [ChainId!]` - Chain IDs
  - `userHub: UserHub` - Get borrows for user on hub
    - `user: EvmAddress` - User address
    - `hub: UserHubInput` - Hub input (hub ID or hub details)
- `request.orderBy?: UserBorrowsRequestOrderBy` one of:
  - `assetName: OrderDirection` - Sort by asset name
  - `created: OrderDirection` - Sort by creation date
  - `amount: OrderDirection` - Sort by borrow amount
  - `apy: OrderDirection` - Sort by APY
- `request.includeZeroBalances?: boolean` - Include zero balances (default: false)
- `request.currency?: Currency` - Currency for value conversions (optional)
- `pause?: boolean` - Pause the query (default: false)

**Returns:**

- `data: UserBorrowItem[] | undefined` - Array of user borrow positions
- `loading: boolean` - Loading state
- `error: UnexpectedError | undefined` - Error fetching user borrows

---

## useUserBorrowsAction

Imperative hook to fetch user borrow positions.

```tsx
import { useUserBorrowsAction } from "@aave/react";

const [execute, state] = useUserBorrowsAction(options);

const result = await execute(request);
```

**Options:**

- `options.currency?: Currency` - Currency for value conversions (default: USD)

**Arguments:**

- `request.query: UserBorrowsRequestQuery` one of:
  - `userSpoke: UserSpokeInput` - Get borrows for user on a spoke
    - `spoke: SpokeId` - Spoke ID
    - `user: EvmAddress` - User address
  - `userToken: UserToken` - Get borrows for user for a specific token
    - `user: EvmAddress` - User address
    - `token: Erc20Input` - Token input
      - `address: EvmAddress` - Token contract address
      - `chainId: ChainId` - Token chain ID
  - `userPositionId: UserPositionId` - Get borrows for a user position
  - `userChains: UserChains` - Get borrows for user across chains
    - `user: EvmAddress` - User address
    - `chainIds: [ChainId!]` - Chain IDs
  - `userHub: UserHub` - Get borrows for user on hub
    - `user: EvmAddress` - User address
    - `hub: UserHubInput` - Hub input (hub ID or hub details)
- `request.orderBy?: UserBorrowsRequestOrderBy` one of:
  - `assetName: OrderDirection` - Sort by asset name
  - `created: OrderDirection` - Sort by creation date
  - `amount: OrderDirection` - Sort by borrow amount
  - `apy: OrderDirection` - Sort by APY

**Returns:**

- `state.loading: boolean` - Loading state
- `state.error: UnexpectedError | undefined` - Error fetching user borrows
- `state.called: boolean` - Whether the hook has been called
- `state.data: UserBorrowItem[] | undefined` - Array of user borrow positions
- `result: Result<UserBorrowItem[], UnexpectedError>` - Type-safe success or failure value:
  - `Ok<UserBorrowItem[]>` - Array of user borrow positions
  - `Err<UnexpectedError>` - Error fetching user borrows

---

## useUserClaimableRewards

Declarative hook to fetch all claimable rewards for a user on a specific chain.

```tsx title="Loading State"
import { useUserClaimableRewards } from "@aave/react";

const { data, loading, error } = useUserClaimableRewards({
  pause,
  ...request,
});
```

```tsx title="React Suspense"
const { data } = useUserClaimableRewards({
  pause,
  suspense: true,
  ...request,
});
```

**Arguments:**

- `request.user: EvmAddress` - User address
- `request.chainId: ChainId` - Chain ID
- `pause?: boolean` - Pause the query (default: false)

**Returns:**

- `data: UserClaimableReward[] | undefined` - Claimable rewards
- `loading: boolean` - Loading state
- `error: UnexpectedError | undefined` - Error fetching the rewards

---

## useUserClaimableRewardsAction

Imperative hook to fetch a user's claimable rewards on demand. Does not watch for updated data; use it to retrieve data as part of a larger workflow.

```tsx
import { useUserClaimableRewardsAction } from "@aave/react";

const [execute, state] = useUserClaimableRewardsAction();

const result = await execute(request);
```

**Arguments:**

- `request.user: EvmAddress` - User address
- `request.chainId: ChainId` - Chain ID

**Returns:**

- `state.loading: boolean` - Loading state
- `state.error: UnexpectedError | undefined` - Error fetching the rewards
- `state.called: boolean` - Whether the hook has been called
- `state.data: UserClaimableReward[] | undefined` - Claimable rewards
- `result: Result<UserClaimableReward[], UnexpectedError>` - Type-safe success or failure value:
  - `Ok<UserClaimableReward[]>` - Claimable rewards
  - `Err<UnexpectedError>` - Error fetching the rewards

---

## useUserPosition

Declarative hook to fetch a specific user position by ID.

```tsx title="Loading State"
import { useUserPosition } from "@aave/react";

const { data, loading, error } = useUserPosition({
  pause,
  ...request,
});
```

```tsx title="React Suspense"
const { data } = useUserPosition({
  pause,
  suspense: true,
  ...request,
});
```

**Arguments:**

- `request.id: UserPositionId` - Unique position identifier
- `request.user: EvmAddress` - User address
- `request.currency?: Currency` - Currency for value conversions (optional)
- `request.timeWindow?: TimeWindow` - Time window for historical data (optional)
- `pause?: boolean` - Pause the query (default: false)

**Returns:**

- `data: UserPosition | null | undefined` - User position or null if not found
- `loading: boolean` - Loading state
- `error: UnexpectedError | undefined` - Error fetching the user position

---

## useUserPositions

Declarative hook to fetch all user positions across specified chains.

```tsx title="Loading State"
import { useUserPositions } from "@aave/react";

const { data, loading, error } = useUserPositions({
  pause,
  ...request,
});
```

```tsx title="React Suspense"
const { data } = useUserPositions({
  pause,
  suspense: true,
  ...request,
});
```

**Arguments:**

- `request.user: EvmAddress` - User address
- `request.filter: UserPositionsRequestFilter` one of:
  - `tokens: [Erc20Input!]` - Filter by tokens
    - `address: EvmAddress` - Token contract address
    - `chainId: ChainId` - Token chain ID
  - `chainIds: [ChainId!]` - Filter by chain IDs
- `request.orderBy?: UserPositionsRequestOrderBy` one of:
  - `created: OrderDirection` - Sort by creation date
  - `balance: OrderDirection` - Sort by position balance
  - `netApy: OrderDirection` - Sort by net APY
  - `healthFactor: OrderDirection` - Sort by health factor
  - `netCollateral: OrderDirection` - Sort by net collateral
- `request.currency?: Currency` - Currency for value conversions (optional)
- `request.timeWindow?: TimeWindow` - Time window for historical data (optional)
- `pause?: boolean` - Pause the query (default: false)

**Returns:**

- `data: UserPosition[] | undefined` - Array of user positions
- `loading: boolean` - Loading state
- `error: UnexpectedError | undefined` - Error fetching user positions

---

## useUserPositionsAction

Imperative hook to fetch user positions.

```tsx
import { useUserPositionsAction } from "@aave/react";

const [execute, state] = useUserPositionsAction(options);

const result = await execute(request);
```

**Options:**

- `options.currency?: Currency` - Currency for value conversions (default: USD)
- `options.timeWindow?: TimeWindow` - Time window for historical data (optional)

**Arguments:**

- `request.user: EvmAddress` - User address
- `request.filter: UserPositionsRequestFilter` one of:
  - `tokens: [Erc20Input!]` - Filter by tokens
    - `address: EvmAddress` - Token contract address
    - `chainId: ChainId` - Token chain ID
  - `chainIds: [ChainId!]` - Filter by chain IDs
- `request.orderBy?: UserPositionsRequestOrderBy` one of:
  - `created: OrderDirection` - Sort by creation date
  - `balance: OrderDirection` - Sort by position balance
  - `netApy: OrderDirection` - Sort by net APY
  - `healthFactor: OrderDirection` - Sort by health factor
  - `netCollateral: OrderDirection` - Sort by net collateral

**Returns:**

- `state.loading: boolean` - Loading state
- `state.error: UnexpectedError | undefined` - Error fetching user positions
- `state.called: boolean` - Whether the hook has been called
- `state.data: UserPosition[] | undefined` - Array of user positions
- `result: Result<UserPosition[], UnexpectedError>` - Type-safe success or failure value:
  - `Ok<UserPosition[]>` - Array of user positions
  - `Err<UnexpectedError>` - Error fetching user positions

---

## useUserRiskPremiumBreakdown

Declarative hook to fetch the risk premium breakdown for a user position or spoke.

```tsx title="Loading State"
import { useUserRiskPremiumBreakdown } from "@aave/react";

const { data, loading, error } = useUserRiskPremiumBreakdown({
  pause,
  ...request,
});
```

```tsx title="React Suspense"
const { data } = useUserRiskPremiumBreakdown({
  pause,
  suspense: true,
  ...request,
});
```

**Arguments:**

- `request.user: EvmAddress` - User address
- `request.query: UserRiskPremiumBreakdownRequestQuery` one of:
  - `userPositionId: UserPositionId` - Get breakdown for user position
  - `userSpoke: UserSpokeInput` - Get breakdown for user on spoke
    - `user: EvmAddress` - User address
    - `spoke: SpokeId` - Spoke ID
- `pause?: boolean` - Pause the query (default: false)

**Returns:**

- `data: UserRiskPremiumBreakdownItem[] | undefined` - Array of risk premium breakdown items
- `loading: boolean` - Loading state
- `error: UnexpectedError | undefined` - Error fetching the risk premium breakdown

---

## useUserSupplies

Declarative hook to fetch all user supply positions.

```tsx title="Loading State"
import { useUserSupplies } from "@aave/react";

const { data, loading, error } = useUserSupplies({
  pause,
  ...request,
});
```

```tsx title="React Suspense"
const { data } = useUserSupplies({
  pause,
  suspense: true,
  ...request,
});
```

**Arguments:**

- `request.query: UserSuppliesRequestQuery` one of:
  - `userSpoke: UserSpokeInput` - Get supplies for user on spoke
    - `spoke: SpokeId` - Spoke ID
    - `user: EvmAddress` - User address
  - `userToken: UserToken` - Get supplies for user for token
    - `user: EvmAddress` - User address
    - `token: Erc20Input` - Token input
      - `address: EvmAddress` - Token contract address
      - `chainId: ChainId` - Token chain ID
  - `userPositionId: UserPositionId` - Get supplies for user position
  - `userChains: UserChains` - Get supplies for user across chains
    - `user: EvmAddress` - User address
    - `chainIds: [ChainId!]` - Chain IDs
  - `userHub: UserHub` - Get supplies for user on hub
    - `user: EvmAddress` - User address
    - `hub: UserHubInput` - Hub input (hub ID or hub details)
- `request.orderBy?: UserSuppliesRequestOrderBy` one of:
  - `assetName: OrderDirection` - Sort by asset name
  - `created: OrderDirection` - Sort by creation date
  - `amount: OrderDirection` - Sort by supply amount
  - `apy: OrderDirection` - Sort by APY
- `request.includeZeroBalances?: boolean` - Include zero balances (default: false)
- `request.currency?: Currency` - Currency for value conversions (optional)
- `pause?: boolean` - Pause the query (default: false)

**Returns:**

- `data: UserSupplyItem[] | undefined` - Array of user supply positions
- `loading: boolean` - Loading state
- `error: UnexpectedError | undefined` - Error fetching user supplies

---

## useUserSuppliesAction

Imperative hook to fetch user supply positions.

```tsx
import { useUserSuppliesAction } from "@aave/react";

const [execute, state] = useUserSuppliesAction(options);

const result = await execute(request);
```

**Options:**

- `options.currency?: Currency` - Currency for value conversions (default: USD)

**Arguments:**

- `request.query: UserSuppliesRequestQuery` one of:
  - `userSpoke: UserSpokeInput` - Get supplies for user on a spoke
    - `spoke: SpokeId` - Spoke ID
    - `user: EvmAddress` - User address
  - `userToken: UserToken` - Get supplies for user for a specific token
    - `user: EvmAddress` - User address
    - `token: Erc20Input` - Token input
      - `address: EvmAddress` - Token contract address
      - `chainId: ChainId` - Token chain ID
  - `userPositionId: UserPositionId` - Get supplies for a user position
  - `userChains: UserChains` - Get supplies for user across chains
    - `user: EvmAddress` - User address
    - `chainIds: [ChainId!]` - Chain IDs
  - `userHub: UserHub` - Get supplies for user on hub
    - `user: EvmAddress` - User address
    - `hub: UserHubInput` - Hub input (hub ID or hub details)
- `request.orderBy?: UserSuppliesRequestOrderBy` one of:
  - `assetName: OrderDirection` - Sort by asset name
  - `created: OrderDirection` - Sort by creation date
  - `amount: OrderDirection` - Sort by supply amount
  - `apy: OrderDirection` - Sort by APY

**Returns:**

- `state.loading: boolean` - Loading state
- `state.error: UnexpectedError | undefined` - Error fetching user supplies
- `state.called: boolean` - Whether the hook has been called
- `state.data: UserSupplyItem[] | undefined` - Array of user supply positions
- `result: Result<UserSupplyItem[], UnexpectedError>` - Type-safe success or failure value:
  - `Ok<UserSupplyItem[]>` - Array of user supply positions
  - `Err<UnexpectedError>` - Error fetching user supplies

---

## useUserSummary

Declarative hook to fetch a user's financial summary.

```tsx title="Loading State"
import { useUserSummary } from "@aave/react";

const { data, loading, error } = useUserSummary({
  pause,
  ...request,
});
```

```tsx title="React Suspense"
const { data } = useUserSummary({
  pause,
  suspense: true,
  ...request,
});
```

**Arguments:**

- `request.user: EvmAddress` - User address
- `request.filter?.spoke.address: EvmAddress` - Filter by spoke address (optional)
- `request.filter?.spoke.chainId: ChainId` - Filter by chain ID (optional)
- `request.currency?: Currency` - Currency for value conversions (optional)
- `request.timeWindow?: TimeWindow` - Time window for historical data (optional)
- `pause?: boolean` - Pause the query (default: false)

**Returns:**

- `data: UserSummary | undefined` - Aggregated metrics including total collateral, total debt, health factor, etc.
- `loading: boolean` - Loading state
- `error: UnexpectedError | undefined` - Error fetching the user summary

---

## useUserSummaryHistory

Declarative hook to fetch user summary history over time.

```tsx title="Loading State"
import { useUserSummaryHistory } from "@aave/react";

const { data, loading, error } = useUserSummaryHistory({
  pause,
  ...request,
});
```

```tsx title="React Suspense"
const { data } = useUserSummaryHistory({
  pause,
  suspense: true,
  ...request,
});
```

**Arguments:**

- `request.user: EvmAddress` - User address
- `request.window: TimeWindow` - Time window for historical data
- `request.filter?.chainIds: ChainId[]` - Filter by specific chain IDs (optional)
- `request.currency?: Currency` - Currency for value conversions (optional)
- `pause?: boolean` - Pause the query (default: false)

**Returns:**

- `data: UserSummaryHistoryItem[] | undefined` - Array of historical user summary data points
- `loading: boolean` - Loading state
- `error: UnexpectedError | undefined` - Error fetching the user summary history

---

## useWithdraw

Imperative transaction hook to withdraw supplied assets.

```tsx
import { useWithdraw } from "@aave/react";

const [execute, state] = useWithdraw((plan) => {
  switch (plan.__typename) {
    case "TransactionRequest":
      return sendTransaction(plan);
    case "PreContractActionRequired":
      return sendTransaction(plan.transaction);
  }
});

const result = await execute(request);
```

**Arguments:**

- `request.chainId: ChainId` - Chain ID
- `request.reserve: EvmAddress` - Reserve address
- `request.amount: BigDecimal` - Amount to withdraw
- `request.to?: EvmAddress` - Recipient address (optional, defaults to caller)

**Returns:**

- `state.loading: boolean` - Loading state
- `state.error: E | undefined` - Error executing the transaction
- `state.called: boolean` - Whether the hook has been called
- `state.data: TransactionReceipt | undefined` - Transaction receipt
- `result: Result<TransactionReceipt, E>` - Type-safe success or failure value:
  - `Ok<TransactionReceipt>` - Transaction receipt
  - `Err<E>` - Error executing the transaction

Where `E` is one of:

- `SendTransactionError`
- `CancelError`
- `TimeoutError`
- `TransactionError`
- `UnexpectedError`
- `ValidationError<InsufficientBalanceError>`

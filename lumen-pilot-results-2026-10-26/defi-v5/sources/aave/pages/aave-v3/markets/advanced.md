# Advanced Features

Implement advanced Aave features for sophisticated DeFi applications.

## User Transaction History

Track user transaction history across Aave markets with detailed transaction information.

<tabgroup>
<tab label="React">

Use the `useUserTransactionHistory` hook to fetch paginated transaction history for a user.

```ts title="Loading State"
const { data, loading, error } = useUserTransactionHistory({
  market: EvmAddress,
  user: EvmAddress,
  chainId: ChainId,
  filter?: UserTransactionType[],
  orderBy?: UserTransactionHistoryRequestOrderBy,
  pageSize?: PageSize,
  cursor?: Cursor,
});
```

```ts title="React Suspense"
const { data } = useUserTransactionHistory({
  market: EvmAddress,
  user: EvmAddress,
  chainId: ChainId,
  filter?: UserTransactionType[],
  orderBy?: UserTransactionHistoryRequestOrderBy,
  pageSize?: PageSize,
  cursor?: Cursor,
  suspense: true,
});
```

Fetch user transaction history ordered by date.

```tsx title="User Transaction History"
import {
  useUserTransactionHistory,
  evmAddress,
  chainId,
  PageSize,
  OrderDirection,
} from "@aave/react";

// …

const { data, loading, error } = useUserTransactionHistory({
  market: evmAddress("0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2"),
  user: evmAddress("0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234"),
  chainId: chainId(1),
  orderBy: { date: OrderDirection.DESC },
  pageSize: PageSize.FIFTY,
});

if (loading) {
  return Loading transaction history...;
}

if (error) {
  return Error: {error.message};
}

// data.items: UserTransactionItem[]
// data.pageInfo.next: Cursor | null
// data.pageInfo.prev: Cursor | null
```

Filter transactions by type.

```tsx title="Filtered Transaction History"
import {
  useUserTransactionHistory,
  evmAddress,
  chainId,
  PageSize,
  OrderDirection,
  UserTransactionType,
} from "@aave/react";

// …

const { data, loading, error } = useUserTransactionHistory({
  market: evmAddress("0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2"),
  user: evmAddress("0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234"),
  chainId: chainId(1),
  filter: [UserTransactionType.SUPPLY, UserTransactionType.WITHDRAW],
  orderBy: { date: OrderDirection.DESC },
  pageSize: PageSize.TEN,
});
```

</tab>
<tab label="TypeScript">

Use the `userTransactionHistory` action to fetch paginated transaction history for a user.

```ts title="User Transaction History"
import {
  userTransactionHistory,
  evmAddress,
  chainId,
  PageSize,
  OrderDirection,
} from "@aave/client/actions";

import { client } from "./client";

const result = await userTransactionHistory(client, {
  market: evmAddress("0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2"),
  user: evmAddress("0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234"),
  chainId: chainId(1),
  orderBy: { date: OrderDirection.DESC },
  pageSize: PageSize.FIFTY,
});

if (result.isErr()) {
  console.error("User transaction history error:", result.error);
} else {
  // result.value.items: UserTransactionItem[]
  // result.value.pageInfo.next: Cursor | null
  // result.value.pageInfo.prev: Cursor | null
  console.log(result.value);
}
```

```ts title="Filtered Transaction History"
import {
  userTransactionHistory,
  evmAddress,
  chainId,
  PageSize,
  OrderDirection,
  UserTransactionType,
} from "@aave/client/actions";

import { client } from "./client";

const result = await userTransactionHistory(client, {
  market: evmAddress("0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2"),
  user: evmAddress("0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234"),
  chainId: chainId(1),
  filter: [UserTransactionType.SUPPLY, UserTransactionType.BORROW],
  orderBy: { date: OrderDirection.DESC },
  pageSize: PageSize.TEN,
});
```

```ts title="client.ts"
import { AaveClient } from "@aave/client";

export const client = AaveClient.create();
```

</tab>
<tab label="GraphQL">

Use the `userTransactionHistory` query to fetch paginated transaction history for a user.

```graphql title="Query"
query {
  userTransactionHistory(
    request: {
      market: "0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2"
      user: "0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234"
      chainId: 1
      orderBy: { date: DESC }
      pageSize: FIFTY
    }
  ) {
    items {
      ... on UserSupplyTransaction {
        ...UserSupplyTransaction
      }
      ... on UserWithdrawTransaction {
        ...UserWithdrawTransaction
      }
      ... on UserBorrowTransaction {
        ...UserBorrowTransaction
      }
      ... on UserRepayTransaction {
        ...UserRepayTransaction
      }
      ... on UserUsageAsCollateralTransaction {
        ...UserUsageAsCollateralTransaction
      }
      ... on UserLiquidationCallTransaction {
        ...UserLiquidationCallTransaction
      }
    }
    pageInfo {
      next
      prev
    }
  }
}
```

```graphql title="Filtered Query"
query {
  userTransactionHistory(
    request: {
      market: "0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2"
      user: "0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234"
      chainId: 1
      filter: [SUPPLY, WITHDRAW]
      orderBy: { date: DESC }
      pageSize: TEN
    }
  ) {
    items {
      __typename
      ...UserSupplyTransaction
      ...UserWithdrawTransaction
    }
    pageInfo {
      next
      prev
    }
  }
}
```

```graphql title="fragments"
fragment UserSupplyTransaction on UserSupplyTransaction {
  blockExplorerUrl
  txHash
  timestamp
  amount {
    amount {
      value
      raw
      decimals
    }
    usd
  }
  reserve {
    underlyingToken {
      symbol
      name
      address
    }
  }
}

fragment UserWithdrawTransaction on UserWithdrawTransaction {
  blockExplorerUrl
  txHash
  timestamp
  amount {
    amount {
      value
      raw
      decimals
    }
    usd
  }
  reserve {
    underlyingToken {
      symbol
      name
      address
    }
  }
}

fragment UserBorrowTransaction on UserBorrowTransaction {
  blockExplorerUrl
  txHash
  timestamp
  amount {
    amount {
      value
      raw
      decimals
    }
    usd
  }
  reserve {
    underlyingToken {
      symbol
      name
      address
    }
  }
}

fragment UserRepayTransaction on UserRepayTransaction {
  blockExplorerUrl
  txHash
  timestamp
  amount {
    amount {
      value
      raw
      decimals
    }
    usd
  }
  reserve {
    underlyingToken {
      symbol
      name
      address
    }
  }
}

fragment UserUsageAsCollateralTransaction on UserUsageAsCollateralTransaction {
  blockExplorerUrl
  txHash
  timestamp
  enabled
  reserve {
    underlyingToken {
      symbol
      name
      address
    }
  }
}

fragment UserLiquidationCallTransaction on UserLiquidationCallTransaction {
  blockExplorerUrl
  txHash
  timestamp
  collateral {
    reserve {
      underlyingToken {
        symbol
        name
        address
      }
    }
    amount {
      amount {
        value
      }
      usd
    }
  }
  debtRepaid {
    reserve {
      underlyingToken {
        symbol
        name
        address
      }
    }
    amount {
      amount {
        value
      }
      usd
    }
  }
}
```

```json title="Response"
{
  "data": {
    "userTransactionHistory": {
      "items": [
        {
          "__typename": "UserSupplyTransaction",
          "amount": {
            "amount": {
              "value": "1000.0",
              "raw": "1000000000",
              "decimals": 6
            },
            "usd": "1000.0"
          },
          "reserve": {
            "underlyingToken": {
              "symbol": "USDC",
              "name": "USD Coin",
              "address": "0xA0b86a33E6441c8c5f0bb9b7e5e1f8bbf5b78b5c"
            }
          },
          "blockExplorerUrl": "https://etherscan.io/tx/0xeef2ffc57b99ce887edd8362c6d57e5c7a4d8c8a9b2c3d4e5f6789abc123def45",
          "txHash": "0xeef2ffc57b99ce887edd8362c6d57e5c7a4d8c8a9b2c3d4e5f6789abc123def45",
          "timestamp": "2024-03-15T14:30:00Z"
        },
        {
          "__typename": "UserBorrowTransaction",
          "amount": {
            "amount": {
              "value": "0.5",
              "raw": "500000000000000000",
              "decimals": 18
            },
            "usd": "1250.0"
          },
          "reserve": {
            "underlyingToken": {
              "symbol": "WETH",
              "name": "Wrapped Ether",
              "address": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
            }
          },
          "blockExplorerUrl": "https://etherscan.io/tx/0xabc123def456789012345678901234567890abcdef456789012345678901234",
          "txHash": "0xabc123def456789012345678901234567890abcdef456789012345678901234",
          "timestamp": "2024-03-14T10:15:00Z"
        }
      ],
      "pageInfo": {
        "next": "eyJpZCI6IjB4MTIzNDU2Nzg5MGFiY2RlZjEyMzQ1Njc4OTBhYmNkZWYxMjM0NTY3OC00MSJ9",
        "prev": null
      }
    }
  }
}
```

</tab>
</tabgroup>
### Transaction Types

The user transaction history includes the following transaction types with their specific data:

- **`SUPPLY`** - Asset supply transactions with amount and reserve information
- **`WITHDRAW`** - Asset withdrawal transactions with amount and reserve information
- **`BORROW`** - Asset borrowing transactions with amount and reserve information
- **`REPAY`** - Debt repayment transactions with amount and reserve information
- **`USAGE_AS_COLLATERAL`** - Collateral enable/disable transactions with `enabled` flag
- **`LIQUIDATION_CALL`** - Liquidation transactions with collateral and debt repaid details

### Filtering Options

Use the `filter` parameter to narrow down transaction results by transaction types:

```tsx
filter: [UserTransactionType.SUPPLY, UserTransactionType.WITHDRAW];
```

Available filter values: `SUPPLY`, `WITHDRAW`, `BORROW`, `REPAY`, `USAGE_AS_COLLATERAL`, `LIQUIDATION_CALL`

### Ordering Options

Order transactions using the `orderBy` parameter:

- **`date`** - Order by transaction date (ASC or DESC)

## Efficiency Mode (eMode)

High Efficiency Mode (eMode) in Aave optimizes borrowing power for price-correlated assets. This feature is particularly useful when both supplied and borrowed assets share similar economic price movements, such as stablecoins or derivatives that track the same underlying asset. By using eMode, users benefit from lower collateral requirements, effectively increasing their available borrowing capacity for correlated assets.

To enable efficiency mode and maximize capital efficiency for correlated assets, follow these steps.

### Check Available eMode Categories

First, check the available eMode categories on the market to understand which category to enable.

Let's say we have the following market object with available eMode categories:

```ts title="Market"
const market: Market = {
  __typename: "Market",
  name: "Aave v3 Ethereum",
  address: "0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2",
  chain: {
    __typename: "Chain",
    chainId: 1,
    name: "Ethereum",
    // …
  },
  eModeCategories: [
    {
      __typename: "EmodeMarketCategory",
      id: 1,
      label: "Stablecoins",
      maxLTV: {
        __typename: "DecimalValue",
        value: "0.97",
        // …
      },
      liquidationThreshold: {
        __typename: "DecimalValue",
        value: "0.975",
        // …
      },
      liquidationPenalty: {
        __typename: "DecimalValue",
        value: "0.01",
        // …
      },
      reserves: [
        {
          __typename: "EmodeMarketReserveInfo",
          underlyingToken: {
            __typename: "Currency",
            symbol: "USDC",
            name: "USD Coin",
            address: "0xA0b86a33E6441c8c5f0bb9b7e5e1f8bbf5b78b5c",
            // …
          },
          canBeCollateral: true,
          canBeBorrowed: true,
        },
        // … more reserves
      ],
      // …
    },
    // … more categories
  ],
  // …
};
```

Where each `EmodeMarketCategory` object has the following properties:

- **`maxLTV.value`** - Maximum borrowing power (% of supplied collateral you can borrow)
- **`liquidationThreshold.value`** - How close you can get to liquidation (higher = safer)
- **`liquidationPenalty.value`** - How much you lose if liquidation happens (lower = better)
- **`reserves[]`** - an array of `EmodeMarketReserveInfo` objects, each representing a reserve that indicates if the asset can be used as collateral and/or borrowed in this specific eMode.

### Prepare the Transaction Request

Next, we can proceed with creating the transaction request for the desired eMode operation.

<tabgroup>
<tab label="React">

Use the `useUserSetEmode` hook to create the transaction request for enabling or disabling efficiency mode.

```tsx title="Enable eMode Category"
import { useWalletClient } from "wagmi";
import { useUserSetEmode, evmAddress } from "@aave/react";

// …

const { data: walletClient } = useWalletClient();

const [setEmode, settingEmode] = useUserSetEmode();

const execute = async () => {
  const result = await setEmode({
    market: market.address,
    user: evmAddress(walletClient!.account.address),
    categoryId: 1, // Enable category 1 (Stablecoins)
    chainId: market.chain.chainId,
  });

  // …
};
```

To disable eMode, set `categoryId` to `null`:

```tsx title="Disable eMode"
import { useWalletClient } from "wagmi";
import { useUserSetEmode, evmAddress } from "@aave/react";

// …

const { data: walletClient } = useWalletClient();

const [setEmode, settingEmode] = useUserSetEmode();

const execute = async () => {
  const result = await setEmode({
    market: market.address,
    user: evmAddress(walletClient!.account.address),
    categoryId: null, // Disable eMode
    chainId: market.chain.chainId,
  });

  // …
};
```

</tab>

<tab label="TypeScript">

Use the `userSetEmode` action to create the transaction request for enabling or disabling efficiency mode.

```ts title="Enable eMode"
import { userSetEmode } from "@aave/client/actions";
import { evmAddress } from "@aave/client";

import { client } from "./client";
import { wallet } from "./wallet";

const result = await userSetEmode(client, {
  market: market.address,
  user: evmAddress(wallet.account.address),
  categoryId: 1, // Enable category 1 (Stablecoins)
  chainId: market.chain.chainId,
});

// …
```

```ts title="Disable eMode"
import { userSetEmode } from "@aave/client/actions";
import { evmAddress } from "@aave/client";

import { client } from "./client";
import { wallet } from "./wallet";

const result = await userSetEmode(client, {
  market: market.address,
  user: evmAddress(wallet.account.address),
  categoryId: null, // Disable eMode
  chainId: market.chain.chainId,
});

// …
```

```ts title="client.ts"
import { AaveClient } from "@aave/client";

export const client = AaveClient.create();
```

```ts title="wallet.ts"
import { createWalletClient, http, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { mainnet } from "viem/chains";

export const wallet = createWalletClient({
  account: privateKeyToAccount(process.env.PRIVATE_KEY as Hex),
  chain: mainnet,
  transport: http(),
});
```

</tab>

<tab label="GraphQL">

Use the `userSetEmode` query to create the transaction request for enabling or disabling efficiency mode.

```graphql title="Query"
query {
  userSetEmode(
    request: {
      market: "0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2"
      user: "0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234"
      categoryId: 1 # Enable category 1, or null to disable
      chainId: 1
    }
  ) {
    to
    from
    data
    value
    chainId
  }
}
```

</tab>
</tabgroup>
### Send the Transaction

Finally, send the transaction.

<tabgroup>
<tab label="React">

Use the `useSendTransaction` hook for the [wallet library of your choice](../getting-started/react#integrations-send-aave-transactions) to send the transaction.

```tsx title="Viem"
import { useWalletClient } from "wagmi";
import { useUserSetEmode } from "@aave/react";
import { useSendTransaction } from "@aave/react/viem";

// …

const { data: walletClient } = useWalletClient();

const [setEmode, settingEmode] = useUserSetEmode();
const [sendTransaction, sending] = useSendTransaction(walletClient);

// …

// Optional: combine loading states
const loading = settingEmode.loading || sending.loading;
const error = settingEmode.error || sending.error;

// …

const execute = async () => {
  const result = await setEmode({
    // …
  }).andThen(sendTransaction);

  if (result.isErr()) {
    console.error("eMode operation failed:", result.error);
  } else {
    console.log("eMode operation successful with hash:", result.value);
  }
};
```

</tab>

<tab label="TypeScript">

Use `sendWith` for your [chosen wallet library](../getting-started/typescript#integrations-send-aave-transactions) to initiate the transaction, and await indexing with `client.waitForTransaction`.

```ts title="Viem"
import { userSetEmode } from "@aave/client/actions";
import { sendWith } from "@aave/client/viem";

import { client } from "./client";
import { wallet } from "./wallet";

const result = await userSetEmode(client, {
  // …
})
  .andThen(sendWith(wallet))
  .andThen(client.waitForTransaction);

if (result.isErr()) {
  console.error("eMode operation failed:", result.error);
} else {
  console.log("eMode operation successful:", result.value);
}
```

</tab>

<tab label="GraphQL">

The response is a TransactionRequest that can be sent directly using the wallet associated with the `from` address.

```json title="TransactionRequest"
{
  "data": {
    "userSetEmode": {
      "__typename": "TransactionRequest",
      "to": "0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2",
      "from": "0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234",
      "data": "0x28530a47000000000000000000000000000000000000000000000000000000000000000001",
      "value": "0",
      "chainId": 1,
      "operation": "USER_EMODE_SET"
    }
  }
}
```

</tab>
</tabgroup>

## Liquidations

Liquidate undercollateralized positions to earn liquidation bonuses and help maintain protocol stability.

### Identify an Undercollateralized Position

First, identify a target user with a health factor below 1.0, and one of their borrow positions that is eligible for liquidation.

```ts
const targetUser = evmAddress("0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234");
```

Let's say you have identified the following user's borrow position:

```ts title="MarketUserReserveBorrowPosition"
const position: MarketUserReserveBorrowPosition = {
  __typename: "MarketUserReserveBorrowPosition",
  market: {
    __typename: "Market",
    address: "0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2",
    chainId: 1,
    // …
  },
  currency: {
    __typename: "Currency",
    symbol: "WETH",
    name: "Wrapped Ether",
    address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    // …
  },
  debt: {
    __typename: "TokenAmount",
    amount: {
      __typename: "DecimalValue",
      value: "1.5",
      raw: "1500000000000000000",
      decimals: 18,
      // …
    },
    // …
  },
  // …
};
```

> [!NOTE]
> It's not in the scope of this guide to explain how to users with a health
> factor below 1.0 and identify an undercollateralized position.

### Choose the Liquidation Bonus

Next, decide which collateral token to receive as a liquidation bonus from the target user's collateral positions.

Let's say you have identified the following collateral position.

```ts title="MarketUserReserveSupplyPosition"
const collateral: MarketUserReserveSupplyPosition = {
  __typename: "MarketUserReserveSupplyPosition",
  market: {
    __typename: "Market",
    address: "0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2",
    chainId: 1,
    // …
  },
  currency: {
    __typename: "Currency",
    symbol: "USDC",
    name: "USD Coin",
    address: "0xA0b86a33E6441c8c5f0bb9b7e5e1f8bbf5b78b5c",
    // …
  },
  isCollateral: true,
  canBeCollateral: true,
  // …
};
```

### Prepare the Transaction Request

Then, create the transaction request for the liquidation operation.

<tabgroup>
<tab label="React">

Use the `useLiquidate` hook to create the transaction request for liquidating the undercollateralized position.

```tsx title="Liquidate Position"
import { useLiquidate } from "@aave/react";

// …

const [liquidate, liquidating] = useLiquidate();

const execute = async () => {
  const result = await liquidate({
    chainId: position.market.chainId,
    market: position.market.address,
    user: targetUser,
    underlyingToken: position.currency.address,
    debtToCover: { max: true }, // Liquidate maximum debt
    collateralToken: collateral.currency.address,
    receiveAToken: false, // Receive collateral as aToken
  });

  // …
};
```

</tab>

<tab label="TypeScript">

Use the `liquidate` action to create the transaction request for liquidating the undercollateralized position.

```ts title="Liquidate Position"
import { liquidate } from "@aave/client/actions";

import { client } from "./client";

const result = await liquidate(client, {
  chainId: position.market.chainId,
  market: position.market.address,
  user: targetUser,
  underlyingToken: position.currency.address,
  debtToCover: { max: true }, // Liquidate maximum debt
  collateralToken: collateral.currency.address,
  receiveAToken: false, // Receive collateral as aToken
});

// …
```

```ts title="client.ts"
import { AaveClient } from "@aave/client";

export const client = AaveClient.create();
```

</tab>

<tab label="GraphQL">

Use the `liquidate` query to create the transaction request for liquidating the undercollateralized position.

```graphql title="Query"
query {
  liquidate(
    request: {
      chainId: 1
      market: "0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2"
      user: "0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234" # targetUser
      underlyingToken: "0xA0b86a33E6441c8c5f0bb9b7e5e1f8bbf5b78b5c"
      debtToCover: { max: true }
      collateralToken: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
      receiveAToken: false
    }
  ) {
    to
    from
    data
    value
    chainId
  }
}
```

</tab>
</tabgroup>
### Send the Transaction

Finally, send the transaction to execute the liquidation.

<tabgroup>
<tab label="React">

Use the `useSendTransaction` hook for the [wallet library of your choice](../getting-started/react#integrations-send-aave-transactions) to send the transaction.

```tsx title="Viem"
import { useWalletClient } from "wagmi";
import { useLiquidate } from "@aave/react";
import { useSendTransaction } from "@aave/react/viem";

// …

const { data: walletClient } = useWalletClient();

const [liquidate, liquidating] = useLiquidate();
const [sendTransaction, sending] = useSendTransaction(walletClient);

// …

// Optional: combine loading states
const loading = liquidating.loading || sending.loading;
const error = liquidating.error || sending.error;

// …

const execute = async () => {
  const result = await liquidate({
    // …
  }).andThen(sendTransaction);

  if (result.isErr()) {
    console.error("Liquidation failed:", result.error);
  } else {
    console.log("Liquidation successful with hash:", result.value);
  }
};
```

</tab>

<tab label="TypeScript">

Use `sendWith` for your [chosen wallet library](../getting-started/typescript#integrations-send-aave-transactions) to initiate the transaction, and await indexing with `client.waitForTransaction`.

```ts title="Viem"
import { liquidate } from "@aave/client/actions";
import { sendWith } from "@aave/client/viem";

import { client } from "./client";
import { wallet } from "./wallet";

const result = await liquidate(client, {
  // …
})
  .andThen(sendWith(wallet))
  .andThen(client.waitForTransaction);

if (result.isErr()) {
  console.error("Liquidation failed:", result.error);
} else {
  console.log("Liquidation successful:", result.value);
}
```

```ts title="wallet.ts"
import { createWalletClient, http, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { mainnet } from "viem/chains";

export const wallet = createWalletClient({
  account: privateKeyToAccount(process.env.PRIVATE_KEY as Hex),
  chain: mainnet,
  transport: http(),
});
```

</tab>

<tab label="GraphQL">

The response is a TransactionRequest that can be sent directly using the wallet associated with the `from` address.

```json title="TransactionRequest"
{
  "data": {
    "liquidate": {
      "__typename": "TransactionRequest",
      "to": "0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2",
      "from": "0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234",
      "data": "0x00a718a9000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2…",
      "value": "0",
      "chainId": 1,
      "operation": "LIQUIDATION"
    }
  }
}
```

</tab>
</tabgroup>

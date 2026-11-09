# User Position Conditions

Learn how user position conditions work in Aave v4.

---

User positions track **two risk conditions**: Dynamic Risk Configuration and User Risk Premium.

## Dynamic Risk Configuration

Dynamic Risk Configuration, or _Dynamic Config_ for short, snapshots the per-reserve collateral parameters—Collateral Factor, Max Liquidation Bonus, and Protocol Fee—active when the position first became risk-bearing, i.e. when the user initially borrowed against collateral.

It updates when the user performs risk-increasing actions: borrowing, withdrawing collateral, or disabling collateral (updates all reserves' snapshots), or enabling collateral (updates only that reserve's snapshot). It can also be updated manually, and always refreshes the User Risk Premium.

The Dynamic Config values used on first borrow or after an update—implicit or explicit—are exposed on the `Reserve` object under the `settings` field:

```ts title="Live Dynamic Config"
const reserve: Reserve = {
  __typename: "Reserve",
  id: "SGVsbG8h",
  settings: {
    __typename: "ReserveSettings",
    collateralFactor: {
      normalized: BigDecimal(80), // 90%
      // …
    },
    maxLiquidationBonus: {
      normalized: BigDecimal(10), // 10%
      // …
    },
    // protocol fee
    liquidationFee: {
      normalized: BigDecimal(1), // 1%
      // …
    },
    // …
    latestDynamicConfigKey: "1234567890",
  },
  // …
};
```

The snapshotted values are exposed under the Reserve's `userState` field: the Collateral Factor applies to reserves linked by `UserSupplyItem` when used as collateral, while the Max Liquidation Bonus and Protocol Fee apply to reserves linked by `UserBorrowItem`.

```ts title="UserBorrorItem"
const borrowItem: UserBorrowItem = {
  __typename: "UserBorrowItem",
  id: "aGVsbG8=",
  reserve: {
    __typename: "Reserve",
    id: "SGVsbG8h",
    userState: {
      __typename: "ReserveUserState",
      maxLiquidationBonus: {
        normalized: BigDecimal(10), // 10%
        // …
      },
      // protocol fee
      liquidationFee: {
        normalized: BigDecimal(1), // 1%
        // …
      },
      // …
      dynamicConfigKey: "1234567889",
    },
    // …
  },
  // …
};
```

```ts title="UserSupplyItem"
const supplyItem: UserSupplyItem = {
  __typename: "UserSupplyItem",
  id: "aGVsbG8=",
  isCollateral: true,
  reserve: {
    __typename: "Reserve",
    id: "SGVsbG8h",
    userState: {
      __typename: "ReserveUserState",
      collateralFactor: {
        normalized: BigDecimal(80), // 80%
        // …
      },
      // …
      dynamicConfigKey: "1234567889",
    },
    // …
  },
  // …
};
```

## User Risk Premium

User Risk Premium reflects the current risk profile of the collateral assets. In practice, it acts as a multiplier—a percentage applied on top of each reserve's base borrow rate. **Lower is better.**

> [!TIP]
> A high User Risk Premium signals riskier collateral, which in turn results in
> a higher borrowing rate. Conversely, a low User Risk Premium indicates
> higher-quality collateral and leads to reduced borrowing costs.

It updates when the user performs actions that affect collateralization (borrowing, withdrawing collateral, enabling or disabling collateral), when the Dynamic Risk Configuration changes, or when explicitly triggered.

You can keep track of the User Risk Premium for a position by checking the `riskPremium.current` field in the [User Position](./fetch#user-positions-listing-user-positions) response.

```ts title="User Risk Premium"
const userPosition: UserPosition = {
  __typename: "UserPosition",
  id: "aGVsbG8",
  user: "0x456…",
  riskPremium: {
    current: {
      normalized: BigDecimal(50), // 50%
      // …
    },
    latest: {
      normalized: BigDecimal(50), // 50% - same as current
      // …
    },
    breakdown: [
      // …
    ],
  },
  spoke: {
    id: "SGVsbG8h",
    address: "0x123…",
    chain: {
      chainId: 1,
      name: "Ethereum",
      // …
    },
    // …
  },
  // …
};
```

> [!NOTE]
> The example above shows a User Risk Premium of 50%. This means that on an
> asset with a base borrow rate of 5%, the user is paying 7.5% interest on their
> borrow positions (5% + 50% = 7.5%).

The `riskPremium.breakdown` field contains the [User Risk Premium Breakdown](#user-risk-premium-user-risk-premium-breakdown) for the user position collaterals.

### User Risk Premium Breakdown

The User Risk Premium Breakdown shows each collateral asset in a user position, including what percentage of total collateral it represents and its weight in the overall User Risk Premium.

```ts title="User Risk Premium Breakdown"
const breakdown: UserRiskPremiumBreakdownItem[] = [
  {
    __typename: "UserRiskPremiumBreakdownItem",
    token: {
      __typename: "Erc20Token",
      id: "aGVsbG8",
      address: "0x456…",
      name: "USDC",
      symbol: "USDC",
      decimals: 6,
    },
    currentRiskPremiumWeight: {
      __typename: "PercentNumber",
      normalized: BigDecimal(50), // 50%
      // …
    },
    latestRiskPremiumWeight: {
      __typename: "PercentNumber",
      normalized: BigDecimal(45), // 45%
      // …
    },
    collateral: {
      __typename: "PercentNumber",
      normalized: BigDecimal(30), // 30%
      // …
    },
  },
  // …
];
```

Where:

- `currentRiskPremiumWeight` represents the current contribution of this collateral asset to the overall User Risk Premium.
- `latestRiskPremiumWeight` represents the contribution if the User Risk Premium were to be updated.
- `collateral` represents this asset’s share of the position’s total collateral value.

As mentioned above, the breakdown is available in the `riskPremium.breakdown` field of [user positions](./fetch#user-positions-data-structure), or you can use the standalone query explained below.

<tabgroup>
<tab label="React">

Use the `useUserRiskPremiumBreakdown` hook to fetch the breakdown for a specific user position.

```tsx title="Loading State"
import {
  type UserRiskPremiumBreakdownRequest,
  useUserRiskPremiumBreakdown,
} from "@aave/react";

function UserRiskPremiumBreakdown({
  request,
}: {
  request: UserRiskPremiumBreakdownRequest;
}) {
  const { data, loading, error } = useUserRiskPremiumBreakdown(request);

  if (loading) return <div>Loading…</div>;

  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {data.map((item) => (
        <div key={item.token.address}>
          {item.token.symbol}
          <p>
            Current Weight: 
            {item.currentRiskPremiumWeight.normalized.toFixed(2)}%
          </p>
          <p>
            Latest Weight: {item.latestRiskPremiumWeight.normalized.toFixed(2)}%
          </p>
          Collateral: {item.collateral.normalized.toFixed(2)}%
        </div>
      ))}
    </div>
  );
}
```

```tsx title="React Suspense"
import {
  type UserRiskPremiumBreakdownRequest,
  useUserRiskPremiumBreakdown,
} from "@aave/react";

function UserRiskPremiumBreakdown({
  request,
}: {
  request: UserRiskPremiumBreakdownRequest;
}) {
  const { data } = useUserRiskPremiumBreakdown({
    ...request,
    suspense: true,
  });

  return (
    <div>
      {data.map((item) => (
        <div key={item.token.address}>
          {item.token.symbol}
          <p>
            Current Weight: 
            {item.currentRiskPremiumWeight.normalized.toFixed(2)}%
          </p>
          <p>
            Latest Weight: {item.latestRiskPremiumWeight.normalized.toFixed(2)}%
          </p>
          Collateral: {item.collateral.normalized.toFixed(2)}%
        </div>
      ))}
    </div>
  );
}
```

You can query by user position ID or by user spoke:

```tsx title="By User Position ID"
const request: UserRiskPremiumBreakdownRequest = {
  user: evmAddress("0x742d35cc…"),
  query: {
    userPositionId: userPositionId(params.id), // UserPositionId - typically from URL params
  },
};
```

```tsx title="By User and Spoke"
const request: UserRiskPremiumBreakdownRequest = {
  user: evmAddress("0x742d35cc…"),
  query: {
    userSpoke: {
      user: evmAddress("0x742d35cc…"),
      spoke: spoke.id, // spoke: Spoke
    },
  },
};
```

</tab>
<tab label="TypeScript">

Use the `userRiskPremiumBreakdown` action to fetch the breakdown for a specific user position.

```ts title="By User Position ID"
import { userRiskPremiumBreakdown } from "@aave/client/actions";
import { evmAddress, userPositionId } from "@aave/client";

import { client } from "./client";

const result = await userRiskPremiumBreakdown(client, {
  user: evmAddress("0x742d35cc…"),
  query: {
    userPositionId: userPositionId(params.id), // UserPositionId - typically from route params
  },
});

if (result.isOk()) {
  console.log(result.value); // UserRiskPremiumBreakdownItem[]
} else {
  console.error(result.error);
}
```

```ts title="By User and Spoke"
import { userRiskPremiumBreakdown } from "@aave/client/actions";
import { evmAddress, spokeId } from "@aave/client";

const result = await userRiskPremiumBreakdown(client, {
  user: evmAddress("0x742d35cc…"),
  query: {
    userSpoke: {
      user: evmAddress("0x742d35cc…"),
      spoke: spoke.id, // spoke: Spoke
    },
  },
});
```

```ts title="client.ts"
import { AaveClient } from "@aave/client";

export const client = AaveClient.create();
```

</tab>
<tab label="GraphQL">

Use the `userRiskPremiumBreakdown` query to fetch the breakdown for a specific user position.

```graphql title="Query"
query ($request: UserRiskPremiumBreakdownRequest!) {
  userRiskPremiumBreakdown(request: $request) {
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
}
```

```graphql title="Erc20Token"
fragment Erc20Token on Erc20Token {
  address
  info {
    ...TokenInfo
  }
  chain {
    ...Chain
  }
}

fragment TokenInfo on TokenInfo {
  id
  name
  symbol
  icon
  decimals
}

fragment Chain on Chain {
  name
  chainId
  icon
}
```

```graphql title="PercentNumber"
fragment PercentNumber on PercentNumber {
  onChainValue
  decimals
  value
  normalized
}
```

With the following variables:

```json title="By User Position ID"
{
  "request": {
    "user": "0x742d35cc…",
    "query": {
      "userPositionId": "aGVsbG8"
    }
  }
}
```

```json title="By User and Spoke"
{
  "request": {
    "user": "0x742d35cc…",
    "query": {
      "userSpoke": {
        "user": "0x742d35cc…",
        "spoke": "SGVsbG8h"
      }
    }
  }
}
```

</tab>
</tabgroup>
## Update Conditions

As protocol configurations evolve through governance votes, a user position’s conditions may improve.

Updating user position conditions can be broken down into the following steps:

1. Identify eligible positions
2. Preview the impact of the update (optional)
3. Update the position conditions

### Identify Eligible Positions

You can identify positions that qualify for updates by checking if the `riskPremium.latest` is lower than `riskPremium.current` (indicating a better risk premium is available) or the `canUpdateDynamicConfig` field (true when dynamic config can be updated) in the [user's positions](./fetch#user-positions-listing-user-positions).

```ts title="Eligible User Position"
const userPosition: UserPosition = {
  __typename: "UserPosition",
  id: "aGVsbG8",
  user: "0x456…",
  riskPremium: {
    current: {
      normalized: BigDecimal(50), // 50%
      // …
    },
    latest: {
      normalized: BigDecimal(25), // 25% - lower is better
      // …
    },
    breakdown: [
      // …
    ],
  },
  spoke: {
    id: "SGVsbG8h",
    address: "0x123…",
    chain: {
      chainId: 1,
      name: "Ethereum",
      // …
    },
    // …
  },
  canUpdateDynamicConfig: true,
  // …
};
```

### Preview the Impact

Preview the impact of updating the user position conditions before committing to it.

<tabgroup>
<tab label="React">

Use the `usePreview` hook (or the imperative `usePreviewAction` variant) to preview the impact of updating the user position conditions.

```tsx title="Loading State"
import {
  type UpdateUserPositionConditionsRequest,
  usePreview,
} from "@aave/react";

function UserPositionConditionsPreview({
  request,
}: {
  request: UpdateUserPositionConditionsRequest;
}) {
  const { data, error, loading } = usePreview({
    action: {
      updateUserPositionConditions: request,
    },
  });

  if (loading) return <div>Loading…</div>;
  if (error) return <div>Error: {error.message}</div>;

  // data: PreviewUserPosition
  return (
    <div>
      <h3>Health Factor:</h3>
      From: {data.healthFactor.current?.value.toFixed(2) ?? "N/A"}
      To: {data.healthFactor.after?.value.toFixed(2) ?? "N/A"}

      <h3>User Risk Premium:</h3>
      From: {data.riskPremium.current.normalized.toFixed(2)}%
      To: {data.riskPremium.after.normalized.toFixed(2)}%

      <h3>Max Borrowing Power:</h3>
      From: {data.maxBorrowingPower.current.value.toDisplayString(2)}
      To: {data.maxBorrowingPower.after.value.toDisplayString(2)}
    </div>
  );
}
```

```tsx title="React Suspense"
import {
  type UpdateUserPositionConditionsRequest,
  usePreview,
} from "@aave/react";

function UserPositionConditionsPreview({
  request,
}: {
  request: UpdateUserPositionConditionsRequest;
}) {
  const { data, error, loading } = usePreview({
    action: {
      updateUserPositionConditions: request,
    },
    suspense: true,
  });

  // data: PreviewUserPosition
  return (
    <div>
      <h3>Health Factor:</h3>
      From: {data.healthFactor.current?.value.toFixed(2) ?? "N/A"}
      To: {data.healthFactor.after?.value.toFixed(2) ?? "N/A"}

      <h3>User Risk Premium:</h3>
      From: {data.riskPremium.current.normalized.toFixed(2)}%
      To: {data.riskPremium.after.normalized.toFixed(2)}%

      <h3>Max Borrowing Power:</h3>
      From: {data.maxBorrowingPower.current.value.toDisplayString(2)}
      To: {data.maxBorrowingPower.after.value.toDisplayString(2)}
    </div>
  );
}
```

```tsx title="Imperative Read"
import { usePreviewAction } from "@aave/react";

// …

const [preview, { called, data, error, loading }] = usePreviewAction();

const handler = async (request: UpdateUserPositionConditionsRequest) => {
  const result = await preview({
    action: {
      updateUserPositionConditions: request,
    },
  });

  if (result.isOk()) {
    console.log(result.value); // PreviewUserPosition
  } else {
    console.error(result.error);
  }
};
```

See below for examples of `UpdateUserPositionConditionsRequest` objects.

```ts title="Update User Risk Premium"
const request: UpdateUserPositionConditionsRequest = {
  userPositionId: userPosition.id,
  update: UserPositionConditionsUpdate.JustRiskPremium,
};
```

```ts title="Update All Dynamic Config"
const request: UpdateUserPositionConditionsRequest = {
  userPositionId: userPosition.id,
  update: UserPositionConditionsUpdate.AllDynamicConfig,
};
```

> [!WARNING]
> Remember that updating Dynamic Config will also update the User Risk Premium.

The `PreviewUserPosition` shows the impact of the update user position conditions operation by comparing current and after states, with the table below outlining key fields and how to interpret them.

</tab>
<tab label="TypeScript">

Use the `preview` action to preview the impact of updating user position conditions.

```ts title="Update User Risk Premium"
import { preview } from "@aave/client/actions";
import { UserPositionConditionsUpdate } from "@aave/client";

import { client } from "./client";

const result = await preview(client, {
  action: {
    updateUserPositionConditions: {
      userPositionId: userPosition.id,
      update: UserPositionConditionsUpdate.JustRiskPremium,
    },
  },
});

if (result.isOk()) {
  console.log(result.value); // PreviewUserPosition
} else {
  console.error(result.error);
}
```

```ts title="Update All Dynamic Config"
const result = await preview(client, {
  action: {
    updateUserPositionConditions: {
      userPositionId: userPosition.id,
      update: UserPositionConditionsUpdate.AllDynamicConfig,
    },
  },
});
```

```ts title="client.ts"
import { AaveClient } from "@aave/client";

export const client = AaveClient.create();
```

> [!WARNING]
> Remember that updating Dynamic Config will also update the User Risk Premium.

The `PreviewUserPosition` shows the impact of the update user position conditions operation by comparing current and after states, with the table below outlining key fields and how to interpret them.

</tab>
<tab label="GraphQL">

Use the `preview` query to preview the impact of updating user position conditions.

```graphql title="Query"
query ($request: PreviewRequest!, $currency: Currency = USD) {
  preview(request: $request) {
    __typename
    id
    healthFactor {
      ...HealthFactorResult
    }
    netApy {
      ...PercentNumberVariation
    }
    riskPremium {
      ...PercentNumberVariation
    }
    netCollateral(currency: $currency) {
      ...ExchangeAmountVariation
    }
    netBalance(currency: $currency) {
      ...ExchangeAmountVariation
    }
    projectedEarnings(period: ANNUAL) {
      ...ExchangeAmountVariation
    }
    maxBorrowingPower {
      ...ExchangeAmountVariation
    }
    remainingBorrowingPower {
      ...ExchangeAmountVariation
    }
    otherConditions {
      ...UserPositionConditionVariation
    }
  }
}
```

```graphql title="HealthFactorResult"
fragment HealthFactorResult on HealthFactorResult {
  __typename
  ... on HealthFactorVariation {
    ...HealthFactorVariation
  }
  ... on HealthFactorError {
    ...HealthFactorError
  }
}

fragment HealthFactorVariation on HealthFactorVariation {
  __typename
  current
  after
}

fragment HealthFactorError on HealthFactorError {
  __typename
  reason
  current
  after
}
```

```graphql title="UserPositionConditionVariation"
fragment UserPositionConditionVariation on UserPositionConditionVariation {
  __typename
  ... on CollateralFactorVariation {
    reserveId
    token {
      ...Erc20Token
    }
    current {
      ...PercentNumber
    }
    after {
      ...PercentNumber
    }
  }
  ... on LiquidationFeeVariation {
    reserveId
    token {
      ...Erc20Token
    }
    current {
      ...PercentNumber
    }
    after {
      ...PercentNumber
    }
  }
  ... on MaxLiquidationBonusVariation {
    reserveId
    token {
      ...Erc20Token
    }
    current {
      ...PercentNumber
    }
    after {
      ...PercentNumber
    }
  }
}
```

```graphql title="Others"
fragment PercentNumberVariation on PercentNumberVariation {
  __typename
  current {
    ...PercentNumber
  }
  after {
    ...PercentNumber
  }
}

fragment ExchangeAmountVariation on ExchangeAmountVariation {
  __typename
  current {
    ...ExchangeAmount
  }
  after {
    ...ExchangeAmount
  }
}
```

You can preview different update operations using the `update` field.

```json title="Update User Risk Premium"
{
  "request": {
    "action": {
      "updateUserPositionConditions": {
        "userPositionId": "aGVsbG8",
        "update": "JUST_RISK_PREMIUM"
      }
    }
  }
}
```

```json title="Update All Dynamic Config"
{
  "request": {
    "action": {
      "updateUserPositionConditions": {
        "userPositionId": "aGVsbG8",
        "update": "ALL_DYNAMIC_CONFIG"
      }
    }
  }
}
```

> [!WARNING]
> Remember that updating Dynamic Config will also update the User Risk Premium.

The `PreviewUserPosition` shows the impact of the update user position conditions operation by comparing current and after states, with the table below outlining key fields and how to interpret them.

</tab>
</tabgroup>
### Step-by-Step

Now that we know how to identify the user positions that qualify for an update, and we know how to preview the impact of updating the user position conditions, let's see how to update the user position conditions.

<tabgroup>
<tab label="React">

To update user position conditions with AaveKit React, follow these steps.

#### Configure Wallet Integration

First, instantiate the `useSendTransaction` hook for the [wallet library of your choice](../getting-started/react#integrations).

```tsx title="Viem"
import { useWalletClient } from "wagmi";
import { useSendTransaction } from "@aave/react/viem";

// …

const { data: wallet } = useWalletClient();
const [sendTransaction] = useSendTransaction(wallet);
```

#### Define the Update Flow

Then, use the `useUpdateUserPositionConditions` hook to prepare the transaction request.

```tsx title="Basic Usage"
import { useUpdateUserPositionConditions } from "@aave/react";

const [updateConditions, { loading, error }] = useUpdateUserPositionConditions(
  (transaction) => sendTransaction(transaction),
);
```

```tsx title="Update Component State"
import { useUpdateUserPositionConditions } from "@aave/react";

const [status, setStatus] = useState("");

const [updateConditions, { loading, error }] = useUpdateUserPositionConditions(
  (transaction) => {
    setStatus("Please sign the transaction in your wallet");
    return sendTransaction(transaction).andTee(() =>
      setStatus("Updating position conditions…"),
    );
  },
);
```

```tsx title="Cancel Flow"
import { useUpdateUserPositionConditions } from "@aave/react";

const [updateConditions, { loading, error }] = useUpdateUserPositionConditions(
  (transaction, { cancel }) => {
    if (window.confirm("Are you sure you want to continue?") === false) {
      return cancel("User cancelled the operation");
    }
    return sendTransaction(transaction);
  },
);
```

#### Execute the Transaction

Then, execute the transaction.

```tsx title="Update User Risk Premium"
import { UserPositionConditionsUpdate, type UserPosition } from "@aave/react";

const execute = async (userPosition: UserPosition) => {
  const result = await updateConditions({
    userPositionId: userPosition.id,
    update: UserPositionConditionsUpdate.JustRiskPremium,
  });
};
```

```tsx title="Update All Dynamic Config"
import { UserPositionConditionsUpdate, type UserPosition } from "@aave/react";

const execute = async (userPosition: UserPosition) => {
  const result = await updateConditions({
    userPositionId: userPosition.id,
    update: UserPositionConditionsUpdate.AllDynamicConfig,
  });
};
```

> [!WARNING]
> Remember that updating Dynamic Config will also update the User Risk Premium.

#### Handle the Result

Finally, handle the result.

```tsx title="Example"
const execute = async () => {
  const result = await updateConditions(/* … */);

  if (result.isErr()) {
    switch (result.error.name) {
      case "CancelError":
        // The user cancelled the operation
        return;

      case "SigningError":
        console.error(
          `Failed to sign the transaction: ${result.error.message}`,
        );
        break;

      case "TimeoutError":
        console.error(`Transaction timed out: ${result.error.message}`);
        break;

      case "TransactionError":
        console.error(`Transaction failed: ${result.error.message}`);
        break;

      case "UnexpectedError":
        console.error(result.error.message);
        break;
    }
    return;
  }

  console.log(
    "Position conditions updated successfully with hash:",
    result.value.txHash,
  );
};
```

</tab>
<tab label="TypeScript">

To update user position conditions with AaveKit TypeScript, follow these steps.

#### Prepare the Transaction Request

First, use the `updateUserPositionConditions` action to prepare the transaction request.

```ts title="Update User Risk Premium"
import { updateUserPositionConditions } from "@aave/client/actions";
import { UserPositionConditionsUpdate } from "@aave/client";

// const userPosition: UserPosition = …

const result = await updateUserPositionConditions(client, {
  userPositionId: userPosition.id,
  update: UserPositionConditionsUpdate.JustRiskPremium,
});
```

```ts title="Update All Dynamic Config"
import { updateUserPositionConditions } from "@aave/client/actions";
import { UserPositionConditionsUpdate } from "@aave/client";

const result = await updateUserPositionConditions(client, {
  userPositionId: userPosition.id,
  update: UserPositionConditionsUpdate.AllDynamicConfig,
});
```

```ts title="client.ts"
import { AaveClient } from "@aave/client";

export const client = AaveClient.create();
```

> [!WARNING]
> Remember that updating Dynamic Config will also update the User Risk Premium.

#### Process the Transaction Request

Then, use `sendWith` for the [wallet library of your choice](../getting-started/typescript#integrations) to send the transaction, and await indexing with `client.waitForTransaction`.

```ts title="Viem"
import { updateUserPositionConditions } from "@aave/client/actions";
import { sendWith } from "@aave/client/viem";

import { client } from "./client";
import { wallet } from "./wallet";

const result = await updateUserPositionConditions(client, {
  // …
})
  .andThen(sendWith(wallet))
  .andThen(client.waitForTransaction);
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

#### Handle the Result

Finally, handle the result.

```tsx title="Example"
if (result.isErr()) {
  switch (result.error.name) {
    case "CancelError":
      // The user cancelled the operation
      return;

    case "SigningError":
      console.error(`Failed to sign the transaction: ${result.error.message}`);
      break;

    case "TimeoutError":
      console.error(`Transaction timed out: ${result.error.message}`);
      break;

    case "TransactionError":
      console.error(`Transaction failed: ${result.error.message}`);
      break;

    case "UnexpectedError":
      console.error(result.error.message);
      break;
  }
} else {
  console.log(
    "Position conditions updated successfully with hash:",
    result.value.txHash,
  );
}
```

</tab>
<tab label="GraphQL">

To update user position conditions with AaveKit API, follow these steps.

#### Prepare the Transaction Request

First, use the `updateUserPositionConditions` query to prepare the transaction request.

```graphql title="Query"
query ($request: UpdateUserPositionConditionsRequest!) {
  updateUserPositionConditions(request: $request) {
    __typename

    ... on TransactionRequest {
      ...TransactionRequest
    }
  }
}
```

```graphql title="TransactionRequest"
fragment TransactionRequest on TransactionRequest {
  to
  from
  data
  value
  chainId
  operations
}
```

With the following variables:

```json title="Update User Risk Premium"
{
  "request": {
    "userPositionId": "aGVsbG8",
    "update": "JUST_RISK_PREMIUM"
  }
}
```

```json title="Update All Dynamic Config"
{
  "request": {
    "userPositionId": "aGVsbG8",
    "update": "ALL_DYNAMIC_CONFIG"
  }
}
```

> [!WARNING]
> Remember that updating Dynamic Config will also update the User Risk Premium.

#### Execute the Transaction

Then, send the transaction.

The API returns a `TransactionRequest`, which you can send directly with the wallet tied to the `from` address.

```json title="TransactionRequest"
{
  "data": {
    "updateUserPositionConditions": {
      "__typename": "TransactionRequest",
      "to": "0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2",
      "from": "0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234",
      "data": "0x5a3b74b9000000000000000000000000c02…",
      "value": "0",
      "chainId": 1,
      "operations": ["SPOKE_UPDATE_USER_RISK_PREMIUM"]
    }
  }
}
```

</tab>
<tab label="Solidity">

To update user position conditions onchain, follow these steps after identifying the `spokeAddress`:

#### Import the Spoke Interface

First, create an instance of the `ISpoke` interface.

```solidity title="Import the Spoke Interface"
import { ISpoke } from "aave-v4/src/spoke/interfaces/ISpoke.sol";

ISpoke spoke = ISpoke(spokeAddress);
```

#### Update User Position Conditions

Then, call the `updateUserDynamicConfig` to update all dynamic config and user risk premium or the `updateUserRiskPremium` function to update only the user risk premium.

```solidity title="Update Risk Premium"
spoke.updateUserRiskPremium(msg.sender);
```

```solidity title="Update All Dynamic Config"
spoke.updateUserDynamicConfig(msg.sender);
```

</tab>
</tabgroup>
---

## Advanced Usage

### Network Fee

> [!WARNING]
> This experimental AaveKit React hook currently works only with Viem or Wagmi
> integrations. Support for additional wallet libraries may be added later.

<NetworkFee>

```tsx title="PreviewAction"
import { type PreviewAction, UserPositionConditionsUpdate } from "@aave/react";

const action: PreviewAction = {
  updateUserPositionConditions: {
    userPositionId: userPosition.id, // from UserPosition
    update: UserPositionConditionsUpdate.AllDynamicConfig,
  },
};
```

</NetworkFee>

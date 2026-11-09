# Withdraw Assets

Learn how to withdraw assets from your Aave v4 supply positions.

---

Withdraw supplied assets from your Aave v4 positions to access your funds and any earned interest.

> [!WARNING]
> Withdrawing assets while having an open borrow position may reduce the
> collateralization ratio and lower the position's health factor. In some cases,
> this may put the position at risk of being liquidated.

## Withdrawing

Withdrawing can be broken down into the following steps:

1. Identify the supply position to withdraw from
2. Preview the impact of the withdraw operation
3. Withdraw the assets

### Identify the Supply Position

Given a list of user's [supply positions](./fetch#user-supplies), identify the supply position matching the token you want to withdraw and with a withdrawable amount that covers your needs.

> [!WARNING]
> The supplied position reserve should not be paused in order to withdraw from
> it.

For example, let’s say you have identified the following `UserSupplyItem` object.

```tsx title="Example UserSupplyItem"
const supplyPosition: UserSupplyItem = {
  reserve: {
    id: "SGVsbG8h",
    onChainId: "42",
    chain: {
      chainId: 1,
      name: "Ethereum",
    },
    spoke: {
      address: "0x123…",
      // …
    },
    asset: {
      underlying: {
        address: "0xa0b86a33e6e2ad05ad6c9ac3b6e5e5f6e7b6c1b2", // USDC
      },
      // …
    },
    status: {
      paused: false,
    },
    // … other reserve properties
  },
  isCollateral: true,
  balance: {
    amount: {
      value: BigDecimal(1042.5), // principal + accrued interest
      // …
    },
    // …
  },
  withdrawable: {
    amount: {
      value: BigDecimal(1000.0), // 1,000 USDC supplied
      // …
    },
    // …
  },
  // …
};
```

Keep in mind that if the asset is used as collateral (`isCollateral: true`), withdrawing may:

- Reduce your borrowing capacity and lower the position’s health factor, increasing the risk of liquidation.
- If the collateral has a `reserve.settings.collateralRisk` greater than 0, lower the borrow APY on any open borrow positions in the same Spoke, effectively making those positions cheaper to maintain.

### Preview Withdraw

Preview the impact of a withdraw operation before committing to it.

<tabgroup>
<tab label="React">

Use the `usePreview` hook (or the imperative `usePreviewAction` variant) to preview the impact of the withdraw operation on the user's position.

```tsx title="Loading State"
import { type WithdrawRequest, usePreview } from "@aave/react";

function WithdrawPreview({ request }: { request: WithdrawRequest }) {
  const { data, error, loading } = usePreview({
    action: {
      withdraw: request,
    },
  });

  if (loading) return <div>Loading…</div>;
  if (error) return <div>Error: {error.message}</div>;

  // data: PreviewUserPosition
  return (
    <div>
      <h3>Health Factor:</h3>
      From: {data.healthFactor?.current ?? "N/A"}
      To: {data.healthFactor?.after ?? "N/A"}

      <h3>User Risk Premium:</h3>
      From: {data.riskPremium.current.normalized.toFixed(2)}%
      To: {data.riskPremium.after.normalized.toFixed(2)}%

      <h3>Net APY:</h3>
      From: {data.netApy.current.normalized.toFixed(2)}%
      To: {data.netApy.after.normalized.toFixed(2)}%

      <h3>Net Collateral:</h3>
      From: {data.netCollateral.current.value.toDisplayString(2)}
      To: {data.netCollateral.after.value.toDisplayString(2)}
    </div>
  );
}
```

```tsx title="React Suspense"
import { type WithdrawRequest, usePreview } from "@aave/react";

function WithdrawPreview({ request }: { request: WithdrawRequest }) {
  const { data, error, loading } = usePreview({
    action: {
      withdraw: request,
    },
    suspense: true,
  });

  // data: PreviewUserPosition
  return (
    <div>
      <h3>Health Factor:</h3>
      From: {data.healthFactor?.current ?? "N/A"}
      To: {data.healthFactor?.after ?? "N/A"}

      <h3>User Risk Premium:</h3>
      From: {data.riskPremium.current.normalized.toFixed(2)}%
      To: {data.riskPremium.after.normalized.toFixed(2)}%

      <h3>Net APY:</h3>
      From: {data.netApy.current.normalized.toFixed(2)}%
      To: {data.netApy.after.normalized.toFixed(2)}%

      <h3>Net Collateral:</h3>
      From: {data.netCollateral.current.value.toDisplayString(2)}
      To: {data.netCollateral.after.value.toDisplayString(2)}
    </div>
  );
}
```

```tsx title="Imperative Read"
import { type WithdrawRequest, usePreviewAction } from "@aave/react";

const [preview, { called, data, error, loading }] = usePreviewAction();

const handler = async (request: WithdrawRequest) => {
  const result = await preview({
    action: {
      withdraw: request,
    },
  });

  if (result.isOk()) {
    console.log(result.value); // PreviewUserPosition
  } else {
    console.error(result.error);
  }
};
```

Where the `WithdrawRequest` can be as follows:

```ts title="Withdraw Specific Amount"
const request: WithdrawRequest = {
  sender: evmAddress("0x789…"), // User's address
  reserve: supplyPosition.reserve.id,
  amount: {
    erc20: {
      value: {
        exact: bigDecimal(500), // 500 USDC
      },
    },
  },
};
```

```tsx title="Withdraw Maximum Amount"
const request: WithdrawRequest = {
  sender: evmAddress("0x789…"), // User's address
  reserve: supplyPosition.reserve.id,
  amount: {
    erc20: {
      value: {
        max: true, // Withdraw everything (principal + interest)
      },
    },
  },
};
```

The `PreviewUserPosition` shows the impact of the withdraw operation by comparing current and after states, with the table below outlining key fields and how to interpret them.

You can also specify a different currency to return fiat amounts in.

```tsx title="usePreview"
import { Currency } from "@aave/react";

const { data, error, loading } = usePreview({
  action: {
    withdraw: request,
  },
  currency: Currency.Eur,
});
```

```tsx title="usePreviewAction"
import { Currency } from "@aave/react";

const [preview, { called, data, error, loading }] = usePreviewAction({
  currency: Currency.Eur,
});
```

</tab>
<tab label="TypeScript">

Use the `preview` action to preview the impact of a withdraw operation on the user's position.

```ts title="Withdraw Specific Amount"
import { preview } from "@aave/client/actions";
import { bigDecimal, evmAddress } from "@aave/client";

const result = await preview(client, {
  action: {
    withdraw: {
      sender: evmAddress("0x789…"), // User's address
      reserve: supplyPosition.reserve.id,
      amount: {
        erc20: {
          value: {
            exact: bigDecimal(500), // 500 USDC
          },
        },
      },
    },
  },
});

if (result.isOk()) {
  console.log(result.value); // PreviewUserPosition
} else {
  console.error(result.error);
}
```

```ts title="Withdraw Maximum Amount"
import { preview } from "@aave/client/actions";
import { evmAddress } from "@aave/client";

const result = await preview(client, {
  action: {
    withdraw: {
      sender: evmAddress("0x789…"), // User's address
      reserve: supplyPosition.reserve.id,
      amount: {
        erc20: {
          value: {
            max: true, // Withdraw everything (principal + interest)
          },
        },
      },
    },
  },
});

if (result.isOk()) {
  console.log(result.value); // PreviewUserPosition
} else {
  console.error(result.error);
}
```

The `PreviewUserPosition` shows the impact of the withdraw operation by comparing current and after states, with the table below outlining key fields and how to interpret them.

You can also specify a different currency to return fiat amounts in.

```ts title="Custom Currency"
import { Currency } from "@aave/client";

const result = await preview(client, {
  action: {
    withdraw: ,
  },
  currency: Currency.Eur,
});
```

</tab>
<tab label="GraphQL">

Use the `preview` query to preview the impact of withdraw operations on the user's position.

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

Where the `PreviewRequest` can be as follows:

```json title="Withdraw Specific Amount"
{
  "request": {
    "action": {
      "withdraw": {
        "sender": "0x789…",
        "reserve": "SGVsbG8h",
        "amount": {
          "erc20": {
            "value": {
              "exact": "500"
            }
          }
        }
      }
    }
  }
}
```

```json title="Withdraw Maximum Amount"
{
  "request": {
    "action": {
      "withdraw": {
        "sender": "0x789…",
        "reserve": "SGVsbG8h",
        "amount": {
          "erc20": {
            "value": {
              "max": true
            }
          }
        }
      }
    }
  }
}
```

The `PreviewUserPosition` shows the impact of the withdraw operation by comparing current and after states, with the table below outlining key fields and how to interpret them.

You can also specify a different currency to return fiat amounts in.

```json title="Custom Currency"
{
  "request": {
    "action": {
      "withdraw": {
        // …
      }
    }
  },
  "currency": "EUR"
}
```

</tab>
<tab label="Solidity">

With the spoke address and on-chain reserve ID identified:

```solidity title="Target Reserve"
address spokeAddress = 0x123…;
uint256 reserveId = 42;
```

And an amount to withdraw:

```solidity title="Amount to Withdraw"
uint256 amountToWithdraw = 42e6; // 42 USDC
```

Follow the steps below to preview the impact of a withdraw operation on the user's position.

#### Get Current Account Data

First, retrieve the user's current account data from the Spoke contract.

```solidity title="Get Account Data"
import { ISpoke } from "aave-v4/src/spoke/interfaces/ISpoke.sol";

ISpoke spoke = ISpoke(spokeAddress);
ISpoke.UserAccountData memory currentData = spoke.getUserAccountData(user);
```

#### Calculate Withdraw Value

Then, retrieve the reserve data and asset price from the oracle to calculate the USD value of the withdrawal amount.

```solidity title="Withdraw Value"
address oracleAddress = spoke.ORACLE();
ISpoke.Reserve memory reserve = spoke.getReserve(reserveId);
uint256 assetPrice = IAaveOracle(oracleAddress).getReservePrice(reserveId);
uint256 assetUnit = 10 ** reserve.decimals;

uint256 withdrawValue = (amountToWithdraw * assetPrice) / assetUnit;
```

#### Compute New Health Factor

Finally, calculate the new health factor by removing the withdrawn collateral value and factor.

```solidity title="Compute New Health Factor"
ISpoke.UserPosition memory userPosition = spoke.getUserPosition(reserveId, user);
uint8 configKey = userPosition.configKey;
ISpoke.DynamicReserveConfig memory config = spoke.getDynamicReserveConfig(reserveId, configKey);
uint256 collateralFactor = config.collateralFactor;

uint256 currentWeightedSum = (currentData.totalCollateralValue * currentData.avgCollateralFactor) / 1e18;
uint256 removedWeightedValue = (withdrawValue * collateralFactor) / 10000;
uint256 newWeightedSum = currentWeightedSum - removedWeightedValue;
uint256 newTotalCollateralValue = currentData.totalCollateralValue - withdrawValue;

uint256 newAvgCollateralFactor = (newWeightedSum * 1e18) / newTotalCollateralValue;

uint256 newHealthFactor = (newTotalCollateralValue * newAvgCollateralFactor) / (currentData.totalDebtValue * 1e18);
```

#### Complete Example

Here's a complete example that calculates the health factor before a withdraw operation:

```solidity title="Complete Health Factor Preview"
import { ISpoke } from "aave-v4/src/spoke/interfaces/ISpoke.sol";
import { IAaveOracle } from "aave-v4/src/spoke/interfaces/IAaveOracle.sol";

function previewWithdrawHealthFactor(
  address spokeAddress,
  uint256 reserveId,
  uint256 amountToWithdraw,
  address user
) external view returns (uint256) {
  ISpoke spoke = ISpoke(spokeAddress);

  // Step 1: Get current account data
  ISpoke.UserAccountData memory currentData = spoke.getUserAccountData(user);

  // Step 2: Calculate withdraw value
  address oracleAddress = spoke.ORACLE();
  ISpoke.Reserve memory reserve = spoke.getReserve(reserveId);
  uint256 assetPrice = IAaveOracle(oracleAddress).getReservePrice(reserveId);
  uint256 assetUnit = 10 ** reserve.decimals;
  uint256 withdrawValue = (amountToWithdraw * assetPrice) / assetUnit;

  // Step 3: Get collateral factor
  ISpoke.UserPosition memory userPosition = spoke.getUserPosition(reserveId, user);
  uint8 configKey = userPosition.configKey;
  ISpoke.DynamicReserveConfig memory config = spoke.getDynamicReserveConfig(reserveId, configKey);
  uint256 collateralFactor = config.collateralFactor;

  // Step 4: Compute new health factor
  uint256 currentWeightedSum = (currentData.totalCollateralValue * currentData.avgCollateralFactor) / 1e18;
  uint256 removedWeightedValue = (withdrawValue * collateralFactor) / 10000;
  uint256 newWeightedSum = currentWeightedSum - removedWeightedValue;
  uint256 newTotalCollateralValue = currentData.totalCollateralValue - withdrawValue;
  uint256 newAvgCollateralFactor = (newWeightedSum * 1e18) / newTotalCollateralValue;
  uint256 newHealthFactor = (newTotalCollateralValue * newAvgCollateralFactor) / (currentData.totalDebtValue * 1e18);

  return newHealthFactor;
}
```

</tab>
</tabgroup>
### Step-by-Step

Now that we know how to preview the impact of a withdraw operation, let's see how to withdraw assets from a supply position.

> [!WARNING]
> Withdrawing _collaterals_ while having an open borrow position is a
> risk-increasing action and will update the [Dynamic
> Config](./conditions#dynamic-risk-configuration), which in turn updates the
> [User Risk Premium](./conditions#user-risk-premium) for the given position.

<tabgroup>
<tab label="React">

To withdraw assets from an Aave supply position with AaveKit React, follow these steps.

#### Configure Wallet Integration

First, instantiate the `useSendTransaction` hook for the [wallet library of your choice](../getting-started/react#integrations).

```tsx title="Viem"
import { useWalletClient } from "wagmi";
import { useSendTransaction } from "@aave/react/viem";

// …

const { data: wallet } = useWalletClient();
const [sendTransaction] = useSendTransaction(wallet);
```

#### Define the Withdraw Flow

Then, use the `useWithdraw` hook to prepare the withdraw operation.

```tsx title="Basic Usage"
import { useWithdraw } from "@aave/react";

const [withdraw, { loading, error }] = useWithdraw((plan) => {
  switch (plan.__typename) {
    case "TransactionRequest":
      return sendTransaction(plan);

    case "PreContractActionRequired":
      return sendTransaction(plan.transaction);
  }
});
```

```tsx title="Update Component State"
import { useWithdraw } from "@aave/react";

const [status, setStatus] = useState("");

const [withdraw, { loading, error }] = useWithdraw((plan) => {
  switch (plan.__typename) {
    case "TransactionRequest":
      setStatus("Please sign the Withdraw transaction in your wallet");
      return sendTransaction(plan).andTee(() => setStatus("Withdrawing…"));

    case "PreContractActionRequired":
      setStatus("Please sign the Pre-Contract Action in your wallet");
      return sendTransaction(plan.transaction).andTee(() =>
        setStatus("Processing…"),
      );
  }
});
```

```tsx title="Cancel Flow"
import { useWithdraw } from "@aave/react";

const [withdraw, { loading, error }] = useWithdraw((plan, { cancel }) => {
  if (window.confirm("Are you sure you want to continue?") === false) {
    return cancel("User cancelled the operation");
  }

  switch (plan.__typename) {
    case "TransactionRequest":
      return sendTransaction(plan);

    case "PreContractActionRequired":
      return sendTransaction(plan.transaction);
  }
});
```

#### Execute the Withdraw Operation

Then, execute the desired withdraw operation.

```tsx title="Withdraw Specific Amount"
import { bigDecimal, evmAddress } from "@aave/react";

const execute = async () => {
  const result = await withdraw({
    sender: evmAddress(wallet.account.address), // User's address
    reserve: supplyPosition.reserve.id,
    amount: {
      erc20: {
        value: {
          exact: bigDecimal(500), // Withdraw 500 USDC
        },
      },
    },
  });

  // …
};
```

```tsx title="Withdraw Maximum Amount"
import { evmAddress } from "@aave/react";

const execute = async () => {
  const result = await withdraw({
    sender: evmAddress(wallet.account.address), // User's address
    reserve: supplyPosition.reserve.id,
    amount: {
      erc20: {
        value: {
          max: true, // Withdraw everything (principal + interest)
        },
      },
    },
  });

  // …
};
```

#### Handle the Result

Finally, handle the result.

```tsx title="Example"
const execute = async () => {
  const result = await withdraw(/* … */);

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

      case "ValidationError":
        console.error(`Invalid withdrawal amount: ${result.error.message}`);
        break;

      case "UnexpectedError":
        console.error(result.error.message);
        break;
    }
    return;
  }

  console.log("Withdraw successful with hash:", result.value.txHash);
};
```

</tab>
<tab label="TypeScript">

To withdraw assets from an Aave supply position with AaveKit TypeScript, follow these steps.

#### Prepare the Execution Plan

First, use the `withdraw` action to prepare the withdraw execution plan.

```ts title="Withdraw Specific Amount"
import { withdraw } from "@aave/client/actions";
import { bigDecimal, evmAddress } from "@aave/client";

import { client } from "./client";

const result = await withdraw(client, {
  sender: evmAddress(wallet.account.address), // User's address
  reserve: supplyPosition.reserve.id,
  amount: {
    erc20: {
      value: {
        exact: bigDecimal(500), // Withdraw 500 USDC
      },
    },
  },
});

// …
```

```ts title="Withdraw Maximum Amount"
import { withdraw } from "@aave/client/actions";
import { evmAddress } from "@aave/client";

import { client } from "./client";

const result = await withdraw(client, {
  sender: evmAddress(wallet.account.address), // User's address
  reserve: supplyPosition.reserve.id,
  amount: {
    erc20: {
      value: {
        max: true, // Withdraw everything (principal + interest)
      },
    },
  },
});

// …
```

```ts title="client.ts"
import { AaveClient } from "@aave/client";

export const client = AaveClient.create();
```

#### Process the Execution Plan

Then, use `sendWith` for the [wallet library of your choice](../getting-started/typescript#integrations) to send the transactions in the execution plan, and await indexing with `client.waitForTransaction`.

```ts title="Viem"
import { withdraw } from "@aave/client/actions";
import { sendWith } from "@aave/client/viem";

import { client } from "./client";
import { wallet } from "./wallet";

const result = await withdraw(client, {
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

    case "ValidationError":
      console.error(`Invalid withdrawal amount: ${result.error.message}`);
      break;

    case "UnexpectedError":
      console.error(result.error.message);
      break;
  }
} else {
  console.log("Withdraw successful with hash:", result.value.txHash);
}
```

</tab>
<tab label="GraphQL">

To withdraw assets from an Aave supply position with AaveKit API, follow these steps.

#### Prepare the Execution Plan

First, use the `withdraw` query to prepare the withdraw execution plan.

```graphql title="Query"
query ($request: WithdrawRequest!) {
  withdraw(request: $request) {
    __typename

    ... on TransactionRequest {
      ...TransactionRequest
    }

    ... on PreContractActionRequired {
      reason
      transaction {
        ...TransactionRequest
      }
      originalTransaction {
        ...TransactionRequest
      }
    }

    ... on InsufficientBalanceError {
      required {
        ...DecimalNumber
      }
      available {
        ...DecimalNumber
      }
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

Below are some examples of `WithdrawRequest` objects.

```json title="Withdraw Specific Amount"
{
  "request": {
    "sender": "0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234",
    "reserve": "SGVsbG8h",
    "amount": {
      "erc20": {
        "value": {
          "exact": "500"
        }
      }
    }
  }
}
```

```json title="Withdraw Maximum Amount"
{
  "request": {
    "sender": "0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234",
    "reserve": "SGVsbG8h",
    "amount": {
      "erc20": {
        "value": {
          "max": true
        }
      }
    }
  }
}
```

#### Process the Execution Plan

Then, if the response is a `TransactionRequest`, you can send it directly using the wallet associated with the from address.

```json title="TransactionRequest"
{
  "data": {
    "withdraw": {
      "__typename": "TransactionRequest",
      "to": "0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2",
      "from": "0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234",
      "data": "0x617ba037000000000000000000000000c0…",
      "value": "0",
      "chainId": 1,
      "operations": ["SPOKE_WITHDRAW"]
    }
  }
}
```

If the response is a `PreContractActionRequired`, you must first send the `transaction` request. Once it succeeds, you can then send the `originalTransaction`.

```json title="PreContractActionRequired"
{
  "data": {
    "withdraw": {
      "__typename": "PreContractActionRequired",
      "reason": "Authorize the native wrapping gateway operate on behalf of the user",
      "transaction": {
        "to": "0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2",
        "from": "0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234",
        "data": "0x095ea7b3000000000000000000000000878…",
        "value": "0",
        "chainId": 1,
        "operations": null
      },
      "originalTransaction": {
        "to": "0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2",
        "from": "0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234",
        "data": "0x617ba037000000000000000000000000c0…",
        "value": "0",
        "chainId": 1,
        "operations": ["SPOKE_WITHDRAW"]
      }
    }
  }
}
```

If the response is an `InsufficientBalanceError`, inform the user that they don't have enough balance to withdraw the requested amount.

```json title="InsufficientBalanceError"
{
  "data": {
    "withdraw": {
      "__typename": "InsufficientBalanceError",
      "required": {
        "value": "500.000000",
        "decimals": 6
      },
      "available": {
        "value": "250.500000",
        "decimals": 6
      }
    }
  }
}
```

</tab>
<tab label="Solidity">

With the same identifiers and amount to withdraw used to preview the withdraw operation:

```solidity title="Target Reserve"
address spokeAddress = 0x123…;
uint256 reserveId = 42;
uint256 amountToWithdraw = 42e6; // 42 USDC
```

Complete the withdraw process with the following steps:

#### Import the Spoke Interface

First, create an instance of the `ISpoke` interface.

```solidity title="Import the Spoke Interface"
import { ISpoke } from "aave-v4/src/spoke/interfaces/ISpoke.sol";

ISpoke spoke = ISpoke(spokeAddress);
```

#### Withdraw Assets

Finally, call the `withdraw` function on the Spoke contract, specifying the reserve ID, amount, and the recipient address.

```solidity title="Withdraw"
spoke.withdraw(
  reserveId,
  amountToWithdraw,
  msg.sender
);
```

#### Complete Example

Here's a complete example that executes the full withdraw flow:

```solidity title="Complete Withdraw Flow"
import { ISpoke } from "aave-v4/src/spoke/interfaces/ISpoke.sol";

function withdrawFromReserve(
  address spokeAddress,
  uint256 reserveId,
  uint256 amountToWithdraw,
  address recipient
) external {
  ISpoke spoke = ISpoke(spokeAddress);

  spoke.withdraw(reserveId, amountToWithdraw, recipient);
}
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
import { type PreviewAction } from "@aave/react";

const action: PreviewAction = {
  withdraw: {
    sender: evmAddress("0x123…"), // User's address
    reserve: supplyPosition.reserve.id,
    amount: {
      erc20: {
        value: {
          exact: bigDecimal(42), // USDC
        },
      },
    },
  },
};
```

</NetworkFee>

### Native Tokens

When the Reserve's underlying token is the wrapped version of the chain's native token (e.g., WETH on Ethereum), you can withdraw the asset as the chain's native token using the Native Token Gateway.

Use the `reserve.asset.underlying.isWrappedNativeToken` flag to determine if the underlying token is a wrapped native token. The Native Gateway address is available from the chain details.

```ts title="WETH Supply Position"
const supplyPosition: UserSupplyItem = {
  reserve: {
    id: "SGVsbG8h",
    onChainId: "42",
    asset: {
      underlying: {
        address: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
        info: {
          name: "Wrapped Ether",
          symbol: "WETH",
          decimals: 18,
          // …
        },
        isWrappedNativeToken: true,
        // …
      },
      // …
    },
    spoke: {
      address: "0x123…",
      // …
    },
    chain: {
      chainId: 1,
      name: "Ethereum",
      nativeGateway: "0xabc…",
    },
    // …
  },
  balance: {
    amount: {
      value: BigDecimal(1.25),
      // …
    },
    // …
  },
  // …
};
```

Specify the amount in the `amount` field as a `native` value.

<tabgroup>
<tab label="React">

```tsx title="Withdraw Specific Amount"
const execute = async () => {
  const result = await withdraw({
    sender: evmAddress(wallet.account.address), // User's address
    reserve: supplyPosition.reserve.id,
    amount: {
      native: {
        exact: bigDecimal(1), // Withdraw 1 ETH
      },
    },
  });

  // …
};
```

```tsx title="Withdraw Maximum Amount"
const execute = async () => {
  const result = await withdraw({
    sender: evmAddress(wallet.account.address), // User's address
    reserve: supplyPosition.reserve.id,
    amount: {
      native: {
        max: true, // Withdraw everything
      },
    },
  });

  // …
};
```

</tab>
<tab label="TypeScript">

```ts title="Withdraw Specific Amount"
const result = await withdraw(client, {
  sender: evmAddress(wallet.account.address), // User's address
  reserve: supplyPosition.reserve.id,
  amount: {
    native: {
      exact: bigDecimal(1), // Withdraw 1 ETH
    },
  },
});

// …
```

```ts title="Withdraw Maximum Amount"
const result = await withdraw(client, {
  sender: evmAddress(wallet.account.address), // User's address
  reserve: supplyPosition.reserve.id,
  amount: {
    native: {
      max: true, // Withdraw everything
    },
  },
});

// …
```

</tab>
<tab label="GraphQL">

```json title="Withdraw Specific Amount"
{
  "request": {
    "sender": "0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234",
    "reserve": "SGVsbG8h",
    "amount": {
      "native": {
        "exact": "1"
      }
    }
  }
}
```

```json title="Withdraw Maximum Amount"
{
  "request": {
    "sender": "0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234",
    "reserve": "SGVsbG8h",
    "amount": {
      "native": {
        "max": true
      }
    }
  }
}
```

</tab>
<tab label="Solidity">

With the spoke address, reserve ID, and native gateway address identified:

```solidity title="Native Token Gateway"
address spokeAddress = 0x123…;
uint256 reserveId = 42;
address nativeGateway = 0xabc…;
```

Follow the steps below to withdraw native tokens (e.g., ETH) from an existing supply position in a wrapped native token reserve (e.g., WETH).

#### Approve the Gateway

First, approve the Native Token Gateway as your position manager. This is a one-time setup step.

The Native Token Gateway address is specific under the `spoke.chain.nativeGateway` field.

```solidity title="Approve Gateway"
import { ISpoke } from "aave-v4/src/spoke/interfaces/ISpoke.sol";

ISpoke spoke = ISpoke(spokeAddress);
spoke.setUserPositionManager(gatewayAddress, true);
```

#### Withdraw Native Tokens

Then, call `withdrawNative` on the gateway to withdraw and unwrap the tokens.

```solidity title="Withdraw Specific Amount"
import { INativeTokenGateway } from "aave-v4/src/position-manager/interfaces/INativeTokenGateway.sol";

INativeTokenGateway gateway = INativeTokenGateway(gatewayAddress);
gateway.withdrawNative(reserveId, amountToWithdraw, msg.sender);
```

```solidity title="Withdraw Maximum Amount"
import { INativeTokenGateway } from "aave-v4/src/position-manager/interfaces/INativeTokenGateway.sol";

INativeTokenGateway gateway = INativeTokenGateway(gatewayAddress);
gateway.withdrawNative(reserveId, type(uint256).max, msg.sender);
```

The gateway calls `spoke.withdraw` on your behalf, unwraps the token (WETH → ETH), and sends the native token to the specified receiver.

#### Complete Example

Here's a complete example that executes the native token withdraw flow:

```solidity title="Complete Native Withdraw Flow"
import { ISpoke } from "aave-v4/src/spoke/interfaces/ISpoke.sol";
import { INativeTokenGateway } from "aave-v4/src/position-manager/interfaces/INativeTokenGateway.sol";

function withdrawNativeToken(
  address spokeAddress,
  address gatewayAddress,
  uint256 reserveId,
  uint256 amountToWithdraw
) external {
  ISpoke spoke = ISpoke(spokeAddress);

  // Step 1: Approve gateway as position manager (one-time setup)
  if (!spoke.isPositionManager(msg.sender, gatewayAddress)) {
    spoke.setUserPositionManager(gatewayAddress, true);
  }

  // Step 2: Withdraw native tokens via gateway
  INativeTokenGateway gateway = INativeTokenGateway(gatewayAddress);
  gateway.withdrawNative(reserveId, amountToWithdraw, msg.sender);
}
```

</tab>
</tabgroup>

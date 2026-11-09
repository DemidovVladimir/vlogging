# Supply Assets

Learn how to earn interest on Aave v4 and use assets as collateral for borrowing.

---

Supplying assets to Aave v4 allows you to:

- Receive reserve shares representing your deposit
- Earn variable supply APY on your reserve shares
- Use reserve shares as collateral for borrowing
- Withdraw assets and earnings anytime

> [!TIP]
> Supplying assets as collateral while having an open borrow position may
> increase the position's health factor.

## Supplying

Supplying assets to Aave can be broken down into the following steps:

1. Identify the Reserve
2. Preview the impact of the supply operation (optional)
3. Supply the assets

### Identify the Reserve

The first step is to [filter the supply reserves](../liquidity/reserves#listing-available-reserves) to those marked with `canSupply: true`.

```tsx title="Reserves List"
const reserves: Reserve[] = [
  {
    id: "SGVsbG8h",
    onChainId: "42",
    canSupply: true,
    settings: {
      supplyCap: {
        amount: { value: BigDecimal(2000000000.0) }, // 2B USDC
        // …
      },
      // …
    },
    // …
  },
  {
    id: "V29ybGQh",
    onChainId: "43",
    canSupply: false, // cannot supply to this reserve
    settings: {
      supplyCap: {
        amount: { value: BigDecimal(1000000000.0) }, // 1B USDC
        // …
      },
      // …
    },
    // …
  },
  // …
];
```

> [!NOTE]
> The `canSupply` flag confirms that the reserve is active: it isn’t frozen, it
> isn’t paused, and the supply cap has not been reached.

From the remaining reserves, choose one that meets these criteria:

- **Collateral Enabled**: The reserve can be used as collateral (`canUseAsCollateral`) if you plan to borrow against it.
- **Suppliable Amount**: The `userState.suppliable` value is sufficient for the amount you want to supply.

```tsx title="Example Reserve Data"
const reserve: Reserve = {
  id: "SGVsbG8h",
  onChainId: "42",
  canSupply: true,
  canUseAsCollateral: true,
  chain: {
    chainId: 1,
    name: "Ethereum",
  },
  spoke: {
    address: "0x123…",
    // …
  },
  status: {
    frozen: false,
    paused: false,
  },
  settings: {
    supplyCap: {
      amount: { value: BigDecimal(2000000000.0) }, // 2B USDC
      // …
    },
    // …
  },
  userState: {
    suppliable: {
      amount: {
        onChainValue: "1000000000",
        decimals: 6,
        value: BigDecimal(1000.0), // Can supply up to 1,000 USDC
      },
      // …
    },
    // …
  },
  // …
};
```

> [!WARNING]
> Make sure you include a user address when fetching reserve data—otherwise
> `userState` will be `null`.

### Preview Supply

Preview the impact of a supply operation before committing to it.

<tabgroup>
<tab label="React">

Use the `usePreview` hook (or the imperative `usePreviewAction` variant) to preview the impact of the supply operation on the user's position.

```tsx title="Loading State"
import { type SupplyRequest, usePreview } from "@aave/react";

function SupplyPreview({ request }: { request: SupplyRequest }) {
  const { data, error, loading } = usePreview({
    action: {
      supply: request,
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

      <h3>Net APY:</h3>
      From: {data.netApy.current.normalized.toFixed(2)}%
      To: {data.netApy.after.normalized.toFixed(2)}%

      <h3>Net Collateral:</h3>
      From: {data.netCollateral.current.value.toDisplayString(2)}
      To: {data.netCollateral.after.value.toDisplayString(2)}

      <h3>Max Borrowing Power:</h3>
      From: {data.maxBorrowingPower.current.value.toDisplayString(2)}
      To: {data.maxBorrowingPower.after.value.toDisplayString(2)}
    </div>
  );
}
```

```tsx title="React Suspense"
import { type SupplyRequest, usePreview } from "@aave/react";

function SupplyPreview({ request }: { request: SupplyRequest }) {
  const { data, error, loading } = usePreview({
    action: {
      supply: request,
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

      <h3>Net APY:</h3>
      From: {data.netApy.current.normalized.toFixed(2)}%
      To: {data.netApy.after.normalized.toFixed(2)}%

      <h3>Net Collateral:</h3>
      From: {data.netCollateral.current.value.toDisplayString(2)}
      To: {data.netCollateral.after.value.toDisplayString(2)}

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

const handler = async (request: SupplyRequest) => {
  const result = await preview({
    action: {
      supply: request,
    },
  });

  if (result.isOk()) {
    console.log(result.value); // PreviewUserPosition
  } else {
    console.error(result.error);
  }
};
```

See below for examples of `SupplyRequest` objects.

```ts title="Supply ERC-20"
const request: SupplyRequest = {
  sender: evmAddress("0x123…"), // User's address
  reserve: reserve.id,
  chainId: reserve.chain.chainId,
  amount: {
    erc20: {
      value: bigDecimal(42), // USDC
    },
  },
};
```

```ts title="Enable Collateral"
const request: SupplyRequest = {
  sender: evmAddress("0x123…"), // User's address
  reserve: reserve.id,
  chainId: reserve.chain.chainId,
  amount: {
    erc20: {
      value: bigDecimal(42), // USDC
    },
  },
  enableCollateral: true,
};
```

The `PreviewUserPosition` shows the impact of the supply operation by comparing current and after states, with the table below outlining key fields and how to interpret them.

You can also specify a different currency to return fiat amounts in.

```ts title="usePreview"
import { Currency } from "@aave/react";

const { data, error, loading } = usePreview({
  action: {
    supply: request,
  },
  currency: Currency.Eur,
});
```

```ts title="usePreviewAction"
import { Currency } from "@aave/react";

const [preview, { called, data, error, loading }] = usePreviewAction({
  currency: Currency.Eur,
});
```

</tab>
<tab label="TypeScript">

Use the `preview` action to preview the impact of a supply operation on the user's position.

```ts title="Supply ERC-20"
import { preview } from "@aave/client/actions";
import { bigDecimal, evmAddress } from "@aave/client";

import { client } from "./client";

const result = await preview(client, {
  action: {
    supply: {
      sender: evmAddress("0x123…"),
      reserve: reserve.id,
      chainId: reserve.chain.chainId,
      amount: {
        erc20: {
          value: bigDecimal(100), // 100 tokens
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

```ts title="Enable Collateral"
const result = await preview(client, {
  action: {
    supply: {
      sender: evmAddress("0x123…"),
      reserve: reserve.id,
      chainId: reserve.chain.chainId,
      amount: {
        erc20: {
          value: bigDecimal(100),
        },
      },
      enableAsCollateral: true,
    },
  },
});
```

```ts title="client.ts"
import { AaveClient } from "@aave/client";

export const client = AaveClient.create();
```

The `PreviewUserPosition` shows the impact of the supply operation by comparing current and after states, with the table below outlining key fields and how to interpret them.

You can also specify a different currency to return fiat amounts in.

```ts title="Custom Currency"
import { Currency } from "@aave/client";

const result = await preview(
  client,
  {
    action: {
      supply: {
        // your supply action
      },
    },
  },
  {
    currency: Currency.Eur,
  },
);
```

</tab>
<tab label="GraphQL">

Use the `preview` query to preview the impact of a supply operation on the user's position.

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
    reserveRates {
      supplyApy {
        ...PercentNumberVariation
      }
      borrowApy {
        ...PercentNumberVariation
      }
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

You can preview different supply operations using the `action` field.

```json title="Supply ERC-20"
{
  "request": {
    "action": {
      "supply": {
        "sender": "0x123…",
        "reserve": "SGVsbG8h",
        "amount": {
          "erc20": {
            "value": "100"
          }
        }
      }
    }
  }
}
```

```json title="Enable Collateral"
{
  "request": {
    "action": {
      "supply": {
        "sender": "0x123…",
        "reserve": "SGVsbG8h",
        "amount": {
          "erc20": {
            "value": "100"
          }
        },
        "enableAsCollateral": true
      }
    }
  }
}
```

The `PreviewUserPosition` shows the impact of the supply operation by comparing current and after states, with the table below outlining key fields and how to interpret them.

You can also specify a different currency to return fiat amounts in.

```json title="Custom Currency"
{
  "request": {
    "action": {
      "supply": {
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

And an amount to supply:

```solidity title="Amount to Supply"
uint256 amountToSupply = 42e6; // 42 USDC
```

Follow these steps to preview the impact of a supply operation on the user's position.

#### Get Current Account Data

First, retrieve the user's current account data from the Spoke contract.

```solidity title="Get Account Data"
import { ISpoke } from "aave-v4/src/spoke/interfaces/ISpoke.sol";

ISpoke spoke = ISpoke(spokeAddress);
ISpoke.UserAccountData memory currentData = spoke.getUserAccountData(user);
```

#### Calculate New Collateral Value

Then, retrieve the reserve data and asset price from the oracle to calculate the USD value of the new supply, and add it to the current total collateral.

```solidity title="New Collateral Value"
address oracleAddress = spoke.ORACLE();
ISpoke.Reserve memory reserve = spoke.getReserve(reserveId);
uint256 assetPrice = IAaveOracle(oracleAddress).getReservePrice(reserveId);
uint256 assetUnit = 10 ** reserve.decimals;

uint256 supplyValue = (amountToSupply * assetPrice) / assetUnit;
uint256 newTotalCollateralValue = currentData.totalCollateralValue + supplyValue;
```

#### Get Collateral Factor

Then, retrieve the user's position configuration to get the collateral factor for the reserve.

```solidity title="Get Collateral Factor"
uint8 configKey = spoke.getUserPosition(reserveId, user).configKey;
ISpoke.DynamicReserveConfig memory config = spoke.getDynamicReserveConfig(reserveId, configKey);
uint256 collateralFactor = config.collateralFactor;
```

#### Compute New Health Factor

Finally, calculate the new health factor by incorporating the new supply's collateral value and factor into the weighted average.

```solidity title="Compute New Health Factor"
uint256 currentWeightedSum = (currentData.totalCollateralValue * currentData.avgCollateralFactor) / 1e18;
uint256 newSupplyWeightedValue = (supplyValue * collateralFactor) / 10000;
uint256 newWeightedSum = currentWeightedSum + newSupplyWeightedValue;

uint256 newAvgCollateralFactor = (newWeightedSum * 1e18) / newTotalCollateralValue;

uint256 newHealthFactor = (newTotalCollateralValue * newAvgCollateralFactor) / (currentData.totalDebtValue * 1e18);
```

#### Complete Example

Here's a complete example that calculates the health factor before a supply operation:

```solidity title="Complete Health Factor Preview"
import { ISpoke } from "aave-v4/src/spoke/interfaces/ISpoke.sol";
import { IAaveOracle } from "aave-v4/src/spoke/interfaces/IAaveOracle.sol";

function previewSupplyHealthFactor(
  address spokeAddress,
  uint256 reserveId,
  uint256 amountToSupply,
  address user
) external view returns (uint256) {
  ISpoke spoke = ISpoke(spokeAddress);
  address oracleAddress = spoke.ORACLE();
  IAaveOracle oracle = IAaveOracle(oracleAddress);

  // Step 1: Get Current Account Data
  ISpoke.UserAccountData memory currentData = spoke.getUserAccountData(user);

  // Step 2: Calculate New Collateral Value
  ISpoke.Reserve memory reserve = spoke.getReserve(reserveId);
  uint256 assetPrice = oracle.getReservePrice(reserveId);
  uint256 assetUnit = 10 ** reserve.decimals;
  uint256 supplyValue = (amountToSupply * assetPrice) / assetUnit;
  uint256 newTotalCollateralValue = currentData.totalCollateralValue + supplyValue;

  // Step 3: Get Collateral Factor
  uint8 configKey = spoke.getUserPosition(reserveId, user).configKey;
  ISpoke.DynamicReserveConfig memory config = spoke.getDynamicReserveConfig(reserveId, configKey);
  uint256 collateralFactor = config.collateralFactor;

  // Step 4: Compute New Health Factor
  uint256 currentWeightedSum = (currentData.totalCollateralValue * currentData.avgCollateralFactor) / 1e18;
  uint256 newSupplyWeightedValue = (supplyValue * collateralFactor) / 10000;
  uint256 newWeightedSum = currentWeightedSum + newSupplyWeightedValue;
  uint256 newAvgCollateralFactor = (newWeightedSum * 1e18) / newTotalCollateralValue;

  uint256 newHealthFactor = (newTotalCollateralValue * newAvgCollateralFactor) / (currentData.totalDebtValue * 1e18);
  return newHealthFactor;
}
```

</tab>
</tabgroup>
### Step-by-Step

Now that you know how to identify a reserve and preview the impact of a supply operation, let's supply assets to a reserve.

Supplying ERC-20 tokens requires token approval. You can choose between two approaches:

- **Transaction-based approval** — Sends a separate ERC-20 `approve()` transaction before the supply transaction (2 transactions total).
- **Permit-based approval** — Signs an [EIP-2612](https://eips.ethereum.org/EIPS/eip-2612) permit to approve and supply in a single transaction. More gas-efficient, but requires the token to support permits.

<tabgroup>
<tab label="React">

To supply assets to an Aave reserve with AaveKit React, follow these steps.

#### Configure Wallet Integration

First, instantiate the hooks for the [wallet library of your choice](../getting-started/react#integrations):

- `useSendTransaction` — used to send ERC-20 approval and supply transactions
- `useSignTypedData` — used to sign ERC-20 permits when available

```tsx title="Viem"
import { useWalletClient } from "wagmi";
import { useSendTransaction, useSignTypedData } from "@aave/react/viem";

// …

const { data: wallet } = useWalletClient();
const [sendTransaction] = useSendTransaction(wallet);
const [signTypedData] = useSignTypedData(wallet);
```

#### Define the Supply Flow

Then, use the `useSupply` hook to prepare the supply operation.

```tsx title="Basic Usage"
import { useSupply } from "@aave/react";

const [supply, { loading, error }] = useSupply((plan) => {
  switch (plan.__typename) {
    case "TransactionRequest":
      return sendTransaction(plan);

    case "Erc20Approval":
      // If token supports EIP-2612 permits, sign permit (recommended)
      if (plan.bySignature) {
        return signTypedData(plan.bySignature);
      }
      // use traditional approval transaction
      return sendTransaction(plan.byTransaction);

    case "PreContractActionRequired":
      return sendTransaction(plan.transaction);
  }
});
```

```tsx title="Update Component State"
import { useSupply } from "@aave/react";

const [status, setStatus] = useState("");

const [supply, { loading, error }] = useSupply((plan) => {
  switch (plan.__typename) {
    case "TransactionRequest":
      setStatus("Please sign the Supply transaction in your wallet");
      return sendTransaction(plan).andTee(() => setStatus("Supplying…"));

    case "Erc20Approval":
      if (plan.bySignature) {
        setStatus("Please sign the Permit approval in your wallet");
        return signTypedData(plan.bySignature);
      }

      setStatus("Please sign the Approval transaction in your wallet");
      return sendTransaction(plan.byTransaction).andTee(() =>
        setStatus("Approving…"),
      );

    case "PreContractActionRequired":
      setStatus("Please sign the Pre-Contract Action in your wallet");
      return sendTransaction(plan.transaction).andTee(() =>
        setStatus("Processing…"),
      );
  }
});
```

```tsx title="Cancel Flow"
import { useSupply } from "@aave/react";

const [supply, { loading, error }] = useSupply((plan, { cancel }) => {
  if (window.confirm("Are you sure you want to continue?") === false) {
    return cancel("User cancelled the operation");
  }

  switch (plan.__typename) {
    case "TransactionRequest":
      return sendTransaction(plan);

    case "Erc20Approval":
      return sendTransaction(plan.byTransaction);

    case "PreContractActionRequired":
      return sendTransaction(plan.transaction);
  }
});
```

In the `Erc20Approval` case, the `bySignature` field is only available if the token supports EIP-2612 permits.

> [!NOTE]
> For tokens like [USDT on Ethereum
> Mainnet](https://etherscan.io/token/0xdac17f958d2ee523a2206206994597c13d831ec7)
> that require an allowance reset, the hook calls your callback twice: once to
> reset the allowance to 0, then again to set the new value. `bySignature` will
> be `null` for these approvals.

#### Execute the Supply Operation

Then, execute the supply operation.

```tsx title="Supply ERC-20"
import { bigDecimal, evmAddress } from "@aave/react";

const execute = async () => {
  const result = await supply({
    sender: evmAddress(wallet.account.address), // User's address
    reserve: reserve.id,
    amount: {
      erc20: {
        value: bigDecimal(42), // 42 USDC
      },
    },
  });

  // …
};
```

```ts title="Enable Collateral"
const execute = async () => {
  const result = await supply({
    sender: evmAddress(wallet.account.address), // User's address
    reserve: reserve.id,
    amount: {
      erc20: {
        value: bigDecimal(42), // 42 USDC
      },
    },
    enableCollateral: true,
  });

  // …
};
```

#### Handle the Result

Finally, handle the result.

```tsx title="Example"
const execute = async () => {
  const result = await supply(/* … */);

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
        console.error(
          "Insufficient balance:",
          `required: ${result.error.cause.required.value.toDisplayString(2)}`,
          `available: ${result.error.cause.available.value.toDisplayString(2)}`,
        );
        break;

      case "UnexpectedError":
        console.error(result.error.message);
        break;
    }
    return;
  }

  console.log("Supply successful with hash:", result.value.txHash);
};
```

</tab>
<tab label="TypeScript">

To supply assets to an Aave reserve with AaveKit TypeScript, follow these steps.

#### Prepare the Execution Plan

First, use the `supply` action to prepare the supply execution plan.

```ts title="Transaction-based"
import { supply } from "@aave/client/actions";
import { bigDecimal, evmAddress } from "@aave/client";

import { client } from "./client";

const result = await supply(client, {
  sender: evmAddress(wallet.account.address), // User's address
  reserve: reserve.id,
  amount: {
    erc20: {
      value: bigDecimal(42), // 42 USDC
    },
  },
});

// …
```

```ts title="client.ts"
import { AaveClient } from "@aave/client";

export const client = AaveClient.create();
```

To handle ERC-20 permit-based approval, wrap the `supply` call with `permitWith` for the [wallet library of your choice](../getting-started/typescript#integrations).

```ts title="Permit-based (Viem)"
import { supply } from "@aave/client/actions";
import { permitWith } from "@aave/client/viem";
import { bigDecimal, evmAddress } from "@aave/client";

import { client } from "./client";
import { wallet } from "./wallet";

const result = await permitWith(wallet, (permitSig) =>
  supply(client, {
    sender: evmAddress(wallet.account.address),
    reserve: reserve.id,
    amount: {
      erc20: {
        value: bigDecimal(42), // 42 USDC
        permitSig,
      },
    },
  }),
);

// …
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

The `permitWith` helper:

1. Calls the `supply` action without a permit signature
2. If the response is `Erc20ApprovalRequired` with permit signature available, signs the permit and calls `supply` again with the signature to get an updated execution plan
3. Otherwise, returns the execution plan unchanged (no permit needed or token doesn't support permits)

> [!TIP]
> For tokens like [USDT on Ethereum
> Mainnet](https://etherscan.io/token/0xdac17f958d2ee523a2206206994597c13d831ec7)
> that require an allowance reset, `permitWith` skips the permit step and passes
> the execution plan to the next step, which handles both approvals.

#### Process the Execution Plan

Then, use `sendWith` for the [wallet library of your choice](../getting-started/typescript#integrations) to send the transactions in the execution plan, and await indexing with `client.waitForTransaction`.

```ts title="Transaction-based"
import { supply } from "@aave/client/actions";
import { sendWith } from "@aave/client/viem";

import { client } from "./client";
import { wallet } from "./wallet";

const result = await supply(client, {
  // …
})
  .andThen(sendWith(wallet))
  .andThen(client.waitForTransaction);
```

```ts title="Permit-based"
import { supply } from "@aave/client/actions";
import { permitWith, sendWith } from "@aave/client/viem";

import { client } from "./client";
import { wallet } from "./wallet";

const result = await permitWith(wallet, (permitSig) =>
  supply(client, {
    // …
  }),
)
  .andThen(sendWith(wallet))
  .andThen(client.waitForTransaction);
```

> [!NOTE]
> The `sendWith` helper automatically processes all required approvals,
> including reset flows for tokens like USDT that require an allowance reset
> before setting a new value.

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
      console.error(
        "Insufficient balance:",
        `required: ${result.error.cause.required.value.toDisplayString(2)}`,
        `available: ${result.error.cause.available.value.toDisplayString(2)}`,
      );
      break;

    case "UnexpectedError":
      console.error(result.error.message);
      break;
  }
} else {
  console.log("Supply successful with hash:", result.value.txHash);
}
```

</tab>
<tab label="GraphQL">

To supply assets to an Aave reserve with AaveKit API, follow these steps.

#### Prepare the Execution Plan

Use the `supply` query to prepare the supply execution plan.

```graphql title="Query"
query ($request: SupplyRequest!) {
  supply(request: $request) {
    __typename

    ... on TransactionRequest {
      ...TransactionRequest
    }

    ... on Erc20ApprovalRequired {
      reason
      requiredAmount {
        ...DecimalNumber
      }
      currentAllowance {
        ...DecimalNumber
      }
      approvals {
        byTransaction {
          ...TransactionRequest
        }
        bySignature {
          ...PermitTypedData
        }
      }
      originalTransaction {
        ...TransactionRequest
      }
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

```graphql title="PermitTypedData"
fragment PermitTypedData on PermitTypedData {
  types
  primaryType
  domain {
    name
    version
    chainId
    verifyingContract
  }
  message
}
```

Below are some examples of `SupplyRequest` objects.

```json title="Basic Usage"
{
  "request": {
    "sender": "0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234",
    "reserve": "SGVsbG8h",
    "amount": {
      "erc20": {
        "value": "42"
      }
    }
  }
}
```

```json title="Enable Collateral"
{
  "request": {
    "sender": "0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234",
    "reserve": "SGVsbG8h",
    "amount": {
      "erc20": {
        "value": "42"
      }
    },
    "enableCollateral": true
  }
}
```

```json title="Permit-based Approval"
{
  "request": {
    "sender": "0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234",
    "reserve": "SGVsbG8h",
    "amount": {
      "erc20": {
        "value": "42",
        "permitSig": {
          "deadline": 1700000000, // use approvals[0].bySignature.message.deadline
          "value": "0xabcdef…"
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
    "supply": {
      "__typename": "TransactionRequest",
      "to": "0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2",
      "from": "0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234",
      "data": "0x617ba037000000000000000000000000c0…",
      "value": "42000000000000000000",
      "chainId": 1,
      "operations": ["SPOKE_SUPPLY"]
    }
  }
}
```

If the response is `Erc20ApprovalRequired`, you have two options:

**Transaction-based approval**

1. Send each transaction in the `approvals` array in sequence
2. Then send `originalTransaction`

**Permit-based approval**

> [!NOTE]
> This is available only when `approvals` contains a single `Erc20Approval`
> item.

1. Sign the `approvals[0].bySignature` typed data with the sender's account.
2. Call the `supply` query again with the permit signature (see the `Permit-based Approval` example above)
3. The response will be a `TransactionRequest` you can then send directly

```json title="Single Approval"
{
  "data": {
    "supply": {
      "__typename": "Erc20ApprovalRequired",
      "reason": "Insufficient allowance for ERC-20 token transfer",
      "requiredAmount": {
        "value": "42.000000",
        "decimals": 6
      },
      "currentAllowance": {
        "value": "0.000000",
        "decimals": 6
      },
      "approvals": [
        {
          "byTransaction": {
            "to": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
            "from": "0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234",
            "data": "0x095ea7b3000000000000000000000000878…",
            "value": "0",
            "chainId": 1,
            "operations": null
          },
          "bySignature": {
            "types": { "..." },
            "primaryType": "Permit",
            "domain": { "..." },
            "message": { "..." }
          }
        }
      ],
      "originalTransaction": {
        "to": "0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2",
        "from": "0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234",
        "data": "0x617ba037000000000000000000000000c0…",
        "value": "0",
        "chainId": 1,
        "operations": ["SPOKE_SUPPLY"]
      }
    }
  }
}
```

```json title="With Approval Reset (USDT-like)"
{
  "data": {
    "supply": {
      "__typename": "Erc20ApprovalRequired",
      "reason": "Token requires allowance reset before new approval",
      "requiredAmount": {
        "value": "42.000000",
        "decimals": 6
      },
      "currentAllowance": {
        "value": "10.000000",
        "decimals": 6
      },
      "approvals": [
        {
          "byTransaction": {
            "to": "0xdAC17F958D2ee523a2206206994597C13D831ec7",
            "from": "0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234",
            "data": "0x095ea7b3000000000000000000000000878…0",
            "value": "0",
            "chainId": 1,
            "operations": null
          },
          "bySignature": null
        },
        {
          "byTransaction": {
            "to": "0xdAC17F958D2ee523a2206206994597C13D831ec7",
            "from": "0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234",
            "data": "0x095ea7b3000000000000000000000000878…42",
            "value": "0",
            "chainId": 1,
            "operations": null
          },
          "bySignature": null
        }
      ],
      "originalTransaction": {
        "to": "0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2",
        "from": "0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234",
        "data": "0x617ba037000000000000000000000000c0…",
        "value": "0",
        "chainId": 1,
        "operations": ["SPOKE_SUPPLY"]
      }
    }
  }
}
```

> [!NOTE]
> When handling `Erc20ApprovalRequired` with multiple approvals, send each
> `byTransaction` in sequence before sending the `originalTransaction`. For
> tokens like [USDT on Ethereum
> Mainnet](https://etherscan.io/token/0xdac17f958d2ee523a2206206994597c13d831ec7),
> the first approval resets the allowance to 0, and the second sets it to the
> required amount.

If the response is `PreContractActionRequired`, you must first send the `transaction` request, then send the `originalTransaction`.

```json title="PreContractActionRequired"
{
  "data": {
    "supply": {
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
        "operations": ["SPOKE_SUPPLY"]
      }
    }
  }
}
```

If the response is an `InsufficientBalanceError`, inform the user that they don't have enough balance to supply the requested amount.

```json title="InsufficientBalanceError"
{
  "data": {
    "supply": {
      "__typename": "InsufficientBalanceError",
      "required": {
        "value": "42.000000",
        "decimals": 6
      },
      "available": {
        "value": "15.500000",
        "decimals": 6
      }
    }
  }
}
```

</tab>
<tab label="Solidity">

With the same identifiers and amount to supply used to preview the supply operation:

```solidity title="Target Reserve"
address spokeAddress = 0x123…;
uint256 reserveId = 42;

uint256 amountToSupply = 42e6; // 42 USDC
```

Complete the supply process with the following steps:

#### Import the Spoke Interface

First, create an instance of the `ISpoke` interface.

```solidity title="Import the Spoke Interface"
import { ISpoke } from "aave-v4/src/spoke/interfaces/ISpoke.sol";

ISpoke spoke = ISpoke(spokeAddress);
```

#### Approve Token Transfer

Then, using the identified reserve, retrieve it from the spoke to get the hub address.

```solidity title="Hub Address"
ISpoke.Reserve memory reserve = spoke.getReserve(reserveId);
address hubAddress = address(reserve.hub);
```

And approve the associated hub to transfer the specified amount of ERC-20 tokens.

```solidity title="Approve Token Transfer"
import { IERC20 } from "aave-v4/src/dependencies/openzeppelin/IERC20.sol";

IERC20 token = IERC20(reserve.underlying);
token.approve(hubAddress, amountToSupply);
```

#### Supply Tokens

Finally, call the `supply` function on the Spoke contract, specifying the reserve ID, amount, and the address to credit the supply shares to.

```solidity title="Supply"
spoke.supply(
  reserveId,
  amountToSupply,
  msg.sender
);
```

#### Complete Example

Here's a complete example that executes the full supply flow:

```solidity title="Complete Supply Flow"
import { ISpoke } from "aave-v4/src/spoke/interfaces/ISpoke.sol";
import { IERC20 } from "aave-v4/src/dependencies/openzeppelin/IERC20.sol";

function supplyToReserve(
  address spokeAddress,
  uint256 reserveId,
  uint256 amountToSupply,
  address onBehalfOf
) external {
  ISpoke spoke = ISpoke(spokeAddress);

  // Step 1: Get reserve to retrieve hub address
  ISpoke.Reserve memory reserve = spoke.getReserve(reserveId);
  address hubAddress = address(reserve.hub);

  // Step 2: Approve hub to transfer tokens
  IERC20 token = IERC20(reserve.underlying);
  token.approve(hubAddress, amountToSupply);

  // Step 3: Supply tokens
  spoke.supply(reserveId, amountToSupply, onBehalfOf);
}
```

</tab>
</tabgroup>
## Collateral Management

Manage how user supplies are used as collateral for borrowing. The process can be broken down into three steps:

1. Identify the supply position
2. Preview the impact of changing collateral status
3. Toggle the collateral status

### Identify the Supply Position

First, identify the supply position you want to modify from the user's [supply positions](./fetch#user-supplies).

```ts title="UserSupplyItem"
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
    canUseAsCollateral: true,
    // …
  },
  isCollateral: false,
  balance: {
    amount: {
      value: BigDecimal(46.2),
    },
    // …
  },
  principal: {
    amount: {
      value: BigDecimal(42.0),
    },
    // …
  },
  interest: {
    amount: {
      value: BigDecimal(4.2),
    },
    // …
  },
};
```

The corresponding reserve needs to have `canUseAsCollateral: true` to be possible to use as collateral.

### Preview Changes

Preview the impact of changing collateral status before executing the transaction.

> [!WARNING]
> Disabling a supplied asset as collateral may reduce the position's health
> factor. In some cases, this may put the position at risk of being liquidated.

<tabgroup>
<tab label="React">

Use the `usePreview` hook (or the imperative `usePreviewAction` variant) to preview the impact of collateral status changes on the user's position.

```tsx title="Loading State"
import {
  type SetUserSuppliesAsCollateralRequest,
  usePreview,
} from "@aave/react";

function CollateralPreview({
  request,
}: {
  request: SetUserSuppliesAsCollateralRequest;
}) {
  const { data, error, loading } = usePreview({
    action: {
      setUserSuppliesAsCollateral: request,
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

      <h3>Net Collateral:</h3>
      From: {data.netCollateral.current.value.toDisplayString(2)}
      To: {data.netCollateral.after.value.toDisplayString(2)}

      <h3>Max Borrowing Power:</h3>
      From: {data.maxBorrowingPower.current.value.toDisplayString(2)}
      To: {data.maxBorrowingPower.after.value.toDisplayString(2)}
    </div>
  );
}
```

```tsx title="React Suspense"
import {
  type SetUserSuppliesAsCollateralRequest,
  usePreview,
} from "@aave/react";

function CollateralPreview({
  request,
}: {
  request: SetUserSuppliesAsCollateralRequest;
}) {
  const { data, error, loading } = usePreview({
    action: {
      setUserSuppliesAsCollateral: request,
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

      <h3>Net Collateral:</h3>
      From: {data.netCollateral.current.value.toDisplayString(2)}
      To: {data.netCollateral.after.value.toDisplayString(2)}

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

const handler = async (request: SetUserSuppliesAsCollateralRequest) => {
  const result = await preview({
    action: {
      setUserSuppliesAsCollateral: request,
    },
  });

  if (result.isOk()) {
    console.log(result.value); // PreviewUserPosition
  } else {
    console.error(result.error);
  }
};
```

Where the `SetUserSuppliesAsCollateralRequest` can be as follows:

```ts title="Single Change"
const request: SetUserSuppliesAsCollateralRequest = {
  sender: evmAddress("0x123…"), // User's address
  changes: [
    {
      reserve: supplyPosition.reserve.id,
      enableCollateral: true, // false to disable collateral
    },
  ],
};
```

```ts title="Multiple Changes"
const request: SetUserSuppliesAsCollateralRequest = {
  sender: evmAddress("0x123…"), // User's address
  changes: [
    {
      reserve: supplyPositions[0].reserve.id,
      enableCollateral: true,
    },
    {
      reserve: supplyPositions[1].reserve.id,
      enableCollateral: true,
    },
  ],
};
```

The `PreviewUserPosition` shows the impact of the collateral status change by comparing current and after states, with the table below outlining key fields and how to interpret them.

You can also specify a different currency to return fiat amounts in.

```ts title="usePreview"
import { Currency } from "@aave/react";

const { data, error, loading } = usePreview({
  action: {
    setUserSuppliesAsCollateral: request,
  },
  currency: Currency.Eur,
});
```

```ts title="usePreviewAction"
import { Currency } from "@aave/react";

const [preview, { called, data, error, loading }] = usePreviewAction({
  currency: Currency.Eur,
});
```

</tab>
<tab label="TypeScript">

Use the `preview` action to preview the impact of collateral status changes.

```ts title="Preview"
import { preview } from "@aave/client/actions";
import { evmAddress } from "@aave/client";

const result = await preview(client, {
  action: {
    setUserSuppliesAsCollateral: {
      sender: evmAddress("0x123…"), // User's address
      changes: [
        {
          reserve: supplyPosition.reserve.id,
          enableCollateral: true, // false to disable collateral
        },
      ],
    },
  },
});

if (result.isOk()) {
  console.log(result.value); // PreviewUserPosition
} else {
  console.error(result.error);
}
```

The `PreviewUserPosition` shows the impact of the collateral status change by comparing current and after states, with the table below outlining key fields and how to interpret them.

You can also specify a different currency to return fiat amounts in.

```ts title="Custom Currency"
import { Currency } from "@aave/client";

const result = await preview(client, {
  action: {
    setUserSuppliesAsCollateral: ,
  },
  currency: Currency.Eur,
});
```

</tab>
<tab label="GraphQL">

Use the `preview` query to preview the impact of collateral status changes.

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

```json title="Toggle Collateral"
{
  "request": {
    "action": {
      "setUserSuppliesAsCollateral": {
        "sender": "0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234",
        "changes": [
          {
            "reserve": "SGVsbG8h",
            "enableCollateral": true
          }
        ]
      }
    }
  }
}
```

The `PreviewUserPosition` shows the impact of the collateral status change by comparing current and after states, with the table below outlining key fields and how to interpret them.

You can also specify a different currency to return fiat amounts in.

```json title="Custom Currency"
{
  "request": {
    "action": {
      "setUserSuppliesAsCollateral": {
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

Follow the steps below to preview the impact of enabling or disabling collateral on the user's position.

#### Get Current Account Data

First, retrieve the user's current account data from the Spoke contract.

```solidity title="Get Account Data"
import { ISpoke } from "aave-v4/src/spoke/interfaces/ISpoke.sol";

ISpoke spoke = ISpoke(spokeAddress);
ISpoke.UserAccountData memory currentData = spoke.getUserAccountData(user);
```

#### Calculate Supply Position Value

Then, retrieve the user's supply position and calculate its USD value using the oracle.

```solidity title="Supply Position Value"
ISpoke.UserPosition memory userPosition = spoke.getUserPosition(reserveId, user);
ISpoke.Reserve memory reserve = spoke.getReserve(reserveId);
uint256 assetPrice = IAaveOracle(oracleAddress).getReservePrice(reserveId);
uint256 assetUnit = 10 ** reserve.decimals;

uint256 suppliedAssets = IHubBase(reserve.hub).previewRestoreByShares(reserve.assetId, userPosition.suppliedShares);
uint256 supplyValue = (suppliedAssets * assetPrice) / assetUnit;
```

#### Compute New Health Factor

Finally, calculate the new health factor based on whether collateral is being enabled or disabled.

```solidity title="Enable Collateral"
uint8 configKey = userPosition.configKey;
ISpoke.DynamicReserveConfig memory config = spoke.getDynamicReserveConfig(reserveId, configKey);
uint256 collateralFactor = config.collateralFactor;

uint256 currentWeightedSum = (currentData.totalCollateralValue * currentData.avgCollateralFactor) / 1e18;
uint256 newSupplyWeightedValue = (supplyValue * collateralFactor) / 10000;
uint256 newWeightedSum = currentWeightedSum + newSupplyWeightedValue;
uint256 newTotalCollateralValue = currentData.totalCollateralValue + supplyValue;

uint256 newAvgCollateralFactor = (newWeightedSum * 1e18) / newTotalCollateralValue;

uint256 newHealthFactor = (newTotalCollateralValue * newAvgCollateralFactor) / (currentData.totalDebtValue * 1e18);
```

```solidity title="Disable Collateral"
uint8 configKey = userPosition.configKey;
ISpoke.DynamicReserveConfig memory config = spoke.getDynamicReserveConfig(reserveId, configKey);
uint256 collateralFactor = config.collateralFactor;

uint256 currentWeightedSum = (currentData.totalCollateralValue * currentData.avgCollateralFactor) / 1e18;
uint256 removedWeightedValue = (supplyValue * collateralFactor) / 10000;
uint256 newWeightedSum = currentWeightedSum - removedWeightedValue;
uint256 newTotalCollateralValue = currentData.totalCollateralValue - supplyValue;

uint256 newAvgCollateralFactor = (newWeightedSum * 1e18) / newTotalCollateralValue;

uint256 newHealthFactor = (newTotalCollateralValue * newAvgCollateralFactor) / (currentData.totalDebtValue * 1e18);
```

</tab>
</tabgroup>
### Step-by-Step

Toggle the collateral status of any supplied asset using the following steps.

> [!WARNING]
> Enabling collateral updates the Dynamic Config—Collateral Factor, Liquidation
> Fee, and Max Liquidation Bonus—for the supplied asset. Disabling collateral is
> a risk-increasing action that updates the Dynamic Config and, consequently,
> the User Risk Premium for the entire user position. See [User Position
> Conditions](./conditions) for more details.

<tabgroup>
<tab label="React">

To enable or disable a supplied asset as collateral, follow these steps.

#### Configure Wallet Integration

First, instantiate the `useSendTransaction` hook for the [wallet library of your choice](../getting-started/react#integrations).

```tsx title="Viem"
import { useWalletClient } from "wagmi";
import { useSendTransaction } from "@aave/react/viem";

// …

const { data: wallet } = useWalletClient();
const [sendTransaction] = useSendTransaction(wallet);
```

#### Define the Collateral Management Flow

Use the `useSetUserSuppliesAsCollateral` hook to prepare the transaction request.

```tsx title="Basic Usage"
import { useSetUserSuppliesAsCollateral } from "@aave/react";

const [setAsCollateral, { loading, error }] = useSetUserSuppliesAsCollateral(
  (transaction) => sendTransaction(transaction),
);
```

```tsx title="Update Component State"
import { useSetUserSuppliesAsCollateral } from "@aave/react";

const [status, setStatus] = useState("");

const [setAsCollateral, { loading, error }] = useSetUserSuppliesAsCollateral(
  (transaction) => {
    setStatus("Please sign the transaction in your wallet");
    return sendTransaction(transaction).andTee(() =>
      setStatus("Setting collateral…"),
    );
  },
);
```

```tsx title="Cancel Flow"
import { useSetUserSuppliesAsCollateral } from "@aave/react";

const [setAsCollateral, { loading, error }] = useSetUserSuppliesAsCollateral(
  (transaction, { cancel }) => {
    if (window.confirm("Are you sure you want to continue?") === false) {
      return cancel("User cancelled the operation");
    }
    return sendTransaction(transaction);
  },
);
```

#### Execute the Transaction

Then, update the collateral status.

```tsx title="Set Collateral"
import { evmAddress } from "@aave/react";

const execute = async () => {
  const result = await setAsCollateral({
    sender: evmAddress(wallet.account.address), // User's address
    changes: [
      {
        reserve: supplyPosition.reserve.id,
        enableCollateral: true,
      },
    ],
  });
};

// …
```

#### Handle the Result

Finally, handle the result.

```tsx title="Example"
const execute = async () => {
  const result = await setAsCollateral(/* … */);

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

  console.log("Collateral set successful with hash:", result.value);
};
```

</tab>
<tab label="TypeScript">

To enable or disable a supplied asset as collateral, follow these steps.

#### Prepare the Transaction Request

Use the `setUserSuppliesAsCollateral` action to prepare the transaction request.

```ts title="Set Collateral"
import { setUserSuppliesAsCollateral } from "@aave/client/actions";
import { evmAddress } from "@aave/client";

import { client } from "./client";

const result = await setUserSuppliesAsCollateral(client, {
  sender: evmAddress(wallet.account.address), // User's address
  changes: [
    {
      reserve: supplyPosition.reserve.id,
      enableCollateral: true,
    },
  ],
});

// …
```

#### Process the Execution Plan

Then, use `sendWith` for the [wallet library of your choice](../getting-started/typescript#integrations) to send the transaction, and await indexing with `client.waitForTransaction`.

```ts title="Viem"
import { setUserSuppliesAsCollateral } from "@aave/client/actions";
import { sendWith } from "@aave/client/viem";

import { client } from "./client";
import { wallet } from "./wallet";

const result = await setUserSuppliesAsCollateral(client, {
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
  console.log("Collateral set successful with hash:", result.value);
}
```

</tab>
<tab label="GraphQL">

To enable or disable a supplied asset as collateral, follow these steps.

#### Prepare the Transaction Request

Use the `setUserSuppliesAsCollateral` query to prepare the transaction request.

```graphql title="Query"
query ($request: SetUserSuppliesAsCollateralRequest!) {
  setUserSuppliesAsCollateral(request: $request) {
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

Below is an example of a `SetUserSuppliesAsCollateralRequest` object.

```json title="Basic Usage"
{
  "request": {
    "sender": "0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234",
    "changes": [
      {
        "reserve": "SGVsbG8h",
        "enableCollateral": true
      }
    ]
  }
}
```

#### Execute the Transaction

Next, send the transaction.

The API returns a `TransactionRequest`, which you can send directly with the wallet tied to the `from` address.

```json title="TransactionRequest"
{
  "data": {
    "collateralToggle": {
      "__typename": "TransactionRequest",
      "to": "0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2",
      "from": "0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234",
      "data": "0x5a3b74b9000000000000000000000000c02…",
      "value": "0",
      "chainId": 1,
      "operations": ["SPOKE_SET_USER_USING_AS_COLLATERAL"]
    }
  }
}
```

</tab>
<tab label="Solidity">

To enable or disable a supplied asset as collateral, call `setUsingAsCollateral` on the Spoke contract.

```solidity title="Enable Collateral"
import { ISpoke } from "aave-v4/src/spoke/interfaces/ISpoke.sol";

ISpoke spoke = ISpoke(spokeAddress);
spoke.setUsingAsCollateral(
  reserveId,
  true,
  msg.sender
);
```

```solidity title="Disable Collateral"
import { ISpoke } from "aave-v4/src/spoke/interfaces/ISpoke.sol";

ISpoke spoke = ISpoke(spokeAddress);
spoke.setUsingAsCollateral(
  reserveId,
  false,
  msg.sender
);
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
  supply: {
    sender: evmAddress("0x123…"), // User's address
    reserve: supplyPosition.reserve.id,
    amount: {
      erc20: {
        value: bigDecimal(42), // USDC
      },
    },
  },
};
```

</NetworkFee>

### Native Tokens

When the Reserve's underlying token is the wrapped version of the chain's native token (e.g., WETH on Ethereum), you can supply the asset as the chain's native token using the Native Token Gateway.

Use the `reserve.asset.underlying.isWrappedNativeToken` flag to determine if the underlying token is a wrapped native token. The Native Gateway address is available from the chain details.

```ts title="WETH Reserve"
const reserve: Reserve = {
  id: "SGVsbG8h",
  onChainId: "42",
  canSupply: true,
  canUseAsCollateral: true,
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
  settings: {
    supplyCap: {
      amount: { value: BigDecimal(2000000000.0) }, // 2B WETH
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
};
```

Specify the amount in the `amount` field as a `native` value.

<tabgroup>
<tab label="React">

```tsx title="Supply Native"
const execute = async () => {
  const result = await supply({
    sender: evmAddress(wallet.account.address), // User's address
    reserve: reserve.id,
    amount: {
      native: bigDecimal(42), // 42 ETH
    },
  });

  // …
};
```

</tab>
<tab label="TypeScript">

```ts title="Supply Native"
const result = await supply(client, {
  sender: evmAddress(wallet.account.address), // User's address
  reserve: reserve.id,
  amount: {
    native: bigDecimal(42), // 42 ETH
  },
});

// …
```

</tab>
<tab label="GraphQL">

```json title="Supply Native"
{
  "request": {
    "sender": "0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234",
    "reserve": "SGVsbG8h",
    "amount": {
      "native": "42" // 42 ETH
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

Follow the steps below to supply native tokens (e.g., ETH) to a wrapped native token reserve (e.g., WETH).

#### Approve the Gateway

First, approve the Native Token Gateway as your position manager. This is a one-time setup step.

```solidity title="Approve Gateway"
import { ISpoke } from "aave-v4/src/spoke/interfaces/ISpoke.sol";

ISpoke spoke = ISpoke(spokeAddress);
spoke.setUserPositionManager(nativeGateway, true);
```

#### Supply Native Tokens

Then, call `supplyNative` on the gateway, sending the native token amount via `msg.value`.

```solidity title="Supply Native"
import { INativeTokenGateway } from "aave-v4/src/position-manager/interfaces/INativeTokenGateway.sol";

INativeTokenGateway gateway = INativeTokenGateway(nativeGateway);
gateway.supplyNative { value: amountToSupply }(reserveId, amountToSupply);
```

The gateway wraps the native token (ETH → WETH), approves the hub, and calls `spoke.supply` on your behalf.

#### Complete Example

Here's a complete example for supplying native tokens:

```solidity title="Complete Native Supply Flow"
import { ISpoke } from "aave-v4/src/spoke/interfaces/ISpoke.sol";
import { INativeTokenGateway } from "aave-v4/src/position-manager/interfaces/INativeTokenGateway.sol";

function supplyNativeToken(
  address spokeAddress,
  address nativeGateway,
  uint256 reserveId,
  uint256 amountToSupply
) external payable {
  require(msg.value == amountToSupply, "Incorrect ETH amount");

  ISpoke spoke = ISpoke(spokeAddress);

  // Step 1: Approve gateway as position manager (one-time setup)
  if (!spoke.isPositionManager(msg.sender, nativeGateway)) {
    spoke.setUserPositionManager(nativeGateway, true);
  }

  // Step 2: Supply native tokens via gateway
  INativeTokenGateway gateway = INativeTokenGateway(nativeGateway);
  gateway.supplyNative{value: amountToSupply}(reserveId, amountToSupply);
}
```

</tab>
</tabgroup>

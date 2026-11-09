# Borrow Assets

Learn how to borrow assets from Aave v4 reserves against your collateral.

---

Borrowing assets from Aave v4 allows you to:

- Access liquidity without selling your assets
- Leverage your positions with borrowed capital
- Repay borrowed assets at any time to close your position

> [!WARNING]
> Borrowing assets creates a debt that reduces the position's health factor.
> Make sure to maintain sufficient collateralization to avoid liquidation.
> Monitor the position's health factor regularly and consider market volatility.

## Borrowing

Borrowing on Aave v4 takes place at the spoke level, and users can only borrow against collateral supplied to that same spoke.

Borrowing can be broken down into the following steps:

1. Identify the Reserve to borrow from
2. Preview the impact of the borrow operation
3. Borrow the assets

### Identify the Reserve

The first step is to filter the borrow reserves on the same spoke as the collateral to those marked with `canBorrow: true`.

```tsx title="Reserves List"
const reserves: Reserve[] = [
  {
    id: "SGVsbG8h",
    onChainId: "42",
    canBorrow: true,
    settings: {
      borrowCap: {
        amount: { value: BigDecimal(1000000000.0) }, // 1B USDC
        // …
      },
      // …
    },
    status: {
      frozen: false,
      paused: false,
    },
    spoke: {
      address: "0x123…",
      // …
    },
    // …
  },
  {
    id: "V29ybGQh",
    onChainId: "43",
    canBorrow: false, // cannot borrow from this reserve
    settings: {
      borrowCap: {
        amount: { value: BigDecimal(500000000.0) }, // 500M DAI
        // …
      },
      // …
    },
    status: {
      frozen: true, // reserve is frozen
      paused: false,
    },
    spoke: {
      address: "0x123…",
      // …
    },
    // …
  },
  // …
];
```

> [!TIP]
> The `canBorrow` flag confirms that the reserve is active: it isn’t frozen, it
> isn’t paused, and the borrow cap has not been reached.

From the remaining borrowable reserves, select the one that:

- **Best matches the desired token** with a sufficient borrowable amount — this already accounts for the combined collateral factors (LTV ratios) of the position's collateral
- **Offers the lowest borrow APY** — the effective borrow APY combines the reserve’s borrow APY with the [Risk Premium](../positions#risk-premium) tied to the position's collateral

```tsx title="Reserve"
const reserve: Reserve = {
  id: "SGVsbG8h",
  onChainId: "42",
  canBorrow: true,
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
  userState: {
    borrowApy: {
      normalized: BigDecimal(3.73), // 3.73% APY
      // …
    },
    borrowable: {
      amount: {
        value: BigDecimal(10000.0), // 10,000 USDC
      },
      // …
    },
    // …
  },
};
```

> [!WARNING]
> Make sure you include a user address when fetching reserve data—otherwise
> `userState` will be `null`.

### Preview Borrow

Preview the impact of a borrow operation before committing to it.

<tabgroup>
<tab label="React">

Use the `usePreview` hook (or the imperative `usePreviewAction` variant) to preview the impact of the borrow operation on the user's position.

```tsx title="Loading State"
import { type BorrowRequest, usePreview } from "@aave/react";

function BorrowPreview({ request }: { request: BorrowRequest }) {
  const { data, error, loading } = usePreview({
    action: {
      borrow: request,
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

      <h3>Risk Premium:</h3>
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
import { type BorrowRequest, usePreview } from "@aave/react";

function BorrowPreview({ request }: { request: BorrowRequest }) {
  const { data, error, loading } = usePreview({
    action: {
      borrow: request,
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
import { type BorrowRequest, usePreviewAction } from "@aave/react";

const [preview, { called, data, error, loading }] = usePreviewAction();

const handler = async (request: BorrowRequest) => {
  const result = await preview({
    action: {
      borrow: request,
    },
  });

  if (result.isOk()) {
    console.log(result.value); // PreviewUserPosition
  } else {
    console.error(result.error);
  }
};
```

Where the `BorrowRequest` can be as follows:

```ts title="Borrow ERC-20"
const request: BorrowRequest = {
  sender: evmAddress("0x789…"), // User's address
  reserve: reserve.id,
  amount: {
    erc20: {
      value: bigDecimal(1000), // 1000 USDC
    },
  },
};
```

The `PreviewUserPosition` shows the impact of the borrow operation by comparing current and after states, with the table below outlining key fields and how to interpret them.

You can also specify a different currency to return fiat amounts in.

```ts title="usePreview"
import { Currency } from "@aave/react";

const { data, error, loading } = usePreview({
  action: {
    borrow: request,
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

Use the `preview` action to preview the impact of a borrow operation on the user's position.

```ts title="Preview"
import { preview } from "@aave/client/actions";
import { bigDecimal, evmAddress } from "@aave/client";

const result = await preview(client, {
  action: {
    borrow: {
      sender: evmAddress("0x789…"), // User's address
      reserve: reserve.id,
      amount: {
        erc20: {
          value: bigDecimal(1000), // 1000 USDC
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

The `PreviewUserPosition` shows the impact of the borrow operation by comparing current and after states, with the table below outlining key fields and how to interpret them.

You can also specify a different currency to return fiat amounts in.

```ts title="Custom Currency"
import { Currency } from "@aave/client";

const result = await preview(client, {
  action: {
    borrow: ,
  },
  currency: Currency.Eur,
});
```

</tab>
<tab label="GraphQL">

Use the `preview` query to preview the impact of borrow operations on the user's position.

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

Where the `PreviewRequest` can be as follows:

```json title="Borrow ERC-20"
{
  "request": {
    "action": {
      "borrow": {
        "sender": "0x789…",
        "reserve": "SGVsbG8h",
        "amount": {
          "erc20": {
            "value": "1000"
          }
        }
      }
    }
  }
}
```

The `PreviewUserPosition` shows the impact of the borrow operation by comparing current and after states, with the table below outlining key fields and how to interpret them.

You can also specify a different currency to return fiat amounts in.

```json title="Custom Currency"
{
  "request": {
    "action": {
      "borrow": {
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

And an amount to borrow:

```solidity title="Amount to Borrow"
uint256 amountToBorrow = 42e6; // 42 USDC
```

Follow the steps below to preview the impact of a borrow operation on the user's position.

#### Get Current Account Data

First, retrieve the user's current account data from the Spoke contract.

```solidity title="Get Account Data"
import { ISpoke } from "aave-v4/src/spoke/interfaces/ISpoke.sol";

ISpoke spoke = ISpoke(spokeAddress);
ISpoke.UserAccountData memory currentData = spoke.getUserAccountData(user);
```

#### Calculate New Debt Value

Then, retrieve the reserve data and asset price from the oracle to calculate the USD value of the new borrow, and add it to the current total debt.

```solidity title="New Debt Value"
address oracleAddress = spoke.ORACLE();
ISpoke.Reserve memory reserve = spoke.getReserve(reserveId);
uint256 assetPrice = IAaveOracle(oracleAddress).getReservePrice(reserveId);
uint256 assetUnit = 10 ** reserve.decimals;

uint256 borrowValue = (borrowAmount * assetPrice) / assetUnit;
uint256 newTotalDebtValue = currentData.totalDebtValue + borrowValue;
```

#### Compute New Health Factor

Finally, calculate the new health factor by incorporating the new debt value.

```solidity title="Compute New Health Factor"
uint256 newHealthFactor = (currentData.totalCollateralValue * currentData.avgCollateralFactor) / (newTotalDebtValue * 1e18);
```

#### Complete Example

Here's a complete example that calculates the health factor before a borrow operation:

```solidity title="Complete Health Factor Preview"
import { ISpoke } from "aave-v4/src/spoke/interfaces/ISpoke.sol";
import { IAaveOracle } from "aave-v4/src/spoke/interfaces/IAaveOracle.sol";

function previewBorrowHealthFactor(
  address spokeAddress,
  uint256 reserveId,
  uint256 borrowAmount,
  address user
) external view returns (uint256) {
  ISpoke spoke = ISpoke(spokeAddress);
  address oracleAddress = spoke.ORACLE();
  IAaveOracle oracle = IAaveOracle(oracleAddress);

  // Step 1: Get Current Account Data
  ISpoke.UserAccountData memory currentData = spoke.getUserAccountData(user);

  // Step 2: Calculate New Debt Value
  ISpoke.Reserve memory reserve = spoke.getReserve(reserveId);
  uint256 assetPrice = oracle.getReservePrice(reserveId);
  uint256 assetUnit = 10 ** reserve.decimals;
  uint256 borrowValue = (borrowAmount * assetPrice) / assetUnit;
  uint256 newTotalDebtValue = currentData.totalDebtValue + borrowValue;

  // Step 3: Compute New Health Factor
  uint256 newHealthFactor = (currentData.totalCollateralValue * currentData.avgCollateralFactor) / (newTotalDebtValue * 1e18);
  return newHealthFactor;
}
```

</tab>
</tabgroup>
### Step-by-Step

Now that we know how to identify a reserve to borrow from, and we know how to preview the impact of a borrow operation, let's see how to borrow assets from this reserve.

> [!WARNING]
> Borrowing assets is a risk-increasing action and will update the Dynamic
> Config, which in turn updates the User Risk Premium for the given position.
> See [User Position Conditions](./conditions) for more details.

<tabgroup>
<tab label="React">

To borrow assets from an Aave reserve with AaveKit React, follow these steps.

#### Configure Wallet Integration

First, instantiate the `useSendTransaction` hook for the [wallet library of your choice](../getting-started/react#integrations).

```tsx title="Viem"
import { useWalletClient } from "wagmi";
import { useSendTransaction } from "@aave/react/viem";

// …

const { data: wallet } = useWalletClient();
const [sendTransaction] = useSendTransaction(wallet);
```

#### Define the Borrow Flow

Then, use the `useBorrow` hook to prepare the borrow operation.

```tsx title="Basic Usage"
import { useBorrow } from "@aave/react";

const [borrow, { loading, error }] = useBorrow((plan) => {
  switch (plan.__typename) {
    case "TransactionRequest":
      return sendTransaction(plan);

    case "PreContractActionRequired":
      return sendTransaction(plan.transaction);
  }
});
```

```tsx title="Update Component State"
import { useBorrow } from "@aave/react";

const [status, setStatus] = useState("");

const [borrow, { loading, error }] = useBorrow((plan) => {
  switch (plan.__typename) {
    case "TransactionRequest":
      setStatus("Please sign the Borrow transaction in your wallet");
      return sendTransaction(plan).andTee(() => setStatus("Borrowing…"));

    case "PreContractActionRequired":
      setStatus("Please sign the Pre-Contract Action in your wallet");
      return sendTransaction(plan.transaction).andTee(() =>
        setStatus("Processing…"),
      );
  }
});
```

```tsx title="Cancel Flow"
import { useBorrow } from "@aave/react";

const [borrow, { loading, error }] = useBorrow((plan, { cancel }) => {
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

#### Execute the Borrow Operation

Then, execute the desired borrow operation.

```tsx title="Borrow ERC-20"
import { bigDecimal, evmAddress } from "@aave/react";

const execute = async () => {
  const result = await borrow({
    sender: evmAddress(wallet.account.address), // User's address
    reserve: reserve.id,
    amount: {
      erc20: {
        value: bigDecimal(100), // 100 USDC
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
  const result = await borrow(/* … */);

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

      default:
        console.error(result.error.message);
        break;
    }
    return;
  }

  console.log("Borrow successful with hash:", result.value.txHash);
};
```

</tab>
<tab label="TypeScript">

To borrow assets from an Aave reserve with AaveKit TypeScript, follow these steps.

#### Prepare the Execution Plan

Use the `borrow` action to prepare the borrow execution plan.

```ts title="Borrow ERC-20"
import { borrow } from "@aave/client/actions";
import { bigDecimal, evmAddress } from "@aave/client";

import { client } from "./client";

const result = await borrow(client, {
  sender: evmAddress(wallet.account.address), // User's address
  reserve: reserve.id,
  amount: {
    erc20: {
      value: bigDecimal(100), // 100 USDC
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
import { borrow } from "@aave/client/actions";
import { sendWith } from "@aave/client/viem";

import { client } from "./client";
import { wallet } from "./wallet";

const result = await borrow(client, {
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

```ts title="Example"
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

    default:
      console.error(result.error.message);
      break;
  }
  return;
}

console.log("Borrow successful with hash:", result.value.txHash);
```

</tab>
<tab label="GraphQL">

To borrow assets from an Aave reserve with AaveKit API, follow these steps.

#### Prepare the Execution Plan

Use the `borrow` query to prepare the borrow execution plan.

```graphql title="Query"
query ($request: BorrowRequest!) {
  borrow(request: $request) {
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

Below an example of `BorrowRequest` object.

```json title="Variables"
{
  "request": {
    "sender": "0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234",
    "reserve": "SGVsbG8h",
    "amount": {
      "erc20": {
        "value": "100"
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
    "borrow": {
      "__typename": "TransactionRequest",
      "to": "0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2",
      "from": "0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234",
      "data": "0x617ba037000000000000000000000000c0…",
      "value": "0",
      "chainId": 1,
      "operations": ["SPOKE_BORROW"]
    }
  }
}
```

If the response is a `PreContractActionRequired`, you must first send the `transaction` request. Once it succeeds, you can then send the `originalTransaction`.

```json title="PreContractActionRequired"
{
  "data": {
    "borrow": {
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
        "operations": ["SPOKE_BORROW"]
      }
    }
  }
}
```

</tab>
<tab label="Solidity">

With the same identifiers and amount to borrow used to preview the borrow operation:

```solidity title="Target Reserve"
address spokeAddress = 0x123…;
uint256 reserveId = 42;

uint256 amountToBorrow = 42e6; // 42 USDC
```

Complete the borrow process with the following steps:

#### Import the Spoke Interface

First, create an instance of the `ISpoke` interface.

```solidity title="Import the Spoke Interface"
import { ISpoke } from "aave-v4/src/spoke/interfaces/ISpoke.sol";

ISpoke spoke = ISpoke(spokeAddress);
```

#### Borrow Assets

Then, call the `borrow` function on the Spoke contract, specifying the reserve ID, amount to borrow, and the recipient address.

```solidity title="Borrow"
spoke.borrow(
  reserveId,
  amountToBorrow,
  msg.sender
);
```

#### Complete Example

Here's a complete example that executes the borrow operation:

```solidity title="Complete Borrow Flow"
import { ISpoke } from "aave-v4/src/spoke/interfaces/ISpoke.sol";

function borrowFromReserve(
  address spokeAddress,
  uint256 reserveId,
  uint256 amountToBorrow
) external {
  ISpoke spoke = ISpoke(spokeAddress);

  // Borrow assets from reserve
  spoke.borrow(reserveId, amountToBorrow, msg.sender);
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
  borrow: {
    sender: evmAddress("0x789…"), // User's address
    reserve: reserve.id,
    amount: {
      erc20: {
        value: bigDecimal(1000), // 1000 USDC
      },
    },
  },
};
```

</NetworkFee>

### Native Tokens

When the Reserve's underlying token is the wrapped version of the chain's native token (e.g., WETH on Ethereum), you can borrow the asset as the chain's native token using the Native Token Gateway.

Use the `asset.underlying.isWrappedNativeToken` flag to determine if the underlying token is a wrapped native token. The Native Gateway address is available from the chain details.

```ts title="WETH Reserve"
const reserve: Reserve = {
  id: "SGVsbG8h",
  onChainId: "42",
  canBorrow: true,
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
    borrowCap: {
      amount: { value: BigDecimal(1000000000.0) }, // 1B WETH
      // …
    },
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

```tsx title="Borrow Native"
const execute = async () => {
  const result = await borrow({
    sender: evmAddress(wallet.account.address), // User's address
    reserve: reserve.id,
    amount: {
      native: bigDecimal(1), // 1 ETH
    },
  });

  // …
};
```

</tab>
<tab label="TypeScript">

```ts title="Borrow Native"
const result = await borrow(client, {
  sender: evmAddress(wallet.account.address), // User's address
  reserve: reserve.id,
  amount: {
    native: bigDecimal(1), // 1 ETH
  },
});

// …
```

</tab>
<tab label="GraphQL">

```json title="Borrow Native"
{
  "request": {
    "sender": "0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234",
    "reserve": "SGVsbG8h",
    "amount": {
      "native": "1" // 1 ETH
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

Follow the steps below to borrow native tokens (e.g., ETH) from a wrapped native token reserve (e.g., WETH).

#### Approve the Gateway

First, approve the Native Token Gateway as your position manager. This is a one-time setup step.

```solidity title="Approve Gateway"
import { ISpoke } from "aave-v4/src/spoke/interfaces/ISpoke.sol";

ISpoke spoke = ISpoke(spokeAddress);
spoke.setUserPositionManager(nativeGateway, true);
```

#### Borrow Native Tokens

Then, call `borrowNative` on the gateway to borrow and unwrap the tokens.

```solidity title="Borrow Native"
import { INativeTokenGateway } from "aave-v4/src/position-manager/interfaces/INativeTokenGateway.sol";

INativeTokenGateway gateway = INativeTokenGateway(nativeGateway);
gateway.borrowNative(reserveId, amountToBorrow, msg.sender);
```

The gateway calls `spoke.borrow` on your behalf, unwraps the token (WETH → ETH), and sends the native token to the specified receiver.

#### Complete Example

Here's a complete example for borrowing native tokens:

```solidity title="Complete Native Borrow Flow"
import { ISpoke } from "aave-v4/src/spoke/interfaces/ISpoke.sol";
import { INativeTokenGateway } from "aave-v4/src/position-manager/interfaces/INativeTokenGateway.sol";

function borrowNativeToken(
  address spokeAddress,
  address nativeGateway,
  uint256 reserveId,
  uint256 amountToBorrow,
  address receiver
) external {
  ISpoke spoke = ISpoke(spokeAddress);

  // Step 1: Approve gateway as position manager (one-time setup)
  if (!spoke.isPositionManager(msg.sender, nativeGateway)) {
    spoke.setUserPositionManager(nativeGateway, true);
  }

  // Step 2: Borrow native tokens via gateway
  INativeTokenGateway gateway = INativeTokenGateway(nativeGateway);
  gateway.borrowNative(reserveId, amountToBorrow, receiver);
}
```

</tab>
</tabgroup>

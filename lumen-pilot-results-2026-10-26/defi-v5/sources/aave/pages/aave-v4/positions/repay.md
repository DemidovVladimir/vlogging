# Repay Loans

Learn how to repay borrowed assets to Aave v4 reserves.

---

Repaying borrowed assets allows you to:

- Reduce or eliminate your debt position
- Improve your position's health factor and reduce liquidation risk
- Free up collateral for withdrawal or additional borrowing
- Close your borrow position entirely when repaying the full amount

> [!TIP]
> Repaying borrowed assets improves the position's health factor and reduces
> liquidation risk. You can repay partial amounts or the full debt amount.

## Repaying

Repaying a loan can be broken down into the following steps:

1. Identify the borrow position to repay
2. Preview the impact of the repay operation
3. Repay the borrowed assets

### Identify the Borrow Position

Given a list of the user's [borrow positions](./fetch#user-borrows), identify the position (token) you want to reduce and choose the repayment amount (partial or full).

> [!WARNING]
> The borrowed position reserve should not be paused in order to repay.

For example, let’s say you have identified the following `UserBorrowItem` object.

```tsx title="Example UserBorrowItem"
const borrowPosition: UserBorrowItem = {
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
  debt: {
    amount: {
      value: BigDecimal(512.023456), // ~512 USDC debt
      // …
    },
    // …
  },
  // …
};
```

Keep in mind that repaying:

- Improves your health factor, reducing liquidation risk.
- Frees up collateral, making it available for withdrawal or additional borrowing.
- Can be partial (reducing debt but keeping the position open) or full (closing the borrow position entirely).

### Preview Repay

Preview the impact of a repay operation before committing to it.

<tabgroup>
<tab label="React">

Use the `usePreview` hook (or the imperative `usePreviewAction` variant) to preview the impact of the repay operation on the user's position.

```tsx title="Loading State"
import { type RepayRequest, usePreview } from "@aave/react";

function RepayPreview({ request }: { request: RepayRequest }) {
  const { data, error, loading } = usePreview({
    action: {
      repay: request,
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
import { type RepayRequest, usePreview } from "@aave/react";

function RepayPreview({ request }: { request: RepayRequest }) {
  const { data, error, loading } = usePreview({
    action: {
      repay: request,
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
import { type RepayRequest, usePreviewAction } from "@aave/react";

const [preview, { called, data, error, loading }] = usePreviewAction();

const handler = async (request: RepayRequest) => {
  const result = await preview({
    action: {
      repay: request,
    },
  });

  if (result.isOk()) {
    console.log(result.value); // PreviewUserPosition
  } else {
    console.error(result.error);
  }
};
```

Where the `RepayRequest` can be as follows:

```ts title="Repay Specific Amount"
const request: RepayRequest = {
  sender: evmAddress("0x789…"), // User's address
  reserve: borrowPosition.reserve.id,
  amount: {
    erc20: {
      value: {
        exact: bigDecimal(250), // 250 USDC
      },
    },
  },
};
```

```tsx title="Repay Maximum Amount"
const request: RepayRequest = {
  sender: evmAddress("0x789…"), // User's address
  reserve: borrowPosition.reserve.id,
  amount: {
    erc20: {
      value: {
        max: true, // Repay the full debt amount
      },
    },
  },
};
```

The `PreviewUserPosition` shows the impact of the repay operation by comparing current and after states, with the table below outlining key fields and how to interpret them.

You can also specify a different currency to return fiat amounts in.

```ts title="usePreview"
import { Currency } from "@aave/react";

const { data, error, loading } = usePreview({
  action: {
    repay: request,
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

Use the `preview` action to preview the impact of a repay operation on the user's position.

```ts title="Repay Specific Amount"
import { preview } from "@aave/client/actions";
import { bigDecimal, evmAddress } from "@aave/client";

const result = await preview(client, {
  action: {
    repay: {
      sender: evmAddress("0x789…"), // User's address
      reserve: borrowPosition.reserve.id,
      amount: {
        erc20: {
          value: {
            exact: bigDecimal(250), // 250 USDC
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

```ts title="Repay Maximum Amount"
import { preview } from "@aave/client/actions";
import { evmAddress } from "@aave/client";

const result = await preview(client, {
  action: {
    repay: {
      sender: evmAddress("0x789…"), // User's address
      reserve: borrowPosition.reserve.id,
      amount: {
        erc20: {
          value: {
            max: true, // Repay the full debt amount
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

The `PreviewUserPosition` shows the impact of the repay operation by comparing current and after states, with the table below outlining key fields and how to interpret them.

You can also specify a different currency to return fiat amounts in.

```ts title="Custom Currency"
import { Currency } from "@aave/client";

const result = await preview(client, {
  action: {
    repay: ,
  },
  currency: Currency.Eur,
});
```

</tab>
<tab label="GraphQL">

Use the `preview` query to preview the impact of repay operations on the user's position.

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

```json title="Repay Specific Amount"
{
  "request": {
    "action": {
      "repay": {
        "sender": "0x789…",
        "reserve": "SGVsbG8h",
        "amount": {
          "erc20": {
            "value": {
              "exact": "250"
            }
          }
        }
      }
    }
  }
}
```

```json title="Repay Maximum Amount"
{
  "request": {
    "action": {
      "repay": {
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

The `PreviewUserPosition` shows the impact of the repay operation by comparing current and after states, with the table below outlining key fields and how to interpret them.

You can also specify a different currency to return fiat amounts in.

```json title="Custom Currency"
{
  "request": {
    "action": {
      "repay": {
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

And an amount to repay:

```solidity title="Amount to Repay"
uint256 amountToRepay = 42e6; // 42 USDC
```

Follow the steps below to preview the impact of a repay operation on the user's position.

#### Get Current Account Data

First, retrieve the user's current account data from the Spoke contract.

```solidity title="Get Account Data"
import { ISpoke } from "aave-v4/src/spoke/interfaces/ISpoke.sol";

ISpoke spoke = ISpoke(spokeAddress);
ISpoke.UserAccountData memory currentData = spoke.getUserAccountData(user);
```

#### Calculate Repay Value

Then, retrieve the reserve data and asset price from the oracle to calculate the USD value of the repayment amount.

```solidity title="Repay Value"
address oracleAddress = spoke.ORACLE();
ISpoke.Reserve memory reserve = spoke.getReserve(reserveId);
uint256 assetPrice = IAaveOracle(oracleAddress).getReservePrice(reserveId);
uint256 assetUnit = 10 ** reserve.decimals;

uint256 repayValue = (amountToRepay * assetPrice) / assetUnit;
```

#### Compute New Health Factor

Finally, calculate the new health factor by reducing the total debt value.

```solidity title="Compute New Health Factor"
uint256 newTotalDebtValue = currentData.totalDebtValue - repayValue;

uint256 newHealthFactor = (currentData.totalCollateralValue * currentData.avgCollateralFactor) / (newTotalDebtValue * 1e18);
```

#### Complete Example

Here's a complete example that calculates the health factor before a repay operation:

```solidity title="Complete Health Factor Preview"
import { ISpoke } from "aave-v4/src/spoke/interfaces/ISpoke.sol";
import { IAaveOracle } from "aave-v4/src/spoke/interfaces/IAaveOracle.sol";

function previewRepayHealthFactor(
  address spokeAddress,
  uint256 reserveId,
  uint256 amountToRepay,
  address user
) external view returns (uint256) {
  ISpoke spoke = ISpoke(spokeAddress);

  // Step 1: Get current account data
  ISpoke.UserAccountData memory currentData = spoke.getUserAccountData(user);

  // Step 2: Calculate repay value
  address oracleAddress = spoke.ORACLE();
  ISpoke.Reserve memory reserve = spoke.getReserve(reserveId);
  uint256 assetPrice = IAaveOracle(oracleAddress).getReservePrice(reserveId);
  uint256 assetUnit = 10 ** reserve.decimals;
  uint256 repayValue = (amountToRepay * assetPrice) / assetUnit;

  // Step 3: Compute new health factor
  uint256 newTotalDebtValue = currentData.totalDebtValue - repayValue;
  uint256 newHealthFactor = (currentData.totalCollateralValue * currentData.avgCollateralFactor) / (newTotalDebtValue * 1e18);

  return newHealthFactor;
}
```

</tab>
</tabgroup>
### Step-by-Step

Now that we know how to identify a borrow position to repay, and we know how to preview the impact of a repay operation, let's see how to repay assets for this position.

Repaying ERC-20 tokens requires token approval. You can choose between two approaches:

- **Transaction-based approval** — Sends a separate ERC-20 `approve()` transaction before the repay transaction (2 transactions total).
- **Permit-based approval** — Signs an [EIP-2612](https://eips.ethereum.org/EIPS/eip-2612) permit to approve and repay in a single transaction. More gas-efficient, but requires the token to support permits.

<tabgroup>
<tab label="React">

To repay a loan with AaveKit React, follow these steps.

#### Configure Wallet Integration

First, instantiate the hooks for the [wallet library of your choice](../getting-started/react#integrations):

- `useSendTransaction` — used to send ERC-20 approval and repay transactions
- `useSignTypedData` — used to sign ERC-20 permits when available

```tsx title="Viem"
import { useWalletClient } from "wagmi";
import { useSendTransaction, useSignTypedData } from "@aave/react/viem";

// …

const { data: wallet } = useWalletClient();
const [sendTransaction] = useSendTransaction(wallet);
const [signTypedData] = useSignTypedData(wallet);
```

#### Define the Repay Flow

Then, use the `useRepay` hook to prepare the repay operation.

```tsx title="Basic Usage"
import { useRepay } from "@aave/react";

const [repay, { loading, error }] = useRepay((plan) => {
  switch (plan.__typename) {
    case "TransactionRequest":
      return sendTransaction(plan);

    case "Erc20Approval":
      // If token supports EIP-2612 permits, sign permit (recommended)
      if (plan.bySignature) {
        return signTypedData(plan.bySignature);
      }
      // Otherwise use traditional approval transaction
      return sendTransaction(plan.byTransaction);

    case "PreContractActionRequired":
      return sendTransaction(plan.transaction);
  }
});
```

```tsx title="Update Component State"
import { useRepay } from "@aave/react";

const [status, setStatus] = useState("");

const [repay, { loading, error }] = useRepay((plan) => {
  switch (plan.__typename) {
    case "TransactionRequest":
      setStatus("Please sign the Repay transaction in your wallet");
      return sendTransaction(plan).andTee(() => setStatus("Repaying…"));

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
import { useRepay } from "@aave/react";

const [repay, { loading, error }] = useRepay((plan, { cancel }) => {
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

> [!TIP]
> For tokens like [USDT on Ethereum
> Mainnet](https://etherscan.io/token/0xdac17f958d2ee523a2206206994597c13d831ec7)
> that require an allowance reset, the hook calls your callback twice: once to
> reset the allowance to 0, then again to set the new value. `bySignature` will
> be `null` for these approvals.

#### Execute the Repay Operation

Then, execute the desired repay operation.

```tsx title="Repay Specific Amount"
import { bigDecimal, evmAddress } from "@aave/react";

const execute = async () => {
  const result = await repay({
    sender: evmAddress(wallet.account.address), // User's address
    reserve: borrowPosition.reserve.id,
    amount: {
      erc20: {
        value: {
          exact: bigDecimal(250), // Repay 250 USDC
        },
      },
    },
  });

  // …
};
```

```tsx title="Repay Maximum Amount"
import { evmAddress } from "@aave/react";

const execute = async () => {
  const result = await repay({
    sender: evmAddress(wallet.account.address), // User's address
    reserve: borrowPosition.reserve.id,
    amount: {
      erc20: {
        value: {
          max: true, // Repay the full debt amount
        },
      },
    },
  });

  // …
};
```

### Handle the Result

Finally, handle the result.

```tsx title="Example"
const execute = async () => {
  const result = await repay(/* … */);

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

  console.log("Repay successful with hash:", result.value.txHash);
};
```

</tab>
<tab label="TypeScript">

To repay a loan with AaveKit TypeScript, follow these steps.

#### Prepare the Execution Plan

First, use the `repay` action to prepare the repay execution plan.

```ts title="Transaction-based"
import { repay } from "@aave/client/actions";
import { bigDecimal, evmAddress } from "@aave/client";

import { client } from "./client";

const result = await repay(client, {
  sender: evmAddress(wallet.account.address), // User's address
  reserve: borrowPosition.reserve.id,
  amount: {
    erc20: {
      value: {
        exact: bigDecimal(250), // Repay 250 USDC
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

To handle ERC-20 permit-based approval, first get the execution plan, sign the permit typed data when available, then call `repay` again with both the signature and signed amount.

```ts title="Permit-based (Viem)"
import { repay } from "@aave/client/actions";
import { signTypedDataWith } from "@aave/client/viem";
import { bigDecimal, evmAddress, okAsync } from "@aave/client";

import { client } from "./client";
import { wallet } from "./wallet";

const result = await repay(client, {
  sender: evmAddress(wallet.account.address),
  reserve: borrowPosition.reserve.id,
  amount: {
    erc20: {
      value: {
        exact: bigDecimal(250), // Repay 250 USDC
      },
    },
  },
})
  .andThen((plan) => {
    if (
      plan.__typename !== "Erc20ApprovalRequired" ||
      plan.approvals.length !== 1 ||
      !plan.approvals[0].bySignature
    ) {
      return okAsync(plan);
    }

    const permitTypedData = plan.approvals[0].bySignature;
    return signTypedDataWith(wallet, permitTypedData).andThen((signature) =>
      repay(client, {
        sender: evmAddress(wallet.account.address),
        reserve: borrowPosition.reserve.id,
        amount: {
          erc20: {
            value: {
              exact: bigDecimal(250),
            },
            permit: {
              permitSig: {
                deadline: permitTypedData.message.deadline as number,
                value: signature,
              },
              signedAmount: permitTypedData.signedAmount,
            },
          },
        },
      }),
    );
  });

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

The permit-based repay flow:

1. Call `repay` without a permit
2. If the response is `Erc20ApprovalRequired` with a single `approvals[0].bySignature`, sign it
3. Call `repay` again with `amount.erc20.permit.permitSig` and `amount.erc20.permit.signedAmount`
4. Otherwise, keep the original execution plan (no permit needed or token doesn't support permits)

> [!TIP]
> For tokens like [USDT on Ethereum
> Mainnet](https://etherscan.io/token/0xdac17f958d2ee523a2206206994597c13d831ec7)
> that require an allowance reset, permit-based approval is not available and the
> execution plan will include transaction-based approvals.

#### Process the Execution Plan

Then, use `sendWith` for the [wallet library of your choice](../getting-started/typescript#integrations) to send the transactions in the execution plan, and await indexing with `client.waitForTransaction`.

```ts title="Transaction-based"
import { repay } from "@aave/client/actions";
import { sendWith } from "@aave/client/viem";

import { client } from "./client";
import { wallet } from "./wallet";

const result = await repay(client, {
  // …
})
  .andThen(sendWith(wallet))
  .andThen(client.waitForTransaction);
```

```ts title="Permit-based"
import { repay } from "@aave/client/actions";
import { sendWith, signTypedDataWith } from "@aave/client/viem";
import { bigDecimal, evmAddress } from "@aave/client";

import { client } from "./client";
import { wallet } from "./wallet";

const result = await repay(client, {
  sender: evmAddress(wallet.account.address),
  reserve: borrowPosition.reserve.id,
  amount: {
    erc20: {
      value: { exact: bigDecimal(250) },
    },
  },
})
  .andThen((plan) => {
    if (
      plan.__typename !== "Erc20ApprovalRequired" ||
      plan.approvals.length !== 1 ||
      !plan.approvals[0].bySignature
    ) {
      return sendWith(wallet, plan);
    }

    const permitTypedData = plan.approvals[0].bySignature;
    return signTypedDataWith(wallet, permitTypedData)
      .andThen((signature) =>
        repay(client, {
          sender: evmAddress(wallet.account.address),
          reserve: borrowPosition.reserve.id,
          amount: {
            erc20: {
              value: { exact: bigDecimal(250) },
              permit: {
                permitSig: {
                  deadline: permitTypedData.message.deadline as number,
                  value: signature,
                },
                signedAmount: permitTypedData.signedAmount,
              },
            },
          },
        }),
      )
      .andThen(sendWith(wallet));
  })
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
  console.log("Repay successful with hash:", result.value.txHash);
}
```

</tab>
<tab label="GraphQL">

To repay a loan with AaveKit API, follow these steps.

#### Prepare the Execution Plan

Use the `repay` query to prepare the repay execution plan.

```graphql title="Query"
query ($request: RepayRequest!) {
  repay(request: $request) {
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
  signedAmount
}
```

Below are some examples of `RepayRequest` objects.

```json title="Repay Specific Amount"
{
  "request": {
    "sender": "0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234",
    "reserve": "SGVsbG8h",
    "amount": {
      "erc20": {
        "value": {
          "exact": "250"
        }
      }
    }
  }
}
```

```json title="Repay Maximum Amount"
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

```json title="Permit-based Approval"
{
  "request": {
    "sender": "0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234",
    "reserve": "SGVsbG8h",
    "amount": {
      "erc20": {
        "value": {
          "exact": "250"
        },
        "permit": {
          "permitSig": {
            "deadline": 1700000000, // use approvals[0].bySignature.message.deadline
            "value": "0xabcdef…"
          },
          "signedAmount": "250.000000" // use approvals[0].bySignature.signedAmount
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
    "repay": {
      "__typename": "TransactionRequest",
      "to": "0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2",
      "from": "0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234",
      "data": "0x617ba037000000000000000000000000c0…",
      "value": "0",
      "chainId": 1,
      "operations": ["SPOKE_REPAY"]
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
2. Call the `repay` query again with both the permit signature and `signedAmount` (see the `Permit-based Approval` example above)
3. The response will be a `TransactionRequest` you can then send directly

```json title="Single Approval"
{
  "data": {
    "repay": {
      "__typename": "Erc20ApprovalRequired",
      "reason": "Insufficient allowance for ERC-20 token transfer",
      "requiredAmount": {
        "value": "250.000000",
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
            "types": { ... },
            "primaryType": "Permit",
            "domain": { ... },
            "message": { ... },
            "signedAmount": "250.000000"
          }
        }
      ],
      "originalTransaction": {
        "to": "0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2",
        "from": "0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234",
        "data": "0x617ba037000000000000000000000000c0…",
        "value": "0",
        "chainId": 1,
        "operations": ["SPOKE_REPAY"]
      }
    }
  }
}
```

```json title="With Approval Reset (USDT-like)"
{
  "data": {
    "repay": {
      "__typename": "Erc20ApprovalRequired",
      "reason": "Token requires allowance reset before new approval",
      "requiredAmount": {
        "value": "250.000000",
        "decimals": 6
      },
      "currentAllowance": {
        "value": "100.000000",
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
            "data": "0x095ea7b3000000000000000000000000878…250",
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
        "operations": ["SPOKE_REPAY"]
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
    "repay": {
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
        "operations": ["SPOKE_REPAY"]
      }
    }
  }
}
```

If the response is an `InsufficientBalanceError`, inform the user that they don't have enough tokens to repay the requested amount.

```json title="InsufficientBalanceError"
{
  "data": {
    "repay": {
      "__typename": "InsufficientBalanceError",
      "required": {
        "value": "250.000000",
        "decimals": 6
      },
      "available": {
        "value": "150.500000",
        "decimals": 6
      }
    }
  }
}
```

</tab>
<tab label="Solidity">

With the same identifiers and amount to repay used to preview the repay operation:

```solidity title="Target Reserve"
address spokeAddress = 0x123…;
uint256 reserveId = 42;
uint256 amountToRepay = 250e6; // 250 USDC
```

Complete the repay process with the following steps:

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
token.approve(hubAddress, amountToRepay);
```

#### Repay Tokens

Finally, call the `repay` function on the Spoke contract, specifying the reserve ID, amount, and the user address.

```solidity title="Repay Specific Amount"
spoke.repay(
  reserveId,
  amountToRepay,
  msg.sender
);
```

```solidity title="Repay Maximum Amount"
spoke.repay(
  reserveId,
  type(uint256).max, // Repay the full debt amount
  msg.sender
);
```

#### Complete Example

Here's a complete example that executes the full repay flow:

```solidity title="Complete Repay Flow"
import { ISpoke } from "aave-v4/src/spoke/interfaces/ISpoke.sol";
import { IERC20 } from "aave-v4/src/dependencies/openzeppelin/IERC20.sol";

function repayDebt(
  address spokeAddress,
  uint256 reserveId,
  uint256 amountToRepay,
  address onBehalfOf
) external {
  ISpoke spoke = ISpoke(spokeAddress);

  // Step 1: Get reserve to retrieve hub address
  ISpoke.Reserve memory reserve = spoke.getReserve(reserveId);
  address hubAddress = address(reserve.hub);

  // Step 2: Approve hub to transfer tokens
  IERC20 token = IERC20(reserve.underlying);
  token.approve(hubAddress, amountToRepay);

  // Step 3: Repay debt
  spoke.repay(reserveId, amountToRepay, onBehalfOf);
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
  repay: {
    sender: evmAddress("0x123…"), // User's address
    reserve: borrowPosition.reserve.id,
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

When the Reserve's underlying token is the wrapped version of the chain's native token (e.g., WETH on Ethereum), you can repay the debt using the chain's native token with the Native Token Gateway.

Use the `reserve.asset.underlying.isWrappedNativeToken` flag to determine if the underlying token is a wrapped native token. The Native Gateway address is available from the chain details.

```ts title="WETH Borrow Position"
const borrowPosition: UserBorrowItem = {
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
  // …
};
```

Specify the amount in the `amount` field as a `native` value.

<tabgroup>
<tab label="React">

```tsx title="Repay Specific Amount"
const execute = async () => {
  const result = await repay({
    sender: evmAddress(wallet.account.address), // User's address
    reserve: borrowPosition.reserve.id,
    amount: {
      native: {
        value: {
          exact: bigDecimal(1), // Repay 1 ETH
        },
      },
    },
  });

  // …
};
```

```tsx title="Repay Maximum Amount"
const execute = async () => {
  const result = await repay({
    sender: evmAddress(wallet.account.address), // User's address
    reserve: borrowPosition.reserve.id,
    amount: {
      native: {
        value: {
          max: true, // Repay the full debt amount
        },
      },
    },
  });

  // …
};
```

</tab>
<tab label="TypeScript">

```ts title="Repay Specific Amount"
const result = await repay(client, {
  sender: evmAddress(wallet.account.address), // User's address
  reserve: borrowPosition.reserve.id,
  amount: {
    native: {
      value: {
        exact: bigDecimal(1), // Repay 1 ETH
      },
    },
  },
});

// …
```

```ts title="Repay Maximum Amount"
const result = await repay(client, {
  sender: evmAddress(wallet.account.address), // User's address
  reserve: borrowPosition.reserve.id,
  amount: {
    native: {
      value: {
        max: true, // Repay the full debt amount
      },
    },
  },
});

// …
```

</tab>
<tab label="GraphQL">

```json title="Repay Specific Amount"
{
  "request": {
    "sender": "0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234",
    "reserve": "SGVsbG8h",
    "amount": {
      "native": {
        "value": {
          "exact": "1"
        }
      }
    }
  }
}
```

```json title="Repay Maximum Amount"
{
  "request": {
    "sender": "0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234",
    "reserve": "SGVsbG8h",
    "amount": {
      "native": {
        "value": {
          "max": true
        }
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

Follow the steps below to repay debt with native tokens (e.g., ETH) for a wrapped native token reserve (e.g., WETH).

#### Approve the Gateway

First, approve the Native Token Gateway as your position manager. This is a one-time setup step.

```solidity title="Approve Gateway"
import { ISpoke } from "aave-v4/src/spoke/interfaces/ISpoke.sol";

ISpoke spoke = ISpoke(spokeAddress);
spoke.setUserPositionManager(nativeGateway, true);
```

#### Repay Native Tokens

Then, call `repayNative` on the gateway, sending the native token amount via `msg.value`.

```solidity title="Repay Specific Amount"
import { INativeTokenGateway } from "aave-v4/src/position-manager/interfaces/INativeTokenGateway.sol";

INativeTokenGateway gateway = INativeTokenGateway(nativeGateway);
gateway.repayNative{value: amountToRepay}(reserveId, amountToRepay);
```

```solidity title="Repay Full Debt"
import { INativeTokenGateway } from "aave-v4/src/position-manager/interfaces/INativeTokenGateway.sol";

INativeTokenGateway gateway = INativeTokenGateway(nativeGateway);
uint256 debtAmount = spoke.getUserTotalDebt(reserveId, msg.sender);
gateway.repayNative{value: debtAmount}(reserveId, type(uint256).max);
```

The gateway wraps the native token (ETH → WETH), approves the hub, and calls `spoke.repay` on your behalf. When repaying the full debt with `type(uint256).max`, any excess funds are returned to you.

#### Complete Example

Here's a complete example that executes the native token repay flow:

```solidity title="Complete Native Repay Flow"
import { ISpoke } from "aave-v4/src/spoke/interfaces/ISpoke.sol";
import { INativeTokenGateway } from "aave-v4/src/position-manager/interfaces/INativeTokenGateway.sol";

function repayNativeToken(
  address spokeAddress,
  address nativeGateway,
  uint256 reserveId,
  uint256 amountToRepay
) external payable {
  require(msg.value == amountToRepay, "Incorrect ETH amount");

  ISpoke spoke = ISpoke(spokeAddress);

  // Step 1: Approve gateway as position manager (one-time setup)
  if (!spoke.isPositionManager(msg.sender, nativeGateway)) {
    spoke.setUserPositionManager(nativeGateway, true);
  }

  // Step 2: Repay native tokens via gateway
  INativeTokenGateway gateway = INativeTokenGateway(nativeGateway);
  gateway.repayNative{value: amountToRepay}(reserveId, amountToRepay);
}
```

</tab>
</tabgroup>

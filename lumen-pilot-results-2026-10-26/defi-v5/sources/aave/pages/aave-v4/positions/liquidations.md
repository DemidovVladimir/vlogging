# Liquidations

Learn how liquidations work in Aave v4.

---

Liquidate unhealthy positions to earn liquidation bonuses and help maintain protocol stability.

## Identify Target Position

First, identify a position with a health factor below 1.0 that is eligible for liquidation.

```ts title="User Position"
const position: UserPosition = {
  __typename: "UserPosition",
  id: "aGVsbG8",
  user: "0x456…",
  healthFactor: {
    value: BigDecimal(0.85), // Below 1.0 - eligible for liquidation
    // …
  },
  spoke: {
    address: "0x123…",
    chain: {
      chainId: 1,
      name: "Ethereum",
    },
    // …
  },
  // …
};
```

> [!NOTE]
> It's not in the scope of this guide to explain how to find positions with a
> health factor below 1.0 and identify unhealthy positions. See [Health
> Factor](../positions#health-factor) for more details.

## Select Liquidation Targets

To liquidate a position, we need to choose two things: which **debt** to repay and which **collateral** to receive as liquidation bonus.

> [!NOTE]
> When choosing positions to liquidate, ensure liquidation bonuses exceed gas
> costs.

### Choose the Debt Position

First, identify which debt position to target by looking at the user's borrow positions. Consider targeting debts with larger amounts.

Fetch borrow positions from [User Borrows](./fetch#user-borrows-fetching-user-borrows), then pick the specific position you want to liquidate:

```ts title="Borrow Position"
const debtPosition: UserBorrowItem = {
  reserve: {
    id: "SGVsbG8h",
    onChainId: "42",
    asset: {
      underlying: { symbol: "WETH", name: "Wrapped Ether" },
    },
    // …
  },
  debt: {
    amount: {
      value: BigDecimal(0.5),
    },
    exchange: {
      value: BigDecimal(2000),
      // …
    },
    // …
  },
  // …
};
```

> [!WARNING]
> If the remaining debt in the target reserve after liquidation is less than
> $1,000 USD, you must liquidate the entire debt in that reserve.

### Choose the Collateral Position

Next, identify which collateral position to target by examining the user's supply positions that are enabled as collateral. Only supplies with `isCollateral: true` can be targeted for liquidation.

Choose collateral in the token you prefer to receive as your liquidation bonus by fetching the supply positions from [User Supplies](./fetch#user-supplies-fetching-user-supplies):

```ts title="Supply Position"
const collateral: UserSupplyItem = {
  reserve: {
    id: "V29ybGQ=",
    onChainId: "43",
    asset: {
      underlying: { symbol: "USDC", name: "USD Coin" },
    },
    // …
  },
  isCollateral: true, // Can be liquidated
  withdrawable: {
    amount: {
      value: BigDecimal(2000),
      // …
    },
    // …
  },
  // …
};
```

> [!WARNING]
> In Aave v4, liquidation bonuses follow a Dutch auction where lower health
> factors result in higher liquidation bonuses.

## Liquidate the Position

After selecting the debt and collateral reserves, choose the repayment amount. You can send an exact value or let the protocol determine the needed amount by using max, restoring the position to a healthy state (HF ≥ 1.0).

<tabgroup>
<tab label="React">

To liquidate an unhealthy position with AaveKit React, follow these steps:

### Configure Wallet Integration

First, instantiate the `useSendTransaction` hook for the [wallet library of your choice](../getting-started/react#integrations). This wallet will pay the debt tokens and receive the seized collateral.

```tsx title="Viem"
import { useWalletClient } from "wagmi";
import { useSendTransaction } from "@aave/react/viem";

// …

const { data: wallet } = useWalletClient();
const [sendTransaction] = useSendTransaction(wallet);
```

### Implement the Liquidation Operation

Then, use the `useLiquidatePosition` hook to prepare the liquidation operation.

```tsx title="Basic Usage"
import { useLiquidatePosition } from "@aave/react";

const [liquidatePosition, { loading, error }] = useLiquidatePosition(
  (plan, { cancel }) => {
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
  },
);
```

```tsx title="Update Component State"
import { useLiquidatePosition } from "@aave/react";

const [status, setStatus] = useState("");

const [liquidatePosition, { loading, error }] = useLiquidatePosition(
  (plan, { cancel }) => {
    switch (plan.__typename) {
      case "TransactionRequest":
        setStatus("Please sign the Liquidation transaction in your wallet");
        return sendTransaction(plan).andTee(() => setStatus("Liquidating…"));

      case "Erc20Approval":
        if (plan.bySignature) {
          setStatus("Please sign the Permit in your wallet");
          return signTypedData(plan.bySignature).andTee(() =>
            setStatus("Approving…"),
          );
        }
        setStatus("Please sign the Approval transaction in your wallet");
        return sendTransaction(plan.byTransaction).andTee(() =>
          setStatus("Approving…"),
        );

      case "PreContractActionRequired":
        setStatus(
          "Please sign the Pre-Contract Action transaction in your wallet",
        );
        return sendTransaction(plan.transaction);
    }
  },
);
```

```tsx title="Cancel Flow"
import { useLiquidatePosition } from "@aave/react";

const [liquidatePosition, { loading, error }] = useLiquidatePosition(
  (plan, { cancel }) => {
    if (
      window.confirm("Are you sure you want to liquidate this position?") ===
      false
    ) {
      return cancel("User cancelled the liquidation");
    }

    switch (plan.__typename) {
      case "TransactionRequest":
        return sendTransaction(plan);

      case "Erc20Approval":
        if (plan.bySignature) {
          return signTypedData(plan.bySignature);
        }
        return sendTransaction(plan.byTransaction);

      case "PreContractActionRequired":
        return sendTransaction(plan.transaction);
    }
  },
);
```

In the `Erc20Approval` case, the `bySignature` field is only available if the token supports EIP-2612 permits.

> [!NOTE]
> For tokens like [USDT on Ethereum
> Mainnet](https://etherscan.io/token/0xdac17f958d2ee523a2206206994597c13d831ec7)
> that require an allowance reset, the hook calls your callback twice: once to
> reset the allowance to 0, then again to set the new value. `bySignature` will
> be `null` for these approvals.

### Execute the Liquidation

Then, execute the liquidation operation. Specify an exact debt amount to cover, or use `amount: { max: true }` to bring the position back to a healthy state.

```tsx title="Liquidate Specific Amount"
import {
  bigDecimal,
  evmAddress,
  type UserBorrowItem,
  type UserPosition,
  type UserSupplyItem,
} from "@aave/react";

const execute = async (
  position: UserPosition,
  debt: UserBorrowItem,
  collateral: UserSupplyItem,
) => {
  const result = await liquidatePosition({
    collateral: collateral.reserve.id,
    debt: debt.reserve.id,
    amount: {
      exact: { value: bigDecimal("1000") }, // 1000 USDC
    },
    liquidator: evmAddress(wallet.account.address), // User's address
    user: position.user,
  });

  // …
};
```

```tsx title="Liquidate Maximum Amount"
import {
  evmAddress,
  type UserPosition,
  type UserBorrowItem,
  type UserSupplyItem,
} from "@aave/react";

const execute = async (
  position: UserPosition,
  debt: UserBorrowItem,
  collateral: UserSupplyItem,
) => {
  const result = await liquidatePosition({
    collateral: collateral.reserve.id,
    debt: debt.reserve.id,
    amount: {
      max: true,
    },
    liquidator: evmAddress(wallet.account.address), // User's address
    user: position.user,
  });

  // …
};
```

### Handle the Result

Finally, handle the result.

```tsx title="Example"
const execute = async (/* … */) => {
  const result = await liquidatePosition(/* … */);

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

  console.log("Liquidation successful with hash:", result.value.txHash);
};
```

</tab>
<tab label="TypeScript">

To liquidate an unhealthy position with AaveKit TypeScript, follow these steps.

### Create the Liquidation Request

First, use the `liquidatePosition` action to create the transaction request for liquidating the unhealthy position. Specify an exact debt amount to cover, or use `amount: { max: true }` to bring the position back to a healthy state.

```ts title="Liquidate Specific Amount"
import { liquidatePosition } from "@aave/client/actions";
import { bigDecimal, evmAddress } from "@aave/client";

import { client } from "./client";

const result = await liquidatePosition(client, {
  collateral: collateralReserve.id,
  debt: debtReserve.id,
  amount: {
    exact: { value: bigDecimal("1000") }, // 1000 USDC
  },
  liquidator: evmAddress(wallet.account.address),
  user: userPosition.user,
});

// …
```

```ts title="Liquidate Maximum Amount"
import { liquidatePosition } from "@aave/client/actions";
import { evmAddress } from "@aave/client";

import { client } from "./client";

const result = await liquidatePosition(client, {
  collateral: collateralReserve.id,
  debt: debtReserve.id,
  amount: { max: true },
  liquidator: evmAddress(wallet.account.address),
  user: userPosition.user,
});

// …
```

```ts title="client.ts"
import { AaveClient } from "@aave/client";

export const client = AaveClient.create();
```

To handle ERC-20 permit-based approval, wrap the `liquidatePosition` call with `permitWith` for the [wallet library of your choice](../getting-started/typescript#integrations).

```ts title="Permit-based (Viem)"
import { liquidatePosition } from "@aave/client/actions";
import { permitWith } from "@aave/client/viem";
import { bigDecimal, evmAddress } from "@aave/client";

import { client } from "./client";
import { wallet } from "./wallet";

const result = await permitWith(wallet, (permitSig) =>
  liquidatePosition(client, {
    collateral: collateralReserve.id,
    debt: debtReserve.id,
    amount: {
      exact: { value: bigDecimal("1000"), permitSig },
    },
    liquidator: evmAddress(wallet.account.address),
    user: userPosition.user,
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

1. Calls the `liquidatePosition` action without a permit signature
2. If the response is `Erc20ApprovalRequired` with permit signature available, signs the permit and calls `liquidatePosition` again with the signature to get an updated execution plan
3. Otherwise, returns the execution plan unchanged (no permit needed or token doesn't support permits)

> [!TIP]
> For tokens like [USDT on Ethereum
> Mainnet](https://etherscan.io/token/0xdac17f958d2ee523a2206206994597c13d831ec7)
> that require an allowance reset, `permitWith` skips the permit step and passes
> the execution plan to the next step, which handles both approvals.

### Process the Execution Plan

Then, use `sendWith` for the [wallet library of your choice](../getting-started/typescript#integrations) to send the transactions in the execution plan, and await indexing with `client.waitForTransaction`. This wallet will pay the debt tokens and receive the seized collateral.

```ts title="Transaction-based"
import { liquidatePosition } from "@aave/client/actions";
import { sendWith } from "@aave/client/viem";

import { client } from "./client";
import { wallet } from "./wallet";

const result = await liquidatePosition(client, {
  // …
})
  .andThen(sendWith(wallet))
  .andThen(client.waitForTransaction);
```

```ts title="Permit-based"
import { liquidatePosition } from "@aave/client/actions";
import { permitWith, sendWith } from "@aave/client/viem";

import { client } from "./client";
import { wallet } from "./wallet";

const result = await permitWith(wallet, (permitSig) =>
  liquidatePosition(client, {
    collateral: collateralReserve.id,
    debt: debtReserve.id,
    amount: {
      exact: { value: bigDecimal("1000"), permitSig },
    },
    liquidator: evmAddress(wallet.account.address),
    user: userPosition.user,
  }),
)
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

> [!NOTE]
> The `sendWith` helper automatically processes all required approvals,
> including reset flows for tokens like USDT that require setting allowance to 0
> before setting a new value.

### Handle the Result

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
  console.log("Liquidation successful with hash:", result.value.txHash);
}
```

</tab>
<tab label="GraphQL">

To liquidate an unhealthy position with AaveKit API, follow these steps.

### Prepare the Execution Plan

First, use the `liquidatePosition` query to prepare the liquidation execution plan.

```graphql title="Query"
query ($request: LiquidatePositionRequest!) {
  liquidatePosition(request: $request) {
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

Below is an example of a `LiquidatePositionRequest` object.

```json title="Liquidate Specific Amount"
{
  "request": {
    "collateral": "V29ybGQ=",
    "debt": "SGVsbG8h",
    "amount": {
      "exact": {
        "value": "1000"
      }
    },
    "liquidator": "0x789…",
    "user": "0x456…"
  }
}
```

```json title="Liquidate Maximum Amount"
{
  "request": {
    "collateral": "V29ybGQ=",
    "debt": "SGVsbG8h",
    "amount": {
      "max": true
    },
    "liquidator": "0x789…",
    "user": "0x456…",
    "receiveShares": true // optional: if you want to receive shares over the asset
  }
}
```

```json title="Permit-based Approval"
{
  "request": {
    "collateral": "V29ybGQ=",
    "debt": "SGVsbG8h",
    "amount": {
      "exact": {
        "value": "1000",
        "permitSig": {
          "deadline": 1700000000,
          "value": "0xabcdef…"
        }
      }
    },
    "liquidator": "0x789…",
    "user": "0x456…"
  }
}
```

### Process the Execution Plan

Then, if the response is a `TransactionRequest`, you can send it directly using the wallet associated with the from address.

```json title="TransactionRequest"
{
  "data": {
    "liquidatePosition": {
      "__typename": "TransactionRequest",
      "to": "0x123…",
      "from": "0x789…",
      "data": "0x00a718a9000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2…",
      "value": "0",
      "chainId": 1,
      "operations": ["SPOKE_LIQUIDATE_POSITION"]
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
2. Call the `liquidatePosition` query again with the permit signature
3. The response will be a `TransactionRequest` you can then send directly

```json title="Single Approval"
{
  "data": {
    "liquidatePosition": {
      "__typename": "Erc20ApprovalRequired",
      "reason": "Insufficient allowance for ERC-20 token transfer",
      "requiredAmount": {
        "value": "1000.000000",
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
            "from": "0x789…",
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
        "to": "0x123…",
        "from": "0x789…",
        "data": "0x00a718a9000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2…",
        "value": "0",
        "chainId": 1,
        "operations": ["SPOKE_LIQUIDATE_POSITION"]
      }
    }
  }
}
```

```json title="Multiple Approvals (USDT-like)"
{
  "data": {
    "liquidatePosition": {
      "__typename": "Erc20ApprovalRequired",
      "reason": "Token requires allowance reset before new approval",
      "requiredAmount": {
        "value": "1000.000000",
        "decimals": 6
      },
      "currentAllowance": {
        "value": "500.000000",
        "decimals": 6
      },
      "approvals": [
        {
          "byTransaction": {
            "to": "0xdAC17F958D2ee523a2206206994597C13D831ec7",
            "from": "0x789…",
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
            "from": "0x789…",
            "data": "0x095ea7b3000000000000000000000000878…1000",
            "value": "0",
            "chainId": 1,
            "operations": null
          },
          "bySignature": null
        }
      ],
      "originalTransaction": {
        "to": "0x123…",
        "from": "0x789…",
        "data": "0x00a718a9000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2…",
        "value": "0",
        "chainId": 1,
        "operations": ["SPOKE_LIQUIDATE_POSITION"]
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

If the response is an `InsufficientBalanceError`, inform the user that they don't have enough funds to perform the liquidation.

```json title="InsufficientBalanceError"
{
  "data": {
    "liquidatePosition": {
      "__typename": "InsufficientBalanceError",
      "required": {
        "value": "1000.000000",
        "decimals": 6
      },
      "available": {
        "value": "500.000000",
        "decimals": 6
      }
    }
  }
}
```

</tab>
<tab label="Solidity">

With the spoke address and target user identifying the position:

```solidity title="Target User Position"
address spokeAddress = 0x123…;
uint256 debtReserveId = 42;
```

And with the on-chain reserve IDs for the collateral and debt:

```solidity title="Target Reserves"
uint256 collateralReserveId = 43;
address targetUser = 0x456…;
```

Choose the amount of debt to cover:

```solidity title="Liquidate Specific Amount"
uint256 debtToCover = 1000e6; // 1000 USDC
```

```solidity title="Liquidate Maximum Amount"
uint256 debtToCover = type(uint256).max;
```

And follow these steps to liquidate the position onchain:

### Import the Spoke Interface

First, create an instance of the `ISpoke` interface.

```solidity title="Import the Spoke Interface"
import { ISpoke } from "aave-v4/src/spoke/interfaces/ISpoke.sol";

ISpoke spoke = ISpoke(spokeAddress);
```

### Approve Token Transfer

Then, retrieve the debt reserve to get the hub address and approve the hub to transfer the debt tokens.

```solidity title="Retrieve Reserve and Approve"
ISpoke.Reserve memory debtReserve = spoke.getReserve(debtReserveId);
address hubAddress = address(debtReserve.hub);

import { IERC20 } from "aave-v4/src/dependencies/openzeppelin/IERC20.sol";
IERC20 token = IERC20(debtReserve.underlying);
token.approve(hubAddress, debtToCover);
```

### Execute Liquidation

Finally, call the `liquidationCall` function on the Spoke contract, specifying the liquidation parameters.

```solidity title="Liquidate Position"
spoke.liquidationCall(
  collateralReserveId,
  debtReserveId,
  targetUser,
  debtToCover
);
```

### Complete Example

Here are complete examples for checking position health and executing liquidation:

```solidity title="Check Position Health"
import { ISpoke } from "aave-v4/src/spoke/interfaces/ISpoke.sol";

function canLiquidate(
  address spokeAddress,
  address user
) external view returns (bool, uint256 healthFactor) {
  ISpoke spoke = ISpoke(spokeAddress);
  ISpoke.UserAccountData memory accountData = spoke.getUserAccountData(user);

  healthFactor = accountData.healthFactor;

  if (accountData.totalDebtValue == 0) {
    return (false, type(uint256).max);
  }

  return (healthFactor < 1e18, healthFactor);
}
```

```solidity title="Execute Liquidation"
import { ISpoke } from "aave-v4/src/spoke/interfaces/ISpoke.sol";
import { IERC20 } from "aave-v4/src/dependencies/openzeppelin/IERC20.sol";

function liquidatePosition(
  address spokeAddress,
  uint256 collateralReserveId,
  uint256 debtReserveId,
  address user,
  uint256 debtToCover
) external {
  ISpoke spoke = ISpoke(spokeAddress);

  ISpoke.Reserve memory debtReserve = spoke.getReserve(debtReserveId);
  address hubAddress = address(debtReserve.hub);

  IERC20 debtToken = IERC20(debtReserve.underlying);
  debtToken.approve(hubAddress, debtToCover);

  spoke.liquidationCall(
    collateralReserveId,
    debtReserveId,
    user,
    debtToCover
  );
}
```

</tab>
</tabgroup>

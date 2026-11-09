# Market Operations

Execute the fundamental lending and borrowing operations on Aave markets. This section covers supply, borrow, repay, and withdraw functionality.

## Permit Overview

Some Aave operations support **permit functionality** using [EIP-2612](https://eips.ethereum.org/EIPS/eip-2612) signatures to authorize ERC-20 token transfers within the same transaction.

### Benefits of Permit

- **Single Transaction**: Execute operations without separate approval transactions
- **Exact Amounts**: Sign permissions for specific amounts instead of infinite approvals
- **Time Limited**: Permits have deadlines for enhanced security

> [!NOTE]
> Permit is available for ERC-20 tokens that implement
> [EIP-2612](https://eips.ethereum.org/EIPS/eip-2612).

## Supply Assets

By supplying assets to an Aave market, users earn interest on their deposits according to the reserve's supply APY rate.

When supplying assets to an Aave market, you can use the following methods:

| Method                                    | Description                                                                                                   | Typical Scenario                                                                     |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| **Direct Supply**                         | Supply ERC-20 or native tokens directly from the sender’s wallet. _aTokens_ are sent to the sender’s address. | User deposits assets into their own wallet.                                          |
| **On Behalf of Another**                  | Supply from the sender’s wallet, but send _aTokens_ to another address.                                       | User deposits assets from one wallet and borrow position is owned by another wallet. |
| **With Permit**                           | Use a permit signature to skip ERC-20 approval and supply in a single transaction.                            | User signs a permit and sends a single transaction. No ERC-20 allowance left behind. |
| **With Permit<br />On Behalf of Another** | Same as permit supply, but _aTokens_ are sent to another address.                                             | No ERC-20 allowance needed and borrow position is owned by another wallet.           |

To supply assets to an Aave market, follow these steps.

### Identify the Reserve

First, determine which reserve you want to supply assets to.

Let's say we choose the WETH supply reserve within one of the Ethereum markets.

```ts title="Reserve"
const reserve: Reserve = {
  __typename: "Reserve",
  market: {
    __typename: "Market",
    address: "0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2",
    chainId: 1,
    // …
  },
  underlyingToken: {
    __typename: "Currency",
    symbol: "WETH",
    name: "Wrapped Ether",
    address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    // …
  },
  acceptsNative: {
    __typename: "NativeCurrency",
    symbol: "ETH",
    name: "Ethereum",
    // …
  },
  isFrozen: false,
  isPaused: false,
  permitSupported: true,
  userState: {
    __typename: "ReserveUserState",
    suppliable: {
      __typename: "TokenAmount",
      amount: {
        __typename: "DecimalValue",
        value: "1245.67",
        raw: "1245670000000000000000",
        decimals: 18,
        // …
      },
      // …
    },
  },
  // …
};
```

To supply to the reserve, you need to verify these conditions:

- `Reserve.isFrozen` is `false` - the reserve is not frozen
- `Reserve.isPaused` is `false` - the reserve is not paused
- `Reserve.userState.suppliable.amount.value` is _greater than 0_ - the amount the user can supply to the reserve given their unique circumstances

> [!WARNING]
> Make sure you include a user address when fetching market and reserve
> data—otherwise `Reserve.userState` will be empty.

The `Reserve.permitSupported` flag indicates whether the underlying token supports EIP-2612 permits.

Additionally, if `Reserve.acceptsNative` is not `null`, users can choose to supply the asset as the chain's native token and it will be automatically wrapped before being sent to the reserve. This is typical for reserves of the wrapped version of the chain's native token (e.g., WETH on Ethereum).

### Prepare the Execution Plan

Next, if all of these conditions are met, we can proceed with creating the execution plan for the supply operation.

<tabgroup>
<tab label="React">

Use the `useSupply` hook to prepare supply transactions, optionally on behalf of another address.

```tsx title="Direct ERC-20 Supply"
import { useWalletClient } from "wagmi";
import { useSupply, bigDecimal, evmAddress } from "@aave/react";

// …

const { data: walletClient } = useWalletClient();

const [supply, supplying] = useSupply();

const execute = async () => {
  const result = await supply({
    market: reserve.market.address,
    amount: {
      erc20: {
        currency: reserve.underlyingToken.address,
        value: bigDecimal(42), // 42 WETH
      },
    },
    sender: evmAddress(walletClient!.account.address),
    chainId: reserve.market.chain.chainId,
  });

  // …
};
```

```tsx title="Direct Native Supply"
import { useWalletClient } from "wagmi";
import { useSupply, bigDecimal, evmAddress } from "@aave/react";

// …

const { data: walletClient } = useWalletClient();

const [supply, supplying] = useSupply();

const execute = async () => {
  const result = await supply({
    market: reserve.market.address,
    amount: {
      native: bigDecimal(42), // 42 ETH
    },
    sender: evmAddress(walletClient!.account.address),
    chainId: reserve.market.chain.chainId,
  });

  // …
};
```

```tsx title="Supply on Behalf of Another"
import { useWalletClient } from "wagmi";
import { useSupply, bigDecimal, evmAddress } from "@aave/react";

// …

const { data: walletClient } = useWalletClient();

const [supply, supplying] = useSupply();

const execute = async () => {
  const result = await supply({
    market: reserve.market.address,
    amount: {
      erc20: {
        currency: reserve.underlyingToken.address,
        value: bigDecimal(42), // 42 WETH
      },
      // OR
      // native: bigDecimal(42), // 42 ETH
    },
    sender: evmAddress(walletClient!.account.address),
    chainId: reserve.market.chain.chainId,
    onBehalfOf: evmAddress("0x742d35cc…"),
  });

  // …
};
```

If `Reserve.permitSupported` is `true` and you supply ERC-20 tokens, you can use the `useSupply` and `useERC20Permit` hooks to sign permits and prepare supply transactions. Use the `useERC20Permit` implementation for the [wallet library of choice](../getting-started/react#integrations-sign-erc-20-permits).

```tsx title="Supply ERC-20 with Permit"
import { useSupply, bigDecimal, evmAddress } from "@aave/react";
import { useERC20Permit } from "@aave/react/viem";
import { useWalletClient } from "wagmi";

// …

const { data: walletClient } = useWalletClient();

const [signPermit, signing] = useERC20Permit(walletClient);
const [supply, supplying] = useSupply();

const execute = async () => {
  const amount = bigDecimal(42); // 42 WETH

  const permit = await signPermit({
    amount,
    chainId: reserve.market.chain.chainId,
    currency: reserve.underlyingToken.address,
    owner: evmAddress(walletClient!.account.address),
    spender: reserve.market.address,
  }).andThen((signature) =>
    supply({
      market: reserve.market.address,
      amount: {
        erc20: {
          currency: reserve.underlyingToken.address,
          value: amount, // 42 WETH
          permitSig: signature,
        },
      },
      sender: evmAddress(walletClient!.account.address),
      chainId: reserve.market.chain.chainId,
    })
  );

  // …
};
```

```tsx title="Supply ERC-20 with Permit On Behalf of Another"
import { useSupply, bigDecimal, evmAddress } from "@aave/react";
import { useERC20Permit } from "@aave/react/viem";
import { useWalletClient } from "wagmi";

// …

const { data: walletClient } = useWalletClient();

const [signPermit, signing] = useERC20Permit(walletClient);
const [supply, supplying] = useSupply();

const execute = async () => {
  const amount = bigDecimal(42); // 42 WETH

  const permit = await signPermit({
    amount,
    chainId: reserve.market.chain.chainId,
    currency: reserve.underlyingToken.address,
    owner: evmAddress(walletClient!.account.address),
    spender: reserve.market.address,
  }).andThen((signature) =>
    supply({
      market: reserve.market.address,
      amount: {
        erc20: {
          currency: reserve.underlyingToken.address,
          value: amount, // 42 WETH
          permitSig: signature,
        },
      },
      sender: evmAddress(walletClient!.account.address),
      chainId: reserve.market.chain.chainId,
      onBehalfOf: evmAddress("0x742d35cc…"),
    })
  );

  // …
};
```

</tab>
<tab label="TypeScript">

Use the `supply` action to prepare supply transactions, optionally on behalf of another address.

```ts title="Direct ERC-20 Supply"
import { supply } from "@aave/client/actions";
import { bigDecimal, evmAddress } from "@aave/client";

import { client } from "./client";
import { wallet } from "./wallet";

const result = await supply(client, {
  market: reserve.market.address,
  amount: {
    erc20: {
      currency: reserve.underlyingToken.address,
      value: bigDecimal(42), // 42 WETH
    },
  },
  sender: evmAddress(wallet.account.address),
  chainId: reserve.market.chain.chainId,
});

// …
```

```ts title="Direct Native Supply"
import { supply } from "@aave/client/actions";
import { bigDecimal, evmAddress } from "@aave/client";

import { client } from "./client";
import { wallet } from "./wallet";

const result = await supply(client, {
  market: reserve.market.address,
  amount: {
    native: bigDecimal(42), // 42 ETH
  },
  sender: evmAddress(wallet.account.address),
  chainId: reserve.market.chain.chainId,
});

// …
```

```ts title="Supply on Behalf of Another"
import { supply } from "@aave/client/actions";
import { bigDecimal, evmAddress } from "@aave/client";

import { client } from "./client";
import { wallet } from "./wallet";

const result = await supply(client, {
  market: reserve.market.address,
  amount: {
    erc20: {
      currency: reserve.underlyingToken.address,
      value: bigDecimal(42), // 42 WETH
    },
    // OR
    // native: bigDecimal(42), // 42 ETH
  },
  sender: evmAddress(wallet.account.address),
  chainId: reserve.market.chain.chainId,
  onBehalfOf: evmAddress("0x742d35cc…"),
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

If `Reserve.permitSupported` is `true` and you supply ERC-20 tokens, you can use the `supply` and `permitTypedData` actions together with the `signERC20PermitWith` helper to sign permits and prepare supply transactions. Use the `signERC20PermitWith` implementation for the [wallet library of choice](../getting-started/typescript#integrations-sign-erc-20-permits).

```tsx title="Supply ERC-20 with Permit"
import { supply, permitTypedData } from "@aave/client/actions";
import { signERC20PermitWith } from "@aave/client/viem";
import { bigDecimal, evmAddress } from "@aave/client";

import { client } from "./client";
import { wallet } from "./wallet";

const amount = bigDecimal(42); // 42 WETH

const result = await permitTypedData(client, {
  amount,
  chainId: reserve.market.chain.chainId,
  currency: reserve.underlyingToken.address,
  owner: evmAddress(wallet.account.address),
  spender: reserve.market.address,
})
  .andThen(signERC20PermitWith(wallet))
  .andThen((signature) =>
    supply(client, {
      market: reserve.market.address,
      amount: {
        erc20: {
          currency: reserve.underlyingToken.address,
          value: amount,
          permitSig: signature,
        },
      },
      sender: evmAddress(wallet.account.address),
      chainId: reserve.market.chain.chainId,
    })
  );

// …
```

```tsx title="Supply ERC-20 with Permit On Behalf of Another"
import { supply, permitTypedData } from "@aave/client/actions";
import { signERC20PermitWith } from "@aave/client/viem";
import { bigDecimal, evmAddress } from "@aave/client";

import { client } from "./client";
import { wallet } from "./wallet";

const amount = bigDecimal(42); // 42 WETH

const result = await permitTypedData(client, {
  amount,
  chainId: reserve.market.chain.chainId,
  currency: reserve.underlyingToken.address,
  owner: evmAddress(wallet.account.address),
  spender: reserve.market.address,
})
  .andThen(signERC20PermitWith(wallet))
  .andThen((signature) =>
    supply(client, {
      market: reserve.market.address,
      amount: {
        erc20: {
          currency: reserve.underlyingToken.address,
          value: amount,
          permitSig: signature,
        },
      },
      sender: evmAddress(wallet.account.address),
      chainId: reserve.market.chain.chainId,
      onBehalfOf: evmAddress("0x742d35cc…"),
    })
  );

// …
```

</tab>
<tab label="GraphQL">

Use the `supply` query to create the execution plan for supplying assets to a market reserve.

```graphql title="Query"
query {
  supply(
    request: {
      market: "0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2"
      amount: {
        erc20: {
          currency: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
          value: "42"
        }
        # OR
        # native: "42" # if the reserve accepts native currency
      }
      sender: "0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234"
      chainId: 1
    }
  ) {
    __typename
    ... on TransactionRequest {
      to
      from
      data
      value
      chainId
      operation
    }
    ... on ApprovalRequired {
      reason
      requiredAmount {
        value
        decimals
      }
      currentAllowance {
        value
        decimals
      }
      approval {
        to
        from
        data
        value
        chainId
        operation
      }
      originalTransaction {
        to
        from
        data
        value
        chainId
        operation
      }
    }
    ... on InsufficientBalanceError {
      required {
        value
        decimals
      }
      available {
        value
        decimals
      }
    }
  }
}
```

</tab>
</tabgroup>
### Process the Execution Plan

Finally, you need to handle the execution plan, and the process is the same whether or not you used a permit in the previous step.

> [!NOTE]
> If you provided a permit signature, the execution plan will run as a single
> transaction.

<tabgroup>
<tab label="React">

Use the `useSendTransaction` hook for the [wallet library of your choice](../getting-started/react#integrations-send-aave-transactions) to send the transactions in the execution plan.

```tsx title="Viem"
import { useWalletClient } from "wagmi";
import { errAsync, useSupply } from "@aave/react";
import { useSendTransaction } from "@aave/react/viem";

// …

const { data: walletClient } = useWalletClient();

const [supply, supplying] = useSupply();
const [sendTransaction, sending] = useSendTransaction(walletClient);

// …

// Optional: combine loading states
const loading = supplying.loading || sending.loading;
const error = supplying.error || sending.error;

// …

const execute = async () => {
  const result = await supply({
    // …
  }).andThen((plan) => {
    switch (plan.__typename) {
      case "TransactionRequest":
        // Single transaction execution
        return sendTransaction(plan);

      case "ApprovalRequired":
        // Approval + transaction sequence
        return sendTransaction(plan.approval).andThen(() =>
          sendTransaction(plan.originalTransaction)
        );

      case "InsufficientBalanceError":
        return errAsync(
          new Error(`Insufficient balance: ${plan.required.value} required.`)
        );
    }
  });

  if (result.isErr()) {
    console.error("Supply failed:", result.error);
  } else {
    console.log("Supply successful with hash:", result.value);
  }
};
```

</tab>
<tab label="TypeScript">

Use `sendWith` for your [chosen wallet library](../getting-started/typescript#integrations-send-aave-transactions) to send the transactions in the execution plan, and await indexing with `client.waitForTransaction`.

```ts title="Viem"
import { supply } from "@aave/client/actions";
import { sendWith } from "@aave/client/viem";

import { client } from "./client";
import { wallet } from "./wallet";

const result = await supply(client, {
  // …
})
  .andThen(sendWith(wallet))
  .andThen(client.waitForTransaction);

if (result.isErr()) {
  console.error("Supply failed:", result.error);
} else {
  console.log("Supply successful:", result.value);
}
```

</tab>
<tab label="GraphQL">

If the response is a TransactionRequest, you can send it directly using the wallet associated with the from address.

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
      "operation": "SUPPLY"
    }
  }
}
```

If the response is an `ApprovalRequired`, you must first send the `approval` transaction. Once it succeeds, you can then send the `originalTransaction`.

```json title="ApprovalRequired"
{
  "data": {
    "supply": {
      "__typename": "ApprovalRequired",
      "reason": "Insufficient allowance for ERC-20 token transfer",
      "requiredAmount": {
        "value": "42.0",
        "decimals": 18
      },
      "currentAllowance": {
        "value": "0.0",
        "decimals": 18
      },
      "approval": {
        "to": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
        "from": "0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234",
        "data": "0x095ea7b3000000000000000000000000878…",
        "value": "0",
        "chainId": 1,
        "operation": null
      },
      "originalTransaction": {
        "to": "0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2",
        "from": "0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234",
        "data": "0x617ba037000000000000000000000000c0…",
        "value": "0",
        "chainId": 1,
        "operation": "SUPPLY"
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
        "value": "42.0",
        "decimals": 18
      },
      "available": {
        "value": "15.5",
        "decimals": 18
      }
    }
  }
}
```

</tab>
</tabgroup>

## Collateral Management

To manage which supplied assets are used as collateral for borrowing, follow these steps.

### Identify the User Position

First, determine which user supply position you want to enable or disable as collateral.

Let's say we identified this `MarketUserReserveSupplyPosition` object.

```ts title="MarketUserReserveSupplyPosition"
const position: MarketUserReserveSupplyPosition = {
  __typename: "MarketUserReserveSupplyPosition",
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
  balance: {
    __typename: "TokenAmount",
    amount: {
      __typename: "DecimalValue",
      value: "5.0",
      raw: "5000000000000000000",
      decimals: 18,
      // …
    },
    // …
  },
  isCollateral: false, // Currently not used as collateral
  canBeCollateral: true, // Can be enabled as collateral
  // …
};
```

To enable a position as collateral, you need to verify these conditions:

- `position.canBeCollateral` is `true` - the asset can be used as collateral
- `position.isCollateral` is `false` - the asset is not currently used as collateral

To disable a position as collateral, you only need to check if `position.isCollateral` is `true`.

> [!NOTE]
> A reserve may be disabled from being used as collateral, pending an Aave DAO
> vote. This prevents new collateral usage of the asset but does not impact
> existing user positions already using it as collateral.

### Prepare the Transaction Request

Next, we can proceed with creating the transaction request for the collateral toggle operation.

<tabgroup>
<tab label="React">

Use the `useCollateralToggle` hook to create the transaction request for enabling or disabling collateral.

```tsx title="Toggle Collateral"
import { useWalletClient } from "wagmi";
import { useCollateralToggle, evmAddress } from "@aave/react";

// …

const { data: walletClient } = useWalletClient();

const [toggleCollateral, toggling] = useCollateralToggle();

const execute = async () => {
  const result = await toggleCollateral({
    market: position.market.address,
    underlyingToken: position.currency.address,
    user: evmAddress(walletClient!.account.address),
    chainId: position.market.chainId,
  });

  // …
};
```

</tab>
<tab label="TypeScript">

Use the `collateralToggle` action to create the transaction request for enabling or disabling collateral.

```ts title="Toggle Collateral"
import { collateralToggle } from "@aave/client/actions";
import { evmAddress } from "@aave/client";

import { client } from "./client";
import { wallet } from "./wallet";

const result = await collateralToggle(client, {
  market: position.market.address,
  underlyingToken: position.currency.address,
  user: evmAddress(wallet.account.address),
  chainId: position.market.chainId,
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

Use the `collateralToggle` query to create the transaction request for enabling or disabling collateral.

```graphql title="Query"
query {
  collateralToggle(
    request: {
      market: "0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2"
      underlyingToken: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
      user: "0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234"
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
import { useCollateralToggle } from "@aave/react";
import { useSendTransaction } from "@aave/react/viem";

// …

const { data: walletClient } = useWalletClient();

const [toggleCollateral, toggling] = useCollateralToggle();
const [sendTransaction, sending] = useSendTransaction(walletClient);

// …

// Optional: combine loading states
const loading = toggling.loading || sending.loading;
const error = toggling.error || sending.error;

// …

const execute = async () => {
  const result = await toggleCollateral({
    // …
  }).andThen(sendTransaction);

  if (result.isErr()) {
    console.error("Collateral toggle failed:", result.error);
  } else {
    console.log("Collateral toggle successful with hash:", result.value);
  }
};
```

</tab>
<tab label="TypeScript">

Use `sendWith` for your [chosen wallet library](../getting-started/typescript#integrations-send-aave-transactions) to initiate the transaction, and await indexing with `client.waitForTransaction`.

```ts title="Viem"
import { collateralToggle } from "@aave/client/actions";
import { sendWith } from "@aave/client/viem";

import { client } from "./client";
import { wallet } from "./wallet";

const result = await collateralToggle(client, {
  // …
})
  .andThen(sendWith(wallet))
  .andThen(client.waitForTransaction);

if (result.isErr()) {
  console.error("Collateral toggle failed:", result.error);
} else {
  console.log("Collateral toggle successful:", result.value);
}
```

</tab>
<tab label="GraphQL">

The response is a TransactionRequest that can be sent directly using the wallet associated with the `from` address.

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
      "operation": "RESERVE_USED_AS_COLLATERAL_ENABLED"
    }
  }
}
```

</tab>
</tabgroup>

## Borrow Assets

Users can borrow assets from Aave markets at the reserve’s borrow APY using supply positions as collateral.

When borrowing assets from an Aave market, you can use the following methods:

| Method                | Description                                                 | Typical Scenario                                                                          |
| --------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| **Direct Borrow**     | Borrow assets from a reserve using supplied collateral      | User borrows from a reserve against their own supplied collateral.                        |
| **Credit Delegation** | Borrow assets from a reserve using delegated borrow credits | User borrows from a reserve using credits from collateral supplied by a credit delegator. |

To borrow assets from an Aave market, follow these steps.

### Identify the Reserve

First, determine which reserve you want to borrow assets from.

Let's say we choose the WETH borrow reserve within one of the Ethereum markets.

```ts title="Reserve"
const reserve: Reserve = {
  __typename: "Reserve",
  market: {
    __typename: "Market",
    address: "0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2",
    chainId: 1,
    // …
  },
  underlyingToken: {
    __typename: "Currency",
    symbol: "WETH",
    name: "Wrapped Ether",
    address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    // …
  },
  acceptsNative: {
    __typename: "NativeCurrency",
    symbol: "ETH",
    name: "Ethereum",
    // …
  },
  isFrozen: false,
  isPaused: false,
  userState: {
    __typename: "ReserveUserState",
    borrowable: {
      __typename: "TokenAmount",
      amount: {
        __typename: "DecimalValue",
        value: "15.75",
        raw: "15750000000000000000",
        decimals: 18,
        // …
      },
      // …
    },
  },
  // …
};
```

To borrow from the reserve, you need to verify these conditions:

- `Reserve.isFrozen` is `false` - the reserve is not frozen
- `Reserve.isPaused` is `false` - the reserve is not paused
- `Reserve.userState.borrowable.amount.value` is _greater than 0_ - the amount the user can borrow from the reserve given their unique circumstances

> [!WARNING]
> Make sure you include a user address when fetching market and reserve
> data—otherwise `Reserve.userState` will be empty.

Additionally, if `Reserve.acceptsNative` is not `null`, users can choose to receive any borrowed assets as the chain's native token and it will be automatically unwrapped before being sent to the user's wallet. This is typical for reserves of the wrapped version of the chain's native token (e.g., WETH on Ethereum).

### Prepare the Execution Plan

Next, if all of these conditions are met, we can proceed with creating the execution plan for the borrow operation.

<tabgroup>
<tab label="React">

Use the `useBorrow` hook to create the execution plan for a direct borrow operation.

```tsx title="Direct ERC-20 Borrow"
import { useWalletClient } from "wagmi";
import { useBorrow, bigDecimal, evmAddress } from "@aave/react";

// …

const { data: walletClient } = useWalletClient();

const [borrow, borrowing] = useBorrow();

const execute = async () => {
  const result = await borrow({
    market: reserve.market.address,
    amount: {
      erc20: {
        currency: reserve.underlyingToken.address,
        value: bigDecimal(2), // 2 WETH
      },
    },
    sender: evmAddress(walletClient!.account.address),
    chainId: reserve.market.chain.chainId,
  });

  // …
};
```

```tsx title="Direct Native Borrow"
import { useWalletClient } from "wagmi";
import { useBorrow, bigDecimal, evmAddress } from "@aave/react";

// …

const { data: walletClient } = useWalletClient();

const [borrow, borrowing] = useBorrow();

const execute = async () => {
  const result = await borrow({
    market: reserve.market.address,
    amount: {
      native: bigDecimal(2), // 2 ETH
    },
    sender: evmAddress(walletClient!.account.address),
    chainId: reserve.market.chain.chainId,
  });

  // …
};
```

If you intend to leverage credit delegation, you can first check the credit delegation allowance.

```tsx title="Check Credit Delegation Allowance"
import { useCreditDelegateeAllowance, evmAddress } from "@aave/react";

// …

const { data: allowance, loading } = useCreditDelegateeAllowance({
  market: reserve.market.address,
  underlyingToken: reserve.underlyingToken.address,
  user: evmAddress("0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234"), // Delegator
  delegatee: evmAddress(walletClient!.account.address), // Your address
  chainId: reserve.market.chainId,
});

if (allowance && BigInt(allowance.amount.raw) > 0n) {
  console.log("Available delegation allowance:", allowance.amount.value);
} else {
  console.log("No credit delegation allowance available");
}
```

And then, you can proceed with preparing the execution plan for the borrow operation.

```tsx title="Borrow with Credit Delegation"
import { useWalletClient } from "wagmi";
import { useBorrow, bigDecimal, evmAddress } from "@aave/react";

// …

const { data: walletClient } = useWalletClient();

const [borrow, borrowing] = useBorrow();

const execute = async () => {
  const result = await borrow({
    market: reserve.market.address,
    amount: {
      erc20: {
        currency: reserve.underlyingToken.address,
        value: bigDecimal(2), // 2 WETH
      },
    },
    sender: evmAddress(walletClient!.account.address),
    chainId: reserve.market.chain.chainId,
    onBehalfOf: evmAddress("0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234"), // Delegator
  });

  // …
};
```

</tab>
<tab label="TypeScript">

Use the `borrow` action to create the execution plan for a direct borrow operation.

```ts title="Direct ERC-20 Borrow"
import { borrow } from "@aave/client/actions";
import { bigDecimal, evmAddress } from "@aave/client";

import { client } from "./client";
import { wallet } from "./wallet";

const result = await borrow(client, {
  market: reserve.market.address,
  amount: {
    erc20: {
      currency: reserve.underlyingToken.address,
      value: bigDecimal(2), // 2 WETH
    },
  },
  sender: evmAddress(wallet.account.address),
  chainId: reserve.market.chain.chainId,
});

// …
```

```ts title="Direct Native Borrow"
import { borrow } from "@aave/client/actions";
import { bigDecimal, evmAddress } from "@aave/client";

import { client } from "./client";
import { wallet } from "./wallet";

const result = await borrow(client, {
  market: reserve.market.address,
  amount: {
    native: bigDecimal(2), // 2 ETH
  },
  sender: evmAddress(wallet.account.address),
  chainId: reserve.market.chain.chainId,
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

If you intend to leverage credit delegation, you can first check the credit delegation allowance.

```ts title="Check Credit Delegation Allowance"
import { creditDelegateeAllowance } from "@aave/client/actions";
import { evmAddress } from "@aave/client";

import { client } from "./client";
import { wallet } from "./wallet";

const allowanceResult = await creditDelegateeAllowance(client, {
  market: reserve.market.address,
  underlyingToken: reserve.underlyingToken.address,
  user: evmAddress("0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234"), // Delegator
  delegatee: evmAddress(wallet.account.address), // Your address
  chainId: reserve.market.chainId,
});

if (allowanceResult.isOk() && allowanceResult.value.amount.value > 0) {
  console.log(
    "Available delegation allowance:",
    allowanceResult.value.amount.value
  );
} else {
  console.log("No credit delegation allowance available");
}
```

And then, you can proceed with preparing the execution plan for the borrow operation.

```ts title="Borrow with Credit Delegation"
import { borrow } from "@aave/client/actions";
import { bigDecimal, evmAddress } from "@aave/client";

import { client } from "./client";
import { wallet } from "./wallet";

const result = await borrow(client, {
  market: reserve.market.address,
  amount: {
    erc20: {
      currency: reserve.underlyingToken.address,
      value: bigDecimal(2), // 2 WETH
    },
  },
  sender: evmAddress(wallet.account.address),
  chainId: reserve.market.chain.chainId,
  onBehalfOf: evmAddress("0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234"), // Delegator
});

// …
```

</tab>
<tab label="GraphQL">

Use the `borrow` query to create the execution plan for a direct borrow operation.

```graphql title="Direct Borrow"
query {
  borrow(
    request: {
      market: "0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2"
      amount: {
        erc20: {
          currency: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
          value: "2"
        }
        # OR
        # native: "2" # if the reserve accepts native currency
      }
      sender: "0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234"
      chainId: 1
    }
  ) {
    __typename
    ... on TransactionRequest {
      to
      from
      data
      value
      chainId
      operation
    }
    ... on ApprovalRequired {
      reason
      requiredAmount {
        value
        decimals
      }
      currentAllowance {
        value
        decimals
      }
      approval {
        to
        from
        data
        value
        chainId
        operation
      }
      originalTransaction {
        to
        from
        data
        value
        chainId
        operation
      }
    }
    ... on InsufficientBalanceError {
      required {
        value
        decimals
      }
      available {
        value
        decimals
      }
    }
  }
}
```

If you intend to leverage credit delegation, you can first check the credit delegation allowance.

```graphql title="Check Credit Delegation Allowance Query"
query {
  creditDelegateeAllowance(
    request: {
      market: "0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2"
      underlyingToken: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
      user: "0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234" # Delegator
      delegatee: "0x5678…" # Your address
      chainId: 1
    }
  ) {
    usdPerToken
    amount {
      value
      raw
      decimals
    }
    usd
  }
}
```

And then, you can proceed with preparing the execution plan for the borrow operation.

```graphql title="Borrow with Credit Delegation"
query {
  borrow(
    request: {
      market: "0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2"
      amount: {
        erc20: {
          currency: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
          value: "2"
        }
        # OR
        # native: "2" # if the reserve accepts native currency
      }
      sender: "0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234"
      chainId: 1
      onBehalfOf: "0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234" # Delegator
    }
  ) {
    # …
  }
}
```

</tab>
</tabgroup>
### Process the Execution Plan

Finally, handle the execution plan.

<tabgroup>
<tab label="React">

Use the `useSendTransaction` hook for the [wallet library of your choice](../getting-started/react#integrations-send-aave-transactions) to send the transactions in the execution plan.

```tsx title="Viem"
import { useWalletClient } from "wagmi";
import { errAsync, useBorrow } from "@aave/react";
import { useSendTransaction } from "@aave/react/viem";

// …

const { data: walletClient } = useWalletClient();

const [borrow, borrowing] = useBorrow();
const [sendTransaction, sending] = useSendTransaction(walletClient);

// …

// Optional: combine loading states
const loading = borrowing.loading || sending.loading;
const error = borrowing.error || sending.error;

// …

const execute = async () => {
  const result = await borrow({
    // …
  }).andThen((plan) => {
    switch (plan.__typename) {
      case "TransactionRequest":
        // Single transaction execution
        return sendTransaction(plan);

      case "ApprovalRequired":
        // Approval + transaction sequence
        return sendTransaction(plan.approval).andThen(() =>
          sendTransaction(plan.originalTransaction)
        );

      case "InsufficientBalanceError":
        return errAsync(
          new Error(`Insufficient balance: ${plan.required.value} required.`)
        );
    }
  });

  if (result.isErr()) {
    console.error("Borrow failed:", result.error);
  } else {
    console.log("Borrow successful with hash:", result.value);
  }
};
```

</tab>
<tab label="TypeScript">

Use `sendWith` for your [chosen wallet library](../getting-started/typescript#integrations-send-aave-transactions) to send the transactions in the execution plan, and await indexing with `client.waitForTransaction`.

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

if (result.isErr()) {
  console.error("Borrow failed:", result.error);
} else {
  console.log("Borrow successful:", result.value);
}
```

</tab>
<tab label="GraphQL">

If the response is a TransactionRequest, you can send it directly using the wallet associated with the from address.

```json title="TransactionRequest"
{
  "data": {
    "borrow": {
      "__typename": "TransactionRequest",
      "to": "0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2",
      "from": "0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234",
      "data": "0xa415bcad000000000000000000000000a0b…",
      "value": "0",
      "chainId": 1,
      "operation": "BORROW"
    }
  }
}
```

If the response is an `ApprovalRequired`, you must first send the `approval` transaction. Once it succeeds, you can then send the `originalTransaction`.

```json title="ApprovalRequired"
{
  "data": {
    "borrow": {
      "__typename": "ApprovalRequired",
      "reason": "Insufficient allowance for ERC-20 token transfer",
      "requiredAmount": {
        "value": "2.0",
        "decimals": 18
      },
      "currentAllowance": {
        "value": "0.0",
        "decimals": 18
      },
      "approval": {
        "to": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
        "from": "0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234",
        "data": "0x095ea7b3000000000000000000000000878…",
        "value": "0",
        "chainId": 1,
        "operation": null
      },
      "originalTransaction": {
        "to": "0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2",
        "from": "0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234",
        "data": "0xa415bcad000000000000000000000000a0b…",
        "value": "0",
        "chainId": 1,
        "operation": "BORROW"
      }
    }
  }
}
```

If the response is an `InsufficientBalanceError`, inform the user that they don't have enough balance to borrow the requested amount.

```json title="InsufficientBalanceError"
{
  "data": {
    "supply": {
      "__typename": "InsufficientBalanceError",
      "required": {
        "value": "42.0",
        "decimals": 18
      },
      "available": {
        "value": "15.5",
        "decimals": 18
      }
    }
  }
}
```

</tab>
</tabgroup>

## Credit Delegation

Credit delegation allows a user to approve another user (delegatee) to borrow assets against their own supply position. The supply position must be enabled as collateral.

To delegate credit to another address, follow these steps.

### Identify the User Position

First, determine which user supply position you want to delegate credit from.

Let's say we identified this `MarketUserReserveSupplyPosition` object.

```ts title="MarketUserReserveSupplyPosition"
const position: MarketUserReserveSupplyPosition = {
  __typename: "MarketUserReserveSupplyPosition",
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
  balance: {
    __typename: "TokenAmount",
    amount: {
      __typename: "DecimalValue",
      value: "5.0",
      raw: "5000000000000000000",
      decimals: 18,
      // …
    },
    // …
  },
  isCollateral: true,
  canBeCollateral: true,
  // …
};
```

Ensure `MarketUserReserveSupplyPosition.isCollateral` is `true`, if not [enable it as collateral](#collateral-management) first.

### Prepare the Transaction Request

Next, we can proceed with creating the transaction request for the credit delegation operation.

<tabgroup>
<tab label="React">

Use the `useApproveBorrowCreditDelegation` hook to create the transaction request for approving credit delegation.

```tsx title="Approve Credit Delegation"
import { useWalletClient } from "wagmi";
import { useApproveBorrowCreditDelegation, evmAddress } from "@aave/react";

// …

const { data: walletClient } = useWalletClient();

const [approveDelegation, approving] = useApproveBorrowCreditDelegation();

const execute = async () => {
  const result = await approveDelegation({
    market: position.market.address,
    underlyingToken: position.currency.address,
    amount: "1000",
    user: evmAddress(walletClient!.account.address),
    delegatee: evmAddress("0x5678…"),
    chainId: position.market.chainId,
  });

  // …
};
```

</tab>
<tab label="TypeScript">

Use the `approveBorrowCreditDelegation` action to create the transaction request for approving credit delegation.

```ts title="Approve Credit Delegation"
import { approveBorrowCreditDelegation } from "@aave/client/actions";
import { evmAddress } from "@aave/client";

import { client } from "./client";
import { wallet } from "./wallet";

const result = await approveBorrowCreditDelegation(client, {
  market: position.market.address,
  underlyingToken: position.currency.address,
  amount: "1000",
  user: evmAddress(wallet.account.address),
  delegatee: evmAddress("0x5678…"),
  chainId: position.market.chainId,
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

Use the `approveBorrowCreditDelegation` query to create the transaction request for approving credit delegation.

```graphql title="Query"
query {
  approveBorrowCreditDelegation(
    request: {
      market: "0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2"
      underlyingToken: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
      amount: "1000"
      user: "0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234"
      delegatee: "0x5678…"
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
import { useApproveBorrowCreditDelegation } from "@aave/react";
import { useSendTransaction } from "@aave/react/viem";

// …

const { data: walletClient } = useWalletClient();

const [approveDelegation, approving] = useApproveBorrowCreditDelegation();
const [sendTransaction, sending] = useSendTransaction(walletClient);

// …

// Optional: combine loading states
const loading = approving.loading || sending.loading;
const error = approving.error || sending.error;

// …

const execute = async () => {
  const result = await approveDelegation({
    // …
  }).andThen(sendTransaction);

  if (result.isErr()) {
    console.error("Credit delegation failed:", result.error);
  } else {
    console.log("Credit delegation successful with hash:", result.value);
  }
};
```

</tab>
<tab label="TypeScript">

Use `sendWith` for your [chosen wallet library](../getting-started/typescript#integrations-send-aave-transactions) to initiate the transaction, and await indexing with `client.waitForTransaction`.

```ts title="Viem"
import { approveBorrowCreditDelegation } from "@aave/client/actions";
import { sendWith } from "@aave/client/viem";

import { client } from "./client";
import { wallet } from "./wallet";

const result = await approveBorrowCreditDelegation(client, {
  // …
})
  .andThen(sendWith(wallet))
  .andThen(client.waitForTransaction);

if (result.isErr()) {
  console.error("Credit delegation failed:", result.error);
} else {
  console.log("Credit delegation successful:", result.value);
}
```

</tab>
<tab label="GraphQL">

The response is a TransactionRequest that can be sent directly using the wallet associated with the `from` address.

```json title="TransactionRequest"
{
  "data": {
    "approveBorrowCreditDelegation": {
      "__typename": "TransactionRequest",
      "to": "0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2",
      "from": "0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234",
      "data": "0x095ea7b3000000000000000000000000878…",
      "value": "0",
      "chainId": 1,
      "operation": null
    }
  }
}
```

</tab>
</tabgroup>
That's it—the delegatee can now borrow against the user's supply position.

## Repay Loans

By repaying borrowed assets to an Aave market, users reduce or clear their debt position.

When repaying borrowed assets to an Aave market, you can use the following methods:

| Method                                    | Description                                                                       | Typical Scenario                                                                     |
| ----------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| **Direct Repay**                          | Repay ERC-20 or native tokens directly from the sender's wallet.                  | User repays borrowed assets from their own wallet balance.                           |
| **On Behalf of Another**                  | Repay debt for another address.                                                   | User borrowed with one wallet and wants to repay from a different wallet.            |
| **With Permit**                           | Use a permit signature to skip ERC-20 approval and repay in a single transaction. | User signs a permit and sends a single transaction. No ERC-20 allowance left behind. |
| **With Permit<br />On Behalf of Another** | Same as permit repay, but the debt position is owned by another wallet.           | No ERC-20 allowance needed when repaying debt for another wallet.                    |
|                                           |

To repay borrowed assets from an Aave market, follow these steps.

### Identify the User Position

First, determine which user borrow position you want to repay debt for.

Let's say we identified this `MarketUserReserveBorrowPosition` object.

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

That is tied to the following `Reserve` object.

```ts title="Reserve"
const reserve: Reserve = {
  __typename: "Reserve",
  market: {
    __typename: "Market",
    address: "0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2",
    chainId: 1,
    // …
  },
  underlyingToken: {
    __typename: "Currency",
    symbol: "WETH",
    name: "Wrapped Ether",
    address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    // …
  },
  permitSupported: true,
  acceptsNative: {
    __typename: "NativeCurrency",
    // …
  },
};
```

The `Reserve.permitSupported` flag indicates whether the underlying token supports EIP-2612 permits.

Additionally, if `Reserve.acceptsNative` is not `null`, users can choose to repay the borrow position as the chain's native token and it will be automatically wrapped before being sent to the reserve. This is typical for reserves of the wrapped version of the chain's native token (e.g., WETH on Ethereum).

### Prepare the Execution Plan

Next, we can proceed with creating the execution plan for the repay operation.

<tabgroup>
<tab label="React">

Use the `useRepay` hook to create the execution plan for repaying debt from a market reserve, optionally on behalf of another address.

```tsx title="Repay ERC-20"
import { useWalletClient } from "wagmi";
import { useRepay, bigDecimal, evmAddress } from "@aave/react";

// …

const { data: walletClient } = useWalletClient();

const [repay, repaying] = useRepay();

const execute = async () => {
  const result = await repay({
    market: position.market.address,
    amount: {
      erc20: {
        currency: position.currency.address,
        value: {
          exact: bigDecimal(1), // 1 WETH
        },
      },
    },
    sender: evmAddress(walletClient!.account.address),
    chainId: position.market.chainId,
  });

  // …
};
```

```tsx title="Repay Native"
import { useWalletClient } from "wagmi";
import { useRepay, bigDecimal, evmAddress } from "@aave/react";

// …

const { data: walletClient } = useWalletClient();

const [repay, repaying] = useRepay();

const execute = async () => {
  const result = await repay({
    market: position.market.address,
    amount: {
      native: {
        value: bigDecimal(1), // 1 ETH
      },
    },
    sender: evmAddress(walletClient!.account.address),
    chainId: position.market.chainId,
  });

  // …
};
```

```tsx title="Repay Max ERC-20"
import { useWalletClient } from "wagmi";
import { useRepay, bigDecimal, evmAddress } from "@aave/react";

// …

const { data: walletClient } = useWalletClient();

const [repay, repaying] = useRepay();

const execute = async () => {
  const result = await repay({
    market: position.market.address,
    amount: {
      erc20: {
        currency: position.currency.address,
        value: {
          max: true,
        },
      },
    },
    sender: evmAddress(walletClient!.account.address),
    chainId: position.market.chainId,
  });

  // …
};
```

```tsx title="Repay On Behalf of Another"
import { useWalletClient } from "wagmi";
import { useRepay, bigDecimal, evmAddress } from "@aave/react";

// …

const { data: walletClient } = useWalletClient();

const [repay, repaying] = useRepay();

const execute = async () => {
  const result = await repay({
    market: position.market.address,
    amount: {
      erc20: {
        currency: position.currency.address,
        value: {
          exact: bigDecimal(1), // 1 WETH
        },
      },
    },
    sender: evmAddress(walletClient!.account.address),
    chainId: position.market.chainId,
    onBehalfOf: evmAddress("0x5678…"),
  });

  // …
};
```

If `Reserve.permitSupported` is `true` and your borrow position is an ERC-20 token, you can use the `useRepay` and `useERC20Permit` hooks to sign permits and prepare repay transactions. Use the `useERC20Permit` implementation for the [wallet library of choice](../getting-started/react#integrations-sign-erc-20-permits).

```tsx title="Repay ERC-20 With Permit"
import { useRepay, bigDecimal, evmAddress } from "@aave/react";
import { useERC20Permit } from "@aave/react/viem";
import { useWalletClient } from "wagmi";

// …

const { data: walletClient } = useWalletClient();

const [signPermit, signing] = useERC20Permit(walletClient);
const [repay, repaying] = useRepay();

const execute = async () => {
  const amount = bigDecimal(42); // 42 WETH

  const permit = await signPermit({
    amount,
    chainId: reserve.market.chain.chainId,
    currency: reserve.underlyingToken.address,
    owner: evmAddress(walletClient!.account.address),
    spender: reserve.market.address,
  }).andThen((signature) =>
    repay({
      market: position.market.address,
      amount: {
        erc20: {
          currency: position.currency.address,
          value: {
            exact: amount, // 42 WETH
          },
          permitSig: signature,
        },
      },
      sender: evmAddress(walletClient!.account.address),
      chainId: position.market.chainId,
    })
  );

  // …
};
```

```tsx title="Repay ERC-20 with Permit On Behalf of Another"
import { useRepay, bigDecimal, evmAddress } from "@aave/react";
import { useERC20Permit } from "@aave/react/viem";
import { useWalletClient } from "wagmi";

// …

const { data: walletClient } = useWalletClient();

const [signPermit, signing] = useERC20Permit(walletClient);
const [repay, repaying] = useRepay();

const execute = async () => {
  const amount = bigDecimal(42); // 42 WETH

  const permit = await signPermit({
    amount,
    chainId: reserve.market.chain.chainId,
    currency: reserve.underlyingToken.address,
    owner: evmAddress(walletClient!.account.address),
    spender: reserve.market.address,
  }).andThen((signature) =>
    repay({
      market: position.market.address,
      amount: {
        erc20: {
          currency: position.currency.address,
          value: {
            exact: amount, // 42 WETH
          },
          permitSig: signature,
        },
      },
      sender: evmAddress(walletClient!.account.address),
      chainId: position.market.chainId,
      onBehalfOf: evmAddress("0x5678…"),
    })
  );

  // …
};
```

</tab>
<tab label="TypeScript">

Use the `repay` action to create the execution plan for repaying debt from a market reserve, optionally on behalf of another address.

```ts title="Repay ERC-20"
import { repay } from "@aave/client/actions";
import { bigDecimal, evmAddress } from "@aave/client";

import { client } from "./client";
import { wallet } from "./wallet";

const result = await repay(client, {
  market: position.market.address,
  amount: {
    erc20: {
      currency: position.currency.address,
      value: {
        exact: bigDecimal(1), // 1 WETH
      },
    },
  },
  sender: evmAddress(wallet.account.address),
  chainId: position.market.chainId,
});

// …
```

```ts title="Repay Native"
import { repay } from "@aave/client/actions";
import { bigDecimal, evmAddress } from "@aave/client";

import { client } from "./client";
import { wallet } from "./wallet";

const result = await repay(client, {
  market: position.market.address,
  amount: {
    native: {
      value: bigDecimal(1), // 1 ETH
    },
  },
  sender: evmAddress(wallet.account.address),
  chainId: position.market.chainId,
});

// …
```

```ts title="Repay Max ERC-20"
import { repay } from "@aave/client/actions";
import { bigDecimal, evmAddress } from "@aave/client";

import { client } from "./client";
import { wallet } from "./wallet";

const result = await repay(client, {
  market: position.market.address,
  amount: {
    erc20: {
      currency: position.currency.address,
      value: {
        max: true,
      },
    },
  },
  sender: evmAddress(wallet.account.address),
  chainId: position.market.chainId,
});

// …
```

```ts title="Repay On Behalf of Another"
import { repay } from "@aave/client/actions";
import { bigDecimal, evmAddress } from "@aave/client";

import { client } from "./client";
import { wallet } from "./wallet";

const result = await repay(client, {
  market: position.market.address,
  amount: {
    erc20: {
      currency: position.currency.address,
      value: {
        exact: bigDecimal(1), // 1 WETH
      },
    },
  },
  sender: evmAddress(wallet.account.address),
  chainId: position.market.chainId,
  onBehalfOf: evmAddress("0x5678…"),
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

If `Reserve.permitSupported` is `true` and your borrow position is an ERC-20 token, you can use the `repay` and `permitTypedData` actions together with the `signERC20PermitWith` helper to sign permits and prepare repay transactions. Use the `signERC20PermitWith` implementation for the [wallet library of choice](../getting-started/typescript#integrations-sign-erc-20-permits).

```tsx title="Repay ERC-20 with Permit"
import { repay, permitTypedData } from "@aave/client/actions";
import { signERC20PermitWith } from "@aave/client/viem";
import { bigDecimal, evmAddress } from "@aave/client";

import { client } from "./client";
import { wallet } from "./wallet";

const amount = bigDecimal(42); // 42 WETH

const result = await permitTypedData(client, {
  amount,
  chainId: reserve.market.chain.chainId,
  currency: reserve.underlyingToken.address,
  owner: evmAddress(wallet.account.address),
  spender: reserve.market.address,
})
  .andThen(signERC20PermitWith(wallet))
  .andThen((signature) =>
    repay(client, {
      market: reserve.market.address,
      amount: {
        erc20: {
          currency: reserve.underlyingToken.address,
          value: {
            exact: amount,
          },
          permitSig: signature,
        },
      },
      sender: evmAddress(wallet.account.address),
      chainId: reserve.market.chain.chainId,
    })
  );

// …
```

```tsx title="Repay ERC-20 with Permit On Behalf of Another"
import { repay, permitTypedData } from "@aave/client/actions";
import { signERC20PermitWith } from "@aave/client/viem";
import { bigDecimal, evmAddress } from "@aave/client";

import { client } from "./client";
import { wallet } from "./wallet";

const amount = bigDecimal(42); // 42 WETH

const result = await permitTypedData(client, {
  amount,
  chainId: reserve.market.chain.chainId,
  currency: reserve.underlyingToken.address,
  owner: evmAddress(wallet.account.address),
  spender: reserve.market.address,
})
  .andThen(signERC20PermitWith(wallet))
  .andThen((signature) =>
    repay(client, {
      market: reserve.market.address,
      amount: {
        erc20: {
          currency: reserve.underlyingToken.address,
          value: {
            exact: amount,
          },
          permitSig: signature,
        },
      },
      sender: evmAddress(wallet.account.address),
      chainId: reserve.market.chain.chainId,
      onBehalfOf: evmAddress("0x742d35cc…"),
    })
  );

// …
```

</tab>
<tab label="GraphQL">

Use the `repay` query to create the execution plan for repaying debt from a market reserve.

```graphql title="Query"
query {
  repay(
    request: {
      market: "0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2"
      amount: {
        erc20: {
          currency: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
          value: {
            exact: "1"
            # OR
            # max: true
          }
        }
        # OR if the reserve accepts native currency
        # native: "1"
      }
      sender: "0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234"
      chainId: 1
      # optional
      # onBehalfOf: "0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234"
    }
  ) {
    __typename
    ... on TransactionRequest {
      to
      from
      data
      value
      chainId
      operation
    }
    ... on ApprovalRequired {
      reason
      requiredAmount {
        value
        decimals
      }
      currentAllowance {
        value
        decimals
      }
      approval {
        to
        from
        data
        value
        chainId
        operation
      }
      originalTransaction {
        to
        from
        data
        value
        chainId
        operation
      }
    }
    ... on InsufficientBalanceError {
      required {
        value
        decimals
      }
      available {
        value
        decimals
      }
    }
  }
}
```

</tab>
</tabgroup>
### Process the Execution Plan

Finally, handle the execution plan.

<tabgroup>
<tab label="React">

Use the `useSendTransaction` hook for the [wallet library of your choice](../getting-started/react#integrations-send-aave-transactions) to send the transactions in the execution plan.

```tsx title="Viem"
import { useWalletClient } from "wagmi";
import { errAsync, useRepay } from "@aave/react";
import { useSendTransaction } from "@aave/react/viem";

// …

const { data: walletClient } = useWalletClient();

const [repay, repaying] = useRepay();
const [sendTransaction, sending] = useSendTransaction(walletClient);

// …

// Optional: combine loading states
const loading = repaying.loading || sending.loading;
const error = repaying.error || sending.error;

// …

const execute = async () => {
  const result = await repay({
    // …
  }).andThen((plan) => {
    switch (plan.__typename) {
      case "TransactionRequest":
        // Single transaction execution
        return sendTransaction(plan);

      case "ApprovalRequired":
        // Approval + transaction sequence
        return sendTransaction(plan.approval).andThen(() =>
          sendTransaction(plan.originalTransaction)
        );

      case "InsufficientBalanceError":
        return errAsync(
          new Error(`Insufficient balance: ${plan.required.value} required.`)
        );
    }
  });

  if (result.isErr()) {
    console.error("Repay failed:", result.error);
  } else {
    console.log("Repay successful with hash:", result.value);
  }
};
```

</tab>
<tab label="TypeScript">

Use `sendWith` for your [chosen wallet library](../getting-started/typescript#integrations-send-aave-transactions) to send the transactions in the execution plan, and await indexing with `client.waitForTransaction`.

```ts title="Viem"
import { repay } from "@aave/client/actions";
import { sendWith } from "@aave/client/viem";

import { client } from "./client";
import { wallet } from "./wallet";

const result = await repay(client, {
  // …
})
  .andThen(sendWith(wallet))
  .andThen(client.waitForTransaction);

if (result.isErr()) {
  console.error("Repay failed:", result.error);
} else {
  console.log("Repay successful:", result.value);
}
```

</tab>
<tab label="GraphQL">

If the response is a TransactionRequest, you can send it directly using the wallet associated with the from address.

```json title="TransactionRequest"
{
  "data": {
    "repay": {
      "__typename": "TransactionRequest",
      "to": "0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2",
      "from": "0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234",
      "data": "0x573ade81000000000000000000000000c02…",
      "value": "1000000000000000000",
      "chainId": 1,
      "operation": "REPAY"
    }
  }
}
```

If the response is an `ApprovalRequired`, you must first send the `approval` transaction. Once it succeeds, you can then send the `originalTransaction`.

```json title="ApprovalRequired"
{
  "data": {
    "repay": {
      "__typename": "ApprovalRequired",
      "reason": "Insufficient allowance for aToken transfer",
      "requiredAmount": {
        "value": "2.0",
        "decimals": 18
      },
      "currentAllowance": {
        "value": "0.0",
        "decimals": 18
      },
      "approval": {
        "to": "0x4d5F47FA6A74757f35C14fD3a6Ef8E3C9BC514E8",
        "from": "0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234",
        "data": "0x095ea7b3000000000000000000000000878…",
        "value": "0",
        "chainId": 1,
        "operation": null
      },
      "originalTransaction": {
        "to": "0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2",
        "from": "0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234",
        "data": "0x573ade81000000000000000000000000c02…",
        "value": "0",
        "chainId": 1,
        "operation": "REPAY"
      }
    }
  }
}
```

If the response is an `InsufficientBalanceError`, inform the user that they don't have enough balance to repay the requested amount.

```json title="InsufficientBalanceError"
{
  "data": {
    "repay": {
      "__typename": "InsufficientBalanceError",
      "required": {
        "value": "1.0",
        "decimals": 18
      },
      "available": {
        "value": "0.5",
        "decimals": 18
      }
    }
  }
}
```

</tab>
</tabgroup>

## Withdraw Assets

Users can withdraw assets from Aave markets using their previously supplied reserves.

When withdrawing assets from an Aave market, you can use the following methods:

| Method                | Description                                                   | Typical Scenario                                                           |
| --------------------- | ------------------------------------------------------------- | -------------------------------------------------------------------------- |
| **Direct Withdraw**   | Withdraw ERC-20 or native tokens directly to supplier wallet. | User withdraws supplied assets from their own wallet balance.              |
| **Another Recipient** | Withdraw supplied assets to another address.                  | User supplied with one wallet and wants to withdraw to a different wallet. |

To withdraw supplied assets from an Aave market, follow these steps.

### Identify the User Position

First, determine which user supply position you want to withdraw assets from.

Let's say we identified this `MarketUserReserveSupplyPosition` object.

```ts title="MarketUserReserveSupplyPosition"
const position: MarketUserReserveSupplyPosition = {
  __typename: "MarketUserReserveSupplyPosition",
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
  balance: {
    __typename: "TokenAmount",
    amount: {
      __typename: "DecimalValue",
      value: "5.0",
      raw: "5000000000000000000",
      decimals: 18,
      // …
    },
    // …
  },
  // …
};
```

That is tied to the following `Reserve` object.

```ts title="Reserve"
const reserve: Reserve = {
  __typename: "Reserve",
  market: {
    __typename: "Market",
    address: "0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2",
    chainId: 1,
    // …
  },
  underlyingToken: {
    __typename: "Currency",
    symbol: "WETH",
    name: "Wrapped Ether",
    address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    // …
  },
  acceptsNative: {
    __typename: "NativeCurrency",
    // …
  },
};
```

### Prepare the Execution Plan

Next, we can proceed with creating the execution plan for the withdraw operation.

<tabgroup>
<tab label="React">

Use the `useWithdraw` hook to create the execution plan for withdrawing assets from a market reserve.

```tsx title="Withdraw ERC-20 Amount"
import { useWalletClient } from "wagmi";
import { useWithdraw, bigDecimal, evmAddress } from "@aave/react";

// …

const { data: walletClient } = useWalletClient();

const [withdraw, withdrawing] = useWithdraw();

const execute = async () => {
  const result = await withdraw({
    market: position.market.address,
    amount: {
      erc20: {
        currency: position.currency.address,
        value: {
          exact: bigDecimal(2), // 2 WETH
        },
      },
    },
    sender: evmAddress(walletClient!.account.address),
    chainId: position.market.chainId,
  });

  // …
};
```

```tsx title="Withdraw Max ERC-20 Amount"
import { useWalletClient } from "wagmi";
import { useWithdraw, bigDecimal, evmAddress } from "@aave/react";

// …

const { data: walletClient } = useWalletClient();

const [withdraw, withdrawing] = useWithdraw();

const execute = async () => {
  const result = await withdraw({
    market: position.market.address,
    amount: {
      erc20: {
        currency: position.currency.address,
        value: {
          max: true,
        },
      },
    },
    sender: evmAddress(walletClient!.account.address),
    chainId: position.market.chainId,
  });

  // …
};
```

```tsx title="Withdraw to Another Recipient"
import { useWalletClient } from "wagmi";
import { useWithdraw, bigDecimal, evmAddress } from "@aave/react";

// …

const { data: walletClient } = useWalletClient();

const [withdraw, withdrawing] = useWithdraw();

const execute = async () => {
  const result = await withdraw({
    market: position.market.address,
    amount: {
      erc20: {
        currency: position.currency.address,
        value: {
          exact: bigDecimal(2), // 2 WETH
        },
      },
    },
    recipient: evmAddress("0x1234567890123456789012345678901234567890"),
    sender: evmAddress(walletClient!.account.address),
    chainId: position.market.chainId,
  });

  // …
};
```

If `Reserve.acceptsNative` is not `null`, you can choose to withdraw the assets using the chain's native token.

```tsx title="Withdraw Exact Native Amount"
import { useWalletClient } from "wagmi";
import { useWithdraw, bigDecimal, evmAddress } from "@aave/react";

// …

const { data: walletClient } = useWalletClient();

const [withdraw, withdrawing] = useWithdraw();

const execute = async () => {
  const result = await withdraw({
    market: position.market.address,
    amount: {
      native: {
        value: { exact: bigDecimal(2) }, // 2 ETH
      },
    },
    sender: evmAddress(walletClient!.account.address),
    chainId: position.market.chainId,
  });

  // …
};
```

```tsx title="Withdraw Max Native Amount"
import { useWalletClient } from "wagmi";
import { useWithdraw, bigDecimal, evmAddress } from "@aave/react";

// …

const { data: walletClient } = useWalletClient();

const [withdraw, withdrawing] = useWithdraw();

const execute = async () => {
  const result = await withdraw({
    market: position.market.address,
    amount: {
      native: {
        value: { max: true },
      },
    },
    sender: evmAddress(walletClient!.account.address),
    chainId: position.market.chainId,
  });

  // …
};
```

```tsx title="Withdraw Native to Another Recipient"
import { useWalletClient } from "wagmi";
import { useWithdraw, bigDecimal, evmAddress } from "@aave/react";

// …

const { data: walletClient } = useWalletClient();

const [withdraw, withdrawing] = useWithdraw();

const execute = async () => {
  const result = await withdraw({
    market: position.market.address,
    amount: {
      native: {
        value: { exact: bigDecimal(2) }, // 2 ETH
      },
    },
    recipient: evmAddress("0x1234567890123456789012345678901234567890"),
    sender: evmAddress(walletClient!.account.address),
    chainId: position.market.chainId,
  });

  // …
};
```

</tab>
<tab label="TypeScript">

Use the `withdraw` action to create the execution plan for withdrawing assets from a market reserve.

```ts title="Withdraw ERC-20 Amount"
import { withdraw } from "@aave/client/actions";
import { bigDecimal, evmAddress } from "@aave/client";

import { client } from "./client";
import { wallet } from "./wallet";

const result = await withdraw(client, {
  market: position.market.address,
  amount: {
    erc20: {
      currency: position.currency.address,
      value: {
        exact: bigDecimal(2), // 2 WETH
      },
    },
  },
  sender: evmAddress(wallet.account.address),
  chainId: position.market.chainId,
});

// …
```

```ts title="Withdraw Max ERC-20 Amount"
import { withdraw } from "@aave/client/actions";
import { bigDecimal, evmAddress } from "@aave/client";

import { client } from "./client";
import { wallet } from "./wallet";

const result = await withdraw(client, {
  market: position.market.address,
  amount: {
    erc20: {
      currency: position.currency.address,
      value: {
        max: true,
      },
    },
  },
  sender: evmAddress(wallet.account.address),
  chainId: position.market.chainId,
});

// …
```

```ts title="Withdraw to Another Recipient"
import { withdraw } from "@aave/client/actions";
import { bigDecimal, evmAddress } from "@aave/client";

import { client } from "./client";
import { wallet } from "./wallet";

const result = await withdraw(client, {
  market: position.market.address,
  amount: {
    erc20: {
      currency: position.currency.address,
      value: {
        exact: bigDecimal(2), // 2 WETH
      },
    },
  },
  recipient: evmAddress("0x1234567890123456789012345678901234567890"),
  sender: evmAddress(wallet.account.address),
  chainId: position.market.chainId,
});

// …
```

```ts title="Withdraw Native to Another Recipient"
import { withdraw } from "@aave/client/actions";
import { bigDecimal, evmAddress } from "@aave/client";

import { client } from "./client";
import { wallet } from "./wallet";

const result = await withdraw(client, {
  market: position.market.address,
  amount: {
    native: {
      value: { exact: bigDecimal(2) }, // 2 ETH
    },
  },
  recipient: evmAddress("0x1234567890123456789012345678901234567890"),
  sender: evmAddress(wallet.account.address),
  chainId: position.market.chainId,
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

If the `Reserve.acceptsNative` is not `null`, you can choose to withdraw the assets as the chain's native token.

```ts title="Withdraw Exact Native Amount"
import { withdraw } from "@aave/client/actions";
import { bigDecimal, evmAddress } from "@aave/client";

import { client } from "./client";
import { wallet } from "./wallet";

const result = await withdraw(client, {
  market: position.market.address,
  amount: {
    native: {
      value: { exact: bigDecimal(2) }, // 2 ETH
    },
  },
  sender: evmAddress(wallet.account.address),
  chainId: position.market.chainId,
});

// …
```

```ts title="Withdraw Max Native Amount"
import { withdraw } from "@aave/client/actions";
import { bigDecimal, evmAddress } from "@aave/client";

import { client } from "./client";
import { wallet } from "./wallet";

const result = await withdraw(client, {
  market: position.market.address,
  amount: {
    native: {
      value: { max: true },
    },
  },
  sender: evmAddress(wallet.account.address),
  chainId: position.market.chainId,
});

// …
```

</tab>
<tab label="GraphQL">

Use the `withdraw` query to create the execution plan for withdrawing assets from a market reserve.

```graphql title="Query"
query {
  withdraw(
    request: {
      market: "0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2"
      amount: {
        erc20: {
          currency: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
          value: {
            exact: "2"
            # OR
            # max: true
          }
        }
        # OR if the reserve accepts native currency
        # native: {
        #   value: { exact: "2" }
        #   # OR
        #   # max: true
        # }
      }
      sender: "0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234"
      chainId: 1
      # OPTIONAL: if you want to withdraw to a different address
      # recipient: "0x1234567890123456789012345678901234567890"
    }
  ) {
    __typename
    ... on TransactionRequest {
      to
      from
      data
      value
      chainId
      operation
    }
    ... on ApprovalRequired {
      reason
      requiredAmount {
        value
        decimals
      }
      currentAllowance {
        value
        decimals
      }
      approval {
        to
        from
        data
        value
        chainId
        operation
      }
      originalTransaction {
        to
        from
        data
        value
        chainId
        operation
      }
    }
    ... on InsufficientBalanceError {
      required {
        value
        decimals
      }
      available {
        value
        decimals
      }
    }
  }
}
```

</tab>
</tabgroup>
### Process the Execution Plan

Finally, handle the execution plan.

<tabgroup>
<tab label="React">

Use the `useSendTransaction` hook for the [wallet library of your choice](../getting-started/react#integrations-send-aave-transactions) to send the transactions in the execution plan.

```tsx title="Viem"
import { useWalletClient } from "wagmi";
import { errAsync, useWithdraw } from "@aave/react";
import { useSendTransaction } from "@aave/react/viem";

// …

const { data: walletClient } = useWalletClient();

const [withdraw, withdrawing] = useWithdraw();
const [sendTransaction, sending] = useSendTransaction(walletClient);

// …

// Optional: combine loading states
const loading = withdrawing.loading || sending.loading;
const error = withdrawing.error || sending.error;

// …

const execute = async () => {
  const result = await withdraw({
    // …
  }).andThen((plan) => {
    switch (plan.__typename) {
      case "TransactionRequest":
        // Single transaction execution
        return sendTransaction(plan);

      case "ApprovalRequired":
        // Approval + transaction sequence
        return sendTransaction(plan.approval).andThen(() =>
          sendTransaction(plan.originalTransaction)
        );

      case "InsufficientBalanceError":
        return errAsync(
          new Error(`Insufficient balance: ${plan.required.value} required.`)
        );
    }
  });

  if (result.isErr()) {
    console.error("Withdraw failed:", result.error);
  } else {
    console.log("Withdraw successful with hash:", result.value);
  }
};
```

</tab>
<tab label="TypeScript">

Use `sendWith` for your [chosen wallet library](../getting-started/typescript#integrations-send-aave-transactions) to send the transactions in the execution plan, and await indexing with `client.waitForTransaction`.

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

if (result.isErr()) {
  console.error("Withdraw failed:", result.error);
} else {
  console.log("Withdraw successful:", result.value);
}
```

</tab>
<tab label="GraphQL">

If the response is a TransactionRequest, you can send it directly using the wallet associated with the from address.

```json title="TransactionRequest"
{
  "data": {
    "withdraw": {
      "__typename": "TransactionRequest",
      "to": "0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2",
      "from": "0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234",
      "data": "0x69328dec000000000000000000000000c02…",
      "value": "0",
      "chainId": 1,
      "operation": "WITHDRAW"
    }
  }
}
```

If the response is an `ApprovalRequired`, you must first send the `approval` transaction. Once it succeeds, you can then send the `originalTransaction`.

```json title="ApprovalRequired"
{
  "data": {
    "withdraw": {
      "__typename": "ApprovalRequired",
      "reason": "Insufficient allowance for aToken transfer",
      "requiredAmount": {
        "value": "2.0",
        "decimals": 18
      },
      "currentAllowance": {
        "value": "0.0",
        "decimals": 18
      },
      "approval": {
        "to": "0x4d5F47FA6A74757f35C14fD3a6Ef8E3C9BC514E8",
        "from": "0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234",
        "data": "0x095ea7b3000000000000000000000000878…",
        "value": "0",
        "chainId": 1,
        "operation": null
      },
      "originalTransaction": {
        "to": "0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2",
        "from": "0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234",
        "data": "0x69328dec000000000000000000000000c02…",
        "value": "0",
        "chainId": 1,
        "operation": "WITHDRAW"
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
        "value": "2.0",
        "decimals": 18
      },
      "available": {
        "value": "1.5",
        "decimals": 18
      }
    }
  }
}
```

</tab>
</tabgroup>

## Advanced Operations

### Health Factor Preview

> [!NOTE]
> The health factor is calculated only when a user has at least one active
> borrow position. If the user has no positions or only supply positions, the
> health factor will be null.

To preview how a user's health factor will change before executing a market operation (supply, borrow, repay, withdraw).

<tabgroup>
<tab label="React">

Use the `useHealthFactorPreview` hook to preview the health factor after the operation.

```tsx title="Borrow"
import { useWalletClient } from "wagmi";
import { useHealthFactorPreview, bigDecimal, evmAddress } from "@aave/react";

// …

const { data: walletClient } = useWalletClient();
const [preview, { loading, error }] = useHealthFactorPreview();

const result = await preview({
  action: {
    borrow: {
      market: reserve.market.address,
      amount: {
        erc20: {
          currency: reserve.underlyingToken.address,
          value: bigDecimal(42), // 42 WETH
        },
      },
      borrower: evmAddress(walletClient!.account.address),
      chainId: reserve.market.chain.chainId,
    },
  },
});

if (result.isErr()) {
  console.error(result.error);
} else {
  console.log(result.value.after); // 1.5 or null
}
```

```tsx title="Supply"
import { useWalletClient } from "wagmi";
import { useHealthFactorPreview, bigDecimal, evmAddress } from "@aave/react";

// …

const { data: walletClient } = useWalletClient();
const [preview, { loading, error }] = useHealthFactorPreview();

const result = await preview({
  action: {
    supply: {
      market: reserve.market.address,
      amount: {
        erc20: {
          currency: reserve.underlyingToken.address,
          value: bigDecimal(42), // 42 WETH
        },
      },
      sender: evmAddress(walletClient!.account.address),
      chainId: reserve.market.chain.chainId,
    },
  },
});

if (result.isErr()) {
  console.error(result.error);
} else {
  console.log(result.value.after); // 1.5 or null
}
```

```tsx title="Repay"
import { useWalletClient } from "wagmi";
import { useHealthFactorPreview, bigDecimal, evmAddress } from "@aave/react";

// …

const { data: walletClient } = useWalletClient();
const [preview, { loading, error }] = useHealthFactorPreview();

const result = await preview({
  action: {
    repay: {
      market: position.market.address,
      amount: {
        erc20: {
          currency: position.currency.address,
          value: {
            exact: bigDecimal(1), // 1 WETH
          },
        },
      },
      sender: evmAddress(walletClient!.account.address),
      chainId: position.market.chainId,
    },
  },
});

if (result.isErr()) {
  console.error(result.error);
} else {
  console.log(result.value.after); // 1.5 or null
}
```

```tsx title="Withdraw"
import { useWalletClient } from "wagmi";
import { useHealthFactorPreview, bigDecimal, evmAddress } from "@aave/react";

// …

const { data: walletClient } = useWalletClient();
const [preview, { loading, error }] = useHealthFactorPreview();

const result = await preview({
  action: {
    withdraw: {
      market: position.market.address,
      amount: {
        erc20: {
          currency: position.currency.address,
          value: {
            max: true,
          },
        },
      },
      sender: evmAddress(walletClient!.account.address),
      chainId: position.market.chainId,
    },
  },
});

if (result.isErr()) {
  console.error(result.error);
} else {
  console.log(result.value.after); // 1.5 or null
}
```

</tab>

<tab label="TypeScript">

Use the `healthFactorPreview` client action to preview the health factor after the operation.

```ts title="Borrow"
import { bigDecimal } from "@aave/client";
import { healthFactorPreview } from "@aave/client/actions";

import { client } from "./client";

const result = await healthFactorPreview(client, {
  action: {
    borrow: {
      market: reserve.market.address,
      amount: {
        erc20: {
          currency: reserve.underlyingToken.address,
          value: bigDecimal(42), // 42 WETH
        },
      },
    },
  },
});

if (result.isErr()) {
  console.error(result.error);
} else {
  console.log(result.value.after); // 1.5 or null
}
```

```ts title="Supply"
import { bigDecimal } from "@aave/client";
import { healthFactorPreview } from "@aave/client/actions";

import { client } from "./client";

const result = await healthFactorPreview(client, {
  action: {
    supply: {
      market: reserve.market.address,
      amount: {
        erc20: {
          currency: reserve.underlyingToken.address,
          value: bigDecimal(42), // 42 WETH
        },
      },
    },
  },
});

if (result.isErr()) {
  console.error(result.error);
} else {
  console.log(result.value.after); // 1.5 or null
}
```

```ts title="Repay"
import { bigDecimal } from "@aave/client";
import { healthFactorPreview } from "@aave/client/actions";

import { client } from "./client";

const result = await healthFactorPreview(client, {
  action: {
    repay: {
      market: position.market.address,
      amount: {
        erc20: {
          currency: position.currency.address,
          value: {
            exact: bigDecimal(1), // 1 WETH
          },
        },
      },
    },
  },
});

if (result.isErr()) {
  console.error(result.error);
} else {
  console.log(result.value.after); // 1.5 or null
}
```

```ts title="Withdraw"
import { bigDecimal } from "@aave/client";
import { healthFactorPreview } from "@aave/client/actions";

import { client } from "./client";

const result = await healthFactorPreview(client, {
  action: {
    withdraw: {
      market: position.market.address,
      amount: {
        erc20: {
          currency: position.currency.address,
          value: {
            max: true,
          },
        },
      },
    },
  },
});

if (result.isErr()) {
  console.error(result.error);
} else {
  console.log(result.value.after); // 1.5 or null
}
```

</tab>

<tab label="GraphQL">

Use the `healthFactorPreview` query to preview the health factor after the operation.

```graphql title="Query"
query {
  healthFactorPreview(
    action: {
      borrow: {
        market: "0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2"
        amount: {
          erc20: {
            currency: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
            value: { exact: "42" }
          }
        }
      }
      # OR
      # supply: {
      #   ...
      # }

      # OR
      # repay: {
      #   ...
      # }

      # OR
      # withdraw: {
      #   ...
      # }
    }
  ) {
    before
    after
  }
}
```

```json title="Response"
{
  "data": {
    "healthFactorPreview": {
      "after": 1.5,
      "before": null
    }
  }
}
```

</tab>

</tabgroup>

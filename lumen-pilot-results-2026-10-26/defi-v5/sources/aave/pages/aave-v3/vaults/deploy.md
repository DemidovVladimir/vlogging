# Deploy Aave Earn Vault

To deploy a new Aave Earn Vault, follow these steps:

> [!WARNING]
> Vaults deployed through other methods will not be surfaced via Aave Labs' API
> or SDKs.

## Identify the Reserve

First, determine which reserve you want your vault to be based on.

Let's say we choose the WETH supply reserve of an Ethereum market.

```ts title="Reserve"
const reserve: Reserve = {
  __typename: "Reserve",
  market: {
    __typename: "MarketInfo",
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
  isFrozen: false,
  isPaused: false,
  // …
};
```

> [!WARNING]
> Ensure the reserve is not frozen or paused.

## Define Configuration

Next, define the configuration for deploying the vault.

The `initialLockDeposit` is **permanently locked** in the vault and cannot be withdrawn. It protects against inflation attacks by ensuring the share price cannot be manipulated immediately after deployment — and the protection strengthens as TVL grows.

The amount is derived from a `TARGET_DONATION`: the minimum raw asset units an attacker would need to donate to double the share price at deployment. A higher `TARGET_DONATION` raises the attack cost. Setting it to `1_000_000` raw units is a conservative default that is cheap for most assets while remaining meaningful.

```txt
initialLockDeposit = max(TARGET_DONATION / 10^decimals, 1e-9)

// With TARGET_DONATION = 1_000_000:
// USDC  (6 dec)  → 1 USDC
// WETH  (18 dec) → 0.000000001 WETH
```

You can tune `TARGET_DONATION` upward for higher-value assets or increase it if you want a stronger guarantee at vault launch.

<tabgroup>
<tab label="React">

The minimal configuration to deploy a vault is:

```tsx title="Minimal Configuration"
import { bigDecimal, evmAddress, VaultDeployRequest } from "@aave/react";

// …

const request: VaultDeployRequest = {
  market: reserve.market.address,
  chainId: reserve.market.chain.chainId,
  underlyingToken: reserve.underlyingToken.address,
  deployer: evmAddress(walletClient!.account.address),
  // owner: evmAddress("0x1234…"), if different from deployer
  initialFee: bigDecimal(0), // 0% performance fee
  shareName: "Aave WETH Vault Shares",
  shareSymbol: "avWETH",
  initialLockDeposit: bigDecimal(0.000000001), // 0.000000001 WETH — permanently locked
};
```

Vaults deployed via Aave Labs' API or SDK can set the performance fee as low as 0%.

When a performance fee is set, 50% of that fee is automatically allocated to Aave Labs.

When a recipient is not specified, the fee revenue is distributed equally between the vault owner and Aave Labs.

Let's explore a more advanced recipient configuration with an example. Suppose you want to deploy a vault where you keep 70% of the fee revenue and share the remaining 30% with your partner.

```tsx title="Configuration with Fee Recipients"
import { bigDecimal, evmAddress, VaultDeployRequest } from "@aave/react";

const request: VaultDeployRequest = {
  // …
  recipients: [
    {
      address: evmAddress("0x1234…"),
      percent: bigDecimal(30),
    },
    {
      address: evmAddress("0x4567…"),
      percent: bigDecimal(70),
    },
  ],
};
```

If the vault generates 100 WETH in fee revenue, the distribution will be as follows:

- `partner`: 15 WETH
- `owner`: 35 WETH
- `Aave Labs`: 50 WETH

Since Aave Labs retains 50% of the total fee revenue by default, the remaining 50% is divided between the owner and partner according to the specified percentages.

</tab>
<tab label="TypeScript">

The minimal configuration to deploy a vault is:

```ts title="Minimal Configuration"
import { bigDecimal, evmAddress, VaultDeployRequest } from "@aave/client";

const request: VaultDeployRequest = {
  market: reserve.market.address,
  chainId: reserve.market.chain.chainId,
  underlyingToken: reserve.underlyingToken.address,
  deployer: evmAddress(wallet.account.address),
  // owner: evmAddress("0x1234…"), if different from deployer
  initialFee: bigDecimal(0), // 0% performance fee
  shareName: "Aave WETH Vault Shares",
  shareSymbol: "avWETH",
  initialLockDeposit: bigDecimal(0.000000001), // 0.000000001 WETH — permanently locked
};
```

Vaults deployed via Aave Labs' API or SDK can set the performance fee as low as 0%.

When a performance fee is set, 50% of that fee is automatically allocated to Aave Labs.

When a recipient is not specified, the fee revenue is distributed equally between the vault owner and Aave Labs.

Let's explore a more advanced recipient configuration with an example. Suppose you want to deploy a vault where you keep 70% of the fee revenue and share the remaining 30% with your partner.

```ts title="Configuration with Fee Recipients"
import { bigDecimal, evmAddress, VaultDeployRequest } from "@aave/client";

const result = await vaultDeploy(client, {
  // …
  recipients: [
    {
      address: evmAddress("0x1234…"),
      percent: bigDecimal(30),
    },
    {
      address: evmAddress("0x4567…"),
      percent: bigDecimal(70),
    },
  ],
});
```

If the vault generates 100 WETH in fee revenue, the distribution will be as follows:

- `partner`: 15 WETH
- `owner`: 35 WETH
- `Aave Labs`: 50 WETH

Since Aave Labs retains 50% of the total fee revenue by default, the remaining 50% is divided between the owner and partner according to the specified percentages.

</tab>
<tab label="GraphQL">

The minimal configuration to deploy a vault is:

```json title="Minimal Configuration"
{
  "request": {
    "market": "0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2",
    "chainId": 1,
    "underlyingToken": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    "deployer": "0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234",
    // "owner": "0x1234…", if different from deployer
    "initialFee": "0", // 0% performance fee
    "shareName": "Aave WETH Vault Shares",
    "shareSymbol": "avWETH",
    "initialLockDeposit": "0.000000001" // 0.000000001 WETH — permanently locked
  }
}
```

Vaults deployed via Aave Labs' API or SDK can set the performance fee as low as 0%.

When a performance fee is set, 50% of that fee is automatically allocated to Aave Labs.

When a recipient is not specified, the fee revenue is distributed equally between the vault owner and Aave Labs.

Let's explore a more advanced recipient configuration with an example. Suppose you want to deploy a vault where you keep 70% of the fee revenue and share the remaining 30% with your partner.

```json title="Configuration with Fee Recipients"
{
  "request": {
    // …
    "recipients": [
      {
        "address": "0x5678…",
        "percent": "30"
      },
      {
        "address": "0x9012…",
        "percent": "70"
      }
    ]
  }
}
```

If the vault generates 100 WETH in fee revenue, the distribution will be as follows:

- `partner`: 15 WETH
- `owner`: 35 WETH
- `Aave Labs`: 50 WETH

Since Aave Labs retains 50% of the total fee revenue by default, the remaining 50% is divided between the owner and partner according to the specified percentages.

</tab>
</tabgroup>
## Deploy the Vault

Finally, deploy the vault.

<tabgroup>
<tab label="React">

Use the `useVaultDeploy` and `useSendTransaction` hooks with the [wallet library of your choice](../getting-started/react#integrations-send-aave-transactions) to send the transactions.

```tsx title="Viem"
import { useWalletClient } from "wagmi";
import { errAsync, useVaultDeploy } from "@aave/react";
import { useSendTransaction } from "@aave/react/viem";

// …

const { data: walletClient } = useWalletClient();

const [deployVault, deploying] = useVaultDeploy();
const [sendTransaction, sending] = useSendTransaction(walletClient);

// …

// Optional: combine loading states
const loading = deploying.loading || sending.loading;
const error = deploying.error || sending.error;

// …

const result = await deployVault(request).andThen((plan) => {
  switch (plan.__typename) {
    case "TransactionRequest":
      // Single transaction execution
      return sendTransaction(plan);

    case "ApprovalRequired":
      // Approval + transaction sequence
      return sendTransaction(plan.approval).andThen(() =>
        sendTransaction(plan.originalTransaction),
      );

    case "InsufficientBalanceError":
      return errAsync(
        new Error(`Insufficient balance: ${plan.required.value} required.`),
      );
  }
});

if (result.isErr()) {
  console.error("Vault deployment failed:", result.error);
} else {
  console.log("Vault deployment successful with hash:", result.value);
}
```

</tab>
<tab label="TypeScript">

Use `vaultDeploy` action and `sendWith` for your [chosen wallet library](../getting-started/typescript#integrations-send-aave-transactions) to send the transactions, and await indexing with `client.waitForTransaction`.

```ts title="Viem"
import { vaultDeploy } from "@aave/client/actions";
import { sendWith } from "@aave/client/viem";

import { client } from "./client";
import { wallet } from "./wallet";

const result = await vaultDeploy(client, request)
  .andThen(sendWith(wallet))
  .andThen(client.waitForTransaction);

if (result.isErr()) {
  console.error("Vault deployment failed:", result.error);
} else {
  console.log("Vault deployment successful:", result.value);
}
```

</tab>
<tab label="GraphQL">

Use the `vaultDeploy` query to deploy a vault.

```graphql title="Query"
query {
  vaultDeploy(request: {
    // …
  }) {
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

Depending on the response, you can handle the response accordingly.

| Response Type            | Description                                                                               |
| ------------------------ | ----------------------------------------------------------------------------------------- |
| TransactionRequest       | You can send it directly using the wallet associated with the `from` address.             |
| ApprovalRequired         | Send the approval transaction first, then the original transaction.                       |
| InsufficientBalanceError | Inform the user that they don't have enough balance for the initial deposit in the vault. |

Below are examples illustrating the response for each response type.

```json title="TransactionRequest"
{
  "data": {
    "vaultDeploy": {
      "__typename": "TransactionRequest",
      "to": "0x…",
      "from": "0x…",
      "data": "0x…",
      "value": "0",
      "chainId": 1,
      "operation": "VAULT_DEPLOYED"
    }
  }
}
```

```json title="ApprovalRequired"
{
  "data": {
    "vaultDeploy": {
      "__typename": "ApprovalRequired",
      "reason": "Insufficient allowance",
      "requiredAmount": { "value": "1000", "decimals": 18 },
      "currentAllowance": { "value": "0", "decimals": 18 },
      "approval": {
        "to": "0x…",
        "from": "0x…",
        "data": "0x…",
        "value": "0",
        "chainId": 1,
        "operation": null
      },
      "originalTransaction": {
        "to": "0x…",
        "from": "0x…",
        "data": "0x…",
        "value": "0",
        "chainId": 1,
        "operation": "VAULT_DEPLOYED"
      }
    }
  }
}
```

```json title="InsufficientBalanceError"
{
  "data": {
    "vaultDeploy": {
      "__typename": "InsufficientBalanceError",
      "required": {
        "value": "1000.0",
        "decimals": 6
      },
      "available": {
        "value": "750.0",
        "decimals": 6
      }
    }
  }
}
```

</tab>
</tabgroup>

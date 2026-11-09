# Savings GHO (sGHO)

Savings GHO (sGHO) is a savings product for the GHO stablecoin, built as a native ERC-4626 vault and deployed on Ethereum mainnet. Users deposit GHO into the vault and receive sGHO shares that steadily increase in GHO value as yield accrues from an on-chain rate. Deposits and withdrawals are instant, with no cooldown period, no slashing risk, and no rehypothecation of deposited funds.

**Contract:** [0xE1753F2e00940cC31213dd92013cF019DFE4ca1d](https://etherscan.io/address/0xE1753F2e00940cC31213dd92013cF019DFE4ca1d) (Ethereum Mainnet)

> [!NOTE]
> sGHO replaces the legacy Merit-based sGHO contract. Legacy holders must
> withdraw GHO from the old contract and deposit into the new vault to earn the
> current rate. See [Legacy sGHO](#legacy-sgho) for the previous API.

## Vault State

Fetch the current state of the sGHO vault, including rates, totals, and an optional user position.

<tabgroup>
<tab label="React">

Use the `useSghoVault` hook to read vault data and an optional user position.

```ts title="Loading State"
const { data, loading, error } = useSghoVault({
  chainId: chainId(1),
  user: evmAddress("0x742d35cc…"), // optional
});
```

```ts title="React Suspense"
const { data } = useSghoVault({
  chainId: chainId(1),
  user: evmAddress("0x742d35cc…"),
  suspense: true,
});
```

```tsx title="Vault State"
import { useSghoVault, chainId, evmAddress } from "@aave/react";
import { useAccount } from "wagmi";

// …

const { address } = useAccount();

const { data, loading, error } = useSghoVault({
  chainId: chainId(1),
  user: address ? evmAddress(address) : undefined,
});

if (loading) return Loading…;
if (error) return Error: {error.message};

// data.totalAssets       — total GHO locked in the vault
// data.targetRate        — current fixed APR
// data.supplyCap         — maximum GHO that can be deposited
// data.paused            — whether deposits and withdrawals are blocked
// data.user?.shares      — user's sGHO shares balance
// data.user?.balance     — GHO value of the user's shares
// data.user?.maxDeposit  — max GHO the user can deposit
// data.user?.maxWithdraw — max GHO the user can withdraw
```

</tab>
<tab label="TypeScript">

Use the `sghoVault` action to read vault data.

```ts title="Vault State"
import { sghoVault } from "@aave/client/actions";
import { chainId, evmAddress } from "@aave/client";

import { client } from "./client";

const result = await sghoVault(client, {
  chainId: chainId(1),
  user: evmAddress("0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234"),
});

if (result.isErr()) {
  console.error(result.error);
} else {
  const { totalAssets, targetRate, supplyCap, paused, user } = result.value;
  console.log("Target APR:", targetRate);
  console.log("User GHO balance:", user?.balance);
}
```

</tab>
<tab label="GraphQL">

Use the `sghoVault` query to read vault data.

```graphql title="Query"
query {
  sghoVault(
    request: {
      chainId: 1
      user: "0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234" # optional
    }
  ) {
    totalAssets {
      value
      decimals
    }
    totalSupply {
      value
    }
    supplyCap {
      value
      decimals
    }
    targetRate {
      value
    }
    paused
    user {
      shares {
        value
        decimals
      }
      balance {
        value
        decimals
      }
      maxDeposit {
        value
        decimals
      }
      maxWithdraw {
        value
        decimals
      }
    }
  }
}
```

```json title="Response"
{
  "data": {
    "sghoVault": {
      "totalAssets": { "value": "50000000.0", "decimals": 18 },
      "totalSupply": { "value": "49800000.0" },
      "supplyCap": { "value": "400000000.0", "decimals": 18 },
      "targetRate": { "value": "4.25" },
      "paused": false,
      "user": {
        "shares": { "value": "995.0", "decimals": 18 },
        "balance": { "value": "1000.5", "decimals": 18 },
        "maxDeposit": { "value": "5000.0", "decimals": 18 },
        "maxWithdraw": { "value": "1000.5", "decimals": 18 }
      }
    }
  }
}
```

</tab>
</tabgroup>
## Deposit

Deposit GHO into the sGHO vault to start earning yield.

### Prepare the Execution Plan

<tabgroup>
<tab label="React">

Use the `useSghoVaultDeposit` hook to create the execution plan for depositing GHO.

```tsx title="Deposit GHO"
import { useWalletClient } from "wagmi";
import { useSghoVaultDeposit, bigDecimal, evmAddress, chainId } from "@aave/react";

// …

const { data: walletClient } = useWalletClient();

const [deposit, depositing] = useSghoVaultDeposit();

const execute = async () => {
  const result = await deposit({
    amount: {
      value: bigDecimal(1000), // 1000 GHO
    },
    depositor: evmAddress(walletClient!.account.address),
    chainId: chainId(1),
    // sharesRecipient: evmAddress("0x1234…"), // defaults to depositor
  });

  // …
};
```

</tab>
<tab label="TypeScript">

Use the `sghoVaultDeposit` action to create the execution plan.

```ts title="Deposit GHO"
import { sghoVaultDeposit, bigDecimal, evmAddress, chainId } from "@aave/client/actions";

import { client } from "./client";
import { wallet } from "./wallet";

const result = await sghoVaultDeposit(client, {
  amount: {
    value: bigDecimal(1000), // 1000 GHO
  },
  depositor: evmAddress(wallet.account.address),
  chainId: chainId(1),
});

// …
```

</tab>
<tab label="GraphQL">

Use the `sghoVaultDeposit` query to create the execution plan.

```graphql title="Query"
query {
  sghoVaultDeposit(
    request: {
      amount: { value: "1000" }
      depositor: "0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234"
      chainId: 1
      # sharesRecipient: "0x…"
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

<tabgroup>
<tab label="React">

Use the `useSendTransaction` hook for the [wallet library of your choice](/aave-v3/getting-started/react#integrations-send-aave-transactions) to send the transactions in the execution plan.

```tsx title="Viem"
import { useWalletClient } from "wagmi";
import { errAsync, useSghoVaultDeposit } from "@aave/react";
import { useSendTransaction } from "@aave/react/viem";

// …

const { data: walletClient } = useWalletClient();

const [deposit, depositing] = useSghoVaultDeposit();
const [sendTransaction, sending] = useSendTransaction(walletClient);

const loading = depositing.loading || sending.loading;
const error = depositing.error || sending.error;

// …

const execute = async () => {
  const result = await deposit({
    // …
  }).andThen((plan) => {
    switch (plan.__typename) {
      case "TransactionRequest":
        return sendTransaction(plan);

      case "ApprovalRequired":
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
    console.error("Deposit failed:", result.error);
  } else {
    console.log("Deposit successful:", result.value);
  }
};
```

</tab>
<tab label="TypeScript">

Use `sendWith` for your [chosen wallet library](/aave-v3/getting-started/typescript#integrations-send-aave-transactions) to send the transactions in the execution plan.

```ts title="Viem"
import { sghoVaultDeposit } from "@aave/client/actions";
import { sendWith } from "@aave/client/viem";

import { client } from "./client";
import { wallet } from "./wallet";

const result = await sghoVaultDeposit(client, {
  // …
}).andThen(sendWith(wallet));

if (result.isErr()) {
  console.error("Deposit failed:", result.error);
} else {
  console.log("Deposit successful:", result.value);
}
```

</tab>
<tab label="GraphQL">

If the response is a `TransactionRequest`, send it directly using the wallet associated with the `from` address.

```json title="TransactionRequest"
{
  "data": {
    "sghoVaultDeposit": {
      "__typename": "TransactionRequest",
      "to": "0x1234567890abcdef1234567890abcdef12345678",
      "from": "0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234",
      "data": "0x6e553f65000000000000000000000000000000000000000000000000000000003b9aca00000000000000000000000000742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234",
      "value": "0",
      "chainId": 1,
      "operation": "SGHO_VAULT_DEPOSIT"
    }
  }
}
```

If the response is an `ApprovalRequired`, send the `approval` transaction first, then the `originalTransaction`.

```json title="ApprovalRequired"
{
  "data": {
    "sghoVaultDeposit": {
      "__typename": "ApprovalRequired",
      "reason": "Insufficient allowance for ERC-20 token transfer",
      "requiredAmount": { "value": "1000.0", "decimals": 18 },
      "currentAllowance": { "value": "0.0", "decimals": 18 },
      "approval": {
        "to": "0x40D16FC0246aD3160Ccc09B8D0D3A2cD28aE6C2f",
        "from": "0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234",
        "data": "0x095ea7b3000000000000000000000000123456789…",
        "value": "0",
        "chainId": 1,
        "operation": null
      },
      "originalTransaction": {
        "to": "0x1234567890abcdef1234567890abcdef12345678",
        "from": "0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234",
        "data": "0x6e553f65000000000000000000000000000000000000000000000000000000003b9aca00000000000000000000000000742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234",
        "value": "0",
        "chainId": 1,
        "operation": "SGHO_VAULT_DEPOSIT"
      }
    }
  }
}
```

If the response is an `InsufficientBalanceError`, inform the user they don't have enough GHO to deposit the requested amount.

```json title="InsufficientBalanceError"
{
  "data": {
    "sghoVaultDeposit": {
      "__typename": "InsufficientBalanceError",
      "required": { "value": "1000.0", "decimals": 18 },
      "available": { "value": "750.0", "decimals": 18 }
    }
  }
}
```

</tab>
</tabgroup>

## Redeem

Redeem sGHO shares for GHO. Withdrawals are atomic with no cooldown period.

### Prepare the Execution Plan

<tabgroup>
<tab label="React">

Use the `useSghoVaultRedeemShares` hook to create the execution plan. Pass `maxRedeem: true` to redeem all shares, or `shares` for an exact amount.

```tsx title="Redeem Shares"
import { useWalletClient } from "wagmi";
import {
  useSghoVaultRedeemShares,
  bigDecimal,
  evmAddress,
  chainId,
} from "@aave/react";

// …

const { data: walletClient } = useWalletClient();

const [redeemShares, redeeming] = useSghoVaultRedeemShares();

const execute = async () => {
  const result = await redeemShares({
    amount: { maxRedeem: true }, // or: { shares: bigDecimal(1000) }
    sharesOwner: evmAddress(walletClient!.account.address),
    chainId: chainId(1),
    // recipient: evmAddress("0x1234…"), // defaults to sharesOwner
  });

  // …
};
```

</tab>
<tab label="TypeScript">

Use the `sghoVaultRedeemShares` action to create the execution plan.

```ts title="Redeem Shares"
import {
  sghoVaultRedeemShares,
  bigDecimal,
  evmAddress,
  chainId,
} from "@aave/client/actions";

import { client } from "./client";
import { wallet } from "./wallet";

const result = await sghoVaultRedeemShares(client, {
  amount: { maxRedeem: true }, // or: { shares: bigDecimal(1000) }
  sharesOwner: evmAddress(wallet.account.address),
  chainId: chainId(1),
});

// …
```

</tab>
<tab label="GraphQL">

Use the `sghoVaultRedeemShares` query to create the execution plan.

```graphql title="Query"
query {
  sghoVaultRedeemShares(
    request: {
      amount: { maxRedeem: true }
      sharesOwner: "0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234"
      chainId: 1
      # recipient: "0x…"
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

<tabgroup>
<tab label="React">

Use the `useSendTransaction` hook for the [wallet library of your choice](/aave-v3/getting-started/react#integrations-send-aave-transactions) to send the transaction.

```tsx title="Viem"
import { useWalletClient } from "wagmi";
import { errAsync, useSghoVaultRedeemShares } from "@aave/react";
import { useSendTransaction } from "@aave/react/viem";

// …

const { data: walletClient } = useWalletClient();

const [redeemShares, redeeming] = useSghoVaultRedeemShares();
const [sendTransaction, sending] = useSendTransaction(walletClient);

const loading = redeeming.loading || sending.loading;
const error = redeeming.error || sending.error;

// …

const execute = async () => {
  const result = await redeemShares({
    // …
  }).andThen((plan) => {
    switch (plan.__typename) {
      case "TransactionRequest":
        return sendTransaction(plan);

      case "InsufficientBalanceError":
        return errAsync(
          new Error(
            `Insufficient balance: ${plan.required.value} is the maximum redemption allowed.`
          )
        );
    }
  });

  if (result.isErr()) {
    console.error("Redeem failed:", result.error);
  } else {
    console.log("Redeem successful:", result.value);
  }
};
```

</tab>
<tab label="TypeScript">

Use `sendWith` for your [chosen wallet library](/aave-v3/getting-started/typescript#integrations-send-aave-transactions) to send the transaction.

```ts title="Viem"
import { sghoVaultRedeemShares } from "@aave/client/actions";
import { sendWith } from "@aave/client/viem";

import { client } from "./client";
import { wallet } from "./wallet";

const result = await sghoVaultRedeemShares(client, {
  // …
}).andThen(sendWith(wallet));

if (result.isErr()) {
  console.error("Redeem failed:", result.error);
} else {
  console.log("Redeem successful:", result.value);
}
```

</tab>
<tab label="GraphQL">

If the response is a `TransactionRequest`, send it directly using the wallet associated with the `from` address.

```json title="TransactionRequest"
{
  "data": {
    "sghoVaultRedeemShares": {
      "__typename": "TransactionRequest",
      "to": "0x1234567890abcdef1234567890abcdef12345678",
      "from": "0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234",
      "data": "0xba087652000000000000000000000000000000000000000000000000000000003b9aca00000000000000000000000000742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234",
      "value": "0",
      "chainId": 1,
      "operation": "SGHO_VAULT_REDEEM_SHARES"
    }
  }
}
```

If the response is an `InsufficientBalanceError`, inform the user they don't have enough sGHO shares to redeem.

```json title="InsufficientBalanceError"
{
  "data": {
    "sghoVaultRedeemShares": {
      "__typename": "InsufficientBalanceError",
      "required": { "value": "1000.0", "decimals": 18 },
      "available": { "value": "750.0", "decimals": 18 }
    }
  }
}
```

</tab>
</tabgroup>

## Preview

Preview the outcome of a deposit or redeem before submitting a transaction. Useful for showing users expected shares or GHO amounts in a UI.

### Preview Deposit

Returns the number of sGHO shares that would be minted for a given GHO deposit amount.

<tabgroup>
<tab label="React">

```ts title="Loading State"
const { data, loading, error } = useSghoVaultPreviewDeposit({
  amount: "1000",
  chainId: chainId(1),
});
```

```ts title="React Suspense"
const { data } = useSghoVaultPreviewDeposit({
  amount: "1000",
  chainId: chainId(1),
  suspense: true,
});
```

```tsx title="Preview Deposit"
import { useSghoVaultPreviewDeposit, chainId } from "@aave/react";

// …

const { data, loading, error } = useSghoVaultPreviewDeposit({
  amount: "1000", // GHO to deposit
  chainId: chainId(1),
});

if (loading) return Loading…;
if (error) return Error: {error.message};

// data: DecimalValue — sGHO shares to be minted
```

</tab>
<tab label="TypeScript">

```ts title="Preview Deposit"
import { sghoVaultPreviewDeposit, chainId } from "@aave/client/actions";

import { client } from "./client";

const result = await sghoVaultPreviewDeposit(client, {
  amount: "1000",
  chainId: chainId(1),
});

if (result.isOk()) {
  console.log("sGHO shares to receive:", result.value);
}
```

</tab>
<tab label="GraphQL">

```graphql title="Query"
query {
  sghoVaultPreviewDeposit(request: { amount: "1000", chainId: 1 }) {
    value
  }
}
```

</tab>
</tabgroup>
### Preview Redeem

Returns the GHO amount that would be received for redeeming a given number of sGHO shares.

<tabgroup>
<tab label="React">

```ts title="Loading State"
const { data, loading, error } = useSghoVaultPreviewRedeem({
  amount: "995",
  chainId: chainId(1),
});
```

```ts title="React Suspense"
const { data } = useSghoVaultPreviewRedeem({
  amount: "995",
  chainId: chainId(1),
  suspense: true,
});
```

```tsx title="Preview Redeem"
import { useSghoVaultPreviewRedeem, chainId } from "@aave/react";

// …

const { data, loading, error } = useSghoVaultPreviewRedeem({
  amount: "995", // sGHO shares to redeem
  chainId: chainId(1),
});

if (loading) return Loading…;
if (error) return Error: {error.message};

// data: DecimalValue — GHO amount to be received
```

</tab>
<tab label="TypeScript">

```ts title="Preview Redeem"
import { sghoVaultPreviewRedeem, chainId } from "@aave/client/actions";

import { client } from "./client";

const result = await sghoVaultPreviewRedeem(client, {
  amount: "995",
  chainId: chainId(1),
});

if (result.isOk()) {
  console.log("GHO to receive:", result.value);
}
```

</tab>
<tab label="GraphQL">

```graphql title="Query"
query {
  sghoVaultPreviewRedeem(request: { amount: "995", chainId: 1 }) {
    value
  }
}
```

</tab>
</tabgroup>
---

## Legacy sGHO

> [!WARNING]
> The Merit-based sGHO contract is being phased out. Users should withdraw GHO
> from the legacy contract and deposit into the new ERC-4626 sGHO vault to earn
> the current rate. The legacy reward rate steps down in phases until it reaches
> 0%.

The following API covers the legacy sGHO contract (Merit-based reward distribution via [Merkl](https://app.merkl.xyz/)).

### Deposit

To start earning rewards by depositing GHO into sGHO, follow these steps.

#### Prepare the Execution Plan

First, prepare the execution plan for the deposit operation.

<tabgroup>
<tab label="React">

Use the `useSavingsGhoDeposit` hook to create the execution plan for depositing GHO to sGHO.

```tsx title="Deposit GHO"
import { useWalletClient } from "wagmi";
import { useSavingsGhoDeposit, bigDecimal, evmAddress } from "@aave/react";

// …

const { data: walletClient } = useWalletClient();

const [deposit, depositing] = useSavingsGhoDeposit();

const execute = async () => {
  const result = await deposit({
    amount: {
      value: bigDecimal(1000), // 1000 GHO
    },
    depositor: evmAddress(walletClient!.account.address),
  });

  // …
};
```

</tab>
<tab label="TypeScript">

Use the `savingsGhoDeposit` action to create the execution plan for depositing GHO to sGHO.

```ts title="Deposit GHO"
import {
  savingsGhoDeposit,
  bigDecimal,
  evmAddress,
} from "@aave/client/actions";

import { client } from "./client";
import { wallet } from "./wallet";

const result = await savingsGhoDeposit(client, {
  amount: {
    value: bigDecimal(1000), // 1000 GHO
  },
  depositor: evmAddress(wallet.account.address),
});

// …
```

</tab>
<tab label="GraphQL">

Use the `savingsGhoDeposit` query to create the execution plan for depositing GHO to sGHO.

```graphql title="Query"
query {
  savingsGhoDeposit(
    request: {
      amount: { value: "1000" }
      depositor: "0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234"

      # Optional: If set, the depositor will be the recipient of the sGHO
      # recipient: "0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234"
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
#### Process the Execution Plan

Then, handle the execution plan.

<tabgroup>
<tab label="React">

Use the `useSendTransaction` hook for the [wallet library of your choice](/aave-v3/getting-started/react#integrations-send-aave-transactions) to send the transactions in the execution plan.

```tsx title="Viem"
import { useWalletClient } from "wagmi";
import { errAsync, useSavingsGhoDeposit } from "@aave/react";
import { useSendTransaction } from "@aave/react/viem";

// …

const { data: walletClient } = useWalletClient();

const [deposit, depositing] = useSavingsGhoDeposit();
const [sendTransaction, sending] = useSendTransaction(walletClient);

// …

const loading = depositing.loading || sending.loading;
const error = depositing.error || sending.error;

// …

const execute = async () => {
  const result = await deposit({
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
    console.error("Deposit failed:", result.error);
  } else {
    console.log("Deposit successful with hash:", result.value);
  }
};
```

</tab>
<tab label="TypeScript">

Use `sendWith` for your [chosen wallet library](/aave-v3/getting-started/typescript#integrations-send-aave-transactions) to send the transactions in the execution plan.

```ts title="Viem"
import { savingsGhoDeposit } from "@aave/client/actions";
import { sendWith } from "@aave/client/viem";

import { client } from "./client";
import { wallet } from "./wallet";

const result = await savingsGhoDeposit(client, {
  // …
}).andThen(sendWith(wallet));

if (result.isErr()) {
  console.error("Deposit failed:", result.error);
} else {
  console.log("Deposit successful:", result.value);
}
```

</tab>
<tab label="GraphQL">

If the response is a TransactionRequest, you can send it directly using the wallet associated with the `from` address.

```json title="TransactionRequest"
{
  "data": {
    "savingsGhoDeposit": {
      "__typename": "TransactionRequest",
      "to": "0x1234567890abcdef1234567890abcdef12345678",
      "from": "0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234",
      "data": "0x6e553f65000000000000000000000000000000000000000000000000000000003b9aca00000000000000000000000000742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234",
      "value": "0",
      "chainId": 1,
      "operation": "SAVINGS_GHO_DEPOSIT"
    }
  }
}
```

If the response is an `ApprovalRequired`, you must first send the `approval` transaction. Once it succeeds, you can then send the `originalTransaction`.

```json title="ApprovalRequired"
{
  "data": {
    "savingsGhoDeposit": {
      "__typename": "ApprovalRequired",
      "reason": "Insufficient allowance for ERC-20 token transfer",
      "requiredAmount": {
        "value": "1000.0",
        "decimals": 6
      },
      "currentAllowance": {
        "value": "0.0",
        "decimals": 6
      },
      "approval": {
        "to": "0xA0b86a33E6441c8c5f0bb9b7e5e1f8bbf5b78b5c",
        "from": "0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234",
        "data": "0x095ea7b3000000000000000000000000123456789…",
        "value": "0",
        "chainId": 1,
        "operation": null
      },
      "originalTransaction": {
        "to": "0x1234567890abcdef1234567890abcdef12345678",
        "from": "0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234",
        "data": "0x6e553f65000000000000000000000000000000000000000000000000000000003b9aca00000000000000000000000000742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234",
        "value": "0",
        "chainId": 1,
        "operation": "SAVINGS_GHO_DEPOSIT"
      }
    }
  }
}
```

If the response is an `InsufficientBalanceError`, inform the user that they don't have enough balance to deposit the requested amount.

```json title="InsufficientBalanceError"
{
  "data": {
    "savingsGhoDeposit": {
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

### Balance

Retrieve the balance of a user's sGHO.

<tabgroup>
<tab label="React">

Use the `useSavingsGhoBalance` hook to fetch the balance of a user's sGHO.

```ts title="Loading State"
const { data, loading, error } = useSavingsGhoBalance({
  user: evmAddress("0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234"),
});
```

```ts title="React Suspense"
const { data } = useSavingsGhoBalance({
  user: evmAddress("0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234"),
  suspense: true,
});
```

Fetch the balance of a user's sGHO.

```tsx title="sGHO Balance"
import { useSavingsGhoBalance, evmAddress } from "@aave/react";

// …

const { data, loading, error } = useSavingsGhoBalance({
  user: evmAddress("0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234"),
});

if (loading) {
  return Loading sGHO balance...;
}

if (error) {
  return Error: {error.message};
}

// data: TokenAmount
```

</tab>

<tab label="TypeScript">

Use the `savingsGhoBalance` action to fetch the balance of a user's sGHO.

```ts title="sGHO Balance"
import { savingsGhoBalance, evmAddress } from "@aave/client/actions";

import { client } from "./client";

const result = await savingsGhoBalance(client, {
  user: evmAddress("0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234"),
});

if (result.isErr()) {
  console.error(result.error);
} else {
  // result.value: TokenAmount
  console.log(result.value);
}
```

</tab>
<tab label="GraphQL">

Use the `savingsGhoBalance` query to fetch the balance of a user's sGHO.

```graphql title="Query"
query {
  savingsGhoBalance(
    request: { user: "0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234" }
  ) {
    usdPerToken
    amount {
      raw
      value
      decimals
    }
    usd
  }
}
```

```json title="Response"
{
  "data": {
    "savingsGhoBalance": {
      "usdPerToken": "1.0",
      "amount": {
        "raw": "100000000000000000000000000",
        "decimals": 27,
        "value": "0.1"
      },
      "usd": "100.00"
    }
  }
}
```

</tab>
</tabgroup>
### Withdraw

Withdraw sGHO to GHO instantly with no cooldown period. You can still claim any previous rewards.

Follow these steps to withdraw sGHO to GHO:

#### Prepare the Execution Plan

First, prepare the execution plan for the withdrawal operation.

<tabgroup>
<tab label="React">

Use the `useSavingsGhoWithdraw` hook to create the execution plan for withdrawing sGHO to GHO.

```tsx title="Withdraw GHO"
import { useWalletClient } from "wagmi";
import { useSavingsGhoWithdraw, bigDecimal, evmAddress } from "@aave/react";

// …

const { data: walletClient } = useWalletClient();

const [withdraw, withdrawing] = useSavingsGhoWithdraw();

const execute = async () => {
  const result = await withdraw({
    amount: {
      value: bigDecimal(1000), // 1000 sGHO
    },
    sharesOwner: evmAddress(walletClient!.account.address),
    // recipient: evmAddress("0x1234…"), if different from sharesOwner
  });

  // …
};
```

</tab>
<tab label="TypeScript">

Use the `savingsGhoWithdraw` action to create the execution plan for withdrawing sGHO to GHO.

```ts title="Withdraw GHO"
import {
  savingsGhoWithdraw,
  bigDecimal,
  evmAddress,
} from "@aave/client/actions";

import { client } from "./client";
import { wallet } from "./wallet";

const result = await savingsGhoWithdraw(client, {
  amount: {
    value: bigDecimal(1000), // 1000 sGHO
  },
  sharesOwner: evmAddress(wallet.account.address),
  // recipient: evmAddress("0x1234…"), if different from sharesOwner
});

// …
```

</tab>
<tab label="GraphQL">

Use the `savingsGhoWithdraw` query to create the execution plan for withdrawing sGHO to GHO.

```graphql title="Query"
query {
  savingsGhoWithdraw(
    request: {
      amount: { value: "1000" }
      sharesOwner: "0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234"
      # Optional: If set, the sharesOwner will be the recipient of the GHO
      # recipient: "0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234"
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
#### Process the Execution Plan

Finally, handle the execution plan.

<tabgroup>
<tab label="React">

Use the `useSendTransaction` hook for the [wallet library of your choice](/aave-v3/getting-started/react#integrations-send-aave-transactions) to send the transaction.

```tsx title="Viem"
import { useWalletClient } from "wagmi";
import {
  useSavingsGhoWithdraw,
  bigDecimal,
  evmAddress,
  errAsync,
} from "@aave/react";
import { useSendTransaction } from "@aave/react/viem";

// …

const { data: walletClient } = useWalletClient();

const [withdraw, withdrawing] = useSavingsGhoWithdraw();
const [sendTransaction, sending] = useSendTransaction(walletClient);

const loading = withdrawing.loading || sending.loading;
const error = withdrawing.error || sending.error;

// …

const execute = async () => {
  const result = await withdraw({
    amount: {
      value: bigDecimal(1000), // 1000 sGHO
    },
    sharesOwner: evmAddress(walletClient!.account.address),
    // recipient: evmAddress("0x1234…"), if different from sharesOwner
  }).andThen((plan) => {
    switch (plan.__typename) {
      case "TransactionRequest":
        return sendTransaction(plan);

      case "ApprovalRequired":
        return sendTransaction(plan.approval).andThen(() =>
          sendTransaction(plan.originalTransaction)
        );

      case "InsufficientBalanceError":
        return errAsync(
          new Error(
            `Insufficient balance to withdraw: ${plan.required.value} is the maximum withdrawal allowed.`
          )
        );
    }
  });

  if (result.isErr()) {
    console.error("Withdraw failed:", result.error);
  } else {
    console.log("Withdraw successful:", result.value);
  }
};
```

</tab>
<tab label="TypeScript">

Use `sendWith` for your [chosen wallet library](/aave-v3/getting-started/typescript#integrations-send-aave-transactions) to initiate the transaction that's part of the execution plan.

```ts title="Viem"
import { savingsGhoWithdraw } from "@aave/client/actions";
import { sendWith } from "@aave/client/viem";

import { client } from "./client";
import { wallet } from "./wallet";

const result = await savingsGhoWithdraw(client, {
  // …
}).andThen(sendWith(wallet));

if (result.isErr()) {
  console.error("Withdrawal failed:", result.error);
} else {
  console.log("Withdrawal successful:", result.value);
}
```

</tab>
<tab label="GraphQL">

If the response is a TransactionRequest, you can send it directly using the wallet associated with the `from` address.

```json title="TransactionRequest"
{
  "data": {
    "savingsGhoWithdraw": {
      "__typename": "TransactionRequest",
      "to": "0x1234567890abcdef1234567890abcdef12345678",
      "from": "0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234",
      "data": "0x6e553f65000000000000000000000000000000000000000000000000000000003b9aca00000000000000000000000000742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234",
      "value": "0",
      "chainId": 1,
      "operation": "SAVINGS_GHO_WITHDRAW"
    }
  }
}
```

If the response is an `ApprovalRequired`, you must first send the `approval` transaction. Once it succeeds, you can then send the `originalTransaction`.

```json title="ApprovalRequired"
{
  "data": {
    "savingsGhoWithdraw": {
      "__typename": "ApprovalRequired",
      "reason": "Approval for activate cooldown period",
      "requiredAmount": {
        "value": "1000.0",
        "decimals": 6
      },
      "currentAllowance": {
        "value": "0.0",
        "decimals": 6
      },
      "approval": {
        "to": "0xA0b86a33E6441c8c5f0bb9b7e5e1f8bbf5b78b5c",
        "from": "0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234",
        "data": "0x095ea7b3000000000000000000000000123456789…",
        "value": "0",
        "chainId": 1,
        "operation": null
      },
      "originalTransaction": {
        "to": "0x1234567890abcdef1234567890abcdef12345678",
        "from": "0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234",
        "data": "0x6e553f65000000000000000000000000000000000000000000000000000000003b9aca00000000000000000000000000742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234",
        "value": "0",
        "chainId": 1,
        "operation": "SAVINGS_GHO_WITHDRAW"
      }
    }
  }
}
```

If the response is an `InsufficientBalanceError`, inform the user that they don't have enough balance to withdraw the requested amount.

```json title="InsufficientBalanceError"
{
  "data": {
    "savingsGhoWithdraw": {
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

### Claiming Incentives

Users who deposit into the legacy sGHO become eligible for rewards distributed through [Merkl](https://app.merkl.xyz/).

> [!NOTE]
> These rewards are not automatically added to the sGHO balance, they must be
> claimed separately.

Users can claim rewards in two ways:

- Through the [ACI Merit UI](https://apps.aavechan.com/merit/ethereum-sgho) for a simple interface to view and claim rewards
- Using the SDK

Follow these steps to claim rewards using the SDK:

#### Fetch the Claimable Rewards

First, determine if a user has claimable rewards.

<tabgroup>
<tab label="React">

Use the `useUserMeritRewards` hook to fetch the user's sGHO claimable rewards and the transaction to claim them.

```ts title="Loading State"
const { data, loading, error } = useUserMeritRewards({
  user: EvmAddress,
  chainId: ChainId,
});
```

```ts title="React Suspense"
const { data } = useUserMeritRewards({
  user: EvmAddress,
  chainId: ChainId,
  suspense: true,
});
```

Fetch the user's claimable rewards and the transaction to claim them.

```tsx title="sGHO Rewards"
import { useUserMeritRewards, evmAddress, chainId } from "@aave/react";

// …

const sGHO_ADDRESS = evmAddress("0x1a88Df1cFe15Af22B3c4c783D4e6F7F9e0C1885d");

const { data, loading, error } = useUserMeritRewards({
  user: evmAddress("0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234"),
  chainId: chainId(1),
  filter: {
    tokens: [sGHO_ADDRESS],
  },
});

if (loading) {
  return Loading claimable rewards...;
}

if (error) {
  return Error: {error.message};
}

// data: UserMeritRewards | null
```

If `data` is `null`, the user has no sGHO claimable rewards.

</tab>
<tab label="TypeScript">

Use the `userMeritRewards` action to fetch the user's sGHO claimable rewards and the transaction to claim them.

```ts title="sGHO Rewards"
import { userMeritRewards } from "@aave/client/actions";
import { evmAddress, chainId } from "@aave/client";

import { client } from "./client";

const sGHO_ADDRESS = evmAddress("0x1a88Df1cFe15Af22B3c4c783D4e6F7F9e0C1885d");

const result = await userMeritRewards(client, {
  user: evmAddress("0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234"),
  chainId: chainId(1),
  filter: {
    tokens: [sGHO_ADDRESS],
  },
});

if (result.isErr()) {
  console.error("sGHO claim rewards error:", result.error);
} else {
  // result.value: UserMeritRewards | null
  console.log(result.value);
}
```

If `data` is `null`, the user has no sGHO claimable rewards.

</tab>
<tab label="GraphQL">

Use the `userMeritRewards` query to fetch the user's sGHO claimable rewards and the transaction to claim them.

```graphql title="Query"
query {
  userMeritRewards(
    request: {
      user: "0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234"
      chainId: 1
      filter: { tokens: ["0x1a88Df1cFe15Af22B3c4c783D4e6F7F9e0C1885d"] } # sGHO Address
    }
  ) {
    chain
    claimable {
      amount {
        usdPerToken
        usd
        amount {
          value
          decimals
          raw
        }
      }
      currency {
        address
        imageUrl
        name
        symbol
        decimals
        chainId
      }
    }
    transaction {
      to
      from
      data
      value
      chainId
      operation
    }
  }
}
```

If `data` is `null`, the user has no sGHO claimable rewards.

</tab>
</tabgroup>
#### Claim Rewards

Finally, if the user has claimable rewards, they can claim them by sending the transaction.

<tabgroup>
<tab label="React">

Use the `useSendTransaction` hook for the [wallet library of your choice](/aave-v3/getting-started/react#integrations-send-aave-transactions) to send the transactions in the execution plan.

```tsx title="Viem"
import { useWalletClient } from "wagmi";
import { useUserMeritRewards } from "@aave/react";
import { useSendTransaction } from "@aave/react/viem";

// …

const { data: walletClient } = useWalletClient();
const { data } = useUserMeritRewards({
  // …
  suspense: true,
});

const [sendTransaction, sending] = useSendTransaction(walletClient);

// …

const execute = async () => {
  if (data !== null) {
    const result = await sendTransaction(data.transaction);

    if (result.isErr()) {
      console.error(result.error.message);
    } else {
      console.log("sGHO claim rewards successful with hash:", result.value);
    }
  }
};
```

</tab>
<tab label="TypeScript">

Use `sendWith` for your [chosen wallet library](/aave-v3/getting-started/typescript#integrations-send-aave-transactions) to send the transactions in the execution plan.

```ts title="Viem"
import { userMeritRewards } from "@aave/client/actions";
import { sendWith } from "@aave/client/viem";

import { client } from "./client";
import { wallet } from "./wallet";

const sGhoRewards = await userMeritRewards(client, {
  // …
});

if (sGhoRewards.isErr()) {
  console.error(result.error);
  process.exit(1); // or eager return if in a function
}

if (!sGhoRewards.value) {
  console.log("No rewards to claim");
  process.exit(1); // or eager return if in a function
}

const result = await sendWith(wallet)(sGhoRewards.value.transaction);

if (result.isErr()) {
  console.error("Claiming sGHO rewards failed:", result.error);
} else {
  console.log("sGHO rewards claimed successfully:", result.value);
}
```

</tab>
<tab label="GraphQL">

Send the `transaction` request directly using the wallet associated with the from address.

```json title="MeritClaimRewardsTransaction"
{
  "data": {
    "userMeritRewards": {
      "chainId": 1,
      "claimable": [
        {
          "amount": {
            "usdPerToken": "1.000000000000000000",
            "usd": "1.00"
            // …
          },
          "currency": {
            "address": "0x000000000000000000000000000000000000000A",
            "name": "Example Token",
            "symbol": "EXAMPLE"
            // …
          }
        }
      ],
      "transaction": {
        "to": "0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2",
        "from": "0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234",
        "data": "0x69328dec000000000000000000000000c02…",
        "value": "0",
        "chainId": 1,
        "operation": "USER_MERIT_REWARDS"
      }
    }
  }
}
```

</tab>
</tabgroup>

For more details, see the GHO Savings Upgrade [forum post](https://governance.aave.com/t/arfc-gho-savings-upgrade/21680).

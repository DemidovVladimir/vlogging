# Position Managers

Learn how position managers automate and delegate position management with user control.

---

Position managers are smart contracts users can authorize to manage their positions, enabling automated actions like supplying, withdrawing, borrowing, and repaying — while maintaining full user control. They unlock use cases such as:

- **Automated strategies** — leverage management, yield optimization, and rebalancing
- **Vault protocols** — external protocols that aggregate and manage user positions
- **Risk management** — automated liquidation protection and position adjustments
- **Account abstraction** — smart contract wallets managing DeFi positions

> [!NOTE]
> Position managers operate strictly within the spoke’s security model: they can
> only act for users who have explicitly authorized them. Users maintain full
> control and can revoke access at any time.

## How They Work

1. **Registration** — Position managers are registered with a spoke through governance before users can enable them.
2. **Authorization** — Users explicitly enable selected managers to act on their behalf for a given position.
3. **Delegated Operations** — Authorized managers can execute position operations on behalf of users.
4. **Revocation** — Users can disable a manager at any time to revoke its access.

Each position manager is identified by its contract address and may include optional off-chain metadata, such as a name, for easier discovery.

## Built-in Position Managers

Since registration requires governance approval, custom contracts cannot register themselves as position managers. Instead, Aave v4 ships with built-in position managers that collectively expose every operation a position manager can perform. They come in two groups: gateways and delegation managers.

### Gateways

- **`NativeTokenGateway`** — enables native token support (e.g., supply and borrow ETH)
- **`SignatureGateway`** — enables [ERC-20 Permits](https://eips.ethereum.org/EIPS/eip-2612); see [Supply](./supply#advanced-usage-erc-20-permits) and [Repay](./repay#advanced-usage-erc-20-permits) for examples

Both contracts are automatically registered on every new spoke, and their addresses are available for convenience in the [spoke's](../liquidity/spokes) `chain` field:

<tabgroup>
<tab label="TypeScript">

```ts title="Spoke Highlight"
interface Spoke {
  __typename: "Spoke";
  name: string;
  address: EvmAddress;
  chain: {
    __typename: "Chain";
    // …
    nativeGateway: EvmAddress;
    signatureGateway: EvmAddress;
  };
}
```

</tab>

<tab label="GraphQL">

```graphql title="Spoke Highlight"
fragment Spoke on Spoke {
  __typename
  name
  address
  chain {
    # …
    nativeGateway
    signatureGateway
  }
}
```

</tab>
</tabgroup>
AaveKit automatically handles user authorization of these built-in position managers as part of each operation.

For example, when a user supplies native tokens (e.g., ETH):

1. The SDK requests a signature authorizing the `NativeTokenGateway` to act on the user’s behalf for that position.
2. The subsequent transaction sends ETH to the gateway.
3. The gateway wraps the ETH into WETH and supplies it to the WETH reserve in the spoke on the user’s behalf.

This process happens automatically for other operations like borrowing, withdrawing, or repaying with native tokens, as well as when using ERC-20 permits to supply or repay. The SDK manages these flows transparently — users never need to interact with position managers directly.

### Delegation Managers

Three additional managers let external contracts — vaults, automation bots, or your own flash loan contract — execute position operations on behalf of users without registering as position managers themselves:

- **`GiverPositionManager`** — supplies and repays on behalf of a user (`supplyOnBehalfOf`, `repayOnBehalfOf`). The caller provides the funds, so no per-reserve allowance is required.
- **`TakerPositionManager`** — withdraws and borrows on behalf of a user (`withdrawOnBehalfOf`, `borrowOnBehalfOf`), sending the funds to the caller. Gated by per-reserve allowances the user grants with `approveWithdraw`/`approveBorrow`, either onchain or via EIP-712 signatures.
- **`ConfigPositionManager`** — updates position configuration on behalf of a user (e.g., `setUsingAsCollateralOnBehalfOf`). Gated by permissions the user delegates per action type.

To integrate a custom contract, route position operations through these managers instead of calling the spoke directly:

1. The user [authorizes](#authorize-position-manager) the built-in manager on the spoke.
2. For taker and config operations, the user grants your contract an allowance or permission on the manager.
3. Your contract calls the manager's `…OnBehalfOf` methods to modify the user's position.

For example, a flash loan contract opening a leveraged position for a user:

```solidity title="Leverage via Built-in Managers"
import { IERC20 } from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import { IGiverPositionManager } from "aave-v4/src/position-manager/interfaces/IGiverPositionManager.sol";
import { ITakerPositionManager } from "aave-v4/src/position-manager/interfaces/ITakerPositionManager.sol";

// IGiverPositionManager giver = …
// ITakerPositionManager taker = …
// address collateralAsset = …

// Prerequisites (signed by the user, once per spoke):
// - spoke.setUserPositionManager(address(giver), true, user)
// - spoke.setUserPositionManager(address(taker), true, user)
// - taker.approveBorrow(spoke, debtReserveId, address(this), borrowAmount)

function openLeveragedPosition(
  address spoke,
  uint256 collateralReserveId,
  uint256 collateralAmount,
  uint256 debtReserveId,
  uint256 borrowAmount,
  address user
) external {
  // Supply collateral to the user's position, funded by this contract
  IERC20(collateralAsset).approve(address(giver), collateralAmount);
  giver.supplyOnBehalfOf(spoke, collateralReserveId, collateralAmount, user);

  // Borrow against it, consuming the allowance granted by the user
  taker.borrowOnBehalfOf(spoke, debtReserveId, borrowAmount, user);
}
```

The production deployments on Ethereum are:

| Contract                 | Address                                                                                                                 |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `GiverPositionManager`   | [`0x17A54b8d6D9C68e7fa1C7112AC998EA1BA51d11e`](https://etherscan.io/address/0x17A54b8d6D9C68e7fa1C7112AC998EA1BA51d11e) |
| `TakerPositionManager`   | [`0x6c044c0D3801499bCAbfAd458B70880bc518e9F7`](https://etherscan.io/address/0x6c044c0D3801499bCAbfAd458B70880bc518e9F7) |
| `ConfigPositionManager`  | [`0x51305839CE822a7b4b12AA7D86eA7005052d575c`](https://etherscan.io/address/0x51305839CE822a7b4b12AA7D86eA7005052d575c) |

The contracts live in [`aave-v4/src/position-manager`](https://github.com/aave/aave-v4/tree/v0.5.11/src/position-manager), and deployed addresses are listed under `AaveV4EthereumPositionManagers` in the [Aave Address Book](https://github.com/aave-dao/aave-address-book/blob/main/src/AaveV4Ethereum.sol).

## Available Position Managers

Get all available position managers for a specific spoke.

<tabgroup>
<tab label="React">

Use the paginated `useSpokePositionManagers` hook to fetch position managers for a spoke.

```tsx title="Loading State"
import {
  type SpokePositionManagersRequest,
  useSpokePositionManagers,
} from "@aave/react";

function SpokePositionManagersList({
  request,
}: {
  request: SpokePositionManagersRequest;
}) {
  const { data, loading, error } = useSpokePositionManagers(request);

  if (loading) return <div>Loading…</div>;

  if (error) return <div>Error: {error.message}</div>;

  // data: PaginatedSpokePositionManagerResult
  return (
    <div>
      <h3>Position Managers</h3>
      {data.items.map((manager) => (
        <div key={manager.address}>
          <h4>{manager.name}</h4>
          Address: {manager.address}
          Status: {manager.active ? "Active" : "Inactive"}
        </div>
      ))}
    </div>
  );
}
```

```tsx title="React Suspense"
import {
  type SpokePositionManagersRequest,
  useSpokePositionManagers,
} from "@aave/react";

function SpokePositionManagersList({ spoke }: { spoke: SpokeId }) {
  const { data } = useSpokePositionManagers({
    ...request,
    suspense: true,
  });

  // data: PaginatedSpokePositionManagerResult
  return (
    <div>
      <h3>Position Managers</h3>
      {data.items.map((manager) => (
        <div key={manager.address}>
          <h4>{manager.name}</h4>
          Address: {manager.address}
          Status: {manager.active ? "Active" : "Inactive"}
        </div>
      ))}
    </div>
  );
}
```

See below some examples of how to use the hook.

```tsx title="Basic Usage"
const { data, loading, error } = useSpokePositionManagers({
  spoke: spoke.id,
});
```

```tsx title="Include Inactive"
const { data, loading, error } = useSpokePositionManagers({
  spoke: spoke.id,
  includeInactive: true,
});
```

</tab>

<tab label="TypeScript">

Use the paginated `spokePositionManagers` action to fetch position managers for a spoke.

```ts title="Basic Usage"
import { Type pokeId } from "@aave/client";
import { spokePositionManagers } from "@aave/client/actions";

import { client } from "./client";

// const spoke: Spoke = …

const result = await spokePositionManagers(client, {
  spoke: spoke.id,
});

if (result.isOk()) {
  // result.value: PaginatedSpokePositionManagerResult
  result.value.items.forEach((manager) => {
    console.log(`${manager.name}: ${manager.active ? "Active" : "Inactive"}`);
  });
} else {
  console.error(result.error);
}
```

```ts title="Include Inactive"
const result = await spokePositionManagers(client, {
  spoke: spoke.id,
  includeInactive: true,
});
```

```ts title="client.ts"
import { AaveClient } from "@aave/client";

export const client = AaveClient.create();
```

</tab>

<tab label="GraphQL">

Use the `spokePositionManagers` query to fetch position managers for a spoke.

```graphql title="Basic Query"
query ($request: SpokePositionManagersRequest!) {
  spokePositionManagers(request: $request) {
    items {
      name
      address
      active
    }
    pageInfo {
      next
      prev
    }
  }
}
```

See below some examples of `SpokePositionManagersRequest` variables.

```json title="Basic Usage"
{
  "request": {
    "spoke": "SGVsbG8h",
    "pageSize": "TEN"
  }
}
```

```json title="Include Inactive"
{
  "request": {
    "spoke": "SGVsbG8h",
    "pageSize": "TEN",
    "includeInactive": true
  }
}
```

</tab>

</tabgroup>
## User's Position Managers

Get all position managers that a specific user has enabled within a spoke.

<tabgroup>
<tab label="React">

Use the paginated `useSpokeUserPositionManagers` hook to fetch position managers enabled by a user.

```tsx title="Loading State"
import {
  type EvmAddress,
  type SpokeId,
  useSpokeUserPositionManagers,
} from "@aave/react";

function UserPositionManagersList({
  spoke,
  user,
}: {
  spoke: SpokeId;
  user: EvmAddress;
}) {
  const { data, loading, error } = useSpokeUserPositionManagers({
    spoke,
    user,
  });

  if (loading) return <div>Loading…</div>;

  if (error) return <div>Error: {error.message}</div>;

  // data: PaginatedSpokeUserPositionManagerResult
  return (
    <div>
      <h3>User Position Managers</h3>
      {data.items.map((manager) => (
        <div key={manager.address}>
          <h4>{manager.name}</h4>
          Address: {manager.address}
          Approved: {manager.approvedOn.toLocaleDateString()}
          Status: {manager.active ? "Approved" : "Not Approved"}
        </div>
      ))}
    </div>
  );
}
```

```tsx title="React Suspense"
import {
  type EvmAddress,
  type SpokeId,
  useSpokeUserPositionManagers,
} from "@aave/react";

function UserPositionManagersList({
  spoke,
  user,
}: {
  spoke: SpokeId;
  user: EvmAddress;
}) {
  const { data } = useSpokeUserPositionManagers({
    spoke,
    user,
    suspense: true,
  });

  // data: PaginatedSpokeUserPositionManagerResult
  return (
    <div>
      <h3>User Position Managers</h3>
      {data.items.map((manager) => (
        <div key={manager.address}>
          <h4>{manager.name}</h4>
          Address: {manager.address}
          Approved: {manager.approvedOn.toLocaleDateString()}
          Status: {manager.active ? "Approved" : "Not Approved"}
        </div>
      ))}
    </div>
  );
}
```

</tab>

<tab label="TypeScript">

Use the paginated `spokeUserPositionManagers` action to fetch position managers enabled by a user.

```ts title="Basic Usage"
import { spokeUserPositionManagers } from "@aave/client/actions";

import { client } from "./client";

// const spoke: Spoke = …
// const user: EvmAddress = …

const result = await spokeUserPositionManagers(client, {
  spoke: spoke.id,
  user,
});

if (result.isOk()) {
  // result.value: PaginatedSpokeUserPositionManagerResult
  result.value.items.forEach((manager) => {
    console.log(
      `${manager.name}: approved on ${manager.approvedOn} (${
        manager.active ? "Approved" : "Not Approved"
      })`,
    );
  });
} else {
  console.error(result.error);
}
```

```ts title="client.ts"
import { AaveClient } from "@aave/client";

export const client = AaveClient.create();
```

</tab>

<tab label="GraphQL">

Use the `spokeUserPositionManagers` query to fetch position managers enabled by a user.

```graphql title="Basic Query"
query ($request: SpokeUserPositionManagersRequest!) {
  spokeUserPositionManagers(request: $request) {
    items {
      name
      address
      approvedOn
      active
    }
    pageInfo {
      next
      prev
    }
  }
}
```

Below is an example of a `SpokeUserPositionManagersRequest` object.

```json title="SpokeUserPositionManagersRequest"
{
  "request": {
    "spoke": "SGVsbG8h",
    "user": "0x456…",
    "pageSize": "TEN"
  }
}
```

</tab>

<tab label="Solidity">

User position managers are not enumerable onchain. However, you can check if a user has approved a specific position manager:

```solidity title="Check Position Manager Approval"
import { ISpoke } from "aave-v4/src/spoke/interfaces/ISpoke.sol";

function isPositionManagerApproved(
  address spokeAddress,
  address userAddress,
  address managerAddress
) external view returns (bool) {
  ISpoke spoke = ISpoke(spokeAddress);
  return spoke.isPositionManager(userAddress, managerAddress);
}
```

This method checks both that the position manager is active and that the user has approved it.

</tab>
</tabgroup>
## Authorize Position Manager

Authorize or revoke a position manager to act on behalf of a user within a spoke.

<tabgroup>
<tab label="React">

To enable or disable a position manager with AaveKit React, follow these steps.

### Configure Wallet Integration

First, instantiate the `useSendTransaction` hook for the [wallet library of your choice](../getting-started/react#integrations).

```tsx title="Viem"
import { useWalletClient } from "wagmi";
import { useSendTransaction } from "@aave/react/viem";

// …

const { data: wallet } = useWalletClient();
const [sendTransaction] = useSendTransaction(wallet);
```

### Define the Position Manager Flow

Use the `useSetSpokeUserPositionManager` hook to prepare the transaction request.

```tsx title="Basic Usage"
import { useSetSpokeUserPositionManager } from "@aave/react";

const [setPositionManager, { loading, error }] = useSetSpokeUserPositionManager(
  (transaction) => sendTransaction(transaction),
);
```

```tsx title="Update Component State"
import { useSetSpokeUserPositionManager } from "@aave/react";

const [status, setStatus] = useState("");

const [setPositionManager, { loading, error }] = useSetSpokeUserPositionManager(
  (transaction) => {
    setStatus("Please sign the transaction in your wallet");
    return sendTransaction(transaction).andTee(() =>
      setStatus("Enabling position manager…"),
    );
  },
);
```

```tsx title="Cancel Flow"
import { useSetSpokeUserPositionManager } from "@aave/react";

const [setPositionManager, { loading, error }] = useSetSpokeUserPositionManager(
  (transaction, { cancel }) => {
    if (window.confirm("Enable this position manager?") === false) {
      return cancel("User cancelled the operation");
    }
    return sendTransaction(transaction);
  },
);
```

### Execute the Transaction

Then, enable or disable the position manager.

```tsx title="Enable Manager"
import { type EvmAddress, type SpokeId } from "@aave/react";

const execute = async (
  spoke: SpokeId,
  manager: EvmAddress,
  user: EvmAddress,
) => {
  const result = await setPositionManager({
    spoke,
    manager,
    approve: true, // true to enable, false to disable
    user,
  });
};

// …
```

### Handle the Result

Finally, handle the result.

```tsx title="Example"
const execute = async (/* … */) => {
  const result = await setPositionManager(/* … */);

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

  console.log("Position manager enabled with hash:", result.value.txHash);
};
```

</tab>

<tab label="TypeScript">

To enable or disable a position manager with AaveKit TypeScript, follow these steps.

### Prepare the Transaction Request

First, use the `setSpokeUserPositionManager` action to prepare the transaction request.

```ts title="Enable Manager"
import { evmAddress, spokeId } from "@aave/client";
import { setSpokeUserPositionManager } from "@aave/client/actions";

import { client } from "./client";

// const spoke: Spoke = …

const result = await setSpokeUserPositionManager(client, {
  spoke: spoke.id,
  manager: evmAddress("0x456…"), // Position manager address
  approve: true, // true to enable, false to disable
  user: evmAddress("0x789…"), // User granting permission
});

// …
```

### Send the Transaction

Then, use `sendWith` for the [wallet library of your choice](../getting-started/typescript#integrations) to send the transaction, and await indexing with `client.waitForTransaction`.

```ts title="Viem"
import { setSpokeUserPositionManager } from "@aave/client/actions";
import { sendWith } from "@aave/client/viem";

import { client } from "./client";
import { wallet } from "./wallet";

const result = await setSpokeUserPositionManager(client, {
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

### Handle the Result

Finally, handle the result.

```ts title="Result Handling"
if (result.isErr()) {
  switch (result.error.name) {
    case "CancelError":
      console.log("User cancelled the operation");
      return;

    case "SigningError":
      console.error(`Failed to sign: ${result.error.message}`);
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
  console.log("Position manager enabled with hash:", result.value.txHash);
}
```

</tab>

<tab label="GraphQL">

To enable or disable a position manager with AaveKit API, follow these steps.

### Prepare the Transaction Request

Use the `setSpokeUserPositionManager` mutation to prepare the transaction request.

```graphql title="Mutation"
mutation ($request: SetSpokeUserPositionManagerRequest!) {
  setSpokeUserPositionManager(request: $request) {
    to
    from
    data
    value
    chainId
    operations
  }
}
```

Below is an example of a `SetSpokeUserPositionManagerRequest` object.

```json title="Basic Usage"
{
  "request": {
    "spoke": "SGVsbG8h",
    "manager": "0x456…",
    "approve": true,
    "user": "0x789…"
  }
}
```

### Execute the Transaction

Next, send the transaction.

The API returns a `TransactionRequest`, which you can send directly with the wallet tied to the `from` address.

```json title="TransactionRequest"
{
  "data": {
    "setSpokeUserPositionManager": {
      "to": "0x123…",
      "from": "0x789…",
      "data": "0xabcd…",
      "value": "0",
      "chainId": 1,
      "operations": ["SPOKE_SET_USER_POSITION_MANAGER"]
    }
  }
}
```

</tab>
<tab label="Solidity">

To authorize or revoke a position manager onchain, call `setUserPositionManager` on the Spoke contract.

```solidity title="Enable Position Manager"
import { ISpoke } from "aave-v4/src/spoke/interfaces/ISpoke.sol";

ISpoke spoke = ISpoke(spokeAddress);
spoke.setUserPositionManager(managerAddress, true, user);
```

```solidity title="Disable Position Manager"
import { ISpoke } from "aave-v4/src/spoke/interfaces/ISpoke.sol";

ISpoke spoke = ISpoke(spokeAddress);
spoke.setUserPositionManager(managerAddress, false, user);
```

This is useful for smart contract wallets, account abstraction implementations, and automated vault protocols that need to authorize position managers programmatically.

### Complete Example

Here's a complete example for authorizing or revoking a position manager:

```solidity title="Authorize Position Manager"
import { ISpoke } from "aave-v4/src/spoke/interfaces/ISpoke.sol";

function authorizePositionManager(
  address spokeAddress,
  address managerAddress,
  bool approve
) external {
  ISpoke spoke = ISpoke(spokeAddress);
  spoke.setUserPositionManager(managerAddress, approve, msg.sender);
}
```

</tab>
</tabgroup>

# React

AaveKit React is a collection of React hooks for building decentralized applications on top of the Aave Protocol. It provides a simple and type-safe way to interact with Aave markets, manage user positions, and execute transactions.

## Getting Started

To get started, follow the steps below.

### Install SDK

First, install the AaveKit React packages using your package manager of choice.

```bash title="npm"
npm install @aave/react@latest
```

```bash title="yarn"
yarn add @aave/react@latest
```

```bash title="pnpm"
pnpm add @aave/react@latest
```

    
### Setup Client

Then, create an `AaveClient` instance that will be used to interact with the protocol.

```ts title="client.ts"
import { AaveClient } from "@aave/react";

export const client = AaveClient.create();
```

> [!WARNING]
> You don't need to install the `@aave/client` package as it's already included
> and re-exported by the `@aave/react` package.

### Setup Provider

Next, wrap your app with the `<AaveProvider>` component and pass the client instance.

```tsx title="App.tsx"
import { AaveProvider } from "@aave/react";

import { client } from "./client";

export function App() {
  return (
    <AaveProvider client={client}>
      
    </AaveProvider>
  );
}
```

### Start Building

That's it—you can now start using AaveKit React.

```tsx title="Example"
import { useAaveChains } from "@aave/react";

export function SupportedChains() {
  const { data: chains } = useAaveChains();

  return (
    <div>
      <h2>Supported Chains</h2>
      {chains?.map((chain) => (
        <div key={chain.id}>
          <h3>{chain.name}</h3>
          Chain ID: {chain.id}
        </div>
      ))}
    </div>
  );
}
```

## Integrations

AaveKit React includes first-class support for [viem](https://viem.sh/), [ethers v6](https://docs.ethers.org/v6/), [Privy](https://docs.privy.io/wallets/using-wallets/ethereum/send-a-transaction#react), [Dynamic](https://www.dynamic.xyz/docs/react-sdk/quickstart), [thirdweb](https://portal.thirdweb.com/react/v5) and [Turnkey](https://docs.turnkey.com/sdks/react/getting-started).

<tabgroup>
<tab label="Viem">

Ensure you have `viem` package installed in your project.

```bash title="npm"
npm install viem@2
```

```bash title="yarn"
yarn add viem@2
```

```bash title="pnpm"
pnpm add viem@2
```

</tab>
<tab label="Ethers">

Ensure you have `ethers` package installed in your project.

```bash title="npm"
npm install ethers
```

```bash title="yarn"
yarn add ethers
```

```bash title="pnpm"
pnpm add ethers
```

</tab>
<tab label="Privy">

Ensure you have `viem` and `@privy-io/react-auth` packages installed in your project.

```bash title="npm"
npm install viem@2 @privy-io/react-auth
```

```bash title="yarn"
yarn add viem@2 @privy-io/react-auth
```

```bash title="pnpm"
pnpm add viem@2 @privy-io/react-auth
```

> [!NOTE]
> The `@privy-io/react-auth` package depends on `viem` package.

</tab>
<tab label="Dynamic">

Ensure you have `@dynamic-labs/sdk-react-core` and `@dynamic-labs/ethereum` packages installed in your project.

```bash title="npm"
npm install @dynamic-labs/sdk-react-core @dynamic-labs/ethereum
```

```bash title="yarn"
yarn add @dynamic-labs/sdk-react-core @dynamic-labs/ethereum
```

```bash title="pnpm"
pnpm add @dynamic-labs/sdk-react-core @dynamic-labs/ethereum
```

</tab>
<tab label="thirdweb">

Ensure you have `thirdweb` package installed in your project.

```bash title="npm"
npm install thirdweb@5
```

```bash title="yarn"
yarn add thirdweb@5
```

```bash title="pnpm"
pnpm add thirdweb@5
```

</tab>
<tab label="Turnkey">

Ensure you have `viem`, `@turnkey/viem` and `@turnkey/react-wallet-kit` packages installed in your project.

```bash title="npm"
npm install viem@2 @turnkey/viem @turnkey/react-wallet-kit
```

```bash title="yarn"
yarn add viem@2 @turnkey/viem @turnkey/react-wallet-kit
```

```bash title="pnpm"
pnpm add viem@2 @turnkey/viem @turnkey/react-wallet-kit
```

</tab>

</tabgroup>
### Send Aave Transactions

To send transactions through the connected wallet, use the `useSendTransaction` action hook.

```tsx
const [sendTransaction, { loading, error }] = useSendTransaction(/* args */);
```

This hook abstracts the wallet interaction and provides a simple interface for submitting transactions.

<tabgroup>
<tab label="Viem">

Import the `useSendTransaction` hook from the `@aave/react/viem` entry point and wire it up with the viem's `WalletClient`.

```tsx title="Viem"
import { useSendTransaction } from "@aave/react/viem";
import { useWalletClient } from "wagmi";

function MyComponent() {
  const { data: walletClient } = useWalletClient();
  const [sendTransaction, sending] = useSendTransaction(walletClient);

  // Use with transaction hooks…
}
```

> [!NOTE]
> The example uses [wagmi](https://wagmi.sh/) to get the `WalletClient` from the
> connected wallet.

</tab>
<tab label="Ethers">

Import the `useSendTransaction` hook from the `@aave/react/ethers` entry point and wire it up with the ethers's `Signer`.

```tsx title="Ethers"
import { useSendTransaction } from "@aave/react/ethers";
import { ethers } from "ethers";

const provider = new ethers.providers.Web3Provider(window.ethereum);

function MyComponent() {
  const [sendTransaction, sending] = useSendTransaction(provider.getSigner());

  // Use with transaction hooks…
}
```

</tab>
<tab label="Privy">

Import the `useSendTransaction` hook from the `@aave/react/privy` entry point.

```tsx title="Privy"
import { useSendTransaction } from "@aave/react/privy";

function MyComponent() {
  const [sendTransaction, sending] = useSendTransaction();

  // Use with transaction hooks…
}
```

</tab>
<tab label="Dynamic">

```tsx title="Dynamic"
import { useSendTransaction } from "@aave/react/viem";
import { isEthereumWallet } from "@dynamic-labs/ethereum";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { useEffect, useState } from "react";
import { WalletClient } from "viem";

function MyComponent() {
  const { primaryWallet } = useDynamicContext();
  const [walletClient, setWalletClient] = useState<WalletClient | null>(null);
  const [sendTransaction, sending] = useSendTransaction(walletClient);

  useEffect(() => {
    if (primaryWallet && isEthereumWallet(primaryWallet)) {
      primaryWallet.getWalletClient().then(setWalletClient);
    }
  }, [primaryWallet]);

  // Use with transaction hooks…
}
```

</tab>
<tab label="thirdweb">

Import the `useSendTransaction` hook from the `@aave/react/thirdweb` entry point and configure it with your thirdweb client.

```tsx title="thirdweb"
import { useSendTransaction } from "@aave/react/thirdweb";
import { createThirdwebClient } from "thirdweb";

const thirdwebClient = createThirdwebClient({
  clientId: "<YOUR_THIRDWEB_CLIENT_ID>",
});

function MyComponent() {
  const [sendTransaction, sending] = useSendTransaction(thirdwebClient);

  // Use with transaction hooks…
}
```

</tab>
<tab label="Turnkey">

Import the `useSendTransaction` hook from the `@aave/react/viem` entry point and wire it up with a viem `WalletClient` created from Turnkey's account.

```tsx title="Turnkey"
import { useSendTransaction } from "@aave/react/viem";
import { createAccount } from "@turnkey/viem";
import { useTurnkey } from "@turnkey/react-wallet-kit";
import { useEffect, useState } from "react";
import { createWalletClient, http, type WalletClient } from "viem";
import { mainnet } from "viem/chains";

function MyComponent() {
  const { httpClient, wallets, fetchWalletAccounts } = useTurnkey();
  const [walletClient, setWalletClient] = useState<WalletClient | null>(null);
  const [sendTransaction, sending] = useSendTransaction(walletClient);

  useEffect(() => {
    if (!httpClient || !wallets.length) return;
    fetchWalletAccounts({ wallet: wallets[0] }).then(async ([account]) => {
      const tkAccount = await createAccount({
        client: httpClient,
        organizationId: account.organizationId,
        signWith: account.address,
      });
      setWalletClient(
        createWalletClient({
          account: tkAccount,
          chain: mainnet,
          transport: http(),
        })
      );
    });
  }, [httpClient, wallets, fetchWalletAccounts]);

  // Use with transaction hooks…
}
```

</tab>

</tabgroup>
Then, use it as describe in the specific page.

### Sign ERC-20 Permits

Aave makes use of [EIP-2612](https://eips.ethereum.org/EIPS/eip-2612) to allow users to avoid ERC-20 approval before sending transactions.

Use the `useERC20Permit` hook to sign ERC-20 permits.

<tabgroup>
<tab label="Viem">

Import the `useERC20Permit` hook from the `@aave/react/viem` entry point and wire it up with the viem's `WalletClient`.

```tsx title="Viem"
import { useERC20Permit } from "@aave/react/viem";
import { useWalletClient } from "wagmi";

function MyComponent() {
  const { data: walletClient } = useWalletClient();
  const [signPermit, sending] = useERC20Permit(walletClient);

  // Use with transaction hooks…
}
```

> [!NOTE]
> The example uses [wagmi](https://wagmi.sh/) to get the `WalletClient` from the
> connected wallet.

</tab>
<tab label="Ethers">

Import the `useERC20Permit` hook from the `@aave/react/ethers` entry point and wire it up with the ethers's `Signer`.

```tsx title="Ethers"
import { useERC20Permit } from "@aave/react/ethers";
import { ethers } from "ethers";

const provider = new ethers.providers.Web3Provider(window.ethereum);

function MyComponent() {
  const [signPermit, sending] = useERC20Permit(provider.getSigner());

  // Use with transaction hooks…
}
```

</tab>
<tab label="Privy">

Import the `useERC20Permit` hook from the `@aave/react/privy` entry point.

```tsx title="Privy"
import { useERC20Permit } from "@aave/react/privy";

function MyComponent() {
  const [signPermit, sending] = useERC20Permit();

  // Use with transaction hooks…
}
```

</tab>
<tab label="Dynamic">

```tsx title="Dynamic"
import { useERC20Permit } from "@aave/react/viem";
import { isEthereumWallet } from "@dynamic-labs/ethereum";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { useEffect, useState } from "react";
import { WalletClient } from "viem";

function MyComponent() {
  const { primaryWallet } = useDynamicContext();
  const [walletClient, setWalletClient] = useState<WalletClient | null>(null);
  const [signPermit, sending] = useERC20Permit(walletClient);

  useEffect(() => {
    if (primaryWallet && isEthereumWallet(primaryWallet)) {
      primaryWallet.getWalletClient().then(setWalletClient);
    }
  }, [primaryWallet]);

  // Use with transaction hooks…
}
```

</tab>
<tab label="thirdweb">

Import the `useERC20Permit` hook from the `@aave/react/thirdweb` entry point.

```tsx title="thirdweb"
import { useERC20Permit } from "@aave/react/thirdweb";

function MyComponent() {
  const [signPermit, sending] = useERC20Permit();

  // Use with transaction hooks…
}
```

</tab>
<tab label="Turnkey">

Import the `useERC20Permit` hook from the `@aave/react/viem` entry point and wire it up with a viem `WalletClient` created from Turnkey's account.

```tsx title="Turnkey"
import { useERC20Permit } from "@aave/react/viem";
import { createAccount } from "@turnkey/viem";
import { useTurnkey } from "@turnkey/react-wallet-kit";
import { useEffect, useState } from "react";
import { createWalletClient, http, type WalletClient } from "viem";
import { mainnet } from "viem/chains";

function MyComponent() {
  const { httpClient, wallets, fetchWalletAccounts } = useTurnkey();
  const [walletClient, setWalletClient] = useState<WalletClient | null>(null);
  const [signPermit, sending] = useERC20Permit(walletClient);

  useEffect(() => {
    if (!httpClient || !wallets.length) return;
    fetchWalletAccounts({ wallet: wallets[0] }).then(async ([account]) => {
      const tkAccount = await createAccount({
        client: httpClient,
        organizationId: account.organizationId,
        signWith: account.address,
      });
      setWalletClient(
        createWalletClient({
          account: tkAccount,
          chain: mainnet,
          transport: http(),
        })
      );
    });
  }, [httpClient, wallets, fetchWalletAccounts]);

  // Use with transaction hooks…
}
```

</tab>
</tabgroup>
Then, use the `signPermit` function as described in the specific operation guide.

## Read Hooks

All read hooks (market data, user positions, etc.) support **two ways of operating**: loading state and React Suspense.

### Loading State

Handle loading state manually in your component:

```tsx title="Loading States"
function ChainsList() {
  const { data, loading, error } = useAaveChains();

  if (loading) return <div>Loading…</div>;

  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {data.map((chain) => (
        <div key={chain.id}>{chain.name}</div>
      ))}
    </div>
  );
}
```

### React Suspense

Let React handle loading states automatically through a [Suspense boundary](https://react.dev/reference/react/Suspense).

```tsx title="With Suspense"
// Component - no loading states needed
function ChainsList() {
  const { data: chains } = useAaveChains({
    suspense: true, // Enable suspense mode
  });

  return (
    <div>
      {chains.map((chain) => (
        <div key={chain.id}>{chain.name}</div>
      ))}
    </div>
  );
}

// Parent - wrap with Suspense boundary
function ChainsPage() {
  return (
    <Suspense fallback={<div>Loading …</div>}>
      <ChainsList />
    </Suspense>
  );
}
```

You can handle errors in the parent component by wrapping the component with a [Error boundary component](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary).

```tsx title="With Error Boundary"
import { ErrorBoundary } from "react-error-boundary";

// …

function ChainsPage() {
  return (
    <ErrorBoundary fallback={⚠️Something went wrong}>
      <Suspense fallback={<div>Loading …</div>}>
        <ChainsList />
      </Suspense>
    </ErrorBoundary>
  );
}
```

## Action Hooks

AaveKit React provides action hooks that are designed to be triggered manually when you need to perform an operation. Action hooks return an execute function and a state object.

```tsx
const [execute, state] = useActionHook();
```

### Execute Function

The `execute` function returns a `ResultAsync<T, E>`, a thenable object that represents one of two states:

- `Ok<T>`: A **successful** result containing a value of type `T`
- `Err<E>`: A **failure** containing an error of type `E`

Awaiting a `ResultAsync<T, E>` resolves to a `Result<T, E>`.

With a `Result<T, E>`, you can use the convenient `isOk()` and `isErr()` methods to check the outcome and narrow the type.  
If you have a `ResultAsync<T, E>`, you must first `await` it to access those methods.

```ts
const result = await execute();

if (result.isOk()) {
  console.log("Result:", result.value);
} else {
  console.error("Error:", result.error);
}
```

This approach avoids reliance on `try/catch` blocks and promotes predictable, type-safe code by ensuring errors are handled explicitly.

> [!NOTE]
> See the [NeverThrow documentation](https://github.com/supermacro/neverthrow)
> for more information. The NeverThrow library is re-exported for convenience.

### State Object

The state object returned by action hooks provides information about the current operation status:

```ts
const { called, data, error, loading } = state;
```

Where:

- `called`: `true` when the operation has been executed at least once, `false` otherwise
- `data`: Contains the last successful result of type `T`, `undefined` otherwise
- `error`: Contains the error of type `E` if the operation failed, `undefined` otherwise
- `loading`: `true` when the operation is in progress, `false` otherwise

## Transaction Hooks

Transaction hooks are a specific type of action hook that handle protocol interactions like supply, borrow, withdraw, repay, and more.

There are two types of transaction hooks:

- **Simple transactions** - single transactions that can be sent directly to the wallet
- **Complex transactions** - transactions that could require approval beforehand

### Simple Transactions

To handle a simple transaction hook, follow the steps below.

#### Use Hooks

First, instantiate the transaction hook and the `useSendTransaction` hook according to the [wallet provider](#integrations-send-aave-transactions) you are using.

```tsx title="Instantiate Hooks"
const [prepare, preparing] = useSimpleTransaction();
const [sendTransaction, sending] = useSendTransaction(/* … */);
```

#### Execute the Transaction

Next, execute the transaction in your app by chaining the prepare and send operations.

```ts
const result = await prepare(/* args */).andThen(sendTransaction);
```

Optionally, combine the state objects to drive your UI components.

```ts
const loading = preparing.loading && sending.loading;
const error = preparing.error || sending.error;
```

#### Handle the Result

Finally, handle the result of the operation.

```ts title="Imperative"
if (result.isErr()) {
  switch (result.error.name) {
    case "SigningError":
      // Most likely the user rejected the transaction
      console.error(`Failed to sign the transaction: ${error.message}`);
      break;

    case "TimeoutError":
      console.error(`Transaction timed out: ${error.message}`);
      break;

    case "TransactionError":
      console.error(`Transaction failed: ${error.message}`);
      break;

    case "UnexpectedError":
      console.error(error.message);
      break;
  }
} else {
  console.log("Transaction sent with hash:", result.value);
}
```

```tsx title="Declarative"
function MyComponent() {
  // …

  const loading = preparing.loading || sending.loading;
  const error = preparing.error || sending.error;

  return (
    <div>
      <button disabled={loading}>
        {loading ? "Sending…" : "Send Transaction"}
      </button>

      {error && <p style={{ color: "red" }}>{error.message}</p>}
    </div>
  );
}
```

### Complex Transactions

To handle a complex transaction hook, follow the steps below.

#### Use Hooks

First, instantiate the transaction hook and the `useSendTransaction` hook according to the [wallet provider](#integrations-send-aave-transactions) you are using.

```tsx title="Instantiate Hooks"
const [prepare, preparing] = useComplexTransaction();
const [sendTransaction, sending] = useSendTransaction(/* … */);
```

Optionally, combine the state objects to drive your UI components.

```ts
const loading = preparing.loading && sending.loading;
const error = preparing.error || sending.error;
```

#### Process the Execution Plan

Next, handle the execution plan in your transaction flow. Some operations may require token approval before executing the main transaction.

```ts
import { errAsync } from "@aave/react";

const result = await prepare(/* args */).andThen((plan) => {
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

// …
```

> [!TIP]
> If you wish to ask the user for confirmation before sending the transaction,
> you can do so by integrating your app's confirmation UI at this point.

#### Handle the Result

Finally, handle the result of the operation.

```ts title="Imperative"
if (result.isErr()) {
  switch (result.error.name) {
    case "SigningError":
      // Most likely the user rejected the transaction
      console.error(`Failed to sign the transaction: ${error.message}`);
      break;

    case "TimeoutError":
      console.error(`Transaction timed out: ${error.message}`);
      break;

    case "TransactionError":
      console.error(`Transaction failed: ${error.message}`);
      break;

    case "UnexpectedError":
      console.error(error.message);
      break;
  }
} else {
  console.log("Transaction sent with hash:", result.value);
}
```

```tsx title="Declarative"
function MyComponent() {
  // …

  const loading = preparing.loading || sending.loading;
  const error = preparing.error || sending.error;

  return (
    <div>
      <button disabled={loading}>
        {loading ? "Sending…" : "Send Transaction"}
      </button>

      {error && <p style={{ color: "red" }}>{error.message}</p>}
    </div>
  );
}
```

## Next Steps

- [Aave Markets](../markets/overview) - Learn how to interact with Aave markets.
- [Aave Earn](../vaults/overview) - Learn how to interact with Aave Earn Vaults.

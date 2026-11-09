# React

Get started with AaveKit React

---

AaveKit React for Aave v4 is a collection of React hooks for building decentralized applications on top of the Aave Protocol v4.

## Getting Started

To get started, follow the steps below.

### Install Packages

First, install the latest AaveKit React packages using your package manager of choice.

```bash title="npm"
npm install @aave/react@next
```

```bash title="yarn"
yarn add @aave/react@next
```

```bash title="pnpm"
pnpm add @aave/react@next
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

That's it—you can now start using AaveKit React. Here's a basic example to fetch supported chains:

```tsx title="Example"
import { useChains } from "@aave/react";

export function SupportedChains() {
  const { data: chains } = useChains();

  return (
    <div>
      <h2>Supported Chains</h2>
      {chains?.map((chain) => (
        <div key={chain.chainId}>
          <h3>{chain.name}</h3>
          Chain ID: {chain.chainId}
        </div>
      ))}
    </div>
  );
}
```

## Declarative Hooks

AaveKit React declarative hooks execute on render with the given inputs, **refresh when inputs change**, and **update after successful write operations**; declarative hooks support two modes: **loading state** and **React Suspense**.

<tabgroup>
<tab label="Loading State">

Handle loading state manually in your component:

```tsx title="Loading State"
import { useChains } from "@aave/react";

function ChainsList() {
  const { data, loading, error } = useChains();

  if (loading) return <div>Loading…</div>;

  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {data.map((chain) => (
        <div key={chain.chainId}>{chain.name}</div>
      ))}
    </div>
  );
}
```

</tab>
<tab label="React Suspense">

Let React handle loading states automatically through a [Suspense boundary](https://react.dev/reference/react/Suspense) by wrapping the component with a React `<Suspense>` component higher in the component tree.

```tsx title="With Suspense"
import { useChains } from "@aave/react";

function ChainsList() {
  const { data } = useChains({
    suspense: true, // Enable suspense mode
  });

  return (
    <div>
      {data.map((chain) => (
        <div key={chain.chainId}>{chain.name}</div>
      ))}
    </div>
  );
}
```

```tsx title="Ancestor Component"
import { Suspense } from "react";

function ChainsPage() {
  return (
    <Suspense fallback={<div>Loading…</div>}>
      <ChainsList />
    </Suspense>
  );
}
```

You can also handle errors in a parent component by wrapping the component with an [Error boundary](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary).

```tsx title="With Error Boundary"
import { ErrorBoundary } from "react-error-boundary";

// …

function ChainsPage() {
  return (
    <ErrorBoundary fallback={⚠️Something went wrong}>
      <Suspense fallback={<div>Loading…</div>}>
        <ChainsList />
      </Suspense>
    </ErrorBoundary>
  );
}
```

</tab>
</tabgroup>
### Pausable Reads

AaveKit React read hooks support **pausing**—a powerful pattern that lets you defer data fetching until certain conditions are met. This is particularly useful when:

- **Waiting for user input** (e.g., wallet connection, user address)
- **Conditional data loading** (e.g., only fetch when a user is authenticated)
- **Dependent data** (e.g., fetch user data only after chain selection)

Type safety is maintained by allowing nullish request parameters and returning a `paused` state, which explicitly signals when a hook is inactive and lets TypeScript precisely narrow types between paused and active states.

```tsx title="Pausable Loading State"
import { useChains } from "@aave/react";

const { data, loading, error, paused } = useChains({
  pause: !connected,
});

// …

// data: Chain[] | undefined
// loading: boolean
// error: UnexpectedError | undefined
// paused: boolean

if (paused) {
  // data: undefined
  // error: undefined
  // loading: boolean
  return null;
}

if (loading) {
  // data: undefined
  // error: undefined
  // loading: true
  return null;
}

if (error) {
  // data: undefined
  // error: UnexpectedError
  // loading: false
  return null;
}

// data: Chain[] (guaranteed to be defined)
```

```tsx title="Pausable React Suspense"
import { useChains } from "@aave/react";

const { data, paused } = useChains({
  pause: !connected,
  suspense: true,
});

// …

// data: Chain[] | undefined
// paused: boolean

if (paused) {
  // data: undefined
  return null;
}

// data: Chain[] (guaranteed to be defined)
```

### Reloading State

Declarative hooks also expose a `reloading` state that indicates when data is being **refreshed** after the initial load. This is different from `loading`, which is only `true` during the first fetch.

The `reloading` state becomes `true` when:

- **Variables change** and the hook refetches with new parameters
- **Polling triggers** a background refresh (if the hook is designed to poll)

This lets you show a subtle refresh indicator while keeping the previous data visible, rather than replacing content with a loading spinner.

```tsx title="Loading State"
import { useUserPositions } from "@aave/react";

const { data, loading, error, reloading } = useUserPositions({
  user: userAddress,
});

if (loading) {
  return <Spinner />;
}

if (error) {
  return <ErrorMessage error={error} />;
}

// Show refresh indicator while keeping data visible
return (
  <div>
    {reloading && <RefreshIndicator />}
    <PositionsList positions={data} />
  </div>
);
```

```tsx title="React Suspense"
import { useUserPositions } from "@aave/react";

const { data, reloading } = useUserPositions({
  user: userAddress,
  suspense: true,
});

// Show refresh indicator while keeping data visible
return (
  <div>
    {reloading && <RefreshIndicator />}
    <PositionsList positions={data} />
  </div>
);
```

## Imperative Hooks

AaveKit React imperative hooks return an execute function and a state object. These are tailored for when you need explicit control—like event handlers or multi‑step flows.

```tsx
const [execute, state] = useImperativeHook();
```

> [!WARNING]
> Read hooks that follow this pattern do **not** watch for updates. Prefer the
> imperative variant over the declarative one when you need on-demand, fresh
> data (e.g., in an event handler).

### Execute Function

The `execute` function takes the hook arguments and, when awaited, yields a `Result<T, E>`.

Use `isOk()` and `isErr()` to check the outcome and narrow the type:

```ts
const result = await execute();

if (result.isOk()) {
  console.log("Result:", result.value);
} else {
  console.error("Error:", result.error);
}
```

See the [Result Objects](#appendix-result-objects) section for more information about the `Result` object.

### State Object

The state object provides information about the operation status:

```ts
const { called, data, error, loading } = state;
```

Where:

- `called`: `true` once the hook has run at least once.
- `data`: last successful result of type `T`, otherwise `undefined`.
- `error`: error of type `E` if the operation failed, otherwise `undefined`.
- `loading`: `true` while the operation is in progress, otherwise `false`.

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

AaveKit React provides transaction hooks that handle protocol interactions like supply, borrow, withdraw, repay, and more.

There are two types of transaction hooks:

- **Simple transactions** - single transactions that can be sent directly to the wallet
- **Complex transactions** - transactions that could require approval beforehand

To send transactions, follow the steps below.

#### useSendTransaction

First, use the provider‑specific `useSendTransaction` hook to send transactions with the connected wallet.

```tsx
const [sendTransaction, { loading, error }] = useSendTransaction(/* args */);
```

It abstracts wallet differences and provides a consistent interface that interoperates with the other AaveKit React hooks.

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
    const setupWallet = async () => {
      if (!httpClient || !wallets.length) return;
      const accounts = await fetchWalletAccounts({ wallet: wallets[0] });
      const turnkeyAccount = await createAccount({
        client: httpClient,
        organizationId: accounts[0].organizationId,
        signWith: accounts[0].address,
      });
      setWalletClient(
        createWalletClient({
          account: turnkeyAccount,
          chain: mainnet,
          transport: http(),
        }),
      );
    };
    setupWallet();
  }, [httpClient, wallets, fetchWalletAccounts]);

  // Use with transaction hooks…
}
```

</tab>

</tabgroup>
#### Transaction Hook

Then, instantiate the specific transaction hook for the operation you want to perform.

<tabgroup>
<tab label="Simple Transactions">

Call `sendTransaction` (from `useSendTransaction`) inside the simple‑transaction hook callback, as shown below.

```tsx title="Simple Transactions"
const [sendTransaction, sending] = useSendTransaction(/* … */);
const [prepare, preparing] = useSimpleTransaction((transaction) =>
  sendTransaction(transaction),
);
```

You can bail out of the operation at any point by calling the `cancel(message)` function.

```ts title="Bail Out"
const [execute, { loading, error }] = useSimpleTransaction(
  (transaction, { cancel }) => {
    if (window.confirm("Are you sure you want to continue?") === false) {
      return cancel("User cancelled the operation");
    }
    return sendTransaction(transaction);
  },
);
```

</tab>
<tab label="Complex Transactions">

Call `sendTransaction` (from `useSendTransaction`) inside the complex transaction hook callback, as shown below.

```tsx title="Complex Transactions"
const [sendTransaction, sending] = useSendTransaction(/* … */);
const [prepare, preparing] = useComplexTransaction((plan) => {
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

You can bail out of the operation at any point by calling the `cancel(message)` function.

```ts title="Bail Out"
const [execute, { loading, error }] = useComplexTransaction(
  (plan, { cancel }) => {
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
  },
);
```

</tab>
</tabgroup>
#### Execute the Hook

Finally, execute the hook.

<tabgroup>
<tab label="Simple Transactions">

In your callback, call the `execute` function with the operation arguments and handle the result accordingly.

```tsx title="Simple Transactions"
const result = await execute(/* args */);

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
  return;
}

console.log(result.value.txHash); // TxHash
```

</tab>
<tab label="Complex Transactions">

In your callback, call the `execute` function with the operation arguments and handle the result accordingly.

```tsx title="Complex Transactions"
const result = await execute(/* args */);

if (result.isErr()) {
  switch (result.error.name) {
    case "CancelError":
      // The user cancelled the operation
      return;

    case "SigningError":
      // Most likely the user rejected the transaction
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
  return;
}

console.log(result.value.txHash); // TxHash
```

</tab>
</tabgroup>
You can also take a declarative approach by using the loading and error state objects to drive your UI.

```tsx
function MyComponent() {
  // …

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

That's it—you now know the standard approach for handling Aave transactions with AaveKit React

### Sign Typed Data

Some Aave operations require **EIP-712 typed data signatures** for the following:

- **ERC-20 Permits**: Authorize exact amount transfers without separate approval transactions
- **Swap Intents**: Sign swap orders for intent-based swaps

> [!NOTE]
> Permits are available for ERC-20 tokens that implement
> [EIP-2612](https://eips.ethereum.org/EIPS/eip-2612).

As with `useSendTransaction`, instantiate the provider-specific `useSignTypedData` hook to sign typed data.

<tabgroup>
<tab label="Viem">

Import the `useSignTypedData` hook from the `@aave/react/viem` entry point and wire it up with the viem's `WalletClient`.

```tsx title="Viem"
import { useSignTypedData } from "@aave/react/viem";
import { useWalletClient } from "wagmi";

function MyComponent() {
  const { data: walletClient } = useWalletClient();
  const [signTypedData, sending] = useSignTypedData(walletClient);

  // Use with transaction hooks…
}
```

> [!NOTE]
> The example uses [wagmi](https://wagmi.sh/) to get the `WalletClient` from the
> connected wallet.

</tab>
<tab label="Ethers">

Import the `useSignTypedData` hook from the `@aave/react/ethers` entry point and wire it up with the ethers's `Signer`.

```tsx title="Ethers"
import { useSignTypedData } from "@aave/react/ethers";
import { ethers } from "ethers";

const provider = new ethers.providers.Web3Provider(window.ethereum);

function MyComponent() {
  const [signTypedData, sending] = useSignTypedData(provider.getSigner());

  // Use with transaction hooks…
}
```

</tab>
<tab label="Privy">

Import the `useSignTypedData` hook from the `@aave/react/privy` entry point.

```tsx title="Privy"
import { useSignTypedData } from "@aave/react/privy";

function MyComponent() {
  const [signTypedData, sending] = useSignTypedData();

  // Use with transaction hooks…
}
```

</tab>
<tab label="Dynamic">

```tsx title="Dynamic"
import { useSignTypedData } from "@aave/react/viem";
import { isEthereumWallet } from "@dynamic-labs/ethereum";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { useEffect, useState } from "react";
import { WalletClient } from "viem";

function MyComponent() {
  const { primaryWallet } = useDynamicContext();
  const [walletClient, setWalletClient] = useState<WalletClient | null>(null);
  const [signTypedData, sending] = useSignTypedData(walletClient);

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

Import the `useSignTypedData` hook from the `@aave/react/thirdweb` entry point.

```tsx title="thirdweb"
import { useSignTypedData } from "@aave/react/thirdweb";

function MyComponent() {
  const [signTypedData, sending] = useSignTypedData();

  // Use with transaction hooks…
}
```

</tab>
<tab label="Turnkey">

Import the `useSignTypedData` hook from the `@aave/react/viem` entry point and wire it up with a viem `WalletClient` created from Turnkey's account.

```tsx title="Turnkey"
import { useSignTypedData } from "@aave/react/viem";
import { createAccount } from "@turnkey/viem";
import { useTurnkey } from "@turnkey/react-wallet-kit";
import { useEffect, useState } from "react";
import { createWalletClient, http, type WalletClient } from "viem";
import { mainnet } from "viem/chains";

function MyComponent() {
  const { httpClient, wallets, fetchWalletAccounts } = useTurnkey();
  const [walletClient, setWalletClient] = useState<WalletClient | null>(null);
  const [signTypedData, sending] = useSignTypedData(walletClient);

  useEffect(() => {
    const setupWallet = async () => {
      if (!httpClient || !wallets.length) return;
      const accounts = await fetchWalletAccounts({ wallet: wallets[0] });
      const turnkeyAccount = await createAccount({
        client: httpClient,
        organizationId: accounts[0].organizationId,
        signWith: accounts[0].address,
      });
      setWalletClient(
        createWalletClient({
          account: turnkeyAccount,
          chain: mainnet,
          transport: http(),
        }),
      );
    };
    setupWallet();
  }, [httpClient, wallets, fetchWalletAccounts]);

  // Use with transaction hooks…
}
```

</tab>
</tabgroup>
Then, use the `signTypedData` function as described in the specific operation guide.

---

## Appendix

### Result Objects

AaveKit uses a functional approach to error handling, it's based on `Result<T, E>` that represents one of two states:

- `Ok<T>`: A **successful** result containing a value of type `T`
- `Err<E>`: A **failure** containing an error of type `E`

```ts title="Example"
import { ok, err, Result } from "@aave/react";

function parseNumber(input: string): Result<number, string> {
  return isNaN(Number(input))
    ? err(new Error("Invalid number"))
    : ok(Number(input));
}
```

With a `Result<T, E>`, you can use the convenient `isOk()` and `isErr()` methods to check the outcome and narrow the type.

```ts
const result = parseNumber("123");

if (result.isOk()) {
  console.log(result.value); // 123
} else {
  console.error(result.error); // Error
}
```

This approach avoids reliance on `try/catch` blocks and promotes predictable, type-safe code by ensuring errors are handled explicitly.

> [!NOTE]
> AaveKit uses the [NeverThrow](https://github.com/supermacro/neverthrow)
> library as underlying implementation for the `Result` object.

`ResultAsync<T, E>` is the async, thenable variant of `Result<T, E>`. Awaiting it resolves to a `Result<T, E>`.

```ts
import { ResultAsync } from "@aave/react";

function fetchUser(id: number): ResultAsync<{ name: string }, Error> {
  return ResultAsync.fromPromise(
    fetch(`/api/users/${id}`).then((r) => r.json()),
    () => new Error("Not found"),
  );
}

const result = await fetchUser(1);

if (result.isOk()) {
  console.log(result.value); // { name: "John" }
} else {
  console.error(result.error); // Error
}
```

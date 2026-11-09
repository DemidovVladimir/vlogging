# TypeScript

Get started with AaveKit TypeScript

---

AaveKit TypeScript for Aave v4 provides a type-safe, low-level API client for interacting with Aave Protocol v4. It offers a lightweight abstraction over the GraphQL API and is ideal for server-to-server communication.

Built with a modular, functional approach inspired by the _viem client-actions architecture_, the SDK structures functionality into distinct, reusable actions focused on specific protocol features like lending, borrowing, and data retrieval.

## Getting Started

To get started, follow the steps below.

### Install SDK

First, install the `@aave/client` package using your package manager of choice.

```bash title="npm"
npm install @aave/client@next
```

```bash title="yarn"
yarn add @aave/client@next
```

```bash title="pnpm"
pnpm add @aave/client@next
```

### Create an AaveClient

Then, create an `AaveClient` instance that will be used to interact with the protocol.

```ts title="client.ts"
import { AaveClient } from "@aave/client";

export const client = AaveClient.create();
```

### Start Building

That's it—you can now start using the `@aave/client/actions` to interact with the Aave Protocol. Here's a basic example to query supported chains:

```ts title="example.ts"
import { AaveClient, ChainsFilter } from "@aave/client";
import { chains } from "@aave/client/actions";

import { client } from "./client.ts";

// Fetch all chains supported by Aave
const result = await chains(client, {
  query: { filter: ChainsFilter.ALL },
});

if (result.isOk()) {
  console.log("Chains:", result.value);
} else {
  console.error("Error:", result.error);
}
```

## Server-Side Rendering

`AaveClient` supports SSR hand-off through the `ssr` option. Create a server-side client, run your queries, serialize `client.extractData()`, then hydrate a browser client with that snapshot.

```ts title="server.ts"
import { AaveClient, type SSRData, ChainsFilter } from "@aave/client";
import { chains } from "@aave/client/actions";

const client = AaveClient.create({
  ssr: { isServer: true },
});

const result = await chains(client, {
  query: { filter: ChainsFilter.ALL },
});

const initialState: SSRData = client.extractData();
```

```ts title="client.ts"
import { AaveClient, type SSRData } from "@aave/client";

declare global {
  interface Window {
    __AAVE_SSR_DATA__?: SSRData;
  }
}

export const client = AaveClient.create({
  ssr: {
    isServer: false,
    initialState: window.__AAVE_SSR_DATA__,
  },
});
```

If the snapshot arrives after the client is created, call `client.restoreData(initialState)` to hydrate the cache later.

## Display Configuration

The optional `display` config transforms how assets are presented across queries. Transforms are applied after the cache, so the cache always stores untransformed data.

```ts title="client.ts"
import { AaveClient } from "@aave/client";

export const client = AaveClient.create({
  display: {
    // Show wrapped native tokens (e.g. WETH) as the native asset (e.g. ETH)
    showWrappedNativeReserveAsNative: true,
    // Per-asset overrides, keyed by chain ID and address
    assetOverrides: [
      {
        chainId: 1,
        address: "0xAeBf0Bb9f57E89260d57f31AF34eB58657d96Ce0",
        display: { name: "PT USDe (May 2026)", symbol: "PT USDe", icon: "https://…" },
      },
    ],
  },
});
```

- `showWrappedNativeReserveAsNative` — when `true`, wrapped native tokens are shown using the native asset's `name`, `symbol`, and `icon` within reserve contexts (`Reserve`, `HubAsset`, `Asset`). Wallet balance, reward payout, and swap queries are unaffected. The underlying `isWrappedNativeToken` flag and token `address` are preserved.
- `assetOverrides` — per-asset display overrides applied globally across all queries, keyed by `chainId` and `address`. Each entry takes a `display` object with optional `name`, `symbol`, and `icon`.

> [!NOTE]
> If both settings target the same token, `assetOverrides` takes precedence.

## Result Objects

AaveKit uses a functional approach to error handling, it's based on `Result<T, E>` that represents one of two states:

- `Ok<T>`: A **successful** result containing a value of type `T`
- `Err<E>`: A **failure** containing an error of type `E`

```ts title="Example"
import { ok, err, Result } from "@aave/client";

function parseId(s: string): Result<number, Error> {
  if (/^\d+$/.test(s)) {
    return ok(Number(s));
  }
  return err(new Error("ID must be a number"));
}
```

With a `Result<T, E>`, you can use the convenient `isOk()` and `isErr()` methods to check the outcome and narrow the type.

```ts
const result: Result<number, Error> = parseId("123");

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
import { ResultAsync } from "@aave/client";

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

Result objects can be chained:

```ts title="Chaining"
function divide(a: number, b: number): Result<number, string> {
  return b === 0 ? err("Division by zero") : ok(a / b);
}

const result = parseNumber("42").andThen((num) => divide(num, 2));

if (result.isOk()) {
  console.log("Result:", result.value);
} else {
  console.error("Error:", result.error);
}
```

You can also provide a default value if the result is an error:

```ts title="Default Value"
const value = parseNumber("invalid").unwrapOr(0); // 0
```

NeverThrow also provides a `ResultAsync` type for handling asynchronous operations. This is a _thenable object_ that can be awaited, and/or chained with other operations:

```ts title="Async"
const result = await ResultAsync.fromPromise(
  fetch("https://api.example.com/data"),
)
  .map((response) => response.json())
  .mapErr((error) => `Failed to fetch data: ${error}`);

if (result.isOk()) {
  console.log("Data:", result.value);
} else {
  console.error("Error:", result.error);
}
```

See the [NeverThrow documentation](https://github.com/supermacro/neverthrow) for more information.

## Integrations

AaveKit TypeScript includes first-class support for [viem](https://viem.sh/), [ethers v6](https://docs.ethers.org/v6/), [Privy](https://docs.privy.io/wallets/using-wallets/ethereum/send-a-transaction#nodejs), [thirdweb](https://docs.thirdweb.com/sdk/wallets/thirdweb) and [Turnkey](https://docs.turnkey.com/sdks/javascript-server) wallets.

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

Ensure you have `viem` and `@privy-io/server-auth` packages installed in your project.

```bash title="npm"
npm install viem@2 @privy-io/server-auth
```

```bash title="yarn"
yarn add viem@2 @privy-io/server-auth
```

```bash title="pnpm"
pnpm add viem@2 @privy-io/server-auth
```

> [!NOTE]
> The Aave Privy adapter uses Viem to monitor the transaction status afterwards.

</tab>
<tab label="thirdweb">

Ensure you have `thirdweb` installed in your project.

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

Ensure you have `viem`, `@turnkey/viem` and `@turnkey/sdk-server` packages installed in your project.

```bash title="npm"
npm install viem@2 @turnkey/viem @turnkey/sdk-server
```

```bash title="yarn"
yarn add viem@2 @turnkey/viem @turnkey/sdk-server
```

```bash title="pnpm"
pnpm add viem@2 @turnkey/viem @turnkey/sdk-server
```

</tab>
</tabgroup>
### Send Aave Transactions

Among the actions provided by AaveKit TypeScript, some are specifically designed to handle protocol interactions such as supplying, borrowing, withdrawing, repaying, and more.

There are two main types of transaction actions:

- **Simple transactions** – single-step transactions that can be sent directly to the wallet.
- **Complex transactions** – transactions that may require prior approvals before they can be executed.

To send transactions, follow the steps below.

#### Import the Helper

First, import the `sendWith` helper function for the wallet library of your choice.

<tabgroup>
<tab label="Viem">

Import the `sendWith` helper from the `@aave/client/viem` entry point.

```tsx title="Viem"
import { sendWith } from "@aave/client/viem";
```

</tab>
<tab label="Ethers">

Import the `sendWith` helper from the `@aave/client/ethers` entry point.

```tsx title="Ethers"
import { sendWith } from "@aave/client/ethers";
```

</tab>
<tab label="Privy">

Import the `sendWith` helper from the `@aave/client/privy` entry point.

```tsx title="Ethers"
import { sendWith } from "@aave/client/privy";
```

</tab>
<tab label="thirdweb">

Import the `sendWith` helper from the `@aave/client/thirdweb` entry point.

```tsx title="thirdweb"
import { sendWith } from "@aave/client/thirdweb";
```

</tab>
<tab label="Turnkey">

Import the `sendWith` helper from the `@aave/client/viem` entry point.

```tsx title="Turnkey"
import { sendWith } from "@aave/client/viem";
```

</tab>
</tabgroup>
#### Send the Transaction

Then, use the `sendWith` helper to send the transaction.

To demonstrate how this helper works, assume we have a transaction action named `foobar`.

```ts
import { foobar } from "@aave/client/actions";
import { client } from "./client";

const result = foobar(client);
```

```ts title="client.ts"
import { AaveClient } from "@aave/client";

export const client = AaveClient.create();
```

To send the transaction, chain the action with `sendWith` for your wallet library, then use `client.waitForTransaction` to wait until it's confirmed and indexed by AaveKit API.

```tsx title="Viem"
import { foobar } from "@aave/client/actions";
import { sendWith } from "@aave/client/viem";
import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";

import { client } from "./client";

const wallet = createWalletClient({
  account: privateKeyToAccount("<PRIVATE_KEY>"),
  transport: http(),
});

const result = foobar(client)
  .andThen(sendWith(wallet))
  .andThen(client.waitForTransaction);
```

```tsx title="Ethers"
import { foobar } from "@aave/client/actions";
import { sendWith } from "@aave/client/ethers";
import { Wallet, getDefaultProvider } from "ethers";

import { client } from "./client";

const wallet = new Wallet("<PRIVATE_KEY>", getDefaultProvider("mainnet"));

const result = foobar(client)
  .andThen(sendWith(wallet))
  .andThen(client.waitForTransaction);
```

```tsx title="Privy"
import { foobar } from "@aave/client/actions";
import { sendWith } from "@aave/client/privy";
import { PrivyClient } from "@privy-io/server-auth";

import { client } from "./client";

const privy = new PrivyClient("<PRIVY_APP_ID>", "<PRIVY_APP_SECRET>");

const result = foobar(client)
  .andThen(sendWith(privy, "<PRIVY_WALLET_ID>"))
  .andThen(client.waitForTransaction);
```

```tsx title="thirdweb"
import { foobar } from "@aave/client/actions";
import { sendWith } from "@aave/client/thirdweb";
import { createThirdwebClient } from "thirdweb";

import { client } from "./client";

const thirdwebClient = createThirdwebClient({
  secretKey: "<THIRDWEB_SECRET_KEY>",
});

const result = foobar(client)
  .andThen(sendWith(thirdwebClient))
  .andThen(client.waitForTransaction);
```

```tsx title="Turnkey"
import { foobar } from "@aave/client/actions";
import { sendWith } from "@aave/client/viem";
import { createAccount } from "@turnkey/viem";
import { Turnkey } from "@turnkey/sdk-server";
import { createWalletClient, http } from "viem";
import { mainnet } from "viem/chains";

import { client } from "./client";

const turnkeyClient = new Turnkey({
  apiBaseUrl: "https://api.turnkey.com",
  apiPrivateKey: "<TURNKEY_API_PRIVATE_KEY>",
  apiPublicKey: "<TURNKEY_API_PUBLIC_KEY>",
  defaultOrganizationId: "<TURNKEY_ORGANIZATION_ID>",
});

const turnkeyAccount = await createAccount({
  client: turnkeyClient.apiClient(),
  organizationId: "<TURNKEY_ORGANIZATION_ID>",
  signWith: "<TURNKEY_WALLET_ADDRESS>",
});

const wallet = createWalletClient({
  account: turnkeyAccount,
  chain: mainnet,
  transport: http(),
});

const result = foobar(client)
  .andThen(sendWith(wallet))
  .andThen(client.waitForTransaction);
```

#### Handle the Result

Finally, handle the result of the operation.

```ts
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
} else {
  console.log(result.value.txHash); // TxHash
}
```

That'it—you've sent the transaction.

### Sign Typed Data

Some Aave operations require **EIP-712 typed data signatures** for the following:

- **ERC-20 Permits**: Authorize exact amount transfers without separate approval transactions
- **Swap Intents**: Sign swap orders for intent-based swaps

> [!NOTE]
> Permits are available for ERC-20 tokens that implement
> [EIP-2612](https://eips.ethereum.org/EIPS/eip-2612).

<tabgroup>
<tab label="Viem">

Import the `signTypedDataWith` or `permitWith` helpers from the `@aave/client/viem` entry point.

```tsx title="Viem"
import { signTypedDataWith, permitWith } from "@aave/client/viem";
```

</tab>
<tab label="Ethers">

Import the `signTypedDataWith` or `permitWith` helpers from the `@aave/client/ethers` entry point.

```tsx title="Ethers"
import { signTypedDataWith, permitWith } from "@aave/client/ethers";
```

</tab>
<tab label="Privy">

Import the `signTypedDataWith` or `permitWith` helpers from the `@aave/client/privy` entry point.

```tsx title="Privy"
import { signTypedDataWith, permitWith } from "@aave/client/privy";
```

</tab>
<tab label="thirdweb">

Import the `signTypedDataWith` or `permitWith` helpers from the `@aave/client/thirdweb` entry point.

```tsx title="thirdweb"
import { signTypedDataWith, permitWith } from "@aave/client/thirdweb";
```

</tab>
</tabgroup>
Then, use them as described in the specific operation guide.

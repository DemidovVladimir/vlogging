# TypeScript

AaveKit TypeScript provides a type-safe, low-level API client for interacting with Aave Protocol v3. It offers a lightweight abstraction over the GraphQL API and is ideal for server-to-server communication.

Built with a modular, functional approach inspired by the _viem client-actions architecture_, the SDK structures functionality into distinct, reusable actions focused on specific protocol features like lending, borrowing, and vault management.

## Getting Started

To get started, follow the steps below.

### Install SDK

First, install the `@aave/client` package using your package manager of choice.

```bash title="npm"
npm install @aave/client@latest
```

```bash title="yarn"
yarn add @aave/client@latest
```

```bash title="pnpm"
pnpm add @aave/client@latest
```

### Create an AaveClient

Then, create an `AaveClient` instance that will be used to interact with the protocol.

```ts title="client.ts"
import { AaveClient } from "@aave/client";

export const client = AaveClient.create();
```

### Start Building

That's it—you can now start using the `@aave/client/actions` to interact with the Aave Protocol.

```ts title="example.ts"
import { AaveClient, evmAddress, chainId } from "@aave/client";
import { chains } from "@aave/client/actions";

import { client } from "./client.ts";

// Fetch all chains supported by Aave
const result = await chains(client);

if (result.isOk()) {
  console.log("Chains:", result.value);
} else {
  console.error("Error:", result.error);
}
```

## Action Return Types

AaveKit actions use a functional approach to error handling. They return a `ResultAsync<T, E>`—a thenable object that represents one of two states:

- `Ok<T>`: A **successful** result containing a value of type `T`
- `Err<E>`: A **failure** containing an error of type `E`

When you await a `ResultAsync<T, E>`, it resolves to a `Result<T, E>`.

With a `Result<T, E>`, you can use the convenient `isOk()` and `isErr()` methods to check the outcome and narrow the type.  
If you have a `ResultAsync<T, E>`, you must first `await` it to access those methods.

```ts
const result = await actionName(/* args */);

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

Let’s explore the concept with a simple example function:

```ts
function parseNumber(input: string): Result<number, string> {
  return isNaN(Number(input)) ? err("Invalid number") : ok(Number(input));
}

const result = parseNumber("42");
```

You can chain multiple operations:

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

You can also provide a default value:

```ts title="Default Value"
const value = parseNumber("invalid").unwrapOr(0); // 0
```

NeverThrow also provides a `ResultAsync` type for handling asynchronous operations. This is a _thenable object_ that can be awaited, and/or chained with other operations:

```ts title="Async"
const result = await ResultAsync.fromPromise(
  fetch("https://api.example.com/data")
)
  .map((response) => response.json())
  .mapErr((error) => `Failed to fetch data: ${error}`);

if (result.isOk()) {
  console.log("Data:", result.value);
} else {
  console.error("Error:", result.error);
}
```

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
    case "SigningError":
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

That'it—you've sent the transaction.

### Sign ERC-20 Permits

Some operations support **permit functionality** using [EIP-2612](https://eips.ethereum.org/EIPS/eip-2612) signatures to authorize ERC-20 token transfers within the same transaction.

To use permits, you'll need both the `permitTypeData` action to generate the permit data and a `signERC20PermitWith` helper specific to your wallet library.

<tabgroup>
<tab label="Viem">

Import the `signERC20PermitWith` helper from the `@aave/client/viem` entry point.

```tsx title="Viem"
import { signERC20PermitWith } from "@aave/client/viem";
```

</tab>
<tab label="Ethers">

Import the `signERC20PermitWith` helper from the `@aave/client/ethers` entry point.

```tsx title="Ethers"
import { signERC20PermitWith } from "@aave/client/ethers";
```

</tab>
<tab label="Privy">

Import the `signERC20PermitWith` helper from the `@aave/client/privy` entry point.

```tsx title="Privy"
import { signERC20PermitWith } from "@aave/client/privy";
```

</tab>
<tab label="thirdweb">

Import the `signERC20PermitWith` helper from the `@aave/client/thirdweb` entry point.

```tsx title="thirdweb"
import { signERC20PermitWith } from "@aave/client/thirdweb";
```

</tab>
<tab label="Turnkey">

Import the `signERC20PermitWith` helper from the `@aave/client/viem` entry point.

```tsx title="Turnkey"
import { signERC20PermitWith } from "@aave/client/viem";
```

</tab>
</tabgroup>
Use `permitTypeData` to generate the permit data, then chain it with your wallet-specific `signERC20PermitWith` helper:

```tsx title="Viem"
import { permitTypeData } from "@aave/client/actions";
import { signERC20PermitWith } from "@aave/client/viem";
import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";

import { client } from "./client";

const wallet = createWalletClient({
  account: privateKeyToAccount("<PRIVATE_KEY>"),
  transport: http(),
});

const result = await permitTypeData(client, {
  // permit parameters
}).andThen(signERC20PermitWith(wallet));
```

```tsx title="Ethers"
import { permitTypeData } from "@aave/client/actions";
import { signERC20PermitWith } from "@aave/client/ethers";
import { Wallet, getDefaultProvider } from "ethers";

import { client } from "./client";

const wallet = new Wallet("<PRIVATE_KEY>", getDefaultProvider("mainnet"));

const result = await permitTypeData(client, {
  // permit parameters
}).andThen(signERC20PermitWith(wallet));
```

```tsx title="Privy"
import { permitTypeData } from "@aave/client/actions";
import { signERC20PermitWith } from "@aave/client/privy";
import { PrivyClient } from "@privy-io/server-auth";

import { client } from "./client";

const privy = new PrivyClient("<PRIVY_APP_ID>", "<PRIVY_APP_SECRET>");

const result = await permitTypeData(client, {
  // permit parameters
}).andThen(signERC20PermitWith(privy, "<PRIVY_WALLET_ID>"));
```

```tsx title="thirdweb"
import { permitTypeData } from "@aave/client/actions";
import { signERC20PermitWith } from "@aave/client/thirdweb";
import { createThirdwebClient } from "thirdweb";

import { client } from "./client";

const thirdwebClient = createThirdwebClient({
  secretKey: "<THIRDWEB_SECRET_KEY>",
});

const result = await permitTypeData(client, {
  // permit parameters
}).andThen(signERC20PermitWith(thirdwebClient));
```

```tsx title="Turnkey"
import { permitTypeData } from "@aave/client/actions";
import { signERC20PermitWith } from "@aave/client/viem";
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

const result = await permitTypeData(client, {
  // permit parameters
}).andThen(signERC20PermitWith(wallet));
```

For complete permit parameter examples, refer to the specific operation documentation.

## Next Steps

- [Aave Markets](../markets/overview) - Learn how to interact with Aave markets.
- [Aave Earn](../vaults/overview) - Learn how to interact with Aave Earn Vaults.

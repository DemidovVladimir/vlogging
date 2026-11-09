> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Overview

> The Kamino SDK, API, and Rust crate provide access to Earn vaults and Borrow markets

Users deposit assets into Earn vaults or supply them to Kamino's lending markets as collateral to borrow against. Developers can integrate the same flows using the SDK's composable methods for deposits, borrows, repayments, and withdrawals.

> [!TIP]
>
> Using AI tools or building with LLMs? Use our [llms.txt](https://kamino.com/docs/llms.txt) for a structured index of the docs, and [skill.md](https://kamino.com/docs/skill.md) for Kamino's full API and SDK capability reference.

## Integrate Kamino

Developers can integrate Kamino using the REST API, the TypeScript SDK, or the Rust interface crate.

> **[REST API](https://api-docs.kamino.com/)**
>
> REST API for vault lists, performance metrics, user positions, and transaction history.

> **[TypeScript SDK](https://github.com/Kamino-Finance/klend-sdk)**
>
> Compose on-chain transactions for deposits, borrows, repayments, and withdrawals.

> **[Rust Interface Crate](https://crates.io/crates/klend-interface)**
>
> Lightweight instruction builder for Rust bots and on-chain CPI.

## Kamino Products

> **[Borrow Markets](https://kamino.com/docs/build/borrow/index.md)**
>
> Earn by supplying assets

> **[Earn Vaults](https://kamino.com/docs/build/earn/index.md)**
>
> Earn interest on assets

## Getting Started

Set up your development environment:

**1. Install SDK**

Install the Klend TypeScript SDK and Solana Kit packages.

```bash theme={null}
npm i @kamino-finance/klend-sdk @solana/kit
```

**2. Setup the RPC (optional)**

Use a private RPC for reliability. Public RPCs are often rate-limited and can cause transaction failures.

> [!NOTE]
>
> Multiple RPC providers are available. [Helius](https://www.helius.dev) is one option. @solana/kit is used for standardized RPC interactions with improved type safety and better handling of Solana transactions.

```typescript theme={null}
import { createSolanaRpc } from '@solana/kit';

const rpc = createSolanaRpc("https://api.mainnet-beta.solana.com");
```

**3. Create or Import Wallet (optional)**

Choose a method to create or import a wallet for signing transactions.

> [!NOTE]
>
> Alternatively, create a wallet using a browser wallet provider like [Phantom](https://phantom.app/).

**Create with CLI**

Use the Solana CLI to generate a new keypair file.

```bash theme={null}
solana-keygen new -o wallet.json
```

**Create with Solana Kit**

Generate a new keypair programmatically using the Solana Kit.

```typescript theme={null}
import { generateKeyPairSigner } from "@solana/kit";

const signer = await generateKeyPairSigner();
console.log("address: ", signer.address);
```

**Import Keypair File**

Import a wallet from an existing keypair file.

```typescript theme={null}
import { createKeyPairSignerFromBytes } from '@solana/kit';
import fs from 'fs';
import path from 'path';
import os from 'os';

const resolvedPath = path.resolve(
  filePath.startsWith("~") ? filePath.replace("~", os.homedir()) : filePath
);
const loadedKeyBytes = Uint8Array.from(
  JSON.parse(fs.readFileSync(resolvedPath, "utf8"))
);
const signer = await createKeyPairSignerFromBytes(loadedKeyBytes);
console.log(signer.address);
```

**Import Private Key**

Import a private key from an existing browser wallet.

```typescript theme={null}
import { createKeyPairSignerFromBytes } from '@solana/kit';

// Get your private key from browser wallet (as Uint8Array or number array)
const privateKey = new Uint8Array([/* your private key bytes */]);
const signer = await createKeyPairSignerFromBytes(privateKey);
```


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
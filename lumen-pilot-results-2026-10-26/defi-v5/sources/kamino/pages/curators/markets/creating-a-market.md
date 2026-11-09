> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Create a Market

> Initialize a new Kamino lending market

A market is created by a single transaction. The transaction initializes a `LendingMarket` account on-chain with default settings and your wallet (or a multisig) as the owner. Reserves, oracles, and feature flags are configured in subsequent steps.

The market is empty (no reserves) until you [add reserves](https://kamino.com/docs/curators/markets/adding-reserves.md), and cannot accept deposits or borrows until at least one reserve is active.

**SDK**

## Create a market via SDK

Use `KaminoManager` from `@kamino-finance/klend-sdk` to build and submit the create-market instruction.

**1. Import dependencies**

```typescript theme={null}
import {
  createSolanaRpc,
  createSolanaRpcSubscriptions,
  pipe,
  createTransactionMessage,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  appendTransactionMessageInstructions,
  signTransactionMessageWithSigners,
  sendAndConfirmTransactionFactory,
} from '@solana/kit';
import {
  KaminoManager,
  DEFAULT_RECENT_SLOT_DURATION_MS,
  PROGRAM_ID,
} from '@kamino-finance/klend-sdk';
import { parseKeypairFile } from '@kamino-finance/klend-sdk/dist/utils/signer.js';
```

**2. Initialize KaminoManager**

```typescript theme={null}
const adminSigner = await parseKeypairFile('/path/to/admin.json');

const rpc = createSolanaRpc('https://api.mainnet-beta.solana.com');
const rpcSubscriptions = createSolanaRpcSubscriptions('wss://api.mainnet-beta.solana.com');

const kaminoManager = new KaminoManager(rpc, DEFAULT_RECENT_SLOT_DURATION_MS, PROGRAM_ID);
```

> [!NOTE]
>
> Use a private RPC endpoint for production. Public RPCs are rate-limited.

**3. Build the create-market instructions**

```typescript theme={null}
const { market: marketSigner, ixs: createMarketIxs } = await kaminoManager.createMarketIxs({
  admin: adminSigner,
});

console.log('New market address:', marketSigner.address);
```

`createMarketIxs` returns:

* `market`: a `TransactionSigner` for the market account; its `address` is the new market's pubkey
* `ixs`: the instructions needed to create and initialize the market

Save the `marketSigner.address` value — every subsequent operation references it.

**4. Sign and send the transaction**

```typescript theme={null}
const { value: latestBlockhash } = await rpc
  .getLatestBlockhash({ commitment: 'finalized' })
  .send();

const transactionMessage = pipe(
  createTransactionMessage({ version: 0 }),
  (tx) => setTransactionMessageFeePayerSigner(adminSigner, tx),
  (tx) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
  (tx) => appendTransactionMessageInstructions(createMarketIxs, tx)
);

const signedTransaction = await signTransactionMessageWithSigners(transactionMessage);

await sendAndConfirmTransactionFactory({ rpc, rpcSubscriptions })(signedTransaction, {
  commitment: 'confirmed',
});

console.log('Market created:', marketSigner.address);
```

The market signer (`marketSigner`) is automatically included as a signer because `KaminoManager.createMarketIxs` returns it as a `TransactionSigner`.

### Targeting staging or devnet

Pass the staging or devnet program ID when constructing `KaminoManager`:

```typescript theme={null}
import { STAGING_PROGRAM_ID } from '@kamino-finance/klend-sdk';

const kaminoManager = new KaminoManager(rpc, DEFAULT_RECENT_SLOT_DURATION_MS, STAGING_PROGRAM_ID);
```

For devnet, point the RPC at `https://api.devnet.solana.com` and use the devnet program ID from your environment.

### Multisig from the start

If you want the market owned by a multisig from inception, pass the multisig pubkey as a noop signer for `admin`:

```typescript theme={null}
import { noopSigner, address } from '@kamino-finance/klend-sdk';

const multisigAdmin = noopSigner(address('<SQUADS_MULTISIG_PUBKEY>'));

const { market, ixs } = await kaminoManager.createMarketIxs({
  admin: multisigAdmin,
});

// Don't sign and send. Instead, encode the transaction as base58 and submit it
// as a Squads proposal. The multisig itself will sign and execute.
```

For most curators, the simpler path is to create under a hot wallet, add reserves, validate, then [transfer to a multisig](https://kamino.com/docs/curators/markets/transfer-to-multisig.md).

**API**

> [!NOTE]
>
> **Market creation is not available via the REST API.** The Kamino API supports reading market and reserve data and building user-facing deposit/borrow transactions. Market creation is an admin operation available through the **SDK** or **Kamino CLI**.

To create a market programmatically, use the **SDK** or **Kamino CLI** tabs.

For reading market data after creation, see [Read market data](https://kamino.com/docs/curators/markets/market-data.md) and the [API reference](https://kamino.com/docs/build/api-reference/introduction.md).

**Kamino CLI**

## Create a market via CLI

A market is created by a single CLI call. The command initializes a `LendingMarket` account on-chain and prints the new market's address.

> [!NOTE]
>
> Before running the command, complete the [CLI installation & setup](https://kamino.com/docs/build/cli/installation-setup.md). The CLI requires `ADMIN`, `RPC`, `KLEND_PROGRAM_ID_MAINNET`, and `KLEND_PROGRAM_ID_STAGING` in `.env`.

### Command

```bash theme={null}
yarn kamino-manager create-market --mode execute
```

That's it. The market is created against mainnet by default. Save the address from the output.

### Network selection

| Flag | Target | Notes |
| - | - | - |
| (no flag) | Mainnet | Production deployment |
| `--staging` | Staging program on Solana mainnet | Real prices, real oracles, isolated program ID |
| `--devnet` | Solana devnet | Fully isolated sandbox |

### Execution modes

Every CLI command supports four `--mode` values. Use them to validate before committing.

| Mode | What it does |
| - | - |
| `inspect` | Prints a Solana Explorer URL where you can simulate the transaction |
| `simulate` | Runs simulation server-side and prints the result |
| `execute` | Signs with the admin keypair and lands the transaction |
| `multisig` | Outputs a base58-encoded transaction for submission to a Squads proposal |

A standard production rhythm is `inspect` → `execute` (or `multisig` for production-owned markets).

### Multisig from the start

```bash theme={null}
yarn kamino-manager create-market \
  --mode multisig \
  --multisig <SQUADS_MULTISIG_PUBKEY>
```

Submit the printed base58 transaction as a Squads proposal. The multisig owns the market once the proposal executes.

## What happens on-chain

The instruction initializes a `LendingMarket` account with:

* `lending_market_owner` set to your admin
* `quote_currency` set to a default (override later via `update-lending-market-from-config`)
* All feature flags (`borrow_disabled`, `emergency_mode`, `withdraw_ticket_*`, `borrow_order_*`, `obligation_order_*`, `autodeleverage_enabled`, `immutable`) initialized to `0`
* All elevation groups empty
* Default values for liquidation tunables and minimum deposit thresholds

Every default is overridable post-creation via [Market settings](https://kamino.com/docs/curators/markets/market-settings.md).

## What's next

> **[Add reserves](https://kamino.com/docs/curators/markets/adding-reserves.md)**
>
> Add the first asset to your market with a reserve config.

> **[Configure oracles](https://kamino.com/docs/curators/markets/configuring-oracles.md)**
>
> Wire each reserve to a Scope price feed.

## Reference

* [Market config reference](https://kamino.com/docs/curators/markets/market-config-reference.md) — every editable `LendingMarket` field
* [CLI command index](https://kamino.com/docs/curators/markets/cli-command-index.md) — every market-related kamino-manager command
* [`market-operations` CLI reference](https://kamino.com/docs/build/cli/market-operations) — full flag detail


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
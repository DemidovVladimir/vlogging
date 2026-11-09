> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Transfer Ownership to a Multisig

> Move market ownership from a hot wallet to a Squads multisig

Every production market should be owned by a multisig. The recommended setup is [Squads v4](https://squads.so) with a hardware-wallet signer set and a timelock. Transfer is a deliberate two-step on-chain process designed to prevent typos from locking you out.

> [!NOTE]
>
> All Kamino-deployed markets use Squads v4 with a 12-hour timelock on SOL/BTC Market and shorter timelocks on satellite markets. Curator markets should match this posture before opening to external users.

## How the transfer works

The `LendingMarket` account has two owner-related fields:

| Field | Role |
| - | - |
| `lending_market_owner` | The active owner. Authorized to update the market and reserves. |
| `lending_market_owner_cached` | A staging slot. The current owner sets it; only that cached pubkey can finalize the swap. |

The transfer runs in two steps. First, the current owner sets `lending_market_owner_cached` to the multisig pubkey. The active owner doesn't change yet; only the staging slot moves. Second, a signer at the new owner address (the multisig itself) calls `update-lending-market-owner`, which copies the cached value into the live `lending_market_owner` and finalizes the transfer.

The split exists so a typo in the cached pubkey is recoverable: the current owner can re-set the cached field as many times as needed before promotion. Only the second step is irreversible from your side.

**SDK**

## Transfer ownership via SDK

The SDK exposes `updatePendingLendingMarketAdminIx` for step 1 and `updateLendingMarketOwnerIxs` for step 2.

**1. Initialize KaminoManager and fetch the market**

```typescript theme={null}
import {
  createSolanaRpc,
  createSolanaRpcSubscriptions,
  address,
  generateKeyPairSigner,
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
  MarketWithAddress,
  noopSigner,
} from '@kamino-finance/klend-sdk';
import { LendingMarket } from '@kamino-finance/klend-sdk/dist/@codegen/klend/accounts';
import { parseKeypairFile } from '@kamino-finance/klend-sdk/dist/utils/signer.js';

const initialAdmin = await parseKeypairFile('/path/to/current-owner.json');

const rpc = createSolanaRpc('https://api.mainnet-beta.solana.com');
const rpcSubscriptions = createSolanaRpcSubscriptions('wss://api.mainnet-beta.solana.com');

const kaminoManager = new KaminoManager(rpc, DEFAULT_RECENT_SLOT_DURATION_MS, PROGRAM_ID);

const marketAddress = address('<MARKET_ADDRESS>');
const newOwnerAddress = address('<SQUADS_MULTISIG_PUBKEY>');

const marketState = await LendingMarket.fetch(rpc, marketAddress);
if (!marketState) throw new Error('Market not found');
const marketWithAddress: MarketWithAddress = { address: marketAddress, state: marketState };
```

**2. Step 1 — cache the new owner**

```typescript theme={null}
const ix1 = kaminoManager.updatePendingLendingMarketAdminIx(
  initialAdmin,
  marketWithAddress,
  newOwnerAddress,
);

async function buildAndSendTx(signer: any, ixs: any[]) {
  const { value: blockhash } = await rpc.getLatestBlockhash({ commitment: 'finalized' }).send();
  const signed = await signTransactionMessageWithSigners(
    pipe(
      createTransactionMessage({ version: 0 }),
      (tx) => setTransactionMessageFeePayerSigner(signer, tx),
      (tx) => setTransactionMessageLifetimeUsingBlockhash(blockhash, tx),
      (tx) => appendTransactionMessageInstructions(ixs, tx)
    )
  );
  await sendAndConfirmTransactionFactory({ rpc, rpcSubscriptions })(signed, {
    commitment: 'confirmed',
  });
}

await buildAndSendTx(initialAdmin, [ix1]);
console.log('Pending admin set to', newOwnerAddress);
```

**3. Step 2 — promote the cached owner**

This step must be signed by the new owner (the multisig). For a multisig, build the transaction with `noopSigner(newOwnerAddress)` and submit it as a Squads proposal.

```typescript theme={null}
// Re-fetch the market state — its lending_market_owner_cached is now the new owner
const updatedMarketState = await LendingMarket.fetch(rpc, marketAddress);
if (!updatedMarketState) throw new Error('Market not found');
marketWithAddress.state = updatedMarketState;

const newOwnerSigner = noopSigner(newOwnerAddress);
const ix2 = kaminoManager.updateLendingMarketOwnerIxs(marketWithAddress, newOwnerSigner);

// For a hot-wallet test (e.g., on staging), if the new owner is a real keypair,
// load it as a signer and submit directly:
// const newOwnerKp = await parseKeypairFile('/path/to/new-owner.json');
// await buildAndSendTx(newOwnerKp, [ix2]);

// For a Squads multisig, encode the transaction as base58 and submit it as a proposal.
```

The full working example lives at [klend-sdk/examples/klend-examples/example\_change\_market\_admin.ts](https://github.com/Kamino-Finance/klend-sdk/blob/master/examples/klend-examples/example_change_market_admin.ts).

**API**

> [!NOTE]
>
> **Ownership transfer is not available via the REST API.** The Kamino API supports reading admin metadata; ownership transfer is an admin operation available through the **SDK** or **Kamino CLI**.

To transfer ownership, use the **SDK** or **Kamino CLI** tabs.

To inspect current ownership, query the on-chain `LendingMarket` account directly or use:

```bash theme={null}
yarn kamino-manager get-market-or-vault-admin-info --address <MARKET_ADDRESS>
```

**Kamino CLI**

## Transfer ownership via CLI

### Step 1 — cache the new owner

```bash theme={null}
yarn kamino-manager download-lending-market-config \
  --lending-market <MARKET_ADDRESS>
```

Edit the downloaded config at `./configs/<MARKET_ADDRESS>/market-<MARKET_ADDRESS>.json`, set:

```jsonc theme={null}
{
  "lending_market_owner_cached": "<SQUADS_MULTISIG_PUBKEY>"
}
```

Inspect, then apply:

```bash theme={null}
yarn kamino-manager update-lending-market-from-config \
  --lending-market <MARKET_ADDRESS> \
  --lending-market-config-path ./configs/<MARKET_ADDRESS>/market-<MARKET_ADDRESS>.json \
  --mode inspect

yarn kamino-manager update-lending-market-from-config \
  --lending-market <MARKET_ADDRESS> \
  --lending-market-config-path ./configs/<MARKET_ADDRESS>/market-<MARKET_ADDRESS>.json \
  --mode execute
```

### Step 2 — promote the cached owner

This step must be signed by the multisig (the address you cached in Step 1). From the multisig, propose a transaction that calls `update-lending-market-owner`:

```bash theme={null}
yarn kamino-manager update-lending-market-owner \
  --lending-market <MARKET_ADDRESS> \
  --mode multisig \
  --multisig <SQUADS_MULTISIG_PUBKEY>
```

The CLI prints a base58 transaction. Submit it as a Squads proposal, collect signatures, execute. After execution, `lending_market_owner` equals your multisig.

> [!WARNING]
>
> After Step 2 completes, the original hot wallet has no authority over the market. Verify the multisig signer set, the threshold, and the timelock before promoting. The program does not enforce a recovery path if you lose access to the multisig.

### All subsequent operations use multisig mode

```bash theme={null}
yarn kamino-manager update-reserve-config \
  --reserve <RESERVE_ADDRESS> \
  --reserve-config-path ./configs/config.json \
  --mode multisig \
  --multisig <SQUADS_MULTISIG_PUBKEY>
```

The CLI returns the base58 transaction. Submit, sign, wait out the timelock, execute.

## Setting up the Squads multisig

A short walkthrough; full documentation lives at [Squads docs](https://docs.squads.so).

**1. Create the Squad**

On [squads.so](https://squads.so), create a new Squad. Choose your signer set (hardware wallets recommended for production) and a signature threshold (e.g., 3-of-5).

**2. Configure a timelock**

In Squad settings, enable a transaction timelock. Kamino's reference is 12h for SOL/BTC Market, 4h for satellite markets. Pick the value that fits your operational tempo and incident-response posture.

**3. Fund the Squad**

Send a small amount of SOL to the Squad's vault address to cover transaction fees on proposals.

**4. Note the Squad pubkey**

Use the Squad's vault address as the multisig pubkey passed to the SDK / CLI.

## Verifying transactions before signing

A common pattern among security-conscious curators is to recompute the transaction locally and compare its hash to the proposal in Squads. Before signing a proposal:

1. Re-run the same SDK code (or CLI command with `--mode multisig`)
2. Compare the printed base58 transaction to what's surfaced in the Squads UI
3. Sign only if the bytes match exactly

This guards against compromised proposals.

## Rotating the multisig later

To move ownership to a new multisig after the first transfer is complete, repeat the two-step flow:

1. The current multisig submits a proposal that updates `lending_market_owner_cached` to the new multisig.
2. The new multisig submits a proposal that calls `update-lending-market-owner`.

The same protections apply: you can re-set the cached field as many times as you want before the second step finalizes.

## Reference

* [Market settings](https://kamino.com/docs/curators/markets/market-settings.md) — the broader market-level config flow
* [Market config reference](https://kamino.com/docs/curators/markets/market-config-reference.md) — `lending_market_owner` and `lending_market_owner_cached` fields
* [`market-operations` CLI reference](https://kamino.com/docs/build/cli/market-operations) — full CLI flag detail
* [Squads docs](https://docs.squads.so)


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
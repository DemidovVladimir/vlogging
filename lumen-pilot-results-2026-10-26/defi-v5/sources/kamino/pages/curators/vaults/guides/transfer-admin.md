> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Transfer admin to multisig

> Move your vault to Squads multisig control — required before going to production

Production vaults run under a [Squads](https://squads.so) multisig — every state-changing operation flows through a proposal and approval. This guide walks through transferring Vault Admin to a multisig and the operating model afterwards. For the model and role definitions, see [Roles & ownership](https://kamino.com/docs/curators/vaults/concepts/roles-and-ownership.md).

## Why transfer

* **Operational security.** No single key can move vault funds.
* **Required for UI listing.** Kamino's UI lists only multisig-controlled vaults that also have [Whitelisted Reserves](https://kamino.com/docs/curators/vaults/guides/enable-whitelisted-reserves.md) enabled.
* **Required for the Insurance Pool match.** Kamino's match program requires multisig control.

## Before you start

You'll need:

* The Squads multisig address that will hold Vault Admin.
* The current Vault Admin keypair (or signing access).

## The two-step transfer

Transfer uses an initiate-then-claim pattern to prevent accidental ownership changes.

```
[ current admin ]   initiate transfer    [ pending admin set ]   claim    [ multisig holds vault ]
       ●  ─────────────────────────────►        ●               ──────►            ●
                                              │                                    
                                              │  current admin can cancel
                                              ▼
                                          [ unchanged ]
```

The current admin can cancel the pending transfer until the new admin claims. After claim, the previous admin has no privileges.

**UI**

**1. Initiate transfer**

On `kamino.com/curators/vaults`, open your vault's settings → Admin Management. Set the new admin to your Squads multisig address. Sign the transaction. The vault enters the pending state.

**2. Claim transfer (from the multisig)**

The new admin (Squads multisig) submits an accept-ownership transaction. This is a Squads proposal that members approve and execute via the Squads dashboard.

**SDK**

```typescript theme={null}
import { KaminoManager, KaminoVault } from '@kamino-finance/klend-sdk';
import { address } from '@solana/kit';

const vault = new KaminoVault(rpc, address('<VAULT_ADDRESS>'));
const manager = new KaminoManager(rpc);

// Step 1 — current admin initiates transfer
const { updateVaultConfigIx, updateLUTIxs } =
  await manager.updateVaultPendingAdminIxs(
    vault,
    address('<SQUADS_MULTISIG_PUBKEY>'),
    adminSigner,
  );
// Build and send: [updateVaultConfigIx, ...updateLUTIxs]

// Step 2 — new admin (multisig) claims
const { acceptVaultOwnershipIx, initNewLUTIx } =
  await manager.acceptVaultOwnershipIxs(vault);
// Build and send: [acceptVaultOwnershipIx, initNewLUTIx]
// This must run as the new admin — for a Squads multisig, route through Squads.
```

**CLI**

**Step 1 — initiate transfer (run as current admin):**

```bash theme={null}
yarn kamino-manager update-vault-pending-admin \
  --vault <VAULT_ADDRESS> \
  --new-admin <SQUADS_MULTISIG_PUBKEY> \
  --mode execute
```

**Step 2 — accept ownership:**

```bash theme={null}
yarn kamino-manager accept-ownership \
  --vault <VAULT_ADDRESS> \
  --mode execute
```

For Squads-controlled multisigs, step 2 is executed through the Squads interface as a proposal rather than a direct CLI call. To produce the encoded transaction for the proposal:

```bash theme={null}
yarn kamino-manager accept-ownership \
  --vault <VAULT_ADDRESS> \
  --mode multisig \
  --multisig <MULTISIG_PUBKEY>
```

## Operating after transfer

Once the multisig holds Vault Admin, every state-changing operation becomes a Squads proposal. Two flows:

### SquadsX (recommended)

Sign in to `kamino.com/curators/vaults` with [SquadsX](https://squads.so). The Send action automatically generates the transaction, creates the proposal, and routes it to the multisig dashboard for approval.

### Encoded transaction

If you're not using SquadsX:

1. Configure the change on `kamino.com/curators/vaults`.
2. Click Simulate to verify and review the resulting state.
3. Copy the Base58-encoded transaction string from the simulation output.
4. Open Squads and import the transaction.
5. Gather approvals and execute.

Programmatic operations follow the same pattern. SDK methods produce instructions that are wrapped into transactions you submit through Squads. CLI commands accept `--mode multisig --multisig <pubkey>` to emit a Base58 payload.

## Allocation Admin transfer (optional)

The Allocation Admin role is **single-step** — the Vault Admin sets it directly with no claim. Use this to delegate allocation management to a non-multisig wallet (e.g. an automated rebalancer) without granting full vault control.

**UI**

Set under your vault's Admin Management settings. Single transaction.

**SDK**

Use `kaminoManager.updateVaultAllocationAdminIxs(vault, newAdmin, signer)`.

To revoke, set the Allocation Admin back to the default pubkey or to the Vault Admin itself.

## What's next

> **[Roles & ownership](https://kamino.com/docs/curators/vaults/concepts/roles-and-ownership.md)**
>
> The full role model and operating-under-multisig flows.

> **[Enable Whitelisted Reserves](https://kamino.com/docs/curators/vaults/guides/enable-whitelisted-reserves.md)**
>
> The other prerequisite for Kamino UI listing.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
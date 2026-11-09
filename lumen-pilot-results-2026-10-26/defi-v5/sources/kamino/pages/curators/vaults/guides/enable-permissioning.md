> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Enable permissioning

> Switch your vault into permissioned mode and manage the depositor allowlist via the kperm program

This guide walks through switching a vault into permissioned mode and managing the depositor allowlist. For the conceptual model — the cosigner pattern, the on-chain pieces, and what each operation gates — read [Permissioned vaults](https://kamino.com/docs/curators/vaults/concepts/permissioned-vaults.md) first.

> [!NOTE]
>
> kperm is live for Kamino lending markets today. Vault-side support ships with the next kvault release; the SDK, CLI, and on-chain mechanics described here mirror the existing [permissioned markets](https://kamino.com/docs/curators/markets/permissioned-markets.md) flow.

## Before you start

You'll need:

* An existing vault. See [Create a vault](https://kamino.com/docs/curators/vaults/guides/create-a-vault.md).
* The vault admin keypair, or — in production — a Squads multisig with the admin role. See [Transfer admin to multisig](https://kamino.com/docs/curators/vaults/guides/transfer-admin.md).
* A list of wallet addresses to whitelist, or an automated source feeding them (e.g. a KYC backend that signals verified wallets to your service).

## Curator workflow

**1. Decide what to permission**

For most vaults, the answer is `DEPOSIT`. That gates entry; withdrawals remain open so depositors can always redeem their shares. Add `KEYRING` if your gating logic lives in an external policy program. You can change the gated set later by re-running the update with a different bitfield.

**2. Switch the vault into permissioned mode**

Set `permissioning_authority` to the Vault Permissioner PDA and `permissioned_ops` to the chosen bitfield. From this point, kvault requires the kperm cosigner for every gated action.

**3. Whitelist users**

Use the SDK, CLI, or REST API (see tabs below). All three issue the same `init_user_permission` (first grant) or `update_user_permission` (subsequent grants) instruction on-chain.

**4. Test the rejection path**

Send a deposit transaction from an un-whitelisted wallet on staging and confirm it reverts. Add that wallet to the allowlist and retry — it should succeed.

**SDK**

## Configure permissioning via SDK

The kperm-aware methods live in `@kamino-finance/klend-sdk` alongside `KaminoManager` and `KaminoVault`.

### Curator: switch the vault into permissioned mode

```typescript theme={null}
import {
  KaminoManager,
  KaminoVault,
  DEFAULT_RECENT_SLOT_DURATION_MS,
  PermissionedOp,
  getVaultPermissionerPda,
} from '@kamino-finance/klend-sdk';
import { PROGRAM_ID as KPERM_PROGRAM_ID } from '@kamino-finance/klend-sdk/dist/@codegen/kperm/programId';
import { address } from '@solana/kit';

const kaminoManager = new KaminoManager(rpc, DEFAULT_RECENT_SLOT_DURATION_MS);

const vaultAddress = address('<VAULT_ADDRESS>');
const vault = new KaminoVault(rpc, vaultAddress);

const vaultPermissioner = await getVaultPermissionerPda(vaultAddress, KPERM_PROGRAM_ID);
const permissionedOpsBitfield = PermissionedOp.fromString('DEPOSIT');

const ixs = await kaminoManager.updateVaultPermissionIxs(
  adminSigner,
  vault,
  vaultPermissioner,
  permissionedOpsBitfield,
);
// submit each ix in order
```

`PermissionedOp.fromString` accepts pipe-separated names: `'DEPOSIT'`, `'DEPOSIT|KEYRING'`, etc.

### Whitelist a user (initial grant or update)

```typescript theme={null}
import { initPermissionIx, updatePermissionIx, getPermissionPda } from '@kamino-finance/klend-sdk';
import { UserPermission } from '@kamino-finance/klend-sdk/dist/@codegen/kperm/accounts';

const userAddress = address('<USER_WALLET>');
const grantedOps = PermissionedOp.fromString('DEPOSIT');

const userPermissionPda = await getPermissionPda(vaultAddress, userAddress, KPERM_PROGRAM_ID);
const existing = await UserPermission.fetch(rpc, userPermissionPda, KPERM_PROGRAM_ID);

const ix = existing
  ? await updatePermissionIx(globalAdminSigner, vaultAddress, userAddress, grantedOps, /* overwrite */ false)
  : await initPermissionIx(globalAdminSigner, vaultAddress, userAddress, grantedOps);
// Sign and submit with the global admin's signer
```

`updatePermissionIx` takes an `overwrite` flag: `true` replaces the user's allowed ops with `grantedOps`; `false` bitwise-ORs `grantedOps` into the existing set.

### Revoke a user

```typescript theme={null}
import { removePermissionIx } from '@kamino-finance/klend-sdk';

const ix = await removePermissionIx(globalAdminSigner, vaultAddress, userAddress, KPERM_PROGRAM_ID);
// Sign and submit
```

The `UserPermission` account stays on-chain with `permissioned_ops = 0`. Re-granting later avoids paying rent again.

### User flow: deposit into a permissioned vault

The standard vault deposit builders detect when the target vault is permissioned and automatically wrap the produced kvault instructions with `permissioned_fwd_to_kvault`. Apps integrating against a permissioned vault continue to call the standard deposit builders — the SDK handles the wrap.

For instructions built outside of the standard builders, wrap manually:

```typescript theme={null}
import { permissionedFwdToKvault } from '@kamino-finance/klend-sdk/dist/@codegen/kperm/instructions';
import { KVAULT_PROGRAM_ID, getPermissionPda } from '@kamino-finance/klend-sdk';

const userPermissionPda = await getPermissionPda(vaultAddress, userSigner.address, KPERM_PROGRAM_ID);

const wrapped = permissionedFwdToKvault(
  { ixData: kvaultIx.data },
  {
    user: userSigner,
    targetProgram: KVAULT_PROGRAM_ID,
    userPermission: userPermissionPda,
  },
  /* remainingAccounts = */ [...kvaultIx.accounts],
  KPERM_PROGRAM_ID,
);
// Submit `wrapped` as the user's transaction
```

**API**

## Programmatic whitelisting via REST API

Kamino exposes a REST API that issues the on-chain `init_user_permission`, `update_user_permission`, and `remove_user_permission` instructions on the curator's behalf. Intended use: automated onboarding — KYC provider attests → backend marks the user verified → backend calls the API → the wallet is allowed on the target vault within seconds.

The API takes the same inputs as the SDK and CLI:

* Vault address
* User wallet address
* Operations to grant (any combination of `DEPOSIT`, `KEYRING`)

Signing is handled by the kperm global admin which the API operates against on your behalf for whitelisted vaults.

> [!NOTE]
>
> API base URL, authentication, and exact request schemas are not yet publicly documented. Coordinate with the Kamino team to obtain access for your vault.

**Kamino CLI**

## Configure permissioning via CLI

### Switch the vault into permissioned mode

```bash theme={null}
yarn kamino-manager update-vault-permission \
  --vault <VAULT_ADDRESS> \
  --operations "DEPOSIT" \
  --mode execute
```

In one call, the command sets `permissioning_authority` to the Vault Permissioner PDA and sets `permissioned_ops` to the bitfield parsed from `--operations`. Operations are pipe-separated and case-insensitive: `DEPOSIT`, `KEYRING`.

To change the gated set later, re-run with the desired bitfield.

### Whitelist a user

```bash theme={null}
yarn kamino-manager add-vault-permission \
  --vault <VAULT_ADDRESS> \
  --user <USER_WALLET_ADDRESS> \
  --operations "DEPOSIT" \
  --mode execute
```

The CLI auto-detects whether the user's `UserPermission` account already exists. If it does, the operations are merged via bitwise OR. If it doesn't, the account is created with the specified ops.

### Revoke a user

```bash theme={null}
yarn kamino-manager remove-vault-permission \
  --vault <VAULT_ADDRESS> \
  --user <USER_WALLET_ADDRESS> \
  --mode execute
```

Sets the user's `permissioned_ops` to `0`. The user can no longer take any gated action until re-whitelisted.

## On-chain accounts

| Account | Program | PDA seeds | Stores |
| - | - | - | - |
| `VaultState` | kvault | (vault account) | `permissioning_authority` (Vault Permissioner PDA), `permissioned_ops` (u64 bitfield) |
| `UserPermission` | kperm | `["permission", vault, user]` | `vault`, `user`, `permissioned_ops`, cached `vaultPermissioner`, bumps |
| Vault Permissioner | kperm | `["vault", vault]` | Authority PDA the kperm program signs as when CPI'ing into kvault (signature-only; the PDA stores no data) |
| `GlobalConfig` | kperm | `["global_config"]` | `globalAdmin`, `pendingAdmin` for the kperm program |

Program ID for kperm: `KPermUZsf9tu4cSd9LNcMojCbiHfdbJXv9dr3pAUzz1`.

## Operational considerations

| Topic | Detail |
| - | - |
| Performance | Permissioned actions add one CPI hop (kperm → kvault). Compute-unit cost rises modestly; users may need to bump priority fees on busy slots |
| Multisig | When the vault admin is a Squads multisig, `update-vault-permission` becomes a multisig proposal subject to the standard threshold and review flow |
| Whitelist authority | The kperm `globalAdmin` is shared across markets and vaults. For most curator vaults, a Kamino-controlled admin holds it; the curator delegates whitelisting to the REST API. For curators that want full sovereignty, coordinate with the team to use a curator-owned admin |
| Composability | Permissioning is enforced at the kvault-instruction boundary. Programs that integrate with kvault by composing instructions (third-party UIs, aggregators) must use `permissioned_fwd_to_kvault` to interact with a permissioned vault |
| Exit semantics | Withdrawals are always open. To shape the exit flow, use the standard vault [liquidity and withdrawal](https://kamino.com/docs/curators/vaults/concepts/liquidity-and-withdrawals.md) primitives |
| Stacking with Whitelisted Reserves | Permissioning controls *who* deposits; [Whitelisted Reserves](https://kamino.com/docs/curators/vaults/guides/enable-whitelisted-reserves.md) controls *where* capital flows. Both can be enabled together for the strongest institutional configuration |

## Reference

* [Permissioned vaults](https://kamino.com/docs/curators/vaults/concepts/permissioned-vaults.md) — conceptual model
* [Permissioned markets](https://kamino.com/docs/curators/markets/permissioned-markets.md) — equivalent feature applied to lending markets
* [Enable Whitelisted Reserves](https://kamino.com/docs/curators/vaults/guides/enable-whitelisted-reserves.md) — protocol-level reserve restriction (independent of permissioning)


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
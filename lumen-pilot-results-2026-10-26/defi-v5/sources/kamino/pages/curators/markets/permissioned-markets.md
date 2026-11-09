> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Permissioned Markets

> Gate specific market actions behind a per-user, per-action allowlist enforced on-chain by the kperm program

A permissioned market gates specific on-chain actions such as deposit, borrow, and liquidate behind an explicit per-user allowlist. A user without an allowlist entry (or whose entry doesn't include the action they're attempting) is rejected by the program. The curator picks which actions are gated and which users are allowed to take them; everything else stays open. The on-chain enforcement is handled by a separate program called **kperm**.

## When to use this

* **KYC'd-only depositor base** — tie KYC completion to a wallet, then automate whitelisting via the API
* **Accredited-investor restrictions** — same pattern, gated by attestation
* **Internal market for a specific app's users** — your app's onboarding flow is the gate
* **Permissioned borrowers** — counterparty agreements that lock borrow access to named entities

## How it works

Permissioning is enforced by a **cosigner pattern**. Every gated action on a permissioned market requires two on-chain signatures: the user's, plus a co-signature from a kperm-controlled PDA called the **Market Permissioner**. klend will only execute the action if both are present.

The mechanic has two on-chain pieces.

The **market** holds two new fields. `permissioning_authority` is a pubkey that klend treats as a required co-signer on every gated action; the curator sets it to the kperm-derived **Market Permissioner PDA** (seeds: `["market", market_address]`). `permissioned_ops` is a `u64` bitfield naming which actions on this market are gated. Setting these two fields is what turns a market into a permissioned market.

The **kperm program** holds the per-user allowlist. For each (market, user) pair authorized to take gated actions, kperm stores a `UserPermission` account at PDA `["permission", market, user]` recording which operations that user can take.

When a user takes a gated action, their wallet does not call klend directly. It builds the klend instruction it wants to execute, then wraps it inside `kperm.permissioned_fwd_to_klend(ix_data)` and submits the wrap. kperm reads the user's `UserPermission`, confirms the requested action is in the allowlist, and CPIs into klend with its Market Permissioner PDA acting as the co-signer. klend sees the required co-signer present and executes the wrapped instruction. If the user has no `UserPermission` or the requested action is missing from the bitfield, kperm rejects and the entire transaction reverts.

For non-gated actions on the same market (actions whose bit is not set in `permissioned_ops`, plus withdraw, repay, refresh, and read paths), users call klend directly. Only the gated operations require the wrap.

## The operations

The kperm bitfield supports four operation slots:

| Bit | Op | Notes |
| - | - | - |
| 0 | `DEPOSIT` | Gates depositing collateral / supplying liquidity |
| 1 | `BORROW` | Gates borrowing |
| 2 | `LIQUIDATE` | Gates liquidating other users' positions on this market |
| 5 | `KEYRING` | External-policy bridge. Use this when a user's actions should be enforced by a separate keyring/policy program (the kperm allowlist still applies as a fallback) |

A user's `UserPermission.permissioned_ops` is the bitwise OR of the bits they're allowed to act on (e.g. `DEPOSIT | BORROW` for a whitelisted depositor-borrower).

**Withdraw and repay stay open.** The on-chain bitfield doesn't gate exits — once a user has been allowed to deposit or borrow, they can always close their position. Refresh and read paths are also always open. The design is to screen capital at the entry; not at the exit.

## Curator workflow

**1. Decide what to permission**

Pick the operations to gate. `DEPOSIT` is the most common (KYC'd depositor base). Add `BORROW` for fully gated lending venues. You can change this later.

**2. Switch the market into permissioned mode**

Set `permissioning_authority` to the Market Permissioner PDA and `permissioned_ops` to the chosen bitfield. From this point, klend requires the kperm cosigner for every gated action.

**3. Whitelist users**

Use the SDK, CLI, or REST API (see tabs below). All three issue the same `init_user_permission` (first grant) or `update_user_permission` (subsequent grants) instruction on-chain.

**4. Test the rejection path**

Send a deposit transaction from an un-whitelisted wallet on staging and confirm it reverts. Add that wallet to the allowlist and retry — it should succeed.

**SDK**

## Configure permissioning via SDK

The kperm-aware methods live in `@kamino-finance/klend-sdk` alongside the standard `KaminoManager`.

### Curator: switch the market into permissioned mode

```typescript theme={null}
import {
  KaminoManager,
  DEFAULT_RECENT_SLOT_DURATION_MS,
  PROGRAM_ID,
  PermissionedOp,
  getMarketPermissionerPda,
} from '@kamino-finance/klend-sdk';
import { LendingMarket } from '@kamino-finance/klend-sdk/dist/@codegen/klend/accounts';
import { PROGRAM_ID as KPERM_PROGRAM_ID } from '@kamino-finance/klend-sdk/dist/@codegen/kperm/programId';
import { address } from '@solana/kit';

const kaminoManager = new KaminoManager(rpc, DEFAULT_RECENT_SLOT_DURATION_MS, PROGRAM_ID);

const marketAddress = address('<MARKET_ADDRESS>');
const marketState = await LendingMarket.fetch(rpc, marketAddress);
if (!marketState) throw new Error('Market not found');
const marketWithAddress = { address: marketAddress, state: marketState };

const marketPermissioner = await getMarketPermissionerPda(marketAddress, KPERM_PROGRAM_ID);
const permissionedOpsBitfield = PermissionedOp.fromString('DEPOSIT|BORROW');

const newLendingMarket = new LendingMarket({
  ...marketState,
  permissioningAuthority: marketPermissioner,
  permissionedOps: permissionedOpsBitfield,
});

const ixs = kaminoManager.updateLendingMarketIxs(adminSigner, marketWithAddress, newLendingMarket);
// submit each ix in order
```

`PermissionedOp.fromString` accepts pipe-separated names: `'DEPOSIT'`, `'DEPOSIT|BORROW'`, `'DEPOSIT|BORROW|LIQUIDATE'`, etc.

### Whitelist a user (initial grant or update)

```typescript theme={null}
import { initPermissionIx, updatePermissionIx, getPermissionPda } from '@kamino-finance/klend-sdk';
import { UserPermission } from '@kamino-finance/klend-sdk/dist/@codegen/kperm/accounts';

const userAddress = address('<USER_WALLET>');
const grantedOps = PermissionedOp.fromString('DEPOSIT|BORROW');

const userPermissionPda = await getPermissionPda(marketAddress, userAddress, KPERM_PROGRAM_ID);
const existing = await UserPermission.fetch(rpc, userPermissionPda, KPERM_PROGRAM_ID);

const ix = existing
  ? await updatePermissionIx(globalAdminSigner, marketAddress, userAddress, grantedOps, /* overwrite */ false)
  : await initPermissionIx(globalAdminSigner, marketAddress, userAddress, grantedOps);
// Sign and submit with the global admin's signer
```

`updatePermissionIx` takes an `overwrite` flag: `true` replaces the user's allowed ops with `grantedOps`; `false` bitwise-ORs `grantedOps` into the existing set.

### Revoke a user

```typescript theme={null}
import { removePermissionIx } from '@kamino-finance/klend-sdk';

const ix = await removePermissionIx(globalAdminSigner, marketAddress, userAddress, KPERM_PROGRAM_ID);
// Sign and submit
```

The `UserPermission` account stays on-chain with `permissioned_ops = 0`. Re-granting later avoids paying rent again.

### User flow: take a gated action

The standard `KaminoAction` builders detect when the target market is permissioned and automatically wrap the produced klend instructions with `permissioned_fwd_to_klend`. Builders integrating against a permissioned market continue to call `KaminoAction.buildDepositTxns(...)`, `buildBorrowTxns(...)`, etc. — the SDK handles the wrap.

For instructions built outside of `KaminoAction`, wrap manually:

```typescript theme={null}
import { permissionedFwdToKlend } from '@kamino-finance/klend-sdk/dist/@codegen/kperm/instructions';
import { PROGRAM_ID as KLEND_PROGRAM_ID, getPermissionPda } from '@kamino-finance/klend-sdk';

const userPermissionPda = await getPermissionPda(marketAddress, userSigner.address, KPERM_PROGRAM_ID);

const wrapped = permissionedFwdToKlend(
  { ixData: klendIx.data },
  {
    user: userSigner,
    targetProgram: KLEND_PROGRAM_ID,
    userPermission: userPermissionPda,
  },
  /* remainingAccounts = */ [...klendIx.accounts],
  KPERM_PROGRAM_ID,
);
// Submit `wrapped` as the user's transaction
```

**API**

## Programmatic whitelisting via REST API

Kamino exposes a REST API that issues the on-chain `init_user_permission`, `update_user_permission`, and `remove_user_permission` instructions on the curator's behalf. Intended use: automated onboarding — KYC provider attests → backend marks the user verified → backend calls the API → the wallet is allowed on the target market within seconds.

The API takes the same inputs as the SDK and CLI:

* Market address
* User wallet address
* Operations to grant (any combination of `DEPOSIT`, `BORROW`, `LIQUIDATE`, `KEYRING`)

Signing is handled by the kperm global admin which the API operates against on your behalf for whitelisted markets.

> [!NOTE]
>
> API base URL, authentication, and exact request schemas are not yet publicly documented. Coordinate with the Kamino team to obtain access for your market.

**Kamino CLI**

## Configure permissioning via CLI

### Switch the market into permissioned mode

```bash theme={null}
yarn kamino-manager update-lending-market-permission \
  --market <MARKET_ADDRESS> \
  --operations "DEPOSIT|BORROW" \
  --mode execute
```

In one call, the command sets `permissioning_authority` to the Market Permissioner PDA and sets `permissioned_ops` to the bitfield parsed from `--operations`. Operations are pipe-separated and case-insensitive: `DEPOSIT`, `BORROW`, `LIQUIDATE`, `KEYRING`.

To reduce the gated set later, re-run with the smaller bitfield (e.g. drop `BORROW` by passing `--operations "DEPOSIT"`).

### Whitelist a user

```bash theme={null}
yarn kamino-manager add-permission \
  --market <MARKET_ADDRESS> \
  --user <USER_WALLET_ADDRESS> \
  --operations "DEPOSIT|BORROW" \
  --mode execute
```

The CLI auto-detects whether the user's `UserPermission` account already exists. If it does, the operations are merged via bitwise OR. If it doesn't, the account is created with the specified ops.

### Revoke a user

```bash theme={null}
yarn kamino-manager remove-permission \
  --market <MARKET_ADDRESS> \
  --user <USER_WALLET_ADDRESS> \
  --operation "DEPOSIT|BORROW|LIQUIDATE" \
  --mode execute
```

Sets the user's `permissioned_ops` to `0`. The user can no longer take any gated action until re-whitelisted.

## On-chain accounts

| Account | Program | PDA seeds | Stores |
| - | - | - | - |
| `LendingMarket` | klend | (market account) | `permissioning_authority` (Market Permissioner PDA), `permissioned_ops` (u64 bitfield) |
| `UserPermission` | kperm | `["permission", market, user]` | `market`, `user`, `permissioned_ops`, cached `marketPermissioner`, bumps |
| Market Permissioner | kperm | `["market", market]` | Authority PDA the kperm program signs as when CPI'ing into klend (signature-only; the PDA stores no data) |
| `GlobalConfig` | kperm | `["global_config"]` | `globalAdmin`, `pendingAdmin` for the kperm program |

Program ID for kperm: `KPermUZsf9tu4cSd9LNcMojCbiHfdbJXv9dr3pAUzz1`.

## Operational considerations

| Topic | Detail |
| - | - |
| Performance | Permissioned actions add one CPI hop (kperm → klend). Compute-unit cost rises modestly; users may need to bump priority fees on busy slots |
| Multisig | When the curator's market owner is a multisig, `update-lending-market-permission` becomes a multisig proposal subject to the timelock, like every other market config change |
| Whitelist authority | The kperm `globalAdmin` is set when the kperm program is initialized. For most curator markets, a Kamino-controlled admin holds it; the curator delegates whitelisting to the REST API. For curators that want full sovereignty, coordinate with the team to use a curator-owned admin |
| Composability | Permissioning is enforced at the klend-instruction boundary. Programs that integrate with klend by composing instructions (vaults, liquidators, third-party interfaces) must use `permissioned_fwd_to_klend` to interact with a permissioned market |
| Exit semantics | Withdraw and repay are always open. If you need to throttle exits, layer the [withdrawal queue](https://kamino.com/docs/curators/markets/withdrawal-queue.md) and standard reserve caps on top |

## Reference

* [Market config reference](https://kamino.com/docs/curators/markets/market-config-reference.md) — `permissioning_authority` and `permissioned_ops` fields
* [Market settings](https://kamino.com/docs/curators/markets/market-settings.md) — broader market-level config flow
* [Updating reserves](https://kamino.com/docs/curators/markets/reserve-management.md) — reserves work the same way under a permissioned market
* [`update-lending-market-permission`, `add-permission`, `remove-permission` CLI](https://kamino.com/docs/build/cli/market-operations) — full flag detail


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
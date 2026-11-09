> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Roles & ownership

> Vault admin types, the multisig model, and the Squads-based execution flow

A production vault runs under a Squads multisig — every state-changing operation flows through proposals and approvals. This page explains the admin roles, the transfer model, and how operations actually execute once the multisig holds admin.

## The three admin roles

| Role | Scope | Transfer model |
| - | - | - |
| **Vault Admin** | Full control over settings, allocations, fees, and all parameters | Two-step (initiate → claim) |
| **Allocation Admin** | Update allocation **weights, caps, types, and priorities** on existing reserves only. Cannot add or remove reserves; cannot change vault settings. | Single-step (Vault Admin sets directly) |
| **Farm Authority** | Controls the vault's farm. Transferred to the protocol after farm creation; not curator-managed thereafter. | Automatic |

### When to use Allocation Admin

Allocation Admin is the role you delegate to a non-multisig wallet (or a different multisig) to handle day-to-day rebalancing without granting full vault control. Common patterns:

* An automated rebalancing service holds Allocation Admin while the Vault Admin remains a high-security multisig.
* A secondary operator manages weights between scheduled rebalances; the primary multisig retains structural control.
* Risk management software adjusts caps in response to market signals.

The Allocation Admin cannot add new reserves to the allocation or change fee structure — those still require the Vault Admin. To set or rotate the Allocation Admin, see [Transfer admin to multisig → Allocation Admin transfer](https://kamino.com/docs/curators/vaults/guides/transfer-admin.md#allocation-admin-transfer-optional).

## The two-step Vault Admin transfer

Vault Admin transfer uses a two-step pattern to prevent accidental ownership changes.

```
[ current admin ]   initiate transfer    [ pending admin set ]   claim    [ new admin holds vault ]
       ●  ─────────────────────────────►        ●               ──────►            ●
                                              │                                    
                                              │  current admin can cancel here
                                              ▼
                                          [ unchanged ]
```

1. **Initiate.** The current admin submits a transfer to the new admin address. The vault state's `PendingVaultAdmin` is set to the new admin. The new admin does not yet hold control.
2. **Claim.** The new admin (typically a Squads multisig) submits an accept-ownership transaction. Control transfers atomically.

Until step 2 lands, the current admin can cancel the pending transfer. After step 2, the previous admin has no privileges.

The Allocation Admin transfer is **single-step** — the Vault Admin sets the new Allocation Admin directly. There is no claim. This is intentional: you may want to revoke or rotate Allocation Admin quickly without coordination from the new admin.

For step-by-step transfer instructions, see [Transfer admin to multisig](https://kamino.com/docs/curators/vaults/guides/transfer-admin.md).

## The Squads multisig model

Production vaults transfer Vault Admin to a [Squads](https://squads.so) multisig before accepting deposits. Two reasons:

* **Operational security.** No single key can move vault funds.
* **Required for UI listing.** Kamino's UI lists only multisig-controlled vaults that also have [Whitelisted Reserves](https://kamino.com/docs/curators/vaults/concepts/risk-primitives.md#whitelisted-reserves) enabled — see [Enable Whitelisted Reserves](https://kamino.com/docs/curators/vaults/guides/enable-whitelisted-reserves.md).

Once the multisig holds Vault Admin, every state-changing operation becomes a Squads proposal that requires the configured threshold of signatures. To migrate, see [Transfer admin to multisig](https://kamino.com/docs/curators/vaults/guides/transfer-admin.md).

## How operations execute under multisig

Two flows are supported. Both produce the same on-chain outcome. For the workflow walkthrough, see [Transfer admin to multisig → Operating after transfer](https://kamino.com/docs/curators/vaults/guides/transfer-admin.md#operating-after-transfer).

### SquadsX flow (recommended)

When you sign in to [kamino.com/curators/vaults](https://kamino.com/curators/vaults) with SquadsX, the Send action automatically:

1. Generates the transaction.
2. Creates a Squads proposal.
3. Surfaces it to the multisig members for approval.

You don't copy or paste anything — the proposal lands in the Squads dashboard ready for review and execution.

### Encoded transaction flow

If you're not using SquadsX:

1. Configure the change on `kamino.com/curators/vaults`.
2. Click Simulate to verify the transaction succeeds and review the resulting state.
3. Copy the Base58-encoded transaction string from the simulation output.
4. Open [Squads](https://squads.so) and import the encoded transaction.
5. Gather approvals.
6. Execute.

The same flow applies to programmatic operations via SDK or CLI. SDK methods produce instructions that are wrapped into transactions; CLI commands accept `--mode multisig --multisig <pubkey>` to emit a Base58-encoded payload for Squads.

## Authority transfer for emergency operations

The Insurance Pool's emergency withdrawal uses a **2-of-2 multisig** that's separate from your vault Squads:

* One signature from your curator-controlled wallet.
* One signature from Kamino's security council.

This applies only to emergency withdrawals from the Insurance Pool — see [Risk primitives → Insurance Pool](https://kamino.com/docs/curators/vaults/concepts/risk-primitives.md#the-insurance-pool) and [Set up the Insurance Pool → Withdrawal mechanisms](https://kamino.com/docs/curators/vaults/guides/set-up-insurance-pool.md#withdrawal-mechanisms). Normal vault operations use only your Squads multisig.

## What a curator actually manages

In practice, the role split for a typical institutional vault:

| Operation | Authority | Workflow |
| - | - | - |
| Adjust allocation weights/caps (existing reserves) | Vault Admin or Allocation Admin | [Configure allocations](https://kamino.com/docs/curators/vaults/guides/configure-allocations.md) |
| Add a new reserve to the allocation | Vault Admin only | [Configure allocations](https://kamino.com/docs/curators/vaults/guides/configure-allocations.md) |
| Change fees | Vault Admin | [Create a vault](https://kamino.com/docs/curators/vaults/guides/create-a-vault.md) (also editable post-creation) |
| Enable Whitelisted Reserves | Vault Admin (one-way) | [Enable Whitelisted Reserves](https://kamino.com/docs/curators/vaults/guides/enable-whitelisted-reserves.md) |
| Set up Insurance Pool | Vault Admin | [Set up the Insurance Pool](https://kamino.com/docs/curators/vaults/guides/set-up-insurance-pool.md) |
| Configure farms | Vault Admin | [Configure farms](https://kamino.com/docs/curators/vaults/guides/configure-farms.md) |
| Transfer Vault Admin | Two-step (current → claim by new) | [Transfer admin to multisig](https://kamino.com/docs/curators/vaults/guides/transfer-admin.md) |
| Emergency Insurance Pool withdrawal | 2-of-2 (curator + Kamino security) | [Set up the Insurance Pool → Withdrawal mechanisms](https://kamino.com/docs/curators/vaults/guides/set-up-insurance-pool.md#withdrawal-mechanisms) |
| Cranking (sync, rebalance) | Permissionless | [Configure allocations → Sync after changes](https://kamino.com/docs/curators/vaults/guides/configure-allocations.md#sync-after-changes) |

Cranking is permissionless — the network's bots run sync every \~15 minutes; you can also trigger it manually. You don't *manage* the crank; it runs.

## What's next

> **[Transfer admin to multisig](https://kamino.com/docs/curators/vaults/guides/transfer-admin.md)**
>
> The step-by-step migration to a Squads-controlled vault.

> **[Risk primitives](https://kamino.com/docs/curators/vaults/concepts/risk-primitives.md)**
>
> Insurance Pool's 2-of-2 emergency withdrawal model.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
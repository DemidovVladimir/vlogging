> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Permissioned vaults

> Gate vault deposits behind a per-user, per-action allowlist enforced on-chain by the kperm program

A permissioned vault gates on-chain deposit actions behind an explicit per-user allowlist. A wallet without an allowlist entry is rejected by the program at deposit time. The curator picks which actions are gated and which users are allowed to take them; everything else stays open. The on-chain enforcement is handled by a separate program called **kperm**, the same primitive that powers [permissioned markets](https://kamino.com/docs/curators/markets/permissioned-markets.md).

For the operational walkthrough — switching a vault into permissioned mode and managing the allowlist — see [Enable permissioning](https://kamino.com/docs/curators/vaults/guides/enable-permissioning.md).

> [!NOTE]
>
> kperm is live for Kamino lending markets today. Vault-side support ships with the next kvault release; the SDK, CLI, and on-chain mechanics described here mirror the existing markets implementation.

## When to use this

* **KYC'd-only depositor base** — tie KYC completion to a wallet, then automate whitelisting via the API
* **Accredited-investor restrictions** — same pattern, gated by attestation
* **App-internal vault for a specific app's users** — your app's onboarding flow is the gate
* **Counterparty-gated lending vaults** — vault deposits restricted to named institutional entities under bilateral agreements

## How it works

Permissioning is enforced by a **cosigner pattern**. Every gated action on a permissioned vault requires two on-chain signatures: the user's, plus a co-signature from a kperm-controlled PDA called the **Vault Permissioner**. kvault will only execute the action if both are present.

The mechanic has two on-chain pieces.

The **vault** holds two new fields. `permissioning_authority` is a pubkey that kvault treats as a required co-signer on every gated action; the curator sets it to the kperm-derived **Vault Permissioner PDA** (seeds: `["vault", vault_address]`). `permissioned_ops` is a `u64` bitfield naming which actions on this vault are gated. Setting these two fields is what turns a vault into a permissioned vault.

The **kperm program** holds the per-user allowlist. For each (vault, user) pair authorized to take gated actions, kperm stores a `UserPermission` account at PDA `["permission", vault, user]` recording which operations that user can take.

When a user takes a gated action, their wallet does not call kvault directly. It builds the kvault instruction it wants to execute, then wraps it inside `kperm.permissioned_fwd_to_kvault(ix_data)` and submits the wrap. kperm reads the user's `UserPermission`, confirms the requested action is in the allowlist, and CPIs into kvault with its Vault Permissioner PDA acting as the co-signer. kvault sees the required co-signer present and executes the wrapped instruction. If the user has no `UserPermission` or the requested action is missing from the bitfield, kperm rejects and the entire transaction reverts.

For ungated actions on the same vault — actions whose bit is clear in `permissioned_ops`, plus withdraw, refresh, and read paths — users call kvault directly. Only the gated operations require the wrap.

## The operations

The kperm bitfield exposes two operation slots that apply to vaults:

| Bit | Op | Notes |
| - | - | - |
| 0 | `DEPOSIT` | Gates depositing into the vault |
| 5 | `KEYRING` | External-policy bridge. Use this when a user's actions should be enforced by a separate keyring/policy program (the kperm allowlist still applies as a fallback) |

A user's `UserPermission.permissioned_ops` is the bitwise OR of the bits they're allowed to act on.

The remaining slots in the kperm bitfield (`BORROW`, `LIQUIDATE`) are market-level operations and have no kvault-side enforcement target. They share the same `u64` encoding for forward-compatibility with markets.

**Withdrawals stay open.** The bitfield governs entry only — once a user has been allowed to deposit, they can always redeem their shares subject to the vault's standard liquidity model. The design screens capital at entry only.

## How it composes with other vault primitives

Permissioned vaults compose with the rest of the vault primitive surface:

* **[Whitelisted Reserves](https://kamino.com/docs/curators/vaults/concepts/risk-primitives.md#whitelisted-reserves)** — protocol-level constraint on which reserves the vault can deploy capital into. Permissioning gates *who* can deposit; Whitelisted Reserves gates *where* capital flows. Running a permissioned vault that also enforces Whitelisted Reserves is the strongest configuration for institutional capital.
* **[Insurance Pool](https://kamino.com/docs/curators/vaults/concepts/risk-primitives.md#the-insurance-pool)** — the loss backstop is unaffected by permissioning. Whitelisted depositors get the same loss-waterfall protection as depositors in any other vault.
* **[Standard / Conditional allocations](https://kamino.com/docs/curators/vaults/concepts/allocations.md)** — allocation strategy is independent of who's allowed to deposit. A permissioned vault can run any combination of floating-rate and fixed-rate allocations.
* **[Multisig admin](https://kamino.com/docs/curators/vaults/concepts/roles-and-ownership.md)** — switching the vault into permissioned mode and updating `permissioned_ops` are admin actions. Under a Squads multisig, both flow through the standard proposal model.

## Comparison to markets

The vault and market flavors of kperm share the same primitive — kperm cosigner pattern, same `UserPermission` account layout, same `KEYRING` external-policy bridge — and differ only in the target program and the operation surface. A market gates `DEPOSIT | BORROW | LIQUIDATE`; a vault gates `DEPOSIT`. Curators running both products manage them through the same SDK module and the same global admin.

## What's next

> **[Enable permissioning](https://kamino.com/docs/curators/vaults/guides/enable-permissioning.md)**
>
> The operational walkthrough — switch the vault into permissioned mode, whitelist users, and integrate the API.

> **[Permissioned markets](https://kamino.com/docs/curators/markets/permissioned-markets.md)**
>
> The same primitive applied to lending markets.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
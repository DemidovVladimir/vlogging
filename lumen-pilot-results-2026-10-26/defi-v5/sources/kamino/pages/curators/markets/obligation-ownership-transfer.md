> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Obligation Ownership Transfer

> Three-step initiate / approve / accept flow for migrating a position to a new owner

An obligation is the on-chain account that tracks a user's deposits and borrows in a market. Sometimes ownership of an obligation needs to move — an institutional holder rotating custody, a managed account being reassigned, a vault repositioning a position. klend supports this via a three-step transfer process designed to prevent accidental loss of control.

Curators surface this feature to their users. This page documents the flow so you can recommend it and reason about its interactions with other features.

## The three-step flow

The current owner kicks off the transfer by calling `initiate-obligation-ownership-transfer` with the new owner's pubkey. The obligation enters a "pending transfer" state; the position keeps accruing interest and is still repayable, but ownership stays with the current owner until the flow completes.

The klend program's global admin then calls `approve-obligation-ownership-transfer`. This middle step exists for protocol-level oversight: it gives the curator a safeguard against transfers that would compromise the market (sanctioned addresses, accounts that wouldn't satisfy the market's compliance posture, etc.).

Finally, the new owner calls `accept-obligation-ownership-transfer`. The obligation's owner field updates and the transfer is complete. If at any point either party wants to back out, `abort-obligation-ownership-transfer` cancels the pending state.

## Why three steps

| Step | Concern addressed |
| - | - |
| Initiate | Current owner must explicitly opt in. No surprise transfers |
| Approve | Protocol-level oversight. Prevents transfers to addresses that would create regulatory or operational issues |
| Accept | New owner must explicitly opt in. No transfers to addresses that don't want the obligation |

A two-step (initiate / accept) flow would skip protocol oversight; a one-step transfer would let the current owner unilaterally hand off the position. The three-step pattern balances all three.

**SDK**

## Surface the transfer flow via SDK

The four obligation ownership transfer instructions (`initiate`, `approve`, `accept`, `abort`) are part of the on-chain klend program. The current public klend-sdk does not yet expose dedicated TypeScript helpers for these.

End-user apps integrate the transfer via:

* The Kamino webapp's obligation transfer UI for whitelisted markets
* Building the instructions manually from the program IDL
* Wrapping the transfer endpoints in your own SDK layer

For most curators, the practical pattern is to point users at the Kamino webapp (if your market is whitelisted) or to provide your own UI that builds the instructions directly.

The instruction shapes:

* `initiate-obligation-ownership-transfer(currentOwner, obligation, newOwnerPubkey)` — signed by current owner
* `approve-obligation-ownership-transfer(globalAdmin, obligation)` — signed by Kamino's global admin
* `accept-obligation-ownership-transfer(newOwner, obligation)` — signed by new owner
* `abort-obligation-ownership-transfer(signer, obligation)` — signed by current owner before approval, or by either party

**API**

> [!NOTE]
>
> **Obligation ownership transfer is not available via the REST API.** The transfer is executed by user-signed transactions calling on-chain klend instructions; coordinate via the Kamino webapp or by building the instructions through the **SDK**.

**Kamino CLI**

## Surface the transfer flow via CLI

The four obligation ownership transfer instructions are not currently exposed through the kamino-manager CLI. End users execute them via the Kamino webapp (for whitelisted markets) or via custom tooling.

For curator-side oversight, monitor on-chain accounts to track pending transfers on your market. Standard read tools work:

```bash theme={null}
yarn kamino-manager get-market-or-vault-admin-info --address <MARKET_ADDRESS>
```

## Interaction with open borrow orders

If the obligation has an open [borrow order](https://kamino.com/docs/curators/markets/borrow-orders.md) when accept is called, the order becomes unfillable. The order's debt destination is tied to the original owner's authority; once ownership changes, the order can no longer execute.

**Recommended flow before transfer:**

**1. Cancel any open borrow orders**

The current owner cancels via the appropriate instruction or SDK call.

**2. Initiate the transfer**

Now safe to proceed. No open orders means nothing breaks at accept.

**3. Complete approve and accept**

The new owner can place new orders after acceptance.

If a transfer is initiated without first canceling, the order stays in place but becomes a no-op after accept. Cancel it explicitly post-transfer to clean up.

## Interaction with obligation orders

[Obligation orders](https://kamino.com/docs/curators/markets/obligation-orders.md) (price-triggered self-deleverage) survive the transfer. The new owner inherits the orders as configured. They can update or cancel them after acceptance via `set-obligation-order`.

If the orders rely on assumptions about the previous owner's risk model, the new owner should review and adjust them after acceptance.

## Interaction with farms

Pending farm rewards on the obligation are tied to the obligation's farm-state position, which moves with the obligation. After acceptance, the new owner can claim accumulated rewards normally.

If the previous owner wants to claim rewards before transfer, they should do so before initiating; otherwise, those rewards belong to the new owner from the moment of accept.

## Curator's role in the transfer

For most curators, the global-admin approval step is handled by Kamino's program-level admin. The market curator's role is:

* **Surfacing the feature** to users who need it (institutional holders, managed accounts, custodial flows)
* **Guidance on cleanup** before transfer (cancel borrow orders, claim rewards if desired, communicate position state to the new owner)
* **Documentation** of any market-specific implications (e.g., a permissioned market where the new owner needs separate approval)

If your market has access constraints (e.g., a Token-2022 transfer hook on a collateral asset), the new owner must satisfy those constraints to interact with their inherited position. The transfer itself succeeds, but operations against the obligation will fail at the hook layer if the new owner isn't approved.

## When users actually use this

Common scenarios:

| Scenario | What's happening |
| - | - |
| Custody rotation | An institution moves their position from a hot-wallet custody setup to a multisig custody setup, or vice versa |
| Managed account migration | A fund manager hands an account back to its beneficial owner, or the beneficial owner reassigns to a new manager |
| Address compromise | A user's wallet is compromised; they want to migrate their healthy position to a fresh address before liquidation pressure builds |
| Settlement | One leg of an off-chain trade is settled by transferring ownership of an existing on-chain position |

## Common errors

| Error | Cause |
| - | - |
| `ObligationOwnershipTransferNotInitiated` | Accept called before initiate. The flow must be in order |
| `ObligationOwnershipTransferNotApproved` | Accept called before approve. The global admin step must complete first |
| `OwnershipTransferAlreadyInitiated` | A new initiate call was made while one is already pending. Abort the existing one first |
| `Unauthorized` | The signer doesn't match the role expected at this step (current owner, global admin, or new owner) |
| Transfer succeeded but new owner can't operate | The obligation may hold an asset whose transfer hook rejects the new owner. Verify hook compatibility |

## Reference

* [Borrow orders](https://kamino.com/docs/curators/markets/borrow-orders.md) — the open-order interaction at acceptance
* [Obligation orders](https://kamino.com/docs/curators/markets/obligation-orders.md) — orders carry through the transfer
* [Farms & rewards](https://kamino.com/docs/curators/markets/farms-and-rewards.md) — reward accounting around the transfer


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
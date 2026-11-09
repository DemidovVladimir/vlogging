> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Set up the Insurance Pool

> Configure the loss backstop, deposit your skin-in-the-game capital, and trigger the Kamino match

The Insurance Pool is the strongest trust signal you can offer depositors. Your locked capital absorbs losses before any depositor takes a hit, with public on-chain visibility of the amount. Kamino matches your deposit up to \$250K. For the conceptual treatment of the loss waterfall and the emergency withdrawal model, read [Risk primitives → Insurance Pool](https://kamino.com/docs/curators/vaults/concepts/risk-primitives.md#the-insurance-pool) first.

This page is the operational walkthrough.

## Before you start

You'll need:

* An existing vault. If you haven't created one yet, see [Create a vault](https://kamino.com/docs/curators/vaults/guides/create-a-vault.md).
* The capital you want to lock as the backstop, in the vault's deposit token.
* A multisig wallet you want to nominate for the emergency-withdrawal 2-of-2 (Kamino's security council is the other signer).

## Setup steps

**1. Create the Insurance Pool farm**

The Insurance Pool is implemented as a dedicated farm on your vault (the `FirstLossCapitalFarm`). If your vault was created via the SDK with the standard `createVaultIxs` flow, the farm was created automatically. If not, create it now.

| Method | How |
| - | - |
| UI | Available under your vault's Insurance Pool / First Loss Capital settings |
| SDK | Use `kaminoManager.createVaultFarmIxs(...)` and `kaminoManager.updateVaultFirstLossCapitalFarmIxs(...)` to create the farm and register it on the vault. See [Configure farms](https://kamino.com/docs/curators/vaults/guides/configure-farms.md#first-loss-capital-farm) for the exact instruction sequence. |
| CLI | Not currently supported. Use UI or SDK. |

**2. Configure the deposit token**

Set the asset you'll deposit. For most vaults this is the same as the vault's deposit token, so your backstop is denominated in the same currency you're protecting.

**3. Deposit your capital**

Deposit into the Insurance Pool. You receive vault shares (kTokens) which are staked into the pool. The deposited amount is visible on-chain and surfaces on Kamino's UI as a public commitment.

**4. Transfer farm authority to a multisig**

After creation, transfer farm ownership to a multisig and add Kamino as a co-signer for emergency operations. This sets up the 2-of-2 model for emergency withdrawals.

**5. Trigger the Kamino match**

Kamino matches curator Insurance Pool deposits up to \$250K. If you deposit \$200K, Kamino contributes \$200K, bringing the pool to \$400K. The match is triggered through Kamino — contact your curator-relations point of contact when your deposit is ready.

## Withdrawal mechanisms

Two paths exist; understanding both is important because they serve fundamentally different purposes.

### Normal withdrawal — 30-day cooldown

Initiate a standard withdrawal to remove your insurance commitment. The mandatory **30-day cooldown** begins when you initiate; the withdrawal is a **public, on-chain signal**. Depositors and anyone monitoring the vault see that you're exiting.

This is the expected path for curators winding down their commitment. The 30-day window gives depositors time to assess and react.

### Emergency withdrawal — instant, 2-of-2 multisig

Emergency withdrawal exists for one purpose: **rapidly accessing Insurance Pool funds to compensate depositors after a loss event**. It bypasses the cooldown.

The 2-of-2 multisig:

1. Your curator-controlled wallet
2. Kamino's security council

Both must sign. Kamino's security council co-signs only when the withdrawal is for legitimate depositor compensation.

> [!WARNING]
>
> Using emergency withdrawal to extract funds and avoid compensating depositors — rather than to make them whole — defeats the Insurance Pool's purpose and constitutes a breach of the curator commitment.

## The loss compensation flow

When the vault incurs bad debt, compensation is **manual** — there is no automated on-chain detection. Process:

1. **Loss is socialized.** Kamino calls `socialize_loss` on klend; depositors take the hit.
2. **Assess impact.** Identify which reserve was affected and the loss magnitude.
3. **Release Insurance Pool funds.** Normal withdrawal (30-day cooldown) or emergency withdrawal (2-of-2) if urgency is needed.
4. **Snapshot affected depositors** at the loss timestamp.
5. **Distribute compensation** to affected depositors.

For the full flow, see [Risk primitives → Loss compensation flow](https://kamino.com/docs/curators/vaults/concepts/risk-primitives.md#loss-compensation-flow).

## Best practices

* **Run alongside Whitelisted Reserves.** The two protect different things — together they're the highest trust configuration. See [Enable Whitelisted Reserves](https://kamino.com/docs/curators/vaults/guides/enable-whitelisted-reserves.md).
* **Set up before depositors enter.** A vault with an established Insurance Pool from launch is more credible than one that adds it later.
* **Size the pool to depositor expectations.** Institutional depositors will look at pool depth as a fraction of vault TVL when assessing risk.

## What's next

> **[Risk primitives](https://kamino.com/docs/curators/vaults/concepts/risk-primitives.md)**
>
> The model behind the Insurance Pool and Whitelisted Reserves.

> **[Enable Whitelisted Reserves](https://kamino.com/docs/curators/vaults/guides/enable-whitelisted-reserves.md)**
>
> The complementary protection — restrict where vault capital can go.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
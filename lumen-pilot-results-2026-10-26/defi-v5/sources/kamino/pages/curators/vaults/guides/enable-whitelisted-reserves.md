> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Enable Whitelisted Reserves

> Restrict your vault to allocate only into Kamino-verified reserves at the smart contract level

Whitelisted Reserves is the smart-contract-level protection that constrains where your vault can deploy capital. Once enabled, even a compromised admin key cannot direct vault funds into unvetted markets — the constraint is enforced by the program itself, not by your operational security.

For the conceptual treatment of why this exists and what each flag controls, read [Risk primitives → Whitelisted Reserves](https://kamino.com/docs/curators/vaults/concepts/risk-primitives.md#whitelisted-reserves) first.

This page is the operational walkthrough.

> [!WARNING]
>
> **Enabling Whitelisted Reserves is one-way.** Both flags can only be set to `true`. Once enabled, they cannot be reverted — enforced at the smart contract level. Be deliberate.

## What you're enabling

Two on-chain flags — `AllowAllocationsInWhitelistedReservesOnly` (controls new allocations) and `AllowInvestInWhitelistedReservesOnly` (controls new investment) — explained in [Concepts → Risk primitives → The two flags](https://kamino.com/docs/curators/vaults/concepts/risk-primitives.md#the-two-flags). Enable both: one alone leaves a gap that the second closes. Both together is what's required for Kamino UI listing.

## Setup

**UI**

**1. Open vault settings**

Navigate to your vault on `kamino.com/curators/vaults` and open the **Settings** tab.

**2. Enable AllowAllocationsInWhitelistedReservesOnly**

Toggle on. Confirm the transaction. Reminder: this is irreversible.

**3. Enable AllowInvestInWhitelistedReservesOnly**

Toggle on. Confirm the transaction. Also irreversible.

**SDK**

```typescript theme={null}
import { createSolanaRpc, address } from '@solana/kit';
import { KaminoManager, KaminoVault } from '@kamino-finance/klend-sdk';

const rpc = createSolanaRpc('https://api.mainnet-beta.solana.com');
const vault = new KaminoVault(rpc, address('<VAULT_ADDRESS>'));
const kaminoManager = new KaminoManager(rpc);

// Enable allocation whitelisting
const allocIx = await kaminoManager.updateVaultAllowAllocationsInWhitelistedReservesOnlyIxs(
  vault,
  true,
);

// Enable investment whitelisting
const investIx = await kaminoManager.updateVaultAllowInvestInWhitelistedReservesOnlyIxs(
  vault,
  true,
);

// Build and send each as a separate transaction with the standard @solana/kit pipe.
// Multisig vaults: route through Squads.
```

**CLI**

> [!NOTE]
>
> Whitelisted Reserves enablement is not currently exposed via the CLI as a dedicated command. Use the UI or SDK.

## What stays unchanged

* **Withdrawals** are always permitted. You can de-allocate from any reserve at any time, and depositors can enter or exit the vault at any time subject to available liquidity.
* **The whitelist itself** is managed by Kamino at the protocol level. Curators activate enforcement on their vault but cannot add or remove reserves from the whitelist.
* **Existing allocations** to non-whitelisted reserves are not removed by enabling the flags. They remain in your allocation list but new investment is blocked. Plan to remove them via [Configure allocations](https://kamino.com/docs/curators/vaults/guides/configure-allocations.md) before enabling if you want a clean state.

## Best practices

* **Enable both flags.** One alone leaves a gap. Both together is the supported configuration.
* **Enable during vault setup.** Before depositors enter — strongest signal and a prerequisite for UI listing.
* **Pair with the Insurance Pool.** Whitelisted Reserves protects against where capital goes; the [Insurance Pool](https://kamino.com/docs/curators/vaults/guides/set-up-insurance-pool.md) protects against what happens if something goes wrong. Together they represent the highest trust configuration.

## What's next

> **[Risk primitives](https://kamino.com/docs/curators/vaults/concepts/risk-primitives.md)**
>
> The model behind both protections.

> **[Set up the Insurance Pool](https://kamino.com/docs/curators/vaults/guides/set-up-insurance-pool.md)**
>
> Lock the loss backstop alongside Whitelisted Reserves.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
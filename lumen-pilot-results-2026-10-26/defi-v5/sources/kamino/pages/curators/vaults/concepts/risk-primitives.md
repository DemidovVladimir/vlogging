> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Risk primitives

> The Insurance Pool and Whitelisted Reserves — the two on-chain protections you offer depositors

A Kamino vault has two protocol-level mechanisms for communicating trust to depositors. Together they answer two distinct questions:

* **What if something goes wrong?** → the **Insurance Pool**, your locked capital that absorbs losses before depositors take a hit.
* **Where can capital go?** → **Whitelisted Reserves**, a smart-contract-level constraint that prevents the vault from allocating to unverified reserves.

Both are configurable but become irreversible once enabled. Together they represent the highest trust configuration for a vault. Both are required for your vault to appear on Kamino's UI.

## The Insurance Pool

The Insurance Pool is your own capital, locked into the vault, that acts as a **loss backstop**. If the vault incurs bad debt and losses are socialized, your locked capital is used to compensate affected depositors before depositors bear any loss themselves.

The Insurance Pool is the strongest trust signal you can offer depositors. It puts your capital first in the loss waterfall, with public on-chain visibility of the amount.

### Mechanics

* **You deposit** into a dedicated farm on your vault. Your capital earns yield in line with the vault's APY — your backstop is productive while it's locked. ([Set up the Insurance Pool](https://kamino.com/docs/curators/vaults/guides/set-up-insurance-pool.md))
* **Kamino matches** your deposit up to **\$250K**. If you deposit \$200K, Kamino contributes an additional \$200K, bringing your vault's Insurance Pool to \$400K. Deposits above \$250K are not matched.
* **Withdrawals have a mandatory 30-day cooldown.** Initiating a withdrawal is a public on-chain signal — depositors and anyone monitoring the vault see that you're exiting. ([Withdrawal mechanisms](https://kamino.com/docs/curators/vaults/guides/set-up-insurance-pool.md#withdrawal-mechanisms))
* **Emergency withdrawal** bypasses the 30-day cooldown but requires a 2-of-2 multisig (your wallet + Kamino's security council). Designed exclusively for releasing funds to compensate depositors after a loss event. ([Withdrawal mechanisms](https://kamino.com/docs/curators/vaults/guides/set-up-insurance-pool.md#withdrawal-mechanisms))

> [!NOTE]
>
> The Insurance Pool is implemented on-chain as the vault's `FirstLossCapitalFarm`. You'll see the engineering name in some contexts (parameter tables, SDK method names). The depositor-facing name is **Insurance Pool**; that's the term used throughout this section.

### The loss waterfall

When a vault incurs bad debt, the Insurance Pool absorbs the loss first, up to its full balance. If the pool covers the full bad-debt amount, depositors are made whole. If the loss exceeds the pool's balance, depositors absorb the residual.

A vault with a healthy Insurance Pool is one where the curator's own capital is at risk first. Depositor confidence flows from this, not from any external guarantee.

### Loss compensation is manual

There is no automated on-chain loss detection. When a vault incurs bad debt, Kamino socialises the loss on-chain (via `socialize_loss` on klend), then a manual process — coordinated between you and Kamino — releases Insurance Pool funds and distributes them to a snapshot of affected depositors. The full step-by-step is in [Set up the Insurance Pool → Loss compensation flow](https://kamino.com/docs/curators/vaults/guides/set-up-insurance-pool.md#the-loss-compensation-flow).

> [!WARNING]
>
> The Insurance Pool's emergency withdrawal exists to compensate depositors. Using it to extract your capital and avoid making depositors whole defeats the mechanism's purpose and constitutes a breach of the curator commitment.

## Whitelisted Reserves

Whitelisted Reserves is a **smart-contract-level** restriction that ensures your vault's capital can only flow into reserves that Kamino has explicitly verified. Even a compromised admin key cannot direct vault funds into unvetted markets.

This is **protocol-level security**, not operational security. The constraint is enforced by the smart contract itself, independent of your key management or multisig configuration.

### The two flags

There are two independent on-chain restrictions. Both must be enabled for your vault to appear on Kamino's UI.

| Flag | What it restricts |
| - | - |
| `AllowAllocationsInWhitelistedReservesOnly` | **Allocation control.** You cannot create or increase allocations to any reserve outside the whitelist. Existing allocations can still be edited or removed. |
| `AllowInvestInWhitelistedReservesOnly` | **Investment control.** Depositor funds cannot flow into any unvetted reserve. Stricter than allocation control — prevents any *investment* into unverified reserves, not just *allocation creation*. |

Enabling both is the recommended configuration. `AllowAllocationsInWhitelistedReservesOnly` alone allows investment into previously-added non-whitelisted reserves, leaving a path the second flag closes. See [Enable Whitelisted Reserves → The two flags](https://kamino.com/docs/curators/vaults/guides/enable-whitelisted-reserves.md#the-two-flags) for the activation walkthrough.

### Irreversibility

> [!WARNING]
>
> Both flags are **one-way**. Once set to `true`, they cannot be reverted — enforced at the smart contract level. This is intentional: it prevents a compromised key or malicious actor from reversing the protection. Be deliberate.

Withdrawals are always permitted regardless of whitelist status. You can de-allocate from any reserve at any time, and depositors can enter or exit the vault at any time subject to available liquidity.

### Whitelist management

Kamino maintains the whitelist at the protocol level. Curators can activate the enforcement flags on their vault and manage allocations within the resulting set, but have no control over which reserves are on the whitelist.

For the configuration walkthrough, see [Enable Whitelisted Reserves](https://kamino.com/docs/curators/vaults/guides/enable-whitelisted-reserves.md).

## How they compose

The two primitives protect different things:

* **Whitelisted Reserves** protects against where capital goes — the *what-could-happen* surface.
* **Insurance Pool** protects against what happens if something goes wrong — the *what-actually-happened* surface.

Together they represent the highest trust configuration for a vault. Run both for any vault accepting institutional capital.

## What's next

> **[Set up the Insurance Pool](https://kamino.com/docs/curators/vaults/guides/set-up-insurance-pool.md)**
>
> Walkthrough for configuring the loss backstop.

> **[Enable Whitelisted Reserves](https://kamino.com/docs/curators/vaults/guides/enable-whitelisted-reserves.md)**
>
> Walkthrough for enabling the smart-contract-level restriction.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
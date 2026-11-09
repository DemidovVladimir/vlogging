> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# How vaults work

> The vault primitive: share tokens, allocation, the depositor flow, and the curator's role

A Kamino Vault is a programmable lending position. As a curator, you deploy a vault for a single deposit token, configure how that capital should be distributed across Kamino lending reserves, and issue share tokens to depositors who deposit into your vault. The vault is the layer between the depositor (who wants yield) and the underlying reserves (where yield is generated).

This page is the conceptual foundation. Read it before any of the operational guides.

## The model

A vault sits between depositors and Kamino lending reserves. A depositor deposits the vault's accepted token (e.g. USDC) and receives the vault's kToken (e.g. `kvUSDC-X`) in exchange. The vault holds the deposited capital and routes it across a curator-defined mix of Kamino lending reserves — SOL/BTC Market USDC, JLP Market USDC, fixed-rate reserves, and so on — where borrowers pay interest. Yield flows back from the reserves into the vault and accrues to the kToken's exchange rate, so the same kToken redeems for more of the deposit token over time.

Three layers, three responsibilities:

* **The depositor** holds the vault's kToken (`kvUSDC-X` in this example). The kToken's exchange rate against the deposit token rises as the vault accrues yield. Depositors do not pick reserves; they trust the curator's allocation.
* **The vault** routes capital across reserves according to the curator's target allocation, charges the configured fees, and runs an automatic rebalancing loop.
* **The reserves** are the underlying lending pools where the actual borrowing and repayment happen. The vault holds cTokens of each reserve it's allocated to.

## Share tokens (kTokens)

When a depositor deposits into your vault, they receive a share token (kToken) sized at the current exchange rate. As the vault accrues yield, the kToken's exchange rate against the deposit token rises — so the same kToken redeems for more deposit tokens later than it would at deposit time. There is no rebasing; the share count is stable.

```
shares minted = deposit_amount / current_exchange_rate
```

The kToken's symbol follows the convention `kv[DEPOSIT_SYMBOL]-[SUFFIX]` (e.g. `kvUSDC-mev`). The prefix and the deposit token are immutable at vault creation; the suffix is set by you.

## Allocation

Every vault has an **allocation strategy** — the configuration that tells the vault how to deploy capital across reserves. An allocation has, per reserve:

* A **type** — Standard (always allocated) or Conditional (allocated only when borrow demand arrives)
* A **weight** — relative integer that determines proportional distribution for Standard allocations
* A **cap** — hard ceiling on tokens deployed into this reserve
* A **priority** — controls source-reserve eligibility for Conditional fills

The full mechanics live in [Concepts → Allocations](https://kamino.com/docs/curators/vaults/concepts/allocations.md); for the workflow, [Configure allocations](https://kamino.com/docs/curators/vaults/guides/configure-allocations.md).

## Rebalancing and the crank

Allocations are *targets*, not absolute state. As deposits, withdrawals, interest accrual, and Conditional fills shift the actual allocation away from the target, a permissionless **crank** brings the vault back into alignment. A bot runs this every \~15 minutes; anyone (including you) can trigger it manually.

You don't manage individual deposits or withdrawals into reserves. You set targets; the crank executes.

## Fees and revenue

You earn revenue from the vault through two manager fees configured at vault setup (both editable):

* **Performance fee** — a percentage of vault profits
* **AUM fee** — an annual percentage on total vault assets

Both accrue continuously in the deposit token and are collected when you call the appropriate instruction. See [Concepts → Yield & fees](https://kamino.com/docs/curators/vaults/concepts/yield-and-fees.md) for the full model; fees are set during [vault creation](https://kamino.com/docs/curators/vaults/guides/create-a-vault.md).

## Liquidity and withdrawals

Depositors can withdraw at any time. The vault attempts an instant withdrawal first (from the unallocated buffer plus any reserve liquidity it can pull from); if that's insufficient — which happens when capital is committed to fixed-rate reserves or when reserves are heavily utilized — the remaining amount queues through the **withdrawal queue**, a per-reserve FIFO that fills as borrowers repay or new deposits arrive.

The withdrawal queue is a primitive worth understanding deeply — it's the exit path for any capital that isn't instantly available. See [Concepts → Liquidity & withdrawals](https://kamino.com/docs/curators/vaults/concepts/liquidity-and-withdrawals.md); to size the unallocated buffer that absorbs normal withdrawals, see [Configure allocations](https://kamino.com/docs/curators/vaults/guides/configure-allocations.md).

## Roles and ownership

A vault has three admin roles:

* **Vault Admin** — full control over settings, allocations, fees. Production vaults transfer this to a Squads multisig.
* **Allocation Admin** — limited role that can update weights, caps, types, and priorities on existing allocations only. Useful for delegating day-to-day rebalancing.
* **Farm Authority** — controls the vault's farm. After farm creation, this transfers to the protocol; you do not manage it.

Production vaults run under a multisig. Once you transfer admin, every operation flows through Squads as a proposal. See [Concepts → Roles & ownership](https://kamino.com/docs/curators/vaults/concepts/roles-and-ownership.md) for the model and [Transfer admin to multisig](https://kamino.com/docs/curators/vaults/guides/transfer-admin.md) for the migration steps.

## Risk primitives

Two on-chain mechanisms communicate trust to depositors:

* **The Insurance Pool** — your own capital, locked in the vault, that absorbs losses before any depositor takes a hit. Kamino matches up to \$250K. This is the strongest signal you can offer. Configure via [Set up the Insurance Pool](https://kamino.com/docs/curators/vaults/guides/set-up-insurance-pool.md).
* **Whitelisted Reserves** — a smart-contract-level constraint that prevents the vault from allocating to reserves outside a protocol-verified set. Required for your vault to appear on Kamino's UI. Configure via [Enable Whitelisted Reserves](https://kamino.com/docs/curators/vaults/guides/enable-whitelisted-reserves.md).

See [Concepts → Risk primitives](https://kamino.com/docs/curators/vaults/concepts/risk-primitives.md) for the model.

## What you actually do

A typical curator workflow:

1. **Create the vault** — set deposit token, fees, operational parameters. ([Guide](https://kamino.com/docs/curators/vaults/guides/create-a-vault.md))
2. **Configure initial allocations** — pick reserves, set weights and caps. ([Guide](https://kamino.com/docs/curators/vaults/guides/configure-allocations.md))
3. **Set up risk primitives** — Insurance Pool, Whitelisted Reserves. ([Guides](https://kamino.com/docs/curators/vaults/guides/set-up-insurance-pool.md))
4. **Configure farms** — for reward distribution and autocompounding. ([Guide](https://kamino.com/docs/curators/vaults/guides/configure-farms.md))
5. **Transfer admin to multisig** — for production. ([Guide](https://kamino.com/docs/curators/vaults/guides/transfer-admin.md))
6. **Operate** — adjust allocations, monitor APY, collect fees, react to market conditions.

If your strategy includes fixed-rate reserves, see [Fixed Rates](https://kamino.com/docs/curators/vaults/fixed-rates.md) for the full FR-specific treatment.

## What's next

> **[Allocations](https://kamino.com/docs/curators/vaults/concepts/allocations.md)**
>
> The allocation primitive in depth.

> **[Create a vault](https://kamino.com/docs/curators/vaults/guides/create-a-vault.md)**
>
> Skip to the workflow.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
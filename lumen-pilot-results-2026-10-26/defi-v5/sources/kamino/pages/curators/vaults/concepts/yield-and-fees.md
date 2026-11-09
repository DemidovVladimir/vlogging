> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Yield & fees

> How vault yield is generated, the manager fee model, the withdrawal penalty, and farm reward distribution

A vault's economics have three sides: **yield** that depositors earn, **fees** that the curator charges, and **rewards** distributed via farms. This page covers all three as a model. Fees are configured at vault creation — see [Create a vault](https://kamino.com/docs/curators/vaults/guides/create-a-vault.md) — and farms are set up via [Configure farms](https://kamino.com/docs/curators/vaults/guides/configure-farms.md).

## How yield is generated

Vault yield comes entirely from interest paid by borrowers in the underlying reserves. There is no other yield source — if borrowers in your reserves aren't paying interest, depositors aren't earning.

Lender yield in any Kamino reserve follows the same formula:

```
supply APY ≈ borrow_rate × utilization × (1 − protocol_take_rate)
```

A vault's **blended APY** is the weighted average across all its allocations:

```
vault APY = Σ (reserve_APY_i × allocation_share_i)
```

The blended APY moves in real time as utilization shifts, allocations rebalance, and any Conditional fills or fixed-rate matches happen. The displayed APY is a trailing average and is not a forward-looking guarantee.

For the FR-specific economics (why Conditional allocation tends to higher utilization and how term premium contributes), see [Fixed Rates → Concepts](https://kamino.com/docs/curators/vaults/fixed-rates/concepts.md#economic-rationale).

## Auto-compounding via share price

Vault depositors don't receive interest payments. Instead, accrued interest grows the vault's total assets while the share count stays fixed — so the **share price** (kToken exchange rate) appreciates. A depositor who held one kToken at deposit redeems for more deposit tokens at withdrawal.

```
share_price = total_vault_assets / shares_outstanding
shares_minted = deposit_amount / share_price
```

There is no rebasing. The depositor's share count is stable.

## Manager fees

You earn revenue through two fees configured at [vault creation](https://kamino.com/docs/curators/vaults/guides/create-a-vault.md), both editable post-creation, both denominated in basis points (1 bp = 0.01%).

| Fee | Parameter | Basis | Default |
| - | - | - | - |
| **Performance fee** | `PerformanceFeeBps` | Vault profits | 0 |
| **AUM (management) fee** | `ManagementFeeBps` | Total vault assets, annualized | 0 |

Both fees accrue continuously in the deposit token. They are **not auto-collected** — you call a withdraw-pending-fees instruction when you want to claim. You can also give-up-pending-fees to return accrued fees to depositors (useful when fees grow disproportionately to vault size). For the workflow, see [Collect fees](https://kamino.com/docs/curators/vaults/guides/collect-fees.md).

### When to use which

* **Performance fee** rewards generated yield. It scales with how well the vault performs and aligns curator incentive with depositor outcome.
* **AUM fee** charges for active management regardless of yield. It scales with capital under management.

Most vaults run both. A typical institutional configuration: `PerformanceFeeBps: 1500` (15%), `ManagementFeeBps: 200` (2%). Both rates are editable post-creation — see [Collect fees → Update performance fee](https://kamino.com/docs/curators/vaults/guides/collect-fees.md#update-performance-fee).

## The withdrawal penalty

The withdrawal penalty is **a security mechanism, not manager revenue**. Penalties are returned to the vault, benefiting remaining depositors. It exists to prevent yield-sniping — the exploit where a user deposits just before an autocompound event, captures the yield, and immediately withdraws.

| Parameter | Type | Description |
| - | - | - |
| `WithdrawalPenaltyBps` | Basis points | Percentage withdrawal fee |
| `WithdrawalPenaltyLamports` | Lamports | Absolute withdrawal fee |

The system charges the **MAX** of the two for each withdrawal. The BPS-based fee scales with size; the lamports-based fee prevents dust exploits.

Recommended starting values: `WithdrawalPenaltyBps: 1` (0.01%), `WithdrawalPenaltyLamports: 1`. These are deliberately small — the penalty exists to defeat the exploit, not to deter normal withdrawal behaviour. Set both at [vault creation](https://kamino.com/docs/curators/vaults/guides/create-a-vault.md).

## The crank fund fee

A small per-deposit fee charged on each deposit to cover the computational cost of investing the deposited capital into reserves. Not curator revenue — funds the protocol's invest crank operations.

| Parameter | Type | Recommended |
| - | - | - |
| `CrankFundFeePerReserve` | Lamports | 1–2 per reserve in the vault's allocation |

Higher values on a vault with many small deposits (and many reserves) increase per-deposit cost. Most vaults leave this at the recommended floor. Set at [vault creation](https://kamino.com/docs/curators/vaults/guides/create-a-vault.md).

## Fee summary

| Fee | Recipient | Basis | Purpose |
| - | - | - | - |
| Performance Fee | Vault admin | Profits | Manager compensation for yield |
| AUM Fee | Vault admin | Annual % of assets | Manager compensation for management |
| Withdrawal Penalty (BPS) | Vault (depositors) | Withdrawal amount | Defeat yield-sniping |
| Withdrawal Penalty (Lamports) | Vault (depositors) | Absolute | Defeat dust exploits |
| Crank Fund Fee | Protocol | Per reserve, per deposit | Cover invest crank costs |

## Farm rewards

Beyond interest yield, you can distribute additional rewards to depositors via **farms**. Every vault supports three farm types:

| Farm | Role |
| - | - |
| **Vault Farm** | Distributes any reward token to depositors (kToken holders). One per vault. |
| **Insurance Pool farm** | Holds your skin-in-the-game capital that absorbs losses before depositors. Backs vault risk; see [Risk primitives](https://kamino.com/docs/curators/vaults/concepts/risk-primitives.md). |
| **Autocompound Farm** | Distributes rewards in the vault's deposit token, automatically compounding into vault positions. SDK support coming. |

### Vault Farm mechanics

The Vault Farm is a separate on-chain account attached to the vault. Once created, farm authority transfers to the protocol — you stop directly managing it. To distribute rewards, you fund the farm with the reward token; depositors claim proportional to their kToken holdings over the reward period.

The farm has a **cooldown period** — a delay before staked depositors can claim rewards. This prevents the exploit where a user deposits, claims rewards immediately, and withdraws. The cooldown ensures meaningful exposure before the claim entitlement.

To attach the Vault Farm and configure the cooldown, see [Configure farms](https://kamino.com/docs/curators/vaults/guides/configure-farms.md).

### Autocompound

The Autocompound Farm is a special-case farm where rewards are denominated in the vault's deposit token and automatically reinvested into vault positions. A USDC vault with an autocompound farm distributes USDC rewards that compound directly — no manual claim, no token management for the user.

This is currently configurable via the UI; SDK support is coming. See [Configure farms → Autocompound](https://kamino.com/docs/curators/vaults/guides/configure-farms.md#autocompound-farm).

### Insurance Pool farm

The Insurance Pool is implemented as a dedicated farm that holds the curator's locked capital. It interacts with the vault as a depositor but with stronger commitments (mandatory 30-day cooldown, public on-chain visibility, emergency-withdrawal multisig). Treat it as a risk primitive, not a yield mechanism — see [Risk primitives](https://kamino.com/docs/curators/vaults/concepts/risk-primitives.md) for the model and [Set up the Insurance Pool](https://kamino.com/docs/curators/vaults/guides/set-up-insurance-pool.md) for the workflow.

## What you display to depositors

Vaults surface several metrics on Kamino's UI:

* **Headline APY** — the blended interest APY across allocations.
* **KMNO emissions** (when active) — added to the headline APY.
* **Farm rewards** — typically displayed separately from the headline yield, since they're paid in non-deposit tokens.

Be aware: a 9% headline APY made up of 6% organic interest + 3% KMNO emissions is materially different from 9% paid entirely in deposit-token interest. The first carries token price risk in its yield; the second doesn't.

## What's next

> **[Collect fees](https://kamino.com/docs/curators/vaults/guides/collect-fees.md)**
>
> Withdraw pending fees, give up fees, and update fee rates.

> **[Configure farms](https://kamino.com/docs/curators/vaults/guides/configure-farms.md)**
>
> Set up the Vault Farm, Insurance Pool farm, and Autocompound farm.

> **[Risk primitives](https://kamino.com/docs/curators/vaults/concepts/risk-primitives.md)**
>
> The Insurance Pool and Whitelisted Reserves.

> **[Parameters](https://kamino.com/docs/curators/reference/parameters.md)**
>
> Full parameter reference.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
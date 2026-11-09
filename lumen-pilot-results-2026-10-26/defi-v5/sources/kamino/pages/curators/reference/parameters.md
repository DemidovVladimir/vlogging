> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Vault parameters

> Complete parameter reference for vault config, allocations, and farms

Canonical reference for every parameter on a Kamino vault. For the model behind each, follow the link in the description.

## Vault-level parameters

| Parameter | Type | Set at | Editable | Description |
| - | - | - | - | - |
| `Name` | String | Creation | Yes | Vault display name. Max 40 chars. |
| `VaultAdminAuthority` | Address | Creation | Yes (2-step transfer) | Vault admin. Production vaults transfer to a Squads multisig. See [Roles & ownership](https://kamino.com/docs/curators/vaults/concepts/roles-and-ownership.md). |
| `LookupTable` | Address | Creation | Yes (managed) | Address lookup table managed by the protocol. |
| `Farm` | Address | Post-creation | No (immutable once set) | Vault Farm — distributes rewards to kToken holders. See [Yield & fees](https://kamino.com/docs/curators/vaults/concepts/yield-and-fees.md#farm-rewards). |
| `FirstLossCapitalFarm` | Address | Post-creation | Yes | Insurance Pool farm. See [Risk primitives](https://kamino.com/docs/curators/vaults/concepts/risk-primitives.md). |
| `VaultAutocompoundFarm` | Address | Post-creation | Yes | Autocompound farm. See [Yield & fees](https://kamino.com/docs/curators/vaults/concepts/yield-and-fees.md#farm-rewards). |
| `PerformanceFeeBps` | Basis points | Creation | Yes | Fee on vault profits. See [Yield & fees](https://kamino.com/docs/curators/vaults/concepts/yield-and-fees.md#manager-fees). |
| `ManagementFeeBps` | Basis points | Creation | Yes | Annual fee on AUM. See [Yield & fees](https://kamino.com/docs/curators/vaults/concepts/yield-and-fees.md#manager-fees). |
| `MinDepositAmount` | Lamports | Creation | Yes | Minimum deposit per transaction. |
| `MinWithdrawAmount` | Lamports | Creation | Yes | Minimum withdrawal per transaction. |
| `MinInvestAmount` | Lamports | Creation | Yes | Minimum size for an investment instruction. |
| `MinInvestDelaySlots` | Slots | Creation | Yes | Delay between two investments in a specific reserve. |
| `WithdrawalPenaltyBps` | Basis points | Creation | Yes | Percentage withdrawal penalty (returned to vault). See [Yield & fees](https://kamino.com/docs/curators/vaults/concepts/yield-and-fees.md#the-withdrawal-penalty). |
| `WithdrawalPenaltyLamports` | Lamports | Creation | Yes | Absolute withdrawal penalty (returned to vault). The system charges the MAX of the two. |
| `CrankFundFeePerReserve` | Lamports | Post-creation | Yes | Per-reserve fee covering invest crank costs. |
| `PendingVaultAdmin` | Address | During transfer | System-managed | Pending admin during a two-step transfer. |
| `AllocationAdmin` | Address | Post-creation | Yes | Admin that can update weights, caps, types, and priorities only. See [Roles & ownership](https://kamino.com/docs/curators/vaults/concepts/roles-and-ownership.md#when-to-use-allocation-admin). |
| `UnallocatedWeight` | Integer | Post-creation | Yes | Relative weight for the unallocated buffer. See [Liquidity & withdrawals](https://kamino.com/docs/curators/vaults/concepts/liquidity-and-withdrawals.md#the-unallocated-buffer). |
| `UnallocatedTokensCap` | Lamports | Post-creation | Yes | Hard cap on the unallocated buffer. |
| `AllowAllocationsInWhitelistedReservesOnly` | Boolean | Post-creation | One-way (`true` only) | Restrict new allocations to verified reserves. Irreversible. See [Risk primitives](https://kamino.com/docs/curators/vaults/concepts/risk-primitives.md#whitelisted-reserves). |
| `AllowInvestInWhitelistedReservesOnly` | Boolean | Post-creation | One-way (`true` only) | Restrict investment to verified reserves. Irreversible. See [Risk primitives](https://kamino.com/docs/curators/vaults/concepts/risk-primitives.md#whitelisted-reserves). |

## Per-allocation parameters

| Parameter | Type | Editable | Description |
| - | - | - | - |
| `target_allocation_weight` | Integer | Yes | Relative weight for Standard allocations. Ignored for Conditional. See [Allocations](https://kamino.com/docs/curators/vaults/concepts/allocations.md#the-weight-system). |
| `allocation_cap` | Lamports | Yes | Maximum tokens deployed into this reserve. Binding limit for Conditional. See [Allocations](https://kamino.com/docs/curators/vaults/concepts/allocations.md#the-allocation-cap). |
| `reserve_type` | `Standard` \| `Conditional` | Yes | Allocation behavior. See [Allocations](https://kamino.com/docs/curators/vaults/concepts/allocations.md#standard-vs-conditional). |
| `priority` | Integer | Yes | Source-reserve eligibility for Conditional fills. Higher = more protected. See [Allocations](https://kamino.com/docs/curators/vaults/concepts/allocations.md#priority). |

## Farm parameters

| Parameter | Type | Description |
| - | - | - |
| `Farm` | Address | Vault Farm address (immutable after creation). |
| Farm cooldown period | Duration | Delay before stake-based rewards are claimable. Prevents deposit-claim-withdraw cycling. |
| `FirstLossCapitalFarm` | Address | Insurance Pool farm. Mandatory 30-day cooldown for normal withdrawals. See [Risk primitives](https://kamino.com/docs/curators/vaults/concepts/risk-primitives.md#the-insurance-pool). |
| `VaultAutocompoundFarm` | Address | Autocompound farm. Distributes rewards in the deposit token. |

## Immutable parameters

These cannot be changed after vault creation:

* **Deposit Token** (`tokenMint`) — the token the vault accepts.
* **Receipt Token Ticker prefix** — `kv[symbol]-`. The suffix is editable.
* **Farm address** — once set via farm creation.

## System-managed parameters

Set by the system, not directly by curators:

| Parameter | Description |
| - | - |
| `PendingVaultAdmin` | Set during admin transfer (step 1/2); cleared on claim or cancel. |
| Farm authority | Transferred to the protocol after farm creation. |

## Related references

> **[Glossary](https://kamino.com/docs/curators/reference/glossary.md)**
>
> One-line definitions for every term.

> **[Configure allocations](https://kamino.com/docs/curators/vaults/guides/configure-allocations.md)**
>
> Operational walkthrough — UI / SDK / CLI.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
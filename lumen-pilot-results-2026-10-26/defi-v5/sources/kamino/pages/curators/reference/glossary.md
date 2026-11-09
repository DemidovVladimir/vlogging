> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Glossary

> One-line definitions for every term used in the curator vault docs

Click any term to jump to the canonical treatment.

| Term | Definition |
| - | - |
| **Allocation Admin** | Limited admin role that can update weights, caps, types, and priorities on existing allocations only. See [Roles & ownership](https://kamino.com/docs/curators/vaults/concepts/roles-and-ownership.md#the-three-admin-roles). |
| **Allocation Cap** | Hard ceiling on tokens deployed into a single reserve. See [Allocations](https://kamino.com/docs/curators/vaults/concepts/allocations.md#the-allocation-cap). |
| **Allocation Weight** | Relative integer determining proportional share for Standard allocations. Ignored for Conditional. See [Allocations](https://kamino.com/docs/curators/vaults/concepts/allocations.md#the-weight-system). |
| **AUM Fee** | Annual percentage fee on total vault assets, paid to the vault admin. See [Yield & fees](https://kamino.com/docs/curators/vaults/concepts/yield-and-fees.md#manager-fees). |
| **Autocompound Farm** | Farm that distributes rewards in the deposit token, automatically compounding into vault positions. See [Yield & fees](https://kamino.com/docs/curators/vaults/concepts/yield-and-fees.md#farm-rewards). |
| **Borrow Order** | A standing on-chain intent to borrow specific terms. One of two demand paths into a fixed-rate reserve. See [Fixed Rates → Concepts](https://kamino.com/docs/curators/vaults/fixed-rates/concepts.md#how-borrowers-take-fixed-rate-liquidity). |
| **Conditional Allocation** | Allocation type that deploys capital only when borrow demand arrives. Recommended for fixed-rate reserves. See [Allocations](https://kamino.com/docs/curators/vaults/concepts/allocations.md#standard-vs-conditional). |
| **Crank** | Permissionless off-chain bot that triggers on-chain state updates such as rebalancing. |
| **Crank Fund Fee** | Per-deposit fee covering the cost of the invest crank. See [Yield & fees](https://kamino.com/docs/curators/vaults/concepts/yield-and-fees.md#the-crank-fund-fee). |
| **Curator** | Vault creator and manager — the admin (or multisig) controlling vault operations. |
| **Deposit Token** | The token a vault accepts. Immutable per vault. |
| **Direct Borrow** | An instant atomic borrow against available reserve liquidity. The other demand path alongside Borrow Orders. See [Fixed Rates → Concepts](https://kamino.com/docs/curators/vaults/fixed-rates/concepts.md#how-borrowers-take-fixed-rate-liquidity). |
| **Fixed-Rate Reserve** | Lending reserve with a constant borrow rate and a fixed term (e.g. `USDC 5.5% 3M`). See [Fixed Rates](https://kamino.com/docs/curators/vaults/fixed-rates.md). |
| **Floating-Rate Reserve** | Lending reserve with a utilization-based variable rate. |
| **Insurance Pool** | Curator-locked capital that absorbs losses before depositors. Implemented as `FirstLossCapitalFarm`. See [Risk primitives](https://kamino.com/docs/curators/vaults/concepts/risk-primitives.md#the-insurance-pool). |
| **kToken (Receipt Token)** | The vault's share token, issued to depositors. Format: `kv[DEPOSIT_SYMBOL]-[SUFFIX]`. |
| **Lamports** | Smallest unit of a token (e.g. 1 SOL = 1,000,000,000 lamports). |
| **Performance Fee** | Fee on vault profits, paid to the vault admin. See [Yield & fees](https://kamino.com/docs/curators/vaults/concepts/yield-and-fees.md#manager-fees). |
| **Priority** | Numerical value controlling which Standard allocations are eligible as source reserves for Conditional fills. Higher = more protected. See [Allocations](https://kamino.com/docs/curators/vaults/concepts/allocations.md#priority). |
| **Reserve** | A specific lending pool within a market. Vaults allocate capital to reserves. |
| **Squads** | Solana multisig used for production vault management. See [Roles & ownership](https://kamino.com/docs/curators/vaults/concepts/roles-and-ownership.md#the-squads-multisig-model). |
| **Standard Allocation** | Allocation type that deploys capital immediately and continuously per weight. See [Allocations](https://kamino.com/docs/curators/vaults/concepts/allocations.md#standard-vs-conditional). |
| **Sync Allocations** | Permissionless action to rebalance the vault toward target allocations. See [Allocations](https://kamino.com/docs/curators/vaults/concepts/allocations.md#sync-and-rebalance). |
| **Unallocated Funds** | Idle vault capital kept liquid for instant withdrawals. See [Liquidity & withdrawals](https://kamino.com/docs/curators/vaults/concepts/liquidity-and-withdrawals.md#the-unallocated-buffer). |
| **Vault Admin** | Full-control admin role for the vault. Production vaults transfer this to a Squads multisig. See [Roles & ownership](https://kamino.com/docs/curators/vaults/concepts/roles-and-ownership.md#the-three-admin-roles). |
| **Vault Farm** | The farm where depositors stake their kTokens to receive reward distributions. See [Yield & fees](https://kamino.com/docs/curators/vaults/concepts/yield-and-fees.md#farm-rewards). |
| **Whitelisted Reserves** | Smart-contract-level constraint preventing allocation to reserves outside Kamino's verified set. See [Risk primitives](https://kamino.com/docs/curators/vaults/concepts/risk-primitives.md#whitelisted-reserves). |
| **Withdrawal Penalty** | Security mechanism — fee on withdrawals returned to the vault to defeat yield-sniping. See [Yield & fees](https://kamino.com/docs/curators/vaults/concepts/yield-and-fees.md#the-withdrawal-penalty). |
| **Withdrawal Queue** | Per-reserve FIFO queue for exits when reserve liquidity is committed. See [Liquidity & withdrawals](https://kamino.com/docs/curators/vaults/concepts/liquidity-and-withdrawals.md#the-withdrawal-queue). |
| **Withdrawal Ticket** | An entry in the withdrawal queue. Has a sequence number, a queued amount, and a destination token account. |


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
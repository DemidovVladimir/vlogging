> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Curators & Fees

> Vault curators, fee structures, and trust features

## What curators do

Curators are the risk managers of a vault. Each vault has a single curator responsible for setting and updating allocation targets across Kamino's lending markets and reserves. A curator's core function is portfolio construction: deciding how much of the vault's capital goes to each reserve, which markets to enter or exit, and how to balance yield against concentration and utilization risk.

Active curators monitor reserve [utilization](https://kamino.com/docs/products/lending-vaults/concepts.md#utilization) rates, adjust allocations when yield opportunities shift, and respond to changing risk conditions across markets. A vault with an attentive curator can capture higher weighted yields than a static allocation by rotating capital toward higher-utilization reserves and away from reserves where borrowing demand has dropped.

No governance process governs individual allocation decisions. Curators act with discretion within the vault's parameters — depositors are extending trust to the curator's judgment.

## Trust features

Kamino vaults support two on-chain trust features that give depositors stronger guarantees about how their capital is managed and protected.

> **[Insurance Pool](https://kamino.com/docs/products/lending-vaults/insurance-pool.md)**
>
> Curators can lock their own capital into the vault with a cooldown period, giving them direct financial exposure to their own allocation decisions. The lockup prevents curators from exiting before depositors can react to adverse conditions.

> **[Whitelisted Reserves](https://kamino.com/docs/products/lending-vaults/whitelisted-reserves.md)**
>
> Vaults can be permanently restricted to only allocate into Kamino-approved reserves. This protocol-level constraint blocks allocation into fraudulent markets, even if the curator's admin key is compromised.

## Fee structure

Curator fees compensate the curator for active management. There are no fees charged at deposit.

| Fee type | Recipient | Based on | Purpose |
| - | - | - | - |
| Performance fee | Curator | Percentage of vault profits | Aligns curator with yield generation |
| AUM fee | Curator | Annual % of total vault assets | Compensates ongoing management |
| Withdrawal penalty | Vault (not curator) | Small % of withdrawn amount | Returned to vault to prevent deposit-yield-claim-withdraw exploits |

Performance fees are deducted from earned yield, not principal — you do not pay a performance fee on a loss. AUM fees are accrued continuously from total assets. The withdrawal penalty, unlike the other two, is not revenue for the curator; it is credited back to remaining depositors to disincentivize mercenary capital strategies.

## Multiple curators, one token

Multiple independent curators can create vaults for the same deposit token. A user depositing USDC may choose between several USDC vaults — each with a different curator, a different allocation strategy, different reserve exposure, a different fee structure, and different trust features.

Selecting a vault is selecting a curator and their strategy. Factors to compare across USDC vaults: trailing APY net of fees, [Insurance Pool](https://kamino.com/docs/products/lending-vaults/insurance-pool.md) commitment and lockup, [Whitelisted Reserves](https://kamino.com/docs/products/lending-vaults/whitelisted-reserves.md) status, allocation concentration across markets, and the curator's track record and public reputation.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
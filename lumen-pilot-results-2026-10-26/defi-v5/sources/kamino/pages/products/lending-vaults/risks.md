> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Risks

> Understanding the risks of depositing into Lending Vaults

> [!WARNING]
>
> Vault deposits are subject to curator allocation decisions and underlying lending market risks. Past vault performance does not guarantee future returns.

## Curator allocation risk

Curators manage vault allocations with discretion — no governance approval is required for allocation changes. A curator may deploy capital to reserves that underperform, become highly concentrated in a single market, or react slowly to deteriorating conditions. Depositors bear the risk of every allocation decision made after their deposit.

Before depositing, evaluate the curator's track record, their [Insurance Pool](https://kamino.com/docs/products/lending-vaults/insurance-pool.md) commitment and lockup duration, and any public documentation of their strategy. Vaults with transparent on-chain histories and meaningful Insurance Pool commitments provide stronger signals than vaults with neither.

## Lending market risk

Vaults allocate to Kamino's lending markets. If a borrower defaults and creates [bad debt](https://kamino.com/docs/products/lending-vaults/concepts.md#bad-debt) in a reserve, lenders — including the vault — absorb losses proportional to their share of that reserve. A vault allocated 40% to an affected reserve would absorb 40% of the losses attributable to the vault's share of that reserve.

Kamino's smart contracts have undergone 20 external security reviews and have no bad debt history to date. This track record provides meaningful evidence of contract security, but cannot guarantee that no future loss occurs. Lending protocols carry irreducible smart contract and market risk.

> [!NOTE]
>
> Vaults where the curator has locked capital in an [Insurance Pool](https://kamino.com/docs/products/lending-vaults/insurance-pool.md) provide stronger alignment — the curator has direct financial exposure to their own allocation decisions and cannot exit during the lockup window.

## Liquidity risk

Capital deployed to lending reserves is not always immediately available for recall. If the reserves in a vault's allocation are at high [utilization](https://kamino.com/docs/products/lending-vaults/concepts.md#utilization) — meaning most of the deposited capital has been borrowed — the vault cannot immediately return that capital to a withdrawing depositor. In this scenario, the withdrawal waits until borrowers repay and liquidity is restored to the reserve.

Kamino's interest rate curves are designed to prevent full utilization: borrow rates increase sharply as utilization approaches 100%, creating strong economic incentives for borrowers to repay. In practice, temporary high utilization is possible during periods of elevated borrowing demand, and a short withdrawal delay may result.

Vaults maintain a 5–10% unallocated buffer for instant withdrawals. Withdrawals within this buffer are unaffected by reserve utilization conditions.

## Fee drag

Performance fees and AUM fees are deducted from vault yield and assets respectively. The vault APY displayed on the interface reflects net yield after fees. When comparing vaults or comparing a vault against direct lending, use net APY figures — gross reserve yields do not reflect what depositors actually earn.

## Insurance Pool as protection

> [!TIP]
>
> Prioritize vaults where the curator has locked capital in an [Insurance Pool](https://kamino.com/docs/products/lending-vaults/insurance-pool.md) with a cooldown period of 30 days or longer. The lockup is what prevents a curator from quietly withdrawing their own capital before an adverse event becomes public.

The Insurance Pool is curator capital locked in the vault with a cooldown period. A vault where the curator has locked meaningful capital relative to the vault's TVL provides a stronger alignment signal — the curator has direct financial skin in the game and cannot exit before depositors can react. Verify the Insurance Pool amount and cooldown duration on-chain before committing significant capital to any vault.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
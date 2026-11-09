> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Lending Vaults

> Single-token managed yield aggregation across Kamino's lending markets

Lending Vaults are single-token yield aggregators where a curator allocates your deposited capital across Kamino's lending markets and reserves. Deposit one token — USDC, SOL, JLP — and receive vault shares that passively appreciate in value as interest accrues across the vault's active allocations. You earn yield without selecting markets, managing utilization exposure, or monitoring individual positions.

> **[How It Works](https://kamino.com/docs/products/lending-vaults/how-it-works.md)**
>
> Vault shares, yield mechanics, and how curators allocate capital across reserves

> **[Curators & Fees](https://kamino.com/docs/products/lending-vaults/curators)**
>
> Who manages vaults, fee structures, and trust features

> **[Risks](https://kamino.com/docs/products/lending-vaults/risks.md)**
>
> Allocation risk, liquidity constraints, and what protects depositors

> **[Concepts](https://kamino.com/docs/products/lending-vaults/concepts.md)**
>
> Reserves, utilization, share price, curators, and bad debt explained

## How shares work

When you deposit into a vault, shares are minted at the vault's current share price (net asset value per share). The number of shares you hold remains constant. As the vault earns interest from its allocations, the underlying assets per share increase — meaning the share price rises. When you withdraw, you redeem your shares at the current share price, receiving more of the deposit token than you put in.

Example: you deposit 1,000 USDC when the vault's share price is \$1.00, receiving 1,000 kvUSDC shares. After some time, accumulated interest has pushed the share price to \$1.06. Your 1,000 shares are now worth 1,060 USDC — a 6% gain with no action required on your part. The share price is a direct function of the vault's total assets divided by total shares outstanding, updated continuously as interest accrues from the underlying lending reserves.

> [!NOTE]
>
> This is [auto-compounding](https://kamino.com/docs/products/lending-vaults/concepts.md#share-price-and-auto-compounding) — earned interest is reinvested continuously without any action on your part. Your shares appreciate in value rather than distributing periodic payments.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
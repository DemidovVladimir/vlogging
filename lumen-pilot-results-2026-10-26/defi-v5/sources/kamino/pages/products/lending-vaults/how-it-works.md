> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# How It Works

> Vault shares, yield mechanics, allocation, and withdrawals

## Vault shares

Every vault has a [share price](https://kamino.com/docs/products/lending-vaults/concepts.md#share-price-and-auto-compounding) — the net asset value (NAV) per share — which starts at a base value and increases over time as interest accrues. When you deposit, shares are minted at the current share price. When you withdraw, shares are redeemed at the current (higher) share price. Your share count never changes between deposit and withdrawal; what changes is what each share is worth.

Worked example: you deposit 1,000 USDC when the vault share price is \$1.00, receiving 1,000 kvUSDC shares. The vault deploys your capital across its target reserves. Over a period of time, the weighted yield across those reserves compounds into the vault's total assets. When the share price reaches \$1.06, your 1,000 shares redeem for 1,060 USDC. Vault shares are standard fungible tokens and are visible in your wallet as a distinct token (e.g., kvUSDC-prime). They can be held, transferred, and used in other protocols that accept them as collateral.

## How yield is calculated

Vault yield is the weighted average of the APYs earned across all active reserve allocations:

```
Vault APY ≈ Σ (Reserve APY × Allocation Weight)
```

Each [reserve](https://kamino.com/docs/products/lending-vaults/concepts.md#what-is-a-lending-reserve) earns based on its [utilization](https://kamino.com/docs/products/lending-vaults/concepts.md#utilization) rate and the borrow rate curve set for that market. A reserve at 80% utilization earning 8% APY contributes proportionally to the vault's total yield based on how much of the vault's capital is deployed there. Allocation weights sum to 100% across all active reserves.

Because underlying borrow rates and utilization levels change continuously, vault APY fluctuates. Quoted APYs are trailing averages and are not guaranteed forward-looking rates. Both variable-rate and fixed-rate reserves can be part of a vault's allocation, and the yield model applies uniformly across both types.

## Allocation

[Curators](https://kamino.com/docs/products/lending-vaults/concepts.md#what-curators-do) set target allocation weights across reserves within Kamino's lending markets — SOL/BTC Market, JLP Market, Altcoin Market, Prime, and others. A typical USDC vault might target 60% in SOL/BTC Market USDC variable, 30% in JLP Market USDC, and 10% in fixed-rate reserves. The vault rebalances automatically toward these targets as capital flows in and out.

Individual depositors do not choose which reserves their capital enters. The vault aggregates all depositor capital and deploys it as a single pool according to the curator's allocation. This means your effective exposure is the blended risk and yield of the vault's full portfolio — not any single reserve.

Curators can update allocation targets at any time. Changes are executed on-chain and are transparent. Depositors bear the risk of future allocation decisions made by the curator after they deposit.

## Variable vs. fixed-rate allocation

Vaults can include both types of reserves in their allocation:

* **[Variable-rate reserves](https://kamino.com/docs/products/lending-vaults/concepts.md#variable-vs-fixed-reserves)** — capital is always deployed and earns the prevailing borrow rate, which moves with utilization.
* **[Fixed-rate reserves](https://kamino.com/docs/products/lending-vaults/concepts.md#variable-vs-fixed-reserves)** — capital is held in a conditional liquidity position. It earns the variable rate while waiting, and transitions to a fixed rate when a matched borrower requests the capital. This allows vaults to earn fixed yields on a portion of their portfolio without sacrificing liquidity.

See [Fixed Rates](https://kamino.com/docs/products/borrow/fixed-rates.md) for a full description of how conditional liquidity and fixed-rate matching work.

## Withdrawals

Vaults maintain an unallocated buffer — typically 5–10% of total vault assets — held as liquid capital not deployed to any reserve. Withdrawals within this buffer are processed instantly.

For withdrawals larger than the buffer, the vault must recall capital from the underlying reserves. In normal market conditions, reserves have sufficient undeployed liquidity to accommodate recall requests promptly, and this process is seamless from the user's perspective.

> [!NOTE]
>
> Withdrawals are available as long as the underlying reserves have liquid capital. Kamino's interest rate curves are designed to prevent full depletion of reserve liquidity by increasing borrow rates sharply as utilization approaches 100%, creating economic pressure for borrowers to repay.

In high-utilization scenarios where reserve liquidity is constrained, a withdrawal may be delayed until borrowers repay and liquidity is restored. This is a temporary condition tied to market activity rather than a vault-specific mechanism. Vault depositors who require guaranteed same-block liquidity should size their position relative to the vault's available buffer.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
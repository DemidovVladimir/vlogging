> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# How It Works

> The mechanics behind Multiply — flash loans, eMode, and yield amplification

> [!WARNING]
>
> Multiply positions carry liquidation risk. The higher the leverage, the smaller the buffer between your current LTV and the liquidation threshold. Borrow rates are variable — if they exceed collateral yield for a sustained period, your debt grows relative to your collateral.

Multiply opens, adjusts, and closes leveraged positions in a single atomic transaction. The mechanism relies on a [flash loan](https://kamino.com/docs/products/multiply/concepts.md#flash-loans): an uncollateralized borrow that is borrowed and repaid within the same transaction block, with no exposure beyond that block. If the transaction cannot repay the flash loan — due to slippage, insufficient liquidity, or any other failure — the entire transaction reverts and no position is created.

The flash loan fee is **0.001% per transaction**, applied at open, adjustment, and close.

**A Multiply position opens in seven steps:**

1. User specifies deposit amount and target leverage multiplier
2. Protocol borrows the required additional amount via flash loan
3. Flash-borrowed funds and user deposit are swapped into the target asset (e.g., SOL → JitoSOL) via Kamino Swap
4. The full target asset amount is deposited into Kamino Lend as collateral
5. The underlying asset (e.g., SOL) is borrowed against the deposited collateral
6. Borrowed funds repay the flash loan
7. Position is established at target leverage with collateral and debt recorded on Kamino Lend

Closing a position reverses this flow: flash loan borrows enough to repay the debt, collateral is withdrawn, a portion is swapped back to repay the flash loan, and the remainder is returned to the user.

## Elevation Mode (eMode)

[eMode](https://kamino.com/docs/products/multiply/concepts.md#emode-in-multiply) groups correlated asset pairs under elevated LTV ratios. Standard lending markets limit LTV to protect against price divergence between collateral and debt assets — but when collateral and debt are closely correlated (e.g., JitoSOL and SOL), that divergence risk is minimal. eMode reflects this by raising the maximum permitted LTV.

| Mode | Example Pair | Max LTV | Max Leverage |
| - | - | - | - |
| Standard | SOL collateral / USDC debt | 75% | \~4x |
| eMode — SOL/BTC Market | mSOL, bSOL, JupSOL vs SOL | \~87% | \~7.5x |
| eMode — Jito Market | JitoSOL vs SOL | 90% | 10x |
| No eMode | JLP vs USDC | 67% | \~3.2x |

> [!NOTE]
>
> eMode only applies between designated correlated pairs. JLP/USDC has no eMode because JLP's value is not pegged to USDC — it tracks a basket of perpetuals market assets and fluctuates independently.

Higher LTV ratios from eMode shrink the gap between your operating LTV and the liquidation threshold. Operating near maximum leverage in an eMode pair means small adverse moves in the yield spread can have a significant effect on position health.

## Net APY Mechanics

Multiply is profitable when collateral yield exceeds the borrow rate. Leverage amplifies both the gain and the loss symmetrically. See [Net APY — the fundamental equation](https://kamino.com/docs/products/multiply/concepts.md#net-apy--the-fundamental-equation) for the full breakdown across all strategy types.

```
Net APY = (Collateral Yield × Leverage) − (Borrow Rate × (Leverage − 1))
```

Equivalently: `Net APY = Collateral Yield + Yield Spread × (Leverage − 1)`

Where **[Yield Spread](https://kamino.com/docs/products/multiply/concepts.md#net-apy--the-fundamental-equation) = Collateral Yield − Borrow Rate**.

A positive spread grows larger with leverage. A negative spread grows more negative with leverage. There is no floor.

**Worked example — 8x JitoSOL/SOL position:**

| Metric | Value |
| - | - |
| Initial deposit | 1,000 SOL |
| Leverage | 8x |
| Total SOL exposure | 8,000 SOL |
| Total SOL debt | 7,000 SOL |
| LTV | 87.5% |
| JitoSOL APY | 7% |
| SOL borrow rate | 6% |
| Staking yield earned | 560 SOL |
| Borrow cost | 420 SOL |
| Net SOL earned | 140 SOL |
| Net APY on initial deposit | **14%** |

> [!WARNING]
>
> Borrow rates on Kamino Lend are variable and adjust based on market utilization. If SOL borrow rate rises from 6% to 7.5% in this example while JitoSOL APY remains at 7%, the yield spread inverts and Net APY goes negative. Monitor the spread, not just the headline APY shown at position open.

## Stake-Rate Oracle Protection

[SOL LST](https://kamino.com/docs/products/multiply/concepts.md#liquid-staking-tokens-lsts) Multiply positions use the **stake pool exchange rate** to price the LST collateral, not the spot market price. The exchange rate is derived from the underlying staking protocol:

```
LST Price = SOL_staked / LST_minted
```

This ratio increases monotonically each epoch as staking rewards accrue into the pool. It does not track the market price of the LST on secondary markets.

**Why this matters:** If JitoSOL trades at a temporary market discount — say, 0.95 SOL instead of the theoretical 1.05 SOL — the LTV calculation on your Multiply position uses 1.05 SOL. The market dislocation does not affect your position health. This is the primary reason zero SOL LST Multiply positions have been liquidated: temporary market depegs, which have historically been the main source of unexpected LST liquidations across DeFi, do not trigger liquidation in Kamino.

> [!WARNING]
>
> Stake-rate oracle protection does not cover smart contract exploits in the underlying staking protocol. If the staking protocol itself is compromised and the actual SOL\_staked value declines, the exchange rate falls and LTV deteriorates accordingly. This is an unmitigated risk in any LST position.

## Fixed-Rate Borrow Integration

Variable borrow rates introduce uncertainty into the yield spread. [Fixed-rate borrowing](https://kamino.com/docs/products/borrow/fixed-rates.md) via Kamino's fixed-rate market allows locking the borrow cost for the full term of a position, converting a variable-spread strategy into a predictable one. This eliminates borrow rate risk at the cost of typically paying a small premium over the variable rate at time of entry.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
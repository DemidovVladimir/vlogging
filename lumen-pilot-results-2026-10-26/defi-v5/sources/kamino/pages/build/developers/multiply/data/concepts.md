> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# LTV and Leverage Concepts

> Understanding the relationship between LTV ratios and leverage multipliers in Multiply positions

## Core Position Calculations

Three calculations describe any leveraged position: Net Equity (the capital at risk), Leverage (the amplification multiplier), and Max Leverage (the protocol's constraint).

**Net Equity**

**Definition:** Actual ownership value after repaying all debt.

**Formula:**

```
Net Equity = Total Collateral Value - Total Debt Value
```

**Example:** `$5,000 collateral - $4,000 debt = $1,000 net equity`

**API/SDK Source:** `obligationStats.netAccountValue`

**Significance:** Net equity represents the initial capital plus accumulated profits or minus accumulated losses. When collateral value decreases or debt increases, net equity declines proportionally. Liquidation occurs when net equity approaches zero (when Current LTV approaches Liquidation LTV).

**Leverage**

**Definition:** The leverage multiplier — total exposure compared to net equity.

**Formula:**

```
Leverage = Total Collateral Value / Net Equity
```

**Example:** `$5,000 collateral / $1,000 equity = 5x leverage`

**API/SDK Source:** `obligationStats.leverage` (pre-calculated)

**Significance:** A 5x leverage position controls \$5,000 worth of collateral with \$1,000 of equity. A 10% collateral price movement results in a 50% change in equity value. Higher leverage amplifies both gains and losses proportionally.

**Max Leverage**

**Definition:** The maximum leverage multiplier permitted by the market's Liquidation LTV limit.

**Formula:**

```
Max Leverage = 1 / (1 - Liquidation LTV)
```

**Example:** `Liquidation LTV of 80% = 1 / (1 - 0.80) = 5x max leverage`

**Calculation Required:** Must compute from `reserve.liquidationLtv`

**Significance:** Borrowing cannot exceed this limit. Higher Liquidation LTV enables higher maximum leverage but reduces the safety buffer before liquidation. Positions operating near maximum leverage require continuous monitoring of the yield spread (collateral yield minus borrow rate).

***

## Profitability: Net APY

Leverage amplifies both yield and costs. Net APY quantifies whether a leveraged position generates profit after accounting for borrow costs.

### Formulas

```
Net APY = (Collateral Yield × Leverage) - (Borrow Rate × (Leverage - 1))
```

Alternatively, using **Yield Spread = Collateral Yield - Borrow Rate**:

```
Net APY = Collateral Yield + (Yield Spread × (Leverage - 1))
```

> [!NOTE]
>
> Net APY depends on three variables: collateral yield (from reserve supply APY), borrow rate (from reserve borrow APY), and leverage (from user input or current position). All three values are dynamic and adjust with market conditions. Integrations should recalculate Net APY whenever leverage changes or at regular intervals (e.g., every 60 seconds) to reflect current rates.

### Examples

**Positive Spread**

| Metric | Value |
| - | - |
| Collateral Yield (JitoSOL) | 7% |
| Borrow Rate (SOL) | 6% |
| Leverage | 8x |
| Yield Spread | 1% |
| **Net APY** | **14%** |

**Calculation:** 7% + (1% × 7) = 14%

Positive spread amplified by leverage produces outsized returns.

**Negative Spread**

| Metric | Value |
| - | - |
| Collateral Yield | 6% |
| Borrow Rate | 8% |
| Leverage | 3x |
| Yield Spread | -2% |
| **Net APY** | **2%** |

**Calculation:** 6% + (-2% × 2) = 2%

Negative spread amplified by leverage erodes returns. An unlevered position would earn 6%, but leverage reduces net yield to 2%.

**RWA Example**

| Metric | Value |
| - | - |
| Collateral Yield (PRIME) | 8% |
| Borrow Rate (PYUSD) | 5% |
| Leverage | 4x |
| Yield Spread | 3% |
| **Net APY** | **17%** |

**Calculation:** 8% + (3% × 3) = 17%

RWA strategies can achieve high Net APY with moderate leverage when base yield structurally exceeds stablecoin borrow rates.

> [!WARNING]
>
> Borrow rates are variable and adjust based on market utilization. A positive yield spread today can flip negative during high-utilization periods. Monitor the spread continuously—not just the headline APY shown at position open.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
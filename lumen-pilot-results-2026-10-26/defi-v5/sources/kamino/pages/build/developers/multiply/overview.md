> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Multiply

> Understanding how Multiply creates leveraged positions through atomic looping with flash loans

## What is Multiply?

Multiply creates leveraged positions in a single atomic transaction by automating the looping process through flash loans. Instead of manually executing 8-10 separate deposit-borrow-swap cycles, Multiply collapses the entire leverage-building process into one transaction that either succeeds completely or reverts with no state changes.

### Borrow and Multiply SDK Methods

| Method | Operation | When to Use |
| - | - | - |
| `getDepositWithLeverageIxs` | Open position or add collateral | Creating or adding to a leveraged position |
| `buildRepayTxns` | Repay with wallet funds | Reducing debt using USDC, SOL, etc. from wallet |
| `buildWithdrawTxns` | Withdraw collateral | Withdrawing collateral after debt is repaid |
| `getWithdrawWithLeverageIxs` | Deleverage and withdraw | Sell collateral to repay debt and receive remaining value in wallet |
| `getRepayWithCollIxs` | Repay debt with collateral | Sell collateral to repay debt without withdrawing (value stays in position) |

> [!NOTE]
>
> **Multiply operations** use `MultiplyObligation`. **Standard borrow operations** use `VanillaObligation`. The obligation type determines which PDA is derived for your position.

### Borrow and Multiply: Rust Crate Helpers

The Rust [`klend-interface`](https://crates.io/crates/klend-interface) crate exposes the lending primitives and flash loans, but does not include leveraged combo helpers.

| Helper | Operation | When to Use |
| - | - | - |
| `helpers::flash::flash_loan` | Atomic flash borrow + repay pair | Building any flash-loan-based flow |
| `ObligationContext.repay` | Repay with wallet funds | Reducing debt using USDC, SOL, etc. from wallet |
| `ObligationContext.withdraw` | Withdraw collateral | Withdrawing collateral after debt is repaid |

> [!NOTE]
>
> Leveraged combo operations (`getDepositWithLeverageIxs`, `getWithdrawWithLeverageIxs`, `getRepayWithCollIxs`) are **not** available in the Rust crate — they bundle flash loans with KSwap routing, which only the TypeScript SDK builds.

***

## SDK vs API vs Rust Crate: What's Available

Understanding which operations are reachable from the SDK, the API, and the Rust crate is critical for building Multiply integrations.

| Operation | SDK | API | Rust Crate | Notes |
| - | - | - | - | - |
| **Flash Loans** | Available | Not available | Available | Atomic transactions — SDK or Rust crate |
| **Multiply Deposit (with KSwap)** | Required | Not available | Not available | Leveraged positions with swap routing — SDK only |
| **Standard Borrow Operations** | Available | Available | Available | Deposit, borrow, repay, withdraw across SDK / API / Rust |
| **Position Data** | Available | Available | Available | Read obligation data via any path |
| **Market Reserve Data** | Available | Available | Limited | APYs, utilization, liquidity via SDK or API |

## Flash Loans

A flash loan is an uncollateralized loan that must be borrowed and fully repaid within the same transaction block. This atomic property makes flash loans risk-free for the protocol.

### Flash Loan Properties

| Property | Description |
| - | - |
| **Collateral Required** | None — uncollateralized |
| **Repayment Window** | Same transaction block |
| **Failure Behavior** | Entire transaction reverts (no state changes) |
| **Fee** | 0.001% per transaction |
| **Risk to Protocol** | Zero — atomicity guarantees repayment or reversion |

> [!NOTE]
>
> If a flash loan cannot be repaid — due to slippage, insufficient liquidity, or any other failure — the entire transaction reverts. No intermediate state is committed to the blockchain.

***

## Looping: Manual vs Atomic

Looping is the process of repeatedly depositing collateral, borrowing against it, and reinvesting the borrowed funds to amplify exposure. The method determines risk, cost, and execution complexity.

### Comparison Table

| Aspect | Manual Looping | Atomic Looping (Multiply) |
| - | - | - |
| **Transaction Count** | 8-10 separate transactions | 1 atomic transaction |
| **Price Exposure** | Exposed to price changes between each step | No exposure — all steps execute atomically |
| **Slippage Risk** | Slippage on each swap individually | Single consolidated slippage check |
| **Gas Costs** | Higher — multiple transactions | Lower — single transaction |
| **Execution Risk** | High — any step can fail independently | Low — all-or-nothing execution |
| **Time to Complete** | Minutes (dependent on block confirmations) | Single block (\~400ms on Solana) |
| **Complexity** | Requires manual coordination of steps | Fully automated |

> [!WARNING]
>
> Manual looping exposes you to market price movements between transactions. If the collateral asset price drops or borrow rates spike mid-loop, you may end up with a worse position than intended — or fail to complete the loop entirely.

***

## The Multiply Transaction Flow

Multiply executes leverage creation in a precise sequence of steps within a single atomic transaction.

**1. Flash Borrow**

Protocol borrows the required debt token amount (e.g., SOL) via flash loan. No collateral is required.

**2. Swap to Collateral**

Flash-borrowed funds are swapped into the target collateral asset (e.g., SOL → JitoSOL) using Kamino Swap (KSwap) with multi-DEX routing for optimal execution.

**3. Deposit Collateral**

The full collateral amount (user deposit + swapped amount) is deposited into Kamino Lend as collateral.

**4. Borrow Against Collateral**

With collateral deposited, the protocol borrows the debt token against the collateral position.

**5. Repay Flash Loan**

Borrowed funds are used to repay the flash loan plus the 0.001% fee.

**6. Position Established**

Net result: Leveraged position with amplified collateral exposure and outstanding debt balance recorded on Kamino Lend.

> [!NOTE]
>
> All steps execute in a single transaction. If any step fails (slippage exceeds tolerance, insufficient liquidity, etc.), the entire transaction reverts and no position is created.

***

## eMode (Elevation Mode)

eMode enables significantly higher leverage for correlated asset pairs by raising the maximum permitted LTV ratio.

### How eMode Works

Standard lending markets limit LTV to protect against price divergence between collateral and debt. When both assets are highly correlated (e.g., JitoSOL and SOL), price divergence risk is minimal — both assets move together. eMode reflects this reduced risk by permitting higher LTV ratios.

### eMode Leverage Comparison

| Mode | Asset Pair | Max LTV | Max Leverage | Use Case |
| - | - | - | - | - |
| **Standard** | SOL / USDC | 75% | 4x | Uncorrelated assets |
| **eMode (Main)** | mSOL, bSOL, JupSOL / SOL | \~87% | \~7.7x | Correlated LST/SOL pairs |
| **eMode (Jito)** | JitoSOL / SOL | 90% | 10x | JitoSOL-specific correlation |
| **No eMode** | JLP / USDC | 67% | \~3.2x | Uncorrelated (JLP is basket of assets) |

> [!WARNING]
>
> Higher LTV from eMode means a smaller buffer between your operating LTV and liquidation threshold. Operating near maximum eMode leverage requires continuous monitoring of the yield spread (collateral yield minus borrow rate).

### Why Correlation Matters

**Correlated pairs (LST/SOL)**: When SOL price moves, both JitoSOL and SOL debt move proportionally. Your LTV ratio stays relatively stable regardless of SOL's USD price.

**Uncorrelated pairs (JLP/USDC)**: JLP value fluctuates with crypto markets while USDC stays flat. Price drops in SOL/ETH/BTC directly increase your LTV, creating liquidation risk independent of borrow rates.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
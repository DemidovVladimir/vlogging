> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# E-Mode Caps

> Per-pair borrow limits that enable granular risk control for each collateral/debt combination

E-Mode Caps is a novel risk management mechanism that enables each collateral/debt pairing on Kamino to have a unique debt limit. This introduces granular per-pair risk control into a pool-based lending model — a capability that most lending protocols lack.

## The Problem with Pool-Wide Caps

In a traditional multi-asset lending pool (Kamino Lend V1, Aave V3), borrow caps are set per asset — not per pair. If the protocol raises the USDC borrow cap by \$10M, users can borrow that additional USDC against *any* available collateral in the pool.

But not all collateral is equal. SOL is deeply liquid and can be liquidated efficiently at large sizes. A newer token might have thin liquidity and high liquidation risk. In a pool-wide cap model, the borrow cap is constrained by the riskiest available collateral — because the protocol must assume that all new borrows could be collateralized by that weakest asset.

This creates a scaling problem: to protect against risk from low-quality collateral, the protocol must restrict borrowing capacity against high-quality collateral. Conservative caps for the weakest asset penalize users of the strongest asset.

## What E-Mode Caps Enable

E-Mode Caps decouple borrow limits by collateral/debt pair. Instead of a single USDC borrow cap, the protocol can set:

| Pair | Cap |
| - | - |
| SOL / USDC | \$50M |
| wBTC / USDC | \$30M |
| JUP / USDC | \$5M |
| Other / USDC | \$0 (no E-Mode access) |

Now the SOL/USDC cap can be raised aggressively — reflecting SOL's deep liquidity and efficient liquidation — without increasing exposure through JUP/USDC, where liquidation risk is higher.

The result: **more capital efficiency for borrowers using high-quality collateral, without compromising protocol safety**.

## How E-Mode Works

### Automatic Detection

Users do not need to manually enter or exit E-Mode. The system automatically detects whether a user qualifies for E-Mode based on the assets in their loan:

* **Single collateral + single debt** that matches an E-Mode pair → E-Mode cap applies
* **Multiple collateral or debt assets** → standard pool-wide caps apply

### When You CAN Access E-Mode

Using the example above (SOL/USDC and wBTC/USDC E-Mode pairs):

* A loan with **only SOL supplied** can borrow USDC up to the SOL/USDC E-Mode cap
* A loan with **only wBTC supplied** can borrow USDC up to the wBTC/USDC E-Mode cap

### When You CANNOT Access E-Mode

E-Mode Caps support **single-collateral, single-debt combinations only**. Any position that does not contain exactly one collateral and one debt asset within an E-Mode grouping cannot access E-Mode:

* A loan with **both SOL and wBTC supplied** cannot borrow PYUSD via E-Mode — the position has multiple collateral assets
* A loan with **SOL supplied and USDC already borrowed** cannot additionally borrow PYUSD via the SOL/PYUSD E-Mode — the position already has debt outside the E-Mode pair
* A loan with **SOL and another collateral supplied** cannot access any SOL-based E-Mode

### Accessing E-Mode with Existing Positions

If you want to access E-Mode borrow capacity but your current loan contains assets outside the E-Mode pair, you have two options:

1. **Remove non-E-Mode assets** from the position (repay other debts, withdraw other collateral)
2. **Open a separate loan** from a different wallet dedicated to the E-Mode pair

## Why This Matters for Risk Management

E-Mode Caps transform how the protocol manages collateral risk:

### Targeted Scaling

High-quality collateral pairs (SOL/USDC, JitoSOL/SOL) can be scaled aggressively because the liquidity and correlation characteristics are well-understood. Low-quality pairs can be capped tightly or excluded entirely. The protocol grows where it's safe, and restricts where it's risky.

### Precise Liquidation Sizing

Because each pair has its own cap, the maximum position size for each pair is known. This allows [market risk analysis](https://kamino.com/docs/risk/market-risk) to verify — per pair — that the maximum position can be liquidated profitably given the collateral's specific liquidity profile. Pool-wide caps cannot provide this guarantee because the maximum position could use any collateral.

### Risk Isolation

If a specific collateral asset deteriorates (liquidity drops, volatility spikes), only the E-Mode cap for that pair needs to be adjusted. Other pairs are unaffected. This provides surgical risk control without disrupting the broader market.

### Correlation-Aware Parameterization

Correlated pairs (e.g., JitoSOL/SOL) can have higher E-Mode caps because the collateral and debt move together — the LTV ratio is inherently stable. Uncorrelated pairs (e.g., SOL/USDC) need more conservative caps because a SOL crash directly impairs the collateral while leaving the debt unchanged.

This distinction — which pool-wide caps cannot make — is central to capital-efficient lending with sound risk management.

## Interaction with Other Safeguards

E-Mode Caps operate alongside other risk mechanisms:

* **[Daily caps](https://kamino.com/docs/risk/safeguards/daily-caps.md):** Even within an E-Mode pair, daily caps limit how quickly new positions can be built
* **Supply and borrow caps:** Global per-reserve limits still apply — E-Mode caps provide additional granularity within those limits
* **LTV limits:** Each E-Mode pair can have its own LTV parameters, reflecting the specific risk profile of that collateral/debt combination
* **[Auto-deleverage](https://kamino.com/docs/risk/safeguards/auto-deleverage.md):** If conditions deteriorate for a specific collateral, auto-deleverage can target positions in that E-Mode pair specifically


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
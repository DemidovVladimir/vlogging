> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Concepts

> Flash loans, looping, Net APY, and the three categories of Multiply strategies — LSTs, JLP, and RWAs

## Flash loans

A flash loan is an uncollateralized loan that is borrowed and fully repaid within the same transaction block. If repayment fails for any reason — slippage, insufficient liquidity, contract error — the entire transaction reverts as if it never happened. The protocol carries zero risk from the loan itself: state changes only commit if repayment succeeds.

The fee is **0.001% per transaction** — applied when opening, adjusting, or closing a Multiply position.

Flash loans are the enabling technology behind atomic looping. Without them, building a leveraged position requires 8–10 separate transactions across multiple blocks, each exposed to price movement and execution risk. With a flash loan, the entire sequence executes atomically in a single transaction.

***

## Looping — how leverage is built

Looping is the process of repeatedly depositing a yield-bearing asset, borrowing against it, and reinvesting the borrowed amount to amplify yield exposure. The leverage is built through this cycle.

**Without flash loans**, manual looping looks like this:

1. Deposit JitoSOL as collateral
2. Borrow SOL against it
3. Swap SOL to JitoSOL
4. Re-deposit — repeat across 8–10 transactions

Each step carries price exposure, slippage, and execution risk. Rates or prices can move between steps.

**With flash loans**, the entire sequence is atomic. For a JitoSOL/SOL position:

1. Take a flash loan of SOL
2. Swap SOL to JitoSOL
3. Deposit JitoSOL as collateral into Kamino Lend
4. Borrow SOL against the deposited collateral
5. Repay the flash loan with the borrowed SOL
6. Net result: JitoSOL collateral on deposit, SOL debt outstanding, levered position established

The protocol handles all steps. The user selects a target leverage multiplier and clicks once. Either the full position opens at that leverage, or nothing executes.

***

## The leverage ratio

```
Leverage = Total collateral value / Net equity
Net equity = Total collateral value − Total debt value
```

With \$8,000 JitoSOL collateral and \$7,000 SOL debt:

* Net equity = \$1,000
* Leverage = 8x

The maximum achievable leverage is bounded by Max LTV:

```
Max leverage = 1 / (1 − Max LTV)
```

| Max LTV | Max leverage |
| - | - |
| 75% | 4x |
| 87% (eMode) | \~7.7x |
| 90% (eMode Jito) | 10x |

Operating at the maximum puts Current LTV exactly at the liquidation threshold. Real positions always require a buffer below the limit.

***

## Net APY — the fundamental equation

Net APY is the primary metric for evaluating any Multiply position. It captures the amplified yield minus the amplified borrow cost.

```
Net APY = (Collateral Yield × Leverage) − (Borrow Rate × (Leverage − 1))
```

Equivalently, using **Yield Spread = Collateral Yield − Borrow Rate**:

```
Net APY = Collateral Yield + Yield Spread × (Leverage − 1)
```

A positive spread grows with leverage. A negative spread grows more negative with leverage. There is no floor.

**LST example — JitoSOL/SOL at 8x, 7% staking yield, 6% SOL borrow rate:**

```
Net APY = 7% + (7% − 6%) × (8 − 1)
        = 7% + 7%
        = 14%
```

**RWA example — PRIME/PYUSD at 4x, 8% base yield, 5% PYUSD borrow rate:**

```
Net APY = 8% + (8% − 5%) × (4 − 1)
        = 8% + 9%
        = 17%
```

**Negative spread example — 3x leverage, 6% collateral yield, 8% borrow rate:**

```
Net APY = 6% + (6% − 8%) × (3 − 1)
        = 6% − 4%
        = 2%
```

Unlevered return would have been 6%. Adding 3x leverage reduced it to 2%. Higher leverage makes it worse.

> [!WARNING]
>
> Borrow rates on Kamino Lend are variable and adjust based on market utilization. A positive yield spread today can flip negative during high-utilization periods without any action on your part. Monitor the spread continuously — not just the headline APY shown at position open.

***

## Liquid staking tokens (LSTs)

**Staking** is the process of locking SOL with a validator to help secure the Solana network. Validators earn rewards each epoch, which are distributed to stakers.

A **liquid staking token** (LST) represents a claim on staked SOL. Instead of locking SOL directly, you deposit into a staking pool and receive an LST in return. The LST earns yield not through periodic distributions but through exchange rate appreciation: as staking rewards accrue into the pool, each LST becomes redeemable for more SOL.

```
LST exchange rate = SOL_staked / LST_minted
```

This ratio increases monotonically each epoch. Supported LSTs on Multiply: JitoSOL, mSOL, bSOL, JupSOL.

**Why LSTs are well-suited for leverage:** The yield source is structural — validator rewards accrue on every epoch regardless of market conditions or protocol usage. The staking yield exists whether or not anyone is using Multiply. This is distinct from fee-driven yield (like JLP) or credit market yield (like RWAs), both of which can compress or disappear.

***

## JLP — what it is and why the risk profile differs

JLP (Jupiter Liquidity Provider token) is a basket token issued by Jupiter's perpetuals exchange. Its composition is approximately:

* \~65% crypto-native assets (SOL, ETH, BTC)
* \~35% stablecoins (USDC, USDT)

JLP earns yield from trading fees and funding payments generated by Jupiter's perpetuals platform. Unlike LSTs, JLP is **market-price denominated** — its USD value rises and falls with SOL, ETH, and BTC prices.

**Key difference for leverage:** In a JLP/USDC Multiply position, the collateral (JLP) can decline in USD terms while the debt (USDC) stays flat. This raises the LTV directly, independent of any borrow rate dynamics. Liquidation can be triggered by price action alone.

JLP and USDC are not correlated, so eMode does not apply. This limits JLP Multiply to a maximum of \~3.2x leverage, compared to up to 10x for LST/SOL eMode pairs. The \~35% stablecoin component in JLP provides a partial downside buffer but does not eliminate price liquidation risk.

***

## RWA tokens — real-world yield on leverage

Real-world asset (RWA) tokens represent on-chain claims on off-chain financial instruments. Their yield comes from real-world cash flows — loan interest, insurance premiums, credit market returns — that are structurally uncorrelated to crypto market performance.

Multiply supports three RWA tokens:

**PRIME** (\~8% base yield)
Tokenized US home equity loans (HELOCs) originated by Figure Finance. Maintains an approximate \$1 USD peg. Borrowed against PYUSD at up to \~8.3x leverage (88% LTV). Yield is generated by interest payments from HELOC borrowers.

**ONyc** (\~16% base yield)
Reinsurance-backed yield from OnRe Finance, combining \~8% insurance premiums and \~8% stablecoin yield. NAV is verified on-chain via a Chainlink oracle. Borrowed against stablecoins.

**SyrupUSDC** (\~5–6% base yield)
Maple Finance institutional credit market yield, delivered via Chainlink CCIP bridge. Borrowed against stablecoins at 4–5x leverage.

The looping mechanism for RWA tokens is identical to LSTs — the same flash loan structure, the same Net APY formula. What differs is the yield source and the nature of the risk.

> [!NOTE]
>
> Supported RWA strategies change as new issuers integrate with Kamino. Check the Multiply interface for current available vaults and live APY data.

***

## The dollar-denominated advantage (RWA looping)

For PRIME/PYUSD, ONyc/USDC, and SyrupUSDC/USDC positions: both sides of the position are dollar-denominated. Collateral holds a stable USD value; debt is a USD-denominated stablecoin. If SOL, ETH, or BTC prices move, neither side of the position is affected. Price-driven liquidation is structurally absent.

**What CAN cause liquidation in RWA positions:**

* Borrow rates exceeding RWA yield — the spread turns negative and LTV drifts upward over time
* Issuer-specific events that cause NAV deterioration (e.g., HELOC default rates rising)

**RWA-specific risks with no LST equivalent:**

* **Counterparty risk** — dependence on Figure Finance, OnRe Finance, and Maple Finance to perform as expected
* **Underlying credit default** — HELOC borrowers defaulting on home equity loans; catastrophic reinsurance losses exceeding premiums collected
* **Redemption liquidity** — RWA collateral may not liquidate as rapidly as liquid on-chain assets in a stress scenario; protocol liquidators may face delays in converting RWA collateral
* **NAV drawdown** — for ONyc specifically, catastrophic reinsurance claims exceeding premiums can reduce NAV directly, causing collateral value to fall independent of market prices

> [!WARNING]
>
> RWA tokens introduce off-chain credit risk and counterparty risk that crypto-native assets do not carry. Evaluate the credit quality of the underlying issuer and the terms of the underlying instrument before entering a leveraged RWA position. These risks cannot be assessed from on-chain data alone.

***

## The SOL-denominated advantage (LST looping)

For JitoSOL/SOL, mSOL/SOL, bSOL/SOL, and JupSOL/SOL positions: both collateral and debt are denominated in SOL. When the SOL price changes, both sides of the position move proportionally. The LTV ratio stays flat regardless of SOL's USD price.

This is why zero SOL LST Multiply positions have been liquidated due to market price moves in Kamino's history — not across any market event, including the April 2025 correction and the February 2026 crash.

The only spread risk that matters is the interest rate differential: staking yield minus SOL borrow rate. If that spread stays positive, the position is healthy. If it turns negative and stays there, LTV drifts upward over time.

> [!NOTE]
>
> SOL-denomination neutrality does not protect against smart contract exploits in the underlying staking protocol. If the staking protocol is compromised and actual SOL\_staked value declines, the exchange rate falls and LTV deteriorates. Independently evaluate the smart contract risk of each LST issuer (Jito, Marinade, Blaze, Jupiter, etc.).

***

## Stake-rate oracle protection

For SOL LST positions, Kamino prices the LST collateral using the **stake pool exchange rate**, not the spot market price:

```
LST Price = SOL_staked / LST_minted
```

This ratio increases monotonically each epoch as staking rewards accrue. It does not track the secondary market price of the LST.

**Why this matters:** LSTs occasionally trade at a market discount — during stress events, JitoSOL might trade at 0.95 SOL instead of its theoretical 1.05 SOL exchange rate value. In a system using spot price oracles, this discount raises the reported LTV and can push healthy positions into liquidation. In Kamino, the LTV calculation uses the exchange rate. The market discount is invisible to the position.

This is the primary reason temporary market depegs have never triggered Kamino LST liquidations. Across DeFi history, temporary depeg cascades have been the dominant source of unexpected LST liquidations — the stake-rate oracle eliminates this failure mode.

**What it does NOT protect against:** An exploit or insolvency event in the underlying staking protocol that actually reduces the SOL\_staked balance. In that case, the exchange rate itself falls and the LTV calculation reflects the deterioration. Stake-rate oracle protection is specifically about market mispricing, not fundamental protocol failure.

***

## eMode in Multiply

eMode (Elevation Mode) is a Kamino Lend feature that raises the permitted Max LTV for designated correlated asset pairs. Standard lending markets limit LTV to protect against price divergence between collateral and debt — but when the two assets track each other closely, that divergence risk is minimal. eMode reflects this by permitting higher LTV, which translates directly into higher maximum leverage.

| Mode | Example pair | Max LTV | Max leverage |
| - | - | - | - |
| Standard | SOL / USDC | 75% | 4x |
| eMode Main | mSOL, bSOL, JupSOL / SOL | \~87% | \~7.7x |
| eMode Jito | JitoSOL / SOL | 90% | 10x |
| No eMode | JLP / USDC | 67% | \~3.2x |

eMode only applies between designated correlated pairs. JLP/USDC has no eMode because JLP's value is not correlated with USDC. Full eMode parameters for all lending markets are documented in [Borrow Concepts](https://kamino.com/docs/products/borrow/concepts.md).

Higher Max LTV from eMode means a narrower gap between operating LTV and the liquidation threshold. Operating near maximum eMode leverage requires closer monitoring of the yield spread — a small adverse move in borrow rates has a proportionally larger effect on position health at high leverage.

**RWA/stablecoin pairs achieve high leverage through a parallel mechanism:** PRIME/PYUSD and similar pairs are dollar-denominated on both sides, so price divergence risk is near-zero by construction. This allows high LTV (88% for PRIME/PYUSD) without eMode designation — the same underlying logic applies, but in the stablecoin domain rather than the SOL domain.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
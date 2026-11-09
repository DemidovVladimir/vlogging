> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# KRAF Dashboard

> Guide to the live Kamino Risk Assessment Framework dashboard at risk.kamino.finance

The **Kamino Risk Assessment Framework (KRAF)** dashboard is a public, real-time risk monitoring tool available at [risk.kamino.finance](https://risk.kamino.finance). It provides complete visibility into the protocol's risk posture — every metric referenced in the risk framework documentation is available live on this dashboard.

The dashboard is maintained by [Allez Labs](https://www.allezlabs.xyz/), Kamino's risk management partner, and is updated continuously with on-chain data.

## Risk Overview

The main view provides a summary of protocol-wide risk metrics:

* **Deposits, borrows, and rates** for every listed asset across all Kamino markets
* **Utilization rates** — how close each reserve is to full utilization
* **Global caps** — supply caps, borrow caps, and their current utilization
* **Liquidation-at-risk** — the dollar value of positions that would be liquidated at various price shock levels (e.g., -10%, -20%, -30%)
* **Deposit and borrow distribution** — composition of the protocol's total TVL by asset
* **Interest rate curves** — the current rate curve parameters and actual rates for each token

This view answers the question: *what does the protocol look like right now, and where are the pressure points?*

## Loans Analysis

A filterable, tabular view of every active loan on the protocol:

| Field | Description |
| - | - |
| **Current LTV** | The loan's current loan-to-value ratio |
| **Max LTV** | The maximum LTV allowed for this loan's collateral mix |
| **Liquidation LTV** | The threshold at which the loan becomes liquidatable |
| **Total Deposits** | Dollar value of all collateral in the position |
| **Total Borrows** | Dollar value of all debt in the position |
| **Net Value** | Deposits minus borrows — the borrower's equity |

Each loan can be expanded to show a detailed per-loan visualization — how the LTV has changed over time, which assets compose the collateral and debt, and how close the position is to liquidation.

### Token Decompositions

For each loan, the dashboard breaks down:

* **Deposit composition** — which tokens make up the collateral, in what proportions
* **Borrow composition** — which tokens are borrowed, in what proportions

This reveals concentration risk at the individual loan level — a loan that is 100% JitoSOL collateral / 100% USDC debt has a very different risk profile than a diversified position across multiple collateral tokens.

## Volatility Risk

The volatility tab provides:

* **Token price time series** — historical price charts for all listed assets
* **Parkinson's realized volatility** — rolling [Parkinson's volatility](https://kamino.com/docs/risk/market-risk/volatility.md) time series, showing how each asset's volatility has evolved over short, medium, and long-term windows

This allows direct comparison of volatility regimes across assets and over time. A sudden spike in an asset's Parkinson's volatility may signal the need for parameter review.

## Liquidity Risk

The liquidity tab provides real-world, on-chain liquidation cost data:

* **Percentage price impact** for buy and sell Jupiter swaps at various USD sizes (\$10K, \$50K, \$100K, \$500K, \$1M+)
* **Impact comparison across assets** — which assets can absorb large trades, and which cannot
* **Historical price impact trends** — whether liquidity is improving or deteriorating for each asset

This data directly answers the core market risk question: *at the current supply cap, could a max-size position be liquidated profitably?* If the price impact at cap-implied max position size exceeds the liquidation bonus, the cap may need to be lowered.

## Price Shock Analysis

The most sophisticated section of the dashboard. It models four types of stress scenarios:

### Uniform Shock

All token prices drop by the same percentage simultaneously (e.g., -20% across the board). This models a broad market crash and shows:

* How many positions become liquidatable
* Total dollar value at risk
* Expected bad debt (if any positions would cross the insolvency threshold)

### Individual Token Shock

A single token drops by a specified percentage while all others remain stable. This models an idiosyncratic event (e.g., a smart contract exploit, a depeg) and reveals:

* Protocol exposure to that specific token
* Which loans are affected
* Whether isolation mechanisms contain the damage

### Correlation-Based Shock

Correlated groups of tokens decline together (e.g., SOL + all LSTs drop 25%, while stablecoins hold). This is the most realistic stress model, as it reflects how markets actually behave during downturns — correlated assets move together.

### Historic Event Replay

Replays actual historical events (e.g., the February 2026 crash, the April 2025 SOL/ETH crash) against the current protocol state. This answers: *if that event happened today, with today's positions and parameters, what would the impact be?*

## Stress Testing Data

The monthly risk reports published by Allez Labs include detailed stress testing at standard shock levels. Representative data from the November 2025 report:

| Shock Level | Liquidation Volume | Estimated Bad Debt |
| - | - | - |
| **-10%** | \~\$50M | \$0 |
| **-20%** | \~\$137M | \~\$2.3M |
| **-30%** | \~\$275M | \~\$11.6M |
| **-40%** | \~\$419M | \~\$32.6M |
| **-60%** | \~\$845M | \~\$119M |

These stress tests calibrate the protocol's resilience envelope. A -10% shock produces zero bad debt. A -20% shock produces minimal bad debt. Beyond -30%, the numbers grow — but these are instantaneous, uniform shocks (all prices drop simultaneously with no time for liquidators to act), representing an extreme worst case.

In practice, even the February 2026 event — SOL -18% over 48 hours — produced \$0 bad debt, because liquidators had time to act and the price decline was not instantaneous.

## Risk Reduction Modeling

The risk reduction tab models the impact of proposed parameter changes before they are implemented:

* **Cap reductions** — if supply cap for Asset X is reduced from \$50M to \$30M, how does the risk profile change?
* **Auto-deleverage scenarios** — if positions above a certain LTV are deleveraged, what is the net effect on protocol risk?
* **LTV adjustments** — if Max LTV for Asset Y is lowered from 75% to 65%, how many positions are affected and what is the change in liquidation-at-risk?

This allows the Risk Council to quantify the impact of proposed interventions before executing them — ensuring that parameter changes achieve the intended risk reduction without unnecessary disruption to users.

## Monthly Risk Reports

Since early 2025, Allez Labs has published comprehensive monthly risk reports to the [Kamino governance forum](https://gov.kamino.finance/c/risk/7). Over 14 reports have been published to date. These reports provide:

* **Protocol-level metrics:** Total supply, debt, TVL, transaction volumes, liquidation counts
* **Market-by-market analysis:** Supply, borrow, and utilization trends across all Kamino markets
* **Stablecoin and SOL market analysis:** Composition shifts, rate dynamics, LST trends
* **Vault performance:** TVL, curator activity, user flows across Earn Vaults
* **Stress testing scenarios:** Instantaneous price shock modeling at multiple severity levels
* **User behavior analysis:** Wallet activity, transaction patterns, concentration metrics

These reports create a public, auditable record of Kamino's risk posture over time. Anyone can review the historical data, methodology, and track record.

[View all risk reports on the governance forum →](https://gov.kamino.finance/c/risk/7)


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
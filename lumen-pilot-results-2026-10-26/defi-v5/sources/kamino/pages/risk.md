> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Framework & Track Record

> How Kamino manages risk across its lending protocol, and the empirical track record under real market stress

Risk in a lending protocol comes down to one question: can every lender get their tokens back? Two things can prevent this: **insolvency** (bad debt from loans that couldn't be liquidated) and **illiquidity** (all tokens are borrowed and no one is repaying). Kamino's risk framework is designed to prevent both.

## Risk Dimensions

### Insolvency Risk

Insolvency occurs when a borrower's position becomes unhealthy (LTV exceeds the liquidation threshold) and the liquidation cannot be profitably executed — typically because the collateral token lacks sufficient market liquidity to be sold without excessive slippage. The resulting bad debt is socialized among lenders.

Kamino mitigates insolvency risk through:

* Rigorous [asset risk assessment](https://kamino.com/docs/risk/asset-risk) before onboarding any token
* Continuous [market risk monitoring](https://kamino.com/docs/risk/market-risk) of volatility, liquidity, and price impact
* Conservative LTV and borrow factor parameters calibrated to market conditions
* [Protocol safeguards](https://kamino.com/docs/risk/safeguards/auto-deleverage.md) that can unwind risky positions before bad debt materializes

### Liquidity Risk

Liquidity risk arises when borrowing demand exhausts the available supply in a reserve, reaching 100% utilization. Lenders cannot withdraw until borrowers repay or new supply arrives. This does not cause financial loss — in fact, it produces exceptionally high interest rates for lenders — but it temporarily restricts withdrawals.

Kamino mitigates liquidity risk through:

* [Interest rate curves](https://kamino.com/docs/risk/safeguards/interest-rates.md) calibrated to spike when utilization exceeds target levels, creating economic pressure for repayment
* [Daily caps](https://kamino.com/docs/risk/safeguards/daily-caps.md) that limit the rate at which borrows can accumulate
* Real-time utilization monitoring with alerting

### Systemic Risk

Systemic risk emerges when multiple assets on the protocol are correlated — a broad market downturn triggers liquidations across many positions simultaneously, potentially overwhelming liquidation infrastructure or liquidity. Kamino monitors [token correlations and systemic exposure](https://kamino.com/docs/risk/market-risk/correlations.md) and uses E-Mode caps and supply caps to limit concentrated exposure.

## Token Onboarding

Every asset listed on Kamino undergoes a 5-dimension risk assessment before it can be used as collateral or borrowed:

1. **[Oracle Pricing Risk](https://kamino.com/docs/risk/asset-risk/oracle-pricing.md)** — reliability and redundancy of the asset's price feeds
2. **[Smart Contract Risk](https://kamino.com/docs/risk/asset-risk/smart-contract.md)** — audit history, maturity, and battle-testing of the token's underlying contracts
3. **[Depeg Risk](https://kamino.com/docs/risk/asset-risk/depeg.md)** — for pegged assets, the probability and impact of losing the peg
4. **[Counterparty Risk](https://kamino.com/docs/risk/asset-risk/counterparty.md)** — governance decentralization, holder concentration, and trust assumptions
5. **[Market Risk](https://kamino.com/docs/risk/market-risk)** — volatility, liquidity, and price impact dynamics

Based on this assessment, each asset is classified into one of three tiers:

| Tier | Description | Implications |
| - | - | - |
| **General Asset** | Meets all risk criteria | Full cross-margin eligibility, higher LTV limits |
| **Isolated Collateral** | Elevated risk in one or more dimensions | Can only be used as collateral in isolated mode |
| **Isolated Debt** | Elevated borrowing risk | Can only be borrowed in isolated mode |

The assessment directly determines the asset's **Collateral Max LTV** (how much can be borrowed against it) and **Borrow Factor** (the risk weight applied to the debt). Higher-risk assets receive more conservative parameters.

Onboarding is not a one-time event. The risk framework continuously reassesses listed assets. Market conditions change — an asset that was low-risk at onboarding may become high-risk if its liquidity drops, its oracle coverage narrows, or its smart contract is compromised. Parameter adjustments follow reassessment.

## Battle-Tested Track Record

Kamino has operated since November 2023 with **\$0 bad debt** across every market condition — including 5 significant stress events that tested the liquidation infrastructure and risk parameters under real-world conditions.

| Event | Date | Collateral Seized | Bad Debt |
| - | - | - | - |
| Flash Analysis | Feb 16–18, 2025 | \$4.1M | **\$0** |
| Market Correction | Feb 24 – Mar 2, 2025 | \$22.1M | **\$0** |
| SOL/ETH Crash | April 6–7, 2025 | \$16M | **\$0** |
| October Correction | Oct 10, 2025 | \$20M | **\$0** |
| SOL -18% Crash | Feb 5–6, 2026 | \$19.36M | **\$0** |

### February 2026 Stress Event — Case Study

The most severe test of Kamino's risk framework occurred on February 5–6, 2026, when SOL dropped 18% (from \$92 to \$76), ETH fell \~15% (from \$2,148 to \$1,832), and JLP declined \~10% (from \$3.83 to \$3.43) over 48 hours.

**Scale of liquidations:**

* 55,649 individual liquidation events
* 30,030 wallets affected
* \$19.36M in collateral seized
* **\$0 bad debt generated**

**Market breakdown:**

| Market | Liquidation Events | Collateral Seized |
| - | - | - |
| Main | 44,665 | \$12.79M |
| JLP | 10,560 | \$6.47M |
| Bitcoin | 214 | \$20K |
| Fartcoin | 67 | \$47K |
| JTO | 4 | \$12.6K |

**Key finding:** 99.6% of liquidations came from uncorrelated positions (e.g., SOL collateral / USDC debt). Correlated positions (e.g., JitoSOL/SOL) were barely affected, validating the [LST oracle](https://kamino.com/docs/security/oracles/lst-oracles.md) design that uses stake rates instead of market prices.

**Flight to quality:** During the event, deposits flowed from higher-risk markets to safer ones. The Prime market grew by +\$55M in supply (+13.5%), and the Superstate market saw +56% supply growth — reflecting depositor preference for markets with tighter risk parameters during volatility.

**Post-event protocol health:** The protocol continued operating normally throughout the event with no degradation in service.

Detailed analysis: [Risk Event Analysis — February 5–6, 2026](https://gov.kamino.finance/t/kamino-risk-event-analysis-feb-5-6-2026/868)

## Monthly Risk Reports

Since early 2025, [Allez Labs](https://www.allezlabs.xyz/) has published comprehensive monthly risk reports to the [Kamino governance forum](https://gov.kamino.finance) — over 14 reports to date. These reports cover:

* **Protocol-level metrics:** Total supply, debt, TVL, transaction volumes, liquidation counts
* **Market-by-market analysis:** Supply, borrow, and utilization trends across all markets
* **Stablecoin and SOL market analysis:** Composition shifts, rate dynamics, LST trends
* **Vault performance:** TVL, curator activity, user flows across Earn Vaults
* **Stress testing scenarios:** Instantaneous price shock modeling at -10%, -20%, -30%, -40%, -60% levels
* **User behavior analysis:** Wallet activity, transaction patterns, concentration metrics

The reports provide a public, auditable record of Kamino's risk posture over time. Anyone can review the historical data and methodology.

[View all risk reports on the governance forum →](https://gov.kamino.finance/c/risk/7)

## Continuous Monitoring

Risk management is not a periodic activity — it runs continuously. The following metrics are tracked in real-time:

* Utilization rates per reserve (approaching 100% triggers interest rate escalation)
* LTV distributions across all active positions (clustering near liquidation thresholds indicates elevated risk)
* Oracle staleness and cross-provider deviation (signals potential oracle issues)
* Cap utilization (supply, borrow, and daily caps approaching limits)
* Liquidation-at-risk metrics (what percentage of positions would be liquidated at various price shock levels)
* Vault allocation changes (unusual curator behavior)

Anomalies in any of these metrics trigger review. The response escalation path ranges from parameter adjustments to emergency measures like [auto-deleverage](https://kamino.com/docs/risk/safeguards/auto-deleverage.md).

## Insurance Fund

Kamino Lend does not operate a protocol-level insurance fund. No bad debt has ever been incurred — the \$0 bad debt track record reflects the effectiveness of the risk framework and protocol safeguards rather than a backstop fund.

At the product level, [Lending Vaults](https://kamino.com/docs/products/lending-vaults/insurance-pool.md) offer first-loss capital (insurance pools) where curators lock their own capital as a buffer. This is a vault-level feature managed by individual curators, not a protocol-wide mechanism.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
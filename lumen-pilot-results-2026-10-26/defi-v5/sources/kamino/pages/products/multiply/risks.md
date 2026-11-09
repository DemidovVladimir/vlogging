> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Risks

> Understanding liquidation, borrow rate, and strategy-specific risks in Multiply

> [!WARNING]
>
> Multiply uses leverage. Leveraged positions amplify both gains and losses. Understand the risks specific to your strategy before opening a position — the risk profile of a SOL LST strategy differs fundamentally from a JLP or xStocks strategy.

## Borrow rate risk

Borrow rate risk is universal across all Multiply strategies. Every Multiply position borrows at a variable rate. If that rate rises above the yield the collateral generates, [Net APY](https://kamino.com/docs/products/multiply/concepts.md#net-apy--the-fundamental-equation) turns negative and the debt balance grows faster than the collateral earns.

```
Net APY turns negative when: Borrow Rate > Collateral Asset Yield
```

For SOL LST strategies, this is the **only** meaningful risk vector — there is no price liquidation risk. For all other strategies, borrow rate risk compounds on top of price risk.

High utilization in the borrowing pool drives rates up. The Jito Market (SOL) includes an interest rate cap mechanism that bounds rate spikes for JitoSOL/SOL strategies — this is a deliberate design choice to limit the primary risk for the highest-leverage LST product on the platform.

***

## Liquidation mechanics

Liquidation is triggered when a position's Current [LTV](https://kamino.com/docs/products/multiply/concepts.md#the-leverage-ratio) exceeds its Liquidation LTV threshold. The threshold is strategy and market specific — for example, 80% on JLP Market, higher under [eMode](https://kamino.com/docs/products/multiply/concepts.md#emode-in-multiply) for LST strategies.

At liquidation:

* **Close factor:** Up to 10% of the position is liquidated per transaction
* **Liquidation penalty:** \~0.1% (reduced 90% from \~1% in September 2025)
* **Multiple rounds:** If LTV remains above threshold after the first liquidation, additional rounds follow automatically until the position is healthy

> [!NOTE]
>
> The 0.1% liquidation penalty was intentionally set low to reduce the severity of each liquidation event. Positions do not lose large chunks of value in a single liquidation — but multiple rounds can still accumulate meaningful losses if the underlying condition (falling price or negative carry) is not resolved.

***

## Strategy-specific liquidation risk

| Strategy | What triggers liquidation | Price risk |
| - | - | - |
| SOL LST | Borrow rate sustained above staking yield for an extended period | None — denominated in SOL on both sides |
| JLP | JLP price decline relative to USD | High — crypto basket exposure |
| xStocks | Underlying equity price decline | High — leveraged equity |
| Stablecoin / RWA | Borrow rate exceeds RWA yield; RWA default or redemption freeze | Low — near-USD collateral |
| Stable loops | Borrow rate spread inverts | None — both sides USD-pegged |

***

## Stake-rate oracle

> [!NOTE]
>
> For [SOL LST](https://kamino.com/docs/products/multiply/concepts.md#liquid-staking-tokens-lsts) strategies, Kamino prices the LST collateral using the [stake pool exchange rate](https://kamino.com/docs/products/multiply/concepts.md#stake-rate-oracle-protection) — not the secondary market price. A temporary market depeg, where JitoSOL trades below its theoretical value, does not affect your LTV calculation. The oracle ignores market mispricing.

This eliminates the historical failure mode for LST leverage strategies: a temporary depeg cascade that forces healthy positions into liquidation. It is a core protection mechanism for SOL LST Multiply.

**Limitation:** The stake-rate oracle protects against market mispricing, not against fundamental failures. An exploit or insolvency in the underlying staking protocol would affect the exchange rate itself and would therefore be reflected in the LTV calculation. Users must independently evaluate the safety of LST issuers (Jito, Marinade, Blaze, etc.).

***

## Auto-deleveraging

In extreme protocol stress scenarios, Kamino's Risk Council can initiate auto-deleveraging — a systematic reduction of the largest leveraged positions to protect overall solvency.

> [!WARNING]
>
> Before auto-deleveraging is executed, affected positions receive a **72-hour warning**. Auto-deleveraging has not been triggered in Kamino's history. It is a last-resort mechanism, not a routine operation.

Auto-deleveraging is distinct from normal liquidation. It is not triggered by individual position health — it is triggered by systemic risk to the lending protocol as a whole.

***

## Historical liquidation events

| Date | Event | Collateral Seized | Bad Debt |
| - | - | - | - |
| April 6–7, 2025 | Broad market correction | \$16M | \$0 |
| February 5–6, 2026 | SOL -18%, ETH -15% crash | \$19.4M | \$0 |

SOL LST Multiply positions accounted for a negligible share of liquidations in both events. JLP Multiply positions were among those liquidated in both. The protocol produced zero bad debt in both cases — liquidations executed before positions became insolvent.

***

## Liquidation analysis tools

Kamino provides a Liquidation Analysis Suite accessible from the Multiply interface. It allows you to model position health before and after opening leverage.

* Simulate time-to-liquidation under different market conditions and borrow rate scenarios
* Adjust leverage and theoretical yield to see break-even thresholds
* Run historical backtests on strategy performance across past market events

Use these tools before entering any leveraged position, particularly for JLP and xStocks strategies where price risk is the dominant variable.

***

## Risk summary

| Strategy | SOL Price Risk | Depeg Risk | Borrow Rate Risk | RWA / Counterparty Risk |
| - | - | - | - | - |
| SOL LST | None | Eliminated (stake oracle) | Primary risk | None |
| JLP | High | N/A | Moderate | None |
| xStocks | High (equity) | N/A | Moderate | None |
| Stablecoin / RWA | Low | N/A | Moderate | Varies by issuer |
| Stable loops | None | N/A | Primary risk | None |


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
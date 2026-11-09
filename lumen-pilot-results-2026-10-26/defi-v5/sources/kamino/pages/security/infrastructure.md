> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Infrastructure & Redundancy

> Operational security: redundancy, monitoring, liquidation infrastructure, and stress testing

Smart contract security is necessary but not sufficient. A lending protocol also depends on off-chain infrastructure — RPC nodes, oracle update bots, liquidation bots, and cloud services — that must function correctly under stress. A single point of failure in any of these systems can delay liquidations, stale price feeds, or prevent users from interacting with the protocol during critical moments.

Kamino runs redundant instances of every critical off-chain component, with real-time monitoring and automatic failover.

## Redundancy Architecture

### RPC Providers

Kamino's infrastructure connects to multiple independent Solana RPC providers. If one provider experiences downtime, degraded performance, or rate limiting, traffic automatically fails over to alternatives. No single RPC outage can halt protocol operations.

### Cloud Providers

Infrastructure spans multiple cloud providers. A single cloud provider outage — whether regional or global — does not take down Kamino's off-chain systems. Critical services are deployed across independent providers with no shared failure domain.

### Oracle Cranks

Oracle feeds on Solana require "cranks" — transactions that push updated prices on-chain. Kamino operates multiple independent crankers that push Scope oracle updates. If one cranker fails, goes offline, or is rate-limited, others continue to push fresh prices. Price feed liveness does not depend on any single operator.

### Liquidation Bots

Multiple independent liquidator bots monitor positions continuously. Kamino's liquidation system is **permissionless** — anyone can run a liquidation bot. There is no single operator responsible for liquidations. This creates a competitive market: if one bot misses a liquidation opportunity, another will capture it.

The result: during the [February 2026 stress event](https://kamino.com/docs/risk.md), 55,649 liquidation events were processed across 30,030 wallets in 48 hours — with zero bad debt. The liquidation infrastructure performed under real-world conditions that far exceeded normal operating parameters.

## Monitoring & Alerting

Kamino maintains full transparency in what is monitored and how anomalies are escalated.

### What Is Monitored in Real-Time

| Metric | What it indicates |
| - | - |
| **Utilization rates per reserve** | How close each market is to full utilization (100% = lenders cannot withdraw) |
| **LTV distributions across all positions** | How many positions are approaching liquidation thresholds |
| **Oracle staleness** | Whether price feeds are being updated within expected intervals |
| **Oracle deviation** | Whether different providers are reporting consistent prices |
| **Cap utilization** | How close supply, borrow, and daily caps are to their limits |
| **Liquidation-at-risk metrics** | What percentage of positions would be liquidated at various price shock levels |
| **Vault allocation changes** | Whether Earn Vault curators are making unusual reallocation decisions |

### Escalation Process

Anomalies detected by monitoring trigger review and potential action. The response path depends on severity:

* **Utilization approaching targets:** Interest rate curves are designed to self-correct (higher rates incentivize repayment and new supply). Monitoring tracks whether the curve is working as intended.
* **Oracle staleness or deviation:** Scope's multi-provider architecture provides automatic fallback. Persistent staleness across providers triggers manual review.
* **Positions clustering near liquidation thresholds:** Risk analysis determines whether parameter adjustments (cap reductions, LTV changes) are warranted.
* **Extreme market conditions:** The Risk Council can trigger emergency measures including cap reductions and [auto-deleverage](https://kamino.com/docs/risk/safeguards/auto-deleverage.md).

## Liquidation Infrastructure

Liquidation on Kamino is a permissionless, competitive process. When a position's LTV exceeds the liquidation threshold, any entity can submit a liquidation transaction. The liquidator provides the debt token, receives collateral at a small discount (the liquidation bonus), and sells the collateral to realize profit.

### How It Scales on Solana

Solana's architecture introduces specific considerations for liquidation at scale:

* **Priority fees:** During congestion, liquidators compete via priority fees to have their transactions included. This ensures liquidations execute even when the network is busy.
* **Compute limits:** Each Solana transaction has a compute unit limit, which constrains how many operations can occur in a single transaction. Large liquidations may require multiple transactions.
* **Transaction ordering:** Solana's leader schedule means transaction inclusion depends on the current validator. Multiple independent liquidators submitting to multiple RPC providers increases the probability of timely inclusion.

### Track Record

> **\$175M+**
>
> Total liquidation volume processed

> **130,000+**
>
> Individual liquidation events executed

> **\$0**
>
> Bad debt across all liquidation events

## Emergency Measures

When market conditions deteriorate beyond normal parameters, several levers are available:

* **Cap reductions:** Supply and borrow caps can be lowered to prevent further exposure buildup
* **Auto-deleverage:** The [auto-deleverage mechanism](https://kamino.com/docs/risk/safeguards/auto-deleverage.md) can be triggered to systematically unwind risky positions
* **Daily cap enforcement:** [Daily caps](https://kamino.com/docs/risk/safeguards/daily-caps.md) limit the rate at which exposure can change, even during extreme conditions
* **Market freezes:** In extreme scenarios, individual reserves can be frozen to prevent further interaction until conditions stabilize

These measures are not routine. They represent last-resort interventions designed to protect lenders when market conditions exceed the protocol's normal operating parameters.

> [!NOTE]
>
> Stress event analyses are published to the Kamino governance forum after every significant market event. Historical reports are available at [gov.kamino.finance](https://gov.kamino.finance).


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
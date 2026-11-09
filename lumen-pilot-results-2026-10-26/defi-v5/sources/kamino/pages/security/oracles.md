> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Scope Aggregator

> Kamino's proprietary on-chain oracle aggregator: cross-validated Chainlink and Pyth Pro feeds with independent on-chain validation

Oracles are the most critical attack surface in DeFi lending. Every LTV calculation, every liquidation decision, every interest rate update depends on accurate price data. A compromised or stale oracle feed can trigger improper liquidations, enable collateral drain exploits, or create bad debt. Historically, oracle manipulation has been the single most common vector for DeFi exploits — responsible for billions in losses across protocols like Euler, Mango Markets, and Cream Finance.

Kamino did not rely on a single off-the-shelf oracle solution. Instead, it built **Scope** — a proprietary on-chain oracle aggregator — from the ground up.

> **3 Dedicated Audits**
>
> Audited by Sec3, OtterSec, and Offside Labs — plus oracle coverage in broader Lend and Vault audits

> **\$19.33B Volume**
>
> Total volume processed through Scope price feeds

> **0 Oracle Exploits**
>
> Zero oracle-related exploits since launch

## What Scope Is

Scope is an on-chain program deployed on Solana that aggregates price data from independent premium oracle networks into a single, validated price feed. It is not a pass-through: Scope applies its own validation rules before accepting any price, and only publishes prices that pass all checks.

The key insight behind Scope is that no single oracle provider is reliable enough to secure billions in deposits. Scope draws on two independent, institutional-grade networks whose strengths and failure modes do not overlap:

* Different update models and latency profiles
* Different aggregation methodologies
* Independent infrastructure and operators
* Different manipulation-resistance characteristics

By cross-validating these independent feeds and applying its own checks, Scope achieves a level of reliability that no single provider can match.

## Architecture

Scope operates as a Solana program that:

1. **Ingests prices** from two independent premium oracle networks (Chainlink Data Streams and Pyth Pro)
2. **Validates each price** against a preset of rules — staleness checks, deviation checks, cross-provider consistency
3. **Selects the best price** dynamically based on freshness, consistency with other providers, and validation status
4. **Publishes the validated price** to a single on-chain account that Kamino's lending and vault contracts read from

If a provider's feed goes stale, deviates significantly from other providers, or fails a validation check, Scope automatically falls back to the next-best source. This self-healing behavior means that an outage or anomaly in any single provider does not compromise price accuracy.

## Multi-Price Oracle System

The most significant upgrade to Scope's architecture is the **Multi-Price Oracle System** — a fundamental evolution from selecting a single "best" price to continuously aggregating and cross-validating all available high-quality sources in real time. This system eliminates any remaining dependence on a single data provider, dynamically selects the freshest valid price at the moment of each transaction, and self-heals during provider downtime or deviation without manual intervention.

The Multi-Price Oracle System was double-audited by **Certora** and **Offside Labs** before deployment. For details on how this system reduces oracle pricing risk, see [Oracle Pricing Risk](https://kamino.com/docs/risk/asset-risk/oracle-pricing.md#multi-price-oracle-system).

## Oracle Providers

Scope is built on two independent, institutional-grade decentralized oracle networks:

| Provider | Type | Strengths |
| - | - | - |
| **Chainlink Data Streams** | Pull-based decentralized oracle | High-frequency, low-latency market data on demand; industry-standard infrastructure securing hundreds of billions across chains |
| **Pyth Pro** | Pull-based high-frequency oracle | Sub-second updates, native Solana integration, confidence intervals |

Both are pull-based: prices are requested on-demand rather than pushed on fixed heartbeat intervals, so the protocol reads the freshest available price at the exact moment it is needed. Chainlink Data Streams underwent extensive mainnet testing for multiple weeks before integration, demonstrating consistently strong results in accuracy and latency against existing feeds.

For each asset on Kamino, Scope cross-validates both providers in real time. The protocol does not depend on any single provider: if one deviates or goes stale, the other continues to provide accurate pricing, and Scope's own validation layer rejects any price that fails its checks before it is published.

## Open Source

Scope is fully open source. The smart contract code, aggregation logic, and validation rules are all publicly available for review:

* **Smart contract:** [github.com/Kamino-Finance/scope](https://github.com/Kamino-Finance/scope)
* **TypeScript SDK:** [github.com/Kamino-Finance/scope-sdk](https://github.com/Kamino-Finance/scope-sdk)

Anyone can inspect how prices are aggregated, what validation rules are applied, and how fallback selection works.

## Oracle Audits

Scope has been independently audited 3 times by 3 different firms. In addition, oracle integration is reviewed as part of every Kamino Lend and Vault audit:

| Report | Firm | Date |
| - | - | - |
| Sec3 Audit | Sec3 | 16 December 2024 |
| OtterSec Audit | OtterSec | 16 December 2023 |
| Offside Labs Audit | Offside Labs | 8 December 2023 |

Beyond these dedicated Scope audits, the oracle aggregation layer is reviewed as part of every Kamino Lend and Vault audit — meaning oracle security is scrutinized from multiple angles across the protocol's full audit portfolio.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
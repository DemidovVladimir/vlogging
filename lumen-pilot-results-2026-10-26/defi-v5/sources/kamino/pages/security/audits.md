> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Security Audits

> Complete inventory of all security audits conducted on Kamino's smart contracts

Kamino has completed 20 external security reviews across all major smart contract components — 15 traditional security audits, [4 formal verifications](https://kamino.com/docs/security/formal-verification.md), and [fuzzing campaigns](https://kamino.com/docs/security/fuzzing.md). Audits are conducted by independent security teams before and after every major launch, with rolling code reviews for ongoing changes. Every report is published publicly.

> [!TIP]
>
> **Found something?** If you discover a vulnerability while reviewing these reports, report it through Kamino's [Bug Bounty program](https://kamino.com/docs/security/bug-bounty.md) on Sherlock for rewards up to 1,000,000 USDC.

> **20 Security Reports**

> **6 Independent Firms**

> **0 Critical Vulnerabilities**

## Audit Firms

Kamino engages multiple specialized security firms, each with distinct methodologies and areas of expertise:

* **OtterSec** — Solana-native security firm specializing in manual code review and formal verification of Rust/Anchor programs
* **Sec3** — Automated and manual auditing with deep Solana program analysis tooling
* **Offside Labs** — Independent security research firm focused on DeFi protocol auditing
* **Certora** — Formal verification specialists using symbolic execution and mathematical provers
* **Ackee Blockchain** — Fuzzing and automated testing using their proprietary Trident framework
* **RX Security** — Smart contract security auditing

Using multiple firms ensures that no single auditor's blind spots carry through. Different methodologies — manual review, automated analysis, fuzzing, and formal verification — each catch different classes of bugs.

## Audits by Component

### Kamino Lend

The core lending and borrowing smart contract — the highest-stakes component.

| Date | Firm | Link |
| - | - | - |
| 6 February 2025 | Sec3 | [View Report](https://github.com/Kamino-Finance/audits/blob/main/kamino_klend_sec3.pdf) |
| 6 September 2023 | OtterSec | [View Report](https://github.com/Kamino-Finance/audits/blob/main/kamino_lend_ottersec.pdf) |
| 3 July 2023 | RX Security | [View Report](https://github.com/Kamino-Finance/audits/blob/main/kamino_lend_rx.pdf) |

### Kamino Earn Vaults

Vault contracts that manage depositor funds across lending markets.

| Date | Firm | Link |
| - | - | - |
| 12 April 2025 | Offside Labs | [View Report](https://github.com/Kamino-Finance/audits/blob/main/kamino_vault_offside_labs.pdf) |
| 6 February 2025 | Sec3 | [View Report](https://github.com/Kamino-Finance/audits/blob/main/kamino_vault_sec3.pdf) |
| 9 December 2024 | OtterSec | [View Report](https://github.com/Kamino-Finance/audits/blob/main/kamino_vault_osec.pdf) |

### Scope Oracle

Kamino's proprietary oracle aggregator that ingests and validates price feeds.

| Date | Firm | Link |
| - | - | - |
| 16 December 2024 | Sec3 | [View Report](https://github.com/Kamino-Finance/audits/blob/main/kamino_scope_sec3.pdf) |
| 16 December 2023 | OtterSec | [View Report](https://github.com/Kamino-Finance/audits/blob/main/kamino_scope_ottersec.pdf) |
| 8 December 2023 | Offside Labs | [View Report](https://github.com/Kamino-Finance/audits/blob/main/kamino_scope-offside_labs.pdf) |

### Limit Orders (LIMO)

Zero-fee limit order contracts.

| Date | Firm | Link |
| - | - | - |
| 29 January 2025 | Sec3 | [View Report](https://github.com/Kamino-Finance/audits/blob/main/kamino_limo_audit_sec3.pdf) |
| 29 November 2024 | Offside Labs | [View Report](https://github.com/Kamino-Finance/audits/blob/main/kamino_limo_audit_offside_labs.pdf) |
| 7 November 2024 | OtterSec | [View Report](https://github.com/Kamino-Finance/audits/blob/main/kamino_limo_audit_ottersec.pdf) |

### Liquidity Vaults

Automated liquidity provisioning contracts.

| Date | Firm | Link |
| - | - | - |
| 14 November 2023 | OtterSec | [View Report](https://github.com/Kamino-Finance/audits/blob/main/kamino_liquidity_audit_ottersec.pdf) |

### Farms

Reward distribution and farming contracts.

| Date | Firm | Link |
| - | - | - |
| 8 December 2023 | Offside Labs | [View Report](https://github.com/Kamino-Finance/audits/blob/main/kamino_farms-offside_labs.pdf) |
| 13 October 2023 | OtterSec | [View Report](https://github.com/Kamino-Finance/audits/blob/main/kamino_farms_ottersec.pdf) |

## Rolling Code Reviews

Point-in-time audits catch issues at a snapshot. But code evolves continuously — new features, parameter changes, and optimizations are deployed between scheduled audits.

To close this gap, Kamino maintains ongoing code review contracts with security teams. New pull requests are reviewed by independent security researchers before they reach production. This ensures that every code change — not just major releases — receives external scrutiny.

## Public Audit Repository

All 20 security reports — including audit, formal verification, and fuzzing reports — are published publicly. Anyone can download and review them.

[View all audit reports on GitHub →](https://github.com/Kamino-Finance/audits)


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
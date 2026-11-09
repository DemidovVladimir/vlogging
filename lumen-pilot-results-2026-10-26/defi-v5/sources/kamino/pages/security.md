> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Security

> Formal verification, audits, stress testing, and more

| 18 External Audits | 4 Formal Verifications Completed | 3 Years Live in Production Without Incident |
| - | - | - |
| [View Audits](#security-audits) | [View Formal Verifications](#formal-verification) | [Go To Github](https://github.com/kamino-finance) |

***

## Overview

Security extends across Kamino's entire stack. From code correctness and smart contract verification, to code upgrades, transaction monitoring, market risk monitoring, and parameter stress testing.

For Kamino, security is a continuous process of proactively considering threats across the entire protocol stack, while staying on top of industry best practices. We place extreme emphasis on layering security measures. Even if a single layer fails, additional security layers act as a safety net—the more layers, the better. Our battle scars have taught us that not even the best engineers and auditors are guaranteed to foresee every possible attack vector. No single security measure is absolutely bulletproof, so we take every step to cover as wide a surface area as possible.

As time goes by, live production usage of Kamino battle tests the stack, revealing new ways for us to protect the smart contracts, and the rest of Kamino's security system.

***

## Security Components

Kamino's stack is composed of multiple components, each with its own security considerations:

| Component | Description |
| - | - |
| **Smart Contracts** | Kamino Lend and Peripheral Contracts |
| **Frontend** | Kamino App, Web UI, Client Libraries |
| **Middleware** | API, Databases, Cron Jobs, etc. |
| **Risk Monitoring** | Risk Dashboard, Risk Consultants, Risk Curators |
| **Operational Infrastructure** | Cranks, Bots, Keepers, Liquidators |
| **Third Party Dependencies** | Libraries, Oracles, Exchanges, Price Feeds |

Although only the smart contracts hold funds, all components play a role in the overall security of the system, and therefore we approach security holistically, considering all components and their interactions. Below we cover all security measures employed by Kamino, including audits, formal verification, testing, and more.

***

## Security Measures

* [Open Source](#open-source)
* [Formal Verification](#formal-verification)
* [Security Audits](#security-audits)
* [Oracle Security](#oracle-security--resilience)
* [Redundancy & Fallbacks](#redundancy--fallbacks)
* [Liquidation Stress Tests](#liquidation-stress-tests)
* [Market Risk](#market--protocol-risk-assessment)
* [Fuzzing (By Ackee)](#fuzzing-by-ackee)
* [Verifiable Build](#verifiable-build)
* [Disclaimer](#disclaimer)

***

### Open Source

Kamino Lend has been open source since its inception, allowing the community to review the codebase, and allowing users a transparent overview of the smart contract logic handling their funds. This is a critical component of Kamino's security strategy, and we consider it a must-have for any DeFi protocol. Open source code allows for transparency, community contribution, and peer reviews, which can help identify potential vulnerabilities and improve the overall security of the system.

* [Borrow/Lend Repo](https://github.com/kamino-finance/klend)
* [Earn Vaults Repo](https://github.com/kamino-finance/kvault)
* [Limit Orders Repo](https://github.com/Kamino-Finance/limo)
* [Scope Oracle Repo](https://github.com/kamino-finance/scope)

***

### Formal Verification

While testing and auditing are probabilistic approaches to security, for example an edge case can be missed or forgotten to be checked, formal verification is a mathematical approach that proves the correctness of the code. We use formal verification to prove that specific properties hold for our smart contracts, such as the inability to borrow more than the collateral provided or the inability to liquidate a position that is not undercollateralized. This provides a high level of assurance that our smart contracts behave as intended.

| Report | Date | Link |
| - | - | - |
| Ottersec Formal Verification - Kamino Lend | 6 October 2025 | [View Report](https://github.com/Kamino-Finance/audits/blob/main/kamino_lend_osec_formal_verification.pdf) |
| Certora Verification - Kamino Earn Vaults | 27 June 2025 | [View Report](https://github.com/Kamino-Finance/audits/blob/main/kamino_vault_certora.pdf) |
| Certora Verification - Kamino Lend | 13 May 2025 | [View Report](https://github.com/Kamino-Finance/audits/blob/main/kamino_lend_certora.pdf) |
| Certora Verification - Kamino Limit Orders | 21 February 2025 | [View Report](https://github.com/Kamino-Finance/audits/blob/main/kamino_limo_audit_formal_verification_certora.pdf) |

***

### Security Audits

Full code audits are performed before the launch of a new smart contract and periodically for existing contracts. We use security teams that have proven track records in the industry to review our codebase and identify potential vulnerabilities. The auditors try to find cases based on their practical experience and fully review the entire codebase.

| Total Audits | Auditors | Critical Vulnerabilities |
| - | - | - |
| 18 | 5 | 0 |

#### Kamino Lend

*Lend Smart Contract*

| Report | Date | Link |
| - | - | - |
| Sec3 Audit - Kamino Lend | 6 February 2025 | [View Report](https://github.com/Kamino-Finance/audits/blob/main/kamino_klend_sec3.pdf) |
| OtterSec Audit - Kamino Lend | 6 September 2023 | [View Report](https://github.com/Kamino-Finance/audits/blob/main/kamino_lend_ottersec.pdf) |
| Certora Verification - Kamino Lend | 21 February 2025 | [View Report](https://github.com/Kamino-Finance/audits/blob/main/kamino_lend_certora.pdf) |
| RX Audit - Kamino Lend | 3 July 2023 | [View Report](https://github.com/Kamino-Finance/audits/blob/main/kamino_lend_rx.pdf) |

#### Kamino Earn Vaults

*Earn Smart Contract*

| Report | Date | Link |
| - | - | - |
| Sec3 Audit - Kamino Vaults | 6 February 2025 | [View Report](https://github.com/Kamino-Finance/audits/blob/main/kamino_vault_sec3.pdf) |
| Offside Labs Audit - Kamino Vaults | 12 April 2025 | [View Report](https://github.com/Kamino-Finance/audits/blob/main/kamino_vault_offside_labs.pdf) |
| OtterSec Audit - Kamino Vaults | 9 December 2024 | [View Report](https://github.com/Kamino-Finance/audits/blob/main/kamino_vault_osec.pdf) |
| Certora Verification - Kamino Vaults | 27 June 2025 | [View Report](https://github.com/Kamino-Finance/audits/blob/main/kamino_vault_certora.pdf) |

#### Scope Oracle

*Scope Smart Contract*

| Report | Date | Link |
| - | - | - |
| Sec3 Audit - Scope | 16 December 2024 | [View Report](https://github.com/Kamino-Finance/audits/blob/main/kamino_scope_sec3.pdf) |
| OtterSec Audit - Scope | 16 December 2023 | [View Report](https://github.com/Kamino-Finance/audits/blob/main/kamino_scope_ottersec.pdf) |
| Offside Labs Audit - Scope | 8 December 2023 | [View Report](https://github.com/Kamino-Finance/audits/blob/main/kamino_scope-offside_labs.pdf) |

#### Liquidity Vaults

*Liquidity Vaults Smart Contract*

| Report | Date | Link |
| - | - | - |
| OtterSec Audit - Liquidity Vaults | 14 November 2023 | [View Report](https://github.com/Kamino-Finance/audits/blob/main/kamino_liquidity_audit_ottersec.pdf) |

#### Farms

*Farms Smart Contract*

| Report | Date | Link |
| - | - | - |
| OtterSec Audit - Farms | 13 October 2023 | [View Report](https://github.com/Kamino-Finance/audits/blob/main/kamino_farms_ottersec.pdf) |
| Offside Labs Audit - Farms | 8 December 2023 | [View Report](https://github.com/Kamino-Finance/audits/blob/main/kamino_farms-offside_labs.pdf) |

#### Limit Orders

*Limit Orders Smart Contract*

| Report | Date | Link |
| - | - | - |
| Sec3 Audit - Limit Orders | 29 January 2025 | [View Report](https://github.com/Kamino-Finance/audits/blob/main/kamino_limo_audit_sec3.pdf) |
| OtterSec Audit - Limit Orders | 7 November 2024 | [View Report](https://github.com/Kamino-Finance/audits/blob/main/kamino_limo_audit_ottersec.pdf) |
| Offside Labs Audit - Limit Orders | 29 November 2024 | [View Report](https://github.com/Kamino-Finance/audits/blob/main/kamino_limo_audit_offside_labs.pdf) |
| Certora Verification - Limit Orders | 13 May 2025 | [View Report](https://github.com/Kamino-Finance/audits/blob/main/kamino_limo_audit_formal_verification_certora.pdf) |

#### Rolling Code Audits

Rolling code audits are a continuous process of reviewing the codebase as it evolves. We have ongoing contracts with security teams that review new Pull Requests (PRs) and changes to the codebase. This ensures that any new code is reviewed for security vulnerabilities before it lands in production.

***

### Oracle Security & Resilience

Oracles are a critical component of our system, as they provide the price feeds and other data that our smart contracts rely on. We use multiple oracles to ensure that we have redundancy and can mitigate the risk of a single point of failure. We also monitor the oracles for anomalies and have mechanisms in place to switch to backup oracles if necessary.

**Oracle Providers:**

* Chainlink
* Pyth Network
* Switchboard
* Redstone
* Kamino Scope

[View Scope Smart Contract](https://github.com/kamino-finance/scope)

| Audits Completed | Volume Processed | Oracle Exploits |
| - | - | - |
| 8 | \$19.33B | 0 |

***

### Redundancy & Fallbacks

A complex system fails due to the unexpected failure of one of its many moving parts. We recognise this, and use many layers of redundancy for as many components and dependencies as possible. This is especially important for liquidators, oracle cranks, rebalancing bots, and other automated processes that interact with our smart contracts, live off-chain, or have third-party dependencies.

We have implemented redundancy and fallbacks to ensure that if one component fails, another can take over. This includes multiple oracles, multiple liquidators, multiple cranks, and multiple RPCs. We also have mechanisms in place to detect and respond to failures as fast as possible.

* RPC Redundancy
* Cloud Provider Redundancy
* Oracle Redundancy
* Liquidator Redundancy
* Oracle Crank Redundancy

***

### Liquidation Stress Tests

While testing in the local environment is a good first step, it does not fully replicate the conditions of the mainnet. Things like RPC failures, congestion, priority fees, and other real-world conditions can impact the performance of Kamino's system.

Therefore, we perform stress testing in a live environment to ensure that our system can handle the load and respond quickly to changes in the market. This includes testing the system under high load, simulating falling prices and liquidations to see how quickly the system can respond, and testing the system's ability to handle large volumes of transactions. This is not something that can be done in a local environment. Kamino has spent thousands of dollars on live stress tests.

| Liquidations Volume | # Liquidations | Bad Debt |
| - | - | - |
| \$120M+ | 100k+ | \$0 |

| Report | Date | Link |
| - | - | - |
| Liquidations Report - \$4.5M Liquidated | 18 February 2025 | [View Report](https://gov.kamino.finance/t/flash-analysis-16-18th-february-2025/509) |
| Internal Liquidations Stress Test Report | 14 February 2025 | [View Report](https://x.com/y2kappa/status/1890416521769353655) |

***

### Market & Protocol Risk Assessment

Kamino has a dedicated team of risk consultants and curators who monitor the market and protocol risks associated with the protocol's system. These contributors assess the risks of different assets, market conditions, and potential vulnerabilities in the protocol. This helps us to proactively identify and mitigate risks before they can impact the system.

* [Risk Dashboard](https://risk.kamino.finance/)
* [Monthly Risk Report](https://gov.kamino.finance/search?q=risk%20insights)
* [Value At Risk (VaR) Analysis](https://risk.kamino.finance/Value_At_Risk)
* [Price Shock Scenario Analysis](https://risk.kamino.finance/Price_Shock_Analysis)

***

### Fuzzing (By Ackee)

Fuzzing is a technique used to find vulnerabilities in our code by providing random or unexpected inputs to the system. We instrument instruction handlers end-to-end to run fuzzing as large-scale property based tests, run invariants on an entire protocol level, and detect regressions between different versions.

* [Fuzzing Deep Dive](https://ackee.xyz/blog/trident-brings-manually-guided-fuzzing-to-solana/)

| Report | Date | Link |
| - | - | - |
| Ackee Blockchain Kamino Lend Fuzz Tests Report | 22 September 2025 | [View Report](https://github.com/Kamino-Finance/audits/blob/main/kamino_lend_ackee_blockchain_fuzz_tests.pdf) |

***

### Verifiable Build

In addition to being open source and formally verified, Kamino Lend and Kamino Earn have been Verifiably Built. Verified builds ensure that the executable program deployed on Solana network is cryptographically proven to match Kamino's audited source code. This means that the program running onchain corresponds exactly to Kamino's audited source code, enhancing trust and transparency.

* [Kamino Lend](https://solscan.io/account/KLend2g3cP87fffoy8q1mQqGKjrxjC8boSyAYavgmjD)
* [Kamino Vaults](https://solscan.io/account/KvauGMspG5k6rtzrqqn7WNn3oZdyKqLKwK2XWQ8FLjd)
* [Kamino Farms](https://solscan.io/account/FarmsPZpWu9i7Kky8tPN37rs2TpmMrAZrC7S7vJa91Hr)

***

### Disclaimer

The information on this page is provided for informational purposes only and should not be interpreted as a warranty or guarantee. While Kamino implements rigorous security measures, no system can be fully immune to risk.

For more details, please refer to our [Terms & Conditions](https://kamino.com/terms).


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
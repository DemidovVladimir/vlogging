> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Institutional Yield

> Generate returns via regulated lending operations to institutional borrowers

Kamino Institutional Yield is a family of vaults that generate stablecoin yield by deploying capital to institutional, fully collateralized, and regulated lending operations. Every vault shares the same underlying structure: deposits flow through a special-purpose vehicle (SPV) into a regulated lending operation, which originates fully collateralized loans to institutional borrowers. Each vault deploys to its own lending operation, with its own borrower base, collateral type, and regulatory oversight.

Every Institutional Yield vault meets the same baseline standards:

* **Regulated lending counterparties**: capital is deployed only to third-party lending operations that are approved and supervised by a financial regulator
* **Fully collateralized loans**: every loan is either overcollateralized or backed 1:1 by cash
* **Monthly independent attestation**: an independent accounting firm attests to each vault's portfolio every month
* **Per-loan transparency**: loan-level data is reported in the vault UI, sourced directly from the lending operation's systems
* **Audited on-chain infrastructure**: every vault uses the same battle-tested Kamino smart contracts, with an instant liquidity buffer and an on-chain FIFO withdrawal queue

> [!NOTE]
>
> New to Institutional Yield? The [Concepts](https://kamino.com/docs/products/institutional-yield/concepts.md) page explains the core structure: what an SPV is, how collateralized lending works, and how withdrawals and liquidity are structured.

***

## The vaults

> **[Commodity Yield](https://kamino.com/docs/products/institutional-yield/commodities.md)**
>
> Loans to corporates and commodity traders, backed by physical commodities or escrowed cash. The lending operation is supervised by the Cayman Islands Monetary Authority (CIMA).

> **[Digital Assets Yield](https://kamino.com/docs/products/institutional-yield/digital-assets.md)**
>
> Loans to institutional borrowers, backed by high-quality digital assets (currently BTC) held at qualified custodians. The lending operation is supervised by the Financial Market Authority (FMA) in Liechtenstein.

| | Commodity Yield | Digital Assets Yield |
| - | - | - |
| **Borrowers** | Corporates and commodity traders | KYC-verified institutional entities |
| **Collateral** | Physical commodities or escrowed cash | High-quality digital assets (currently BTC) at qualified custodians |
| **Collateralization** | Varies per transaction: 1:1 escrowed cash, or overcollateralized by a commodity worth more than the loan | Maximum 60% LTV (typically lower) |
| **Loan duration** | 1–3 months (notice period 1–3 months) | Rolling terms (e.g. 60-day) |
| **Regulatory oversight** | Approved and supervised by CIMA | Approved and supervised by the FMA in Liechtenstein |
| **Independent attestation** | Monthly, by an independent accounting firm | Monthly, by an independent accounting firm |

***

## How it works

**1. Deposit stablecoins into an Institutional Yield vault on Kamino.**

You receive vault share tokens at the current share price. As part of the deposit process, you agree to the [Loan Agreement](https://kamino.com/docs/products/institutional-yield/loan-agreement.md) with the Institutional Yield SPV. This agreement governs your legal relationship as a depositor into the product.

**2. Capital flows into the Kamino Institutional Yield structure.**

Stablecoins flow through the SPV to the vault's lending operation. The lending operation originates and manages fully collateralized loans to institutional borrowers.

**3. The lending operation originates fully collateralized loans.**

Every loan is either overcollateralized or backed 1:1 by cash. The form the collateral takes is vault-specific; see [Commodity Yield collateral](https://kamino.com/docs/products/institutional-yield/commodities/collateral.md) and [Digital Assets Yield collateral](https://kamino.com/docs/products/institutional-yield/digital-assets/collateral.md).

**4. Yield flows back to vault depositors.**

Interest earned on the loan portfolio flows back through the structure to the vault. Share value appreciates proportionally as the vault accrues interest. Rates are set at origination for each loan term. Loan terms can vary between borrowers. The current liquidity buffer is shown in the vault UI.

### Withdrawals

Each vault maintains an instant liquidity buffer. Withdrawals within the buffer settle immediately. Withdrawals beyond the buffer enter an on-chain FIFO (first-in, first-out) queue and are processed as underlying loans mature and principal is returned to the vault. See [Liquidity mechanics](https://kamino.com/docs/products/institutional-yield/concepts.md#liquidity-mechanics) for full details.

***

## Product documentation

> **[Concepts](https://kamino.com/docs/products/institutional-yield/concepts.md)**
>
> Collateralized lending, LTV, rates, liquidity mechanics, and the trust model

> **[Legal Structure](https://kamino.com/docs/products/institutional-yield/structure.md)**
>
> The SPV and lending operations behind every vault

> **[Risks](https://kamino.com/docs/products/institutional-yield/risks.md)**
>
> Risk disclosure: structural and vault-specific risks

> **[Loan Agreement](https://kamino.com/docs/products/institutional-yield/loan-agreement.md)**
>
> The agreement depositors sign when they deposit

> **[FAQ](https://kamino.com/docs/products/institutional-yield/faq.md)**
>
> Direct answers to the most common questions

***

## Comparison to standard DeFi lending

| Attribute | Standard DeFi | Institutional Yield |
| - | - | - |
| **Yield source** | On-chain borrow demand | Institutional, fully collateralized lending |
| **Borrower profile** | Pseudonymous | Identified institutional entities |
| **Collateral location** | Smart contracts (on-chain) | Off-chain: qualified custodians, escrow accounts, or physical commodities, depending on the vault |
| **Rate type** | Floating (utilization-based) | Set at origination |
| **Regulatory oversight** | Protocol-level governance | Lending operations approved and supervised by a financial regulator |
| **Liquidity** | Instant (utilization-dependent) | Hybrid: instant buffer + queued |
| **Transparency** | Open-source smart contracts, on-chain verification | Real-time reporting from lending operation systems + monthly independent attestation |

***

## Contact

**Institutional Yield Enquiries:** [institutions@kamino.com](mailto:institutions@kamino.com)

***

## Disclaimer

Kamino Institutional Yield vaults are made available subject to Kamino's Terms and Conditions and geo-blocking policy. By accessing this page or interacting with the vaults, you confirm that you are not located in a restricted jurisdiction and that your participation complies with all laws and regulations applicable to you. Nothing on this page or within the associated documentation constitutes financial, investment, legal, or tax advice, nor should it be construed as a solicitation or offer to buy or sell any financial instrument or to participate in any particular investment strategy.

Regulatory approval and supervision described above apply only to the lending operation for each vault — CIMA for Commodity Yield, the FMA for Digital Assets Yield. This supervision covers the lending operation's licensing, its ongoing reporting obligations, and its origination and management of the underlying loans.

The SPV, the Kamino Institutional Yield vaults, and Kamino are not licensed, registered, or supervised by CIMA, the FMA, or any other financial regulator. Depositors do not receive deposit insurance, a regulatory guarantee, or any regulatory recourse as a result of a lending operation's regulatory status. A depositor's relationship to the structure is governed solely by the Loan Agreement, and their position is that of an unsecured creditor of the SPV.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Digital Assets Yield

> Stablecoin yield from overcollateralized institutional lending against digital assets held at qualified custodians

Institutional Digital Assets Yield is the Institutional Yield vault that lends against digital asset collateral. Loans are extended to institutional borrowers that meet strict [lending criteria](#lending-criteria), with high-quality, liquid collateral (currently BTC) posted at [qualified custodians](https://kamino.com/docs/products/institutional-yield/digital-assets/collateral.md). In this structure, there is [no collateral ownership transfer](https://kamino.com/docs/products/institutional-yield/digital-assets/collateral.md#no-title-transfer) to the lender, and rehypothecation of collateral is contractually prohibited, with collateral sitting in segregated accounts at the custodian.

Every loan is capped at 60% LTV (typically lower). The lending operation reports to the Financial Market Authority (FMA) in Liechtenstein and is [independently attested monthly](https://kamino.com/docs/products/institutional-yield/digital-assets/transparency.md#monthly-attestation). Depositors see [real-time, per-loan data](https://kamino.com/docs/products/institutional-yield/digital-assets/transparency.md#real-time-loan-data) sourced from the same systems the regulator monitors.

> **[Collateral & Custody](https://kamino.com/docs/products/institutional-yield/digital-assets/collateral.md)**
>
> Collateral framework, qualified custodians, LTV structure, and margin calls

> **[Transparency](https://kamino.com/docs/products/institutional-yield/digital-assets/transparency.md)**
>
> Real-time reporting, monthly attestation, and what data depositors can access

For the deposit flow, the SPV structure, withdrawals, and the Loan Agreement, which are shared across all Institutional Yield vaults, see the [product overview](https://kamino.com/docs/products/institutional-yield.md) and [Legal Structure](https://kamino.com/docs/products/institutional-yield/structure.md).

***

## How the vault deploys capital

Capital deposited into the vault flows through the Institutional Yield SPV to the lending operation, which originates overcollateralized loans to KYC-verified institutional borrowers. Each loan is backed by collateral held at qualified custodians under tripartite agreements. Collateral ownership remains with the borrower; the custodian holds the collateral independently, and rehypothecation is contractually prohibited.

Interest earned on the loan portfolio flows back through the structure to the vault, and share value appreciates proportionally. Rates are set at origination for each loan term.

***

## Vault characteristics

| Parameter | Terms |
| - | - |
| **Target yield** | 6–8% APY |
| **Deposit currency** | At launch, USDC. The product is designed to support a variety of stablecoins over time. |
| **Collateral** | High-quality digital assets (currently BTC) at qualified custodians |
| **Maximum LTV** | 60% (typically lower) |
| **Instant liquidity buffer** | A portion of AUM is held for immediate withdrawals |
| **Redemption model** | Hybrid: instant buffer + queued withdrawals |
| **Monthly attestation** | Independent accounting firm |

***

## Lending criteria

The vault deploys only to lending operations that meet strict criteria. The following must be met for loans to flow from the vault to borrowers:

| Criterion | Requirement |
| - | - |
| **Underlying collateral** | High-quality, liquid assets (currently BTC). Accepted collateral types are disclosed on the vault UI and may evolve over time; any changes will be reflected transparently in vault reporting. |
| **Maximum LTV** | 60% (typically lower; real-time LTV visible in vault UI) |
| **Collateral rehypothecation** | Prohibited; ownership remains with the borrower |
| **Loan duration** | Rolling terms (e.g. 60-day) |
| **Interest calculation** | 365-day year basis |
| **Regulatory oversight** | Lending operation approved and supervised by the Financial Market Authority in Liechtenstein |


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
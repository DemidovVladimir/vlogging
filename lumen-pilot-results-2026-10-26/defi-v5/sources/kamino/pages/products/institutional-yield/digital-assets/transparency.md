> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Reporting & Transparency

> What data is available to depositors, how it's sourced, and the verification mechanisms that underpin Digital Assets Yield

Because Digital Assets Yield loans exist off-chain, the transparency framework is designed to give depositors as much visibility as possible into the health and composition of the loan portfolio, through multiple independent channels.

***

## Real-time loan data

The lending operation provides per-loan data directly from its systems. This data is sourced from an industry-standard loan management and collateral tracking platform used by major institutional counterparties.

### What depositors can see

| Data point | Granularity | Source |
| - | - | - |
| **Collateral asset** | Per loan | Lending operation |
| **Loan amounts** | Per loan | Lending operation |
| **Collateral value** | Per loan (collateral value at current market price) | Lending operation |
| **LTV per loan** | Per loan | Calculated from loan amount and collateral value |
| **Portfolio-weighted average LTV** | Aggregate | Calculated from per-loan data |
| **Number of active loans** | Aggregate | Lending operation |
| **Total collateral value** | Aggregate | Lending operation |

This data is displayed in the **Vault Analytics** section of the Digital Assets Yield vault UI on Kamino.

***

## Monthly attestation

An independent accounting firm conducts monthly attestations of the Digital Assets Yield portfolio. The attestation covers:

* **Loan balances outstanding**: total and per-loan amounts verified against the lending operation's records
* **Collateral coverage ratios**: independent verification that collateral values match reported positions
* **Portfolio health metrics**: assessment of overall portfolio status

The attestation is a formal, signed document produced by a professional accounting firm. It is the primary independent verification mechanism for off-chain lending activity.

***

## Additional oversight

The lending operation also reports to the Financial Market Authority (FMA) in Liechtenstein, providing additional regulatory oversight beyond the independent attestation.

***

## Comparison to other institutional lending products

| Mechanism | Digital Assets Yield | Typical off-chain lending |
| - | - | - |
| **Per-loan data** | Available: loan amounts, collateral values, LTV per loan | Rarely disclosed |
| **Real-time data** | Continuous feed from lending operation systems | Usually monthly or quarterly reports only |
| **Independent attestation** | Monthly (independent accounting firm) | Quarterly or annual |
| **Regulatory oversight** | Top-tier jurisdiction (FMA) | Typically unregulated |


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
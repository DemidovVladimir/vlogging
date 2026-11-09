> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Legal Structure

> The SPV and lending operations behind Institutional Yield

Institutional Yield operates through a multi-entity legal structure that separates on-chain deposits from off-chain institutional lending. The structure is the same for every vault in the product family. What changes per vault is the lending operation the capital is deployed to, its regulator, and the collateral backing the underlying loans.

***

## How the entities connect

```
Depositor (on-chain)
    │
    │  Signs Loan Agreement
    │  Deposits stablecoins into a Kamino Institutional Yield vault
    │  Receives vault share tokens
    ▼
Kamino Institutional Yield Vault
    │
    │  Capital flows to the lending operation via the SPV
    ▼
Regulated Lending Operation (vault-specific)
    │
    │  Originates fully collateralized loans
    ▼
Institutional Borrowers
    │
    │  Loans backed by vault-specific collateral
    │  (physical commodities, escrowed cash, or digital assets at qualified custodians)
```

***

## The SPV

The SPV is the legal entity that sits between depositors and the lending operations. It is set up specifically for this product: a standalone, single-purpose structure with no mixing of funds from any other activity. Depositor funds flow through the SPV into the lending operation, and interest and principal repayments flow back through the SPV to the Kamino vault.

***

## The lending operations

Each vault deploys to a dedicated lending operation: the entity that originates and manages loans to institutional borrowers. Every lending operation in the product family is approved and supervised by a financial regulator:

| Vault | Lending operation | Regulator |
| - | - | - |
| [Commodity Yield](https://kamino.com/docs/products/institutional-yield/commodities.md) | An approved fund originating loans to commodity borrowers and traders | Cayman Islands Monetary Authority (CIMA) |
| [Digital Assets Yield](https://kamino.com/docs/products/institutional-yield/digital-assets.md) | A licensed lending operation originating loans against digital asset collateral | Financial Market Authority (FMA), Liechtenstein |

**Key characteristics common to every lending operation:**

* Approved by its regulator and subject to ongoing supervision, including reporting of loan positions and collateral status
* Monthly attestation by an independent accounting firm
* Per-loan data piped from its loan management and risk systems to the Kamino vault UI

**What the lending operation does with depositor capital:**

1. Receives capital from the SPV
2. Originates fully collateralized loans to institutional borrowers
3. Ensures every loan is backed by collateral under the vault's collateral framework; see [Commodity Yield collateral](https://kamino.com/docs/products/institutional-yield/commodities/collateral.md) and [Digital Assets Yield collateral](https://kamino.com/docs/products/institutional-yield/digital-assets/collateral.md)
4. Manages the loan portfolio: monitoring collateral coverage, processing interest payments, handling maturities and rollovers
5. Returns principal and interest to the SPV

> [!NOTE]
>
> The depositor's economic exposure spans the entire structure, from the SPV through the lending operation to the underlying collateralized loans. The quality of the depositor's position depends on the operational integrity of every entity in the structure.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
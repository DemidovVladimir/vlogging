> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Collateral & Transaction Structure

> How Commodity Loans are collateralized: escrowed cash, physical commodities, the security package, back-to-back contracts, and independent verification

Every Commodity Loan is designed to stay covered at all times. Before funds are released into the trade, the loan is backed 1:1 by cash held in a segregated account. After release, it is more than 100% collateralized by physical commodities, measured against the contracted onward-sale price.

This page explains how collateral changes through the transaction, how funds are released, and how the lending operation's security package protects the underlying Commodity Loan.

***

## The two collateral configurations

### 1. Escrowed cash

Before shipment, financing may sit in a **segregated escrow account** at a tier-one bank, or back a **letter of credit** issued in favor of the commodity seller. These arrangements evidence the buyer's capacity to pay. Funds are released only after independent verification of the shipment and delivery of the agreed documentation. In this configuration the loan is matched 1:1 by cash.

> [!NOTE]
>
> An **escrow account** is a bank account whose funds move only when pre-agreed conditions are met; here, that means verified shipment documents. A **letter of credit** is a bank's commitment to pay the seller, backed by that escrowed cash.

### 2. The physical commodity

After funds are released, title to the goods passes to the Commodity Yield Fund and the loan is collateralized by the commodity itself. The commodity is bought at a discount to prevailing market prices, while its onward sale price is fixed by contract at a higher level. The contractual sale value is therefore expected to exceed the loan principal.

Exposure to the physical commodity is typically short, often measured in days or weeks. The rest of the transaction lifecycle is cash-covered.

***

## Security package

> [!NOTE]
>
> A **security package** is the bundle of legal protections a lender takes around a trade: control of the bank accounts, a claim on the sale proceeds, security over the goods, and performance bonds. If a counterparty fails, these give the lender enforceable routes to recover its money.

Beyond the collateral itself, each Commodity Loan is documented with a security package that gives the lending operation legal control over the financed trade. Depending on the transaction, it can include:

* **Control over cash flows**: money leaves the designated escrow or controlled accounts only when contractually defined conditions precedent and documentation requirements are met
* **Assignment of receivables**: amounts owed by end buyers under the onward sale contracts are assigned or pledged to the lending operation, so payments flow to accounts it controls
* **Security over the trading assets**: security interests (liens or equivalent) over the commodities and related trade assets while held by or on behalf of the lending operation
* **Performance protection**: performance bonds or guarantees (often around 2% of transaction value), plus contractual cost-reimbursement obligations if a counterparty fails to perform

Together with conservative collateral levels and continuous monitoring, these are designed to provide multiple layers of downside protection. They do not eliminate credit, operational, legal, market, or other risks.

***

## Back-to-back contracts

Most transactions are structured **back to back**. The trader signs two contracts at or around the same time: a purchase contract for the commodity at a discount to market, and an onward sale contract with an end buyer at a fixed price. This is intended to substantially reduce open commodity price risk, though basis risk, counterparty risk, and timing risk may still arise.

The Commodity Yield Fund typically retains title to the commodity until the end buyer pays under the onward sale contract. Both legs often settle on the same day: title transfers, and the proceeds are credited to segregated or controlled bank accounts.

> [!NOTE]
>
> **Basis risk** is the risk that the two legs of the trade stop lining up; for example, a mismatch in terms between the purchase and the sale. **Timing risk** is a gap between the two legs settling.

***

## Escrow and banking

Escrowed cash is held with global tier-one banks. Subject to the escrow terms and regulatory constraints, it may be invested in high-quality liquid instruments such as short-dated US Treasuries. The identity of banks, the nature of the instruments held, and portfolio composition are disclosed in transparency materials, subject to confidentiality and regulatory limitations. See [Transparency](https://kamino.com/docs/products/institutional-yield/commodities/transparency.md).

***

## Insurance and marine risk

Financed goods are insured on an all-risk cargo basis for at least the full shipment value. The financing entity is named as loss payee or co-insured, so it can claim directly for covered loss or damage. Cover typically includes transit loss or damage, theft, war, and strikes, subject to standard exclusions and policy limits.

Transactions are generally financed on a free-on-board (FOB) or similar basis. The lending operation does not assume unhedged freight, shipping, or marine price risk beyond the insured profile. Vessels are conventionally insured in established marine markets (including Lloyd's), which structurally exclude sanctioned and "gray-fleet" carriers. The lending operation applies sanctions controls. It seeks to avoid exposure to sanctioned jurisdictions, entities, and vessels, and undue concentration at maritime chokepoints.

> [!NOTE]
>
> **Free on board (FOB)** means responsibility for the goods passes at the loading port. The financed leg of the trade therefore excludes ocean freight and its costs, and the cargo itself is insured for the journey.

***

## Independent verification

Funds leave escrow only after independent verification of the shipment by internationally recognized inspection agencies such as SGS, Intertek, Alfred H. Knight, or Alex Stewart. These agencies check quality and quantity against the contractual specifications, and issue assay and weighbridge certificates that are contractually binding on the relevant parties.

Payment is released only against a complete documentary package. Depending on the commodity and jurisdiction, this typically includes:

* commercial invoice and packing list
* certificate of origin, and export and mining permits where applicable
* weighbridge certificate and independent assay/quality certificate
* warehouse receipts or holding certificates
* transport and shipping documents
* the executed purchase and sale agreements and relevant insurance certificates

***

## Transaction lifecycle

A typical transaction proceeds as follows:

1. **Trial transaction.** New counterparties typically start with a smaller trial transaction. It validates delivery performance, documentation, and operational processes before exposure scales.
2. **Contracting.** The trader signs a purchase contract at a discount to spot and an onward sale contract at a fixed price. Financing is placed into a segregated escrow account, or provided via a letter of credit backed by escrowed cash.
3. **Shipment and inspection.** The commodity ships, typically on FOB terms. At the agreed delivery point, an independent inspection agency verifies quality and quantity and issues the certificates.
4. **Settlement and title transfer.** After satisfactory inspection and documentation, escrow releases funds to the seller and title passes to the Commodity Yield Fund. The onward sale leg then settles: the end buyer pays, title passes to the buyer, and the proceeds are credited to a segregated or controlled account to repay the Commodity Loan and associated margins.
5. **Redeployment.** Proceeds flow back into a segregated account, restoring cash coverage. Subject to risk parameters and demand, they are typically redeployed into the next shipments of a rolling program (for example, repeated deliveries over 12 months). The vault's withdrawal notice periods are aligned with this cycle, so that where practicable, proceeds can be returned to the vault rather than rolled when redemptions are required.

***

## Commodities covered

Collateral commodities include copper, oil, coffee, granulated sulphur, diesel, petrol, and jet fuel, among others. Short-term perishable commodities are excluded.

The lending operation does not face sanctioned jurisdictions, countries, individuals, or trading entities thereof.

***

## LTV

LTV varies per transaction. At all times, the loan is covered at minimum by either cash in a segregated bank account (held directly or backing a letter of credit) or a commodity worth more than the loan. When the position faces cash, coverage is 1:1; when it faces the commodity, the commodity was bought at a discount to spot and is worth more than the loan.

LTV is measured against the **contractual sale price** of the commodity rather than a fluctuating spot price. Both legs of the transaction are contracted at fixed prices, so the value covering the loan is locked. When a transaction completes and the proceeds sit in the bank, the position is reported as cash. See [Transparency](https://kamino.com/docs/products/institutional-yield/commodities/transparency.md) for how this is reported per loan.

***

## Liquidations

A liquidation would only occur if a buyer did not perform on a contracted purchase, which is unlikely, as buyers are purchasing the commodity at a discount to spot. Because settlement happens at the delivery point, a failure to perform is identified quickly, and the escrowed funds or the commodity are retained. Where a counterparty has posted a performance bond, that bond is also forfeited. If the lending operation is left holding the commodity, it can sell it to another buyer.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
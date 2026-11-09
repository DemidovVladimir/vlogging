> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Commodity Yield

> Stablecoin-denominated yield from short-term, fully collateralized commodity trade finance through a CIMA-supervised fund

Kamino Institutional Commodity Yield bridges onchain demand for stablecoin-denominated yield with institutional demand for short-term, collateralized credit.

Global commodity trade depends on working capital. Producers and traders moving essential industrial commodities through supply chains, including metals, energy products, and selected non-perishable soft commodities, often need financing between purchasing goods and receiving payment from qualified off-takers. Returns in this market are generated primarily from the commercial margins on physical commodity trades. Financing demand is significant and recurring.

Access to this market has historically been limited for onchain depositors. Kamino Institutional Commodity Yield provides that access through strict lending criteria, ongoing portfolio transparency, and a regulated off-chain lending operation implemented through an approved fund structure supervised by the **Cayman Islands Monetary Authority (CIMA)**.

> [!NOTE]
>
> Kamino's on-chain protocol and Institutional Yield vaults (including the Commodity Yield vault) are not themselves licensed, approved, or supervised as regulated financial services or products by CIMA, the Financial Market Authority (FMA), or any other regulatory authority. References in this documentation to regulated funds, lending entities, or custodians relate exclusively to independent off-chain counterparties and do not extend to Kamino or its on-chain products.

> **[Collateral & Transaction Structure](https://kamino.com/docs/products/institutional-yield/commodities/collateral.md)**
>
> Escrowed cash, physical commodities, back-to-back contracts, the security package, and independent shipment verification

> **[Transparency](https://kamino.com/docs/products/institutional-yield/commodities/transparency.md)**
>
> Per-loan reporting, monthly attestation, and regulatory oversight

For the deposit flow, the SPV structure, withdrawals, and the Loan Agreement, which are shared across all Institutional Yield vaults, see the [product overview](https://kamino.com/docs/products/institutional-yield.md) and [Legal Structure](https://kamino.com/docs/products/institutional-yield/structure.md).

***

## Strategy highlights

* **Real-economy exposure.** Kamino Institutional Commodity Yield generates returns from financing income on short-duration Commodity Loans. These loans fund pre-arranged trades in essential industrial commodities, including metals, energy products, and selected non-perishable soft commodities.
* **Short duration, recurring deployment.** Commodity Loans typically have a duration of one to three months. When a loan settles, returned principal is first applied to queued withdrawal requests. Remaining capital may then finance repeat deliveries under structured trading programs, subject to borrower performance and risk limits.
* **Defined collateral coverage.** Each Commodity Loan is designed to remain covered at all times. Before funds are released into the trade, the loan is backed 1:1 by cash held in a segregated account. After release, it is more than 100% collateralized by physical commodities, measured against the contractual onward-sale price. The lending operation's transaction-specific security package may include controlled accounts, security over the financed commodities and related trade assets, and assignments or pledges of receivables. Collateral coverage is continuously monitored, with independent verification required before funds are released.
* **Disciplined selection, tight mandate.** Each eligible transaction is structured back to back: before financing is provided, the commodity purchase and onward sale are contractually agreed at fixed prices. The commodity is purchased below the contracted onward-sale price, creating a defined commercial margin within the trade. This structure is designed to limit material unhedged commodity-price exposure. Speculative inventory positions, unsecured prepayments, and transactions with material unhedged commodity-price exposure fall outside the mandate.

***

## How it works

![Kamino Institutional Commodity Yield capital and return flow](https://mintcdn.com/kamino-3d73a151/xfYHZtgt_rk3q-Ya/images/institutional-yield/commodities/how-it-works.png?fit=max\&auto=format\&n=xfYHZtgt_rk3q-Ya\&q=85\&s=e930ba8930f33faf4b283bbb88373583)

**1. Deposit USDC and receive vault tokens.**

Vault depositors transfer USDC into the Kamino Institutional Commodity Yield vault and receive **kicUSDC** (Kamino Institutional Commodity USDC). These vault tokens represent the depositor's proportional share of the vault's net asset value and are issued and redeemed at the prevailing share price.

**2. Enter into the Loan Agreement with the Institutional Yield SPV.**

By depositing into the vault, the vault depositor extends an unsecured loan to the Institutional Yield SPV under the standard Institutional Yield [Loan Agreement](https://kamino.com/docs/products/institutional-yield/loan-agreement.md). The depositor's legal relationship is with the SPV. The depositor has no direct claim against the underlying borrowers and no direct security interest in the collateral securing the Commodity Loans.

**3. Capital is allocated to the off-chain Commodity Yield structure.**

The Institutional Yield SPV allocates capital to a regulated off-chain lending operation implemented through an approved fund structure supervised by CIMA. The off-chain structure originates and manages short-duration Commodity Loans to corporate borrowers and commodity traders.

**4. A Commodity Loan finances a qualifying trade.**

Before financing is provided, the commodity purchase and onward sale are contractually agreed at fixed prices. The Commodity Loan is backed 1:1 by cash in a segregated account before funds are released into the trade. Following independent verification and release, the loan is more than 100% collateralized by physical commodities, measured against the contractual onward-sale price. The lending operation also maintains a transaction-specific security package over the financed trade. See [Collateral & Transaction Structure](https://kamino.com/docs/products/institutional-yield/commodities/collateral.md).

**5. The trade settles, withdrawals are processed, and remaining capital may be redeployed.**

When the onward sale settles, the proceeds repay the Commodity Loan and its financing costs. Income generated by the loan portfolio, net of applicable fees and expenses, accrues to the vault and increases the redemption value of kicUSDC.

Withdrawals within the vault's instant liquidity buffer settle immediately. Larger requests enter an on-chain first-in, first-out (FIFO) queue. As Commodity Loans settle, returned principal is first applied to queued withdrawal requests. Remaining capital may then finance new Commodity Loans. The buffer size and queue status are shown in the vault interface.

***

## Vault characteristics

| Parameter | Terms |
| - | - |
| **Deposit currency** | USDC |
| **Vault token** | kicUSDC (Kamino Institutional Commodity USDC), representing the vault depositor's proportional share of the vault's net asset value. Depositor rights are governed by the Institutional Yield Loan Agreement. |
| **Borrower type** | Corporate commodity borrowers and traders that have completed the lending operation's KYC, AML, and credit-assessment procedures. |
| **Collateral** | (i) Physical commodities (including copper, oil, coffee, granulated sulphur, diesel, petrol, and jet fuel), excluding short-term perishables; and/or (ii) cash financing held in segregated escrow accounts, including cash backing letters of credit |
| **Transaction structure** | New counterparties typically start with a small trial transaction. Subject to performance and documentation, trades continue as rolling programs of repeat deliveries over a predefined period (for example, a 12-month schedule) |
| **Collateral management** | Funds sit in segregated escrow accounts at tier-one banks and are released only after independent verification of the shipment and receipt of the agreed documentation. Collateral coverage is monitored against contractual parameters |
| **Ownership transfer** | In the majority of transactions, the Commodity Yield Fund retains title to the commodity until the end buyer's payment is received under the onward sale contract. Settlement of purchase and sale legs is typically back to back |
| **Collateralization** | Intended at all times to be covered at minimum 1:1 by segregated cash and/or overcollateralized by commodities purchased at a discount, measured against the contractual sale price rather than volatile spot prices |
| **Insurance** | Financed goods are insured on an all-risk cargo basis for at least the full shipment value, with the financing entity named as loss payee or co-insured, enabling direct claims for covered loss or damage |
| **Loan duration** | Commodity Loan tenors of approximately 1–3 months. The vault's withdrawal notice framework is calibrated to this transaction cycle for withdrawals beyond the instant liquidity buffer |
| **Regulatory oversight** | The Commodity Yield Fund is an approved fund supervised by CIMA and subject to applicable regulatory reporting and oversight. This supervision does not extend to Kamino's on-chain protocol or vaults |
| **Independent attestation** | Monthly portfolio attestation by an independent accounting firm, including verification of outstanding loan balances, collateral coverage, and key portfolio metrics |

***

## Lending framework

Strict parameters govern how deposited funds are deployed:

* Every loan is covered at minimum 1:1 by cash in a segregated bank account (held directly or backing a letter of credit), or overcollateralized by a commodity worth more than the loan
* Funding is released only after the physical commodity shipment has been independently checked and approved and all documentation is in place
* Liquidations would only occur if a buyer did not perform, which is unlikely, as buyers are purchasing the commodity at a discount to spot
* The lending operation does not face sanctioned jurisdictions, countries, individuals, or trading entities thereof

***

## Disclaimers and eligibility

Commodity Yield is intended for use only by persons who are legally permitted to interact with such products in their jurisdictions and who understand and accept the associated risks. Access may be restricted by geo-blocking or other measures.

Nothing in this documentation constitutes investment, financial, legal, or tax advice, or a recommendation or solicitation to buy, sell, or hold any financial product or digital asset. Depositors should take independent advice and make their own assessment of whether participation in Commodity Yield is appropriate in light of their objectives, experience, financial situation, and risk tolerance.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
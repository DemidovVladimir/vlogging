> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Collateral & Custody

> How collateral is held, the LTV framework, custodian structure, and what happens when collateral coverage changes

All loans originated by the Digital Assets Yield lending operation are overcollateralized with high-quality assets. Currently, all collateral is Bitcoin (BTC). Accepted collateral types are disclosed on the vault UI and may evolve over time; any changes will be reflected transparently in vault reporting. This page explains how collateral is held, the protections in place, and what happens when collateral coverage changes.

***

## Collateral assets

Every loan in the Digital Assets Yield portfolio is backed by collateral posted by the institutional borrower. Currently, all collateral is BTC. The collateral is held at **qualified custodians**: licensed financial institutions operating under regulatory supervision.

***

## Tripartite agreement

Collateral is held under a **tripartite agreement**: a three-party contract between:

1. **The borrower** (the institutional entity taking the loan)
2. **The lending operation** (the entity originating the loan)
3. **The custodian** (the qualified institution holding the collateral)

The tripartite agreement governs the rights and obligations of each party with respect to the collateral. Under this structure:

* The custodian holds the collateral independently of both the borrower and the lender
* The lending operation has a contractual claim on the collateral in the event of borrower default
* The custodian enforces the agreement independently; it is not controlled by either party

***

## No title transfer

A critical feature of the collateral structure is that **no ownership transfer of collateral occurs to the lender**. The borrower's collateral remains their property at all times during the loan term.

**What this means in practice:**

* The collateral stays in the borrower's name at the qualified custodian
* The lending operation has a contractual lien on the collateral: it can instruct the custodian to liquidate in the event of default, but cannot access, move, or use the collateral during the loan term
* The custodian enforces the tripartite agreement independently of both parties

**Why this matters:**

When a lender takes possession of collateral, the borrower is exposed to the lender's operational risk, such as mismanagement, insolvency, or misuse of assets. Under the no-title-transfer model, the borrower's collateral is never in the lender's possession, eliminating the risk of lender mismanagement of collateral.

***

## Bankruptcy remoteness

Assets held at qualified custodians are **bankruptcy remote**. If a custodian fails (becomes insolvent, goes bankrupt, or ceases operations), the collateral held at that custodian **cannot be seized by the custodian's creditors**.

In practice:

* Client assets are segregated from the custodian's own assets at all times
* In the event of custodian insolvency, client assets are returned to clients or transferred to an alternative custodian; they do not enter the insolvency estate
* Creditors of the custodian have no legal claim on client-custodied assets
* This protection is enforced by the laws of the jurisdiction where the custodian is regulated

***

## Rehypothecation prohibition

**Rehypothecation, the practice of a custodian or lender re-using client collateral for lending, pledging, or financing, is explicitly prohibited by contract.**

Under the tripartite custodian agreement:

* The custodian cannot lend, pledge, or trade the collateral
* The collateral is held in **segregated accounts**, fully separated from the custodian's own assets and those of other clients
* The lending operation cannot re-use the collateral for any purpose other than securing the specific loan it backs

***

## LTV framework

### Maximum LTV: 60%

All loans are originated at a maximum Loan-to-Value ratio of 60%.

In practice, loans are typically originated at lower LTV. The current LTV for each loan and the portfolio-weighted average LTV are reported in real time via the vault UI.

### What 60% max LTV means for collateral price declines

| Collateral price decline from origination | LTV at max origination (60%) | Status |
| - | - | - |
| 0% | 60% | At maximum |
| 10% | 67% | Above max; margin call territory |
| 20% | 75% | Significant breach |
| 40% | 100% | Full collateral coverage consumed |

A 40% decline in collateral price from origination would bring a loan originated at exactly 60% LTV to full collateral coverage (100% LTV). Loans originated at lower LTV have correspondingly larger buffers.

***

## Collateral monitoring

Collateral positions are monitored **continuously and in real time** through an industry-standard loan management system. Every loan, every collateral position, and every change is tracked; if a borrower's collateral value changes (due to market price movement, additional collateral posted, or partial withdrawal), the change is visible immediately.

Per-loan collateral data (loan amount, collateral value, LTV) is provided to Kamino for display in the vault UI. This data comes directly from the lending operation's systems and is continuously updated.

***

## Margin calls and liquidation

* Loans are originated at a maximum 60% LTV, with typical LTV lower
* Collateral positions are monitored continuously via an industry-standard loan management system
* If collateral price declines cause LTV to breach the margin call threshold, the lending operation can require the borrower to post additional collateral
* If the borrower fails to post additional collateral, the lending operation can instruct the custodian to liquidate collateral under the terms of the tripartite agreement
* Liquidation also takes place if the borrower fails to repay the loan at maturity


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
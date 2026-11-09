> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Concepts

> Foundational explanations of institutional lending, SPVs, and liquidity mechanics

This page explains the foundational concepts behind Institutional Yield. If you're new to the product, start here before reading the detailed pages on [structure](https://kamino.com/docs/products/institutional-yield/structure.md), [risks](https://kamino.com/docs/products/institutional-yield/risks.md), and the individual vaults.

***

## What Institutional Yield is

Kamino Institutional Yield is a fully collateralized institutional lending product. Capital deposited into a vault is deployed to a regulated lending operation that originates loans to institutional borrowers. Every loan is either overcollateralized or backed 1:1 by cash.

The product is structured as a family of vaults. Each vault deploys to its own lending operation, with its own borrower base, collateral type, and regulator:

* **[Commodity Yield](https://kamino.com/docs/products/institutional-yield/commodities.md)**: loans to corporates and commodity traders, backed by physical commodities or escrowed cash; the lending operation is supervised by the Cayman Islands Monetary Authority (CIMA)
* **[Digital Assets Yield](https://kamino.com/docs/products/institutional-yield/digital-assets.md)**: loans to KYC-verified institutional borrowers, backed by high-quality digital assets (currently BTC) held at qualified custodians; the lending operation is supervised by the Financial Market Authority (FMA) in Liechtenstein

Every vault's portfolio is independently attested each month by an accounting firm.

For a detailed comparison with standard on-chain lending, see the [overview page](https://kamino.com/docs/products/institutional-yield.md#comparison-to-standard-defi-lending).

***

## Collateralized lending

**Fully collateralized** means the collateral is worth at least as much as the loan. **Overcollateralized** means the value of the collateral exceeds the value of the loan; if collateral value declines, this buffer absorbs the loss before the loan becomes under-collateralized.

How collateralization is achieved differs per vault. In the Digital Assets vault, every loan is overcollateralized, capped at 60% LTV against digital asset collateral. In the Commodity Yield vault, each Commodity Loan is intended to be covered 1:1 by escrowed cash, or overcollateralized by a commodity purchased below its contracted sale price. Contracts are arranged back to back at fixed prices, substantially reducing open commodity price risk.

### LTV (Loan-to-Value)

LTV is the ratio of the loan amount to the collateral value:

**LTV = Loan Amount / Collateral Value**

| LTV | Meaning |
| - | - |
| 30% | Collateral worth more than 3x the loan; very conservative |
| 50% | Collateral worth 2x the loan; conservative |
| 60% | Collateral worth at least 40% more than the loan; the maximum allowed in the Digital Assets vault |
| 75–86% | Typical range for on-chain DeFi lending; higher risk |

In the Digital Assets vault, the 60% cap accounts for the fact that off-chain liquidation is slower than on-chain smart contract execution. The larger buffer compensates for the time needed to coordinate custodian liquidation.

In the Commodity Yield vault, LTV is measured against the contractual sale price of the commodity rather than a fluctuating spot price, since both the purchase and the onward sale are contracted at fixed prices from the outset.

***

## Rates

Rates are **set at origination** for each loan term. The rate is negotiated between the lending operation and the institutional borrower, then held constant for the full loan duration.

At each rollover (when a loan term ends and a new one begins), the rate is renegotiated based on prevailing market conditions.

**What this means for depositors:**

* Yield is predictable within each loan term
* Yield may change at each rollover, up or down depending on market conditions

***

## Liquidity mechanics

Each vault has two withdrawal mechanisms: an instant buffer and a FIFO queue. Capital deployed into active loans is returned as those loans mature. Liquidity is managed to process withdrawals as efficiently as possible.

### 1. Instant buffer

A portion of AUM is held as uninvested capital, available for immediate withdrawal. This buffer is sourced from:

* Capital not yet deployed into active loans
* Principal returned from recently matured loans
* New deposits that have not yet been allocated

The buffer is managed to maintain a target level. During periods of rapid deployment or high withdrawal demand, the buffer may temporarily be reduced.

### 2. Queued withdrawals (FIFO)

Withdrawal requests beyond the instant buffer enter a **FIFO (first-in, first-out) queue**. Requests are resolved in order as underlying loans mature and principal returns to the vault.

* The queue processes withdrawals strictly in the order they were submitted
* Wait time depends on when the next batch of loans matures

The FIFO queue is built into the vault's on-chain infrastructure and processes withdrawals automatically as liquidity becomes available.

***

## The trust model

Institutional Yield operates under a different trust model than standard on-chain lending:

| Dimension | On-chain DeFi | Institutional Yield |
| - | - | - |
| **Collateral verification** | Permissionless; anyone can verify on-chain | Verified by the supervising regulator and independent attestation |
| **Rate enforcement** | Code (smart contract) | Contract (legal agreement) |
| **Liquidation** | Automatic (smart contract) | Manual (executed by the lending operation) |
| **Transparency** | Full on-chain visibility | Real-time data + monthly attestation |
| **Recourse** | Smart contract holds collateral | Legal claim on SPV assets (limited recourse) |

Understanding which trust model you are exposed to, and what can go wrong within that model, is important context before depositing.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
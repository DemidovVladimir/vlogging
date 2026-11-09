> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# FAQ

> Direct answers to the most common questions about Institutional Yield

## What vaults are available?

Institutional Yield is a family of vaults, each deploying to its own regulated lending operation:

* **[Commodity Yield](https://kamino.com/docs/products/institutional-yield/commodities.md)**: loans to corporates and commodity traders, backed by physical commodities or escrowed cash. The lending operation deploys through an approved fund supervised by the Cayman Islands Monetary Authority (CIMA).
* **[Digital Assets Yield](https://kamino.com/docs/products/institutional-yield/digital-assets.md)**: loans to KYC-verified institutional borrowers, backed by high-quality digital assets (currently BTC) held at qualified custodians. The lending operation is approved and supervised by the Financial Market Authority (FMA) in Liechtenstein.

***

## Is my deposit secured or unsecured?

**Your loan to the SPV is unsecured.** The collateral exists at the lending operation level, between the lending operation and its borrowers. Your legal claim is on the SPV's assets, which are primarily composed of those fully collateralized lending positions.

The underlying loans are fully collateralized, but your deposit into the SPV does not have direct collateral attached to it. Your protection comes from the fact that the SPV's assets are backed by fully collateralized loans, combined with the reporting and attestation framework that provides visibility into the lending operation. See [Loan Agreement](https://kamino.com/docs/products/institutional-yield/loan-agreement.md).

***

## What happens if a borrower defaults?

It depends on the vault, because the collateral takes a different form in each:

**Commodity Yield**: a default would mean a buyer failing to perform on a contracted purchase. The lending operation retains title to the commodity until the buyer's funds are received. If the buyer fails to pay, it therefore still holds the commodity, purchased at a discount to the contracted sale price, and can sell it. Where the transaction has not yet shipped, the financing sits in a segregated escrow account and no funds have been released.

**Digital Assets Yield**: the lending operation instructs the qualified custodian to liquidate the borrower's collateral under the tripartite agreement, and the proceeds repay the loan. Because loans are originated at a maximum 60% LTV (and typically lower), the collateral should more than cover the loan in most scenarios.

In either vault, depositors face a loss only if the underlying loan cannot be repaid and realizing the collateral is insufficient to cover the balance.

***

## What happens if there is a loss in the portfolio?

If a lending operation experiences a loss that cannot be recovered through collateral realization:

* The loss reduces the SPV's available assets
* This reduces the value backing depositor claims
* The loss would be reflected in the vault share price; share value would decrease proportionally

***

## How do I know the collateral actually exists?

Multiple independent verification layers confirm collateral in every vault:

1. **Real-time data** from the lending operation's loan management and risk systems, piped to the vault UI
2. **Monthly attestation** by an independent accounting firm, providing formal verification of loan balances and collateral coverage
3. **Regulatory reporting** to the vault's supervising regulator (CIMA for Commodity Yield, the FMA for Digital Assets Yield)

In the Commodity Yield vault, physical shipments are additionally checked and approved by an independent third party before any funds are released.

See [Commodity Yield transparency](https://kamino.com/docs/products/institutional-yield/commodities/transparency.md) and [Digital Assets Yield transparency](https://kamino.com/docs/products/institutional-yield/digital-assets/transparency.md).

***

## When can I withdraw my deposit?

* **Immediately**: if the withdrawal is within the liquidity buffer (capital not deployed into active loans)
* **After loan maturity**: if the buffer is exhausted, your withdrawal enters a FIFO queue and is processed as underlying loans mature and principal returns

There is no early redemption for capital deployed into active loans. Loan terms are rolling, so the maximum wait in the queue depends on when the next batch of loans matures.

See [Liquidity mechanics](https://kamino.com/docs/products/institutional-yield/concepts.md#liquidity-mechanics).

***

## Who attests to the portfolios?

An independent accounting firm conducts monthly attestations of each vault's portfolio, covering loan balances, collateral coverage, and portfolio health.

Each lending operation also reports to its supervising regulator: CIMA for Commodity Yield, and the FMA in Liechtenstein for Digital Assets Yield.

***

## What is the SPV and why does it exist?

The SPV is the legal entity that receives depositor funds and deploys them to the lending operations. It exists to:

* **Ring-fence risk**: SPV liabilities are contained within the SPV and do not reach Kamino's on-chain protocol
* **Provide a legal structure** for off-chain institutional lending

See [Legal Structure: The SPV](https://kamino.com/docs/products/institutional-yield/structure.md#the-spv).

***

## What yield can I expect?

Target, historical, and current projected returns for each vault are displayed on the Kamino UI. The actual yield depends on:

* The rate negotiated with borrowers for each loan term
* The proportion of vault capital deployed vs. held in the liquidity buffer (undeployed capital earns lower yield)
* Portfolio performance

***

## How is Institutional Yield different from other on-chain institutional lending products?

| Feature | Kamino Institutional Yield | Typical comparison |
| - | - | - |
| **Collateral** | Overcollateralized or backed 1:1 by cash in every vault: physical commodities or escrowed cash (Commodity Yield), digital assets at qualified custodians under tripartite agreements (Digital Assets Yield) | Varies; some products accept diverse or incentivized collateral |
| **Regulatory oversight** | Every lending operation approved and supervised by a financial regulator (CIMA, FMA) | Typically unregulated |
| **Independent attestation** | Monthly (independent accounting firm) | Often quarterly or annual, if any |
| **Real-time data** | Per-loan data from lending operation systems | Rarely available |

***

## Can I see individual loans?

Yes. Each lending operation provides per-loan data including loan amount, collateral value, and LTV. This data is displayed in the vault UI. Borrower identities are protected by confidentiality requirements.

***

## Who are the borrowers?

In the Commodity Yield vault, borrowers are corporates and commodity traders. In the Digital Assets Yield vault, borrowers are KYC-verified institutional entities. Due to confidentiality requirements, individual borrower identities are not disclosed. Loan-level data (amounts, collateral values, LTV) is available without borrower identification.

***

## Does Institutional Yield introduce new smart contract risk?

No. Institutional Yield vaults use the same battle-tested Kamino smart contracts that power other Kamino products. There is no new on-chain technical risk; the vault infrastructure is identical to the existing, audited Kamino vault framework.

***

## What stablecoins are accepted?

At launch, **USDC**. The product is designed to support a variety of stablecoins over time.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
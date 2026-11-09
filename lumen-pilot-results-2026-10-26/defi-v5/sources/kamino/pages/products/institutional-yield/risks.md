> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Risks

> Risk disclosure for Institutional Yield

This section sets out the risks associated with depositing into an Institutional Yield vault. The structural risks below apply to every vault in the product family; vault-specific risks follow.

***

## Unsecured loan to the SPV

The depositor's legal relationship is with the SPV. The [Loan Agreement](https://kamino.com/docs/products/institutional-yield/loan-agreement.md) characterizes this loan as **unsecured**. Depositors have no direct security interest in the collateral backing the underlying loans (such as commodities, escrow accounts, receivables, or digital assets); that collateral secures the loans between the lending operation and its borrowers, one level below the depositor.

The depositor's economic exposure is to fully collateralized lending: the depositor's claim is on the SPV's available assets, which are primarily composed of those fully collateralized lending positions. Losses at the level of a lending operation or its collateral may propagate to the SPV and be reflected in the net asset value of the relevant vault and its vault tokens.

***

## Lending operation risk

Each lending operation is a regulated entity, but regulation does not eliminate risk. Possible failure modes include:

* **Operational failure**: errors in loan origination, collateral monitoring, or the execution of margin calls and settlements
* **Failure to liquidate**: if a borrower defaults and the lending operation does not act promptly, collateral value may decline further before liquidation occurs
* **Regulatory action**: the supervising regulator could suspend or revoke the lending operation's approval, potentially freezing operations

***

## Liquidity risk

Capital deployed into active loans cannot be retrieved prior to loan maturity. There is no early redemption mechanism. While each vault maintains an instant liquidity buffer, withdrawals exceeding that buffer enter a FIFO queue and are resolved only as underlying loans mature and principal is returned to the vault.

***

## Not a deposit or insured product

Participation in an Institutional Yield vault does not constitute a bank deposit and is not covered by any government-backed deposit protection or insurance scheme. No rate of return or capital preservation is guaranteed. The value of your deposit may go down as well as up, and past performance, if any, is not indicative of future results.

***

## Vault-specific risks

### Commodity Yield

In addition to the structural risks above, Commodity Yield involves risks specific to commodity trade finance:

* **Commodity price and basis risk**: although transactions are structured back to back with fixed prices, severe market dislocations, basis risk, or timing mismatches may impair recoveries.
* **Counterparty risk**: defaults or non-performance by traders, buyers, sellers, or logistics providers can lead to delays, enforcement actions, and potential losses.
* **Legal and enforcement risk**: enforcing security interests and contracts across multiple jurisdictions, including emerging markets, can be complex, time-consuming, and uncertain.
* **Settlement, shipping, and logistics risk**: delays, disruptions, sanctions events, or failures in transport and logistics chains can adversely affect trade execution and recoveries.

Any of these risks, if crystallized, may result in partial or total loss of deposited capital.

See [Commodity Yield collateral & transaction structure](https://kamino.com/docs/products/institutional-yield/commodities/collateral.md) for the collateral and security framework around each transaction.

### Digital Assets Yield

**Collateral price risk**: an extreme and rapid decline in collateral price, combined with delayed liquidation, could leave a loan under-covered. The 60% maximum LTV provides the buffer against this scenario.

**Custodian risk**: collateral protection relies on the integrity and proper functioning of qualified custodians. While custodied assets are bankruptcy remote, the process of recovering assets from an insolvent custodian could take time.

See [Digital Assets Yield collateral & custody](https://kamino.com/docs/products/institutional-yield/digital-assets/collateral.md) for the full collateral framework.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
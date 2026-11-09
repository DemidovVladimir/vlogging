# Aave 101

An intro to Aave: powering open, decentralised finance.

---

Aave is a leading **liquidity protocol**, a decentralised system of smart contracts that facilitates the efficient movement and management of digital assets.

Built on a supply-and-borrow model, it enables users to supply liquidity and, in return, allows other participants to borrow against supplied collateral. The protocol is deployed across multiple blockchain networks, ensuring accessibility and interoperability across ecosystems.

> [!NOTE]
> [Aave v3](/aave-v3/overview) is the stable and widely used version of the
> protocol; [Aave v4](/aave-v4) is the next evolution of the protocol
> architecture.

## Self-Custody

A defining characteristic of a decentralised liquidity protocol is its non-custodial design, which ensures users always retain control of their assets. All operations are handled by permissionless smart contracts that autonomously enforce the protocol's rules.

- **User Control:** Direct interaction using a self-custodial wallet without intermediaries.
- **Transparency:** All rules, like collateral requirements and interest rates, are embedded in open-source smart contracts.
- **Trustless Execution:** Operations are executed automatically without relying on a central party.

## How Aave Works

### Collateral

In decentralised finance, lending is secured by **collateral**, the digital assets a borrower locks in the protocol to secure a loan. Unlike traditional finance, which relies on credit scores, DeFi uses **over-collateralization**. This requires borrowers to supply assets of greater value than the amount they wish to borrow.

This model is essential for a trustless system. It protects suppliers' funds and maintains protocol solvency by ensuring there are always sufficient funds to cover the debt, even if the value of the collateral decreases.

### Lending and Borrowing

The Aave protocol functions as a two-sided market. Users can participate as lenders (suppliers), borrowers, or both.

| Role          | Action                                  | Outcome                                                |
| ------------- | --------------------------------------- | ------------------------------------------------------ |
| **Lenders**   | Supply assets to shared liquidity.      | Earn passive interest.                                 |
| **Borrowers** | Lock collateral to borrow other assets. | Access borrowing capacity against supplied collateral. |

### Interest Rates

Interest rates adjust based on how much liquidity is in use (utilization). Aave uses a utilization curve with a “kink” at a target level: below the target, borrow rates increase gradually; above it, they increase more sharply to protect liquidity. Supplier rates are funded by borrower interest and also rise as utilization increases.

### Liquidations

Liquidations keep the protocol solvent by correcting risky positions. When a position becomes unhealthy, a liquidator can repay a portion of the debt and receive collateral with a liquidation bonus. This reduces the user's debt and improves the position's health; if needed, additional liquidations can occur until the position is safe again.

## Decentralised Governance

The protocol is governed by AAVE token holders through a decentralised governance framework. This community-driven model allows participants to propose, vote on, and enact changes that shape the protocol's evolution, such as adjusting risk parameters or introducing new assets and features. Governance ensures that the protocol remains adaptable and aligned with the needs of its users without centralised oversight.

## Ecosystem and Extensions

Beyond its core liquidity markets, Aave includes complementary features and extensions:

- Streamlined actions such as token swaps (coming soon)
- Native components like the [GHO stablecoin](ecosystem/gho)

Together, these components reflect the broader potential of decentralised finance (DeFi) to deliver open, transparent, and accessible financial infrastructure to anyone connected to a blockchain network.

## Next Steps

- Explore [Aave v4](/aave-v4).
- Learn about [Aave v3](/aave-v3/overview).

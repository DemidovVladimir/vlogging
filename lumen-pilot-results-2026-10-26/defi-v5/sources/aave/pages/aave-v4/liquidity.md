# Liquidity Model

Learn how the liquidity model works in Aave v4.

---

The liquidity management in Aave v4 operates through the coordinated interaction of **Liquidity Hubs**, **Spokes**, and **Reserves**. Understanding how these components work together is essential for grasping how capital flows through the protocol and how new markets can access established liquidity pools.

## Liquidity Hubs

Liquidity Hubs are the central settlement layer of Aave v4. Each Hub aggregates liquidity, manages credit lines, enforces risk parameters, and operates under governance controls. This design allows new markets to tap into established pools without fragmenting liquidity.

Assets are held at the Liquidity Hub (LH), which governs how Spokes can access and utilize them. Governance defines liquidity caps, credit allocations, and risk parameters for each supported asset.

Different Hub types can be deployed for specific purposes — from conservative stablecoin liquidity to higher-yield, higher-risk configurations — each operating under its own governance model.

## Spokes

Spokes are specialized smart contracts that connect to Hubs. They define user-facing logic such as interest rate models, collateral requirements, and liquidation conditions while drawing on Hub liquidity. This keeps the complexity of user interactions isolated from the Hub layer.

Credit lines govern Spoke access to Hub assets, setting limits and conditions for borrowing. A Spoke may connect to multiple Hubs, giving it flexibility to tap different risk profiles or liquidity sources.

Crucially, risks are isolated at the Spoke level. Issues with a single Spoke do not spread to Hubs or other Spokes, allowing innovation without systemic compromise.

## Reserves

Reserves are managed at the Spoke level and represent the accounting units for specific assets within each Spoke. They track deposits, borrows, repayments, and interest accrual while enforcing supply caps and user-specific configurations.

Governance defines how much of the Hub’s underlying assets can be allocated to each Spoke reserve through credit lines, adjusting dynamically based on demand and risk conditions.

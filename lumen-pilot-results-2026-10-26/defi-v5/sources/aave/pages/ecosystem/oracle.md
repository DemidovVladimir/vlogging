# Oracle

Each [reserve](../aave-v3/concepts/reserve) within the Aave Protocol is associated with an oracle contract. These oracle contracts are responsible for reporting the market price of assets in the protocol, which is essential for determining collateralisation requirements.

The oracle for each reserve is selected through Aave Governance, establishing a decentralised model where the community decides which data sources are used. Once chosen, the oracle contract submits price feed updates based on its operational logic (time-based, deviation-based, etc.).

## Types of Oracles in Use

Currently, there are two primary types of oracle contracts utilised on production Aave markets:

1. **Chainlink Price Feeds**: Chainlink oracles provide highly reliable, decentralised price data for various assets. These price feeds pull data from multiple sources and aggregate them, minimising the risk of manipulation or outages.
2. **Correlated Assets Price Oracle (CAPO)**: CAPO is designed for assets that have a strong correlation with another asset's price. For example, wrapped tokens can use this oracle to mirror the price of their underlying assets. CAPO leverages specialised logic to adjust and submit prices that follow the movements of these correlated assets. See more details about its implementation on [GitHub](https://github.com/aave/aave-capo).

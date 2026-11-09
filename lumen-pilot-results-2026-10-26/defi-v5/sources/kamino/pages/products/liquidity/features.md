> ## Documentation Index
> Fetch the complete documentation index at: https://kamino.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Features

> How Kamino automates concentrated liquidity management: auto-swap, auto-compound, and auto-rebalance

Kamino Liquidity Vaults automate the three main tasks that make [concentrated liquidity](https://kamino.com/docs/products/liquidity/concepts.md#concentrated-liquidity) management burdensome: single-token deposits and withdrawals (auto-swap), fee reinvestment (auto-compound), and range adjustment (auto-rebalance).

## Auto-Swap

Concentrated liquidity positions require assets in a specific ratio matching the pool's composition. When a user deposits a single token, Kamino automatically swaps the portion needed to create the correct ratio before deploying capital.

The same process applies on withdrawal — users can receive the full position value in a single token rather than being forced to handle both assets separately.

* No manual token management required for single-sided deposits or withdrawals
* Swap costs (slippage, DEX fees) apply — visible before confirmation
* Powered by Kamino Swap for best execution

## Auto-Compound

CLMM positions accumulate [trading fees](https://kamino.com/docs/products/liquidity/concepts.md#trading-fees) and reward tokens continuously. Manually harvesting and redepositing these would require frequent transactions and actively managed timing.

Kamino auto-compounds all earned fees and rewards back into the position at regular intervals. Compounding:

* Increases the total capital deployed in the vault
* Directly increases the [kToken](https://kamino.com/docs/products/liquidity/concepts.md#ktokens) exchange rate over time (more underlying assets per kToken)
* Eliminates the need for manual harvest transactions and their associated gas costs

## Auto-Rebalance

When the market price moves outside a vault's current range, the position earns no fees. Kamino monitors positions continuously and rebalances when the price exits the configured range — moving the position to a new range centered around the current price.

Rebalancing events:

* Trigger when price exits the vault's range
* Involve closing the current position and reopening at a new range
* May incur a small cost from slippage on the conversion between assets at the rebalance ratio
* Are executed by Kamino's automated bots — no user action required

> [!NOTE]
>
> The frequency and cost of rebalancing depends on price volatility and [range width](https://kamino.com/docs/products/liquidity/concepts.md#the-range-width-trade-off). Tighter ranges earn higher fees when in-range but rebalance more often; wider ranges rebalance less frequently at the cost of lower capital efficiency.


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.